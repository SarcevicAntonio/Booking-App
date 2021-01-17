<script>
  import { onMount } from "svelte/internal";
  import Modal from "../components/Modal.svelte";
  import {
    bncCouch,
    bookingsNeedContact,
    pbCouch,
    pendingBookings,
    tourAllowance,
    tourCouch,
    tourPouch,
  } from "../pouch";
  import CreateReservation from "./CreateReservation.svelte";
  import CreateTour from "./CreateTour.svelte";
  import Tour from "./Tour.svelte";
  import dayjs from 'dayjs';

  const numberOfAgents = 10;
  const allowedBooking = 1.1;

  /**
   * variables
   */

  let tours = { rows: [] };
  let syncState = "...";
  let tourModal;
  let reservationModal;
  let openReservationTourId;
  let reservationState = "start";
  let toContact = [];

  function getTimeString() {
    return dayjs().format('D.M.YY - HH:mm:ss');
  }

  /**
   * SyncPipeline
   */


  async function sync() {
    // syncState = "...";
    await tourPouch
      .sync(tourCouch)
      .on("complete", function (info) {
        console.log("tour sync info:", info);
        
        // syncState = "online";
        // TODO: clean up date string
        syncState = getTimeString();
      })
      .on("error", function (err) {
        console.log(err);
        // syncState = "offline";
      });
    // only push changes, dont pull.
    // we dont want other clients pending bookings in our pendingBookings db
    await pendingBookings.replicate
      .to(pbCouch)
      .on("complete", function (info) {
        console.log("pendingBookings sync info:", info);
        syncState = getTimeString();
      })
      .on("error", function (err) {
        console.log(err);
        // syncState = "offline";
      });
    await bookingsNeedContact
      .sync(bncCouch)
      .on("complete", function (info) {
        console.log("bookingsNeedContact sync info:", info);
        syncState = getTimeString();
      })
      .on("error", function (err) {
        console.log(err);
        // syncState = "offline";
      });
    syncPipeline();
  }

  async function syncPipeline() {
    await generateAllowance();
    await updateContactList();
    await updateTourList();
  }

  async function generateAllowance() {
    const allTours = await tourPouch.allDocs({ include_docs: true });
    await allTours.rows.forEach(async (tour) => {
      tour = tour.doc;
      let reservationsCount = 0;
      tour.reservations.forEach((res) => {
        reservationsCount += res.groupSize;
      });
      try {
        const allowanceHelper = await tourAllowance.get(tour._id);
        allowanceHelper.allowance =
          (tour.maxPassenger - reservationsCount) / numberOfAgents;
        allowanceHelper.bookedSinceLastSync = 0;
        await tourAllowance.put(allowanceHelper);
      } catch {
        let allowanceHelper = {
          _id: tour._id,
          allowance: (tour.maxPassenger - reservationsCount) / numberOfAgents,
          bookedSinceLastSync: 0,
        };
        await tourAllowance.put(allowanceHelper);
      }
    });
  }

  async function updateContactList() {
    toContact = [];
    const allToContact = await bookingsNeedContact.allDocs({
      include_docs: true,
    });
    let allPreviouslyPendings = await pendingBookings.allDocs({
      include_docs: true,
    });
    allPreviouslyPendings = allPreviouslyPendings.rows;
    const filteredToContact = allToContact.rows.filter((tc) => {
      return allPreviouslyPendings.findIndex((pb) => pb.id === tc.id) !== -1;
    });
    toContact = filteredToContact;
  }

  async function updateTourList() {
    tours = await tourPouch.allDocs({ include_docs: true });
    tours.rows.forEach(async (tour, i) => {
      const allowance = await tourAllowance.get(tour.doc._id);
      tours.rows[i].doc.offlineSeats = Math.floor(
        allowance.allowance * allowedBooking
      );
    });
  }

  /**
   * Functions
   */

  onMount(() => {
    sync();
  });

  function handleRemovePendingBooking(event) {
    bookingsNeedContact
      .get(event.target.id)
      .then((doc) => {
        bookingsNeedContact.remove(doc).then(() => {
          pendingBookings.get(event.target.id).then((doc) => {
            return pendingBookings.remove(doc);
          });
        });
      })
      .then(() => {
        updateContactList();
      });
  }

  function handleNewTour(event) {
    tourModal.close();
    let newTour = event.detail;
    newTour._id = getTimeString();
    tourPouch
      .put(newTour)
      .then(() => {
        updateTourList();
      })
      .catch((err) => {
        console.log(err);
      })
      .then(() => {
        let takenSeats = 0;
        newTour.reservations.forEach((reservation) => {
          takenSeats += reservation.groupSize;
        });
        let allowanceHelper = {
          _id: newTour._id,
          allowance: (newTour.maxPassenger - takenSeats) / numberOfAgents,
          bookedSinceLastSync: 0,
        };
        return tourAllowance.put(allowanceHelper);
      });
  }

  function handleDeleteTour(event) {
    tourPouch.get(event.detail._id).then((tour) => {
      tourPouch.remove(tour).then(() => {
        tourAllowance.get(tour._id).then((allowanceHelper) => {
          tourAllowance.remove(allowanceHelper);
        });
        updateTourList();
      });
    });
  }

  function handleStartReservation(event) {
    openReservationTourId = event.detail._id;
    reservationModal.open();
    reservationState = "start";
  }

  function handleNewReservation(event) {
    const res = event.detail;
    tourAllowance
      .get(openReservationTourId)
      .then((allowanceHelper) => {
        if (
          allowanceHelper.allowance * allowedBooking >=
          allowanceHelper.bookedSinceLastSync + res.groupSize
        ) {
          allowanceHelper.bookedSinceLastSync += res.groupSize;
          tourAllowance.put(allowanceHelper);
          tourPouch.get(openReservationTourId).then((tour) => {
            tour.reservations.push({
              firstName: res.firstName,
              lastName: res.lastName,
              groupSize: res.groupSize,
            });
            tourPouch.put(tour).then(() => {
              reservationState = "success";
              updateTourList();
            });
          });
        } else {
          reservationState = "pending";
          pendingBookings.put({
            _id: getTimeString(),
            tourId: openReservationTourId,
            firstName: res.firstName,
            lastName: res.lastName,
            phone: res.phone,
            groupSize: res.groupSize,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
</script>

{#if toContact.length > 0}
  <div class="section">
    <h2>🗺️ Previously pending bookings that need contact</h2>
    {#each toContact as item}
      <div class="item space-between">
        <p>
          ☎️ Please Contact
          {item.doc.firstName}
          {item.doc.lastName}
          under
          {item.doc.phone}:<br />
          {item.doc.status === 'successful' ? '✔️' : '❌'}
          The previously pending booking done for
          {item.doc.firstName}
          {item.doc.lastName}
          with
          {item.doc.groupSize}
          Members was
          {item.doc.status}.
        </p>
        <button on:click={handleRemovePendingBooking} id={item.doc._id}>
          👌 done
        </button>
      </div>
    {/each}
  </div>
{/if}

<div class="section">
  <div class="space-between">
    <h2>🗺️ Tour Management</h2>
    <button on:click={sync}>🔄 sync now! (last: {syncState})</button>
  </div>

<!-- Tour List Filter -->

  <div class="tour-list">
    {#each tours.rows as tour (tour)}
      <Tour
        tour={tour.doc}
        on:startRervation={handleStartReservation}
        on:deleteTour={handleDeleteTour} />
    {/each}
  </div>

  <button
    class="wide-btn"
    on:click={() => {
      tourModal.open();
    }}>
    ✏️ add new tour
  </button>
</div>

<Modal title={'✏️ New Tour'} bind:modal={tourModal}>
  <CreateTour on:newTour={handleNewTour} />
</Modal>

<Modal title={'✏️ New Reservation'} bind:modal={reservationModal}>
  {#if reservationState === 'start'}
    <CreateReservation on:newReservation={handleNewReservation} />
  {:else if reservationState === 'success'}
    <div class="item">
      <h4 class="center">✔️ Reservation successfully created.</h4>
    </div>
  {:else if reservationState === 'pending'}
    <div class="item">
      <h4 class="center">⌛ Reservation pending. Will be evaluated tonight.</h4>
    </div>
  {:else}broke{/if}
  {#if reservationState !== 'start'}
    <button
      class="wide-btn"
      on:click={() => {
        reservationModal.close();
      }}>👌 okay</button>
  {/if}
</Modal>

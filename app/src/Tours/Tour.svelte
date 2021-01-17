<script>
  import marked from "marked";
  import printJS from "print-js";
  import { createEventDispatcher, onMount } from "svelte";
import Confirm from "../components/Confirm.svelte";

  export let tour;
  export let takenSeats = 0;
  let showRes = false;
  const dispatch = createEventDispatcher();
  function startRervation() {
    dispatch("startRervation", tour);
  }

  function deleteTour() {
    if (
      confirm(
        "Are you REALLY sure you want to delete the tour " +
          tour.name +
          "? \nThis can not be undone!"
      )
    ) {
      dispatch("deleteTour", tour);
    }
  }

  onMount(() => {
    takenSeats = 0;
    tour.reservations.forEach((reservation) => {
      takenSeats += reservation.groupSize;
    });
  });
</script>

<style>
  button {
    background-color: var(--highlight);
    color: var(--black);
  }
  .reservation {
    margin-top: 8px;
  }
</style>

<div class="item">
  <div>
    📍 '{tour.name}':
    {takenSeats}/{tour.maxPassenger}
    seats taken ({tour.offlineSeats}
    offline reservations allowed)
  </div>
  {#if tour.description}
    <div class="divider" />
    <p>
      {@html marked(tour.description)}
    </p>
  {/if}
  <div class="divider" />
  <div class="space-between">
    <div>
      {#if tour.reservations.length === 0}
        <button disabled> 🚷 no reservations yet </button>
      {:else if showRes}
        <button
          class="res-toggle"
          on:click={() => {
            showRes = false;
          }}>
          😎 hide reservations
        </button>
      {:else}
        <button
          class="res-toggle"
          on:click={() => {
            showRes = true;
          }}>
          👀 show reservations
        </button>
      {/if}
      <button on:click={startRervation}>✏️ new reservation</button>
    </div>
    <div>
      <button
        type="button"
        on:click={() => {
          printJS({
            header: `<h3>📍 '${tour.name}': ${takenSeats}/${tour.maxPassenger} seats taken</h3>`,
            printable: tour.reservations,
            type: 'json',
            properties: [
              { field: 'firstName', displayName: '🏷️ First name' },
              { field: 'lastName', displayName: '🏷️ Last name' },
              { field: 'groupSize', displayName: '#️⃣ Group members' },
            ],
          });
        }}>
        🖨️ print
      </button>
      <Confirm label={"🗑️ delete"} on:confirm={deleteTour}>
        <div class="item">
          Are you sure you want to delete the tour "{tour.name}"? <br> This can not be undone!
        </div>
      </Confirm>      
    </div>
  </div>
  {#if showRes}
    {#each tour.reservations as reservation}
      <div class="reservation">
        {reservation.groupSize > 1 ? '👪' : '💁'}
        {reservation.firstName}
        {reservation.lastName}
        ({reservation.groupSize}
        seats)
      </div>
    {/each}
  {/if}
</div>

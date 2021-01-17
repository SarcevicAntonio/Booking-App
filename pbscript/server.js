async function syncLocalRemote(local, remote) {
  await local.sync(remote);
  // DEBUG
    // .on('complete', function (info) {
    //   console.log('Sync Info:', info);
    // }).on('error', function (err) {
    //   console.log('Sync Error:', err);
    // });
}

async function main() {
  /**
 * CONSTANTS
 */

  const allowedBooking = 1.10;


  console.log('## Now running Pending Booking Script ##')

  console.log('Setting up Databases')
  const PouchDB = require('pouchdb');

  var tourPouch = new PouchDB('tours');
  var hostname0 = 'couch';
  var tourCouch = new PouchDB('http://' + hostname0 + ':5984/tours');
  var pendingBookings = new PouchDB('pendingBookings');
  var pbCouch = new PouchDB('http://' + hostname0 + ':5984/pending_bookings');
  var bookingsNeedContact = new PouchDB('bookingsNeedContact');
  var bncCouch = new PouchDB('http://' + hostname0 + ':5984/bookings_need_contact');

  // initially sync all databases
  await syncLocalRemote(tourPouch, tourCouch);
  await syncLocalRemote(pendingBookings, pbCouch);
  await syncLocalRemote(bookingsNeedContact, bncCouch);

  console.log('Processing Pending Bookings')
  // Pending Booking Logic
  const allPending = await pendingBookings.allDocs({ include_docs: true })
  const pendingCheck = allPending.rows.map(async pending => {
    pending = pending.doc;
    console.log(pending.tourId);
    try {
      const tour = await tourPouch.get(pending.tourId);

    let reservationsCount = 0;
    tour.reservations.forEach(res => {
      reservationsCount += res.groupSize;
    });
    // - Wenn: (#Plätze * 1,10) ≥ #Buchungen + #Gruppenmitglieder
    console.log('** Checking Pending Booking ' + pending._id)
    if ((tour.maxPassenger * allowedBooking) >= (reservationsCount + pending.groupSize)) {
      // for (let index = 0; index < pending.groupSize; index++) {
      tour.reservations.push(
        {
          firstName: pending.firstName,
          lastName: pending.lastName,
          groupSize: pending.groupSize
        }
      );
      reservationsCount += pending.groupSize;
      // }
      // → Buchung geht durch
      await tourPouch.put(tour);
      console.log(' * Booking for ' + tour._id + ' successful!\n * Current seats: ' + reservationsCount + ' / ' + tour.maxPassenger)
      // - Bestätigung an Gruppenleiter
      await bookingsNeedContact.put({
        _id: pending._id,
        firstName: pending.firstName,
        lastName: pending.lastName,
        phone: pending.phone,
        groupSize: pending.groupSize,
        status: 'successful'
      });
      await pendingBookings.remove(pending);
      console.log(' * Contact Notice added. Pending Booking removed.')
    } else {
      // - Sonst: Gruppe absagen und alternative Tour oder exklusiv Tour für die Gruppe anbieten
      console.log(' * Booking for' + tour._id + ' declined!\n * Seats would have been: ' + (reservationsCount + pending.groupSize) + ' / ' + tour.maxPassenger)
      await bookingsNeedContact.put({
        _id: pending._id,
        firstName: pending.firstName,
        lastName: pending.lastName,
        phone: pending.phone,
        groupSize: pending.groupSize,
        status: 'declined'
      });
      await pendingBookings.remove(pending);
      console.log(' * Contact Notice added. Pending Booking removed.')
    }
  } catch (error) {
    console.log('... sorry, something went wrong. maybe the tour is missing?')
    console.log('* removing pending booking')
      await pendingBookings.remove(pending);
  }
  });
  await Promise.all(pendingCheck);
  console.log('Finished Processing')

  console.log('Syncing to remote CouchDB')

  // finish by syncing all databases again
  await syncLocalRemote(tourPouch, tourCouch);
  await syncLocalRemote(pendingBookings, pbCouch);
  await syncLocalRemote(bookingsNeedContact, bncCouch);

  console.log('## Finished running Pending Booking Script ##')
}



// run script
main();

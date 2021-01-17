/**
 * CONSTANTS
 */

const numberOfAgents = 10;
const allowedBooking = 1.10;


/**
 * DATABASE SETUP
 */

// tours, local and remote, get synced
var tourPouch = new PouchDB('tours');
var hostname0 = window.location.hostname
var tourCouch = new PouchDB('http://' + hostname0 + ':5984/tours', {skip_setup: true});

// helpers
var tourAllowance = new PouchDB('tourAllowance');
var pendingBookings = new PouchDB('pendingBookings');
var pbCouch = new PouchDB('http://' + hostname0 + ':5984/pending_bookings');
var bookingsNeedContact = new PouchDB('bookingsNeedContact');
var bncCouch = new PouchDB('http://' + hostname0 + ':5984/bookings_need_contact');

// helper var
var openReservationTourId = 0;

/**
 * TOUR MANAGEMENT
 */

// Live Update Tour Icon
$('#tour-icon').change(event => {
  event.preventDefault();
  $('.tour-display-icon').text(event.target.value);
});

// Create Tour Button
$('body').on('click', '#submit-tour', () => {
  const icon = $('#tour-icon').val();
  const name = $('#tour-name').val();
  const maxPassenger = $('#tour-passenger').val();
  if (name && maxPassenger) {
    // reset form
    $('#tour-form-error').hide();
    $('#tour-icon').val('tour');
    $('#tour-name').val('');
    $('#tour-passenger').val('100');
    M.updateTextFields();
    // create tour object
    const tour = {
      _id: new Date().toISOString(),
      icon: icon,
      name: name,
      maxPassenger: maxPassenger,
      reservations: [],
      reservationsCount: 0
    }
    // put tour object in local pouch
    tourPouch.put(tour).then(() => {
      updateTourList();
    }).catch(err => {
      console.log(err);
    }).then(() => {
      var allowanceHelper = {
        _id: tour._id,
        allowance: (tour.maxPassenger - tour.reservationsCount) / numberOfAgents,
        bookedSinceLastSync: 0,
      }
      return tourAllowance.put(allowanceHelper)
    });
  } else {
    // show form error
    $('#tour-form-error').show();
  }
});

// Delete Tour Button
$('body').on('click', '.delete-tour', event => {
  // get tour from pouch
  tourPouch.get(event.target.id).then(tour => {
    if (confirm('Are you sure you want to delete the tour "' + tour.name + '"? \nThis can not be undone!')) {
      // delete from pouch
      tourPouch.remove(tour).then(() => {
        // delete coresponding allowanceHelper
        tourAllowance.get(tour._id).then(allowanceHelper => {
          tourAllowance.remove(allowanceHelper);
        });
        // update Tour List
        updateTourList();
      });
    }
  });
});

/**
 * ON-BOOKING FUNCTIONS
 */

// prepare booking
$('body').on('click', '.open-booking', event => {
  openReservationTourId = event.target.id;
  $('#res-form-error').hide();
  $('#res-form-succ').hide();
  $('#res-form-held').hide();
  $('#res-form').show();
  $('#submit-reservation').show();
})

// booking button
$('body').on('click', '#submit-reservation', () => {
  const firstName = $('#res-first-name').val();
  const lastName = $('#res-last-name').val();
  const phone = $('#res-phone').val();
  const email = $('#res-email').val();
  const groupSize = parseInt($('#res-group-size').val());
  if (firstName && lastName && (phone || email) && groupSize) { // check if required fields are there
    // hide form error
    $('#res-form-error').hide();
    tourAllowance.get(openReservationTourId).then(allowanceHelper => {
      // Bei Buchung:
      // - Wenn: (allowance * 1,10) ≥ buchungenSinceLastSync + #Gruppenmitglieder
      if ((allowanceHelper.allowance * allowedBooking) >= (allowanceHelper.bookedSinceLastSync + groupSize)) {
        // - buchungenSinceLastSync += #Gruppenmitglieder
        allowanceHelper.bookedSinceLastSync += groupSize;
        tourAllowance.put(allowanceHelper);
        // →   Buchung geht durch
        tourPouch.get(openReservationTourId).then(tour => {
          // for (let index = 0; index < groupSize; index++) {
          tour.reservations.push(
            {
              firstName: firstName,
              lastName: lastName,
              groupSize: groupSize,
            }
          );
          // }
          tour.reservationsCount += groupSize; // TODO: dont store, show dynamically
          tourPouch.put(tour).then(() => {
            $('#submit-reservation').hide();
            $('#res-form').hide();
            $('#res-form-succ').show();
            updateTourList();
          });
        });
      } else {
        $('#submit-reservation').hide();
        $('#res-form').hide();
        $('#res-form-held').show();
        // - Sonst: Buchung wird bis zum Sync zurückgehalten
        pendingBookings.put({
          _id: new Date().toISOString(),
          tourId: openReservationTourId,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          email: email,
          groupSize: groupSize,
        })
        // - Nach dem Sync bekommt Gruppenleiter eine Bestätigung / Absage (Kontaktdaten vom Gruppenleiter müssen Aufgenommen werden)
      }
    }).catch(err => {
      console.log(err)
    });
  } else {
    // show form error
    $('#res-form-error').show();
  }
});


// Delete from to Contact List!
$('body').on('click', '.delete-to-contact', event => {
  bookingsNeedContact.get(event.target.id).then(doc => {
    // TODO: need to delete remote boockings need contact
    // and local pendings.
    bookingsNeedContact.remove(doc).then(() => {
      pendingBookings.get(event.target.id).then(doc => {
        return pendingBookings.remove(doc);
      });
    });
  }).then(() => {
    updateContactList();
  });
});

/**
 * SYNC TOURS FUNCTIONS
 */

// Sync Button
$('body').on('click', '#sync', () => {
  // fire sync function when clicking sync button
  sync();
});

// Sync Function
async function sync() {
  // show sync indicator (purple button)
  $('#sync').addClass('sync');
  // sync tourPouch with Couch
  await tourPouch.sync(tourCouch)
    .on('complete', function (info) {
      console.log('tour sync info:', info)
      $('#sync').removeClass('offline');
    }).on('error', function (err) {
      console.log(err);
      $('#sync').removeClass('sync');
      $('#sync').addClass('offline');
    });

  // only push changes, dont pull. 
  // we dont want other clients pending bookings in our pendingBookings db
  await pendingBookings.replicate.to(pbCouch)
    .on('complete', function (info) {
      console.log('pendingBookings sync info:', info)
      $('#sync').removeClass('offline');
    }).on('error', function (err) {
      console.log(err);
      $('#sync').removeClass('sync');
      $('#sync').addClass('offline');
    });

  await bookingsNeedContact.sync(bncCouch)
    .on('complete', function (info) {
      console.log('bookingsNeedContact sync info:', info)
      $('#sync').removeClass('offline');
    }).on('error', function (err) {
      console.log(err);
      $('#sync').removeClass('sync');
      $('#sync').addClass('offline');
    });

  syncPipeline();
}

/**
 * ON-SYNC FUNCTIONS
 */

// starter function
async function syncPipeline() {
  await generateAllowance();
  // await confirmPendingBookings();
  // the server-side script does this now
  await updateContactList();
  await updateTourList();
}

// Allowance generierne
async function generateAllowance() {
  const allTours = await tourPouch.allDocs({ include_docs: true });
  await allTours.rows.forEach(async tour => {
    tour = tour.doc;
    try {
      // if allowance found update allowance
      const allowanceHelper = await tourAllowance.get(tour._id)
      allowanceHelper.allowance = (tour.maxPassenger - tour.reservationsCount) / numberOfAgents;
      allowanceHelper.bookedSinceLastSync = 0;
      await tourAllowance.put(allowanceHelper);
    } catch {
      // if allowancehelper isnt found create one
      var allowanceHelper = {
        _id: tour._id,
        allowance: (tour.maxPassenger - tour.reservationsCount) / numberOfAgents,
        bookedSinceLastSync: 0,
      }
      await tourAllowance.put(allowanceHelper)
    }
  });
}

// Read Needed Contact List
// client then grabs remote bookingsNeedContact and shows if id is in local pendings
async function updateContactList() {
  $('#contact-container').empty()
  const allToContact = await bookingsNeedContact.allDocs({ include_docs: true })
  var allPreviouslyPendings = await pendingBookings.allDocs({ include_docs: true })
  allPreviouslyPendings = allPreviouslyPendings.rows;
  const filteredToContact = allToContact.rows.filter((tc) => {
    return allPreviouslyPendings.findIndex((pb) => pb.id === tc.id ) !== -1
  });
  if (filteredToContact.length > 0) {
    $('#contact-container').show()
    $('#contact-container').append(`<li class="collection-header"><b>Previously pending bookings that need contact</b></li>`)
    filteredToContact.forEach(toContact => {
      toContact = toContact.doc;
      var preferedContact = toContact.email;
      if (toContact.phone) {
        preferedContact = toContact.phone
      }
      const contactEntry = `
<li class="collection-item">
<p>The previously pending booking done for '${toContact.firstName} ${toContact.lastName}' with ${toContact.groupSize} Members was <span class="${toContact.status}">${toContact.status}</span>.<br>
Please Contact '${toContact.firstName} ${toContact.lastName}' under '${preferedContact}'.<p>
<a class="waves-effect waves-light btn green delete-to-contact btn-flat white-text" id="${toContact._id}">
  <i class="material-icons left" id="${toContact._id}">done</i> Done
</a>
</li>
        `
      $('#contact-container').append(contactEntry)
    })
  } else {
    $('#contact-container').hide()
  }
}

// Read Tour List
async function updateTourList() {
  // clear tour list
  $('#tour-list-body').empty()
  // fetch all tours
  const allTours = await tourPouch.allDocs({ include_docs: true });
  // show empty state
  $('#tour-list-body').append(
    `
<li>
<div class="collapsible-header"><i class="material-icons">error</i>No Tours</div>
<div class="collapsible-body"><span>Create a new Tour below.</span></div>
</li>`
  )
  // clear tour list if there are tours
  if (allTours.rows.length > 0) {
    $('#tour-list-body').empty()
  }
  // create collapsible for every row
  allTours.rows.forEach(tour => {
    tour = tour.doc;
    var resCollection = `
<ul class="collapsible z-depth-0">
  <li>
    <div class="collapsible-header"><i class="material-icons">person</i>Reservation List</div>
    <div class="collapsible-body inner-collapsible">
      <ul class="collection">
    `;
    tour.reservations.forEach(res => {
      resCollection += `
          <li class="collection-item blue-grey lighten-5">${res.firstName} ${res.lastName} (${res.groupSize} Members)</li>
        `;
    });
    resCollection += `
      </ul>
    </div>
  </li>
</ul>
  `;
    tourAllowance.get(tour._id).then(allowanceHelper => {
      // create collapsible per tour
      const tourCollapsible = `
<li>
  <div class="collapsible-header">
    <i class="material-icons">${tour.icon}</i>
    ${tour.name}
    <span class="tour-header-detail">${tour.reservationsCount}/${tour.maxPassenger}</span>
  </div>
  <div class="collapsible-body">
    <div class="row">
    Available offline Bookings: ~ ${Math.floor(allowanceHelper.allowance * allowedBooking) - allowanceHelper.bookedSinceLastSync}
    </div>
    <div class="row">
      <a class="waves-effect waves-light btn col s12 m8 green modal-trigger open-booking btn-flat white-text" href="#bookingModal" id="${tour._id}">
        <i class="material-icons left" id="${tour._id}">people</i>Add reservation
      </a>
      <a class="waves-effect waves-light btn col s12 m3 red delete-tour btn-flat white-text right" id="${tour._id}">
        <i class="material-icons left" id="${tour._id}">delete_forever</i> Delete Tour
      </a>
    </div>
    <div class="row no-marge">
      ${resCollection}
    </div>
  </div>
</li>`;
      // append collapsible
      $('#tour-list-body').append(tourCollapsible);
      var elems = document.querySelectorAll('.collapsible');
      M.Collapsible.init(elems);
    });
  });
  // remove sync indicator
  $('#sync').removeClass('sync');
}

/**
 * Initialiation Code
 */

// initalize Materialize
M.AutoInit();

// initially hide *-form-error
$('#tour-form-error').hide();
$('#res-form-error').hide();
$('#contact-container').hide()

// run initial db sync and update
sync();


// AUTH LOGIC

function checkLoginState() {
  tourCouch.getSession(function (err, response) {
    if (response.userCtx.name) {
      $('#sync').show();
      $('#logged-in').show();
      $('#logged-out').hide();
      $('#auth-open').html('<i class="material-icons left">person</i>' + response.userCtx.name);
      $('#login-modal-content').html(`
      <h4>Hello, ${response.userCtx.name}! 👋</h4>
      <div class="row no-marge">
        <a class="waves-effect waves-light btn col s12 red btn-flat white-text" id="auth-logout">
          <i class="material-icons left">disabled_by_default</i>Logout
        </a>
      </div>
      `);
    } else {
      $('#sync').hide();
      $('#logged-out').show();
      $('#logged-in').hide();
      $('#auth-open').html('<i class="material-icons left">person</i> Login / Sign Up');
      $('#login-modal-content').html(`
      <h4>Please enter credentials</h4>
      <div class="row red-text center" id="auth-form-error">Some fields are empty or wrong!</div>
      <div class="input-field col s12">
        <input id="user-name" type="text" class="validate">
        <label for="user-name">Username</label>
      </div>
      <div class="input-field col s12">
        <input id="user-pwd" type="text" class="validate">
        <label for="user-pwd">Password</label>
      </div>
      <p class="col s12">
        <label>
          <input type="checkbox" class="filled-in" id="auth-checkbox"/>
          <span>Create new user (instead of logging in existing)</span>
        </label>
      </p>
      <div class="row no-marge">
        <a class="waves-effect waves-light btn col s12 green btn-flat white-text" id="submit-auth">
          <i class="material-icons left">login</i>Authenticate
        </a>
      </div>
      `);
      $('#auth-form-error').hide();
    }
  });
}

// Login Button
$('body').on('click', '#submit-auth', () => {
  const username = $('#user-name').val();
  const pwd = $('#user-pwd').val();
  const checkbox = $('#auth-checkbox').is(':checked');
  if (username && pwd) {
      // reset form
      $('#auth-form-error').hide();
      $('#user-name').val('');
      $('#user-pwd').val('');
      M.updateTextFields();
      if (checkbox) { // signup
        tourCouch.signUp(username, pwd, (err, response) => {
          console.log(response);
          if (err) {
            if (err.name === 'conflict') {
              alert(username + ' already exists, choose another username.');
            } else if (err.name === 'forbidden') {
              alert('invalid username');
            } else {
              console.log(err);
            }
          }
        });
      } else { // login
        tourCouch.logIn(username, pwd, (err, response) => {
          checkLoginState();
        });
      }
    console.log(checkbox);
  } else {
    $('#auth-form-error').show();
  }
});

// Logout Button
$('body').on('click', '#auth-logout', async () => {
  await tourCouch.logOut();
  checkLoginState();
});

checkLoginState();

// initially hide *-form-error
$('#auth-form-error').hide();
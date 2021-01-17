import PouchDB from 'pouchdb-browser';
import Auth from 'pouchdb-auth';
PouchDB.plugin(Auth)

let HOSTNAME = window.location.hostname;
export let authCouch = new PouchDB('http://' + HOSTNAME + ':5984/_users');
export let tourPouch = new PouchDB('tours');
export let tourCouch = new PouchDB('http://' + HOSTNAME + ':5984/tours');
export let tourAllowance = new PouchDB('tourAllowance');
export let pendingBookings = new PouchDB('pendingBookings');
export let pbCouch = new PouchDB('http://' + HOSTNAME + ':5984/pending_bookings');
export let bookingsNeedContact = new PouchDB('bookingsNeedContact');
export let bncCouch = new PouchDB(
  'http://' + HOSTNAME + ':5984/bookings_need_contact'
);

// export const vdb = readable(initialValue, () => {
//   console.log('got a subscriber');
//   return () => console.log('no more subscribers');
// });
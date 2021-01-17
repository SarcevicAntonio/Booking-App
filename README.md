# Booking App

This app was written for an assignment in a distributed database course.

We had the assignment to create an app with the following loose requirements:
* Booking App to be internally used by Sales Agents to register new reservations
* multiple travel tours / boats with different capacities
* multiple sales agents working offline
* sync everybody together at some point

The issue is, that you don't want too much overbooking. So we create an allowance for every sales agent at sync. 
Our solution implemented Couch DB with a WebApp based frontend plus a server side script for pending bookings that were above the allowance.

The web app was originally written using just jQuery and PouchDB. I later rewrote it in Svelte because i wanted to learn it. It's excellent. I've also added more features since the new codebase is much better to work in.

## Getting Started
* Clone Repo
* Install Docker
* ~~Type `docker-compose build` in cli from repo root~~
* Type `docker-compose up` in cli from repo root
* PBT client available under http://localhost:8000/
* Remote CouchDB Fauxton (GUI) avaiable under http://localhost:5984/_utils/
* Run PendingBooking Script mit "docker-compose run --rm pbscript node server.js"

## Example Workflow
* Login is just admin admin
* Add new Tour
* Add new booking that is above allowance
* Press Sync Button
* Run Server Script
* Press Sync Button
* To Contact notice should appear

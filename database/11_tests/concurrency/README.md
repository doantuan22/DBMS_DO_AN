# Concurrency tests

These focused JavaScript tests are separate from `npm run db:test`. They can commit
fixtures and must target a disposable `CinemaBookingDB_R0_*` database. Never point
them at the main `CinemaBookingDB`.

Run a selected test from the repository root, for example:

```powershell
node database/11_tests/concurrency/room-delete-vs-showtime.mjs --database=CinemaBookingDB_R0_<disposable>
node database/11_tests/concurrency/showtime-overlap.mjs --database=CinemaBookingDB_R0_<disposable>
node database/11_tests/concurrency/booking-parent-status.mjs --database=CinemaBookingDB_R0_<disposable>
node database/11_tests/concurrency/movie-actor-replacement.mjs --database=CinemaBookingDB_R0_<disposable>
node database/11_tests/concurrency/historical-metadata.mjs --database=CinemaBookingDB_R0_<disposable>
node database/11_tests/concurrency/complaint-processing.mjs --database=CinemaBookingDB_R0_<disposable>
```

Shared helpers live in `scripts/db/concurrency-support/`. Results go under
`.audit-output/concurrency/`. Run one fixture suite at a time, review its cleanup
result, then reset or drop the disposable database. The old phase-specific runners
and their archived raw evidence were removed during repository cleanup.

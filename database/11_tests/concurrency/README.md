# Concurrency tests — retired scripts and their replacements

The ten standalone scripts that used to live here were **formally retired on 2026-10-14**:

* seven of them (`booking-parent-status`, `complaint-processing`, `historical-metadata`,
  `movie-actor-replacement`, `promotion-atomicity`, `room-delete-vs-showtime`, `showtime-overlap`)
  imported `scripts/db/concurrency-support/*`, which was removed in the repository cleanup, so they
  failed with `ERR_MODULE_NOT_FOUND`, and they only accepted `CinemaBookingDB_R0_*` targets;
* three (`booking-stress`, `cinema-image-lock-stress`, `pricing-overlap-stress`) still ran but needed
  manual environment set-up, left year-2100 data behind and were not part of any automated run.

The maintained replacement is **`npm run audit:lifecycle`** (`scripts/audit/lifecycle.mjs`). It runs
against `CinemaBookingDB_Test` only (the exact name is checked before every case), uses genuinely
parallel HTTP requests (each one an independent SQL session through the API pool) and re-checks the
database invariants afterwards.

| Retired script | Replacement case(s) | What the new case asserts |
|---|---|---|
| `booking-stress` (A: one seat) | `LC-CONC-01` | exactly one 201, rest 409, one live ticket |
| `booking-stress` (B: overlapping seat sets) | `LC-CONC-02` | no seat sold twice, no 5xx |
| `booking-stress` (C: hold limit) | `LC-CONC-03` | exactly `fn_GioiHanDonDangGiu()` orders succeed |
| `showtime-overlap` | `LC-CONC-05` | exactly one overlapping showtime accepted, 0 overlaps in SQL |
| `pricing-overlap-stress` | `LC-CONC-07` | exactly one rule accepted, rest `PRICING_OVERLAP` |
| `promotion-atomicity` | `LC-CONC-06`, `LC-EXP-02`, `LC-CMP-02` | usage never above quantity; use released on expiry/cancel |
| `booking-parent-status` | `LC-CONC-08`, `LC-CONC-13` | booking vs cancel, booking vs price change keep parent state consistent |
| `cinema-image-lock-stress` | `LC-CONC-09` | at most one cover and it is active |
| `complaint-processing` | `LC-CONC-10` | one log row per accepted entry; status equals the latest entry |
| `movie-actor-replacement` | `LC-CONC-11` | final cast equals exactly one submitted list |
| `room-delete-vs-showtime` | `LC-CONC-12` | no orphan showtime; history deactivates instead of deleting |
| `historical-metadata` | `LC-CONC-13`, API `MGR-05` | showtime with orders keeps its price; `SHOWTIME_HAS_ORDERS` |

**Not reproduced:** the retired SQL-session scripts also recorded lock-wait evidence
(`sys.dm_exec_requests` / `sys.dm_tran_locks`) to prove *which* lock serialised the sessions. The new
runner proves the observable outcome (HTTP status + SQL state) but not the lock mechanics. If that
evidence is required again, restore the helpers from Git history
(`DBMS_DO_AN-bang/scripts/db/concurrency-support/`) against a disposable database.

The SQL regression suites under `../booking`, `../showtimes`, `../payment` … are unaffected.

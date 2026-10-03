# Cinema image lock stress test (manual, pre-release)

Checks migrations 010/011 under concurrency through the real API: `PUT` (hide/show) interleaved
with `PATCH .../cover` on three images of one cinema, then verifies that a cinema never has more
than one cover and that the cover is never a hidden image. It is **not** part of `npm test` or
`deploy.ps1 -RunTests`; run it by hand before a release, against a local/disposable database.

```powershell
$env:STRESS_ADMIN_PASSWORD = '<admin password>'          # never passed on the command line
node database/tests/stress/cinema-image-lock-stress.mjs --email=admin@example.com
```

Options (flag or environment variable): `--base-url` / `STRESS_BASE_URL` (default `http://localhost:4000/api`),
`--email` / `STRESS_ADMIN_EMAIL`, `--rounds` / `STRESS_ROUNDS` (3), `--requests` / `STRESS_REQUESTS` per round (400),
`--concurrency` / `STRESS_CONCURRENCY` requests in flight at once (10). Needs Node 20+, no packages.

Rules:
- It creates one cinema named `ZZ_STRESS_<timestamp>` with three images, and deletes them at the end,
  also after a failure or Ctrl+C. A start-up sweep removes `ZZ_STRESS_` leftovers of a crashed run.
- `200` is success. `409 CINEMA_IMAGE_INACTIVE` is valid (cover requested on a hidden image).
  Any other status (especially `500`, i.e. a deadlock) or an invariant violation fails the run.
- Exit code: `0` clean, `1` failure, `2` bad setup (arguments, login or fixtures).

# Pricing overlap stress test (`pricing-overlap-stress.mjs`)

Parallel identical pricing-rule creations on one cinema (migration 013): exactly one succeeds per round, the others are `409 PRICING_OVERLAP`,
no 5xx, and no pair of active rules with the same conditions and intersecting validity remains. Options: `--rounds` (12, max 60), `--parallel` (2).
Same environment variables and safety flag as the booking test below. It leaves a cinema `AUDIT_STRESS_PRICING_*` with pricing rows set to `Hết hạn`
(the API cannot delete them): disposable database only.

```powershell
$env:STRESS_CONFIRM_DISPOSABLE = 'yes'; $env:STRESS_ADMIN_PASSWORD = '<admin password>'
node database/tests/stress/pricing-overlap-stress.mjs --email=admin@example.com --base-url=http://localhost:4000/api
```

# Booking concurrency stress test (`booking-stress.mjs`)

Checks the seat locks and the per-customer holding-order limit through the real API:
A. 60 parallel bookings of one seat -> exactly one 201, the rest 409; B. 120 overlapping 3-seat bookings -> no seat sold twice;
C. parallel bursts per customer -> exactly 3 succeed (`ACTIVE_ORDER_LIMIT_REACHED` for the rest). Any 5xx fails the run.

```powershell
$env:STRESS_CONFIRM_DISPOSABLE = 'yes'
$env:STRESS_ADMIN_PASSWORD = '<admin password>'
node database/tests/stress/booking-stress.mjs --email=admin@example.com --base-url=http://localhost:4000/api
```

Options: `--customers` (8), `--seat-requests` (60), `--overlap-requests` (120), `--burst` (4, parallel bookings per customer in C),
`--room-id` (1, needs >= 20 seats), `--movie-id` (1); each also as `STRESS_*` environment variable. Exit code `0` clean, `1` failed, `2` bad setup.

**It leaves data behind that the API cannot delete** (customers `audit.stress.*@example.invalid` and one showtime in the year 2100+),
so it refuses to run without `STRESS_CONFIRM_DISPOSABLE=yes`. Run it only against a disposable database (e.g. the one built by
`deploy-isolated.ps1`). Deadlocks are not visible through the API; check the server log for `deadlock`/1205/1222 after the run.


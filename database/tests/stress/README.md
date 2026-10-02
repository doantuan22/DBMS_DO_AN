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

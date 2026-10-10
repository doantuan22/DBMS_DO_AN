# R7.2 targeted verification

Offline tooling only. Reuses the unchanged R6 Group C HTTP harness, R21 owned fixtures, R6 fingerprints/module parity and R5 target gates. All raw SQL stays in disposable setup/assertions; backend remains SP-only.

1. Choose an **absent** allowed `CinemaBookingDB_R0_*` target. Run `npm.cmd run db:test:preflight -- --database=<name>`, review actual server, absence and files; build through `db:test:build` with that exact `--confirm-target` token. Never reset an existing database for these tests.
2. Review the created database's GUID/files with preflight again. Supply its new confirmation token and the successful **build-test** `result.json`. The runner checks the current GUID matches that build; it also checks all transaction tables are empty before any fixture.
3. Run from repo root:

```powershell
node scripts/r7-2/run.mjs --suite=p1 --database=<name> --confirm-target=<reviewed-existing-token> --build-evidence=docs/evidence/r55/runs/<build-run>/result.json
node scripts/r7-2/run.mjs --suite=p2 --database=<name> --confirm-target=<reviewed-existing-token> --build-evidence=docs/evidence/r55/runs/<build-run>/result.json
node scripts/r7-2/checks.mjs
```

P1 contains 28 required scenarios for KH-13/QLR-07–09. P2 contains 17 scenarios for the approved CSKH-02/ADM-02 policy, including Admin complaint consumer compatibility. Branches/direct SQL assertions are counted separately from scenarios. Each scenario cleans its IDs, compares all 27 table/metadata fingerprints and checks session state. GET/negative operations compare before/after. Main is fingerprinted read-only before/after each suite.

Run suites **sequentially on the same target**: grant and fixture fingerprints cover all tables. Independent fresh targets may be used for separate invocations. On failure, inspect retained evidence and cleanup before rerunning; do not reset automatically.

`--suite=reproduce` records the pre-fix policy discrepancies; it intentionally expects the old HTTP behavior and records `contractMismatch`. It is historical tooling, unsuitable as a passing policy test after the fix. `--suite=apply` was used only on the task-owned pre-fix R5 build to apply the two approved canonical definitions and refresh manifest/verification expectations. A new post-fix R5 build independently verified all canonical sources. Neither mode touches the main database.

Every invocation allocates a new `docs/evidence/r7-2/runs/<UTC-time>-<random>/` directory. Full HTTP traces redact tokens/passwords/contact fields; evidence preserves raw SQL error numbers separately. Existing R6/R7.1 evidence is never rewritten. Tests use direct SQL fixture snapshots for controlled historical/monetary facts; HTTP calls exercise the real Express and SQL Server implementation, without mocks or browser tests.

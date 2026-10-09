# R6 Group C verification

Offline-only test tooling; scope R6.8–R6.10. Inspect before tests:

```powershell
node scripts/r6-group-c/inspect.mjs
node scripts/db/run.mjs preflight-test --database=CinemaBookingDB_R0_R6C_20261009_01
node scripts/r6-group-c/run.mjs --database=CinemaBookingDB_R0_R6C_20261009_01 --confirm-target=<reviewed-current-token>
node scripts/r6-group-c/report.mjs --run=<passing-full-run-id>
node scripts/r6-group-c/verify.mjs
```

Build an absent dedicated target using the existing R5.5 preflight/build flow first. The runner requires seed-only transaction tables, verified instance/GUID/files,159-module parity and exact token. It never resets any existing DB. Main, A and B targets are read only and fingerprinted before/after; old evidence and reports are hashed.

Runs R3.3 Complaint SQL/API, linked/unlinked flow and reference permission conjunction, owned Admin commands/reads/authorization, R3.1 Cast SQL/API, R4.3 Pricing and R4.2 Revenue. All HTTP uses real app/middleware/services/SQL. All68 Admin operations have positive and authorization-negative coverage. The63 general operations also test wrong-role/actor spoofing, live permission denial and target SP execution counts; Complaint uses the R3.3 and linked-flow authorization cases. Fixtures own dynamic IDs, remove them in FK order, and restore grant rows exactly with SQL temporary tables. No permanent source/module modification.

Each run gets a timestamp/UUID evidence directory; no prior evidence is rewritten. For independent fixture reproduction, `--only=admin` or another recipe name is available; such partial runs cannot produce acceptance. Report generation requires a complete passing run, validates all68 Admin operations, separates HTTP cases/SQL groups/request counts/documents, reuses A/B accepted evidence without stress rerun and creates exactly five final R6 reports plus the C report. Existing final reports/acceptance must not be overwritten.

Failure history: new-user creation initially reused the six-byte legacy seed password; current create contract correctly requires8–72 UTF-8 bytes. Fixture corrected to8 bytes, with an explicit independent six-byte negative reproduction. Failed attempt retained; production untouched.

Final report review requires both wrong-role and missing-permission evidence at every Admin endpoint and checks each JSON selector. Earlier generated drafts are archived with byte hashes under `report-drafts`; SQL/HTTP execution evidence is immutable. The final verifier reads reports, accepted A/B artifacts, current execution, operation links and archived draft hashes without running SQL or HTTP.

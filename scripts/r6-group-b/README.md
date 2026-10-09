# R6 Group B — real Backend / SQL Server verification

Offline tooling only. Scope: R6.4–R6.7. Replays accepted R1.1/R1.2/R3.2 tests without editing their source or previous evidence. Adds eight Manager scope scenarios and eight closed/completed showtime overlap cases.

Use a dedicated, source-built `CinemaBookingDB_R0_*` database with seed-only transaction tables. Never pass the main database. For an absent target, use the existing R5.5 `preflight-test` / `build-test` flow; an existing database is never rebuilt by this runner.

```powershell
node scripts/db/run.mjs preflight-test --database=CinemaBookingDB_R0_R6B_20261009_01
node scripts/r6-group-b/run.mjs --database=CinemaBookingDB_R0_R6B_20261009_01 --confirm-target=<current-preflight-token> --label=checkpoints
node scripts/r6-group-b/run.mjs --database=CinemaBookingDB_R0_R6B_20261009_01 --confirm-target=<current-preflight-token> --label=final
node scripts/r6-group-b/report.mjs --checkpoints=<passing-run-id> --final=<passing-final-run-id>
```

Each invocation creates an immutable timestamp/UUID run directory. Scripts run sequentially on one fixture target. Each accepted runner connects through a same-session server/GUID/file/name guard; fixture and assertions remain in the original scripts. Relative imports are resolved against their original source paths. The nested Update fault uses the exact R3.2 adaptation documented in `scripts/r32/r1-regression.mjs`; no production definitions are changed permanently.

`common.mjs` writes only within the new run directory and captures real HTTP inputs/responses/timestamps without tokens/passwords/contact fields. Every suite must restore all 27 table fingerprints and metadata, and pass 159-module source parity. Main DB is read only, fingerprints before/after must match. Previous evidence files are hashed and must stay unchanged.

Checkpoint order: B historical SQL/API/caller/races, C scope, D room-delete SQL/API/races, E showtime SQL/API/savepoints/status cases/26 gated races/125 stress races, F backend tests/no-SQL audit/integrity/preservation. Run the whole matrix again with `--label=final` before generating acceptance. The report generator refuses unsuccessful or incomplete runs; failed attempts stay available.

The DB connection settings are read from the existing backend configuration, never printed. All direct SQL and fault injection are restricted to this offline tooling. No mock DB, application mutex, FK disable, production migration or frontend change is involved.

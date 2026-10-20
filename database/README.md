# Database guide

## Database policy

- `CinemaBookingDB` is the only long-lived application database.
- `CinemaBookingDB_Test` is the exact isolated restore and write-test target. It must be removed after its tests only with separate explicit approval.
- Do not create Demo, DryRun, BackupDrill, or other long-lived database names.
- Main schema installation, legacy reset, and retired seed entry points are fail-closed. The current Main schema is not dropped or recreated.
- Current cleanup, seed, verification, and temporary Test status are documented in [DATABASE_CLEANUP_REPORT.md](../DATABASE_CLEANUP_REPORT.md).

## Current Main inventory

Main has 29 tables, 147 stored procedures, 6 views, 21 functions, and 9 enabled triggers. Its 37 foreign keys and 65 check constraints are enabled and trusted. Main has 1,130 operational seed rows plus 96 preserved RBAC rows. See [SEED_DATA_VERIFICATION_REPORT.md](../SEED_DATA_VERIFICATION_REPORT.md) for full table counts and business integrity results.

The production seed uses the preserved `ADMIN`, `QUAN_LY_RAP`, `CSKH`, and `KHACH_HANG` roles. All ordinary business writes go through the existing stored procedures. One guarded offline bootstrap Admin insert is documented in [REALISTIC_PRODUCTION_SEED_REPORT.md](../REALISTIC_PRODUCTION_SEED_REPORT.md); the Backend and Frontend have no direct-insert bootstrap path.

## Schema installation

`run-all.sql` creates a new `CinemaBookingDB` schema and runs schema/module verification only. It refuses to run when `CinemaBookingDB` already exists and does not load data.

Run from `database/` with SQLCMD only when intentionally installing a new empty Main database:

```powershell
cd D:\DBMS_DO_AN\database
sqlcmd -S localhost -E -C -b -i run-all.sql
```

## Seed execution and verification

The old `10_seed/seed-all.sql` and its historical fragments are retired and fail closed. Do not run `seed_base`, `seed_demo_dynamic`, or `seed_extended` manually.

The replacement seed and its one-time execution requirements are documented in [SEED_EXECUTION_GUIDE.md](../SEED_EXECUTION_GUIDE.md). It targets only Main, converts Asia/Ho_Chi_Minh showtime wall times to UTC, and aborts against a non-empty operational database. Local account credentials and machine logs stay under ignored `.audit-output/`.

Use `node scripts/seed/verify-seed.mjs` for read-only Main verification and `node scripts/seed/verify-login.mjs` for real Backend login checks. Original local vector artwork is listed in [SEED_IMAGE_MANIFEST.md](../SEED_IMAGE_MANIFEST.md); no external movie poster is hotlinked.

## Tests and temporary Test database

Unit, database, API, lifecycle, CSKH, and Playwright browser tests run with `npm.cmd run audit:all`. The audit runners assert `DB_NAME() = 'CinemaBookingDB_Test'` before any writes and use `backend/.env.test`; the normal Backend and seed configuration uses `backend/.env` and Main.

The last `audit:all` passed. Test remains online with 29 tables and 3,915 rows. The test login maps only to the exact Test database. Keep it until its exact final inventory is presented and the user separately confirms the drop; do not run `scripts/audit/phase5-drop-approved-test.mjs` early.

## Source layout

- `00_database/` — database creation and options; physical drop entry point is disabled.
- `01_schema/`, `02_tables/`, `03_constraints/`, `04_indexes/` — canonical schema.
- `05_functions/`, `06_views/`, `07_triggers/`, `08_procedures/`, `09_security/` — business and security modules.
- `10_seed/` — retired seed fragments, not part of schema installation.
- `11_tests/` — SQL regression tests; run only on the isolated Test target.
- `12_verify/` — schema, constraint, module, security, and data verification sources.
- `13_migrations/` — migration history; inspect target guards before deployment.

`baseline-manifest.json` is a historical generated artifact with stale database/object counts. It is not the live Main inventory and must not be used as the current row-count baseline.

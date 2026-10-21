# Database guide

## Database policy

- `CinemaBookingDB` is the only long-lived application database; the checked-in `backend/.env` targets its local development instance.
- `CinemaBookingDB_Test` is the exact isolated restore and write-test target. It must be removed after its tests only with separate explicit approval.
- Do not create Demo, DryRun, BackupDrill, or other long-lived database names.
- Main schema installation is guarded. The demo runner replaces recognized synthetic rows only; it never drops or recreates Main or its schema.
- Current cleanup, seed, verification, and temporary Test status are documented in [DATABASE_CLEANUP_REPORT.md](../DATABASE_CLEANUP_REPORT.md).

## Current Main inventory

Main has 29 application tables, 147 application stored procedures, 6 views, 21 application functions, 9 enabled triggers, 142 PK/UQ/FK/CHECK constraints, 42 default constraints, and 71 indexes. The database also has 11 SQL Server database-diagram support objects (`sysdiagrams`, its helper modules, and its keys); these are inventoried separately and excluded from the application baseline. See [SEED_DATA_VERIFICATION_REPORT.md](../SEED_DATA_VERIFICATION_REPORT.md) for current table counts and business integrity results.

The demo seed preserves the `ADMIN`, `QUAN_LY_RAP`, `CSKH`, and `KHACH_HANG` RBAC rows. Ordinary business creation goes through existing stored procedures; only guarded historical/ongoing schedule and transaction fixtures use parameterized T-SQL.

## Schema installation

`run-all.sql` creates a new `CinemaBookingDB` schema and runs schema/module verification only. It refuses to run when `CinemaBookingDB` already exists and does not load data.

Run from `database/` with SQLCMD only when intentionally installing a new empty Main database:

```powershell
cd D:\DBMS_DO_AN\database
sqlcmd -S localhost -E -C -b -i run-all.sql
```

## Seed execution and verification

Run `npm run seed:all` to regenerate local vector artwork, back up and replace the recognized synthetic Main dataset, perform read-only SQL verification, and smoke-test the actual API. The steps are also available as `npm run seed:demo`, `npm run seed:verify`, and `npm run seed:api`.

The seed refuses non-local/non-development targets, schema or RBAC drift, non-`example.test` accounts, and row-count drift from the previous manifest (or the known original synthetic snapshot on first replacement). It creates a COPY_ONLY backup and requires `RESTORE VERIFYONLY` to pass before the atomic reset. It does not change schema, procedures, constraints, or triggers. Credentials, verified backups, and machine-readable reports stay under ignored `.audit-output/`.

## Main audit and SSMS test suite

The Main audit results and complete live object inventory are in [MAIN_DATABASE_AUDIT_REPORT.md](14_audit/MAIN_DATABASE_AUDIT_REPORT.md). The SSMS-ready suite is in [15_ssms_test_suite/README.md](15_ssms_test_suite/README.md), with a 474-row object map, target precheck, DML demos with rollback, independent-session schedule race, index plans, and final integrity check. Every `.sql` file selects `CinemaBookingDB` and checks the expected Main server/database before testing.

The Main audit result is **DATABASE READY FOR SSMS DEMO**: 147/147 stored procedures, including 78/78 successful persistent-write paths, all 9 triggers, 142 integrity constraints, 21 functions, 6 views, and 71 indexes have runtime evidence. The test suite report distinguishes SSMS replay scripts from Node `mssql` runners; 28 procedures have direct SSMS calls, with 15 positive writer paths. The other 62 writer procedures and 57 read/validation procedures have runtime evidence but no standalone SSMS block. `sp_Booking_Create` has an SSMS rollback test; its success path is covered by Node. The suite inventories 42 DEFAULT constraints but does not claim a separate DML assertion for every default. `FULL SYSTEM E2E VERIFIED` is not claimed.

## Tests and temporary Test database

Unit, database, API, lifecycle, CSKH, and Playwright browser tests run with `npm.cmd run audit:all`. The audit runners assert `DB_NAME() = 'CinemaBookingDB_Test'` before any writes and use `backend/.env.test`; the normal Backend and seed configuration uses `backend/.env` and Main.

The last `audit:all` passed. Test remains online with 29 tables and 3,915 rows. The test login maps only to the exact Test database. Keep it until its exact final inventory is presented and the user separately confirms the drop; do not run `scripts/audit/phase5-drop-approved-test.mjs` early.

## Source layout

- `00_database/` — database creation and options; physical drop entry point is disabled.
- `01_schema/`, `02_tables/`, `03_constraints/`, `04_indexes/` — canonical schema.
- `05_functions/`, `06_views/`, `07_triggers/`, `08_procedures/`, `09_security/` — business and security modules.
- `10_seed/` — all demo seed code (runner, SQL scenario fragments, artwork generator, schema inspector, and verifiers); do not run runner-owned SQL fragments standalone.
- `11_tests/` — SQL regression tests; run only on the isolated Test target.
- `12_verify/` — schema, constraint, module, security, and data verification sources.
- `13_migrations/` — migration history; inspect target guards before deployment.
- `14_audit/` — Main database read-only audit demos, procedure runner, and full audit report.
- `15_ssms_test_suite/` — SSMS test suite, object-to-test map, demo instructions, and packaged runtime evidence.

`baseline-manifest.json` is a historical generated artifact with stale database/object counts. It is not the live Main inventory and must not be used as the current row-count baseline.

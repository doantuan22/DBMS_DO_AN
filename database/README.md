# Database guide

The database is authoritative for business rules, authorization, money, transaction boundaries and concurrency. The application calls typed stored procedures through the procedure client; business SQL does not belong in Backend code. Current project constraints are in [accepted constraints](../docs/FINAL_SYSTEM_AUDIT.md).

The canonical database contains **27 tables and 159 SQL modules**: 125 procedures, 6 views, 21 functions and 7 triggers. Source files and `baseline-manifest.json` are authoritative. The current system audit records the latest parity and safety checks in [FINAL_SYSTEM_AUDIT.md](../docs/FINAL_SYSTEM_AUDIT.md).

## Build and test

Use a disposable SQL Server database for reset, seed, fixture, integration and concurrency tests. The [test pipeline](../scripts/db/TEST_PIPELINE.md) documents guarded preflight, build, seed, fixture verification and cleanup. Seed data and reproducible fixtures are documented in [seed](10_seed/README.md) and [fixture matrix](10_seed/test_fixture/fixture-matrix.md); concurrency cases are in [concurrency tests](11_tests/concurrency/README.md).

The npm commands are defined in the repository root `package.json`. Before running any command that writes to SQL Server, pass an explicitly named test database and satisfy its current target confirmation. Never use `CinemaBookingDB` as a regression target. Main-database verification is read-only except for an explicitly authorized, reviewed deployment.

## Source layout

- `01_schema/` — canonical table definitions.
- `02_functions/`, `03_views/`, `04_procedures/` — executable database modules.
- `05_seed/` through `10_seed/` — baseline, demo and test fixture data.
- `11_tests/` — database and concurrency checks.
- `12_verify/` — canonical object and definition verification.
- `13_migrations/` — reviewed migrations; inspect the migration and its target guards before use.
- `deployments/` — scoped deployment tooling and plans. The completed R7.2 main-database change is documented in [MAIN_DATABASE_SYNC_REPORT.md](../docs/MAIN_DATABASE_SYNC_REPORT.md); its [deployment plan](deployments/r7-2-main/PLAN.md) and [tool guide](deployments/r7-2-main/README.md) contain target protections and rollback behavior.

See [the final system audit](../docs/FINAL_SYSTEM_AUDIT.md) for current acceptance and verification status.

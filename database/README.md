# Database guide

The database is authoritative for business rules, authorization, money, transaction boundaries and concurrency. The application calls typed stored procedures through the procedure client; business SQL does not belong in Backend code. Current project constraints are in [accepted constraints](../docs/FINAL_SYSTEM_AUDIT.md).

The canonical database contains **27 tables and 160 SQL modules**: 125 procedures, 6 views, 21 functions and 8 triggers. Source files and `baseline-manifest.json` are authoritative. The current system audit records the latest parity and safety checks in [FINAL_SYSTEM_AUDIT.md](../docs/FINAL_SYSTEM_AUDIT.md).

## Build and test

Use a disposable SQL Server database for reset, seed, fixture, integration and concurrency tests. The [test pipeline](../scripts/db/TEST_PIPELINE.md) documents guarded preflight, build, seed, fixture verification and cleanup. Seed data and reproducible fixtures are documented in [seed](10_seed/README.md) and [fixture matrix](10_seed/test_fixture/fixture-matrix.md); concurrency cases are in [concurrency tests](11_tests/concurrency/README.md).

The npm commands are defined in the repository root `package.json`. Before running any command that writes to SQL Server, pass an explicitly named test database and satisfy its current target confirmation. Never use `CinemaBookingDB` as a regression target. Main-database verification is read-only except for an explicitly authorized, reviewed deployment.

## Source layout

### Fixed RBAC (11 October 2026)

Only Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH and Admin (`ADMIN`) are supported. Seed definitions remain 4 roles, 23 permission entries and 40 Role–Permission pairs. Historical permission codes are retained for dependencies; their presence does not expose retired management workflows. Account roles are immutable after creation. Customer registration creates Customer only; Admin creates Manager/CSKH/Admin only. Manager cinema assignments remain editable through existing procedures and scope checks.

`ADM-03`, `ADM-04` and `ADM-05` are RETIRED: 42 active Use Cases and 45 historical IDs. The seven legacy RBAC write procedures keep their signatures but throw `50405`; `db_executor` is explicitly denied execution. The account-role trigger rejects changes with `50406`. No table, constraint or procedure is dropped.

The reviewed source migration is [r9_fixed_rbac.sql](13_migrations/r9_fixed_rbac.sql). It uses the connection's selected database, asserts the existing catalog/matrix before mutation and applies changes transactionally without reseeding. A catalog mismatch blocks deployment rather than replacing existing grants. Main deployment requires explicit authorization and target review under the rule above; repository changes alone do not protect direct SQL calls on an unmigrated database.

On an explicitly selected, seeded disposable database, run:

```powershell
node scripts/db/fixed-rbac-smoke.mjs --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
node scripts/db/run.mjs test --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
node scripts/db/run.mjs verify --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
```

The smoke runner starts the real Backend against the selected test database, exercises HTTP/SQL authorization and assignment transfer, and applies the migration only to the validated test target. Evidence is written to ignored `.audit-output/`.

- `01_schema/` — canonical table definitions.
- `02_functions/`, `03_views/`, `04_procedures/` — executable database modules.
- `05_seed/` through `10_seed/` — baseline, demo and test fixture data.
- `11_tests/` — database and concurrency checks.
- `12_verify/` — canonical object and definition verification.
- `13_migrations/` — reviewed migrations; inspect the migration and its target guards before use.
- `deployments/` — scoped deployment tooling and plans. The completed R7.2 main-database change is documented in [MAIN_DATABASE_SYNC_REPORT.md](../docs/MAIN_DATABASE_SYNC_REPORT.md); its [deployment plan](deployments/r7-2-main/PLAN.md) and [tool guide](deployments/r7-2-main/README.md) contain target protections and rollback behavior.

See [the final system audit](../docs/FINAL_SYSTEM_AUDIT.md) for current acceptance and verification status.

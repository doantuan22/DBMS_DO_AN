# Demo seed

All seed code is kept in this directory. The supported runner is `node database/10_seed/seed-demo.mjs` (or `npm run seed:demo`). It targets only the local development `CinemaBookingDB`, creates and verifies a COPY_ONLY backup before resetting rows, preserves `VAITRO`, `QUYEN`, and `VAITRO_QUYEN`, and rolls the replacement back as one database transaction if generation or verification fails.

Run `npm run seed:verify` for read-only SQL integrity and coverage checks, then `npm run seed:api` for role-scoped HTTP checks. The API check uses only GET requests and the database-backed booking preview, which rolls back its own work. Credentials, backups, manifests, and machine-readable reports are kept under ignored `.audit-output/`.

The seed derives show dates from `dbo.fn_BayGio()` and `dbo.fn_NgayKinhDoanh()` on each run. `seed_demo_history.sql` and `seed_demo_manual_showtime.sql` are runner-owned T-SQL fragments for completed/ongoing historical scenarios; they require bound parameters and an active seed transaction and must not be run manually. `generate-media.mjs`, `verify-seed.mjs`, `verify-demo-api.mjs`, `inspect-schema.mjs`, and `capture-main-preview.mjs` are the companion seed artwork/verification tools.

The generator refuses a non-local server, a non-development environment, schema/RBAC drift, non-`example.test` accounts, or row counts that do not match the previous seed manifest (or the known original synthetic seed on first replacement). It does not drop/recreate the database, schema, constraints, triggers, or business modules.

Test-only negative and boundary fixtures remain separate under `backend/tests/` and `scripts/audit/`; they are not inserted into the demo dataset. The audit suite continues to use the isolated `CinemaBookingDB_Test` target.

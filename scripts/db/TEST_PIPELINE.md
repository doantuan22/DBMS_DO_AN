# R5.5 — Test Database Pipeline

Tooling entry: `scripts/db/run.mjs`, with orchestration in `test-pipeline.mjs`.
Schema/seed source remains canonical. Test target defaults to `CinemaBookingDB_Test`;
explicit `CinemaBookingDB_R0_*` targets are also accepted. Main is refused.

All commands run from repo root; use `npm.cmd` in PowerShell when npm.ps1 is blocked.
Connection settings come from existing backend/.env/environment, never command-line
passwords. Existing SQLCMD transport/fallback is reused; no Backend production change.

| Command | Scope | Writes |
|---|---|---|
| `npm.cmd run db:test:preflight` | Actual instance/master, existence/GUID/state/files, SQL UTC/business date, create permission | None |
| `npm.cmd run db:test:build -- --confirm-target=<token>` | Absent target only: create/build, SQL-clock seed, object/base/dynamic/public verification | New test DB; transaction tables remain empty |
| `npm.cmd run db:test:fixture -- --confirm-target=<token>` | Existing freshly seeded clean target: verify seed/read contracts, default rollback, positive commit, immediate assertions, negatives | R5.4 positive dataset on test DB |
| `npm.cmd run db:test:rebuild -- --confirm-target=<token> --confirm-reset=<token>` | Explicit reset of verified disposable target, full pipeline | DROP/recreate test DB and fixture commit |
| Rebuild with `--seed-only` | Reset/build/seed/verify, stop before fixture | Empty transaction tables, suitable for separate fixture mode |

Add `--database=...` to select an explicit allowed test name. Pass `--integrated`
only for an existing SQLCMD integrated connection configuration.

First run preflight and review **actual SQL instance, exact DB name, physical files,
GUID if present and expected file locations if absent**. Its confirmation token binds
that identity. Do not infer disposable permission from the database name alone.

Absent target: task/operator authorization to create must exist, then supply the
reviewed `--confirm-target` token. If target appeared meanwhile, creation fails.
Existing target: obtain explicit operator reset permission before using the separate
`--confirm-reset` token. Never auto-fetch a token and reset an unknown existing target.
Tokens become stale after rebuild because GUID/create time change; rerun preflight
for the next operation. Stored permission does not eliminate target revalidation.

The SQL write session rechecks instance, GUID/state and exact file paths before the
destructive command. Actual connection database is verified before seed/fixture;
all canonical USE statements are targeted deliberately. Legacy `db:reset` now also
refuses main and requires the two confirmation flags for existing disposable targets.
Old historical reset examples without these flags will fail safely.

SeedDate comes from `fn_NgayKinhDoanh(fn_BayGio())` on SQL Server after build. Caller
`--seed-date` overrides are refused by test modes; day drift is checked before seed
and at seed verification. Fresh seed requires empty actor/role tables so its Admin
sentinel cannot silently skip. No partial seed repair or upsert.

All seed includes execute in one existing sqlcmd/mssql session. Fixture context is
set explicitly in each executing session; rollback mode leaves R54PersistFixtures
unset, commit mode sets it to 1. Pending assertions run in that same commit session
immediately, before fingerprints/negative probes. Hold remains the real 5 minutes.
Later effective expiry is expected, not a fixture failure.

Default fixture rollback is followed by exact hashes of all table rows and metadata;
identity counters are intentionally excluded. Negative probes use their own rollback
transactions and the same full fingerprint comparison. Main is hashed read-only
before/after both success and failure; no row contents/secrets are exported.

Each invocation writes an immutable directory under `docs/evidence/r55/runs/`:
`result.json` carries Test ID/scenario/expected/actual/status/exit code; SQL logs carry
runtime outputs; fingerprints prove isolation. On any error the next stage stops.
Review failed runs; rerunning does not overwrite their evidence. A committed fixture
cannot be loaded again over itself; obtain reset permission or use a separate target.

Current safety/regression checks: `node scripts/r55/checks.mjs`. Optional original
checker replay: `node scripts/r55/regression.mjs`; it redirects output only, keeps
historical expectations unchanged and labels phase parity differences. Never rewrite
old evidence to make parity pass. See [R5.5 report](../../docs/R5_5_TEST_DATABASE_REBUILD_REPORT.md).

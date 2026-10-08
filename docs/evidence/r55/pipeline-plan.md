# R5.5 plan after read-only audit, before implementation

SQL Server DESKTOP-E67DPCV is reachable. CinemaBookingDB_Test is absent at initial
preflight. Main exists; inspect identity/files read-only, fingerprint all 27 tables
and metadata before/after test writes. No destructive operation during audit.

| Step | Reuse | Change | Verification |
|---|---|---|---|
| Target | credentials/query/sqlcmd | Strict test name + actual server/GUID/files + confirmation tokens | Offline adversarial gates and live read-only preflight |
| Create/rebuild | canonical create/drop/build-objects | SQL identity guard; existing target requires separate reset token | Fresh creation, explicit authorized second rebuild |
| Objects | verify_database, verify.mjs, inventory | Test orchestration only | Actual baseline schema/constraints/indexes/modules/dependency |
| Seed | seed-all.sql and 17 includes | SeedDate from SQL helper, one session, empty source tables | 376 base rows + 32 dynamic shows, sentinel not skipped |
| Public reads | Existing three SPs/view | Bounded temp-table read-result assertions | Bookable shows/details/seats via actual SPs |
| Rollback fixture | R5.4 transaction-fixture.sql | Set target context in executing session; fingerprint baseline | Row/metadata fingerprints unchanged, no open transaction |
| Commit/negative | Both R5.4 SQL files | Persist opt-in in same connection; immediate assertions | Counts + embedded money/state/points/quota/ownership assertions, expected errors |
| Consistency | Same canonical sources again | Normalized scenario/relationship snapshots, separate run evidence | Counts/business keys/relative schedule/state/money/invariants; dynamic day noted |
| Regression | Historical checks/contracts/Backend/No-SQL | Current source checks without overwriting old snapshots | Source delta allowlist + independent safety tests |

No second schema source, persistent helper table, production business change or R6.

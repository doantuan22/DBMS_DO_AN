# R2.1 raw evidence — 08/10/2026

[Báo cáo25 phần /29 exit criteria](../R2_BOOKING_BOOKABILITY.md). Final test DB: `CinemaBookingDB_R0_R21_20261008_02`, dựng từ source và seed hiện có; mọi fixture dynamic theo DB time, cleanup không data/schema drift.

| Artifact | Nội dung |
| --- | --- |
| [source-changes.patch](source-changes.patch) |Actual tracked SQL/Backend/Frontend changes; new tests/tooling có đường dẫn source trong báo cáo |
| [sql-tests.json](sql-tests.json) |30 actual SQL booking/read/seat/release/rollback cases |
| [api-tests.json](api-tests.json) |107 real requests,16 status/stale cases,2 parallel booking-seat races |
| [parent-concurrency.json](parent-concurrency.json) |14 actual two-session races, DMV waits/SPIDs/full state |
| [checks.json](checks.json) |12 suites PASS, backend127/frontend49,0 skip |
| [r1-regression.json](r1-regression.json) |Unchanged accepted runner/harness hashes and results |
| [r11-sql.json](r11-sql.json), [r11-concurrency.json](r11-concurrency.json) |20 SQL +10 RoomDelete/Create races |
| [r12-sql.json](r12-sql.json), [r12-nested.json](r12-nested.json), [r12-concurrency.json](r12-concurrency.json) |49 SQL +14 nested +26 scenarios +125 stress, overlap0 |
| [no-sql.txt](no-sql.txt) |93 files, no raw business SQL |
| [procedure-contract.json](procedure-contract.json), [source-parity.json](source-parity.json) |112 methods/120 calls,159 source modules no drift |
| [main-migration.json](main-migration.json), [main-readonly.json](main-readonly.json) |Verified backup, six existing module definitions, preserved27 data tables/schema/R1 |
| [migration-replay.json](migration-replay.json) |Disposable module-only replay with actual DB_NAME guard |
| [preserved-before.json](preserved-before.json), [final-checks.json](final-checks.json) |166 accepted artifacts/protected sources, preservation and29 criteria |
| [current-audit-status.json](current-audit-status.json) |I06 resolved; KH05/06/07 PARTIAL; no R2.2/R6 claim |
| sql-tests-initial.json, api-tests-initial.json, migration-replay-initial.json |Actual trial failures retained; explanation/correction in report§22 |

Text logs `booking-sql`, `booking-http`, `parent-concurrency`, `r1-regression`, `backend`, `frontend`, `frontend-lint`, `frontend-build`, `sql-regression`, `sql-verification` và detailed original SQL logs có cùng thư mục. Accepted R0/R1 evidence giữ nguyên.

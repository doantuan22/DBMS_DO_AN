# R1.2 evidence

[Báo cáo Task3:22 mục và28 exit criteria](../R1_SHOWTIME_CONCURRENCY.md).

| Artifact | Kết quả |
| --- | --- |
| [sql-tests.json](sql-tests.json) | 49 SQL cases, actual before/after/overlap/transaction state |
| [nested-tests.json](nested-tests.json) | 14 caller transaction/savepoint/doomed cases, exact restoration |
| [concurrency.json](concurrency.json) | 26 scenarios +125 races, SPIDs/DMV/commit/errors/final rows, global overlap0 |
| [api-tests.json](api-tests.json) | 41 HTTP requests, real parallel Manager/Admin create,409 and safe errors |
| [room-delete-regression.json](room-delete-regression.json) | Original R1.1 source hashes;20 SQL +10 races PASS, accepted evidence untouched |
| [checks.json](checks.json) | Backend126/frontend49,0 skip; all final checks PASS; initial failure diagnostics retained |
| [procedure-contract.json](procedure-contract.json) | 112 methods/120 typed calls,0 problems |
| [source-parity.json](source-parity.json) | All159 modules match source |
| [main-migration.json](main-migration.json) | Verified backup,6 module-only ALTER, data/schema/grants/R1.1 preserved |
| [migration-replay.json](migration-replay.json) | Disposable module replay preserves data/schema |
| [main-readonly.json](main-readonly.json) | Main overlap0;27 tables/125 SP/7 triggers; no leaked fixtures |
| [current-audit-status.json](current-audit-status.json) | I-03 resolved, QLR04/QLR05/ADM14 PARTIAL; other defects unchanged |
| [preserved-before.json](preserved-before.json) | Initial hashes of103 existing R0/R1.1 artifacts/source |
| [final-checks.json](final-checks.json) | Preservation/credentials/runtime architecture/final evidence checks |

Các `.txt` là command output thực; `*-initial.txt` giữ diagnostic của hai tooling failures đã sửa, không đổi chúng thành PASS. Runtime client chỉ nhận domain/safe error; raw SQL fault/DMV details ở đây thuộc offline evidence. Tất cả fixture/hook được dọn; stress chỉ chạy trên DB disposable source-built.

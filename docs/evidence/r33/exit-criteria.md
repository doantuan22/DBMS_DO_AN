| # | Exit criterion | Result | Evidence |
|---|---|---|---|
| 1 | Trace mọi complaint processing writer | PASS | [raw](trace-before.md) |
| 2 | Root cause I-16 xác định | PASS | [raw](before-concurrency.json) |
| 3 | Trigger set-based | PASS | [raw](source-changes.patch) |
| 4 | Không cursor | PASS | [raw](source-changes.patch) |
| 5 | Không WHILE/row-by-row | PASS | [raw](source-changes.patch) |
| 6 | Không giả định INSERTED một row | PASS | [raw](sql-tests.json) |
| 7 | ROW_NUMBER/PARTITION complaint/ORDER BY XuLyID DESC | PASS | [raw](source-changes.patch) |
| 8 | Một latest row cho mỗi complaint | PASS | [raw](sql-tests.json) |
| 9 | Parent bằng latest processing status | PASS | [raw](complaint-concurrency.json) |
| 10 | Single-row không regression | PASS | [raw](api-tests.json) |
| 11 | Multiple complaints một INSERT PASS | PASS | [raw](sql-tests.json) |
| 12 | Multiple rows cùng complaint PASS | PASS | [raw](sql-tests.json) |
| 13 | Mixed batch PASS | PASS | [raw](sql-tests.json) |
| 14 | Các statuses khác nhau chính xác | PASS | [raw](sql-tests.json) |
| 15 | Unrelated complaints giữ nguyên | PASS | [raw](sql-tests.json) |
| 16 | Existing history giữ nguyên | PASS | [raw](api-tests.json) |
| 17 | Rollback phục hồi parent | PASS | [raw](sql-tests.json) |
| 18 | Rollback không giữ history mới | PASS | [raw](sql-tests.json) |
| 19 | SQL positives PASS | PASS | [raw](sql-tests.json) |
| 20 | SQL negatives PASS | PASS | [raw](sql-tests.json) |
| 21 | Multi-row SQL integration PASS | PASS | [raw](api-tests.json) |
| 22 | CSKH API flow PASS | PASS | [raw](api-tests.json) |
| 23 | Customer read/timeline PASS | PASS | [raw](api-tests.json) |
| 24 | Permission/authorization giữ nguyên | PASS | [raw](api-tests.json) |
| 25 | Backend regression PASS | PASS | [raw](checks.json) |
| 26 | No-SQL PASS | PASS | [raw](no-sql.txt) |
| 27 | Prior phases regression PASS | PASS | [raw](checks.json) |
| 28 | Source/schema parity PASS | PASS | [raw](source-parity.json) |
| 29 | Không thêm bảng | PASS | [raw](main-migration.json) |
| 30 | Không thêm LastProcessingID column | PASS | [raw](main-migration.json) |
| 31 | Không redesign Frontend | PASS | [raw](preserved-before.json) |
| 32 | Evidence final DB states thật | PASS | [raw](complaint-concurrency.json) |
| 33 | I-16 RESOLVED | PASS | [raw](current-audit-status.json) |

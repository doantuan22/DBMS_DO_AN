# R1.1 evidence

Xem [báo cáo Task2 đủ15 mục và20 exit criteria](../R1_ROOM_DELETE.md).

| Artifact | Chứng minh |
| --- | --- |
| [sql-tests.json](sql-tests.json) | 20 SQL cases, before/after room/seats/shows/orders/tickets, scope/rollback, cleanup27 bảng |
| [api-tests.json](api-tests.json) | 34 REST requests, hard-delete/history result, refreshed status, scope spoofing, safe404/403/409/500/401 |
| [concurrency.json](concurrency.json) | 10 real races, session IDs, timeline, actual DMV blocking, commits/errors, complete final state |
| [checks.json](checks.json) | 124 BE tests,49 FE tests,0 skip, no-SQL/lint/build/SQL regressions/contracts |
| [procedure-contract.json](procedure-contract.json) | 112 methods/120 typed procedure calls, no missing source/signature problems |
| [source-parity.json](source-parity.json) | All159 modules match source |
| [main-migration.json](main-migration.json) | Verified COPY_ONLY backup;2 module ALTER;27 tables/data/schema/grants preserved |
| [migration-replay.json](migration-replay.json) | Reapplying migration preserves data/schema |
| [main-readonly.json](main-readonly.json) | Post-deployment main data fingerprint; RCSI ON; FK/CHECK enabled/trusted |
| [current-audit-status.json](current-audit-status.json) | Incremental45-UC matrix; I-02 resolved; QLR-02 PARTIAL |
| [final-checks.json](final-checks.json) | 68 accepted R0 artifacts unchanged; credential scan; real-race/zero-skip/evidence checks |

Các `.txt` cùng thư mục là output thực của command tương ứng. Không có credentials/token trong evidence. Các lỗi SQL cố ý chèn được ghi ở tooling/internal log, không trả raw detail cho HTTP client. Disposable DB có thể được giữ để inspect; fixtures và fault triggers đã được dọn.

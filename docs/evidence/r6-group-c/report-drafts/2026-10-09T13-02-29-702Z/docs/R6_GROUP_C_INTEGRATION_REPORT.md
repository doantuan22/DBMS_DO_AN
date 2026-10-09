# R6 Group C — Database & Backend Integration Verification

**R6.8 DONE · R6.9 DONE · R6.10 DONE · Group C DONE · Full R6 DONE.** Integration verification only; not Final System Verification or45/45 Use Case acceptance. No production defect/change.

## A. Implementation Summary

[Checkpoint A inspection](R6_GROUP_C_INSPECTION.md) traced68 Admin endpoints and complaint Customer/CSKH/Admin source against roadmap,45-UC baseline (14/9/6/16),27-table/159-module source, R5 canonical pipeline and A/B acceptance. Reused R3.3 SQL/API bulk/history/rollback, R3.1 Cast SQL/API, R4.3 Pricing, R4.2 Revenue. Added linked/unlinked complaint flow/reference AND permissions and owned Admin fixtures for63 operations with role/actor/permission spoof denial, live permission removal/restoration, actual persisted data and target SP execution counter checks. Complaint's five Admin operations reuse R6.8 evidence. No UI, feature/API/schema, seed catalog or RBAC change.

New files: scripts/r6-group-c inspect/common/harness/run/admin/complaint-flow/report, README; C inspection/report, five final reports; new build inventory/evidence in R55 and R6C. [Current run](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/result.json).

Fixture-only correction: [failed attempt](evidence/r6-group-c/runs/2026-10-09T12-37-42-956Z-a430a21e/result.json) expected new Admin account creation using legacy six-byte seed password; actual400 INVALID_REQUEST matched current password rule. Reproduced with independent owned fixture as a negative case, used valid eight-byte password for positive create/login. [Admin isolated replay](evidence/r6-group-c/runs/2026-10-09T12-39-10-226Z-430418e2/result.json) and full run PASS; failed evidence retained, cleanup always PASS. No production fix.

## B. Verification Matrix

Units are kept separate; no HTTP requests are recounted as scenarios, no reused race counted twice, no total that mixes documents/scenarios/SQL groups.

|Phase|Total|PASS|FAIL|BLOCKED|Status|
|---|---|---|---:|---:|---|
|R6.8 Complaint|79 HTTP cases; 35 SQL groups|Same totals|0|0|DONE|
|R6.9 Admin|341 HTTP cases; 112 SQL groups|Same totals|0|0|DONE|
|R6.10 Reports|5 documents + structure/link/traceability checks|5 documents verified|0|0|DONE|
|Group C|HTTP 420; SQL 147; docs5 (separate)|All above|0|0|DONE|

603 actual HTTP requests; [per-case matrix](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/verification-matrix.json). R4.2/R4.3 SQL and HTTP checks may observe the same business fixture; their channel counts are reported separately, never added into a scenario total.

## C. Complaint Integrity

29 SQL bulk/history cases +6 SQL rollback groups;45 replay HTTP cases +34 linked-flow/authorization HTTP cases. Customer create verifies sender/type/content/default priority/status/time, then CSKH filter/detail/reference/append/status and customer permitted timeline. Both linked and unlinked flows valid. Foreign detail404 COMPLAINT_NOT_FOUND, foreign/missing order404 ORDER_REFERENCE_INVALID; no-write fingerprints. CSKH/Admin missing each QL_KHIEUNAI/XULY_KHIEUNAI denies process/status and direct SP50302. Missing each QL_KHIEUNAI/TRA_CUU_DON denies linked lookup and direct SP50302. Current token reloads current permissions. Bulk status is deterministic max XuLyID across committed history, including mixed batches, many events/parents and reversed timestamps; append-only history retained. Trigger fault after parent update rolls back history and parents, including caller transactions; safe HTTP500.

## D. Admin Integration

|Module|Supported operations verified|Permission result|Database/error/rollback|Status|Evidence|
|---|---|---|---|---|---|
|Report|2 endpoints: GET /api/admin/dashboard; GET /api/admin/reports/revenue|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|User|3 endpoints: GET /api/admin/users; POST /api/admin/users; PUT /api/admin/users/:userId/status|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Role|4 endpoints: GET /api/admin/roles; POST /api/admin/roles; PUT /api/admin/roles/:roleId; DELETE /api/admin/roles/:roleId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Role-Permission|2 endpoints: GET /api/admin/roles/:roleId/permissions; PUT /api/admin/roles/:roleId/permissions|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Permission|4 endpoints: GET /api/admin/permissions; POST /api/admin/permissions; PUT /api/admin/permissions/:permissionId; DELETE /api/admin/permissions/:permissionId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Assignment|3 endpoints: GET /api/admin/assignments; POST /api/admin/assignments; PUT /api/admin/assignments/:assignmentId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Cinema|4 endpoints: GET /api/admin/cinemas; POST /api/admin/cinemas; PUT /api/admin/cinemas/:cinemaId; DELETE /api/admin/cinemas/:cinemaId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Image|5 endpoints: GET /api/admin/cinemas/:cinemaId/images; POST /api/admin/cinemas/:cinemaId/images; PUT /api/admin/cinemas/:cinemaId/images/:imageId; DELETE /api/admin/cinemas/:cinemaId/images/:imageId; PATCH /api/admin/cinemas/:cinemaId/images/:imageId/cover|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Room|4 endpoints: GET /api/admin/rooms; POST /api/admin/rooms; PUT /api/admin/rooms/:roomId; DELETE /api/admin/rooms/:roomId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Seat|4 endpoints: GET /api/admin/seats; POST /api/admin/seats; PUT /api/admin/seats/:seatId; DELETE /api/admin/seats/:seatId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Pricing|3 endpoints: GET /api/admin/pricing; POST /api/admin/pricing; PUT /api/admin/pricing/:pricingId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Showtime|4 endpoints: GET /api/admin/showtimes; POST /api/admin/showtimes; PUT /api/admin/showtimes/:showtimeId; POST /api/admin/showtimes/:showtimeId/cancel|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Movie|4 endpoints: GET /api/admin/movies; POST /api/admin/movies; PUT /api/admin/movies/:movieId; DELETE /api/admin/movies/:movieId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Cast|1 endpoints: PUT /api/admin/movies/:movieId/actors|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Genre|4 endpoints: GET /api/admin/genres; POST /api/admin/genres; PUT /api/admin/genres/:genreId; DELETE /api/admin/genres/:genreId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Actor|4 endpoints: GET /api/admin/actors; POST /api/admin/actors; PUT /api/admin/actors/:actorId; DELETE /api/admin/actors/:actorId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Product|4 endpoints: GET /api/admin/products; POST /api/admin/products; PUT /api/admin/products/:productId; DELETE /api/admin/products/:productId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Promotion|4 endpoints: GET /api/admin/promotions; POST /api/admin/promotions; PUT /api/admin/promotions/:promotionId; DELETE /api/admin/promotions/:promotionId|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|
|Complaint|5 endpoints: GET /api/admin/complaints; GET /api/admin/complaints/:complaintId; GET /api/admin/complaints/:complaintId/order-reference; POST /api/admin/complaints/:complaintId/processings; PUT /api/admin/complaints/:complaintId/status|PASS, exact route permissions AND / wrong role|Persisted/negative assertions; multi-step rollback where applicable|PASS|[operation + HTTP selectors](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin-operation-coverage.json)|

68/68 supported Admin endpoint contracts have successful HTTP and negative/authorization evidence;63 general operations have exact SP DMV execution proof, five Complaint operations reuse R6.8. Assignment creates/revokes actual Manager scope. Image commands enforce one cover and preserve other metadata. Role-Permission invalid replace, movie genre invalid replace and cast invalid/fault replace preserve old associations. Pricing supports Ngày thường/Cuối tuần/Tất cả only, complete condition update, historical money preserved. Report returns authoritative summary/byCinema/byMovie/byDate checked against independent paid/failed/canceled fixture receipts and date filters. No ADM-17.

## E. Regression

|Suite|Typed result groups|HTTP requests|Evidence|
|---|---|---:|---|
|r33-sql|cases=29, rollback=6|0|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/r33-sql/sql-tests.json)|
|r33-api|HTTP cases=45|158|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/r33-api/api-tests.json)|
|complaint-flow|HTTP cases=34|39|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/complaint-flow/complaint-flow.json)|
|admin|HTTP cases=250|255|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/admin/admin.json)|
|r31-sql|positive=9, negative=30 +7 control groups|0|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/r31-sql/sql-tests.json)|
|r31-api|HTTP cases=19|59|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/r31-api/api-tests.json)|
|r43-pricing|cases=44; HTTP cases=40|55|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/r43-pricing/sql-tests.json)|
|r42-report|cases=22; HTTP cases=32|37|[JSON](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/r42-report/sql-tests.json)|

Backend 191/191, skipped0 [log](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/backend.log); [no-SQL audit](evidence/r6-group-c/runs/2026-10-09T12-53-33-978Z-1aca2fe1/no-sql.log) PASS.159 modules and27-table metadata/data restoration PASS after each suite. No affected production change, so A/B full stress not rerun. Their accepted artifacts and databases preserved.

## F. Final Reports

- [DATABASE_INTEGRATION_REPORT.md](DATABASE_INTEGRATION_REPORT.md)
- [BACKEND_INTEGRATION_REPORT.md](BACKEND_INTEGRATION_REPORT.md)
- [CONCURRENCY_REPORT.md](CONCURRENCY_REPORT.md)
- [ROLLBACK_REPORT.md](ROLLBACK_REPORT.md)
- [DATA_INTEGRITY_REPORT.md](DATA_INTEGRITY_REPORT.md)

All have Test ID/Scenario/Input/Expected/Actual/Result/Evidence/Source Phase and valid relative repository links. [Source/metric/report validation](evidence/r6-group-c/report-validation.json).

## G. Outstanding Issues

No unresolved material failure/blocker or missing mandatory operation evidence. Earlier A/B/C tooling failures remain retained and distinguished from acceptance. Tests use actual in-process Express, SQL Server local sa per accepted constraint, owned fixtures and same-session guards. Browser/UI, scheduled background expiry, deployment-security and45-UC regression are outside this task; no claim those were performed. The final reports only claim rollback for cases with actual evidence. C DB remains seed-only for review; identity counters advance normally.

## H. Final Conclusion

R6.1–R6.3: accepted A DONE; R6.4–R6.7: accepted B DONE; R6.8 Complaint DONE; R6.9 Admin DONE; R6.10 five reports DONE; **Group C and Full R6 DONE**. Stop at R6; no R7.

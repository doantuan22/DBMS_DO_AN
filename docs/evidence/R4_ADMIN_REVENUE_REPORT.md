# Task 10 — R4.2 / I-13: Admin Revenue Report Contract Hardening

Ngày thực hiện: **08/10/2026**. Kết luận: **DONE R4.2**. Test DB hiện hữu: `CinemaBookingDB_R0_R33_20261008_01`. Node 24.21.0 / npm 11.19.0; SQL Server thật. Không triển khai R4.3–R4.7 hoặc R5.

## 1. Scope

Chỉ mở rộng report ADM-16 theo R4.2: một `sp_Admin_Report_Revenue`, mapping trong Admin Service, tests và contract/evidence liên quan. Giữ endpoint, typed inputs, RBAC và revenue rules hiện có. Không thêm schema/persistent report table, đổi payment/cancellation/booking protocols hay sửa Frontend/Manager API.

## 2. Root cause I-13

SP mới có đúng hai result sets: per-cinema và period total. Service chỉ expose `cinemas`/`totals`; thiếu aggregation theo phim/ngày mặc dù thiết kế ADM-16 và roadmap yêu cầu. Existing implementation đã tính cash từ successful payment snapshots và tránh nhân gross order snapshots bằng GROUP BY order; không cần thay công thức hoặc hệ thống báo cáo.

## 3. Existing implementation và audit trước sửa

Live/source SP khớp, signature `@ActorID INT`, `@TuNgay DATE=NULL`, `@DenNgay DATE=NULL`, `@RapID INT=NULL`, không output parameter. Main có 27 bảng và tổng report 0, nên số liệu audit cũ không đủ positive financial evidence. [audit-before.json](r42/audit-before.json) ghi metadata, schema/parameters, hai output cũ và fingerprints; source trước sửa lưu riêng trong `r42/before-source/`.

Luồng giữ nguyên: GET `/api/admin/reports/revenue` → authenticate/live identity → requireAdmin → permission `XEM_BAO_CAO_TOANHE` → controller revenueFilters → adminService → typed whitelisted Procedure Client → report SP. Error handler chung đã map SQL 50300/50301/50302; không sửa auth modules. Consumer `frontend/src/api/adminApi.js`/AdminPortal đọc report; bảng chọn array đầu tiên của DTO. Tài liệu/View/SP cũ xác nhận successful cash không phụ thuộc order status và date theo payment, không ngày đặt/chiếu.

## 4. Changes made / Files Changed

| File | Thay đổi và lý do |
| --- | --- |
| `database/08_procedures/admin/sp_Admin_Report_Revenue.sql` | Thêm PhimID/NgayThu vào cohort temp hiện hữu; trả Summary trước, Cinema thứ hai, bổ sung Movie/Date và ORDER BY ổn định |
| `backend/src/services/adminService.js` | Map index 0–3 sang canonical fields; giữ aliases cinemas/totals |
| `backend/tests/adminService.test.js` | Cập nhật mock report theo thứ tự mới, giữ kiểm tra aliases cũ và thêm hai breakdown |
| `backend/tests/adminRevenue.test.js` | 8 focused tests: binding, DTO identity/no recalculation, empty results, validation, 3 SQL auth mappings, error propagation |
| `scripts/r42/{common,audit-before,deploy,report-tests,checks,main-check}.mjs` | Offline verification theo tooling mssql/node:test/npm hiện có; deterministic fixture ledger, isolated regression workspace, deployment preservation/read-only evidence |
| `docs/contracts/ADMIN_REVENUE.md` | Contract inputs/columns/rules/order/aliases/empty behavior và lệnh replay |
| `docs/FULL_SYSTEM_AUDIT.md` | Thêm nghiệm thu Task 10 và link evidence; giữ nội dung lịch sử |
| `docs/evidence/R4_ADMIN_REVENUE_REPORT.md`, `docs/evidence/r42/*` | Báo cáo và evidence từ lượt kiểm chứng thực tế |

Không đổi bất kỳ assertion ngoài Admin report mapping. Guard SQL error coverage và toàn bộ test cũ khác giữ nguyên. Diff preservation ở [final-checks.json](r42/final-checks.json).

## 5. Revenue business rules / Revenue Correctness

Giữ đúng rule cũ: SUM `THANHTOAN.SoTien` của rows **Thành công**, group một row/order; failed/processing/refunded không tính. Gross ticket/food/discount lấy các snapshot ở DONDATVE, không tính lại từ giá catalog hay cộng vào cash lần nữa. Đếm active tickets bằng scalar count, không JOIN ticket/food lines vào payment aggregation. Canonical payment flow chỉ cho pending order chuyển success, retry/idempotency không tạo thêm successful receipt. Test nhiều attempts có failed/pending/success và attempt pending sau khi order đã paid bị SQL từ chối, report vẫn một order.

Ngày nhận mỗi order là `fn_NgayKinhDoanh(MAX(ISNULL(NgayThanhToan,NgayTao)))` của success payments. Giữ Vietnam UTC+7, inclusive DATE bounds và nullable bounds. Schema mỗi order có đúng một show/movie; full receipt food/discount thuộc movie ấy, không tự phân bổ doanh thu theo số vé/genre/actor. Hủy paid order giữ payment thành công và cash như trước; compensation là loyalty points. Không trừ điểm như hoàn tiền.

Fixture independent oracle có bốn orders cash **209000 + 89000 + 89000 + 89000 = 476000**, gross ticket400000, gross food80000, discount4000, active tickets5 trước cancel. First order có hai tickets và hai food lines (quantity2/3), giúp phát hiện fanout. Cinema/Movie groups cash298000/178000; Date groups89000/298000/89000. Expected ledger được xác định từ giá/số lượng fixture, không lấy SP output làm expected. Cả sáu metrics của từng breakdown cộng khớp Summary. Sau cancel hai paid orders ở rạp B, cash/snapshots giữ nguyên, active-ticket metrics giảm đúng business rule. Historical money được so trước/sau catalog/pricing/promotion updates, không sửa snapshot để khớp report.

## 6. Stored Procedure contract / Database Implementation

Recordsets ổn định: **0 Summary, 1 RevenueByCinema, 2 RevenueByMovie, 3 RevenueByDate**. Cùng cohort `#DonDaThu` materialize một lần. Summary giữ sáu KPIs cũ; period rỗng trả một row zero. Cinema giữ rows0 cho rạp không có receipt; movie/date chỉ trả eligible groups. Identity/date sorts ASC. No new persistent objects; không chỉnh snapshot/history data.

Column names/types, payment rules và date bounds chi tiết tại [Admin Revenue contract](../contracts/ADMIN_REVENUE.md). `Ngay` có SQL metadata DATE và API serialize `YYYY-MM-DD`. Test/source parity kiểm chứng toàn bộ159 modules trên test DB sau deploy.

## 7. Backend DTO mapping / Backend Contract

Canonical DTO có `summary`, `byCinema`, `byMovie`, `byDate`. Hai aliases `cinemas=byCinema`, `totals=summary` được giữ để tương thích consumer cũ, không phải additional revenues. Service chỉ typed binding và nhận/map recordsets, không SQL text, SUM/COUNT/GROUP BY hay monetary calculations. Unit test dùng strict reference identity để chứng minh không thay financial values. Empty/missing mock sets giữ object/array, SQL thật trả Summary zero. Endpoint/filter/error/permission không đổi.

Frontend không sửa; array đầu tiên vẫn doanh thu rạp, cùng field/alias cũ. Report SP internal ordinal thay đổi theo R4.2 và được ghi rõ trong contract. New breakdown fields là API addition được kiểm soát; không phát triển UI để render các breakdown trong Task này.

## 8. Database tests

[sql-tests.json](r42/sql-tests.json): **22 SQL cases PASS**. Tất cả 12 minimum scenarios R4.2-01…12 có tên riêng trong evidence: empty, one/multiple cinema, one/multiple movie, multi-day, date bounds, failed, canceled order/compensation, multiple attempts, multiple tickets/foods và catalog price changes. Thêm open bounds, nonexistent cinema, expired/unpaid, NULL payment-time fallback, schema-supported refunded status và identical-state repeated report.

Boundary fixtures ở trước đầu ngày, đúng đầu ngày, cuối ngày `16:59:59.9999999Z` và ngày kế tiếp theo UTC+7, không truncation milliseconds. Một test set chỉ ngày2031-01-02 trả cash298000 đúng đầu/cuối inclusive. Refunded attempt là schema-status fixture trong DB test, vì không có canonical refund API; không giả lập một refund integration workflow.

## 9. Backend tests

Thêm8 tests; suite từ131 lên **139 tests**, tất cả PASS, zero skipped/cancelled/todo. Thứ tự mapping, typed DATE/INT/actor, whitelisted name, alias types/values, validation và SQL auth errors đều kiểm chứng. No-SQL audit PASS trên95 source/test files. Initial scanner false positive trên literal SELECT trong negative error-message assertion đã sửa bằng equivalent negative `assert.match`, là category đã được scanner review; không sửa scanner/allowlist, không giảm assertion. Giữ [no-sql-attempt-1.txt](r42/no-sql-attempt-1.txt) và [checks-attempt-1.json](r42/checks-attempt-1.json); lượt cuối PASS.

## 10. Integration verification

[api-tests.json](r42/api-tests.json): **32 API cases / 37 real HTTP requests PASS**. Có real seed login, typed procedure client/SP4 outputs, canonical DTO + legacy aliases, financial-positive cases, permission revoke/restored, denied customer/manager/support/unauthenticated, invalid/spoof filters. Direct SQL kiểm tra bad actor/role và permission50300/50301/50302. Không dùng mock để kết luận integration PASS.

Re-use disposable DB đã có, tạo đúng hai fixture resource groups bằng existing helper/canonical booking/payment. Cleanup xác minh data/metadata hashes và transaction count0; loyalty points/permissions được phục hồi. Không dựng R5 pipeline hay xóa dữ liệu cũ để lấy positive evidence. Main không nhận fixture DML.

## 11. Regression và commands

Đã chạy thực tế:

```powershell
node scripts/r42/deploy.mjs --database=CinemaBookingDB_R0_R33_20261008_01 --apply
node scripts/r42/report-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r42/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r42/main-check.mjs --database=CinemaBookingDB --mode=isolation
node scripts/r42/deploy.mjs --database=CinemaBookingDB --apply
node scripts/r42/main-check.mjs --database=CinemaBookingDB --mode=readonly
```

`checks.mjs` tạo source-only directory từ tracked source + proposed changes, copy nguyên byte, bỏ `.env`/audit/evidence/node_modules. Cài thực141 packages bằng `npm ci`, chạy `npm test` hai lần và reverse-file-order concurrency1: **139/139 mỗi lượt, 0 fail/skip**. Đây là verification proposed working source, không tuyên bố các thay đổi chưa commit đã có trong HEAD. R4.1 evidence cũ giữ nguyên; clean proposed suite không có manual audit dependency. [checks.json](r42/checks.json) ghi manifest/commands/times/results và snapshot trước/sau.

| Check | Kết quả thực |
| --- | --- |
| Backend install/3 suite runs | PASS,139/139 mỗi lượt |
| No-SQL audit | PASS |
| Existing Procedure/API parameter contract check | PASS |
| New Admin SQL/API integration | PASS,22SQL/32API cases |
| Accepted SQL regression R1.1/R1.2/R2.1/R2.2/R3.1/R3.2/R3.3 | PASS; source/test assertions không thay đổi |
| Existing `database/11_tests/test-all.sql` | PASS,smoke/timezone/pricing/compensation/multirow/integrity/execute-only permissions |
| Database verification/source parity | PASS,159 modules |
| Test DB cleanup | PASS,data/metadata khớp trước regression |

Các commands/check outputs chi tiết tại `r42/*.txt`, fresh accepted SQL results tại `r42/regression/`. Không copy kết quả nghiệm thu cũ làm lượt mới. Không chạy lại browser/full race suites ngoài scope; các writer modules/locking protocols và Frontend được kiểm hash bảo toàn, kèm full Backend và SQL regression trên.

## 12. Scope compliance và main preservation

[main-test-isolation.json](r42/main-test-isolation.json) xác nhận main27 data/schema/module fingerprints không đổi trong toàn bộ disposable tests. Chỉ sau mọi check PASS, main đã backup **COPY_ONLY/CHECKSUM + RESTORE VERIFYONLY**, transaction chỉ ALTER existing report SP. [main-deployment.json](r42/main-deployment.json): đúng **1 module** đổi; **158 modules khác**,27 tables/data/schema/grants/signatures/parameters bảo toàn. Không insert/update/delete historical rows. [main-readonly.json](r42/main-readonly.json) ghi real GET200 trên main,4groups/aliases hợp lệ và fingerprint data/metadata trước/sau read-only API giữ nguyên.

[final-checks.json](r42/final-checks.json) kiểm phạm vi source changes, bảo toàn các artifact R0–R4.1, no table/Frontend/Manager changes và git diff check. Không triển khai I-14/I-17/I-18/I-20/I-22, R4.3–4.7 hay R5–R9.

## 13. Remaining limitations

Giữ công thức cash-receipts cũ; không bổ sung cash refund workflow, không tự xử lý dữ liệu multiple-success ngoài canonical flow, không hồi tố catalog names thành snapshots. Schema-supported refunded-status exclusion được test, nhưng không gán nhãn refund workflow integration PASS. Movie/date output chỉ có nhóm phát sinh, không thêm empty-date series/KPI.

Frontend mới để hiển thị breakdown không thuộc Task10. ADM-16 full UC vẫn PARTIAL vì UI/broader acceptance; SP/Backend Admin Revenue contract và I-13 trong phạm vi R4.2 đã hoàn thành. [current-audit-status.json](r42/current-audit-status.json) chỉ cập nhật I-13/ADM-16 evidence, giữ45 UC grades và tất cả finding khác. Test target identity counters tăng do fixtures; không reseed. Không có test failure nghiệp vụ ngoài scope trong các lượt cuối.

## 14. Final status

**Task10: DONE.** Tất cả exit criteria R4.2 đạt theo evidence trên:4recordsets, financial-positive correctness/no fanout/same-cohort/date bounds/historical consistency, DTO/legacy compatibility/RBAC, real SQL/API integration, full Backend/SQL regression, No-SQL và scope preservation. Thay đổi giới hạn Admin Revenue. **STOP tại R4.2.**

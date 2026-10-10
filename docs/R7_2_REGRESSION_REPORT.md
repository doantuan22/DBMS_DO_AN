# R7.2 — Use Case Regression & Gap Resolution

**Status: DONE trong phạm vi sáu gap DB/BE.** Ngày 2026-10-09, Asia/Saigon. Đây là kết quả R7.2, **chưa Final Acceptance R7.3**. DB/BE **45/45 PASS**, FE/Overall giữ **2 PASS / 43 PARTIAL**. Không tuyên bố 45/45 Overall PASS hoặc toàn bộ R7 hoàn thành.

## A. Implementation Summary

Baseline repository: `9d68c6dbad0750de5ccb84eccbd6959dcf735845`, giữ working tree R7.1 gồm bốn tài liệu chưa commit. Trước khi test đã đối chiếu roadmap R7, baseline45, matrix, backlog, accepted constraints, thiết kế sáu UC, contracts và ba báo cáo Group A/B/C cùng năm báo cáo Integration R6. Source và các evidence dùng lại được đọc trực tiếp; 431 selector trên 23 artifact cũ hợp lệ: [reused-evidence-validation.json](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/reused-evidence-validation.json>).

Môi trường: SQL Server **DESKTOP-E67DPCV**, version17.0.1000.7; real Express trên localhost/port tạm, kết nối SQL thật. Target cuối `CinemaBookingDB_R0_R72_20261009_02`, GUID `D811515E-86AE-4B72-9A45-1E7E1B2ED950`, database_id47; cả data/log ở đường dẫn riêng được preflight xác minh. Tạo target **absent** qua R5 canonical pipeline, không reset target tồn tại. [Post-fix build](evidence/r55/runs/2026-10-09T15-28-55-239Z-456e38b6/result.json) xác minh schema/seed/public reads và159 module. Target `_01` dùng cho pre-fix inspection/reproduction và scoped canonical update; [initial build](evidence/r55/runs/2026-10-09T15-15-54-104Z-94e64bd9/result.json) cũng PASS. Hai target được giữ ở trạng thái seed-only sau cleanup để kiểm tra.

Bốn P1 đã đúng: **không sửa review, manager pricing, dashboard hoặc revenue**. Bổ sung fixture độc lập và HTTP/SQL assertions. Hai production contract defects được chứng minh sau quyết định người dùng: priority filter bị HTTP400 và Admin tạo Customer/profile được HTTP200. [Reproduction](evidence/r7-2/runs/2026-10-09T15-25-14-351Z-b23c1891/p2.json) giữ expected behavior cũ và `contractMismatch`, status REPRODUCED; không dùng hai case này làm policy acceptance.

Sửa tối thiểu:

- CSKH: optional `@MucDoUuTien NVARCHAR(50)=NULL` cuối SP, SQL AND predicate/enum guard50405, validator query `priority` và typed binding/service error400 `INVALID_PRIORITY`. Consumer Admin dùng chung được kiểm chứng.
- Admin: allowlist role code `QUAN_LY_RAP/CSKH/ADMIN` bên trong transaction, khóa role, SQL50404 → HTTP403 `ROLE_CREATE_FORBIDDEN`. Customer/custom bị chặn trước insert; bỏ nhánh tạo customer profile không còn hợp lệ. Role ID chưa tồn tại, email duplicate và list/status giữ contract cũ. Validator roleId kiểm SQL INT, SQL xác định role code; không hardcode ID hoặc thêm quyền đọc role.
- Manifest và hai generated verification files cập nhật đúng hai module definitions/optional parameter mới, không thêm table/SP/module. [Scoped update evidence](evidence/r7-2/runs/2026-10-09T15-27-18-846Z-8524b654/apply-contracts.json) bảo toàn toàn bộ row data; build `_02` xác minh source độc lập.

Files sửa trước đó: `backend/src/services/adminService.js`, `backend/src/services/supportService.js`, `backend/src/validators/supportValidator.js`, `backend/tests/adminService.test.js`, `backend/tests/supportService.test.js`, `database/08_procedures/admin/sp_Admin_User_Create.sql`, `database/08_procedures/support/sp_Support_Complaint_List.sql`, `database/12_verify/verify_objects.sql`, `database/12_verify/verify_procedures.sql`, `database/baseline-manifest.json`, `docs/R7_2_VERIFICATION_BACKLOG.md`, `docs/USE_CASE_MATRIX_45.md`. Files mới: `scripts/r7-2/{common,harness,fixtures,p1,p2,run,apply-contracts,checks}.mjs`, [tooling README](../scripts/r7-2/README.md), [approved policies](contracts/R7_2_APPROVED_POLICIES.md), report này và evidence R7.2/R5 hai build mới. Offline tooling reuse nguyên R6 HTTP harness và R21 fixture source; chúng không bị sửa. Backend tiếp tục Stored-Procedure-Only, raw SQL chỉ ở tooling.

## B. Six-Gap Verification Matrix

| Gap ID | UC | Test Result | DB/BE Status | Evidence |
| --- | --- | --- | --- | --- |
| R71-DB-01 | KH-13 | 12 case PASS; RESOLVED | PASS | [E432](USE_CASE_MATRIX_45.md#evidence-e432) |
| R71-DB-02 | QLR-07 | 13 case PASS; RESOLVED | PASS | [E433](USE_CASE_MATRIX_45.md#evidence-e433) |
| R71-DB-03 | QLR-08 | 9 case PASS; RESOLVED | PASS | [E434](USE_CASE_MATRIX_45.md#evidence-e434) |
| R71-DB-04 | QLR-09 | 17 case PASS; RESOLVED | PASS | [E435](USE_CASE_MATRIX_45.md#evidence-e435) |
| R71-CT-01 | CSKH-02 | 15 case PASS; RESOLVED | PASS | [E436](USE_CASE_MATRIX_45.md#evidence-e436) |
| R71-CT-02 | ADM-02 | 17 case PASS; RESOLVED | PASS | [E437](USE_CASE_MATRIX_45.md#evidence-e437) |

[Inspection matrix](evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/inspection.json) ghi contract/current evidence/missing verification/action cho từng gap. [Full case matrix](evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json) có TestID, UC/Gap, scenario, input, expected/actual, result, exact HTTP/SQL pointers, persisted state, cleanup và fix.

## C. Contract Decisions

Nguồn phê duyệt: người dùng trả lời trực tiếp ngày2026-10-09 trong phiên R7.2, được lưu nguyên nội dung tại [approved policy](contracts/R7_2_APPROVED_POLICIES.md) và `/decisions` của [p2.json](<evidence/r7-2/runs/2026-10-09T15-38-07-241Z-eb5ce811/p2.json>). Không còn quyết định PENDING.

| UC | Conflict/source | Options considered | Approved decision | Impact/result |
| --- | --- | --- | --- | --- |
| CSKH-02 | Thiết kế dòng321 yêu cầu status/priority; old SP/validator chỉ status/type/search | Bắt buộc priority / chấp nhận filters cũ | Người dùng: “Bắt buộc thêm bộ lọc ưu tiên” | SQL/BE thêm priority; đủ bốn enum, kết hợp filters, invalid/empty/auth/read-only PASS |
| ADM-02 | Thiết kế dòng386 có Admin khác; dòng387 chỉ Manager/CSKH, không tạo Customer thay; old SQL nhận mọi role | Manager+CSKH / thêm Admin / mọi role hợp lệ | Người dùng: “Manager, CSKH và Admin” | SQL allowlist, Customer/custom403, profile không phát sinh, FK/duplicate/savepoint/list/status PASS |
| QLR-08 | Thiết kế dòng289 nêu occupancy; payload current có bốn metrics | Giữ bốn metric / thêm occupancy với công thức được chốt | Người dùng: “Bốn số liệu hiện tại đủ cho R7.2” | Không thêm metric; numeric/business date/scope/read-only PASS |

Nguồn thiết kế: [Phân Tích _ Thiết Kế.md](<../Phân Tích _ Thiết Kế.md>), [baseline45](USE_CASE_BASELINE_45.md), [accepted constraints](PROJECT_ACCEPTED_CONSTRAINTS.md); trước người dùng trả lời không có post-audit decision giải quyết hai policy. Frontend options/filter wiring theo contract mới chuyển R8.

## D. Regression Results

| Check | Actual result | Exact evidence |
| --- | --- | --- |
| P1 required scenarios | 28 scenarios /51 HTTP cases PASS;65 requests gồm login/setup/readback | [p1.json](<evidence/r7-2/runs/2026-10-09T15-42-18-105Z-0346d4d2/p1.json>) |
| P2 policy + affected consumer | 17 scenarios /32 cases PASS (28 HTTP,4 direct SQL);33 HTTP requests | [p2.json](<evidence/r7-2/runs/2026-10-09T15-38-07-241Z-eb5ce811/p2.json>) |
| Targeted Backend | 42/42 PASS; fail/cancelled/skipped0 | [checks.json](<evidence/r7-2/runs/2026-10-09T15-31-22-458Z-b2518975/checks.json>) `/checks/0` |
| Full Backend suite hiện tại | 192/192 PASS; fail/cancelled/skipped0 | [checks.json](<evidence/r7-2/runs/2026-10-09T15-31-22-458Z-b2518975/checks.json>) `/checks/1` |
| No-SQL audit | PASS | [checks.json](<evidence/r7-2/runs/2026-10-09T15-31-22-458Z-b2518975/checks.json>) `/checks/2`, [log](<evidence/r7-2/runs/2026-10-09T15-31-22-458Z-b2518975/no-sql.log>) |
| Typed procedure contracts | PASS:112 service methods,120 captured calls/whitelist entries; problems0 | [contract JSON](<evidence/r7-2/runs/2026-10-09T15-31-22-458Z-b2518975/backend-contract-check.json>) |
| Canonical parity | 27 tables /125 SP /21 functions /6 views /7 triggers;159 definitions match source | [p1.json](<evidence/r7-2/runs/2026-10-09T15-42-18-105Z-0346d4d2/p1.json>) `/parityAfter`; [p2.json](<evidence/r7-2/runs/2026-10-09T15-38-07-241Z-eb5ce811/p2.json>) `/parityAfter`; R5 post-fix build |

**Acceptance counts:** 83 cases trong45 scenario chỉ thuộc **sáu UC**; 79 HTTP case +4 SQL case, tổng98 HTTP requests gồm setup/login/readback. Không gọi đây là45 UC regression chạy mới. 39 UC DB/BE PASS baseline được đánh giá lại bằng source/dependency parity và evidence cũ; 157 module definitions không đổi, hai module đã sửa được kiểm chứng theo policy. Shared Admin complaint queue kiểm cả default không priority và priority. Full backend/typed contracts bảo vệ các consumer còn lại; không rerun toàn bộ R6.

Một lượt targeted unit regression trước khi hoàn tất test expectations có FAIL: [retained failed check](evidence/r7-2/runs/2026-10-09T15-30-11-098Z-398bcb0f/checks.json). Guard bảng mã lỗi test thiếu50404 mới; service đã ánh xạ đúng và real HTTP PASS. Đã cập nhật expected error table và rerun targeted/full suite PASS; không nới assertion hoặc xóa failure. Các lượt P1/P2 sớm vẫn giữ nguyên evidence, không cộng vào acceptance counts cuối. Không có FAIL runtime hay regression chưa xử lý.

## E. Database & Authorization Integrity

- Review: POST201 persist đúng authenticated Customer/movie/rating/content đã trim; public GET trả reviewerName và không trả userId. SQL trigger từ chối không có qualifying order, paid future và pending past; duplicate409, rating0/6/fraction/string400, missing DANH_GIA403 và spoof/wrong-role bị chặn.
- Pricing: POST201→GET/SQL readback; đủ dimensions/status, full PUT và explicit NULL end date, ba day types, holiday400, overlap409; SQL `fn_TinhGiaVe` trả80020.25 sau surcharge20.25 trên base80000. Ticket/order/food/payment snapshots của historical fixture giữ nguyên. Foreign scope, revoked/expired assignment và revoked grant bị chặn với JWT cũ.
- Dashboard: fixture độc lập gồm phòng hoạt động/ngưng hoạt động, ghế hoạt động/hỏng/bảo trì, hôm nay/tương lai/hủy, paid/pending/failed. Expected **activeRooms1 / activeSeats9 / showtimesToday2 / paidOrdersToday3**; SQL raw facts/UTC+7 oracle độc lập đối chiếu từng metric. ActiveSeats gồm ghế hoạt động trong phòng ngưng hoạt động đúng definition current. Receipt lúc00:30 local thuộc UTC date hôm trước vẫn tính vào hôm nay. Rạp khác không cộng vào; đọc scope/auth denied và GET no-write PASS.
- Revenue: SQL oracle dựng ledger từ persisted successful receipts, tách ticket counts tránh fan-out, chuyển UTC+7 bằng AT TIME ZONE, không gọi SP/view production. Đối chiếu thêm expected fixture ledger và DECIMAL(18,2). Hôm nay **3 orders /2 noncanceled tickets / ticket300.30 / food75.75 / discount15.15 / paid360.90**; hôm trước và ngày mai mỗi1order/120.30. Failed attempt, pending và canceled không successful bị loại; canceled có receipt thành công lịch sử vẫn ghi nhận đúng receipt-based contract, ticket đã hủy không được đếm. Bounds start/end/same-day/default/empty/invalid đều PASS. Đây là read test dữ liệu thanh toán thật trong SQL fixture, không tuyên bố mới test toàn bộ payment flow.
- Complaint: status/type/search giữ tương thích; cả bốn priorities, AND combinations, empty, invalidHTTP400/SQL50405, grant/role và shared Admin consumer PASS. SQL thực hiện filter; JS chỉ DTO.
- Admin: cả ba allowed roles tạo đúng user, staff profile count0; Customer/customHTTP403 và directSQL50404 không user/profile/grant write. FK role400, duplicate email/phone409, invalid payload400; caller savepoint failure50404 giữ caller transaction1/state1 rồi outer rollback về0. List/status readback vẫn đúng. Nhánh user+Customer profile không còn được policy cho phép, đã bỏ; negative fingerprint chứng minh không orphan.

Từng fixture kiểm constraints/FK trusted, triggers enabled, money snapshots, unique seats/successful payments/hold limit, DBCC CHECKCONSTRAINTS không vi phạm, transaction session0/XACT_STATE0 và không connection khác giữ user transaction. Tất cả45 scenario có integrity trước cleanup và27-table/metadata fingerprint sau cleanup khớp baseline; identity counter được loại theo convention R5/R6. **43 negative HTTP cases**, **41 GET cases** (có giao nhau),4 direct SQL negatives có no-write fingerprints.

`CinemaBookingDB` được fingerprint read-only trước/sau cả pipeline và hai suites; cả data/metadata giữ nguyên. Không reset/seed/DDL trên main hoặc DB R6. [repository-integrity.json](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/repository-integrity.json>) xác nhận 1991/2003 file baseline giữ nguyên;12 thay đổi chỉ nằm ở SQL/BE/tests/manifest/verification/matrix/backlog đã nêu. Toàn bộ evidence cũ, source R6 harness, R7.1 report và R7.1 combined report giữ hash.

## F. Outstanding Issues

Remaining FAIL0; DB/BE PARTIAL/BROKEN/MISSING0 trong45 UC. Hai contract decisions và dashboard metric expectation đã APPROVED và verified. Sáu DB/BE gaps RESOLVED; không có material defect/blocker chưa xử lý trong phạm vi chính sách đã chốt.

**43 FRONTEND_GAP giữ DEFER_TO_R8**, FE/Overall43PARTIAL. R7.2 không sửa React/UI/CSS/navigation, không browser E2E. CSKH priority control và Admin role options theo approved policy cần R8 kiểm chứng. R7.1 report/combined giữ nội dung historical baseline39PASS/6PARTIAL; matrix/backlog và report R7.2 thể hiện kết quả hiện hành. Source SQL đã sửa trong repository và kiểm chứng trên disposable DB; main database giữ nguyên theo yêu cầu bảo toàn.

## G. Final Conclusion

**R7.2 DONE**: bốn P1 có SQL/HTTP runtime evidence; hai P2 có quyết định người dùng, reproduction, minimal fix và targeted regression PASS. Canonical125SP/159modules không đổi; Backend192/192, No-SQL, typed contracts và integrity PASS.

| Layer | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: |
| Database/Backend | 45 | 0 | 0 | 0 |
| Frontend | 2 | 43 | 0 | 0 |
| Overall | 2 | 43 | 0 | 0 |

Sẵn sàng chuyển hồ sơ sang **R7.3 Final Verification & Acceptance** ở yêu cầu tiếp theo. [Acceptance index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/acceptance.json>) tổng hợp counts/source; [matrix45](USE_CASE_MATRIX_45.md) vẫn DRAFT pre-R7.3; [backlog](R7_2_VERIFICATION_BACKLOG.md) giữ43 FE gaps. Dừng tại R7.2.

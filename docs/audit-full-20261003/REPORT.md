# FULL SYSTEM DEEP AUDIT — CinemaBookingDB

**Ngày:** 2026-10-03, Asia/Ho_Chi_Minh. **Mode:** AUDIT ONLY.

**Commit:** "7c35624274a9dce7b5a97ee7f9c7f34013daf77b". **Verdict:** AUDIT FOUND ISSUES – FIX REQUIRED.

## 1. Executive Summary

Đã kiểm tra database thật, source sau rollback, 118 endpoint, 154 SQL module và ma trận 45 use case; đã chạy API integration và browser với bốn vai trò.

Phát hiện **20 BUG, 9 DATA defects/observations, 7 GAP và 5 CONFLICT**. Trong BUG có 18 PROVEN và 2 HIGH-CONFIDENCE. Một số findings có cùng nguyên nhân, nên không cộng các nhóm thành số lỗi độc lập. DATA-008 về counter khuyến mãi là SUSPECTED, chưa đủ chứng minh corruption.

Các vấn đề ưu tiên: order cũ có tổng tiền âm; lệch giờ 7 tiếng; lifecycle thanh toán trên DB khác thiết kế; các thao tác sửa của Admin và tạo ghế Manager bị hỏng; mật khẩu dài do Admin tạo không đăng nhập được bằng mật khẩu gốc; view nhân số lượt đánh giá theo số suất chiếu.

BE **90/90**, FE **26/26**, lint và build PASS. Audit riêng: **123 PASS, 36 FAIL, 2 BLOCKED / 161 assertions** sau đối chiếu kỳ vọng. Hai BLOCKED do test ban đầu dùng suất vừa bị hủy; rerun trên suất mới đã PASS. Không tính các test này thành double booking.

45 UC: **7 PASS, 13 PARTIAL, 25 FAIL**. PASS chỉ áp dụng khi đủ bằng chứng cho luồng và negative case đã xác định. PARTIAL giữ các nhánh chưa kiểm đủ; không tuyên bố 45 UC hoàn chỉnh.

Không sửa source nghiệp vụ, migration hoặc object DB. 203 file baseline không đổi; 337 object DB không thêm/xóa, "modify_date" và định nghĩa sau bỏ khoảng trắng không đổi. Hai object có khác biệt indentation do export SQL ban đầu; đã ghi parser correction. Hai file báo cáo người dùng đã xóa trước audit vẫn được giữ nguyên trạng thái. [source-preservation.json](./evidence/source-preservation.json), [database-object-preservation.json](./evidence/database-object-preservation.json).

## 2. Environment

| Hạng mục | Kết quả |
| --- | --- |
| Workspace / shell | D:\DBMS_DO_AN / PowerShell |
| Git | main; HEAD 7c3562; sau rollback đang sau origin/main 1 commit |
| SQL instance | localhost:1433; server DESKTOP-E67DPCV |
| Database | CinemaBookingDB thật, có dữ liệu sẵn; không phải disposable clone |
| SQL / collation | 17.0.1000.7, Standard Developer Edition 64-bit; Vietnamese_CI_AS |
| Isolation | READ_COMMITTED_SNAPSHOT ON |
| Inspector | Windows DESKTOP-E67DPCV\Admin, sysadmin để đọc metadata/DBCC |
| Runtime user | CinemaAppUser / db_executor; không db_owner hoặc sysadmin |
| Backend | development; PORT 4000; dùng backend/.env |
| Frontend | Vite 5173; /api proxy đến localhost:4000 |
| Runtime | Node 24.21.0; Express 5.2.1; mssql 12.7.2; React 19.2.8; Vite 8.3.1 |
| Browser | Microsoft Edge headless, CDP 9223, profile audit riêng |

[live-environment.json](./evidence/live-environment.json), [environment-redacted.json](./evidence/environment-redacted.json), [browser-version.json](./evidence/browser-version.json). Password và JWT được che trong transcript. Server audit dùng "createApp" thật nhưng không bật global expire job, nhằm giữ các đơn cũ ngoài fixture. SP vẫn kiểm hạn giữ theo đồng hồ DB. Đồng hồ local của SQL và UTC chênh 7 giờ.

## 3. Current Scope

KH: 14, QLR: 9, CSKH: 6, Admin: 16 — tổng **45 UC**. Hình ảnh rạp là phần mở rộng ADM-07, không phải UC mới.

**ADM-17 ABSENT trong DB/SP/API/UI.** Actor overview §2.1 của thiết kế vẫn có “Cấu hình hệ thống”: đây là mục tài liệu lỗi thời. Các đoạn giải thích ADM-17 đã bị gỡ không được xem là regression. Actual database có 26 bảng sau extension ảnh rạp; phần kiến trúc cũ nói 25 bảng còn ERD nói 26.

## 4. Traceability Matrix

[TRACEABILITY_45_UC](./TRACEABILITY_45_UC.md) có đủ 45 dòng: yêu cầu → FE → API → SP → dependency → DB/BE/FE/INT/STATUS.

[API_MATRIX](./API_MATRIX.md) liệt kê 118 route, guard, controller, validator, service và SP. [MODULE_AUDIT](./MODULE_AUDIT.md) có params, callers, dependencies, transaction, locks và THROW của tất cả module. [DATABASE_INVENTORY](./DATABASE_INVENTORY.md) chứa columns, PK/FK, CHECK, DEFAULT và indexes.

Trạng thái DB cuối của fixture: [fixture-final-tickets.json](./evidence/fixture-final-tickets.json), [fixture-final-payments.json](./evidence/fixture-final-payments.json), [fixture-final-complaints.json](./evidence/fixture-final-complaints.json), [fixture-final-covers.json](./evidence/fixture-final-covers.json). Các object gián tiếp cần được đọc theo dependency graph; INT=VERIFIED không đồng nghĩa mọi nhánh trong UC đều PASS.

## 5. Database Inventory

| Object | Count |
| --- | --- |
| Tables | 26 |
| Columns | 169 |
| Primary keys | 26 |
| Foreign keys | 30 |
| UNIQUE constraints | 10 |
| CHECK constraints | 55 |
| DEFAULT constraints | 36 |
| Indexes, gồm PK/UQ | 61 |
| Views | 6 |
| Functions | 17 |
| Triggers | 7 |
| Stored procedures | 124 |
| Schemas | 13 |

Metadata lấy từ "sys.objects", "sys.sql_modules", "sys.parameters", constraints, indexes và security catalogs. FK/CHECK inspected đều enabled/trusted; không có index disabled. Runtime user chỉ có role thực thi SP và DENY table DML/read; ownership chain cho phép SP truy cập bảng. Inspector đặc quyền và account ứng dụng được phân biệt rõ.

## 6. Source vs Deployed DB

Source replay cuối: 148 module; live: 154. Kết quả normalization: **113 MATCH, 35 DIFFERENT, 6 DB_ONLY, 0 SOURCE_ONLY**. [module-drift.json](./evidence/module-drift.json).

DB-only: "fn_BayGio", "fn_HomNay", "fn_GheCoVeHieuLucSuatTuongLai", "sp_Clock_GetNow", "sp_Showtime_ValidateTimes", "sp_Showtime_CancelCascade". DONDATVE live có thêm LyDoHuy/ThongBaoHuy. Nhiều definitions/defaults dùng đồng hồ mới; header tham chiếu migrations 014/015, trong khi source deploy dừng ở 013.

Git rollback không rollback SQL Server. [CONFLICT-003](./FINDINGS.md#conflict-003) là drift có bằng chứng. Migration 007 cố ý không tồn tại, không phải lỗi numbering. Không có migration ledger để khẳng định thứ tự apply chỉ từ tên file.

Đã đọc dependency và thứ tự deploy, tính additive của migrations ảnh. **Fresh install, upgrade và re-run toàn bộ trên clone: NOT VERIFIED.** Không redeploy vào database đang dùng. Các guard sửa lịch/ghế lịch sử của source và live khác nhau phải được xét trước task triển khai riêng.

## 7. Schema Audit

Entities và các quan hệ n-n được tách rõ; giá vé, đồ ăn và tổng đơn là snapshot có chủ đích. PK/FK không có orphan trong scans. Unique keys không có nhóm trùng trong baseline.

CHECK từng cột chưa đủ bảo vệ discount <= subtotal, ngày sinh tương lai, hồ sơ khách hàng bắt buộc và assignment identity. DECIMAL(18,2) được dùng cho tiền. Validation BE có mismatch giữa tên 255 ký tự và SQL parameter 100/150; một số số nguyên được validate bằng “positive” nên chấp nhận phân số.

DELETE rạp/phòng/ghế/sản phẩm có dependencies được guard. Đã thử DELETE trên fixture có lịch sử: 409; fixture mới rỗng được DELETE qua API. Không xóa dữ liệu cũ.

## 8. Current Data Audit

Baseline trước fixture: [live-rowcounts.json](./evidence/live-rowcounts.json), [data-scan-summary.json](./evidence/data-scan-summary.json). 30 FK orphan probes = 0; unique-index duplicate groups = 0. Active seat duplicate, wrong-room ticket, showtime overlap, payment amount/state mismatch, complaint owner/history mismatch, assignment sai role, pricing overlap và required text blank đều = 0 trong scan.

Findings: order 20 có tổng −40.000; orders 26/27/28 paid nhưng show 34 đã hủy; 15 show ngắn hơn phim; 4 show ngoài thời gian phát hành; user 17 có ngày sinh 2999; 6 show đã kết thúc vẫn Mở bán. Counter của 3 promo khác số đơn còn lưu, nhưng seed/history chưa đủ để xác định corrupt.

Query cuối còn phát hiện missing profile của user 21 ngoài manifest và user 34 do reproduction; assignment duplicate gồm một nhóm cũ đã hủy và nhóm active mới 13/14. [DATA-001..009](./FINDINGS.md#data-001) có ID, condition, source confidence và remediation đề xuất.

"DBCC CHECKDB" và "CHECKCONSTRAINTS" exit 0; 55 predicate scans không vi phạm constraint. [dbcc-health.txt](./evidence/dbcc-health.txt). Kết quả này kiểm tra physical/declared integrity, không chứng nhận nghiệp vụ đúng.

## 9. Cinema Image Audit

HINHANH_RAPCHIEUPHIM có identity PK, FK RapID, URL NVARCHAR(500) không rỗng, mô tả nullable, cover BIT, thứ tự INT >= 0, status Hoạt động/Tạm ẩn và createdAt. Unique filtered index trên RapID khi cover=1 bảo đảm tối đa một cover. Lookup index theo RapID/status/order/ID; ordering public dùng order rồi ID.

Baseline ảnh = 0 nên các check baseline còn ít ý nghĩa. Đã tạo 3 ảnh thật: 12 request setCover đồng thời đều 200, cuối cùng 1 cover; ảnh bị ẩn không được setCover; sửa ảnh qua RapID sai trả 404; URL javascript trả 400.

Public cinema list trả một dòng/rạp bằng OUTER APPLY TOP 1. Gallery API trả dữ liệu thật. Revenue **92.000 không đổi khi 3 → 2 ảnh active**, chứng minh trên giá trị khác 0. [integration-transcript.json](./evidence/integration-transcript.json), [supplemental-transcript.json](./evidence/supplemental-transcript.json), [fixture-final-covers.json](./evidence/fixture-final-covers.json).

Browser cover và fallback PASS; gallery public UI MISSING. Admin image update UI FAIL vì payload cover ngoài contract. Không thấy N+1 cover request trong FE; list đã trả cover URL. Mixed Create/Update/Delete/SetCover stress và deadlock rate: **NOT VERIFIED**.

## 10. Stored Procedure Audit

[MODULE_AUDIT](./MODULE_AUDIT.md) bao phủ 124 SP live. Capture 110 service methods / 118 RPC contracts không có unknown input/output name. Đây là stub contract inspection; không được tính thành real DB test. [backend-sp-contract-capture.json](./evidence/backend-sp-contract-capture.json).

Booking lấy giá từ DB, khóa account → showtime → seats, hỗ trợ transaction/savepoint; giới hạn 10 ghế, 10 sản phẩm mỗi dòng và 3 đơn đang giữ. Sai ghế rollback; sản phẩm không tồn tại bị bỏ qua là BUG-016. Payment hỗ trợ nhiều lần thử và callback idempotent nhưng late callback/lifecycle sai thiết kế. Complaint append/history có identity, transaction và scope checks. Admin missing-resource và duplicate assignment còn lỗi.

Inventory đánh dấu 9 SP “POSSIBLY DEAD”, gồm helper và alias cũ. Không có app caller chưa đủ kết luận dead vì docs/tests hoặc compatibility có thể gọi. Không xóa. Resultset/DTO đã đối chiếu ở các API chạy thật; không execute mọi optional/null/error branch của tất cả SP.

## 11. View / Function / Trigger Audit

Đã inventory/đọc 6 views, 17 functions và 7 triggers. "vw_ThongKePhim" nhân COUNT review theo số show: phim 1 có 2 review nhưng view đếm 34; phim audit 14 có 1 review nhưng API đếm 6. [BUG-018](./FINDINGS.md#bug-018), [movie-review-count-multiplication.json](./evidence/movie-review-count-multiplication.json).

Revenue views/SP aggregate order/payment trước join rạp và không join ảnh. Order views giữ snapshot và derive expiry theo clock. Pricing functions cộng phụ thu, có weekend rule và cap 99%; source 013 xử lý DATEFIRST. Toàn bộ DATEFIRST/rounding matrix chưa chạy trong audit này.

Triggers ghế/suất/review/role dùng INSERTED/EXISTS. Đã chạy booking nhiều ghế; chưa chạy mọi multi-row failure. Trigger cập nhật complaint status có thể không xác định nếu một statement thêm nhiều histories cùng complaint; SP hiện tại thêm một row/statement. Đây là **SUSPECTED**, chưa chứng minh reachable qua API. Bulk fixture bằng direct INSERT không được phép nên không dùng để chứng minh.

## 12. Transaction Audit

Booking/payment/images/complaints có TRY/CATCH, transaction ownership và savepoint. Multi-seat loser không sinh đơn/vé một phần; callback trùng không đổi lịch sử các attempts thất bại. Final ticket/payment/history đã chụp.

SP một statement không nhất thiết cần BEGIN TRAN. Role-permission replacement, movie genres/cast đã đọc tính atomic và chạy positive qua API. Forced mid-transaction failure, nested caller savepoint, XACT_STATE và deadlock retry: **NOT VERIFIED**. Không sửa SP hoặc inject lỗi vào object production. Cancellation có transaction nhưng vẫn có rule/history conflict.

## 13. Concurrency Audit

| Hạng mục | Kết quả |
| --- | --- |
| Booking một ghế | PASS: 1×201 + 1×409 SEAT_CONFLICT trên suất mới |
| Booking nhiều ghế giao nhau | PASS: một atomic winner, một conflict |
| Promo lượt cuối cùng suất | PASS: chỉ một order được giảm; order còn lại full-price theo KH-09 |
| Promo lượt cuối khác suất | PASS quan sát: hai order, chỉ một giảm; khóa SELECT ngắn trên own promo |
| Payment callback trùng | PASS: hai 200; attempts thất bại được giữ |
| Complaint append | PASS: hai POST 201, đủ histories và trạng thái cuối |
| Assignment giống nhau | FAIL: hai POST 200, hai dòng — BUG-017 |
| Cinema cover | PASS: 12 request, một cover cuối |
| Showtime overlap hai phiên | PASS: SP phiên đầu chưa commit, API phiên sau 409; một row cuối |
| Pricing overlap | PASS negative 409; race writers riêng chưa chạy |
| Heavy load / deadlock rate | NOT VERIFIED; không suy rộng từ hai phiên |

[supplemental-checks.json](./evidence/supplemental-checks.json), [promotion-race-checks.json](./evidence/promotion-race-checks.json), [showtime-race-checks.json](./evidence/showtime-race-checks.json), [additional-checks.json](./evidence/additional-checks.json). SQL fixture được tạo qua official SP, không direct INSERT. Không đổi clock. Những lỗi setup harness đã được giữ và đối chiếu; không tính skip thành PASS.

## 14. Backend Architecture Audit

Route → controller → validator → service → procedure client rõ. Procedure names dùng whitelist; parameter typed; không lấy tên SP từ request. Không có production "query()"/"batch()" trong backend src. [raw-sql-manual-review.json](./evidence/raw-sql-manual-review.json).

Root noSQL scanner FAIL với false positives trong regex error parser, thông báo tiếng Anh và test assertions. Đã phân biệt scanner lỗi với việc backend chạy raw SQL. [no-sql.txt](./evidence/no-sql.txt).

Pool dùng chung max 10/min 0/idle 30s, reset khi connect thất bại; shutdown/close được đọc source. Express handlers chuyển lỗi qua next; Helmet/CORS có cấu hình. Logger quan sát không lộ password/JWT/full body. 500 message generic nhưng code kỹ thuật còn lộ; 503 dùng raw err.message có rủi ro lộ host/login theo source, **SUSPECTED**, không tắt DB để thử.

## 15. API / Auth / RBAC Audit

Auth không đưa bcrypt hash vào DTO. Role boundaries trả 401/403; sai password 401; token cũ của account bị khóa trả 401. Unknown authority/price fields bị chặn.

Customer endpoints chỉ authenticate + requireCustomer, thiếu functional permission guard: BUG-019 HIGH-CONFIDENCE. FE chặn portal bằng một quyền đại diện: BUG-020. Không thay seeded role permissions vì ảnh hưởng người dùng khác. Full real DB permission-revocation matrix **NOT VERIFIED**; own custom role/permission đã được tạo, grant, clear, update và delete qua API.

Runtime DB account thực thi SP toàn schema; nhiều Admin SP không nhận actor ID. Vì vậy HTTP guards là lớp authority quan trọng; chưa có DB RBAC barrier cho mọi operation. Không gọi đây là HTTP privilege escalation đã chứng minh. Partial grants/Admin bypass cần policy thống nhất: CONFLICT-005.

## 16. Manager Scope Audit

Manager 28 được phân công rạp 40. Foreign room/showtime/pricing/dashboard/revenue và foreign write trả 403; foreign-room seat list cũng 403. RapID được derive từ resource ở SP thay vì tin client.

Future assignment của manager 29/rạp 41 chưa cho access; revoke own assignment làm token cũ bị từ chối; khóa own manager làm token cũ 401. Đã khôi phục đúng fixture trước khi kết thúc. Wrong-role assignment khách hàng trả 400. Không chứng minh scope bypass trong probes.

Boundary ngày kết thúc toàn ma trận chưa chạy; source dùng end DATE inclusive. Assignment duplicate vẫn xảy ra. Manager UI thiếu sửa suất, sửa metadata phòng/ghế, cấu hình đủ bảng giá và filter doanh thu.

## 17. Admin Global Audit

16 họ API đọc Admin trả 200. Đã tạo resource ở cả hai rạp qua API mà không cần Manager assignment. Movie/cast, room/seat, product/promo/pricing/showtime, staff, role/permission và assignment có fixture thật.

Giá lịch sử được giữ sau đổi cấu hình. DELETE dependencies trả 409; DELETE fixture mới rỗng hoạt động. Browser xác nhận 9 status forms rỗng, sửa role không lưu, clear permission và image update lỗi. Genre/permission CRUD qua browser PASS; report date filter đã chạy. Không gọi toàn Admin E2E PASS.

Long password, customer role thiếu profile, missing cinema 200/null và lifecycle cancel paid show là lỗi đã tái hiện. Các form sửa hỏng có thể ngăn hoàn tất các nhánh UC tương ứng; kết quả được ghi FAIL.

## 18. Customer Ownership Audit

Customer B không xem/tạo payment/ghi result order của người khác; API trả 404. Complaint tham chiếu order người khác và complaint detail người khác cũng 404; NULL reference được hỗ trợ.

Booking userId/role/total spoof bị chặn 400. Payment SP không nhận user ID nhưng service kiểm ownership bằng order-detail trước và kiểm attempt thuộc order. Không có API transfer owner; chưa chứng minh TOCTOU exploit.

**Cross-customer access: NO trong các probes đã thử**, không phải chứng nhận penetration exhaustive. Account status/assignments được đọc lại từ DB cho token cũ. Permission revocation của seeded role còn NOT VERIFIED.

## 19. Frontend Functional Audit

Public catalog/cinema/booking, auth/profile, customer order/payment/complaint, Manager/Support/Admin routes đã đọc và chạy các luồng chính. "/customer" còn placeholder, còn flow khách thật đi qua /orders; không có mock booking data dùng trong main flow.

API client dùng fetch/Bearer/sessionStorage, xử lý 401/403 và AbortSignal. Catalog có loading/empty/error, poster/cover fallback. Các test FE chủ yếu SSR/source assertions nên không đủ chứng minh mutation correctness.

Các lỗi chính: BUG-004..008/020 và GAP-001..006. Internal mutations thiếu busy guard ở một số form; duplicate click/stale response là rủi ro theo source, chưa gọi là dữ liệu nhân đôi ngoài assignment race đã chứng minh. Visual polish ngoài phạm vi.

## 20. Full E2E Results

| Hạng mục | Kết quả |
| --- | --- |
| Customer | Browser register → login → profile → movie/seat → booking → payment → history/detail; thêm food/promo, complaint và review sau giờ bắt đầu. Overall còn FAIL/PARTIAL. |
| Manager | API room/seat/show/pricing/dashboard/revenue và negative scope có dữ liệu thật. Browser tạo ghế FAIL; sửa suất/filter doanh thu thiếu. |
| CSKH | Browser queue/detail/append processing thật; API concurrent append/status/null-reference. UI đơn tham chiếu thiếu dữ liệu. |
| Admin | Browser bug reproductions, genre/permission CRUD, report filter; API fixture/read toàn module. Nhiều edit flows FAIL. |

Snapshots PNG/text/network nằm tại [EVIDENCE_INDEX](./EVIDENCE_INDEX.md). Browser gọi Vite → Express → CinemaBookingDB thật. Chưa chạy exhaustive mọi CRUD boundary của 45 UC; final matrix giữ PARTIAL cho các nhánh thiếu bằng chứng.

## 21. Cross-Module Results

| Hạng mục | Kết quả |
| --- | --- |
| CinemaImage ↔ Cinema | PASS cover/fallback, không nhân dòng |
| CinemaImage ↔ Revenue | PASS: 92.000 không đổi khi số ảnh active đổi |
| CinemaImage ↔ Showtime/Rooms | PARTIAL: source không join ảnh; chưa stress mọi tổ hợp |
| Seat ↔ Booking | PASS các probes conflict/wrong room/multi-seat/limits |
| Pricing ↔ Ticket | PASS giá vé cũ 85.000 giữ sau đổi phụ thu |
| Product ↔ Order | ISSUES: snapshot cũ giữ, unknown product bị bỏ |
| Promotion ↔ Booking | PARTIAL: snapshot/last-use/cap có evidence; time/counter lineage còn vấn đề |
| Payment ↔ Order | ISSUES late callback và cancel/refund conflict |
| Complaint ↔ Order | PASS own/NULL/foreign denied; UI Support còn gap |
| Complaint ↔ Support | PASS append/history probes; multi-row cùng parent chưa thử |
| Admin ↔ Manager | PARTIAL: global/scope đúng trong probes; nhiều edit hỏng |
| Assignment ↔ Scope | ISSUES duplicate; revoke/future scope hoạt động |
| RBAC ↔ APIs | ISSUES/HIGH-CONFIDENCE: functional customer guard thiếu |


## 22. Security Findings

BUG-014, BUG-019/020, CONFLICT-005 nằm trong [FINDINGS](./FINDINGS.md). Không chứng minh P0 cross-account hoặc privilege escalation.

Trong probes: cross-customer NO; cross-cinema Manager NO; non-Admin Admin API NO; non-CSKH Support write NO; role/userId/price spoof NO; procedure injection NO; raw SQL backend NO. Sensitive leak: không thấy trong response/log đã kiểm; raw 503 message là SUSPECTED. Full permission-revocation test còn NOT VERIFIED.

## 23. Data Integrity Findings

[DATA-001..009](./FINDINGS.md#data-001) phân biệt dữ liệu cũ và fixture. Duplicate active-seat NO; showtime overlap NO; invalid order total YES; payment amount mismatch NO; complaint owner/history mismatch NO; wrong-role assignment NO; duplicate assignment YES; image orphan NO; multiple covers NO; image revenue multiplication NO; các FK orphan khác NO trong scans.

Snapshot price sau đổi pricing/product/promo không bị thay. **Payment history bị đổi khi cancel own paid show: YES**, CONFLICT-001. NO chỉ áp dụng phạm vi đã thử, không phủ định các nhánh chưa execute.

## 24. Functional Gaps

GAP-001..007: Manager showtime edit thiếu; edit metadata phòng/ghế thiếu; bảng giá thiếu trường và sửa phụ thu; revenue date filter thiếu; Support order reference thiếu details; public gallery UI thiếu; regression coverage chưa đủ. Mỗi gap có DB/BE/FE/INT và impact trong [FINDINGS](./FINDINGS.md#gap-001).

## 25. Business Rule Conflicts

CONFLICT-001..005: no-refund vs live cancel cascade; late callback vs rejection; source 013 vs DB 014/015; 45 UC vs actor item lỗi thời; permission policy khác giữa DB/BE/FE. Mỗi conflict ghi behavior từng tầng và rule hiện hành đề xuất. Không tự áp policy mới.

## 26. Performance Risks

11 estimated execution plans đã lấy; không execute write. Trong mẫu có 0 missing-index groups và 9 PlanAffectingConvert warnings ở movie list/seat map/order detail. [query-plan-summary.json](./evidence/query-plan-summary.json).

Scans trên dữ liệu nhỏ không tự xem là lỗi. FORMAT/scalar UDF/correlated subqueries, list chưa pagination, auth thường gọi 2–3 SP/request và pool max 10 là các điểm cần benchmark. Revenue date filters sau aggregate và complaint latest-history subqueries cần kiểm IO với dữ liệu lớn.

Cover không gây N+1 request public. Actual plans, IO/TIME, 100+ sessions, lock escalation và deadlock rate: **NOT VERIFIED**. Không thêm index hoặc kết luận performance PASS.

## 27. Test Gaps

| Hạng mục | Kết quả |
| --- | --- |
| Backend npm test | 90 PASS, 0 FAIL, 0 SKIP; phần lớn dùng stubs |
| Frontend npm test | 26 PASS, 0 FAIL, 0 SKIP; phần lớn SSR/source assertions |
| Frontend lint / build | PASS; 76 modules; JS 347,93 KB / gzip 102,84 KB |
| Root noSQL scanner | FAIL false positives; manual production query/batch calls = 0 |
| SQL suites 08..16 | SKIPPED 9 files: direct INSERT business fixtures và một số DDL không phù hợp audit-only |
| Existing stress/deploy suites | SKIPPED: yêu cầu disposable DB/cleanup; đang audit database thật |
| Custom audit | 161 assertions; 123 PASS, 36 FAIL, 2 BLOCKED |
| Harness corrections | Complaint POST đúng 201; promo fallback được tạo order; cancelled-show concurrency rerun riêng |
| Chưa kiểm đủ | Fresh deploy/re-run; whole RBAC grants; mọi multi-row failure; fault injection; heavy load; mọi CRUD boundary; race khác payment attempts |
| Harness blocker files | Giữ để audit trail; selector/setup errors đã được xử lý, không phải product findings |

[backend-tests.txt](./evidence/backend-tests.txt), [frontend-tests.txt](./evidence/frontend-tests.txt), [frontend-lint.txt](./evidence/frontend-lint.txt), [frontend-build.txt](./evidence/frontend-build.txt), [normalized-audit-checks.json](./evidence/normalized-audit-checks.json). Skip không được tính PASS. SQL suites không được chạy bằng cách vi phạm điều kiện tạo fixture qua API/SP.

## 28. Database Scorecard

| Hạng mục | Kết quả |
| --- | --- |
| Schema | PARTIAL |
| Data | ISSUES |
| PK/FK | PASS inspected |
| Constraints | PARTIAL business guards |
| Indexes | PARTIAL; load chưa đo |
| Views | ISSUES BUG-018 |
| Functions | PARTIAL |
| Triggers | PARTIAL multi-row coverage |
| Stored Procedures | ISSUES |
| Transactions | PARTIAL; probes atomic PASS |
| Concurrency | PARTIAL; assignment FAIL |
| RBAC | PARTIAL/ISSUES policy |
| Ownership | PASS probes |
| Manager Scope | PASS probes/PARTIAL date boundaries |
| Admin Global | PASS scope/ISSUES operations |
| Cinema Images | PARTIAL cross-layer |
| Migration Sync | ISSUES |
| Security | PARTIAL |
| Performance | NOT VERIFIED under load |


## 29. Backend Scorecard

| Hạng mục | Kết quả |
| --- | --- |
| Routing | PASS inventory/PARTIAL branches |
| Auth | ISSUES Admin password |
| RBAC / Permission | PARTIAL / ISSUES |
| Scope | PASS probes |
| Validation | ISSUES |
| Controllers | PARTIAL |
| Services | ISSUES semantic contracts |
| Procedure Client | PASS whitelist/typed execute |
| SP Mapping | PARTIAL: names PASS, semantics drift |
| DTO | PARTIAL/ISSUES time |
| Error Mapping | ISSUES |
| Transactions | PARTIAL, delegated to DB |
| No-SQL | PASS manual review |
| Security | PARTIAL |
| Logging | PASS observed/PARTIAL 503 risk |
| Connection Pool | PARTIAL; load NOT VERIFIED |
| Tests | PARTIAL despite 90 PASS |
| Real DB | VERIFIED paths; ISSUES |


## 30. Frontend Scorecard

| Hạng mục | Kết quả |
| --- | --- |
| 45 UC coverage | ISSUES |
| Routes / Navigation | PARTIAL |
| Auth / Role guards | PASS observed |
| Permission guards | ISSUES coarse area policy |
| API integration | ISSUES payload contracts |
| CRUD / Forms | ISSUES |
| Mutation refresh | PARTIAL |
| Loading / Empty / Errors | PARTIAL; not every runtime failure tested |
| 409 handling | PASS source/probes; browser races chưa đủ |
| Mocks | PASS: main flows use real API |
| Hardcoded IDs | Không dùng seeded business IDs tạo main flow; Admin yêu cầu nhập ID |
| Cinema images | ISSUES update/gallery |
| Tests | PARTIAL |
| Lint / Build | PASS |
| Visual polish | NOT PART OF AUDIT |


## 31. Cinema Image Scorecard

| Hạng mục | Kết quả |
| --- | --- |
| Table / FK RapID / No orphan | PASS inspected and fixtures |
| Cover uniqueness | PASS index + race |
| Display order | PASS schema/API; fractional edge chưa thử |
| Status | PASS |
| Admin CRUD | API PARTIAL; UI update FAIL |
| SetCover | PASS probes |
| Public cover | PASS browser |
| Gallery | API PASS / FE MISSING |
| No-image case | PASS fallback |
| No list duplication | PASS |
| No revenue multiplication | PASS nonzero test |
| No N+1 | PASS public cover flow |
| Real DB integration | VERIFIED paths |
| Mixed mutation stress | NOT VERIFIED |


## 32. 45 UC Final Status

| Status | Count |
| --- | --- |
| PASS | 7 |
| PARTIAL | 13 |
| FAIL | 25 |
| NOT VERIFIED | 0 |

| UC | DB | BE | FE | INT | STATUS |
| --- | --- | --- | --- | --- | --- |
| KH-01 | PARTIAL | PASS | PASS | VERIFIED | PARTIAL |
| KH-02 | PASS | PASS | PASS | VERIFIED | PASS |
| KH-03 | ISSUES | ISSUES | PARTIAL | VERIFIED | FAIL |
| KH-04 | ISSUES | ISSUES | PASS | VERIFIED | FAIL |
| KH-05 | ISSUES | ISSUES | ISSUES | VERIFIED | FAIL |
| KH-06 | PASS | PASS | PASS | VERIFIED | PASS |
| KH-07 | PARTIAL | ISSUES | PARTIAL | VERIFIED | FAIL |
| KH-08 | ISSUES | ISSUES | PASS | VERIFIED | FAIL |
| KH-09 | PARTIAL | PASS | PASS | VERIFIED | PARTIAL |
| KH-10 | ISSUES | ISSUES | PASS | VERIFIED | FAIL |
| KH-11 | PASS | PASS | PASS | VERIFIED | PASS |
| KH-12 | PARTIAL | PASS | PASS | VERIFIED | PARTIAL |
| KH-13 | PASS | PARTIAL | PASS | VERIFIED | PARTIAL |
| KH-14 | PASS | PARTIAL | PASS | VERIFIED | PARTIAL |
| QLR-01 | PASS | PASS | PASS | VERIFIED | PASS |
| QLR-02 | PASS | PASS | PARTIAL | VERIFIED | FAIL |
| QLR-03 | PARTIAL | PASS | ISSUES | VERIFIED | FAIL |
| QLR-04 | PASS | ISSUES | ISSUES | VERIFIED | FAIL |
| QLR-05 | PARTIAL | ISSUES | MISSING | VERIFIED | FAIL |
| QLR-06 | ISSUES | PARTIAL | PARTIAL | VERIFIED | FAIL |
| QLR-07 | PASS | PASS | PARTIAL | VERIFIED | FAIL |
| QLR-08 | PARTIAL | PASS | PASS | VERIFIED | PARTIAL |
| QLR-09 | PASS | PASS | MISSING | VERIFIED | FAIL |
| CSKH-01 | PASS | PASS | PASS | VERIFIED | PASS |
| CSKH-02 | PASS | PASS | PASS | VERIFIED | PARTIAL |
| CSKH-03 | PASS | PASS | PASS | VERIFIED | PARTIAL |
| CSKH-04 | PARTIAL | PARTIAL | PARTIAL | VERIFIED | FAIL |
| CSKH-05 | PASS | PASS | PASS | VERIFIED | PASS |
| CSKH-06 | PASS | PASS | PASS | VERIFIED | PARTIAL |
| ADM-01 | PASS | PASS | PASS | VERIFIED | PASS |
| ADM-02 | ISSUES | ISSUES | ISSUES | VERIFIED | FAIL |
| ADM-03 | PASS | PASS | ISSUES | VERIFIED | FAIL |
| ADM-04 | PASS | PASS | PASS | VERIFIED | PARTIAL |
| ADM-05 | PASS | PASS | ISSUES | VERIFIED | FAIL |
| ADM-06 | ISSUES | PASS | PARTIAL | VERIFIED | FAIL |
| ADM-07 | PARTIAL | ISSUES | ISSUES | VERIFIED | FAIL |
| ADM-08 | PARTIAL | ISSUES | ISSUES | VERIFIED | FAIL |
| ADM-09 | PARTIAL | PARTIAL | ISSUES | VERIFIED | FAIL |
| ADM-10 | PASS | PASS | PASS | VERIFIED | PARTIAL |
| ADM-11 | PASS | PARTIAL | ISSUES | VERIFIED | FAIL |
| ADM-12 | PARTIAL | ISSUES | ISSUES | VERIFIED | FAIL |
| ADM-13 | PASS | PASS | ISSUES | VERIFIED | FAIL |
| ADM-14 | ISSUES | ISSUES | ISSUES | VERIFIED | FAIL |
| ADM-15 | PASS | PASS | PARTIAL | VERIFIED | PARTIAL |
| ADM-16 | PASS | PASS | PASS | VERIFIED | PARTIAL |

Lý do từng dòng nằm trong [TRACEABILITY_45_UC](./TRACEABILITY_45_UC.md). NOT VERIFIED UC = 0 chỉ nghĩa mỗi UC có trace và ít nhất một nhánh integration liên quan; 13 UC vẫn PARTIAL vì thiếu nhánh/negative/boundary hoặc policy chưa thống nhất.

## 33. Critical Questions

| Hạng mục | Kết quả |
| --- | --- |
| Can two customers buy same seat? | NO trong race đã thử: một winner, một 409. Heavy load chưa kiểm. |
| Can Manager access foreign cinema? | NO trong read/write probes và revoke/future tests. |
| Can Customer access another order? | NO trong GET/payment/result/reference probes. |
| Can Client manipulate price? | NO: total spoof 400, DB tính giá. DATA-001 chưa chứng minh client exploit. |
| Can wrong role be assigned to cinema? | NO: customer assignment 400, baseline sai role = 0. |
| Can complaint reference another customer order? | NO: 404; NULL reference supported. |
| Can historical ticket price change? | NO sau đổi pricing/product/promo trong test; mọi history mutation chưa kiểm hết. |
| Can old payment history be overwritten? | YES: live cancel cascade đổi Thành công → Đã hoàn tiền, own order 36. |
| Can cinema have more than one cover? | NO: filtered unique index và race cuối 1 cover. Không có cover được phép. |
| Can cinema images duplicate revenue rows? | NO trong source và test nonzero 92.000. Review view có lỗi nhân đếm riêng. |
| Does any main frontend flow still use mock data? | NO found; browser dùng API/DB thật. |
| Does any Backend business flow execute raw SQL? | NO: production không query/batch, dùng execute whitelist. Audit SELECT không phải business flow. |


## 34. Prioritized Fix Plan

**FIX-P0:** DATA-001: giữ evidence, đối chiếu order 20 và lineage, lập remediation có review. Không tính lại lịch sử từ giá hiện tại. Chưa có P0 HTTP security/double-booking exploit được chứng minh.

**FIX-P1:** Chọn source/DB baseline; thống nhất timezone; chốt chính sách cancel/refund/late callback và bảo toàn payment history; sửa Manager seat UI, image update, Admin status forms, role edit và Admin password. Permission enforcement cần thêm real DB regression với role riêng.

**FIX-P2:** Đồng bộ enum/error mapping; validation int/length/future DOB; missing-resource 404; profile đầy đủ; unknown product phải báo lỗi; assignment uniqueness; review COUNT; permission UI và các GAP chức năng.

**FIX-P3:** Đồng bộ tài liệu 45 UC/ADM-17/phase, giải thích counter/history và stale status; sửa scanner false positives; bổ sung test fixture qua SP và cleanup có phạm vi. Performance changes chỉ sau đo actual plan/IO/load.

Mỗi fix cần regression FE → API → SP → final DB, negative/concurrency và cross-module như đề xuất trong [FINDINGS](./FINDINGS.md). **Không áp dụng fix trong task này.**

## 35. Final Verdict

**AUDIT FOUND ISSUES – FIX REQUIRED**

Có lỗi tái hiện trên DB/API/browser, dữ liệu tài chính cũ không hợp lệ và source/deployment drift. Môi trường thật chạy được; các giới hạn kiểm thử được công bố riêng. Test xanh không chứng minh 45 UC nhất quán.

Đã xuất report và dừng ở audit. Không commit/push, rollback DB, ALTER objects hoặc sửa source nghiệp vụ. Fixtures được giữ theo [manifest](./FIXTURE_MANIFEST.md) để review/reproduce trong task sửa riêng. Audit scripts có thao tác tạo fixture khi chạy và không phải tất cả đều idempotent; không rerun mù vào database đang dùng.

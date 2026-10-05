**R7 – Missing Feature Completion: PASS**

DB chính thức: CinemaBookingDB. Hai SP đã deploy nguyên tử với backup COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY. Dữ liệu 27 bảng, schema và quyền thực thi giữ nguyên. Ba DB fixture R7 đã xóa; inventory CinemaBookingDB* hiện chỉ còn DB chính thức.

1. **Audit trước/sau.** Source sau R1–R6 là căn cứ. Chi tiết trace FE → API → validator/controller/service → SP → DB/result → UI trong [GAP_AUDIT.json](GAP_AUDIT.json); baseline trước implement trong [main-before.json](evidence/main-before.json).

| GAP | Chức năng | Trước R7 | Sau R7 |
|---|---|---|---|
| GAP-001 | Manager sửa suất chiếu | PARTIAL | RESOLVED |
| GAP-002 | Manager sửa phòng/ghế | PARTIAL | RESOLVED |
| GAP-003 | Manager bảng giá đầy đủ | PARTIAL | RESOLVED |
| GAP-004 | Manager revenue date filter | PARTIAL | RESOLVED |
| GAP-005 | CSKH order reference đầy đủ | PARTIAL | RESOLVED |
| GAP-006 | Public cinema gallery | PARTIAL | RESOLVED |
| GAP-007 | Regression DB/browser/stress coverage | ALREADY_RESOLVED | RESOLVED |

2. **Root cause.** GAP-001: UI thiếu update dù API/SP đã có. GAP-002: chỉ toggle trạng thái, không sửa name/type. GAP-003: update contract chỉ có surcharge/status, UI thiếu dimensions/date. GAP-004: FE không gửi range có sẵn. GAP-005: SP thiếu tickets/food/payment/compensation detail, service trả raw row, UI đợi reference và chỉ hiện ID/status. GAP-006: API ảnh đủ nhưng chưa có detail/gallery. GAP-007: finding cũ đã được R3–R6 giải quyết bằng suite và evidence thật.

3. **FE changes.** ManagerPortal dùng ManagerResourceForm/managerForms, hydrate bản ghi, Save/Cancel, reload, filter status bảng giá và reset state khi đổi rạp/quyền; response scope cũ không ghi đè rạp hiện tại. ManagerRevenue có range/state riêng. SupportPortal dùng ComplaintOrderReference độc lập; complaint/timeline hiển thị ngay. Thêm CinemaDetail, CinemaGallery, link và route public /cinemas/:cinemaId; CSS gallery bổ sung giữ style hiện có. Partial grants không gọi API section bị thiếu quyền.

4. **BE/API changes.** Mở rộng pricingUpdate validator và service với typed SQL DATE/dimensions. Payload cũ surcharge/status vẫn hợp lệ. Support service dùng lại detailDto của orderService để trả DTO an toàn, map referenced-order missing thành 404. Giữ các routes hiện có, procedure-client execution và authorization; không thêm arbitrary order lookup.

5. **SQL objects.** Chỉ sửa sp_Manager_Pricing_Update và sp_Support_Complaint_GetOrderReference, không thêm module. Migration [r7_missing_features.sql](../../../database/13_migrations/r7_missing_features.sql) include hai source SP; dùng scripts/r7/deploy.mjs để apply trong transaction với preflight/backup/verify. Baseline manifest và verify_objects/verify_procedures cập nhật. Upgrade từ SP definitions R6 được capture, lỗi giữa migration rollback toàn bộ, apply lặp lại idempotent: [migration-upgrade.json](evidence/migration-upgrade.json). Main đã deploy: [main-deployment.json](evidence/main-deployment.json).

6. **Manager showtime contract.** PUT /api/manager/showtimes/:id nhận movieId, startsAt, endsAt, format, basePrice, status. startsAt/endsAt là UTC instants; hydrate datetime-local theo business timezone, bảo toàn milliseconds. roomId bất biến theo validator/SP hiện tại, UI hiển thị read-only; yêu cầu R7 chỉ cho phép đổi nếu nghiệp vụ có hỗ trợ. Hủy dùng endpoint cancel riêng; trạng thái Đã hủy không đi qua edit. QUAN_LY_RAP + QL_SUAT_CHIEU + active assignment; wrong scope 403, overlap/booked-history conflict 409, time/enum invalid 400, reload persist PASS.

7. **Room/seat contract.** PUT /manager/rooms/:id: name/type/status; PUT /manager/seats/:id: type/status. ID, room/cinema ownership bất biến. QL_PHONG và QL_GHE độc lập; room-only/seat-only grants, foreign scope 403, history conflict 409 đều PASS. UI save reload và cancel không mutation.

8. **Pricing contract.** Create: seatType/dayType/format/surcharge/startsOn/endsOn; trạng thái ban đầu Áp dụng theo SP hiện hữu. Update: toàn bộ các field đó + status; minimal surcharge/status giữ tương thích. Nếu update conditions thì gửi đủ seatType/dayType/format/startsOn, endsOn nullable cho open end. DATE_ONLY không timezone-convert. Giá cũ/booking snapshot không sửa; booking mới dùng fn_TinhGiaVe hiện tại. Scope QUAN_LY_RAP + QL_BANG_GIA + active assignment. Sửa thực tế mọi dimension, ngày, phụ thu và status; invalid range 400, overlap 409, foreign scope 403, missing 404, old/new booking snapshot PASS.

9. **Revenue contract.** GET /manager/cinemas/:id/revenue?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD. Có default, một ngày, khoảng ngày, reset, loading/empty/error/retry; từ ngày ≤ đến ngày. FE gửi nguyên DATE_ONLY, SP dùng business-date rules R1 hiện tại. Đối chiếu HTTP với kết quả DB cùng range PASS; wrong scope 403, invalid range 400 và local validation PASS.

10. **CSKH reference payload.** GET /support/complaints/:id/order-reference trả {order}, với order summary/status, user {id,name,email,phone}, movie/cinema/room/showtime, tickets[], products[], ticketTotal/productTotal/discountTotal/total, payments[] gồm mọi attempt, compensation {points,creditedAt} nullable, bookedAt/holdExpiresAt/show/payment timestamps và cancellation context. Không password/hash. Complaint không order trả order:null/message; complaint missing 404; đơn không thuộc khách không thể liên kết complaint, 404. CSKH/Admin + QL_KHIEUNAI + TRA_CUU_DON, cả QL-only và TRA-only DENY ở HTTP và direct SP. Payment history trước/sau reference và cancel giữ nguyên. UI reference loading/error/403/404 không chặn complaint/timeline.

11. **Gallery behavior.** Public API/SP active-only có sẵn giữ nguyên. FE cover đầu, sau đó displayOrder/id; caption và alt phù hợp, không có ảnh thì fallback. 0/1/nhiều ảnh, inactive không lộ, duy nhất cover theo DB contract, browser 360px/1280px không overflow đều PASS. Gallery là ảnh/figure tĩnh, không modal/upload/storage mới.

12. **GAP-007 coverage decision.** ALREADY_RESOLVED trước implement: reset, migration/source parity, backend/frontend/browser, permission/revocation, R1 timezone, R2 payment/cancellation/compensation, booking/pricing/image/assignment stress, HTTP smoke và main verify đã có. R7 tái chạy suite đó và bổ sung các test chức năng mới: backend/tests/r7-contract.test.js; frontend/tests/r7-contract.test.js; frontend/tests/r7-browser-fixtures.jsx; scripts/r7/integration.mjs, browser.mjs, migration-test.mjs. Không tạo business change cho finding coverage cũ.

13. **Test từng GAP.** [integration.json](evidence/integration.json): 80 HTTP requests, 18 DB/contract assertions. [browser.json](evidence/browser.json): 50 assertions trên trang React thật với HTTP fixtures, gồm hydrate/save/cancel/partial grants, late-response cinema switch, DATE_ONLY filter, complaint reference isolation và responsive gallery.

| GAP | HTTP requests | DB/contract checks | Kết quả |
|---|---:|---:|---|
| GAP-001 | 13 | 1 | PASS |
| GAP-002 | 18 | 2 | PASS |
| GAP-003 | 15 | 5 | PASS |
| GAP-004 | 5 | 1 | PASS |
| GAP-005 | 17 | 6 | PASS |
| GAP-006 | 7 | 3 | PASS |

Backend **112/112**, frontend **40/40**, build/lint, no-raw-SQL và procedure contracts **PASS**. Clean reset source fixture dùng npm run db:reset PASS; 159 module source parity PASS. Upgrade R6/failure rollback/idempotence PASS. [checks.json](evidence/checks.json), [fixture-reset.txt](evidence/fixture-reset.txt).

14. **Regression R1–R6.** R1 fixed clock + HTTP UTC/Asia_Ho_Chi_Minh/America_Los_Angeles + browser PASS. R2 SQL/HTTP/browser PASS: simulated payment, holds, cancellation, no refund, proportional promotion compensation và no double-credit giữ nguyên. R3 role/permission/scope/ownership/revocation/direct-SP/partial-grant/browser PASS; R4 functional/browser PASS; R5 validation/error/integrity/rollback PASS. Booking, pricing, image concurrency PASS; assignment 16 concurrent updates → 1 success/15 conflicts PASS. R6 historical fingerprint cả 27 bảng so main-final R6A khớp hoàn toàn; không chạy remediation dữ liệu. [regressions.json](evidence/regressions.json), [concurrency.json](evidence/concurrency.json), [r5/supplemental.json](evidence/r5/supplemental.json), [main-final.json](evidence/main-final.json).

Main verify/source parity **159 modules PASS**, main read-only HTTP smoke **31 requests PASS**. Hai check showtime detail/seats trên main được skip vì phim được chọn không có future showtimes; các luồng này đã chạy trên fixture, không sửa historical main để tạo test data. [main-verify.json](evidence/main-verify.json), [main-backend-smoke.json](evidence/main-backend-smoke.json).

15. **DB inventory trước/sau.**

| Loại | Trước | Sau |
|---|---:|---:|
| Tables | 27 | 27 |
| Stored procedures | 125 | 125 |
| Views | 6 | 6 |
| Functions | 21 | 21 |
| Triggers | 7 | 7 |
| Tổng modules | 159 | 159 |
| Indexes | 63 | 63 |
| Constraints | 161 | 161 |

Chỉ definitions hai SP dự kiến thay đổi; table data/schema/grants hashes giữ nguyên. DB fixture còn lại **0**: [cleanup.json](evidence/cleanup.json).

16. **Architecture.** Không thêm bảng, không DROP/recreate/reset main, không thêm raw SQL vào Backend, không ORM/query builder. Backend vẫn SP-only; no-raw-SQL audit và 120 registered service-call contracts PASS. SQL ngoài Backend chỉ ở database/scripts kiểm thử/deploy.

17. **Kết luận từng GAP.** GAP-001..006 **RESOLVED**, GAP-007 **RESOLVED (ALREADY_RESOLVED từ trước, đã tái xác nhận)**. Không có GAP PARTIAL/BLOCKED.

18. **R7 PASS.** Hoàn thiện đúng sáu phần chức năng thiếu, bảo toàn R1–R6, deploy main có backup và verify, DB/source parity PASS, không thêm bảng và đã xóa các fixture. Các evidence R1–R6 cũ được giữ; kết quả tái chạy R7 nằm riêng trong thư mục này.

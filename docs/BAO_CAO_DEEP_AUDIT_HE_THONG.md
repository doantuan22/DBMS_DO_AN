# Báo cáo Deep Audit hệ thống CinemaBookingDB

**Phạm vi:** Database, backend, frontend, business flow, data integrity và Cinema Image data model.  
**Phương thức:** Audit-only; không sửa source, migration hay database object.  
**Ngày audit:** 02/10/2026  
**Môi trường:** local development, database `CinemaBookingDB`.

## Kết luận

**AUDIT INCOMPLETE – TEST/ENVIRONMENT BLOCKERS**

Đã xác minh API thực tế trên `CinemaBookingDB`, chạy test backend/frontend, và tái lập được ba lỗi. Tuy nhiên, không thể hoàn tất inventory schema/object, scan orphan/data-quality, index/constraint/query-plan trên DB triển khai vì tài khoản ứng dụng chỉ có quyền `EXECUTE` và không xem được metadata.

Không có mã nguồn, migration, dữ liệu nghiệp vụ hay DB object nào bị thay đổi. Dữ liệu test `AUDIT_*` được tạo/xóa qua API; việc xóa được API xác nhận, còn đối soát trực tiếp trong bảng là **NOT VERIFIED** do giới hạn quyền.

## Kết quả kiểm chứng

- Backend test: **68/68 pass**.
- Frontend test: **19/19 pass**.
- Frontend lint/build: **PASS**.
- Kiểm tra raw business SQL backend: **PASS** (80 file).
- `/api/health`: **200**.
- Đăng nhập demo Admin, Manager, CSKH và Customer: **PASS**.
- Phân quyền thực tế:
  - Anonymous truy cập Admin: **401**.
  - Customer/Manager truy cập Admin: **403**.
  - Manager truy cập rạp ngoài phạm vi: **403**.
  - Customer truy cập order/complaint của người khác: **404**.
- Kiểm tra đồng thời đặt ảnh bìa rạp: hai request song song đều `200`, trạng thái cuối chỉ có **một ảnh bìa**: **PASS**.

## Findings

| ID | Mức độ | Trạng thái | Phát hiện |
|---|---:|---|---|
| BUG-001 | P1 / High | PROVEN | `GET /api/admin/cinemas` luôn trả `500`, làm hỏng trang quản trị rạp và chặn UI quản lý ảnh rạp. |
| BUG-002 | P1 / High | PROVEN | Có thể tạo ảnh rạp với `TrangThai=INVALID_AUDIT`; dữ liệu sai được lưu thành công. |
| BUG-003 | P2 / Medium | PROVEN | API tạo ảnh/đặt ảnh bìa trả response không đúng dữ liệu thực tế do stored procedure phát sinh result set trung gian. |
| DOC-001 | P2 / Medium | PROVEN | Tài liệu DB/deployment không đồng nhất với source và DB thực tế. |
| GAP-001 | P2 | PROVEN | UI quản lý ảnh rạp bị chặn bởi BUG-001. |
| GAP-002 | P2 | PROVEN | Thiếu test integration thật cho Admin Cinema List, response image mutation và domain `TrangThai`. |
| GAP-003 | P2 | NOT VERIFIED | Không thể audit toàn diện metadata/schema/data integrity DB triển khai với quyền hiện có. |

### BUG-001 — Admin Cinema List bị lỗi 500

**Reproduce**

1. Đăng nhập Admin.
2. Gọi `GET /api/admin/cinemas`.
3. Nhận `500`; các Admin GET khác như dashboard, users, rooms, pricing, showtimes, reports đều trả `200`.

**Nguyên nhân đối chiếu source**

`usp_Admin_Cinema_List` không nhận tham số, nhưng service vẫn bind `@ThanhPho`.

- `database/migrations/008_admin_global_portal.sql`, procedure `dbo.usp_Admin_Cinema_List`.
- `backend/src/services/adminService.js`, lời gọi `ADMIN_CINEMA_LIST`.

**Impact**

- ADM-07 không sử dụng được danh sách rạp.
- `CinemaImageManager` gọi API này khi mount, nên không thể chọn rạp để quản lý ảnh.
- Các chức năng ảnh tồn tại phía API/UI nhưng bị chặn trong luồng thực tế.

**Đề xuất sau audit**

Không bind tham số cho procedure không nhận tham số, hoặc bổ sung tham số tùy chọn thống nhất ở SQL/API; thêm integration test với DB thật.

### BUG-002 — `TrangThai` ảnh rạp không có domain bắt buộc

**Reproduce**

1. Tạo rạp test qua Admin API.
2. Tạo ảnh với `status: "INVALID_AUDIT"`.
3. API chấp nhận và danh sách ảnh trả lại đúng giá trị invalid.
4. Đã xóa ảnh và rạp test qua API.

**Nguyên nhân**

- Table ảnh rạp chỉ có default `N'Hoạt động'`, không có `CHECK` domain.
- Validator chỉ kiểm tra chuỗi không rỗng/tối đa 50 ký tự.

Tệp liên quan:

- `database/migrations/009_cinema_image_data_model.sql`.
- `backend/src/validators/adminValidator.js`.

**Impact**

Public gallery và logic cover chỉ coi chính xác `Hoạt động` là active. Một bản ghi status bất kỳ có thể được lưu nhưng không hiển thị/không thể dùng đúng kỳ vọng nghiệp vụ.

**Đề xuất sau audit**

Ràng buộc domain ở DB, validator whitelist cùng bộ giá trị, và UI dùng select thay vì text tự do; cần migration làm sạch dữ liệu cũ nếu có.

### BUG-003 — Response tạo ảnh/đặt cover không phản ánh record cuối

**Reproduce**

- Tạo ảnh thành công nhưng response trả `{"image":null}`; GET sau đó xác nhận ảnh đã tồn tại.
- Đặt cover cho hai ảnh hợp lệ: PATCH trả ID từ result set lock trung gian, còn GET sau đó cho thấy cover cuối khác response.
- Dữ liệu test đã được dọn qua API.

**Nguyên nhân**

Procedure emit `SELECT` lock trước result set DTO cuối; generic `adminService.write()` luôn lấy result set đầu tiên.

Tệp liên quan:

- `database/migrations/009_cinema_image_data_model.sql`.
- `backend/src/services/adminService.js`.

**Impact**

UI hiện refetch nên chưa thấy sai trạng thái ngay, nhưng API contract sai và consumer khác dễ dùng nhầm ID/dữ liệu.

**Đề xuất sau audit**

Ẩn/suppress result set lock hoặc chỉ định result set DTO chính xác trong service; bổ sung test response shape.

## Cinema Image model — Full impact audit

| Hạng mục | Kết quả |
|---|---|
| Migration 009 có trong source | PASS |
| API public `GET /api/cinemas/:id/images` | PASS |
| API Admin list ảnh rạp | PASS |
| Tạo/sửa/xóa/set-cover qua API | PARTIAL — persistence hoạt động, response mutation lỗi |
| Chỉ một cover trong concurrent update | PASS |
| Status domain | FAIL — BUG-002 |
| UI quản lý ảnh | FAIL/PARTIAL — bị BUG-001 chặn |
| Public cinema listing không nhân dòng vì image join | PASS ở source; runtime nhiều-ảnh/revenue regression: NOT VERIFIED |
| Public cinema detail gallery UI | N/A — hiện không có màn hình cinema detail riêng |
| DB deployed table/index/check/trigger inventory | NOT VERIFIED |

## Ma trận UC rút gọn

| Nhóm | UC | Kết quả |
|---|---|---|
| Customer | KH-01–03 | PARTIAL — login thực tế pass; đăng ký/cập nhật profile chưa test DB thật |
| Customer | KH-04–05 | PARTIAL — public cinema/list API pass; UI detail không có màn hình riêng |
| Customer | KH-06–10 | PARTIAL — source/unit test pass; booking/payment/concurrency thật chưa kiểm chứng |
| Customer | KH-11–12 | PASS/PARTIAL — list và ownership cross-user pass; toàn bộ mutation chưa test |
| Customer | KH-13 | PARTIAL — source/unit pass; chưa test DB thật |
| Customer | KH-14 | PARTIAL — list/ownership pass; create/update chưa test |
| Manager | QLR-01 | PASS — login, scope rạp được phân công, foreign scope bị 403 |
| Manager | QLR-02–07 | PARTIAL — source/test pass, mutation DB thật chưa test |
| Manager | QLR-08–09 | PASS — dashboard/revenue API thực tế pass |
| CSKH | CSKH-01–06 | PARTIAL — login/queue/detail/order pass; xử lý mutation chưa test |
| Admin | ADM-01 | PASS |
| Admin | ADM-02–06 | PARTIAL — list/read API pass; mutation chưa test đủ |
| Admin | ADM-07 | FAIL — BUG-001, BUG-002, BUG-003 |
| Admin | ADM-08–16 | PARTIAL — read API pass; mutation/edge cases chưa test đủ |
| Admin | ADM-17 | N/A — đã bị loại bỏ, không còn feature active |

## Source-level database review

- Mô hình source hiện có **26 bảng**: baseline 25 bảng và `HINH_ANH_RAP`.
- Có 6 views, 10 functions, 6 triggers.
- Procedure definitions: 95 baseline cùng migration overrides; 121 procedure names unique sau migration.
- Sáu trigger được review đều xử lý set-based `INSERTED`; không thấy anti-pattern chỉ xử lý một dòng trong multi-row statement.
- Booking/payment/complaint/showtime/image-cover có transaction/lock logic ở source.
- Hai procedure không thấy được backend whitelist tham chiếu: `sp_Manager_Seat_BatchCreate`, `sp_Order_Cancel`; chỉ nên coi là **possibly dead**, chưa đủ bằng chứng để xóa.

## Documentation / deployment drift

- `database/README.md` ghi baseline 25 tables / 94 procedures, không còn phản ánh model hiện tại.
- `database/phase9-admin-status.md` nói migration 009 pending, nhưng API thật của DB đã phục vụ cinema image endpoints.
- Đây là lệch traceability/deployment status, không phải bằng chứng migration chưa deploy.

## Các mục bắt buộc còn NOT VERIFIED

- Đếm chính xác object/schema/index/constraint trên DB triển khai.
- Orphan scan, duplicate scan, data-quality scan trên toàn bộ bảng.
- Query plan, index effectiveness, deadlock/lock timeout production-like.
- Booking/payment concurrency thật và kiểm tra chống price tampering qua DB.
- Toàn bộ mutation của 45 UC với data fixture độc lập.
- Browser E2E vì môi trường audit không có browser runner.

## Điều kiện để hoàn tất audit

Cần một tài khoản **read-only audit** trên `CinemaBookingDB` có quyền xem metadata và `SELECT` các bảng cần kiểm tra, cùng môi trường browser/E2E hoặc quyền chạy test runner tích hợp.

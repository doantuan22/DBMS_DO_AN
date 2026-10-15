# CHƯƠNG 2 — BIÊN BẢN KIỂM CHỨNG DATABASE

## Thông tin khảo sát

- **Database:** CinemaBookingDB, trùng database được chọn trong cấu hình runtime backend.
- **Thời điểm:** 15/10/2026 14:47:53 (Asia/Bangkok, UTC+07:00); metadata trả UTC 2026-10-15T07:47:53.952Z.
- **Phạm vi:** chỉ đọc metadata sys.tables, sys.schemas, sys.columns, sys.types, sys.identity_columns, sys.key_constraints, sys.foreign_keys, sys.foreign_key_columns, sys.check_constraints, sys.default_constraints, sys.indexes, sys.index_columns, sys.triggers, sys.objects, sys.sql_modules.
- **Bảo mật:** không ghi mật khẩu, connection string, access token, dữ liệu tài khoản/giao dịch.
- **An toàn:** không chạy seed/migration/INSERT/UPDATE/DELETE/ALTER/DROP/procedure nghiệp vụ hoặc truy vấn hàng dữ liệu.

## Số liệu metadata trực tiếp

| Hạng mục | Số lượng |
|---|---:|
| Bảng vật lý | 29 |
| Cột | 192 |
| Khóa chính | 29 |
| Unique constraint | 11 |
| Khóa ngoại | 37 |
| CHECK constraint | 65 |
| DEFAULT constraint | 42 |
| Chỉ mục ngoài PK/UQ constraint | 31 (gồm 5 unique index có điều kiện) |
| Trigger trên bảng | 9, đều bật |
| Stored procedure | 147 |
| View | 6 |
| Function | 21 |
| Tổng module SQL | 183 |
| Computed column | 0 |

37 FK và 65 CHECK đều bật/trusted; các bảng thuộc dbo.

## Danh sách bảng được mô tả

- **Tài khoản và phân quyền:** `VAITRO`, `QUYEN`, `VAITRO_QUYEN`, `NGUOIDUNG`, `HOSOKHACHHANG`, `PHANCONG_RAP`.
- **Rạp, phòng chiếu và ghế:** `RAPCHIEUPHIM`, `HINHANH_RAPCHIEUPHIM`, `PHONGCHIEU`, `GHE`.
- **Phim và danh mục:** `PHIM`, `THELOAI`, `DIENVIEN`, `PHIM_THELOAI`, `PHIM_DIENVIEN`.
- **Lịch chiếu và bảng giá:** `SUATCHIEU`, `BANGGIA`.
- **Đặt vé và thanh toán:** `DONDATVE`, `CHITIETVE`, `SANPHAM`, `CHITIETDOAN`, `KHUYENMAI`, `THANHTOAN`, `BOITHUONG_HUYSUAT`.
- **Đánh giá và khiếu nại:** `DANHGIAPHIM`, `KHIEUNAI`, `TINNHAN_KHIEUNAI`, `XULY_KHIEUNAI`, `YEUCAU_CHUYENCAP`.

Danh sách bao phủ 29/29 bảng SQL Server và trùng các tiêu đề mục 2.3.

## Đối chiếu Database–repository

- Tên database runtime được so với DB_DATABASE đọc nội bộ; giá trị bí mật không xuất ra.
- So sánh 29 định nghĩa bảng với metadata: không có khác biệt tên bảng, số/thứ tự/tên cột, kiểu/dimension, NULL hay IDENTITY.
- Inventory source/runtime khớp 183/183 module: 147 procedure, 6 view, 21 function, 9 trigger; không có module thừa/thiếu. Định nghĩa module sau chuẩn hóa GO, header SET và comment khớp.
- Tên 184 constraint trong source khớp inventory runtime; 31 index source khớp index ngoài PK/UQ constraint.
- Database có DONDATVE.DiemSuDung và không có DONDATVE.TienGiamBangDiem, phù hợp schema/module hiện hành và migration source 20261014_points_payment.sql. Migration chỉ được đọc, không chạy.

## Điểm lệch tài liệu và phần chưa xác minh

README.md/database/README.md còn ghi 27 bảng, 169 module và 8 trigger. Source SQL hiện hành và SQL Server cùng khớp ở 29 bảng, 183 module, 9 trigger; số README được xem là cũ, không phải sai lệch cấu trúc source–database.

Không đọc hàng dữ liệu nên không xác nhận số bản ghi, chất lượng giá trị, seed hay luồng đang chạy. Không đọc database principal/GRANT runtime; Chương 2 chỉ mô tả RBAC ứng dụng và procedure/function trong source. Cardinality được suy từ NULL, unique key, FK, trigger và procedure.

## Nguồn tham chiếu

- Runtime config logic: [env.js](../../backend/src/config/env.js), [database.js](../../backend/src/config/database.js), [pool.js](../../backend/src/db/pool.js).
- Bảng: database/02_tables/*.sql; constraints: database/03_constraints/*.sql; index: database/04_indexes/*.sql.
- Modules: database/05_functions/, database/06_views/, database/07_triggers/, database/08_procedures/.
- Migration chỉ đọc: [20261014_points_payment.sql](../../database/13_migrations/20261014_points_payment.sql).
- Backend: [procedures.js](../../backend/src/db/procedures.js), [procedureClient.js](../../backend/src/db/procedureClient.js), [bookingService.js](../../backend/src/services/bookingService.js), [orderService.js](../../backend/src/services/orderService.js), [supportService.js](../../backend/src/services/supportService.js).
- README đối chiếu: [README.md](../../README.md), [database/README.md](../../database/README.md).

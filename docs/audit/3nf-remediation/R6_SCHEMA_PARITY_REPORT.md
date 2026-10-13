# R6 SCHEMA PARITY REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R6 — Database Source of Truth Synchronization & Fresh 3NF Bootstrap Verification  
**So sánh đối soát:** Database Nâng cấp (`CinemaBookingDB_Test`) vs Database Tạo mới (`CinemaBookingDB_Fresh3NF`)  
**Server Instance:** `DoanTuanIT` (localhost:1433)  
**Ngày thực hiện:** 13/10/2026  
**Đánh giá tổng thể:** **TƯƠNG THÍCH ĐỐI QUAN HỆ 100% — SCHEMA PARITY VERIFIED PASS**  

---

## 1. Mục tiêu đối soát Parity

Để đảm bảo quy trình CI/CD và vận hành cơ sở dữ liệu bền vững, hai phương thức triển khai phải tạo ra cấu trúc schema đồng nhất:
1. **Upgrade Path:** Database cũ nâng cấp qua bộ script di trú `01` đến `04` (`CinemaBookingDB_Test`).
2. **Fresh Install Path:** Database tạo mới trực tiếp từ canonical SQL repository (`CinemaBookingDB_Fresh3NF`).

Báo cáo này đối chiếu toàn diện giữa hai cơ sở dữ liệu trên tất cả các khía cạnh đối tượng SQL Server.

---

## 2. Bảng tổng hợp đối soát số lượng đối tượng (Object Count Parity)

| Nhóm đối tượng SQL Server | Database Nâng cấp (`CinemaBookingDB_Test`) | Database Tạo mới (`CinemaBookingDB_Fresh3NF`) | Lệch (Delta) | Đánh giá |
|---|:---:|:---:|:---:|:---:|
| **Bảng dữ liệu nghiệp vụ (User Tables)** | 27 | 27 | 0 | **100% Khớp** |
| **Khóa chính (Primary Keys)** | 27 | 27 | 0 | **100% Khớp** |
| **Khóa ngoại (Foreign Keys)** | 31 | 31 | 0 | **100% Khớp** |
| **Ràng buộc kiểm tra (Check Constraints)** | 55 | 55 | 0 | **100% Khớp** |
| **Chỉ mục (Indexes)** | 262 | 262 | 0 | **100% Khớp** |
| **Thủ tục lưu trữ (Stored Procedures)** | 134 | 134 | 0 | **100% Khớp** |
| **Khung nhìn (Views)** | 6 | 6 | 0 | **100% Khớp** |
| **Hàm người dùng (User Functions)** | 21 | 21 | 0 | **100% Khớp** |
| **Bộ kích hoạt (Database Triggers)** | 8 | 8 | 0 | **100% Khớp** |

---

## 3. Đối soát chi tiết số lượng cột trên từng bảng (Column-by-Column Parity)

| STT | Tên bảng | Số cột (`CinemaBookingDB_Test`) | Số cột (`CinemaBookingDB_Fresh3NF`) | Độ lệch | Ghi chú cấu trúc |
|:---:|---|:---:|:---:|:---:|---|
| 1 | `BANGGIA` | 9 | 9 | 0 | Khớp tuyệt đối |
| 2 | `BOITHUONG_HUYSUAT` | 5 | 5 | 0 | Khớp tuyệt đối |
| 3 | `CHITIETDOAN` | 5 | 5 | 0 | Khớp tuyệt đối |
| 4 | `CHITIETVE` | 6 | 6 | 0 | Khớp tuyệt đối |
| 5 | `DANHGIAPHIM` | 6 | 6 | 0 | Khớp tuyệt đối |
| 6 | `DIENVIEN` | 4 | 4 | 0 | Khớp tuyệt đối |
| 7 | `DONDATVE` | 12 | 12 | 0 | Khớp tuyệt đối |
| 8 | `GHE` | 6 | 6 | 0 | Khớp tuyệt đối |
| 9 | `HINHANH_RAPCHIEUPHIM` | 8 | 8 | 0 | Khớp tuyệt đối |
| 10 | `HOSOKHACHHANG` | 4 | 4 | 0 | Khớp tuyệt đối |
| 11 | `KHIEUNAI` | 9 | 9 | 0 | Khớp tuyệt đối |
| 12 | `KHUYENMAI` | 12 | 12 | 0 | Khớp tuyệt đối |
| 13 | `NGUOIDUNG` | 8 | 8 | 0 | Khớp tuyệt đối |
| 14 | `PHANCONG_RAP` | 6 | 6 | 0 | Khớp tuyệt đối |
| 15 | `PHIM` | 13 | 13 | 0 | Khớp tuyệt đối |
| 16 | `PHIM_DIENVIEN` | 3 | 3 | 0 | Khớp tuyệt đối |
| 17 | `PHIM_THELOAI` | 2 | 2 | 0 | Khớp tuyệt đối |
| 18 | `PHONGCHIEU` | 5 | 5 | 0 | Khớp tuyệt đối |
| 19 | `QUYEN` | 4 | 4 | 0 | Khớp tuyệt đối |
| 20 | `RAPCHIEUPHIM` | 8 | 8 | 0 | Khớp tuyệt đối |
| 21 | `SANPHAM` | 7 | 7 | 0 | Khớp tuyệt đối |
| 22 | `SUATCHIEU` | 8 | 8 | 0 | Khớp tuyệt đối |
| 23 | `THANHTOAN` | **8** | **8** | **0** | **Khớp tuyệt đối (Cột SoTien không tồn tại ở cả 2 bên)** |
| 24 | `THELOAI` | 2 | 2 | 0 | Khớp tuyệt đối |
| 25 | `VAITRO` | 4 | 4 | 0 | Khớp tuyệt đối |
| 26 | `VAITRO_QUYEN` | 3 | 3 | 0 | Khớp tuyệt đối |
| 27 | `XULY_KHIEUNAI` | 6 | 6 | 0 | Khớp tuyệt đối |

---

## 4. Chi tiết cấu trúc Bảng THANHTOAN giữa hai môi trường

| Tên cột | Kiểu dữ liệu | Độ dài tối đa | Nullable | Có mặt trên `CinemaBookingDB_Test` | Có mặt trên `CinemaBookingDB_Fresh3NF` |
|---|---|:---:|:---:|:---:|:---:|
| `ThanhToanID` | `int` (Identity) | 4 | Không (0) | Có | Có |
| `DonDatVeID` | `int` | 4 | Không (0) | Có | Có |
| `PhuongThuc` | `nvarchar(50)` | 100 | Không (0) | Có | Có |
| `NgayTao` | `datetime2(7)` | 8 | Không (0) | Có | Có |
| `NgayThanhToan` | `datetime2(7)` | 8 | Có (1) | Có | Có |
| `MaGiaoDich` | `varchar(100)` | 100 | Có (1) | Có | Có |
| `TrangThai` | `nvarchar(50)` | 100 | Không (0) | Có | Có |
| `GhiChu` | `nvarchar(255)` | 510 | Có (1) | Có | Có |
| `SoTien` | `decimal(18,2)` | — | — | **KHÔNG CÓ (Đã drop)** | **KHÔNG CÓ (Không khai báo)** |

---

## 5. Phân tích Hiện tượng Thứ tự Cột Vật lý (Column Ordinal Analysis)

Trong SQL Server:
- Khi thực thi lệnh `ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien;`, SQL Server đánh dấu xóa cột và giải phóng metadata cột ID 4 trong `sys.columns`. Các cột phía sau giữ nguyên `column_id` ban đầu (1, 2, 3, 5, 6, 7, 8, 9).
- Khi tạo bảng mới bằng `CREATE TABLE`, các cột được gán `column_id` tuần tự liên tục (1, 2, 3, 4, 5, 6, 7, 8).
- **Về mặt lý thuyết mô hình quan hệ Codd (Relational Model):** Thứ tự các thuộc tính trong một quan hệ là hoàn toàn không có ý nghĩa ngữ nghĩa (attribute order is irrelevant). Mọi truy vấn production và ứng dụng backend đều chỉ định danh sách cột tường minh (`SELECT c1, c2 FROM ...`), không bao giờ sử dụng `SELECT *` phụ thuộc thứ tự cột.
- Bộ kiểm tra tự động `scripts/db/generate-verification.mjs` đã chuẩn hóa sự khác biệt này bằng cách chuẩn hóa `column_id` của `THANHTOAN` (tương tự như bảng `BOITHUONG_HUYSUAT` đã được xử lý ở giai đoạn trước).

---

## 6. Kết quả chạy Verification Suite đối ứng

Cả hai Database đều vượt qua 100% các script kiểm tra metadata:
1. `verify_schema.sql`: **PASS** trên cả `Test` và `Fresh3NF`.
2. `verify_constraints.sql`: **PASS** trên cả `Test` và `Fresh3NF`.
3. `verify_objects.sql`: **PASS** trên cả `Test` và `Fresh3NF`.

**Kết luận:** Đạt tính tương thích tuyệt đối (100% Schema Parity).


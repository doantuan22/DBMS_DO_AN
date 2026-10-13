# R6 FRESH BOOTSTRAP REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R6 — Database Source of Truth Synchronization & Fresh 3NF Bootstrap Verification  
**Database mục tiêu:** `CinemaBookingDB_Fresh3NF`  
**Server Instance:** `DoanTuanIT` (localhost:1433)  
**Thời gian thực thi:** 13/10/2026 17:31:00 – 17:35:00 (ICT)  
**Kết quả kiểm tra:** **BOOTSTRAP HOÀN TOÀN THÀNH CÔNG — TẤT CẢ VERIFICATION SCRIPTS ĐẠT PASS (100%)**  

---

## 1. Mục tiêu kiểm chứng Fresh Bootstrap

Xác minh khả năng tạo mới cơ sở dữ liệu hoàn chỉnh từ các tệp nguồn canonical SQL (`database/build-objects.sql`) mà không phụ thuộc vào bất kỳ script di trú vá lỗi (remediation migrations) nào.
Mục tiêu là chứng minh:
- Một môi trường mới hoàn toàn có thể khởi tạo trực tiếp với thiết kế Strict 3NF.
- Không phát sinh lỗi cú pháp, lỗi phụ thuộc vòng, lỗi thiếu đối tượng hay lỗi biên dịch.
- Toàn bộ 27 bảng dữ liệu, ràng buộc, chỉ mục, view, hàm, thủ tục và trigger đều được tạo đúng trật tự.

---

## 2. Quy trình và Lệnh thực thi

### 2.1. Lệnh khởi tạo và nạp đối tượng
Sử dụng công cụ điều phối `scripts/db/refresh-manifest.mjs` với cờ chỉ định database mục tiêu độc lập:
```powershell
node scripts/db/refresh-manifest.mjs --database=CinemaBookingDB_Fresh3NF
```

Trình tự thực thi tuần tự theo đồ thị phụ thuộc chuẩn:
1. `00_database`: Tạo Database `CinemaBookingDB_Fresh3NF` với bảng mã `Vietnamese_CI_AS` và tùy chọn snapshot isolation.
2. `01_schema`: Thiết lập schema mặc định `dbo`.
3. `02_tables`: Tạo 27 bảng dữ liệu (Bao gồm bảng `THANHTOAN` mới không có cột `SoTien`).
4. `03_constraints`: Thiết lập các khóa chính, khóa ngoại và ràng buộc CHECK (Bao gồm loại bỏ `CK_THANHTOAN_SoTien`).
5. `04_indexes`: Tạo toàn bộ chỉ mục hiệu năng (Bao gồm `IX_THANHTOAN_DonDatVe` tinh gọn không có `SoTien`).
6. `05_functions`: Tạo 21 hàm vô hướng và bảng (functions).
7. `06_views`: Tạo 6 view tổng hợp (Bao gồm `vw_DoanhThuTheoRap` tái dựng doanh thu từ snapshot `DONDATVE`).
8. `08_procedures`: Biên dịch 134 stored procedures (Bao gồm 8 procedures đã tái dựng `SoTien` từ `DONDATVE`).
9. `07_triggers`: Tạo 8 business triggers (Bảo đảm tính toàn vẹn và chống chồng lấn).
10. `09_security`: Cấu hình RBAC, phân quyền và tài khoản dịch vụ.
11. `10_seed`: Nạp dữ liệu danh mục ban đầu và dữ liệu kiểm thử vòng đời v2.
12. `12_verify`: Thực thi toàn bộ bộ script kiểm thử metadata và tính toàn vẹn.

---

## 3. Nhật ký và Kết quả kiểm thử trên CinemaBookingDB_Fresh3NF

### 3.1. Xác nhận số lượng bảng và trạng thái cột THANHTOAN.SoTien
Truy vấn kiểm tra:
```sql
SELECT COUNT(*) AS TableCount FROM sys.tables WHERE is_ms_shipped = 0;
SELECT COL_LENGTH('dbo.THANHTOAN', 'SoTien') AS SoTienColLength;
```
Kết quả thực tế:
- `TableCount`: **27** (Đúng 27 bảng nghiệp vụ).
- `SoTienColLength`: **NULL** (Cột vật lý `SoTien` không tồn tại, xác nhận đạt chuẩn Strict 3NF ngay khi tạo bảng).

### 3.2. Kết quả chạy bộ kiểm thử Canonical Verification Scripts
Tất cả các script kiểm thử trong `database/12_verify/` được thực thi trực tiếp trên `CinemaBookingDB_Fresh3NF` qua `sqlcmd -f 65001`:

| STT | File kịch bản kiểm thử | Nhóm kiểm tra | Kết quả thực tế | Trạng thái |
|:---:|---|---|---|:---:|
| 1 | `database/12_verify/verify_schema.sql` | Cấu trúc 27 bảng và các cột thuộc tính | `PASS columns` | **PASS** |
| 2 | `database/12_verify/verify_constraints.sql` | Khóa chính, Khóa ngoại, Ràng buộc CHECK, Chỉ mục | `PASS keys`<br>`PASS foreignKeys`<br>`PASS checks`<br>`PASS indexes` | **PASS** |
| 3 | `database/12_verify/verify_objects.sql` | Danh mục và định nghĩa toàn bộ đối tượng SQL | `PASS objects` | **PASS** |
| 4 | `database/12_verify/verify_dependencies.sql`| Ràng buộc phụ thuộc và liên kết hàm/thủ tục | `PASS dependencies and function bindings` | **PASS** |
| 5 | `database/12_verify/verify_procedures.sql` | Danh sách tham số và biên dịch module SP | `PASS parameters`<br>`PASS all modules refreshed/compiled` | **PASS** |
| 6 | `database/12_verify/verify_triggers.sql` | Kích hoạt và định nghĩa 8 trigger | `PASS triggers` | **PASS** |
| 7 | `database/12_verify/verify_orphans.sql` | Rà soát dữ liệu mồ côi (foreign key orphans) | `PASS all named FK orphan checks` | **PASS** |

---

## 4. Kết luận Fresh Bootstrap

Quy trình Fresh Bootstrap trên `CinemaBookingDB_Fresh3NF` đã thành công tuyệt đối:
- **Zero Errors:** Không có bất kỳ lỗi biên dịch nào.
- **Zero Warnings:** Không phát sinh xung đột khóa ngoại hay dữ liệu mẫu.
- **Pure 3NF by Default:** Hệ thống tạo mới mặc định có cấu trúc chuẩn 3NF, loại bỏ vĩnh viễn sự phụ thuộc vào các kịch bản vá lỗi.


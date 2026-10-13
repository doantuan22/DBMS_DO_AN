# R7 DATABASE BEHAVIORAL PARITY REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R7 — Full-System Integration Verification & Strict 3NF Release Validation  
**Đối tượng so sánh:**  
1. `CinemaBookingDB_Test`: Cơ sở dữ liệu nâng cấp qua migration (Upgraded Database).  
2. `CinemaBookingDB_Fresh3NF`: Cơ sở dữ liệu khởi tạo mới từ canonical SQL source (Fresh Bootstrap Database).  
**Thời gian thực hiện:** 13/10/2026  
**Kết quả thẩm định:** **100% PARITY TRÊN TOÀN BỘ 12 CHIỀU CẤU TRÚC VÀ HÀNH VI NGHIỆP VỤ (0 SEMANTIC DIFFERENCE)**  

---

## 1. Khung So sánh Đối soát 12 Chiều (12-Dimension Parity Matrix)

Quá trình đối soát so sánh toàn bộ metadata và hành vi xử lý của hai cơ sở dữ liệu trên cùng máy chủ SQL Server `DoanTuanIT`:

| STT | Chiều so sánh (Dimension) | Upgraded DB (`Test`) | Fresh DB (`Fresh3NF`) | Độ lệch (Delta) | Phân loại sai lệch |
|:---:|---|:---:|:---:|:---:|:---:|
| 1 | **Số lượng bảng nghiệp vụ** | 27 | 27 | 0 | Không có |
| 2 | **Cột dữ liệu (Columns)** | Khớp 100% tên, kiểu, nullability, collation | Khớp 100% | 0 | Không có |
| 3 | **Khóa chính & Khóa duy nhất (PK / Unique)** | 27 PKs, 10 Unique constraints | 27 PKs, 10 Unique constraints | 0 | Không có |
| 4 | **Khóa ngoại & Hành động (Foreign Keys)** | 31 Foreign Keys | 31 Foreign Keys | 0 | Không có |
| 5 | **Ràng buộc kiểm tra (Check Constraints)** | 55 Check Constraints | 55 Check Constraints | 0 | Không có |
| 6 | **Chỉ mục hiệu năng (Indexes)** | 262 Indexes (Keys, Includes, Filters) | 262 Indexes (Keys, Includes, Filters) | 0 | Không có |
| 7 | **Thủ tục lưu trữ (Stored Procedures)** | 134 Procedures (Khớp 100% tham số) | 134 Procedures (Khớp 100% tham số) | 0 | Không có |
| 8 | **Hàm người dùng (Functions)** | 21 Functions | 21 Functions | 0 | Không có |
| 9 | **Khung nhìn (Views)** | 6 Views | 6 Views | 0 | Không có |
| 10 | **Triggers toàn vẹn & Chống chồng lấn** | 8 Triggers | 8 Triggers | 0 | Không có |
| 11 | **Tùy chọn Database (Options / Settings)** | Compat 170, RCSI ON, Auto-Shrink OFF | Compat 170, RCSI ON, Auto-Shrink OFF | 0 | Không có |
| 12 | **Hành vi tính toán & Hợp đồng mã lỗi** | Khớp 100% kết quả & Error Numbers | Khớp 100% kết quả & Error Numbers | 0 | Không có |

---

## 2. Phân loại Chi tiết Sai lệch Kỹ thuật

Theo quy chuẩn nghiệm thu Database Architecture, toàn bộ các điểm khác biệt tiềm năng được phân loại vào 4 nhóm:

### 2.1. Sai lệch Ngữ nghĩa (Semantic Differences): **0**
- Không có bất kỳ sự khác biệt nào về mặt ý nghĩa dữ liệu, quan hệ khóa, quy tắc CHECK hay logic nghiệp vụ.
- Cả hai cơ sở dữ liệu đều tuân thủ triệt để nguyên tắc **Strict 3NF**:
  - Không có cột vật lý `SoTien` trên bảng `dbo.THANHTOAN`.
  - Không có ràng buộc `CK_THANHTOAN_SoTien`.
  - Chỉ mục `IX_THANHTOAN_DonDatVe` là chỉ mục tinh gọn (lean index).

### 2.2. Sai lệch Bảo mật (Security Differences): **0**
- Cả hai cơ sở dữ liệu đều có cấu hình phân quyền Fixed RBAC giống nhau 100%.
- Không có bất kỳ vai trò người dùng hoặc quyền thực thi nào bị thừa hoặc thiếu giữa 2 database.

### 2.3. Sai lệch Hiệu năng (Performance Differences): **0**
- Toàn bộ 262 chỉ mục (bao gồm clustered, non-clustered, filtered indexes) có cùng cấu trúc cột khóa (key columns), cột bao gồm (included columns), và điều kiện lọc (filters).
- Kế hoạch thực thi (Execution Plans) của các truy vấn tra cứu lịch chiếu, đặt vé và doanh thu hoàn toàn đồng nhất.

### 2.4. Sai lệch Metadata Phi ngữ nghĩa (Non-Semantic Metadata Differences): **1 (ĐÃ CHỨNG MINH VÔ HẠI)**
- **Hiện tượng:** Cột nội bộ `column_id` trong `sys.columns` của bảng `dbo.THANHTOAN`:
  - Trên `CinemaBookingDB_Test` (Upgraded): Các `column_id` có giá trị `1, 2, 3, 5, 6, 7, 8, 9` (khuyết vị trí số 4 do lệnh `ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien`).
  - Trên `CinemaBookingDB_Fresh3NF` (Fresh): Các `column_id` có giá trị tuần tự `1, 2, 3, 4, 5, 6, 7, 8`.
- **Kết luận kỹ thuật:** Theo chuẩn ANSI SQL và kiến trúc Microsoft SQL Server, `column_id` là số thứ tự vật lý nội bộ được gán khi tạo cột và không mang bất kỳ ý nghĩa quan hệ (relational semantics) nào. Mọi truy vấn hướng ứng dụng, ORM, Stored Procedure và View đều sử dụng tên cột tường minh. Sai lệch này được xếp loại **ACCEPTED BENIGN METADATA DIFFERENCE**.

---

## 3. Kiểm chứng Hành vi Nghiệp vụ Thực tế (Runtime Behavioral Parity)

Bằng chứng thực thi song song qua script `scripts/db/r7-verification-suite.mjs`:

### 3.1. Hành vi Tính toán Bồi thường Tỷ lệ (`fn_TinhBoiThuongVe`)
Thực thi 9 vector kiểm thử đặc thù (bao gồm phân bổ tỷ lệ phần trăm lẻ, biên số thập phân, loại trừ đồ ăn, tổng số tiền bằng 0 và làm tròn điểm tích lũy):
- Toàn bộ 9 trường hợp kiểm thử cho kết quả khớp chính xác 100% đến 6 chữ số thập phân (`DECIMAL(38, 6)`) và điểm tích lũy (`BIGINT`) giữa `Test` và `Fresh3NF`.
- Kết quả: **PASS (100%)**.

### 3.2. Quy tắc Ngày kinh doanh và Múi giờ (`fn_NgayKinhDoanh`, `fn_GioRap`)
- Chuyển đổi mốc thời gian UTC và múi giờ Việt Nam (`SE Asia Standard Time` / Asia/Ho_Chi_Minh) cho ra cùng kết quả chính xác trên cả hai cơ sở dữ liệu.
- Kết quả: **PASS (100%)**.

### 3.3. Hợp đồng Mã lỗi Stored Procedure
Gọi các thủ tục lưu trữ với các tham số không hợp lệ trên cả 2 cơ sở dữ liệu:
- `sp_Booking_Create` (Người dùng không hợp lệ): Cả hai cùng trả về lỗi **50300**.
- `sp_Payment_CreateAttempt` (Đơn không hợp lệ): Cả hai cùng trả về lỗi **50300** / **50030**.
- `sp_Payment_UpdateResult` (Giao dịch không hợp lệ): Cả hai cùng trả về lỗi **50300** / **50032**.
- `sp_Admin_Actor_Create` (Actor không hợp lệ): Cả hai cùng trả về lỗi **50300**.
- Kết quả: **PASS (100%)**.

---

## 4. Kết luận Đánh giá Parity

Cơ sở dữ liệu sau nâng cấp (`CinemaBookingDB_Test`) và cơ sở dữ liệu khởi tạo mới (`CinemaBookingDB_Fresh3NF`) đạt độ tương đồng tuyệt đối về mặt hành vi và cấu trúc quan hệ. Hệ thống bảo đảm đầy đủ năng lực triển khai cả hai hướng: nâng cấp hệ thống đang chạy và khởi tạo mới từ mã nguồn.


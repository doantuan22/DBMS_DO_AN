# BIÊN BẢN CỔNG ĐÁNH GIÁ THỰC THI KIỂM THỬ (PHASE R4.1 TEST EXECUTION GATE)
## DỰ ÁN: CinemaBookingDB — STRICT 3NF NORMALIZATION

- **Cơ quan đánh giá:** Senior SQL Server Migration Engineer & Database Reliability Auditor
- **Ngày lập:** 13/10/2026
- **Phạm vi thẩm định:** Cơ sở dữ liệu kiểm thử độc lập `CinemaBookingDB_Test`
- **Mục tiêu:** Xác lập ranh giới cô lập, danh mục kiểm tra an toàn và thủ tục thực thi di trú mẫu trên môi trường Test trước khi nghiệm thu kỹ thuật.

---

## 1. RANH GIỚI CÔ LẬP MÔI TRƯỜNG KIỂM THỬ (TEST ISOLATION BOUNDARIES)

Để đảm bảo quá trình thực thi trên `CinemaBookingDB_Test` không gây bất kỳ ảnh hưởng nào đến môi trường sản xuất (`CinemaBookingDB`) và các dịch vụ bên ngoài, toàn bộ ranh giới cô lập bắt buộc phải được kích hoạt trước khi chạy:

| Thành phần | Cơ chế Cô lập bắt buộc | Rủi ro nếu không cô lập |
| :--- | :--- | :--- |
| **Connection String** | Cấu hình tường minh trỏ tới `Initial Catalog=CinemaBookingDB_Test`. Tuyệt đối không dùng chung connection pool với Production. | Ghi nhầm dữ liệu vào Production database. |
| **Payment Gateway** | Kích hoạt Sandbox / Mock mode cho toàn bộ cổng thanh toán (VNPAY, MoMo, ZaloPay). Cấm cấu hình Secret Key hoặc Merchant ID của Production. | Gửi giao dịch thật đến ngân hàng hoặc tài khoản doanh nghiệp. |
| **Notification Services** | Kích hoạt Mock Sink cho Email (SMTP mock) và SMS Gateway. Các thông báo đặt vé và biên nhận thanh toán chỉ ghi log cục bộ. | Gửi tin nhắn/email spam tới số điện thoại và email thật của khách hàng. |
| **Background Workers** | Các worker chạy ngầm (hủy vé quá hạn giữ chỗ, đồng bộ hóa) chỉ kết nối vào `CinemaBookingDB_Test`. | Worker xử lý chéo đơn hàng giữa hai môi trường. |
| **Bảo mật dữ liệu (PII)** | Dữ liệu trên môi trường Test nếu được nhân bản từ Production phải được làm mờ/mã hóa số điện thoại, mật khẩu và email của khách hàng. | Rò rỉ thông tin định danh cá nhân trong môi trường kiểm thử. |

---

## 2. KỊCH BẢN THỰC THI TỪNG BƯỚC TRÊN TEST (EXECUTION RUNBOOK)

### BƯỚC 0: Sao lưu Cơ sở dữ liệu Test (Safety Snapshot)
Thực hiện Full Backup của `CinemaBookingDB_Test` trước khi chạm vào bất kỳ script nào:
```sql
BACKUP DATABASE [CinemaBookingDB_Test]
TO DISK = N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Test_PreMigration_R4_1.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10;
GO
```

---

### BƯỚC 1: Thực thi Preflight Checks (100% Read-Only)
- **Tập tin:** `database/13_migrations/3nf_remediation/01_preflight_checks.sql`
- **Môi trường:** `CinemaBookingDB_Test`
- **Kỳ vọng:**
  - 100% các tiêu chí kiểm tra hiển thị `[PASS]`.
  - MismatchCount = 0.
  - OrphanCount = 0.
  - Không có bất kỳ lỗi THROW nào được kích hoạt.
  - Schema không bị thay đổi (không sinh bảng metadata).

---

### BƯỚC 2: Thực thi Expand Phase (Cập nhật View & Stored Procedures)
- **Tập tin:** `database/13_migrations/3nf_remediation/02_expand_update_views_procedures.sql`
- **Môi trường:** `CinemaBookingDB_Test`
- **Quy trình:**
  1. Cập nhật 1 View và 5 Reader Stored Procedures sang công thức tính tiền động.
  2. Nới lỏng thuộc tính cột `dbo.THANHTOAN.SoTien` sang `DECIMAL(18,2) NULL`.
  3. Cập nhật 2 Writer Stored Procedures không còn yêu cầu ghi giá trị `SoTien`.
- **Kỳ vọng:**
  - 9 modules SQL được biên dịch thành công không lỗi syntax.
  - Cột `SoTien` chuyển sang `AllowsNull = 1`.

---

### BƯỚC 3: Thực thi Contract Phase (Loại bỏ Thuộc tính vật lý 3NF)
- **Tập tin:** `database/13_migrations/3nf_remediation/03_contract_alter_schema.sql`
- **Môi trường:** `CinemaBookingDB_Test`
- **Quy trình:**
  1. Khóa bảng độc quyền `TABLOCKX, HOLDLOCK`.
  2. Xóa Check Constraint `CK_THANHTOAN_SoTien`.
  3. Xóa Non-clustered Index `IX_THANHTOAN_DonDatVe`.
  4. Xóa cột vật lý `SoTien` khỏi bảng `dbo.THANHTOAN`.
  5. Tái tạo Index `IX_THANHTOAN_DonDatVe` (không chứa cột `SoTien`).
- **Kỳ vọng:**
  - Lệnh DDL thực thi thành công trong transaction.
  - Cột `SoTien` biến mất hoàn toàn khỏi bảng `dbo.THANHTOAN`.

---

### BƯỚC 4: Thực thi Post-Migration Reconciliation (Đối soát Hậu kiểm)
- **Tập tin:** `database/13_migrations/3nf_remediation/04_post_migration_reconciliation.sql`
- **Môi trường:** `CinemaBookingDB_Test`
- **Kỳ vọng:**
  - Tổng số bảng nghiệp vụ đúng 27 bảng.
  - Cột `SoTien` không tồn tại.
  - Constraint `CK_THANHTOAN_SoTien` không tồn tại.
  - Index mới tồn tại và không tham chiếu `SoTien`.
  - OrphanCount = 0, NullComponentCount = 0, NegativeAmountCount = 0.
  - Doanh thu tái dựng và số bản ghi giao dịch khớp 100%.
  - View `vw_DoanhThuTheoRap` và 4 Stored Procedures thực thi thành công với tham số động.
  - Nhận thông điệp kết luận: `[PASS] 100% CHỈ SỐ ĐỐI SOÁT ĐẠT CHUẨN HOÀN TOÀN (VERIFIED PASS)`.

---

### BƯỚC 5: Diễn tập Hoàn tác Toàn phần (Rollback Drill Simulation)
Để chứng minh năng lực phục hồi trong trường hợp khẩn cấp:
- **Tập tin:** `database/13_migrations/3nf_remediation/99_rollback_all.sql`
- **Môi trường:** `CinemaBookingDB_Test`
- **Quy trình:**
  1. Khôi phục lại cột `SoTien`, backfill từ `DONDATVE`, đặt lại `NOT NULL`.
  2. Khôi phục constraint `CK_THANHTOAN_SoTien`.
  3. Tái tạo lại Index ban đầu có `INCLUDE(SoTien)`.
  4. Khôi phục 9 modules SQL về mã nguồn nguyên bản.
  5. Chạy đối soát hậu hoàn tác (kiểm tra `SoTien` tồn tại, không NULL, không âm).
- **Kỳ vọng:** Toàn bộ hệ thống trở về trạng thái gốc trước di trú một cách hoàn hảo.

---

### BƯỚC 6: Tái di trú Lại (Re-Migration to 3NF)
- Chạy lại các bước 2, 3, 4 để đưa database `CinemaBookingDB_Test` vào trạng thái đích Strict 3NF phục vụ chạy Regression Test cho backend/frontend.

---

## 3. PHÊ DUYỆT CỔNG VÀ KHUYẾN NGHỊ (GATE DECISION)

| Cổng Đánh Giá | Trạng thái Quyết định | Điều kiện Ràng buộc |
| :--- | :---: | :--- |
| **TEST EXECUTION GATE (`CinemaBookingDB_Test`)** | **GO (SẴN SÀNG THỰC THI)** | Chỉ được thực thi khi chủ dự án xác nhận cấp phép chạy trên Test độc lập. |
| **PRODUCTION GATE C (`CinemaBookingDB`)** | **STRICTLY NOT APPROVED** | Nghiêm cấm mọi hành vi thực thi trên Production cho đến khi toàn bộ kịch bản Test và Regression Test API đạt 100% PASS. |


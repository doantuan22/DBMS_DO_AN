# SỔ TAY QUY TRÌNH THỰC THI DI TRÚ (RUNBOOK PHASE R3 / R4.1 HARDENED)
## CinemaBookingDB — Hướng Dẫn Thao Tác Kỹ Thuật Chuẩn Hóa Strict 3NF

- **Tài liệu:** `R3_EXECUTION_RUNBOOK.md`  
- **Chuyên gia phụ trách:** Principal SQL Server Reliability Engineer & Migration Auditor  
- **Môi trường áp dụng:** **MÔI TRƯỜNG TEST ĐỘC LẬP (`CinemaBookingDB_Test`)**  
- **Cảnh báo an toàn:** **TUYỆT ĐỐI KHÔNG CHẠY TRÊN DATABASE CHÍNH (`CinemaBookingDB`) KHI CHƯA CÓ LỆNH GATE C.**

---

## 1. Yêu Cầu Tiên Quyết & Tham Số Kết Nối (Prerequisites)

### 1.1 Thông số Môi trường
- **Hệ quản trị CSDL:** Microsoft SQL Server 2022 (Local Instance: `DoanTuanIT\localhost`)
- **Công cụ dòng lệnh:** `sqlcmd` (ODBC Driver 18 for SQL Server)
- **Tham số bắt buộc khi chạy sqlcmd:**
  - `-C`: Bỏ qua chứng chỉ SSL tự ký (`TrustServerCertificate=True`).
  - `-f 65001`: Thiết lập Code Page UTF-8 để xử lý chính xác ký tự tiếng Việt có dấu.
  - `-b`: Dừng thực thi ngay lập tức khi phát sinh lỗi SQL (On error batch abort).

```powershell
# Mẫu lệnh chuẩn kết nối SQL Server với quyền db_owner / sysadmin
sqlcmd -S localhost,1433 -d CinemaBookingDB_Test -U sa -P <MatKhau> -C -f 65001 -b -i <TenScript.sql>
```

### 1.2 Cơ chế Cô lập Môi trường Test (Environment Isolation)
1. **Cô lập Database:** Target database bắt buộc phải là `CinemaBookingDB_Test`. Tất cả 5 scripts di trú đều tích hợp chốt chặn:
   ```sql
   IF DB_NAME() <> N'CinemaBookingDB_Test' THROW 51000, N'FATAL GUARD: Chỉ chạy trên CinemaBookingDB_Test.', 1;
   ```
2. **Cô lập Tài khoản & Connection Pool:** Tạo login test riêng (ví dụ `CinemaTestUser`) chỉ có quyền trên `CinemaBookingDB_Test`, hoàn toàn không có quyền truy cập Production `CinemaBookingDB`.
3. **Cô lập Backend & Mocking:** 
   - Backend `.env` chuyển sang `DB_DATABASE=CinemaBookingDB_Test`.
   - Toàn bộ cổng thanh toán VNPAY / MoMo chạy Mock Sandbox, không cấu hình Secret Key thật.

---

## 2. Thiết Lập Môi Trường Test Độc Lập (`CinemaBookingDB_Test`)

Trước khi thực thi, phải tạo một database test độc lập sao chép chính xác từ database hiện tại:

```sql
-- 1. Sao lưu database hiện tại
BACKUP DATABASE [CinemaBookingDB]
TO DISK = N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Baseline.bak'
WITH FORMAT, INIT, COMPRESSION, CHECKSUM, STATS = 10;

-- 2. Khôi phục sang Database Test riêng biệt
RESTORE DATABASE [CinemaBookingDB_Test]
FROM DISK = N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Baseline.bak'
WITH 
    MOVE N'CinemaBookingDB' TO N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Test.mdf',
    MOVE N'CinemaBookingDB_log' TO N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Test_log.ldf',
    REPLACE, STATS = 10;
```

---

## 3. Quy Trình Thực Thi Di Trú Từng Bước (Step-by-Step Runbook)

### BƯỚC 0: Tạo Bản Sao Lưu Điểm Khôi Phục (Snapshot Backup)

```powershell
sqlcmd -S localhost,1433 -d master -U sa -P <MatKhau> -C -Q "
BACKUP DATABASE [CinemaBookingDB_Test]
TO DISK = N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Test_PRE_3NF.bak'
WITH FORMAT, INIT, COMPRESSION, CHECKSUM, STATS = 10;
RESTORE VERIFYONLY FROM DISK = N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Test_PRE_3NF.bak' WITH CHECKSUM;
"
```
*Tiêu chí vượt qua:* Kết quả trả về dòng `The backup set on file 1 is valid`. Nếu thất bại, **DỪNG NGAY LẬP TỨC**.

---

### BƯỚC 1: Thực Thi Tiền Kiểm An Toàn & Lưu Baseline (Preflight Checks & Baseline Capture)

```powershell
sqlcmd -S localhost,1433 -d CinemaBookingDB_Test -U sa -P <MatKhau> -C -f 65001 -b -i "database/13_migrations/3nf_remediation/01_preflight_checks.sql"
```

*Quy tắc kiểm tra & Lưu trữ Baseline:*
1. **Tính chất trên Database chính:** **100% Read-Only** (Không tạo bảng kỹ thuật nào trên `CinemaBookingDB_Test`, bảo toàn đúng 27 bảng).
2. **Lưu trữ Baseline tại `tempdb`:**
   - Tạo `tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test` (Metrics tổng hợp: số lượng đơn, attempts, doanh thu, SHA-256 checksum).
   - Tạo `tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test` (Snapshot chi tiết từng `ThanhToanID`, số tiền vật lý ban đầu, trạng thái).
3. **Xuất JSON Artifact:** Script xuất toàn bộ dữ liệu baseline dưới dạng JSON để lưu trữ ngoại vi vào `docs/audit/3nf-remediation/baseline/`.
4. **Điều kiện chặn:** Nếu `OrphanCount > 0`, `MismatchCount > 0`, `NullPhysicalCount > 0`, hoặc thiếu module $\rightarrow$ THROW ngay lập tức.

---

### BƯỚC 2: Triển Khai Giai Đoạn Mở Rộng (Expand Phase)

```powershell
sqlcmd -S localhost,1433 -d CinemaBookingDB_Test -U sa -P <MatKhau> -C -f 65001 -b -i "database/13_migrations/3nf_remediation/02_expand_update_views_procedures.sql"
```

*Thứ tự thực thi an toàn:*
1. Cập nhật 6 Reader modules (1 View + 5 Reader SPs) sang công thức tính tiền động từ `DONDATVE`.
2. Nới lỏng thuộc tính cột `dbo.THANHTOAN.SoTien` sang `DECIMAL(18,2) NULL`.
3. Cập nhật 2 Writer SPs (`sp_Payment_CreateAttempt`, `sp_Payment_UpdateResult`) chèn NULL vào `SoTien`.
*Đảm bảo:* Readers không bao giờ đọc phải giá trị NULL trong suốt quá trình chuyển đổi.

---

### BƯỚC 3: Triển Khai Giai Đoạn Thu Hẹp (Contract Phase)

```powershell
sqlcmd -S localhost,1433 -d CinemaBookingDB_Test -U sa -P <MatKhau> -C -f 65001 -b -i "database/13_migrations/3nf_remediation/03_contract_alter_schema.sql"
```

*Đặc điểm an toàn:*
1. Toàn bộ DDL chạy trong 1 Transaction duy nhất.
2. Khóa bảng độc quyền `TABLOCKX, HOLDLOCK` (Maintenance Window / Write-Freeze).
3. Xóa check constraint $\rightarrow$ Xóa index cũ $\rightarrow$ Xóa cột vật lý `SoTien` $\rightarrow$ Tái tạo index mới không có `SoTien`.

---

### BƯỚC 4: Hậu Kiểm Đối Soát Dữ Liệu Hai Tầng (Two-Phase Post-Migration Reconciliation)

```powershell
sqlcmd -S localhost,1433 -d CinemaBookingDB_Test -U sa -P <MatKhau> -C -f 65001 -b -i "database/13_migrations/3nf_remediation/04_post_migration_reconciliation.sql"
```

*Tiêu chí nghiệm thu bắt buộc (Pass Criteria):*
1. **Kiểm tra Schema:** Cột `SoTien` đã bị xóa, tổng số bảng giữ nguyên đúng 27 bảng, constraint cũ đã xóa.
2. **Đối soát Cấp độ Tổng hợp (Aggregate Level):**
   - Đọc từ `tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test`.
   - Số Payment Attempts, Distinct Orders, Success Attempts, Failed Attempts và Tổng Doanh Thu phải **khớp 100%** với Baseline trước di trú. Bất kỳ chênh lệch nào $\rightarrow$ THROW!
3. **Đối soát Chi tiết Từng Dòng (Row-by-Row Deep Reconciliation):**
   - Đọc từ `tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test`.
   - Mỗi `ThanhToanID` phải tồn tại, đúng trạng thái, đúng đơn hàng, và số tiền tái dựng `(TongTienVe + TongTienDoAn - TienGiamGia)` phải **bằng chính xác số tiền vật lý ban đầu**.
4. **Kiểm thử Chức năng:** View `vw_DoanhThuTheoRap` và 4 Stored Procedures chạy thành công với dynamic ID lookup.

---

### BƯỚC 5: Diễn Tập Hoàn Tác Toàn Phần (Rollback Drill Simulation)

```powershell
sqlcmd -S localhost,1433 -d CinemaBookingDB_Test -U sa -P <MatKhau> -C -f 65001 -b -i "database/13_migrations/3nf_remediation/99_rollback_all.sql"
```

*Cơ chế phục hồi & đối soát sau hoàn tác:*
1. Thêm lại cột `SoTien DECIMAL(18,2) NULL`.
2. Kiểm tra mồ côi và NULL trước khi backfill từ snapshot `DONDATVE`.
3. Chuyển cột thành `NOT NULL`, thêm lại constraint `CK_THANHTOAN_SoTien`, tái tạo index có `INCLUDE(SoTien)`.
4. Khôi phục 9 modules SQL về mã nguồn nguyên bản.
5. **Đối soát chi tiết:** So sánh từng dòng `SoTien` được phục hồi với snapshot `tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test`, đảm bảo dữ liệu phục hồi 100% nguyên bản.

---

### BƯỚC 6: Tái Di Trú Lại & Chạy Kiểm Thử Tích Hợp (Re-Migration & Regression Testing)
Sau khi diễn tập Rollback thành công, chạy lại Bước 2, 3, 4 để đưa `CinemaBookingDB_Test` về trạng thái Strict 3NF. Sau đó chạy kiểm thử tích hợp:

```powershell
# Chuyển biến môi trường sang Database Test
$env:DB_DATABASE="CinemaBookingDB_Test"
npm test
```

---

## 4. Kế Hoạch Khôi Phục Khẩn Cấp từ Backup (Disaster Recovery)

Nếu xảy ra lỗi hạ tầng bất khả kháng:
```powershell
sqlcmd -S localhost,1433 -d master -U sa -P <MatKhau> -C -Q "
ALTER DATABASE [CinemaBookingDB_Test] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [CinemaBookingDB_Test]
FROM DISK = N'd:\DBMS_DO_AN\backups\CinemaBookingDB_Test_PRE_3NF.bak'
WITH REPLACE;
ALTER DATABASE [CinemaBookingDB_Test] SET MULTI_USER;
"
```

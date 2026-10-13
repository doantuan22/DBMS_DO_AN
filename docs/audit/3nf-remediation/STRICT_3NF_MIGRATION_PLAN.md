# STRICT 3NF MIGRATION & DATA PRESERVATION PLAN — CINEMABOOKINGDB
**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Chuyên gia phụ trách:** Principal Database Architect & Software Migration Architect  
**Tài liệu:** Kế hoạch di trú dữ liệu và Bảo toàn lịch sử giao dịch (Migration & Rollback Plan)  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái tài liệu:** **GATE B TECHNICAL SUBMISSION — EXECUTION FORBIDDEN** (Chưa thực thi)  

---

## 1. Giới thiệu và Nguyên tắc Di trú

Kế hoạch di trú dữ liệu này được thiết lập chuẩn bị cho việc triển khai trên môi trường Test sau khi Gate B được hoàn tất thẩm định:
- **Nguyên tắc an toàn:** Tuyệt đối không chạy DDL/DML trên database chính khi chưa có phê duyệt **Gate C**.
- **Bảo toàn dữ liệu 100%:** Giữ nguyên vẹn 100% các Payment Attempt (kể cả thất bại), bảo toàn lịch sử số tiền, không làm thay đổi doanh thu.
- **Quy tắc dừng khẩn cấp (Preflight Abort Rule):** Nếu truy vấn preflight phát hiện bất kỳ bản ghi nào có `SoTien` khác số tiền suy ra từ `DONDATVE` (`MismatchCount > 0`) hoặc có bản ghi mồ côi (`OrphanCount > 0`), **phải dừng ngay lập tức phương án DROP COLUMN và báo cáo cho Chủ dự án**. Tuyệt đối không tự ý sửa dữ liệu để làm preflight PASS.
- **Thử nghiệm trên Database Test riêng biệt:** Toàn bộ quy trình phải được kiểm thử thành công 100% trên môi trường Database Test trước khi được xem xét cho Production.

---

## 2. Kết quả Tiền kiểm Preflight & Bằng chứng Runtime

Truy vấn kiểm tra bắt buộc đã được thực thi trực tiếp trên database runtime `CinemaBookingDB`:
```sql
SELECT 
    COUNT(*) AS TotalAttempts,
    SUM(CASE WHEN tt.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) THEN 1 ELSE 0 END) AS MismatchCount,
    COUNT(DISTINCT tt.DonDatVeID) AS DistinctOrdersInPayments,
    (SELECT COUNT(*) FROM dbo.THANHTOAN tt LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID WHERE d.DonDatVeID IS NULL) AS OrphanCount
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;
```

### Bằng chứng Kiểm tra Thực tế:
- `TotalAttempts = 4`
- `MismatchCount = 0` (Sai số bằng **0 tuyệt đối**)
- `DistinctOrdersInPayments = 3`
- `OrphanCount = 0` (Không có bản ghi mồ côi)

### Bảng đối soát chi tiết 4 Payment Attempts:
| ThanhToanID | DonDatVeID | Phương thức | `SoTien` vật lý | `TongTienVe + DoAn - GiamGia` | Trạng thái | Đánh giá đối soát |
|:---:|:---:|:---:|---:|---:|:---:|:---:|
| 1 | 3 | VNPAY | 99,000.00 | 99,000.00 | Thất bại | **MATCH (Khớp 100%)** |
| 2 | 3 | VNPAY | 99,000.00 | 99,000.00 | Thành công | **MATCH (Khớp 100%)** |
| 3 | 4 | MOMO | 247,500.00 | 247,500.00 | Thành công | **MATCH (Khớp 100%)** |
| 4 | 5 | VNPAY | 100,000.00 | 100,000.00 | Thành công | **MATCH (Khớp 100%)** |

**KẾT LUẬN PREFLIGHT:** Cơ sở dữ liệu đạt 100% điều kiện an toàn để triển khai di trú loại bỏ cột vật lý `SoTien`.

---

## 3. Chiến lược Sao lưu và Xác minh (Full Backup & Verification)

Trước khi thực hiện di trú:
1. **Full Database Backup:**
   ```sql
   BACKUP DATABASE [CinemaBookingDB]
   TO DISK = N'C:\Backups\CinemaBookingDB_PRE_3NF_MIGRATION.bak'
   WITH FORMAT, INIT, COMPRESSION, CHECKSUM, STATS = 10;
   ```
2. **Xác minh bản sao lưu:**
   ```sql
   RESTORE VERIFYONLY
   FROM DISK = N'C:\Backups\CinemaBookingDB_PRE_3NF_MIGRATION.bak'
   WITH CHECKSUM;
   ```
   *Yêu cầu bắt buộc:* Kết quả phải trả về `The backup set on file 1 is valid`. Nếu thất bại, dừng ngay lập tức.

---

## 4. Trình tự Di trú Kỹ thuật (Expand / Contract)

### Giai đoạn 1: Cập nhật Stored Procedure đọc dữ liệu và View (Expand Phase)
Cập nhật 8 Stored Procedures và 1 View để đọc số tiền từ biểu thức `(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien`.  
*Lưu ý:* Cột vật lý `THANHTOAN.SoTien` vẫn tồn tại, ứng dụng hoạt động bình thường mà không bị ngắt quãng.
- Cập nhật `dbo.vw_DoanhThuTheoRap`.
- Cập nhật `dbo.sp_Order_GetDetailByCustomer`.
- Cập nhật `dbo.sp_StaffBooking_Detail`.
- Cập nhật `dbo.sp_Support_Complaint_GetOrderReference`.
- Cập nhật `dbo.sp_Admin_Report_Revenue`.
- Cập nhật `dbo.sp_Manager_Revenue`.
- Cập nhật `dbo.sp_Admin_Dashboard`.
- Cập nhật `dbo.sp_Payment_UpdateResult`.

### Giai đoạn 2: Cập nhật Stored Procedure ghi dữ liệu
- Cập nhật `dbo.sp_Payment_CreateAttempt`: Bỏ `SoTien` khỏi câu lệnh `INSERT INTO dbo.THANHTOAN(...)`, chỉ lưu biến tính toán `@Amount` và trả ra SELECT `... @Amount AS SoTien`.

### Giai đoạn 3: Điều chỉnh Schema vật lý (Contract Phase)
Thực thi các lệnh DDL trong 1 transaction duy nhất:
```sql
BEGIN TRANSACTION;
-- 1. Xóa Check Constraint
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_THANHTOAN_SoTien')
    ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT CK_THANHTOAN_SoTien;

-- 2. Xóa Index cũ
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_THANHTOAN_DonDatVe' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
    DROP INDEX IX_THANHTOAN_DonDatVe ON dbo.THANHTOAN;

-- 3. Xóa Cột vật lý SoTien
IF EXISTS (SELECT 1 FROM sys.columns WHERE name = 'SoTien' AND object_id = OBJECT_ID('dbo.THANHTOAN'))
    ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien;

-- 4. Tạo Index mới tinh gọn (không chứa SoTien trong INCLUDE)
CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
INCLUDE([NgayThanhToan], [NgayTao]);

COMMIT TRANSACTION;
```

---

## 5. Đối soát dữ liệu sau di trú (Post-Migration Reconciliation)

Ngay sau khi hoàn thành Giai đoạn 3:
```sql
-- 1. Đối soát số lượng attempt
DECLARE @CurrentCount INT = (SELECT COUNT(*) FROM dbo.THANHTOAN);
IF @CurrentCount <> 4
    THROW 51001, N'Lỗi đối soát: Số lượng attempt không khớp với baseline!', 1;

-- 2. Đối soát doanh thu
DECLARE @ReconstructedRevenue DECIMAL(18,2) = (
    SELECT ISNULL(SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia), 0)
    FROM dbo.THANHTOAN tt
    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
    WHERE tt.TrangThai = N'Thành công'
);
IF @ReconstructedRevenue <> 446500.00
    THROW 51002, N'Lỗi đối soát: Tổng doanh thu tái dựng bị sai lệch!', 1;
```

---

## 6. Kế hoạch Hoàn tác (Rollback & Restore Strategy)

### Kịch bản 1: Hoàn tác nhanh tại chỗ (In-place Rollback Script)
```sql
BEGIN TRANSACTION;
-- 1. Thêm lại cột SoTien
ALTER TABLE dbo.THANHTOAN ADD SoTien DECIMAL(18,2) NULL;

-- 2. Phục hồi dữ liệu SoTien từ DONDATVE
UPDATE tt
SET tt.SoTien = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;

ALTER TABLE dbo.THANHTOAN ALTER COLUMN SoTien DECIMAL(18,2) NOT NULL;

-- 3. Tạo lại Constraint và Index
ALTER TABLE dbo.THANHTOAN ADD CONSTRAINT CK_THANHTOAN_SoTien CHECK ([SoTien] >= 0);
DROP INDEX IX_THANHTOAN_DonDatVe ON dbo.THANHTOAN;
CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
INCLUDE([SoTien], [NgayThanhToan], [NgayTao]);

-- 4. Khôi phục Stored Procedures và Views về phiên bản trước
COMMIT TRANSACTION;
```

### Kịch bản 2: Phục hồi từ bản Full Backup
```sql
USE [master];
ALTER DATABASE [CinemaBookingDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [CinemaBookingDB]
FROM DISK = N'C:\Backups\CinemaBookingDB_PRE_3NF_MIGRATION.bak'
WITH REPLACE;
ALTER DATABASE [CinemaBookingDB] SET MULTI_USER;
```

---
*Tài liệu kế hoạch di trú phục vụ thẩm định kỹ thuật Gate B. Tuyệt đối không tự ý chạy migration khi chưa có lệnh Gate C.*

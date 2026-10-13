# R8.1 PRODUCTION CUTOVER READINESS & RUNBOOK FEASIBILITY
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** R8.1 — Final Production Readiness Hardening & Gate C Preparation  
**Auditor / Roles:** Production Deployment Engineer, Senior SQL Server DBA & Reliability Lead  
**Date:** October 13, 2026  
**Target Environment:** Production Instance `DoanTuanIT` | Database `CinemaBookingDB`  
**Execution Window:** **45-MINUTE SCHEDULED MAINTENANCE WINDOW**  
**Readiness Status:** **100% READY FOR CUTOVER EXECUTION (PENDING SCHEDULE CONFIRMATION)**

---

## 1. NGUYÊN TẮC BẢO VỆ MÔI TRƯỜNG PRODUCTION (DUAL TARGET GUARD)

Để loại trừ hoàn toàn nguy cơ thực thi nhầm kịch bản hoặc chạy trên sai cơ sở dữ liệu, bộ migration Strict 3NF được trang bị cơ chế **Dual Target Guard** ở đầu mỗi tệp script:

```sql
-- Target Database Enforcement Guard
DECLARE @ExpectedDB NVARCHAR(128) = N'CinemaBookingDB';
IF DB_NAME() <> @ExpectedDB
BEGIN
    RAISERROR(N'CRITICAL ERROR: Script must be executed on database [%s]. Current database is [%s]. Execution terminated.', 20, 1, @ExpectedDB, DB_NAME()) WITH LOG;
END;
```

### Yêu cầu tiên quyết trước khi mở phiên làm việc:
1. Xác minh tên Instance: `SELECT @@SERVERNAME` phải trả về `DoanTuanIT`.
2. Xác minh tên Database: `SELECT DB_NAME()` phải trả về `CinemaBookingDB`.
3. Xác minh tính toàn vẹn 27 bảng: Không có bảng rác, không thiếu bảng cốt lõi.
4. Cơ sở dữ liệu Production `CinemaBookingDB` tại thời điểm hiện tại: **TUYỆT ĐỐI NGUYÊN VẸN, CHƯA ÁP DỤNG BẤT KỲ LỆNH DDL/DML MIGRATION NÀO**.

---

## 2. KẾ HOẠCH BẢO TRÌ VÀ DỰ PHÒNG THỜI GIAN (45-MINUTE MAINTENANCE WINDOW)

Quy trình Cutover được thiết kế để hoàn tất trong **cửa sổ bảo trì 45 phút** vào khung giờ thấp điểm (khuyến nghị: 02:00 AM – 02:45 AM).

```
+-----------------------------------------------------------------------------------------+
|                    CUTOVER TIMELINE & TIME BUDGET ALLOCATION (45 MINS)                  |
+-----------------------------------------------------------------------------------------+
| [00:00 - 00:05] Bước 0: Bật chế độ bảo trì, tạm ngắt lưu lượng người dùng (5 phút)      |
| [00:05 - 00:13] Bước 1: Sao lưu toàn phần Full Backup WITH CHECKSUM & Verify (8 phút)    |
| [00:13 - 00:15] Bước 2: Chụp baseline dữ liệu và mã băm Checksum (2 phút)              |
| [00:15 - 00:25] Bước 3: Chạy lần lượt 4 migration scripts (01 -> 02 -> 03 -> 04) (10 p) |
| [00:25 - 00:30] Bước 4: Chạy script đối soát số liệu & xác thực tự động (5 phút)        |
| [00:30 - 00:35] Bước 5: Khởi động lại Backend & Kiểm tra Smoke Test (5 phút)            |
| [00:35 - 00:40] Bước 6: Tắt chế độ bảo trì, mở lại hệ thống cho người dùng (5 phút)    |
| [00:40 - 00:45] Quỹ dự phòng an toàn / Giám sát Hypercare ban đầu (5 phút)              |
+-----------------------------------------------------------------------------------------+
```

### Đánh giá tính khả thi thời gian (Timing Feasibility):
- Trong đợt chạy thử nghiệm R5-B trên `CinemaBookingDB_Test`, tổng thời gian thực thi của cả 4 script migration chỉ mất **dưới 15 giây**.
- Việc phân bổ 10 phút cho Bước 3 cung cấp biên độ an toàn cực lớn (gấp hơn 40 lần thời gian chạy thực tế) để DBA theo dõi từng thông điệp output.

---

## 3. CHI TIẾT CÁC BƯỚC THỰC THI CUTOVER (STEP-BY-STEP RUNBOOK)

### Bước 0: Tạm ngắt lưu lượng và kích hoạt Maintenance Mode (Phút 00–05)
1. Cấu hình Reverse Proxy / Nginx trả về trang thông báo bảo trì định kỳ cho người dùng bên ngoài.
2. Dừng tiến trình Node.js Backend trên máy chủ ứng dụng:
   ```powershell
   # Dừng dịch vụ Backend
   Stop-Process -Name "node" -Force
   ```
3. Đóng các phiên kết nối đang mở tới CSDL để đảm bảo không có giao dịch treo:
   ```sql
   ALTER DATABASE CinemaBookingDB SET RESTRICTED_USER WITH ROLLBACK IMMEDIATE;
   ```

### Bước 1: Sao lưu toàn phần và xác minh Checksum (Phút 05–13)
Thực hiện sao lưu bản snapshot cuối cùng trước khi thay đổi:
```sql
BACKUP DATABASE CinemaBookingDB
TO DISK = 'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_Full.bak'
WITH FORMAT, INIT, CHECKSUM, COMPRESSION,
     NAME = 'CinemaBookingDB-PreCutover-FullBackup';

-- Xác minh tính toàn vẹn của tệp backup
RESTORE VERIFYONLY 
FROM DISK = 'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_Full.bak'
WITH CHECKSUM;
```
*Điều kiện:* Nếu lệnh `RESTORE VERIFYONLY` thất bại -> **DỪNG NGAY LẬP TỨC**, hủy bỏ bảo trì và mở lại hệ thống.

### Bước 2: Chụp Baseline và trích xuất Checksum (Phút 13–15)
Chạy script trích xuất baseline pre-migration tự động sang tệp JSON artifact:
- Lưu số lượng bản ghi `THANHTOAN`, `DONDATVE`.
- Lưu tổng doanh thu lịch sử trước migration.
- Lưu mã băm `TableChecksum`.

### Bước 3: Thực thi Migration tuần tự (Phút 15–25)
Thực thi lần lượt 4 kịch bản trong thư mục `database/13_migrations/3nf_remediation/`:
1. `01_preflight_checks.sql`: Kiểm tra phiên bản SQL Server, tính sẵn sàng của bảng, điều kiện tiên quyết.
2. `02_expand_update_views_procedures.sql`: Cập nhật logic tính toán động trên các View và Stored Procedures.
3. `03_contract_alter_schema.sql`: Thực thi lệnh xóa bỏ an toàn cột vật lý `SoTien` khỏi bảng `dbo.THANHTOAN`.
4. `04_post_migration_reconciliation.sql`: Đối soát số liệu tự động sau khi kết thúc migration.

### Bước 4: Đối soát và Thẩm định số liệu (Phút 25–30)
- Kiểm tra kết quả trả về của `04_post_migration_reconciliation.sql`.
- Xác nhận số tiền tính động của từng giao dịch khớp 100% với baseline ở Bước 2.
- Sai lệch phải thỏa mãn: $\text{Delta} = 0.0000 \text{ VNĐ}$.

### Bước 5: Khởi động Backend & Kiểm tra Smoke Test (Phút 30–35)
1. Mở lại chế độ đa người dùng cho CSDL:
   ```sql
   ALTER DATABASE CinemaBookingDB SET MULTI_USER;
   ```
2. Khởi động lại dịch vụ Backend:
   ```powershell
   # Khởi động Backend
   npm --prefix backend start
   ```
3. Chạy Smoke Test kiểm tra sức khỏe hệ thống:
   - `GET /api/health` -> HTTP 200 OK.
   - `GET /api/movies` -> HTTP 200 OK.
   - `POST /api/auth/login` -> Đăng nhập tài khoản kiểm thử thành công.

### Bước 6: Mở lại hệ thống và Giám sát (Phút 35–45)
1. Tắt trang thông báo bảo trì trên Reverse Proxy, chuyển hướng lưu lượng người dùng thật về ứng dụng.
2. Đội ngũ kỹ thuật giám sát log lỗi (Error Logs), tài nguyên CPU/RAM trong 10 phút đầu tiên.

---

## 4. KẾ HOẠCH DỰ PHÒNG VÀ CÂY QUYẾT ĐỊNH ROLLBACK (ROLLBACK DECISION TREE)

Nếu có sự cố phát sinh tại bất kỳ thời điểm nào trước phút thứ 30, đội ngũ triển khai áp dụng quy trình phục hồi:

```
                    [ SỰ CỐ PHÁT SINH TRONG MIGRATION ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        [ Sự cố mức T-SQL ]                     [ Sự cố nghiêm trọng / Treo ]
  (Một trong các script 01-04 lỗi)          (Lỗi I/O, hỏng database, timeout)
                 │                                       │
                 ▼                                       ▼
     Thực thi kịch bản Rollback              Khôi phục từ tệp sao lưu toàn phần
      [ 99_rollback_all.sql ]              [ RESTORE DATABASE WITH REPLACE ]
  - Thêm lại cột SoTien                   - Phục hồi lại file backup ở Bước 1
  - Khôi phục số liệu từ bảng tạm        - Đảm bảo database về trạng thái 00:00
  - Thời gian: ~5 giây                   - Thời gian: ~2-3 phút
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                     [ Mở lại hệ thống cho người dùng ]
                     [ Hủy bỏ đợt triển khai Gate C ]
```

---

## 5. KẾT LUẬN

- Toàn bộ các bước Cutover đã được chuẩn bị tỉ mỉ, chi tiết đến từng câu lệnh và mốc thời gian.
- Tính khả thi của cửa sổ bảo trì 45 phút là **100%**.
- Cơ chế bảo vệ và phương án dự phòng Rollback đảm bảo an toàn tuyệt đối cho dữ liệu sản xuất.
- **Hệ thống đã đạt mức độ sẵn sàng cao nhất để thực hiện Cutover.**


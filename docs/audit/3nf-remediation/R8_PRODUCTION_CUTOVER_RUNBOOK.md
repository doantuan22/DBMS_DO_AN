# R8 PRODUCTION CUTOVER RUNBOOK — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R8 — Final 3NF Certification & Production Release Readiness  
**Tài liệu:** Quy trình Vận hành Triển khai Production Chính thức (Production Cutover Runbook)  
**Mục tiêu Cơ sở dữ liệu:** `CinemaBookingDB` trên SQL Server Instance `DoanTuanIT`  
**Thời lượng Cửa sổ Bảo trì Dự kiến:** **45 phút** (Khung giờ đề xuất: 02:00 – 02:45 ICT)  
**Trạng thái Kế hoạch:** **SẴN SÀNG THẨM ĐỊNH — TUYỆT ĐỐI CHƯA THỰC THI CHO ĐẾN KHI CÓ PHÊ DUYỆT GATE C**  

---

## 1. Phân định Vai trò và Trách nhiệm (Release Team Matrix)

| Vai trò | Nhân sự đảm nhiệm | Trách nhiệm chính |
|---|---|---|
| **Release Commander / Migration Lead** | Senior Migration Engineer | Điều phối tổng thể các bước, theo dõi đồng hồ bảo trì, phát lệnh chuyển bước |
| **Primary Database Operator (DBA)** | Senior SQL Server DBA | Thực thi backup, kiểm tra checksum, chạy các scripts di trú theo đúng thứ tự |
| **Security Auditor** | Infrastructure Security Lead | Cấu hình tài khoản `CinemaAppUser`, kiểm tra phân quyền Least Privilege |
| **QA Verification Lead** | Quality Assurance Lead | Thực thi kịch bản kiểm tra khói (Smoke Test), xác nhận sức khỏe API Backend |
| **Gate Approver** | Chủ dự án (Project Owner) | Ban hành quyết định phê duyệt Gate C và quyết định ký duyệt GO / NO-GO |

---

## 2. Giai đoạn Tiền Triển khai (Pre-Deployment Phase: T - 60m đến T - 00m)

### 2.1. Kiểm tra Hạ tầng và Đóng băng Phiên bản (Code & Infrastructure Freeze)
1. **Khóa Git Tag:** Cố định commit được phát hành: `git rev-parse HEAD`. Không chấp nhận thêm bất kỳ thay đổi nào vào nhánh release.
2. **Kiểm tra Dung lượng Ổ đĩa:**
   - Ổ `C:` (chứa Data/Log): Tối thiểu trống **50 GB** (Hiện tại trống 271 GB $\Rightarrow$ PASS).
   - Ổ `D:` (chứa Code/Backup): Tối thiểu trống **30 GB** (Hiện tại trống 95 GB $\Rightarrow$ PASS).
3. **Kiểm tra Trạng thái Database:**
   - Đảm bảo `CinemaBookingDB` ở trạng thái `ONLINE`, `recovery_model_desc = 'FULL'`, `is_read_committed_snapshot_on = 1`.
4. **Kiểm tra Baseline Dữ liệu Production:**
   - Số lượng bảng: đúng **27 bảng**.
   - Cột `dbo.THANHTOAN.SoTien` tồn tại (kiểu `DECIMAL(18, 2)`).
   - Tổng số Payment Attempts: **4 bản ghi** (Tổng tiền: 545,500 VNĐ; Thành công: 446,500 VNĐ).

---

## 3. Chính sách An toàn Khóa Mục tiêu (Target Guard Policy)

Bộ script trong `database/13_migrations/3nf_remediation/` hiện đang có Target Guard khóa vào `CinemaBookingDB_Test`.
Khi triển khai Production tại Gate C, **tuyệt đối không dùng tìm kiếm/thay thế mù (blind search/replace)**. Thay vào đó, quy trình triển khai sử dụng bộ script chuẩn hóa với Target Guard kép bảo vệ nghiêm ngặt:

```sql
-- CHÍNH SÁCH BẢO VỆ MỤC TIÊU PRODUCTION
IF DB_NAME() <> N'CinemaBookingDB'
BEGIN
    THROW 51000, N'FATAL GUARD: Script này chỉ được phép thực thi trên cơ sở dữ liệu [CinemaBookingDB]!', 1;
END;

IF SERVERPROPERTY('ServerName') <> N'DoanTuanIT'
BEGIN
    THROW 51000, N'FATAL GUARD: Máy chủ không khớp với cấu hình triển khai được duyệt [DoanTuanIT]!', 1;
END;
```

---

## 4. Trình tự Triển khai Chi tiết trong Cửa sổ Bảo trì (Maintenance Window Timeline)

```text
  T+00m ───► [1] Bật Maintenance Mode & Đóng Ingress Traffic
  T+03m ───► [2] Dừng Toàn bộ Background Writers & Schedulers
  T+05m ───► [3] Thực hiện FULL BACKUP WITH CHECKSUM & RESTORE VERIFYONLY
  T+10m ───► [4] Thực thi 01_preflight_checks.sql (Chụp Baseline vào tempdb)
  T+15m ───► [5] Thực thi 02_expand_update_views_procedures.sql
  T+20m ───► [6] Thực thi 03_contract_alter_schema.sql (DROP COLUMN SoTien)
  T+23m ───► [7] Thực thi 04_post_migration_reconciliation.sql (Đối soát 100%)
  T+28m ───► [8] Cấu hình Tài khoản Hạn quyền CinemaAppUser (Least Privilege)
  T+32m ───► [9] Khởi động Backend Production & Chạy Smoke Tests
  T+40m ───► [10] Phê duyệt Nghiệm thu Cutover & Mở lại Traffic
```

### Chi tiết Từng Bước Thực hiện:

#### Bước 1 & 2: Bật Chế độ Bảo trì & Đóng Luồng Ghi (T + 00m – T + 05m)
1. Kích hoạt trang thông báo bảo trì trên Gateway / Web Server (HTTP 503 Maintenance).
2. Tạm dừng các tiến trình backend: `pm2 stop all` hoặc `Stop-Process -Name node`.
3. Kiểm tra không còn session ghi dữ liệu nào đang mở:
   ```sql
   SELECT session_id, status, command, host_name, program_name 
   FROM sys.dm_exec_sessions 
   WHERE database_id = DB_ID('CinemaBookingDB') AND is_user_process = 1;
   ```

#### Bước 3: Sao lưu Toàn diện và Kiểm tra Tính toàn vẹn (T + 05m – T + 10m)
1. Thực hiện Full Backup trước giờ G:
   ```sql
   BACKUP DATABASE [CinemaBookingDB]
   TO DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_Cutover_GateC_PreMigration.bak'
   WITH CHECKSUM, COMPRESSION, INIT, STATS = 10;
   ```
2. Kiểm tra tính hợp lệ của bản sao lưu:
   ```sql
   RESTORE VERIFYONLY 
   FROM DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_Cutover_GateC_PreMigration.bak'
   WITH CHECKSUM;
   ```
   *Điều kiện tiếp tục: Kết quả trả về "The backup set on file 1 is valid."*

#### Bước 4: Chạy Tiền kiểm và Chốt Baseline Đối soát (T + 10m – T + 15m)
1. Chạy script `01_preflight_checks.sql` (bản Production).
2. Ghi nhận `PreMigration_PaymentAttempts = 4`, `PreMigration_Revenue = 446,500.00 VNĐ`, lưu snapshot đối soát vào `tempdb`.

#### Bước 5: Thực thi Giai đoạn Mở rộng (Expand Phase: T + 15m – T + 20m)
1. Chạy script `02_expand_update_views_procedures.sql`.
2. Cập nhật 6 views, 8 Stored Procedures và 1 Index sang cơ chế tái dựng động `SoTien` từ `DONDATVE`.

#### Bước 6: Thực thi Giai đoạn Thu hẹp Schema (Contract Phase: T + 20m – T + 23m)
1. Chạy script `03_contract_alter_schema.sql`.
2. Gỡ bỏ ràng buộc `CK_THANHTOAN_SoTien` và thực thi:
   ```sql
   ALTER TABLE dbo.THANHTOAN DROP COLUMN SoTien;
   ```

#### Bước 7: Hậu kiểm và Đối soát Bắt buộc (Reconciliation: T + 23m – T + 28m)
1. Chạy script `04_post_migration_reconciliation.sql`.
2. **Quy tắc An toàn Tối cao:** Nếu đối soát phát hiện bất kỳ sai lệch nào về số bản ghi, xuất hiện bản ghi mồ côi (Orphan) hoặc độ lệch doanh thu $\neq 0$, script tự động kích hoạt `THROW 51030` $\Rightarrow$ **Lập tức dừng và chuyển sang Kịch bản Phục hồi Thảm họa (Rollback)**.

#### Bước 8: Thiết lập Phân quyền Tối thiểu (Hardening: T + 28m – T + 32m)
1. Chạy script cấu hình tài khoản `CinemaAppUser`:
   - `DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO CinemaAppUser;`
   - `GRANT EXECUTE ON SCHEMA::dbo TO CinemaAppUser;`
2. Cập nhật tệp cấu hình production:
   - `DB_USER=CinemaAppUser`
   - `DB_PASSWORD=<New_Generated_Password>`

#### Bước 9: Khởi động Ứng dụng & Smoke Testing (T + 32m – T + 40m)
1. Khởi động Backend: `node backend/src/server.js`.
2. Chạy smoke test:
   - Gọi `GET /api/health/db` $\Rightarrow$ Kết quả `{ ok: true }`.
   - Gọi `GET /api/movies` $\Rightarrow$ Trả về danh sách phim.
   - Thử nghiệm tạo 1 đơn đặt vé và tra cứu chi tiết đơn hàng.

#### Bước 10: Nghiệm thu Phát hành & Mở Traffic (T + 40m – T + 45m)
1. Migration Lead báo cáo kết quả kiểm tra thành công cho Chủ dự án.
2. Dỡ bỏ Maintenance Mode, cho phép người dùng truy cập.
3. Chuyển sang chế độ giám sát tăng cường (Post-Release Monitoring) trong 2 giờ tiếp theo.


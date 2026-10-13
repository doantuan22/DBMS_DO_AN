# R5-B MIGRATION EXECUTION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R5-B — Strict 3NF Migration Execution on Isolated Test Database  
**Vai trò:** Principal SQL Server Migration Engineer, Database Reliability Engineer  
**Cơ sở dữ liệu mục tiêu:** `CinemaBookingDB_Test` (ISOLATED TEST DATABASE ONLY)  
**Tài khoản thực thi:** `CinemaTestUser` (Non-sysadmin, `db_owner` trên Test DB)  
**Thời gian thực thi:** 13/10/2026 15:30:00 – 16:30:00 (ICT)  
**Trạng thái Production:** `CinemaBookingDB` — **100% UNTOUCHED (0 thay đổi, 0 script chạy)**  
**Gate C Production:** **STRICTLY NOT APPROVED**  

---

## 1. Tóm tắt kết quả thực thi di trú (Executive Summary)

Đợt diễn tập di trú Strict 3NF trên môi trường cơ sở dữ liệu kiểm thử độc lập `CinemaBookingDB_Test` đã hoàn thành thành công toàn diện, thỏa mãn 100% tiêu chí an toàn khắt khe của dự án:
- **Phase 0 (Mandatory Safety Gate):** Đạt 10/10 điều kiện an toàn trước khi chạy DDL/DML. Tài khoản `CinemaTestUser` bị chặn hoàn toàn truy cập Production (`CinemaBookingDB`).
- **Phase 1 (Baseline Capture & Preflight):** Thu thập và lưu trữ bền vững baseline tại `tempdb` và xuất file artifact JSON.
- **Phase 2 (Expand Phase):** Cập nhật 8 readers sang đọc động từ `DONDATVE`, chuyển đổi `THANHTOAN.SoTien` sang `NULLABLE`, cập nhật writer `sp_Payment_CreateAttempt` loại bỏ cột `SoTien`.
- **Phase 3 (Contract Phase):** Khóa độc quyền bảng `THANHTOAN`, xóa constraint `CK_THANHTOAN_SoTien`, xóa index cũ, xóa vật lý cột `THANHTOAN.SoTien`, tạo index mới tinh gọn.
- **Phase 5 (Rollback Drill):** Kiểm chứng hoàn tác tức thì bằng `99_rollback_all.sql`, khôi phục 100% schema và dữ liệu.
- **Phase 6 (Re-Migration):** Tái thực thi quy trình di trú từ đầu để chứng minh tính tất định và lặp lại. Toàn bộ các bước tái di trú thành công hoàn hảo.

---

## 2. Thông tin nhận dạng đợt di trú (Migration Identifiers)

| Thuộc tính | Lần di trú ban đầu (Initial Migration) | Lần tái di trú sau Rollback (Re-Migration) |
|---|---|---|
| **MigrationRunID** | `AB352E8F-0734-4401-8355-CC6D51AC13C5` | `A0DC51EF-214B-4169-8FDE-D53F0DB17FAD` |
| **Database Name** | `CinemaBookingDB_Test` | `CinemaBookingDB_Test` |
| **Execution Login** | `CinemaTestUser` | `CinemaTestUser` |
| **Server Instance** | `DoanTuanIT` (localhost:1433) | `DoanTuanIT` (localhost:1433) |
| **Preflight Status** | `PREFLIGHT_PASS` | `PREFLIGHT_PASS` |
| **Reconciliation Status** | `RECONCILED_PASS` | `RECONCILED_PASS` |
| **Rollback Status** | `ROLLED_BACK` | N/A (Đang duy trì schema đích 3NF) |
| **Artifact JSON Path** | `docs/audit/3nf-remediation/baseline/pre_migration_baseline_CinemaBookingDB_Test.json` | `docs/audit/3nf-remediation/baseline/pre_migration_baseline_CinemaBookingDB_Test.json` |

---

## 3. Nhật ký thực thi chi tiết theo từng Phase (Execution Log)

### 3.1. Phase 0 — Mandatory Safety Gate
- **Kịch bản thực thi:** `scratch/phase0_safety_gate.ps1`
- **Kết quả:** **10/10 CHECKS PASSED (100%)**
  1. Server Instance: `DoanTuanIT` (khớp hoàn toàn).
  2. Database Name: `CinemaBookingDB_Test`.
  3. Execution Login: `CinemaTestUser` (IsSysadmin = 0, IsDbOwner = 1).
  4. Access Denied on Production: Thử nghiệm kết nối tới `CinemaBookingDB` bị chặn với lỗi `Msg 18456 (Login failed for user 'CinemaTestUser')`.
  5. Schema Baseline: 27 bảng, cột `SoTien` tồn tại (`COL_LENGTH = 9`), 4 payment attempts.
  6. User Sessions: 0 session người dùng nào khác hoạt động trên Test DB.
  7. Maintenance Freeze: Đã xác nhận không có worker ghi dữ liệu.
  8. Mocks Active: `backend/.env.test` kích hoạt `MOCK_NOTIFICATIONS=true`, `MOCK_PAYMENT_GATEWAY=true`, `DISABLE_EXTERNAL_WEBHOOKS=true`.
  9. Pre-Migration Test Backup: Tạo file snapshot `CinemaBookingDB_Test_PreMigration.bak`, `RESTORE VERIFYONLY WITH CHECKSUM` thành công.
  10. Staging Permissions: `CinemaTestUser` có quyền `db_owner` trên `tempdb`, tạo staging table thành công không cần sysadmin.

### 3.2. Phase 1 — Baseline Capture & Preflight
- **Script:** `database/13_migrations/3nf_remediation/01_preflight_checks.sql`
- **Thời gian:** 15:34:33 (Lần 1) & 15:52:44 (Lần 2)
- **Kết quả:** **PASS**
- **Dữ liệu tiền kiểm đối soát:**
  - Tổng số bảng: 27 bảng.
  - Cột vật lý `THANHTOAN.SoTien`: Tồn tại, kiểu `DECIMAL(18,2) NOT NULL`.
  - Check constraint: `CK_THANHTOAN_SoTien` tồn tại.
  - Index: `IX_THANHTOAN_DonDatVe` tồn tại, chứa cột `SoTien`.
  - Orphan Payments: 0 bản ghi.
  - Payment Attempts: 4 bản ghi.
  - Đơn hàng tham chiếu: 3 đơn hàng.
  - Giao dịch thành công: 3 bản ghi.
  - Giao dịch thất bại: 1 bản ghi.
  - Doanh thu lịch sử: 446,500.00 VNĐ.
  - Số bản ghi có `SoTien IS NULL`: 0.
  - Số đơn hàng có thành phần tiền NULL: 0.
  - Số bản ghi tính toán âm (< 0): 0.
  - Sai lệch số tiền (Mismatch Count): 0.
  - 9/9 SQL modules phụ thuộc: Tồn tại đầy đủ.
- **Staging Artifacts:**
  - Đã lưu vào `tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test`.
  - Đã lưu vào `tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test`.
  - Đã xuất ra file ngoại vi `docs/audit/3nf-remediation/baseline/pre_migration_baseline_CinemaBookingDB_Test.json`.

### 3.3. Phase 2 — Expand Migration
- **Script:** `database/13_migrations/3nf_remediation/02_expand_update_views_procedures.sql`
- **Thời gian:** 15:36:00 (Lần 1) & 15:53:59 (Lần 2)
- **Thứ tự thực hiện:** Reader → Transitional Schema → Writer.
- **Chi tiết cập nhật 9 modules:**
  1. `dbo.vw_DoanhThuTheoRap`: Đọc doanh thu tái dựng từ `DONDATVE` (`SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia)`).
  2. `dbo.sp_Payment_UpdateResult`: Đọc trạng thái đơn, không phụ thuộc vào `SoTien` vật lý.
  3. `dbo.sp_Admin_Dashboard`: Tính doanh thu hôm nay từ `DONDATVE` tái dựng.
  4. `dbo.sp_Admin_Report_Revenue`: Báo cáo doanh thu theo rạp/ngày từ `DONDATVE` tái dựng.
  5. `dbo.sp_Manager_Revenue`: Báo cáo doanh thu trong phạm vi quản lý từ `DONDATVE` tái dựng.
  6. `dbo.sp_Order_GetDetailByCustomer`: Trả về trường `SoTien` tính từ `DONDATVE` với bí danh `SoTien`.
  7. `dbo.sp_StaffBooking_Detail`: Trả về trường `SoTien` tính từ `DONDATVE` với bí danh `SoTien`.
  8. `dbo.sp_Support_Complaint_GetOrderReference`: Trả về trường `SoTien` tính từ `DONDATVE` với bí danh `SoTien`.
  - **Schema nới lỏng:** `ALTER TABLE dbo.THANHTOAN ALTER COLUMN SoTien DECIMAL(18,2) NULL` (`AllowsNull = 1`).
  9. `dbo.sp_Payment_CreateAttempt`: Bỏ cột `SoTien` khỏi lệnh `INSERT INTO dbo.THANHTOAN`.
- **Kết quả:** **PASS** (100% 9 modules biên dịch thành công).

### 3.4. Phase 3 — Contract Migration
- **Script:** `database/13_migrations/3nf_remediation/03_contract_alter_schema.sql`
- **Thời gian:** 15:38:00 (Lần 1) & 15:54:32 (Lần 2)
- **Thao tác DDL:**
  1. Khóa bảng độc quyền: `SELECT TOP 0 1 FROM dbo.THANHTOAN WITH (TABLOCKX, HOLDLOCK)`.
  2. Drop Check Constraint: `ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT [CK_THANHTOAN_SoTien]`.
  3. Drop Old Index: `DROP INDEX [IX_THANHTOAN_DonDatVe] ON dbo.[THANHTOAN]`.
  4. Drop Physical Column: `ALTER TABLE dbo.THANHTOAN DROP COLUMN [SoTien]`.
  5. Create New Index: Tạo `IX_THANHTOAN_DonDatVe` mới trên `(DonDatVeID, TrangThai)` include `(NgayThanhToan, NgayTao)` (không còn `SoTien`).
- **Khẳng định sau Contract:**
  - `COL_LENGTH('dbo.THANHTOAN', 'SoTien') IS NULL` (Cột vật lý đã biến mất hoàn toàn).
  - `PK_THANHTOAN`, `FK_THANHTOAN_DonDatVe`, `UQ_THANHTOAN_MaGiaoDich` nguyên vẹn.
  - Số lượng bảng nghiệp vụ: Đúng 27 bảng.
- **Kết quả:** **PASS**.

---

## 4. Các điểm kỹ thuật đã xử lý trong quá trình di trú (Hardened Resolutions)

Trong quá trình thực thi trên SQL Server thực tế, đội ngũ kỹ thuật đã phát hiện và xử lý triệt để 2 vấn đề môi trường runtime:
1. **Lỗi SET Options khi tái tạo Index (`Msg 1934`):**
   - *Hiện tượng:* Lệnh `CREATE INDEX` trong SQL Server đòi hỏi các cờ `QUOTED_IDENTIFIER` và `ANSI_NULLS` phải ở trạng thái `ON`.
   - *Khắc phục:* Bổ sung tường minh `SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;` ở đầu tất cả các scripts di trú và rollback (`03_contract_alter_schema.sql`, `99_rollback_all.sql`).
2. **Lỗi Collation Conflict giữa `tempdb` và Database (`Msg 468`):**
   - *Hiện tượng:* Database `CinemaBookingDB_Test` sử dụng collation `Vietnamese_CI_AS`, trong khi instance `tempdb` mặc định sử dụng collation `SQL_Latin1_General_CP1_CI_AS`. Khi so sánh chuỗi `b.TrangThai <> tt.TrangThai`, SQL Server ném lỗi xung đột collation.
   - *Khắc phục:*
     - Cập nhật DDL tạo bảng staging trong `01_preflight_checks.sql` với `COLLATE DATABASE_DEFAULT`.
     - Bổ sung tường minh mệnh đề `COLLATE DATABASE_DEFAULT` vào biểu thức so sánh chuỗi trong `04_post_migration_reconciliation.sql` và `99_rollback_all.sql`.

---

## 5. Kết luận trạng thái Phase R5-B Migration Execution

- **Tỷ lệ thành công:** 100% các bước di trú thực thi thành công không lỗi.
- **Tính lặp lại (Idempotency & Replayability):** Được kiểm chứng thành công qua 2 chu kỳ: Di trú lần 1 $\to$ Rollback $\to$ Tái di trú lần 2.
- **Bảo toàn dữ liệu:** Không phát sinh bất kỳ mất mát dữ liệu hoặc thay đổi cấu trúc ngoài phạm vi được phê duyệt.
- **KẾT LUẬN:** **R5-B MIGRATION EXECUTION: VERIFIED PASS**.


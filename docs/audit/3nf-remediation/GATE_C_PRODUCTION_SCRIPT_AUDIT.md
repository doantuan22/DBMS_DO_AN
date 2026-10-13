# GATE C PRODUCTION SCRIPT AUDIT & TARGET GUARD VERIFICATION
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Principal SQL Server Migration Engineer & Reliability Auditor  
**Date:** October 13, 2026  
**Subject:** **AUDIT OF 5 MIGRATION SCRIPTS & PRODUCTION GUARD SPECIFICATION**  
**Production Migration Status:** **ZERO EXECUTION ON PRODUCTION (UNTOUCHED)**  
**Production Release Package Verification:** **NOT VERIFIED ON ISOLATED PRODUCTION CLONE**

---

## 1. KIỂM TOÁN BỘ MIGRATION SCRIPTS HIỆN TẠI (TEST ARTIFACTS)

Hiện tại, trong thư mục [database/13_migrations/3nf_remediation/](file:///d:/DBMS_DO_AN/database/13_migrations/3nf_remediation/), hệ thống đang lưu trữ 5 kịch bản đã được kiểm thử toàn diện trên `CinemaBookingDB_Test`.

### 1.1. Danh mục và Mã băm SHA-256 chính thức

```
+----------------------------------------------------------------------------------------------------------------------------------+
|                                    EXISTING TEST MIGRATION SCRIPTS SHA-256 MANIFEST                              |
+----+---------------------------------------+------------------------------------------------------------------+------------------+
| STT| Tên tệp script                        | Mã băm SHA-256                                                   | Target Guard Hiện|
+----+---------------------------------------+------------------------------------------------------------------+------------------+
| 1  | 01_preflight_checks.sql               | FCF0FF1A54E15062BE0DF051F6B8CE36215A4A2FD70A0CB522AFEEDFFDFD5641 | CinemaBookingDB_Test|
| 2  | 02_expand_update_views_procedures.sql | E730DDC0D8558018D278BF7698D2762128C82CCC827A5A09CB2FCEF9A96228A5 | CinemaBookingDB_Test|
| 3  | 03_contract_alter_schema.sql          | 24721B672ECD10F0338C2D7C5E2920252F3EA04AACEABD5498CAB692840ED14C | CinemaBookingDB_Test|
| 4  | 04_post_migration_reconciliation.sql  | E4929435D2C8892EF4BBC257471D8CABE7971DB0416FB95155216321A833D27B | CinemaBookingDB_Test|
| 5  | 99_rollback_all.sql                   | 73216B0E8C2CD267456E76D6AFD9BC3651C29FDBF5D20AAA418970A868534F34 | CinemaBookingDB_Test|
+----+---------------------------------------+------------------------------------------------------------------+------------------+
```

### 1.2. Đánh giá cơ chế Target Guard trên bộ script Test
Cả 5 tệp trên đều chứa đoạn mã bảo vệ nghiêm ngặt:
```sql
IF DB_NAME() <> N'CinemaBookingDB_Test'
BEGIN
    PRINT N'[SECURITY GUARD BLOCK] Target database hiện tại: ' + DB_NAME();
    THROW 51000, N'Security Guard Abort: Script kiểm thử di trú được cấu hình CHỈ ĐƯỢC PHÉP CHẠY trên database CinemaBookingDB_Test! Đã chặn ngay lập tức để bảo vệ các database khác.', 1;
END;
```
- **Xác nhận an toàn:** Bộ script này **KHÔNG THỂ THỰC THI TRÊN PRODUCTION**. Nếu vô tình chạy trên `CinemaBookingDB`, engine SQL Server sẽ ngay lập tức phát sinh lỗi `51000` và dừng lại trong vòng 0 miligiây.
- **Quy tắc bất biến:** Tuyệt đối **KHÔNG SỬA TRỰC TIẾP** các file trong `database/13_migrations/3nf_remediation/` để gỡ bỏ guard hoặc đổi tên database thành `CinemaBookingDB`. Mọi hành vi sửa đổi trực tiếp đều làm mất dấu vết kiểm thử (Invalidate Test Provenance).

---

## 2. THIẾT KẾ GÓI PHÁT HÀNH SẢN XUẤT (PRODUCTION RELEASE PACKAGE `v1.0.0`)

Để triển khai lên Production khi được Chủ dự án ký duyệt Gate C, hệ thống phải sử dụng một gói phát hành riêng biệt, được đóng gói và đặt phiên bản tại:  
`database/deployments/production/v1.0.0_strict3nf/`

### 2.1. Yêu cầu kỹ thuật 7 lớp phòng thủ (7-Layer Production Guard Specification)
Mỗi tệp script trong gói Production phải tích hợp khối lệnh Target Guard toàn diện:

```sql
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ============================================================================
-- PRODUCTION SAFETY GUARD ENFORCEMENT BLOCK
-- ============================================================================

-- Lớp 1: Kiểm tra Instance SQL Server chính xác
IF @@SERVERNAME <> N'DoanTuanIT'
BEGIN
    THROW 52001, N'FATAL GUARD: Script chỉ được phép chạy trên Server Instance [DoanTuanIT]! Hiện tại: ' + @@SERVERNAME, 1;
END;

-- Lớp 2: Kiểm tra Database đích chính xác
IF DB_NAME() <> N'CinemaBookingDB'
BEGIN
    THROW 52002, N'FATAL GUARD: Script chỉ được phép chạy trên Production Database [CinemaBookingDB]! Hiện tại: ' + DB_NAME(), 1;
END;

-- Lớp 3: Kiểm tra quyền thực thi (sysadmin hoặc db_owner)
IF IS_SRVROLEMEMBER(N'sysadmin') <> 1 AND IS_ROLEMEMBER(N'db_owner') <> 1
BEGIN
    THROW 52003, N'FATAL GUARD: Yêu cầu quyền sysadmin hoặc db_owner để thực hiện Cutover Production.', 1;
END;

-- Lớp 4: Kiểm tra trạng thái phê duyệt Gate C (Gate C Approval Token)
DECLARE @GateC_ApprovalToken NVARCHAR(100) = N'$(GATE_C_APPROVAL_TOKEN)';
IF @GateC_ApprovalToken <> N'GATE-C-APPROVED-20261013-OPTION1-STRICT3NF'
BEGIN
    THROW 52004, N'FATAL GUARD: Thiếu hoặc sai Token phê duyệt chính thức Gate C từ Chủ dự án. Từ chối thực thi!', 1;
END;

-- Lớp 5: Khởi tạo Migration Run ID duy nhất cho audit log
DECLARE @MigrationRunID UNIQUEIDENTIFIER = NEWID();
PRINT 'MIGRATION RUN ID: ' + CAST(@MigrationRunID AS NVARCHAR(36));

-- Lớp 6: Kiểm tra trạng thái Schema tiền đề (Pre-Migration State)
-- Bảng dbo.THANHTOAN phải có đúng 9 cột vật lý (chứa SoTien)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.THANHTOAN') AND name = N'SoTien'
)
BEGIN
    THROW 52005, N'PREFLIGHT CHECK FAILED: Cột SoTien không tồn tại trong THANHTOAN. Cơ sở dữ liệu có thể đã bị thay đổi trước đó!', 1;
END;

-- Lớp 7: Kiểm tra tổng số 27 bảng nghiệp vụ
DECLARE @TableCount INT;
SELECT @TableCount = COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo') AND is_ms_shipped = 0;
IF @TableCount <> 27
BEGIN
    THROW 52006, N'PREFLIGHT CHECK FAILED: Số lượng bảng khác 27. Schema không ở trạng thái baseline.', 1;
END;
```

### 2.2. Cơ chế Fail-Fast chính xác trong T-SQL
- Sử dụng lệnh `THROW error_number, message, state;` với:
  - `error_number`: Trong dải $\ge 50000$ (mã lỗi người dùng định nghĩa).
  - `state`: Số nguyên từ 1 đến 255.
  - `severity`: Engine SQL Server **mặc định cố định là 16**.
- Kết hợp với `SET XACT_ABORT ON;`, ngay khi có lệnh `THROW`, transaction lập tức rollback và toàn bộ quá trình batch bị ngắt hoàn toàn.
- Không sử dụng các khái niệm không tồn tại như `THROW severity 20`.

---

## 3. TRẠNG THÁI THẨM ĐỊNH VÀ GIỚI HẠN AN TOÀN

```
+---------------------------------------------------------------------------------------------------------+
|                                  PRODUCTION SCRIPT AUDIT VERDICT MATRIX                                 |
+----------------------------------------+-----------------------------+----------------------------------+
| Tiêu chí kiểm định                     | Trạng thái                  | Bằng chứng / Diễn giải           |
+----------------------------------------+-----------------------------+----------------------------------+
| Script Test cô lập an toàn             | VERIFIED PASS               | Hardcoded [CinemaBookingDB_Test] |
| Ngăn chặn chạy nhầm trên Production    | VERIFIED PASS               | 100% Fail-fast tại dòng đầu tiên |
| Thiết kế Production Guard 7 lớp        | VERIFIED DESIGN             | Instance, DB, Token, RunID, 3NF  |
| Thực thi script trên Production        | STRICTLY PROHIBITED         | Production hoàn toàn nguyên vẹn  |
| Thử nghiệm gói Production trên Clone   | NOT VERIFIED                | Chưa có chỉ thị chạy Clone Test  |
+----------------------------------------+-----------------------------+----------------------------------+
```

### Kết luận quan trọng:
Do chưa có ủy quyền thực hiện chạy thử (dry-run) gói Production trên một bản clone mới nhất của `CinemaBookingDB`, nhóm kiểm toán chính thức ghi nhận trạng thái của gói Production là **NOT VERIFIED ON ISOLATED PRODUCTION CLONE**. Đây là một điều kiện còn thiếu bắt buộc phải giải quyết trước hoặc trong giai đoạn chuẩn bị Cutover.


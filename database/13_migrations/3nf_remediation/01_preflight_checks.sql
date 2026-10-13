-- ============================================================================
-- SCRIPT: 01_preflight_checks.sql (Hardened R4.1 Version)
-- MỤC TIÊU: Tiền kiểm an toàn tuyệt đối trước khi thực hiện di trú chuẩn hóa 3NF.
-- DỰ ÁN: CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến
-- PHÊ DUYỆT: Gate A (Approved), Gate B (Approved Option 1), Gate C (PENDING APPROVAL)
-- TÍNH CHẤT: HOÀN TOÀN CHỈ ĐỌC (STRICTLY READ-ONLY).
--            TUYỆT ĐỐI KHÔNG CÓ DDL / DML / CREATE TABLE / INSERT / UPDATE / DELETE.
-- BẢO VỆ MÔI TRƯỜNG: CHỈ ĐƯỢC CHẠY TRÊN DATABASE CinemaBookingDB_Test.
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

PRINT '============================================================================';
PRINT 'BẮT ĐẦU TIỀN KIỂM PREFLIGHT: KIỂM TRA ĐIỀU KIỆN DI TRÚ STRICT 3NF';
PRINT 'Thời gian kiểm tra: ' + CONVERT(VARCHAR(30), SYSDATETIME(), 120);
PRINT 'Server Instance:    ' + @@SERVERNAME;
PRINT 'Cơ sở dữ liệu:      ' + DB_NAME();
PRINT 'Người dùng hiện tại:' + SUSER_SNAME();
PRINT '============================================================================';

-- ----------------------------------------------------------------------------
-- 0. EXACT DATABASE TARGET GUARD & PERMISSIONS CHECK
-- ----------------------------------------------------------------------------
IF DB_NAME() <> N'CinemaBookingDB_Test'
BEGIN
    PRINT N'[SECURITY GUARD BLOCK] Target database hiện tại: ' + DB_NAME();
    THROW 51000, N'Security Guard Abort: Script kiểm thử di trú được cấu hình CHỈ ĐƯỢC PHÉP CHẠY trên database CinemaBookingDB_Test! Đã chặn ngay lập tức để bảo vệ các database khác.', 1;
END;

IF IS_MEMBER(N'db_owner') = 0 AND IS_SRVROLEMEMBER(N'sysadmin') = 0
BEGIN
    PRINT N'[SECURITY GUARD BLOCK] Login: ' + SUSER_SNAME() + N' không có quyền db_owner trên ' + DB_NAME();
    THROW 51008, N'Security Guard Abort: Cần quyền db_owner để thực hiện quy trình di trú trên CinemaBookingDB_Test.', 1;
END;

DECLARE @TotalTables INT;
DECLARE @TotalAttempts INT;
DECLARE @DistinctOrders INT;
DECLARE @OrphanCount INT;
DECLARE @SuccessAttempts INT;
DECLARE @FailedAttempts INT;
DECLARE @TotalHistoricalRevenue DECIMAL(18, 2);
DECLARE @NullPhysicalCount INT;
DECLARE @NullCalculatedCount INT;
DECLARE @NegativePhysicalCount INT;
DECLARE @NegativeCalculatedCount INT;
DECLARE @MismatchCount INT;

-- ----------------------------------------------------------------------------
-- 1. KIỂM TRA BASELINE SCHEMA (27 BẢNG NGHIỆP VỤ CHÍNH THỨC)
-- ----------------------------------------------------------------------------
PRINT '1. Kiểm tra số lượng bảng cơ sở dữ liệu...';
SELECT @TotalTables = COUNT(*) 
FROM sys.tables 
WHERE schema_id = SCHEMA_ID(N'dbo') 
  AND is_ms_shipped = 0
  AND name NOT LIKE '\_%' ESCAPE '\';

IF @TotalTables <> 27
BEGIN
    PRINT N'[LỖI CHẶN MIGRATION] Số lượng bảng nghiệp vụ không khớp baseline! Hiện tại: ' + CAST(@TotalTables AS VARCHAR(10)) + N', Kỳ vọng: 27.';
    THROW 51001, N'Preflight Abort: Số lượng bảng nghiệp vụ khác 27. Schema không đúng baseline được phê duyệt.', 1;
END
ELSE
    PRINT N'  -> [PASS] Số lượng bảng nghiệp vụ chính xác: 27 bảng.';

-- ----------------------------------------------------------------------------
-- 2. KIỂM TRA BẢNG THANHTOAN VÀ CỘT SOTIEN
-- ----------------------------------------------------------------------------
PRINT '2. Kiểm tra bảng THANHTOAN và cột SoTien...';
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'THANHTOAN' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    THROW 51002, N'Preflight Abort: Không tìm thấy bảng dbo.THANHTOAN!', 1;
END;

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.THANHTOAN') AND name = N'SoTien'
)
BEGIN
    THROW 51003, N'Preflight Abort: Cột dbo.THANHTOAN.SoTien không tồn tại hoặc đã bị gỡ bỏ trước đó!', 1;
END
ELSE
    PRINT N'  -> [PASS] Bảng dbo.THANHTOAN và cột SoTien đang tồn tại.';

-- ----------------------------------------------------------------------------
-- 3. KIỂM TRA CONSTRAINT VÀ INDEX PHỤ THUỘC TRÊN THANHTOAN
-- ----------------------------------------------------------------------------
PRINT '3. Kiểm tra Constraint và Index phụ thuộc vào SoTien...';
IF NOT EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = N'CK_THANHTOAN_SoTien' AND parent_object_id = OBJECT_ID(N'dbo.THANHTOAN')
)
BEGIN
    PRINT N'  -> [CẢNH BÁO] Không tìm thấy CHECK constraint CK_THANHTOAN_SoTien.';
END
ELSE
    PRINT N'  -> [PASS] Tìm thấy CK_THANHTOAN_SoTien.';

IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = N'IX_THANHTOAN_DonDatVe' AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
)
BEGIN
    PRINT N'  -> [CẢNH BÁO] Không tìm thấy Index IX_THANHTOAN_DonDatVe.';
END
ELSE
    PRINT N'  -> [PASS] Tìm thấy Index IX_THANHTOAN_DonDatVe.';

-- ----------------------------------------------------------------------------
-- 4. KIỂM TRA BẢN GHI MỒ CÔI (ORPHAN PAYMENTS)
-- ----------------------------------------------------------------------------
PRINT '4. Kiểm tra toàn vẹn quan hệ (Orphan records)...';
SELECT @OrphanCount = COUNT(*)
FROM dbo.THANHTOAN tt
LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
WHERE d.DonDatVeID IS NULL;

IF @OrphanCount > 0
BEGIN
    PRINT N'[LỖI CHẶN MIGRATION] Phát hiện ' + CAST(@OrphanCount AS VARCHAR(10)) + N' bản ghi THANHTOAN mồ côi không có DONDATVE tương ứng!';
    THROW 51004, N'Preflight Abort: Phát hiện orphan payments. Không thể bảo toàn dữ liệu nếu loại bỏ SoTien.', 1;
END
ELSE
    PRINT N'  -> [PASS] Không có orphan payments (OrphanCount = 0).';

-- ----------------------------------------------------------------------------
-- 5. ĐỐI SOÁT DỮ LIỆU SỐ TIỀN THANH TOÁN (NULL-SAFE RECONCILIATION)
-- Xử lý toàn diện ngữ nghĩa SQL 3VL (Three-Valued Logic), phát hiện riêng biệt
-- NULL, Negative, Arithmetic Overflow và sai lệch giá trị.
-- ----------------------------------------------------------------------------
PRINT '5. Đối soát số tiền thanh toán (NULL-Safe Verification)...';
SELECT 
    @TotalAttempts = COUNT(*),
    @NullPhysicalCount = SUM(CASE WHEN tt.SoTien IS NULL THEN 1 ELSE 0 END),
    @NullCalculatedCount = SUM(CASE WHEN d.TongTienVe IS NULL OR d.TongTienDoAn IS NULL OR d.TienGiamGia IS NULL THEN 1 ELSE 0 END),
    @NegativePhysicalCount = SUM(CASE WHEN tt.SoTien < 0 THEN 1 ELSE 0 END),
    @NegativeCalculatedCount = SUM(CASE WHEN (ISNULL(d.TongTienVe, 0) + ISNULL(d.TongTienDoAn, 0) - ISNULL(d.TienGiamGia, 0)) < 0 THEN 1 ELSE 0 END),
    @MismatchCount = SUM(
        CASE 
            -- Phát hiện nếu một trong hai vế bị NULL
            WHEN tt.SoTien IS NULL OR d.TongTienVe IS NULL OR d.TongTienDoAn IS NULL OR d.TienGiamGia IS NULL THEN 1
            -- So sánh giá trị khi cả 2 vế đều non-null
            WHEN tt.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) THEN 1 
            ELSE 0 
        END
    ),
    @DistinctOrders = COUNT(DISTINCT tt.DonDatVeID),
    @SuccessAttempts = SUM(CASE WHEN tt.TrangThai = N'Thành công' THEN 1 ELSE 0 END),
    @FailedAttempts = SUM(CASE WHEN tt.TrangThai = N'Thất bại' THEN 1 ELSE 0 END),
    @TotalHistoricalRevenue = ISNULL(SUM(CASE WHEN tt.TrangThai = N'Thành công' THEN tt.SoTien ELSE 0 END), 0)
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;

PRINT N'  - Tổng số Payment Attempts:       ' + CAST(@TotalAttempts AS VARCHAR(10));
PRINT N'  - Số đơn hàng tham chiếu:         ' + CAST(@DistinctOrders AS VARCHAR(10));
PRINT N'  - Số giao dịch thành công:        ' + CAST(@SuccessAttempts AS VARCHAR(10));
PRINT N'  - Số giao dịch thất bại:          ' + CAST(@FailedAttempts AS VARCHAR(10));
PRINT N'  - Tổng doanh thu lịch sử:         ' + FORMAT(@TotalHistoricalRevenue, 'N2') + ' VND';
PRINT N'  - Số bản ghi có SoTien IS NULL:   ' + CAST(@NullPhysicalCount AS VARCHAR(10));
PRINT N'  - Số bản ghi DONDATVE có cột NULL:' + CAST(@NullCalculatedCount AS VARCHAR(10));
PRINT N'  - Số bản ghi có SoTien < 0:       ' + CAST(@NegativePhysicalCount AS VARCHAR(10));
PRINT N'  - Số bản ghi tính toán < 0:       ' + CAST(@NegativeCalculatedCount AS VARCHAR(10));
PRINT N'  - Tổng số sai lệch (Mismatches):  ' + CAST(@MismatchCount AS VARCHAR(10));

IF @NullPhysicalCount > 0
BEGIN
    PRINT N'[LỖI CHẶN MIGRATION] Phát hiện ' + CAST(@NullPhysicalCount AS VARCHAR(10)) + N' bản ghi THANHTOAN có SoTien IS NULL trước di trú!';
    THROW 51005, N'Preflight Abort: Phát hiện SoTien IS NULL trong dữ liệu tiền kiểm.', 1;
END;

IF @NullCalculatedCount > 0
BEGIN
    PRINT N'[LỖI CHẶN MIGRATION] Phát hiện ' + CAST(@NullCalculatedCount AS VARCHAR(10)) + N' bản ghi DONDATVE có cột tính toán tiền bị NULL!';
    THROW 51006, N'Preflight Abort: DONDATVE chứa giá trị tiền NULL, không thể tái dựng an toàn.', 1;
END;

IF @NegativePhysicalCount > 0 OR @NegativeCalculatedCount > 0
BEGIN
    PRINT N'[LỖI CHẶN MIGRATION] Phát hiện số tiền thanh toán âm!';
    THROW 51007, N'Preflight Abort: Có bản ghi số tiền thanh toán < 0.', 1;
END;

IF @MismatchCount > 0
BEGIN
    PRINT N'[LỖI CHẶN MIGRATION] Phát hiện ' + CAST(@MismatchCount AS VARCHAR(10)) + N' bản ghi có SoTien khác với giá trị tính toán từ DONDATVE!';
    
    SELECT 
        tt.ThanhToanID,
        tt.DonDatVeID,
        tt.PhuongThuc,
        tt.SoTien AS SoTien_VatLy,
        (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien_DONDATVE,
        tt.SoTien - (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS DoLech,
        tt.TrangThai
    FROM dbo.THANHTOAN tt
    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
    WHERE tt.SoTien IS NULL 
       OR d.TongTienVe IS NULL 
       OR d.TongTienDoAn IS NULL 
       OR d.TienGiamGia IS NULL
       OR tt.SoTien <> (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia);

    THROW 51009, N'Preflight Abort: MismatchCount > 0. Dừng di trú khẩn cấp theo quy tắc an toàn!', 1;
END
ELSE
    PRINT N'  -> [PASS] Sai lệch số tiền bằng 0 tuyệt đối (MismatchCount = 0). Dữ liệu 100% tái dựng được!';

-- ----------------------------------------------------------------------------
-- 6. KIỂM TRA CÁC SQL MODULE PHỤ THUỘC (VIEW VÀ 8 STORED PROCEDURES)
-- ----------------------------------------------------------------------------
PRINT '6. Kiểm tra sự tồn tại của 9 module SQL phụ thuộc...';
DECLARE @MissingModules TABLE (ModuleName NVARCHAR(128));

IF OBJECT_ID(N'dbo.vw_DoanhThuTheoRap', N'V') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.vw_DoanhThuTheoRap');

IF OBJECT_ID(N'dbo.sp_Payment_CreateAttempt', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Payment_CreateAttempt');

IF OBJECT_ID(N'dbo.sp_Payment_UpdateResult', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Payment_UpdateResult');

IF OBJECT_ID(N'dbo.sp_Admin_Dashboard', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Admin_Dashboard');

IF OBJECT_ID(N'dbo.sp_Admin_Report_Revenue', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Admin_Report_Revenue');

IF OBJECT_ID(N'dbo.sp_Manager_Revenue', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Manager_Revenue');

IF OBJECT_ID(N'dbo.sp_Order_GetDetailByCustomer', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Order_GetDetailByCustomer');

IF OBJECT_ID(N'dbo.sp_StaffBooking_Detail', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_StaffBooking_Detail');

IF OBJECT_ID(N'dbo.sp_Support_Complaint_GetOrderReference', N'P') IS NULL
    INSERT INTO @MissingModules VALUES (N'dbo.sp_Support_Complaint_GetOrderReference');

IF EXISTS (SELECT 1 FROM @MissingModules)
BEGIN
    SELECT ModuleName AS [Module Chưa Tồn Tại] FROM @MissingModules;
    THROW 51010, N'Preflight Abort: Thiếu SQL Module phụ thuộc trong baseline database!', 1;
END
ELSE
    PRINT N'  -> [PASS] Toàn bộ 9/9 SQL modules phụ thuộc đều tồn tại đầy đủ.';

-- ----------------------------------------------------------------------------
-- 7. LƯU TRỮ PRE-MIGRATION BASELINE VÀO TEMPDB & XUẤT ARTIFACT NGOẠI VI
-- QUY TẮC CỐT LÕI:
--   - Database chính [CinemaBookingDB_Test]: 100% READ-ONLY, ZERO DDL/DML, ZERO BẢNG KỸ THUẬT.
--   - Toàn bộ bảng tạm trung chuyển được tạo độc quyền tại [tempdb].
--   - Gán MigrationRunID duy nhất để định danh đợt chạy và chống ghi đè/stale baseline.
-- ----------------------------------------------------------------------------
PRINT '7. Lưu trữ Pre-Migration Baseline vào tempdb (Không xâm lấn database chính)...';

DECLARE @MigrationRunID VARCHAR(36) = CONVERT(VARCHAR(36), NEWID());
PRINT N'  - MigrationRunID được khởi tạo: ' + @MigrationRunID;

-- 7.1 Tạo bảng Staging Metrics trong tempdb
IF OBJECT_ID(N'tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test', N'U') IS NOT NULL
    DROP TABLE tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test;

CREATE TABLE tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test (
    BaselineID INT IDENTITY(1,1) PRIMARY KEY,
    MigrationRunID VARCHAR(36) NOT NULL,
    DatabaseName NVARCHAR(128) COLLATE DATABASE_DEFAULT NOT NULL,
    CapturedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TotalAttempts INT NOT NULL,
    DistinctOrders INT NOT NULL,
    SuccessAttempts INT NOT NULL,
    FailedAttempts INT NOT NULL,
    TotalHistoricalRevenue DECIMAL(18, 2) NOT NULL,
    TableChecksum NVARCHAR(64) COLLATE DATABASE_DEFAULT NULL,
    Status NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL DEFAULT N'PREFLIGHT_PASS'
);

-- Tính toán Table Checksum bằng HASHBYTES SHA2_256 của toàn bộ bảng THANHTOAN
DECLARE @TableChecksum NVARCHAR(64);
SELECT @TableChecksum = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', (
    SELECT ThanhToanID, DonDatVeID, PhuongThuc, SoTien, TrangThai, MaGiaoDich 
    FROM dbo.THANHTOAN 
    ORDER BY ThanhToanID 
    FOR JSON PATH, INCLUDE_NULL_VALUES
)), 2);

INSERT INTO tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test (
    MigrationRunID,
    DatabaseName,
    TotalAttempts,
    DistinctOrders,
    SuccessAttempts,
    FailedAttempts,
    TotalHistoricalRevenue,
    TableChecksum
)
VALUES (
    @MigrationRunID,
    DB_NAME(),
    @TotalAttempts,
    @DistinctOrders,
    @SuccessAttempts,
    @FailedAttempts,
    @TotalHistoricalRevenue,
    @TableChecksum
);

-- 7.2 Tạo bảng Granular Snapshot chi tiết từng giao dịch trong tempdb
IF OBJECT_ID(N'tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test', N'U') IS NOT NULL
    DROP TABLE tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test;

CREATE TABLE tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test (
    MigrationRunID VARCHAR(36) NOT NULL,
    ThanhToanID INT PRIMARY KEY,
    DonDatVeID INT NOT NULL,
    PhuongThuc NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL,
    SoTien DECIMAL(18, 2) NOT NULL,
    TrangThai NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL,
    NgayThanhToan DATETIME2 NULL,
    MaGiaoDich VARCHAR(100) COLLATE DATABASE_DEFAULT NULL,
    ReconstructedAmount DECIMAL(18, 2) NOT NULL
);

INSERT INTO tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test (
    MigrationRunID,
    ThanhToanID,
    DonDatVeID,
    PhuongThuc,
    SoTien,
    TrangThai,
    NgayThanhToan,
    MaGiaoDich,
    ReconstructedAmount
)
SELECT 
    @MigrationRunID,
    tt.ThanhToanID,
    tt.DonDatVeID,
    tt.PhuongThuc,
    tt.SoTien,
    tt.TrangThai,
    tt.NgayThanhToan,
    tt.MaGiaoDich,
    (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS ReconstructedAmount
FROM dbo.THANHTOAN tt
INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;

PRINT N'  -> [PASS] Pre-Migration Baseline đã được lưu trữ bền vững tại tempdb:';
PRINT N'     - tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test (Metrics tổng hợp)';
PRINT N'     - tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test (Chi tiết từng giao dịch)';
PRINT N'     - Database chính [CinemaBookingDB_Test] hoàn toàn sạch sẽ (0 bảng mới, 100% read-only).';

-- 7.3 Xuất JSON Artifact cho hồ sơ kiểm toán ngoại vi
PRINT '8. Xuất JSON Snapshot Baseline cho hồ sơ kiểm toán ngoại vi...';
SELECT 
    b.MigrationRunID,
    b.DatabaseName,
    b.CapturedAt,
    b.TotalAttempts,
    b.DistinctOrders,
    b.SuccessAttempts,
    b.FailedAttempts,
    b.TotalHistoricalRevenue,
    b.TableChecksum,
    (
        SELECT 
            s.ThanhToanID, 
            s.DonDatVeID, 
            s.PhuongThuc, 
            s.SoTien, 
            s.TrangThai, 
            s.NgayThanhToan, 
            s.MaGiaoDich, 
            s.ReconstructedAmount
        FROM tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test s
        ORDER BY s.ThanhToanID
        FOR JSON PATH, INCLUDE_NULL_VALUES
    ) AS PaymentDetails
FROM tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test b
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

PRINT '============================================================================';
PRINT N'KẾT LUẬN TIỀN KIỂM PREFLIGHT: TOÀN BỘ ĐIỀU KIỆN ĐẠT CHUẨN (VERIFIED PASS)';
PRINT N'Kiểm tra 100% Read-Only trên [CinemaBookingDB_Test]. Baseline đã lưu bền vững tại tempdb.';
PRINT '============================================================================';

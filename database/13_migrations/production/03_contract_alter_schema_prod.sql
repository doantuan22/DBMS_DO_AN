-- ============================================================================
-- SCRIPT: 03_contract_alter_schema.sql (Hardened R4.1 Version)
-- MỤC TIÊU: Giai đoạn Thu hẹp (Contract Phase) - Loại bỏ phụ thuộc hàm bắc cầu
--           bằng cách xóa Check Constraint, điều chỉnh Index, và DROP COLUMN SoTien.
-- DỰ ÁN: CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến
-- TÍNH CHẤT: DDL Transactional, Atomic, Idempotent.
-- NGUYÊN TẮC AN TOÀN:
--   - Chạy toàn bộ trong 1 TRANSACTION duy nhất.
--   - Khóa độc quyền (TABLOCKX, HOLDLOCK) trên dbo.THANHTOAN để bảo đảm tính nguyên tử.
--   - Tự động hoàn tác (ROLLBACK) nếu phát sinh bất kỳ lỗi nào.
-- BẢO VỆ MÔI TRƯỜNG: CHỈ ĐƯỢC CHẠY TRÊN DATABASE CinemaBookingDB_Test.
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

PRINT '============================================================================';
PRINT 'BẮT ĐẦU CONTRACT PHASE: ĐIỀU CHỈNH SCHEMA VÀ LOẠI BỎ CỘT SOTIEN';
PRINT 'Thời gian thực thi: ' + CONVERT(VARCHAR(30), SYSDATETIME(), 120);
PRINT 'Server Instance:    ' + @@SERVERNAME;
PRINT 'Cơ sở dữ liệu:      ' + DB_NAME();
PRINT '============================================================================';

-- ----------------------------------------------------------------------------
-- 0. EXACT DATABASE TARGET GUARD & PERMISSIONS CHECK
-- ----------------------------------------------------------------------------
IF @@SERVERNAME <> N'DoanTuanIT'
BEGIN
    PRINT N'[SECURITY GUARD BLOCK] Target Server Instance hiện tại: ' + @@SERVERNAME;
    THROW 52001, N'Security Guard Abort: Script được cấu hình CHỈ ĐƯỢC PHÉP CHẠY trên instance DoanTuanIT!', 1;
END;

IF DB_NAME() <> N'CinemaBookingDB'
BEGIN
    PRINT N'[SECURITY GUARD BLOCK] Target database hiện tại: ' + DB_NAME();
    THROW 52002, N'Security Guard Abort: Script được cấu hình CHỈ ĐƯỢC PHÉP CHẠY trên production database CinemaBookingDB!', 1;
END;

IF IS_MEMBER(N'db_owner') = 0 AND IS_SRVROLEMEMBER(N'sysadmin') = 0
BEGIN
    PRINT N'[SECURITY GUARD BLOCK] Login: ' + SUSER_SNAME() + N' không có quyền db_owner hoặc sysadmin trên ' + DB_NAME();
    THROW 52003, N'Security Guard Abort: Cần quyền db_owner hoặc sysadmin để thực hiện di trú Production.', 1;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    PRINT '1. Giữ khóa độc quyền trên dbo.THANHTOAN...';
    -- Khóa bảng để không có transaction nào ghi xen kẽ trong quá trình DDL
    SELECT TOP 0 1 FROM dbo.THANHTOAN WITH (TABLOCKX, HOLDLOCK);

    -- ------------------------------------------------------------------------
    -- 1. XÓA CHECK CONSTRAINT: CK_THANHTOAN_SoTien
    -- ------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 
        FROM sys.check_constraints 
        WHERE name = N'CK_THANHTOAN_SoTien' 
          AND parent_object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        PRINT '2. Xóa Check Constraint CK_THANHTOAN_SoTien...';
        ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT CK_THANHTOAN_SoTien;
        PRINT '  -> [OK] Đã xóa CK_THANHTOAN_SoTien.';
    END
    ELSE
    BEGIN
        PRINT '2. Check Constraint CK_THANHTOAN_SoTien không tồn tại (đã xóa từ trước).';
    END;

    -- ------------------------------------------------------------------------
    -- 2. XÓA INDEX CŨ CÓ CHỨA SOTIEN TRONG INCLUDE
    -- ------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = N'IX_THANHTOAN_DonDatVe' 
          AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        PRINT '3. Xóa Non-clustered Index IX_THANHTOAN_DonDatVe cũ...';
        DROP INDEX [IX_THANHTOAN_DonDatVe] ON dbo.[THANHTOAN];
        PRINT '  -> [OK] Đã xóa IX_THANHTOAN_DonDatVe cũ.';
    END
    ELSE
    BEGIN
        PRINT '3. Index IX_THANHTOAN_DonDatVe không tồn tại.';
    END;

    -- ------------------------------------------------------------------------
    -- 3. XÓA CỘT VẬT LÝ SOTIEN KHỎI DBO.THANHTOAN
    -- ------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE name = N'SoTien' 
          AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        PRINT '4. Xóa cột vật lý dbo.THANHTOAN.SoTien (DROP COLUMN)...';
        ALTER TABLE dbo.THANHTOAN DROP COLUMN [SoTien];
        PRINT '  -> [OK] Đã loại bỏ thành công cột SoTien.';
    END
    ELSE
    BEGIN
        PRINT '4. Cột SoTien không tồn tại trên dbo.THANHTOAN (đã xóa từ trước).';
    END;

    -- ------------------------------------------------------------------------
    -- 4. TÁI TẠO INDEX TINH GỌN (KHÔNG CHỨA SOTIEN)
    -- ------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = N'IX_THANHTOAN_DonDatVe' 
          AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        PRINT '5. Tạo Index IX_THANHTOAN_DonDatVe mới không chứa SoTien trong INCLUDE...';
        CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
        ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
        INCLUDE([NgayThanhToan], [NgayTao]);
        PRINT '  -> [OK] Đã tạo thành công IX_THANHTOAN_DonDatVe mới.';
    END;

    -- ------------------------------------------------------------------------
    -- 5. KIỂM TRA TOÀN VẸN NỘI BỘ TRƯỚC KHI COMMIT
    -- ------------------------------------------------------------------------
    IF COL_LENGTH(N'dbo.THANHTOAN', N'SoTien') IS NOT NULL
    BEGIN
        THROW 51020, N'Lỗi nghiêm trọng: Cột SoTien vẫn còn tồn tại sau lệnh DROP COLUMN!', 1;
    END;

    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = N'IX_THANHTOAN_DonDatVe' 
          AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        THROW 51021, N'Lỗi nghiêm trọng: Index IX_THANHTOAN_DonDatVe chưa được tạo thành công!', 1;
    END;

    -- Kiểm tra số lượng bảng nghiệp vụ vẫn là 27
    DECLARE @CheckTables INT;
    SELECT @CheckTables = COUNT(*) 
    FROM sys.tables 
    WHERE schema_id = SCHEMA_ID(N'dbo') 
      AND is_ms_shipped = 0
      AND name NOT LIKE '\_%' ESCAPE '\';

    IF @CheckTables <> 27
    BEGIN
        THROW 51022, N'Lỗi nghiêm trọng: Số lượng bảng nghiệp vụ sau Contract khác 27!', 1;
    END;

    COMMIT TRANSACTION;
    PRINT '============================================================================';
    PRINT 'HOÀN TẤT CONTRACT PHASE: SCHEMA THANHTOAN ĐÃ ĐẠT CHUẨN 3NF THÀNH CÔNG!';
    PRINT '============================================================================';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        PRINT '[LỖI MIGRATION] Đang hoàn tác toàn bộ thay đổi schema (ROLLBACK TRANSACTION)...';
        ROLLBACK TRANSACTION;
    END;
    PRINT '[LỖI XẢY RA]: ' + ERROR_MESSAGE();
    THROW;
END CATCH;


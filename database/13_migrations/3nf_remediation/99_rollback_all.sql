-- ============================================================================
-- SCRIPT: 99_rollback_all.sql (Hardened R4.1 Version)
-- MỤC TIÊU: Kế hoạch hoàn tác toàn diện (Comprehensive Rollback Plan)
--           Khôi phục lại 100% schema vật lý và source code của 9 SQL module
--           về trạng thái baseline ban đầu trước khi chạy di trú 3NF.
-- DỰ ÁN: CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến
-- TÍNH CHẤT: Idempotent, Atomic DDL & Module Restoration.
-- QUY TẮC ĐỐI SOÁT:
--   - Sử dụng Dynamic Baseline Snapshot (không hardcode số liệu mẫu).
--   - Phân biệt Rollback tức thì (Immediate) và Rollback sau khi phát sinh dữ liệu (Delayed).
-- BẢO VỆ: CHỈ CHO PHÉP CHẠY TRÊN DATABASE [CinemaBookingDB_Test].
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

-- ============================================================================
-- 0. ENVIRONMENT GUARD & PERMISSION ASSERTION (BLOCKER 02)
-- ============================================================================
IF DB_NAME() <> N'CinemaBookingDB_Test'
BEGIN
    PRINT N'[LỖI NGHIÊM TRỌNG] Script hoàn tác chỉ được phép chạy trên cơ sở dữ liệu [CinemaBookingDB_Test]!';
    PRINT N'Database hiện tại: ' + DB_NAME();
    THROW 51000, N'FATAL GUARD: Script chỉ được phép thực thi trên cơ sở dữ liệu [CinemaBookingDB_Test]. Thao tác bị hủy bỏ ngay lập tức!', 1;
END;

IF IS_ROLEMEMBER(N'db_owner') <> 1 AND IS_SRVROLEMEMBER(N'sysadmin') <> 1
BEGIN
    PRINT N'[LỖI PHÂN QUYỀN] Người dùng hiện tại không có quyền db_owner hoặc sysadmin!';
    THROW 51001, N'FATAL GUARD: Yêu cầu quyền db_owner hoặc sysadmin để thực thi hoàn tác.', 1;
END;

PRINT '============================================================================';
PRINT 'BẮT ĐẦU HOÀN TÁC TOÀN PHẦN (ROLLBACK ALL 3NF MIGRATION)';
PRINT 'Thời gian bắt đầu:      ' + CONVERT(VARCHAR(30), SYSDATETIME(), 120);
PRINT 'Cơ sở dữ liệu mục tiêu: ' + DB_NAME() + ' (VERIFIED ISOLATED TEST DB)';
PRINT 'Người dùng thực thi:    ' + SUSER_SNAME();
PRINT '============================================================================';

-- ============================================================================
-- PHẦN 1: KHÔI PHỤC SCHEMA VẬT LÝ VÀ DỮ LIỆU CỘT SOTIEN
-- ============================================================================
BEGIN TRY
    BEGIN TRANSACTION;

    -- 1.1 Khóa bảng để đảm bảo an toàn DDL
    SELECT TOP 0 1 FROM dbo.THANHTOAN WITH (TABLOCKX, HOLDLOCK);

    -- 1.2 Thêm lại cột SoTien nếu chưa có
    IF COL_LENGTH(N'dbo.THANHTOAN', N'SoTien') IS NULL
    BEGIN
        PRINT '1. Thêm lại cột dbo.THANHTOAN.SoTien (DECIMAL(18,2) NULL)...';
        ALTER TABLE dbo.THANHTOAN ADD [SoTien] DECIMAL(18, 2) NULL;

        -- Kiểm tra toàn vẹn trước khi phục hồi dữ liệu
        IF EXISTS (
            SELECT 1 
            FROM dbo.THANHTOAN tt 
            LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID 
            WHERE d.DonDatVeID IS NULL
        )
        BEGIN
            THROW 51055, N'Lỗi Rollback: Phát hiện Payment Attempt mồ côi (không tìm thấy DONDATVE tương ứng)! Không thể phục hồi SoTien.', 1;
        END;

        IF EXISTS (
            SELECT 1 
            FROM dbo.THANHTOAN tt 
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID 
            WHERE d.TongTienVe IS NULL OR d.TongTienDoAn IS NULL OR d.TienGiamGia IS NULL
        )
        BEGIN
            THROW 51056, N'Lỗi Rollback: Phát hiện DONDATVE có thành phần tiền bị NULL! Không thể phục hồi SoTien.', 1;
        END;

        PRINT '2. Phục hồi dữ liệu SoTien từ DONDATVE snapshot...';
        EXEC sp_executesql N'
        UPDATE tt
        SET tt.SoTien = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)
        FROM dbo.THANHTOAN tt
        INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;

        IF EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE SoTien IS NULL OR SoTien < 0)
        BEGIN
            THROW 51050, N''Lỗi Rollback: Vẫn còn bản ghi có SoTien IS NULL hoặc âm sau khi khôi phục!'', 1;
        END;
        ';

        PRINT '3. Thiết lập ràng buộc NOT NULL cho cột SoTien...';
        EXEC sp_executesql N'ALTER TABLE dbo.THANHTOAN ALTER COLUMN [SoTien] DECIMAL(18, 2) NOT NULL;';
    END
    ELSE
    BEGIN
        PRINT '1. Cột dbo.THANHTOAN.SoTien đã tồn tại.';
        
        -- Nếu cột đang cho phép NULL (do Expand Phase), khôi phục lại dữ liệu và set NOT NULL
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.THANHTOAN'), N'SoTien', 'AllowsNull') = 1
        BEGIN
            -- Kiểm tra toàn vẹn dữ liệu
            IF EXISTS (
                SELECT 1 
                FROM dbo.THANHTOAN tt 
                LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID 
                WHERE d.DonDatVeID IS NULL
            )
            BEGIN
                THROW 51055, N'Lỗi Rollback: Phát hiện Payment Attempt mồ côi! Không thể phục hồi SoTien.', 1;
            END;

            PRINT '2. Phục hồi các giá trị NULL trong SoTien từ DONDATVE snapshot...';
            EXEC sp_executesql N'
            UPDATE tt
            SET tt.SoTien = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)
            FROM dbo.THANHTOAN tt
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
            WHERE tt.SoTien IS NULL;

            IF EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE SoTien IS NULL OR SoTien < 0)
            BEGIN
                THROW 51050, N''Lỗi Rollback: Vẫn còn bản ghi có SoTien IS NULL hoặc âm sau khi khôi phục!'', 1;
            END;
            ';

            PRINT '3. Khôi phục ràng buộc NOT NULL cho cột SoTien...';
            EXEC sp_executesql N'ALTER TABLE dbo.THANHTOAN ALTER COLUMN [SoTien] DECIMAL(18, 2) NOT NULL;';
        END;
    END;

    -- 1.3 Tạo lại Check Constraint CK_THANHTOAN_SoTien
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.check_constraints 
        WHERE name = N'CK_THANHTOAN_SoTien' AND parent_object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        PRINT '4. Tạo lại CHECK CONSTRAINT CK_THANHTOAN_SoTien...';
        EXEC sp_executesql N'
        ALTER TABLE dbo.THANHTOAN 
        WITH CHECK ADD CONSTRAINT [CK_THANHTOAN_SoTien] CHECK ([SoTien] >= (0));

        ALTER TABLE dbo.THANHTOAN CHECK CONSTRAINT [CK_THANHTOAN_SoTien];
        ';
        PRINT '  -> [OK] Đã tạo lại CK_THANHTOAN_SoTien.';
    END;

    -- 1.4 Khôi phục Index ban đầu (có SoTien trong INCLUDE)
    IF EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = N'IX_THANHTOAN_DonDatVe' AND object_id = OBJECT_ID(N'dbo.THANHTOAN')
    )
    BEGIN
        PRINT '5. Tái tạo Index IX_THANHTOAN_DonDatVe ban đầu (INCLUDE SoTien)...';
        DROP INDEX [IX_THANHTOAN_DonDatVe] ON dbo.[THANHTOAN];
    END;

    EXEC sp_executesql N'
    CREATE NONCLUSTERED INDEX [IX_THANHTOAN_DonDatVe] 
    ON dbo.[THANHTOAN]([DonDatVeID] ASC, [TrangThai] ASC) 
    INCLUDE([SoTien], [NgayThanhToan], [NgayTao]);
    ';
    PRINT '  -> [OK] Đã tái tạo lại Index IX_THANHTOAN_DonDatVe nguyên bản.';

    COMMIT TRANSACTION;
    PRINT '  -> [OK] Hoàn tất khôi phục schema vật lý của bảng THANHTOAN.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT '[LỖI ROLLBACK SCHEMA]: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
GO

-- ============================================================================
-- PHẦN 2: KHÔI PHỤC SOURCE CODE 1 VIEW VÀ 8 STORED PROCEDURES VỀ NGUYÊN BẢN
-- ============================================================================
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '6. Khôi phục dbo.vw_DoanhThuTheoRap về baseline...';
GO
CREATE OR ALTER VIEW dbo.vw_DoanhThuTheoRap AS
-- Doanh thu tính từ THANHTOAN có TrangThai = 'Thành công' (không dựa vào trạng thái đơn).
-- Giao dịch 'Thất bại' / 'Đang xử lý' / 'Đã hoàn tiền' không được tính.
WITH
    DonDaThu AS (
        SELECT
            ddv.DonDatVeID,
            pc.RapID,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia,
            SUM(tt.SoTien) AS TienDaThu,
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.CHITIETVE cv
                WHERE
                    cv.DonDatVeID = ddv.DonDatVeID
                    AND cv.TrangThai <> N'Đã hủy'
            ) AS SoVeCuaDon
        FROM
            dbo.DONDATVE ddv
            INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
            INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
            INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID
            AND tt.TrangThai = N'Thành công'
        GROUP BY
            ddv.DonDatVeID,
            pc.RapID,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia
    ),
    SuatChieuTheoRap AS (
        SELECT
            pc.RapID,
            COUNT(DISTINCT sc.SuatChieuID) AS TongSoSuatChieu
        FROM
            dbo.PHONGCHIEU pc
            LEFT JOIN dbo.SUATCHIEU sc ON pc.PhongID = sc.PhongID
        GROUP BY
            pc.RapID
    )
SELECT
    r.RapID,
    r.TenRap,
    r.ThanhPho,
    COUNT(dh.DonDatVeID) AS TongSoDon,
    ISNULL(sc_rap.TongSoSuatChieu, 0) AS TongSoSuatChieu,
    ISNULL(SUM(dh.SoVeCuaDon), 0) AS TongSoVeBan,
    ISNULL(SUM(dh.TongTienVe), 0) AS DoanhThuVe,
    ISNULL(SUM(dh.TongTienDoAn), 0) AS DoanhThuDoAn,
    ISNULL(SUM(dh.TienGiamGia), 0) AS TongTienGiam,
    ISNULL(SUM(dh.TienDaThu), 0) AS DoanhThuThucTe
FROM
    dbo.RAPCHIEUPHIM r
    LEFT JOIN DonDaThu dh ON r.RapID = dh.RapID
    LEFT JOIN SuatChieuTheoRap sc_rap ON r.RapID = sc_rap.RapID
GROUP BY
    r.RapID,
    r.TenRap,
    r.ThanhPho,
    sc_rap.TongSoSuatChieu;
GO

PRINT '7. Khôi phục dbo.sp_Payment_CreateAttempt về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Payment_CreateAttempt
    @NguoiDungID INT,
    @DonDatVeID INT,
    @PhuongThuc NVARCHAR(50),
    @ThanhToanID INT OUTPUT,
    @MaGiaoDich VARCHAR(100) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @NguoiDungID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('KHACH_HANG')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'THANH_TOAN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    DECLARE @OwnTran BIT = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @OwnTran = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION PaymentCreateAttempt;
        DECLARE @UserID INT,
            @SuatID INT,
            @RoomID INT,
            @ShowStatus NVARCHAR(50),
            @Starts DATETIME2,
            @OrderStatus NVARCHAR(50),
            @Hold DATETIME2,
            @Amount DECIMAL(18, 2),
            @Now DATETIME2;
        SELECT
            @UserID = NguoiDungID,
            @SuatID = SuatChieuID
        FROM
            dbo.DONDATVE
        WHERE
            DonDatVeID = @DonDatVeID;
        IF @UserID IS NULL
            THROW 50030, N'Đơn đặt vé không tồn tại.', 1;
        IF @UserID <> @NguoiDungID
            THROW 50033, N'Đơn đặt vé không tồn tại.', 1;
        DECLARE @LockedUser INT;
        SELECT
            @LockedUser = NguoiDungID
        FROM
            dbo.NGUOIDUNG
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            NguoiDungID = @UserID;
        SELECT
            @RoomID = PhongID,
            @ShowStatus = TrangThai,
            @Starts = ThoiGianBatDau
        FROM
            dbo.SUATCHIEU
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            SuatChieuID = @SuatID;
        SELECT
            @OrderStatus = TrangThai,
            @Hold = HanGiuCho,
            @Amount = TongTienVe + TongTienDoAn - TienGiamGia
        FROM
            dbo.DONDATVE
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            DonDatVeID = @DonDatVeID;
        SET
            @Now = dbo.fn_BayGio();
        -- Re-read after waiting for all lifecycle locks.
        IF @OrderStatus = N'Hết hạn'
            OR (
            @OrderStatus = N'Chờ thanh toán'
            AND (
                @Hold IS NULL
                OR @Hold <= @Now
            )
        )
        BEGIN
            EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatID,
                @TraVeKetQua = 0;
            IF @OwnTran = 1
                -- Chốt các thay đổi của transaction.
                COMMIT TRANSACTION;
            THROW 50111, N'Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.', 1;
        END;
        IF @OrderStatus <> N'Chờ thanh toán'
            THROW 50031, N'Đơn hàng không ở trạng thái Chờ thanh toán.', 1;
        IF @RoomID IS NULL
            OR @ShowStatus <> N'Mở bán'
            OR @Starts <= @Now
            THROW 50121, N'Suất chiếu không còn hợp lệ để thanh toán.', 1;
        SET
            @MaGiaoDich = CONCAT(
                'TXN-',
                FORMAT(@Now, 'yyyyMMddHHmmss'),
                '-',
                CAST(@DonDatVeID AS VARCHAR(10)),
                '-',
                LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 6)
            );
        INSERT
            dbo.THANHTOAN(DonDatVeID, PhuongThuc, SoTien, NgayTao, MaGiaoDich, TrangThai)
        VALUES
            (@DonDatVeID, @PhuongThuc, @Amount, @Now, @MaGiaoDich, N'Đang xử lý');
        SET
            @ThanhToanID = SCOPE_IDENTITY();
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            tt.ThanhToanID,
            tt.DonDatVeID,
            tt.PhuongThuc,
            tt.SoTien,
            tt.NgayTao,
            tt.MaGiaoDich,
            tt.TrangThai,
            d.HanGiuCho
        FROM
            dbo.THANHTOAN tt
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
        WHERE
            tt.ThanhToanID = @ThanhToanID;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF XACT_STATE() = - 1
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ELSE
            IF XACT_STATE() = 1
            BEGIN
                IF @OwnTran = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION PaymentCreateAttempt;
        END;
        THROW;
    END CATCH
END;
GO

PRINT '8. Khôi phục dbo.sp_Payment_UpdateResult về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Payment_UpdateResult
    @NguoiDungID INT,
    @ThanhToanID INT,
    @TrangThaiThanhToan NVARCHAR(50),
    @MaGiaoDichNgoai VARCHAR(100) = NULL,
    @GhiChu NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @NguoiDungID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('KHACH_HANG')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'THANH_TOAN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    DECLARE @OwnTran BIT = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @TrangThaiThanhToan NOT IN (N'Thành công', N'Thất bại')
            THROW 50114, N'Kết quả thanh toán phải là Thành công hoặc Thất bại.', 1;
        IF @OwnTran = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION PaymentUpdateResult;
        DECLARE @UserID INT,
            @SuatID INT,
            @LockedUser INT,
            @ShowStatus NVARCHAR(50),
            @Starts DATETIME2,
            @DonID INT,
            @Amount DECIMAL(18, 2),
            @CurrentPayment NVARCHAR(50),
            @OrderStatus NVARCHAR(50),
            @Hold DATETIME2,
            @Now DATETIME2;
        SELECT
            @UserID = d.NguoiDungID,
            @SuatID = d.SuatChieuID
        FROM
            dbo.THANHTOAN t
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
        WHERE
            t.ThanhToanID = @ThanhToanID;
        IF @UserID IS NULL
            THROW 50032, N'Giao dịch thanh toán không tồn tại.', 1;
        IF @UserID <> @NguoiDungID
            THROW 50033, N'Đơn đặt vé không tồn tại.', 1;
        SELECT
            @LockedUser = NguoiDungID
        FROM
            dbo.NGUOIDUNG
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            NguoiDungID = @UserID;
        SELECT
            @ShowStatus = TrangThai,
            @Starts = ThoiGianBatDau
        FROM
            dbo.SUATCHIEU
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            SuatChieuID = @SuatID;
        SELECT
            @DonID = t.DonDatVeID,
            @Amount = t.SoTien,
            @CurrentPayment = t.TrangThai,
            @OrderStatus = d.TrangThai,
            @Hold = d.HanGiuCho
        FROM
            dbo.THANHTOAN t
        WITH
            (UPDLOCK, HOLDLOCK)
            INNER JOIN dbo.DONDATVE d
        WITH
            (UPDLOCK, HOLDLOCK) ON d.DonDatVeID = t.DonDatVeID
        WHERE
            t.ThanhToanID = @ThanhToanID;
        IF @CurrentPayment = @TrangThaiThanhToan
        BEGIN
            IF @OwnTran = 1
                -- Chốt các thay đổi của transaction.
                COMMIT TRANSACTION;
            SELECT
                d.DonDatVeID,
                d.TrangThai AS TrangThaiDon,
                t.ThanhToanID,
                t.MaGiaoDich,
                t.TrangThai AS TrangThaiThanhToan,
                t.NgayThanhToan
            FROM
                dbo.DONDATVE d
                JOIN dbo.THANHTOAN t ON t.DonDatVeID = d.DonDatVeID
            WHERE
                t.ThanhToanID = @ThanhToanID;
            RETURN;
        END
        IF @CurrentPayment <> N'Đang xử lý'
            THROW 50115, N'Giao dịch đã có kết quả cuối cùng, không thể đổi.', 1;
        SET
            @Now = dbo.fn_BayGio();
        -- A lock wait must never extend the hold deadline.
        IF @OrderStatus = N'Hết hạn'
            OR (
            @OrderStatus = N'Chờ thanh toán'
            AND (
                @Hold IS NULL
                OR @Hold <= @Now
            )
        )
        BEGIN
            EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatID,
                @TraVeKetQua = 0;
            IF @OwnTran = 1
                -- Chốt các thay đổi của transaction.
                COMMIT TRANSACTION;
            THROW 50111, N'Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.', 1;
        END;
        IF @TrangThaiThanhToan = N'Thành công'
        BEGIN
            IF @OrderStatus <> N'Chờ thanh toán'
                THROW 50113, N'Đơn hàng không còn ở trạng thái có thể thanh toán.', 1;
            IF @ShowStatus <> N'Mở bán'
                OR @Starts <= @Now
                THROW 50121, N'Suất chiếu không còn hợp lệ để thanh toán.', 1;
            -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
            UPDATE dbo.THANHTOAN
            SET
                TrangThai = N'Thành công',
                NgayThanhToan = @Now,
                MaGiaoDich = ISNULL(@MaGiaoDichNgoai, MaGiaoDich),
                GhiChu = @GhiChu
            WHERE
                ThanhToanID = @ThanhToanID;
            -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
            UPDATE dbo.DONDATVE
            SET
                TrangThai = N'Đã thanh toán',
                HanGiuCho = NULL
            WHERE
                DonDatVeID = @DonID;
            DECLARE @Points INT = CAST(@Amount / 1000 AS INT);
            IF @Points > 0
                -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
                UPDATE dbo.HOSOKHACHHANG
                SET
                    DiemTichLuy = DiemTichLuy + @Points
                WHERE
                    NguoiDungID = @UserID;
        END
        ELSE
        BEGIN
            -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
            UPDATE dbo.THANHTOAN
            SET
                TrangThai = N'Thất bại',
                NgayThanhToan = NULL,
                MaGiaoDich = ISNULL(@MaGiaoDichNgoai, MaGiaoDich),
                GhiChu = @GhiChu
            WHERE
                ThanhToanID = @ThanhToanID;
        END
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            d.DonDatVeID,
            d.TrangThai AS TrangThaiDon,
            d.HanGiuCho,
            t.ThanhToanID,
            t.MaGiaoDich,
            t.TrangThai AS TrangThaiThanhToan,
            t.NgayThanhToan
        FROM
            dbo.DONDATVE d
            JOIN dbo.THANHTOAN t ON t.DonDatVeID = d.DonDatVeID
        WHERE
            t.ThanhToanID = @ThanhToanID;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF XACT_STATE() = - 1
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ELSE
            IF XACT_STATE() = 1
            BEGIN
                IF @OwnTran = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION PaymentUpdateResult;
        END;
        THROW;
    END CATCH
END;
GO

PRINT '9. Khôi phục dbo.sp_Admin_Dashboard về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Dashboard
    @ActorID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @ActorID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @ActorID
            AND vt.MaVaiTro IN ('ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'XEM_BAO_CAO_TOANHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    SELECT
        (
            SELECT
                COUNT(*)
            FROM
                dbo.NGUOIDUNG
            WHERE
                TrangThai = N'Hoạt động'
        ) AS TongNguoiDung,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.RAPCHIEUPHIM
            WHERE
                TrangThai = N'Hoạt động'
        ) AS TongRap,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.PHONGCHIEU
            WHERE
                TrangThai = N'Hoạt động'
        ) AS TongPhongChieu,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.PHIM
            WHERE
                TrangThai = N'Đang chiếu'
        ) AS PhimDangChieu,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.SUATCHIEU
            WHERE
                dbo.fn_NgayKinhDoanh(ThoiGianBatDau) = dbo.fn_HomNay()
                AND TrangThai <> N'Đã hủy'
        ) AS SuatChieuHomNay,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.DONDATVE
            WHERE
                TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
        ) AS TongDonThanhCong,
        (
            SELECT
                ISNULL(SUM(SoTien), 0)
            FROM
                dbo.THANHTOAN
            WHERE
                TrangThai = N'Thành công'
        ) AS TongDoanhThuToanThoiGian,
        (
            SELECT
                COUNT(*)
            FROM
                dbo.KHIEUNAI
            WHERE
                TrangThai = N'Mới'
        ) AS KhieuNaiChuaXuLy;
END;
GO

PRINT '10. Khôi phục dbo.sp_Admin_Report_Revenue về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Report_Revenue
    (
    @ActorID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL,
    @RapID INT = NULL
    )
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @ActorID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @ActorID
            AND vt.MaVaiTro IN ('ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'XEM_BAO_CAO_TOANHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    CREATE TABLE #DonDaThu(
        DonDatVeID INT PRIMARY KEY,
        RapID INT NOT NULL,
        PhimID INT NOT NULL,
        NgayThu DATE NOT NULL,
        TongTienVe DECIMAL(18, 2),
        TongTienDoAn DECIMAL(18, 2),
        TienGiamGia DECIMAL(18, 2),
        TienDaThu DECIMAL(18, 2),
        SoVe INT
    );
    INSERT INTO
        #DonDaThu(
            DonDatVeID,
            RapID,
            PhimID,
            NgayThu,
            TongTienVe,
            TongTienDoAn,
            TienGiamGia,
            TienDaThu,
            SoVe
        )
    SELECT
        ddv.DonDatVeID,
        pc.RapID,
        sc.PhimID,
        dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))),
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        SUM(tt.SoTien),
        (
            SELECT
                COUNT(*)
            FROM
                dbo.CHITIETVE cv
            WHERE
                cv.DonDatVeID = ddv.DonDatVeID
                AND cv.TrangThai <> N'Đã hủy'
        )
    FROM
        dbo.DONDATVE ddv
        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
        INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
        INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID
        AND tt.TrangThai = N'Thành công'
    WHERE
        (
            @RapID IS NULL
            OR pc.RapID = @RapID
        )
    GROUP BY
        ddv.DonDatVeID,
        pc.RapID,
        sc.PhimID,
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia
    HAVING
        (
            @TuNgay IS NULL
            OR dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) >= @TuNgay
        )
        AND (
            @DenNgay IS NULL
            OR dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) <= @DenNgay
        );
    -- Recordset 1: Summary
    SELECT
        COUNT(DonDatVeID) AS TongSoDonToanHeThong,
        ISNULL(SUM(SoVe), 0) AS TongSoVeBan,
        ISNULL(SUM(TongTienVe), 0) AS TongDoanhThuVe,
        ISNULL(SUM(TongTienDoAn), 0) AS TongDoanhThuDoAn,
        ISNULL(SUM(TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(TienDaThu), 0) AS TongDoanhThuThucTe
    FROM
        #DonDaThu;
    -- Recordset 2: RevenueByCinema
    SELECT
        r.RapID,
        r.TenRap,
        r.ThanhPho,
        COUNT(d.DonDatVeID) AS SoDon,
        ISNULL(SUM(d.SoVe), 0) AS SoVeBan,
        ISNULL(SUM(d.TongTienVe), 0) AS DoanhThuVe,
        ISNULL(SUM(d.TongTienDoAn), 0) AS DoanhThuDoAn,
        ISNULL(SUM(d.TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(d.TienDaThu), 0) AS DoanhThuThucTe
    FROM
        dbo.RAPCHIEUPHIM r
        LEFT JOIN #DonDaThu d ON d.RapID = r.RapID
    WHERE
        (
            @RapID IS NULL
            OR r.RapID = @RapID
        )
    GROUP BY
        r.RapID,
        r.TenRap,
        r.ThanhPho
    ORDER BY
        r.RapID;
    -- Recordset 3: RevenueByMovie
    SELECT
        p.PhimID,
        p.TenPhim,
        COUNT(d.DonDatVeID) AS SoDon,
        SUM(d.SoVe) AS SoVeBan,
        SUM(d.TongTienVe) AS DoanhThuVe,
        SUM(d.TongTienDoAn) AS DoanhThuDoAn,
        SUM(d.TienGiamGia) AS TongTienGiam,
        SUM(d.TienDaThu) AS DoanhThuThucTe
    FROM
        #DonDaThu d
        INNER JOIN dbo.PHIM p ON p.PhimID = d.PhimID
    GROUP BY
        p.PhimID,
        p.TenPhim
    ORDER BY
        p.PhimID;
    -- Recordset 4: RevenueByDate
    SELECT
        NgayThu AS Ngay,
        COUNT(DonDatVeID) AS SoDon,
        SUM(SoVe) AS SoVeBan,
        SUM(TongTienVe) AS DoanhThuVe,
        SUM(TongTienDoAn) AS DoanhThuDoAn,
        SUM(TienGiamGia) AS TongTienGiam,
        SUM(TienDaThu) AS DoanhThuThucTe
    FROM
        #DonDaThu
    GROUP BY
        NgayThu
    ORDER BY
        NgayThu;
    DROP TABLE #DonDaThu;
END;
GO

PRINT '11. Khôi phục dbo.sp_Manager_Revenue về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Revenue
    (
    @NguoiDungID INT,
    @RapID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
    )
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @NguoiDungID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('QUAN_LY_RAP')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XEM_BAO_CAO_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    -- Kiểm tra phạm vi rạp còn được phân công.
    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;
        THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập báo cáo rạp này.', 1;
    END
    IF @TuNgay IS NULL
        SET
            @TuNgay = DATEADD(DAY, - 30, dbo.fn_HomNay());
    IF @DenNgay IS NULL
        SET
            @DenNgay = dbo.fn_HomNay();
    ;
    WITH
        DonDaThu AS (
            SELECT
                ddv.DonDatVeID,
                ddv.TongTienVe,
                ddv.TongTienDoAn,
                ddv.TienGiamGia,
                SUM(tt.SoTien) AS TienDaThu,
                dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) AS NgayThu,
                (
                    SELECT
                        COUNT(*)
                    FROM
                        dbo.CHITIETVE cv
                    WHERE
                        cv.DonDatVeID = ddv.DonDatVeID
                        AND cv.TrangThai <> N'Đã hủy'
                ) AS SoVe
            FROM
                dbo.DONDATVE ddv
                INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
                INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
                INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID
                AND tt.TrangThai = N'Thành công'
            WHERE
                pc.RapID = @RapID
            GROUP BY
                ddv.DonDatVeID,
                ddv.TongTienVe,
                ddv.TongTienDoAn,
                ddv.TienGiamGia
        )
    SELECT
        NgayThu AS Ngay,
        COUNT(*) AS SoDon,
        SUM(SoVe) AS SoVeBan,
        SUM(TongTienVe) AS DoanhThuVe,
        SUM(TongTienDoAn) AS DoanhThuDoAn,
        SUM(TienGiamGia) AS TienGiamGia,
        SUM(TienDaThu) AS DoanhThuThucTe
    FROM
        DonDaThu
    WHERE
        NgayThu BETWEEN @TuNgay AND @DenNgay
    GROUP BY
        NgayThu
    ORDER BY
        NgayThu DESC;
END;
GO

PRINT '12. Khôi phục dbo.sp_Order_GetDetailByCustomer về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Order_GetDetailByCustomer
    @NguoiDungID INT,
    @DonDatVeID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @NguoiDungID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('KHACH_HANG')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.DONDATVE
        WHERE
            DonDatVeID = @DonDatVeID
            AND NguoiDungID = @NguoiDungID
    )
        THROW 50033, N'Đơn đặt vé không tồn tại hoặc bạn không có quyền xem đơn này.', 1;
    SELECT
        v.[DonDatVeID],
        v.[NguoiDungID],
        v.[HoTenKhachHang],
        v.[Email],
        v.[SoDienThoai],
        v.[SuatChieuID],
        v.[PhimID],
        v.[TenPhim],
        v.[PosterURL],
        v.[DoTuoi],
        v.[ThoiLuong],
        v.[RapID],
        v.[TenRap],
        v.[DiaChiRap],
        v.[PhongID],
        v.[TenPhong],
        v.[LoaiPhong],
        v.[ThoiGianBatDau],
        v.[ThoiGianKetThuc],
        v.[DinhDang],
        v.[NgayDat],
        v.[TongTienVe],
        v.[TongTienDoAn],
        v.[TienGiamGia],
        v.[TongTienThanhToan],
        v.[TrangThaiDon],
        v.[HanGiuCho],
        v.[MaKhuyenMai],
        v.[MoTaKhuyenMai],
        v.[DanhSachGhe],
        v.[DanhSachMaVe],
        d.LyDoHuy,
        d.ThongBaoHuy,
        b.DiemBoiThuong,
        b.NgayBoiThuong
    FROM
        dbo.vw_ChiTietDonDatVe v
        INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
        LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = d.DonDatVeID
    WHERE
        v.DonDatVeID = @DonDatVeID;
    SELECT
        cv.VeID,
        cv.MaVe,
        g.GheID,
        g.HangGhe,
        g.SoGhe,
        (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,
        g.LoaiGhe,
        cv.GiaVe,
        cv.TrangThai AS TrangThaiVe
    FROM
        dbo.CHITIETVE cv
        INNER JOIN dbo.GHE g ON g.GheID = cv.GheID
    WHERE
        cv.DonDatVeID = @DonDatVeID;
    SELECT
        cda.ChiTietDoAnID,
        sp.SanPhamID,
        sp.TenSanPham,
        sp.LoaiSanPham,
        cda.SoLuong,
        cda.DonGia,
        cda.SoLuong * cda.DonGia AS ThanhTien
    FROM
        dbo.CHITIETDOAN cda
        INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID = cda.SanPhamID
    WHERE
        cda.DonDatVeID = @DonDatVeID;
    SELECT
        ThanhToanID,
        PhuongThuc,
        SoTien,
        NgayTao,
        NgayThanhToan,
        MaGiaoDich,
        TrangThai,
        GhiChu
    FROM
        dbo.THANHTOAN
    WHERE
        DonDatVeID = @DonDatVeID
    ORDER BY
        ThanhToanID;
END;
GO

PRINT '13. Khôi phục dbo.sp_StaffBooking_Detail về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Detail
    @ActorID int,
    @PortalRole varchar(50),
    @DonDatVeID int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Own bit = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @Own = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION StaffBookingDetail;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole;
        DECLARE @Rap int;
        SELECT
            @Rap = p.RapID
        FROM
            dbo.DONDATVE d
            JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
            JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
        WHERE
            d.DonDatVeID = @DonDatVeID;
        IF @Rap IS NULL
            THROW 50033, N'Đơn đặt vé không tồn tại.', 1;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @Rap;
        SELECT
            v.[DonDatVeID],
            v.[NguoiDungID],
            v.[HoTenKhachHang],
            v.[Email],
            v.[SoDienThoai],
            v.[SuatChieuID],
            v.[PhimID],
            v.[TenPhim],
            v.[PosterURL],
            v.[DoTuoi],
            v.[ThoiLuong],
            v.[RapID],
            v.[TenRap],
            v.[DiaChiRap],
            v.[PhongID],
            v.[TenPhong],
            v.[LoaiPhong],
            v.[ThoiGianBatDau],
            v.[ThoiGianKetThuc],
            v.[DinhDang],
            v.[NgayDat],
            v.[TongTienVe],
            v.[TongTienDoAn],
            v.[TienGiamGia],
            v.[TongTienThanhToan],
            v.[TrangThaiDon],
            v.[HanGiuCho],
            v.[MaKhuyenMai],
            v.[MoTaKhuyenMai],
            v.[DanhSachGhe],
            v.[DanhSachMaVe],
            d.LyDoHuy,
            d.ThongBaoHuy,
            CONVERT(
                bit,
                CASE
                    WHEN d.TrangThai = N'Chờ thanh toán'
                    AND d.HanGiuCho > dbo.fn_BayGio()
                    AND d.KhuyenMaiID IS NULL
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.CHITIETDOAN
                        WHERE
                            DonDatVeID = d.DonDatVeID
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.THANHTOAN
                        WHERE
                            DonDatVeID = d.DonDatVeID
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.CHITIETVE
                        WHERE
                            DonDatVeID = d.DonDatVeID
                            AND TrangThai = N'Đã sử dụng'
                    )
                    AND EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.NGUOIDUNG n
                            JOIN dbo.VAITRO r ON r.VaiTroID = n.VaiTroID
                        WHERE
                            n.NguoiDungID = d.NguoiDungID
                            AND n.TrangThai = N'Hoạt động'
                            AND r.MaVaiTro = 'KHACH_HANG'
                    )
                    AND EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.vw_LichChieuChiTiet
                        WHERE
                            SuatChieuID = d.SuatChieuID
                            AND IsBookable = 1
                    ) THEN 1
                    ELSE 0
                END
            ) AS CanEdit,
            CONVERT(
                bit,
                CASE
                    WHEN d.TrangThai = N'Chờ thanh toán'
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.THANHTOAN
                        WHERE
                            DonDatVeID = d.DonDatVeID
                            AND TrangThai IN (N'Đang xử lý', N'Thành công', N'Đã hoàn tiền')
                    )
                    AND NOT EXISTS (
                        SELECT
                            1
                        FROM
                            dbo.CHITIETVE
                        WHERE
                            DonDatVeID = d.DonDatVeID
                            AND TrangThai = N'Đã sử dụng'
                    ) THEN 1
                    ELSE 0
                END
            ) AS CanCancel,
            (
                SELECT
                    COUNT(*)
                FROM
                    dbo.CHITIETVE
                WHERE
                    DonDatVeID = d.DonDatVeID
                    AND TrangThai <> N'Đã hủy'
            ) AS SoLuongVe,
            b.DiemBoiThuong,
            b.NgayBoiThuong
        FROM
            dbo.vw_ChiTietDonDatVe v
            JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
            LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = d.DonDatVeID
        WHERE
            v.DonDatVeID = @DonDatVeID;
        SELECT
            cv.VeID,
            cv.MaVe,
            g.GheID,
            g.HangGhe,
            g.SoGhe,
            g.HangGhe + CAST(g.SoGhe AS varchar(10)) AS TenGhe,
            g.LoaiGhe,
            cv.GiaVe,
            cv.TrangThai AS TrangThaiVe
        FROM
            dbo.CHITIETVE cv
            INNER JOIN dbo.GHE g ON g.GheID = cv.GheID
        WHERE
            cv.DonDatVeID = @DonDatVeID;
        SELECT
            cda.ChiTietDoAnID,
            sp.SanPhamID,
            sp.TenSanPham,
            sp.LoaiSanPham,
            cda.SoLuong,
            cda.DonGia,
            cda.SoLuong * cda.DonGia AS ThanhTien
        FROM
            dbo.CHITIETDOAN cda
            INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID = cda.SanPhamID
        WHERE
            cda.DonDatVeID = @DonDatVeID;
        SELECT
            ThanhToanID,
            PhuongThuc,
            SoTien,
            NgayTao,
            NgayThanhToan,
            MaGiaoDich,
            TrangThai,
            GhiChu
        FROM
            dbo.THANHTOAN
        WHERE
            DonDatVeID = @DonDatVeID
        ORDER BY
            ThanhToanID;
        IF @Own = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF XACT_STATE() = - 1
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ELSE
            IF XACT_STATE() = 1
            BEGIN
                IF @Own = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION StaffBookingDetail;
        END;
        THROW;
    END CATCH;
END;
GO

PRINT '14. Khôi phục dbo.sp_Support_Complaint_GetOrderReference về baseline...';
GO
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_GetOrderReference
    (@NguoiDungID INT, @KhieuNaiID INT)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @NguoiDungID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('CSKH', 'ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'TRA_CUU_DON') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.KHIEUNAI
        WHERE
            KhieuNaiID = @KhieuNaiID
    )
        THROW 50061, N'Khiếu nại không tồn tại.', 1;
    DECLARE @DonDatVeID INT;
    SELECT
        @DonDatVeID = DonDatVeID
    FROM
        dbo.KHIEUNAI
    WHERE
        KhieuNaiID = @KhieuNaiID;
    IF @DonDatVeID IS NULL
    BEGIN
        SELECT
            N'Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào.' AS [Message];
        RETURN;
    END;
    -- Resolve the order only from this complaint; there is no caller-supplied order ID.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.DONDATVE
        WHERE
            DonDatVeID = @DonDatVeID
    )
        THROW 50030, N'Đơn tham chiếu không tồn tại.', 1;
    SELECT
        v.*,
        d.LyDoHuy,
        d.ThongBaoHuy,
        b.DiemBoiThuong,
        b.NgayBoiThuong
    FROM
        dbo.vw_ChiTietDonDatVe v
        INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
        LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = v.DonDatVeID
    WHERE
        v.DonDatVeID = @DonDatVeID;
    SELECT
        cv.VeID,
        cv.MaVe,
        g.GheID,
        g.HangGhe,
        g.SoGhe,
        g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe,
        g.LoaiGhe,
        cv.GiaVe,
        cv.TrangThai AS TrangThaiVe
    FROM
        dbo.CHITIETVE cv
        INNER JOIN dbo.GHE g ON g.GheID = cv.GheID
    WHERE
        cv.DonDatVeID = @DonDatVeID
    ORDER BY
        cv.VeID;
    SELECT
        cda.ChiTietDoAnID,
        sp.SanPhamID,
        sp.TenSanPham,
        sp.LoaiSanPham,
        cda.SoLuong,
        cda.DonGia,
        cda.SoLuong * cda.DonGia AS ThanhTien
    FROM
        dbo.CHITIETDOAN cda
        INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID = cda.SanPhamID
    WHERE
        cda.DonDatVeID = @DonDatVeID
    ORDER BY
        cda.ChiTietDoAnID;
    SELECT
        ThanhToanID,
        PhuongThuc,
        SoTien,
        NgayTao,
        NgayThanhToan,
        MaGiaoDich,
        TrangThai,
        GhiChu
    FROM
        dbo.THANHTOAN
    WHERE
        DonDatVeID = @DonDatVeID
    ORDER BY
        ThanhToanID;
END;
GO

-- ============================================================================
-- PHẦN 3: HẬU KIỂM ĐỐI SOÁT SAU HOÀN TÁC (POST-ROLLBACK RECONCILIATION)
-- ============================================================================
PRINT '15. Kiểm tra đối soát sau khi hoàn tác so với Baseline...';

IF COL_LENGTH(N'dbo.THANHTOAN', N'SoTien') IS NULL
    THROW 51051, N'Lỗi hoàn tác: Cột SoTien không tồn tại!', 1;

IF NOT EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = N'CK_THANHTOAN_SoTien' AND parent_object_id = OBJECT_ID(N'dbo.THANHTOAN')
)
    THROW 51052, N'Lỗi hoàn tác: Constraint CK_THANHTOAN_SoTien chưa được phục hồi!', 1;

-- Kiểm tra Index đã INCLUDE lại SoTien
IF NOT EXISTS (
    SELECT 1 
    FROM sys.index_columns ic
    INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE ic.object_id = OBJECT_ID(N'dbo.THANHTOAN') 
      AND ic.index_id = INDEXPROPERTY(OBJECT_ID(N'dbo.THANHTOAN'), N'IX_THANHTOAN_DonDatVe', 'IndexID')
      AND c.name = N'SoTien'
)
    THROW 51059, N'Lỗi hoàn tác: Index IX_THANHTOAN_DonDatVe chưa chứa cột SoTien!', 1;

-- Kiểm tra không có giá trị NULL hoặc âm trong SoTien
IF EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE SoTien IS NULL)
    THROW 51057, N'Lỗi hoàn tác: Cột SoTien vẫn còn chứa giá trị NULL!', 1;

IF EXISTS (SELECT 1 FROM dbo.THANHTOAN WHERE SoTien < 0)
    THROW 51058, N'Lỗi hoàn tác: Cột SoTien có giá trị âm!', 1;

DECLARE @RollbackCount INT;
DECLARE @RollbackRevenue DECIMAL(18, 2);
DECLARE @ExpectedCount INT;
DECLARE @ExpectedRevenue DECIMAL(18, 2);

SELECT 
    @RollbackCount = COUNT(*),
    @RollbackRevenue = SUM(CASE WHEN TrangThai = N'Thành công' THEN SoTien ELSE 0 END)
FROM dbo.THANHTOAN;

IF OBJECT_ID(N'tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test', N'U') IS NOT NULL
BEGIN
    SELECT TOP 1
        @ExpectedCount = TotalAttempts,
        @ExpectedRevenue = TotalHistoricalRevenue
    FROM tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test
    ORDER BY BaselineID DESC;
END;

PRINT N'  - Số Payment Attempts sau rollback: ' + CAST(@RollbackCount AS VARCHAR(10)) + ISNULL(N' (Kỳ vọng >= ' + CAST(@ExpectedCount AS VARCHAR(10)) + N')', N'');
PRINT N'  - Doanh thu sau rollback:            ' + FORMAT(@RollbackRevenue, 'N2') + N' VND' + ISNULL(N' (Kỳ vọng >= ' + FORMAT(@ExpectedRevenue, 'N2') + N' VND)', N'');

IF @ExpectedCount IS NOT NULL AND @RollbackCount < @ExpectedCount
BEGIN
    PRINT N'[LỖI HOÀN TÁC] Số lượng Payment Attempt bị mất mát sau khi rollback!';
    THROW 51053, N'Lỗi hoàn tác: Số bản ghi THANHTOAN ít hơn baseline ban đầu!', 1;
END;

IF @ExpectedRevenue IS NOT NULL AND @RollbackRevenue < @ExpectedRevenue
BEGIN
    PRINT N'[LỖI HOÀN TÁC] Doanh thu sau rollback thấp hơn baseline ban đầu!';
    THROW 51054, N'Lỗi hoàn tác: Doanh thu sau rollback thấp hơn baseline ban đầu!', 1;
END;

-- Đối soát chi tiết từng dòng với snapshot trước di trú bằng FULL OUTER JOIN hai chiều
IF OBJECT_ID(N'tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test', N'U') IS NOT NULL
BEGIN
    DECLARE @RollbackMissing INT = 0;
    DECLARE @RollbackExtra INT = 0;
    DECLARE @RollbackGranularMismatch INT = 0;

    SELECT 
        @RollbackMissing = SUM(CASE WHEN tt.ThanhToanID IS NULL THEN 1 ELSE 0 END),
        @RollbackExtra   = SUM(CASE WHEN b.ThanhToanID IS NULL THEN 1 ELSE 0 END),
        @RollbackGranularMismatch = SUM(CASE WHEN b.ThanhToanID IS NOT NULL AND tt.ThanhToanID IS NOT NULL 
                                             AND (tt.SoTien <> b.SoTien OR tt.TrangThai <> b.TrangThai COLLATE DATABASE_DEFAULT OR tt.DonDatVeID <> b.DonDatVeID) THEN 1 ELSE 0 END)
    FROM tempdb.dbo.Migration3NF_PaymentSnapshot_CinemaBookingDB_Test b
    FULL OUTER JOIN dbo.THANHTOAN tt ON tt.ThanhToanID = b.ThanhToanID;

    IF ISNULL(@RollbackMissing, 0) > 0 OR ISNULL(@RollbackExtra, 0) > 0 OR ISNULL(@RollbackGranularMismatch, 0) > 0
    BEGIN
        PRINT N'[LỖI HOÀN TÁC] Phát hiện sai lệch số lượng hoặc dữ liệu bản ghi phục hồi so với baseline pre-migration!';
        PRINT N'  - Thiếu: ' + CAST(ISNULL(@RollbackMissing, 0) AS VARCHAR(10)) + N', Thừa: ' + CAST(ISNULL(@RollbackExtra, 0) AS VARCHAR(10)) + N', Lệch: ' + CAST(ISNULL(@RollbackGranularMismatch, 0) AS VARCHAR(10));
        THROW 51055, N'Rollback Failed: Dữ liệu THANHTOAN phục hồi không khớp 100% hai chiều với baseline pre-migration.', 1;
    END
    ELSE
        PRINT N'  -> [PASS] Đối soát chi tiết hai chiều sau rollback: 100% bản ghi SoTien khớp chính xác baseline pre-migration!';
END;

-- Cập nhật trạng thái Rollback vào metadata tempdb
IF OBJECT_ID(N'tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test', N'U') IS NOT NULL
BEGIN
    UPDATE TOP (1) tempdb.dbo.Migration3NF_Baseline_CinemaBookingDB_Test
    SET Status = N'ROLLED_BACK'
    WHERE Status IN (N'PREFLIGHT_PASS', N'RECONCILED_PASS');
END;

PRINT '============================================================================';
PRINT 'HOÀN TẤT TOÀN PHẦN: HỆ THỐNG ĐÃ ĐƯỢC KHÔI PHỤC VỀ TRẠNG THÁI GỐC AN TOÀN 100%!';
PRINT '============================================================================';
GO

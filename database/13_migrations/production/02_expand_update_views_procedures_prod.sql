-- ============================================================================
-- SCRIPT: 02_expand_update_views_procedures.sql (Hardened R4.1 Version)
-- MỤC TIÊU: Giai đoạn Mở rộng (Expand Phase) - Cập nhật 1 View và 8 Stored Procedures
--           để đọc và ghi dữ liệu không còn phụ thuộc vào cột vật lý THANHTOAN.SoTien.
-- DỰ ÁN: CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến
-- TÍNH CHẤT: Non-breaking, Idempotent (sử dụng CREATE OR ALTER).
-- NGUYÊN TẮC THỨ TỰ AN TOÀN (SAFE OPERATIONAL ORDERING):
--   1. CẬP NHẬT READERS TRƯỚC: 1 View và 7 Stored Procedures đọc chuyển sang đọc từ DONDATVE.
--   2. CHUYỂN TIẾP SCHEMA: Relax cột SoTien sang NULLABLE (metadata-only).
--   3. CẬP NHẬT WRITER SAU CÙNG: sp_Payment_CreateAttempt bỏ SoTien khỏi lệnh INSERT.
--   -> Đảm bảo không bao giờ có Reader cũ đọc phải bản ghi NULL do Writer mới tạo!
-- BẢO VỆ MÔI TRƯỜNG: CHỈ ĐƯỢC CHẠY TRÊN DATABASE CinemaBookingDB_Test.
-- ============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '============================================================================';
PRINT 'BẮT ĐẦU EXPAND PHASE: CẬP NHẬT VIEW VÀ STORED PROCEDURES';
PRINT 'Thời gian thực thi: ' + CONVERT(VARCHAR(30), SYSDATETIME(), 120);
PRINT 'Server Instance:    ' + @@SERVERNAME;
PRINT 'Cơ sở dữ liệu:      ' + DB_NAME();
PRINT '============================================================================';
GO

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
GO

-- ============================================================================
-- PHẦN 1: CẬP NHẬT CÁC MODULE ĐỌC (READERS) CHUYỂN SANG ĐỌC TỪ DONDATVE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CẬP NHẬT VIEW: dbo.vw_DoanhThuTheoRap
-- ----------------------------------------------------------------------------
PRINT '1/9. Cập nhật Reader: dbo.vw_DoanhThuTheoRap...';
GO

CREATE OR ALTER VIEW dbo.vw_DoanhThuTheoRap AS
-- Doanh thu tính từ THANHTOAN có TrangThai = 'Thành công' (không dựa vào trạng thái đơn).
-- Giao dịch 'Thất bại' / 'Đang xử lý' / 'Đã hoàn tiền' không được tính.
-- STRICT 3NF: Tái dựng số tiền từ DONDATVE thay vì đọc cột vật lý THANHTOAN.SoTien
WITH
    DonDaThu AS (
        SELECT
            ddv.DonDatVeID,
            pc.RapID,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia,
            SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu,
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

-- ----------------------------------------------------------------------------
-- 2. CẬP NHẬT PROCEDURE: dbo.sp_Payment_UpdateResult
-- ----------------------------------------------------------------------------
PRINT '2/9. Cập nhật Reader/Status: dbo.sp_Payment_UpdateResult...';
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
        -- STRICT 3NF: Tái dựng @Amount từ d.TongTienVe + d.TongTienDoAn - d.TienGiamGia thay vì t.SoTien
        SELECT
            @DonID = t.DonDatVeID,
            @Amount = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia),
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

-- ----------------------------------------------------------------------------
-- 3. CẬP NHẬT PROCEDURE: dbo.sp_Admin_Dashboard
-- ----------------------------------------------------------------------------
PRINT '3/9. Cập nhật Reader: dbo.sp_Admin_Dashboard...';
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
        -- STRICT 3NF: Tái dựng tổng doanh thu qua INNER JOIN DONDATVE
        (
            SELECT
                ISNULL(SUM(d.TongTienVe + d.TongTienDoAn - d.TienGiamGia), 0)
            FROM
                dbo.THANHTOAN tt
                INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
            WHERE
                tt.TrangThai = N'Thành công'
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

-- ----------------------------------------------------------------------------
-- 4. CẬP NHẬT PROCEDURE: dbo.sp_Admin_Report_Revenue
-- ----------------------------------------------------------------------------
PRINT '4/9. Cập nhật Reader: dbo.sp_Admin_Report_Revenue...';
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
    -- Existing cash-receipt contract: successful payment snapshots, independent of
    -- order status. Compensation is loyalty points, not a cash refund.
    -- One row/order keeps ticket, food and discount snapshots from being multiplied.
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
        -- STRICT 3NF: Tái dựng từ DONDATVE snapshot
        SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia),
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
    -- Recordset 1: Summary (same metrics as the former second recordset).
    SELECT
        COUNT(DonDatVeID) AS TongSoDonToanHeThong,
        ISNULL(SUM(SoVe), 0) AS TongSoVeBan,
        ISNULL(SUM(TongTienVe), 0) AS TongDoanhThuVe,
        ISNULL(SUM(TongTienDoAn), 0) AS TongDoanhThuDoAn,
        ISNULL(SUM(TienGiamGia), 0) AS TongTienGiam,
        ISNULL(SUM(TienDaThu), 0) AS TongDoanhThuThucTe
    FROM
        #DonDaThu;
    -- Recordset 2: RevenueByCinema; preserve zero rows for existing cinemas.
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
    -- Recordset 3: RevenueByMovie. Every order has exactly one show/movie;
    -- its complete receipt (including food/discount) belongs to that movie.
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
    -- Recordset 4: RevenueByDate, inclusive Vietnam business-date bounds.
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

-- ----------------------------------------------------------------------------
-- 5. CẬP NHẬT PROCEDURE: dbo.sp_Manager_Revenue
-- ----------------------------------------------------------------------------
PRINT '5/9. Cập nhật Reader: dbo.sp_Manager_Revenue...';
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
    -- Doanh thu theo ngày thanh toán: chỉ tính THANHTOAN có TrangThai = 'Thành công'
    -- STRICT 3NF: Tái dựng số tiền từ DONDATVE
    ;
    WITH
        DonDaThu AS (
            SELECT
                ddv.DonDatVeID,
                ddv.TongTienVe,
                ddv.TongTienDoAn,
                ddv.TienGiamGia,
                SUM(ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TienDaThu,
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

-- ----------------------------------------------------------------------------
-- 6. CẬP NHẬT PROCEDURE: dbo.sp_Order_GetDetailByCustomer
-- ----------------------------------------------------------------------------
PRINT '6/9. Cập nhật Reader: dbo.sp_Order_GetDetailByCustomer...';
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
    -- STRICT 3NF: Tái dựng SoTien từ DONDATVE qua INNER JOIN
    SELECT
        tt.ThanhToanID,
        tt.PhuongThuc,
        (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien,
        tt.NgayTao,
        tt.NgayThanhToan,
        tt.MaGiaoDich,
        tt.TrangThai,
        tt.GhiChu
    FROM
        dbo.THANHTOAN tt
        INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
    WHERE
        tt.DonDatVeID = @DonDatVeID
    ORDER BY
        tt.ThanhToanID;
END;
GO

-- ----------------------------------------------------------------------------
-- 7. CẬP NHẬT PROCEDURE: dbo.sp_StaffBooking_Detail
-- ----------------------------------------------------------------------------
PRINT '7/9. Cập nhật Reader: dbo.sp_StaffBooking_Detail...';
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
        -- STRICT 3NF: Tái dựng SoTien từ DONDATVE qua INNER JOIN
        SELECT
            tt.ThanhToanID,
            tt.PhuongThuc,
            (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien,
            tt.NgayTao,
            tt.NgayThanhToan,
            tt.MaGiaoDich,
            tt.TrangThai,
            tt.GhiChu
        FROM
            dbo.THANHTOAN tt
            INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
        WHERE
            tt.DonDatVeID = @DonDatVeID
        ORDER BY
            tt.ThanhToanID;
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

-- ----------------------------------------------------------------------------
-- 8. CẬP NHẬT PROCEDURE: dbo.sp_Support_Complaint_GetOrderReference
-- ----------------------------------------------------------------------------
PRINT '8/9. Cập nhật Reader: dbo.sp_Support_Complaint_GetOrderReference...';
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
    -- Preserve cancelled tickets and every payment attempt in the read contract.
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
    -- STRICT 3NF: Tái dựng SoTien từ DONDATVE qua INNER JOIN
    SELECT
        tt.ThanhToanID,
        tt.PhuongThuc,
        (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien,
        tt.NgayTao,
        tt.NgayThanhToan,
        tt.MaGiaoDich,
        tt.TrangThai,
        tt.GhiChu
    FROM
        dbo.THANHTOAN tt
        INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID
    WHERE
        tt.DonDatVeID = @DonDatVeID
    ORDER BY
        tt.ThanhToanID;
END;
GO

-- ============================================================================
-- PHẦN 2: CHUYỂN TIẾP SCHEMA VẬT LÝ SANG NULLABLE (METADATA-ONLY OPERATION)
-- ============================================================================
IF COL_LENGTH(N'dbo.THANHTOAN', N'SoTien') IS NOT NULL
   AND COLUMNPROPERTY(OBJECT_ID(N'dbo.THANHTOAN'), N'SoTien', 'AllowsNull') = 0
BEGIN
    PRINT 'Chuyển tiếp schema: dbo.THANHTOAN.SoTien sang NULLABLE...';
    ALTER TABLE dbo.THANHTOAN ALTER COLUMN [SoTien] DECIMAL(18, 2) NULL;
    PRINT '  -> [OK] Đã chuyển đổi SoTien sang NULLABLE an toàn.';
END
ELSE
BEGIN
    PRINT 'Cột SoTien đã cho phép NULL hoặc không tồn tại.';
END;
GO

-- ============================================================================
-- PHẦN 3: CẬP NHẬT MODULE GHI (WRITER) - SAU KHI TOÀN BỘ READERS ĐÃ MIGRATE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9. CẬP NHẬT PROCEDURE: dbo.sp_Payment_CreateAttempt
-- ----------------------------------------------------------------------------
PRINT '9/9. Cập nhật Writer: dbo.sp_Payment_CreateAttempt...';
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
        -- STRICT 3NF: Loại bỏ cột SoTien khỏi lệnh INSERT dbo.THANHTOAN
        INSERT
            dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, MaGiaoDich, TrangThai)
        VALUES
            (@DonDatVeID, @PhuongThuc, @Now, @MaGiaoDich, N'Đang xử lý');
        SET
            @ThanhToanID = SCOPE_IDENTITY();
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        -- STRICT 3NF: Tái dựng SoTien từ DONDATVE d để bảo toàn 100% API contract
        SELECT
            tt.ThanhToanID,
            tt.DonDatVeID,
            tt.PhuongThuc,
            (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien,
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

PRINT '============================================================================';
PRINT 'HOÀN TẤT EXPAND PHASE: TOÀN BỘ READERS VÀ WRITER ĐÃ ĐƯỢC CẬP NHẬT AN TOÀN!';
PRINT '============================================================================';
GO


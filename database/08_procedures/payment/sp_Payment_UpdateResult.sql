-- Cập nhật dữ liệu thanh toán: sp_Payment_UpdateResult.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

-- Baseline: migrations/014_showtime_lifecycle.sql:293 (dbo.sp_Payment_UpdateResult)
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

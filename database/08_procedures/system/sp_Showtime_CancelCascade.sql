SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:36 (dbo.sp_Showtime_CancelCascade)
CREATE OR ALTER PROCEDURE dbo.sp_Showtime_CancelCascade
    @SuatChieuID INT,
    @NguoiDungID INT = NULL,
    @LyDo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    DECLARE @Status NVARCHAR(50), @StartsAt DATETIME2, @RapID INT, @Now DATETIME2;
    DECLARE @Dummy INT, @Cancelled INT = 0;
    DECLARE @Orders TABLE (DonDatVeID INT PRIMARY KEY, NguoiDungID INT, KhuyenMaiID INT NULL, TrangThai NVARCHAR(50));
    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ShowtimeCancelCascade;

        -- Customer-first locking matches sp_Booking_Create and payment procedures.
        -- The serializable scan also prevents a new customer row appearing mid-cancel.
        SELECT @Dummy = MAX(NguoiDungID) FROM dbo.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK);

        SELECT @Status = sc.TrangThai, @StartsAt = sc.ThoiGianBatDau, @RapID = pc.RapID
        FROM dbo.SUATCHIEU sc WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID
        WHERE sc.SuatChieuID = @SuatChieuID;
        IF @Status IS NULL THROW 50116, N'Suất chiếu không tồn tại.', 1;
        IF @NguoiDungID IS NOT NULL AND dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
            THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        SET @Now = dbo.fn_BayGio();
        IF @Status = N'Đã hủy' OR @Status = N'Hoàn thành' OR @StartsAt <= @Now
            THROW 50119, N'Không thể hủy suất chiếu đã bắt đầu hoặc đã bị hủy.', 1;

        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;

        INSERT @Orders (DonDatVeID, NguoiDungID, KhuyenMaiID, TrangThai)
        SELECT d.DonDatVeID, d.NguoiDungID, d.KhuyenMaiID, d.TrangThai
        FROM dbo.DONDATVE d WITH (UPDLOCK, HOLDLOCK)
        WHERE d.SuatChieuID = @SuatChieuID
          AND d.TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán', N'Hết hạn');

        -- Release only promo uses still counted (unexpired holds and paid orders).
        UPDATE km
        SET SoLuongDaDung = CASE WHEN km.SoLuongDaDung >= x.SoLan THEN km.SoLuongDaDung - x.SoLan ELSE 0 END
        FROM dbo.KHUYENMAI km
        INNER JOIN (
            SELECT KhuyenMaiID, COUNT(*) AS SoLan FROM @Orders
            WHERE KhuyenMaiID IS NOT NULL AND TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán')
            GROUP BY KhuyenMaiID
        ) x ON x.KhuyenMaiID = km.KhuyenMaiID;

        -- Withdraw only the points previously granted by successful payments.
        ;WITH RefundPoints AS (
            SELECT o.NguoiDungID, SUM(CAST(tt.SoTien / 1000 AS INT)) AS Points
            FROM @Orders o
            INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = o.DonDatVeID AND tt.TrangThai = N'Thành công'
            WHERE o.TrangThai = N'Đã thanh toán'
            GROUP BY o.NguoiDungID
        )
        UPDATE h SET DiemTichLuy = CASE WHEN h.DiemTichLuy >= p.Points THEN h.DiemTichLuy - p.Points ELSE 0 END
        FROM dbo.HOSOKHACHHANG h INNER JOIN RefundPoints p ON p.NguoiDungID = h.NguoiDungID;

        UPDATE tt SET TrangThai = N'Đã hoàn tiền', GhiChu = N'Suất chiếu đã bị hủy; hoàn tiền mô phỏng.'
        FROM dbo.THANHTOAN tt INNER JOIN @Orders o ON o.DonDatVeID = tt.DonDatVeID
        WHERE o.TrangThai = N'Đã thanh toán' AND tt.TrangThai = N'Thành công';

        UPDATE cv SET TrangThai = N'Đã hủy'
        FROM dbo.CHITIETVE cv INNER JOIN @Orders o ON o.DonDatVeID = cv.DonDatVeID
        WHERE cv.TrangThai <> N'Đã hủy';

        UPDATE d
        SET TrangThai = N'Đã hủy', HanGiuCho = NULL,
            LyDoHuy = @LyDo,
            ThongBaoHuy = N'Suất chiếu đã bị hủy, tiền sẽ được hoàn về thông qua nền tảng thanh toán'
        FROM dbo.DONDATVE d INNER JOIN @Orders o ON o.DonDatVeID = d.DonDatVeID;
        SET @Cancelled = @@ROWCOUNT;

        UPDATE dbo.SUATCHIEU SET TrangThai = N'Đã hủy' WHERE SuatChieuID = @SuatChieuID;
        IF @OwnTran = 1 COMMIT TRANSACTION;
        SELECT CASE WHEN @NguoiDungID IS NULL THEN N'Đã hủy suất chiếu.' ELSE N'Hủy suất chiếu thành công.' END AS [Message], @Cancelled AS SoDonDaHuy;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTran = 1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION ShowtimeCancelCascade;
        END
        ;THROW;
    END CATCH
END;
GO

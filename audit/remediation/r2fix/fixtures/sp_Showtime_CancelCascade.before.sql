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
    DECLARE @Credits TABLE (NguoiDungID INT, DiemCong BIGINT);
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
        IF @Status = N'Đã hủy'
        BEGIN
            IF @OwnTran = 1 COMMIT TRANSACTION;
            SELECT N'Suất chiếu đã được hủy.' AS [Message], 0 AS SoDonDaHuy;
            RETURN;
        END;
        IF @Status = N'Hoàn thành' OR @StartsAt <= @Now
            THROW 50119, N'Không thể hủy suất chiếu đã bắt đầu hoặc đã bị hủy.', 1;

        -- The customer/showtime locks serialize booking, payment and concurrent cancellation.
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE WITH (UPDLOCK, HOLDLOCK)
                   WHERE SuatChieuID = @SuatChieuID AND TrangThai = N'Chờ thanh toán' AND HanGiuCho > @Now)
            THROW 50118, N'Không thể hủy suất chiếu vì còn đơn giữ ghế/chờ thanh toán còn hiệu lực.', 1;

        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;

        INSERT @Orders (DonDatVeID, NguoiDungID, KhuyenMaiID, TrangThai)
        SELECT d.DonDatVeID, d.NguoiDungID, d.KhuyenMaiID, d.TrangThai
        FROM dbo.DONDATVE d WITH (UPDLOCK, HOLDLOCK)
        WHERE d.SuatChieuID = @SuatChieuID
          AND d.TrangThai = N'Đã thanh toán';

        -- Release only promo uses still counted (unexpired holds and paid orders).
        UPDATE km
        SET SoLuongDaDung = CASE WHEN km.SoLuongDaDung >= x.SoLan THEN km.SoLuongDaDung - x.SoLan ELSE 0 END
        FROM dbo.KHUYENMAI km
        INNER JOIN (
            SELECT KhuyenMaiID, COUNT(*) AS SoLan FROM @Orders
            WHERE KhuyenMaiID IS NOT NULL AND TrangThai IN (N'Chờ thanh toán', N'Đã thanh toán')
            GROUP BY KhuyenMaiID
        ) x ON x.KhuyenMaiID = km.KhuyenMaiID;

        -- No payment writes and no reversal of previously earned loyalty points.
        -- The unique order key is a second defense against double-credit and keeps snapshots for audit.
        INSERT dbo.BOITHUONG_HUYSUAT
            (DonDatVeID, SuatChieuID, NguoiDungID, TongTienVe, TongTienDoAn, TienGiamGia,
             TienVeThucTra, DiemCong, NgayBoiThuong, NguoiThucHienID)
        OUTPUT inserted.NguoiDungID, inserted.DiemCong INTO @Credits
        SELECT d.DonDatVeID, d.SuatChieuID, d.NguoiDungID, d.TongTienVe, d.TongTienDoAn, d.TienGiamGia,
               c.TienVeThucTra, c.DiemCong, @Now, @NguoiDungID
        FROM dbo.DONDATVE d INNER JOIN @Orders o ON o.DonDatVeID = d.DonDatVeID
        CROSS APPLY dbo.fn_TinhBoiThuongVe(d.TongTienVe, d.TongTienDoAn, d.TienGiamGia) c
        WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')
          AND NOT EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b WITH (UPDLOCK, HOLDLOCK) WHERE b.DonDatVeID = d.DonDatVeID);

        INSERT dbo.HOSOKHACHHANG (NguoiDungID, DiemTichLuy)
        SELECT DISTINCT c.NguoiDungID, 0 FROM @Credits c
        WHERE NOT EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG h WITH (UPDLOCK, HOLDLOCK) WHERE h.NguoiDungID = c.NguoiDungID);

        UPDATE h SET DiemTichLuy = h.DiemTichLuy + c.Points
        FROM dbo.HOSOKHACHHANG h
        INNER JOIN (SELECT NguoiDungID, SUM(DiemCong) AS Points FROM @Credits GROUP BY NguoiDungID) c
            ON c.NguoiDungID = h.NguoiDungID;

        UPDATE cv SET TrangThai = N'Đã hủy'
        FROM dbo.CHITIETVE cv INNER JOIN @Orders o ON o.DonDatVeID = cv.DonDatVeID
        WHERE cv.TrangThai <> N'Đã hủy';

        UPDATE d
        SET TrangThai = N'Đã hủy', HanGiuCho = NULL,
            LyDoHuy = @LyDo,
            ThongBaoHuy = N'Suất chiếu đã bị hủy. Điểm bồi thường phần vé đã được cộng vào tài khoản (1.000 VNĐ = 1 điểm).'
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

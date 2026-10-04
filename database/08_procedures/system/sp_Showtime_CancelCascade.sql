SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:36 (dbo.sp_Showtime_CancelCascade)
CREATE OR ALTER PROCEDURE dbo.sp_Showtime_CancelCascade
    @SuatChieuID INT,
    @NguoiDungID INT,
    @LyDo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    DECLARE @Status NVARCHAR(50), @StartsAt DATETIME2, @RapID INT, @Now DATETIME2;
    DECLARE @Dummy INT, @Cancelled INT = 0;
    DECLARE @Orders TABLE (DonDatVeID INT PRIMARY KEY, NguoiDungID INT, KhuyenMaiID INT NULL, TrangThai NVARCHAR(50));
    DECLARE @Credits TABLE (DonDatVeID INT, DiemBoiThuong INT);
    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ShowtimeCancelCascade;

        -- Customer-first locking matches sp_Booking_Create and payment procedures.
        -- The serializable scan also prevents a new customer row appearing mid-cancel.
        SELECT @Dummy = MAX(NguoiDungID) FROM dbo.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK);
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('ADMIN', 'QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_SUAT_CHIEU') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


        SELECT @Status = sc.TrangThai, @StartsAt = sc.ThoiGianBatDau, @RapID = pc.RapID
        FROM dbo.SUATCHIEU sc WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID
        WHERE sc.SuatChieuID = @SuatChieuID;
        IF @Status IS NULL THROW 50116, N'Suất chiếu không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID WHERE nd.NguoiDungID=@NguoiDungID AND vt.MaVaiTro='QUAN_LY_RAP')
           AND dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
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
        -- Only the actual event points are persisted. Order snapshots stay in DONDATVE.
        DECLARE @DonID INT, @TongTienVe DECIMAL(18,2), @TongTienDoAn DECIMAL(18,2),
                @TienGiamGia DECIMAL(18,2), @TongTruocGiam DECIMAL(19,2),
                @GiamChoVe DECIMAL(38,6), @TienVeThucTra DECIMAL(38,6), @DiemBoiThuong INT;
        DECLARE CompensationOrders CURSOR LOCAL FAST_FORWARD FOR
            SELECT d.DonDatVeID, d.TongTienVe, d.TongTienDoAn, d.TienGiamGia
            FROM dbo.DONDATVE d INNER JOIN @Orders o ON o.DonDatVeID = d.DonDatVeID
            WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')
              AND NOT EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b WITH (UPDLOCK, HOLDLOCK) WHERE b.DonDatVeID = d.DonDatVeID);
        OPEN CompensationOrders;
        FETCH NEXT FROM CompensationOrders INTO @DonID, @TongTienVe, @TongTienDoAn, @TienGiamGia;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @TongTruocGiam = @TongTienVe + @TongTienDoAn;
            SET @GiamChoVe = ISNULL(@TienGiamGia * @TongTienVe / NULLIF(@TongTruocGiam, 0), 0);
            SET @TienVeThucTra = CASE WHEN @TongTruocGiam = 0 OR @GiamChoVe >= @TongTienVe THEN 0
                                     ELSE @TongTienVe - @GiamChoVe END;
            -- Preserve R2's exact final FLOOR, including sub-point division boundaries.
            -- The helper works from DECIMAL cents, so intermediate display precision cannot round points up.
            SELECT @DiemBoiThuong = CONVERT(INT, c.DiemCong)
            FROM dbo.fn_TinhBoiThuongVe(@TongTienVe, @TongTienDoAn, @TienGiamGia) c;
            INSERT dbo.BOITHUONG_HUYSUAT (DonDatVeID, DiemBoiThuong, NgayBoiThuong, GhiChu)
            OUTPUT inserted.DonDatVeID, inserted.DiemBoiThuong INTO @Credits
            VALUES (@DonID, @DiemBoiThuong, @Now,
                    CASE WHEN @NguoiDungID IS NULL THEN NULL ELSE CONCAT(N'Người thực hiện ID: ', @NguoiDungID) END);
            FETCH NEXT FROM CompensationOrders INTO @DonID, @TongTienVe, @TongTienDoAn, @TienGiamGia;
        END;
        CLOSE CompensationOrders;
        DEALLOCATE CompensationOrders;

        INSERT dbo.HOSOKHACHHANG (NguoiDungID, DiemTichLuy)
        SELECT DISTINCT o.NguoiDungID, 0 FROM @Credits c INNER JOIN @Orders o ON o.DonDatVeID=c.DonDatVeID
        WHERE NOT EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG h WITH (UPDLOCK, HOLDLOCK) WHERE h.NguoiDungID = o.NguoiDungID);

        UPDATE h SET DiemTichLuy = h.DiemTichLuy + c.Points
        FROM dbo.HOSOKHACHHANG h
        INNER JOIN (SELECT o.NguoiDungID, SUM(CONVERT(BIGINT, c.DiemBoiThuong)) AS Points
                    FROM @Credits c INNER JOIN @Orders o ON o.DonDatVeID=c.DonDatVeID GROUP BY o.NguoiDungID) c
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
        IF CURSOR_STATUS('local', 'CompensationOrders') >= 0 CLOSE CompensationOrders;
        IF CURSOR_STATUS('local', 'CompensationOrders') >= -1 DEALLOCATE CompensationOrders;
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

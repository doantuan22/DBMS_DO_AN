USE CinemaBookingDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- P1: Keep a durable customer-facing cancellation reason/message on the order.
IF COL_LENGTH(N'dbo.DONDATVE', N'LyDoHuy') IS NULL
    ALTER TABLE dbo.DONDATVE ADD LyDoHuy NVARCHAR(255) NULL;
IF COL_LENGTH(N'dbo.DONDATVE', N'ThongBaoHuy') IS NULL
    ALTER TABLE dbo.DONDATVE ADD ThongBaoHuy NVARCHAR(255) NULL;
GO

CREATE OR ALTER FUNCTION dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID INT)
RETURNS BIT
AS
BEGIN
    DECLARE @CoVe BIT = 0;
    IF EXISTS (
        SELECT 1
        FROM dbo.CHITIETVE cv
        INNER JOIN dbo.DONDATVE ddv ON ddv.DonDatVeID = cv.DonDatVeID
        INNER JOIN dbo.SUATCHIEU sc ON sc.SuatChieuID = ddv.SuatChieuID
        WHERE cv.GheID = @GheID
          AND cv.TrangThai = N'Đã đặt'
          AND sc.ThoiGianBatDau > SYSDATETIME()
          AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, SYSDATETIME()) = 1
    ) SET @CoVe = 1;
    RETURN @CoVe;
END;
GO

-- The shared cancellation path used by manager and admin. Lock customer rows before
-- the showtime, then process orders/tickets: this preserves the booking lock order
-- (customer -> showtime -> seats) and prevents a callback from deadlocking a cancel.
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
        SET @Now = SYSDATETIME();
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

CREATE OR ALTER PROCEDURE dbo.sp_Manager_Showtime_Cancel
    @NguoiDungID INT, @SuatChieuID INT, @LyDo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @SuatChieuID, @NguoiDungID = @NguoiDungID, @LyDo = @LyDo;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Cancel @SuatChieuID INT
AS
BEGIN
    SET NOCOUNT ON;
    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @SuatChieuID, @NguoiDungID = NULL, @LyDo = NULL;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Manager_Showtime_Update
    @NguoiDungID INT, @SuatChieuID INT, @PhimID INT, @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2, @DinhDang NVARCHAR(50), @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerShowtimeUpdate;
        DECLARE @RapID INT, @OldPhim INT, @OldStart DATETIME2, @OldEnd DATETIME2, @OldRoom INT, @OldFormat NVARCHAR(50), @OldStatus NVARCHAR(50), @Now DATETIME2 = SYSDATETIME();
        SELECT @RapID = pc.RapID, @OldPhim = sc.PhimID, @OldStart = sc.ThoiGianBatDau, @OldEnd = sc.ThoiGianKetThuc,
               @OldRoom = sc.PhongID, @OldFormat = sc.DinhDang, @OldStatus = sc.TrangThai
        FROM dbo.SUATCHIEU sc WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID WHERE sc.SuatChieuID = @SuatChieuID;
        IF @RapID IS NULL THROW 50058, N'Suất chiếu không tồn tại.', 1;
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0 THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        IF @TrangThai = N'Đã hủy' THROW 50123, N'Dùng route hủy suất chiếu riêng.', 1;
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID = @SuatChieuID AND
                   (d.TrangThai = N'Đã thanh toán' OR (d.TrangThai = N'Chờ thanh toán' AND d.HanGiuCho > @Now)))
           AND (@PhimID <> @OldPhim OR @ThoiGianBatDau <> @OldStart OR @ThoiGianKetThuc <> @OldEnd OR @DinhDang <> @OldFormat)
            THROW 50120, N'Suất chiếu đã có đơn; không thể đổi phim, giờ, phòng hoặc định dạng.', 1;
        IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50057, N'Thời gian suất chiếu không hợp lệ.', 1;
        UPDATE dbo.SUATCHIEU SET PhimID=@PhimID, ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,
            DinhDang=@DinhDang, GiaVeCoBan=@GiaVeCoBan, TrangThai=@TrangThai WHERE SuatChieuID=@SuatChieuID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @SuatChieuID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerShowtimeUpdate; END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Update
    @SuatChieuID INT, @PhimID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50), @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminShowtimeUpdate;
        DECLARE @OldPhim INT, @OldStart DATETIME2, @OldEnd DATETIME2, @OldFormat NVARCHAR(50), @Now DATETIME2 = SYSDATETIME();
        SELECT @OldPhim=PhimID, @OldStart=ThoiGianBatDau, @OldEnd=ThoiGianKetThuc, @OldFormat=DinhDang
        FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE SuatChieuID=@SuatChieuID;
        IF @OldPhim IS NULL THROW 50058, N'Suất chiếu không tồn tại.', 1;
        IF @TrangThai=N'Đã hủy' THROW 50123, N'Dùng route hủy suất chiếu riêng.', 1;
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=@SuatChieuID AND
                   (d.TrangThai=N'Đã thanh toán' OR (d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>@Now)))
           AND (@PhimID<>@OldPhim OR @ThoiGianBatDau<>@OldStart OR @ThoiGianKetThuc<>@OldEnd OR @DinhDang<>@OldFormat)
            THROW 50120, N'Suất chiếu đã có đơn; không thể đổi phim, giờ, phòng hoặc định dạng.', 1;
        IF @ThoiGianKetThuc<=@ThoiGianBatDau THROW 50211, N'Thời gian suất chiếu không hợp lệ.', 1;
        UPDATE dbo.SUATCHIEU SET PhimID=@PhimID, ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,
            DinhDang=@DinhDang, GiaVeCoBan=@GiaVeCoBan, TrangThai=@TrangThai WHERE SuatChieuID=@SuatChieuID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@SuatChieuID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AdminShowtimeUpdate; END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_Update
    @NguoiDungID INT, @GheID INT, @LoaiGhe NVARCHAR(50), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerSeatUpdate;
        DECLARE @RapID INT;
        SELECT @RapID=pc.RapID FROM dbo.GHE g WITH (UPDLOCK,HOLDLOCK) INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID=g.PhongID WHERE g.GheID=@GheID;
        IF @RapID IS NULL THROW 50109, N'Ghế không tồn tại.', 1;
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID,@RapID)=0 THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        IF dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID)=1 THROW 50207, N'Ghế có vé hiệu lực ở suất chiếu tương lai.', 1;
        UPDATE dbo.GHE SET LoaiGhe=@LoaiGhe, TrangThai=@TrangThai WHERE GheID=@GheID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        SELECT GheID,PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai FROM dbo.GHE WHERE GheID=@GheID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerSeatUpdate; END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Update
    @GheID INT, @LoaiGhe NVARCHAR(50), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminSeatUpdate;
        IF NOT EXISTS (SELECT 1 FROM dbo.GHE WITH (UPDLOCK,HOLDLOCK) WHERE GheID=@GheID) THROW 50206, N'Ghế không tồn tại.', 1;
        IF dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID)=1 THROW 50207, N'Ghế có vé hiệu lực ở suất chiếu tương lai.', 1;
        UPDATE dbo.GHE SET LoaiGhe=@LoaiGhe, TrangThai=@TrangThai WHERE GheID=@GheID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        SELECT GheID,PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai FROM dbo.GHE WHERE GheID=@GheID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AdminSeatUpdate; END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_CreateAttempt
    @DonDatVeID INT, @PhuongThuc NVARCHAR(50), @ThanhToanID INT OUTPUT, @MaGiaoDich VARCHAR(100) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION PaymentCreateAttempt;
        DECLARE @UserID INT, @SuatID INT, @RoomID INT, @ShowStatus NVARCHAR(50), @Starts DATETIME2,
                @OrderStatus NVARCHAR(50), @Hold DATETIME2, @Amount DECIMAL(18,2), @Now DATETIME2=SYSDATETIME();
        SELECT @UserID=NguoiDungID,@SuatID=SuatChieuID FROM dbo.DONDATVE WHERE DonDatVeID=@DonDatVeID;
        IF @UserID IS NULL THROW 50030, N'Đơn đặt vé không tồn tại.', 1;
        DECLARE @LockedUser INT;
        SELECT @LockedUser=NguoiDungID FROM dbo.NGUOIDUNG WITH (UPDLOCK,HOLDLOCK) WHERE NguoiDungID=@UserID;
        SELECT @RoomID=PhongID,@ShowStatus=TrangThai,@Starts=ThoiGianBatDau
        FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE SuatChieuID=@SuatID;
        IF @RoomID IS NULL OR @ShowStatus<>N'Mở bán' OR @Starts<=@Now THROW 50121, N'Suất chiếu không còn hợp lệ để thanh toán.', 1;
        SELECT @OrderStatus=TrangThai,@Hold=HanGiuCho,@Amount=TongTienVe+TongTienDoAn-TienGiamGia
        FROM dbo.DONDATVE WITH (UPDLOCK,HOLDLOCK) WHERE DonDatVeID=@DonDatVeID;
        IF @OrderStatus=N'Hết hạn' OR (@OrderStatus=N'Chờ thanh toán' AND @Hold<=@Now) THROW 50111, N'Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.', 1;
        IF @OrderStatus<>N'Chờ thanh toán' THROW 50031, N'Đơn hàng không ở trạng thái Chờ thanh toán.', 1;
        SET @MaGiaoDich=CONCAT('TXN-',FORMAT(@Now,'yyyyMMddHHmmss'),'-',CAST(@DonDatVeID AS VARCHAR(10)),'-',LEFT(REPLACE(CONVERT(VARCHAR(36),NEWID()),'-',''),6));
        INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,NgayTao,MaGiaoDich,TrangThai) VALUES(@DonDatVeID,@PhuongThuc,@Amount,@Now,@MaGiaoDich,N'Đang xử lý');
        SET @ThanhToanID=SCOPE_IDENTITY();
        IF @OwnTran=1 COMMIT TRANSACTION;
        SELECT tt.ThanhToanID,tt.DonDatVeID,tt.PhuongThuc,tt.SoTien,tt.NgayTao,tt.MaGiaoDich,tt.TrangThai,d.HanGiuCho
        FROM dbo.THANHTOAN tt INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=tt.DonDatVeID WHERE tt.ThanhToanID=@ThanhToanID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION PaymentCreateAttempt; END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Payment_UpdateResult
    @ThanhToanID INT, @TrangThaiThanhToan NVARCHAR(50), @MaGiaoDichNgoai VARCHAR(100)=NULL, @GhiChu NVARCHAR(255)=NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @TrangThaiThanhToan NOT IN (N'Thành công',N'Thất bại') THROW 50114, N'Kết quả thanh toán phải là Thành công hoặc Thất bại.', 1;
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION PaymentUpdateResult;
        DECLARE @UserID INT,@SuatID INT,@LockedUser INT,@ShowStatus NVARCHAR(50),@Starts DATETIME2,@DonID INT,
            @Amount DECIMAL(18,2),@CurrentPayment NVARCHAR(50),@OrderStatus NVARCHAR(50),@Hold DATETIME2,
            @PromoID INT,@Now DATETIME2=SYSDATETIME();
        SELECT @UserID=d.NguoiDungID,@SuatID=d.SuatChieuID FROM dbo.THANHTOAN t INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE t.ThanhToanID=@ThanhToanID;
        IF @UserID IS NULL THROW 50032, N'Giao dịch thanh toán không tồn tại.', 1;
        SELECT @LockedUser=NguoiDungID FROM dbo.NGUOIDUNG WITH (UPDLOCK,HOLDLOCK) WHERE NguoiDungID=@UserID;
        SELECT @ShowStatus=TrangThai,@Starts=ThoiGianBatDau FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE SuatChieuID=@SuatID;
        SELECT @DonID=t.DonDatVeID,@Amount=t.SoTien,@CurrentPayment=t.TrangThai,@OrderStatus=d.TrangThai,@Hold=d.HanGiuCho,@PromoID=d.KhuyenMaiID
        FROM dbo.THANHTOAN t WITH (UPDLOCK,HOLDLOCK) INNER JOIN dbo.DONDATVE d WITH (UPDLOCK,HOLDLOCK) ON d.DonDatVeID=t.DonDatVeID WHERE t.ThanhToanID=@ThanhToanID;
        IF @CurrentPayment=@TrangThaiThanhToan
        BEGIN
            IF @OwnTran=1 COMMIT TRANSACTION;
            SELECT d.DonDatVeID,d.TrangThai AS TrangThaiDon,t.ThanhToanID,t.MaGiaoDich,t.TrangThai AS TrangThaiThanhToan,t.NgayThanhToan FROM dbo.DONDATVE d JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID WHERE t.ThanhToanID=@ThanhToanID;
            RETURN;
        END
        IF @CurrentPayment<>N'Đang xử lý' THROW 50115, N'Giao dịch đã có kết quả cuối cùng, không thể đổi.', 1;
        IF @TrangThaiThanhToan=N'Thành công'
        BEGIN
            IF @OrderStatus=N'Hết hạn' OR (@OrderStatus=N'Chờ thanh toán' AND @Hold<=@Now)
                THROW 50111, N'Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.', 1;
            IF @OrderStatus<>N'Chờ thanh toán' THROW 50113, N'Đơn hàng không còn ở trạng thái có thể thanh toán.', 1;
            IF @Hold IS NULL THROW 50111, N'Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.', 1;
            IF @ShowStatus<>N'Mở bán' OR @Starts<=@Now THROW 50121, N'Suất chiếu không còn hợp lệ để thanh toán.', 1;
            UPDATE dbo.THANHTOAN SET TrangThai=N'Thành công',NgayThanhToan=@Now,MaGiaoDich=ISNULL(@MaGiaoDichNgoai,MaGiaoDich),GhiChu=@GhiChu WHERE ThanhToanID=@ThanhToanID;
            UPDATE dbo.DONDATVE SET TrangThai=N'Đã thanh toán',HanGiuCho=NULL WHERE DonDatVeID=@DonID;
            DECLARE @Points INT=CAST(@Amount/1000 AS INT);
            IF @Points>0 UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=DiemTichLuy+@Points WHERE NguoiDungID=@UserID;
        END
        ELSE
        BEGIN
            UPDATE dbo.THANHTOAN SET TrangThai=N'Thất bại',NgayThanhToan=NULL,MaGiaoDich=ISNULL(@MaGiaoDichNgoai,MaGiaoDich),GhiChu=@GhiChu WHERE ThanhToanID=@ThanhToanID;
        END
        IF @OwnTran=1 COMMIT TRANSACTION;
        SELECT d.DonDatVeID,d.TrangThai AS TrangThaiDon,d.HanGiuCho,t.ThanhToanID,t.MaGiaoDich,t.TrangThai AS TrangThaiThanhToan,t.NgayThanhToan
        FROM dbo.DONDATVE d JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID WHERE t.ThanhToanID=@ThanhToanID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION PaymentUpdateResult; END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Order_GetDetailByCustomer @NguoiDungID INT, @DonDatVeID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@DonDatVeID AND NguoiDungID=@NguoiDungID)
        THROW 50033, N'Đơn đặt vé không tồn tại hoặc bạn không có quyền xem đơn này.', 1;
    SELECT v.*,d.LyDoHuy,d.ThongBaoHuy
    FROM dbo.vw_ChiTietDonDatVe v INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE v.DonDatVeID=@DonDatVeID;
    SELECT cv.VeID,cv.MaVe,g.GheID,g.HangGhe,g.SoGhe,(g.HangGhe+CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,g.LoaiGhe,cv.GiaVe,cv.TrangThai AS TrangThaiVe
    FROM dbo.CHITIETVE cv INNER JOIN dbo.GHE g ON g.GheID=cv.GheID WHERE cv.DonDatVeID=@DonDatVeID;
    SELECT cda.ChiTietDoAnID,sp.SanPhamID,sp.TenSanPham,sp.LoaiSanPham,cda.SoLuong,cda.DonGia,cda.SoLuong*cda.DonGia AS ThanhTien
    FROM dbo.CHITIETDOAN cda INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID=cda.SanPhamID WHERE cda.DonDatVeID=@DonDatVeID;
    SELECT ThanhToanID,PhuongThuc,SoTien,NgayTao,NgayThanhToan,MaGiaoDich,TrangThai,GhiChu FROM dbo.THANHTOAN WHERE DonDatVeID=@DonDatVeID ORDER BY ThanhToanID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Order_ListByCustomer @NguoiDungID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT v.*,d.LyDoHuy,d.ThongBaoHuy
    FROM dbo.vw_LichSuDatVe v INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID
    WHERE v.NguoiDungID=@NguoiDungID ORDER BY v.NgayDat DESC;
END;
GO

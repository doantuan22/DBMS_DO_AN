SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:257 (dbo.sp_Payment_CreateAttempt)
CREATE OR ALTER PROCEDURE dbo.sp_Payment_CreateAttempt
    @DonDatVeID INT, @PhuongThuc NVARCHAR(50), @ThanhToanID INT OUTPUT, @MaGiaoDich VARCHAR(100) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION PaymentCreateAttempt;
        DECLARE @UserID INT, @SuatID INT, @RoomID INT, @ShowStatus NVARCHAR(50), @Starts DATETIME2,
                @OrderStatus NVARCHAR(50), @Hold DATETIME2, @Amount DECIMAL(18,2), @Now DATETIME2=dbo.fn_BayGio();
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

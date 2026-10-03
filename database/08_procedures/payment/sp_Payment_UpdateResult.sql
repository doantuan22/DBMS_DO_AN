SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:293 (dbo.sp_Payment_UpdateResult)
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
            @PromoID INT,@Now DATETIME2=dbo.fn_BayGio();
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

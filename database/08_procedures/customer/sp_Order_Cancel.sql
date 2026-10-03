SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Order_Cancel
(
    @NguoiDungID INT,
    @DonDatVeID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TrangThai NVARCHAR(50);
        DECLARE @KhuyenMaiID INT;

        SELECT
            @TrangThai = TrangThai,
            @KhuyenMaiID = KhuyenMaiID
        FROM dbo.DONDATVE WITH (UPDLOCK, HOLDLOCK)
        WHERE DonDatVeID = @DonDatVeID AND NguoiDungID = @NguoiDungID;

        IF @TrangThai IS NULL
        BEGIN
            ;THROW 50034, N'Đơn đặt vé không tồn tại hoặc bạn không có quyền thao tác.', 1;
        END

        IF @TrangThai <> N'Chờ thanh toán'
        BEGIN
            ;THROW 50035, N'Chỉ có thể hủy đơn khi đang ở trạng thái Chờ thanh toán.', 1;
        END

        -- Cập nhật đơn thành Đã hủy
        UPDATE dbo.DONDATVE
        SET TrangThai = N'Đã hủy'
        WHERE DonDatVeID = @DonDatVeID;

        -- Cập nhật vé thành Đã hủy để giải phóng ghế
        UPDATE dbo.CHITIETVE
        SET TrangThai = N'Đã hủy'
        WHERE DonDatVeID = @DonDatVeID;

        -- Hoàn lại lượt dùng mã khuyến mãi nếu có
        IF @KhuyenMaiID IS NOT NULL
        BEGIN
            UPDATE dbo.KHUYENMAI
            SET SoLuongDaDung = CASE WHEN SoLuongDaDung > 0 THEN SoLuongDaDung - 1 ELSE 0 END
            WHERE KhuyenMaiID = @KhuyenMaiID;
        END

        COMMIT TRANSACTION;

        SELECT N'Hủy đơn đặt vé thành công.' AS [Message];

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

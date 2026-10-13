SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Alias sp_DatVe cho sp_Booking_Create theo bảng hợp đồng Use Case
CREATE OR ALTER PROCEDURE dbo.sp_DatVe
(
    @NguoiDungID INT,
    @SuatChieuID INT,
    @MaKhuyenMai VARCHAR(50) = NULL,
    @DanhSachGheId VARCHAR(MAX),
    @DanhSachDoAnJson NVARCHAR(MAX) = NULL,
    @NewDonDatVeID INT OUTPUT
)
AS
BEGIN
        SET NOCOUNT ON;
EXEC dbo.sp_Booking_Create
        @NguoiDungID = @NguoiDungID,
        @SuatChieuID = @SuatChieuID,
        @MaKhuyenMai = @MaKhuyenMai,
        @DanhSachGheId = @DanhSachGheId,
        @DanhSachDoAnJson = @DanhSachDoAnJson,
        @NewDonDatVeID = @NewDonDatVeID OUTPUT;
END;
GO

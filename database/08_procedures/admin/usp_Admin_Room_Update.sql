SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Update
    @PhongID INT, @TenPhong NVARCHAR(100), @LoaiPhong NVARCHAR(50), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RapID INT = (SELECT RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID);
    IF @RapID IS NULL THROW 50202, N'Phòng không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong AND PhongID <> @PhongID)
        THROW 50201, N'Tên phòng đã tồn tại trong rạp.', 1;
    UPDATE dbo.PHONGCHIEU SET TenPhong = @TenPhong, LoaiPhong = @LoaiPhong, TrangThai = @TrangThai WHERE PhongID = @PhongID;
    SELECT PhongID, RapID, TenPhong, LoaiPhong, TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;
END;
GO

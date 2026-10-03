SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Create
    @RapID INT, @TenPhong NVARCHAR(100), @LoaiPhong NVARCHAR(50) = N'2D'
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50200, N'Rạp không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong)
        THROW 50201, N'Tên phòng đã tồn tại trong rạp.', 1;
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai)
    VALUES (@RapID, @TenPhong, @LoaiPhong, N'Hoạt động');
    SELECT PhongID, RapID, TenPhong, LoaiPhong, TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = SCOPE_IDENTITY();
END;
GO

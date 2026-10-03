SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Create
    @PhongID INT, @HangGhe VARCHAR(10), @SoGhe INT, @LoaiGhe NVARCHAR(50) = N'Thường'
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)
        THROW 50204, N'Phòng không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @HangGhe AND SoGhe = @SoGhe)
        THROW 50205, N'Vị trí ghế đã tồn tại trong phòng.', 1;
    INSERT dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N'Hoạt động');
    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai FROM dbo.GHE WHERE GheID = SCOPE_IDENTITY();
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_ThemSuatChieu
(
    @NguoiDungID INT,
    @PhimID INT,
    @PhongID INT,
    @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D',
    @GiaVeCoBan DECIMAL(18,2)
)
AS
BEGIN
        SET NOCOUNT ON;
EXEC dbo.sp_Manager_Showtime_Create
        @NguoiDungID = @NguoiDungID,
        @PhimID = @PhimID,
        @PhongID = @PhongID,
        @ThoiGianBatDau = @ThoiGianBatDau,
        @ThoiGianKetThuc = @ThoiGianKetThuc,
        @DinhDang = @DinhDang,
        @GiaVeCoBan = @GiaVeCoBan;
END;
GO

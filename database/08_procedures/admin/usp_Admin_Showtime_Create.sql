SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/008_admin_global_portal.sql:266 (dbo.usp_Admin_Showtime_Create)
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Create
    @PhimID INT, @PhongID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D', @GiaVeCoBan DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewSuatChieuID INT;
    IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50211, N'Thời gian suất chiếu không hợp lệ.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)
        THROW 50056, N'Phòng chiếu không tồn tại.', 1;
    EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,@ThoiGianKetThuc=@ThoiGianKetThuc;
        INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    VALUES (@PhimID, @PhongID, @ThoiGianBatDau, @ThoiGianKetThuc, @DinhDang, @GiaVeCoBan, N'Mở bán');
    SET @NewSuatChieuID = SCOPE_IDENTITY();
    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @NewSuatChieuID;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_Update @GiaID INT, @PhuThu DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE GiaID = @GiaID)
        THROW 50210, N'Bảng giá không tồn tại.', 1;
    IF @PhuThu < 0 THROW 50209, N'Phụ thu không hợp lệ.', 1;
    UPDATE dbo.BANGGIA SET PhuThu = @PhuThu, TrangThai = @TrangThai WHERE GiaID = @GiaID;
    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA WHERE GiaID = @GiaID;
END;
GO

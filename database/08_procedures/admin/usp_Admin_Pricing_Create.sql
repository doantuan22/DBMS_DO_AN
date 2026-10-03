SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_Create
    @RapID INT, @LoaiGhe NVARCHAR(50), @LoaiNgay NVARCHAR(50), @DinhDang NVARCHAR(50),
    @PhuThu DECIMAL(18,2), @NgayBatDau DATE, @NgayKetThuc DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50208, N'Rạp không tồn tại.', 1;
    IF @PhuThu < 0 OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau)
        THROW 50209, N'Khoảng ngày hoặc phụ thu không hợp lệ.', 1;
    INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @DinhDang, @PhuThu, @NgayBatDau, @NgayKetThuc, N'Áp dụng');
    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA WHERE GiaID = SCOPE_IDENTITY();
END;
GO

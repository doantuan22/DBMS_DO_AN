SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Product_ListActive
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SanPhamID,
        TenSanPham,
        LoaiSanPham,
        Gia,
        MoTa,
        HinhAnh,
        TrangThai
    FROM dbo.SANPHAM
    WHERE TrangThai = N'Đang bán'
    ORDER BY LoaiSanPham, Gia;
END;
GO

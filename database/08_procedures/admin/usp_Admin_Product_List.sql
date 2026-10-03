SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Product_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    ORDER BY TenSanPham;
END;
GO

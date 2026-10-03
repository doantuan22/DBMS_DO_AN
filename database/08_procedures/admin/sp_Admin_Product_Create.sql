SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Product_Create
(
    @TenSanPham NVARCHAR(150),
    @LoaiSanPham NVARCHAR(50),
    @Gia DECIMAL(18,2),
    @MoTa NVARCHAR(255) = NULL,
    @HinhAnh NVARCHAR(500) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.SANPHAM (TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai)
    VALUES (@TenSanPham, @LoaiSanPham, @Gia, @MoTa, @HinhAnh, N'Đang bán');

    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    WHERE SanPhamID = SCOPE_IDENTITY();
END;
GO

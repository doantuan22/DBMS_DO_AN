SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Product_Update
(
    @SanPhamID INT,
    @TenSanPham NVARCHAR(150),
    @LoaiSanPham NVARCHAR(50),
    @Gia DECIMAL(18,2),
    @MoTa NVARCHAR(255),
    @HinhAnh NVARCHAR(500),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.SANPHAM
    SET TenSanPham = @TenSanPham,
        LoaiSanPham = @LoaiSanPham,
        Gia = @Gia,
        MoTa = @MoTa,
        HinhAnh = @HinhAnh,
        TrangThai = @TrangThai
    WHERE SanPhamID = @SanPhamID;

    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    WHERE SanPhamID = @SanPhamID;
END;
GO

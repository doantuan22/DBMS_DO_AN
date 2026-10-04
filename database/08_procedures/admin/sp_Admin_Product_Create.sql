SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Product_Create
(
    @ActorID INT,
    @TenSanPham NVARCHAR(150),
    @LoaiSanPham NVARCHAR(50),
    @Gia DECIMAL(18,2),
    @MoTa NVARCHAR(255) = NULL,
    @HinhAnh NVARCHAR(500) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_SANPHAM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    INSERT INTO dbo.SANPHAM (TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai)
    VALUES (@TenSanPham, @LoaiSanPham, @Gia, @MoTa, @HinhAnh, N'Đang bán');

    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    WHERE SanPhamID = SCOPE_IDENTITY();
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Product_Delete
(
    @ActorID INT,
    @SanPhamID INT
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

    IF NOT EXISTS (SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID)
    BEGIN
        ;THROW 50105, N'Sản phẩm không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.CHITIETDOAN WHERE SanPhamID = @SanPhamID)
    BEGIN
        ;THROW 50106, N'Sản phẩm đã có trong đơn hàng. Hãy chuyển trạng thái sang Ngừng bán thay vì xóa.', 1;
    END

    DELETE FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID;
    SELECT N'Đã xóa sản phẩm.' AS [Message];
END;
GO

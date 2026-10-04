SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Promotion_Delete
(
    @ActorID INT,
    @KhuyenMaiID INT
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_KHUYENMAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50107, N'Khuyến mãi không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE KhuyenMaiID = @KhuyenMaiID)
    BEGIN
        ;THROW 50108, N'Khuyến mãi đã được dùng trong đơn hàng. Hãy chuyển trạng thái sang Tạm dừng thay vì xóa.', 1;
    END

    DELETE FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @KhuyenMaiID;
    SELECT N'Đã xóa khuyến mãi.' AS [Message];
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_RolePermission_List
    @ActorID INT,
    @VaiTroID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_QUYEN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
        THROW 50214, N'Vai trò không tồn tại.', 1;
    SELECT vq.VaiTroID, q.QuyenID, q.MaQuyen, q.TenQuyen
    FROM dbo.VAITRO_QUYEN vq INNER JOIN dbo.QUYEN q ON q.QuyenID = vq.QuyenID
    WHERE vq.VaiTroID = @VaiTroID ORDER BY q.MaQuyen;
END;
GO

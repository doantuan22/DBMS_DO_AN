SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_UpdateStatus
(
    @ActorID INT,
    @NguoiDungID INT,
    @TrangThai NVARCHAR(50) -- 'Hoạt động', 'Bị khóa'
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_NGUOIDUNG') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    UPDATE dbo.NGUOIDUNG
    SET TrangThai = @TrangThai
    WHERE NguoiDungID = @NguoiDungID;

    SELECT NguoiDungID, HoTen, Email, TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID;
END;
GO

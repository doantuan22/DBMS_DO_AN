SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Genre_Update
(
    @ActorID INT,
    @TheLoaiID INT,
    @TenTheLoai NVARCHAR(100)
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_THELOAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID)
    BEGIN
        ;THROW 50098, N'Thể loại không tồn tại.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TenTheLoai = @TenTheLoai AND TheLoaiID <> @TheLoaiID)
    BEGIN
        ;THROW 50097, N'Thể loại đã tồn tại.', 1;
    END

    UPDATE dbo.THELOAI SET TenTheLoai = @TenTheLoai WHERE TheLoaiID = @TheLoaiID;
    SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;
END;
GO

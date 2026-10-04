SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Actor_Update
(
    @ActorID INT,
    @DienVienID INT,
    @HoTen NVARCHAR(150),
    @NgaySinh DATE = NULL,
    @QuocTich NVARCHAR(100) = NULL
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_DANHMUC_PHIM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50100, N'Diễn viên không tồn tại.', 1;
    END

    UPDATE dbo.DIENVIEN SET HoTen = @HoTen, NgaySinh = @NgaySinh, QuocTich = @QuocTich WHERE DienVienID = @DienVienID;
    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;
END;
GO

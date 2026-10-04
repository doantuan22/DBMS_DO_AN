SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Permission_Create
(
    @ActorID INT,
    @MaQuyen VARCHAR(50),
    @TenQuyen NVARCHAR(100),
    @MoTa NVARCHAR(255) = NULL
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_QUYEN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    IF EXISTS (SELECT 1 FROM dbo.QUYEN WHERE MaQuyen = @MaQuyen)
    BEGIN
        ;THROW 50092, N'Mã quyền đã tồn tại.', 1;
    END

    INSERT INTO dbo.QUYEN (MaQuyen, TenQuyen, MoTa) VALUES (@MaQuyen, @TenQuyen, @MoTa);
    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN WHERE QuyenID = SCOPE_IDENTITY();
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Cinema_Create
(
    @ActorID INT,
    @TenRap NVARCHAR(150),
    @DiaChi NVARCHAR(255),
    @ThanhPho NVARCHAR(100),
    @SoDienThoai VARCHAR(20) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @NgayHoatDong DATE = NULL
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    INSERT INTO dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai)
    VALUES (@TenRap, @DiaChi, @ThanhPho, @SoDienThoai, @MoTa, @NgayHoatDong, N'Hoạt động');

    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai
    FROM dbo.RAPCHIEUPHIM
    WHERE RapID = SCOPE_IDENTITY();
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:75 (dbo.sp_Admin_User_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_Create
(
    @HoTen NVARCHAR(100),
    @Email VARCHAR(150),
    @MatKhauHash VARCHAR(255),
    @SoDienThoai VARCHAR(20) = NULL,
    @VaiTroID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = @Email)
    BEGIN
        ;THROW 50070, N'Email đã tồn tại.', 1;
    END

    INSERT INTO dbo.NGUOIDUNG (VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
    VALUES (@VaiTroID, @HoTen, @Email, @MatKhauHash, @SoDienThoai, dbo.fn_BayGio(), N'Hoạt động');

    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        vt.MaVaiTro,
        vt.TenVaiTro,
        nd.TrangThai
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    WHERE nd.NguoiDungID = SCOPE_IDENTITY();
END;
GO

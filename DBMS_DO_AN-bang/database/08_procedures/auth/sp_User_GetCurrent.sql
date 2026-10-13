SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_User_GetCurrent
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        nd.NgayTao,
        nd.TrangThai,
        vt.MaVaiTro,
        vt.TenVaiTro,
        hk.NgaySinh,
        hk.GioiTinh,
        hk.DiemTichLuy
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
    WHERE nd.NguoiDungID = @NguoiDungID;
END;
GO

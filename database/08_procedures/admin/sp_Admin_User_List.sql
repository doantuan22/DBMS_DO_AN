SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_List
(
    @VaiTroID INT = NULL,
    @TrangThai NVARCHAR(50) = NULL,
    @SearchTerm NVARCHAR(100) = NULL
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
        vt.VaiTroID,
        vt.MaVaiTro,
        vt.TenVaiTro,
        hk.DiemTichLuy
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
    WHERE (@VaiTroID IS NULL OR nd.VaiTroID = @VaiTroID)
      AND (@TrangThai IS NULL OR nd.TrangThai = @TrangThai)
      AND (@SearchTerm IS NULL OR nd.HoTen LIKE '%' + @SearchTerm + '%' OR nd.Email LIKE '%' + @SearchTerm + '%' OR nd.SoDienThoai LIKE '%' + @SearchTerm + '%')
    ORDER BY nd.NgayTao DESC;
END;
GO

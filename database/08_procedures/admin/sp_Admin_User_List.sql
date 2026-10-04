SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_List
(
    @ActorID INT,
    @VaiTroID INT = NULL,
    @TrangThai NVARCHAR(50) = NULL,
    @SearchTerm NVARCHAR(100) = NULL
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

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Movie_List

    @ActorID INT,
    @TrangThai NVARCHAR(50) = NULL, @TheLoaiID INT = NULL, @SearchTerm NVARCHAR(100) = NULL
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

    SELECT DISTINCT p.PhimID, p.TenPhim, p.ThoiLuong, p.NgayKhoiChieu, p.NgayKetThuc, p.NgonNgu,
           p.PhuDe, p.DoTuoi, p.DaoDien, p.MoTa, p.PosterURL, p.TrailerURL, p.TrangThai,
           STUFF((SELECT ',' + CAST(pt.TheLoaiID AS VARCHAR(12)) FROM dbo.PHIM_THELOAI pt
                  WHERE pt.PhimID = p.PhimID ORDER BY pt.TheLoaiID FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS TheLoaiIdList,
           (SELECT pd.DienVienID AS actorId, pd.VaiDien AS [role] FROM dbo.PHIM_DIENVIEN pd
            WHERE pd.PhimID = p.PhimID ORDER BY pd.DienVienID FOR JSON PATH) AS DanhSachDienVienJson
    FROM dbo.PHIM p
    LEFT JOIN dbo.PHIM_THELOAI ptFilter ON ptFilter.PhimID = p.PhimID
    WHERE (@TrangThai IS NULL OR p.TrangThai = @TrangThai)
      AND (@TheLoaiID IS NULL OR ptFilter.TheLoaiID = @TheLoaiID)
      AND (@SearchTerm IS NULL OR p.TenPhim LIKE '%' + @SearchTerm + '%' OR p.DaoDien LIKE '%' + @SearchTerm + '%')
    ORDER BY p.NgayKhoiChieu DESC;
END;
GO

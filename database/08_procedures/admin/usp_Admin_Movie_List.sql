SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Movie_List
    @TrangThai NVARCHAR(50) = NULL, @TheLoaiID INT = NULL, @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
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

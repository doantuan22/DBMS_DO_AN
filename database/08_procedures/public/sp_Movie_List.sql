SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Movie_List
(
    @TrangThai NVARCHAR(50) = NULL,
    @TheLoaiID INT = NULL,
    @SearchTerm NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        p.PhimID,
        p.TenPhim,
        p.ThoiLuong,
        p.NgayKhoiChieu,
        p.NgayKetThuc,
        p.NgonNgu,
        p.PhuDe,
        p.DoTuoi,
        p.DaoDien,
        p.PosterURL,
        p.TrailerURL,
        p.TrangThai,
        tp.DiemDanhGiaTrungBinh,
        tp.SoLuotDanhGia,
        STUFF((
            SELECT ', ' + t.TenTheLoai
            FROM dbo.PHIM_THELOAI pt
            INNER JOIN dbo.THELOAI t ON pt.TheLoaiID = t.TheLoaiID
            WHERE pt.PhimID = p.PhimID
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS DanhSachTheLoai
    FROM dbo.PHIM p
    LEFT JOIN dbo.vw_ThongKePhim tp ON p.PhimID = tp.PhimID
    LEFT JOIN dbo.PHIM_THELOAI pt2 ON p.PhimID = pt2.PhimID
    WHERE (@TrangThai IS NULL OR p.TrangThai = @TrangThai)
      AND (@TheLoaiID IS NULL OR pt2.TheLoaiID = @TheLoaiID)
      AND (@SearchTerm IS NULL OR p.TenPhim LIKE '%' + @SearchTerm + '%' OR p.DaoDien LIKE '%' + @SearchTerm + '%')
    ORDER BY p.NgayKhoiChieu DESC;
END;
GO

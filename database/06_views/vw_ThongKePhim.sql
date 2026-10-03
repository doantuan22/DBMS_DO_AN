SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER VIEW dbo.vw_ThongKePhim
AS
SELECT
    p.PhimID,
    p.TenPhim,
    p.ThoiLuong,
    p.NgayKhoiChieu,
    p.DoTuoi,
    p.PosterURL,
    p.TrangThai,
    COUNT(dg.DanhGiaID) AS SoLuotDanhGia,
    ISNULL(ROUND(AVG(CAST(dg.SoSao AS FLOAT)), 1), 0.0) AS DiemDanhGiaTrungBinh,
    COUNT(DISTINCT sc.SuatChieuID) AS TongSoSuatChieu
FROM dbo.PHIM p
LEFT JOIN dbo.DANHGIAPHIM dg ON p.PhimID = dg.PhimID
LEFT JOIN dbo.SUATCHIEU sc ON p.PhimID = sc.PhimID
GROUP BY p.PhimID, p.TenPhim, p.ThoiLuong, p.NgayKhoiChieu, p.DoTuoi, p.PosterURL, p.TrangThai;
GO

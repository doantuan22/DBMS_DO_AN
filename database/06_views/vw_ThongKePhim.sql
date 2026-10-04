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
    ISNULL(dg.SoLuotDanhGia, 0) AS SoLuotDanhGia,
    ISNULL(dg.DiemDanhGiaTrungBinh, 0.0) AS DiemDanhGiaTrungBinh,
    ISNULL(sc.TongSoSuatChieu, 0) AS TongSoSuatChieu
FROM dbo.PHIM p
LEFT JOIN (SELECT PhimID, COUNT(*) AS SoLuotDanhGia, ROUND(AVG(CAST(SoSao AS FLOAT)), 1) AS DiemDanhGiaTrungBinh
           FROM dbo.DANHGIAPHIM GROUP BY PhimID) dg ON p.PhimID = dg.PhimID
LEFT JOIN (SELECT PhimID, COUNT(*) AS TongSoSuatChieu FROM dbo.SUATCHIEU GROUP BY PhimID) sc ON p.PhimID = sc.PhimID;
GO

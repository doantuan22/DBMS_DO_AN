SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: views/03_views.sql:18 (dbo.vw_LichChieuChiTiet)
CREATE OR ALTER VIEW dbo.vw_LichChieuChiTiet
AS
SELECT
    sc.SuatChieuID,
    p.PhimID,
    p.TenPhim,
    p.ThoiLuong,
    p.DoTuoi,
    p.PosterURL,
    p.TrailerURL,
    p.TrangThai AS TrangThaiPhim,
    p.NgayKhoiChieu,
    p.NgayKetThuc,
    r.RapID,
    r.TenRap,
    r.ThanhPho,
    r.DiaChi AS DiaChiRap,
    r.TrangThai AS TrangThaiRap,
    pc.PhongID,
    pc.TenPhong,
    pc.LoaiPhong,
    pc.TrangThai AS TrangThaiPhong,
    sc.ThoiGianBatDau,
    sc.ThoiGianKetThuc,
    dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) AS NgayChieu,
    CONVERT(varchar(5), CONVERT(time, dbo.fn_GioRap(sc.ThoiGianBatDau)), 108) AS GioBatDau,
    CONVERT(varchar(5), CONVERT(time, dbo.fn_GioRap(sc.ThoiGianKetThuc)), 108) AS GioKetThuc,
    sc.DinhDang,
    sc.GiaVeCoBan,
    sc.TrangThai AS TrangThaiSuatChieu,
    -- R2.1: one DB-owned showtime eligibility contract. Seat/conflict checks remain separate.
    CAST(CASE WHEN sc.TrangThai = N'Mở bán'
               AND sc.ThoiGianBatDau > dbo.fn_BayGio()
               AND r.TrangThai = N'Hoạt động'
               AND pc.TrangThai = N'Hoạt động'
               AND p.TrangThai <> N'Ngừng chiếu'
               AND dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= p.NgayKhoiChieu
               AND (p.NgayKetThuc IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= p.NgayKetThuc)
              THEN 1 ELSE 0 END AS BIT) AS IsBookable,
    (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID AND g.TrangThai = N'Hoạt động') AS TongSoGhe,
    (SELECT COUNT(*)
     FROM dbo.CHITIETVE cv
     INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID
     WHERE ddv.SuatChieuID = sc.SuatChieuID
       AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, dbo.fn_BayGio()) = 1
       AND cv.TrangThai <> N'Đã hủy'
    ) AS SoGheDaDat
FROM dbo.SUATCHIEU sc
INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID;
GO

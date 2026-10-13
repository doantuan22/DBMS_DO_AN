SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: views/03_views.sql:62 (dbo.vw_LichSuDatVe)
CREATE OR ALTER VIEW dbo.vw_LichSuDatVe
AS
SELECT
    ddv.DonDatVeID,
    ddv.NguoiDungID,
    nd.HoTen AS HoTenKhachHang,
    nd.Email,
    nd.SoDienThoai,
    sc.SuatChieuID,
    p.PhimID,
    p.TenPhim,
    p.PosterURL,
    r.RapID,
    r.TenRap,
    pc.TenPhong,
    sc.ThoiGianBatDau,
    sc.ThoiGianKetThuc,
    sc.DinhDang,
    ddv.NgayDat,
    ddv.TongTienVe,
    ddv.TongTienDoAn,
    ddv.TienGiamGia,
    (ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TongTienThanhToan,
    CASE WHEN ddv.TrangThai = N'Chờ thanh toán' AND ddv.HanGiuCho <= dbo.fn_BayGio() THEN N'Hết hạn' ELSE ddv.TrangThai END AS TrangThaiDon,
    ddv.HanGiuCho,
    km.MaCode AS MaKhuyenMai,
    (SELECT COUNT(*) FROM dbo.CHITIETVE cv WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy') AS SoLuongVe,
    (SELECT TOP 1 tt.TrangThai
     FROM dbo.THANHTOAN tt
     WHERE tt.DonDatVeID = ddv.DonDatVeID
     ORDER BY tt.ThanhToanID DESC) AS TrangThaiThanhToanMoiNhat
FROM dbo.DONDATVE ddv
INNER JOIN dbo.NGUOIDUNG nd ON ddv.NguoiDungID = nd.NguoiDungID
INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
LEFT JOIN dbo.KHUYENMAI km ON ddv.KhuyenMaiID = km.KhuyenMaiID;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: views/03_views.sql:106 (dbo.vw_ChiTietDonDatVe)
CREATE OR ALTER VIEW dbo.vw_ChiTietDonDatVe
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
    p.DoTuoi,
    p.ThoiLuong,
    r.RapID,
    r.TenRap,
    r.DiaChi AS DiaChiRap,
    pc.PhongID,
    pc.TenPhong,
    pc.LoaiPhong,
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
    km.MoTa AS MoTaKhuyenMai,
    -- Danh sách ghế dạng chuỗi (A1, A2...)
    STUFF((
        SELECT ', ' + (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)))
        FROM dbo.CHITIETVE cv2
        INNER JOIN dbo.GHE g ON cv2.GheID = g.GheID
        WHERE cv2.DonDatVeID = ddv.DonDatVeID AND cv2.TrangThai <> N'Đã hủy'
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS DanhSachGhe,
    -- Danh sách mã vé dạng chuỗi
    STUFF((
        SELECT ', ' + cv3.MaVe
        FROM dbo.CHITIETVE cv3
        WHERE cv3.DonDatVeID = ddv.DonDatVeID AND cv3.TrangThai <> N'Đã hủy'
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS DanhSachMaVe
FROM dbo.DONDATVE ddv
INNER JOIN dbo.NGUOIDUNG nd ON ddv.NguoiDungID = nd.NguoiDungID
INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
LEFT JOIN dbo.KHUYENMAI km ON ddv.KhuyenMaiID = km.KhuyenMaiID;
GO

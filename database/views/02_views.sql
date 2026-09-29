-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- SCRIPT 02: TẠO CÁC VIEW (VIEWS)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. View: vw_LichChieuChiTiet (Phục vụ hiển thị lịch chiếu phía Khách hàng & Rạp)
IF OBJECT_ID(N'dbo.vw_LichChieuChiTiet', N'V') IS NOT NULL DROP VIEW dbo.vw_LichChieuChiTiet;
GO

CREATE VIEW dbo.vw_LichChieuChiTiet
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
    r.RapID,
    r.TenRap,
    r.ThanhPho,
    r.DiaChi AS DiaChiRap,
    pc.PhongID,
    pc.TenPhong,
    pc.LoaiPhong,
    sc.ThoiGianBatDau,
    sc.ThoiGianKetThuc,
    CAST(sc.ThoiGianBatDau AS DATE) AS NgayChieu,
    FORMAT(sc.ThoiGianBatDau, 'HH:mm') AS GioBatDau,
    FORMAT(sc.ThoiGianKetThuc, 'HH:mm') AS GioKetThuc,
    sc.DinhDang,
    sc.GiaVeCoBan,
    sc.TrangThai AS TrangThaiSuatChieu,
    (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID AND g.TrangThai = N'Hoạt động') AS TongSoGhe,
    (SELECT COUNT(*)
     FROM dbo.CHITIETVE cv
     INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID
     WHERE ddv.SuatChieuID = sc.SuatChieuID
       AND ddv.TrangThai NOT IN (N'Đã hủy', N'Hết hạn')
       AND cv.TrangThai NOT IN (N'Đã hủy')
    ) AS SoGheDaDat
FROM dbo.SUATCHIEU sc
INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID;
GO

-- 2. View: vw_LichSuDatVe (Phục vụ tra cứu lịch sử đặt vé của khách hàng)
IF OBJECT_ID(N'dbo.vw_LichSuDatVe', N'V') IS NOT NULL DROP VIEW dbo.vw_LichSuDatVe;
GO

CREATE VIEW dbo.vw_LichSuDatVe
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
    ddv.TrangThai AS TrangThaiDon,
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

-- 3. View: vw_ChiTietDonDatVe (Tổng hợp thông tin chi tiết đầy đủ của đơn đặt vé)
IF OBJECT_ID(N'dbo.vw_ChiTietDonDatVe', N'V') IS NOT NULL DROP VIEW dbo.vw_ChiTietDonDatVe;
GO

CREATE VIEW dbo.vw_ChiTietDonDatVe
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
    ddv.TrangThai AS TrangThaiDon,
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

-- 4. View: vw_DoanhThuTheoRap (Phục vụ báo cáo doanh thu quản lý và Admin)
IF OBJECT_ID(N'dbo.vw_DoanhThuTheoRap', N'V') IS NOT NULL DROP VIEW dbo.vw_DoanhThuTheoRap;
GO

CREATE VIEW dbo.vw_DoanhThuTheoRap
AS
-- Doanh thu tính từ THANHTOAN có TrangThai = 'Thành công' (không dựa vào trạng thái đơn).
-- Giao dịch 'Thất bại' / 'Đang xử lý' / 'Đã hoàn tiền' không được tính.
WITH DonDaThu AS (
    SELECT
        ddv.DonDatVeID,
        pc.RapID,
        ddv.TongTienVe,
        ddv.TongTienDoAn,
        ddv.TienGiamGia,
        SUM(tt.SoTien) AS TienDaThu,
        (SELECT COUNT(*) FROM dbo.CHITIETVE cv
         WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy') AS SoVeCuaDon
    FROM dbo.DONDATVE ddv
    INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N'Thành công'
    GROUP BY ddv.DonDatVeID, pc.RapID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia
),
SuatChieuTheoRap AS (
    SELECT
        pc.RapID,
        COUNT(DISTINCT sc.SuatChieuID) AS TongSoSuatChieu
    FROM dbo.PHONGCHIEU pc
    LEFT JOIN dbo.SUATCHIEU sc ON pc.PhongID = sc.PhongID
    GROUP BY pc.RapID
)
SELECT
    r.RapID,
    r.TenRap,
    r.ThanhPho,
    COUNT(dh.DonDatVeID) AS TongSoDon,
    ISNULL(sc_rap.TongSoSuatChieu, 0) AS TongSoSuatChieu,
    ISNULL(SUM(dh.SoVeCuaDon), 0) AS TongSoVeBan,
    ISNULL(SUM(dh.TongTienVe), 0) AS DoanhThuVe,
    ISNULL(SUM(dh.TongTienDoAn), 0) AS DoanhThuDoAn,
    ISNULL(SUM(dh.TienGiamGia), 0) AS TongTienGiam,
    ISNULL(SUM(dh.TienDaThu), 0) AS DoanhThuThucTe
FROM dbo.RAPCHIEUPHIM r
LEFT JOIN DonDaThu dh ON r.RapID = dh.RapID
LEFT JOIN SuatChieuTheoRap sc_rap ON r.RapID = sc_rap.RapID
GROUP BY r.RapID, r.TenRap, r.ThanhPho, sc_rap.TongSoSuatChieu;
GO

-- 5. View: vw_DanhSachKhieuNai (Phục vụ CSKH và Admin tra cứu xử lý khiếu nại)
IF OBJECT_ID(N'dbo.vw_DanhSachKhieuNai', N'V') IS NOT NULL DROP VIEW dbo.vw_DanhSachKhieuNai;
GO

CREATE VIEW dbo.vw_DanhSachKhieuNai
AS
SELECT
    kn.KhieuNaiID,
    kn.NguoiDungID AS NguoiGuiID,
    nd.HoTen AS HoTenNguoiGui,
    nd.Email AS EmailNguoiGui,
    nd.SoDienThoai AS SoDienThoaiNguoiGui,
    kn.DonDatVeID,
    kn.LoaiKhieuNai,
    kn.TieuDe,
    kn.NoiDung,
    kn.MucDoUuTien,
    kn.NgayTao,
    kn.TrangThai AS TrangThaiKhieuNai,
    (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI xl WHERE xl.KhieuNaiID = kn.KhieuNaiID) AS SoLanXuLy,
    (SELECT TOP 1 xl.NgayXuLy
     FROM dbo.XULY_KHIEUNAI xl
     WHERE xl.KhieuNaiID = kn.KhieuNaiID
     ORDER BY xl.XuLyID DESC) AS NgayXuLyCuoi,
    (SELECT TOP 1 nd_xl.HoTen
     FROM dbo.XULY_KHIEUNAI xl
     INNER JOIN dbo.NGUOIDUNG nd_xl ON xl.NguoiXuLyID = nd_xl.NguoiDungID
     WHERE xl.KhieuNaiID = kn.KhieuNaiID
     ORDER BY xl.XuLyID DESC) AS NguoiXuLyCuoi,
    (SELECT TOP 1 xl.NoiDungXuLy
     FROM dbo.XULY_KHIEUNAI xl
     WHERE xl.KhieuNaiID = kn.KhieuNaiID
     ORDER BY xl.XuLyID DESC) AS NoiDungXuLyCuoi
FROM dbo.KHIEUNAI kn
INNER JOIN dbo.NGUOIDUNG nd ON kn.NguoiDungID = nd.NguoiDungID;
GO

-- 6. View bổ trợ: vw_ThongKePhim (Phục vụ xếp hạng, đánh giá phim)
IF OBJECT_ID(N'dbo.vw_ThongKePhim', N'V') IS NOT NULL DROP VIEW dbo.vw_ThongKePhim;
GO

CREATE VIEW dbo.vw_ThongKePhim
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

PRINT N'>>> [02_views.sql] Đã tạo 6 View nghiệp vụ thành công.';
GO

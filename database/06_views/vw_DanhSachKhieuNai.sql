SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER VIEW dbo.vw_DanhSachKhieuNai
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

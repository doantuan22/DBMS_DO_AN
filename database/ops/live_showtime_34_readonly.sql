-- Read-only evidence for the live rows identified by the audit. This file only SELECTs.
USE CinemaBookingDB;
GO
SET NOCOUNT ON;

SELECT d.DonDatVeID,d.NguoiDungID,nd.HoTen,nd.Email,d.SuatChieuID,s.TrangThai AS TrangThaiSuat,
       d.TrangThai AS TrangThaiDon,d.NgayDat,d.KhuyenMaiID,
       d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,d.TongTienVe+d.TongTienDoAn-d.TienGiamGia AS TongThanhToan
FROM dbo.DONDATVE d
JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID=d.NguoiDungID
JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
WHERE d.DonDatVeID IN (26,27,28) AND d.SuatChieuID=34
ORDER BY d.DonDatVeID;

SELECT d.DonDatVeID,cv.VeID,cv.MaVe,cv.GheID,
       g.HangGhe+CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe,cv.GiaVe,cv.TrangThai AS TrangThaiVe
FROM dbo.DONDATVE d
JOIN dbo.CHITIETVE cv ON cv.DonDatVeID=d.DonDatVeID
JOIN dbo.GHE g ON g.GheID=cv.GheID
WHERE d.DonDatVeID IN (26,27,28) AND d.SuatChieuID=34
ORDER BY d.DonDatVeID,cv.VeID;

SELECT d.DonDatVeID,t.ThanhToanID,t.PhuongThuc,t.SoTien,t.NgayTao,t.NgayThanhToan,t.MaGiaoDich,t.TrangThai,t.GhiChu
FROM dbo.DONDATVE d
JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID
WHERE d.DonDatVeID IN (26,27,28) AND d.SuatChieuID=34
ORDER BY d.DonDatVeID,t.ThanhToanID;

SELECT d.DonDatVeID,d.KhuyenMaiID,km.MaCode,km.SoLuongDaDung
FROM dbo.DONDATVE d LEFT JOIN dbo.KHUYENMAI km ON km.KhuyenMaiID=d.KhuyenMaiID
WHERE d.DonDatVeID IN (26,27,28) AND d.SuatChieuID=34
ORDER BY d.DonDatVeID;

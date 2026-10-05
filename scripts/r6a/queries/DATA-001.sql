-- Negative order totals and the original ID20: no values are corrected.
SELECT d.DonDatVeID,d.NguoiDungID,d.SuatChieuID,d.KhuyenMaiID,d.TrangThai,
       d.NgayDat,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,
       d.TongTienVe+d.TongTienDoAn-d.TienGiamGia AS TongDon,
       (SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID) AS ticketSnapshotSum,
       (SELECT SUM(a.SoLuong*a.DonGia) FROM dbo.CHITIETDOAN a WHERE a.DonDatVeID=d.DonDatVeID) AS foodSnapshotSum,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công') AS successfulPayments
FROM dbo.DONDATVE d
WHERE d.DonDatVeID=20 OR d.TongTienVe+d.TongTienDoAn-d.TienGiamGia<0
ORDER BY d.DonDatVeID;

SELECT t.ThanhToanID,t.DonDatVeID,t.PhuongThuc,t.SoTien,t.TrangThai,t.NgayTao,t.NgayThanhToan
FROM dbo.THANHTOAN t
WHERE t.DonDatVeID=20 OR t.SoTien<0 OR EXISTS
 (SELECT 1 FROM dbo.DONDATVE d WHERE d.DonDatVeID=t.DonDatVeID AND d.TongTienVe+d.TongTienDoAn-d.TienGiamGia<0)
ORDER BY t.ThanhToanID;

SELECT v.VeID,v.DonDatVeID,v.GheID,v.GiaVe,v.TrangThai
FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID
WHERE d.DonDatVeID=20 OR d.TongTienVe+d.TongTienDoAn-d.TienGiamGia<0;

SELECT a.DonDatVeID,a.SanPhamID,a.SoLuong,a.DonGia
FROM dbo.CHITIETDOAN a JOIN dbo.DONDATVE d ON d.DonDatVeID=a.DonDatVeID
WHERE d.DonDatVeID=20 OR d.TongTienVe+d.TongTienDoAn-d.TienGiamGia<0;

SELECT k.KhuyenMaiID,k.LoaiGiamGia,k.GiaTriGiam,k.DonHangToiThieu,k.GiamToiDa,k.NgayBatDau,k.NgayKetThuc,k.SoLuongDaDung
FROM dbo.KHUYENMAI k WHERE EXISTS
 (SELECT 1 FROM dbo.DONDATVE d WHERE d.KhuyenMaiID=k.KhuyenMaiID AND (d.DonDatVeID=20 OR d.TongTienVe+d.TongTienDoAn-d.TienGiamGia<0));

SELECT ids.DonDatVeID,CASE WHEN d.DonDatVeID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalRecordState
FROM (VALUES(20)) ids(DonDatVeID) LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID=ids.DonDatVeID;

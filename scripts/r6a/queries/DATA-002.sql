-- All cancelled shows with paid orders/successful payments, including R2-cancelled order states.
SELECT d.DonDatVeID,d.NguoiDungID,d.SuatChieuID,d.TrangThai AS orderStatus,s.TrangThai AS showtimeStatus,
       d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,d.TongTienVe+d.TongTienDoAn-d.TienGiamGia AS TongDon,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công') AS successfulPayments,
       (SELECT SUM(t.SoTien) FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công') AS successfulPaymentSum,
       b.BoiThuongID,b.DiemBoiThuong,b.NgayBoiThuong,c.DiemCong AS pointsFromCurrentOrderSnapshots,
       h.DiemTichLuy AS currentProfileBalance,
       (SELECT SUM(CONVERT(bigint,b2.DiemBoiThuong)) FROM dbo.BOITHUONG_HUYSUAT b2 JOIN dbo.DONDATVE d2 ON d2.DonDatVeID=b2.DonDatVeID WHERE d2.NguoiDungID=d.NguoiDungID) AS recordedCompensationPoints
FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID=d.DonDatVeID
LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=d.NguoiDungID
OUTER APPLY dbo.fn_TinhBoiThuongVe(d.TongTienVe,d.TongTienDoAn,d.TienGiamGia) c
WHERE d.DonDatVeID IN(26,27,28) OR (s.TrangThai=N'Đã hủy' AND
 (d.TrangThai IN(N'Đã thanh toán',N'Hoàn thành') OR EXISTS(SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công')))
ORDER BY d.DonDatVeID;

SELECT ids.DonDatVeID,CASE WHEN d.DonDatVeID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalRecordState,
       d.SuatChieuID,d.NguoiDungID,d.TrangThai
FROM (VALUES(26),(27),(28)) ids(DonDatVeID) LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID=ids.DonDatVeID;

SELECT t.ThanhToanID,t.DonDatVeID,t.SoTien,t.TrangThai,t.NgayTao,t.NgayThanhToan
FROM dbo.THANHTOAN t LEFT JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID
LEFT JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
WHERE t.DonDatVeID IN(26,27,28) OR s.TrangThai=N'Đã hủy';

SELECT b.BoiThuongID,b.DonDatVeID,b.DiemBoiThuong,b.NgayBoiThuong FROM dbo.BOITHUONG_HUYSUAT b;

SELECT ids.SuatChieuID,CASE WHEN s.SuatChieuID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalRecordState,s.TrangThai
FROM (VALUES(34)) ids(SuatChieuID) LEFT JOIN dbo.SUATCHIEU s ON s.SuatChieuID=ids.SuatChieuID;

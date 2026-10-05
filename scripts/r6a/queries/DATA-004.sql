SELECT s.SuatChieuID,s.PhimID,s.PhongID,s.TrangThai,s.ThoiGianBatDau,s.ThoiGianKetThuc,
       CONVERT(varchar(10),dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau),23) AS showBusinessDate,
       CONVERT(varchar(10),p.NgayKhoiChieu,23) AS releaseDate,CONVERT(varchar(10),p.NgayKetThuc,23) AS endDate,
       CASE WHEN s.ThoiGianKetThuc<=@AuditNow THEN 'PAST' WHEN s.ThoiGianBatDau<=@AuditNow THEN 'CURRENT' ELSE 'FUTURE' END AS timeClass,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID) AS bookingCount,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=s.SuatChieuID AND t.TrangThai=N'Thành công') AS successfulPayments
FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID
WHERE dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau)<p.NgayKhoiChieu
   OR (p.NgayKetThuc IS NOT NULL AND dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau)>p.NgayKetThuc)
ORDER BY s.SuatChieuID;

SELECT ids.SuatChieuID,CASE WHEN s.SuatChieuID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalRecordState
FROM (VALUES(6),(7),(8),(43)) ids(SuatChieuID) LEFT JOIN dbo.SUATCHIEU s ON s.SuatChieuID=ids.SuatChieuID;

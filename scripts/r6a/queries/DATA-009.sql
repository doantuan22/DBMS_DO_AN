SELECT s.SuatChieuID,s.PhimID,s.PhongID,s.TrangThai,s.ThoiGianBatDau,s.ThoiGianKetThuc,
       CASE WHEN s.ThoiGianKetThuc<=@AuditNow THEN 'PAST' WHEN s.ThoiGianBatDau<=@AuditNow THEN 'CURRENT' ELSE 'FUTURE' END AS timeClass,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID) AS bookingCount,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID AND d.NgayDat>s.ThoiGianBatDau) AS bookingsCreatedAfterStart,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=s.SuatChieuID AND t.TrangThai=N'Thành công') AS successfulPayments,
       CASE WHEN s.TrangThai=N'Mở bán' AND s.ThoiGianBatDau>@AuditNow THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS passesCurrentBookingTimeGuard
FROM dbo.SUATCHIEU s WHERE s.TrangThai=N'Mở bán' AND s.ThoiGianKetThuc<=@AuditNow ORDER BY s.SuatChieuID;

SELECT d.DonDatVeID,d.NguoiDungID,d.SuatChieuID,d.TrangThai,d.NgayDat,s.ThoiGianBatDau,s.ThoiGianKetThuc
FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
WHERE d.NgayDat>s.ThoiGianBatDau ORDER BY d.DonDatVeID;

SELECT s.SuatChieuID,s.PhimID,s.TrangThai,s.ThoiGianBatDau,s.ThoiGianKetThuc
FROM dbo.SUATCHIEU s WHERE s.TrangThai=N'Mở bán' AND s.ThoiGianBatDau<=@AuditNow AND s.ThoiGianKetThuc>@AuditNow;

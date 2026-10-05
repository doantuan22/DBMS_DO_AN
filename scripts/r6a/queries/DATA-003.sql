SELECT s.SuatChieuID,s.PhimID,s.PhongID,s.TrangThai,s.ThoiGianBatDau,s.ThoiGianKetThuc,p.ThoiLuong,
       DATEDIFF_BIG(SECOND,s.ThoiGianBatDau,s.ThoiGianKetThuc)
        +(CONVERT(decimal(20,7),DATEPART(NANOSECOND,s.ThoiGianKetThuc))-DATEPART(NANOSECOND,s.ThoiGianBatDau))/1000000000 AS actualDurationSeconds,
       CASE WHEN s.ThoiGianKetThuc<=@AuditNow THEN 'PAST' WHEN s.ThoiGianBatDau<=@AuditNow THEN 'CURRENT' ELSE 'FUTURE' END AS timeClass,
       DATEADD(MINUTE,p.ThoiLuong,s.ThoiGianBatDau) AS hypotheticalEndUsingCurrentMovieDuration,
       (SELECT COUNT(*) FROM dbo.SUATCHIEU other WHERE other.PhongID=s.PhongID AND other.SuatChieuID<>s.SuatChieuID
          AND other.TrangThai<>N'Đã hủy' AND other.ThoiGianBatDau<DATEADD(MINUTE,p.ThoiLuong,s.ThoiGianBatDau) AND other.ThoiGianKetThuc>s.ThoiGianBatDau) AS overlapsIfExtended,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID) AS bookingCount,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=s.SuatChieuID AND t.TrangThai=N'Thành công') AS successfulPayments
FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID
WHERE s.ThoiGianKetThuc<DATEADD(MINUTE,p.ThoiLuong,s.ThoiGianBatDau)
ORDER BY s.SuatChieuID;

SELECT ids.SuatChieuID,CASE WHEN s.SuatChieuID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalRecordState
FROM (VALUES(6),(7),(8),(28),(33),(34),(35),(36),(39),(40),(41),(43),(44),(45),(48)) ids(SuatChieuID)
LEFT JOIN dbo.SUATCHIEU s ON s.SuatChieuID=ids.SuatChieuID;

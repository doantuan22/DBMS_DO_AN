SELECT u.NguoiDungID,u.VaiTroID,v.MaVaiTro,u.TrangThai,u.NgayTao,
       CASE WHEN h.NguoiDungID IS NULL THEN CAST(0 AS bit) ELSE CAST(1 AS bit) END AS hasProfile,
       h.DiemTichLuy,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.NguoiDungID=u.NguoiDungID) AS bookingCount,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.NguoiDungID=u.NguoiDungID) AS paymentCount,
       (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.NguoiDungID=u.NguoiDungID) AS compensationCount,
       (SELECT COUNT(*) FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=u.NguoiDungID) AS reviewCount,
       (SELECT COUNT(*) FROM dbo.KHIEUNAI k WHERE k.NguoiDungID=u.NguoiDungID) AS complaintCount
FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID
LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID
WHERE v.MaVaiTro='KHACH_HANG' ORDER BY u.NguoiDungID;

SELECT ids.NguoiDungID,CASE WHEN u.NguoiDungID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalAccountState,
       CASE WHEN h.NguoiDungID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalProfileState
FROM (VALUES(21),(34)) ids(NguoiDungID) LEFT JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=ids.NguoiDungID
LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=ids.NguoiDungID;

SELECT h.NguoiDungID,v.MaVaiTro FROM dbo.HOSOKHACHHANG h
LEFT JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=h.NguoiDungID
LEFT JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE u.NguoiDungID IS NULL OR v.MaVaiTro<>'KHACH_HANG';

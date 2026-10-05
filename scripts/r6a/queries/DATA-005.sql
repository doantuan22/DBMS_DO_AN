SELECT h.NguoiDungID,CONVERT(varchar(10),h.NgaySinh,23) AS futureDOB,u.VaiTroID,u.TrangThai,
       (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.NguoiDungID=h.NguoiDungID) AS bookingCount,
       (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.NguoiDungID=h.NguoiDungID) AS paymentCount
FROM dbo.HOSOKHACHHANG h JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=h.NguoiDungID
WHERE h.NgaySinh>@BusinessDate ORDER BY h.NguoiDungID;

SELECT ids.NguoiDungID,CASE WHEN u.NguoiDungID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalAccountState,
       CASE WHEN h.NguoiDungID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalProfileState,
       CASE WHEN h.NgaySinh>@BusinessDate THEN CONVERT(varchar(10),h.NgaySinh,23) ELSE NULL END AS futureDOB
FROM (VALUES(17),(26)) ids(NguoiDungID) LEFT JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=ids.NguoiDungID
LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=ids.NguoiDungID;

SELECT t.name AS tableName,c.name AS columnName,c.is_nullable FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id
WHERE t.name='HOSOKHACHHANG' AND c.name='NgaySinh';

SELECT NguoiDungID,RapID,CONVERT(varchar(10),NgayBatDau,23) AS startsOn,
       CONVERT(varchar(10),NgayKetThuc,23) AS endsOn,TrangThai,COUNT(*) AS duplicateRows,
       STRING_AGG(CONVERT(varchar(max),PhanCongID),',') AS assignmentIDs
FROM dbo.PHANCONG_RAP GROUP BY NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai HAVING COUNT(*)>1;

SELECT p.PhanCongID,p.NguoiDungID,p.RapID,CONVERT(varchar(10),p.NgayBatDau,23) AS startsOn,
       CONVERT(varchar(10),p.NgayKetThuc,23) AS endsOn,p.TrangThai,
       CASE WHEN p.TrangThai=N'Hiệu lực' AND p.NgayBatDau<=@BusinessDate AND (p.NgayKetThuc IS NULL OR p.NgayKetThuc>=@BusinessDate) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS currentScopeActive
FROM dbo.PHANCONG_RAP p ORDER BY p.PhanCongID;

-- Overlap is reported separately; it is not equivalent to the exact R5 identity.
SELECT a.PhanCongID AS assignmentA,b.PhanCongID AS assignmentB,a.NguoiDungID,a.RapID,a.TrangThai AS statusA,b.TrangThai AS statusB
FROM dbo.PHANCONG_RAP a JOIN dbo.PHANCONG_RAP b ON a.PhanCongID<b.PhanCongID AND a.NguoiDungID=b.NguoiDungID AND a.RapID=b.RapID
WHERE a.NgayBatDau<=ISNULL(b.NgayKetThuc,CONVERT(date,'9999-12-31')) AND b.NgayBatDau<=ISNULL(a.NgayKetThuc,CONVERT(date,'9999-12-31'));

SELECT ids.PhanCongID,CASE WHEN p.PhanCongID IS NULL THEN 'ABSENT' ELSE 'PRESENT' END AS originalRecordState
FROM (VALUES(13),(14)) ids(PhanCongID) LEFT JOIN dbo.PHANCONG_RAP p ON p.PhanCongID=ids.PhanCongID;

SELECT p.PhanCongID,p.NguoiDungID,p.RapID,p.TrangThai FROM dbo.PHANCONG_RAP p
WHERE p.NguoiDungID=3 AND p.RapID=3 AND p.TrangThai=N'Đã hủy';

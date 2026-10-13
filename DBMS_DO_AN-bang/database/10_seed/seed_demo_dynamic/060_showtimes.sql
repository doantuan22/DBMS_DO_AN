IF @DynamicNew=1 BEGIN
DECLARE @Rooms TABLE(N int PRIMARY KEY,PhongID int,Format nvarchar(50));
INSERT @Rooms SELECT ROW_NUMBER() OVER(ORDER BY r.TenRap,p.TenPhong),p.PhongID,p.LoaiPhong FROM dbo.PHONGCHIEU p JOIN dbo.RAPCHIEUPHIM r ON r.RapID=p.RapID;
DECLARE @Films TABLE(N int PRIMARY KEY,PhimID int,Runtime int);
INSERT @Films SELECT ROW_NUMBER() OVER(ORDER BY TenPhim),PhimID,ThoiLuong FROM dbo.PHIM WHERE TrangThai=N'Đang chiếu';
DECLARE @Plan TABLE(PhongID int,PhimID int,Starts datetime2,Runtime int,Format nvarchar(50),Status nvarchar(50));
INSERT @Plan SELECT r.PhongID,f.PhimID,dbo.fn_UtcTuGioRap(DATEADD(HOUR,18,CONVERT(datetime2,DATEADD(DAY,d.N,@Day)))),f.Runtime,r.Format,N'Mở bán'
FROM @Rooms r CROSS JOIN (VALUES(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12)) d(N)
JOIN @Films f ON f.N=((r.N+d.N-2)%12)+1;
INSERT @Plan SELECT r.PhongID,f.PhimID,dbo.fn_UtcTuGioRap(DATEADD(HOUR,23,CONVERT(datetime2,@Day))),f.Runtime,r.Format,N'Mở bán'
FROM @Rooms r JOIN @Films f ON f.N=r.N WHERE r.N<=4 AND dbo.fn_UtcTuGioRap(DATEADD(HOUR,23,CONVERT(datetime2,@Day)))>DATEADD(MINUTE,15,@Now);
INSERT @Plan SELECT r.PhongID,f.PhimID,dbo.fn_UtcTuGioRap(DATEADD(HOUR,12,CONVERT(datetime2,DATEADD(DAY,-3-(f.N-1)/8,@Day)))),f.Runtime,r.Format,N'Hoàn thành'
FROM @Films f JOIN @Rooms r ON r.N=((f.N-1)%8)+1;
IF EXISTS(SELECT 1 FROM @Plan a JOIN dbo.PHIM p ON p.PhimID=a.PhimID WHERE dbo.fn_NgayKinhDoanh(a.Starts)<p.NgayKhoiChieu OR dbo.fn_NgayKinhDoanh(a.Starts)>p.NgayKetThuc)
 THROW 51101,'Show plan is outside movie release window.',1;
IF EXISTS(SELECT 1 FROM @Plan a JOIN @Plan b ON a.PhongID=b.PhongID AND a.Starts<b.Starts AND DATEADD(MINUTE,a.Runtime+30,a.Starts)>b.Starts)
 THROW 51101,'Show plan overlap including buffer.',1;
INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
SELECT PhimID,PhongID,Starts,DATEADD(MINUTE,Runtime,Starts),Format,CASE Format WHEN N'3D' THEN 95000 ELSE 75000 END,Status FROM @Plan;
IF (SELECT COUNT(*) FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1)<96 THROW 51101,'Future shows not bookable.',1;
END;
IF SESSION_CONTEXT(N'SeedV2Profile')=N'demo-dynamic'
 AND NOT EXISTS(SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1 AND ThoiGianBatDau>DATEADD(DAY,7,dbo.fn_BayGio()))
 THROW 51101,'Demo calendar is stale. Use guarded reset on proven disposable data or create a new explicit target; never overwrite ticket history.',1;

SET NOCOUNT ON;
DECLARE @Expected datetime2(7)='2026-10-03T12:30:00', @NearMidnight datetime2(7)='2026-10-02T17:30:00';
IF ABS(DATEDIFF_BIG(MILLISECOND,SYSUTCDATETIME(),dbo.fn_BayGio()))>1000
 THROW 51020, 'SQL authoritative now must be UTC.', 1;
IF dbo.fn_UtcTuGioRap('2026-10-03T19:30:00')<>@Expected
 THROW 51020, 'Local showtime conversion failed.', 1;
IF CONVERT(datetime2(7),dbo.fn_GioRap(@Expected))<>CONVERT(datetime2(7),'2026-10-03T19:30:00')
 THROW 51020, 'Showtime display conversion failed.', 1;
IF dbo.fn_NgayKinhDoanh(@NearMidnight)<>CONVERT(date,'2026-10-03')
 THROW 51020, 'Midnight local-day semantics failed.', 1;
IF dbo.fn_NgayKinhDoanh('2026-10-02T16:59:59')<>CONVERT(date,'2026-10-02')
 OR dbo.fn_NgayKinhDoanh('2026-10-02T17:00:00')<>CONVERT(date,'2026-10-03')
 OR dbo.fn_NgayKinhDoanh('2026-10-03T16:59:59')<>CONVERT(date,'2026-10-03')
 OR dbo.fn_NgayKinhDoanh('2026-10-03T17:00:00')<>CONVERT(date,'2026-10-04')
 THROW 51020, 'Report local-day boundary failed.', 1;
DECLARE @Expiry datetime2='2026-10-03T12:35:00';
IF dbo.fn_DonDangGiuGhe(N'Chờ thanh toán',@Expiry,DATEADD(SECOND,-1,@Expiry))<>1
 OR dbo.fn_DonDangGiuGhe(N'Chờ thanh toán',@Expiry,@Expiry)<>0
 OR dbo.fn_DonDangGiuGhe(N'Chờ thanh toán',@Expiry,DATEADD(SECOND,1,@Expiry))<>0
 THROW 51020, 'Existing strict hold boundary must remain unchanged.', 1;
IF dbo.fn_ThoiGianGiuChoPhut()<>5 THROW 51020, 'Existing five-minute duration changed.', 1;
PRINT 'PASS UTC clock/local input/midnight/report day/expiry boundary/duration';
GO

-- Read-only stored procedure demo for the configured primary database.
-- All captures use table variables / #temp objects. No persistent data is written.
USE [CinemaBookingDB];
SET NOCOUNT ON;

IF DB_NAME() <> N'CinemaBookingDB'
    THROW 52100, N'Wrong database. Connect to CinemaBookingDB before running this demo.', 1;

DECLARE @Target TABLE (ServerName sysname, DatabaseName sysname, StateDesc nvarchar(60));
INSERT @Target SELECT @@SERVERNAME, DB_NAME(), CONVERT(nvarchar(60), DATABASEPROPERTYEX(DB_NAME(), 'Status'));
SELECT * FROM @Target;

DECLARE @Results TABLE (
    TestName nvarchar(160) NOT NULL,
    InputValue nvarchar(300) NULL,
    ExpectedValue nvarchar(300) NOT NULL,
    ActualValue nvarchar(300) NULL,
    Verdict varchar(10) NOT NULL
);
DECLARE @AdminID int, @ManagerID int, @ManagerCinemaID int, @MovieID int, @ShowtimeID int, @CinemaID int;
SELECT TOP (1) @AdminID=u.NguoiDungID
FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
WHERE r.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID;
SELECT TOP (1) @ManagerID=p.NguoiDungID,@ManagerCinemaID=p.RapID
FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID
JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
WHERE r.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động' AND p.TrangThai=N'Hiệu lực'
  AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc)
ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC;
SELECT TOP (1) @MovieID=v.PhimID,@ShowtimeID=v.SuatChieuID,@CinemaID=v.RapID
FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID;

-- sp_System_HealthCheck
DECLARE @Health TABLE ([Status] varchar(20), ServerTime datetime2(7), DatabaseName sysname, SQLVersion nvarchar(max));
INSERT @Health EXEC dbo.sp_System_HealthCheck;
DECLARE @HealthActual nvarchar(200)=(SELECT CONCAT([Status],N' / ',DatabaseName,N' / rows=',COUNT(*)) FROM @Health GROUP BY [Status],DatabaseName);
INSERT @Results VALUES(N'sp_System_HealthCheck',N'no parameters',N'Healthy / CinemaBookingDB / one row',@HealthActual,
    IIF((SELECT COUNT(*) FROM @Health)=1 AND EXISTS(SELECT 1 FROM @Health WHERE [Status]='Healthy' AND DatabaseName=DB_NAME()),'PASS','FAIL'));

-- sp_Clock_GetNow: compare its movie runtime to the source row and verify clock recency.
DECLARE @Clock TABLE (BayGio datetime2(7), ThoiLuong int);
INSERT @Clock EXEC dbo.sp_Clock_GetNow @PhimID=@MovieID;
DECLARE @ClockNow datetime2(7)=(SELECT BayGio FROM @Clock), @ClockRuntime int=(SELECT ThoiLuong FROM @Clock);
DECLARE @ExpectedRuntime int=(SELECT ThoiLuong FROM dbo.PHIM WHERE PhimID=@MovieID);
INSERT @Results VALUES(N'sp_Clock_GetNow',CONCAT(N'movie=',@MovieID),CONCAT(N'one row; runtime=',@ExpectedRuntime,N'; clock current'),
    CONCAT(N'rows=',(SELECT COUNT(*) FROM @Clock),N'; runtime=',COALESCE(CONVERT(nvarchar(20),@ClockRuntime),N'NULL')),
    IIF((SELECT COUNT(*) FROM @Clock)=1 AND @ClockRuntime=@ExpectedRuntime AND @ClockNow BETWEEN DATEADD(second,-5,SYSUTCDATETIME()) AND SYSUTCDATETIME(),'PASS','FAIL'));

-- Single-resultset list procedures: capture their exact projected schemas, then compare to independent source counts.
SELECT TOP (0) TheLoaiID+0 AS TheLoaiID,TenTheLoai INTO #Genres FROM dbo.THELOAI;
INSERT #Genres EXEC dbo.sp_Genre_List;
DECLARE @Expected int=(SELECT COUNT(*) FROM dbo.THELOAI), @Actual int=(SELECT COUNT(*) FROM #Genres);
INSERT @Results VALUES(N'sp_Genre_List',N'no filters',CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

SELECT TOP (0) r.RapID+0 AS RapID,r.TenRap,r.DiaChi,r.ThanhPho,r.SoDienThoai,r.MoTa,r.NgayHoatDong,r.TrangThai,cover.URL AS AnhDaiDienURL
INTO #Cinemas
FROM dbo.RAPCHIEUPHIM r OUTER APPLY(SELECT TOP(1) i.URL FROM dbo.HINHANH_RAPCHIEUPHIM i
    WHERE i.RapID=r.RapID AND i.LaAnhDaiDien=1 AND i.TrangThai=N'Hoạt động' ORDER BY i.HinhAnhRapID) cover;
INSERT #Cinemas EXEC dbo.sp_Cinema_List @ThanhPho=NULL;
SET @Expected=(SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TrangThai=N'Hoạt động'); SET @Actual=(SELECT COUNT(*) FROM #Cinemas);
INSERT @Results VALUES(N'sp_Cinema_List',N'city=NULL',CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

SELECT TOP (0) p.PhimID+0 AS PhimID,p.TenPhim,p.ThoiLuong,p.NgayKhoiChieu,p.NgayKetThuc,p.NgonNgu,p.PhuDe,p.DoTuoi,p.DaoDien,p.PosterURL,p.TrailerURL,p.TrangThai,
    tp.DiemDanhGiaTrungBinh,tp.SoLuotDanhGia,
    STUFF((SELECT ', '+t.TenTheLoai FROM dbo.PHIM_THELOAI pt JOIN dbo.THELOAI t ON t.TheLoaiID=pt.TheLoaiID
           WHERE pt.PhimID=p.PhimID FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,2,'') AS DanhSachTheLoai
INTO #Movies
FROM dbo.PHIM p LEFT JOIN dbo.vw_ThongKePhim tp ON tp.PhimID=p.PhimID;
INSERT #Movies EXEC dbo.sp_Movie_List @TrangThai=NULL,@TheLoaiID=NULL,@SearchTerm=NULL;
SET @Expected=(SELECT COUNT(*) FROM dbo.PHIM); SET @Actual=(SELECT COUNT(*) FROM #Movies);
INSERT @Results VALUES(N'sp_Movie_List',N'all filters=NULL',CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

SELECT TOP (0) SanPhamID+0 AS SanPhamID,TenSanPham,LoaiSanPham,Gia,MoTa,HinhAnh,TrangThai INTO #Products FROM dbo.SANPHAM;
INSERT #Products EXEC dbo.sp_Product_ListActive;
SET @Expected=(SELECT COUNT(*) FROM dbo.SANPHAM WHERE TrangThai=N'Đang bán'); SET @Actual=(SELECT COUNT(*) FROM #Products);
INSERT @Results VALUES(N'sp_Product_ListActive',N'no parameters',CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

-- Bookable showtime list/detail and seat list.
SELECT TOP (0) SuatChieuID,PhimID,TenPhim,PosterURL,ThoiLuong,DoTuoi,RapID,TenRap,DiaChiRap,ThanhPho,PhongID,TenPhong,LoaiPhong,
    ThoiGianBatDau,ThoiGianKetThuc,NgayChieu,GioBatDau,GioKetThuc,DinhDang,GiaVeCoBan,TrangThaiSuatChieu,TongSoGhe,SoGheDaDat,
    (TongSoGhe-SoGheDaDat) AS SoGheConLai INTO #Showtimes FROM dbo.vw_LichChieuChiTiet;
INSERT #Showtimes EXEC dbo.sp_Showtime_ListByMovie @PhimID=@MovieID,@RapID=NULL,@NgayChieu=NULL;
SET @Expected=(SELECT COUNT(*) FROM dbo.vw_LichChieuChiTiet WHERE PhimID=@MovieID AND IsBookable=1); SET @Actual=(SELECT COUNT(*) FROM #Showtimes);
INSERT @Results VALUES(N'sp_Showtime_ListByMovie',CONCAT(N'movie=',@MovieID,N'; cinema/date=NULL'),CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

SELECT TOP (0) SuatChieuID,PhimID,TenPhim,PosterURL,ThoiLuong,DoTuoi,RapID,TenRap,DiaChiRap,ThanhPho,PhongID,TenPhong,LoaiPhong,
    ThoiGianBatDau,ThoiGianKetThuc,NgayChieu,GioBatDau,GioKetThuc,DinhDang,GiaVeCoBan,TrangThaiSuatChieu,TongSoGhe,SoGheDaDat,
    (TongSoGhe-SoGheDaDat) AS SoGheConLai INTO #ShowtimeDetail FROM dbo.vw_LichChieuChiTiet;
INSERT #ShowtimeDetail EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@ShowtimeID;
INSERT @Results VALUES(N'sp_Showtime_GetDetail',CONCAT(N'showtime=',@ShowtimeID),N'1',CONVERT(nvarchar(30),(SELECT COUNT(*) FROM #ShowtimeDetail)),
    IIF((SELECT COUNT(*) FROM #ShowtimeDetail)=1,'PASS','FAIL'));

SELECT TOP (0) GheID+0 AS GheID,PhongID,HangGhe,SoGhe,TenGhe,LoaiGhe,GiaVe,TrangThaiGhe INTO #Seats FROM dbo.fn_DanhSachGheSuatChieu(@ShowtimeID);
INSERT #Seats EXEC dbo.sp_Seat_ListByShowtime @SuatChieuID=@ShowtimeID;
SET @Expected=(SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(@ShowtimeID)); SET @Actual=(SELECT COUNT(*) FROM #Seats);
INSERT @Results VALUES(N'sp_Seat_ListByShowtime',CONCAT(N'showtime=',@ShowtimeID),CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

-- Invalid identifier is a read-only error-path test.
DECLARE @SeatError int=NULL;
BEGIN TRY
    EXEC dbo.sp_Seat_ListByShowtime @SuatChieuID=-2147483648;
END TRY
BEGIN CATCH
    SET @SeatError=ERROR_NUMBER();
END CATCH;
INSERT @Results VALUES(N'sp_Seat_ListByShowtime invalid ID',N'-2147483648',N'THROW 50021',CONCAT(N'error ',COALESCE(CONVERT(nvarchar(20),@SeatError),N'none')),
    IIF(@SeatError=50021,'PASS','FAIL'));

-- Role-based permissions and assigned-cinema scope.
SELECT TOP (0) q.QuyenID+0 AS QuyenID,q.MaQuyen,q.TenQuyen,q.MoTa INTO #Permissions FROM dbo.QUYEN q;
INSERT #Permissions EXEC dbo.sp_RBAC_GetPermissionsByUser @NguoiDungID=@AdminID;
SET @Expected=(SELECT COUNT(DISTINCT q.QuyenID) FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO_QUYEN x ON x.VaiTroID=u.VaiTroID
    JOIN dbo.QUYEN q ON q.QuyenID=x.QuyenID WHERE u.NguoiDungID=@AdminID AND u.TrangThai=N'Hoạt động');
SET @Actual=(SELECT COUNT(*) FROM #Permissions);
INSERT @Results VALUES(N'sp_RBAC_GetPermissionsByUser',CONCAT(N'active admin=',@AdminID),CONVERT(nvarchar(30),@Expected),CONVERT(nvarchar(30),@Actual),IIF(@Expected=@Actual,'PASS','FAIL'));

-- Preview-only promotion check (source explicitly guarantees no quota reservation or write).
DECLARE @CustomerID int=(SELECT TOP (1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
    WHERE r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID);
DECLARE @PromoID int,@DiscountType nvarchar(20),@PromoValue decimal(18,2),@Discount decimal(18,2),@PromoValid bit,@PromoMessage nvarchar(255);
EXEC dbo.sp_Promotion_Validate @NguoiDungID=@CustomerID,@MaCode='STAR10',@TongTienDon=100000,
    @KhuyenMaiID=@PromoID OUTPUT,@LoaiGiamGia=@DiscountType OUTPUT,@GiaTriGiam=@PromoValue OUTPUT,
    @TienGiam=@Discount OUTPUT,@IsValid=@PromoValid OUTPUT,@Message=@PromoMessage OUTPUT;
DECLARE @ExpectedDiscount decimal(18,2)=10000.00;
INSERT @Results VALUES(N'sp_Promotion_Validate valid preview',N'active customer; STAR10; total=100000',N'valid=1; discount=10000',
    CONCAT(N'valid=',@PromoValid,N'; discount=',@Discount),IIF(@PromoValid=1 AND @Discount=@ExpectedDiscount,'PASS','FAIL'));

-- Validation-only schedule checks: one valid empty-room path and one known overlap rejection.
DECLARE @FixtureStart datetime2(7),@FixtureEnd datetime2(7),@FixtureMovie int,@FixtureRoom int,@Runtime int;
SELECT TOP (1) @FixtureStart=s.ThoiGianBatDau,@FixtureEnd=s.ThoiGianKetThuc,@FixtureMovie=s.PhimID,@FixtureRoom=s.PhongID
FROM dbo.SUATCHIEU s WHERE s.ThoiGianBatDau>dbo.fn_BayGio() AND s.TrangThai<>N'Đã hủy' ORDER BY s.ThoiGianBatDau,s.SuatChieuID;
SELECT @Runtime=ThoiLuong FROM dbo.PHIM WHERE PhimID=@FixtureMovie;
DECLARE @FutureStart datetime2(7)=DATEADD(day,45,dbo.fn_BayGio()),@FutureEnd datetime2(7);
SET @FutureEnd=DATEADD(minute,@Runtime,@FutureStart);
DECLARE @ValidTimeError int=NULL;
BEGIN TRY
    EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@FixtureMovie,@ThoiGianBatDau=@FutureStart,@ThoiGianKetThuc=@FutureEnd,
        @PhongID=NULL,@SuatChieuID=NULL,@TrangThai=N'Mở bán';
END TRY
BEGIN CATCH
    SET @ValidTimeError=ERROR_NUMBER();
END CATCH;
INSERT @Results VALUES(N'sp_Showtime_ValidateTimes valid future',N'future interval=movie runtime; room=NULL',N'no error',
    COALESCE(CONVERT(nvarchar(20),@ValidTimeError),N'no error'),IIF(@ValidTimeError IS NULL,'PASS','FAIL'));

DECLARE @OverlapError int=NULL;
BEGIN TRY
    EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@FixtureMovie,@ThoiGianBatDau=@FixtureStart,@ThoiGianKetThuc=@FixtureEnd,
        @PhongID=@FixtureRoom,@SuatChieuID=-2147483648,@TrangThai=N'Mở bán';
END TRY
BEGIN CATCH
    SET @OverlapError=ERROR_NUMBER();
END CATCH;
INSERT @Results VALUES(N'sp_Showtime_ValidateTimes overlap',N'existing future room/time interval',N'THROW 50001',
    CONCAT(N'error ',COALESCE(CONVERT(nvarchar(20),@OverlapError),N'none')),IIF(@OverlapError=50001,'PASS','FAIL'));

SELECT TestName,InputValue,ExpectedValue,ActualValue,Verdict FROM @Results ORDER BY TestName;
SELECT COUNT(*) AS Cases,(SELECT COUNT(*) FROM @Results WHERE Verdict='PASS') AS Passed,
       (SELECT COUNT(*) FROM @Results WHERE Verdict='FAIL') AS Failed,
       N'READ-ONLY PROCEDURE DEMO; no persistent writes' AS Mode
FROM @Results;
IF EXISTS(SELECT 1 FROM @Results WHERE Verdict<>'PASS')
    THROW 52101,N'One or more stored procedure read-only tests failed.',1;

DROP TABLE #Genres;
DROP TABLE #Cinemas;
DROP TABLE #Movies;
DROP TABLE #Products;
DROP TABLE #Showtimes;
DROP TABLE #ShowtimeDetail;
DROP TABLE #Seats;
DROP TABLE #Permissions;
GO

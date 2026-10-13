-- Historical R2.2 phase runner retired; use the current disposable Test DB workflow documented in scripts/db/TEST_PIPELINE.md.
SET NOCOUNT ON;
SET XACT_ABORT OFF;
IF DB_NAME() NOT LIKE 'CinemaBookingDB[_]R0[_]%'
    THROW 51022, 'Promotion fixtures require a disposable database.', 1;
CREATE TABLE #R22Results (CaseID INT, CaseName VARCHAR(80), ExpectedError INT, ActualError INT,
    Discount DECIMAL(18,2), Total DECIMAL(18,2), Usage INT, Orders INT, Tickets INT, Foods INT,
    CallerTranCount INT, CallerXactState INT, FinalTranCount INT, FinalXactState INT,
    FrozenDbNow VARCHAR(33), ValidStart VARCHAR(33), ValidEnd VARCHAR(33), Status VARCHAR(8));
DECLARE @Cases TABLE(ID INT, Name VARCHAR(80), Error INT, Discount DECIMAL(18,2));
INSERT @Cases VALUES
 (1,'no-promotion-null',0,0),(2,'no-promotion-empty',0,0),(3,'fixed-valid',0,1000),
 (4,'percentage-valid',0,17000),(5,'percentage-maximum-discount',0,5000),(6,'fixed-99-percent-cap',0,168300),
 (7,'minimum-equality-ticket-plus-food',0,1000),(8,'amount-above-minimum',0,1000),
 (9,'exact-start-inclusive',0,1000),(10,'exact-end-inclusive',0,1000),
 (11,'one-tick-before-start',50029,0),(12,'one-tick-after-end',50029,0),
 (13,'code-not-found',50029,0),(14,'paused-promotion',50029,0),(15,'expired-status',50029,0),
 (16,'not-started',50029,0),(17,'time-expired',50029,0),(18,'quota-exhausted',50029,0),
 (19,'one-cent-below-minimum',50029,0),(20,'FIXED-alias',0,1000),(21,'PERCENT-alias',0,17000),
 (22,'fixed-keeps-existing-max-semantics',0,1000),(23,'duplicate-seat-retry-no-second-usage',50025,1000),
 (24,'legacy-booking-alias-positive',0,1000),(25,'legacy-booking-alias-invalid',50029,0),
 (26,'percent-99-boundary',0,168300),(27,'zero-max-percentage-discount',0,0),
 (28,'minimum-fails-without-food',50029,0);
DECLARE @ID INT=1;
WHILE @ID<=28
BEGIN
 DECLARE @Name VARCHAR(80),@Expected INT,@ExpectedDiscount DECIMAL(18,2),@Actual INT=0;
 SELECT @Name=Name,@Expected=Error,@ExpectedDiscount=Discount FROM @Cases WHERE ID=@ID;
 DECLARE @User INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com'),
  @Cinema INT,@Movie INT,@Room INT,@Show INT,@Seat1 INT,@Seat2 INT,@Product INT,@Promo INT,@Order INT=NULL;
 DECLARE @Now DATETIME2(7)=dbo.fn_BayGio(),@Start DATETIME2(7)=DATEADD(DAY,10,dbo.fn_BayGio()),
  @Code VARCHAR(50)='R22-'+CONVERT(VARCHAR(36),NEWID()),@Requested VARCHAR(50),@Seats VARCHAR(MAX),@Food NVARCHAR(MAX);
 BEGIN TRANSACTION;
 BEGIN TRY
  -- Deterministic exact 100ns boundaries: transactionally replace the DB clock only
  -- in this disposable fixture. Referencing clock DEFAULTs are restored by rollback.
  IF @ID BETWEEN 9 AND 12
  BEGIN
   DECLARE @DDL NVARCHAR(MAX)=N'';
   SELECT @DDL=@DDL+N'ALTER TABLE '+QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))+N'.'+QUOTENAME(OBJECT_NAME(parent_object_id))+N' DROP CONSTRAINT '+QUOTENAME(name)+N';'
   FROM sys.default_constraints WHERE definition LIKE '%fn_BayGio%';
   EXEC sys.sp_executesql @DDL;
   EXEC sys.sp_executesql N'ALTER FUNCTION dbo.fn_BayGio() RETURNS DATETIME2(7) AS BEGIN RETURN COALESCE(CONVERT(DATETIME2(7),SESSION_CONTEXT(N''R22_TestNow'')),SYSUTCDATETIME()); END;';
   EXEC sys.sp_set_session_context @key=N'R22_TestNow',@value=@Now;
  END;
  INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R22 SQL',N'Fixture',N'HCM',N'Hoạt động');SET @Cinema=SCOPE_IDENTITY();
  INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,NgayKetThuc,TrangThai)
   VALUES(N'R22 SQL',60,DATEADD(DAY,-1,dbo.fn_NgayKinhDoanh(@Start)),NULL,N'Sắp chiếu');SET @Movie=SCOPE_IDENTITY();
  INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R22 SQL',N'2D',N'Hoạt động');SET @Room=SCOPE_IDENTITY();
  INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động');SET @Seat1=SCOPE_IDENTITY();
  INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',2,N'Thường',N'Hoạt động');SET @Seat2=SCOPE_IDENTITY();
  INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
   VALUES(@Movie,@Room,@Start,DATEADD(MINUTE,90,@Start),N'2D',80000,N'Mở bán');SET @Show=SCOPE_IDENTITY();
  INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,TrangThai) VALUES(N'R22 SQL',N'Snack',10000,N'Đang bán');SET @Product=SCOPE_IDENTITY();
  INSERT dbo.KHUYENMAI(MaCode,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,GiamToiDa,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai)
   VALUES(@Code,N'Số tiền',1000,0,NULL,DATEADD(DAY,-1,@Now),DATEADD(DAY,1,@Now),100,0,N'Hoạt động');SET @Promo=SCOPE_IDENTITY();
  IF @ID IN(4,5,21,26,27) UPDATE dbo.KHUYENMAI SET LoaiGiamGia=CASE WHEN @ID=21 THEN N'PERCENT' ELSE N'Phần trăm' END,GiaTriGiam=CASE WHEN @ID=26 THEN 99 ELSE 10 END WHERE KhuyenMaiID=@Promo;
  IF @ID=5 UPDATE dbo.KHUYENMAI SET GiamToiDa=5000 WHERE KhuyenMaiID=@Promo;
  IF @ID=6 UPDATE dbo.KHUYENMAI SET GiaTriGiam=200000 WHERE KhuyenMaiID=@Promo;
  IF @ID IN(7,8,19,28) UPDATE dbo.KHUYENMAI SET DonHangToiThieu=CASE @ID WHEN 8 THEN 169999.99 WHEN 19 THEN 170000.01 ELSE 170000 END WHERE KhuyenMaiID=@Promo;
  IF @ID IN(9,11) UPDATE dbo.KHUYENMAI SET NgayBatDau=CASE WHEN @ID=9 THEN @Now ELSE DATEADD(NANOSECOND,100,@Now) END WHERE KhuyenMaiID=@Promo;
  IF @ID IN(10,12) UPDATE dbo.KHUYENMAI SET NgayKetThuc=CASE WHEN @ID=10 THEN @Now ELSE DATEADD(NANOSECOND,-100,@Now) END WHERE KhuyenMaiID=@Promo;
  IF @ID IN(14,15,25) UPDATE dbo.KHUYENMAI SET TrangThai=CASE WHEN @ID=15 THEN N'Hết hạn' ELSE N'Tạm dừng' END WHERE KhuyenMaiID=@Promo;
  IF @ID=16 UPDATE dbo.KHUYENMAI SET NgayBatDau=DATEADD(HOUR,1,@Now) WHERE KhuyenMaiID=@Promo;
  IF @ID=17 UPDATE dbo.KHUYENMAI SET NgayKetThuc=DATEADD(HOUR,-1,@Now) WHERE KhuyenMaiID=@Promo;
  IF @ID=18 UPDATE dbo.KHUYENMAI SET SoLuong=0 WHERE KhuyenMaiID=@Promo;
  IF @ID=20 UPDATE dbo.KHUYENMAI SET LoaiGiamGia=N'FIXED' WHERE KhuyenMaiID=@Promo;
  IF @ID=22 UPDATE dbo.KHUYENMAI SET GiamToiDa=1 WHERE KhuyenMaiID=@Promo;
  IF @ID=27 UPDATE dbo.KHUYENMAI SET GiamToiDa=0 WHERE KhuyenMaiID=@Promo;
  SET @Requested=CASE WHEN @ID=1 THEN NULL WHEN @ID=2 THEN '' WHEN @ID=13 THEN 'R22-MISSING' ELSE @Code END;
  SET @Seats=CONCAT(@Seat1,',',@Seat2);SET @Food=CASE WHEN @ID=28 THEN NULL ELSE CONCAT(N'[{"SanPhamID":',@Product,N',"SoLuong":1}]') END;
  BEGIN TRY
   IF @ID IN(24,25) EXEC dbo.sp_DatVe @NguoiDungID=@User,@SuatChieuID=@Show,@MaKhuyenMai=@Requested,@DanhSachGheId=@Seats,@DanhSachDoAnJson=@Food,@NewDonDatVeID=@Order OUTPUT;
   ELSE EXEC dbo.sp_Booking_Create @NguoiDungID=@User,@SuatChieuID=@Show,@MaKhuyenMai=@Requested,@DanhSachGheId=@Seats,@DanhSachDoAnJson=@Food,@NewDonDatVeID=@Order OUTPUT;
   IF @ID=23 EXEC dbo.sp_Booking_Create @NguoiDungID=@User,@SuatChieuID=@Show,@MaKhuyenMai=@Requested,@DanhSachGheId=@Seats,@DanhSachDoAnJson=@Food,@NewDonDatVeID=@Order OUTPUT;
  END TRY
  BEGIN CATCH SET @Actual=ERROR_NUMBER();END CATCH;
  IF @Actual<>@Expected THROW 51022,'Wrong promotion/booking domain result.',1;
  DECLARE @Count INT=(SELECT COUNT(*) FROM dbo.DONDATVE WHERE SuatChieuID=@Show),@Usage INT=(SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo),
   @Tickets INT=(SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID IN(SELECT DonDatVeID FROM dbo.DONDATVE WHERE SuatChieuID=@Show)),
   @Foods INT=(SELECT COUNT(*) FROM dbo.CHITIETDOAN WHERE DonDatVeID IN(SELECT DonDatVeID FROM dbo.DONDATVE WHERE SuatChieuID=@Show)),
   @Discount DECIMAL(18,2)=(SELECT TienGiamGia FROM dbo.DONDATVE WHERE SuatChieuID=@Show),
   @Total DECIMAL(18,2)=(SELECT TongTienVe+TongTienDoAn-TienGiamGia FROM dbo.DONDATVE WHERE SuatChieuID=@Show);
  IF (@Expected=0 OR @ID=23) AND (@Count<>1 OR @Tickets<>2 OR @Foods<>1 OR @Discount<>@ExpectedDiscount OR @Total<>170000-@ExpectedDiscount OR @Usage<>CASE WHEN @ID IN(1,2) THEN 0 ELSE 1 END)
   THROW 51022,'Positive promotion snapshots/counter are incorrect.',1;
  IF @Expected=50029 AND (@Count<>0 OR @Tickets<>0 OR @Foods<>0 OR @Usage<>0)
   THROW 51022,'Rejected promotion left partial order/usage.',1;
  IF @@TRANCOUNT<>1 OR XACT_STATE()<>1 THROW 51022,'Caller savepoint transaction was not preserved.',1;
  DECLARE @ValidStart VARCHAR(33),@ValidEnd VARCHAR(33);
  SELECT @ValidStart=CONVERT(VARCHAR(33),NgayBatDau,126),@ValidEnd=CONVERT(VARCHAR(33),NgayKetThuc,126) FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo;
  ROLLBACK TRANSACTION;
  EXEC sys.sp_set_session_context @key=N'R22_TestNow',@value=NULL;
  DECLARE @FinalTranCount INT=@@TRANCOUNT,@FinalXactState INT=XACT_STATE();
  IF EXISTS(SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo) OR EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE SuatChieuID=@Show) OR @FinalTranCount<>0 OR @FinalXactState<>0
   THROW 51022,'Caller rollback leaked fixture/state.',1;
  INSERT #R22Results VALUES(@ID,@Name,@Expected,@Actual,ISNULL(@Discount,0),ISNULL(@Total,0),@Usage,@Count,@Tickets,@Foods,1,1,@FinalTranCount,@FinalXactState,
   CASE WHEN @ID BETWEEN 9 AND 12 THEN CONVERT(VARCHAR(33),@Now,126) END,@ValidStart,@ValidEnd,'PASS');
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK;
  EXEC sys.sp_set_session_context @key=N'R22_TestNow',@value=NULL;
  THROW;
 END CATCH;
 SET @ID+=1;
END;
SELECT * FROM #R22Results ORDER BY CaseID;
DROP TABLE #R22Results;
GO

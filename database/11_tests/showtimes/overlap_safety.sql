-- Destructive fixtures are confined to source-built disposable databases.
IF DB_NAME() NOT LIKE 'CinemaBookingDB[_]R0[_]%' THROW 59810,N'Disposable database required.',1;
SET NOCOUNT ON;
CREATE TABLE #ShowtimeResults(Role VARCHAR(10),TestCase VARCHAR(50),ErrorNumber INT,BeforeState NVARCHAR(MAX),AfterState NVARCHAR(MAX),OverlapCount INT,Result VARCHAR(4));
DECLARE @Manager INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'),
  @Admin INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='admin@cinemadb.vn'),
  @Customer INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com'),
  @Cinema INT,@Foreign INT,@Movie INT,@Duration INT,@Role VARCHAR(10),@Kind VARCHAR(50),@Expected INT,@Actor INT,
  @Room INT,@OtherRoom INT,@Old INT,@Other INT,@Order INT,@Error INT,@Count INT,
  @Base DATETIME2=DATEADD(DAY,10,dbo.fn_BayGio()),@Start DATETIME2,@End DATETIME2,@Span INT,
  @Status NVARCHAR(50),@Before NVARCHAR(MAX),@After NVARCHAR(MAX),@Command NVARCHAR(MAX),@Parameters NVARCHAR(MAX);
SELECT TOP(1) @Movie=PhimID,@Duration=ThoiLuong FROM dbo.PHIM WHERE ThoiLuong<=180 ORDER BY ThoiLuong;
SET @Span=@Duration+60;
SELECT TOP(1) @Cinema=RapID FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@Manager AND dbo.fn_KiemTraQuanLyRapScope(@Manager,RapID)=1 ORDER BY RapID;
IF @Cinema IS NULL OR @Movie IS NULL THROW 59810,N'Seed actors/movie required.',1;
INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R12 scope fixture '+CONVERT(NVARCHAR(36),NEWID()),N'Offline',N'HCM',N'Hoạt động');
SET @Foreign=SCOPE_IDENTITY();
DECLARE ShowtimeCases CURSOR LOCAL FAST_FORWARD FOR
 SELECT roles.Role,kinds.Kind,kinds.Expected FROM (VALUES('manager'),('admin')) roles(Role)
 CROSS JOIN (VALUES('create_clear',0),('create_boundary',0),('different_room',0),('exact',50001),('inside',50001),('contains',50001),('partial_before',50001),('partial_after',50001),
 ('update_clear',0),('update_conflict',50001),('update_same',0),('update_boundary',0),('cancel',0),('cancel_then_create',0),('cancel_completed',50119),('cancel_held',50118),('update_paid',50120),
 ('missing_room',50056),('missing_show_update',50058),('missing_show_cancel',50116),('invalid_time',50216)) kinds(Kind,Expected)
 UNION ALL SELECT 'manager','foreign_scope',50050
 UNION ALL SELECT 'manager','expired_assignment',50050
 UNION ALL SELECT 'alias','alias_clear',0
 UNION ALL SELECT 'alias','alias_overlap',50001
 UNION ALL SELECT 'trigger','multirow_overlap',50001
 UNION ALL SELECT 'trigger','multirow_clear',0
 UNION ALL SELECT 'trigger','multirow_cancelled',0;
BEGIN TRY
 OPEN ShowtimeCases;FETCH NEXT FROM ShowtimeCases INTO @Role,@Kind,@Expected;
 WHILE @@FETCH_STATUS=0
 BEGIN
  SET @Actor=CASE WHEN @Role='admin' THEN @Admin ELSE @Manager END;
  SET @Error=NULL;SET @Old=NULL;SET @Other=NULL;SET @Order=NULL;
  INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(CASE WHEN @Kind IN ('foreign_scope','expired_assignment') THEN @Foreign ELSE @Cinema END,N'R12 '+CONVERT(NVARCHAR(36),NEWID()),N'2D',N'Hoạt động');
  SET @Room=SCOPE_IDENTITY();
  INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R12 '+CONVERT(NVARCHAR(36),NEWID()),N'2D',N'Hoạt động');SET @OtherRoom=SCOPE_IDENTITY();
  INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động');
  IF @Kind NOT IN ('create_clear','foreign_scope','expired_assignment','alias_clear','missing_room','invalid_time','multirow_overlap','multirow_clear','multirow_cancelled')
  BEGIN
   INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
   VALUES(@Movie,@Room,@Base,DATEADD(MINUTE,@Span,@Base),N'2D',80000,CASE WHEN @Kind='cancel_completed' THEN N'Hoàn thành' ELSE N'Mở bán' END);SET @Old=SCOPE_IDENTITY();
  END;
  IF @Kind LIKE 'update[_]%'
  BEGIN
   INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
   VALUES(@Movie,@Room,DATEADD(HOUR,12,@Base),DATEADD(MINUTE,720+@Span,@Base),N'2D',80000,N'Mở bán');SET @Other=SCOPE_IDENTITY();
  END;
  IF @Kind IN ('cancel_held','update_paid')
  BEGIN
   INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TrangThai,HanGiuCho)
   VALUES(@Customer,@Old,CASE WHEN @Kind='cancel_held' THEN N'Chờ thanh toán' ELSE N'Đã thanh toán' END,DATEADD(MINUTE,20,dbo.fn_BayGio()));SET @Order=SCOPE_IDENTITY();
  END;
  IF @Kind='expired_assignment' INSERT dbo.PHANCONG_RAP(NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai)
   VALUES(@Manager,@Foreign,DATEADD(DAY,-10,dbo.fn_HomNay()),DATEADD(DAY,-1,dbo.fn_HomNay()),N'Hiệu lực');
  SELECT @Before=(SELECT JSON_QUERY((SELECT * FROM dbo.PHONGCHIEU WHERE PhongID IN (@Room,@OtherRoom) ORDER BY PhongID FOR JSON PATH)) rooms,
   JSON_QUERY((SELECT * FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID FOR JSON PATH)) seats,
   JSON_QUERY((SELECT * FROM dbo.SUATCHIEU WHERE PhongID IN (@Room,@OtherRoom) ORDER BY SuatChieuID FOR JSON PATH)) shows,
   JSON_QUERY((SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@Order FOR JSON PATH)) orders FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
  SET @Start=@Base;SET @End=DATEADD(MINUTE,@Span,@Base);SET @Status=N'Mở bán';
  IF @Kind='create_boundary' BEGIN SET @Start=@End;SET @End=DATEADD(MINUTE,@Span,@Start);END;
  IF @Kind='inside' BEGIN SET @Start=DATEADD(MINUTE,30,@Base);SET @End=DATEADD(MINUTE,@Duration,@Start);END;
  IF @Kind='contains' BEGIN SET @Start=DATEADD(MINUTE,-30,@Base);SET @End=DATEADD(MINUTE,@Span+30,@Base);END;
  IF @Kind='partial_before' BEGIN SET @Start=DATEADD(MINUTE,-@Duration,@Base);SET @End=DATEADD(MINUTE,60,@Base);END;
  IF @Kind='partial_after' BEGIN SET @Start=DATEADD(MINUTE,@Duration,@Base);SET @End=DATEADD(MINUTE,@Span,@Start);END;
  IF @Kind='update_clear' BEGIN SET @Start=DATEADD(HOUR,6,@Base);SET @End=DATEADD(MINUTE,@Span,@Start);END;
  IF @Kind='update_conflict' BEGIN SET @Start=DATEADD(HOUR,12,@Base);SET @End=DATEADD(MINUTE,@Span,@Start);END;
  IF @Kind='update_boundary' BEGIN SET @End=DATEADD(HOUR,12,@Base);SET @Start=DATEADD(MINUTE,-@Span,@End);END;
  IF @Kind='update_paid' BEGIN SET @Start=DATEADD(MINUTE,1,@Base);SET @End=DATEADD(MINUTE,@Span,@Start);END;
  IF @Kind='invalid_time' SET @End=DATEADD(MINUTE,@Duration-1,@Base);
  SET @Parameters=N'@Actor INT,@Movie INT,@Room INT,@Old INT,@Start DATETIME2,@End DATETIME2,@Status NVARCHAR(50),@OtherRoom INT';
  BEGIN TRY
   IF @Kind LIKE 'multirow[_]%'
   BEGIN
    BEGIN TRANSACTION;
    IF @Kind='multirow_overlap' INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,GiaVeCoBan)
     VALUES(@Movie,@Room,@Base,DATEADD(MINUTE,@Span,@Base),80000),(@Movie,@Room,DATEADD(MINUTE,1,@Base),DATEADD(MINUTE,@Span+1,@Base),80000);
    ELSE IF @Kind='multirow_clear' INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,GiaVeCoBan)
     VALUES(@Movie,@Room,@Base,DATEADD(MINUTE,@Span,@Base),80000),(@Movie,@Room,DATEADD(MINUTE,@Span,@Base),DATEADD(MINUTE,2*@Span,@Base),80000);
    ELSE INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,GiaVeCoBan,TrangThai)
     VALUES(@Movie,@Room,@Base,DATEADD(MINUTE,@Span,@Base),80000,N'Đã hủy'),(@Movie,@Room,@Base,DATEADD(MINUTE,@Span,@Base),80000,N'Mở bán');
    COMMIT;
   END
   ELSE
   BEGIN
    IF @Kind LIKE 'cancel%' OR @Kind='missing_show_cancel'
    BEGIN
     SET @Command=N'EXEC dbo.'+CASE WHEN @Role='admin' THEN N'usp_Admin_Showtime_Cancel @ActorID' ELSE N'sp_Manager_Showtime_Cancel @NguoiDungID' END+N'=@Actor,@SuatChieuID=@Old;';
     IF @Kind='missing_show_cancel' SET @Old=2147483600;
     EXEC sys.sp_executesql @Command,@Parameters,@Actor,@Movie,@Room,@Old,@Start,@End,@Status,@OtherRoom;
     IF @Kind='cancel' EXEC sys.sp_executesql @Command,@Parameters,@Actor,@Movie,@Room,@Old,@Start,@End,@Status,@OtherRoom;
    END;
    IF @Kind LIKE 'update[_]%' OR @Kind='missing_show_update'
    BEGIN
     SET @Command=N'EXEC dbo.'+CASE WHEN @Role='admin' THEN N'usp_Admin_Showtime_Update @ActorID' ELSE N'sp_Manager_Showtime_Update @NguoiDungID' END+N'=@Actor,@SuatChieuID=@Old,@PhimID=@Movie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=N''2D'',@GiaVeCoBan=80000,@TrangThai=@Status;';
     IF @Kind='missing_show_update' SET @Old=2147483600;
     EXEC sys.sp_executesql @Command,@Parameters,@Actor,@Movie,@Room,@Old,@Start,@End,@Status,@OtherRoom;
    END
    ELSE IF @Kind NOT LIKE 'cancel%' AND @Kind<>'missing_show_cancel' OR @Kind='cancel_then_create'
    BEGIN
     SET @Command=N'EXEC dbo.'+CASE WHEN @Role='admin' THEN N'usp_Admin_Showtime_Create @ActorID' WHEN @Role='alias' THEN N'sp_ThemSuatChieu @NguoiDungID' ELSE N'sp_Manager_Showtime_Create @NguoiDungID' END+N'=@Actor,@PhimID=@Movie,@PhongID=@Room,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=N''2D'',@GiaVeCoBan=80000;';
     DECLARE @Target INT=CASE WHEN @Kind='missing_room' THEN 2147483600 WHEN @Kind='different_room' THEN @OtherRoom ELSE @Room END;
     EXEC sys.sp_executesql @Command,@Parameters,@Actor,@Movie,@Target,@Old,@Start,@End,@Status,@OtherRoom;
    END;
   END;
  END TRY
  BEGIN CATCH
   SET @Error=ERROR_NUMBER();IF XACT_STATE()<>0 ROLLBACK;
  END CATCH;
  SELECT @After=(SELECT JSON_QUERY((SELECT * FROM dbo.PHONGCHIEU WHERE PhongID IN (@Room,@OtherRoom) ORDER BY PhongID FOR JSON PATH)) rooms,
   JSON_QUERY((SELECT * FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID FOR JSON PATH)) seats,
   JSON_QUERY((SELECT * FROM dbo.SUATCHIEU WHERE PhongID IN (@Room,@OtherRoom) ORDER BY SuatChieuID FOR JSON PATH)) shows,
   JSON_QUERY((SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@Order FOR JSON PATH)) orders FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
  SELECT @Count=COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
   WHERE a.PhongID IN (@Room,@OtherRoom) AND a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau;
  IF ISNULL(@Error,0)<>@Expected THROW 59811,N'Unexpected SQL result code.',1;
  IF @Expected<>0 AND @Before<>@After THROW 59811,N'Rejected write changed actual state.',1;
  IF @Expected=0 AND @Before=@After AND @Kind NOT IN ('update_same') THROW 59811,N'Success did not write expected state.',1;
  IF @Count<>0 OR @@TRANCOUNT<>0 OR XACT_STATE()<>0 THROW 59811,N'Overlap/transaction invariant failed.',1;
  IF @Kind LIKE 'cancel%' AND @Expected=0 AND NOT EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID=@Old AND TrangThai=N'Đã hủy') THROW 59811,N'Cancel must retain the historical row.',1;
  INSERT #ShowtimeResults VALUES(@Role,@Kind,@Error,@Before,@After,@Count,'PASS');
  DELETE dbo.DONDATVE WHERE DonDatVeID=@Order;
  DELETE dbo.SUATCHIEU WHERE PhongID IN (@Room,@OtherRoom);
  DELETE dbo.GHE WHERE PhongID=@Room;
  DELETE dbo.PHONGCHIEU WHERE PhongID IN (@Room,@OtherRoom);
  FETCH NEXT FROM ShowtimeCases INTO @Role,@Kind,@Expected;
 END;
 CLOSE ShowtimeCases;DEALLOCATE ShowtimeCases;
 DELETE dbo.PHANCONG_RAP WHERE RapID=@Foreign;DELETE dbo.RAPCHIEUPHIM WHERE RapID=@Foreign;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK;
 THROW;
END CATCH;
SELECT * FROM #ShowtimeResults;DROP TABLE #ShowtimeResults;
GO

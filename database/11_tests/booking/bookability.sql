-- R2.1 real SQL integration: dynamic fixtures, trusted constraints, every write rolled back.
SET NOCOUNT ON;
SET XACT_ABORT OFF;
IF DB_NAME() NOT LIKE N'CinemaBookingDB[_]R0[_]%'
    THROW 51021, 'R2.1 fixtures require an explicit disposable database.', 1;
CREATE TABLE #R21Results (CaseID INT, CaseName VARCHAR(80), ExpectedError INT, ActualError INT,
    IsBookable BIT, PublicRows INT, DetailRows INT, SeatRows INT, OrderRows INT, TicketRows INT,
    FoodRows INT, PromotionUsage INT, CallerTranCount INT, CallerXactState INT,
    FinalTranCount INT, FinalXactState INT, ShowDate DATE, ReleaseStart DATE, ReleaseEnd DATE, Status VARCHAR(8));
SELECT TOP(0) SuatChieuID,PhimID,TenPhim,PosterURL,ThoiLuong,DoTuoi,RapID,TenRap,DiaChiRap,ThanhPho,
    PhongID,TenPhong,LoaiPhong,ThoiGianBatDau,ThoiGianKetThuc,NgayChieu,GioBatDau,GioKetThuc,DinhDang,
    GiaVeCoBan,TrangThaiSuatChieu,TongSoGhe,SoGheDaDat,(TongSoGhe-SoGheDaDat) SoGheConLai
INTO #R21Public FROM dbo.vw_LichChieuChiTiet;
SELECT TOP(0) GheID,PhongID,HangGhe,SoGhe,TenGhe,LoaiGhe,GiaVe,TrangThaiGhe
INTO #R21Seats FROM dbo.fn_DanhSachGheSuatChieu(-1);
DECLARE @Cases TABLE (ID INT, Name VARCHAR(80), Error INT);
INSERT @Cases VALUES
 (1,'active-resources',0),(2,'upcoming-valid-window',0),(3,'null-release-end',0),
 (4,'release-start-equality',0),(5,'after-release-start',0),(6,'release-end-equality',0),
 (7,'UTC-1730-next-business-date',0),(8,'UTC-1659-same-business-date',0),
 (9,'cinema-temporarily-closed',50022),(10,'cinema-maintenance',50022),
 (11,'room-maintenance',50022),(12,'room-inactive',50022),(13,'movie-stopped',50022),
 (14,'show-closed',50022),(15,'show-canceled',50022),(16,'show-completed',50022),
 (17,'show-already-started',50022),(18,'show-start-at-DB-now',50022),
 (19,'seat-broken',50024),(20,'seat-maintenance',50024),(21,'mixed-active-inactive-seats',50024),
 (22,'before-release-start',50022),(23,'after-release-end',50022),(24,'upcoming-before-release',50022),
 (25,'seat-from-other-room',50024),(26,'same-seat-conflict',50025),(27,'overlapping-seat-list-conflict',50025),
 (28,'legacy-alias-positive',0),(29,'legacy-alias-inactive-parent',50022),(30,'caller-rollback-positive',0);
DECLARE @ID INT=1;
WHILE @ID<=30
BEGIN
    DECLARE @Name VARCHAR(80),@Expected INT,@Actual INT=0,@User INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com');
    SELECT @Name=Name,@Expected=Error FROM @Cases WHERE ID=@ID;
    DECLARE @Cinema INT,@Movie INT,@Room INT,@OtherRoom INT,@Show INT,@Seat1 INT,@Seat2 INT,@OtherSeat INT,@Product INT,@Promotion INT,@Order INT=NULL;
    DECLARE @Now DATETIME2(7)=dbo.fn_BayGio(),@Start DATETIME2(7),@ShowDate DATE,@ReleaseStart DATE,@ReleaseEnd DATE;
    SET @Start=DATEADD(DAY,10,@Now);
    IF @ID IN(7,8) SET @Start=DATEADD(MINUTE,CASE WHEN @ID=7 THEN 1050 ELSE 1019 END,CONVERT(DATETIME2(7),CONVERT(DATE,@Start)));
    IF @ID=17 SET @Start=DATEADD(MINUTE,-1,@Now);
    IF @ID=18 SET @Start=@Now;
    SET @ShowDate=dbo.fn_NgayKinhDoanh(@Start);
    SET @ReleaseStart=DATEADD(DAY,-1,@ShowDate); SET @ReleaseEnd=DATEADD(DAY,1,@ShowDate);
    IF @ID IN(3) SET @ReleaseEnd=NULL;
    IF @ID IN(4,7,8) SET @ReleaseStart=@ShowDate;
    IF @ID IN(6,7,8) SET @ReleaseEnd=@ShowDate;
    IF @ID IN(22,24) SET @ReleaseStart=DATEADD(DAY,1,@ShowDate);
    IF @ID=23 BEGIN SET @ReleaseStart=DATEADD(DAY,-2,@ShowDate);SET @ReleaseEnd=DATEADD(DAY,-1,@ShowDate);END;
    DECLARE @Code VARCHAR(50)='R21-'+CONVERT(VARCHAR(36),NEWID()),@Seats VARCHAR(MAX),@Food NVARCHAR(MAX);
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R21 SQL',N'Fixture',N'HCM',N'Hoạt động');SET @Cinema=SCOPE_IDENTITY();
        INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,NgayKetThuc,TrangThai)
        VALUES(N'R21 SQL',60,@ReleaseStart,@ReleaseEnd,CASE WHEN @ID IN(2,24) THEN N'Sắp chiếu' ELSE N'Đang chiếu' END);SET @Movie=SCOPE_IDENTITY();
        INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'Room',N'2D',N'Hoạt động');SET @Room=SCOPE_IDENTITY();
        INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'Other',N'2D',N'Hoạt động');SET @OtherRoom=SCOPE_IDENTITY();
        INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động');SET @Seat1=SCOPE_IDENTITY();
        INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',2,N'Thường',N'Hoạt động');SET @Seat2=SCOPE_IDENTITY();
        INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@OtherRoom,'A',1,N'Thường',N'Hoạt động');SET @OtherSeat=SCOPE_IDENTITY();
        INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
        VALUES(@Movie,@Room,@Start,DATEADD(MINUTE,90,@Start),N'2D',80000,N'Mở bán');SET @Show=SCOPE_IDENTITY();
        INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,TrangThai) VALUES(N'R21 SQL',N'Snack',10000,N'Đang bán');SET @Product=SCOPE_IDENTITY();
        INSERT dbo.KHUYENMAI(MaCode,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai)
        VALUES(@Code,N'Số tiền',1000,0,DATEADD(DAY,-1,@Now),DATEADD(DAY,1,@Now),100,0,N'Hoạt động');SET @Promotion=SCOPE_IDENTITY();
        IF @ID=9 UPDATE dbo.RAPCHIEUPHIM SET TrangThai=N'Tạm đóng' WHERE RapID=@Cinema;
        IF @ID=10 UPDATE dbo.RAPCHIEUPHIM SET TrangThai=N'Bảo trì' WHERE RapID=@Cinema;
        IF @ID IN(11,29) UPDATE dbo.PHONGCHIEU SET TrangThai=N'Bảo trì' WHERE PhongID=@Room;
        IF @ID=12 UPDATE dbo.PHONGCHIEU SET TrangThai=N'Ngưng hoạt động' WHERE PhongID=@Room;
        IF @ID=13 UPDATE dbo.PHIM SET TrangThai=N'Ngừng chiếu' WHERE PhimID=@Movie;
        IF @ID IN(14,15,16) UPDATE dbo.SUATCHIEU SET TrangThai=CASE @ID WHEN 14 THEN N'Đóng bán' WHEN 15 THEN N'Đã hủy' ELSE N'Hoàn thành' END WHERE SuatChieuID=@Show;
        IF @ID=19 UPDATE dbo.GHE SET TrangThai=N'Hỏng' WHERE GheID=@Seat1;
        IF @ID IN(20,21) UPDATE dbo.GHE SET TrangThai=N'Bảo trì' WHERE GheID=@Seat2;
        SET @Seats=CONCAT(@Seat1,',',@Seat2); IF @ID=25 SET @Seats=CONCAT(@Seat1,',',@OtherSeat);
        SET @Food=CONCAT(N'[{"SanPhamID":',@Product,N',"SoLuong":1}]');
        DECLARE @Bookable BIT=(SELECT IsBookable FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID=@Show),@PublicRows INT,@DetailRows INT,@SeatRows INT,@ReadError INT=0;
        DELETE #R21Public; INSERT #R21Public EXEC dbo.sp_Showtime_ListByMovie @PhimID=@Movie;
        SET @PublicRows=(SELECT COUNT(*) FROM #R21Public);
        DELETE #R21Public; INSERT #R21Public EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@Show;
        SET @DetailRows=(SELECT COUNT(*) FROM #R21Public);
        DELETE #R21Seats;
        BEGIN TRY INSERT #R21Seats EXEC dbo.sp_Seat_ListByShowtime @SuatChieuID=@Show;END TRY
        BEGIN CATCH SET @ReadError=ERROR_NUMBER();END CATCH;
        SET @SeatRows=(SELECT COUNT(*) FROM #R21Seats);
        IF @PublicRows<>CONVERT(INT,@Bookable) OR @DetailRows<>CONVERT(INT,@Bookable)
            THROW 51021,'Public list/detail disagrees with DB bookability.',1;
        IF (@Bookable=0 AND (@ReadError<>50022 OR @SeatRows<>0 OR EXISTS(SELECT 1 FROM dbo.fn_DanhSachGheSuatChieu(@Show))))
           OR (@Bookable=1 AND (@ReadError<>0 OR @SeatRows<>2)) THROW 51021,'Seat read disagrees with DB bookability.',1;
        IF @ID IN(19,20,21) AND EXISTS(SELECT 1 FROM #R21Seats s JOIN dbo.GHE g ON g.GheID=s.GheID WHERE g.TrangThai<>N'Hoạt động' AND s.TrangThaiGhe=N'Trống')
            THROW 51021,'Inactive physical seat advertised as free.',1;
        IF @ID IN(26,27)
        BEGIN
            EXEC dbo.sp_Booking_Create @NguoiDungID=@User,@SuatChieuID=@Show,@MaKhuyenMai=@Code,@DanhSachGheId=@Seats,@DanhSachDoAnJson=@Food,@NewDonDatVeID=@Order OUTPUT;
            IF @ID=26 SET @Seats=CONVERT(VARCHAR(20),@Seat1);
        END;
        SET @Order=NULL;
        BEGIN TRY
            IF @ID IN(28,29) EXEC dbo.sp_DatVe @NguoiDungID=@User,@SuatChieuID=@Show,@MaKhuyenMai=@Code,@DanhSachGheId=@Seats,@DanhSachDoAnJson=@Food,@NewDonDatVeID=@Order OUTPUT;
            ELSE EXEC dbo.sp_Booking_Create @NguoiDungID=@User,@SuatChieuID=@Show,@MaKhuyenMai=@Code,@DanhSachGheId=@Seats,@DanhSachDoAnJson=@Food,@NewDonDatVeID=@Order OUTPUT;
        END TRY BEGIN CATCH SET @Actual=ERROR_NUMBER();END CATCH;
        DECLARE @Orders INT=(SELECT COUNT(*) FROM dbo.DONDATVE WHERE SuatChieuID=@Show),
                @Tickets INT=(SELECT COUNT(*) FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.SuatChieuID=@Show),
                @Foods INT=(SELECT COUNT(*) FROM dbo.CHITIETDOAN f JOIN dbo.DONDATVE d ON d.DonDatVeID=f.DonDatVeID WHERE d.SuatChieuID=@Show),
                @Usage INT=(SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promotion),
                @CallerCount INT=@@TRANCOUNT,@CallerState INT=XACT_STATE();
        DECLARE @ExpectedOrders INT=CASE WHEN @Expected=0 OR @ID IN(26,27) THEN 1 ELSE 0 END;
        IF @Actual<>@Expected OR @Orders<>@ExpectedOrders OR @Tickets<>2*@ExpectedOrders OR @Foods<>@ExpectedOrders OR @Usage<>@ExpectedOrders
            THROW 51021,'Booking outcome or atomic order/ticket/food/promotion state failed.',1;
        IF @CallerCount<>1 OR @CallerState<>1 THROW 51021,'Booking committed or damaged the caller transaction.',1;
        ROLLBACK TRANSACTION;
        DECLARE @FinalCount INT=@@TRANCOUNT,@FinalState INT=XACT_STATE();
        IF @FinalCount<>0 OR @FinalState<>0 THROW 51021,'Transaction leak after fixture rollback.',1;
        IF EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE SuatChieuID=@Show) OR EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@Room)
            THROW 51021,'Caller rollback did not remove the fixture/booking.',1;
        INSERT #R21Results VALUES(@ID,@Name,@Expected,@Actual,@Bookable,@PublicRows,@DetailRows,@SeatRows,@Orders,@Tickets,@Foods,@Usage,
            @CallerCount,@CallerState,@FinalCount,@FinalState,@ShowDate,@ReleaseStart,@ReleaseEnd,'PASS');
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    SET @ID+=1;
END;
SELECT * FROM #R21Results ORDER BY CaseID;
GO

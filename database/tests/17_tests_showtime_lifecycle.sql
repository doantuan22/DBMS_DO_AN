-- Disposable-database lifecycle acceptance. Run after migration 014; all test data rolls back.
USE CinemaBookingDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT OFF;
DECLARE @Fail INT=0,@Suat INT,@Ghe1 INT,@Ghe2 INT,@Ghe3 INT,@Ghe4 INT,@Don1 INT,@Don2 INT,@Don3 INT,@Don4 INT,
        @Pay1 INT,@Pay2 INT,@Pay3 INT,@Pay4 INT,@Txn VARCHAR(100),@Promo INT,@PromoBefore INT,@User6Points INT,@User7Points INT,
        @Now DATETIME2=SYSDATETIME(),@Start DATETIME2,@End DATETIME2,@Movie INT,@OtherMovie INT,@Room INT,@Format NVARCHAR(50),@Price DECIMAL(18,2),
        @Err INT,@SeatStatus NVARCHAR(50),@Message NVARCHAR(255),@StartedTest INT,@SavedStartedAt DATETIME2,@SavedEndedAt DATETIME2,@SavedStatus NVARCHAR(50),
        @RevenueBefore DECIMAL(18,2),@RevenueAfter DECIMAL(18,2),@PaidTwo DECIMAL(18,2),@PaidThree DECIMAL(18,2),@Rap INT,@NewFormat NVARCHAR(50),@ChangedStart DATETIME2,@ChangedEnd DATETIME2,@PriceRaise DECIMAL(18,2);
-- Exercise the started guard outside the data fixture transaction because the shared cancellation procedure uses XACT_ABORT.
SELECT TOP(1) @StartedTest=SuatChieuID,@SavedStartedAt=ThoiGianBatDau,@SavedEndedAt=ThoiGianKetThuc,@SavedStatus=TrangThai
FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' AND ThoiGianBatDau>DATEADD(HOUR,1,SYSDATETIME())
  AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=SUATCHIEU.SuatChieuID AND d.TrangThai IN(N'Chờ thanh toán',N'Đã thanh toán'));
IF @StartedTest IS NULL THROW 51000,N'AUDIT3 setup could not find a spare showtime for the started guard.',1;
UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(MINUTE,-2,SYSDATETIME()),ThoiGianKetThuc=DATEADD(MINUTE,30,SYSDATETIME()) WHERE SuatChieuID=@StartedTest;
SET @Err=0;
BEGIN TRY EXEC dbo.usp_Admin_Showtime_Cancel @SuatChieuID=@StartedTest; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=@SavedStartedAt,ThoiGianKetThuc=@SavedEndedAt,TrangThai=@SavedStatus WHERE SuatChieuID=@StartedTest;
IF @Err<>50119 THROW 51000,N'Cancellation of a started showtime was not rejected.',1;
PRINT N'PASS - cancellation of a started showtime is rejected.';

BEGIN TRANSACTION;
BEGIN TRY
    UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(MINUTE,-1,@Now) WHERE NguoiDungID IN (5,6,7,8) AND TrangThai=N'Chờ thanh toán';
    EXEC dbo.sp_Order_ExpirePending @TraVeKetQua=0;

    SELECT TOP (1) @Suat=sc.SuatChieuID,@Start=sc.ThoiGianBatDau,@End=sc.ThoiGianKetThuc,@Movie=sc.PhimID,
        @Room=sc.PhongID,@Format=sc.DinhDang,@Price=sc.GiaVeCoBan
    FROM dbo.SUATCHIEU sc
    WHERE sc.TrangThai=N'Mở bán' AND sc.ThoiGianBatDau>DATEADD(HOUR,1,@Now)
      AND NOT EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=sc.SuatChieuID AND
          (d.TrangThai=N'Đã thanh toán' OR (d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>@Now)))
      AND (SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(sc.SuatChieuID) WHERE TrangThaiGhe=N'Trống')>=4
    ORDER BY sc.SuatChieuID;
    IF @Suat IS NULL THROW 51000,N'AUDIT3 setup could not find a future showtime with four free seats.',1;
    SELECT TOP(1) @Ghe1=GheID FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE TrangThaiGhe=N'Trống' ORDER BY GheID;
    SELECT TOP(1) @Ghe2=GheID FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE TrangThaiGhe=N'Trống' AND GheID>@Ghe1 ORDER BY GheID;
    SELECT TOP(1) @Ghe3=GheID FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE TrangThaiGhe=N'Trống' AND GheID>@Ghe2 ORDER BY GheID;
    SELECT TOP(1) @Ghe4=GheID FROM dbo.fn_DanhSachGheSuatChieu(@Suat) WHERE TrangThaiGhe=N'Trống' AND GheID>@Ghe3 ORDER BY GheID;
    SELECT TOP(1) @OtherMovie=PhimID FROM dbo.PHIM WHERE PhimID<>@Movie ORDER BY PhimID;
    SELECT @User6Points=DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=6;
    SELECT @User7Points=DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=7;
    INSERT dbo.KHUYENMAI(MaCode,MoTa,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai)
    VALUES('AUDIT3_LIFECYCLE',N'AUDIT3 lifecycle test',N'Số tiền',1000,0,DATEADD(DAY,-1,@Now),DATEADD(DAY,1,@Now),10,0,N'Hoạt động');
    SET @Promo=SCOPE_IDENTITY();

    EXEC dbo.sp_Booking_Create @NguoiDungID=5,@SuatChieuID=@Suat,@DanhSachGheId=@Ghe1,@NewDonDatVeID=@Don1 OUTPUT;
    EXEC dbo.sp_Booking_Create @NguoiDungID=6,@SuatChieuID=@Suat,@DanhSachGheId=@Ghe2,@NewDonDatVeID=@Don2 OUTPUT;
    EXEC dbo.sp_Booking_Create @NguoiDungID=7,@SuatChieuID=@Suat,@MaKhuyenMai='AUDIT3_LIFECYCLE',@DanhSachGheId=@Ghe3,@NewDonDatVeID=@Don3 OUTPUT;
    EXEC dbo.sp_Booking_Create @NguoiDungID=8,@SuatChieuID=@Suat,@DanhSachGheId=@Ghe4,@NewDonDatVeID=@Don4 OUTPUT;
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID=@Don1,@PhuongThuc=N'MOMO',@ThanhToanID=@Pay1 OUTPUT,@MaGiaoDich=@Txn OUTPUT;
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID=@Don2,@PhuongThuc=N'MOMO',@ThanhToanID=@Pay2 OUTPUT,@MaGiaoDich=@Txn OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @ThanhToanID=@Pay2,@TrangThaiThanhToan=N'Thành công';
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID=@Don3,@PhuongThuc=N'MOMO',@ThanhToanID=@Pay3 OUTPUT,@MaGiaoDich=@Txn OUTPUT;
    EXEC dbo.sp_Payment_UpdateResult @ThanhToanID=@Pay3,@TrangThaiThanhToan=N'Thành công';
    EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID=@Don4,@PhuongThuc=N'MOMO',@ThanhToanID=@Pay4 OUTPUT,@MaGiaoDich=@Txn OUTPUT;
    UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(SECOND,-1,SYSDATETIME()) WHERE DonDatVeID=@Don4;
    SET @Err=0;
    BEGIN TRY EXEC dbo.sp_Payment_UpdateResult @ThanhToanID=@Pay4,@TrangThaiThanhToan=N'Thành công'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50111 THROW 51000,N'Late successful payment was not rejected with 50111.',1;
    EXEC dbo.sp_Order_ExpirePending @SuatChieuID=@Suat,@TraVeKetQua=0;
    IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Don4 AND TrangThai=N'Hết hạn')
        THROW 51000,N'Expired pending order did not release its hold.',1;
    PRINT N'PASS - overdue payment rejected; expiry cleanup marks the order expired and releases the ticket.';

    -- Showtime with active orders: movie/time/format edits fail, price edits remain legal.
    SET @Err=0;
    BEGIN TRY EXEC dbo.usp_Admin_Showtime_Update @SuatChieuID=@Suat,@PhimID=@OtherMovie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=@Format,@GiaVeCoBan=@Price,@TrangThai=N'Mở bán'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50120 THROW 51000,N'Admin movie edit with active orders was not blocked.',1;
    SET @Err=0;
    SET @ChangedStart=DATEADD(MINUTE,10,@Start); SET @ChangedEnd=DATEADD(MINUTE,10,@End);
    BEGIN TRY EXEC dbo.sp_Manager_Showtime_Update @NguoiDungID=1,@SuatChieuID=@Suat,@PhimID=@Movie,@ThoiGianBatDau=@ChangedStart,@ThoiGianKetThuc=@ChangedEnd,@DinhDang=@Format,@GiaVeCoBan=@Price,@TrangThai=N'Mở bán'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50120 THROW 51000,N'Manager time edit with active orders was not blocked.',1;
    SET @Err=0;
    SET @NewFormat=CASE WHEN @Format=N'2D' THEN N'3D' ELSE N'2D' END;
    BEGIN TRY EXEC dbo.usp_Admin_Showtime_Update @SuatChieuID=@Suat,@PhimID=@Movie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=@NewFormat,@GiaVeCoBan=@Price,@TrangThai=N'Mở bán'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50120 THROW 51000,N'Admin format edit with active orders was not blocked.',1;
    SET @Err=0;
    BEGIN TRY EXEC dbo.usp_Admin_Showtime_Update @SuatChieuID=@Suat,@PhimID=@Movie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=@Format,@GiaVeCoBan=@Price,@TrangThai=N'Đã hủy'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50123 THROW 51000,N'PUT status cancellation was not blocked.',1;
    SET @PriceRaise=@Price+100;
    EXEC dbo.usp_Admin_Showtime_Update @SuatChieuID=@Suat,@PhimID=@Movie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=@Format,@GiaVeCoBan=@PriceRaise,@TrangThai=N'Mở bán';
    PRINT N'PASS - admin/manager structural PUT guards; status cancellation rejected; price-only update allowed.';

    -- Same future-ticket guard and code for manager/admin.
    SELECT TOP(1) @SeatStatus=g.TrangThai FROM dbo.GHE g WHERE g.GheID=@Ghe2;
    SET @Err=0;
    BEGIN TRY EXEC dbo.sp_Manager_Seat_Update @NguoiDungID=1,@GheID=@Ghe2,@LoaiGhe=N'Thường',@TrangThai=N'Bảo trì'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50207 THROW 51000,N'Manager seat history guard did not return 50207.',1;
    SET @Err=0;
    BEGIN TRY EXEC dbo.usp_Admin_Seat_Update @GheID=@Ghe2,@LoaiGhe=N'Thường',@TrangThai=N'Bảo trì'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50207 THROW 51000,N'Admin seat future-ticket guard did not return 50207.',1;
    PRINT N'PASS - manager and admin both reject a sold future seat with 50207.';

    SELECT @PromoBefore=SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo;
    SELECT @Rap=pc.RapID FROM dbo.PHONGCHIEU pc WHERE pc.PhongID=@Room;
    SELECT @RevenueBefore=COALESCE(SUM(DoanhThuThucTe),0) FROM dbo.vw_DoanhThuTheoRap WHERE RapID=@Rap;
    SELECT @PaidTwo=SoTien FROM dbo.THANHTOAN WHERE ThanhToanID=@Pay2;
    SELECT @PaidThree=SoTien FROM dbo.THANHTOAN WHERE ThanhToanID=@Pay3;
    EXEC dbo.sp_Manager_Showtime_Cancel @NguoiDungID=1,@SuatChieuID=@Suat,@LyDo=N'AUDIT3 lifecycle acceptance';
    IF EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID IN (@Don1,@Don2,@Don3,@Don4) AND TrangThai<>N'Đã hủy')
       OR EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID IN (@Don1,@Don2,@Don3,@Don4) AND TrangThai<>N'Đã hủy')
       OR EXISTS(SELECT 1 FROM dbo.THANHTOAN WHERE DonDatVeID IN (@Don2,@Don3) AND TrangThai<>N'Đã hoàn tiền')
       OR (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo)<>@PromoBefore-1
       OR (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=6)<>@User6Points
       OR (SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=7)<>@User7Points
       OR EXISTS(SELECT 1 FROM dbo.THANHTOAN WHERE DonDatVeID IN (@Don2,@Don3) AND TrangThai=N'Thành công')
        THROW 51000,N'Cancellation cascade did not restore all order, ticket, payment, points, or promo invariants.',1;
    IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Don3 AND LyDoHuy=N'AUDIT3 lifecycle acceptance'
                  AND ThongBaoHuy=N'Suất chiếu đã bị hủy, tiền sẽ được hoàn về thông qua nền tảng thanh toán')
        THROW 51000,N'Customer cancellation message or reason is missing.',1;

    IF EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.CHITIETVE cv ON cv.DonDatVeID=d.DonDatVeID WHERE s.TrangThai=N'Đã hủy' AND cv.TrangThai<>N'Đã hủy')
        THROW 51000,N'I11 failed: active ticket remains on a cancelled showtime.',1;
    IF EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE s.TrangThai=N'Đã hủy' AND d.TrangThai=N'Đã thanh toán')
        THROW 51000,N'I12 failed: paid order remains on a cancelled showtime.',1;
    PRINT N'PASS - I11=0 and I12=0.';

    SELECT @RevenueAfter=COALESCE(SUM(DoanhThuThucTe),0) FROM dbo.vw_DoanhThuTheoRap WHERE RapID=@Rap;
    IF @RevenueBefore-@RevenueAfter<>@PaidTwo+@PaidThree THROW 51000,N'Revenue did not decrease by the two refunded payments.',1;
    PRINT N'PASS - cascade, revenue reduction, refund and customer-visible cancellation message.';

    SET @Err=0;
    BEGIN TRY EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID=@Don1,@PhuongThuc=N'MOMO',@ThanhToanID=@Pay4 OUTPUT,@MaGiaoDich=@Txn OUTPUT; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50121 THROW 51000,N'Payment attempt after showtime cancellation was not rejected.',1;
    SET @Err=0;
    BEGIN TRY EXEC dbo.sp_Payment_UpdateResult @ThanhToanID=@Pay1,@TrangThaiThanhToan=N'Thành công'; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err NOT IN (50113,50121) THROW 51000,N'Late result after showtime cancellation was not rejected.',1;
    PRINT N'PASS - payment attempt and result after cancellation are rejected.';

    -- Second cancellation is the last expected-error check because XACT_ABORT rolls back the fixture transaction.
    SET @Err=0;
    BEGIN TRY EXEC dbo.sp_Manager_Showtime_Cancel @NguoiDungID=1,@SuatChieuID=@Suat; END TRY BEGIN CATCH SET @Err=ERROR_NUMBER(); END CATCH;
    IF @Err<>50119 THROW 51000,N'Second cancellation was not rejected with 50119.',1;
    PRINT N'PASS - second cancellation is rejected with 50119.';
END TRY
BEGIN CATCH
    SET @Fail=1;
    PRINT N'FAIL - test 17: '+ERROR_MESSAGE();
END CATCH;
IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
IF @Fail=1 THROW 51000,N'Test 17 failed.',1;
PRINT N'Test 17 showtime lifecycle passed.';
GO

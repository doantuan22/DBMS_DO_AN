SET NOCOUNT ON;
SET XACT_ABORT OFF;
IF DB_NAME() NOT LIKE ('CinemaBooking'+'DB_R0[_]%') AND DB_NAME()<>('CinemaBooking'+'DB_Test')
    THROW 51059,N'Staff booking tests require an isolated test database.',1;
:r ./12_verify/verify_fixed_rbac.sql
BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @Admin int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='admin1@example.test'),@Manager int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager1@example.test'),@Customer int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='customer5@example.test'),@Support int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='support1@example.test');
    DECLARE @Show int,@Room int,@Rap int,@A int,@B int,@C int,@Order int,@Price decimal(18,2),@Hold datetime2;
    SELECT TOP(1) @Show=SuatChieuID,@Room=PhongID,@Rap=RapID FROM dbo.vw_LichChieuChiTiet
    WHERE IsBookable=1 AND dbo.fn_KiemTraQuanLyRapScope(@Manager,RapID)=1 ORDER BY ThoiGianBatDau DESC;
    SELECT TOP(1) @A=g.GheID FROM dbo.GHE g WHERE g.PhongID=@Room AND g.LoaiGhe=N'VIP' AND g.TrangThai=N'Hoạt động'
      AND NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID
        WHERE t.GheID=g.GheID AND d.SuatChieuID=@Show AND t.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,dbo.fn_BayGio())=1) ORDER BY g.GheID;
    SELECT @B=MIN(GheID) FROM dbo.GHE WHERE PhongID=@Room AND LoaiGhe=N'VIP' AND GheID>@A;
    SELECT @C=MIN(GheID) FROM dbo.GHE WHERE PhongID=@Room AND LoaiGhe=N'VIP' AND GheID>@B;
    IF @Show IS NULL OR @C IS NULL THROW 51059,N'Missing bookable show and three VIP seats.',1;
    DECLARE @Seats varchar(max)=CONCAT(@A,',',@B),@Expected varchar(max),@KeepID int,@DropID int;
    EXEC dbo.sp_StaffBooking_Create @Admin,'ADMIN',@Customer,@Show,@Seats,@Order OUTPUT;
    SELECT @KeepID=VeID,@Price=GiaVe FROM dbo.CHITIETVE WHERE DonDatVeID=@Order AND GheID=@A;
    SELECT @DropID=VeID FROM dbo.CHITIETVE WHERE DonDatVeID=@Order AND GheID=@B;
    SELECT @Hold=HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID=@Order;
    SET @Expected=CONCAT(@KeepID,',',@DropID);
    UPDATE dbo.BANGGIA SET PhuThu=PhuThu+123.45 WHERE RapID=@Rap AND LoaiGhe=N'VIP' AND TrangThai=N'Áp dụng';
    SET @Seats=CONCAT(@A,',',@C);
    EXEC dbo.sp_StaffBooking_UpdateSeats @Manager,'QUAN_LY_RAP',@Order,@Seats,@Expected;
    IF NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE VeID=@KeepID AND GiaVe=@Price AND TrangThai=N'Đã đặt')
      OR NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE VeID=@DropID AND TrangThai=N'Đã hủy')
      OR NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID=@Order AND GheID=@C AND GiaVe=dbo.fn_TinhGiaVe(@Show,@C) AND TrangThai=N'Đã đặt')
      OR NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Order AND HanGiuCho=@Hold AND NguoiDungID=@Customer AND SuatChieuID=@Show AND TongTienVe=dbo.fn_TinhTongTienVe(@Order))
        THROW 51059,N'Snapshot/history/hold/owner/show changed incorrectly.',1;
    IF dbo.fn_TinhGiaVe(@Show,@A)=@Price THROW 51059,N'Pricing fixture did not change current price.',1;
    PRINT 'PASS retained ticket snapshot, new-ticket current price, canceled history, total and unchanged hold';
    DECLARE @Cases TABLE(id int IDENTITY,command nvarchar(max),expected int);
    INSERT @Cases VALUES
      (CONCAT(N'EXEC dbo.sp_StaffBooking_UpdateSeats ',@Admin,N',''ADMIN'',',@Order,N',''',@Seats,N''',''',@Expected,N''';'),50515),
      (CONCAT(N'EXEC dbo.sp_StaffBooking_Create ',@Admin,N',''ADMIN'',999999,',@Show,N',''',@A,N''',@probe OUTPUT;'),50510),
      (CONCAT(N'EXEC dbo.sp_StaffBooking_Create ',@Admin,N',''ADMIN'',',@Manager,N',',@Show,N',''',@A,N''',@probe OUTPUT;'),50510),
      (CONCAT(N'EXEC dbo.sp_StaffBooking_Create ',@Customer,N',''ADMIN'',',@Customer,N',',@Show,N',''',@A,N''',@probe OUTPUT;'),50301),
      (CONCAT(N'EXEC dbo.sp_StaffBooking_Create ',@Support,N',''QUAN_LY_RAP'',',@Customer,N',',@Show,N',''',@A,N''',@probe OUTPUT;'),50301),
      (CONCAT(N'EXEC dbo.sp_StaffBooking_Create ',@Admin,N',''ADMIN'',',@Customer,N',',@Show,N',''',@A,N',',@A,N''',@probe OUTPUT;'),50511);
    DECLARE @n int=1,@command nvarchar(max),@expectedCode int,@actualCode int;
    WHILE @n<=(SELECT COUNT(*) FROM @Cases)
    BEGIN
        SELECT @command=N'DECLARE @probe int; '+command,@expectedCode=expected FROM @Cases WHERE id=@n;
        SET @actualCode=NULL;
        BEGIN TRY EXEC sys.sp_executesql @command; END TRY
        BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
        IF ISNULL(@actualCode,0)<>@expectedCode THROW 51059,N'Staff booking SQL negative case returned wrong result.',1;
        SET @n+=1;
    END;
    PRINT 'PASS direct SP spoof/invalid Customer/duplicate seats and stale edit rejection';
    SET @Expected=(SELECT STRING_AGG(CONVERT(varchar(max),VeID),',') FROM dbo.CHITIETVE WHERE DonDatVeID=@Order AND TrangThai=N'Đã đặt');
    SAVE TRANSACTION PromotionEdit;
    UPDATE dbo.DONDATVE SET KhuyenMaiID=(SELECT TOP(1) KhuyenMaiID FROM dbo.KHUYENMAI) WHERE DonDatVeID=@Order;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_UpdateSeats @Admin,'ADMIN',@Order,@Seats,@Expected; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50512 THROW 51059,N'Promotion order permitted editing.',1;
    ROLLBACK TRANSACTION PromotionEdit;
    SAVE TRANSACTION ProductEdit;
    INSERT dbo.CHITIETDOAN(DonDatVeID,SanPhamID,SoLuong,DonGia)
        SELECT TOP(1) @Order,SanPhamID,1,Gia FROM dbo.SANPHAM;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_UpdateSeats @Manager,'QUAN_LY_RAP',@Order,@Seats,@Expected; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50512 THROW 51059,N'Product order permitted editing.',1;
    ROLLBACK TRANSACTION ProductEdit;
    PRINT 'PASS promotion/product orders remain read-only for seat editing';
    UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(second,-1,dbo.fn_BayGio()) WHERE DonDatVeID=@Order;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_UpdateSeats @Admin,'ADMIN',@Order,@Seats,@Expected; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50513 THROW 51059,N'Expired hold permitted editing.',1;
    UPDATE dbo.DONDATVE SET HanGiuCho=@Hold WHERE DonDatVeID=@Order;
    UPDATE dbo.CHITIETVE SET TrangThai=N'Đã sử dụng' WHERE VeID=@KeepID;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_UpdateSeats @Manager,'QUAN_LY_RAP',@Order,@Seats,@Expected; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50512 THROW 51059,N'Used ticket permitted seat editing.',1;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_Cancel @Admin,'ADMIN',@Order; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50512 THROW 51059,N'Used ticket permitted cancellation.',1;
    UPDATE dbo.CHITIETVE SET TrangThai=N'Đã đặt' WHERE VeID=@KeepID;
    DECLARE @Payment int,@Transaction varchar(100);
    EXEC dbo.sp_Payment_CreateAttempt @Customer,@Order,N'MOMO',@Payment OUTPUT,@Transaction OUTPUT;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_Cancel @Manager,'QUAN_LY_RAP',@Order; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50514 THROW 51059,N'In-flight payment permitted cancellation.',1;
    EXEC dbo.sp_Payment_UpdateResult @NguoiDungID=@Customer,@ThanhToanID=@Payment,@TrangThaiThanhToan=N'Thất bại';
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_UpdateSeats @Admin,'ADMIN',@Order,@Seats,@Expected; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50514 THROW 51059,N'Failed payment attempt permitted seat editing.',1;
    DECLARE @PaymentHistory nvarchar(max)=(SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@Order FOR JSON PATH);
    EXEC dbo.sp_StaffBooking_Cancel @Admin,'ADMIN',@Order;
    IF @PaymentHistory<>(SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@Order FOR JSON PATH)
      OR EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID=@Order AND TrangThai<>N'Đã hủy')
        THROW 51059,N'Cancellation removed or changed payment/ticket history.',1;
    PRINT 'PASS expired/used/in-flight refusal and failed-payment cancellation preserves payment history';
    DECLARE @ForeignShow int;
    SELECT TOP(1) @ForeignShow=SuatChieuID FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1 AND dbo.fn_KiemTraQuanLyRapScope(@Manager,RapID)=0;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_Create @Manager,'QUAN_LY_RAP',@Customer,@ForeignShow,'1',@Order OUTPUT; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50303 THROW 51059,N'Manager outside scope permitted booking.',1;
    SAVE TRANSACTION ExpiredScope;
    UPDATE dbo.PHANCONG_RAP SET NgayBatDau=DATEADD(day,-2,dbo.fn_HomNay()),NgayKetThuc=DATEADD(day,-1,dbo.fn_HomNay())
        WHERE NguoiDungID=@Manager AND RapID=@Rap AND TrangThai=N'Hiệu lực';
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_Create @Manager,'QUAN_LY_RAP',@Customer,@Show,@Seats,@Order OUTPUT; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50303 THROW 51059,N'Expired Manager assignment permitted booking.',1;
    ROLLBACK TRANSACTION ExpiredScope;
    PRINT 'PASS Manager expired assignment cannot create booking';
    UPDATE dbo.SUATCHIEU SET TrangThai=N'Đóng bán' WHERE SuatChieuID=@Show;
    SET @actualCode=NULL;
    BEGIN TRY EXEC dbo.sp_StaffBooking_Create @Admin,'ADMIN',@Customer,@Show,@Seats,@Order OUTPUT; END TRY
    BEGIN CATCH SET @actualCode=ERROR_NUMBER(); END CATCH;
    IF ISNULL(@actualCode,0)<>50022 THROW 51059,N'Closed show permitted booking.',1;
    PRINT 'PASS direct SP Manager scope and closed-show refusal';
    ROLLBACK TRANSACTION;
    PRINT 'PASS staff booking SQL regression; all fixtures rolled back';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

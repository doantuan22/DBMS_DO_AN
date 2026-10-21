/*
  Successful Admin CRUD smoke for SSMS against the protected Main database.
  All DML runs under one outer transaction and is rolled back. Do not run inside
  another user transaction. SQL Server IDENTITY counters can still advance on rollback.
*/
USE [CinemaBookingDB];
GO
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 52000,N'Wrong target; connect to DoanTuanIT/CinemaBookingDB.',1;
IF DATABASEPROPERTYEX(DB_NAME(),N'Status')<>N'ONLINE' OR @@TRANCOUNT<>0
    THROW 52001,N'Main must be ONLINE and the session must have no open transaction.',1;
SET NOCOUNT ON;
SET XACT_ABORT OFF;
DECLARE @Token varchar(32)=LEFT(REPLACE(CONVERT(varchar(36),NEWID()),'-',''),24);
DECLARE @Admin int=(SELECT TOP(1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID);
IF @Admin IS NULL THROW 52002,N'No active Admin account is available.',1;
DECLARE @Results table(TestId int IDENTITY(1,1),ObjectName sysname,Scenario nvarchar(120),Expected nvarchar(300),Actual nvarchar(1000),Verdict varchar(8));
DECLARE @ActorResult table(DienVienID int,HoTen nvarchar(150),NgaySinh date,QuocTich nvarchar(100));
DECLARE @GenreResult table(TheLoaiID int,TenTheLoai nvarchar(100));
DECLARE @ProductResult table(SanPhamID int,TenSanPham nvarchar(150),LoaiSanPham nvarchar(50),Gia decimal(18,2),MoTa nvarchar(255),HinhAnh nvarchar(500),TrangThai nvarchar(50));
DECLARE @PromotionResult table(KhuyenMaiID int,MaCode varchar(50),MoTa nvarchar(255),LoaiGiamGia nvarchar(20),GiaTriGiam decimal(18,2),DonHangToiThieu decimal(18,2),GiamToiDa decimal(18,2),NgayBatDau datetime2,NgayKetThuc datetime2,SoLuong int,SoLuongDaDung int,TrangThai nvarchar(50));
DECLARE @CinemaResult table(RapID int,TenRap nvarchar(150),DiaChi nvarchar(255),ThanhPho nvarchar(100),SoDienThoai varchar(20),MoTa nvarchar(500),NgayHoatDong date,TrangThai nvarchar(50));
DECLARE @Actor int,@Genre int,@Product int,@Promotion int,@Cinema int,@Error int;
DECLARE @ActorName nvarchar(150)=CONCAT(N'AuditActor_',@Token),@GenreName nvarchar(100)=CONCAT(N'AuditGenre_',@Token),
 @ActorNameUpdated nvarchar(150)=CONCAT(N'AuditActorU_',@Token),@GenreNameUpdated nvarchar(100)=CONCAT(N'AuditGenreU_',@Token),
 @ProductName nvarchar(150)=CONCAT(N'AuditProduct_',@Token),@ProductNameUpdated nvarchar(150)=CONCAT(N'AuditProductU_',@Token),
 @PromoCode varchar(50)=CONCAT('AUDIT',@Token),@CinemaName nvarchar(150)=CONCAT(N'AuditCinema_',@Token),@CinemaNameUpdated nvarchar(150)=CONCAT(N'AuditCinemaU_',@Token);

BEGIN TRANSACTION;
BEGIN TRY
    INSERT @ActorResult EXEC dbo.sp_Admin_Actor_Create @ActorID=@Admin,@HoTen=@ActorName,@NgaySinh=NULL,@QuocTich=N'Audit';
    SELECT TOP(1) @Actor=DienVienID FROM @ActorResult;
    IF @Actor IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID=@Actor AND HoTen=@ActorName)
        THROW 52010,N'Actor create did not persist its requested fixture.',1;
    EXEC dbo.sp_Admin_Actor_Update @ActorID=@Admin,@DienVienID=@Actor,@HoTen=@ActorNameUpdated,@NgaySinh=NULL,@QuocTich=N'Updated';
    IF NOT EXISTS(SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID=@Actor AND HoTen=@ActorNameUpdated AND QuocTich=N'Updated')
        THROW 52011,N'Actor update result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) SELECT N'sp_Admin_Actor_Create',N'successful insert',@ActorName,CONCAT(N'DienVienID=',@Actor,N'; HoTen=',HoTen),IIF(HoTen=@ActorName,'PASS','FAIL') FROM @ActorResult;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Actor_Update',N'successful update',N'updated name and nationality',CONCAT((SELECT HoTen FROM dbo.DIENVIEN WHERE DienVienID=@Actor),N' / ',(SELECT QuocTich FROM dbo.DIENVIEN WHERE DienVienID=@Actor)),'PASS');

    INSERT @GenreResult EXEC dbo.sp_Admin_Genre_Create @ActorID=@Admin,@TenTheLoai=@GenreName;
    SELECT TOP(1) @Genre=TheLoaiID FROM @GenreResult;
    IF @Genre IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID=@Genre AND TenTheLoai=@GenreName) THROW 52012,N'Genre create result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Genre_Create',N'successful insert',@GenreName,CONCAT(N'TheLoaiID=',@Genre,N'; TenTheLoai=',(SELECT TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID=@Genre)),'PASS');
    EXEC dbo.sp_Admin_Genre_Update @ActorID=@Admin,@TheLoaiID=@Genre,@TenTheLoai=@GenreNameUpdated;
    IF NOT EXISTS(SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID=@Genre AND TenTheLoai=@GenreNameUpdated) THROW 52012,N'Genre update result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Genre_Update',N'successful update',@GenreNameUpdated,(SELECT TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID=@Genre),'PASS');

    INSERT @ProductResult EXEC dbo.sp_Admin_Product_Create @ActorID=@Admin,@TenSanPham=@ProductName,@LoaiSanPham=N'Snack',@Gia=12500,@MoTa=N'rollback fixture',@HinhAnh=NULL;
    SELECT TOP(1) @Product=SanPhamID FROM @ProductResult;
    IF @Product IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID=@Product AND TenSanPham=@ProductName AND Gia=12500 AND LoaiSanPham=N'Snack') THROW 52013,N'Product create result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) SELECT N'sp_Admin_Product_Create',N'successful insert',CONCAT(@ProductName,N' / Snack / 12500'),CONCAT(TenSanPham,N' / ',LoaiSanPham,N' / ',Gia),'PASS' FROM dbo.SANPHAM WHERE SanPhamID=@Product;
    EXEC dbo.sp_Admin_Product_Update @ActorID=@Admin,@SanPhamID=@Product,@TenSanPham=@ProductNameUpdated,@LoaiSanPham=N'Combo',@Gia=15000,@MoTa=N'updated rollback fixture',@HinhAnh=NULL,@TrangThai=N'Đang bán';
    IF NOT EXISTS(SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID=@Product AND Gia=15000 AND LoaiSanPham=N'Combo') THROW 52013,N'Product update result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Product_Update',N'successful update',N'Combo at 15000',(SELECT CONCAT(LoaiSanPham,N' at ',Gia) FROM dbo.SANPHAM WHERE SanPhamID=@Product),'PASS');

    INSERT @PromotionResult EXEC dbo.sp_Admin_Promotion_Create @ActorID=@Admin,@MaCode=@PromoCode,@MoTa=N'rollback fixture',@LoaiGiamGia=N'FIXED',@GiaTriGiam=5000,@DonHangToiThieu=0,@GiamToiDa=NULL,@NgayBatDau='2040-01-01',@NgayKetThuc='2040-01-02',@SoLuong=3;
    SELECT TOP(1) @Promotion=KhuyenMaiID FROM @PromotionResult;
    IF @Promotion IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promotion AND MaCode=@PromoCode AND SoLuong=3 AND SoLuongDaDung=0) THROW 52014,N'Promotion create result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) SELECT N'sp_Admin_Promotion_Create',N'successful insert',CONCAT(N'Code=',MaCode,N'; quota=3; usage=0'),CONCAT(N'Code=',MaCode,N'; quota=',SoLuong,N'; usage=',SoLuongDaDung),'PASS' FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promotion;
    EXEC dbo.sp_Admin_Promotion_Update @ActorID=@Admin,@KhuyenMaiID=@Promotion,@MoTa=N'updated fixture',@LoaiGiamGia=N'FIXED',@GiaTriGiam=6000,@DonHangToiThieu=10000,@GiamToiDa=NULL,@NgayBatDau='2040-01-01',@NgayKetThuc='2040-01-02',@SoLuong=5,@TrangThai=N'Hoạt động';
    IF NOT EXISTS(SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promotion AND GiaTriGiam=6000 AND SoLuong=5 AND SoLuongDaDung=0) THROW 52014,N'Promotion update result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Promotion_Update',N'successful update',N'amount 6000; quota 5; usage remains 0',(SELECT CONCAT(N'amount=',GiaTriGiam,N'; quota=',SoLuong,N'; usage=',SoLuongDaDung) FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promotion),'PASS');

    INSERT @CinemaResult EXEC dbo.sp_Admin_Cinema_Create @ActorID=@Admin,@TenRap=@CinemaName,@DiaChi=N'1 Audit Street',@ThanhPho=N'Hanoi',@SoDienThoai=NULL,@MoTa=N'rollback fixture',@NgayHoatDong='2040-01-01';
    SELECT TOP(1) @Cinema=RapID FROM @CinemaResult;
    IF @Cinema IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema AND TenRap=@CinemaName AND DiaChi=N'1 Audit Street') THROW 52015,N'Cinema create result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) SELECT N'sp_Admin_Cinema_Create',N'successful insert',@CinemaName,CONCAT(N'RapID=',RapID,N'; TenRap=',TenRap),'PASS' FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema;
    EXEC dbo.sp_Admin_Cinema_Update @ActorID=@Admin,@RapID=@Cinema,@TenRap=@CinemaNameUpdated,@DiaChi=N'2 Audit Street',@ThanhPho=N'Hanoi',@SoDienThoai=NULL,@MoTa=N'updated rollback fixture',@TrangThai=N'Tạm đóng';
    IF NOT EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema AND TenRap=@CinemaNameUpdated AND TrangThai=N'Tạm đóng') THROW 52015,N'Cinema update result mismatch.',1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Cinema_Update',N'successful update',N'new name and Tạm đóng',(SELECT CONCAT(TenRap,N' / ',TrangThai) FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema),'PASS');

    EXEC dbo.sp_Admin_Actor_Delete @ActorID=@Admin,@DienVienID=@Actor;
    SET @Error=0;IF EXISTS(SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID=@Actor)SET @Error=1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Actor_Delete',N'successful delete of unassociated fixture',N'row absent',CONCAT(N'remaining=',@Error),IIF(@Error=0,'PASS','FAIL'));
    EXEC dbo.sp_Admin_Genre_Delete @ActorID=@Admin,@TheLoaiID=@Genre;
    SET @Error=0;IF EXISTS(SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID=@Genre)SET @Error=1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Genre_Delete',N'successful delete of unassigned fixture',N'row absent',CONCAT(N'remaining=',@Error),IIF(@Error=0,'PASS','FAIL'));
    EXEC dbo.sp_Admin_Product_Delete @ActorID=@Admin,@SanPhamID=@Product;
    SET @Error=0;IF EXISTS(SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID=@Product)SET @Error=1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Product_Delete',N'successful delete of unused fixture',N'row absent',CONCAT(N'remaining=',@Error),IIF(@Error=0,'PASS','FAIL'));
    EXEC dbo.sp_Admin_Promotion_Delete @ActorID=@Admin,@KhuyenMaiID=@Promotion;
    SET @Error=0;IF EXISTS(SELECT 1 FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promotion)SET @Error=1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Promotion_Delete',N'successful delete of unused fixture',N'row absent',CONCAT(N'remaining=',@Error),IIF(@Error=0,'PASS','FAIL'));
    EXEC dbo.sp_Admin_Cinema_Delete @ActorID=@Admin,@RapID=@Cinema;
    SET @Error=0;IF EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema)SET @Error=1;
    INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'sp_Admin_Cinema_Delete',N'successful delete of unreferenced fixture',N'row absent',CONCAT(N'remaining=',@Error),IIF(@Error=0,'PASS','FAIL'));

    ROLLBACK TRANSACTION;
    IF EXISTS(SELECT 1 FROM dbo.DIENVIEN WHERE HoTen=@ActorName)
       OR EXISTS(SELECT 1 FROM dbo.THELOAI WHERE TenTheLoai IN(@GenreName,@GenreNameUpdated))
       OR EXISTS(SELECT 1 FROM dbo.SANPHAM WHERE TenSanPham IN(@ProductName,@ProductNameUpdated))
       OR EXISTS(SELECT 1 FROM dbo.KHUYENMAI WHERE MaCode=@PromoCode)
       OR EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE TenRap IN(@CinemaName,@CinemaNameUpdated))
        INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'Outer transaction rollback',N'cleanup',N'no audit fixture rows remain',N'fixture rows found','FAIL');
    ELSE INSERT @Results(ObjectName,Scenario,Expected,Actual,Verdict) VALUES(N'Outer transaction rollback',N'cleanup',N'no audit fixture rows remain',N'no fixture rows; identity gaps may advance','PASS');
    SELECT TestId,ObjectName,Scenario,Expected,Actual,Verdict FROM @Results ORDER BY TestId;
    IF EXISTS(SELECT 1 FROM @Results WHERE Verdict<>'PASS') THROW 52019,N'One or more Admin CRUD assertions failed.',1;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Offline test only; all writes use existing SP and are rolled back.
SET NOCOUNT ON;
IF DB_NAME() <> 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2'
    THROW 51990, N'Wrong isolated test database; no writes authorized.', 1;
DECLARE @Actor INT, @Cinema INT, @Room INT, @Seat INT, @HistorySeat INT, @HistoryRoom INT, @OtherRoom INT, @OtherSeat INT;
SELECT TOP (1) @Actor=n.NguoiDungID, @Cinema=p.RapID
FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID JOIN dbo.PHANCONG_RAP p ON p.NguoiDungID=n.NguoiDungID
WHERE v.MaVaiTro='QUAN_LY_RAP' AND n.TrangThai=N'Hoạt động'
AND dbo.fn_KiemTraQuanLyRapScope(n.NguoiDungID,p.RapID)=1
AND dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_GHE')=1 AND dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_PHONG')=1
ORDER BY n.NguoiDungID,p.RapID;
IF @Actor IS NULL THROW 51991, N'Manager fixture unavailable.', 1;
SELECT TOP(1) @HistorySeat=g.GheID,@HistoryRoom=g.PhongID FROM dbo.GHE g JOIN dbo.PHONGCHIEU pc ON pc.PhongID=g.PhongID
WHERE pc.RapID=@Cinema AND EXISTS(SELECT 1 FROM dbo.CHITIETVE ct WHERE ct.GheID=g.GheID) ORDER BY g.GheID;
SELECT TOP(1) @OtherRoom=pc.PhongID,@OtherSeat=g.GheID FROM dbo.PHONGCHIEU pc JOIN dbo.GHE g ON g.PhongID=pc.PhongID
WHERE dbo.fn_KiemTraQuanLyRapScope(@Actor,pc.RapID)=0 ORDER BY pc.PhongID,g.GheID;
IF @HistorySeat IS NULL OR @OtherSeat IS NULL THROW 51992, N'History/outside-scope fixtures unavailable.', 1;

DECLARE @Name NVARCHAR(100)=N'UXR3_'+LEFT(CONVERT(NVARCHAR(36),NEWID()),24);
BEGIN TRY
  BEGIN TRANSACTION;
  EXEC dbo.sp_Manager_Room_Create @NguoiDungID=@Actor,@RapID=@Cinema,@TenPhong=@Name,@LoaiPhong=N'2D';
  SELECT @Room=PhongID FROM dbo.PHONGCHIEU WHERE RapID=@Cinema AND TenPhong=@Name;
  IF @Room IS NULL THROW 51993, N'Room creation failed.', 1;
  EXEC dbo.sp_Manager_Seat_Create @NguoiDungID=@Actor,@PhongID=@Room,@HangGhe='UXR3',@SoGhe=1,@LoaiGhe=N'Thường';
  SELECT @Seat=GheID FROM dbo.GHE WHERE PhongID=@Room AND HangGhe='UXR3' AND SoGhe=1;
  IF @Seat IS NULL THROW 51994, N'Seat creation failed.', 1;
  EXEC dbo.sp_Manager_Seat_Update @NguoiDungID=@Actor,@GheID=@Seat,@LoaiGhe=N'VIP',@TrangThai=N'Bảo trì';
  IF NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@Seat AND LoaiGhe=N'VIP' AND TrangThai=N'Bảo trì') THROW 51995, N'Seat update did not persist.', 1;
  EXEC dbo.sp_Manager_Seat_ListByRoom @NguoiDungID=@Actor,@PhongID=@Room;
  DECLARE @RoomList TABLE(PhongID INT,RapID INT,TenRap NVARCHAR(150),TenPhong NVARCHAR(100),LoaiPhong NVARCHAR(50),TrangThai NVARCHAR(50),TongSoGhe INT);
  INSERT @RoomList EXEC dbo.sp_Manager_Room_List @NguoiDungID=@Actor,@RapID=@Cinema;
  IF NOT EXISTS(SELECT 1 FROM @RoomList WHERE PhongID=@Room AND TongSoGhe=(SELECT COUNT(*) FROM dbo.GHE WHERE PhongID=@Room)) THROW 51979,N'Room seat count mismatch.',1;
  EXEC dbo.sp_Manager_Seat_Delete @NguoiDungID=@Actor,@GheID=@Seat;
  IF EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@Seat) THROW 51996, N'Valid seat deletion failed.', 1;
  EXEC dbo.sp_Manager_Room_Delete @NguoiDungID=@Actor,@PhongID=@Room;
  IF EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@Room) THROW 51997, N'Valid room deletion failed.', 1;
  ROLLBACK TRANSACTION;
  IF EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID=@Cinema AND TenPhong=@Name) THROW 51998, N'Rollback cleanup failed.', 1;
  SELECT 'PASS' AS Verdict,'Manager room/seat create, update, scoped list/count, delete, rollback cleanup' AS TestCase;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;

DECLARE @OldType NVARCHAR(50)=(SELECT LoaiGhe FROM dbo.GHE WHERE GheID=@HistorySeat), @OldStatus NVARCHAR(50)=(SELECT TrangThai FROM dbo.GHE WHERE GheID=@HistorySeat);
DECLARE @NewType NVARCHAR(50)=CASE WHEN @OldType=N'VIP' THEN N'Thường' ELSE N'VIP' END, @Rejected BIT=0;
BEGIN TRANSACTION;
BEGIN TRY
  EXEC dbo.sp_Manager_Seat_Update @NguoiDungID=@Actor,@GheID=@HistorySeat,@LoaiGhe=@NewType,@TrangThai=@OldStatus;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50207 BEGIN IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END;
  SET @Rejected=1;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
IF @Rejected=0 THROW 51980,N'Historical type change was not rejected.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@HistorySeat AND LoaiGhe=@OldType AND TrangThai=@OldStatus) THROW 51981,N'Historical seat changed after rejection.',1;
SELECT 'PASS' AS Verdict,'Manager historical seat type update rejected 50207; row unchanged' AS TestCase;

SET @Rejected=0;
BEGIN TRANSACTION;
BEGIN TRY
  EXEC dbo.sp_Manager_Seat_Delete @NguoiDungID=@Actor,@GheID=@HistorySeat;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50110 BEGIN IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END;
  SET @Rejected=1;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
IF @Rejected=0 OR NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@HistorySeat) THROW 51982,N'Historical delete protection failed.',1;
SELECT 'PASS' AS Verdict,'Manager historical seat delete rejected 50110; row retained' AS TestCase;

SET @Rejected=0;
BEGIN TRY
  EXEC dbo.sp_Manager_Seat_ListByRoom @NguoiDungID=@Actor,@PhongID=@OtherRoom;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50050 THROW;
  SET @Rejected=1;
END CATCH;
IF @Rejected=0 THROW 51983,N'Outside-assignment read allowed.',1;
SELECT 'PASS' AS Verdict,'Forged outside-assignment room read rejected 50050' AS TestCase;

SET @Rejected=0;
BEGIN TRANSACTION;
BEGIN TRY
  EXEC dbo.sp_Manager_Seat_Update @NguoiDungID=@Actor,@GheID=@OtherSeat,@LoaiGhe=N'Thường',@TrangThai=N'Hoạt động';
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50050 BEGIN IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END;
  SET @Rejected=1;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
IF @Rejected=0 THROW 51984,N'Outside-assignment update allowed.',1;
SELECT 'PASS' AS Verdict,'Forged outside-assignment seat update rejected 50050' AS TestCase;

DECLARE @RoomStatus NVARCHAR(50)=(SELECT TrangThai FROM dbo.PHONGCHIEU WHERE PhongID=@HistoryRoom);
BEGIN TRY
  BEGIN TRANSACTION;
  EXEC dbo.sp_Manager_Room_Delete @NguoiDungID=@Actor,@PhongID=@HistoryRoom;
  IF NOT EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@HistoryRoom AND TrangThai=N'Ngưng hoạt động') THROW 51985,N'Room history not retained/deactivated.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@HistorySeat) THROW 51986,N'History seat lost during room deactivation.',1;
  ROLLBACK TRANSACTION;
  IF NOT EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@HistoryRoom AND TrangThai=@RoomStatus) THROW 51987,N'Room status rollback failed.',1;
  SELECT 'PASS' AS Verdict,'Historical room deactivated, seats retained; original status restored by rollback' AS TestCase;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
SELECT 'PASS' AS Verdict,'All offline writes rolled back; no schema or RBAC changes' AS TestCase;

DECLARE @Admin INT;
SELECT TOP(1) @Admin=n.NguoiDungID FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID
WHERE v.MaVaiTro='ADMIN' AND n.TrangThai=N'Hoạt động' AND dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_RAP')=1
AND dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_PHONG')=1 AND dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_GHE')=1;
IF @Admin IS NULL THROW 51978,N'Authorized Admin fixture unavailable; no grants permitted.',1;
SET @Rejected=0;
BEGIN TRANSACTION;
BEGIN TRY
  EXEC dbo.usp_Admin_Seat_Update @ActorID=@Admin,@GheID=@HistorySeat,@LoaiGhe=@NewType,@TrangThai=@OldStatus;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50207 BEGIN IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END;
  SET @Rejected=1;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
IF @Rejected=0 OR NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@HistorySeat AND LoaiGhe=@OldType AND TrangThai=@OldStatus) THROW 51977,N'Admin history type update protection failed.',1;
SELECT 'PASS' AS Verdict,'Admin historical seat type update rejected 50207; row unchanged' AS TestCase;

SET @Rejected=0;
BEGIN TRANSACTION;
BEGIN TRY
  EXEC dbo.usp_Admin_Seat_Delete @ActorID=@Admin,@GheID=@HistorySeat;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50207 BEGIN IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END;
  SET @Rejected=1;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
IF @Rejected=0 OR NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@HistorySeat) THROW 51976,N'Admin historical delete protection failed.',1;
SELECT 'PASS' AS Verdict,'Admin historical seat delete rejected 50207; row retained' AS TestCase;

SET @Rejected=0;
BEGIN TRY
  EXEC dbo.usp_Admin_Seat_List @ActorID=@Actor,@PhongID=@HistoryRoom;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50301 THROW;
  SET @Rejected=1;
END CATCH;
IF @Rejected=0 THROW 51975,N'Foreign role admitted to Admin seat SP.',1;
SELECT 'PASS' AS Verdict,'Manager actor denied by Admin role guard 50301' AS TestCase;

SET @Rejected=0;
BEGIN TRANSACTION;
BEGIN TRY
  EXEC dbo.sp_Admin_Cinema_Delete @ActorID=@Admin,@RapID=@Cinema;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER()<>50096 BEGIN IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END;
  SET @Rejected=1;
END CATCH;
IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
IF @Rejected=0 OR NOT EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema) THROW 51974,N'Cinema dependency protection failed.',1;
SELECT 'PASS' AS Verdict,'Cinema with dependent history rejected 50096, retained' AS TestCase;

DECLARE @NewCinema INT,@Image1 INT,@Image2 INT,@CinemaName NVARCHAR(150)=N'UXR3_'+LEFT(CONVERT(NVARCHAR(36),NEWID()),24);
BEGIN TRY
  BEGIN TRANSACTION;
  EXEC dbo.sp_Admin_Cinema_Create @ActorID=@Admin,@TenRap=@CinemaName,@DiaChi=N'UXR3 rollback fixture',@ThanhPho=N'Test';
  SELECT @NewCinema=RapID FROM dbo.RAPCHIEUPHIM WHERE TenRap=@CinemaName;
  IF @NewCinema IS NULL THROW 51973,N'Cinema creation failed.',1;
  EXEC dbo.sp_Admin_Cinema_Update @ActorID=@Admin,@RapID=@NewCinema,@TenRap=@CinemaName,@DiaChi=N'Updated fixture',@ThanhPho=N'Test',@SoDienThoai=NULL,@MoTa=NULL,@TrangThai=N'Bảo trì';
  IF NOT EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@NewCinema AND TrangThai=N'Bảo trì') THROW 51972,N'Cinema update failed.',1;
  EXEC dbo.usp_Admin_Room_Create @ActorID=@Admin,@RapID=@NewCinema,@TenPhong=@Name,@LoaiPhong=N'2D';
  SELECT @Room=PhongID FROM dbo.PHONGCHIEU WHERE RapID=@NewCinema AND TenPhong=@Name;
  EXEC dbo.usp_Admin_Seat_Create @ActorID=@Admin,@PhongID=@Room,@HangGhe='UXR3',@SoGhe=1,@LoaiGhe=N'Thường';
  SELECT @Seat=GheID FROM dbo.GHE WHERE PhongID=@Room AND HangGhe='UXR3';
  EXEC dbo.usp_Admin_Seat_Update @ActorID=@Admin,@GheID=@Seat,@LoaiGhe=N'VIP',@TrangThai=N'Bảo trì';
  IF NOT EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@Seat AND LoaiGhe=N'VIP' AND TrangThai=N'Bảo trì') THROW 51971,N'Admin seat update failed.',1;
  DECLARE @AdminRooms TABLE(PhongID INT,RapID INT,TenRap NVARCHAR(150),TenPhong NVARCHAR(100),LoaiPhong NVARCHAR(50),TrangThai NVARCHAR(50),TongSoGhe INT);
  INSERT @AdminRooms EXEC dbo.usp_Admin_Room_List @ActorID=@Admin,@RapID=@NewCinema;
  IF NOT EXISTS(SELECT 1 FROM @AdminRooms WHERE PhongID=@Room AND TongSoGhe=1) THROW 51970,N'Admin scope/count mismatch.',1;
  EXEC dbo.usp_Admin_CinemaImage_Create @ActorID=@Admin,@RapID=@NewCinema,@URL=N'/uxr3-test-image-1.svg',@LaAnhDaiDien=1,@ThuTuHienThi=1;
  SELECT @Image1=HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@NewCinema AND URL=N'/uxr3-test-image-1.svg';
  EXEC dbo.usp_Admin_CinemaImage_Create @ActorID=@Admin,@RapID=@NewCinema,@URL=N'/uxr3-test-image-2.svg',@LaAnhDaiDien=0,@ThuTuHienThi=2;
  SELECT @Image2=HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@NewCinema AND URL=N'/uxr3-test-image-2.svg';
  EXEC dbo.usp_Admin_CinemaImage_SetCover @ActorID=@Admin,@RapID=@NewCinema,@HinhAnhRapID=@Image2;
  IF (SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@NewCinema AND LaAnhDaiDien=1)<>1 OR NOT EXISTS(SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID=@Image2 AND LaAnhDaiDien=1) THROW 51969,N'Cover ownership failed.',1;
  EXEC dbo.usp_Admin_CinemaImage_Update @ActorID=@Admin,@RapID=@NewCinema,@HinhAnhRapID=@Image2,@URL=N'/uxr3-test-image-2.svg',@MoTa=N'Test caption',@ThuTuHienThi=9,@TrangThai=N'Tạm ẩn';
  IF NOT EXISTS(SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID=@Image2 AND LaAnhDaiDien=0 AND ThuTuHienThi=9 AND TrangThai=N'Tạm ẩn') THROW 51968,N'Image order/status/cover rules failed.',1;
  EXEC dbo.usp_Admin_CinemaImage_Delete @ActorID=@Admin,@RapID=@NewCinema,@HinhAnhRapID=@Image1;
  EXEC dbo.usp_Admin_CinemaImage_Delete @ActorID=@Admin,@RapID=@NewCinema,@HinhAnhRapID=@Image2;
  EXEC dbo.usp_Admin_Seat_Delete @ActorID=@Admin,@GheID=@Seat;
  EXEC dbo.usp_Admin_Room_Delete @ActorID=@Admin,@PhongID=@Room;
  EXEC dbo.sp_Admin_Cinema_Delete @ActorID=@Admin,@RapID=@NewCinema;
  IF EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID=@NewCinema) OR EXISTS(SELECT 1 FROM dbo.GHE WHERE GheID=@Seat) OR EXISTS(SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@NewCinema) THROW 51967,N'Valid cleanup SP failed.',1;
  ROLLBACK TRANSACTION;
  IF EXISTS(SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE TenRap=@CinemaName) THROW 51966,N'Admin rollback cleanup failed.',1;
  SELECT 'PASS' AS Verdict,'Admin cinema/room/seat CRUD, scope/count, image create/update/delete/cover/order/status; rollback cleanup' AS TestCase;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
SELECT 'PASS' AS Verdict,'Final transaction count zero' AS TestCase WHERE @@TRANCOUNT=0;

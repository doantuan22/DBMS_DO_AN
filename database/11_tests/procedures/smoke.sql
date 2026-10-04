USE CinemaBookingDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
BEGIN TRY
 DECLARE @User int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com');
 DECLARE @Manager int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn');
 DECLARE @Support int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='cskh@cinemadb.vn');
 DECLARE @Show int,@Movie int,@Room int,@Cinema int,@Seat int,@Order int,@Payment int,@Reference varchar(100),@SeatList varchar(max);
 SELECT TOP(1) @Show=s.SuatChieuID,@Movie=s.PhimID,@Room=s.PhongID,@Cinema=p.RapID
 FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID
 WHERE s.TrangThai=N'Mở bán' AND s.ThoiGianBatDau>dbo.fn_BayGio() ORDER BY s.SuatChieuID;
 SELECT TOP(1) @Seat=GheID FROM dbo.GHE WHERE PhongID=@Room AND TrangThai=N'Hoạt động' ORDER BY GheID;
 IF @Show IS NULL OR @Seat IS NULL THROW 51010, 'Future show/seat fixture required: reset with current SeedDate.', 1;
 SET @SeatList=CONVERT(varchar(20),@Seat);
 EXEC dbo.sp_System_HealthCheck;
 EXEC dbo.sp_Auth_Login @Email='khachhang1@gmail.com';
 EXEC dbo.sp_User_GetCurrent @NguoiDungID=@User;
 EXEC dbo.sp_RBAC_GetPermissionsByUser @NguoiDungID=@User;
 EXEC dbo.sp_Movie_List;
 EXEC dbo.sp_Movie_GetDetail @PhimID=@Movie;
 EXEC dbo.sp_Cinema_List;
 EXEC dbo.sp_Cinema_GetImages @RapID=@Cinema;
 EXEC dbo.sp_Showtime_ListByMovie @PhimID=@Movie;
 EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@Show;
 EXEC dbo.sp_Seat_ListByShowtime @SuatChieuID=@Show;
 EXEC dbo.sp_Product_ListActive;
 EXEC dbo.sp_Booking_Create @NguoiDungID=@User,@SuatChieuID=@Show,@DanhSachGheId=@SeatList,@NewDonDatVeID=@Order OUTPUT;
 IF @Order IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Order AND HanGiuCho IS NOT NULL AND TongTienVe>0)
  THROW 51011, 'Booking output/amount/hold contract failed.', 1;
 EXEC dbo.sp_Payment_CreateAttempt @NguoiDungID=@User,@DonDatVeID=@Order,@PhuongThuc=N'VNPAY',@ThanhToanID=@Payment OUTPUT,@MaGiaoDich=@Reference OUTPUT;
 IF @Payment IS NULL OR @Reference IS NULL THROW 51011, 'Payment output parameters missing.', 1;
 EXEC dbo.sp_Payment_UpdateResult @NguoiDungID=@User,@ThanhToanID=@Payment,@TrangThaiThanhToan=N'Thành công';
 IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@Order AND TrangThai=N'Đã thanh toán') THROW 51011, 'Successful payment order contract failed.', 1;
 EXEC dbo.sp_Order_ListByCustomer @NguoiDungID=@User;
 EXEC dbo.sp_Order_GetDetailByCustomer @NguoiDungID=@User,@DonDatVeID=@Order;
 EXEC dbo.sp_Complaint_Create @NguoiDungID=@User,@DonDatVeID=@Order,@LoaiKhieuNai=N'Hỗ trợ',@TieuDe=N'R0 rollback fixture',@NoiDung=N'Contract smoke, rolled back';
 DECLARE @Complaint int=(SELECT MAX(KhieuNaiID) FROM dbo.KHIEUNAI WHERE NguoiDungID=@User);
 EXEC dbo.sp_Complaint_ListByCustomer @NguoiDungID=@User;
 EXEC dbo.sp_Complaint_GetByCustomer @NguoiDungID=@User,@KhieuNaiID=@Complaint;
 EXEC dbo.sp_Support_Complaint_List @NguoiDungID=@Support;
 EXEC dbo.sp_Support_Complaint_GetDetail @NguoiDungID=@Support,@KhieuNaiID=@Complaint;
 EXEC dbo.sp_Manager_ListAssignedCinemas @NguoiDungID=@Manager;
 EXEC dbo.sp_Manager_Room_List @NguoiDungID=@Manager,@RapID=@Cinema;
 EXEC dbo.sp_Manager_Showtime_List @NguoiDungID=@Manager,@RapID=@Cinema;
 EXEC dbo.sp_Manager_Dashboard @NguoiDungID=@Manager,@RapID=@Cinema;
 EXEC dbo.sp_Manager_Revenue @NguoiDungID=@Manager,@RapID=@Cinema;
 DECLARE @Admin INT=(SELECT TOP(1) nd.NguoiDungID FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID WHERE vt.MaVaiTro='ADMIN');
 EXEC dbo.sp_Admin_User_List @ActorID=@Admin;
 EXEC dbo.sp_Admin_Dashboard @ActorID=@Admin;
 EXEC dbo.sp_Admin_Report_Revenue @ActorID=@Admin;
 -- Separate legitimate watched fixture, not imported historical/audit data.
 DECLARE @PastShow int=(SELECT TOP(1) SuatChieuID FROM dbo.SUATCHIEU WHERE TrangThai=N'Hoàn thành' ORDER BY SuatChieuID);
 DECLARE @PastRoom int=(SELECT PhongID FROM dbo.SUATCHIEU WHERE SuatChieuID=@PastShow);
 DECLARE @PastMovie int=(SELECT PhimID FROM dbo.SUATCHIEU WHERE SuatChieuID=@PastShow);
 DECLARE @PastSeat int=(SELECT TOP(1) GheID FROM dbo.GHE WHERE PhongID=@PastRoom ORDER BY GheID);
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai)
 VALUES(@User,@PastShow,80000,0,0,N'Đã thanh toán');
 DECLARE @PastOrder int=SCOPE_IDENTITY();
 INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe,TrangThai) VALUES(@PastOrder,@PastSeat,80000,CONVERT(varchar(36),NEWID()),N'Đã sử dụng');
 EXEC dbo.sp_Review_Create @NguoiDungID=@User,@PhimID=@PastMovie,@SoSao=5,@NoiDung=N'R0 rollback review';
 EXEC dbo.sp_Review_ListByMovie @PhimID=@PastMovie;
 ROLLBACK TRANSACTION;
 PRINT 'PASS auth/public/showtime/seat/booking/payment/order/review/complaint/manager/support/admin/report smoke; writes rolled back';
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @error int;
BEGIN TRANSACTION;
BEGIN TRY
 DECLARE @User int=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang2@gmail.com');
 DECLARE @Show int=(SELECT TOP(1) SuatChieuID FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' ORDER BY SuatChieuID);
 DECLARE @Room int=(SELECT PhongID FROM dbo.SUATCHIEU WHERE SuatChieuID=@Show);
 DECLARE @Valid int=(SELECT TOP(1) GheID FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID);
 DECLARE @Wrong int=(SELECT TOP(1) GheID FROM dbo.GHE WHERE PhongID<>@Room ORDER BY GheID);
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TrangThai,HanGiuCho) VALUES(@User,@Show,N'Chờ thanh toán',DATEADD(MINUTE,5,dbo.fn_BayGio()));
 DECLARE @Order int=SCOPE_IDENTITY();
 INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe)
 VALUES(@Order,@Valid,80000,CONVERT(varchar(36),NEWID())),(@Order,@Wrong,80000,CONVERT(varchar(36),NEWID()));
END TRY
BEGIN CATCH
 SET @error=ERROR_NUMBER();
END CATCH;
IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
IF ISNULL(@error,0)<>50002 THROW 51013, 'Multirow ticket room trigger did not reject the invalid second row.', 1;
PRINT 'PASS ticket room trigger checks all inserted rows';
GO
DECLARE @error int;
BEGIN TRANSACTION;
BEGIN TRY
 DECLARE @Movie int=(SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID);
 DECLARE @Room int=(SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU ORDER BY PhongID);
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,GiaVeCoBan)
 VALUES(@Movie,@Room,'2040-01-01 10:00','2040-01-01 13:00',80000),(@Movie,@Room,'2040-01-01 11:00','2040-01-01 14:00',80000);
END TRY
BEGIN CATCH
 SET @error=ERROR_NUMBER();
END CATCH;
IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
IF ISNULL(@error,0)<>50001 THROW 51013, 'Multirow showtime overlap trigger did not reject overlapping inserted rows.', 1;
PRINT 'PASS showtime overlap trigger checks all inserted rows';
GO

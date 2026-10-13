-- Owned IDs and baseline values are captured by this exclusive, empty-target run.
-- Never delete seed rows, an existing R5 fixture, or any main database data.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE NOT EXISTS(
 SELECT 1 FROM OPENJSON(@Orders) ids WHERE CONVERT(int,ids.value)=d.DonDatVeID))
 THROW 51060,'Unknown order: refuse fixture cleanup.',1;
DELETE t FROM dbo.THANHTOAN t JOIN OPENJSON(@Orders) ids ON CONVERT(int,ids.value)=t.DonDatVeID;
DELETE t FROM dbo.CHITIETDOAN t JOIN OPENJSON(@Orders) ids ON CONVERT(int,ids.value)=t.DonDatVeID;
DELETE t FROM dbo.CHITIETVE t JOIN OPENJSON(@Orders) ids ON CONVERT(int,ids.value)=t.DonDatVeID;
DELETE d FROM dbo.DONDATVE d JOIN OPENJSON(@Orders) ids ON CONVERT(int,ids.value)=d.DonDatVeID;
UPDATE h SET DiemTichLuy=b.DiemTichLuy FROM dbo.HOSOKHACHHANG h
JOIN OPENJSON(@Customers) WITH(NguoiDungID int,DiemTichLuy int) b ON b.NguoiDungID=h.NguoiDungID;
UPDATE p SET TrangThai=b.TrangThai,SoLuong=b.SoLuong,SoLuongDaDung=b.SoLuongDaDung FROM dbo.KHUYENMAI p
JOIN OPENJSON(@Promotions) WITH(KhuyenMaiID int,TrangThai nvarchar(50),SoLuong int,SoLuongDaDung int) b ON b.KhuyenMaiID=p.KhuyenMaiID;
UPDATE p SET TrangThai=b.TrangThai FROM dbo.GHE p
JOIN OPENJSON(@Seats) WITH(GheID int,TrangThai nvarchar(50)) b ON b.GheID=p.GheID;
UPDATE p SET TrangThai=b.TrangThai FROM dbo.RAPCHIEUPHIM p
JOIN OPENJSON(@Cinemas) WITH(RapID int,TrangThai nvarchar(50)) b ON b.RapID=p.RapID;
UPDATE p SET TrangThai=b.TrangThai FROM dbo.PHONGCHIEU p
JOIN OPENJSON(@Rooms) WITH(PhongID int,TrangThai nvarchar(50)) b ON b.PhongID=p.PhongID;
UPDATE p SET TrangThai=b.TrangThai FROM dbo.PHIM p
JOIN OPENJSON(@Movies) WITH(PhimID int,TrangThai nvarchar(50)) b ON b.PhimID=p.PhimID;
COMMIT;

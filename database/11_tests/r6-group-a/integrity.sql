-- Executed after every scenario, BEFORE cleanup.
IF EXISTS(
 SELECT d.SuatChieuID,v.GheID FROM dbo.CHITIETVE v
 JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID
 WHERE v.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,dbo.fn_BayGio())=1
 GROUP BY d.SuatChieuID,v.GheID HAVING COUNT(*)>1)
 THROW 51060,'R6 seat uniqueness violated.',1;
IF EXISTS(SELECT 1 FROM dbo.KHUYENMAI WHERE SoLuongDaDung<0 OR SoLuongDaDung>SoLuong)
 THROW 51060,'R6 promotion quota violated.',1;
IF EXISTS(SELECT NguoiDungID FROM dbo.DONDATVE
 WHERE TrangThai=N'Chờ thanh toán' AND HanGiuCho>dbo.fn_BayGio()
 GROUP BY NguoiDungID HAVING COUNT(*)>dbo.fn_GioiHanDonDangGiu())
 THROW 51060,'R6 customer hold limit violated.',1;
IF EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE
 d.TongTienVe<>ISNULL((SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID),0)
 OR d.TongTienDoAn<>ISNULL((SELECT SUM(f.SoLuong*f.DonGia) FROM dbo.CHITIETDOAN f WHERE f.DonDatVeID=d.DonDatVeID),0)
 OR d.TongTienVe+d.TongTienDoAn-d.TienGiamGia<=0
 OR NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID))
 THROW 51060,'R6 incomplete order or monetary snapshot violated.',1;
IF EXISTS(SELECT 1 FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID
 JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.GHE g ON g.GheID=v.GheID WHERE g.PhongID<>s.PhongID)
 THROW 51060,'R6 ticket room violated.',1;
IF EXISTS(SELECT 1 FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID
 WHERE t.SoTien<>d.TongTienVe+d.TongTienDoAn-d.TienGiamGia)
 THROW 51060,'R6 authoritative payment amount violated.',1;
IF EXISTS(SELECT DonDatVeID FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công'
 GROUP BY DonDatVeID HAVING COUNT(*)>1)
 THROW 51060,'R6 duplicate payment completion violated.',1;
IF EXISTS(SELECT 1 FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID
 WHERE t.TrangThai=N'Thành công' AND (d.TrangThai<>N'Đã thanh toán' OR d.HanGiuCho IS NOT NULL OR t.NgayThanhToan IS NULL))
 OR EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.TrangThai=N'Đã thanh toán'
 AND NOT EXISTS(SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công'))
 THROW 51060,'R6 payment/order state inconsistency.',1;
IF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1)
 OR EXISTS(SELECT 1 FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1)
 OR EXISTS(SELECT 1 FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1)
 THROW 51060,'R6 database protections disabled.',1;
DECLARE @Tran int=@@TRANCOUNT,@Xact int=XACT_STATE();
IF @Tran<>0 OR @Xact<>0 THROW 51060,'R6 test session leaked a transaction.',1;
SELECT N'PASS' status,N'seats/quota/holds/atomicity/money/payment/constraints' invariants;

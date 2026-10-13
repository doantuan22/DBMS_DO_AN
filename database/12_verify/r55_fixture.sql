-- Immediate post-commit assertions on the R5.4 dataset. No mutation.
SET NOCOUNT ON;
IF DB_NAME() <> CONVERT(nvarchar(128), SESSION_CONTEXT(N'R54DisposableTarget')) OR SESSION_CONTEXT(N'R54DisposableTarget') IS NULL
    THROW 51055, 'Fixture verification requires its confirmed test session.', 1;
IF DB_NAME() <> N'CinemaBookingDB_Test' AND DB_NAME() NOT LIKE N'CinemaBookingDB[_]R0[_]%'
    THROW 51055, 'Fixture verification refuses main.', 1;
IF @@TRANCOUNT <> 0 OR XACT_STATE() <> 0 THROW 51055, 'Positive commit left an open transaction.', 1;
DECLARE @Counts TABLE (TableName sysname, Expected int, Actual int);
INSERT @Counts VALUES
('DONDATVE',6,(SELECT COUNT(*) FROM dbo.DONDATVE)), ('CHITIETVE',7,(SELECT COUNT(*) FROM dbo.CHITIETVE)),
('CHITIETDOAN',5,(SELECT COUNT(*) FROM dbo.CHITIETDOAN)), ('THANHTOAN',4,(SELECT COUNT(*) FROM dbo.THANHTOAN)),
('DANHGIAPHIM',1,(SELECT COUNT(*) FROM dbo.DANHGIAPHIM)), ('KHIEUNAI',5,(SELECT COUNT(*) FROM dbo.KHIEUNAI)),
('XULY_KHIEUNAI',7,(SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI)), ('BOITHUONG_HUYSUAT',1,(SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT));
IF EXISTS (SELECT 1 FROM @Counts WHERE Expected <> Actual) THROW 51055, 'Committed fixture count mismatch.', 1;
IF (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Chờ thanh toán' AND HanGiuCho>dbo.fn_BayGio()) <> 1
   OR (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã thanh toán') <> 2
   OR (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Hết hạn') <> 1
   OR (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã hủy') <> 2
    THROW 51055, 'Immediate committed order states/live pending mismatch.', 1;
IF EXISTS (SELECT 1 FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID
    WHERE t.SoTien <> d.TongTienVe+d.TongTienDoAn-d.TienGiamGia)
   OR EXISTS (SELECT DonDatVeID FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công' GROUP BY DonDatVeID HAVING COUNT(*)>1)
   OR (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thất bại') <> 1
   OR (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công') <> 3
    THROW 51055, 'Committed payment snapshot/attempt history mismatch.', 1;
IF EXISTS (SELECT d.SuatChieuID,v.GheID FROM dbo.DONDATVE d JOIN dbo.CHITIETVE v ON v.DonDatVeID=d.DonDatVeID
    WHERE v.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,dbo.fn_BayGio())=1 GROUP BY d.SuatChieuID,v.GheID HAVING COUNT(*)>1)
   OR EXISTS (SELECT 1 FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.TrangThai IN (N'Đã hủy',N'Hết hạn') AND v.TrangThai<>N'Đã hủy')
    THROW 51055, 'Committed seat ownership/canceled ticket mismatch.', 1;
IF EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
    CROSS APPLY dbo.fn_TinhBoiThuongVe(d.TongTienVe,d.TongTienDoAn,d.TienGiamGia) expected
    WHERE b.DiemBoiThuong<>expected.DiemCong OR d.TrangThai<>N'Đã hủy' OR s.TrangThai<>N'Đã hủy'
       OR NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID AND t.TrangThai=N'Thành công'))
    THROW 51055, 'Committed compensation/payment history mismatch.', 1;
IF EXISTS (SELECT 1 FROM dbo.KHIEUNAI k JOIN dbo.DONDATVE d ON d.DonDatVeID=k.DonDatVeID WHERE k.NguoiDungID<>d.NguoiDungID)
   OR EXISTS (SELECT 1 FROM dbo.KHIEUNAI k OUTER APPLY (SELECT TOP(1) TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI x WHERE x.KhieuNaiID=k.KhieuNaiID ORDER BY XuLyID DESC) latest WHERE k.TrangThai<>COALESCE(latest.TrangThaiSauXuLy,N'Mới'))
    THROW 51055, 'Committed complaint ownership/latest status mismatch.', 1;
SELECT N'R55-FIXTURE-COUNTS' AS TestID,TableName,Expected,Actual,N'PASS' AS Result FROM @Counts;
SELECT N'R55-ORDER-STATES' AS TestID,TrangThai,COUNT(*) AS Actual FROM dbo.DONDATVE GROUP BY TrangThai ORDER BY TrangThai;
PRINT 'PASS R55 immediate fixture verification; pending is checked before long tests';
GO

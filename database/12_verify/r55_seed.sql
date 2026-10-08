-- Read-only assertions for a fresh R5.5 test seed; not included in canonical seed.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> CONVERT(nvarchar(128), SESSION_CONTEXT(N'R55Target'))
   OR SESSION_CONTEXT(N'R55Target') IS NULL
    THROW 51055, 'R5.5 verification requires the explicit current test target.', 1;
IF DB_NAME() <> N'CinemaBookingDB_Test' AND DB_NAME() NOT LIKE N'CinemaBookingDB[_]R0[_]%'
    THROW 51055, 'R5.5 verification refuses main.', 1;
IF @@TRANCOUNT <> 0 THROW 51055, 'Seed verification found an open transaction.', 1;
DECLARE @Now datetime2(7) = dbo.fn_BayGio(), @Day date = TRY_CONVERT(date, SESSION_CONTEXT(N'R55SeedDate'));
IF @Day IS NULL OR @Day <> dbo.fn_NgayKinhDoanh(@Now)
    THROW 51055, 'DB business day crossed the seed anchor; stop and review before rebuilding.', 1;
DECLARE @Counts TABLE (TableName sysname PRIMARY KEY, Expected int, Actual int);
INSERT @Counts VALUES
('VAITRO',4,(SELECT COUNT(*) FROM dbo.VAITRO)), ('QUYEN',23,(SELECT COUNT(*) FROM dbo.QUYEN)),
('VAITRO_QUYEN',40,(SELECT COUNT(*) FROM dbo.VAITRO_QUYEN)), ('NGUOIDUNG',8,(SELECT COUNT(*) FROM dbo.NGUOIDUNG)),
('HOSOKHACHHANG',4,(SELECT COUNT(*) FROM dbo.HOSOKHACHHANG)), ('PHANCONG_RAP',2,(SELECT COUNT(*) FROM dbo.PHANCONG_RAP)),
('RAPCHIEUPHIM',3,(SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM)), ('PHONGCHIEU',6,(SELECT COUNT(*) FROM dbo.PHONGCHIEU)),
('GHE',240,(SELECT COUNT(*) FROM dbo.GHE)), ('THELOAI',7,(SELECT COUNT(*) FROM dbo.THELOAI)),
('DIENVIEN',6,(SELECT COUNT(*) FROM dbo.DIENVIEN)), ('PHIM',4,(SELECT COUNT(*) FROM dbo.PHIM)),
('PHIM_THELOAI',7,(SELECT COUNT(*) FROM dbo.PHIM_THELOAI)), ('PHIM_DIENVIEN',4,(SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN)),
('BANGGIA',7,(SELECT COUNT(*) FROM dbo.BANGGIA)), ('SANPHAM',5,(SELECT COUNT(*) FROM dbo.SANPHAM)),
('KHUYENMAI',3,(SELECT COUNT(*) FROM dbo.KHUYENMAI)), ('HINHANH_RAPCHIEUPHIM',3,(SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM));
IF EXISTS (SELECT 1 FROM @Counts WHERE Expected <> Actual) THROW 51055, 'Base seed counts differ from current source baseline.', 1;
IF EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG h JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=h.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro <> 'KHACH_HANG')
   OR EXISTS (SELECT 1 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' AND NOT EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG h WHERE h.NguoiDungID=n.NguoiDungID))
    THROW 51055, 'Seed profile/role ownership is inconsistent.', 1;
IF EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=p.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID
    WHERE v.MaVaiTro <> 'QUAN_LY_RAP' OR n.TrangThai <> N'Hoạt động' OR p.TrangThai <> N'Hiệu lực' OR p.NgayBatDau > @Now OR p.NgayKetThuc < @Now)
    THROW 51055, 'Seed manager assignment is not active or belongs to the wrong role.', 1;
IF EXISTS (SELECT PhongID,HangGhe,SoGhe FROM dbo.GHE GROUP BY PhongID,HangGhe,SoGhe HAVING COUNT(*) > 1)
   OR EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE LoaiNgay = N'Ngày lễ')
   OR EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE SoLuongDaDung <> 0 OR SoLuong < SoLuongDaDung)
    THROW 51055, 'Seat uniqueness, pricing or fresh promotion counter failed.', 1;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1)
   OR EXISTS (SELECT 1 FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1)
   OR EXISTS (SELECT 1 FROM sys.triggers WHERE parent_class=1 AND is_disabled=1)
   OR EXISTS (SELECT 1 FROM sys.indexes WHERE is_disabled=1)
    THROW 51055, 'Constraint/trigger/index safety failed.', 1;
IF EXISTS (SELECT 1 FROM dbo.DONDATVE) OR EXISTS (SELECT 1 FROM dbo.THANHTOAN) OR EXISTS (SELECT 1 FROM dbo.KHIEUNAI)
    THROW 51055, 'Canonical seed must not contain transaction fixtures.', 1;

IF (SELECT COUNT(*) FROM dbo.SUATCHIEU) <> 32
   OR (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE TrangThai=N'Hoàn thành' AND ThoiGianKetThuc < @Now) <> 8
   OR (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' AND ThoiGianBatDau > @Now) <> 24
   OR (SELECT COUNT(*) FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1) <> 24
    THROW 51055, 'Dynamic seed requires 8 past and 24 future bookable shows.', 1;
IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID JOIN dbo.PHONGCHIEU room ON room.PhongID=s.PhongID JOIN dbo.RAPCHIEUPHIM r ON r.RapID=room.RapID
    WHERE s.ThoiGianKetThuc <> DATEADD(MINUTE,p.ThoiLuong,s.ThoiGianBatDau)
       OR dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau) < p.NgayKhoiChieu
       OR dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau) > p.NgayKetThuc
       OR room.TrangThai <> N'Hoạt động' OR r.TrangThai <> N'Hoạt động'
       OR NOT EXISTS (SELECT 1 FROM dbo.GHE g WHERE g.PhongID=s.PhongID AND g.TrangThai=N'Hoạt động'))
    THROW 51055, 'Show parent, duration, release or active seat validity failed.', 1;
IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
    WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND b.ThoiGianBatDau<a.ThoiGianKetThuc)
    THROW 51055, 'Same-room show overlap found.', 1;
IF EXISTS (SELECT SuatChieuID,PhimID,PhongID,DinhDang,GiaVeCoBan FROM
    (VALUES (1,1,1,N'2D',80000),(2,1,1,N'2D',85000),(3,1,2,N'IMAX',120000),(4,2,4,N'2D',80000),(5,4,6,N'2D',75000)) expected(SuatChieuID,PhimID,PhongID,DinhDang,GiaVeCoBan)
    EXCEPT SELECT SuatChieuID,PhimID,PhongID,DinhDang,GiaVeCoBan FROM dbo.SUATCHIEU WHERE SuatChieuID BETWEEN 1 AND 5)
    THROW 51055, 'Preserved show IDs 1–5 contract differs.', 1;
SELECT N'R55-BASE-COUNTS' AS TestID, TableName, Expected, Actual, N'PASS' AS Result FROM @Counts ORDER BY TableName;
SELECT N'R55-DYNAMIC' AS TestID, 8 AS PastShows, 24 AS FutureBookableShows, 32 AS TotalShows, @Now AS UtcNow, @Day AS SeedDate, N'PASS' AS Result;
PRINT 'PASS R55 seed invariants, constraints and timeline';
GO

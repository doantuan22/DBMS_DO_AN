IF EXISTS(SELECT TenPhim,ThoiLuong,PosterURL,TrangThai FROM @ExpectedMovies EXCEPT SELECT TenPhim,ThoiLuong,PosterURL,TrangThai FROM dbo.PHIM)
 OR EXISTS(SELECT TenPhim,ThoiLuong,PosterURL,TrangThai FROM dbo.PHIM EXCEPT SELECT TenPhim,ThoiLuong,PosterURL,TrangThai FROM @ExpectedMovies)
 THROW 51102,'Movie catalog differs from reviewed manifest. Reset-only; never auto-repair.',1;
IF EXISTS(SELECT TenRap,URL FROM @ExpectedCinemas EXCEPT SELECT r.TenRap,i.URL FROM dbo.RAPCHIEUPHIM r JOIN dbo.HINHANH_RAPCHIEUPHIM i ON i.RapID=r.RapID)
 OR EXISTS(SELECT r.TenRap,i.URL FROM dbo.RAPCHIEUPHIM r JOIN dbo.HINHANH_RAPCHIEUPHIM i ON i.RapID=r.RapID EXCEPT SELECT TenRap,URL FROM @ExpectedCinemas)
 THROW 51102,'Cinema media differs from manifest.',1;
IF (SELECT COUNT(*) FROM dbo.NGUOIDUNG)<>12 OR (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG)<>6
 OR (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM)<>4 OR (SELECT COUNT(*) FROM dbo.PHONGCHIEU)<>8 OR (SELECT COUNT(*) FROM dbo.GHE)<>320
 OR (SELECT COUNT(*) FROM dbo.SANPHAM)<>8 OR (SELECT COUNT(*) FROM dbo.BANGGIA)<>20 OR (SELECT COUNT(*) FROM dbo.KHUYENMAI)<>5
 OR (SELECT COUNT(*) FROM dbo.PHANCONG_RAP)<>4
 THROW 51102,'Base count mismatch or foreign data present.',1;
IF EXISTS(SELECT 1 FROM dbo.HOSOKHACHHANG h JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=h.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro<>'KHACH_HANG')
 THROW 51102,'Staff customer profile present.',1;
IF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) OR EXISTS(SELECT 1 FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) OR EXISTS(SELECT 1 FROM sys.triggers WHERE is_disabled=1)
 THROW 51102,'Disabled or untrusted invariant.',1;
IF EXISTS(SELECT Email FROM dbo.NGUOIDUNG GROUP BY Email HAVING COUNT(*)>1) OR EXISTS(SELECT PhongID,HangGhe,SoGhe FROM dbo.GHE GROUP BY PhongID,HangGhe,SoGhe HAVING COUNT(*)>1)
 THROW 51102,'Duplicate natural keys.',1;
IF EXISTS(SELECT 1 FROM dbo.PHIM WHERE PosterURL LIKE N'%unsplash%' OR PosterURL LIKE N'%pexels%' OR PosterURL LIKE N'%undefined%')
 THROW 51102,'Wrong stock poster or malformed URL.',1;
PRINT 'PASS base catalog, media, staff profiles and invariant gates';

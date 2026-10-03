IF EXISTS(SELECT MaVaiTro FROM (VALUES('ADMIN'),('QUAN_LY_RAP'),('CSKH'),('KHACH_HANG')) e(MaVaiTro) EXCEPT SELECT MaVaiTro FROM dbo.VAITRO) THROW 51005, 'Missing seed role.', 1;
IF EXISTS(SELECT MaQuyen FROM (VALUES('XEM_PHIM'),('DAT_VE'),('THANH_TOAN'),('DANH_GIA'),('GUI_KHIEU_NAI'),('QL_PHONG'),('QL_GHE')) e(MaQuyen) EXCEPT SELECT MaQuyen FROM dbo.QUYEN) THROW 51005, 'Missing seed permission.', 1;
IF EXISTS(SELECT 1 FROM dbo.QUYEN q WHERE NOT EXISTS(SELECT 1 FROM dbo.VAITRO_QUYEN vq JOIN dbo.VAITRO v ON v.VaiTroID=vq.VaiTroID WHERE v.MaVaiTro='ADMIN' AND vq.QuyenID=q.QuyenID)) THROW 51005, 'Missing admin role-permission mapping.', 1;
IF (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email IN ('admin@cinemadb.vn','manager.q1@cinemadb.vn','cskh@cinemadb.vn','khachhang1@gmail.com'))<>4 THROW 51005, 'Missing demo accounts.', 1;
IF NOT EXISTS(SELECT 1 FROM dbo.PHIM) OR NOT EXISTS(SELECT 1 FROM dbo.SUATCHIEU) OR NOT EXISTS(SELECT 1 FROM dbo.GHE) OR NOT EXISTS(SELECT 1 FROM dbo.BANGGIA) OR NOT EXISTS(SELECT 1 FROM dbo.SANPHAM) OR NOT EXISTS(SELECT 1 FROM dbo.KHUYENMAI) THROW 51005, 'Missing catalog fixture.', 1;
PRINT 'PASS seed roles, permissions, mappings, accounts and catalog';
GO

IF @BaseNew=1 BEGIN
INSERT dbo.NGUOIDUNG(VaiTroID,HoTen,Email,MatKhau,SoDienThoai,NgayTao,TrangThai)
SELECT v.VaiTroID,u.HoTen,u.Email,N'$2b$10$abcdefghijklmnopqrstuuLoftNdzfm.MJSqSPICz4PpM2nhhaOgG',NULL,DATEADD(DAY,-60,@Now),u.TrangThai FROM (VALUES
(N'ADMIN',N'Quản trị Demo A',N'admin1@example.test',N'Hoạt động'),
(N'ADMIN',N'Quản trị Demo B',N'admin2@example.test',N'Hoạt động'),
(N'QUAN_LY_RAP',N'Quản lý Demo Hà Nội',N'manager1@example.test',N'Hoạt động'),
(N'QUAN_LY_RAP',N'Quản lý Demo TP.HCM',N'manager2@example.test',N'Hoạt động'),
(N'CSKH',N'Hỗ trợ Demo A',N'support1@example.test',N'Hoạt động'),
(N'CSKH',N'Hỗ trợ Demo B',N'support2@example.test',N'Hoạt động'),
(N'KHACH_HANG',N'Khách Demo 1',N'customer1@example.test',N'Hoạt động'),
(N'KHACH_HANG',N'Khách Demo 2',N'customer2@example.test',N'Hoạt động'),
(N'KHACH_HANG',N'Khách Demo 3',N'customer3@example.test',N'Hoạt động'),
(N'KHACH_HANG',N'Khách Demo 4',N'customer4@example.test',N'Hoạt động'),
(N'KHACH_HANG',N'Khách Demo 5',N'customer5@example.test',N'Hoạt động'),
(N'KHACH_HANG',N'Khách Demo 6',N'customer6@example.test',N'Bị khóa')) u(MaVaiTro,HoTen,Email,TrangThai) JOIN dbo.VAITRO v ON v.MaVaiTro=u.MaVaiTro;
INSERT dbo.HOSOKHACHHANG(NguoiDungID,NgaySinh,GioiTinh,DiemTichLuy) SELECT n.NguoiDungID,CONVERT(date,'1995-06-15'),NULL,0 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='KHACH_HANG';
END;

-- Read only R5 seed dependencies; IDs are discovered, never assumed by the runner.
SELECT SuatChieuID,PhimID,PhongID,RapID,ThoiGianBatDau
FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1 ORDER BY SuatChieuID;
SELECT SuatChieuID,PhimID,PhongID FROM dbo.SUATCHIEU
WHERE ThoiGianKetThuc<dbo.fn_BayGio() ORDER BY SuatChieuID;
SELECT n.NguoiDungID,h.DiemTichLuy FROM dbo.NGUOIDUNG n
JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=n.NguoiDungID
WHERE n.Email IN ('khachhang1@gmail.com','khachhang2@gmail.com','khachhang3@gmail.com','khachhang4@gmail.com')
ORDER BY n.Email;
SELECT GheID,PhongID,TrangThai FROM dbo.GHE ORDER BY GheID;
SELECT SanPhamID,Gia,TrangThai FROM dbo.SANPHAM WHERE TrangThai=N'Đang bán' ORDER BY SanPhamID;
SELECT KhuyenMaiID,MaCode,TrangThai,SoLuong,SoLuongDaDung FROM dbo.KHUYENMAI ORDER BY KhuyenMaiID;
SELECT RapID,TrangThai FROM dbo.RAPCHIEUPHIM ORDER BY RapID;
SELECT PhongID,TrangThai FROM dbo.PHONGCHIEU ORDER BY PhongID;
SELECT PhimID,TrangThai FROM dbo.PHIM ORDER BY PhimID;
SELECT dbo.fn_GioiHanGheMoiDon() seats,dbo.fn_GioiHanSoLuongSanPham() food,
dbo.fn_GioiHanDonDangGiu() holds,dbo.fn_ThoiGianGiuChoPhut() minutes;

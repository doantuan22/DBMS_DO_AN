-- Compare reset runs independently of wall-clock timestamps, identity counters and SP random references.
SET NOCOUNT ON;
SELECT (SELECT
 JSON_QUERY((SELECT TenPhim,ThoiLuong,PosterURL,TrangThai FROM dbo.PHIM ORDER BY TenPhim FOR JSON PATH,INCLUDE_NULL_VALUES)) Movies,
 JSON_QUERY((SELECT n.Email,v.MaVaiTro,n.TrangThai FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID ORDER BY n.Email FOR JSON PATH)) Users,
 JSON_QUERY((SELECT p.TenPhim,r.TenRap,pc.TenPhong,DATEDIFF(DAY,dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()),dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau)) RelativeDay,CONVERT(varchar(8),CONVERT(time,dbo.fn_GioRap(s.ThoiGianBatDau)),108) LocalTime,s.DinhDang,s.GiaVeCoBan,s.TrangThai FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID JOIN dbo.PHONGCHIEU pc ON pc.PhongID=s.PhongID JOIN dbo.RAPCHIEUPHIM r ON r.RapID=pc.RapID ORDER BY r.TenRap,pc.TenPhong,RelativeDay,LocalTime FOR JSON PATH)) Shows,
 JSON_QUERY((SELECT n.Email,p.TenPhim,d.TrangThai,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,
 JSON_QUERY((SELECT g.HangGhe,g.SoGhe,v.GiaVe,v.TrangThai FROM dbo.CHITIETVE v JOIN dbo.GHE g ON g.GheID=v.GheID WHERE v.DonDatVeID=d.DonDatVeID ORDER BY g.HangGhe,g.SoGhe FOR JSON PATH)) Tickets,
 JSON_QUERY((SELECT f.TenSanPham,c.SoLuong,c.DonGia FROM dbo.CHITIETDOAN c JOIN dbo.SANPHAM f ON f.SanPhamID=c.SanPhamID WHERE c.DonDatVeID=d.DonDatVeID ORDER BY f.TenSanPham FOR JSON PATH)) Foods,
 JSON_QUERY((SELECT t.PhuongThuc,t.SoTien,t.TrangThai,t.GhiChu FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID ORDER BY t.ThanhToanID FOR JSON PATH)) Payments
 FROM dbo.DONDATVE d JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=d.NguoiDungID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHIM p ON p.PhimID=s.PhimID ORDER BY n.Email,d.TrangThai,p.TenPhim FOR JSON PATH)) Orders,
 JSON_QUERY((SELECT k.TieuDe,k.TrangThai,CASE WHEN k.DonDatVeID IS NULL THEN 0 ELSE 1 END Linked,(SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI x WHERE x.KhieuNaiID=k.KhieuNaiID) Events FROM dbo.KHIEUNAI k ORDER BY k.TieuDe FOR JSON PATH)) Complaints
 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) Result;
GO

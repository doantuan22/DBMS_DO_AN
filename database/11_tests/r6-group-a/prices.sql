SELECT v.VeID FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID
WHERE d.DonDatVeID=@ID AND v.GiaVe<>dbo.fn_TinhGiaVe(d.SuatChieuID,v.GheID);
SELECT f.ChiTietDoAnID FROM dbo.CHITIETDOAN f JOIN dbo.SANPHAM p ON p.SanPhamID=f.SanPhamID
WHERE f.DonDatVeID=@ID AND f.DonGia<>p.Gia;
SELECT DATEDIFF(SECOND,NgayDat,HanGiuCho) duration FROM dbo.DONDATVE WHERE DonDatVeID=@ID;

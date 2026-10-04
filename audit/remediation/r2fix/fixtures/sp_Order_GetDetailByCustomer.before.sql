SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Order_GetDetailByCustomer @NguoiDungID INT, @DonDatVeID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@DonDatVeID AND NguoiDungID=@NguoiDungID)
        THROW 50033, N'Đơn đặt vé không tồn tại hoặc bạn không có quyền xem đơn này.', 1;
    DECLARE @SuatID INT = (SELECT SuatChieuID FROM dbo.DONDATVE WHERE DonDatVeID=@DonDatVeID);
    EXEC dbo.sp_Order_ExpirePending @SuatChieuID=@SuatID, @TraVeKetQua=0;
    SELECT v.[DonDatVeID], v.[NguoiDungID], v.[HoTenKhachHang], v.[Email], v.[SoDienThoai], v.[SuatChieuID], v.[PhimID], v.[TenPhim], v.[PosterURL], v.[DoTuoi], v.[ThoiLuong], v.[RapID], v.[TenRap], v.[DiaChiRap], v.[PhongID], v.[TenPhong], v.[LoaiPhong], v.[ThoiGianBatDau], v.[ThoiGianKetThuc], v.[DinhDang], v.[NgayDat], v.[TongTienVe], v.[TongTienDoAn], v.[TienGiamGia], v.[TongTienThanhToan], v.[TrangThaiDon], v.[HanGiuCho], v.[MaKhuyenMai], v.[MoTaKhuyenMai], v.[DanhSachGhe], v.[DanhSachMaVe],d.LyDoHuy,d.ThongBaoHuy
        ,b.TienVeThucTra AS TienVeBoiThuong,b.DiemCong AS DiemBoiThuong,b.NgayBoiThuong
    FROM dbo.vw_ChiTietDonDatVe v INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID
    LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID=d.DonDatVeID WHERE v.DonDatVeID=@DonDatVeID;
    SELECT cv.VeID,cv.MaVe,g.GheID,g.HangGhe,g.SoGhe,(g.HangGhe+CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,g.LoaiGhe,cv.GiaVe,cv.TrangThai AS TrangThaiVe
    FROM dbo.CHITIETVE cv INNER JOIN dbo.GHE g ON g.GheID=cv.GheID WHERE cv.DonDatVeID=@DonDatVeID;
    SELECT cda.ChiTietDoAnID,sp.SanPhamID,sp.TenSanPham,sp.LoaiSanPham,cda.SoLuong,cda.DonGia,cda.SoLuong*cda.DonGia AS ThanhTien
    FROM dbo.CHITIETDOAN cda INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID=cda.SanPhamID WHERE cda.DonDatVeID=@DonDatVeID;
    SELECT ThanhToanID,PhuongThuc,SoTien,NgayTao,NgayThanhToan,MaGiaoDich,TrangThai,GhiChu FROM dbo.THANHTOAN WHERE DonDatVeID=@DonDatVeID ORDER BY ThanhToanID;
END;
GO

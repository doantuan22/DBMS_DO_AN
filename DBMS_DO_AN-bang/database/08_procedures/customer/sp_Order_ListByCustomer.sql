SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Order_ListByCustomer @NguoiDungID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('KHACH_HANG'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;

    SELECT
        v.[DonDatVeID],
        v.[NguoiDungID],
        v.[HoTenKhachHang],
        v.[Email],
        v.[SoDienThoai],
        v.[SuatChieuID],
        v.[PhimID],
        v.[TenPhim],
        v.[PosterURL],
        v.[RapID],
        v.[TenRap],
        v.[TenPhong],
        v.[ThoiGianBatDau],
        v.[ThoiGianKetThuc],
        v.[DinhDang],
        v.[NgayDat],
        v.[TongTienVe],
        v.[TongTienDoAn],
        v.[TienGiamGia],
        v.[TongTienThanhToan],
        v.[TrangThaiDon],
        v.[HanGiuCho],
        v.[MaKhuyenMai],
        v.[SoLuongVe],
        v.[TrangThaiThanhToanMoiNhat],
        d.LyDoHuy,
        d.ThongBaoHuy
    FROM dbo.vw_LichSuDatVe v
    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
    WHERE v.NguoiDungID = @NguoiDungID
    ORDER BY v.NgayDat DESC;
END;
GO

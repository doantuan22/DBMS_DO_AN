SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:651 (dbo.sp_Admin_Dashboard)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Dashboard
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE TrangThai = N'Hoạt động') AS TongNguoiDung,
        (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TrangThai = N'Hoạt động') AS TongRap,
        (SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TrangThai = N'Hoạt động') AS TongPhongChieu,
        (SELECT COUNT(*) FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu') AS PhimDangChieu,
        (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE CAST(ThoiGianBatDau AS DATE) = dbo.fn_HomNay() AND TrangThai<>N'Đã hủy') AS SuatChieuHomNay,
        (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai IN (N'Đã thanh toán', N'Hoàn thành')) AS TongDonThanhCong,
        (SELECT ISNULL(SUM(SoTien), 0) FROM dbo.THANHTOAN WHERE TrangThai = N'Thành công') AS TongDoanhThuToanThoiGian,
        (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE TrangThai = N'Mới') AS KhieuNaiChuaXuLy;
END;
GO

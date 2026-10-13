SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:651 (dbo.sp_Admin_Dashboard)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Dashboard

    @ActorID INT
    AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'XEM_BAO_CAO_TOANHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    SELECT
        (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE TrangThai = N'Hoạt động') AS TongNguoiDung,
        (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TrangThai = N'Hoạt động') AS TongRap,
        (SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TrangThai = N'Hoạt động') AS TongPhongChieu,
        (SELECT COUNT(*) FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu') AS PhimDangChieu,
        (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE dbo.fn_NgayKinhDoanh(ThoiGianBatDau) = dbo.fn_HomNay() AND TrangThai<>N'Đã hủy') AS SuatChieuHomNay,
        (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai IN (N'Đã thanh toán', N'Hoàn thành')) AS TongDonThanhCong,
        (SELECT ISNULL(SUM(SoTien), 0) FROM dbo.THANHTOAN WHERE TrangThai = N'Thành công') AS TongDoanhThuToanThoiGian,
        (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE TrangThai = N'Mới') AS KhieuNaiChuaXuLy;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_GetOrderReference
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
       AND dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        THROW 50060, N'Lỗi bảo mật: Bạn không có quyền xem đơn tham chiếu.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        THROW 50061, N'Khiếu nại không tồn tại.', 1;
    DECLARE @DonDatVeID INT;
    SELECT @DonDatVeID = DonDatVeID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;
    IF @DonDatVeID IS NULL
    BEGIN
        SELECT N'Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào.' AS [Message];
        RETURN;
    END;
    SELECT DonDatVeID, NguoiDungID, HoTenKhachHang, Email, SoDienThoai, TenPhim, TenRap,
           TenPhong, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, NgayDat, TongTienVe,
           TongTienDoAn, TienGiamGia, TongTienThanhToan, TrangThaiDon, DanhSachGhe, DanhSachMaVe
    FROM dbo.vw_ChiTietDonDatVe WHERE DonDatVeID = @DonDatVeID;
END;
GO

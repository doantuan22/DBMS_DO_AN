-- Phase 8 DBR-04: apply the same authorization and not-found guards that are
-- present in the canonical support procedures. Migration 005 was already
-- deployed before these guards were packaged, so this is deliberately separate.
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_GetDetail
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
       AND dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        THROW 50060, N'Lỗi bảo mật: Bạn không có quyền truy cập khiếu nại.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        THROW 50061, N'Khiếu nại không tồn tại.', 1;
    SELECT kn.KhieuNaiID, kn.NguoiDungID AS NguoiGuiID, nd.HoTen AS HoTenNguoiGui,
           nd.Email AS EmailNguoiGui, nd.SoDienThoai AS SoDienThoaiNguoiGui,
           kn.DonDatVeID, kn.LoaiKhieuNai, kn.TieuDe, kn.NoiDung, kn.MucDoUuTien,
           kn.NgayTao, kn.TrangThai AS TrangThaiKhieuNai
    FROM dbo.KHIEUNAI kn INNER JOIN dbo.NGUOIDUNG nd ON kn.NguoiDungID = nd.NguoiDungID
    WHERE kn.KhieuNaiID = @KhieuNaiID;
    SELECT xl.XuLyID, xl.NguoiXuLyID, nd_xl.HoTen AS NguoiXuLy, xl.NoiDungXuLy,
           xl.NgayXuLy, xl.TrangThaiSauXuLy
    FROM dbo.XULY_KHIEUNAI xl INNER JOIN dbo.NGUOIDUNG nd_xl ON xl.NguoiXuLyID = nd_xl.NguoiDungID
    WHERE xl.KhieuNaiID = @KhieuNaiID ORDER BY xl.NgayXuLy ASC;
END;
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

CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_AddProcessing
(
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDungXuLy NVARCHAR(MAX),
    @TrangThaiSauXuLy NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
            THROW 50060, N'Lỗi bảo mật: Bạn không có quyền xử lý khiếu nại.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
            THROW 50061, N'Khiếu nại không tồn tại.', 1;
        INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)
        VALUES (@KhieuNaiID, @NguoiDungID, @NoiDungXuLy, SYSDATETIME(), @TrangThaiSauXuLy);
        COMMIT TRANSACTION;
        SELECT XuLyID, KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy
        FROM dbo.XULY_KHIEUNAI WHERE XuLyID = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

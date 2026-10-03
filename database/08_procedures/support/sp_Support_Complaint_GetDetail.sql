SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
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

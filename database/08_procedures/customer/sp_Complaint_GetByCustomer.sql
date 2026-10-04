SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Complaint_GetByCustomer
(
    @NguoiDungID INT,
    @KhieuNaiID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('KHACH_HANG'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;


    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID AND NguoiDungID = @NguoiDungID)
    BEGIN
        ;THROW 50042, N'Khiếu nại không tồn tại hoặc bạn không có quyền xem.', 1;
    END

    -- Recordset 1: Chi tiết khiếu nại
    SELECT
        kn.KhieuNaiID,
        kn.NguoiDungID,
        kn.DonDatVeID,
        kn.LoaiKhieuNai,
        kn.TieuDe,
        kn.NoiDung,
        kn.MucDoUuTien,
        kn.NgayTao,
        kn.TrangThai
    FROM dbo.KHIEUNAI kn
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    -- Recordset 2: Các lần xử lý từ CSKH
    SELECT
        xl.XuLyID,
        xl.NoiDungXuLy,
        xl.NgayXuLy,
        xl.TrangThaiSauXuLy
    FROM dbo.XULY_KHIEUNAI xl
    WHERE xl.KhieuNaiID = @KhieuNaiID
    ORDER BY xl.NgayXuLy ASC;
END;
GO

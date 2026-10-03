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

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER TRIGGER dbo.TRG_XuLyKhieuNai_KiemTraVaiTro
ON dbo.XULY_KHIEUNAI
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.NGUOIDUNG nd ON i.NguoiXuLyID = nd.NguoiDungID
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE vt.MaVaiTro NOT IN ('CSKH', 'ADMIN')
           OR nd.TrangThai <> N'Hoạt động'
    )
    BEGIN
        ;THROW 50005, N'Lỗi bảo mật [BR07]: Chỉ nhân viên Chăm sóc khách hàng hoặc Quản trị viên mới được ghi nhận lịch sử xử lý khiếu nại.', 1;
    END
END;
GO

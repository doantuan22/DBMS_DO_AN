SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Complaint_ListByCustomer
(
    @NguoiDungID INT
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


    SELECT
        KhieuNaiID,
        NguoiDungID,
        DonDatVeID,
        LoaiKhieuNai,
        TieuDe,
        NoiDung,
        MucDoUuTien,
        NgayTao,
        TrangThai
    FROM dbo.KHIEUNAI
    WHERE NguoiDungID = @NguoiDungID
    ORDER BY NgayTao DESC;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_List
    @ActorID INT,
    @RapID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_BANG_GIA') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    SELECT bg.GiaID, bg.RapID, r.TenRap, bg.LoaiGhe, bg.LoaiNgay, bg.DinhDang,
           bg.PhuThu, bg.NgayBatDau, bg.NgayKetThuc, bg.TrangThai
    FROM dbo.BANGGIA bg INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = bg.RapID
    WHERE @RapID IS NULL OR bg.RapID = @RapID
    ORDER BY r.TenRap, bg.NgayBatDau DESC;
END;
GO

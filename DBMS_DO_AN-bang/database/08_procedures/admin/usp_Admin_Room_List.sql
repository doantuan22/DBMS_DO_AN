SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_List

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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_PHONG') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    SELECT pc.PhongID, pc.RapID, r.TenRap, pc.TenPhong, pc.LoaiPhong, pc.TrangThai,
           (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe
    FROM dbo.PHONGCHIEU pc
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE @RapID IS NULL OR pc.RapID = @RapID
    ORDER BY r.TenRap, pc.TenPhong;
END;
GO

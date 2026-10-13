SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_List

    @ActorID INT,
    @PhongID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_GHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    SELECT g.GheID, g.PhongID, pc.RapID, r.TenRap, g.HangGhe, g.SoGhe,
           g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe, g.LoaiGhe, g.TrangThai
    FROM dbo.GHE g
    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = g.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE @PhongID IS NULL OR g.PhongID = @PhongID
    ORDER BY r.TenRap, pc.TenPhong, g.HangGhe, g.SoGhe;
END;
GO

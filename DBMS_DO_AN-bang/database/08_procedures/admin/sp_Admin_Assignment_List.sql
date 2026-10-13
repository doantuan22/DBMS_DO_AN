SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Assignment_List
(
    @ActorID INT,
    @RapID INT = NULL,
    @NguoiDungID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'PHANCONG_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    SELECT
        pcr.PhanCongID,
        pcr.NguoiDungID,
        nd.HoTen AS TenQuanLy,
        nd.Email,
        pcr.RapID,
        r.TenRap,
        r.ThanhPho,
        pcr.NgayBatDau,
        pcr.NgayKetThuc,
        pcr.TrangThai
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE (@RapID IS NULL OR pcr.RapID = @RapID)
      AND (@NguoiDungID IS NULL OR pcr.NguoiDungID = @NguoiDungID)
    ORDER BY pcr.NgayBatDau DESC;
END;
GO

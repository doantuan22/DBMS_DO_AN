SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Assignment_Create
(
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản phải là QUAN_LY_RAP
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro = 'QUAN_LY_RAP'
    )
    BEGIN
        ;THROW 50071, N'Tài khoản được phân công phải có vai trò QUAN_LY_RAP.', 1;
    END

    INSERT INTO dbo.PHANCONG_RAP (NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@NguoiDungID, @RapID, @NgayBatDau, @NgayKetThuc, N'Hiệu lực');

    SELECT
        pcr.PhanCongID,
        pcr.NguoiDungID,
        nd.HoTen,
        pcr.RapID,
        r.TenRap,
        pcr.NgayBatDau,
        pcr.NgayKetThuc,
        pcr.TrangThai
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE pcr.PhanCongID = SCOPE_IDENTITY();
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/manager/manager_procedures.sql:19 (dbo.sp_Manager_ListAssignedCinemas)
CREATE OR ALTER PROCEDURE dbo.sp_Manager_ListAssignedCinemas
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
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;


    SELECT
        pcr.PhanCongID,
        pcr.RapID,
        r.TenRap,
        r.DiaChi,
        r.ThanhPho,
        r.SoDienThoai,
        pcr.NgayBatDau,
        pcr.NgayKetThuc,
        pcr.TrangThai AS TrangThaiPhanCong
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE pcr.NguoiDungID = @NguoiDungID
      AND pcr.TrangThai = N'Hiệu lực'
      AND dbo.fn_HomNay() >= pcr.NgayBatDau
      AND (pcr.NgayKetThuc IS NULL OR dbo.fn_HomNay() <= pcr.NgayKetThuc);
END;
GO

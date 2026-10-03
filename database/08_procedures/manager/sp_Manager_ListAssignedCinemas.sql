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

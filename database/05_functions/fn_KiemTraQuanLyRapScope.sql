SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: functions/02_functions.sql:304 (dbo.fn_KiemTraQuanLyRapScope)
CREATE OR ALTER FUNCTION dbo.fn_KiemTraQuanLyRapScope
(
    @NguoiDungID INT,
    @RapID INT
)
RETURNS BIT
AS
BEGIN
    -- Nếu là ADMIN thì có quyền trên mọi rạp
    IF EXISTS (
        SELECT 1
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID
          AND vt.MaVaiTro = 'ADMIN'
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        RETURN 1;
    END

    -- Nếu là QUAN_LY_RAP, kiểm tra bảng PHANCONG_RAP còn hiệu lực
    IF EXISTS (
        SELECT 1
        FROM dbo.PHANCONG_RAP pcr
        INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
        WHERE pcr.NguoiDungID = @NguoiDungID
          AND pcr.RapID = @RapID
          AND pcr.TrangThai = N'Hiệu lực'
          AND dbo.fn_HomNay() >= pcr.NgayBatDau
          AND (pcr.NgayKetThuc IS NULL OR dbo.fn_HomNay() <= pcr.NgayKetThuc)
          AND nd.TrangThai = N'Hoạt động'
    )
    BEGIN
        RETURN 1;
    END

    RETURN 0;
END;
GO

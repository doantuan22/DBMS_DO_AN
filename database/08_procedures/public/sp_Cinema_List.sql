SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Cinema_List
    @ThanhPho NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.RapID, r.TenRap, r.DiaChi, r.ThanhPho, r.SoDienThoai, r.MoTa, r.NgayHoatDong, r.TrangThai,
           cover.URL AS AnhDaiDienURL
    FROM dbo.RAPCHIEUPHIM r
    OUTER APPLY
    (
        SELECT TOP (1) i.URL
        FROM dbo.HINHANH_RAPCHIEUPHIM i
        WHERE i.RapID = r.RapID AND i.LaAnhDaiDien = 1 AND i.TrangThai = N'Hoạt động'
        ORDER BY i.HinhAnhRapID
    ) cover
    WHERE (@ThanhPho IS NULL OR r.ThanhPho = @ThanhPho) AND r.TrangThai = N'Hoạt động'
    ORDER BY r.ThanhPho, r.TenRap;
END;
GO

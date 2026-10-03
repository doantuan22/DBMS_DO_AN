SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_List @RapID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT bg.GiaID, bg.RapID, r.TenRap, bg.LoaiGhe, bg.LoaiNgay, bg.DinhDang,
           bg.PhuThu, bg.NgayBatDau, bg.NgayKetThuc, bg.TrangThai
    FROM dbo.BANGGIA bg INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = bg.RapID
    WHERE @RapID IS NULL OR bg.RapID = @RapID
    ORDER BY r.TenRap, bg.NgayBatDau DESC;
END;
GO

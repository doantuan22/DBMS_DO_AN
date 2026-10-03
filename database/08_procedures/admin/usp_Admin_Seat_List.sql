SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_List
    @PhongID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT g.GheID, g.PhongID, pc.RapID, r.TenRap, g.HangGhe, g.SoGhe,
           g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe, g.LoaiGhe, g.TrangThai
    FROM dbo.GHE g
    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = g.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE @PhongID IS NULL OR g.PhongID = @PhongID
    ORDER BY r.TenRap, pc.TenPhong, g.HangGhe, g.SoGhe;
END;
GO

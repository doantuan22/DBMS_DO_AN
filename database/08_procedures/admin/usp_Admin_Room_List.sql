SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_List
    @RapID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT pc.PhongID, pc.RapID, r.TenRap, pc.TenPhong, pc.LoaiPhong, pc.TrangThai,
           (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe
    FROM dbo.PHONGCHIEU pc
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE @RapID IS NULL OR pc.RapID = @RapID
    ORDER BY r.TenRap, pc.TenPhong;
END;
GO

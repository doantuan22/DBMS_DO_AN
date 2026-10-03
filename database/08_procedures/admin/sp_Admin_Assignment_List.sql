SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Assignment_List
(
    @RapID INT = NULL,
    @NguoiDungID INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

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

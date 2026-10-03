SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Cinema_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai
    FROM dbo.RAPCHIEUPHIM
    ORDER BY ThanhPho, TenRap;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Actor_Create
(
    @HoTen NVARCHAR(150),
    @NgaySinh DATE = NULL,
    @QuocTich NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.DIENVIEN (HoTen, NgaySinh, QuocTich) VALUES (@HoTen, @NgaySinh, @QuocTich);
    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID = SCOPE_IDENTITY();
END;
GO

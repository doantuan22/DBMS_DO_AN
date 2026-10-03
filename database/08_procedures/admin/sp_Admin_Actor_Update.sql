SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Actor_Update
(
    @DienVienID INT,
    @HoTen NVARCHAR(150),
    @NgaySinh DATE = NULL,
    @QuocTich NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID)
    BEGIN
        ;THROW 50100, N'Diễn viên không tồn tại.', 1;
    END

    UPDATE dbo.DIENVIEN SET HoTen = @HoTen, NgaySinh = @NgaySinh, QuocTich = @QuocTich WHERE DienVienID = @DienVienID;
    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;
END;
GO

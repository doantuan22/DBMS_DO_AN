SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_PhanCongQuanLyRap
(
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
        SET NOCOUNT ON;
EXEC dbo.sp_Admin_Assignment_Create
        @NguoiDungID = @NguoiDungID,
        @RapID = @RapID,
        @NgayBatDau = @NgayBatDau,
        @NgayKetThuc = @NgayKetThuc;
END;
GO

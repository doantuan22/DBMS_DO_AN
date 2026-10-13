SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_PhanCongQuanLyRap
(
    @ActorID INT,
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
        SET NOCOUNT ON;
EXEC dbo.sp_Admin_Assignment_Create
        @ActorID = @ActorID,
        @NguoiDungID = @NguoiDungID,
        @RapID = @RapID,
        @NgayBatDau = @NgayBatDau,
        @NgayKetThuc = @NgayKetThuc;
END;
GO

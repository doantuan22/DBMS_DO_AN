SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_ListByRoom
(
    @NguoiDungID INT,
    @PhongID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp chứa phòng này.', 1;
    END

    SELECT
        GheID,
        PhongID,
        HangGhe,
        SoGhe,
        (HangGhe + CAST(SoGhe AS VARCHAR(10))) AS TenGhe,
        LoaiGhe,
        TrangThai
    FROM dbo.GHE
    WHERE PhongID = @PhongID
    ORDER BY HangGhe, SoGhe;
END;
GO

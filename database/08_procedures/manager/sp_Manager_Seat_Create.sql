SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_Create
(
    @NguoiDungID INT,
    @PhongID INT,
    @HangGhe VARCHAR(10),
    @SoGhe INT,
    @LoaiGhe NVARCHAR(50) = N'Thường'
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @HangGhe AND SoGhe = @SoGhe)
    BEGIN
        ;THROW 50054, N'Vị trí ghế này đã tồn tại trong phòng chiếu.', 1;
    END

    INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N'Hoạt động');

    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai
    FROM dbo.GHE
    WHERE GheID = SCOPE_IDENTITY();
END;
GO

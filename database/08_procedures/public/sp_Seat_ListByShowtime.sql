SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Seat_ListByShowtime
(
    @SuatChieuID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        GheID,
        PhongID,
        HangGhe,
        SoGhe,
        TenGhe,
        LoaiGhe,
        GiaVe,
        TrangThaiGhe
    FROM dbo.fn_DanhSachGheSuatChieu(@SuatChieuID)
    ORDER BY HangGhe, SoGhe;
END;
GO

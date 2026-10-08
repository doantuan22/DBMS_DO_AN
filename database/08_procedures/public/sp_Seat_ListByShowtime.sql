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

    IF NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID = @SuatChieuID)
        THROW 50021, N'Suất chiếu không tồn tại.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID = @SuatChieuID AND IsBookable = 1)
        THROW 50022, N'Suất chiếu không còn đủ điều kiện đặt vé.', 1;

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

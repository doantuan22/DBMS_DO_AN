SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/customer/customer_procedures.sql:1214 (dbo.sp_Review_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Review_Create
(
    @NguoiDungID INT,
    @PhimID INT,
    @SoSao INT,
    @NoiDung NVARCHAR(1000) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra đã đánh giá chưa
    IF EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID AND NguoiDungID = @NguoiDungID)
    BEGIN
        ;THROW 50040, N'Bạn đã đánh giá phim này rồi.', 1;
    END

    -- Chèn bản ghi đánh giá (Trigger TRG_DanhGia_KiemTraDaXemPhim sẽ tự kiểm tra đã xem phim chưa)
    INSERT INTO dbo.DANHGIAPHIM (PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia)
    VALUES (@PhimID, @NguoiDungID, @SoSao, @NoiDung, dbo.fn_BayGio());

    SELECT
        DanhGiaID,
        PhimID,
        NguoiDungID,
        SoSao,
        NoiDung,
        NgayDanhGia
    FROM dbo.DANHGIAPHIM
    WHERE DanhGiaID = SCOPE_IDENTITY();
END;
GO

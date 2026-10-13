SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER TRIGGER dbo.TRG_ChiTietVe_KiemTraGheDungPhong
ON dbo.CHITIETVE
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.DONDATVE ddv ON i.DonDatVeID = ddv.DonDatVeID
        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
        INNER JOIN dbo.GHE g ON i.GheID = g.GheID
        WHERE g.PhongID <> sc.PhongID
    )
    BEGIN
        ;THROW 50002, N'Lỗi ràng buộc [BR03]: Ghế được chọn không thuộc phòng chiếu của suất chiếu này.', 1;
    END
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/system/system_procedures.sql:38 (dbo.sp_Order_ExpirePending)
CREATE OR ALTER PROCEDURE dbo.sp_Order_ExpirePending
(
    @SuatChieuID INT = NULL,
    @TraVeKetQua BIT = 1   -- 0 khi gọi lồng trong thủ tục khác (không trả recordset)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    DECLARE @Het TABLE (DonDatVeID INT PRIMARY KEY, KhuyenMaiID INT NULL);
    DECLARE @SoDon INT = 0;

    BEGIN TRY
        IF @TuMoTran = 1
            BEGIN TRANSACTION;
        ELSE
            SAVE TRANSACTION sp_Order_ExpirePending;

        UPDATE d
        SET d.TrangThai = N'Hết hạn'
        OUTPUT inserted.DonDatVeID, inserted.KhuyenMaiID INTO @Het (DonDatVeID, KhuyenMaiID)
        FROM dbo.DONDATVE d
        WHERE d.TrangThai = N'Chờ thanh toán'
          AND d.HanGiuCho <= dbo.fn_BayGio()
          AND (@SuatChieuID IS NULL OR d.SuatChieuID = @SuatChieuID);

        SET @SoDon = @@ROWCOUNT;

        IF @SoDon > 0
        BEGIN
            UPDATE cv
            SET cv.TrangThai = N'Đã hủy'
            FROM dbo.CHITIETVE cv
            INNER JOIN @Het h ON h.DonDatVeID = cv.DonDatVeID
            WHERE cv.TrangThai <> N'Đã hủy';

            UPDATE km
            SET km.SoLuongDaDung = CASE WHEN km.SoLuongDaDung >= x.SoLan THEN km.SoLuongDaDung - x.SoLan ELSE 0 END
            FROM dbo.KHUYENMAI km
            INNER JOIN (SELECT KhuyenMaiID, COUNT(*) AS SoLan FROM @Het WHERE KhuyenMaiID IS NOT NULL GROUP BY KhuyenMaiID) x
                ON x.KhuyenMaiID = km.KhuyenMaiID;
        END

        IF @TuMoTran = 1
            COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1
            ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TuMoTran = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION sp_Order_ExpirePending;
        END
        ;THROW;
    END CATCH

    IF @TraVeKetQua = 1
        SELECT @SoDon AS SoDonHetHan;
END;
GO

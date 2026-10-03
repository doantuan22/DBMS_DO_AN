-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM HỆ THỐNG (SYSTEM)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- sp_System_HealthCheck: Kiểm tra kết nối và tính sẵn sàng của DBMS
IF OBJECT_ID(N'dbo.sp_System_HealthCheck', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_System_HealthCheck;
GO

CREATE PROCEDURE dbo.sp_System_HealthCheck
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        'Healthy' AS [Status],
        SYSDATETIME() AS [ServerTime],
        DB_NAME() AS [DatabaseName],
        @@VERSION AS [SQLVersion];
END;
GO

-- sp_Order_ExpirePending: dọn các đơn "Chờ thanh toán" đã quá hạn giữ ghế
--  * Đơn -> Hết hạn, vé -> Đã hủy (nhả ghế), hoàn lại lượt dùng mã khuyến mãi.
--  * Nhả ghế không phụ thuộc thủ tục này: mọi truy vấn ghế đã bỏ qua đơn quá hạn qua fn_DonDangGiuGhe.
--    Thủ tục chỉ làm sạch dữ liệu; backend gọi định kỳ (mỗi phút) và sp_Booking_Create gọi cho suất chiếu liên quan.
--  * An toàn khi gọi lồng trong transaction của bên gọi (SAVE TRANSACTION).
IF OBJECT_ID(N'dbo.sp_Order_ExpirePending', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Order_ExpirePending;
GO
CREATE PROCEDURE dbo.sp_Order_ExpirePending
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
          AND d.HanGiuCho <= SYSDATETIME()
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

PRINT N'>>> [procedures/system] Đã tạo 2 Stored Procedures.';
GO

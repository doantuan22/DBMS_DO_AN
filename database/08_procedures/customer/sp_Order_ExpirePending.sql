-- Xử lý dữ liệu nghiệp vụ khách hàng: sp_Order_ExpirePending.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

-- Baseline: procedures/system/system_procedures.sql:38 (dbo.sp_Order_ExpirePending)
CREATE OR ALTER PROCEDURE dbo.sp_Order_ExpirePending
    (
    @SuatChieuID INT = NULL,
    @TraVeKetQua BIT = 1
    -- 0 khi gọi lồng trong thủ tục khác (không trả recordset)
    )
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TuMoTran BIT = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    DECLARE @Het
    TABLE (DonDatVeID INT PRIMARY KEY, KhuyenMaiID INT NULL);
    DECLARE @SoDon INT = 0;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @TuMoTran = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION;
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION sp_Order_ExpirePending;
        UPDATE d
        SET
            d.TrangThai = N'Hết hạn' OUTPUT inserted.DonDatVeID,
            inserted.KhuyenMaiID
        INTO
            @Het(DonDatVeID, KhuyenMaiID)
        FROM
            dbo.DONDATVE d
        WHERE
            d.TrangThai = N'Chờ thanh toán'
            AND (
                d.HanGiuCho IS NULL
                OR d.HanGiuCho <= dbo.fn_BayGio()
            )
            AND (
                @SuatChieuID IS NULL
                OR d.SuatChieuID = @SuatChieuID
            );
        SET
            @SoDon = @@ROWCOUNT;
        IF @SoDon > 0
        BEGIN
            UPDATE cv
            SET
                cv.TrangThai = N'Đã hủy'
            FROM
                dbo.CHITIETVE cv
                INNER JOIN @Het h ON h.DonDatVeID = cv.DonDatVeID
            WHERE
                cv.TrangThai <> N'Đã hủy';
            -- Điểm đã giữ cho đơn chưa thanh toán được trả lại đúng số điểm đã trừ (không phải hoàn tiền).
            UPDATE hk
            SET
                hk.DiemTichLuy = hk.DiemTichLuy + x.Diem
            FROM
                dbo.HOSOKHACHHANG hk
                INNER JOIN (
                    SELECT
                        d.NguoiDungID,
                        SUM(d.DiemSuDung) AS Diem
                    FROM
                        dbo.DONDATVE d
                        INNER JOIN @Het h ON h.DonDatVeID = d.DonDatVeID
                    WHERE
                        d.DiemSuDung > 0
                    GROUP BY
                        d.NguoiDungID
                ) x ON x.NguoiDungID = hk.NguoiDungID;
            UPDATE km
            SET
                km.SoLuongDaDung = CASE
                    WHEN km.SoLuongDaDung >= x.SoLan THEN km.SoLuongDaDung - x.SoLan
                    ELSE 0
                END
            FROM
                dbo.KHUYENMAI km
                INNER JOIN (
                    SELECT
                        KhuyenMaiID,
                        COUNT(*) AS SoLan
                    FROM
                        @Het
                    WHERE
                        KhuyenMaiID IS NOT NULL
                    GROUP BY
                        KhuyenMaiID
                ) x ON x.KhuyenMaiID = km.KhuyenMaiID;
        END
        IF @TuMoTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF XACT_STATE() = - 1
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ELSE
            IF XACT_STATE() = 1
            BEGIN
                IF @TuMoTran = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION;
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION sp_Order_ExpirePending;
        END;
        THROW;
    END CATCH
    IF @TraVeKetQua = 1
        SELECT
            @SoDon AS SoDonHetHan;
END;

GO

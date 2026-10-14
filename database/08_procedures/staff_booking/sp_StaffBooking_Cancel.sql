-- Hủy theo quy tắc dữ liệu đặt vé của nhân viên: sp_StaffBooking_Cancel.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Cancel
    @ActorID int,
    @PortalRole varchar(50),
    @DonDatVeID int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Own bit = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @Own = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION StaffBookingCancel;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole;
        DECLARE @Customer int,
            @Show int,
            @Rap int,
            @Status nvarchar(50),
            @Promotion int,
            @Points int,
            @Locked int;
        SELECT
            @Customer = d.NguoiDungID,
            @Show = d.SuatChieuID,
            @Rap = p.RapID
        FROM
            dbo.DONDATVE d
            JOIN dbo.SUATCHIEU s ON s.SuatChieuID = d.SuatChieuID
            JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
        WHERE
            d.DonDatVeID = @DonDatVeID;
        IF @Customer IS NULL
            THROW 50033, N'Đơn đặt vé không tồn tại.', 1;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @Rap;
        -- Match payment lock order: customer -> show -> order -> payment/tickets -> promotion.
        SELECT
            @Locked = NguoiDungID
        FROM
            dbo.NGUOIDUNG
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            NguoiDungID = @Customer;
        SELECT
            @Locked = SuatChieuID
        FROM
            dbo.SUATCHIEU
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            SuatChieuID = @Show;
        SELECT
            @Status = TrangThai,
            @Promotion = KhuyenMaiID,
            @Points = DiemSuDung
        FROM
            dbo.DONDATVE
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            DonDatVeID = @DonDatVeID
            AND NguoiDungID = @Customer
            AND SuatChieuID = @Show;
        IF @Status IS NULL
            OR @Status <> N'Chờ thanh toán'
            OR EXISTS (
            SELECT
                1
            FROM
                dbo.CHITIETVE
            WHERE
                DonDatVeID = @DonDatVeID
                AND TrangThai = N'Đã sử dụng'
        )
            THROW 50512, N'Chỉ hủy toàn bộ đơn Chờ thanh toán, không có vé đã sử dụng.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.THANHTOAN
            WITH
                (UPDLOCK, HOLDLOCK)
            WHERE
                DonDatVeID = @DonDatVeID
                AND TrangThai IN (N'Đang xử lý', N'Thành công', N'Đã hoàn tiền')
        )
            THROW 50514, N'Đơn có giao dịch đang xử lý/đã thanh toán; không thể hủy.', 1;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @Rap;
        -- Same logical cancellation as existing sp_Order_Cancel; no physical deletion/refund.
        UPDATE dbo.DONDATVE
        SET
            TrangThai = N'Đã hủy'
        WHERE
            DonDatVeID = @DonDatVeID;
        -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
        UPDATE dbo.CHITIETVE
        SET
            TrangThai = N'Đã hủy'
        WHERE
            DonDatVeID = @DonDatVeID
            AND TrangThai <> N'Đã hủy';
        -- Điểm đã giữ cho đơn chưa thanh toán được trả lại cho khách (không phải hoàn tiền).
        IF ISNULL(@Points, 0) > 0
            UPDATE dbo.HOSOKHACHHANG
            SET
                DiemTichLuy = DiemTichLuy + @Points
            WHERE
                NguoiDungID = @Customer;
        IF @Promotion IS NOT NULL
            -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
            UPDATE dbo.KHUYENMAI
            SET
                SoLuongDaDung = CASE
                    WHEN SoLuongDaDung > 0 THEN SoLuongDaDung - 1
                    ELSE 0
                END
            WHERE
                KhuyenMaiID = @Promotion;
        EXEC dbo.sp_StaffBooking_Detail @ActorID,
            @PortalRole,
            @DonDatVeID;
        IF @Own = 1
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
                IF @Own = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION StaffBookingCancel;
        END;
        THROW;
    END CATCH;
END;

GO

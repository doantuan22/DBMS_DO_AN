-- Tạo mới dữ liệu đặt vé của nhân viên: sp_StaffBooking_Create.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Create
    @ActorID int,
    @PortalRole varchar(50),
    @CustomerID int,
    @SuatChieuID int,
    @DanhSachGheId varchar(max),
    @NewDonDatVeID int OUTPUT
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
            SAVE TRANSACTION StaffBookingCreate;
        DECLARE @Rap int,
            @Room int;
        EXEC dbo.sp_StaffBooking_LockShow @ActorID,
            @PortalRole,
            @CustomerID,
            @SuatChieuID,
            @Rap OUTPUT,
            @Room OUTPUT;
        IF @DanhSachGheId IS NULL
            OR EXISTS (
            SELECT
                1
            FROM
                STRING_SPLIT(@DanhSachGheId, ',')
            WHERE
                TRY_CONVERT(int, value) IS NULL
                OR TRY_CONVERT(int, value) <= 0
                OR value LIKE '%[^0-9]%'
        )
            OR (
            SELECT
                COUNT(*)
            FROM
                STRING_SPLIT(@DanhSachGheId, ',')
        ) <> (
            SELECT
                COUNT(DISTINCT value)
            FROM
                STRING_SPLIT(@DanhSachGheId, ',')
        )
            THROW 50511, N'Danh sách ghế không hợp lệ hoặc bị lặp.', 1;
        -- Delegate unchanged Customer rules, limits, locks, pricing and hold creation.
        EXEC dbo.sp_Booking_Create @NguoiDungID = @CustomerID,
            @SuatChieuID = @SuatChieuID,
            @DanhSachGheId = @DanhSachGheId,
            @MaKhuyenMai = NULL,
            @DanhSachDoAnJson = NULL,
            @NewDonDatVeID = @NewDonDatVeID OUTPUT;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @Rap;
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
                ROLLBACK TRANSACTION StaffBookingCreate;
        END;
        THROW;
    END CATCH;
END;

GO

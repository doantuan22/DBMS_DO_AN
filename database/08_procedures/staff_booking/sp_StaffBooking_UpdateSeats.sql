-- Cập nhật dữ liệu đặt vé của nhân viên: sp_StaffBooking_UpdateSeats.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_UpdateSeats
    @ActorID int,
    @PortalRole varchar(50),
    @DonDatVeID int,
    @DanhSachGheId varchar(max),
    @ExpectedVeIdList varchar(max)
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
            SAVE TRANSACTION StaffBookingUpdate;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole;
        DECLARE @Customer int,
            @Show int,
            @Room int,
            @Rap int,
            @Hold datetime2,
            @Status nvarchar(50),
            @Promotion int;
        SELECT
            @Customer = NguoiDungID,
            @Show = SuatChieuID
        FROM
            dbo.DONDATVE
        WHERE
            DonDatVeID = @DonDatVeID;
        IF @Customer IS NULL
            THROW 50033, N'Đơn đặt vé không tồn tại.', 1;
        EXEC dbo.sp_StaffBooking_LockShow @ActorID,
            @PortalRole,
            @Customer,
            @Show,
            @Rap OUTPUT,
            @Room OUTPUT;
        SELECT
            @Status = TrangThai,
            @Hold = HanGiuCho,
            @Promotion = KhuyenMaiID
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
            OR @Promotion IS NOT NULL
            OR EXISTS (
                SELECT
                    1
                FROM
                    dbo.DONDATVE
                WHERE
                    DonDatVeID = @DonDatVeID
                    AND DiemSuDung > 0
            )
            OR EXISTS (
            SELECT
                1
            FROM
                dbo.CHITIETDOAN
            WHERE
                DonDatVeID = @DonDatVeID
        )
            OR EXISTS (
            SELECT
                1
            FROM
                dbo.CHITIETVE
            WHERE
                DonDatVeID = @DonDatVeID
                AND TrangThai = N'Đã sử dụng'
        )
            THROW 50512, N'Chỉ sửa ghế của đơn chưa thanh toán, không khuyến mãi/đồ ăn/vé đã sử dụng.', 1;
        IF @Hold IS NULL
            OR @Hold <= dbo.fn_BayGio()
            THROW 50513, N'Đơn đã hết thời gian giữ ghế.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.THANHTOAN
            WITH
                (UPDLOCK, HOLDLOCK)
            WHERE
                DonDatVeID = @DonDatVeID
        )
            THROW 50514, N'Đơn đã có lần thử thanh toán; không thể sửa ghế.', 1;
        IF @DanhSachGheId IS NULL
            OR @ExpectedVeIdList IS NULL
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
            OR EXISTS (
            SELECT
                1
            FROM
                STRING_SPLIT(@ExpectedVeIdList, ',')
            WHERE
                TRY_CONVERT(int, value) IS NULL
                OR TRY_CONVERT(int, value) <= 0
                OR value LIKE '%[^0-9]%'
        )
            THROW 50511, N'Danh sách ghế/vé không hợp lệ.', 1;
        DECLARE @Seats
        TABLE (id int PRIMARY KEY);
        DECLARE @Expected
        TABLE (id int PRIMARY KEY);
        IF(
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
            OR (
            SELECT
                COUNT(*)
            FROM
                STRING_SPLIT(@ExpectedVeIdList, ',')
        ) <> (
            SELECT
                COUNT(DISTINCT value)
            FROM
                STRING_SPLIT(@ExpectedVeIdList, ',')
        )
            THROW 50511, N'Danh sách ghế/vé bị lặp.', 1;
        INSERT
            @Seats
        SELECT
            CONVERT(int, value)
        FROM
            STRING_SPLIT(@DanhSachGheId, ',');
        INSERT
            @Expected
        SELECT
            CONVERT(int, value)
        FROM
            STRING_SPLIT(@ExpectedVeIdList, ',');
        IF NOT EXISTS (
            SELECT
                1
            FROM
                @Seats
        )
            OR (
            SELECT
                COUNT(*)
            FROM
                @Seats
        ) > dbo.fn_GioiHanGheMoiDon()
            THROW 50026, N'Chọn từ 1 đến 10 ghế.', 1;
        IF EXISTS (
            SELECT
                id
            FROM
                @Expected
            EXCEPT
            SELECT
                VeID
            FROM
                dbo.CHITIETVE
            WHERE
                DonDatVeID = @DonDatVeID
                AND TrangThai = N'Đã đặt'
        )
            OR EXISTS (
            SELECT
                VeID
            FROM
                dbo.CHITIETVE
            WHERE
                DonDatVeID = @DonDatVeID
                AND TrangThai = N'Đã đặt'
            EXCEPT
            SELECT
                id
            FROM
                @Expected
        )
            THROW 50515, N'Đơn đã được chỉnh sửa. Tải lại chi tiết trước khi lưu.', 1;
        DECLARE @Count int;
        SELECT
            @Count = COUNT(*)
        FROM
            dbo.GHE g
        WITH
            (UPDLOCK, HOLDLOCK)
            JOIN @Seats s ON s.id = g.GheID
        WHERE
            g.PhongID = @Room
            AND g.TrangThai = N'Hoạt động';
        IF @Count <> (
            SELECT
                COUNT(*)
            FROM
                @Seats
        )
            THROW 50024, N'Ghế không thuộc phòng hoặc không hoạt động.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.CHITIETVE t
            WITH
                (UPDLOCK, HOLDLOCK)
                JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
                JOIN @Seats s ON s.id = t.GheID
            WHERE
                d.SuatChieuID = @Show
                AND d.DonDatVeID <> @DonDatVeID
                AND t.TrangThai <> N'Đã hủy'
                AND dbo.fn_DonDangGiuGhe(d.TrangThai, d.HanGiuCho, dbo.fn_BayGio()) = 1
        )
            THROW 50025, N'Ghế vừa được giữ/bán trong đơn khác.', 1;
        EXEC dbo.sp_StaffBooking_Authorize @ActorID,
            @PortalRole,
            @Rap;
        IF @Hold <= dbo.fn_BayGio()
            THROW 50513, N'Đơn đã hết thời gian giữ ghế.', 1;
        -- Keep IDs/codes/prices of retained tickets. Never delete historical rows.
        UPDATE dbo.CHITIETVE
        SET
            TrangThai = N'Đã hủy'
        WHERE
            DonDatVeID = @DonDatVeID
            AND TrangThai = N'Đã đặt'
            AND GheID NOT IN (
                SELECT
                    id
                FROM
                    @Seats
            );
        INSERT
            dbo.CHITIETVE(DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
        SELECT
            @DonDatVeID,
            s.id,
            dbo.fn_TinhGiaVe(@Show, s.id),
            CONCAT('TK-', CONVERT(varchar(36), NEWID())),
            N'Đã đặt'
        FROM
            @Seats s
        WHERE
            NOT EXISTS (
                SELECT
                    1
                FROM
                    dbo.CHITIETVE
                WHERE
                    DonDatVeID = @DonDatVeID
                    AND GheID = s.id
                    AND TrangThai = N'Đã đặt'
            );
        -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
        UPDATE dbo.DONDATVE
        SET
            TongTienVe = dbo.fn_TinhTongTienVe(@DonDatVeID)
        WHERE
            DonDatVeID = @DonDatVeID;
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
                ROLLBACK TRANSACTION StaffBookingUpdate;
        END;
        THROW;
    END CATCH;
END;

GO

-- Cập nhật dữ liệu quản trị hệ thống: usp_Admin_Seat_Update.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Update
    @ActorID INT,
    @GheID INT,
    @LoaiGhe NVARCHAR(50),
    @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @ActorID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @ActorID
            AND vt.MaVaiTro IN ('ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_GHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    SET XACT_ABORT ON;
    DECLARE @OwnTran BIT = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @OwnTran = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION AdminSeatUpdate;
        DECLARE @OldType NVARCHAR(50);
        SELECT
            @OldType = LoaiGhe
        FROM
            dbo.GHE
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            GheID = @GheID;
        IF @OldType IS NULL
            THROW 50206, N'Ghế không tồn tại.', 1;
        -- Shared canonical seat lock serializes booking; historical type and
        -- operational future-ticket restrictions are separate conditions.
        IF EXISTS (
            SELECT
                @LoaiGhe
            EXCEPT
            SELECT
                @OldType
        )
            AND EXISTS (
            SELECT
                1
            FROM
                dbo.CHITIETVE
            WHERE
                GheID = @GheID
        )
            THROW 50207, N'Ghế có lịch sử vé; không thể thay đổi loại ghế.', 1;
        IF dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID) = 1
            THROW 50207, N'Ghế có vé hiệu lực ở suất chiếu tương lai.', 1;
        -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
        UPDATE dbo.GHE
        SET
            LoaiGhe = @LoaiGhe,
            TrangThai = @TrangThai
        WHERE
            GheID = @GheID;
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            GheID,
            PhongID,
            HangGhe,
            SoGhe,
            LoaiGhe,
            TrangThai
        FROM
            dbo.GHE
        WHERE
            GheID = @GheID;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF XACT_STATE() = - 1
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ELSE
            IF XACT_STATE() = 1
            BEGIN
                IF @OwnTran = 1
                    -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                    ROLLBACK TRANSACTION
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION AdminSeatUpdate;
        END;
        THROW;
    END CATCH
END;

GO

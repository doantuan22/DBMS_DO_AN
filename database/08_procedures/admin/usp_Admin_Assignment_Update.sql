-- Cập nhật dữ liệu quản trị hệ thống: usp_Admin_Assignment_Update.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Assignment_Update
    @ActorID INT,
    @PhanCongID INT,
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL,
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'PHANCONG_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
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
            SAVE TRANSACTION AssignmentUpdate;
        DECLARE @LockedRows BIGINT;
        SELECT
            @LockedRows = COUNT_BIG(*)
        FROM
            dbo.PHANCONG_RAP
        WITH
            (TABLOCKX, HOLDLOCK);
        IF NOT EXISTS (
            SELECT
                1
            FROM
                dbo.PHANCONG_RAP
            WITH
                (UPDLOCK, HOLDLOCK)
            WHERE
                PhanCongID = @PhanCongID
        )
            THROW 50212, N'Phân công không tồn tại.', 1;
        IF NOT EXISTS (
            SELECT
                1
            FROM
                dbo.NGUOIDUNG nd
            WITH
                (HOLDLOCK)
                INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
            WHERE
                nd.NguoiDungID = @NguoiDungID
                AND vt.MaVaiTro = 'QUAN_LY_RAP'
        )
            THROW 50071, N'Tài khoản được phân công phải có vai trò QUAN_LY_RAP.', 1;
        IF @NgayKetThuc IS NOT NULL
            AND @NgayKetThuc < @NgayBatDau
            THROW 50213, N'Khoảng thời gian phân công không hợp lệ.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.PHANCONG_RAP
            WHERE
                PhanCongID <> @PhanCongID
                AND NguoiDungID = @NguoiDungID
                AND RapID = @RapID
                AND NgayBatDau = @NgayBatDau
                AND (
                    NgayKetThuc = @NgayKetThuc
                    OR (
                        NgayKetThuc IS NULL
                        AND @NgayKetThuc IS NULL
                    )
                )
                AND TrangThai = @TrangThai
        )
            THROW 50401, N'Phân công hoàn toàn giống nhau đã tồn tại.', 1;
        -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
        UPDATE dbo.PHANCONG_RAP
        SET
            NguoiDungID = @NguoiDungID,
            RapID = @RapID,
            NgayBatDau = @NgayBatDau,
            NgayKetThuc = @NgayKetThuc,
            TrangThai = @TrangThai
        WHERE
            PhanCongID = @PhanCongID;
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            p.PhanCongID,
            p.NguoiDungID,
            nd.HoTen AS TenQuanLy,
            nd.Email,
            p.RapID,
            r.TenRap,
            p.NgayBatDau,
            p.NgayKetThuc,
            p.TrangThai
        FROM
            dbo.PHANCONG_RAP p
            INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = p.NguoiDungID
            INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = p.RapID
        WHERE
            p.PhanCongID = @PhanCongID;
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
                ROLLBACK TRANSACTION AssignmentUpdate;
        END;
        THROW;
    END CATCH
END;

GO

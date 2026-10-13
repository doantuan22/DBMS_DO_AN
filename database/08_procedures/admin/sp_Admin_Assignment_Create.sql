-- Tạo mới dữ liệu quản trị hệ thống: sp_Admin_Assignment_Create.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Admin_Assignment_Create
    (
    @ActorID INT,
    @NguoiDungID INT,
    @RapID INT,
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
    )
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
    -- Kiểm tra tài khoản phải là QUAN_LY_RAP
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro = 'QUAN_LY_RAP'
    )
    BEGIN
        ;
        THROW 50071, N'Tài khoản được phân công phải có vai trò QUAN_LY_RAP.', 1;
    END
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
            SAVE TRANSACTION AssignmentCreate;
        -- Serialize equivalent creates and updates; do not invent a period-overlap restriction.
        DECLARE @LockedRows BIGINT;
        SELECT
            @LockedRows = COUNT_BIG(*)
        FROM
            dbo.PHANCONG_RAP
        WITH
            (TABLOCKX, HOLDLOCK);
        IF @NgayKetThuc < @NgayBatDau
            THROW 50213, N'Khoảng thời gian phân công không hợp lệ.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.PHANCONG_RAP
            WHERE
                NguoiDungID = @NguoiDungID
                AND RapID = @RapID
                AND NgayBatDau = @NgayBatDau
                AND (
                    NgayKetThuc = @NgayKetThuc
                    OR (
                        NgayKetThuc IS NULL
                        AND @NgayKetThuc IS NULL
                    )
                )
                AND TrangThai = N'Hiệu lực'
        )
            THROW 50401, N'Phân công hoàn toàn giống nhau đã tồn tại.', 1;
        INSERT INTO
            dbo.PHANCONG_RAP(NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai)
        VALUES
            (@NguoiDungID, @RapID, @NgayBatDau, @NgayKetThuc, N'Hiệu lực');
        DECLARE @NewAssignmentID INT = SCOPE_IDENTITY();
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            pcr.PhanCongID,
            pcr.NguoiDungID,
            nd.HoTen,
            pcr.RapID,
            r.TenRap,
            pcr.NgayBatDau,
            pcr.NgayKetThuc,
            pcr.TrangThai
        FROM
            dbo.PHANCONG_RAP pcr
            INNER JOIN dbo.NGUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID
            INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
        WHERE
            pcr.PhanCongID = @NewAssignmentID;
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
                ROLLBACK TRANSACTION AssignmentCreate;
        END;
        THROW;
    END CATCH
END;

GO

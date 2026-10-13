-- Tạo mới dữ liệu quản trị hệ thống: sp_Admin_User_Create.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

-- Baseline: procedures/admin/admin_procedures.sql:75 (dbo.sp_Admin_User_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_Create
    (
    @ActorID INT,
    @HoTen NVARCHAR(100),
    @Email VARCHAR(150),
    @MatKhauHash VARCHAR(255),
    @SoDienThoai VARCHAR(20) = NULL,
    @VaiTroID INT
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_NGUOIDUNG') = 0
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
            SAVE TRANSACTION AdminCreateUser;
        -- R7.2 approved policy: internal Manager/CSKH/Admin accounts only.
        -- Only fixed internal roles may be assigned at account creation.
        IF NOT EXISTS (
            SELECT
                1
            FROM
                dbo.VAITRO
            WITH
                (HOLDLOCK)
            WHERE
                VaiTroID = @VaiTroID
                AND MaVaiTro IN ('QUAN_LY_RAP', 'CSKH', 'ADMIN')
        )
            THROW 50404, N'Admin chỉ được tạo tài khoản Manager, CSKH hoặc Admin.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.NGUOIDUNG
            WHERE
                Email = @Email
        )
        BEGIN
            ;
            THROW 50070, N'Email đã tồn tại.', 1;
        END
        INSERT INTO
            dbo.NGUOIDUNG(VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
        VALUES
            (
                @VaiTroID,
                @HoTen,
                @Email,
                @MatKhauHash,
                @SoDienThoai,
                dbo.fn_BayGio(),
                N'Hoạt động'
            );
        DECLARE @NewUserID INT = SCOPE_IDENTITY();
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            nd.NguoiDungID,
            nd.HoTen,
            nd.Email,
            nd.SoDienThoai,
            vt.MaVaiTro,
            vt.TenVaiTro,
            nd.TrangThai
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        WHERE
            nd.NguoiDungID = @NewUserID;
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
                ROLLBACK TRANSACTION AdminCreateUser;
        END;
        THROW;
    END CATCH
END;

GO

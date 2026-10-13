-- Xóa hoặc ngừng sử dụng dữ liệu quản trị hệ thống: usp_Admin_Room_Delete.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Delete
    @ActorID INT,
    @PhongID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_PHONG') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    DECLARE @Deactivated BIT = 0;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        -- Mở transaction để các bước ghi được xử lý cùng nhau.
        BEGIN TRANSACTION;
        IF NOT EXISTS (
            SELECT
                1
            FROM
                dbo.PHONGCHIEU
            WITH
                (UPDLOCK, HOLDLOCK)
            WHERE
                PhongID = @PhongID
        )
            THROW 50202, N'Phòng không tồn tại.', 1;
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.SUATCHIEU
            WITH
                (UPDLOCK, HOLDLOCK)
            WHERE
                PhongID = @PhongID
        )
        BEGIN
            -- Cập nhật dữ liệu theo điều kiện nghiệp vụ.
            UPDATE dbo.PHONGCHIEU
            SET
                TrangThai = N'Ngưng hoạt động'
            WHERE
                PhongID = @PhongID;
            SET
                @Deactivated = 1;
        END
        ELSE
        BEGIN
            -- Xóa các bản ghi thỏa điều kiện đã xác định.
            DELETE dbo.GHE
            WHERE
                PhongID = @PhongID;
            -- Xóa các bản ghi thỏa điều kiện đã xác định.
            DELETE dbo.PHONGCHIEU
            WHERE
                PhongID = @PhongID;
        END;
        -- Chốt các thay đổi của transaction.
        COMMIT TRANSACTION;
        SELECT
            @PhongID AS PhongID,
            CAST(1 - @Deactivated AS BIT) AS Deleted,
            @Deactivated AS Deactivated,
            CASE
                WHEN @Deactivated = 1 THEN N'Ngưng hoạt động'
            END AS TrangThai,
            CASE
                WHEN @Deactivated = 1 THEN N'Phòng có lịch sử suất chiếu đã chuyển sang Ngưng hoạt động.'
                ELSE N'Đã xóa phòng.'
            END AS [Message];
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        IF XACT_STATE() <> 0
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        IF @ErrorNumber IN (547, 1205, 1222)
            THROW 50217, N'Xung đột khi xóa phòng. Dữ liệu đã được hoàn tác; vui lòng tải lại và thử lại.', 1;
        ;
        THROW;
    END CATCH
END;

GO

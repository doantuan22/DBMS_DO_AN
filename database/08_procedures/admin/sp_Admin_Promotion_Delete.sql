-- Xóa hoặc ngừng sử dụng dữ liệu quản trị hệ thống: sp_Admin_Promotion_Delete.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Admin_Promotion_Delete
    (@ActorID INT, @KhuyenMaiID INT)
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_KHUYENMAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    DECLARE @OwnTran BIT = CASE
        WHEN @@TRANCOUNT = 0 THEN 1
        ELSE 0
    END,
        @LockedID INT,
        @LockedUsage INT,
        @Code VARCHAR(50);
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        IF @OwnTran = 1
            -- Mở transaction để các bước ghi được xử lý cùng nhau.
            BEGIN TRANSACTION
        ELSE
            -- Đặt savepoint khi dùng transaction của bên gọi.
            SAVE TRANSACTION AdminPromotionDelete;
        -- Discovery is an RCSI read. Acquire the same code-index -> clustered-row
        -- locks as booking, before relationship reads or DELETE index maintenance.
        SELECT
            @Code = MaCode
        FROM
            dbo.KHUYENMAI
        WHERE
            KhuyenMaiID = @KhuyenMaiID;
        SELECT
            @LockedID = KhuyenMaiID,
            @LockedUsage = SoLuongDaDung
        FROM
            dbo.KHUYENMAI
        WITH
            (
                UPDLOCK,
                HOLDLOCK,
                INDEX(UQ_KHUYENMAI_MaCode)
            )
        WHERE
            MaCode = @Code;
        IF @LockedID IS NULL
            OR @LockedID <> @KhuyenMaiID
            OR @LockedUsage < 0
            THROW 50107, N'Khuyến mãi không tồn tại.', 1;
        -- Under canonical RCSI the relationship read does not retain order locks.
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.DONDATVE
            WHERE
                KhuyenMaiID = @KhuyenMaiID
        )
            THROW 50108, N'Khuyến mãi đã được dùng trong đơn hàng. Hãy chuyển trạng thái sang Tạm dừng thay vì xóa.', 1;
        -- Xóa các bản ghi thỏa điều kiện đã xác định.
        DELETE FROM dbo.KHUYENMAI
        WHERE
            KhuyenMaiID = @KhuyenMaiID;
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        SELECT
            N'Đã xóa khuyến mãi.' AS [Message];
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
                    ROLLBACK TRANSACTION;
            ELSE
                -- Hoàn tác transaction hoặc savepoint khi có lỗi.
                ROLLBACK TRANSACTION AdminPromotionDelete;
        END;
        THROW;
    END CATCH;
END;

GO

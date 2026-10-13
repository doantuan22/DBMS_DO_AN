-- Xử lý dữ liệu quản lý rạp: sp_Manager_Seat_BatchCreate.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_BatchCreate
    (
    @NguoiDungID INT,
    @PhongID INT,
    @NumRows INT = 8,
    -- Số hàng ghế (A, B, C...)
    @SeatsPerRow INT = 12,
    -- Số ghế mỗi hàng (1..12)
    @VipRows INT = 3
    -- Số hàng VIP ở giữa
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
            NguoiDungID = @NguoiDungID
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
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('QUAN_LY_RAP')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_GHE') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        -- Mở transaction để các bước ghi được xử lý cùng nhau.
        BEGIN TRANSACTION;
        DECLARE @RapID INT;
        SELECT
            @RapID = RapID
        FROM
            dbo.PHONGCHIEU
        WHERE
            PhongID = @PhongID;
        -- Kiểm tra phạm vi rạp còn được phân công.
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
        BEGIN
            ;
            THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        END
        -- Xóa sơ đồ ghế cũ nếu phòng chưa có vé
        IF EXISTS (
            SELECT
                1
            FROM
                dbo.CHITIETVE cv
                INNER JOIN dbo.GHE g ON cv.GheID = g.GheID
            WHERE
                g.PhongID = @PhongID
        )
        BEGIN
            ;
            THROW 50055, N'Không thể tạo lại toàn bộ sơ đồ ghế vì phòng này đã có dữ liệu vé.', 1;
        END
        -- Xóa các bản ghi thỏa điều kiện đã xác định.
        DELETE FROM dbo.GHE
        WHERE
            PhongID = @PhongID;
        DECLARE @r INT = 1;
        DECLARE @c INT = 1;
        DECLARE @HangChar CHAR(1);
        DECLARE @LoaiGhe NVARCHAR(50);
        WHILE @r <= @NumRows
        BEGIN
            SET
                @HangChar = CHAR(64 + @r);
            -- 65 = 'A'
            SET
                @c = 1;
            -- Xác định loại ghế: hàng giữa là VIP, hàng cuối có thể là Sweetbox
            IF @r = @NumRows
                SET
                    @LoaiGhe = N'Sweetbox';
            ELSE
                IF @r > (@NumRows - @VipRows - 1)
                    AND @r < @NumRows
                    SET
                        @LoaiGhe = N'VIP';
            ELSE
                SET
                    @LoaiGhe = N'Thường';
            WHILE @c <= @SeatsPerRow
            BEGIN
                INSERT INTO
                    dbo.GHE(PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
                VALUES
                    (@PhongID, @HangChar, @c, @LoaiGhe, N'Hoạt động');
                SET
                    @c = @c + 1;
            END
            SET
                @r = @r + 1;
        END
        -- Chốt các thay đổi của transaction.
        COMMIT TRANSACTION;
        SELECT
            COUNT(*) AS TongSoGheTao,
            @PhongID AS PhongID
        FROM
            dbo.GHE
        WHERE
            PhongID = @PhongID;
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        ;
        THROW;
    END CATCH
END;

GO

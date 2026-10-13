-- Tạo mới dữ liệu quản lý rạp: sp_Manager_Showtime_Create.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

-- Baseline: procedures/manager/manager_procedures.sql:396 (dbo.sp_Manager_Showtime_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Showtime_Create
    (
    @NguoiDungID INT,
    @PhimID INT,
    @PhongID INT,
    @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D',
    @GiaVeCoBan DECIMAL(18, 2)
    )
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_SUAT_CHIEU') = 0
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
            SAVE TRANSACTION ManagerShowtimeCreate;
        DECLARE @RapID INT,
            @NewSuatChieuID INT;
        SELECT
            @RapID = RapID
        FROM
            dbo.PHONGCHIEU
        WITH
            (UPDLOCK, HOLDLOCK)
        WHERE
            PhongID = @PhongID;
        IF @RapID IS NULL
            THROW 50056, N'Phòng chiếu không tồn tại.', 1;
        -- Kiểm tra phạm vi rạp còn được phân công.
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
            THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp chiếu này.', 1;
        IF @ThoiGianKetThuc <= @ThoiGianBatDau
            THROW 50057, N'Thời gian kết thúc phải sau thời gian bắt đầu.', 1;
        EXEC dbo.sp_Showtime_ValidateTimes @PhimID = @PhimID,
            @ThoiGianBatDau = @ThoiGianBatDau,
            @ThoiGianKetThuc = @ThoiGianKetThuc,
            @PhongID = @PhongID;
        INSERT
            dbo.SUATCHIEU(
                PhimID,
                PhongID,
                ThoiGianBatDau,
                ThoiGianKetThuc,
                DinhDang,
                GiaVeCoBan,
                TrangThai
            )
        VALUES
            (
                @PhimID,
                @PhongID,
                @ThoiGianBatDau,
                @ThoiGianKetThuc,
                @DinhDang,
                @GiaVeCoBan,
                N'Mở bán'
            );
        SET
            @NewSuatChieuID = SCOPE_IDENTITY();
        IF @OwnTran = 1
            -- Chốt các thay đổi của transaction.
            COMMIT TRANSACTION;
        EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @NewSuatChieuID;
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
                ROLLBACK TRANSACTION ManagerShowtimeCreate;
        END;
        -- A rethrow must not doom a still-committable caller after savepoint rollback.
        SET XACT_ABORT OFF;
        ;
        THROW;
    END CATCH;
END;

GO

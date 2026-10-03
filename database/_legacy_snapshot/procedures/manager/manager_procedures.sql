-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM QUẢN LÝ RẠP (MANAGER)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- QLR-01: Danh sách rạp được phân công
IF OBJECT_ID(N'dbo.sp_Manager_ListAssignedCinemas', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_ListAssignedCinemas;
GO

CREATE PROCEDURE dbo.sp_Manager_ListAssignedCinemas
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pcr.PhanCongID,
        pcr.RapID,
        r.TenRap,
        r.DiaChi,
        r.ThanhPho,
        r.SoDienThoai,
        pcr.NgayBatDau,
        pcr.NgayKetThuc,
        pcr.TrangThai AS TrangThaiPhanCong
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE pcr.NguoiDungID = @NguoiDungID
      AND pcr.TrangThai = N'Hiệu lực'
      AND CAST(SYSDATETIME() AS DATE) >= pcr.NgayBatDau
      AND (pcr.NgayKetThuc IS NULL OR CAST(SYSDATETIME() AS DATE) <= pcr.NgayKetThuc);
END;
GO

-- QLR-02: Quản lý phòng chiếu - Xem danh sách
IF OBJECT_ID(N'dbo.sp_Manager_Room_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Room_List;
GO

CREATE PROCEDURE dbo.sp_Manager_Room_List
(
    @NguoiDungID INT,
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra scope phân công
    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    SELECT
        pc.PhongID,
        pc.RapID,
        r.TenRap,
        pc.TenPhong,
        pc.LoaiPhong,
        pc.TrangThai,
        (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe
    FROM dbo.PHONGCHIEU pc
    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
    WHERE pc.RapID = @RapID
    ORDER BY pc.TenPhong;
END;
GO

-- QLR-02: Quản lý phòng chiếu - Tạo mới
IF OBJECT_ID(N'dbo.sp_Manager_Room_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Room_Create;
GO

CREATE PROCEDURE dbo.sp_Manager_Room_Create
(
    @NguoiDungID INT,
    @RapID INT,
    @TenPhong NVARCHAR(100),
    @LoaiPhong NVARCHAR(50) = N'2D'
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong)
    BEGIN
        ;THROW 50051, N'Tên phòng chiếu đã tồn tại trong rạp này.', 1;
    END

    INSERT INTO dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai)
    VALUES (@RapID, @TenPhong, @LoaiPhong, N'Hoạt động');

    SELECT
        PhongID,
        RapID,
        TenPhong,
        LoaiPhong,
        TrangThai
    FROM dbo.PHONGCHIEU
    WHERE PhongID = SCOPE_IDENTITY();
END;
GO

-- QLR-02: Quản lý phòng chiếu - Cập nhật
IF OBJECT_ID(N'dbo.sp_Manager_Room_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Room_Update;
GO

CREATE PROCEDURE dbo.sp_Manager_Room_Update
(
    @NguoiDungID INT,
    @PhongID INT,
    @TenPhong NVARCHAR(100),
    @LoaiPhong NVARCHAR(50),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF @RapID IS NULL
    BEGIN
        ;THROW 50052, N'Phòng chiếu không tồn tại.', 1;
    END

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp chứa phòng này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong AND PhongID <> @PhongID)
    BEGIN
        ;THROW 50051, N'Tên phòng chiếu đã trùng với phòng khác trong cùng rạp.', 1;
    END

    UPDATE dbo.PHONGCHIEU
    SET TenPhong = @TenPhong,
        LoaiPhong = @LoaiPhong,
        TrangThai = @TrangThai
    WHERE PhongID = @PhongID;

    SELECT PhongID, RapID, TenPhong, LoaiPhong, TrangThai
    FROM dbo.PHONGCHIEU
    WHERE PhongID = @PhongID;
END;
GO

-- QLR-02: Quản lý phòng chiếu - Xóa phòng
IF OBJECT_ID(N'dbo.sp_Manager_Room_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Room_Delete;
GO

CREATE PROCEDURE dbo.sp_Manager_Room_Delete
(
    @NguoiDungID INT,
    @PhongID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhongID = @PhongID)
    BEGIN
        ;THROW 50053, N'Không thể xóa phòng chiếu đã có lịch sử suất chiếu. Vui lòng chuyển trạng thái Ngưng hoạt động.', 1;
    END

    DELETE FROM dbo.GHE WHERE PhongID = @PhongID;
    DELETE FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    SELECT N'Xóa phòng chiếu thành công.' AS [Message];
END;
GO

-- QLR-03: Quản lý sơ đồ ghế - Danh sách theo phòng
IF OBJECT_ID(N'dbo.sp_Manager_Seat_ListByRoom', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Seat_ListByRoom;
GO

CREATE PROCEDURE dbo.sp_Manager_Seat_ListByRoom
(
    @NguoiDungID INT,
    @PhongID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp chứa phòng này.', 1;
    END

    SELECT
        GheID,
        PhongID,
        HangGhe,
        SoGhe,
        (HangGhe + CAST(SoGhe AS VARCHAR(10))) AS TenGhe,
        LoaiGhe,
        TrangThai
    FROM dbo.GHE
    WHERE PhongID = @PhongID
    ORDER BY HangGhe, SoGhe;
END;
GO

-- QLR-03: Thêm một ghế lẻ
IF OBJECT_ID(N'dbo.sp_Manager_Seat_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Seat_Create;
GO

CREATE PROCEDURE dbo.sp_Manager_Seat_Create
(
    @NguoiDungID INT,
    @PhongID INT,
    @HangGhe VARCHAR(10),
    @SoGhe INT,
    @LoaiGhe NVARCHAR(50) = N'Thường'
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @HangGhe AND SoGhe = @SoGhe)
    BEGIN
        ;THROW 50054, N'Vị trí ghế này đã tồn tại trong phòng chiếu.', 1;
    END

    INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N'Hoạt động');

    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai
    FROM dbo.GHE
    WHERE GheID = SCOPE_IDENTITY();
END;
GO

-- QLR-03: Sửa ghế
IF OBJECT_ID(N'dbo.sp_Manager_Seat_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Seat_Update;
GO

CREATE PROCEDURE dbo.sp_Manager_Seat_Update
(
    @NguoiDungID INT,
    @GheID INT,
    @LoaiGhe NVARCHAR(50),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = pc.RapID
    FROM dbo.GHE g
    INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID
    WHERE g.GheID = @GheID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    UPDATE dbo.GHE
    SET LoaiGhe = @LoaiGhe,
        TrangThai = @TrangThai
    WHERE GheID = @GheID;

    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai
    FROM dbo.GHE
    WHERE GheID = @GheID;
END;
GO

-- QLR-03 / ADM-08: Sinh hàng loạt sơ đồ ghế tự động cho phòng chiếu
IF OBJECT_ID(N'dbo.sp_Manager_Seat_BatchCreate', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Seat_BatchCreate;
GO

CREATE PROCEDURE dbo.sp_Manager_Seat_BatchCreate
(
    @NguoiDungID INT,
    @PhongID INT,
    @NumRows INT = 8,      -- Số hàng ghế (A, B, C...)
    @SeatsPerRow INT = 12, -- Số ghế mỗi hàng (1..12)
    @VipRows INT = 3       -- Số hàng VIP ở giữa
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @RapID INT;
        SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
        BEGIN
            ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        END

        -- Xóa sơ đồ ghế cũ nếu phòng chưa có vé
        IF EXISTS (
            SELECT 1 FROM dbo.CHITIETVE cv
            INNER JOIN dbo.GHE g ON cv.GheID = g.GheID
            WHERE g.PhongID = @PhongID
        )
        BEGIN
            ;THROW 50055, N'Không thể tạo lại toàn bộ sơ đồ ghế vì phòng này đã có dữ liệu vé.', 1;
        END

        DELETE FROM dbo.GHE WHERE PhongID = @PhongID;

        DECLARE @r INT = 1;
        DECLARE @c INT = 1;
        DECLARE @HangChar CHAR(1);
        DECLARE @LoaiGhe NVARCHAR(50);

        WHILE @r <= @NumRows
        BEGIN
            SET @HangChar = CHAR(64 + @r); -- 65 = 'A'
            SET @c = 1;

            -- Xác định loại ghế: hàng giữa là VIP, hàng cuối có thể là Sweetbox
            IF @r = @NumRows
                SET @LoaiGhe = N'Sweetbox';
            ELSE IF @r > (@NumRows - @VipRows - 1) AND @r < @NumRows
                SET @LoaiGhe = N'VIP';
            ELSE
                SET @LoaiGhe = N'Thường';

            WHILE @c <= @SeatsPerRow
            BEGIN
                INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
                VALUES (@PhongID, @HangChar, @c, @LoaiGhe, N'Hoạt động');

                SET @c = @c + 1;
            END

            SET @r = @r + 1;
        END

        COMMIT TRANSACTION;

        SELECT
            COUNT(*) AS TongSoGheTao,
            @PhongID AS PhongID
        FROM dbo.GHE
        WHERE PhongID = @PhongID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

-- QLR-04: Tạo suất chiếu mới (sp_ThemSuatChieu)
IF OBJECT_ID(N'dbo.sp_Manager_Showtime_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Showtime_Create;
IF OBJECT_ID(N'dbo.sp_ThemSuatChieu', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_ThemSuatChieu;
GO

CREATE PROCEDURE dbo.sp_Manager_Showtime_Create
(
    @NguoiDungID INT,
    @PhimID INT,
    @PhongID INT,
    @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D',
    @GiaVeCoBan DECIMAL(18,2)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;

    IF @RapID IS NULL
    BEGIN
        ;THROW 50056, N'Phòng chiếu không tồn tại.', 1;
    END

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp chiếu này.', 1;
    END

    IF @ThoiGianKetThuc <= @ThoiGianBatDau
    BEGIN
        ;THROW 50057, N'Thời gian kết thúc phải sau thời gian bắt đầu.', 1;
    END

    -- Chèn bản ghi suất chiếu (Trigger TRG_SuatChieu_KiemTraTrungLich sẽ kiểm tra trùng lịch tự động)
    INSERT INTO dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    VALUES (@PhimID, @PhongID, @ThoiGianBatDau, @ThoiGianKetThuc, @DinhDang, @GiaVeCoBan, N'Mở bán');

    DECLARE @NewSuatChieuID INT = SCOPE_IDENTITY();

    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @NewSuatChieuID;
END;
GO

CREATE PROCEDURE dbo.sp_ThemSuatChieu
(
    @NguoiDungID INT,
    @PhimID INT,
    @PhongID INT,
    @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D',
    @GiaVeCoBan DECIMAL(18,2)
)
AS
BEGIN
    EXEC dbo.sp_Manager_Showtime_Create
        @NguoiDungID = @NguoiDungID,
        @PhimID = @PhimID,
        @PhongID = @PhongID,
        @ThoiGianBatDau = @ThoiGianBatDau,
        @ThoiGianKetThuc = @ThoiGianKetThuc,
        @DinhDang = @DinhDang,
        @GiaVeCoBan = @GiaVeCoBan;
END;
GO

-- QLR-05: Sửa suất chiếu
IF OBJECT_ID(N'dbo.sp_Manager_Showtime_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Showtime_Update;
GO

CREATE PROCEDURE dbo.sp_Manager_Showtime_Update
(
    @NguoiDungID INT,
    @SuatChieuID INT,
    @PhimID INT,
    @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50),
    @GiaVeCoBan DECIMAL(18,2),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    DECLARE @PhongID INT;

    SELECT
        @RapID = pc.RapID,
        @PhongID = sc.PhongID
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    WHERE sc.SuatChieuID = @SuatChieuID;

    IF @RapID IS NULL
    BEGIN
        ;THROW 50058, N'Suất chiếu không tồn tại.', 1;
    END

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    -- Cập nhật (Trigger sẽ kiểm tra trùng lịch nếu thay đổi giờ)
    UPDATE dbo.SUATCHIEU
    SET PhimID = @PhimID,
        ThoiGianBatDau = @ThoiGianBatDau,
        ThoiGianKetThuc = @ThoiGianKetThuc,
        DinhDang = @DinhDang,
        GiaVeCoBan = @GiaVeCoBan,
        TrangThai = @TrangThai
    WHERE SuatChieuID = @SuatChieuID;

    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @SuatChieuID;
END;
GO

-- QLR-06: Hủy suất chiếu
IF OBJECT_ID(N'dbo.sp_Manager_Showtime_Cancel', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Showtime_Cancel;
GO

CREATE PROCEDURE dbo.sp_Manager_Showtime_Cancel
(
    @NguoiDungID INT,
    @SuatChieuID INT,
    @LyDo NVARCHAR(255) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Gọi được cả độc lập lẫn trong transaction của bên gọi: chỉ COMMIT/ROLLBACK khi tự mở transaction,
    -- ngược lại dùng SAVE TRANSACTION và chỉ rollback phần của mình.
    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @TuMoTran = 1
            BEGIN TRANSACTION;
        ELSE
            SAVE TRANSACTION sp_Manager_Showtime_Cancel;

        DECLARE @RapID INT;
        DECLARE @TrangThai NVARCHAR(50);

        SELECT @RapID = pc.RapID, @TrangThai = sc.TrangThai
        FROM dbo.SUATCHIEU sc WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
        WHERE sc.SuatChieuID = @SuatChieuID;

        IF @RapID IS NULL
        BEGIN
            ;THROW 50116, N'Suất chiếu không tồn tại.', 1;
        END

        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
        BEGIN
            ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        END

        IF @TrangThai = N'Đã hủy'
        BEGIN
            ;THROW 50117, N'Suất chiếu đã được hủy trước đó.', 1;
        END

        -- Dọn các đơn quá hạn giữ ghế của suất này để chúng không bị tính là "đã có người đặt"
        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;

        -- Ràng buộc: chỉ hủy được suất chiếu chưa có ai đặt vé (đơn đang giữ chỗ hoặc đã thanh toán)
        IF EXISTS (
            SELECT 1
            FROM dbo.DONDATVE ddv
            WHERE ddv.SuatChieuID = @SuatChieuID
              AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, SYSDATETIME()) = 1
        )
        BEGIN
            ;THROW 50118, N'Không thể hủy: suất chiếu này đã có khách đặt vé.', 1;
        END

        UPDATE dbo.SUATCHIEU
        SET TrangThai = N'Đã hủy'
        WHERE SuatChieuID = @SuatChieuID;

        IF @TuMoTran = 1
            COMMIT TRANSACTION;

        SELECT N'Hủy suất chiếu thành công.' AS [Message];

    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1
            ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TuMoTran = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION sp_Manager_Showtime_Cancel;
        END
        ;THROW;
    END CATCH
END;
GO

-- QLR-07: Cấu hình bảng giá - Danh sách
IF OBJECT_ID(N'dbo.sp_Manager_Pricing_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Pricing_List;
GO

CREATE PROCEDURE dbo.sp_Manager_Pricing_List
(
    @NguoiDungID INT,
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    SELECT
        GiaID,
        RapID,
        LoaiGhe,
        LoaiNgay,
        DinhDang,
        PhuThu,
        NgayBatDau,
        NgayKetThuc,
        TrangThai
    FROM dbo.BANGGIA
    WHERE RapID = @RapID
    ORDER BY NgayBatDau DESC, LoaiGhe, LoaiNgay;
END;
GO

-- QLR-07: Cấu hình bảng giá - Tạo mới
IF OBJECT_ID(N'dbo.sp_Manager_Pricing_Create', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Pricing_Create;
GO

CREATE PROCEDURE dbo.sp_Manager_Pricing_Create
(
    @NguoiDungID INT,
    @RapID INT,
    @LoaiGhe NVARCHAR(50),
    @LoaiNgay NVARCHAR(50),
    @DinhDang NVARCHAR(50),
    @PhuThu DECIMAL(18,2),
    @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    INSERT INTO dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @DinhDang, @PhuThu, @NgayBatDau, @NgayKetThuc, N'Áp dụng');

    SELECT
        GiaID,
        RapID,
        LoaiGhe,
        LoaiNgay,
        DinhDang,
        PhuThu,
        NgayBatDau,
        NgayKetThuc,
        TrangThai
    FROM dbo.BANGGIA
    WHERE GiaID = SCOPE_IDENTITY();
END;
GO

-- QLR-07: Cấu hình bảng giá - Cập nhật
IF OBJECT_ID(N'dbo.sp_Manager_Pricing_Update', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Pricing_Update;
GO

CREATE PROCEDURE dbo.sp_Manager_Pricing_Update
(
    @NguoiDungID INT,
    @GiaID INT,
    @PhuThu DECIMAL(18,2),
    @TrangThai NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = RapID FROM dbo.BANGGIA WHERE GiaID = @GiaID;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    UPDATE dbo.BANGGIA
    SET PhuThu = @PhuThu,
        TrangThai = @TrangThai
    WHERE GiaID = @GiaID;

    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA
    WHERE GiaID = @GiaID;
END;
GO

-- QLR-08: Theo dõi hoạt động rạp phân công (Manager Dashboard)
IF OBJECT_ID(N'dbo.sp_Manager_Dashboard', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Dashboard;
GO

CREATE PROCEDURE dbo.sp_Manager_Dashboard
(
    @NguoiDungID INT,
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập rạp này.', 1;
    END

    -- Chỉ số tổng hợp rạp
    SELECT
        r.RapID,
        r.TenRap,
        r.ThanhPho,
        (SELECT COUNT(*) FROM dbo.PHONGCHIEU pc WHERE pc.RapID = @RapID AND pc.TrangThai = N'Hoạt động') AS TongPhongChieu,
        (SELECT COUNT(*) FROM dbo.GHE g INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID WHERE pc.RapID = @RapID AND g.TrangThai = N'Hoạt động') AS TongGhe,
        (SELECT COUNT(*) FROM dbo.SUATCHIEU sc INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID WHERE pc.RapID = @RapID AND CAST(sc.ThoiGianBatDau AS DATE) = CAST(SYSDATETIME() AS DATE)) AS SuatChieuHomNay,
        (SELECT COUNT(DISTINCT ddv.DonDatVeID)
         FROM dbo.DONDATVE ddv
         INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
         INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
         WHERE pc.RapID = @RapID
           AND CAST(ddv.NgayDat AS DATE) = CAST(SYSDATETIME() AS DATE)
           AND ddv.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
        ) AS DonDatVeHomNay
    FROM dbo.RAPCHIEUPHIM r
    WHERE r.RapID = @RapID;
END;
GO

-- QLR-09: Báo cáo doanh thu rạp phân công
IF OBJECT_ID(N'dbo.sp_Manager_Revenue', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Revenue;
GO

CREATE PROCEDURE dbo.sp_Manager_Revenue
(
    @NguoiDungID INT,
    @RapID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập báo cáo rạp này.', 1;
    END

    IF @TuNgay IS NULL SET @TuNgay = DATEADD(DAY, -30, CAST(SYSDATETIME() AS DATE));
    IF @DenNgay IS NULL SET @DenNgay = CAST(SYSDATETIME() AS DATE);

    -- Doanh thu theo ngày thanh toán: chỉ tính THANHTOAN có TrangThai = 'Thành công'
    ;WITH DonDaThu AS (
        SELECT
            ddv.DonDatVeID,
            ddv.TongTienVe,
            ddv.TongTienDoAn,
            ddv.TienGiamGia,
            SUM(tt.SoTien) AS TienDaThu,
            CAST(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao)) AS DATE) AS NgayThu,
            (SELECT COUNT(*) FROM dbo.CHITIETVE cv
             WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N'Đã hủy') AS SoVe
        FROM dbo.DONDATVE ddv
        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
        INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
        INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N'Thành công'
        WHERE pc.RapID = @RapID
        GROUP BY ddv.DonDatVeID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia
    )
    SELECT
        NgayThu AS Ngay,
        COUNT(*) AS SoDon,
        SUM(SoVe) AS SoVeBan,
        SUM(TongTienVe) AS DoanhThuVe,
        SUM(TongTienDoAn) AS DoanhThuDoAn,
        SUM(TienGiamGia) AS TienGiamGia,
        SUM(TienDaThu) AS DoanhThuThucTe
    FROM DonDaThu
    WHERE NgayThu BETWEEN @TuNgay AND @DenNgay
    GROUP BY NgayThu
    ORDER BY Ngay DESC;
END;
GO

-- QLR-03: Xóa ghế (trong phạm vi rạp được phân công; không xóa ghế đã có vé)
IF OBJECT_ID(N'dbo.sp_Manager_Seat_Delete', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Seat_Delete;
GO

CREATE PROCEDURE dbo.sp_Manager_Seat_Delete
(
    @NguoiDungID INT,
    @GheID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RapID INT;
    SELECT @RapID = pc.RapID
    FROM dbo.GHE g
    INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID
    WHERE g.GheID = @GheID;

    IF @RapID IS NULL
    BEGIN
        ;THROW 50109, N'Ghế không tồn tại.', 1;
    END

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)
    BEGIN
        ;THROW 50110, N'Ghế đã có vé bán ra. Hãy chuyển trạng thái sang Hỏng/Bảo trì thay vì xóa.', 1;
    END

    DELETE FROM dbo.GHE WHERE GheID = @GheID;
    SELECT N'Đã xóa ghế.' AS [Message];
END;
GO

-- QLR-04/05: Danh sách suất chiếu theo rạp được phân công
IF OBJECT_ID(N'dbo.sp_Manager_Showtime_List', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Manager_Showtime_List;
GO

CREATE PROCEDURE dbo.sp_Manager_Showtime_List
(
    @NguoiDungID INT,
    @RapID INT,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập rạp này.', 1;
    END

    SELECT
        sc.SuatChieuID,
        sc.PhimID,
        p.TenPhim,
        sc.PhongID,
        pc.TenPhong,
        pc.RapID,
        r.TenRap,
        sc.ThoiGianBatDau,
        sc.ThoiGianKetThuc,
        sc.DinhDang,
        sc.GiaVeCoBan,
        sc.TrangThai
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID
    INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID
    WHERE pc.RapID = @RapID
      AND (@TuNgay IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) >= @TuNgay)
      AND (@DenNgay IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) <= @DenNgay)
    ORDER BY sc.ThoiGianBatDau DESC;
END;
GO

PRINT N'>>> [procedures/manager] Đã tạo 20 Stored Procedures.';
GO

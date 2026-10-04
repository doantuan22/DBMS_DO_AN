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
    @GiaVeCoBan DECIMAL(18,2)
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_SUAT_CHIEU') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


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
    EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,@ThoiGianKetThuc=@ThoiGianKetThuc;
        INSERT INTO dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    VALUES (@PhimID, @PhongID, @ThoiGianBatDau, @ThoiGianKetThuc, @DinhDang, @GiaVeCoBan, N'Mở bán');

    DECLARE @NewSuatChieuID INT = SCOPE_IDENTITY();

    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @NewSuatChieuID;
END;
GO

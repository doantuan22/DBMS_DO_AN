SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/008_admin_global_portal.sql:266 (dbo.usp_Admin_Showtime_Create)
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Create

    @ActorID INT,
    @PhimID INT, @PhongID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D', @GiaVeCoBan DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_SUAT_CHIEU') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    DECLARE @NewSuatChieuID INT;
    IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50211, N'Thời gian suất chiếu không hợp lệ.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)
        THROW 50056, N'Phòng chiếu không tồn tại.', 1;
    EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,@ThoiGianKetThuc=@ThoiGianKetThuc;
        INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    VALUES (@PhimID, @PhongID, @ThoiGianBatDau, @ThoiGianKetThuc, @DinhDang, @GiaVeCoBan, N'Mở bán');
    SET @NewSuatChieuID = SCOPE_IDENTITY();
    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @NewSuatChieuID;
END;
GO

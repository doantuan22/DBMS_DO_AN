SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:178 (dbo.usp_Admin_Showtime_Update)
CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Update

    @ActorID INT,
    @SuatChieuID INT, @PhimID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50), @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)
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

    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminShowtimeUpdate;
        DECLARE @OldPhim INT, @OldStart DATETIME2, @OldEnd DATETIME2, @OldFormat NVARCHAR(50), @Now DATETIME2 = dbo.fn_BayGio();
        SELECT @OldPhim=PhimID, @OldStart=ThoiGianBatDau, @OldEnd=ThoiGianKetThuc, @OldFormat=DinhDang
        FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE SuatChieuID=@SuatChieuID;
        IF @OldPhim IS NULL THROW 50058, N'Suất chiếu không tồn tại.', 1;
        IF @TrangThai=N'Đã hủy' THROW 50123, N'Dùng route hủy suất chiếu riêng.', 1;
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=@SuatChieuID AND
                   (d.TrangThai=N'Đã thanh toán' OR (d.TrangThai=N'Chờ thanh toán' AND d.HanGiuCho>@Now)))
           AND (@PhimID<>@OldPhim OR @ThoiGianBatDau<>@OldStart OR @ThoiGianKetThuc<>@OldEnd OR @DinhDang<>@OldFormat)
            THROW 50120, N'Suất chiếu đã có đơn; không thể đổi phim, giờ, phòng hoặc định dạng.', 1;
        IF @ThoiGianKetThuc<=@ThoiGianBatDau THROW 50211, N'Thời gian suất chiếu không hợp lệ.', 1;
        EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,@ThoiGianKetThuc=@ThoiGianKetThuc;
        UPDATE dbo.SUATCHIEU SET PhimID=@PhimID, ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,
            DinhDang=@DinhDang, GiaVeCoBan=@GiaVeCoBan, TrangThai=@TrangThai WHERE SuatChieuID=@SuatChieuID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@SuatChieuID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AdminShowtimeUpdate; END
        ;THROW;
    END CATCH
END;
GO

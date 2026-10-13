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
    SET XACT_ABORT ON;
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
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminShowtimeCreate;
        DECLARE @NewSuatChieuID INT, @LockedPhongID INT;
        SELECT @LockedPhongID=PhongID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE PhongID=@PhongID;
        IF @LockedPhongID IS NULL THROW 50056,N'Phòng chiếu không tồn tại.',1;
        IF @ThoiGianKetThuc<=@ThoiGianBatDau THROW 50211,N'Thời gian suất chiếu không hợp lệ.',1;
        EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,
            @ThoiGianKetThuc=@ThoiGianKetThuc,@PhongID=@PhongID;
        INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
        VALUES(@PhimID,@PhongID,@ThoiGianBatDau,@ThoiGianKetThuc,@DinhDang,@GiaVeCoBan,N'Mở bán');
        SET @NewSuatChieuID=SCOPE_IDENTITY();
        IF @OwnTran=1 COMMIT TRANSACTION;
        EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@NewSuatChieuID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AdminShowtimeCreate; END;
        SET XACT_ABORT OFF;
        ;THROW;
    END CATCH;
END;
GO

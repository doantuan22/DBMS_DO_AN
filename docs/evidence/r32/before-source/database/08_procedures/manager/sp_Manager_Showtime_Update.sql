SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/014_showtime_lifecycle.sql:143 (dbo.sp_Manager_Showtime_Update)
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Showtime_Update
    @NguoiDungID INT, @SuatChieuID INT, @PhimID INT, @ThoiGianBatDau DATETIME2,
    @ThoiGianKetThuc DATETIME2, @DinhDang NVARCHAR(50), @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_SUAT_CHIEU') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerShowtimeUpdate;
        DECLARE @RapID INT, @OldPhim INT, @OldStart DATETIME2, @OldEnd DATETIME2, @OldRoom INT, @OldFormat NVARCHAR(50), @OldStatus NVARCHAR(50), @Now DATETIME2 = dbo.fn_BayGio();
        -- Discovery only (RCSI read); no child update lock before the room mutex.
        SELECT @OldRoom=PhongID FROM dbo.SUATCHIEU WHERE SuatChieuID=@SuatChieuID;
        SELECT @RapID=RapID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE PhongID=@OldRoom;
        IF @RapID IS NULL THROW 50058, N'Suất chiếu không tồn tại.', 1;
        SELECT @OldPhim=PhimID,@OldStart=ThoiGianBatDau,@OldEnd=ThoiGianKetThuc,@OldFormat=DinhDang,@OldStatus=TrangThai
        FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE SuatChieuID=@SuatChieuID AND PhongID=@OldRoom;
        IF @OldPhim IS NULL THROW 50058,N'Suất chiếu không tồn tại.',1;
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0 THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        IF @TrangThai = N'Đã hủy' THROW 50123, N'Dùng route hủy suất chiếu riêng.', 1;
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID = @SuatChieuID AND
                   (d.TrangThai = N'Đã thanh toán' OR (d.TrangThai = N'Chờ thanh toán' AND d.HanGiuCho > @Now)))
           AND (@PhimID <> @OldPhim OR @ThoiGianBatDau <> @OldStart OR @ThoiGianKetThuc <> @OldEnd OR @DinhDang <> @OldFormat)
            THROW 50120, N'Suất chiếu đã có đơn; không thể đổi phim, giờ, phòng hoặc định dạng.', 1;
        IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50057, N'Thời gian suất chiếu không hợp lệ.', 1;
        EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,
            @ThoiGianKetThuc=@ThoiGianKetThuc,@PhongID=@OldRoom,@SuatChieuID=@SuatChieuID,@TrangThai=@TrangThai;
        UPDATE dbo.SUATCHIEU SET PhimID=@PhimID, ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,
            DinhDang=@DinhDang, GiaVeCoBan=@GiaVeCoBan, TrangThai=@TrangThai WHERE SuatChieuID=@SuatChieuID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @SuatChieuID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerShowtimeUpdate; END
        SET XACT_ABORT OFF;
        ;THROW;
    END CATCH
END;
GO

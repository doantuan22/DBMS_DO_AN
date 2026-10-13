SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Internal transaction helper; identical parent lock order to Customer booking.
CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_LockShow
    @ActorID int, @PortalRole varchar(50), @CustomerID int, @SuatChieuID int,
    @RapID int OUTPUT, @PhongID int OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF @@TRANCOUNT=0 THROW 50516, N'Thao tác đặt vé yêu cầu transaction.',1;
    EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole;
    IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDUNG n WITH (UPDLOCK,HOLDLOCK)
        JOIN dbo.VAITRO r ON r.VaiTroID=n.VaiTroID
        WHERE n.NguoiDungID=@CustomerID AND n.TrangThai=N'Hoạt động' AND r.MaVaiTro='KHACH_HANG')
        THROW 50510, N'Khách hàng phải tồn tại, đang hoạt động và có vai trò Customer.',1;
    DECLARE @MovieID int,@Locked int;
    SET @PhongID=NULL;
    SET @RapID=NULL;
    SELECT @PhongID=s.PhongID,@MovieID=s.PhimID,@RapID=p.RapID
    FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE s.SuatChieuID=@SuatChieuID;
    IF @PhongID IS NULL THROW 50021, N'Suất chiếu không tồn tại.',1;
    EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@RapID;
    SELECT @Locked=PhimID FROM dbo.PHIM WITH (HOLDLOCK) WHERE PhimID=@MovieID;
    SELECT @Locked=RapID FROM dbo.RAPCHIEUPHIM WITH (HOLDLOCK) WHERE RapID=@RapID;
    SET @Locked=NULL;
    SELECT @Locked=PhongID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE PhongID=@PhongID AND RapID=@RapID;
    IF @Locked IS NULL THROW 50022, N'Phòng chiếu đã thay đổi. Vui lòng tải lại.',1;
    SET @Locked=NULL;
    SELECT @Locked=SuatChieuID FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK)
    WHERE SuatChieuID=@SuatChieuID AND PhongID=@PhongID AND PhimID=@MovieID;
    IF @Locked IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID=@SuatChieuID AND IsBookable=1)
        THROW 50022, N'Suất chiếu không còn đủ điều kiện đặt vé.',1;
END;
GO

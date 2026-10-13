SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_StaffBooking_Authorize
    @ActorID int, @PortalRole varchar(50), @RapID int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDUNG WITH (HOLDLOCK) WHERE NguoiDungID=@ActorID AND TrangThai=N'Hoạt động')
        THROW 50300, N'Tài khoản nhân viên không còn hoạt động.', 1;
    IF @PortalRole IS NULL OR @PortalRole NOT IN ('ADMIN','QUAN_LY_RAP') OR NOT EXISTS(
        SELECT 1 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO r ON r.VaiTroID=n.VaiTroID
        WHERE n.NguoiDungID=@ActorID AND r.MaVaiTro=@PortalRole)
        THROW 50301, N'Vai trò không được phép quản lý đặt vé tại portal này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID,'DAT_VE')=0
        THROW 50302, N'Không có quyền quản lý đặt vé.', 1;
    IF @PortalRole='QUAN_LY_RAP' AND @RapID IS NOT NULL
    BEGIN
        -- Assignment writers take TABLOCKX: retain scope through the caller's transaction.
        DECLARE @Assignments bigint;
        SELECT @Assignments=COUNT_BIG(*) FROM dbo.PHANCONG_RAP WITH (HOLDLOCK)
        WHERE NguoiDungID=@ActorID AND RapID=@RapID;
        IF dbo.fn_KiemTraQuanLyRapScope(@ActorID,@RapID)=0
            THROW 50303, N'Rạp không thuộc phân công còn hiệu lực của Manager.', 1;
    END;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_UpdateStatus
(
    @NguoiDungID INT,
    @TrangThai NVARCHAR(50) -- 'Hoạt động', 'Bị khóa'
)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.NGUOIDUNG
    SET TrangThai = @TrangThai
    WHERE NguoiDungID = @NguoiDungID;

    SELECT NguoiDungID, HoTen, Email, TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID;
END;
GO

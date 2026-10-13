SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_User_ChangePassword
(
    @NguoiDungID INT,
    @NewPasswordHash VARCHAR(255)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
    BEGIN
        ;THROW 50016, N'Tài khoản không tồn tại hoặc không hoạt động.', 1;
    END

    UPDATE dbo.NGUOIDUNG
    SET MatKhau = @NewPasswordHash
    WHERE NguoiDungID = @NguoiDungID;

    SELECT N'Đổi mật khẩu thành công.' AS [Message];
END;
GO

-- Tra cứu dữ liệu tài khoản và xác thực: sp_User_GetPasswordHash.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_User_GetPasswordHash
    (@NguoiDungID INT)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        NguoiDungID,
        MatKhau AS MatKhauHash
    FROM
        dbo.NGUOIDUNG
    WHERE
        NguoiDungID = @NguoiDungID
        AND TrangThai = N'Hoạt động';
END;

GO

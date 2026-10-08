SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_User_UpdateProfile
(
    @NguoiDungID INT,
    @HoTen NVARCHAR(100),
    @SoDienThoai VARCHAR(20) = NULL,
    @NgaySinh DATE = NULL,
    @GioiTinh NVARCHAR(10) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    IF @NgaySinh > dbo.fn_HomNay() THROW 50400, N'Ngày sinh không được ở tương lai.', 1;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra trùng số điện thoại với tài khoản khác
        IF @SoDienThoai IS NOT NULL AND EXISTS (
            SELECT 1 FROM dbo.NGUOIDUNG
            WHERE SoDienThoai = @SoDienThoai AND NguoiDungID <> @NguoiDungID
        )
        BEGIN
            ;THROW 50015, N'Số điện thoại đã thuộc về một tài khoản khác.', 1;
        END

        UPDATE dbo.NGUOIDUNG
        SET HoTen = @HoTen,
            SoDienThoai = @SoDienThoai
        WHERE NguoiDungID = @NguoiDungID;

        IF EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @NguoiDungID)
        BEGIN
            UPDATE dbo.HOSOKHACHHANG
            SET NgaySinh = @NgaySinh,
                GioiTinh = @GioiTinh
            WHERE NguoiDungID = @NguoiDungID;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy)
            VALUES (@NguoiDungID, @NgaySinh, @GioiTinh, 0);
        END

        COMMIT TRANSACTION;

        -- Trả về dữ liệu sau cập nhật
        EXEC dbo.sp_User_GetCurrent @NguoiDungID = @NguoiDungID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

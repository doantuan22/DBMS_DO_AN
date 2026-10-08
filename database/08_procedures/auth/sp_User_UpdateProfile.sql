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
    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION;
        ELSE SAVE TRANSACTION UserUpdateProfile;

        DECLARE @MaVaiTro VARCHAR(50);
        SELECT @MaVaiTro = v.MaVaiTro
        FROM dbo.NGUOIDUNG n WITH (UPDLOCK, HOLDLOCK)
        JOIN dbo.VAITRO v WITH (HOLDLOCK) ON v.VaiTroID = n.VaiTroID
        WHERE n.NguoiDungID = @NguoiDungID AND n.TrangThai = N'Hoạt động';
        IF @MaVaiTro IS NULL
            THROW 50300, N'Tài khoản không khả dụng.', 1;
        IF @MaVaiTro <> 'KHACH_HANG' AND (@NgaySinh IS NOT NULL OR @GioiTinh IS NOT NULL)
            THROW 50301, N'Chỉ khách hàng được cập nhật ngày sinh và giới tính.', 1;

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

        IF @MaVaiTro = 'KHACH_HANG'
        BEGIN
            IF EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG WITH (UPDLOCK, HOLDLOCK) WHERE NguoiDungID = @NguoiDungID)
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
        END

        IF @OwnTran = 1 COMMIT TRANSACTION;

        -- Trả về dữ liệu sau cập nhật
        EXEC dbo.sp_User_GetCurrent @NguoiDungID = @NguoiDungID;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTran = 1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION UserUpdateProfile;
        END
        ;THROW;
    END CATCH
END;
GO

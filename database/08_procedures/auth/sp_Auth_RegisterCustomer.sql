SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/auth/auth_procedures.sql:18 (dbo.sp_Auth_RegisterCustomer)
CREATE OR ALTER PROCEDURE dbo.sp_Auth_RegisterCustomer
(
    @HoTen NVARCHAR(100),
    @Email VARCHAR(150),
    @MatKhauHash VARCHAR(255),
    @SoDienThoai VARCHAR(20) = NULL,
    @NgaySinh DATE = NULL,
    @GioiTinh NVARCHAR(10) = NULL,
    @NewUserId INT OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Transaction lồng nhau đúng kỹ thuật:
    --  * Gọi độc lập (@@TRANCOUNT = 0): thủ tục tự BEGIN/COMMIT/ROLLBACK.
    --  * Gọi trong transaction của bên gọi: dùng SAVE TRANSACTION, khi lỗi chỉ rollback phần của mình,
    --    không hủy transaction ngoài.
    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;

    BEGIN TRY
        IF @TuMoTran = 1
            BEGIN TRANSACTION;
        ELSE
            SAVE TRANSACTION sp_Auth_RegisterCustomer;

        -- 1. Kiểm tra email đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = @Email)
        BEGIN
            ;THROW 50010, N'Email này đã được sử dụng trong hệ thống.', 1;
        END

        -- 2. Kiểm tra số điện thoại (nếu có)
        IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE SoDienThoai = @SoDienThoai)
        BEGIN
            ;THROW 50011, N'Số điện thoại này đã được sử dụng trong hệ thống.', 1;
        END

        -- 3. Lấy VaiTroID của vai trò KHACH_HANG
        DECLARE @VaiTroID INT;
        SELECT @VaiTroID = VaiTroID FROM dbo.VAITRO WHERE MaVaiTro = 'KHACH_HANG';

        IF @VaiTroID IS NULL
        BEGIN
            ;THROW 50012, N'Vai trò KHACH_HANG chưa được cấu hình.', 1;
        END

        -- 4. Thêm tài khoản mới vào NGUOIDUNG
        INSERT INTO dbo.NGUOIDUNG (VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
        VALUES (@VaiTroID, @HoTen, @Email, @MatKhauHash, @SoDienThoai, dbo.fn_BayGio(), N'Hoạt động');

        SET @NewUserId = SCOPE_IDENTITY();

        -- 5. Tạo bản ghi HOSOKHACHHANG tương ứng
        INSERT INTO dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy)
        VALUES (@NewUserId, @NgaySinh, @GioiTinh, 0);

        IF @TuMoTran = 1
            COMMIT TRANSACTION;

        -- Trả về thông tin tài khoản vừa tạo
        SELECT
            nd.NguoiDungID,
            nd.HoTen,
            nd.Email,
            nd.SoDienThoai,
            vt.MaVaiTro,
            vt.TenVaiTro,
            nd.TrangThai,
            hk.DiemTichLuy
        FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
        LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
        WHERE nd.NguoiDungID = @NewUserId;

    END TRY
    BEGIN CATCH
        DECLARE @LoiSo INT = ERROR_NUMBER();
        DECLARE @LoiMsg NVARCHAR(2048) = ERROR_MESSAGE();

        SET @NewUserId = NULL;

        IF XACT_STATE() = -1
        BEGIN
            -- Transaction đã không thể commit: bắt buộc rollback toàn bộ
            ROLLBACK TRANSACTION;
        END
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TuMoTran = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION sp_Auth_RegisterCustomer;
        END

        -- Hai yêu cầu đăng ký đồng thời có thể cùng qua bước kiểm tra; UNIQUE là chốt chặn cuối cùng
        IF @LoiSo IN (2601, 2627) AND @LoiMsg LIKE N'%UQ_NGUOIDUNG_Email%'
        BEGIN
            ;THROW 50010, N'Email này đã được sử dụng trong hệ thống.', 1;
        END
        IF @LoiSo IN (2601, 2627) AND @LoiMsg LIKE N'%UQ_NGUOIDUNG_SoDienThoai%'
        BEGIN
            ;THROW 50011, N'Số điện thoại này đã được sử dụng trong hệ thống.', 1;
        END

        ;THROW;
    END CATCH
END;
GO

-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM XÁC THỰC, RBAC, HỒ SƠ NGƯỜI DÙNG (AUTH)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- KH-01: Đăng ký tài khoản khách hàng
IF OBJECT_ID(N'dbo.sp_Auth_RegisterCustomer', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_RegisterCustomer;
GO

CREATE PROCEDURE dbo.sp_Auth_RegisterCustomer
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
        VALUES (@VaiTroID, @HoTen, @Email, @MatKhauHash, @SoDienThoai, SYSDATETIME(), N'Hoạt động');

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

-- KH-02 / QLR-01 / CSKH-01 / ADM-01: Đăng nhập hệ thống & lấy quyền
IF OBJECT_ID(N'dbo.sp_Auth_Login', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_Auth_Login;
GO

CREATE PROCEDURE dbo.sp_Auth_Login
(
    @Email VARCHAR(150)
)
AS
BEGIN
    SET NOCOUNT ON;
    -- Mật khẩu được băm (bcrypt) và so sánh ở backend. Thủ tục này chỉ trả về hash để backend đối chiếu.
    -- Recordset 1: 0 dòng nếu email không tồn tại. Recordset 2, 3 chỉ có dữ liệu khi tài khoản đang hoạt động.

    DECLARE @NguoiDungID INT;
    DECLARE @VaiTroID INT;
    DECLARE @TrangThai NVARCHAR(50);

    SELECT @NguoiDungID = NguoiDungID, @VaiTroID = VaiTroID, @TrangThai = TrangThai
    FROM dbo.NGUOIDUNG
    WHERE Email = @Email;

    -- Recordset 1: Thông tin người dùng + hash mật khẩu
    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        nd.MatKhau AS MatKhauHash,
        nd.TrangThai,
        vt.VaiTroID,
        vt.MaVaiTro,
        vt.TenVaiTro,
        hk.DiemTichLuy
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
    WHERE nd.NguoiDungID = @NguoiDungID;

    -- Recordset 2: Danh sách quyền (Permissions)
    SELECT DISTINCT q.QuyenID, q.MaQuyen, q.TenQuyen
    FROM dbo.VAITRO_QUYEN vq
    INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
    WHERE vq.VaiTroID = @VaiTroID
      AND @TrangThai = N'Hoạt động';

    -- Recordset 3: Danh sách rạp được phân công còn hiệu lực (Quản lý rạp)
    SELECT
        pcr.RapID,
        r.TenRap,
        r.ThanhPho,
        pcr.NgayBatDau,
        pcr.NgayKetThuc
    FROM dbo.PHANCONG_RAP pcr
    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID
    WHERE pcr.NguoiDungID = @NguoiDungID
      AND @TrangThai = N'Hoạt động'
      AND pcr.TrangThai = N'Hiệu lực'
      AND CAST(SYSDATETIME() AS DATE) >= pcr.NgayBatDau
      AND (pcr.NgayKetThuc IS NULL OR CAST(SYSDATETIME() AS DATE) <= pcr.NgayKetThuc);
END;
GO

-- sp_RBAC_GetPermissionsByUser: Lấy danh sách quyền của người dùng
IF OBJECT_ID(N'dbo.sp_RBAC_GetPermissionsByUser', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_RBAC_GetPermissionsByUser;
GO

CREATE PROCEDURE dbo.sp_RBAC_GetPermissionsByUser
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT q.QuyenID, q.MaQuyen, q.TenQuyen, q.MoTa
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO_QUYEN vq ON nd.VaiTroID = vq.VaiTroID
    INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
    WHERE nd.NguoiDungID = @NguoiDungID AND nd.TrangThai = N'Hoạt động';
END;
GO

-- KH-03: Xem hồ sơ cá nhân hiện tại
IF OBJECT_ID(N'dbo.sp_User_GetCurrent', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_User_GetCurrent;
GO

CREATE PROCEDURE dbo.sp_User_GetCurrent
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        nd.NgayTao,
        nd.TrangThai,
        vt.MaVaiTro,
        vt.TenVaiTro,
        hk.NgaySinh,
        hk.GioiTinh,
        hk.DiemTichLuy
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID
    WHERE nd.NguoiDungID = @NguoiDungID;
END;
GO

-- KH-03: Cập nhật thông tin cá nhân
IF OBJECT_ID(N'dbo.sp_User_UpdateProfile', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_User_UpdateProfile;
GO

CREATE PROCEDURE dbo.sp_User_UpdateProfile
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

-- Lấy hash mật khẩu hiện tại để backend xác minh mật khẩu cũ (bcrypt)
IF OBJECT_ID(N'dbo.sp_User_GetPasswordHash', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_User_GetPasswordHash;
GO

CREATE PROCEDURE dbo.sp_User_GetPasswordHash
(
    @NguoiDungID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT NguoiDungID, MatKhau AS MatKhauHash
    FROM dbo.NGUOIDUNG
    WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động';
END;
GO

-- Đổi mật khẩu (backend đã xác minh mật khẩu cũ và băm mật khẩu mới)
IF OBJECT_ID(N'dbo.sp_User_ChangePassword', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_User_ChangePassword;
GO

CREATE PROCEDURE dbo.sp_User_ChangePassword
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

PRINT N'>>> [procedures/auth] Đã tạo 7 Stored Procedures.';
GO

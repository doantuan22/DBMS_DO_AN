SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:75 (dbo.sp_Admin_User_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_User_Create
(
    @ActorID INT,
    @HoTen NVARCHAR(100),
    @Email VARCHAR(150),
    @MatKhauHash VARCHAR(255),
    @SoDienThoai VARCHAR(20) = NULL,
    @VaiTroID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_NGUOIDUNG') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
    IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminCreateUser;
    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = @Email)
    BEGIN
        ;THROW 50070, N'Email đã tồn tại.', 1;
    END

    INSERT INTO dbo.NGUOIDUNG (VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
    VALUES (@VaiTroID, @HoTen, @Email, @MatKhauHash, @SoDienThoai, dbo.fn_BayGio(), N'Hoạt động');

    DECLARE @NewUserID INT = SCOPE_IDENTITY();
    IF EXISTS (SELECT 1 FROM dbo.VAITRO WITH (HOLDLOCK) WHERE VaiTroID = @VaiTroID AND MaVaiTro = 'KHACH_HANG')
        INSERT dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy)
        VALUES (@NewUserID, NULL, NULL, 0);

    IF @OwnTran = 1 COMMIT TRANSACTION;

    SELECT
        nd.NguoiDungID,
        nd.HoTen,
        nd.Email,
        nd.SoDienThoai,
        vt.MaVaiTro,
        vt.TenVaiTro,
        nd.TrangThai
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID
    WHERE nd.NguoiDungID = @NewUserID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTran = 1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AdminCreateUser;
        END
        ;THROW;
    END CATCH
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:156 (dbo.sp_Admin_RolePermission_Set)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_RolePermission_Set
(
    @ActorID INT,
    @VaiTroID INT,
    @QuyenIdList VARCHAR(MAX) -- '1,2,3,4'
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_QUYEN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.VAITRO_QUYEN WHERE VaiTroID = @VaiTroID;

        INSERT INTO dbo.VAITRO_QUYEN (VaiTroID, QuyenID, NgayGan)
        SELECT DISTINCT @VaiTroID, CAST(value AS INT), dbo.fn_BayGio()
        FROM STRING_SPLIT(@QuyenIdList, ',')
        WHERE LTRIM(RTRIM(value)) <> '';

        COMMIT TRANSACTION;

        SELECT vq.VaiTroID, q.QuyenID, q.MaQuyen, q.TenQuyen
        FROM dbo.VAITRO_QUYEN vq
        INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID
        WHERE vq.VaiTroID = @VaiTroID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/admin/admin_procedures.sql:156 (dbo.sp_Admin_RolePermission_Set)
CREATE OR ALTER PROCEDURE dbo.sp_Admin_RolePermission_Set
(
    @VaiTroID INT,
    @QuyenIdList VARCHAR(MAX) -- '1,2,3,4'
)
AS
BEGIN
    SET NOCOUNT ON;
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

-- Run with sqlcmd -b in the intended database. No data conversion or deletion.
-- Existing 13_migrations convention; function source is deployed separately by scripts/r0/verify.mjs.
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    -- Hold the table lock through validation and DDL to prevent a concurrent legacy insert.
    IF EXISTS (SELECT 1 FROM dbo.BANGGIA WITH (TABLOCKX, HOLDLOCK) WHERE LoaiNgay = N'Ngày lễ')
    BEGIN
        SELECT * FROM dbo.BANGGIA WHERE LoaiNgay = N'Ngày lễ';
        THROW 51000, N'R0 migration refused: BANGGIA contains Ngày lễ. Resolve the business meaning explicitly; no rows were changed.', 1;
    END;
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.BANGGIA') AND name = N'CK_BANGGIA_LoaiNgay')
        ALTER TABLE dbo.BANGGIA DROP CONSTRAINT CK_BANGGIA_LoaiNgay;
    ALTER TABLE dbo.BANGGIA WITH CHECK ADD CONSTRAINT CK_BANGGIA_LoaiNgay
        CHECK ([LoaiNgay]=N'Tất cả' OR [LoaiNgay]=N'Cuối tuần' OR [LoaiNgay]=N'Ngày thường');
    ALTER TABLE dbo.BANGGIA CHECK CONSTRAINT CK_BANGGIA_LoaiNgay;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Final points-discount normalization.
-- DONDATVE.TienGiamGia is the total of promotion and point discounts.
-- DONDATVE.DiemSuDung remains the point snapshot (1 point = 1,000 VND).
-- This migration is idempotent and must be run only against the selected database.
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.DONDATVE', N'DiemSuDung') IS NULL
        ALTER TABLE dbo.DONDATVE
        ADD DiemSuDung INT NOT NULL CONSTRAINT DF_DONDATVE_DiemSuDung DEFAULT((0));

    -- A legacy deployment stored the point value separately. Its documented invariant
    -- proves the conversion before the one-time merge. Any nonconforming history is
    -- rejected rather than risking a duplicated discount or lost money snapshot.
    IF COL_LENGTH(N'dbo.DONDATVE', N'TienGiamBangDiem') IS NOT NULL
    BEGIN
        -- Legacy references are dynamic so a repeat run compiles after the
        -- old column has already been removed.
        DECLARE @MergeLegacySql NVARCHAR(MAX) = N'
            IF EXISTS (
                SELECT 1
                FROM dbo.DONDATVE
                WHERE ISNULL(TienGiamBangDiem, 0) <> CAST(ISNULL(DiemSuDung, 0) AS DECIMAL(18, 2)) * 1000
                   OR TienGiamGia + ISNULL(TienGiamBangDiem, 0) > TongTienVe + TongTienDoAn
            )
                THROW 51201, N''Dữ liệu giảm bằng điểm cũ không thỏa bất biến; migration dừng để bảo toàn lịch sử.'', 1;

            -- The legacy total-discount CHECK includes both columns. It must be
            -- replaced before the one-time merge, otherwise the transient value
            -- would appear to count the point discount twice.
            IF OBJECT_ID(N''dbo.CK_DONDATVE_TongGiam'', N''C'') IS NOT NULL
                ALTER TABLE dbo.DONDATVE DROP CONSTRAINT CK_DONDATVE_TongGiam;

            UPDATE dbo.DONDATVE
            SET TienGiamGia = TienGiamGia + TienGiamBangDiem;

            IF OBJECT_ID(N''dbo.CK_DONDATVE_TienGiamBangDiem'', N''C'') IS NOT NULL
                ALTER TABLE dbo.DONDATVE DROP CONSTRAINT CK_DONDATVE_TienGiamBangDiem;
            IF OBJECT_ID(N''dbo.CK_DONDATVE_DiemQuyDoi'', N''C'') IS NOT NULL
                ALTER TABLE dbo.DONDATVE DROP CONSTRAINT CK_DONDATVE_DiemQuyDoi;

            DECLARE @LegacyDefault sysname = (
                SELECT dc.name
                FROM sys.default_constraints dc
                JOIN sys.columns c ON c.default_object_id = dc.object_id
                WHERE c.object_id = OBJECT_ID(N''dbo.DONDATVE'')
                  AND c.name = N''TienGiamBangDiem''
            );
            IF @LegacyDefault IS NOT NULL
            BEGIN
                DECLARE @DropLegacyDefault NVARCHAR(512) = N''ALTER TABLE dbo.DONDATVE DROP CONSTRAINT '' + QUOTENAME(@LegacyDefault) + N'';'';
                EXEC sys.sp_executesql @DropLegacyDefault;
            END;

            ALTER TABLE dbo.DONDATVE DROP COLUMN TienGiamBangDiem;';
        EXEC sys.sp_executesql @MergeLegacySql;
    END;

    IF OBJECT_ID(N'dbo.CK_DONDATVE_TongGiam', N'C') IS NOT NULL
        ALTER TABLE dbo.DONDATVE DROP CONSTRAINT CK_DONDATVE_TongGiam;
    ALTER TABLE dbo.DONDATVE WITH CHECK
    ADD CONSTRAINT CK_DONDATVE_TongGiam CHECK (TienGiamGia <= TongTienVe + TongTienDoAn);

    IF OBJECT_ID(N'dbo.CK_DONDATVE_DiemSuDung', N'C') IS NULL
        ALTER TABLE dbo.DONDATVE WITH CHECK
        ADD CONSTRAINT CK_DONDATVE_DiemSuDung CHECK (DiemSuDung >= 0);

    -- Keep the existing payment-method contract; DIEM confirms an order whose cash due is zero.
    IF OBJECT_ID(N'dbo.CK_THANHTOAN_PhuongThuc', N'C') IS NOT NULL
       AND OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_THANHTOAN_PhuongThuc', N'C')) NOT LIKE N'%DIEM%'
        ALTER TABLE dbo.THANHTOAN DROP CONSTRAINT CK_THANHTOAN_PhuongThuc;
    IF OBJECT_ID(N'dbo.CK_THANHTOAN_PhuongThuc', N'C') IS NULL
        ALTER TABLE dbo.THANHTOAN WITH CHECK
        ADD CONSTRAINT CK_THANHTOAN_PhuongThuc CHECK (
            PhuongThuc IN (N'TIEN_MAT', N'THE_QUOC_TE', N'THE_NOI_DIA', N'ZALOPAY', N'MOMO', N'VNPAY', N'DIEM')
        );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- In-place R2 -> R2-FIX migration. Run with the matching procedure deployment in one outer transaction.
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
BEGIN TRY
    IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION R2FixCompensation;
    DECLARE @ObjectID INT = OBJECT_ID(N'dbo.BOITHUONG_HUYSUAT', N'U'), @Count BIGINT;
    IF @ObjectID IS NULL THROW 51040, 'R2 compensation table is required; use the current baseline for a new database.', 1;
    SELECT @Count=COUNT_BIG(*) FROM dbo.BOITHUONG_HUYSUAT WITH (TABLOCKX,HOLDLOCK);
    CREATE TABLE #R2FixHistory (DonDatVeID INT PRIMARY KEY, DiemBoiThuong BIGINT, NgayBoiThuong DATETIME2, GhiChu NVARCHAR(255) COLLATE DATABASE_DEFAULT);

    IF COL_LENGTH('dbo.BOITHUONG_HUYSUAT', 'DiemCong') IS NOT NULL
    BEGIN
        -- Refuse unknown drift before making any DDL change.
        IF (SELECT COUNT(*) FROM sys.columns WHERE object_id=@ObjectID) <> 10
           OR EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectID AND name NOT IN
               ('DonDatVeID','SuatChieuID','NguoiDungID','TongTienVe','TongTienDoAn','TienGiamGia',
                'TienVeThucTra','DiemCong','NgayBoiThuong','NguoiThucHienID'))
            THROW 51040, 'Unknown legacy compensation schema; migration refused.', 1;
        IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE referenced_object_id=@ObjectID)
            THROW 51040, 'Incoming compensation foreign keys require a separate reviewed migration.', 1;
        EXEC(N'IF EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT WHERE DiemCong<0 OR DiemCong>2147483647)
                   THROW 51041, ''Historical compensation points cannot be represented as INT; no changes applied.'', 1;
               IF EXISTS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID
                          WHERE b.SuatChieuID<>d.SuatChieuID OR b.NguoiDungID<>d.NguoiDungID OR b.TongTienVe<>d.TongTienVe
                             OR b.TongTienDoAn<>d.TongTienDoAn OR b.TienGiamGia<>d.TienGiamGia)
                   THROW 51045, ''Legacy compensation snapshots disagree with their order; reconcile before removing duplicate columns.'', 1;
               INSERT #R2FixHistory
               SELECT DonDatVeID,DiemCong,NgayBoiThuong,
                      CASE WHEN NguoiThucHienID IS NULL THEN NULL ELSE CONCAT(N''Người thực hiện ID: '',NguoiThucHienID) END
               FROM dbo.BOITHUONG_HUYSUAT;');
        EXEC(N'ALTER TABLE dbo.BOITHUONG_HUYSUAT DROP CONSTRAINT
                 FK_BOITHUONG_HUYSUAT_Suat,FK_BOITHUONG_HUYSUAT_Khach,FK_BOITHUONG_HUYSUAT_NguoiThucHien,
                 CK_BOITHUONG_HUYSUAT_Tien,CK_BOITHUONG_HUYSUAT_Diem,PK_BOITHUONG_HUYSUAT;');
        EXEC sys.sp_rename N'dbo.BOITHUONG_HUYSUAT.DiemCong', N'DiemBoiThuong', N'COLUMN';
        EXEC(N'ALTER TABLE dbo.BOITHUONG_HUYSUAT ALTER COLUMN DiemBoiThuong INT NOT NULL;
               ALTER TABLE dbo.BOITHUONG_HUYSUAT ADD BoiThuongID INT IDENTITY(1,1) NOT NULL, GhiChu NVARCHAR(255) NULL;');
        -- Separate batch: SQL Server must bind the newly added columns after ALTER finishes.
        EXEC(N'UPDATE b SET GhiChu=h.GhiChu FROM dbo.BOITHUONG_HUYSUAT b JOIN #R2FixHistory h ON h.DonDatVeID=b.DonDatVeID;
               ALTER TABLE dbo.BOITHUONG_HUYSUAT DROP COLUMN SuatChieuID,NguoiDungID,TongTienVe,TongTienDoAn,
                    TienGiamGia,TienVeThucTra,NguoiThucHienID;
               ALTER TABLE dbo.BOITHUONG_HUYSUAT ADD
                    CONSTRAINT PK_BOITHUONG_HUYSUAT PRIMARY KEY CLUSTERED (BoiThuongID),
                    CONSTRAINT UQ_BOITHUONG_HUYSUAT_Don UNIQUE NONCLUSTERED (DonDatVeID);
               ALTER TABLE dbo.BOITHUONG_HUYSUAT WITH CHECK ADD
                    CONSTRAINT CK_BOITHUONG_HUYSUAT_Diem CHECK (DiemBoiThuong>=0);');
    END
    ELSE
    BEGIN
        -- Already migrated: keep identity IDs and event records unchanged.
        EXEC(N'INSERT #R2FixHistory SELECT DonDatVeID,DiemBoiThuong,NgayBoiThuong,GhiChu FROM dbo.BOITHUONG_HUYSUAT;');
    END;

    IF OBJECT_ID(N'dbo.BOITHUONG_HUYSUAT',N'U') <> @ObjectID
       OR (SELECT COUNT(*) FROM sys.columns WHERE object_id=@ObjectID) <> 5
       OR EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectID AND name NOT IN
                  ('BoiThuongID','DonDatVeID','DiemBoiThuong','NgayBoiThuong','GhiChu'))
        THROW 51040, 'R2-FIX target schema verification failed.', 1;
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectID AND name='BoiThuongID' AND is_identity=1)
       OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=@ObjectID AND name='FK_BOITHUONG_HUYSUAT_Don'
                      AND referenced_object_id=OBJECT_ID('dbo.DONDATVE') AND delete_referential_action=0 AND is_disabled=0 AND is_not_trusted=0)
        THROW 51040, 'R2-FIX identity or non-cascading FK verification failed.', 1;
    EXEC(N'IF EXISTS (SELECT DonDatVeID,CONVERT(BIGINT,DiemBoiThuong),NgayBoiThuong,GhiChu FROM dbo.BOITHUONG_HUYSUAT
                         EXCEPT SELECT DonDatVeID,DiemBoiThuong,NgayBoiThuong,GhiChu FROM #R2FixHistory)
              OR EXISTS (SELECT DonDatVeID,DiemBoiThuong,NgayBoiThuong,GhiChu FROM #R2FixHistory
                         EXCEPT SELECT DonDatVeID,CONVERT(BIGINT,DiemBoiThuong),NgayBoiThuong,GhiChu FROM dbo.BOITHUONG_HUYSUAT)
              THROW 51042, ''Historical compensation changed; migration rolled back.'', 1;');
    DROP TABLE #R2FixHistory;
    IF @OwnTran=1 COMMIT TRANSACTION;
    PRINT 'PASS R2-FIX in-place compensation migration; points/timestamps/actor notes preserved';
END TRY
BEGIN CATCH
    IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
    ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION R2FixCompensation; END;
    THROW;
END CATCH;
GO

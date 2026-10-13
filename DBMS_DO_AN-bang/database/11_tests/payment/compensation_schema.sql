SET NOCOUNT ON;
DECLARE @ID INT=OBJECT_ID(N'dbo.BOITHUONG_HUYSUAT',N'U');
DECLARE @Expected TABLE (name SYSNAME, type_id INT, nullable BIT, identity_column BIT, max_length SMALLINT);
INSERT @Expected VALUES ('BoiThuongID',56,0,1,4),('DonDatVeID',56,0,0,4),('DiemBoiThuong',56,0,0,4),
                        ('NgayBoiThuong',42,0,0,8),('GhiChu',231,1,0,510);
IF @ID IS NULL OR EXISTS (SELECT name,type_id,nullable,identity_column,max_length FROM @Expected
                         EXCEPT SELECT name,system_type_id,is_nullable,is_identity,max_length FROM sys.columns WHERE object_id=@ID)
               OR EXISTS (SELECT name,system_type_id,is_nullable,is_identity,max_length FROM sys.columns WHERE object_id=@ID
                         EXCEPT SELECT name,type_id,nullable,identity_column,max_length FROM @Expected)
    THROW 51043, 'R2-FIX compensation must have exactly the five target columns/types/nullability.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
               WHERE i.object_id=@ID AND i.is_primary_key=1 AND COL_NAME(ic.object_id,ic.column_id)='BoiThuongID' AND ic.key_ordinal=1)
   OR NOT EXISTS (SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
               WHERE i.object_id=@ID AND i.is_unique_constraint=1 AND COL_NAME(ic.object_id,ic.column_id)='DonDatVeID' AND ic.key_ordinal=1
               AND NOT EXISTS (SELECT 1 FROM sys.index_columns x WHERE x.object_id=i.object_id AND x.index_id=i.index_id AND x.key_ordinal>1))
    THROW 51043, 'R2-FIX identity PK or UNIQUE(order) is missing.', 1;
IF (SELECT COUNT(*) FROM sys.foreign_keys WHERE parent_object_id=@ID) <> 1
   OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys f JOIN sys.foreign_key_columns c ON c.constraint_object_id=f.object_id
               WHERE f.parent_object_id=@ID AND f.referenced_object_id=OBJECT_ID(N'dbo.DONDATVE')
               AND COL_NAME(c.parent_object_id,c.parent_column_id)='DonDatVeID' AND COL_NAME(c.referenced_object_id,c.referenced_column_id)='DonDatVeID'
               AND f.delete_referential_action=0 AND f.update_referential_action=0 AND f.is_disabled=0 AND f.is_not_trusted=0)
    THROW 51043, 'R2-FIX requires exactly one trusted non-cascading order FK.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=@ID AND name='CK_BOITHUONG_HUYSUAT_Diem' AND is_disabled=0 AND is_not_trusted=0)
    THROW 51043, 'R2-FIX points CHECK is missing or disabled.', 1;
IF (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) <> 27
    THROW 51043, 'R2-FIX must preserve the 27-table baseline.', 1;
PRINT 'PASS R2-FIX 3NF compensation schema, identity PK, UNIQUE(order), single non-cascading FK, points CHECK, 27 tables';
GO

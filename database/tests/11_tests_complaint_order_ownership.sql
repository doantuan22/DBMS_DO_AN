-- DBR-01 integration verification. Run after migrations/003_complaint_order_ownership.sql
-- on a disposable database or inside a transaction; this script rolls back all rows it creates.
USE CinemaBookingDB
GO

SET NOCOUNT ON;
-- Expected THROW cases are caught below, so keep the enclosing test transaction alive.
SET XACT_ABORT OFF;
GO

DECLARE @Failures INT = 0;
DECLARE @ErrorNumber INT;
DECLARE @OwnOrder INT = (SELECT TOP 1 DonDatVeID FROM dbo.DONDATVE WHERE NguoiDungID = 5 ORDER BY DonDatVeID);
DECLARE @ForeignOrder INT = (SELECT TOP 1 DonDatVeID FROM dbo.DONDATVE WHERE NguoiDungID = 6 ORDER BY DonDatVeID);
DECLARE @BeforeForeignCount INT;
DECLARE @AfterForeignCount INT;

IF @OwnOrder IS NULL OR @ForeignOrder IS NULL
    THROW 51001, N'DBR-01 test requires seeded customer orders for users 5 and 6.', 1;

BEGIN TRANSACTION;

-- T1: no order remains valid.
BEGIN TRY
    EXEC dbo.sp_Complaint_Create @NguoiDungID = 5, @DonDatVeID = NULL, @LoaiKhieuNai = N'DBR-01 test', @TieuDe = N'No order', @NoiDung = N'Optional order reference';
    PRINT N'PASS - DBR-01 T1: complaint without order';
END TRY
BEGIN CATCH
    SET @Failures += 1;
    PRINT N'FAIL - DBR-01 T1: ' + ERROR_MESSAGE();
END CATCH;

-- T2: own order remains valid.
BEGIN TRY
    EXEC dbo.sp_Complaint_Create @NguoiDungID = 5, @DonDatVeID = @OwnOrder, @LoaiKhieuNai = N'DBR-01 test', @TieuDe = N'Own order', @NoiDung = N'Owned order reference';
    PRINT N'PASS - DBR-01 T2: complaint with own order';
END TRY
BEGIN CATCH
    SET @Failures += 1;
    PRINT N'FAIL - DBR-01 T2: ' + ERROR_MESSAGE();
END CATCH;

-- T3: a foreign order is rejected and no complaint row is inserted.
SELECT @BeforeForeignCount = COUNT(*) FROM dbo.KHIEUNAI WHERE NguoiDungID = 5 AND DonDatVeID = @ForeignOrder;
SET @ErrorNumber = NULL;
BEGIN TRY
    EXEC dbo.sp_Complaint_Create @NguoiDungID = 5, @DonDatVeID = @ForeignOrder, @LoaiKhieuNai = N'DBR-01 test', @TieuDe = N'Foreign order', @NoiDung = N'Must be rejected';
END TRY
BEGIN CATCH
    SET @ErrorNumber = ERROR_NUMBER();
END CATCH;
SELECT @AfterForeignCount = COUNT(*) FROM dbo.KHIEUNAI WHERE NguoiDungID = 5 AND DonDatVeID = @ForeignOrder;
IF @ErrorNumber = 50041 AND @AfterForeignCount = @BeforeForeignCount
    PRINT N'PASS - DBR-01 T3: foreign order rejected without insert';
ELSE
BEGIN
    SET @Failures += 1;
    PRINT N'FAIL - DBR-01 T3: expected 50041 and no insert';
END;

-- T4: an unknown order uses the same non-disclosing error and creates no row.
SET @ErrorNumber = NULL;
BEGIN TRY
    EXEC dbo.sp_Complaint_Create @NguoiDungID = 5, @DonDatVeID = 2147483647, @LoaiKhieuNai = N'DBR-01 test', @TieuDe = N'Missing order', @NoiDung = N'Must be rejected';
END TRY
BEGIN CATCH
    SET @ErrorNumber = ERROR_NUMBER();
END CATCH;
IF @ErrorNumber = 50041
    PRINT N'PASS - DBR-01 T4: nonexistent order rejected';
ELSE
BEGIN
    SET @Failures += 1;
    PRINT N'FAIL - DBR-01 T4: expected 50041';
END;

ROLLBACK TRANSACTION;

IF @Failures > 0 THROW 51002, N'DBR-01 complaint order ownership verification failed.', 1;
PRINT N'PASS - DBR-01 complaint order ownership verification';
GO

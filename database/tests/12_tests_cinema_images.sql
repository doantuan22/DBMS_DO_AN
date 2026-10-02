-- Run after migration 009 against a non-production database. Every test row rolls back.
USE CinemaBookingDB
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @RapID INT, @Image1 INT, @Image2 INT;
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai)
    VALUES (N'TEST Cinema Image', N'Test address', N'Test city', N'Hoạt động');
    SET @RapID = SCOPE_IDENTITY();

    EXEC dbo.usp_Admin_CinemaImage_Create @RapID, N'https://example.invalid/cinema-1.jpg', N'Ảnh 1', 1, 0, N'Hoạt động';
    SELECT @Image1 = HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND URL = N'https://example.invalid/cinema-1.jpg';
    EXEC dbo.usp_Admin_CinemaImage_Create @RapID, N'https://example.invalid/cinema-2.jpg', N'Ảnh 2', 0, 1, N'Hoạt động';
    SELECT @Image2 = HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND URL = N'https://example.invalid/cinema-2.jpg';

    EXEC dbo.usp_Admin_CinemaImage_SetCover @RapID, @Image2;
    IF (SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND LaAnhDaiDien = 1) <> 1
        THROW 51001, N'Cinema image cover uniqueness failed.', 1;
    IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @Image1 AND LaAnhDaiDien = 1)
        THROW 51002, N'Old cinema image cover was not cleared.', 1;

    IF EXISTS
    (
        SELECT 1 FROM
        (
            SELECT HinhAnhRapID, ROW_NUMBER() OVER (ORDER BY ThuTuHienThi, HinhAnhRapID) AS ExpectedOrder
            FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID
        ) ordered WHERE ExpectedOrder NOT IN (1, 2)
    ) THROW 51003, N'Cinema image gallery order is not deterministic.', 1;

    BEGIN TRY
        EXEC dbo.usp_Admin_CinemaImage_Create -1, N'https://example.invalid/invalid.jpg', NULL, 0, 0, N'Hoạt động';
        THROW 51004, N'Invalid cinema was accepted for cinema image creation.', 1;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 51004 THROW;
        IF ERROR_NUMBER() <> 50200 THROW;
    END CATCH;

    EXEC dbo.usp_Admin_CinemaImage_Delete @RapID, @Image2;
    IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @Image2)
        THROW 51005, N'Cinema image delete failed.', 1;
    ROLLBACK TRANSACTION;
    PRINT N'Cinema image tests passed.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

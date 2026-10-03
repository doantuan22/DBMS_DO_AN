-- Run after migration 011 against a non-production database. Every test row rolls back.
USE CinemaBookingDB
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @RapID INT, @Image1 INT, @Image2 INT;
    DECLARE @Dto TABLE (HinhAnhRapID INT, RapID INT, URL NVARCHAR(500), MoTa NVARCHAR(255),
                        LaAnhDaiDien BIT, ThuTuHienThi INT, TrangThai NVARCHAR(50), NgayTao DATETIME2);
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai)
    VALUES (N'TEST Cinema Image Update', N'Test address', N'Test city', N'Hoạt động');
    SET @RapID = SCOPE_IDENTITY();
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_Create @RapID, N'https://example.invalid/u-1.jpg', N'Ảnh 1', 1, 0, N'Hoạt động';
    SELECT @Image1 = HinhAnhRapID FROM @Dto;
    DELETE @Dto;
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_Create @RapID, N'https://example.invalid/u-2.jpg', N'Ảnh 2', 0, 1, N'Hoạt động';
    SELECT @Image2 = HinhAnhRapID FROM @Dto;

    -- Update emits exactly one result set: the updated image (INSERT ... EXEC fails on any other shape).
    DELETE @Dto;
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image2, N'https://example.invalid/u-2b.jpg', N'Ảnh 2b', 5, N'Hoạt động';
    IF (SELECT COUNT(*) FROM @Dto) <> 1
       OR NOT EXISTS (SELECT 1 FROM @Dto WHERE HinhAnhRapID = @Image2 AND RapID = @RapID AND URL = N'https://example.invalid/u-2b.jpg' AND ThuTuHienThi = 5 AND LaAnhDaiDien = 0)
        THROW 51201, N'Update did not return exactly the updated image.', 1;

    -- Disabling the cover clears it (rule kept from migration 009).
    DELETE @Dto;
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image1, N'https://example.invalid/u-1.jpg', N'Ảnh 1', 0, N'Tạm ẩn';
    IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND LaAnhDaiDien = 1)
        THROW 51202, N'Disabling the cover image did not clear the cover flag.', 1;

    -- Sequential Update / SetCover chain: never more than one cover, and it is always active.
    EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image1, N'https://example.invalid/u-1.jpg', N'Ảnh 1', 0, N'Hoạt động';
    EXEC dbo.usp_Admin_CinemaImage_SetCover @RapID, @Image1;
    EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image2, N'https://example.invalid/u-2b.jpg', N'Ảnh 2b', 5, N'Hoạt động';
    EXEC dbo.usp_Admin_CinemaImage_SetCover @RapID, @Image2;
    EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image1, N'https://example.invalid/u-1.jpg', N'Ảnh 1', 0, N'Tạm ẩn';
    IF (SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND LaAnhDaiDien = 1) <> 1
       OR NOT EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @Image2 AND LaAnhDaiDien = 1 AND TrangThai = N'Hoạt động')
        THROW 51203, N'One-cover-per-cinema rule broken after the Update/SetCover chain.', 1;
    EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image2, N'https://example.invalid/u-2b.jpg', N'Ảnh 2b', 5, N'Tạm ẩn';
    IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND LaAnhDaiDien = 1)
        THROW 51204, N'A hidden image is still the cover.', 1;

    -- Unknown image / wrong cinema keep the original error (50230).
    BEGIN TRY
        EXEC dbo.usp_Admin_CinemaImage_Update @RapID, -1, N'https://example.invalid/x.jpg', NULL, 0, N'Hoạt động';
        THROW 51205, N'Update of a missing image was accepted.', 1;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 51205 THROW;
        IF ERROR_NUMBER() <> 50230 THROW;
    END CATCH;

    -- TrangThai CHECK (migration 010) still rejects values outside the domain, also through Update.
    BEGIN TRY
        EXEC dbo.usp_Admin_CinemaImage_Update @RapID, @Image1, N'https://example.invalid/u-1.jpg', NULL, 0, N'INVALID_AUDIT';
        THROW 51206, N'Out-of-domain image status was accepted.', 1;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 51206 THROW;
        IF ERROR_NUMBER() <> 547 THROW;
    END CATCH;

    ROLLBACK TRANSACTION;
    PRINT N'Cinema image update/lock tests passed.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

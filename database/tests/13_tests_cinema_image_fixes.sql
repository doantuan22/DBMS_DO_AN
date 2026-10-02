-- Run after migration 010 against a non-production database. Every test row rolls back.
USE CinemaBookingDB
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @RapID INT, @Image1 INT, @Image2 INT;
    DECLARE @Dto TABLE (HinhAnhRapID INT, RapID INT, URL NVARCHAR(500), MoTa NVARCHAR(255),
                        LaAnhDaiDien BIT, ThuTuHienThi INT, TrangThai NVARCHAR(50), NgayTao DATETIME2);
    INSERT dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, TrangThai)
    VALUES (N'TEST Cinema Image Fixes', N'Test address', N'Test city', N'Hoạt động');
    SET @RapID = SCOPE_IDENTITY();

    -- BUG-003: INSERT ... EXEC fails if a leading lock result set has a different shape,
    -- and the DTO must describe the row that was just created / selected.
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_Create @RapID, N'https://example.invalid/fix-1.jpg', N'Ảnh 1', 1, 0, N'Hoạt động';
    SELECT @Image1 = HinhAnhRapID FROM @Dto;
    IF (SELECT COUNT(*) FROM @Dto) <> 1 OR NOT EXISTS (SELECT 1 FROM @Dto WHERE RapID = @RapID AND URL = N'https://example.invalid/fix-1.jpg' AND LaAnhDaiDien = 1)
        THROW 51101, N'Create did not return exactly the created image.', 1;

    DELETE @Dto;
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_Create @RapID, N'https://example.invalid/fix-2.jpg', N'Ảnh 2', 0, 1, N'Hoạt động';
    SELECT @Image2 = HinhAnhRapID FROM @Dto;

    DELETE @Dto;
    INSERT @Dto EXEC dbo.usp_Admin_CinemaImage_SetCover @RapID, @Image2;
    IF (SELECT COUNT(*) FROM @Dto) <> 1 OR NOT EXISTS (SELECT 1 FROM @Dto WHERE HinhAnhRapID = @Image2 AND LaAnhDaiDien = 1)
        THROW 51102, N'SetCover did not return exactly the new cover image.', 1;
    IF (SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND LaAnhDaiDien = 1) <> 1
        THROW 51103, N'Cinema image cover uniqueness failed.', 1;

    -- BUG-002: out-of-domain TrangThai is rejected by the CHECK; the hidden state is accepted.
    BEGIN TRY
        INSERT dbo.HINHANH_RAPCHIEUPHIM (RapID, URL, TrangThai) VALUES (@RapID, N'https://example.invalid/bad.jpg', N'INVALID_AUDIT');
        THROW 51104, N'Out-of-domain image status was accepted.', 1;
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 51104 THROW;
        IF ERROR_NUMBER() <> 547 THROW;
    END CATCH;
    INSERT dbo.HINHANH_RAPCHIEUPHIM (RapID, URL, TrangThai) VALUES (@RapID, N'https://example.invalid/hidden.jpg', N'Tạm ẩn');

    ROLLBACK TRANSACTION;
    PRINT N'Cinema image fix tests passed.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

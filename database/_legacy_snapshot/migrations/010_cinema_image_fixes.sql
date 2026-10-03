-- Fixes for the ADM-07 cinema image contract introduced by migration 009.
-- Migrations 008/009 are already deployed and are intentionally left untouched.
-- Idempotent: CREATE OR ALTER procedures and guarded constraint creation.

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- BUG-003: the key-range lock used to be a bare SELECT, which sent an extra
-- result set to the client ahead of the final image DTO. The backend reads the
-- first result set, so create returned null and set-cover returned a lock row.
-- The lock is now taken by assigning to a variable (it still scans, and so
-- locks, every image row of the cinema); the DTO is the only result set.
-- Transaction, lock and one-cover-per-cinema logic are otherwise unchanged.
CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_Create
    @RapID INT,
    @URL NVARCHAR(500),
    @MoTa NVARCHAR(255) = NULL,
    @LaAnhDaiDien BIT = 0,
    @ThuTuHienThi INT = 0,
    @TrangThai NVARCHAR(50) = N'Hoạt động'
AS
BEGIN
    SET NOCOUNT ON;
    IF LEN(LTRIM(RTRIM(ISNULL(@URL, N'')))) = 0 THROW 50220, N'URL ảnh không được để trống.', 1;
    IF @ThuTuHienThi < 0 THROW 50221, N'Thứ tự hiển thị phải lớn hơn hoặc bằng 0.', 1;
    DECLARE @OwnTransaction BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    DECLARE @LockedImageID INT;
    BEGIN TRY
        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageCreate;
        IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID)
            THROW 50200, N'Rạp không tồn tại.', 1;
        SELECT @LockedImageID = HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;
        IF @LaAnhDaiDien = 1
            UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 0 WHERE RapID = @RapID AND LaAnhDaiDien = 1;
        INSERT dbo.HINHANH_RAPCHIEUPHIM (RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai)
        VALUES (@RapID, @URL, @MoTa, @LaAnhDaiDien, @ThuTuHienThi, @TrangThai);
        DECLARE @HinhAnhRapID INT = SCOPE_IDENTITY();
        IF @OwnTransaction = 1 COMMIT TRANSACTION;
        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
        BEGIN
            IF @OwnTransaction = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION CinemaImageCreate;
        END;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_SetCover
    @RapID INT,
    @HinhAnhRapID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTransaction BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    DECLARE @LockedImageID INT;
    BEGIN TRY
        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageSetCover;
        -- Key-range locking serializes cover changes for one cinema.
        SELECT @LockedImageID = HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;
        IF NOT EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID)
            THROW 50230, N'Ảnh rạp không tồn tại trong phạm vi rạp.', 1;
        IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID AND TrangThai <> N'Hoạt động')
            THROW 50232, N'Chỉ ảnh đang hoạt động mới có thể là ảnh đại diện.', 1;
        UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 0 WHERE RapID = @RapID AND LaAnhDaiDien = 1;
        UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 1 WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID;
        IF @OwnTransaction = 1 COMMIT TRANSACTION;
        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
        BEGIN
            IF @OwnTransaction = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION CinemaImageSetCover;
        END;
        THROW;
    END CATCH
END;
GO

-- BUG-002: HINHANH_RAPCHIEUPHIM.TrangThai had only a DEFAULT, so any text was stored.
-- Domain: N'Hoạt động' (the only value 009 defines and filters on) and N'Tạm ẩn'
-- (the hidden state that the Update procedure's "not active" branch implies).
-- Step 1: rows outside the domain are NOT deleted; they are normalised to N'Tạm ẩn'
-- (public gallery/cover only ever show N'Hoạt động', so visibility is unchanged) and,
-- like usp_Admin_CinemaImage_Update does for a disabled image, lose the cover flag.
DECLARE @InvalidImageStatusCount INT =
(
    SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM
    WHERE TrangThai NOT IN (N'Hoạt động', N'Tạm ẩn')
);
PRINT CONCAT(N'HINHANH_RAPCHIEUPHIM rows with TrangThai outside the whitelist: ', @InvalidImageStatusCount);
IF @InvalidImageStatusCount > 0
BEGIN
    UPDATE dbo.HINHANH_RAPCHIEUPHIM
    SET TrangThai = N'Tạm ẩn', LaAnhDaiDien = 0
    WHERE TrangThai NOT IN (N'Hoạt động', N'Tạm ẩn');
    PRINT CONCAT(N'Normalised to Tạm ẩn: ', @@ROWCOUNT);
END;
GO

-- Step 2: only after the data is clean, add the named CHECK constraint (idempotent).
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_HINHANH_RAPCHIEUPHIM_TrangThai' AND parent_object_id = OBJECT_ID(N'dbo.HINHANH_RAPCHIEUPHIM'))
    ALTER TABLE dbo.HINHANH_RAPCHIEUPHIM WITH CHECK
        ADD CONSTRAINT CK_HINHANH_RAPCHIEUPHIM_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Tạm ẩn'));
GO

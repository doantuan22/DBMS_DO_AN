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

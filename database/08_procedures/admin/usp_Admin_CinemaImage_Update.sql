SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- usp_Admin_CinemaImage_Update (migration 009) ran without a transaction or the
-- cinema-wide key-range lock that Create/SetCover take. Its row-level UPDATE locks
-- were acquired in a different order than SetCover's, so concurrent Update and
-- SetCover on one cinema could deadlock (one request failed with HTTP 500).
-- It now takes the same lock first, assigned to a variable so that no extra result
-- set reaches the client. Validation order, error numbers/messages, the "disabling
-- an image clears its cover flag" rule and the single DTO result set are unchanged.
CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_Update
    @RapID INT,
    @HinhAnhRapID INT,
    @URL NVARCHAR(500),
    @MoTa NVARCHAR(255) = NULL,
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
        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageUpdate;
        -- Same key-range lock (and order) as Create/SetCover: serialises all image changes of one cinema.
        SELECT @LockedImageID = HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;
        IF NOT EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID)
            THROW 50230, N'Ảnh rạp không tồn tại trong phạm vi rạp.', 1;
        -- Disabling a cover clears it; no replacement is automatically selected.
        UPDATE dbo.HINHANH_RAPCHIEUPHIM
        SET URL = @URL, MoTa = @MoTa, ThuTuHienThi = @ThuTuHienThi, TrangThai = @TrangThai,
            LaAnhDaiDien = CASE WHEN @TrangThai = N'Hoạt động' THEN LaAnhDaiDien ELSE 0 END
        WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID;
        IF @OwnTransaction = 1 COMMIT TRANSACTION;
        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
        BEGIN
            IF @OwnTransaction = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION CinemaImageUpdate;
        END;
        THROW;
    END CATCH
END;
GO

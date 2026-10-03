SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
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

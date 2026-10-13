SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_SetCover

    @ActorID INT,
    @RapID INT,
    @HinhAnhRapID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

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

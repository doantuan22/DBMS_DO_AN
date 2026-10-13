SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Actor_Delete
(
    @ActorID INT,
    @DienVienID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ('ADMIN'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, 'QL_DANHMUC_PHIM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    SET XACT_ABORT ON;
    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END, @LockedActor INT;
    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminActorDelete;
        -- X is incompatible with replacement's shared validation lock. Acquire it
        -- before the association read, preventing check-before-insert cascade races.
        SELECT @LockedActor = DienVienID FROM dbo.DIENVIEN WITH (XLOCK, HOLDLOCK)
        WHERE DienVienID = @DienVienID;
        IF @LockedActor IS NULL THROW 50100, N'Diễn viên không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.PHIM_DIENVIEN WHERE DienVienID = @DienVienID)
            THROW 50101, N'Diễn viên đang tham gia phim nên không thể xóa.', 1;
        DELETE FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;
        IF @OwnTran = 1 COMMIT TRANSACTION;
        SELECT N'Đã xóa diễn viên.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTran = 1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION AdminActorDelete;
        END;
        THROW;
    END CATCH;
END;
GO

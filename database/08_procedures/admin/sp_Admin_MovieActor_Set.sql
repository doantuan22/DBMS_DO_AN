SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_MovieActor_Set
(
    @ActorID INT,
    @PhimID INT,
    @DanhSachJson NVARCHAR(MAX)
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

    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END,
        @LockedMovie INT, @Requested INT, @Matched INT;
    BEGIN TRY
        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminMovieActorSet;

        -- Serialize replacements and protect the parent against concurrent deletion.
        SELECT @LockedMovie = PhimID FROM dbo.PHIM WITH (UPDLOCK, HOLDLOCK)
        WHERE PhimID = @PhimID;
        IF @LockedMovie IS NULL THROW 50102, N'Phim không tồn tại.', 1;

        IF @DanhSachJson IS NULL OR ISJSON(@DanhSachJson) <> 1
            THROW 50103, N'Danh sách diễn viên phải là JSON hợp lệ.', 1;
        IF LEFT(LTRIM(REPLACE(REPLACE(REPLACE(@DanhSachJson, NCHAR(9), N' '), NCHAR(10), N' '), NCHAR(13), N' ')), 1) <> N'['
            THROW 50103, N'Danh sách diễn viên phải là JSON array.', 1;
        IF EXISTS (SELECT 1 FROM OPENJSON(@DanhSachJson) WHERE [type] <> 5)
            THROW 50103, N'Mỗi diễn viên phải là một JSON object.', 1;

        -- Keep raw values/types/counts until validation, avoiding implicit conversion,
        -- truncation and silent omission. SQL roles remain nullable as in the schema.
        DECLARE @Raw TABLE (IDValue NVARCHAR(MAX), IDType INT, IDCount INT,
            RoleValue NVARCHAR(MAX), RoleType INT, RoleCount INT);
        INSERT @Raw
        SELECT p.IDValue, p.IDType, p.IDCount, p.RoleValue, p.RoleType, p.RoleCount
        FROM OPENJSON(@DanhSachJson) item
        CROSS APPLY (
            SELECT MAX(CASE WHEN [key] = N'DienVienID' THEN [value] END) IDValue,
                MAX(CASE WHEN [key] = N'DienVienID' THEN [type] END) IDType,
                COUNT(CASE WHEN [key] = N'DienVienID' THEN 1 END) IDCount,
                MAX(CASE WHEN [key] = N'VaiDien' THEN [value] END) RoleValue,
                MAX(CASE WHEN [key] = N'VaiDien' THEN [type] END) RoleType,
                COUNT(CASE WHEN [key] = N'VaiDien' THEN 1 END) RoleCount
            FROM OPENJSON(item.[value])
        ) p;
        IF EXISTS (SELECT 1 FROM @Raw WHERE IDCount <> 1 OR IDType <> 2
            OR IDValue COLLATE Latin1_General_100_BIN2 LIKE N'%[^0-9]%'
            OR TRY_CONVERT(INT, IDValue) IS NULL OR TRY_CONVERT(INT, IDValue) < 1
            OR RoleCount > 1 OR RoleType NOT IN (0, 1) OR DATALENGTH(RoleValue) > 300)
            THROW 50103, N'Mã hoặc vai diễn không hợp lệ.', 1;

        DECLARE @Cast TABLE (DienVienID INT NOT NULL, VaiDien NVARCHAR(150) NULL);
        INSERT @Cast SELECT CONVERT(INT, IDValue), CONVERT(NVARCHAR(150), RoleValue) FROM @Raw;
        IF EXISTS (SELECT 1 FROM @Cast GROUP BY DienVienID HAVING COUNT(*) > 1)
            THROW 50103, N'Danh sách chứa mã diễn viên trùng lặp.', 1;
        SELECT @Requested = COUNT(*) FROM @Cast;
        -- Shared actor key locks live until transaction end. Actor Delete takes X
        -- on that same parent before checking associations, including under RCSI.
        SELECT @Matched = COUNT(*) FROM @Cast c
        INNER JOIN dbo.DIENVIEN dv WITH (HOLDLOCK) ON dv.DienVienID = c.DienVienID;
        IF @Matched <> @Requested THROW 50100, N'Diễn viên không tồn tại.', 1;

        DELETE FROM dbo.PHIM_DIENVIEN WHERE PhimID = @PhimID;
        INSERT INTO dbo.PHIM_DIENVIEN (PhimID, DienVienID, VaiDien)
        SELECT @PhimID, DienVienID, VaiDien FROM @Cast;
        IF @@ROWCOUNT <> @Requested THROW 50103, N'Danh sách diễn viên chưa được lưu đầy đủ.', 1;

        -- Snapshot this replacement's persisted response while the movie is locked.
        DECLARE @Result TABLE (PhimID INT, DienVienID INT, HoTen NVARCHAR(150), VaiDien NVARCHAR(150));
        INSERT @Result
        SELECT pd.PhimID, dv.DienVienID, dv.HoTen, pd.VaiDien
        FROM dbo.PHIM_DIENVIEN pd
        INNER JOIN dbo.DIENVIEN dv ON dv.DienVienID = pd.DienVienID
        WHERE pd.PhimID = @PhimID;
        IF (SELECT COUNT(*) FROM @Result) <> @Requested
            THROW 50103, N'Danh sách diễn viên chưa được lưu đầy đủ.', 1;
        IF @OwnTran = 1 COMMIT TRANSACTION;
        SELECT PhimID, DienVienID, HoTen, VaiDien FROM @Result ORDER BY DienVienID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTran = 1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION AdminMovieActorSet;
        END;
        THROW;
    END CATCH
END;
GO

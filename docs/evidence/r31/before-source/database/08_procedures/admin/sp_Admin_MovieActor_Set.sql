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

    IF NOT EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID = @PhimID)
    BEGIN
        ;THROW 50102, N'Phim không tồn tại.', 1;
    END

    IF @DanhSachJson IS NULL OR ISJSON(@DanhSachJson) <> 1
    BEGIN
        ;THROW 50103, N'Danh sách diễn viên phải là JSON hợp lệ.', 1;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.PHIM_DIENVIEN WHERE PhimID = @PhimID;

        INSERT INTO dbo.PHIM_DIENVIEN (PhimID, DienVienID, VaiDien)
        SELECT @PhimID, j.DienVienID, MAX(j.VaiDien)
        FROM OPENJSON(@DanhSachJson)
             WITH (DienVienID INT '$.DienVienID', VaiDien NVARCHAR(150) '$.VaiDien') j
        INNER JOIN dbo.DIENVIEN dv ON dv.DienVienID = j.DienVienID
        GROUP BY j.DienVienID;

        COMMIT TRANSACTION;

        SELECT pd.PhimID, dv.DienVienID, dv.HoTen, pd.VaiDien
        FROM dbo.PHIM_DIENVIEN pd
        INNER JOIN dbo.DIENVIEN dv ON dv.DienVienID = pd.DienVienID
        WHERE pd.PhimID = @PhimID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

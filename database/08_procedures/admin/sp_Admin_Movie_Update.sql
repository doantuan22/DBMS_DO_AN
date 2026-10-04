SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Movie_Update
(
    @ActorID INT,
    @PhimID INT,
    @TenPhim NVARCHAR(255),
    @ThoiLuong INT,
    @NgayKhoiChieu DATE,
    @NgayKetThuc DATE = NULL,
    @NgonNgu NVARCHAR(100) = NULL,
    @PhuDe NVARCHAR(100) = NULL,
    @DoTuoi NVARCHAR(20) = NULL,
    @DaoDien NVARCHAR(150) = NULL,
    @MoTa NVARCHAR(MAX) = NULL,
    @PosterURL NVARCHAR(500) = NULL,
    @TrailerURL NVARCHAR(500) = NULL,
    @TrangThai NVARCHAR(50),
    @TheLoaiIdList VARCHAR(MAX) = NULL
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

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.PHIM
        SET TenPhim = @TenPhim,
            ThoiLuong = @ThoiLuong,
            NgayKhoiChieu = @NgayKhoiChieu,
            NgayKetThuc = @NgayKetThuc,
            NgonNgu = @NgonNgu,
            PhuDe = @PhuDe,
            DoTuoi = @DoTuoi,
            DaoDien = @DaoDien,
            MoTa = @MoTa,
            PosterURL = @PosterURL,
            TrailerURL = @TrailerURL,
            TrangThai = @TrangThai
        WHERE PhimID = @PhimID;

        IF @TheLoaiIdList IS NOT NULL
        BEGIN
            DELETE FROM dbo.PHIM_THELOAI WHERE PhimID = @PhimID;

            INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID)
            SELECT DISTINCT @PhimID, CAST(value AS INT)
            FROM STRING_SPLIT(@TheLoaiIdList, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END

        COMMIT TRANSACTION;

        EXEC dbo.sp_Movie_GetDetail @PhimID = @PhimID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

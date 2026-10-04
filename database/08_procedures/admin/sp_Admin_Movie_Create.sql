SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Admin_Movie_Create
(
    @ActorID INT,
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
    @TheLoaiIdList VARCHAR(MAX) = NULL,
    @NewPhimID INT OUTPUT
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

        INSERT INTO dbo.PHIM (TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai)
        VALUES (@TenPhim, @ThoiLuong, @NgayKhoiChieu, @NgayKetThuc, @NgonNgu, @PhuDe, @DoTuoi, @DaoDien, @MoTa, @PosterURL, @TrailerURL, N'Đang chiếu');

        SET @NewPhimID = SCOPE_IDENTITY();

        IF @TheLoaiIdList IS NOT NULL
        BEGIN
            INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID)
            SELECT DISTINCT @NewPhimID, CAST(value AS INT)
            FROM STRING_SPLIT(@TheLoaiIdList, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END

        COMMIT TRANSACTION;

        EXEC dbo.sp_Movie_GetDetail @PhimID = @NewPhimID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

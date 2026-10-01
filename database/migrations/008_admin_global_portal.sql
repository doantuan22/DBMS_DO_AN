-- Phase 9 Admin-global contracts. Migration 007 was previously used by the
-- removed ADM-17 experiment; this file intentionally starts at 008.
-- No Admin procedure below checks or relies on Manager cinema assignments.

-- Remove the obsolete permission seed left by ADM-17. This is intentionally
-- limited to its RBAC links and catalog row; no technical config is touched.
IF EXISTS (SELECT 1 FROM dbo.QUYEN WHERE MaQuyen = 'CAU_HINH_HETHONG')
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE vq
        FROM dbo.VAITRO_QUYEN vq
        INNER JOIN dbo.QUYEN q ON q.QuyenID = vq.QuyenID
        WHERE q.MaQuyen = 'CAU_HINH_HETHONG';
        DELETE dbo.QUYEN WHERE MaQuyen = 'CAU_HINH_HETHONG';
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Cinema_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai
    FROM dbo.RAPCHIEUPHIM
    ORDER BY ThanhPho, TenRap;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Product_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai
    FROM dbo.SANPHAM
    ORDER BY TenSanPham;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Movie_List
    @TrangThai NVARCHAR(50) = NULL, @TheLoaiID INT = NULL, @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT p.PhimID, p.TenPhim, p.ThoiLuong, p.NgayKhoiChieu, p.NgayKetThuc, p.NgonNgu,
           p.PhuDe, p.DoTuoi, p.DaoDien, p.MoTa, p.PosterURL, p.TrailerURL, p.TrangThai,
           STUFF((SELECT ',' + CAST(pt.TheLoaiID AS VARCHAR(12)) FROM dbo.PHIM_THELOAI pt
                  WHERE pt.PhimID = p.PhimID ORDER BY pt.TheLoaiID FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS TheLoaiIdList,
           (SELECT pd.DienVienID AS actorId, pd.VaiDien AS [role] FROM dbo.PHIM_DIENVIEN pd
            WHERE pd.PhimID = p.PhimID ORDER BY pd.DienVienID FOR JSON PATH) AS DanhSachDienVienJson
    FROM dbo.PHIM p
    LEFT JOIN dbo.PHIM_THELOAI ptFilter ON ptFilter.PhimID = p.PhimID
    WHERE (@TrangThai IS NULL OR p.TrangThai = @TrangThai)
      AND (@TheLoaiID IS NULL OR ptFilter.TheLoaiID = @TheLoaiID)
      AND (@SearchTerm IS NULL OR p.TenPhim LIKE '%' + @SearchTerm + '%' OR p.DaoDien LIKE '%' + @SearchTerm + '%')
    ORDER BY p.NgayKhoiChieu DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_List
    @RapID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT pc.PhongID, pc.RapID, r.TenRap, pc.TenPhong, pc.LoaiPhong, pc.TrangThai,
           (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe
    FROM dbo.PHONGCHIEU pc
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE @RapID IS NULL OR pc.RapID = @RapID
    ORDER BY r.TenRap, pc.TenPhong;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Create
    @RapID INT, @TenPhong NVARCHAR(100), @LoaiPhong NVARCHAR(50) = N'2D'
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50200, N'Rạp không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong)
        THROW 50201, N'Tên phòng đã tồn tại trong rạp.', 1;
    INSERT dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai)
    VALUES (@RapID, @TenPhong, @LoaiPhong, N'Hoạt động');
    SELECT PhongID, RapID, TenPhong, LoaiPhong, TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Update
    @PhongID INT, @TenPhong NVARCHAR(100), @LoaiPhong NVARCHAR(50), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RapID INT = (SELECT RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID);
    IF @RapID IS NULL THROW 50202, N'Phòng không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong AND PhongID <> @PhongID)
        THROW 50201, N'Tên phòng đã tồn tại trong rạp.', 1;
    UPDATE dbo.PHONGCHIEU SET TenPhong = @TenPhong, LoaiPhong = @LoaiPhong, TrangThai = @TrangThai WHERE PhongID = @PhongID;
    SELECT PhongID, RapID, TenPhong, LoaiPhong, TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Room_Delete @PhongID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE PhongID = @PhongID)
            THROW 50202, N'Phòng không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE PhongID = @PhongID)
            THROW 50203, N'Phòng đã có lịch sử suất chiếu; hãy đổi trạng thái thay vì xóa.', 1;
        DELETE dbo.GHE WHERE PhongID = @PhongID;
        DELETE dbo.PHONGCHIEU WHERE PhongID = @PhongID;
        COMMIT TRANSACTION;
        SELECT N'Đã xóa phòng.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_List
    @PhongID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT g.GheID, g.PhongID, pc.RapID, r.TenRap, g.HangGhe, g.SoGhe,
           g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe, g.LoaiGhe, g.TrangThai
    FROM dbo.GHE g
    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = g.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    WHERE @PhongID IS NULL OR g.PhongID = @PhongID
    ORDER BY r.TenRap, pc.TenPhong, g.HangGhe, g.SoGhe;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Create
    @PhongID INT, @HangGhe VARCHAR(10), @SoGhe INT, @LoaiGhe NVARCHAR(50) = N'Thường'
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)
        THROW 50204, N'Phòng không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @HangGhe AND SoGhe = @SoGhe)
        THROW 50205, N'Vị trí ghế đã tồn tại trong phòng.', 1;
    INSERT dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)
    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N'Hoạt động');
    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai FROM dbo.GHE WHERE GheID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Update
    @GheID INT, @LoaiGhe NVARCHAR(50), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.GHE WITH (UPDLOCK, HOLDLOCK) WHERE GheID = @GheID)
            THROW 50206, N'Ghế không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)
            THROW 50207, N'Ghế có lịch sử vé; không thể sửa loại/trạng thái.', 1;
        UPDATE dbo.GHE SET LoaiGhe = @LoaiGhe, TrangThai = @TrangThai WHERE GheID = @GheID;
        COMMIT TRANSACTION;
        SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai FROM dbo.GHE WHERE GheID = @GheID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Seat_Delete @GheID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.GHE WITH (UPDLOCK, HOLDLOCK) WHERE GheID = @GheID)
            THROW 50206, N'Ghế không tồn tại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)
            THROW 50207, N'Ghế có lịch sử vé; hãy vô hiệu hóa thay vì xóa.', 1;
        DELETE dbo.GHE WHERE GheID = @GheID;
        COMMIT TRANSACTION;
        SELECT N'Đã xóa ghế.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_List @RapID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT bg.GiaID, bg.RapID, r.TenRap, bg.LoaiGhe, bg.LoaiNgay, bg.DinhDang,
           bg.PhuThu, bg.NgayBatDau, bg.NgayKetThuc, bg.TrangThai
    FROM dbo.BANGGIA bg INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = bg.RapID
    WHERE @RapID IS NULL OR bg.RapID = @RapID
    ORDER BY r.TenRap, bg.NgayBatDau DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_Create
    @RapID INT, @LoaiGhe NVARCHAR(50), @LoaiNgay NVARCHAR(50), @DinhDang NVARCHAR(50),
    @PhuThu DECIMAL(18,2), @NgayBatDau DATE, @NgayKetThuc DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50208, N'Rạp không tồn tại.', 1;
    IF @PhuThu < 0 OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau)
        THROW 50209, N'Khoảng ngày hoặc phụ thu không hợp lệ.', 1;
    INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai)
    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @DinhDang, @PhuThu, @NgayBatDau, @NgayKetThuc, N'Áp dụng');
    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA WHERE GiaID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Pricing_Update @GiaID INT, @PhuThu DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE GiaID = @GiaID)
        THROW 50210, N'Bảng giá không tồn tại.', 1;
    IF @PhuThu < 0 THROW 50209, N'Phụ thu không hợp lệ.', 1;
    UPDATE dbo.BANGGIA SET PhuThu = @PhuThu, TrangThai = @TrangThai WHERE GiaID = @GiaID;
    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai
    FROM dbo.BANGGIA WHERE GiaID = @GiaID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_List
    @RapID INT = NULL, @TuNgay DATE = NULL, @DenNgay DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT sc.SuatChieuID, sc.PhimID, p.TenPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,
           sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai
    FROM dbo.SUATCHIEU sc
    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID
    INNER JOIN dbo.PHIM p ON p.PhimID = sc.PhimID
    WHERE (@RapID IS NULL OR pc.RapID = @RapID)
      AND (@TuNgay IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) >= @TuNgay)
      AND (@DenNgay IS NULL OR CAST(sc.ThoiGianBatDau AS DATE) <= @DenNgay)
    ORDER BY sc.ThoiGianBatDau DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Create
    @PhimID INT, @PhongID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50) = N'2D', @GiaVeCoBan DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewSuatChieuID INT;
    IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50211, N'Thời gian suất chiếu không hợp lệ.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)
        THROW 50056, N'Phòng chiếu không tồn tại.', 1;
    INSERT dbo.SUATCHIEU (PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
    VALUES (@PhimID, @PhongID, @ThoiGianBatDau, @ThoiGianKetThuc, @DinhDang, @GiaVeCoBan, N'Mở bán');
    SET @NewSuatChieuID = SCOPE_IDENTITY();
    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @NewSuatChieuID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Update
    @SuatChieuID INT, @PhimID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,
    @DinhDang NVARCHAR(50), @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID = @SuatChieuID)
        THROW 50058, N'Suất chiếu không tồn tại.', 1;
    IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50211, N'Thời gian suất chiếu không hợp lệ.', 1;
    UPDATE dbo.SUATCHIEU
    SET PhimID = @PhimID, ThoiGianBatDau = @ThoiGianBatDau, ThoiGianKetThuc = @ThoiGianKetThuc,
        DinhDang = @DinhDang, GiaVeCoBan = @GiaVeCoBan, TrangThai = @TrangThai
    WHERE SuatChieuID = @SuatChieuID;
    EXEC dbo.sp_Showtime_GetDetail @SuatChieuID = @SuatChieuID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Showtime_Cancel @SuatChieuID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTransaction BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    DECLARE @Status NVARCHAR(50);
    BEGIN TRY
        IF @OwnTransaction = 1 BEGIN TRANSACTION;
        ELSE SAVE TRANSACTION AdminShowtimeCancel;
        SELECT @Status = TrangThai FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE SuatChieuID = @SuatChieuID;
        IF @Status IS NULL THROW 50116, N'Suất chiếu không tồn tại.', 1;
        IF @Status = N'Đã hủy' THROW 50117, N'Suất chiếu đã bị hủy.', 1;
        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;
        IF EXISTS (SELECT 1 FROM dbo.DONDATVE ddv WHERE ddv.SuatChieuID = @SuatChieuID
                   AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, SYSDATETIME()) = 1)
            THROW 50118, N'Suất chiếu đang có đơn giữ ghế; không thể hủy.', 1;
        UPDATE dbo.SUATCHIEU SET TrangThai = N'Đã hủy' WHERE SuatChieuID = @SuatChieuID;
        IF @OwnTransaction = 1 COMMIT TRANSACTION;
        SELECT N'Đã hủy suất chiếu.' AS [Message];
    END TRY
    BEGIN CATCH
        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @OwnTransaction = 1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION AdminShowtimeCancel;
        END
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_Assignment_Update
    @PhanCongID INT, @NguoiDungID INT, @RapID INT, @NgayBatDau DATE,
    @NgayKetThuc DATE = NULL, @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WITH (UPDLOCK, HOLDLOCK) WHERE PhanCongID = @PhanCongID)
            THROW 50212, N'Phân công không tồn tại.', 1;
        IF NOT EXISTS (
            SELECT 1 FROM dbo.NGUOIDUNG nd WITH (HOLDLOCK) INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
            WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro = 'QUAN_LY_RAP'
        ) THROW 50071, N'Tài khoản được phân công phải có vai trò QUAN_LY_RAP.', 1;
        IF @NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau
            THROW 50213, N'Khoảng thời gian phân công không hợp lệ.', 1;
        UPDATE dbo.PHANCONG_RAP
        SET NguoiDungID = @NguoiDungID, RapID = @RapID, NgayBatDau = @NgayBatDau,
            NgayKetThuc = @NgayKetThuc, TrangThai = @TrangThai
        WHERE PhanCongID = @PhanCongID;
        COMMIT TRANSACTION;
        SELECT p.PhanCongID, p.NguoiDungID, nd.HoTen AS TenQuanLy, nd.Email, p.RapID, r.TenRap,
               p.NgayBatDau, p.NgayKetThuc, p.TrangThai
        FROM dbo.PHANCONG_RAP p INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = p.NguoiDungID
        INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = p.RapID WHERE p.PhanCongID = @PhanCongID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_RolePermission_List @VaiTroID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)
        THROW 50214, N'Vai trò không tồn tại.', 1;
    SELECT vq.VaiTroID, q.QuyenID, q.MaQuyen, q.TenQuyen
    FROM dbo.VAITRO_QUYEN vq INNER JOIN dbo.QUYEN q ON q.QuyenID = vq.QuyenID
    WHERE vq.VaiTroID = @VaiTroID ORDER BY q.MaQuyen;
END;
GO

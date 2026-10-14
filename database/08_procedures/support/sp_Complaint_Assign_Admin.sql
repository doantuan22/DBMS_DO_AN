-- Quản trị viên phân công hoặc chuyển giao nhân viên phụ trách: sp_Complaint_Assign_Admin
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Assign_Admin
    (
    @AdminID INT,
    @KhieuNaiID INT,
    @NhanVienMoiID INT = NULL,
    @LyDo NVARCHAR(500) = NULL
    )
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản Admin
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG
        WHERE NguoiDungID = @AdminID AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;

    -- Kiểm tra vai trò ADMIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @AdminID AND vt.MaVaiTro = 'ADMIN'
    )
        THROW 50301, N'Chỉ Quản trị viên mới có quyền phân công nhân viên.', 1;

    -- Kiểm tra quyền KHIEUNAI_PHANCONG
    IF dbo.fn_KiemTraQuyenNguoiDung(@AdminID, 'KHIEUNAI_PHANCONG') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    -- Nếu phân công cho nhân viên mới, kiểm tra nhân viên đó có hợp lệ không
    IF @NhanVienMoiID IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
            WHERE nd.NguoiDungID = @NhanVienMoiID
              AND nd.TrangThai = N'Hoạt động'
              AND vt.MaVaiTro = 'CSKH'
        )
            THROW 50603, N'Nhân viên được phân công không hợp lệ hoặc đã bị khóa.', 1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @NhanVienCuID INT, @CurrentTrangThai NVARCHAR(50);
        SELECT
            @NhanVienCuID = NhanVienPhuTrachID,
            @CurrentTrangThai = TrangThai
        FROM dbo.KHIEUNAI WITH (UPDLOCK, HOLDLOCK)
        WHERE KhieuNaiID = @KhieuNaiID;

        IF @CurrentTrangThai IS NULL
            THROW 50061, N'Khiếu nại không tồn tại.', 1;

        DECLARE @TrangThaiMoi NVARCHAR(50) = @CurrentTrangThai;
        IF @NhanVienMoiID IS NOT NULL AND @CurrentTrangThai = N'Mới'
            SET @TrangThaiMoi = N'Đang xử lý';

        -- Cập nhật người phụ trách
        UPDATE dbo.KHIEUNAI
        SET
            NhanVienPhuTrachID = @NhanVienMoiID,
            TrangThai = @TrangThaiMoi
        WHERE KhieuNaiID = @KhieuNaiID;

        -- Ghi lịch sử phân công
        INSERT INTO dbo.LICHSU_PHANCONG_KHIEUNAI (
            KhieuNaiID,
            NhanVienCuID,
            NhanVienMoiID,
            NguoiThucHienID,
            ThoiGian,
            LyDo
        )
        VALUES (
            @KhieuNaiID,
            @NhanVienCuID,
            @NhanVienMoiID,
            @AdminID,
            dbo.fn_BayGio(),
            ISNULL(@LyDo, CASE
                WHEN @NhanVienMoiID IS NULL THEN N'Admin thu hồi phân công nhân viên'
                WHEN @NhanVienCuID IS NULL THEN N'Admin phân công nhân viên phụ trách'
                ELSE N'Admin chuyển giao nhân viên phụ trách'
            END)
        );

        -- Ghi nhật ký xử lý
        INSERT INTO dbo.XULY_KHIEUNAI (
            KhieuNaiID,
            NguoiXuLyID,
            NoiDungXuLy,
            NgayXuLy,
            TrangThaiSauXuLy
        )
        VALUES (
            @KhieuNaiID,
            @AdminID,
            CASE
                WHEN @NhanVienMoiID IS NULL THEN N'Admin thu hồi phân công nhân viên.'
                ELSE N'Admin phân công/chuyển giao nhân viên phụ trách khiếu nại.'
            END,
            dbo.fn_BayGio(),
            @TrangThaiMoi
        );

        COMMIT TRANSACTION;

        SELECT
            kn.KhieuNaiID,
            kn.NguoiDungID,
            kn.DonDatVeID,
            kn.LoaiKhieuNai,
            kn.TieuDe,
            kn.NoiDung,
            kn.MucDoUuTien,
            kn.NgayTao,
            kn.TrangThai,
            kn.NhanVienPhuTrachID,
            nd.HoTen AS TenNhanVienPhuTrach
        FROM dbo.KHIEUNAI kn
        LEFT JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = kn.NhanVienPhuTrachID
        WHERE kn.KhieuNaiID = @KhieuNaiID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

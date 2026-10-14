-- Quản trị viên phân công nhân viên phụ trách lần đầu (một lần duy nhất): sp_Complaint_Assign_Admin
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Assign_Admin
    (
    @AdminID INT,
    @KhieuNaiID INT,
    @NhanVienMoiID INT,
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

    -- Bắt buộc phải truyền ID nhân viên hợp lệ, không cho phép thu hồi (NULL)
    IF @NhanVienMoiID IS NULL
        THROW 50604, N'Phải chỉ định nhân viên CSKH phụ trách hợp lệ.', 1;

    -- Kiểm tra nhân viên được phân công có tồn tại và đang hoạt động với vai trò CSKH
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @NhanVienMoiID
          AND nd.TrangThai = N'Hoạt động'
          AND vt.MaVaiTro = 'CSKH'
    )
        THROW 50603, N'Nhân viên được phân công không hợp lệ hoặc đã bị khóa.', 1;

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

        -- Quy tắc nghiệp vụ: Mỗi khiếu nại chỉ được phân công 1 lần duy nhất, không cho phép phân công lại hoặc chuyển giao
        IF @NhanVienCuID IS NOT NULL
            THROW 50601, N'Khiếu nại này đã có nhân viên phụ trách và không thể phân công lại.', 1;

        DECLARE @TrangThaiMoi NVARCHAR(50) = CASE
            WHEN @CurrentTrangThai = N'Mới' THEN N'Đang xử lý'
            ELSE @CurrentTrangThai
        END;

        -- Cập nhật người phụ trách lần đầu
        UPDATE dbo.KHIEUNAI
        SET
            NhanVienPhuTrachID = @NhanVienMoiID,
            TrangThai = @TrangThaiMoi
        WHERE KhieuNaiID = @KhieuNaiID;

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
            ISNULL(@LyDo, N'Admin phân công nhân viên phụ trách khiếu nại.'),
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

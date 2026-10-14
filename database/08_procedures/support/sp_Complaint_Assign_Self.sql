-- Nhân viên CSKH tự tiếp nhận khiếu nại (một lần duy nhất): sp_Complaint_Assign_Self
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Assign_Self
    (
    @NguoiDungID INT,
    @KhieuNaiID INT
    )
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG
        WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;

    -- Kiểm tra vai trò CSKH
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG nd
        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro = 'CSKH'
    )
        THROW 50301, N'Chỉ nhân viên Chăm sóc khách hàng mới được tự tiếp nhận khiếu nại.', 1;

    -- Kiểm tra quyền KHIEUNAI_TIEPNHAN
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_TIEPNHAN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Khóa bản ghi khiếu nại để chống tranh chấp đồng thời
        DECLARE @CurrentPhuTrach INT, @CurrentTrangThai NVARCHAR(50);
        SELECT
            @CurrentPhuTrach = NhanVienPhuTrachID,
            @CurrentTrangThai = TrangThai
        FROM dbo.KHIEUNAI WITH (UPDLOCK, HOLDLOCK)
        WHERE KhieuNaiID = @KhieuNaiID;

        IF @CurrentTrangThai IS NULL
            THROW 50061, N'Khiếu nại không tồn tại.', 1;

        IF @CurrentPhuTrach IS NOT NULL
            THROW 50601, N'Khiếu nại này đã có nhân viên phụ trách và không thể tiếp nhận lại.', 1;

        IF @CurrentTrangThai IN (N'Đã đóng', N'Từ chối', N'Đã giải quyết')
            THROW 50602, N'Không thể tiếp nhận khiếu nại đã hoàn tất.', 1;

        DECLARE @TrangThaiMoi NVARCHAR(50) = CASE
            WHEN @CurrentTrangThai = N'Mới' THEN N'Đang xử lý'
            ELSE @CurrentTrangThai
        END;

        -- Cập nhật người phụ trách và trạng thái (chỉ 1 lần duy nhất)
        UPDATE dbo.KHIEUNAI
        SET
            NhanVienPhuTrachID = @NguoiDungID,
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
            @NguoiDungID,
            N'Nhân viên CSKH tiếp nhận xử lý khiếu nại.',
            dbo.fn_BayGio(),
            @TrangThaiMoi
        );

        COMMIT TRANSACTION;

        -- Trả về thông tin khiếu nại sau cập nhật
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

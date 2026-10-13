-- Xử lý dữ liệu xử lý khiếu nại: sp_Support_Complaint_AddProcessing.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

-- Baseline: migrations/006_support_procedure_authorization.sql:57 (dbo.sp_Support_Complaint_AddProcessing)
CREATE OR ALTER PROCEDURE dbo.sp_Support_Complaint_AddProcessing
    (
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDungXuLy NVARCHAR(MAX),
    @TrangThaiSauXuLy NVARCHAR(50)
    )
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG
        WHERE
            NguoiDungID = @NguoiDungID
            AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            dbo.NGUOIDUNG nd
            INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
        WHERE
            nd.NguoiDungID = @NguoiDungID
            AND vt.MaVaiTro IN ('CSKH', 'ADMIN')
    )
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'QL_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    -- Kiểm tra quyền chức năng trước khi thao tác.
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XULY_KHIEUNAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    -- Thực hiện nghiệp vụ và bắt lỗi khi có sự cố.
    BEGIN TRY
        -- Mở transaction để các bước ghi được xử lý cùng nhau.
        BEGIN TRANSACTION;
        IF NOT EXISTS (
            SELECT
                1
            FROM
                dbo.KHIEUNAI
            WHERE
                KhieuNaiID = @KhieuNaiID
        )
            THROW 50061, N'Khiếu nại không tồn tại.', 1;
        INSERT INTO
            dbo.XULY_KHIEUNAI(KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)
        VALUES
            (
                @KhieuNaiID,
                @NguoiDungID,
                @NoiDungXuLy,
                dbo.fn_BayGio(),
                @TrangThaiSauXuLy
            );
        -- Chốt các thay đổi của transaction.
        COMMIT TRANSACTION;
        SELECT
            XuLyID,
            KhieuNaiID,
            NguoiXuLyID,
            NoiDungXuLy,
            NgayXuLy,
            TrangThaiSauXuLy
        FROM
            dbo.XULY_KHIEUNAI
        WHERE
            XuLyID = SCOPE_IDENTITY();
    END TRY
    -- Hoàn tác khi cần và chuyển lỗi cho bên gọi.
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            -- Hoàn tác transaction hoặc savepoint khi có lỗi.
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

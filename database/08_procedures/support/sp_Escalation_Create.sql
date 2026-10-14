-- Tạo yêu cầu chuyển cấp lên Quản trị viên: sp_Escalation_Create
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Escalation_Create
    (
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @LyDo NVARCHAR(500),
    @MucDoUuTien NVARCHAR(50) = N'Trung bình'
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
        THROW 50301, N'Chỉ nhân viên Chăm sóc khách hàng mới được tạo yêu cầu chuyển cấp.', 1;

    -- Kiểm tra quyền CHUYENCAP_TAO
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'CHUYENCAP_TAO') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    -- Kiểm tra tính hợp lệ của dữ liệu đầu vào
    IF @LyDo IS NULL OR LEN(LTRIM(RTRIM(@LyDo))) = 0
        THROW 50403, N'Lý do chuyển cấp không được để trống.', 1;

    IF @MucDoUuTien NOT IN (N'Khẩn cấp', N'Cao', N'Trung bình', N'Thấp')
        THROW 50405, N'Mức ưu tiên không hợp lệ.', 1;

    -- Kiểm tra khiếu nại
    DECLARE @NhanVienPhuTrachID INT, @TrangThaiKhieuNai NVARCHAR(50);
    SELECT
        @NhanVienPhuTrachID = kn.NhanVienPhuTrachID,
        @TrangThaiKhieuNai = kn.TrangThai
    FROM dbo.KHIEUNAI kn
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    IF @TrangThaiKhieuNai IS NULL
        THROW 50061, N'Khiếu nại không tồn tại.', 1;

    IF @NhanVienPhuTrachID IS NULL OR @NhanVienPhuTrachID <> @NguoiDungID
        THROW 50305, N'Chỉ nhân viên đang phụ trách khiếu nại mới được gửi yêu cầu chuyển cấp.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Khóa kiểm tra yêu cầu chuyển cấp đang mở
        IF EXISTS (
            SELECT 1 FROM dbo.YEUCAU_CHUYENCAP WITH (UPDLOCK, HOLDLOCK)
            WHERE KhieuNaiID = @KhieuNaiID
              AND TrangThai IN (N'Chờ tiếp nhận', N'Đang xử lý')
        )
            THROW 50702, N'Khiếu nại này đang có một yêu cầu chuyển cấp chưa hoàn tất.', 1;

        -- Thêm yêu cầu chuyển cấp
        INSERT INTO dbo.YEUCAU_CHUYENCAP (
            KhieuNaiID,
            NguoiYeuCauID,
            LyDo,
            MucDoUuTien,
            AdminPhuTrachID,
            TrangThai,
            ThoiGianGui,
            ThoiGianTiepNhan,
            KetQuaXuLy,
            ThoiGianHoanTat
        )
        VALUES (
            @KhieuNaiID,
            @NguoiDungID,
            @LyDo,
            @MucDoUuTien,
            NULL,
            N'Chờ tiếp nhận',
            dbo.fn_BayGio(),
            NULL,
            NULL,
            NULL
        );

        DECLARE @NewYeuCauID INT = SCOPE_IDENTITY();

        -- Ghi nhật ký xử lý khiếu nại
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
            N'CSKH chuyển cấp lên Admin (' + @MucDoUuTien + N'): ' + @LyDo,
            dbo.fn_BayGio(),
            @TrangThaiKhieuNai
        );

        -- Ghi tin nhắn nội bộ trong cuộc hội thoại
        INSERT INTO dbo.TINNHAN_KHIEUNAI (
            KhieuNaiID,
            NguoiGuiID,
            NoiDung,
            LoaiTinNhan,
            ThoiGianGui
        )
        VALUES (
            @KhieuNaiID,
            @NguoiDungID,
            N'[YÊU CẦU CHUYỂN CẤP LÊN ADMIN - Mức độ: ' + @MucDoUuTien + N']: ' + @LyDo,
            N'Nội bộ',
            dbo.fn_BayGio()
        );

        COMMIT TRANSACTION;

        -- Trả về chi tiết yêu cầu vừa tạo
        SELECT
            yc.YeuCauID,
            yc.KhieuNaiID,
            yc.NguoiYeuCauID,
            nd_yc.HoTen AS TenNguoiYeuCau,
            yc.LyDo,
            yc.MucDoUuTien,
            yc.AdminPhuTrachID,
            yc.TrangThai,
            yc.ThoiGianGui,
            yc.ThoiGianTiepNhan,
            yc.KetQuaXuLy,
            yc.ThoiGianHoanTat
        FROM dbo.YEUCAU_CHUYENCAP yc
        INNER JOIN dbo.NGUOIDUNG nd_yc ON nd_yc.NguoiDungID = yc.NguoiYeuCauID
        WHERE yc.YeuCauID = @NewYeuCauID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

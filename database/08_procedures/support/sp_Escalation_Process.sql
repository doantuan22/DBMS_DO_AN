-- Quản trị viên xử lý và kết luận yêu cầu chuyển cấp: sp_Escalation_Process
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Escalation_Process
    (
    @AdminID INT,
    @YeuCauID INT,
    @KetQuaXuLy NVARCHAR(MAX),
    @TrangThaiMoi NVARCHAR(50)
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
        THROW 50301, N'Chỉ Quản trị viên mới được xử lý yêu cầu chuyển cấp.', 1;

    -- Kiểm tra quyền CHUYENCAP_XULY
    IF dbo.fn_KiemTraQuyenNguoiDung(@AdminID, 'CHUYENCAP_XULY') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    -- Kiểm tra trạng thái mới
    IF @TrangThaiMoi NOT IN (N'Đã giải quyết', N'Từ chối')
        THROW 50406, N'Trạng thái kết thúc không hợp lệ (chỉ chấp nhận Đã giải quyết hoặc Từ chối).', 1;

    -- Kiểm tra kết quả xử lý
    IF @KetQuaXuLy IS NULL OR LEN(LTRIM(RTRIM(@KetQuaXuLy))) = 0
        THROW 50407, N'Kết luận xử lý bắt buộc không được để trống.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @KhieuNaiID INT, @CurrentAdmin INT, @CurrentTrangThai NVARCHAR(50);
        SELECT
            @KhieuNaiID = KhieuNaiID,
            @CurrentAdmin = AdminPhuTrachID,
            @CurrentTrangThai = TrangThai
        FROM dbo.YEUCAU_CHUYENCAP WITH (UPDLOCK, HOLDLOCK)
        WHERE YeuCauID = @YeuCauID;

        IF @KhieuNaiID IS NULL
            THROW 50700, N'Yêu cầu chuyển cấp không tồn tại.', 1;

        IF @CurrentAdmin IS NULL OR @CurrentAdmin <> @AdminID
            THROW 50703, N'Bạn không phải là quản trị viên đang tiếp nhận yêu cầu này.', 1;

        IF @CurrentTrangThai <> N'Đang xử lý'
            THROW 50704, N'Yêu cầu chuyển cấp không ở trạng thái đang xử lý.', 1;

        -- Cập nhật kết quả và hoàn tất yêu cầu
        UPDATE dbo.YEUCAU_CHUYENCAP
        SET
            KetQuaXuLy = @KetQuaXuLy,
            TrangThai = @TrangThaiMoi,
            ThoiGianHoanTat = dbo.fn_BayGio()
        WHERE YeuCauID = @YeuCauID;

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
            @AdminID,
            N'Quản trị viên hoàn tất yêu cầu chuyển cấp (' + @TrangThaiMoi + N'): ' + @KetQuaXuLy,
            dbo.fn_BayGio(),
            (SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        );

        -- Ghi tin nhắn nội bộ thông báo kết luận cho CSKH
        INSERT INTO dbo.TINNHAN_KHIEUNAI (
            KhieuNaiID,
            NguoiGuiID,
            NoiDung,
            LoaiTinNhan,
            ThoiGianGui
        )
        VALUES (
            @KhieuNaiID,
            @AdminID,
            N'[ADMIN KẾT LUẬN YÊU CẦU CHUYỂN CẤP - ' + @TrangThaiMoi + N']: ' + @KetQuaXuLy,
            N'Nội bộ',
            dbo.fn_BayGio()
        );

        COMMIT TRANSACTION;

        SELECT
            yc.YeuCauID,
            yc.KhieuNaiID,
            yc.NguoiYeuCauID,
            nd_yc.HoTen AS TenNguoiYeuCau,
            yc.LyDo,
            yc.MucDoUuTien,
            yc.AdminPhuTrachID,
            nd_adm.HoTen AS TenAdminPhuTrach,
            yc.TrangThai,
            yc.ThoiGianGui,
            yc.ThoiGianTiepNhan,
            yc.KetQuaXuLy,
            yc.ThoiGianHoanTat
        FROM dbo.YEUCAU_CHUYENCAP yc
        INNER JOIN dbo.NGUOIDUNG nd_yc ON nd_yc.NguoiDungID = yc.NguoiYeuCauID
        LEFT JOIN dbo.NGUOIDUNG nd_adm ON nd_adm.NguoiDungID = yc.AdminPhuTrachID
        WHERE yc.YeuCauID = @YeuCauID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

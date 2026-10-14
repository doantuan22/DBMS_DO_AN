-- Quản trị viên tiếp nhận yêu cầu chuyển cấp: sp_Escalation_Claim
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Escalation_Claim
    (
    @AdminID INT,
    @YeuCauID INT
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
        THROW 50301, N'Chỉ Quản trị viên mới được tiếp nhận yêu cầu chuyển cấp.', 1;

    -- Kiểm tra quyền CHUYENCAP_TIEPNHAN
    IF dbo.fn_KiemTraQuyenNguoiDung(@AdminID, 'CHUYENCAP_TIEPNHAN') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Khóa hàng yêu cầu chuyển cấp để ngăn hai Admin cùng nhận
        DECLARE @KhieuNaiID INT, @CurrentAdmin INT, @CurrentTrangThai NVARCHAR(50);
        SELECT
            @KhieuNaiID = KhieuNaiID,
            @CurrentAdmin = AdminPhuTrachID,
            @CurrentTrangThai = TrangThai
        FROM dbo.YEUCAU_CHUYENCAP WITH (UPDLOCK, HOLDLOCK)
        WHERE YeuCauID = @YeuCauID;

        IF @KhieuNaiID IS NULL
            THROW 50700, N'Yêu cầu chuyển cấp không tồn tại.', 1;

        IF @CurrentTrangThai <> N'Chờ tiếp nhận' OR @CurrentAdmin IS NOT NULL
            THROW 50402, N'Yêu cầu này đã được tiếp nhận hoặc đã được xử lý.', 1;

        -- Cập nhật Admin tiếp nhận
        UPDATE dbo.YEUCAU_CHUYENCAP
        SET
            AdminPhuTrachID = @AdminID,
            TrangThai = N'Đang xử lý',
            ThoiGianTiepNhan = dbo.fn_BayGio()
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
            N'Quản trị viên tiếp nhận yêu cầu chuyển cấp.',
            dbo.fn_BayGio(),
            (SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)
        );

        -- Ghi tin nhắn nội bộ thông báo
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
            N'[ADMIN TIẾP NHẬN YÊU CẦU CHUYỂN CẤP]: Quản trị viên đã tiếp nhận yêu cầu và đang tiến hành xử lý.',
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

-- Gửi tin nhắn trong khiếu nại: sp_Complaint_Chat_Send
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Chat_Send
    (
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @NoiDung NVARCHAR(MAX),
    @LoaiTinNhan NVARCHAR(50) = N'Công khai'
    )
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tài khoản người gọi
    IF NOT EXISTS (
        SELECT 1 FROM dbo.NGUOIDUNG
        WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động'
    )
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;

    -- Kiểm tra tính hợp lệ của nội dung tin nhắn
    IF @NoiDung IS NULL OR LEN(LTRIM(RTRIM(@NoiDung))) = 0
        THROW 50401, N'Nội dung tin nhắn không được để trống.', 1;

    IF LEN(@NoiDung) > 4000
        THROW 50401, N'Nội dung tin nhắn không được vượt quá 4000 ký tự.', 1;

    -- Kiểm tra loại tin nhắn
    IF @LoaiTinNhan NOT IN (N'Công khai', N'Nội bộ')
        THROW 50402, N'Loại tin nhắn không hợp lệ.', 1;

    -- Lấy vai trò của người gọi
    DECLARE @MaVaiTro VARCHAR(50);
    SELECT @MaVaiTro = vt.MaVaiTro
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
    WHERE nd.NguoiDungID = @NguoiDungID;

    -- Kiểm tra khiếu nại tồn tại
    DECLARE @NguoiDungKhieuNaiID INT, @NhanVienPhuTrachID INT, @TrangThaiKhieuNai NVARCHAR(50);
    SELECT
        @NguoiDungKhieuNaiID = kn.NguoiDungID,
        @NhanVienPhuTrachID = kn.NhanVienPhuTrachID,
        @TrangThaiKhieuNai = kn.TrangThai
    FROM dbo.KHIEUNAI kn
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    IF @NguoiDungKhieuNaiID IS NULL
    BEGIN
        IF @MaVaiTro = 'KHACH_HANG'
            THROW 50042, N'Khiếu nại không tồn tại hoặc bạn không có quyền xem.', 1;
        ELSE
            THROW 50061, N'Khiếu nại không tồn tại.', 1;
    END;

    IF @TrangThaiKhieuNai IN (N'Đã giải quyết', N'Đã đóng')
        THROW 50305, N'Khiếu nại đã kết thúc, không thể gửi thêm tin nhắn.', 1;

    -- Kiểm tra quyền nghiệp vụ và phạm vi phân công theo vai trò
    IF @MaVaiTro = 'KHACH_HANG'
    BEGIN
        -- Khách hàng chỉ được gửi tin trong khiếu nại của chính mình
        IF @NguoiDungKhieuNaiID <> @NguoiDungID
            THROW 50042, N'Khiếu nại không tồn tại hoặc bạn không có quyền xem.', 1;

        -- Khách hàng không được phép gửi tin nhắn nội bộ
        IF @LoaiTinNhan = N'Nội bộ'
            THROW 50304, N'Khách hàng không được phép gửi ghi chú nội bộ.', 1;

        -- Kiểm tra quyền gửi tin nhắn
        IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_CHAT_GUI') = 0
            THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
    END
    ELSE IF @MaVaiTro = 'CSKH'
    BEGIN
        -- CSKH chỉ được phản hồi trong khiếu nại được phân công phụ trách
        IF @NhanVienPhuTrachID IS NULL OR @NhanVienPhuTrachID <> @NguoiDungID
            THROW 50304, N'Bạn chỉ có thể gửi phản hồi đối với khiếu nại được phân công cho mình.', 1;

        IF @LoaiTinNhan = N'Công khai'
        BEGIN
            IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_CHAT_GUI') = 0
                THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
        END
        ELSE IF @LoaiTinNhan = N'Nội bộ'
        BEGIN
            IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_NOIBO_GHI') = 0
                THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
        END;
    END
    ELSE IF @MaVaiTro = 'ADMIN'
    BEGIN
        IF @LoaiTinNhan = N'Công khai'
        BEGIN
            IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_CHAT_GUI') = 0
                THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
        END
        ELSE IF @LoaiTinNhan = N'Nội bộ'
        BEGIN
            IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_NOIBO_GHI') = 0
                THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;
        END;
    END
    ELSE
    BEGIN
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    END;

    -- Thêm tin nhắn vào bảng
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
        @NoiDung,
        @LoaiTinNhan,
        dbo.fn_BayGio()
    );

    DECLARE @NewID INT = SCOPE_IDENTITY();

    -- Trả về tin nhắn vừa tạo kèm thông tin người gửi
    SELECT
        tn.TinNhanID,
        tn.KhieuNaiID,
        tn.NguoiGuiID,
        nd.HoTen AS HoTenNguoiGui,
        vt.MaVaiTro AS MaVaiTroNguoiGui,
        vt.TenVaiTro AS TenVaiTroNguoiGui,
        tn.NoiDung,
        tn.LoaiTinNhan,
        tn.ThoiGianGui,
        CAST(1 AS BIT) AS LaNguoiGui
    FROM dbo.TINNHAN_KHIEUNAI tn
    INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = tn.NguoiGuiID
    INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
    WHERE tn.TinNhanID = @NewID;
END;

GO

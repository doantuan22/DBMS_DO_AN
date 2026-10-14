-- Lấy danh sách tin nhắn trong khiếu nại: sp_Complaint_Chat_List
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Chat_List
    (
    @NguoiDungID INT,
    @KhieuNaiID INT,
    @LaNoiBo BIT = 1,
    @Page INT = 1,
    @PageSize INT = 50
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

    -- Lấy thông tin vai trò của người gọi
    DECLARE @MaVaiTro VARCHAR(50);
    SELECT @MaVaiTro = vt.MaVaiTro
    FROM dbo.NGUOIDUNG nd
    INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
    WHERE nd.NguoiDungID = @NguoiDungID;

    -- Kiểm tra quyền xem hội thoại
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_CHAT_XEM') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;

    -- Kiểm tra khiếu nại tồn tại
    DECLARE @NguoiDungKhieuNaiID INT, @NhanVienPhuTrachID INT;
    SELECT
        @NguoiDungKhieuNaiID = kn.NguoiDungID,
        @NhanVienPhuTrachID = kn.NhanVienPhuTrachID
    FROM dbo.KHIEUNAI kn
    WHERE kn.KhieuNaiID = @KhieuNaiID;

    IF @NguoiDungKhieuNaiID IS NULL
    BEGIN
        IF @MaVaiTro = 'KHACH_HANG'
            THROW 50042, N'Khiếu nại không tồn tại hoặc bạn không có quyền xem.', 1;
        ELSE
            THROW 50061, N'Khiếu nại không tồn tại.', 1;
    END;

    -- Kiểm tra quyền truy cập theo vai trò
    IF @MaVaiTro = 'KHACH_HANG'
    BEGIN
        -- Khách hàng chỉ được xem khiếu nại của chính mình
        IF @NguoiDungKhieuNaiID <> @NguoiDungID
            THROW 50042, N'Khiếu nại không tồn tại hoặc bạn không có quyền xem.', 1;
    END
    ELSE IF @MaVaiTro NOT IN ('CSKH', 'ADMIN')
    BEGIN
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    END;

    -- Xác định có quyền xem tin nhắn nội bộ hay không
    DECLARE @XemNoiBo BIT = 0;
    IF @MaVaiTro IN ('CSKH', 'ADMIN')
       AND dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'KHIEUNAI_NOIBO_XEM') = 1
       AND (@LaNoiBo IS NULL OR @LaNoiBo = 1)
    BEGIN
        SET @XemNoiBo = 1;
    END;

    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 OR @PageSize > 200 SET @PageSize = 50;
    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    -- Đếm tổng số tin nhắn được phép xem
    DECLARE @TotalCount INT;
    SELECT @TotalCount = COUNT(*)
    FROM dbo.TINNHAN_KHIEUNAI tn
    WHERE tn.KhieuNaiID = @KhieuNaiID
      AND (@XemNoiBo = 1 OR tn.LoaiTinNhan = N'Công khai');

    -- Trả về danh sách tin nhắn có phân trang
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
        CASE WHEN tn.NguoiGuiID = @NguoiDungID THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS LaNguoiGui,
        @TotalCount AS TotalCount
    FROM dbo.TINNHAN_KHIEUNAI tn
    INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = tn.NguoiGuiID
    INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
    WHERE tn.KhieuNaiID = @KhieuNaiID
      AND (@XemNoiBo = 1 OR tn.LoaiTinNhan = N'Công khai')
    ORDER BY tn.ThoiGianGui ASC, tn.TinNhanID ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;

GO

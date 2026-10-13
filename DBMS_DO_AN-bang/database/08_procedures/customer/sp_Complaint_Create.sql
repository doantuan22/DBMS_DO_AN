SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: migrations/003_complaint_order_ownership.sql:3 (dbo.sp_Complaint_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Complaint_Create
(
    @NguoiDungID INT,
    @DonDatVeID INT = NULL,
    @LoaiKhieuNai NVARCHAR(100),
    @TieuDe NVARCHAR(200),
    @NoiDung NVARCHAR(MAX),
    @MucDoUuTien NVARCHAR(50) = N'Trung bình'
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('KHACH_HANG'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'GUI_KHIEU_NAI') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    IF @DonDatVeID IS NOT NULL AND NOT EXISTS
    (
        SELECT 1
        FROM dbo.DONDATVE
        WHERE DonDatVeID = @DonDatVeID
          AND NguoiDungID = @NguoiDungID
    )
    BEGIN
        -- Same non-disclosing error for a missing or foreign order reference.
        ;THROW 50041, N'Đơn đặt vé tham chiếu không hợp lệ.', 1;
    END

    INSERT INTO dbo.KHIEUNAI (NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai)
    VALUES (@NguoiDungID, @DonDatVeID, @LoaiKhieuNai, @TieuDe, @NoiDung, @MucDoUuTien, dbo.fn_BayGio(), N'Mới');

    SELECT KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai
    FROM dbo.KHIEUNAI
    WHERE KhieuNaiID = SCOPE_IDENTITY();
END;
GO

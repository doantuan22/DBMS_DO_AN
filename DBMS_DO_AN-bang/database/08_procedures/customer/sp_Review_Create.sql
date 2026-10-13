SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/customer/customer_procedures.sql:1214 (dbo.sp_Review_Create)
CREATE OR ALTER PROCEDURE dbo.sp_Review_Create
(
    @NguoiDungID INT,
    @PhimID INT,
    @SoSao INT,
    @NoiDung NVARCHAR(1000) = NULL
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
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'DANH_GIA') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    -- Kiểm tra đã đánh giá chưa
    IF EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID AND NguoiDungID = @NguoiDungID)
    BEGIN
        ;THROW 50040, N'Bạn đã đánh giá phim này rồi.', 1;
    END

    -- Chèn bản ghi đánh giá (Trigger TRG_DanhGia_KiemTraDaXemPhim sẽ tự kiểm tra đã xem phim chưa)
    INSERT INTO dbo.DANHGIAPHIM (PhimID, NguoiDungID, SoSao, NoiDung, NgayDanhGia)
    VALUES (@PhimID, @NguoiDungID, @SoSao, @NoiDung, dbo.fn_BayGio());

    SELECT
        DanhGiaID,
        PhimID,
        NguoiDungID,
        SoSao,
        NoiDung,
        NgayDanhGia
    FROM dbo.DANHGIAPHIM
    WHERE DanhGiaID = SCOPE_IDENTITY();
END;
GO

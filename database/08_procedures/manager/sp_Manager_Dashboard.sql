SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: procedures/manager/manager_procedures.sql:713 (dbo.sp_Manager_Dashboard)
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Dashboard
(
    @NguoiDungID INT,
    @RapID INT
)
AS
BEGIN
    SET NOCOUNT ON;
    -- R3B: current account, actor eligibility, then every required permission.
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N'Hoạt động')
        THROW 50300, N'Tài khoản không tồn tại hoặc đã bị khóa.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID
                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ('QUAN_LY_RAP'))
        THROW 50301, N'Vai trò không được phép thực hiện thao tác này.', 1;
    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, 'XEM_BAO_CAO_RAP') = 0
        THROW 50302, N'Không có quyền thực hiện thao tác này.', 1;


    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0
    BEGIN
        ;THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền truy cập rạp này.', 1;
    END

    -- Chỉ số tổng hợp rạp
    SELECT
        r.RapID,
        r.TenRap,
        r.ThanhPho,
        (SELECT COUNT(*) FROM dbo.PHONGCHIEU pc WHERE pc.RapID = @RapID AND pc.TrangThai = N'Hoạt động') AS TongPhongChieu,
        (SELECT COUNT(*) FROM dbo.GHE g INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID WHERE pc.RapID = @RapID AND g.TrangThai = N'Hoạt động') AS TongGhe,
        (
            SELECT COUNT(*)
            FROM dbo.SUATCHIEU sc
            INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
            WHERE pc.RapID = @RapID
              AND dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) = dbo.fn_HomNay()
              AND sc.TrangThai <> N'Đã hủy'
        ) AS SuatChieuHomNay,
        (SELECT COUNT(DISTINCT ddv.DonDatVeID)
         FROM dbo.DONDATVE ddv
         INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
         INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID
         WHERE pc.RapID = @RapID
           AND EXISTS(SELECT 1 FROM dbo.THANHTOAN tt WHERE tt.DonDatVeID=ddv.DonDatVeID AND tt.TrangThai=N'Thành công'
                      GROUP BY tt.DonDatVeID HAVING dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan,tt.NgayTao)))=dbo.fn_HomNay())
        ) AS DonDatVeHomNay
    FROM dbo.RAPCHIEUPHIM r
    WHERE r.RapID = @RapID;
END;
GO

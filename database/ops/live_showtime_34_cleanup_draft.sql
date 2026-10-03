-- REVIEW DRAFT ONLY. Never run before the project owner reviews the target rows.
-- @Commit=0 previews all updates, prints before/after state, and rolls back.
-- Set @Commit=1 only after the owner approves this exact cleanup plan.
USE CinemaBookingDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @Commit BIT=0;
DECLARE @Target TABLE(DonDatVeID INT PRIMARY KEY,NguoiDungID INT,KhuyenMaiID INT NULL,TrangThaiCu NVARCHAR(50));

BEGIN TRANSACTION;
BEGIN TRY
    -- Confirm the exact three audited rows and the only expected payment/ticket totals.
    INSERT @Target(DonDatVeID,NguoiDungID,KhuyenMaiID,TrangThaiCu)
    SELECT DonDatVeID,NguoiDungID,KhuyenMaiID,TrangThai
    FROM dbo.DONDATVE WITH (UPDLOCK,HOLDLOCK)
    WHERE SuatChieuID=34 AND DonDatVeID IN (26,27,28) AND TrangThai=N'Đã thanh toán';
    IF (SELECT COUNT(*) FROM @Target)<>3 THROW 51040,N'Precheck failed: expected only orders 26, 27, and 28 in paid state on cancelled showtime 34.',1;
    IF (SELECT COUNT(*) FROM dbo.CHITIETVE cv JOIN @Target x ON x.DonDatVeID=cv.DonDatVeID)<>3
        THROW 51041,N'Precheck failed: expected three ticket rows.',1;
    IF (SELECT COUNT(*) FROM dbo.THANHTOAN t JOIN @Target x ON x.DonDatVeID=t.DonDatVeID WHERE t.TrangThai=N'Thành công')<>3
        THROW 51042,N'Precheck failed: expected one successful payment on each target order.',1;
    IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID=34 AND TrangThai<>N'Đã hủy')
        THROW 51043,N'Precheck failed: showtime 34 is no longer cancelled.',1;

    SELECT N'BEFORE' AS Phase,d.DonDatVeID,d.NguoiDungID,nd.HoTen,d.TrangThai AS TrangThaiDon,
           COUNT(DISTINCT cv.VeID) AS SoVe,
           SUM(CASE WHEN t.TrangThai=N'Thành công' THEN t.SoTien ELSE 0 END) AS TienDaThu
    FROM dbo.DONDATVE d JOIN @Target x ON x.DonDatVeID=d.DonDatVeID
    JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID=d.NguoiDungID
    LEFT JOIN dbo.CHITIETVE cv ON cv.DonDatVeID=d.DonDatVeID
    LEFT JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID
    GROUP BY d.DonDatVeID,d.NguoiDungID,nd.HoTen,d.TrangThai ORDER BY d.DonDatVeID;
    SELECT N'POINTS BEFORE' AS Phase,NguoiDungID,DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID IN (13,14);
    SELECT N'REVENUE BEFORE' AS Phase,RapID,TongSoDon,DoanhThuThucTe FROM dbo.vw_DoanhThuTheoRap
    WHERE RapID=(SELECT pc.RapID FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU pc ON pc.PhongID=s.PhongID WHERE s.SuatChieuID=34);

    -- Mirror policy P1: release counted promo uses, reverse granted points, refund simulated successful attempts,
    -- cancel ticket rows and orders, and retain a customer-visible reason and the exact policy message.
    UPDATE km SET SoLuongDaDung=CASE WHEN km.SoLuongDaDung>=p.Uses THEN km.SoLuongDaDung-p.Uses ELSE 0 END
    FROM dbo.KHUYENMAI km
    JOIN (SELECT KhuyenMaiID,COUNT(*) AS Uses FROM @Target WHERE KhuyenMaiID IS NOT NULL GROUP BY KhuyenMaiID) p
      ON p.KhuyenMaiID=km.KhuyenMaiID;

    ;WITH Points AS (
        SELECT x.NguoiDungID,SUM(CAST(t.SoTien/1000 AS INT)) AS Amount
        FROM @Target x JOIN dbo.THANHTOAN t ON t.DonDatVeID=x.DonDatVeID AND t.TrangThai=N'Thành công'
        GROUP BY x.NguoiDungID
    )
    UPDATE h SET DiemTichLuy=CASE WHEN h.DiemTichLuy>=p.Amount THEN h.DiemTichLuy-p.Amount ELSE 0 END
    FROM dbo.HOSOKHACHHANG h JOIN Points p ON p.NguoiDungID=h.NguoiDungID;

    UPDATE t SET TrangThai=N'Đã hoàn tiền',GhiChu=N'Suất chiếu đã bị hủy; hoàn tiền mô phỏng.'
    FROM dbo.THANHTOAN t JOIN @Target x ON x.DonDatVeID=t.DonDatVeID WHERE t.TrangThai=N'Thành công';
    UPDATE cv SET TrangThai=N'Đã hủy'
    FROM dbo.CHITIETVE cv JOIN @Target x ON x.DonDatVeID=cv.DonDatVeID WHERE cv.TrangThai<>N'Đã hủy';
    UPDATE d SET TrangThai=N'Đã hủy',HanGiuCho=NULL,LyDoHuy=N'Audit cleanup approved for cancelled showtime 34',
        ThongBaoHuy=N'Suất chiếu đã bị hủy, tiền sẽ được hoàn về thông qua nền tảng thanh toán'
    FROM dbo.DONDATVE d JOIN @Target x ON x.DonDatVeID=d.DonDatVeID;

    IF EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN @Target x ON x.DonDatVeID=d.DonDatVeID WHERE d.TrangThai<>N'Đã hủy')
       OR EXISTS(SELECT 1 FROM dbo.CHITIETVE cv JOIN @Target x ON x.DonDatVeID=cv.DonDatVeID WHERE cv.TrangThai<>N'Đã hủy')
       OR EXISTS(SELECT 1 FROM dbo.THANHTOAN t JOIN @Target x ON x.DonDatVeID=t.DonDatVeID WHERE t.TrangThai=N'Thành công')
       OR EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID WHERE s.TrangThai=N'Đã hủy' AND d.TrangThai=N'Đã thanh toán')
        THROW 51044,N'Postcheck failed; transaction will be rolled back.',1;

    SELECT N'AFTER' AS Phase,d.DonDatVeID,d.NguoiDungID,nd.HoTen,d.TrangThai AS TrangThaiDon,d.LyDoHuy,d.ThongBaoHuy,
           cv.TrangThai AS TrangThaiVe,t.ThanhToanID,t.TrangThai AS TrangThaiThanhToan,t.SoTien
    FROM dbo.DONDATVE d JOIN @Target x ON x.DonDatVeID=d.DonDatVeID
    JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID=d.NguoiDungID
    LEFT JOIN dbo.CHITIETVE cv ON cv.DonDatVeID=d.DonDatVeID
    LEFT JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID
    ORDER BY d.DonDatVeID,t.ThanhToanID;
    SELECT N'POINTS AFTER' AS Phase,NguoiDungID,DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID IN (13,14);
    SELECT N'REVENUE AFTER' AS Phase,RapID,TongSoDon,DoanhThuThucTe FROM dbo.vw_DoanhThuTheoRap
    WHERE RapID=(SELECT pc.RapID FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU pc ON pc.PhongID=s.PhongID WHERE s.SuatChieuID=34);

    IF @Commit=1 COMMIT TRANSACTION;
    ELSE ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    ;THROW;
END CATCH;
GO

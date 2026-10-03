SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: triggers/04_triggers.sql:87 (dbo.TRG_ChiTietVe_KiemTraTrungGhe)
CREATE OR ALTER TRIGGER dbo.TRG_ChiTietVe_KiemTraTrungGhe
ON dbo.CHITIETVE
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra giữa dòng mới với vé hiện có trong cơ sở dữ liệu
    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.DONDATVE ddv_new ON i.DonDatVeID = ddv_new.DonDatVeID
        INNER JOIN dbo.CHITIETVE cv_exist ON i.GheID = cv_exist.GheID AND i.VeID <> cv_exist.VeID
        INNER JOIN dbo.DONDATVE ddv_exist ON cv_exist.DonDatVeID = ddv_exist.DonDatVeID
        WHERE ddv_new.SuatChieuID = ddv_exist.SuatChieuID
          AND i.TrangThai <> N'Đã hủy'
          AND cv_exist.TrangThai <> N'Đã hủy'
          AND ddv_new.TrangThai NOT IN (N'Đã hủy', N'Hết hạn')
          AND dbo.fn_DonDangGiuGhe(ddv_exist.TrangThai, ddv_exist.HanGiuCho, dbo.fn_BayGio()) = 1
    )
    BEGIN
        ;THROW 50003, N'Lỗi xung đột [BR02]: Ghế này đã được đặt hoặc đang được giữ bởi một đơn khác cho cùng suất chiếu.', 1;
    END

    -- Kiểm tra trùng lặp trong chính tập INSERTED
    IF EXISTS (
        SELECT 1
        FROM INSERTED i1
        INNER JOIN dbo.DONDATVE ddv1 ON i1.DonDatVeID = ddv1.DonDatVeID
        INNER JOIN INSERTED i2 ON i1.GheID = i2.GheID AND i1.VeID <> i2.VeID
        INNER JOIN dbo.DONDATVE ddv2 ON i2.DonDatVeID = ddv2.DonDatVeID
        WHERE ddv1.SuatChieuID = ddv2.SuatChieuID
          AND i1.TrangThai <> N'Đã hủy'
          AND i2.TrangThai <> N'Đã hủy'
    )
    BEGIN
        ;THROW 50003, N'Lỗi xung đột [BR02]: Phát hiện chọn trùng cùng một ghế nhiều lần trong cùng một đơn.', 1;
    END
END;
GO

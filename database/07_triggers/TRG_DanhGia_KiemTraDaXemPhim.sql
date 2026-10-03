SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
-- Baseline: triggers/04_triggers.sql:133 (dbo.TRG_DanhGia_KiemTraDaXemPhim)
CREATE OR ALTER TRIGGER dbo.TRG_DanhGia_KiemTraDaXemPhim
ON dbo.DANHGIAPHIM
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        WHERE NOT EXISTS (
            SELECT 1
            FROM dbo.DONDATVE ddv
            INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID
            WHERE ddv.NguoiDungID = i.NguoiDungID
              AND sc.PhimID = i.PhimID
              AND ddv.TrangThai IN (N'Đã thanh toán', N'Hoàn thành')
              AND sc.ThoiGianBatDau <= dbo.fn_BayGio()
        )
    )
    BEGIN
        ;THROW 50004, N'Lỗi nghiệp vụ [BR05]: Khách hàng chỉ có thể đánh giá sau khi đã mua vé xem phim và suất chiếu đã diễn ra.', 1;
    END
END;
GO

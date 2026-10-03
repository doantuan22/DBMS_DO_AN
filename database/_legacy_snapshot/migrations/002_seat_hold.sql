-- ============================================================================
-- MIGRATION 002: GIỮ GHẾ CÓ THỜI HẠN CHO ĐƠN CHỜ THANH TOÁN
--  * DONDATVE.HanGiuCho + CHECK + index filtered
--  * Sau migration này chạy lại (theo thứ tự): functions, views, triggers, procedures
--    (các file đó dùng DROP/CREATE nên an toàn với dữ liệu hiện có).
-- Chạy lại nhiều lần không lỗi (idempotent). Bản 01_schema.sql đã chứa sẵn cho lần cài mới.
-- ============================================================================
USE CinemaBookingDB
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH(N'dbo.DONDATVE', N'HanGiuCho') IS NULL
    ALTER TABLE dbo.DONDATVE ADD HanGiuCho DATETIME2 NULL;
GO

-- Đơn đang chờ thanh toán từ trước: tính hạn theo thời gian giữ ghế chuẩn (10 phút kể từ lúc đặt)
UPDATE dbo.DONDATVE
SET HanGiuCho = DATEADD(MINUTE, 10, NgayDat)
WHERE TrangThai = N'Chờ thanh toán' AND HanGiuCho IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DONDATVE_HanGiuCho')
    ALTER TABLE dbo.DONDATVE ADD CONSTRAINT CK_DONDATVE_HanGiuCho
        CHECK (TrangThai <> N'Chờ thanh toán' OR HanGiuCho IS NOT NULL);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DONDATVE_HanGiuCho' AND object_id = OBJECT_ID(N'dbo.DONDATVE'))
    CREATE NONCLUSTERED INDEX IX_DONDATVE_HanGiuCho ON dbo.DONDATVE(HanGiuCho) INCLUDE (SuatChieuID)
        WHERE TrangThai = N'Chờ thanh toán';
GO

PRINT N'>>> [migration 002] Đã thêm DONDATVE.HanGiuCho. Hãy chạy lại functions, views, triggers, procedures.';
GO

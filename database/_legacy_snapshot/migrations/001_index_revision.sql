-- ============================================================================
-- MIGRATION 001: ĐIỀU CHỈNH INDEX (áp dụng cho database đã có dữ liệu)
--  * Sửa 2 index có sẵn: thêm INCLUDE để thành covering index
--  * Thêm 2 filtered index cho khóa ngoại nullable
-- Chạy lại nhiều lần không lỗi (idempotent). Không thay đổi dữ liệu.
-- Bản 01_schema.sql đã chứa sẵn các index này cho lần cài mới.
-- ============================================================================
USE CinemaBookingDB
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Sửa: IX_CHITIETVE_DonDatVe -> thêm INCLUDE (GheID, TrangThai, GiaVe)
CREATE NONCLUSTERED INDEX IX_CHITIETVE_DonDatVe ON dbo.CHITIETVE(DonDatVeID)
    INCLUDE (GheID, TrangThai, GiaVe) WITH (DROP_EXISTING = ON);
GO

-- Sửa: IX_THANHTOAN_DonDatVe -> thêm INCLUDE (SoTien, NgayThanhToan, NgayTao)
CREATE NONCLUSTERED INDEX IX_THANHTOAN_DonDatVe ON dbo.THANHTOAN(DonDatVeID, TrangThai)
    INCLUDE (SoTien, NgayThanhToan, NgayTao) WITH (DROP_EXISTING = ON);
GO

-- Thêm: DONDATVE(KhuyenMaiID) chỉ cho đơn có áp mã
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DONDATVE_KhuyenMai' AND object_id = OBJECT_ID(N'dbo.DONDATVE'))
    CREATE NONCLUSTERED INDEX IX_DONDATVE_KhuyenMai ON dbo.DONDATVE(KhuyenMaiID) WHERE KhuyenMaiID IS NOT NULL;
GO

-- Thêm: KHIEUNAI(DonDatVeID) chỉ cho khiếu nại có gắn đơn
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_KHIEUNAI_DonDatVe' AND object_id = OBJECT_ID(N'dbo.KHIEUNAI'))
    CREATE NONCLUSTERED INDEX IX_KHIEUNAI_DonDatVe ON dbo.KHIEUNAI(DonDatVeID) WHERE DonDatVeID IS NOT NULL;
GO

PRINT N'>>> [migration 001] Đã điều chỉnh index thành công.';
GO

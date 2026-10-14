-- Trigger đảm bảo tính bất biến của nhân viên CSKH phụ trách khiếu nại (Single-assignment rule)
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER TRIGGER dbo.TRG_KhieuNai_NhanVienPhuTrachBatBien
ON dbo.KHIEUNAI
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Ràng buộc: Một khi NhanVienPhuTrachID đã được gán (NOT NULL),
    -- không được phép thay đổi sang nhân viên khác và không được phép đưa về NULL.
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON d.KhieuNaiID = i.KhieuNaiID
        WHERE d.NhanVienPhuTrachID IS NOT NULL
          AND (
              i.NhanVienPhuTrachID IS NULL
              OR i.NhanVienPhuTrachID <> d.NhanVienPhuTrachID
          )
    )
    BEGIN
        THROW 50605, N'Nhân viên phụ trách khiếu nại đã được phân công và không được thay đổi trong toàn bộ vòng đời khiếu nại.', 1;
    END;
END;
GO

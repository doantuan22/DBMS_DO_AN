SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER TRIGGER dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai
ON dbo.XULY_KHIEUNAI
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Serialize each affected parent before the separate history read. Identity
    -- allocation order can differ from trigger/commit order between sessions.
    DECLARE @AffectedCount INT;
    SELECT @AffectedCount = COUNT(*)
    FROM dbo.KHIEUNAI kn WITH (UPDLOCK, HOLDLOCK)
    INNER JOIN (SELECT DISTINCT KhieuNaiID FROM inserted) affected
        ON affected.KhieuNaiID = kn.KhieuNaiID;

    ;WITH Affected AS
    (
        SELECT DISTINCT KhieuNaiID FROM inserted
    ), LatestProcessing AS
    (
        SELECT xl.KhieuNaiID, xl.TrangThaiSauXuLy,
            ROW_NUMBER() OVER (PARTITION BY xl.KhieuNaiID ORDER BY xl.XuLyID DESC) AS rn
        FROM dbo.XULY_KHIEUNAI xl
        INNER JOIN Affected a ON a.KhieuNaiID = xl.KhieuNaiID
    )
    UPDATE kn
    SET kn.TrangThai = latest.TrangThaiSauXuLy
    FROM dbo.KHIEUNAI kn
    INNER JOIN LatestProcessing latest ON latest.KhieuNaiID = kn.KhieuNaiID
        AND latest.rn = 1;
END;
GO

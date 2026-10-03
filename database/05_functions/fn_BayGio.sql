SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_BayGio()
RETURNS DATETIME2(7)
AS
BEGIN
    -- Canonical instant: UTC components in datetime2, independent of host TZ.
    RETURN SYSUTCDATETIME();
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER FUNCTION dbo.fn_GioRap(@UtcInstant DATETIME2(7))
RETURNS DATETIMEOFFSET(7)
AS
BEGIN
    -- Windows zone corresponding to the application's Asia/Ho_Chi_Minh.
    RETURN @UtcInstant AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time';
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_System_HealthCheck
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        'Healthy' AS [Status],
        SYSDATETIME() AS [ServerTime],
        DB_NAME() AS [DatabaseName],
        @@VERSION AS [SQLVersion];
END;
GO

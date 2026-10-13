-- Disposable database only; orchestrator restores the baseline in finally.
CREATE OR ALTER PROCEDURE dbo.sp_Clock_GetNow @PhimID int=NULL
AS
BEGIN
 SET NOCOUNT ON;
 SELECT CONVERT(datetime2,'2000-01-01') AS BayGio,CAST(1 AS int) AS ThoiLuong;
END;
GO

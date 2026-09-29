-- ============================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP
-- KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY
-- STORED PROCEDURES - NHÓM HỆ THỐNG (SYSTEM)
-- ============================================================================

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


-- sp_System_HealthCheck: Kiểm tra kết nối và tính sẵn sàng của DBMS
IF OBJECT_ID(N'dbo.sp_System_HealthCheck', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_System_HealthCheck;
GO

CREATE PROCEDURE dbo.sp_System_HealthCheck
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

PRINT N'>>> [procedures/system] Đã tạo 1 Stored Procedures.';
GO

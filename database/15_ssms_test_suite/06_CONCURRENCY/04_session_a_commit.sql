/* Run in the same SSMS connection as Session A's hold script. */
USE [CinemaBookingDB];
GO
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 51910,N'Wrong target; connect to DoanTuanIT/CinemaBookingDB.',1;
IF @@TRANCOUNT<>1 OR XACT_STATE()<>1
    THROW 51911,N'Session A does not have the expected committable fixture transaction.',1;
COMMIT TRANSACTION;
SELECT N'COMMITTED: Session A released its room lock.' AS Actual,
       N'One fixture row remains until the cleanup script.' AS Expected,
       (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID=-1900000123) AS FixtureRows;

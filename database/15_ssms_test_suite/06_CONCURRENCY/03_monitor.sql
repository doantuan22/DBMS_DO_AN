/* Run from a third SSMS connection while Session B's insert is blocked. */
USE [CinemaBookingDB];
GO
IF @@SERVERNAME<>N'DoanTuanIT' OR DB_NAME()<>N'CinemaBookingDB'
    THROW 51930,N'Wrong target; connect to DoanTuanIT/CinemaBookingDB.',1;
SELECT r.session_id AS SessionB,
       r.wait_type,
       r.blocking_session_id AS BlockingSessionA,
       r.wait_resource,
       applock.resource_description AS ApplicationLockResource,
       applock.request_mode AS ApplicationLockMode,
       IIF(r.wait_type LIKE N'LCK_M_%' AND r.blocking_session_id>0
           AND applock.request_status=N'WAIT','PASS','FAIL') AS Verdict
FROM sys.dm_exec_requests r
OUTER APPLY (
    SELECT TOP(1) l.resource_description,l.request_mode,l.request_status
    FROM sys.dm_tran_locks l
    WHERE l.request_session_id=r.session_id
      AND l.resource_type=N'APPLICATION'
      AND l.request_status=N'WAIT'
      AND CHARINDEX(N'SUATCHIEU:ROOM:',l.resource_description)>0
) applock
WHERE r.database_id=DB_ID()
  AND r.session_id<>@@SPID
  AND r.wait_type LIKE N'LCK_M_%'
  AND r.blocking_session_id>0
  AND applock.request_status=N'WAIT';

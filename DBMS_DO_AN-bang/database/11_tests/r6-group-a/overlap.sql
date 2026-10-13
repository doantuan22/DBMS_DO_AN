-- Capture all currently blocked requests on this target. The runner follows the
-- blocking graph back to its test transaction and requires every HTTP contender.
SELECT r.session_id,r.blocking_session_id,r.start_time,r.wait_type,r.wait_time,
 r.open_transaction_count,OBJECT_NAME(t.objectid,t.dbid) procedureName
FROM sys.dm_exec_requests r CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.database_id=DB_ID() AND r.blocking_session_id>0;

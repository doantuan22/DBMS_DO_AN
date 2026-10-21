// Resolves only the B session created by the immediately preceding concurrency run.
// The session ID is accepted only when the report and SQL Server DMV identity agree.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const require=createRequire(path.join(root,'backend','package.json'));
const sql=require('mssql');const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync(path.join(root,'backend','.env')));
if(env.DB_DATABASE!=='CinemaBookingDB')throw new Error('Refusing: configured database is not Main.');
const run=JSON.parse(fs.readFileSync(path.join(root,'.audit-output','main-concurrency-drill.json'),'utf8'));
const priorProbe=JSON.parse(fs.readFileSync(path.join(root,'.audit-output','main-concurrency-fixture-probe.json'),'utf8'));
const sameSeat=run.tests.find(x=>x.name==='concurrent_same_seat_double_booking');
if(!run.error?.includes('open user transaction')||sameSeat?.verdict!=='PASS'||sameSeat.sessions.independent!==true)throw new Error('Prior evidence does not identify a safe same-seat test session to roll back.');
const sid=Number(sameSeat.sessions.sessionB);
const row=priorProbe.otherOpenTransactions.find(x=>Number(x.session_id)===sid);
if(!Number.isInteger(sid)||!row||row.program_name!=='node-mssql'||row.login_name!=='sa'||row.host_name!=='DoanTuanIT'||row.sessionStatus!=='sleeping'||Number(row.open_transaction_count)!==1||row.requestStatus!==null)throw new Error(`Session identity does not match this drill's idle loser transaction: ${JSON.stringify(row)}`);
const pool=await new sql.ConnectionPool({server:env.DB_SERVER,port:Number(env.DB_PORT??1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,
  options:{encrypt:String(env.DB_ENCRYPT).toLowerCase()==='true',trustServerCertificate:String(env.DB_TRUST_SERVER_CERTIFICATE??'true')==='true',useUTC:true},requestTimeout:60000}).connect();
const evidence={startedUtc:new Date().toISOString(),target:null,session:{id:sid,program:row.program_name,login:row.login_name,host:row.host_name,loginTime:row.login_time,transactionBeginTime:row.transaction_begin_time},action:'none',verdict:'BLOCKED'};
try{
  const target=(await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state,@@SPID ownSessionId`)).recordset[0];
  evidence.target=target;if(target.serverName!=='DoanTuanIT'||target.databaseName!=='CinemaBookingDB'||target.state!=='ONLINE'||target.ownSessionId===sid)throw new Error(`Wrong target or session collision: ${JSON.stringify(target)}`);
  const current=(await pool.request().input('sid',sql.Int,sid).query(`
    SELECT s.session_id,s.program_name,s.login_name,s.host_name,s.status AS sessionStatus,s.open_transaction_count,
           r.session_id AS activeRequest
    FROM sys.dm_exec_sessions s
    LEFT JOIN sys.dm_exec_requests r ON r.session_id=s.session_id
    WHERE s.session_id=@sid
  `)).recordset[0];
  if(!current||current.program_name!=='node-mssql'||current.login_name!=='sa'||current.host_name!=='DoanTuanIT'||current.sessionStatus!=='sleeping'||Number(current.open_transaction_count)!==1||current.activeRequest!==null)throw new Error(`Exact session is no longer safe to resolve: ${JSON.stringify(current)}`);
  await pool.request().query(`KILL ${sid}`);
  evidence.action=`KILL ${sid} (rollback only the verified, sleeping node-mssql transaction created by this run)`;
  const deadline=Date.now()+10000;let remaining;
  do{
    remaining=(await pool.request().input('sid',sql.Int,sid).query(`SELECT session_id FROM sys.dm_exec_sessions WHERE session_id=@sid`)).recordset;
    if(!remaining.length)break;
    await new Promise(resolve=>setTimeout(resolve,200));
  }while(Date.now()<deadline);
  if(remaining.length)throw new Error(`Session ${sid} remains present after KILL; server rollback still in progress.`);
  const after=(await pool.request().query(`
    SELECT s.name AS schemaName,t.name AS tableName,SUM(ps.row_count) AS row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN(0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name
  `)).recordset;
  const identities=(await pool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) AS schemaName,OBJECT_NAME(object_id) AS tableName,name AS columnName,
           IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id))) AS identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id
  `)).recordset;
  evidence.after={counts:after,identities};
  evidence.stateMatchesPreRun=JSON.stringify(run.before?.counts)===JSON.stringify(after)&&JSON.stringify(run.before?.identities)===JSON.stringify(identities);
  const dbcc=await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS');evidence.constraintViolations=(dbcc.recordsets??[]).flat().length;
  if(!evidence.stateMatchesPreRun||evidence.constraintViolations!==0)throw new Error('Post-rollback Main fingerprint or constraint verification failed.');
  evidence.verdict='PASS';
}catch(error){evidence.error=error.message;evidence.verdict='FAIL';}
finally{
  evidence.finishedUtc=new Date().toISOString();
  const out=path.join(root,'.audit-output','main-concurrency-session-cleanup.json');fs.writeFileSync(out,JSON.stringify(evidence,null,2));
  await pool.close();console.log(JSON.stringify({verdict:evidence.verdict,target:evidence.target,session:evidence.session,action:evidence.action,stateMatchesPreRun:evidence.stateMatchesPreRun,constraintViolations:evidence.constraintViolations,error:evidence.error,evidence:path.relative(root,out)},null,2));
  if(evidence.verdict!=='PASS')process.exitCode=1;
}

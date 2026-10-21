// Executes the actual five SSMS concurrency scripts through three independent
// SQL Server connections. The test fixture uses only exact negative showtime IDs.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target Main.');
const OUT = path.join(ROOT, '.audit-output', 'main-ssms-schedule-concurrency-demo.json');
const A_ID = -1900000123;
const B_ID = -1900000124;
const A_START = '2098-01-15T20:00:00';
const A_END = '2098-01-15T21:30:00';
const B_START = '2098-01-15T20:30:00';
const B_END = '2098-01-15T22:00:00';
const config = {
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 90000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
};
const control = await new sql.ConnectionPool(config).connect();
const sessionA = await new sql.ConnectionPool(config).connect();
const sessionB = await new sql.ConnectionPool(config).connect();
const monitor = await new sql.ConnectionPool(config).connect();
const evidence = { startedUtc:new Date().toISOString(), target:null, fixture:{showtimeA:A_ID,showtimeB:B_ID,aStart:A_START,aEnd:A_END,bStart:B_START,bEnd:B_END}, backup:null, sessions:{}, tests:[], integrity:null, verdict:'BLOCKED' };
let aTransactionOpen = false;
let bPromise = null;
let fixtureACommitted = false;

function add(name,input,expected,actual,pass) {
  evidence.tests.push({name,input,expected,actual,verdict:pass?'PASS':'FAIL'});
  if(!pass) throw new Error(`${name} did not match its runtime oracle.`);
}
function splitGo(text) { return text.split(/^\s*GO\s*$/im).map((x)=>x.trim()).filter(Boolean); }
function rowsOf(result) { return (result?.recordsets??[]).flat().filter((x)=>x&&typeof x==='object'); }
async function withTimeout(promise, milliseconds, message) {
  let timer;
  try {
    return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),milliseconds);})]);
  } finally { clearTimeout(timer); }
}
async function ident(pool) {
  const row=(await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,
    CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state,@@SPID sessionId;`)).recordset[0];
  if(row.serverName!=='DoanTuanIT'||row.databaseName!=='CinemaBookingDB'||row.state!=='ONLINE') throw new Error(`Wrong target: ${JSON.stringify(row)}`);
  return row;
}
async function runFile(pool,name) {
  const content=fs.readFileSync(path.join(ROOT,'database','14_audit',name),'utf8');
  const batches=splitGo(content);
  const results=[];
  for(const batch of batches) results.push(await pool.request().batch(batch));
  return {batches,results,rows:results.flatMap(rowsOf)};
}
async function fingerprint() {
  const target=await ident(control);
  const tables=(await control.request().query(`SELECT t.object_id,QUOTENAME(s.name)+'.'+QUOTENAME(t.name) q,
    COALESCE((SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY ic.key_ordinal)
      FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
      JOIN sys.columns c ON c.object_id=i.object_id AND c.column_id=ic.column_id WHERE i.object_id=t.object_id AND i.is_primary_key=1),
      (SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY c.column_id) FROM sys.columns c WHERE c.object_id=t.object_id)) sortColumns
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY t.object_id;`)).recordset;
  const rows=[];
  for(const table of tables){const data=(await control.request().query(`SELECT * FROM ${table.q} ORDER BY ${table.sortColumns};`)).recordset;rows.push({table:table.q,count:data.length,sha256:createHash('sha256').update(JSON.stringify(data,(_k,v)=>Buffer.isBuffer(v)?v.toString('base64'):v)).digest('hex')});}
  const identities=(await control.request().query(`SELECT OBJECT_SCHEMA_NAME(object_id) s,OBJECT_NAME(object_id) t,name c,
    CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) v
    FROM sys.identity_columns ORDER BY object_id,column_id;`)).recordset;
  return {target,rows,identities};
}
async function openUserTransactions() {
  return (await control.request().query(`SELECT DISTINCT s.session_id,s.program_name FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id WHERE dt.database_id=DB_ID() AND s.is_user_process=1;`)).recordset;
}
async function takeBackup() {
  const dir=path.join(ROOT,'.audit-output','database-backups');fs.mkdirSync(dir,{recursive:true});
  const token=randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
  const backup=path.join(dir,`CinemaBookingDB_pre_ssms_schedule_${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}_${token}.bak`);
  const q=backup.replaceAll("'","''");
  await control.request().batch(`BACKUP DATABASE [CinemaBookingDB] TO DISK=N'${q}' WITH COPY_ONLY,CHECKSUM,COMPRESSION,INIT; RESTORE VERIFYONLY FROM DISK=N'${q}' WITH CHECKSUM;`);
  evidence.backup={path:path.relative(ROOT,backup),bytes:fs.statSync(backup).size,copyOnly:true,checksum:true,restoreVerifyOnly:'PASS'};
}
async function waitForB() {
  const deadline=Date.now()+25000;
  let observed=null;
  while(Date.now()<deadline){
    if(await Promise.race([bPromise.then(()=>true,()=>true),new Promise((r)=>setTimeout(()=>r(false),50))])) break;
    try{
      const result=await runFile(monitor,'main_schedule_concurrency_monitor.sql');
      const row=result.rows.find((x)=>x.SessionB!==undefined);
      if(row&&String(row.wait_type??'').startsWith('LCK_M_')&&Number(row.BlockingSessionA)===Number(evidence.sessions.a.sessionId)) { observed=row; break; }
    }catch(error){ evidence.monitorErrors??=[];evidence.monitorErrors.push(error.message); }
    await new Promise((resolve)=>setTimeout(resolve,250));
  }
  return observed;
}

try{
  evidence.target=await ident(control);
  for(const [name,pool] of [['a',sessionA],['b',sessionB],['monitor',monitor]]) evidence.sessions[name]=await ident(pool);
  const otherOpen=await openUserTransactions();
  if(otherOpen.length) throw new Error(`Refusing to begin while unrelated Main transactions are open: ${JSON.stringify(otherOpen)}`);
  const parents=(await control.request().query(`SELECT (SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU ORDER BY PhongID) roomId,
    (SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID) movieId,
    (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID IN(${A_ID},${B_ID})) idCollision,
    (SELECT COUNT(*) FROM dbo.SUATCHIEU s WHERE s.PhongID=(SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU ORDER BY PhongID)
      AND s.TrangThai<>N'\u0110\u00e3 h\u1ee7y' AND s.ThoiGianBatDau<'${A_END}' AND s.ThoiGianKetThuc>'${A_START}') occupied;`)).recordset[0];
  if(!parents.roomId||!parents.movieId||Number(parents.idCollision)!==0||Number(parents.occupied)!==0) throw new Error(`SSMS concurrency fixture precondition failed: ${JSON.stringify(parents)}`);
  evidence.fixture.roomId=parents.roomId;evidence.fixture.movieId=parents.movieId;
  evidence.before=await fingerprint();
  await takeBackup();

  const aResult=await runFile(sessionA,'main_schedule_concurrency_session_a_hold.sql');
  const aReady=aResult.rows.find((x)=>x.SessionA!==undefined);
  evidence.sessions.a.scriptBatches=aResult.batches.length;
  evidence.sessions.a.readyRow=aReady;
  if(!aReady||Number(aReady.ShowtimeID)!==A_ID||Number(aReady.OpenTransactions)!==1) throw new Error('Session A SSMS script did not insert the exact fixture and hold one transaction.');
  const aState=(await sessionA.request().query(`SELECT @@SPID sessionId,@@TRANCOUNT transactionCount,XACT_STATE() transactionState,
    (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE SuatChieuID=${A_ID}) fixtureRows;`)).recordset[0];
  evidence.sessions.a.afterHold=aState;
  aTransactionOpen=Number(aState.transactionCount)===1;
  add('ssms_session_a_holds_room_lock','execute exact main_schedule_concurrency_session_a_hold.sql on session A',
    {fixtureRows:1,transactionCount:1,sessionId:evidence.sessions.a.sessionId},aState,
    Number(aState.fixtureRows)===1&&Number(aState.transactionCount)===1&&Number(aState.sessionId)===Number(evidence.sessions.a.sessionId));

  bPromise=runFile(sessionB,'main_schedule_concurrency_session_b.sql');
  const waiting=await waitForB();
  evidence.sessions.monitor.observedWait=waiting;
  add('ssms_session_b_waits_on_session_a','execute exact session B overlap INSERT while A transaction remains open',
    {waitType:'LCK_M_*',blockingSessionA:evidence.sessions.a.sessionId},waiting,
    Boolean(waiting)&&Number(waiting.BlockingSessionA)===Number(evidence.sessions.a.sessionId)&&String(waiting.wait_type).startsWith('LCK_M_'));

  const commit=await runFile(sessionA,'main_schedule_concurrency_session_a_commit.sql');
  const commitRow=commit.rows.find((x)=>x.FixtureRows!==undefined);
  evidence.sessions.a.commitRow=commitRow;
  aTransactionOpen=false;fixtureACommitted=true;
  add('ssms_session_a_commit_script','execute exact main_schedule_concurrency_session_a_commit.sql on the same session',
    {fixtureRows:1,transactionReleased:true},commitRow,Number(commitRow?.FixtureRows)===1);

  let bResult;
  try{bResult=await withTimeout(bPromise,45000,'Session B exceeded 45-second runtime timeout.');}
  catch(error){evidence.sessions.b.error=error.message;throw error;}
  const bRow=bResult.rows.find((x)=>x.Test==='concurrent overlap rejected after A committed');
  evidence.sessions.b.scriptBatches=bResult.batches.length;
  evidence.sessions.b.resultRow=bRow;
  add('ssms_session_b_rejects_overlap','execute exact main_schedule_concurrency_session_b.sql; SQL trigger must report 50001 and roll B back',
    {error:50001,sessionARows:1,sessionBRows:0,Verdict:'PASS'},bRow,
    Number(bRow?.SessionARows)===1&&Number(bRow?.SessionBRows)===0&&bRow?.Verdict==='PASS'&&String(bRow?.Actual).includes('50001'));

  const cleanup=await runFile(control,'main_schedule_concurrency_cleanup.sql');
  const cleanupRow=cleanup.rows.find((x)=>x.Test==='exact concurrency fixture cleanup');
  evidence.cleanup={batches:cleanup.batches.length,result:cleanupRow};
  fixtureACommitted=false;
  add('ssms_exact_fixture_cleanup','execute exact cleanup script; it validates interval and deletes only IDs -1900000123/-1900000124',
    {remainingFixtureRows:0,Verdict:'PASS'},cleanupRow,Number(cleanupRow?.Actual?.replace(/\D/g,''))===0&&cleanupRow?.Verdict==='PASS');

  evidence.after=await fingerprint();
  const rowDataUnchanged=JSON.stringify(evidence.before.rows)===JSON.stringify(evidence.after.rows);
  const constraints=(await control.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS,NO_INFOMSGS;')).recordsets.flat();
  const checkDb=(await control.request().query("DBCC CHECKDB(N'CinemaBookingDB') WITH NO_INFOMSGS,ALL_ERRORMSGS;")).recordsets.flat();
  const open=await openUserTransactions();
  evidence.integrity={rowDataUnchanged,identityBefore:evidence.before.identities.find((x)=>x.s==='dbo'&&x.t==='SUATCHIEU')?.v,
    identityAfter:evidence.after.identities.find((x)=>x.s==='dbo'&&x.t==='SUATCHIEU')?.v,
    constraintFindings:constraints.length,checkDbFindings:checkDb.length,openTransactions:open,
    fixtureRows:(await control.request().query(`SELECT COUNT(*) AS count FROM dbo.SUATCHIEU WHERE SuatChieuID IN(${A_ID},${B_ID});`)).recordset[0].count};
  add('post_ssms_race_main_integrity','all table fingerprints, exact fixture absence, DBCC, no open transactions',
    {rowDataUnchanged:true,fixtureRows:0,constraintFindings:0,checkDbFindings:0,openTransactions:0},evidence.integrity,
    rowDataUnchanged&&Number(evidence.integrity.fixtureRows)===0&&constraints.length===0&&checkDb.length===0&&open.length===0);
  evidence.verdict=evidence.tests.every((test)=>test.verdict==='PASS')?'PASS':'FAIL';
}catch(error){
  evidence.verdict='FAIL';evidence.error=error.message;evidence.stack=error.stack;
}finally{
  // Release a still-open A transaction before exact cleanup. This matters if a
  // monitor/assertion fails before the approved A commit script is reached.
  try{
    if(aTransactionOpen){const state=(await sessionA.request().query('SELECT @@TRANCOUNT AS c')).recordset[0];if(Number(state.c)>0)await sessionA.request().batch('ROLLBACK TRANSACTION;');aTransactionOpen=false;}
  }catch(error){evidence.cleanupError=error.message;}
  if(bPromise){try{await withTimeout(bPromise,35000,'Session B did not finish while releasing test connections.');}catch(error){evidence.sessions.b.finalError=error.message;}}
  if(fixtureACommitted){
    try{await runFile(control,'main_schedule_concurrency_cleanup.sql');fixtureACommitted=false;evidence.rescueCleanup='PASS';}
    catch(error){evidence.rescueCleanup=`FAIL: ${error.message}`;}
  }
  try{evidence.finishedUtc=new Date().toISOString();fs.writeFileSync(OUT,JSON.stringify(evidence,null,2));}finally{
    await Promise.allSettled([control.close(),sessionA.close(),sessionB.close(),monitor.close()]);
  }
  console.log(JSON.stringify({verdict:evidence.verdict,target:evidence.target,
    tests:evidence.tests.map((test)=>({name:test.name,verdict:test.verdict})),
    monitor:evidence.sessions.monitor?.observedWait?{waitType:evidence.sessions.monitor.observedWait.wait_type,blockingSessionA:evidence.sessions.monitor.observedWait.BlockingSessionA}:null,
    integrity:evidence.integrity,error:evidence.error,cleanupError:evidence.cleanupError,rescueCleanup:evidence.rescueCleanup,evidence:path.relative(ROOT,OUT)},null,2));
  if(evidence.verdict!=='PASS')process.exitCode=1;
}

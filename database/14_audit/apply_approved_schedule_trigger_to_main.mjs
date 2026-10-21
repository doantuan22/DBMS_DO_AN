// Applies the explicitly approved schedule-overlap trigger definition to exact Main.
// Creates and verifies a fresh COPY_ONLY backup before issuing any DDL.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const require=createRequire(path.join(ROOT,'backend','package.json'));
const sql=require('mssql');
const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync(path.join(ROOT,'backend','.env')));
if(env.DB_DATABASE!=='CinemaBookingDB')throw new Error('Refusing: backend configuration must name exact Main CinemaBookingDB.');
const tag=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)+'_'+randomUUID().replaceAll('-','').slice(0,8);
const backupDir=path.join(ROOT,'.audit-output','database-backups');
const backupPath=path.join(backupDir,`CinemaBookingDB_approved_schedule_trigger_predeploy_${tag}.bak`);
const sqlBackupPath=backupPath.replaceAll("'","''");
const sourcePath=path.join(ROOT,'database','07_triggers','TRG_SuatChieu_KiemTraTrungLich.sql');
const source=fs.readFileSync(sourcePath,'utf8');
const pool=await new sql.ConnectionPool({server:env.DB_SERVER,port:Number(env.DB_PORT??1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,
  options:{encrypt:String(env.DB_ENCRYPT).toLowerCase()==='true',trustServerCertificate:String(env.DB_TRUST_SERVER_CERTIFICATE??'true')==='true',useUTC:true},
  requestTimeout:180000,pool:{max:1,min:1,idleTimeoutMillis:30000}}).connect();
const ev={startedUtc:new Date().toISOString(),target:null,authorization:'user approved applying only dbo.TRG_SuatChieu_KiemTraTrungLich to DoanTuanIT/CinemaBookingDB',backup:{path:path.relative(ROOT,backupPath),copyOnly:true,checksum:true,verifyOnly:false},source:path.relative(ROOT,sourcePath),verdict:'BLOCKED'};
async function target(){
 const r=(await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state,is_read_committed_snapshot_on AS rcsi FROM sys.databases WHERE database_id=DB_ID()`)).recordset[0];
 if(r.serverName!=='DoanTuanIT'||r.databaseName!=='CinemaBookingDB'||r.state!=='ONLINE'||r.rcsi!==true)throw new Error(`Refusing incorrect target/options: ${JSON.stringify(r)}`);
 return r;
}
async function triggerState(){
 const r=(await pool.request().query(`SELECT tr.name,tr.is_disabled,sm.definition,OBJECTPROPERTYEX(tr.object_id,'ExecIsTriggerDisabled') disabled
   FROM sys.triggers tr JOIN sys.sql_modules sm ON sm.object_id=tr.object_id WHERE tr.parent_id=OBJECT_ID(N'dbo.SUATCHIEU') AND tr.name=N'TRG_SuatChieu_KiemTraTrungLich'`)).recordset[0];
 if(!r)throw new Error('Expected Main schedule trigger was not found.');
 const definition=String(r.definition??'');
 return {name:r.name,isDisabled:r.is_disabled,disabledProperty:r.disabled,definitionSha256:createHash('sha256').update(definition).digest('hex'),hasAppLock:/sp_getapplock/i.test(definition),hasRoomResource:/SUATCHIEU:ROOM:/i.test(definition),hasConflictError:/THROW\s+50001/i.test(definition),definition};
}
try{
 ev.target=await target();
 const pre=await triggerState(); ev.before={trigger:{...pre,definition:undefined}};
 fs.mkdirSync(backupDir,{recursive:true}); if(fs.existsSync(backupPath))throw new Error(`Refusing to overwrite backup: ${backupPath}`);
 await pool.request().query(`BACKUP DATABASE [CinemaBookingDB] TO DISK=N'${sqlBackupPath}' WITH COPY_ONLY,CHECKSUM,COMPRESSION,STATS=10; RESTORE VERIFYONLY FROM DISK=N'${sqlBackupPath}' WITH CHECKSUM;`);
 const stat=fs.statSync(backupPath);if(stat.size<=0)throw new Error('Fresh verified backup file is empty.');
 ev.backup.verifyOnly=true;ev.backup.bytes=stat.size;ev.backup.modifiedUtc=stat.mtime.toISOString();
 // The source is deliberately restricted to the one approved trigger object.
 const batches=source.split(/^\s*GO\s*;?\s*$/gim).map(x=>x.trim()).filter(Boolean);
 const ddlBatches=batches.filter(x=>/CREATE\s+OR\s+ALTER\s+TRIGGER\s+dbo\.TRG_SuatChieu_KiemTraTrungLich/i.test(x));
 if(ddlBatches.length!==1)throw new Error(`Expected exactly one target-trigger DDL batch, found ${ddlBatches.length}.`);
 if(/CREATE\s+(?:OR\s+ALTER\s+)?(?:TABLE|PROCEDURE|FUNCTION|VIEW|INDEX)|ALTER\s+DATABASE|DROP\s+/i.test(ddlBatches[0]))throw new Error('DDL batch contains an unapproved object/schema operation.');
 await pool.request().batch(ddlBatches[0]);
 ev.after={trigger:await triggerState()};
 const st=ev.after.trigger;
 const pass=st.isDisabled===false&&st.disabledProperty===0&&st.hasAppLock&&st.hasRoomResource&&st.hasConflictError&&st.definitionSha256!==pre.definitionSha256;
 ev.tests=[{name:'approved_trigger_ddl_installed',input:'single CREATE OR ALTER dbo.TRG_SuatChieu_KiemTraTrungLich batch; fresh Main COPY_ONLY backup verified first',expected:'trigger enabled and its definition contains transaction-owned per-room application lock and overlap THROW 50001',actual:{beforeDefinitionSha256:pre.definitionSha256,after:{...st,definition:undefined},backupVerifyOnly:ev.backup.verifyOnly},verdict:pass?'PASS':'FAIL'}];
 const txs=(await pool.request().query(`SELECT COUNT(*) n FROM sys.dm_tran_session_transactions st JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id WHERE dt.database_id=DB_ID() AND s.is_user_process=1 AND s.session_id<>@@SPID`)).recordset[0].n;
 ev.tests.push({name:'no_foreign_open_user_transaction',input:'Main user sessions other than deployment connection',expected:0,actual:Number(txs),verdict:Number(txs)===0?'PASS':'BLOCKED'});
 ev.verdict=ev.tests.every(x=>x.verdict==='PASS')?'PASS':'FAIL';
}catch(e){ev.error=e.message;ev.stack=e.stack;ev.verdict='FAIL';try{ev.after={trigger:await triggerState()};}catch(post){ev.postcheckError=post.message;}}
finally{ev.finishedUtc=new Date().toISOString();const out=path.join(ROOT,'.audit-output','approved-schedule-trigger-main-deployment.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(ev,null,2));await pool.close();console.log(JSON.stringify({verdict:ev.verdict,target:ev.target,backup:ev.backup,tests:ev.tests,error:ev.error,evidence:path.relative(ROOT,out)},null,2));if(ev.verdict!=='PASS')process.exitCode=1;}

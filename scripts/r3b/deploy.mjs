// Offline R3B deployment. No reset, table DDL or business-data writes.
import assert from 'node:assert/strict';
import path from 'node:path';
import {root,dbRoot,read,write,normalizeModule,expandSql} from '../db/lib.mjs';
import {connect,ask,mainSnapshot,sql} from '../r3a/common.mjs';
import {batches} from '../r2fix/migration-lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
assert.ok(database==='CinemaBookingDB'||/^CinemaBookingDB_R0_R1_R2_R3B[A-Za-z0-9_]+$/.test(database??''),'Explicit main or R3B disposable database required.');
if(database==='CinemaBookingDB'){
 assert.ok(process.argv.includes('--apply'),'Explicit --apply required for main deployment.');
 for(const file of ['checks.json','probes.json','partial-grants-browser.json'])assert.equal(JSON.parse(read(path.join(root,'audit/remediation/r3b/evidence',file))).status,'PASS','Required validation: '+file);
 assert.equal(JSON.parse(read(path.join(root,'audit/remediation/r3b/evidence/endpoint-inventory.json'))).status,'PASS');
}
const files=JSON.parse(read(path.join(root,'audit/remediation/r3b/evidence/migration-files.json'))).files;
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const report={database,status:'RUNNING',startedAt:new Date().toISOString(),deployedFiles:files};
const evidence=path.join(root,'audit/remediation/r3b/evidence',database==='CinemaBookingDB'?'main-deployment.json':'migration-fixture.json');
const save=()=>write(evidence,report);
let pool,transaction,open=false;
const expected=file=>{const body=read(path.join(dbRoot,file));const match=/CREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);return normalizeModule(body.slice(match.index).replace(/\s+GO\s*$/i,''));};
async function parity(provider,pending=false){
 const objects=(await ask(provider,'SELECT o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0')).recordset;
 const allowed=new Set(Object.keys(manifest.modules));assert.ok(objects.every(o=>allowed.has(o.name)),'Unexpected extra SQL modules.');
 for(const [name,file] of Object.entries(manifest.modules)){
  if(pending&&files.includes(file))continue;
  const actual=objects.find(o=>o.name===name),meta=manifest.expected.objects.find(o=>o.name===name);
  assert.ok(actual,'Missing module '+name);assert.equal(normalizeModule(actual.definition),expected(file),'Source drift '+name);
  assert.equal(actual.uses_ansi_nulls,Boolean(meta.uses_ansi_nulls));assert.equal(actual.uses_quoted_identifier,Boolean(meta.uses_quoted_identifier));
 }
 return objects.length;
}
try{
 pool=await connect(database);assert.equal((await ask(pool,'SELECT DB_NAME() AS name')).recordset[0].name,database);
 report.before=await mainSnapshot(pool);assert.equal(report.before.data.length,27);
 report.preflightModules=await parity(pool,true);
 if(database==='CinemaBookingDB'){
  const dir=(await ask(pool,"SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS Directory")).recordset[0].Directory;assert.ok(dir);
  const location=dir.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R3B_${Date.now()}.bak`;
  await pool.request().input('Path',sql.NVarChar(4000),location).query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@Path WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@Path WITH CHECKSUM;');
  write(path.join(dbRoot,'_audit/R3B-recovery-location.local.json'),{database,path:location,copyOnly:true,checksum:true,restoreVerified:true,at:new Date().toISOString()});
  report.backup={copyOnly:true,checksum:true,restoreVerified:true,localRecoveryLocation:'database/_audit/R3B-recovery-location.local.json'};save();
 }
 transaction=new sql.Transaction(pool);transaction.on('rollback',()=>{open=false;});await transaction.begin();open=true;
 await ask(transaction,'SET XACT_ABORT ON; SET LOCK_TIMEOUT 30000;');
 const tables=(await ask(transaction,'SELECT name FROM sys.tables WHERE is_ms_shipped=0 ORDER BY name')).recordset;
 for(const {name} of tables)await ask(transaction,`SELECT COUNT_BIG(*) AS LockedRows FROM dbo.[${name.replaceAll(']',']]')}] WITH(TABLOCKX,HOLDLOCK);`);
 const lockedBefore=await mainSnapshot(transaction);assert.deepEqual(lockedBefore.data,report.before.data,'Data changed during preflight; abort and rerun.');
 for(const file of files)await batches(transaction,read(path.join(dbRoot,file)));
 report.modulesVerified=await parity(transaction);
 await batches(transaction,expandSql('12_verify/verify_database.sql').replaceAll('USE CinemaBookingDB;',`USE [${database}];`));
 report.after=await mainSnapshot(transaction);
 assert.deepEqual(report.after.data,report.before.data,'All 27 tables must preserve their exact data.');
 assert.equal(report.after.schemaSha256,report.before.schemaSha256,'No table schema changes allowed.');
 assert.equal(report.after.dbPermissionsSha256,report.before.dbPermissionsSha256,'Database execution grants must remain unchanged.');
 assert.equal(report.modulesVerified,159);
 await transaction.commit();open=false;
 report.status='PASS';report.dataPreserved=true;report.tableCount=27;report.finishedAt=new Date().toISOString();save();
 console.log(`PASS atomic R3B deployment: ${database}; 27 tables preserved byte-for-byte; 159 modules verified.`);
}catch(error){if(open)await transaction.rollback();report.status='FAIL';report.error=error.message;save();throw error;}
finally{await pool?.close();}

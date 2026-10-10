// Explicitly authorized, two-procedure-only main deployment. No business DML.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,read} from '../../../scripts/db/lib.mjs';
import {open,sql} from '../../11_tests/r6-group-a/support.mjs';
import {database,server,guid,names,canonical,digest,manifest,identity,activity,snapshot,parity,preservation,lockData} from './verify.mjs';
import {createSupportService} from '../../../backend/src/services/supportService.js';
import {createAdminService} from '../../../backend/src/services/adminService.js';
import {PROCEDURES} from '../../../backend/src/db/procedures.js';
import {createProcedureClient} from '../../../backend/src/db/procedureClient.js';
const arg=name=>process.argv.find(s=>s.startsWith('--'+name+'='))?.slice(name.length+3);
const output=path.resolve(arg('output')||'');
assert.ok(arg('output')&&output.startsWith(path.join(root,'docs/evidence/main-db-deployment/runs')+path.sep));
assert.ok(process.argv.includes('--apply'),'Explicit --apply is required; authorization is already provided by this task.');
assert.ok(!fs.existsSync(path.join(output,'result.json')),'Refuse evidence overwrite.');
const deploymentID=path.basename(output),now=()=>new Date().toISOString();
function save(name,value){const file=path.join(output,name);assert.ok(!fs.existsSync(file),'Refuse existing '+name);fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
const result={deploymentID,database,server,status:'RUNNING',startedAt:now(),mode:'SCOPED_MAIN_TWO_PROCEDURES',procedures:names,steps:[]};
let pool,committed=false,backup,baseline;
function sourceGate(){
 const seal=JSON.parse(read(path.join(root,'docs/evidence/r7-2/validation/2026-10-09T15-50-07-886Z-4fd88724/quality.json')));
 const r73=JSON.parse(read(path.join(root,'docs/evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/quality.json')));
 for(const [file,hash] of Object.entries(seal.testedSourceHashes))assert.equal(digest(fs.readFileSync(path.join(root,file))),hash,file);
 for(const [file,hash] of Object.entries(r73.artifacts))assert.equal(digest(fs.readFileSync(path.join(root,file))),hash,file);
 return {status:'PASS',sourceCommit:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),
 testedSourceFiles:Object.keys(seal.testedSourceHashes).length,canonicalFiles:names.map(n=>({name:n,file:canonical[n].file,sha256:canonical[n].fileSHA256})),
 R73ArtifactSeal:'PASS',authorization:'User attachment: Direct Execution Authorized — No Additional Confirmation Required'};
}
function backendChecks(){
 const checks=[];
 function check(id,args,cwd=root){
  const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:300000,maxBuffer:16*1024*1024});
  save(id+'.log',(r.stdout||'')+(r.stderr||''));
  const counts=Object.fromEntries([...(r.stdout||'').matchAll(/^# (tests|pass|fail|cancelled|skipped) (\d+)$/gm)].map(m=>[m[1],Number(m[2])]));
  const item={id,exitCode:r.status,status:r.status===0?'PASS':'FAIL',...counts};checks.push(item);assert.equal(r.status,0,id);
  console.log(id+' '+JSON.stringify(item));return item;
 }
 const full=check('backend-regression',['--test','--test-reporter=tap','tests/**/*.test.js'],path.join(root,'backend'));
 assert.equal(full.tests,192);assert.equal(full.pass,192);assert.equal(full.fail,0);assert.equal(full.skipped,0);
 check('no-sql',['scripts/audit-no-sql.mjs']);
 const original=new URL('../../../scripts/db/contract-check.mjs',import.meta.url);
 let source=fs.readFileSync(original,'utf8').replace('{dbRoot,audit,read,write}','{dbRoot,read,write}');
 source='const audit='+JSON.stringify(output)+';\n'+source;
 source=source.replace(/(['"])(\.\.?\/[^'"]+)\1/g,(_,quote,file)=>quote+new URL(file,original).href+quote);
 check('typed-contracts',['--input-type=module','-e',source]);
 return {status:'PASS',checks,scope:'Fresh backend unit/contract and architecture checks, not a main HTTP integration suite'};
}
function bodyFromBackup(row){
 const match=/\b(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROCEDURE\b/i.exec(row.definition);assert.ok(match,row.name);
 return row.definition.slice(0,match.index)+row.definition.slice(match.index).replace(/^(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+PROCEDURE\b/i,'ALTER PROCEDURE');
}
async function prepareBackup(connection,state,id){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cinema-r72-main-'+deploymentID+'-'));
 const objects=state.metadata.objects.filter(o=>names.includes(o.name));assert.equal(objects.length,2);
 const item={status:'RUNNING',databaseIdentity:id,createdAt:now(),sourceVersion:result.sourceGate.sourceCommit,privateDirectory:directory,procedures:[]};
 const syntaxPool=await open(database,1);
 try{
  for(const row of objects){
   assert.equal(row.schemaName,'dbo');assert.equal(row.type.trim(),'P');assert.ok(row.definition);
   const body=bodyFromBackup(row),options=`SET ANSI_NULLS ${row.uses_ansi_nulls?'ON':'OFF'};SET QUOTED_IDENTIFIER ${row.uses_quoted_identifier?'ON':'OFF'};`;
   const guard=`IF DB_NAME()<>N'${database}' OR (SELECT CONVERT(VARCHAR(36),database_guid) FROM sys.database_recovery_status WHERE database_id=DB_ID())<>'${guid}' THROW 51079,'Wrong main database rollback target.',1;`;
   const script=`USE [${database}];\nGO\n${guard}\n${options}\nGO\n${body}\nGO\n`;
   const file=path.join(directory,row.name+'.rollback.sql');fs.writeFileSync(file,script,{flag:'wx'});
   const entry={name:row.name,definition:row.definition,originalDefinitionSHA256:digest(row.definition),normalizedSHA256:digest(normalizeSaved(row.definition)),
    objectMetadata:row,parameters:state.metadata.parameters.filter(p=>p.objectName===row.name),dependencies:state.metadata.dependencies.filter(d=>d.objectName===row.name),
    rollbackFile:file,rollbackSQLSHA256:digest(script),options,body};
   // Parse on a separate connection with execution disabled; never ALTER to
   // "test" rollback. These definitions already compile on the actual server.
   await syntaxPool.request().batch('SET PARSEONLY ON;');
   try{await syntaxPool.request().batch(options);await syntaxPool.request().batch(body);entry.syntaxCheck='PARSEONLY_PASS';}
   finally{await syntaxPool.request().batch('SET PARSEONLY OFF;');}
   item.procedures.push(entry);
  }
 }finally{await syntaxPool.close();}
 fs.writeFileSync(path.join(directory,'backup.private.json'),JSON.stringify(item,null,2)+'\n',{flag:'wx'});
 assert.ok(id.backupDirectory,'SQL Server backup directory unavailable.');
 const file=id.backupDirectory.replace(/[\\/]?$/,'\\')+'CinemaBookingDB_pre_R72_main_'+deploymentID+'.bak';
 const existing=await connection.request().input('BackupPath',sql.NVarChar(4000),file).query('EXEC master.dbo.xp_fileexist @BackupPath;');
 assert.equal(Number(Object.values(existing.recordset[0])[0]),0,'Backup destination already exists.');
 const request=connection.request().input('BackupPath',sql.NVarChar(4000),file);request.timeout=180000;
 await request.query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM,NOINIT; RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
 const header=(await connection.request().input('BackupPath',sql.NVarChar(4000),file).query('RESTORE HEADERONLY FROM DISK=@BackupPath;')).recordset;
 assert.equal(header.length,1);assert.equal(header[0].DatabaseName,database);assert.equal(header[0].IsCopyOnly,true);assert.equal(header[0].HasBackupChecksums,true);
 item.fullBackup={file,status:'PASS',copyOnly:true,checksum:true,verifyOnly:'PASS',databaseName:header[0].DatabaseName,
  backupSetGUID:header[0].BackupSetGUID,backupStart:header[0].BackupStartDate,backupFinish:header[0].BackupFinishDate,backupSize:header[0].BackupSize};
 item.status='PASS';item.readyAt=now();
 fs.writeFileSync(path.join(directory,'backup-ready.private.json'),JSON.stringify(item,null,2)+'\n',{flag:'wx'});
 return item;
}
function normalizeSaved(definition){return normalizeModule(definition);}
async function executeCanonical(connection,name){
 assert.ok(names.includes(name));
 const source=canonical[name].source,batches=source.split(/^GO\s*$/gmi).filter(b=>b.trim());assert.equal(batches.length,2);
 assert.match(batches[0],/^SET ANSI_NULLS ON;\s*SET QUOTED_IDENTIFIER ON;\s*$/i);
 assert.equal((batches[1].match(/\bCREATE\s+OR\s+ALTER\s+PROCEDURE\b/gi)||[]).length,1);
 assert.ok(batches[1].includes('dbo.'+name));
 for(const batch of batches)await connection.request().batch(batch);
 const row=(await connection.request().input('Name',sql.NVarChar(128),name).query('SELECT o.type,m.definition FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.name=@Name AND SCHEMA_NAME(o.schema_id)=\'dbo\';')).recordset[0];
 assert.equal(row.type.trim(),'P');
 // Full normalized comparison is performed by parity(); no rewritten logic.
 return {name,status:'APPLIED_IN_TRANSACTION',source:canonical[name].file,sourceSHA256:canonical[name].fileSHA256,at:now()};
}
async function safeFunctional(connection){
 const actors=(await connection.request().query(`SELECT n.NguoiDungID,v.MaVaiTro,
 dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_KHIEUNAI') complaintGrant,
 dbo.fn_KiemTraQuyenNguoiDung(n.NguoiDungID,'QL_NGUOIDUNG') userGrant
 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.TrangThai=N'Hoạt động';
 SELECT VaiTroID,MaVaiTro FROM dbo.VAITRO;
 SELECT KhieuNaiID,MucDoUuTien FROM dbo.KHIEUNAI ORDER BY KhieuNaiID;`)).recordsets;
 const admin=actors[0].find(a=>a.MaVaiTro==='ADMIN'&&a.complaintGrant&&a.userGrant);
 const support=actors[0].find(a=>a.MaVaiTro==='CSKH'&&a.complaintGrant);
 const customer=actors[0].find(a=>a.MaVaiTro==='KHACH_HANG');
 const customerRole=actors[1].find(a=>a.MaVaiTro==='KHACH_HANG');assert.ok(admin&&support&&customer&&customerRole,'Read-only probe actors must already exist.');
 const client=createProcedureClient(async()=>connection);
 const execute=async(key,parameters)=>{
  assert.ok(['SUPPORT_COMPLAINT_LIST','ADMIN_USER_CREATE'].includes(key),'Only scoped procedure gateway keys allowed.');
  assert.ok(PROCEDURES[key]);
  return client.executeProcedure(key,parameters);
 };
 const service=createSupportService({execute}),adminService=createAdminService({execute});
 const cases=[];
 for(const actor of [admin,support])for(const priority of [null,'Thấp','Trung bình','Cao','Khẩn cấp']){
  const rows=await service.list(actor.NguoiDungID,priority?{priority}:{});
  const expected=actors[2].filter(c=>priority===null||c.MucDoUuTien===priority).map(c=>c.KhieuNaiID).sort((a,b)=>a-b);
  assert.deepEqual(rows.map(r=>r.id).sort((a,b)=>a-b),expected);
  cases.push({id:`LIST_${actor.MaVaiTro}_${priority??'DEFAULT'}`,layer:'BACKEND_SERVICE_REAL_SQL_MAIN',role:actor.MaVaiTro,
   procedure:'dbo.sp_Support_Complaint_List',priority,result:'PASS',actualCount:rows.length,expectedCount:expected.length,
   returnedIDsSHA256:digest(rows.map(r=>r.id)),assertion:'Actual SQL-filtered row IDs equal persisted KHIEUNAI IDs; full row content is not exported'});
 }
 async function denial(id,action,status,code){
  let caught;try{await action();}catch(error){caught=error;}
  assert.ok(caught,id+' must fail');assert.equal(caught.status,status);assert.equal(caught.code,code);
  cases.push({id,layer:'BACKEND_SERVICE_REAL_SQL_MAIN',expected:{httpStatusMapping:status,code},actual:{httpStatusMapping:caught.status,code:caught.code},result:'PASS'});
 }
 await denial('PRIORITY_INVALID_SQL_50405',()=>service.list(admin.NguoiDungID,{priority:'__INVALID_R72_MAIN__'}),400,'INVALID_PRIORITY');
 let wrongRole;try{await service.list(customer.NguoiDungID,{});}catch(e){wrongRole=e;}
 assert.equal(wrongRole?.number,50301);
 cases.push({id:'QUEUE_WRONG_ROLE_SQL_50301',layer:'BACKEND_SERVICE_REAL_SQL_MAIN',expected:{sqlError:50301},actual:{sqlError:wrongRole.number},
  result:'PASS',note:'Direct service/gateway sees SQL role denial; HTTP middleware has a separate SUPPORT_REQUIRED contract and was not executed here'});
 // The canonical policy rejects an existing Customer role before INSERT. No
 // positive account fixture, invalid-FK insertion or identity increment on main.
 await denial('CREATE_CUSTOMER_DENIED_SQL_50404',()=>adminService.createUser(admin.NguoiDungID,
  {roleId:customerRole.VaiTroID,name:'Forbidden deployment probe',email:'never-inserted-r72@example.invalid',password:'MainProbeOnly-8',phone:null}),403,'ROLE_CREATE_FORBIDDEN');
 const invalidActor=(await connection.request().query('SELECT ISNULL(MAX(NguoiDungID),0)+1 id FROM dbo.NGUOIDUNG;')).recordset[0].id;
 let denied;try{await connection.request().input('ActorID',sql.Int,invalidActor).input('HoTen',sql.NVarChar(100),'Never inserted')
 .input('Email',sql.VarChar(150),'never-inserted-r72@example.invalid').input('MatKhauHash',sql.VarChar(255),'NeverInsertedHash')
 .input('SoDienThoai',sql.VarChar(20),null).input('VaiTroID',sql.Int,customerRole.VaiTroID).execute('dbo.sp_Admin_User_Create');}catch(e){denied=e;}
 assert.equal(denied?.number,50300);cases.push({id:'CREATE_INVALID_ACTOR_SQL_50300',layer:'DIRECT_SQL_MAIN',expected:50300,actual:denied.number,result:'PASS'});
 return {status:'PASS',cases,caseCount:cases.length,mainDataMutationFixtures:0,
  backendEvidence:'Real service -> typed mssql Request -> deployed main SP; HTTP server/browser were not started',
  reusedMutatingEvidence:'R7.2 p2.json /cases/15..31 on verified Test DB; allowed creates/custom/duplicate/FK/rollback are not rerun on main'};
}
async function restoreOwnedDefinitions(){
 const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
 try{
  await tx.request().batch('SET XACT_ABORT ON;SET LOCK_TIMEOUT 5000;');await identity(tx);await lockData(tx);
  const before=await snapshot(tx);
  for(const p of backup.procedures){assert.equal(digest(fs.readFileSync(p.rollbackFile,'utf8')),p.rollbackSQLSHA256);await tx.request().batch(p.options);await tx.request().batch(p.body);}
  const restored=await snapshot(tx);preservation(before,restored);
  for(const p of backup.procedures)assert.equal(normalizeModule(restored.metadata.objects.find(o=>o.name===p.name).definition),normalizeModule(p.definition));
  await tx.commit();return {status:'RESTORED_TWO_ORIGINAL_DEFINITIONS',at:now(),dataPreservation:'PASS',originalDefinitionHashesMatched:true};
 }catch(error){try{await tx.rollback();}catch{}throw error;}
}
try{
 result.sourceGate=sourceGate();result.backend=backendChecks();save('backend-compatibility.json',result.backend);
 pool=await open(database,1);
 const id=await identity(pool),sessions=await activity(pool),initial=await snapshot(pool);
 const drift=initial.metadata.objects.filter(o=>o.definition&&canonical[o.name]?.definition!==canonicalDefinition(o.definition)).map(o=>o.name);
 // Repeated deployment is idempotent: skip ALTER when both already canonical.
 assert.ok(drift.length===0||drift.length===2&&drift.every(n=>names.includes(n)),'Unexpected partial/out-of-scope main drift.');
 result.preflight={status:'PASS',identity:id,activity:sessions,parity:parity(initial,drift)};save('execution-preflight.json',{...result.preflight,state:initial});
 if(drift.length){
  backup=await prepareBackup(pool,initial,id);result.backup={status:backup.status,fullBackup:backup.fullBackup,privateDirectory:backup.privateDirectory,
   procedures:backup.procedures.map(p=>({name:p.name,originalDefinitionSHA256:p.originalDefinitionSHA256,normalizedSHA256:p.normalizedSHA256,rollbackFile:p.rollbackFile,rollbackSQLSHA256:p.rollbackSQLSHA256,syntaxCheck:p.syntaxCheck,parameters:p.parameters,dependencies:p.dependencies}))};
  save('backup.json',result.backup);console.log('Backup COPY_ONLY/CHECKSUM + VERIFYONLY PASS; two private rollback files prepared.');
  assert.deepEqual((await snapshot(pool)).fingerprints,initial.fingerprints,'State changed during backup; stop before ALTER.');
  const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let active=true;tx.on('rollback',()=>{active=false;});
  try{
   await tx.request().batch('SET XACT_ABORT ON;SET LOCK_TIMEOUT 5000;');await identity(tx);await activity(tx);await lockData(tx);
   baseline=await snapshot(tx);assert.deepEqual(baseline.fingerprints,initial.fingerprints,'Predeployment state changed.');
   result.before={session:baseline.session,fingerprints:baseline.fingerprints};save('before-atomic.json',baseline);
   for(const name of names)result.steps.push(await executeCanonical(tx,name));
   const applied=await snapshot(tx);result.appliedParity=parity(applied);result.atomicPreservation=preservation(baseline,applied);
   const changed=applied.metadata.objects.filter(o=>o.definition!==baseline.metadata.objects.find(p=>p.name===o.name&&p.type===o.type)?.definition).map(o=>o.name);
   assert.deepEqual([...changed].sort(),[...names].sort());result.changedModules=changed;save('applied-before-commit.json',{state:applied,parity:result.appliedParity,preservation:result.atomicPreservation});
   sourceGate();await tx.commit();active=false;committed=true;result.transaction='COMMIT_TWO_PROCEDURES';result.committedAt=now();
   console.log('COMMIT: exactly two procedures;159/159 canonical definitions;27 tables unchanged.');
  }catch(error){if(active)try{await tx.rollback();active=false;}catch(rollbackError){result.rollbackError={message:rollbackError.message,number:rollbackError.number};}
   const rolled=await snapshot(pool);assert.deepEqual(rolled.fingerprints,initial.fingerprints,'Rollback must restore all original definition/data hashes.');result.transaction='ROLLBACK_BEFORE_COMMIT';result.rollback={status:'PASS',originalHashesRestored:true};throw error;}
 }else{baseline=initial;result.transaction='NOOP_ALREADY_CANONICAL';result.changedModules=[];}
 const post=new sql.Transaction(pool);await post.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
 try{
  await post.request().batch('SET XACT_ABORT OFF;SET LOCK_TIMEOUT 5000;');await identity(post);await activity(post);await lockData(post);
  const before=await snapshot(post);result.postCommitParity=parity(before);result.postCommitPreservation=preservation(baseline,before);
  result.functional=await safeFunctional(post);
  const after=await snapshot(post);result.functionalPreservation=preservation(before,after,[]);assert.equal(after.session.transactionCount,1);assert.equal(after.session.xactState,1);
  save('postdeploy.json',{before,after,parity:result.postCommitParity,preservation:result.postCommitPreservation,functional:result.functional,
   functionalPreservation:result.functionalPreservation,verificationTransaction:'ROLLBACK_READ_ONLY_NO_DML'});
 }finally{await post.rollback();}
 const final=await snapshot(pool);result.finalParity=parity(final);result.dataPreservation=preservation(baseline,final);
 assert.equal(final.session.transactionCount,0);assert.equal(final.session.xactState,0);result.finalActivity=await activity(pool);result.finalSession=final.session;
 sourceGate();save('final-state.json',final);result.status='SUCCESS';result.mainStatus='MAIN_DB_DEPLOYMENT_VERIFIED';result.backendCompatibility='PASS';
}catch(error){
 result.status='FAILED';result.error={message:error.message,number:error.number,code:error.code};
 if(committed&&backup){try{result.rollback=await restoreOwnedDefinitions();result.status='ROLLED_BACK';result.mainStatus='MAIN_DB_DEPLOYMENT_PENDING';}catch(rollbackError){result.rollbackError={message:rollbackError.message,number:rollbackError.number};result.mainStatus='ROLLBACK_FAILED_STOP_WRITES';}}
 process.exitCode=1;
}finally{
 result.completedAt=now();save('result.json',result);if(pool)await pool.close();
 console.log(JSON.stringify({status:result.status,mainStatus:result.mainStatus,transaction:result.transaction,changedModules:result.changedModules,
  parity:result.finalParity?.matchingDefinitions,dataPreservation:result.dataPreservation?.status,mainProbeCases:result.functional?.caseCount,error:result.error,rollback:result.rollback?.status}));
}
function canonicalDefinition(source){
 // Use the exact same normalizer as the canonical/source verifier.
 return normalizeModule(source);
}
import {normalizeModule} from '../../../scripts/db/lib.mjs';

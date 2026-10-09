// Reuse accepted scenarios; isolate target and every new evidence artifact.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { root,read,write } from '../db/lib.mjs';
import { preflight,literal,hash } from '../db/test-target.mjs';
import { open,fingerprints,moduleParity } from '../../database/11_tests/r6-group-a/support.mjs';
const option=key=>process.argv.find(a=>a.startsWith('--'+key+'='))?.slice(key.length+3);
const database=option('database'),runID=new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8);
const dir=path.join(root,'docs/evidence/r6-group-b/runs',runID),common=pathToFileURL(path.join(root,'scripts/r6-group-b/common.mjs')).href;
const e={runID,database,label:option('label')||'checkpoints',startedAt:new Date().toISOString(),status:'RUNNING',checks:[]};
const save=()=>write(path.join(dir,'result.json'),e);save();
function oldEvidence(){
 const entries=[];
 function walk(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,item.name);if(file===path.join(root,'docs/evidence/r6-group-b'))continue;if(item.isDirectory())walk(file);else if(item.isFile())entries.push({file:path.relative(root,file).replaceAll('\\','/'),sha256:hash(fs.readFileSync(file))});}}
 walk(path.join(root,'docs/evidence'));return entries.sort((a,b)=>a.file.localeCompare(b.file));
}
const recipes=[
 ['B','r32-sql','scripts/r32/sql-tests.mjs','./common.mjs','sql-tests.json'],
 ['B','r32-api','scripts/r32/api-tests.mjs','./common.mjs','api-tests.json'],
 ['B','r32-transactions','scripts/r32/transaction-tests.mjs','./common.mjs','transaction-tests.json'],
 ['B','r32-concurrency','database/11_tests/concurrency/historical-metadata.mjs','../../../scripts/r32/common.mjs','historical-concurrency.json'],
 ['C','scope','scripts/r6-group-b/scope.mjs','./common.mjs','scope.json'],
 ['D','r11-sql','scripts/r11/sql-tests.mjs','./common.mjs','sql-tests.json'],
 ['D','r11-api','scripts/r11/api-tests.mjs','./common.mjs','api-tests.json'],
 ['D','r11-concurrency','database/11_tests/concurrency/room-delete-vs-showtime.mjs','../../../scripts/r11/common.mjs','concurrency.json'],
 ['E','r12-sql','scripts/r12/sql-tests.mjs','./common.mjs','sql-tests.json'],
 ['E','r12-api','scripts/r12/api-tests.mjs','./common.mjs','api-tests.json'],
 ['E','r12-nested','scripts/r12/nested-tests.mjs','./common.mjs','nested-tests.json'],
 ['E','status-overlap','scripts/r6-group-b/status-overlap.mjs','./common.mjs','status-overlap.json'],
 ['E','r12-concurrency','database/11_tests/concurrency/showtime-overlap.mjs','../../../scripts/r12/common.mjs','concurrency.json'],
];
function adaptNested(source){
 // Exact fixture adaptation accepted in scripts/r32/r1-regression.mjs.
 source=source.replace("'08_procedures/customer/sp_Order_ExpirePending.sql']","'08_procedures/customer/sp_Order_ExpirePending.sql','08_procedures/manager/sp_Manager_Showtime_Update.sql','08_procedures/admin/usp_Admin_Showtime_Update.sql']");
 source=source.replace("['sp_Showtime_GetDetail','sp_Order_ExpirePending']","['sp_Showtime_GetDetail','sp_Order_ExpirePending','sp_Manager_Showtime_Update','usp_Admin_Showtime_Update']");
 source=source.replace("source.replace('SET NOCOUNT ON;','SET NOCOUNT ON;\\n'+fault)","/PROCEDURE dbo\\.(?:sp_Manager|usp_Admin)_Showtime_Update/.test(source)?source.replace('IF @OwnTran=1 COMMIT TRANSACTION;',fault+'\\nIF @OwnTran=1 COMMIT TRANSACTION;'):source.replace('SET NOCOUNT ON;','SET NOCOUNT ON;\\n'+fault)");
 assert.ok(source.includes('fault+'));return source;
}
let pool,main,initial,mainBefore,oldBefore;
try{
 const gate=preflight(database);assert.ok(gate.target);assert.equal(option('confirm-target'),gate.confirmation,'Review current target preflight.');e.preflight=gate;
 const guard=gate.sqlGuard+`IF DB_NAME()<>${literal(database)} THROW 51060,'Wrong R6B target.',1;`;
 pool=await open(database,1);await pool.request().batch(guard);initial=await fingerprints(pool);e.before=initial;e.moduleBefore=await moduleParity(pool);
 assert.equal(e.moduleBefore.modules,159);assert.equal(initial.data.length,27);
 for(const table of ['DONDATVE','CHITIETVE','CHITIETDOAN','THANHTOAN','BOITHUONG_HUYSUAT','DANHGIAPHIM','KHIEUNAI','XULY_KHIEUNAI'])assert.equal(initial.data.find(r=>r.tableName===table).rows,0,'Refuse nonempty transaction DB.');
 main=await open('CinemaBookingDB',1);mainBefore=await fingerprints(main);e.mainBefore=mainBefore;
 oldBefore=oldEvidence();write(path.join(dir,'old-evidence-before.json'),oldBefore);save();
 let last;
 for(const [checkpoint,name,file,oldImport,output] of recipes){
  if(checkpoint!==last){console.log('CHECKPOINT '+checkpoint);last=checkpoint;}
  const subdir=path.join(dir,name),original=read(path.join(root,file));let source=original;
  assert.ok(source.includes("'"+oldImport+"'"));source=source.replace("'"+oldImport+"'",JSON.stringify(common));
  if(name==='r12-nested')source=adaptNested(source);
  // Preserve relative imports by resolving against the original source file.
  source=source.replace(/(['"])(\.{1,2}\/[^'"\r\n]+)\1/g,(_,quote,spec)=>JSON.stringify(pathToFileURL(path.resolve(path.dirname(path.join(root,file)),spec)).href));
  const check={checkpoint,name,source:file,originalSha256:hash(original),status:'RUNNING',startedAt:new Date().toISOString(),output:path.relative(dir,path.join(subdir,output)).replaceAll('\\','/'),...(name==='r12-nested'?{fixtureAdaptation:'Accepted R3.2 post-write fault relocation; fourteen assertions unchanged; all four module definitions restored.'}:{})};e.checks.push(check);save();
  const child=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,env:{...process.env,R6B_EVIDENCE_DIR:subdir,R6B_SQL_GUARD:guard},encoding:'utf8',timeout:300000,maxBuffer:32*1024*1024});
  write(path.join(subdir,'execution.log'),(child.stdout||'')+(child.stderr||''));check.exitCode=child.status;check.completedAt=new Date().toISOString();
  assert.equal(child.status,0,name+' failed; see '+subdir+'/execution.log');
  const result=JSON.parse(read(path.join(subdir,output)));assert.equal(result.status,'PASS');
  check.cases=result.cases?.length??result.states?.length??result.scenarios?.length??0;check.monetary=result.monetary?.length??0;check.rollback=result.rollback?.length??0;check.stress=result.stress?.length??0;
  check.httpRequests=fs.existsSync(path.join(subdir,'http-trace.json'))?JSON.parse(read(path.join(subdir,'http-trace.json'))).length:0;
  check.after=await fingerprints(pool);assert.deepEqual(check.after,initial,name+' must restore every row/module/constraint');await moduleParity(pool);
  check.status='PASS';save();console.log(`PASS ${name}: ${check.cases} cases, ${check.monetary} monetary, ${check.stress} stress, ${check.httpRequests} HTTP`);
 }
 for(const [name,args,cwd] of [['backend',['--test','tests/**/*.test.js'],path.join(root,'backend')],['no-sql',['scripts/audit-no-sql.mjs'],root]]){
  const child=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024}),output=(child.stdout||'')+(child.stderr||'');write(path.join(dir,name+'.log'),output);
  assert.equal(child.status,0);const check={checkpoint:'F',name,status:'PASS',exitCode:child.status};
  if(name==='backend'){check.tests=Number(output.match(/tests (\d+)/)?.[1]);check.pass=Number(output.match(/pass (\d+)/)?.[1]);check.skipped=Number(output.match(/skipped (\d+)/)?.[1]);assert.ok(check.tests>0);assert.equal(check.tests,check.pass);assert.equal(check.skipped,0);}
  e.checks.push(check);save();console.log('PASS '+name);
 }
 const child=spawnSync('git',['diff','--exit-code','--','backend','frontend','shared','database/00_database','database/01_schema','database/02_tables','database/03_constraints','database/04_indexes','database/05_functions','database/06_views','database/07_triggers','database/08_procedures','database/10_seed','database/baseline-manifest.json'],{cwd:root,encoding:'utf8'});assert.equal(child.status,0);e.productionSourcePreserved='PASS';
 e.integrity=(await pool.request().batch(read(path.join(root,'database/11_tests/r6-group-a/integrity.sql'))+`
 IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau) THROW 51060,'R6B overlap invariant.',1;
 SELECT DB_NAME() databaseName,is_read_committed_snapshot_on rcsi FROM sys.databases WHERE database_id=DB_ID();
 SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) invalidForeignKeys,
 (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) invalidChecks,
 (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) disabledTriggers,
 (SELECT COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau) committedOverlaps;
 SELECT name,is_disabled FROM sys.triggers WHERE name='TRG_SuatChieu_KiemTraTrungLich';`)).recordsets;
 assert.equal(e.integrity[1][0].rcsi,true);e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};const running=e.checks.find(c=>c.status==='RUNNING');if(running)running.status='FAIL';console.error(error.message);}
finally{
 if(pool){try{e.after=await fingerprints(pool);e.moduleAfter=await moduleParity(pool);assert.deepEqual(e.after,initial);e.fixturePreservation='PASS';}catch(error){e.status='FAIL';e.fixturePreservation='FAIL';e.cleanupError=error.message;}await pool.close();}
 if(main){try{e.mainAfter=await fingerprints(main);assert.deepEqual(e.mainAfter,mainBefore);e.mainPreservation='PASS';}catch(error){e.status='FAIL';e.mainPreservation='FAIL';e.mainError=error.message;}await main.close();}
 if(oldBefore){try{const after=oldEvidence();assert.deepEqual(after,oldBefore);e.oldEvidencePreservation={status:'PASS',files:after.length,sha256:hash(after)};}catch(error){e.status='FAIL';e.oldEvidencePreservation={status:'FAIL',error:error.message};}}
 e.completedAt=new Date().toISOString();save();console.log(`${e.status}: ${dir}`);if(e.status!=='PASS')process.exitCode=1;
}

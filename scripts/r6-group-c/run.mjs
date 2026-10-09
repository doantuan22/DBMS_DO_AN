import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {root,read,write} from '../db/lib.mjs';
import {preflight,literal,hash} from '../db/test-target.mjs';
import {open,fingerprints,moduleParity} from '../../database/11_tests/r6-group-a/support.mjs';
const opt=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3),database=opt('database');
const runID=new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8),dir=path.join(root,'docs/evidence/r6-group-c/runs',runID),common=pathToFileURL(path.join(root,'scripts/r6-group-c/common.mjs')).href;
const e={runID,database,only:opt('only')||null,startedAt:new Date().toISOString(),status:'RUNNING',checks:[]},save=()=>write(path.join(dir,'result.json'),e);save();
const recipes=[['R6.8','r33-sql','scripts/r33/sql-tests.mjs',['sql-tests.json']],['R6.8','r33-api','scripts/r33/api-tests.mjs',['api-tests.json']],['R6.8','complaint-flow','scripts/r6-group-c/complaint-flow.mjs',['complaint-flow.json']],['R6.9','admin','scripts/r6-group-c/admin.mjs',['admin.json']],['R6.9','r31-sql','scripts/r31/sql-tests.mjs',['sql-tests.json']],['R6.9','r31-api','scripts/r31/api-tests.mjs',['api-tests.json']],['R6.9','r43-pricing','scripts/r43/pricing-tests.mjs',['sql-tests.json','api-tests.json']],['R6.9','r42-report','scripts/r42/report-tests.mjs',['sql-tests.json','api-tests.json']]];
function freeze(){const list=[];function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(p===path.join(root,'docs/evidence/r6-group-c'))continue;if(f.isDirectory())walk(p);else if(f.isFile())list.push({file:path.relative(root,p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))});}}walk(path.join(root,'docs/evidence'));for(const p of ['docs/R6_GROUP_A_INTEGRATION_REPORT.md','docs/R6_GROUP_B_INTEGRATION_REPORT.md','docs/USE_CASE_BASELINE_45.md'])list.push({file:p,sha256:hash(read(path.join(root,p)))});return list.sort((a,b)=>a.file.localeCompare(b.file));}
let pool,initial,old,protectedPools=[];
try{
 const gate=preflight(database);assert.ok(gate.target);assert.equal(gate.confirmation,opt('confirm-target'));e.preflight=gate;const guard=gate.sqlGuard+`IF DB_NAME()<>${literal(database)} THROW 51060,'Wrong R6C target.',1;`;
 pool=await open(database,1);await pool.request().batch(guard);initial=await fingerprints(pool);e.before=initial;e.moduleBefore=await moduleParity(pool);assert.equal(e.moduleBefore.modules,159);
 for(const t of ['DONDATVE','CHITIETVE','CHITIETDOAN','THANHTOAN','KHIEUNAI','XULY_KHIEUNAI','BOITHUONG_HUYSUAT'])assert.equal(initial.data.find(r=>r.tableName===t).rows,0,'Refuse nonempty transaction fixture target.');
 const a=JSON.parse(read(path.join(root,'docs/evidence/r6-group-a/acceptance.json'))),b=JSON.parse(read(path.join(root,'docs/evidence/r6-group-b/acceptance.json')));assert.equal(a.status,'DONE');assert.equal(b.status,'DONE');
 e.reusedAcceptance={A:{run:a.runID,sha256:hash(a)},B:{run:b.finalRun,sha256:hash(b)}};
 for(const target of ['CinemaBookingDB',a.database,b.database]){assert.notEqual(target,database);const connection=await open(target,1);protectedPools.push({database:target,pool:connection,before:await fingerprints(connection)});}
 old=freeze();write(path.join(dir,'preserved-before.json'),old);save();
 for(const [phase,name,file,outputs] of recipes){
  if(e.only&&name!==e.only)continue;console.log('RUN '+phase+' '+name);const original=read(path.join(root,file));let source=original.replace("'./common.mjs'",JSON.stringify(common));assert.notEqual(source,original);
  source=source.replace(/(['"])(\.{1,2}\/[^'"\r\n]+)\1/g,(_,q,spec)=>JSON.stringify(pathToFileURL(path.resolve(path.dirname(path.join(root,file)),spec)).href));
  const subdir=path.join(dir,name),check={phase,name,source:file,sourceSha256:hash(original),status:'RUNNING',startedAt:new Date().toISOString(),outputs:outputs.map(o=>name+'/'+o)};e.checks.push(check);save();
  const child=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,env:{...process.env,R6C_EVIDENCE_DIR:subdir,R6C_SQL_GUARD:guard},encoding:'utf8',timeout:300000,maxBuffer:32*1024*1024});write(path.join(subdir,'execution.log'),(child.stdout||'')+(child.stderr||''));check.exitCode=child.status;check.completedAt=new Date().toISOString();assert.equal(child.status,0,name+' failed; see '+subdir+'/execution.log');
  for(const output of check.outputs){const result=JSON.parse(read(path.join(dir,output)));assert.equal(result.status,'PASS');}
  check.httpRequests=fs.existsSync(path.join(subdir,'http-trace.json'))?JSON.parse(read(path.join(subdir,'http-trace.json'))).length:0;
  check.after=await fingerprints(pool);assert.deepEqual(check.after,initial,name+' cleanup');await moduleParity(pool);check.status='PASS';save();console.log('PASS '+name+', HTTP='+check.httpRequests);
 }
 for(const [name,args,cwd] of [['backend',['--test','tests/**/*.test.js'],path.join(root,'backend')],['no-sql',['scripts/audit-no-sql.mjs'],root]]){const child=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024}),output=(child.stdout||'')+(child.stderr||'');write(path.join(dir,name+'.log'),output);assert.equal(child.status,0);const c={name,status:'PASS'};if(name==='backend'){c.tests=Number(output.match(/tests (\d+)/)?.[1]);c.pass=Number(output.match(/pass (\d+)/)?.[1]);c.skipped=Number(output.match(/skipped (\d+)/)?.[1]);assert.equal(c.tests,c.pass);assert.equal(c.skipped,0);}e.checks.push(c);save();}
 const git=spawnSync('git',['diff','--exit-code','--','backend','frontend','shared','database/00_database','database/01_schema','database/02_tables','database/03_constraints','database/04_indexes','database/05_functions','database/06_views','database/07_triggers','database/08_procedures','database/10_seed','database/baseline-manifest.json'],{cwd:root,encoding:'utf8'});assert.equal(git.status,0);e.productionSourcePreserved='PASS';
 e.integrity=(await pool.request().batch(read(path.join(root,'database/11_tests/r6-group-a/integrity.sql'))+`SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) invalidFK,(SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) invalidChecks,(SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) disabledTriggers;`)).recordsets;assert.deepEqual(e.integrity[1][0],{invalidFK:0,invalidChecks:0,disabledTriggers:0});e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};const current=e.checks.find(c=>c.status==='RUNNING');if(current)current.status='FAIL';console.error(error.message);}
finally{
 if(pool){try{e.after=await fingerprints(pool);assert.deepEqual(e.after,initial);e.moduleAfter=await moduleParity(pool);e.cleanup='PASS';}catch(error){e.status='FAIL';e.cleanup='FAIL';e.cleanupError=error.message;}await pool.close();}
 e.protectedDatabases=[];for(const p of protectedPools){try{const after=await fingerprints(p.pool);assert.deepEqual(after,p.before);e.protectedDatabases.push({database:p.database,before:p.before,after,status:'PASS'});}catch(error){e.status='FAIL';e.protectedDatabases.push({database:p.database,status:'FAIL',error:error.message});}await p.pool.close();}
 if(old){try{const after=freeze();assert.deepEqual(after,old);e.evidencePreservation={status:'PASS',files:after.length,sha256:hash(after)};}catch(error){e.status='FAIL';e.evidencePreservation={status:'FAIL',error:error.message};}}
 e.completedAt=new Date().toISOString();save();console.log(e.status+': '+dir);if(e.status!=='PASS')process.exitCode=1;
}

// Reuse existing tests verbatim; all new evidence stays in R6 Group A directories.
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { read,write } from '../db/lib.mjs';
import { createContext,open,fingerprints,moduleParity,root,dbRoot } from '../../database/11_tests/r6-group-a/support.mjs';
const option=key=>process.argv.find(a=>a.startsWith('--'+key+'='))?.slice(key.length+3);
const runID=new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8);
const dir=path.join(root,'docs/evidence/r6-group-a/regression',runID);
const report={runID,database:option('database'),status:'RUNNING',startedAt:new Date().toISOString(),checks:[]};
const save=()=>write(path.join(dir,'result.json'),report);
save();
let context,pool,main,mainBefore;
try {
 context=await createContext(report.database,option('confirm-target'));
 main=await open('CinemaBookingDB');mainBefore=await fingerprints(main);
 pool=await open(report.database,1); // Same physical session across GO/temp tables.
 for(const [name,file,total] of [
  ['R21-bookability','11_tests/booking/bookability.sql',30],
  ['R22-promotion-atomicity','11_tests/booking/promotion_atomicity.sql',28]
 ]) {
  const check={name,source:'database/'+file,sourceUnmodified:true,status:'RUNNING',total};report.checks.push(check);save();
  console.log('RUN '+name);
  const before=await fingerprints(context.pool);let result;
  for(const batch of read(path.join(dbRoot,file)).split(/^GO\s*$/gmi).filter(b=>b.trim())) {
   // Guard and existing SQL run together on this single-session offline pool.
   result=await pool.request().batch(context.guard+batch);
  }
  const rows=result.recordsets.find(rows=>rows[0]?.CaseName)||[];
  assert.equal(rows.length,total);assert.ok(rows.every(r=>r.Status==='PASS'));
  const after=await fingerprints(context.pool);assert.deepEqual(after,before);
  check.status='PASS';check.pass=rows.length;check.cases=rows;check.before=before;check.after=after;
  console.log(`PASS ${name}: ${rows.length}/${total}`);save();
 }
 await pool.close();pool=undefined;
 // Capture complete logs, including 191 existing assertions and zero skips.
 for(const [name,args,cwd] of [
  ['backend',[ '--test','tests/**/*.test.js'],path.join(root,'backend')],
  ['no-sql',['scripts/audit-no-sql.mjs'],root]
 ]) {
  const check={name,command:['node',...args].join(' '),status:'RUNNING'};report.checks.push(check);save();
  const child=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
  const output=(child.stdout||'')+(child.stderr||'');write(path.join(dir,name+'.log'),output);
  check.exitCode=child.status;check.evidence=name+'.log';assert.equal(child.status,0,name+' failed: '+child.stderr);
  if(name==='backend') {
   check.total=Number(output.match(/(?:ℹ|#) tests (\d+)/)?.[1]);check.pass=Number(output.match(/(?:ℹ|#) pass (\d+)/)?.[1]);check.skipped=Number(output.match(/(?:ℹ|#) skipped (\d+)/)?.[1]);
   assert.ok(check.total>0);assert.equal(check.total,check.pass);assert.equal(check.skipped,0);
  }
  check.status='PASS';console.log('PASS '+name+(check.total?` ${check.pass}/${check.total}`:''));save();
 }
 report.moduleParity=await moduleParity(context.pool);
 const changed=spawnSync('git',['diff','--exit-code','--','backend','frontend','shared','database/00_database','database/01_schema','database/02_tables','database/03_constraints','database/04_indexes','database/05_functions','database/06_views','database/07_triggers','database/08_procedures','database/10_seed','database/baseline-manifest.json'],{cwd:root,encoding:'utf8'});
 assert.equal(changed.status,0,'Production source changed');report.productionSourcePreserved='PASS';
 report.integrity=await context.integrity();report.status='PASS';
} catch(error) {
 report.status='FAIL';report.error={message:error.message,number:error.number};console.error(error.message);
 const active=report.checks.find(c=>c.status==='RUNNING');if(active)active.status='FAIL';
} finally {
 if(pool)await pool.close();
 if(context) {
  try {await context.cleanup();report.fixturePreservation='PASS';}catch(error){report.fixturePreservation='FAIL';report.cleanupError=error.message;report.status='FAIL';}
  await context.pool.close();
 }
 if(main) {
  try {report.mainBefore=mainBefore;report.mainAfter=await fingerprints(main);assert.deepEqual(report.mainAfter,mainBefore);report.mainPreservation='PASS';}
  catch(error){report.mainPreservation='FAIL';report.mainError=error.message;report.status='FAIL';}
  await main.close();
 }
 report.completedAt=new Date().toISOString();save();
 write(path.join(root,'docs/evidence/r6-group-a/latest-regression.json'),{runID,path:path.relative(root,path.join(dir,'result.json')).replaceAll('\\','/'),status:report.status});
 console.log(`${report.status}: regression evidence ${dir}`);if(report.status!=='PASS')process.exitCode=1;
}

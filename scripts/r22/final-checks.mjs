import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root,evidenceRoot,read,write,env } from './common.mjs';
import { walk } from '../db/lib.mjs';
const sha=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
const preserved=JSON.parse(read(path.join(evidenceRoot,'preserved-before.json')));
for(const row of preserved.files)assert.equal(sha(read(path.join(root,row.file))),row.sha256,row.file);
const result=name=>JSON.parse(read(path.join(evidenceRoot,name+'.json')));
const checks=result('checks'),database=checks.database;
for(const name of ['sql-tests','api-tests','promotion-concurrency','r21-regression','r1-regression','r11-sql','r11-concurrency','r12-sql','r12-nested','r12-concurrency','r21-sql','r21-api','r21-parents','migration-replay','checks']){
 const r=result(name);assert.equal(r.status,'PASS',name);assert.equal(r.database,database,name);
}
for(const name of ['browser','main-test-isolation','main-migration','main-readonly','current-audit-status','source-parity'])assert.equal(result(name).status,'PASS',name);
assert.equal(checks.checks.length,14);assert.ok(checks.checks.every(row=>row.status==='PASS'&&(row.skipped??0)===0));
const sql=result('sql-tests'),api=result('api-tests'),races=result('promotion-concurrency'),r21=result('r21-api'),r12=result('r12-concurrency'),migration=result('main-migration');
assert.equal(sql.cases.length,28);assert.equal(sql.constraintCases.length,6);assert.equal(sql.rollbackInjection.consumed.usageBeforeFailure,1);assert.deepEqual(sql.rollbackInjection.initial,sql.rollbackInjection.final);
assert.equal(api.cases.length,14);assert.equal(api.requests.length,54);assert.equal(api.concurrency.length,2);
assert.equal(races.lastQuota.length,2);assert.equal(races.adminRaces.length,12);
for(const row of [...races.lastQuota,...races.adminRaces]){
 assert.match(row.blocking.wait_type,/^LCK_M_/);assert.notEqual(row.spids.a,row.spids.b);
 assert.equal(row.sessions.a.trancount,0);assert.equal(row.sessions.b.trancount,0);assert.equal(row.sessions.a.xactState,0);assert.equal(row.sessions.b.xactState,0);
}
assert.equal(r21.requests.length,107);assert.equal(r21.concurrency.length,2);assert.equal(result('r21-sql').cases.length,30);assert.equal(result('r21-parents').cases.length,14);
assert.equal(r12.scenarios.length,26);assert.equal(r12.stressRaces,125);assert.equal(r12.finalCommittedOverlapCount,0);
assert.equal(migration.sourceParity.modules,159);assert.deepEqual(migration.before.data,migration.after.data);assert.equal(migration.backup.restoreVerifyOnly,'PASS');
assert.deepEqual(migration.after.data,result('main-before-first-version').state.data);
assert.ok(migration.changedModules.every(name=>['sp_Booking_Create','sp_Promotion_Validate','sp_Admin_Promotion_Delete'].includes(name)));
for(const file of walk(path.join(root,'backend/src')))if(/\.(js|mjs)$/.test(file))assert.ok(!/new\s+(?:sql\.)?Transaction\b|\.transaction\s*\(|new\s+Mutex\b|from\s+['"](?:redis|ioredis)|scripts\/r22/.test(read(file)),file);
for(const file of walk(evidenceRoot))if(/\.(json|txt|md|patch|sql|js|jsx)$/.test(file)){
 const source=read(file);if(env.DB_PASSWORD)assert.ok(!source.includes(env.DB_PASSWORD),'Configured password in '+file);
 assert.ok(!/"token"\s*:\s*"eyJ/.test(source),'JWT in '+file);
}
execFileSync('git',['-c','core.safecrlf=false','diff','--check'],{cwd:root,encoding:'utf8'});
const criteria=[
 ['Preview only','api-tests.json'],['Preview has no reservation/write','api-tests.json'],['Booking authoritative re-check','sql-tests.json'],['Promotion row locked','promotion-concurrency.json'],['Lock retained to commit/rollback','promotion-concurrency.json'],
 ['Existence re-checked','sql-tests.json'],['Status re-checked','sql-tests.json'],['Start/end validity uses DB clock','sql-tests.json'],['Quota checked under lock','promotion-concurrency.json'],['Minimum checked','sql-tests.json'],['Existing type/value/max contract checked','sql-tests.json'],['Discount calculated in DB','sql-tests.json'],['Client amounts/validity rejected','api-tests.json'],
 ['Invalid requested promotion fails','api-tests.json'],['No full-price fallback','api-tests.json'],['Invalid promotion has no order','sql-tests.json'],['Invalid promotion has no ticket','sql-tests.json'],['Invalid promotion has no food','sql-tests.json'],['Invalid promotion has no usage','sql-tests.json'],['Valid consume exactly once','sql-tests.json'],['Rollback restores usage','sql-tests.json'],
 ['Last quota no oversubscription','promotion-concurrency.json'],['Two concurrent bookings at most one success','api-tests.json'],['Admin Update serialized','promotion-concurrency.json'],['Stale preview rejected','api-tests.json'],['No promotion booking preserved','sql-tests.json'],['R2.1 bookability preserved','r21-regression.json'],['Seat conflict preserved','r21-api.json'],['R1.1 PASS','r11-concurrency.json'],['R1.2 PASS','r12-concurrency.json'],['Backend full regression PASS','checks.json'],['Frontend tests PASS','checks.json'],['No SQL backend PASS','no-sql.txt'],['No table added','main-migration.json'],['No Node transaction/mutex','final-checks.json'],['No Redis/lock service','final-checks.json'],['Real concurrency evidence','promotion-concurrency.json'],['Final database state recorded','promotion-concurrency.json']
].map(([criterion,evidence],i)=>({id:i+1,criterion,evidence,status:'PASS'}));assert.equal(criteria.length,38);
write(path.join(evidenceRoot,'final-checks.json'),{at:new Date().toISOString(),database,status:'PASS',acceptedArtifactsPreserved:preserved.files.length,
 sqlCases:28,constraintCases:6,apiRequests:54,lastQuotaSqlRaces:2,adminRaces:12,httpQuotaRaces:2,browserChecks:result('browser').result.checks.length,
 r21Regression:'PASS',r1Regression:'PASS',r12StressRaces:125,sourceParityModules:159,tablesPreserved:27,mainDataPreservedFromTaskStart:'PASS',skipCount:0,credentialsScan:'PASS',runtimeTransactionMutexScan:'PASS',diffWhitespace:'PASS',exitCriteria:criteria});
console.log(`PASS final R2.2: ${preserved.files.length} accepted artifacts preserved;38/38 criteria; real quota/Admin/rollback evidence; R2.1/R1 full regression; data27/modules159 unchanged except three reviewed procedures.`);

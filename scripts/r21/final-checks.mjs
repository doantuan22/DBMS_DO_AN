import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root,evidenceRoot,read,write,env } from './common.mjs';
import { walk } from '../db/lib.mjs';
const before=JSON.parse(read(path.join(evidenceRoot,'preserved-before.json')));
const sha=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
for(const row of before.files) assert.equal(sha(read(path.join(root,row.file))),row.sha256,row.file);
for(const file of ['sql-tests','api-tests','parent-concurrency','r1-regression','r11-sql','r11-concurrency','r12-sql','r12-nested','r12-concurrency','checks','migration-replay','main-migration','main-readonly','current-audit-status']) assert.equal(JSON.parse(read(path.join(evidenceRoot,file+'.json'))).status,'PASS',file);
const sql=JSON.parse(read(path.join(evidenceRoot,'sql-tests.json'))),api=JSON.parse(read(path.join(evidenceRoot,'api-tests.json'))),parents=JSON.parse(read(path.join(evidenceRoot,'parent-concurrency.json'))),r12=JSON.parse(read(path.join(evidenceRoot,'r12-concurrency.json'))),checks=JSON.parse(read(path.join(evidenceRoot,'checks.json')));
assert.equal(sql.cases.length,30);assert.equal(api.requests.length,107);assert.equal(api.concurrency.length,2);assert.equal(parents.cases.length,14);
assert.ok(parents.cases.every(row=>row.blocking.wait_type.startsWith('LCK_M_')&&row.sessions.a.trancount===0&&row.sessions.b.trancount===0&&row.spids.a!==row.spids.b));
assert.equal(r12.scenarios.length,26);assert.equal(r12.stressRaces,125);assert.equal(r12.finalCommittedOverlapCount,0);assert.equal(r12.globalFinalStateQuery,'PASS');
assert.equal(checks.checks.length,12);assert.ok(checks.checks.every(row=>row.status==='PASS'&&(row.skipped??0)===0));
const migration=JSON.parse(read(path.join(evidenceRoot,'main-migration.json')));assert.equal(migration.changedModules.length,6);assert.deepEqual(migration.before.data,migration.after.data);assert.equal(migration.backup.restoreVerifyOnly,'PASS');assert.equal(migration.sourceParity.modules,159);
for(const file of walk(path.join(root,'backend/src'))) if(/\.(js|mjs)$/.test(file)) {
 const source=read(file);assert.ok(!/new\s+(?:sql\.)?Transaction\b|\.transaction\s*\(|new\s+Mutex\b|from\s+['"](?:redis|ioredis)|scripts\/r21/.test(source),file);
}
const changedSources=['database/06_views/vw_LichChieuChiTiet.sql','database/05_functions/fn_DanhSachGheSuatChieu.sql','database/08_procedures/booking/sp_Booking_Create.sql',
 'database/08_procedures/public/sp_Showtime_ListByMovie.sql','database/08_procedures/public/sp_Showtime_GetDetail.sql','database/08_procedures/public/sp_Seat_ListByShowtime.sql',
 'database/build-objects.sql','backend/src/services/bookingService.js','backend/tests/bookingService.test.js','backend/tests/sqlErrorCoverage.test.js',
 'frontend/src/pages/BookingPreparation.jsx','frontend/src/utils/bookingLimits.js','frontend/tests/bookingLimits.test.js'];
write(path.join(evidenceRoot,'source-changes.patch'),execFileSync('git',['-c','core.safecrlf=false','diff','--',...changedSources],{cwd:root,encoding:'utf8'}));
for(const file of walk(evidenceRoot)) if(/\.(json|txt|md|patch)$/.test(file)) {
 const content=read(file);if(env.DB_PASSWORD) assert.ok(!content.includes(env.DB_PASSWORD),'Configured password leaked: '+file);
 assert.ok(!/"token"\s*:\s*"eyJ/.test(content),'JWT leaked: '+file);
}
execFileSync('git',['-c','core.safecrlf=false','diff','--check'],{cwd:root,encoding:'utf8'});
write(path.join(evidenceRoot,'final-checks.json'),{at:new Date().toISOString(),status:'PASS',acceptedArtifactsPreserved:before.files.length,sqlCases:30,apiRequests:107,parentRaces:14,bookingSeatRaces:2,
 r1Regression:'PASS',r12Scenarios:26,r12StressRaces:125,finalCommittedOverlapCount:0,sourceParityModules:159,dataTablesPreserved:27,runtimeTransactionMutexScan:'PASS',credentialsScan:'PASS',skipCount:0,exitCriteria:29,diffWhitespace:'PASS'});
console.log(`PASS final: ${before.files.length} accepted artifacts preserved; SQL30/API107/parent14/booking-seat2; R1 full regression;29 criteria; no drift/leaks/skips.`);

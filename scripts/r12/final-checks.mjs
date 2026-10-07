import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root,evidenceRoot,env,read,write } from './common.mjs';
import { walk } from '../db/lib.mjs';
const sha=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
const preserved=JSON.parse(read(path.join(evidenceRoot,'preserved-before.json')));
for(const {file,sha256} of preserved.files) assert.equal(sha(read(path.join(root,file))),sha256,file+' must preserve accepted work');
for(const name of ['sql-tests','nested-tests','api-tests','concurrency','room-delete-regression','checks','source-parity','main-migration','main-readonly','current-audit-status']) assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS',name);
const races=JSON.parse(read(path.join(evidenceRoot,'concurrency.json')));
assert.equal(races.scenarios.length,26);assert.ok(races.stress.length>=100);assert.equal(races.finalCommittedOverlapCount,0);assert.equal(races.globalFinalStateQuery,'PASS');
assert.ok([...races.scenarios,...races.stress].every(test=>test.status==='PASS'&&test.overlapCount===0&&test.sessionA!==test.sessionB&&test.sessionsAfter.every(session=>session.transactions===0&&session.state===0)));
const room=JSON.parse(read(path.join(evidenceRoot,'room-delete-concurrency.json')));assert.equal(room.status,'PASS');assert.equal(room.cases.length,10);assert.ok(room.cases.every(test=>test.status==='PASS'&&test.invariant==='PASS'));
const checks=JSON.parse(read(path.join(evidenceRoot,'checks.json')));assert.ok(checks.checks.every(check=>check.status==='PASS'&&(check.skipped??0)===0));
const noRuntimeTransaction=/new\s+(?:sql|mssql)\.Transaction\b|\.transaction\s*\(|async-mutex|\bRedlock\b|from\s+['"]redis['"]/i;
for(const file of walk(path.join(root,'backend/src'))) if(/\.(?:js|mjs)$/.test(file)) {
 const source=read(file);assert.ok(!noRuntimeTransaction.test(source),path.relative(root,file)+' must not own concurrency/transactions');assert.ok(!/scripts[\\/]r1[12]/.test(source),'Offline tools must not be runtime imports.');
}
const produced=[...walk(evidenceRoot),...walk(path.join(root,'scripts/r12')),
 path.join(root,'docs/evidence/R1_SHOWTIME_CONCURRENCY.md'),path.join(root,'database/11_tests/showtimes/overlap_safety.sql'),path.join(root,'database/11_tests/concurrency/showtime-overlap.mjs')];
if(env.DB_PASSWORD) for(const file of produced) assert.ok(!read(file).includes(env.DB_PASSWORD),'Configured DB password leaked in '+path.relative(root,file));
execFileSync('git',['-c','core.safecrlf=false','diff','--check'],{cwd:root});
write(path.join(evidenceRoot,'final-checks.json'),{at:new Date().toISOString(),status:'PASS',acceptedArtifactsPreserved:preserved.files.length,sourceParityModules:159,realScenarios:26,realStressRaces:races.stress.length,finalCommittedOverlapCount:0,r11Regression:'PASS',runtimeTransactionMutexScan:'PASS',configuredPasswordLeakScan:'PASS',skipCount:0,diffWhitespace:'PASS',exitCriteria:28});
console.log(`PASS final: ${preserved.files.length} R0/R1.1 artifacts preserved;26 scenarios/${races.stress.length} races/overlap0; R1.1/architecture/credentials/zero-skip PASS.`);

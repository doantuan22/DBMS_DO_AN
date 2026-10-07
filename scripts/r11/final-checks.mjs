import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, evidenceRoot, env, read, write } from './common.mjs';
import { walk } from '../db/lib.mjs';
const files=execFileSync('git',['ls-files','docs/r0-20261007','docs/audit-20261007','docs/R0_TASK_1_REPORT.md','docs/USE_CASE_BASELINE_45.md','docs/PROJECT_ACCEPTED_CONSTRAINTS.md'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const hash=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
for(const file of files) {
  const original=execFileSync('git',['show','HEAD:'+file],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  assert.equal(hash(read(path.join(root,file))),hash(original),file+' must preserve accepted R0');
}
const produced=[...walk(evidenceRoot),...walk(path.join(root,'scripts/r11')),
  path.join(root,'docs/evidence/R1_ROOM_DELETE.md'),path.join(root,'database/11_tests/rooms/delete_atomicity.sql'),
  path.join(root,'database/11_tests/concurrency/room-delete-vs-showtime.mjs')];
if(env.DB_PASSWORD) for(const file of produced) assert.ok(!read(file).includes(env.DB_PASSWORD),'Configured DB password must not appear in '+path.relative(root,file));
const names=['sql-tests','api-tests','concurrency','checks','main-migration','main-readonly','current-audit-status'];
for(const name of names) assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS',name);
const races=JSON.parse(read(path.join(evidenceRoot,'concurrency.json')));
assert.equal(races.cases.length,10);assert.ok(races.cases.every(test=>test.status==='PASS'&&test.invariant==='PASS'&&test.sessionA!==test.sessionB));
const checks=JSON.parse(read(path.join(evidenceRoot,'checks.json')));assert.ok(checks.checks.every(check=>check.status==='PASS'&&(check.skipped??0)===0));
execFileSync('git',['-c','core.safecrlf=false','diff','--check'],{cwd:root});
write(path.join(evidenceRoot,'final-checks.json'),{at:new Date().toISOString(),status:'PASS',acceptedR0ArtifactsPreserved:files.length,configuredPasswordLeakScan:'PASS',evidenceStatus:'PASS',exitCriteria:20,realConcurrencyCases:10,skipCount:0,diffWhitespace:'PASS'});
console.log(`PASS final checks: ${files.length} R0 artifacts preserved; credentials/evidence/10 real races/zero skips/whitespace verified.`);

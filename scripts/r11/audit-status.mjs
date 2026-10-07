// Incremental R1.1 overlay; accepted R0 artifacts remain immutable.
import assert from 'node:assert/strict';
import path from 'node:path';
import { root, evidenceRoot, read, write } from './common.mjs';
for(const name of ['sql-tests','api-tests','concurrency','checks','main-migration','main-readonly']) assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS');
const matrix=JSON.parse(read(path.join(root,'docs/audit-20261007/use-cases.json')));
const findings=JSON.parse(read(path.join(root,'docs/audit-20261007/issues.json')));
const room=matrix.rows.find(row=>row.uc==='QLR-02');
Object.assign(room,{db:'PARTIAL',integration:'PARTIAL',status:'PARTIAL',issue:'I-02 RESOLVED R1.1: room delete PASS (20 SQL cases, 10 real races, REST); full Room CRUD/FE acceptance remains PARTIAL.',evidence:'docs/evidence/R1_ROOM_DELETE.md'});
const values={PASS:1,PARTIAL:.5,BROKEN:0,MISSING:0};
for(const layer of ['db','be','fe','integration']) {
  const counts={};for(const row of matrix.rows) counts[row[layer]]=(counts[row[layer]]??0)+1;
  const points=matrix.rows.reduce((sum,row)=>sum+values[row[layer]],0);
  matrix.metrics[layer]={counts,points,percent:Number((points/45*100).toFixed(1))};
}
matrix.statuses={PASS:0,PARTIAL:0,MISSING:0,BROKEN:0};for(const row of matrix.rows) matrix.statuses[row.status]++;
matrix.baseline.note='Incremental R1.1 state; only QLR-02 db/integration/status changed from accepted R0. Room deletion verified; no full-UC PASS claim.';
const issue=findings.issues.find(row=>row.id==='I-02');
Object.assign(issue,{status:'RESOLVED R1.1',evidence:'docs/evidence/r11/{sql-tests,api-tests,concurrency,main-migration}.json',resolution:'SQL XACT_ABORT/transaction/rollback + room then showtime-range locks; history retained/inactivated; actual two-session final-state invariant PASS.'});
findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of findings.issues.filter(row=>row.status==='ACTIVE')) findings.severity[row.severity]++;
findings.baseline.active=findings.issues.filter(row=>row.status==='ACTIVE').length;
findings.baseline.resolved=findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
assert.equal(matrix.rows.length,45);assert.equal(matrix.statuses.BROKEN,4);assert.equal(findings.baseline.active,22);
write(path.join(evidenceRoot,'current-audit-status.json'),{at:new Date().toISOString(),phase:'R1.1',status:'PASS',base:'Accepted R0; docs/audit-20261007 originals preserved',changedUseCases:['QLR-02'],resolvedIssues:['I-02'],matrix,findings});
console.log('PASS current audit overlay: I-02 resolved; QLR-02 PARTIAL; 45 UC; other grades and R0 artifacts preserved.');

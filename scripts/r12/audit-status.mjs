import assert from 'node:assert/strict';
import path from 'node:path';
import { root,evidenceRoot,read,write } from './common.mjs';
for(const file of ['sql-tests','nested-tests','api-tests','concurrency','room-delete-regression','checks','main-migration','main-readonly']) assert.equal(JSON.parse(read(path.join(evidenceRoot,file+'.json'))).status,'PASS',file);
const previous=JSON.parse(read(path.join(root,'docs/evidence/r11/current-audit-status.json'))),matrix=previous.matrix,findings=previous.findings;
for(const id of ['QLR-04','QLR-05','ADM-14']) {
 const row=matrix.rows.find(row=>row.uc===id);Object.assign(row,{db:'PARTIAL',integration:'PARTIAL',status:'PARTIAL',
  issue:'I-03 RESOLVED R1.2: schedule overlap safety PASS; full UC acceptance remains PARTIAL. '+(id==='QLR-04'?'I-06 parent-state policy remains out of scope.':id==='QLR-05'?'I-09 historical metadata remains out of scope.':'Remaining global showtime/lifecycle acceptance not expanded.'),evidence:'docs/evidence/R1_SHOWTIME_CONCURRENCY.md'});
}
const values={PASS:1,PARTIAL:.5,BROKEN:0,MISSING:0};
for(const layer of ['db','be','fe','integration']) {
 const counts={};for(const row of matrix.rows) counts[row[layer]]=(counts[row[layer]]??0)+1;
 const points=matrix.rows.reduce((sum,row)=>sum+values[row[layer]],0);matrix.metrics[layer]={counts,points,percent:Number((points/45*100).toFixed(1))};
}
matrix.statuses={PASS:0,PARTIAL:0,MISSING:0,BROKEN:0};for(const row of matrix.rows) matrix.statuses[row.status]++;
matrix.baseline.note='Incremental R1.2 after accepted R1.1; only I-03 safety dimensions changed. Other policy defects remain active; no full-UC PASS claim.';
Object.assign(findings.issues.find(row=>row.id==='I-03'),{status:'RESOLVED R1.2',evidence:'docs/evidence/r12/{sql-tests,nested-tests,api-tests,concurrency,room-delete-regression,main-migration}.json',resolution:'SQL room mutex in canonical writers, shared current-read overlap check, retained trigger;26 real scenarios/125 races final overlap0; R1.1 regression PASS.'});
findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of findings.issues.filter(row=>row.status==='ACTIVE')) findings.severity[row.severity]++;
findings.baseline.active=findings.issues.filter(row=>row.status==='ACTIVE').length;findings.baseline.resolved=findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
assert.equal(matrix.rows.length,45);assert.equal(findings.issues.find(row=>row.id==='I-02').status,'RESOLVED R1.1');assert.equal(matrix.statuses.BROKEN,1);
write(path.join(evidenceRoot,'current-audit-status.json'),{at:new Date().toISOString(),phase:'R1.2',status:'PASS',base:'Accepted R1.1/R0 artifacts remain immutable',changedUseCases:['QLR-04','QLR-05','ADM-14'],resolvedIssues:['I-03'],matrix,findings});
console.log('PASS current audit: I-03 resolved; QLR04/QLR05/ADM14 PARTIAL, overlap safety PASS; other defects retained.');

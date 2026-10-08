import assert from 'node:assert/strict';
import path from 'node:path';
import { root,evidenceRoot,read,write } from './common.mjs';
const previous=JSON.parse(read(path.join(root,'docs/evidence/r21/current-audit-status.json'))),{matrix,findings}=structuredClone(previous);
const issue=findings.issues.find(row=>row.id==='I-07');assert.equal(issue.status,'ACTIVE');
Object.assign(issue,{status:'RESOLVED R2.2',evidence:'docs/evidence/r22/{sql-tests,api-tests,promotion-concurrency,r21-regression,r1-regression,main-migration}.json',
 resolution:'Promotion row/code locks precede current validation; no requested-promotion fallback; atomic consumption with order snapshots; safe409; real quota/Admin/rollback evidence.'});
for(const uc of ['KH-07','KH-09']){
 const row=matrix.rows.find(row=>row.uc===uc);row.issue='I-07 RESOLVED R2.2: requested promotion is applied using locked current state or booking fails409. Existing wider acceptance/R6 and preview-architecture issues remain outside scope.';row.evidence='docs/evidence/R2_PROMOTION_ATOMICITY.md';
}
matrix.baseline.note='Incremental R2.2 after accepted R0/R1/R2.1. I-07 resolved; UC grades retained for wider acceptance. Stop before R3; no R6 completion claim.';
findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of findings.issues.filter(row=>row.status==='ACTIVE'))findings.severity[row.severity]++;
findings.baseline.active=findings.issues.filter(row=>row.status==='ACTIVE').length;findings.baseline.resolved=findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
assert.equal(matrix.rows.length,45);for(const [id,status] of [['I-02','RESOLVED R1.1'],['I-03','RESOLVED R1.2'],['I-06','RESOLVED R2.1']])assert.equal(findings.issues.find(row=>row.id===id).status,status);
write(path.join(evidenceRoot,'current-audit-status.json'),{at:new Date().toISOString(),phase:'R2.2',status:'PASS',base:'Accepted R0/R1/R2.1 artifacts immutable',changedUseCases:['KH-07','KH-09'],resolvedIssues:['I-07'],matrix,findings});
console.log('PASS current audit: I07 resolved; I02/I03/I06 remain resolved; UC grades retained; no R3 claim.');

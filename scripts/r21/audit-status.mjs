import assert from 'node:assert/strict';
import path from 'node:path';
import { root,evidenceRoot,read,write } from './common.mjs';
for(const file of ['sql-tests','api-tests','parent-concurrency','r1-regression','checks','main-migration','main-readonly']) assert.equal(JSON.parse(read(path.join(evidenceRoot,file+'.json'))).status,'PASS',file);
const previous=JSON.parse(read(path.join(root,'docs/evidence/r12/current-audit-status.json'))),matrix=previous.matrix,findings=previous.findings;
const notes={
 'KH-05':'I-06 RESOLVED R2.1: public showtime availability matches DB parent/status/release-window contract; remaining catalogue/dataset acceptance remains PARTIAL.',
 'KH-06':'I-06 RESOLVED R2.1: unavailable showtime rejects seat reads; inactive physical seats are not free. Full seat UX/R6 acceptance remains PARTIAL.',
 'KH-07':'I-06 RESOLVED R2.1: authoritative locked parent re-check, atomic rejection, real stale API and double-seat regression PASS. I-07/I-19 and R6 remain outside scope.',
};
for(const [id,issue] of Object.entries(notes)) {
 const row=matrix.rows.find(row=>row.uc===id);Object.assign(row,{issue,evidence:'docs/evidence/R2_BOOKING_BOOKABILITY.md'});
}
// Retire the historical reference to active I-06 without changing a scheduling UC's grade.
const schedule=matrix.rows.find(row=>row.uc==='QLR-04');schedule.issue=schedule.issue.replace('I-06 parent-state policy remains out of scope.','R2.1 booking eligibility is resolved; scheduling creation policy is not expanded.');
Object.assign(findings.issues.find(row=>row.id==='I-06'),{status:'RESOLVED R2.1',evidence:'docs/evidence/r21/{sql-tests,api-tests,parent-concurrency,r1-regression,main-migration}.json',
 resolution:'DB-owned IsBookable in existing view; canonical booking retains parent locks and re-checks; public/seat reads aligned; upcoming films allowed inside Vietnam business-date release window. Booking/read scope resolved; no broader scheduling policy change.'});
matrix.baseline.note='Incremental R2.1 after accepted R0/R1.1/R1.2. I-06 booking/read defect resolved; KH05/06/07 retain PARTIAL for remaining acceptance. No R2.2 or R6 completion claim.';
findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of findings.issues.filter(row=>row.status==='ACTIVE')) findings.severity[row.severity]++;
findings.baseline.active=findings.issues.filter(row=>row.status==='ACTIVE').length;findings.baseline.resolved=findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
assert.equal(matrix.rows.length,45);assert.equal(findings.issues.find(row=>row.id==='I-02').status,'RESOLVED R1.1');assert.equal(findings.issues.find(row=>row.id==='I-03').status,'RESOLVED R1.2');assert.equal(findings.issues.find(row=>row.id==='I-07').status,'ACTIVE');
write(path.join(evidenceRoot,'current-audit-status.json'),{at:new Date().toISOString(),phase:'R2.1',status:'PASS',base:'Accepted R0/R1 artifacts remain immutable',changedUseCases:['KH-05','KH-06','KH-07'],resolvedIssues:['I-06'],matrix,findings});
console.log('PASS current audit: I06 booking/read eligibility resolved; KH05/06/07 PARTIAL; I02/I03 remain resolved, I07 active.');

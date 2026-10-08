import assert from 'node:assert/strict';
import path from 'node:path';
import { root,evidenceRoot,read,write } from './common.mjs';
const previous=JSON.parse(read(path.join(root,'docs/evidence/r31/current-audit-status.json'))),{matrix,findings}=structuredClone(previous);
const issue=findings.issues.find(r=>r.id==='I-09');assert.equal(issue.status,'ACTIVE');
Object.assign(issue,{status:'RESOLVED R3.2',evidence:'docs/evidence/r32/{sql-tests,api-tests,historical-concurrency,checks,main-migration}.json',resolution:'Any historical order freezes actual show structural values; room transfer remains unsupported. Any ticket freezes seat type. Existing operational/cancel guards retained; canonical pricing/product changes preserve stored money. Shared room/show/seat locks serialize booking with both writers. Current catalog labels intentionally remain mutable; no schema/snapshot additions.'});
const affected=['KH-12','QLR-03','QLR-05','ADM-08','ADM-09','ADM-14'];
for(const uc of matrix.rows.filter(r=>affected.includes(r.uc))){assert.equal(uc.status,'PARTIAL');uc.issue=uc.issue.replace('I-09/I-22','I-09; I-22 remains active').replace(/I-09[^;.]*/g,'I-09 RESOLVED R3.2 (historical identity/money policy)');uc.issue+='; R3.2 SQL/API/race evidence covers historical metadata; broader UC acceptance remains PARTIAL.';uc.evidence='docs/evidence/R3_HISTORICAL_METADATA.md';}
matrix.baseline.note='Incremental R3.2 after accepted R0/R1/R2/R3.1; only I-09 resolved. No whole-UC PASS claim. Stop before R3.3.';
findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of findings.issues.filter(r=>r.status==='ACTIVE'))findings.severity[row.severity]++;
findings.baseline.active=findings.issues.filter(r=>r.status==='ACTIVE').length;findings.baseline.resolved=findings.issues.filter(r=>r.status.startsWith('RESOLVED')).length;
assert.equal(matrix.rows.length,45);for(const id of ['I-02','I-03','I-06','I-07','I-08'])assert.equal(findings.issues.find(r=>r.id===id).status,previous.findings.issues.find(r=>r.id===id).status);
assert.deepEqual(matrix.rows.map(r=>[r.uc,r.status]),previous.matrix.rows.map(r=>[r.uc,r.status]));
write(path.join(evidenceRoot,'current-audit-status.json'),{at:new Date().toISOString(),phase:'R3.2',status:'PASS',base:'Accepted R0/R1/R2/R3.1 artifacts immutable',changedUseCases:affected,resolvedIssues:['I-09'],matrix,findings});
console.log('PASS current audit: I09 resolved;prior issues and all45 UC grades preserved;stop before R3.3.');

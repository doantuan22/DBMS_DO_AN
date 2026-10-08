import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root,read,write,evidenceRoot } from './common.mjs';
const json=name=>JSON.parse(read(path.join(evidenceRoot,name+'.json')));
const checks=json('checks'),sqlTests=json('sql-tests'),apiTests=json('api-tests'),main=json('main-deployment');
for(const name of ['checks','sql-tests','api-tests','test-deployment','main-test-isolation','main-deployment','main-readonly'])assert.equal(json(name).status,'PASS',name);
assert.ok(sqlTests.cases.length>=12&&apiTests.requests.length>0);
assert.deepEqual(main.changedModules,['sp_Admin_Report_Revenue']);assert.equal(main.otherModulesPreserved,158);assert.equal(main.backup.verifyOnly,'PASS');
const previous=JSON.parse(read(path.join(root,'docs/evidence/r41/current-audit-status.json'))),current=structuredClone(previous);
Object.assign(current,{at:new Date().toISOString(),phase:'R4.2',status:'PASS',base:'Accepted R0–R4.1 artifacts preserved',changedUseCases:['ADM-16'],resolvedIssues:['I-13']});
const issue=current.findings.issues.find(row=>row.id==='I-13');assert.equal(issue.status,'ACTIVE');
Object.assign(issue,{status:'RESOLVED R4.2',evidence:'docs/evidence/R4_ADMIN_REVENUE_REPORT.md; docs/evidence/r42/{sql-tests,api-tests,checks,main-deployment}.json',resolution:'Existing report SP provides Summary/Cinema/Movie/Date from successful-payment snapshot cohort; unchanged money/date/order-status rules; typed mapping plus legacy aliases; real positive SQL/API, boundary, fanout, snapshot, RBAC and regression verification. No frontend changes in this scoped task.',impact:'Admin Revenue SP/Backend contract and financial-positive verification PASS. ADM-16 full UC remains PARTIAL; UI/broader acceptance unchanged.'});
const row=current.matrix.rows.find(row=>row.uc==='ADM-16');assert.equal(row.status,'PARTIAL');
row.issue='I-13 RESOLVED R4.2: Revenue SP/Backend/API four groups and financial-positive verification PASS; UI/broader ADM-16 acceptance remains PARTIAL.';
row.evidence='docs/evidence/R4_ADMIN_REVENUE_REPORT.md';row.r42RevenueContract={db:'PASS',backend:'PASS',integration:'PASS',frontend:'UNCHANGED'};
current.matrix.baseline.note='Incremental R4.2 scoped Admin Revenue after R4.1; all 45 UC grades and prior findings retained; stop before R4.3.';
current.findings.baseline.active=current.findings.issues.filter(row=>row.status==='ACTIVE').length;
current.findings.baseline.resolved=current.findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
current.findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of current.findings.issues.filter(row=>row.status==='ACTIVE'))current.findings.severity[row.severity]++;
assert.deepEqual(current.matrix.rows.map(row=>[row.uc,row.status]),previous.matrix.rows.map(row=>[row.uc,row.status]));
assert.deepEqual(current.matrix.rows.filter(row=>row.uc!=='ADM-16'),previous.matrix.rows.filter(row=>row.uc!=='ADM-16'));
assert.deepEqual(current.findings.issues.filter(row=>row.id!=='I-13'),previous.findings.issues.filter(row=>row.id!=='I-13'));
write(path.join(evidenceRoot,'current-audit-status.json'),current);
const protectedBefore=json('preserved-before'),allowed=['database/08_procedures/admin/sp_Admin_Report_Revenue.sql','backend/src/services/adminService.js','backend/tests/adminService.test.js','docs/FULL_SYSTEM_AUDIT.md'];
const changed=[];
for(const [file,hash] of Object.entries(protectedBefore)){
 assert.ok(fs.existsSync(path.join(root,file)),`Original file deleted: ${file}`);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 if(actual!==hash){assert.ok(allowed.includes(file),`Out-of-scope modified file: ${file}`);changed.push(file);}
}
assert.deepEqual(changed.sort(),[...allowed].sort());
const all=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const added=all.filter(file=>!Object.hasOwn(protectedBefore,file));
for(const file of added)assert.ok(file.startsWith('scripts/r42/')||file.startsWith('docs/evidence/r42/')||['backend/tests/adminRevenue.test.js','docs/contracts/ADMIN_REVENUE.md','docs/evidence/R4_ADMIN_REVENUE_REPORT.md'].includes(file),`Out-of-scope new file: ${file}`);
for(const file of ['database/08_procedures/admin/sp_Admin_Report_Revenue.sql','backend/src/services/adminService.js','backend/tests/adminService.test.js','backend/tests/adminRevenue.test.js'])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),checks.sourceInputs[file],`Tested source differs: ${file}`);
const oldAudit=read(path.join(evidenceRoot,'before-source/docs/FULL_SYSTEM_AUDIT.md'));
const currentAudit=read(path.join(root,'docs/FULL_SYSTEM_AUDIT.md'));
assert.ok(currentAudit.endsWith(oldAudit.replace(/^# FULL SYSTEM AUDIT\r?\n\r?\n/,'')),'Historical audit text changed');
execFileSync('git',['diff','--check'],{cwd:root});
for(const file of all.filter(file=>file.startsWith('scripts/r42/')&&file.endsWith('.mjs')))execFileSync(process.execPath,['--check',path.join(root,file)]);
write(path.join(evidenceRoot,'source-changes.patch'),execFileSync('git',['diff','--','database/08_procedures/admin/sp_Admin_Report_Revenue.sql','backend/src/services/adminService.js','backend/tests/adminService.test.js'],{cwd:root,encoding:'utf8'}));
const final={at:new Date().toISOString(),phase:'R4.2',status:'PASS',changedOriginalFiles:changed,addedFiles:added,preservedOriginalFiles:Object.keys(protectedBefore).length-changed.length,priorEvidenceR0ToR41Preserved:'PASS',testedSourceMatchesCurrent:'PASS',backendTests:checks.r41Reproducibility.tests,backendRuns:checks.r41Reproducibility.runs,sqlCases:sqlTests.cases.length,apiCases:apiTests.cases.length,httpRequests:apiTests.requests.length,sqlSchemaTables:main.after.data.length,changedModules:main.changedModules,otherModulesPreserved:main.otherModulesPreserved,mainDataPreserved:'PASS',gitDiffCheck:'PASS',syntax:'PASS',scope:'Only I-13/R4.2; Manager/Frontend/Auth/other API/writer protocols unchanged; no new persistent objects; no authoritative revenue in JS',useCaseGradesUnchanged:45};
write(path.join(evidenceRoot,'final-checks.json'),final);
try{
 for(const reportFile of ['docs/evidence/R4_ADMIN_REVENUE_REPORT.md','docs/contracts/ADMIN_REVENUE.md']){
  for(const match of read(path.join(root,reportFile)).matchAll(/\]\(([^)]+)\)/g))assert.ok(fs.existsSync(path.resolve(root,path.dirname(reportFile),match[1])),`Broken evidence link: ${match[1]}`);
 }
}catch(error){final.status='FAIL';final.error=error.message;write(path.join(evidenceRoot,'final-checks.json'),final);throw error;}
console.log(`PASS final R4.2:${final.backendTests} backend tests;${final.sqlCases} SQL/${final.apiCases} API cases;${final.preservedOriginalFiles} old files preserved;I13 resolved;45 UC grades preserved.`);

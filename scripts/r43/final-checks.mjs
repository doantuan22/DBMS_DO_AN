import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root,read,write,evidenceRoot } from './common.mjs';
const json=name=>JSON.parse(read(path.join(evidenceRoot,name+'.json')));
const checks=json('checks'),sqlTests=json('sql-tests'),apiTests=json('api-tests'),main=json('main-deployment');
for(const name of ['browser','checks','sql-tests','api-tests','test-deployment','main-test-isolation','main-deployment','main-readonly'])assert.equal(json(name).status,'PASS',name);
assert.ok(sqlTests.cases.length>=20&&apiTests.requests.length>0);
assert.deepEqual(main.changedModules,['usp_Admin_Pricing_Update']);assert.equal(main.otherModulesPreserved,158);assert.equal(main.backup.verifyOnly,'PASS');
const previous=JSON.parse(read(path.join(root,'docs/evidence/r42/current-audit-status.json'))),current=structuredClone(previous);
Object.assign(current,{at:new Date().toISOString(),phase:'R4.3',status:'PASS',base:'Accepted R0–R4.2 artifacts preserved',changedUseCases:['ADM-13'],resolvedIssues:['I-14']});
const issue=current.findings.issues.find(row=>row.id==='I-14');assert.equal(issue.status,'ACTIVE');
Object.assign(issue,{status:'RESOLVED R4.3',evidence:'docs/evidence/R4_ADMIN_PRICING_UPDATE.md; docs/evidence/r43/{sql-tests,api-tests,browser,checks,main-deployment}.json',resolution:'Existing Admin Pricing Update SP, validator, typed service and existing form support all seven fields with Manager condition-group semantics; old surcharge/status callers preserved; SQL CHECK/overlap, atomic rollback, paid snapshots, real HTTP/RBAC/browser and regression verified.',impact:'I-14 contract gap resolved. Broader ADM-13 acceptance and unrelated findings unchanged.'});
const row=current.matrix.rows.find(row=>row.uc==='ADM-13');assert.equal(row.status,'PARTIAL');
row.issue='I-14 RESOLVED R4.3: seven-field Admin pricing SP/Backend/form, real SQL/API/browser and historical preservation PASS; broader UC acceptance unchanged.';
row.evidence='docs/evidence/R4_ADMIN_PRICING_UPDATE.md';row.r43PricingContract={db:'PASS',backend:'PASS',integration:'PASS',frontend:'PASS'};
current.matrix.baseline.note='Incremental R4.3 scoped Admin Pricing after R4.2; all 45 UC grades and prior findings retained; stop before R4.4.';
current.findings.baseline.active=current.findings.issues.filter(row=>row.status==='ACTIVE').length;
current.findings.baseline.resolved=current.findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
current.findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of current.findings.issues.filter(row=>row.status==='ACTIVE'))current.findings.severity[row.severity]++;
assert.deepEqual(current.matrix.rows.map(row=>[row.uc,row.status]),previous.matrix.rows.map(row=>[row.uc,row.status]));
assert.deepEqual(current.matrix.rows.filter(row=>row.uc!=='ADM-13'),previous.matrix.rows.filter(row=>row.uc!=='ADM-13'));
assert.deepEqual(current.findings.issues.filter(row=>row.id!=='I-14'),previous.findings.issues.filter(row=>row.id!=='I-14'));
write(path.join(evidenceRoot,'current-audit-status.json'),current);
const protectedBefore=json('preserved-before'),allowed=['database/08_procedures/admin/usp_Admin_Pricing_Update.sql','backend/src/services/adminService.js','backend/src/validators/adminValidator.js','frontend/src/utils/adminForms.js','database/baseline-manifest.json','database/12_verify/verify_procedures.sql','docs/FULL_SYSTEM_AUDIT.md'];
const changed=[];
for(const [file,hash] of Object.entries(protectedBefore)){
 assert.ok(fs.existsSync(path.join(root,file)),`Original file deleted: ${file}`);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 if(actual!==hash){assert.ok(allowed.includes(file),`Out-of-scope modified file: ${file}`);changed.push(file);}
}
assert.deepEqual(changed.sort(),[...allowed].sort());
const all=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const added=all.filter(file=>!Object.hasOwn(protectedBefore,file));
for(const file of added)assert.ok(file.startsWith('scripts/r43/')||file.startsWith('docs/evidence/r43/')||['backend/tests/adminPricing.test.js','frontend/tests/admin-pricing.test.js','frontend/tests/r43-browser-fixture.jsx','docs/contracts/ADMIN_PRICING_UPDATE.md','docs/evidence/R4_ADMIN_PRICING_UPDATE.md'].includes(file),`Out-of-scope new file: ${file}`);
for(const file of ['database/08_procedures/admin/usp_Admin_Pricing_Update.sql','backend/src/services/adminService.js','backend/src/validators/adminValidator.js','backend/tests/adminPricing.test.js','frontend/src/utils/adminForms.js','frontend/tests/admin-pricing.test.js','frontend/tests/r43-browser-fixture.jsx','database/baseline-manifest.json','database/12_verify/verify_procedures.sql'])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),checks.sourceInputs[file],`Tested source differs: ${file}`);
const oldAudit=read(path.join(evidenceRoot,'before-source/docs/FULL_SYSTEM_AUDIT.md'));
const oldManifest=JSON.parse(read(path.join(evidenceRoot,'before-source/database/baseline-manifest.json')));
const newManifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
const oldSignature=oldManifest.expected.parameters.filter(row=>row.objectName==='usp_Admin_Pricing_Update');
const newSignature=newManifest.expected.parameters.filter(row=>row.objectName==='usp_Admin_Pricing_Update');
assert.deepEqual(newSignature.slice(0,4),oldSignature);
assert.deepEqual(newSignature,main.parameters);
oldManifest.expected.parameters=oldManifest.expected.parameters.filter(row=>row.objectName!=='usp_Admin_Pricing_Update');
newManifest.expected.parameters=newManifest.expected.parameters.filter(row=>row.objectName!=='usp_Admin_Pricing_Update');
assert.deepEqual(newManifest,oldManifest,'Manifest change outside focused signature');
const stripSignature=source=>source.replace(/DECLARE @expected nvarchar\(max\) = N'((?:[^']|'')*)';/,"DECLARE @expected nvarchar(max) = N'<signature>'; ");
assert.equal(stripSignature(read(path.join(root,'database/12_verify/verify_procedures.sql'))),stripSignature(read(path.join(evidenceRoot,'before-source/database/12_verify/verify_procedures.sql'))));
const currentAudit=read(path.join(root,'docs/FULL_SYSTEM_AUDIT.md'));
assert.ok(currentAudit.endsWith(oldAudit.replace(/^# FULL SYSTEM AUDIT\r?\n\r?\n/,'')),'Historical audit text changed');
execFileSync('git',['diff','--check'],{cwd:root});
for(const file of all.filter(file=>file.startsWith('scripts/r43/')&&file.endsWith('.mjs')))execFileSync(process.execPath,['--check',path.join(root,file)]);
const patch=changed.map(file=>{try{return execFileSync('git',['diff','--no-index','--',path.join(evidenceRoot,'before-source',file),path.join(root,file)],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){assert.equal(e.status,1);return String(e.stdout);}}).join('\n');write(path.join(evidenceRoot,'source-changes.patch'),patch);
const final={at:new Date().toISOString(),phase:'R4.3',status:'PASS',changedOriginalFiles:changed,addedFiles:added,preservedOriginalFiles:Object.keys(protectedBefore).length-changed.length,priorEvidenceR0ToR42Preserved:'PASS',testedSourceMatchesCurrent:'PASS',backendTests:checks.r41Reproducibility.tests,backendRuns:checks.r41Reproducibility.runs,sqlCases:sqlTests.cases.length,apiCases:apiTests.cases.length,httpRequests:apiTests.requests.length,sqlSchemaTables:main.after.data.length,changedModules:main.changedModules,otherModulesPreserved:main.otherModulesPreserved,mainDataPreserved:'PASS',gitDiffCheck:'PASS',syntax:'PASS',scope:'Only I-14/R4.3; Manager/Auth/other API/writers unchanged; only Admin form binding changed; no new persistent objects; no pricing/overlap authority in JS',useCaseGradesUnchanged:45,browserChecks:json('browser').result.checks.length,frontendTests:checks.checks.find(row=>row.name==='frontend-test').tests};
write(path.join(evidenceRoot,'final-checks.json'),final);
try{
 for(const reportFile of ['docs/evidence/R4_ADMIN_PRICING_UPDATE.md','docs/contracts/ADMIN_PRICING_UPDATE.md']){
  for(const match of read(path.join(root,reportFile)).matchAll(/\]\(([^)]+)\)/g))assert.ok(fs.existsSync(path.resolve(root,path.dirname(reportFile),match[1])),`Broken evidence link: ${match[1]}`);
 }
}catch(error){final.status='FAIL';final.error=error.message;write(path.join(evidenceRoot,'final-checks.json'),final);throw error;}
console.log(`PASS final R4.3:${final.backendTests} backend tests;${final.sqlCases} SQL/${final.apiCases} API cases;${final.preservedOriginalFiles} old files preserved;I14 resolved;45 UC grades preserved.`);

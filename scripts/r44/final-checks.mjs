import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,read,write,evidenceRoot} from './common.mjs';
const json=name=>JSON.parse(read(path.join(evidenceRoot,name+'.json')));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const checks=json('checks'),integration=json('ownership-tests'),browser=json('browser'),main=json('main-unchanged');
for(const name of ['audit-before','checks','ownership-tests','browser','main-unchanged'])assert.equal(json(name).status,'PASS',name);
assert.ok(checks.checks.length>0&&checks.checks.every(row=>row.status==='PASS'&&row.exitCode===0));
assert.equal(checks.r41Reproducibility.status,'PASS');
assert.equal(checks.r41Reproducibility.runs,3);
assert.equal(checks.testDatabaseCleanup,'PASS');
assert.equal(checks.sourceInputsUnchanged,'PASS');
for(const row of checks.checks.filter(row=>row.tests)){
 assert.equal(row.pass,row.tests);for(const key of ['fail','cancelled','skipped','todo'])assert.equal(row[key],0);
}
assert.equal(json('preview-before').status,'REPRODUCED');
assert.equal(json('preview-before').cleanup,'PASS');
assert.equal(integration.cleanup,'PASS');assert.equal(browser.cleanup,'PASS');
assert.ok(integration.cases.length>0&&integration.cases.every(row=>row.status==='PASS'));
assert.ok(browser.result.checks.length>0&&browser.result.checks.every(row=>row.status==='PASS'));
assert.equal(main.dataAndMetadataUnchanged,'PASS');assert.deepEqual(main.changedModules,[]);
assert.deepEqual(main.after,json('audit-before').main);
assert.deepEqual(checks.testDatabaseBefore,checks.testDatabaseAfter);
for(const phase of ['r21','r22','r32','r42','r43']){
 for(const file of fs.readdirSync(path.join(evidenceRoot,'regression',phase)).filter(file=>file.endsWith('.json'))){
  const evidence=JSON.parse(read(path.join(evidenceRoot,'regression',phase,file)));
  assert.equal(evidence.status,'PASS',phase+'/'+file);assert.equal(evidence.cleanup,'PASS',phase+'/'+file);
 }
}
const protectedBefore=json('preserved-before');
const allowed=['backend/src/services/bookingService.js','docs/FULL_SYSTEM_AUDIT.md'],changed=[];
for(const [file,hash] of Object.entries(protectedBefore)){
 assert.ok(fs.existsSync(path.join(root,file)),`Original file deleted: ${file}`);
 if(sha(file)!==hash){assert.ok(allowed.includes(file),`Out-of-scope modified file: ${file}`);changed.push(file);}
}
assert.deepEqual(changed.sort(),[...allowed].sort());
const all=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const added=all.filter(file=>!Object.hasOwn(protectedBefore,file));
const newFiles=['backend/tests/businessOwnership.test.js','frontend/tests/business-ownership.test.js','frontend/tests/r44-browser-fixture.jsx','docs/contracts/BUSINESS_RULE_OWNERSHIP.md','docs/evidence/R4_BUSINESS_RULE_OWNERSHIP.md'];
for(const file of added)assert.ok(file.startsWith('scripts/r44/')||file.startsWith('docs/evidence/r44/')||newFiles.includes(file),`Out-of-scope new file: ${file}`);
for(const [file,hash] of Object.entries(checks.sourceInputs))assert.equal(sha(file),hash,`Current tested source differs: ${file}`);
const normalize=source=>source.replaceAll('\r\n','\n');
const old=normalize(read(path.join(evidenceRoot,'before-source/backend/src/services/bookingService.js')));
const current=normalize(read(path.join(root,'backend/src/services/bookingService.js')));
const block="    const provisionalTotal = selectedSeats.reduce((total, seat) => total + Number(seat.price), 0)\n      + selectedProducts.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);";
const replacement="    const provisionalSum = selectedSeats.reduce((total, seat) => total + Number(seat.price), 0)\n      + selectedProducts.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);\n    // DB prices are DECIMAL(18,2). Remove binary addition/multiplication noise\n    // at that same scale before the typed preview bind; booking still recalculates.\n    const provisionalTotal = Number(provisionalSum.toFixed(2));";
assert.ok(old.includes(block));assert.equal(current,old.replace(block,replacement),'Production change outside verified preview fix');
const oldAudit=read(path.join(evidenceRoot,'before-source/docs/FULL_SYSTEM_AUDIT.md'));
assert.ok(read(path.join(root,'docs/FULL_SYSTEM_AUDIT.md')).endsWith(oldAudit.replace(/^# FULL SYSTEM AUDIT\r?\n\r?\n/,'')),'Historical audit text changed');
const previous=JSON.parse(read(path.join(root,'docs/evidence/r43/current-audit-status.json'))),status=structuredClone(previous);
Object.assign(status,{at:new Date().toISOString(),phase:'R4.4',status:'PASS',base:'Accepted working state after Task 11, prior source and evidence preserved',changedUseCases:[],resolvedIssues:['I-17']});
const issue=status.findings.issues.find(row=>row.id==='I-17');assert.equal(issue.status,'ACTIVE');
Object.assign(issue,{status:'RESOLVED R4.4',evidence:'docs/contracts/BUSINESS_RULE_OWNERSHIP.md; docs/evidence/R4_BUSINESS_RULE_OWNERSHIP.md; docs/evidence/r44/{preview-before,ownership-tests,browser,checks,main-unchanged,final-checks}.json',resolution:'Documented allowed provisional subtotal exception and legitimate UX/HTTP guards; verified 10/10/99 parity and live SQL enforcement. Corrected demonstrated binary subtotal noise before DECIMAL(18,2) preview binding. DB revalidates promotion, consumes quota and owns final booking/payment snapshots; real boundary, stale preview, changed-price, historical and UI evidence PASS.',impact:'I-17 ownership and verified preview mismatch resolved; all UC grades and all other findings retain prior acceptance.'});
status.findings.baseline.active=status.findings.issues.filter(row=>row.status==='ACTIVE').length;
status.findings.baseline.resolved=status.findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
status.findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of status.findings.issues.filter(row=>row.status==='ACTIVE'))status.findings.severity[row.severity]++;
assert.deepEqual(status.matrix,previous.matrix);
assert.deepEqual(status.findings.issues.filter(row=>row.id!=='I-17'),previous.findings.issues.filter(row=>row.id!=='I-17'));
write(path.join(evidenceRoot,'current-audit-status.json'),status);
execFileSync('git',['diff','--check'],{cwd:root});
for(const file of all.filter(file=>file.startsWith('scripts/r44/')&&file.endsWith('.mjs')))execFileSync(process.execPath,['--check',path.join(root,file)]);
const patch=changed.map(file=>{try{return execFileSync('git',['diff','--no-index','--',path.join(evidenceRoot,'before-source',file),path.join(root,file)],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){assert.equal(e.status,1);return String(e.stdout);}}).join('\n');
write(path.join(evidenceRoot,'source-changes.patch'),patch);
for(const reportFile of ['docs/evidence/R4_BUSINESS_RULE_OWNERSHIP.md','docs/contracts/BUSINESS_RULE_OWNERSHIP.md']){
 for(const match of read(path.join(root,reportFile)).matchAll(/\]\(([^)]+)\)/g)){
  // The final artifact is produced immediately below; all other links already exist.
  const target=path.resolve(root,path.dirname(reportFile),match[1]);
  assert.ok(target===path.join(evidenceRoot,'final-checks.json')||fs.existsSync(target),`Broken evidence link: ${match[1]}`);
 }
}
const result={at:new Date().toISOString(),phase:'R4.4',status:'PASS',changedOriginalFiles:changed,addedFiles:added,preservedOriginalFiles:Object.keys(protectedBefore).length-changed.length,priorTask9To11AndR0ToR43Preserved:'PASS',testedSourceMatchesCurrent:'PASS',backendTests:checks.r41Reproducibility.tests,backendRuns:checks.r41Reproducibility.runs,frontendTests:checks.checks.find(row=>row.name==='frontend-test').tests,integrationCases:integration.cases.length,httpRequests:integration.requests.length,browserChecks:browser.result.checks.length,mainTables:main.tables,mainModuleParity:main.moduleParity,changedDatabaseModules:[],mainDataAndMetadataPreserved:'PASS',testDatabaseCleanup:'PASS',useCaseGradesUnchanged:status.matrix.rows.length,onlyResolvedFinding:'I-17',gitDiffCheck:'PASS',syntax:'PASS',scope:'Only I-17/R4.4: provisional preview bind normalization, contract, tests and evidence. No DB or Frontend production changes. Stop before R4.5.'};
write(path.join(evidenceRoot,'final-checks.json'),result);
console.log(`PASS final R4.4: ${result.backendTests} Backend x${result.backendRuns}, ${result.frontendTests} Frontend, ${result.integrationCases} integration cases/${result.httpRequests} HTTP requests, ${result.browserChecks} browser checks; ${result.preservedOriginalFiles} original files preserved; only I-17 resolved.`);

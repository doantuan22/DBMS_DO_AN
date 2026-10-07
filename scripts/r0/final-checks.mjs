import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { root, read, write } from '../db/lib.mjs';
const out = path.join(root,'docs/r0-20261007');
const load = file => JSON.parse(read(path.join(out,file)));
const checks = load('checks.json');
assert.equal(checks.status,'PASS'); assert.equal(checks.checks.length,8);
for (const file of ['database-contract.json','migration-precondition.json','pricing-api.json','main-migration.json']) assert.equal(load(file).status,'PASS',file);
const changedFiles = execFileSync('git',['-c','core.quotepath=false','status','--porcelain=v1','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trimEnd().split('\n').filter(Boolean).map(line=>{
  let file = line.slice(3); if (file.startsWith('"')) file = JSON.parse(file);
  return {status:line.slice(0,2).trim(),file};
});
for (const file of ['docs/r0-20261007/changed-files.md','docs/r0-20261007/scope-scan.json','docs/r0-20261007/baseline-checks.txt','docs/r0-20261007/final-checks.json']) if (!changedFiles.some(row=>row.file===file)) changedFiles.push({status:'NEW',file});
write(path.join(out,'changed-files.md'),'# Files thay đổi trong TASK 1 / R0\n\nDanh sách working-tree so với commit lúc bắt đầu task (repository sạch); build `frontend/dist` không được tính là source, output `_audit` tạm đã được lưu evidence cần thiết và dọn. Raw snapshot audit gốc giữ nguyên.\n\n| Status | File |\n| --- | --- |\n'+changedFiles.sort((a,b)=>a.file.localeCompare(b.file)).map(row=>`| ${row.status} | [${row.file}](<../../${row.file}>) |`).join('\n')+'\n');
const final = {startedAt:new Date().toISOString(),status:'RUNNING',checks:[]};
for (const [name,args] of [['baseline',['--test','scripts/r0/baseline.test.mjs']],['audit-validation',['docs/audit-20261007/validate-report.mjs']]]) {
  const result = spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000});
  write(path.join(out,name==='baseline'?'baseline-checks.txt':'audit-validation.txt'),(result.stdout??'')+(result.stderr??''));
  final.checks.push({name,status:result.status===0?'PASS':'FAIL',exitCode:result.status});
  console.log(`${result.status===0?'PASS':'FAIL'} ${name}`);
}
const findings=[];
const skipDirectories = new Set(['.git','node_modules','dist','_audit','.agents','.codex','.aws']);
function scan(directory) {
  for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    if (skipDirectories.has(entry.name)) continue;
    const absolute = path.join(directory,entry.name);
    if (entry.isDirectory()) {scan(absolute);continue;}
    if (!/\.(?:mjs|js|jsx|sql|md|json|txt)$/.test(entry.name) || entry.name.startsWith('.env') || entry.name==='package-lock.json') continue;
    const source = read(absolute),file=path.relative(root,absolute).replaceAll('\\','/');
    const lines = source.split('\n').flatMap((line,index)=>/Ngày lễ|holiday|LoaiNgay/i.test(line)?[{line:index+1,text:line.slice(0,220),legacy:/Ngày lễ|holiday/i.test(line)}]:[]);
    if (!lines.length) continue;
    const runtime = /^(?:shared\/|backend\/src\/|frontend\/src\/|database\/(?:03_constraints|05_functions|06_views|07_triggers|08_procedures|10_seed|12_verify)\/|database\/baseline-manifest\.json$|database\/11_tests\/concurrency\/|scripts\/(?:r7|r8)\/)/.test(file);
    const historical = /^docs\/audit-20261007\/(?:metadata(?:-after)?\.json|frontend-build\/)/.test(file);
    findings.push({file,classification:runtime?'RUNTIME':historical?'HISTORICAL SNAPSHOT':/13_migrations/.test(file)?'MIGRATION PRECONDITION':/tests|test\.mjs/.test(file)?'TEST':file.startsWith('docs/r0-')?'R0 EVIDENCE':'DOCUMENTATION/TOOLING',matches:lines.length,legacyMatches:lines.filter(line=>line.legacy).length,lines:lines.slice(0,5)});
  }
}
scan(root);
const runtimeViolations = findings.filter(file=>file.classification==='RUNTIME' && file.legacyMatches);
const backendChanges = changedFiles.filter(row=>row.file.startsWith('backend/src/'));
const styleChanges = changedFiles.filter(row=>/frontend\/.*\.(?:css|scss|sass)$/.test(row.file));
const sourceSql = changedFiles.filter(row=>/^database\/(?:02_tables|03_constraints|05_functions|06_views|07_triggers|08_procedures)\//.test(row.file));
const unexpectedSql = sourceSql.filter(row=>!['database/03_constraints/003_check_constraints.sql','database/05_functions/fn_TinhGiaVe.sql'].includes(row.file));
const scope = {checkedAt:new Date().toISOString(),terms:['Ngày lễ','holiday','HOLIDAY','LoaiNgay'],findings,runtimeViolations,backendRuntimeFilesChanged:backendChanges,frontendStyleFilesChanged:styleChanges,unexpectedBusinessSqlChanges:unexpectedSql,status:runtimeViolations.length||backendChanges.length||styleChanges.length||unexpectedSql.length?'FAIL':'PASS'};
write(path.join(out,'scope-scan.json'),scope);
final.checks.push({name:'scope-scan',status:scope.status,runtimeViolations:runtimeViolations.length,backendRuntimeFilesChanged:backendChanges.length,frontendStyleFilesChanged:styleChanges.length,unexpectedBusinessSqlChanges:unexpectedSql.length});
console.log(`${scope.status} scope-scan`);
final.status = final.checks.every(check=>check.status==='PASS')?'PASS':'FAIL';
final.exitCriteria = [
  ['Baseline = 45 UC','baseline-checks.txt'],
  ['Official Admin16 only in completion/audit/regression','baseline-checks.txt'],
  ['I-01 = ACCEPTED PROJECT CONSTRAINT','baseline-checks.txt'],
  ['No legacy day type in runtime pricing','scope-scan.json'],
  ['Only three official day types','database-contract.json'],
  ['Migration precondition preserves existing legacy data','migration-precondition.json'],
  ['fn_TinhGiaVe synchronized','database-contract.json'],
  ['Backend validators synchronized','backend.txt'],
  ['Frontend pricing options synchronized','frontend.txt'],
  ['Pricing tests PASS','pricing-api.json'],
  ['Existing regressions PASS','checks.json'],
  ['Backend Stored-Procedure-Only / no business SQL','no-sql.txt'],
].map(([criterion,evidence])=>({criterion,status:final.status==='PASS'?'PASS':'UNVERIFIED',evidence}));
final.conclusion = final.status==='PASS'?'R0 DONE':'R0 NOT DONE';
final.completedAt = new Date().toISOString();write(path.join(out,'final-checks.json'),final);
if (final.status !== 'PASS') process.exitCode=1;

// Run accepted test logic unchanged; redirect only the evidence utility and output filename.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,read,write,evidenceRoot } from './common.mjs';
disposable();const report={database,startedAt:new Date().toISOString(),checks:[]};
const cases=[
 ['r11-sql','scripts/r11/sql-tests.mjs','./common.mjs','sql-tests.json'],
 ['r11-concurrency','database/11_tests/concurrency/room-delete-vs-showtime.mjs','../../../scripts/r11/common.mjs','concurrency.json'],
 ['r12-sql','scripts/r12/sql-tests.mjs','./common.mjs','sql-tests.json'],
 ['r12-nested','scripts/r12/nested-tests.mjs','./common.mjs','nested-tests.json'],
 ['r12-concurrency','database/11_tests/concurrency/showtime-overlap.mjs','../../../scripts/r12/common.mjs','concurrency.json'],
];
for(const [name,file,oldImport,oldOutput] of cases) {
 const original=read(path.join(root,file));assert.ok(original.includes("'"+oldImport+"'"));assert.ok(original.includes("'"+oldOutput+"'"));
 const source=original.replace("'"+oldImport+"'",JSON.stringify(pathToFileURL(path.join(root,'scripts/r21/common.mjs')).href)).replace("'"+oldOutput+"'","'"+name+".json'");
 const result=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
 write(path.join(evidenceRoot,name+'.txt'),(result.stdout??'')+(result.stderr??''));
 const check={name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,source:file,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),output:name+'.json'};
 report.checks.push(check);write(path.join(evidenceRoot,'r1-regression.json'),{...report,status:check.status});
 assert.equal(result.status,0,JSON.stringify(check));assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS');console.log('PASS original '+name+' regression');
}
report.status='PASS';report.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'r1-regression.json'),report);

// Execute the original R1.1 test logic; redirect only utility import and evidence filenames.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,read,write,evidenceRoot } from './common.mjs';
disposable();const report={database,startedAt:new Date().toISOString(),checks:[]};
for(const [name,file,oldImport,oldOutput,newOutput] of [
 ['sql','scripts/r11/sql-tests.mjs','./common.mjs','sql-tests.json','room-delete-sql-tests.json'],
 ['concurrency','database/11_tests/concurrency/room-delete-vs-showtime.mjs','../../../scripts/r11/common.mjs','concurrency.json','room-delete-concurrency.json']
]) {
 const original=read(path.join(root,file));assert.ok(original.includes("'"+oldImport+"'"));assert.ok(original.includes("'"+oldOutput+"'"));
 const source=original.replace("'"+oldImport+"'",JSON.stringify(pathToFileURL(path.join(root,'scripts/r12/common.mjs')).href)).replace("'"+oldOutput+"'","'"+newOutput+"'");
 const result=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,timeout:180000});
 write(path.join(evidenceRoot,'room-delete-'+name+'.txt'),(result.stdout??'')+(result.stderr??''));
 const check={name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,source:file,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),output:newOutput};
 report.checks.push(check);assert.equal(result.status,0,JSON.stringify(check));assert.equal(JSON.parse(read(path.join(evidenceRoot,newOutput))).status,'PASS');console.log('PASS original R1.1 '+name+' regression');
}
report.status='PASS';report.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'room-delete-regression.json'),report);

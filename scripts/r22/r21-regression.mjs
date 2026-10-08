// Replay accepted R2.1 logic byte-for-byte except utility imports/evidence filenames.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,read,write,evidenceRoot } from './common.mjs';
disposable();const report={database,startedAt:new Date().toISOString(),checks:[]};
const uri=file=>JSON.stringify(pathToFileURL(path.join(root,file)).href);
const cases=[
 ['r21-sql','scripts/r21/sql-tests.mjs',"'./common.mjs'",'sql-tests.json'],
 ['r21-api','scripts/r21/api-tests.mjs',"'./common.mjs'",'api-tests.json'],
 ['r21-parents','database/11_tests/concurrency/booking-parent-status.mjs',"'../../../scripts/r21/common.mjs'",'parent-concurrency.json'],
];
for(const [name,file,oldImport,oldOutput] of cases){
 const original=read(path.join(root,file));assert.ok(original.includes(oldImport));assert.ok(original.includes("'"+oldOutput+"'"));
 let source=original.replace(oldImport,uri('scripts/r22/common.mjs')).replace("'"+oldOutput+"'","'"+name+".json'");
 source=source.replace("'./fixtures.mjs'",uri('scripts/r21/fixtures.mjs')).replace("'../../../scripts/r21/fixtures.mjs'",uri('scripts/r21/fixtures.mjs'));
 if(name==='r21-api')source=source.replace("'../../backend/src/app.js'",uri('backend/src/app.js')).replace("'../../backend/src/db/pool.js'",uri('backend/src/db/pool.js'));
 const result=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
 write(path.join(evidenceRoot,name+'.txt'),(result.stdout??'')+(result.stderr??''));
 const entry={name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,source:file,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),output:name+'.json'};
 report.checks.push(entry);write(path.join(evidenceRoot,'r21-regression.json'),{...report,status:entry.status});
 assert.equal(result.status,0,JSON.stringify(entry));assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS');console.log('PASS accepted '+name);
}
report.status='PASS';report.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'r21-regression.json'),report);

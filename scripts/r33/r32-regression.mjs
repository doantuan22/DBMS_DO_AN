// Accepted R3.2 tests unchanged; only imports and evidence locations redirected.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,read,write,evidenceRoot } from './common.mjs';
disposable();const report={database,startedAt:new Date().toISOString(),checks:[]},uri=f=>JSON.stringify(pathToFileURL(path.join(root,f)).href);
const cases=[['r32-sql','scripts/r32/sql-tests.mjs',"'./common.mjs'",'sql-tests.json'],['r32-api','scripts/r32/api-tests.mjs',"'./common.mjs'",'api-tests.json'],['r32-transactions','scripts/r32/transaction-tests.mjs',"'./common.mjs'",'transaction-tests.json'],['r32-concurrency','database/11_tests/concurrency/historical-metadata.mjs',"'../../../scripts/r32/common.mjs'",'historical-concurrency.json'],['r32-browser','scripts/r32/browser.mjs',"'../db/lib.mjs'",'browser.json']];
for(const [name,file,oldImport,output] of cases){const original=read(path.join(root,file));assert.ok(original.includes(oldImport));let source=original.replace(oldImport,uri('scripts/r33/common.mjs')).replaceAll("'"+output+"'","'"+name+".json'");source=source.replace("'./fixtures.mjs'",uri('scripts/r32/fixtures.mjs')).replace("'../../../scripts/r32/fixtures.mjs'",uri('scripts/r32/fixtures.mjs'));
 if(name==='r32-api')source=source.replace("'../../backend/src/app.js'",uri('backend/src/app.js')).replace("'../../backend/src/db/pool.js'",uri('backend/src/db/pool.js'));
 if(name==='r32-browser')source=source.replace("'../../frontend/node_modules/vite/dist/node/index.js'",uri('frontend/node_modules/vite/dist/node/index.js')).replace("'docs/evidence/r32'","'docs/evidence/r33'");
 const result=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});write(path.join(evidenceRoot,name+'.txt'),(result.stdout??'')+(result.stderr??''));const row={name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,source:file,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),output:name+'.json'};report.checks.push(row);write(path.join(evidenceRoot,'r32-regression.json'),{...report,status:row.status});assert.equal(result.status,0,JSON.stringify(row));assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS');console.log('PASS accepted '+name);
}report.status='PASS';report.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'r32-regression.json'),report);

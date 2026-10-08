// Replay accepted R3.1 logic; only imports/output directories are redirected.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,read,write,evidenceRoot } from './common.mjs';
disposable();const report={database,startedAt:new Date().toISOString(),checks:[]},uri=f=>JSON.stringify(pathToFileURL(path.join(root,f)).href);
const cases=[['r31-sql','scripts/r31/sql-tests.mjs',"'./common.mjs'",'sql-tests.json'],['r31-api','scripts/r31/api-tests.mjs',"'./common.mjs'",'api-tests.json'],['r31-concurrency','database/11_tests/concurrency/movie-actor-replacement.mjs',"'../../../scripts/r31/common.mjs'",'movie-actor-concurrency.json'],['r31-browser','scripts/r31/browser.mjs',"'../db/lib.mjs'",'browser.json']];
for(const [name,file,oldImport,output] of cases){
 const original=read(path.join(root,file));assert.ok(original.includes(oldImport));let source=original.replace(oldImport,uri('scripts/r32/common.mjs')).replaceAll("'"+output+"'","'"+name+".json'");
 source=source.replace("'./fixtures.mjs'",uri('scripts/r31/fixtures.mjs')).replace("'../../../scripts/r31/fixtures.mjs'",uri('scripts/r31/fixtures.mjs'));
 if(name==='r31-api')source=source.replace("'../../backend/src/app.js'",uri('backend/src/app.js')).replace("'../../backend/src/db/pool.js'",uri('backend/src/db/pool.js'));
 if(name==='r31-browser')source=source.replace("'../../frontend/node_modules/vite/dist/node/index.js'",uri('frontend/node_modules/vite/dist/node/index.js')).replace("'docs/evidence/r31'","'docs/evidence/r32'");
 const result=spawnSync(process.execPath,['--input-type=module','-e',source,'--',`--database=${database}`],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});write(path.join(evidenceRoot,name+'.txt'),(result.stdout??'')+(result.stderr??''));
 const row={name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,source:file,originalSha256:crypto.createHash('sha256').update(original).digest('hex'),output:name+'.json'};report.checks.push(row);write(path.join(evidenceRoot,'r31-regression.json'),{...report,status:row.status});assert.equal(result.status,0,JSON.stringify(row));assert.equal(JSON.parse(read(path.join(evidenceRoot,name+'.json'))).status,'PASS');console.log('PASS accepted '+name);
}
report.status='PASS';report.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'r31-regression.json'),report);

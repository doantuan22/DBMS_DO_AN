import assert from 'node:assert/strict';
import path from 'node:path';
import {database,root,connect,snapshot,summarize,read,write,evidenceRoot,normalizeModule} from './common.mjs';

assert.equal(database,'CinemaBookingDB','Main verification is read-only and explicitly named.');
const before=JSON.parse(read(path.join(evidenceRoot,'audit-before.json')));
const manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
const pool=await connect();
try {
 const current=await snapshot(pool),after=summarize(current);
 assert.deepEqual(after,before.main,'Main data or metadata changed during Task 13.');
 for(const [name,file] of Object.entries(manifest.modules)){
  const source=read(path.join(root,'database',file));
  const match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);
  assert.equal(normalizeModule(current.metadata.objects.find(row=>row.name===name).definition),normalizeModule(source.slice(match.index).replace(/\s+GO\s*$/i,'')),name);
 }
 write(path.join(evidenceRoot,'main-unchanged.json'),{at:new Date().toISOString(),database,status:'PASS',operations:'SELECT metadata and all table rows only; no deployment or data writes',dataAndMetadataUnchanged:'PASS',moduleParity:Object.keys(manifest.modules).length,tables:after.data.length,changedModules:[],before:before.main,after});
 console.log(`PASS main read-only: ${after.data.length} tables/data and all metadata preserved; ${Object.keys(manifest.modules).length} modules match canonical source; no deployment.`);
}finally{await pool.close();}

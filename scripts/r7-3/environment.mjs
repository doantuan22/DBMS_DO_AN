// R7.3 read-only reconciliation. No build, seed, migration, refresh or business mutation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,read,write,normalizeModule} from '../db/lib.mjs';
import {queries} from '../db/inventory.mjs';
import {preflight,hash} from '../db/test-target.mjs';
import {open,fingerprints,moduleParity} from '../../database/11_tests/r6-group-a/support.mjs';
const output=process.argv.find(s=>s.startsWith('--output='))?.slice(9);
assert.ok(output && path.resolve(output).startsWith(path.join(root,'docs/evidence/r7-3/runs')+path.sep));
assert.ok(!fs.existsSync(path.join(output,'environment.json')),'Never overwrite earlier evidence.');
const target='CinemaBookingDB_R0_R72_20261009_02';
const gate=preflight(target);assert.equal(gate.target?.database_guid,'D811515E-86AE-4B72-9A45-1E7E1B2ED950','Acceptance DB identity changed.');
const manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
const canonical=Object.fromEntries(Object.entries(manifest.modules).map(([name,entry])=>{
 const file=typeof entry==='string'?entry:entry.file||entry.path,body=read(path.join(root,'database',file)),start=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
 assert.ok(start);return [name,{file,definition:normalizeModule(body.slice(start.index).replace(/\s+GO\s*$/i,''))}];
}));
const result={status:'RUNNING',startedAt:new Date().toISOString(),preflight:gate,canonicalCounts:{tables:27,procedures:125,functions:21,views:6,triggers:7,modules:159},environments:[]};
try{
 for(const database of [target,'CinemaBookingDB']){
  const pool=await open(database,1);const item={database,status:'RUNNING',readOnly:true};result.environments.push(item);
  try{
   item.before=await fingerprints(pool);const objects=(await pool.request().query(queries.objects)).recordset;
   item.counts=objects.reduce((v,o)=>(v[o.type.trim()]=(v[o.type.trim()]||0)+1,v),{});
   const definitions=objects.filter(o=>o.definition);item.moduleCount=definitions.length;
   item.definitionDifferences=definitions.filter(o=>!canonical[o.name]||normalizeModule(o.definition)!==canonical[o.name].definition).map(o=>({name:o.name,type:o.type.trim(),actualSHA256:hash(normalizeModule(o.definition)),canonicalSHA256:canonical[o.name]?hash(canonical[o.name].definition):null,source:canonical[o.name]?.file}));
   item.missingModules=Object.keys(canonical).filter(n=>!definitions.some(o=>o.name===n));
   item.objectInventoryMatch=JSON.stringify(objects.map(o=>[o.schemaName,o.name,o.type.trim()]))===JSON.stringify(manifest.expected.objects.map(o=>[o.schemaName,o.name,o.type.trim()]));
   item.structuralDifferences={};
   for(const key of ['columns','parameters','keys','foreignKeys','checks','indexes','triggers','permissions','memberships']){
    const rows=(await pool.request().query(queries[key])).recordset;
    if(manifest.expected[key]){
     const stable=rows=>rows.map(r=>JSON.stringify(r)).sort(),actual=stable(rows),expected=stable(manifest.expected[key]);
     item.structuralDifferences[key]={missing:expected.filter(r=>!actual.includes(r)).map(r=>JSON.parse(r)),unexpected:actual.filter(r=>!expected.includes(r)).map(r=>JSON.parse(r))};
    }
   }
   item.protections=(await pool.request().query(`SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) invalidForeignKeys,(SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) invalidChecks,(SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) disabledTriggers;
   SELECT @@TRANCOUNT transactionCount,XACT_STATE() xactState;
   SELECT s.session_id,d.database_id FROM sys.dm_tran_session_transactions s JOIN sys.dm_tran_database_transactions d ON d.transaction_id=s.transaction_id WHERE d.database_id=DB_ID() AND s.is_user_transaction=1 AND s.session_id<>@@SPID;`)).recordsets;
   assert.equal(item.protections[1][0].transactionCount,0);assert.equal(item.protections[1][0].xactState,0);
   if(database===target){item.parity=await moduleParity(pool);assert.equal(item.definitionDifferences.length,0);assert.equal(item.missingModules.length,0);assert.ok(item.objectInventoryMatch);assert.deepEqual(item.protections[0][0],{invalidForeignKeys:0,invalidChecks:0,disabledTriggers:0});assert.equal(item.protections[2].length,0);}
   item.after=await fingerprints(pool);assert.deepEqual(item.after,item.before);item.preservation='PASS';item.status=database===target?'TEST_DB_VERIFIED':item.definitionDifferences.length||item.missingModules.length?'MAIN_DB_DEPLOYMENT_PENDING':'MAIN_DB_VERIFIED';
  }finally{await pool.close();}
 }
 result.status='PASS';
}catch(error){result.status='FAIL';result.error={message:error.message,number:error.number};process.exitCode=1;}
finally{result.completedAt=new Date().toISOString();write(path.join(output,'environment.json'),result);console.log(JSON.stringify({status:result.status,databases:result.environments.map(d=>({database:d.database,status:d.status,differences:d.definitionDifferences?.map(o=>o.name),preservation:d.preservation})),error:result.error}));}

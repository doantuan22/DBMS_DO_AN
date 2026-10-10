// Apply only the two approved canonical definitions to the task-owned test database.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {connect,database,root,write,evidenceRoot} from './common.mjs';
import {fingerprints,moduleParity,open} from '../../database/11_tests/r6-group-a/support.mjs';
import {inventory} from '../db/inventory.mjs';
import {generateVerification} from '../db/generate-verification.mjs';
const pool=await connect(),main=await open('CinemaBookingDB',1),result={database,status:'RUNNING'};
try{
 result.mainBefore=await fingerprints(main);result.before=await fingerprints(pool);
 for(const source of ['08_procedures/support/sp_Support_Complaint_List.sql','08_procedures/admin/sp_Admin_User_Create.sql']){
  const body=fs.readFileSync(path.join(root,'database',source),'utf8');
  for(const batch of body.split(/^GO\s*$/gmi).filter(x=>x.trim()))await pool.request().batch(batch);
 }
 result.parity=await moduleParity(pool);assert.equal(result.parity.modules,159);
 result.after=await fingerprints(pool);assert.deepEqual(result.after.data,result.before.data);
 // Expectations are read only from a canonical build with exactly these two source definitions applied.
 const actual=inventory(database),file=path.join(root,'database/baseline-manifest.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 const names=['sp_Support_Complaint_List','sp_Admin_User_Create'];
 for(const name of names){const old=manifest.expected.objects.find(r=>r.name===name),fresh=actual.objects.find(r=>r.name===name);assert.ok(old&&fresh);Object.assign(old,fresh);}
 manifest.expected.parameters=actual.parameters;
 manifest.provenance+='; R7.2 approved canonical definitions and parameter metadata verified on task-owned R5 build '+database;
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');generateVerification(manifest.expected);
 result.status='PASS';
}catch(error){result.status='FAIL';result.error={message:error.message,number:error.number};process.exitCode=1;}
finally{result.mainAfter=await fingerprints(main);assert.deepEqual(result.mainAfter,result.mainBefore);result.mainUnchanged='PASS';write(path.join(evidenceRoot,'apply-contracts.json'),result);await pool.close();await main.close();console.log(JSON.stringify({status:result.status,error:result.error,evidenceRoot}));}

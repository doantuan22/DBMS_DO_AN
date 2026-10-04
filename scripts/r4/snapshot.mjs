import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,mainSnapshot,ask,root,write,read} from '../r3a/common.mjs';
const pool=await connect('CinemaBookingDB');
try {
  const snapshot=await mainSnapshot(pool);
  const databases=(await ask(pool,"SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name")).recordset;
  const phase=process.argv.includes('--after')?'after':'before';
  if(phase==='after')assert.deepEqual(snapshot,JSON.parse(read(path.join(root,'audit/remediation/r4/evidence/main-before.json'))).snapshot);
  write(path.join(root,`audit/remediation/r4/evidence/main-${phase}.json`),{status:'PASS',snapshot,databases});
  console.log(`PASS main ${phase}: ${snapshot.data.length} tables; data/schema/modules/grants ${phase==='after'?'unchanged':'captured'}`);
}finally{await pool.close();}

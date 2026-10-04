import assert from 'node:assert/strict';
import path from 'node:path';
import {root,dbRoot,read,write} from '../db/lib.mjs';
import {connect,ask,mainSnapshot} from '../r3a/common.mjs';
const out=path.join(root,'audit/remediation/r3b/evidence');
const deployment=JSON.parse(read(path.join(out,'main-deployment.json')));
const pool=await connect('CinemaBookingDB');
try{
 const after=await mainSnapshot(pool);assert.deepEqual(after.data,deployment.after.data);assert.equal(after.schemaSha256,deployment.after.schemaSha256);assert.equal(after.dbPermissionsSha256,deployment.after.dbPermissionsSha256);
 const databases=(await ask(pool,"SELECT name FROM sys.databases WHERE name LIKE N'CinemaBookingDB%' ORDER BY name")).recordset.map(r=>r.name);assert.deepEqual(databases,['CinemaBookingDB']);
 const counts=(await ask(pool,"SELECT RTRIM(type) AS type,COUNT(*) AS count FROM sys.objects WHERE is_ms_shipped=0 AND type IN ('U','V','P','FN','IF','TR') GROUP BY type ORDER BY type")).recordset;
 assert.equal(counts.find(r=>r.type==='U').count,27);assert.equal(counts.find(r=>r.type==='P').count,125);
 const smoke=JSON.parse(read(path.join(dbRoot,'_audit/backend-smoke-CinemaBookingDB.json')));write(path.join(out,'main-http-smoke.json'),smoke);
 const contracts=JSON.parse(read(path.join(dbRoot,'_audit/backend-contract-check.json')));write(path.join(out,'procedure-contracts.json'),contracts);
 write(path.join(out,'main-final.json'),{status:'PASS',at:new Date().toISOString(),database:'CinemaBookingDB',remainingCinemaBookingDatabases:databases,counts,dataPreservedAfterVerifyAndHttpSmoke:true,after});
 console.log('PASS final main DB: 27 tables, 125 SP; all data/schema/execution grants unchanged after verify and HTTP smoke; no trial databases remain.');
}finally{await pool.close();}

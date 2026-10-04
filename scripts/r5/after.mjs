import assert from 'node:assert/strict';
import path from 'node:path';
import {root,dbRoot,read,write} from '../db/lib.mjs';
import {connect,ask,mainSnapshot} from '../r3a/common.mjs';
const pool=await connect('CinemaBookingDB'),master=await connect('master');
try{
 const snapshot=await mainSnapshot(pool),initial=JSON.parse(read(path.join(root,'audit/remediation/r5/evidence/main-before.json'))).snapshot,deploy=JSON.parse(read(path.join(root,'audit/remediation/r5/evidence/main-deployment.json')));
 assert.deepEqual(snapshot.data,initial.data);assert.equal(snapshot.schemaSha256,initial.schemaSha256);assert.equal(snapshot.dbPermissionsSha256,initial.dbPermissionsSha256);assert.deepEqual(snapshot,deploy.after);
 const metadata=(await ask(pool,"SELECT o.type,COUNT(*) AS count FROM sys.objects o WHERE o.is_ms_shipped=0 GROUP BY o.type; SELECT COUNT(*) AS indexes FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id WHERE t.is_ms_shipped=0 AND i.index_id>0;")).recordsets;
 const remaining=(await ask(master,"SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name")).recordset;
 write(path.join(root,'audit/remediation/r5/evidence/main-after.json'),{status:'PASS',snapshot,metadata,databases:remaining,allOriginalDataPreserved:true});
 console.log('PASS main data/schema/grants unchanged; actual modules equal verified deployment');
}finally{await pool.close();await master.close();}

import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,ask,mainSnapshot,productionHashes,root,write} from '../r3a/common.mjs';
const pool=await connect('CinemaBookingDB');
try{
 const clock=(await ask(pool,'SELECT DB_NAME() AS databaseName,dbo.fn_BayGio() AS utcNow,CONVERT(varchar(10),dbo.fn_HomNay(),23) AS businessDate;')).recordset[0];
 assert.equal(clock.databaseName,'CinemaBookingDB');
 const snapshot=await mainSnapshot(pool);assert.equal(snapshot.data.length,27);
 const objects=(await ask(pool,'SELECT type,COUNT(*) AS objectCount FROM sys.objects WHERE is_ms_shipped=0 GROUP BY type ORDER BY type')).recordset;
 const indexes=(await ask(pool,'SELECT COUNT(*) AS indexes FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id WHERE t.is_ms_shipped=0 AND i.index_id>0')).recordset[0];
 write(path.join(root,'audit/remediation/r6a/evidence/main-before.json'),{status:'PASS',database:'CinemaBookingDB',clock,snapshot,objects,indexes,sourceHashes:productionHashes()});
 console.log(JSON.stringify({clock,tableCount:27,rows:snapshot.data.map(({table,rows})=>({table,rows})),objects,indexes}));
}finally{await pool.close();}

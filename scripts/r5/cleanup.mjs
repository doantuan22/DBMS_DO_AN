import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,ask,root,write} from '../r3a/common.mjs';
const databases=process.argv.filter(a=>a.startsWith('--database=')).map(a=>a.slice(11));assert.ok(databases.length);
for(const name of databases)assert.match(name,/^CinemaBookingDB_R0_R1_R2_R5[A-Za-z0-9_]+$/);
const pool=await connect('master');
try{
 const deleted=[];
 for(const name of databases){if((await ask(pool,`SELECT DB_ID(N'${name}') AS id`)).recordset[0].id!==null){await ask(pool,`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}];`);deleted.push(name);}}
 const remaining=(await ask(pool,"SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name")).recordset;
 assert.ok(!remaining.some(r=>databases.includes(r.name)));assert.deepEqual(remaining,[{name:'CinemaBookingDB'}]);
 write(path.join(root,'audit/remediation/r5/evidence/cleanup.json'),{status:'PASS',deleted,remaining,mainUntouched:true});console.log('PASS deleted '+deleted.length+' R5 temporary DBs; only CinemaBookingDB remains');
}finally{await pool.close();}

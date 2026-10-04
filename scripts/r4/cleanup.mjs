import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,ask,root,write} from '../r3a/common.mjs';
const database=process.argv.find(arg=>arg.startsWith('--database='))?.slice(11);
assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R4[A-Za-z0-9_]+$/);
const pool=await connect('master');
try {
  // Only the explicitly named R4 disposable database is eligible for DROP.
  await ask(pool,`IF DB_ID(N'${database}') IS NOT NULL BEGIN ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${database}]; END`);
  const databases=(await ask(pool,"SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name")).recordset;
  assert.ok(!databases.some(d=>d.name===database));
  write(path.join(root,'audit/remediation/r4/evidence/cleanup.json'),{status:'PASS',deleted:database,databases});
  console.log('PASS cleanup: '+database+' removed');
}finally{await pool.close();}

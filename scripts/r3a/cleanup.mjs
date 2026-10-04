import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,quote,write,evidence,ask} from './common.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
assert.match(database??'',/^CinemaBookingDB_R0_R3A_[A-Za-z0-9_]+$/);
assert.ok(process.argv.includes('--drop-fixture'),'Explicit --drop-fixture required.');
const pool=await connect('master');
try {
 assert.equal((await ask(pool,'SELECT DB_NAME() AS name')).recordset[0].name,'master');
 const exists=await pool.request().input('Name',database).query('SELECT DB_ID(@Name) AS id');
 if(exists.recordset[0].id!==null)await ask(pool,`ALTER DATABASE ${quote(database)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ${quote(database)};`);
 const after=await pool.request().input('Name',database).query('SELECT DB_ID(@Name) AS id');assert.equal(after.recordset[0].id,null);
 write(path.join(evidence,'cleanup.json'),{status:'PASS',database,dropped:true,at:new Date().toISOString()});
 console.log('PASS R3A fixture deleted: '+database);
} finally {await pool.close();}

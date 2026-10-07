// Remove only the three disposable databases created in this TASK 1 run.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, root, write } from '../db/lib.mjs';
if (!process.argv.includes('--apply')) throw new Error('Explicit --apply is required for disposable cleanup.');
const env = credentials();
const names = ['CinemaBookingDB_R0_Task1_20261007_1449','CinemaBookingDB_R0_Task1_20261007_1500','CinemaBookingDB_R0_Task1_Legacy_20261007'];
const config = {server:env.DB_SERVER || 'localhost',port:Number(env.DB_PORT || 1433),user:env.DB_USER,password:env.DB_PASSWORD,
  options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:env.DB_TRUST_SERVER_CERTIFICATE!=='false',useUTC:true}};
const master = await new sql.ConnectionPool({...config,database:'master'}).connect();
const main = await new sql.ConnectionPool({...config,database:'CinemaBookingDB'}).connect();
async function fingerprint() {
  const tables = (await main.request().query('SELECT name FROM sys.tables WHERE is_ms_shipped=0 ORDER BY name')).recordset;
  return await Promise.all(tables.map(async ({name})=>{
    const rows = (await main.request().query('SELECT * FROM dbo.['+name.replaceAll(']',']]')+']')).recordset;
    return {table:name,rows:rows.length,sha256:crypto.createHash('sha256').update(rows.map(row=>JSON.stringify(row)).sort().join('\n')).digest('hex')};
  }));
}
const evidence = {startedAt:new Date().toISOString(),status:'RUNNING',removed:[]};
try {
  evidence.mainBefore = await fingerprint();
  for (const name of names) {
    assert.match(name,/^CinemaBookingDB_R0_Task1_(?:20261007_(?:1449|1500)|Legacy_20261007)$/);
    assert.notEqual(name,'CinemaBookingDB');assert.notEqual(name,env.DB_DATABASE);
    const exists = (await master.request().input('Name',sql.NVarChar(128),name).query('SELECT DB_ID(@Name) AS id')).recordset[0].id;
    if (exists !== null) await master.request().query(`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}];`);
    evidence.removed.push({database:name,existed:exists!==null,status:'REMOVED'});
  }
  evidence.mainAfter = await fingerprint();assert.deepEqual(evidence.mainAfter,evidence.mainBefore);assert.equal(evidence.mainAfter.length,27);
  evidence.status='PASS';console.log('PASS disposable cleanup; application data unchanged in all 27 tables.');
} catch (error) {evidence.status='FAIL';evidence.error=error.message;throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(root,'docs/r0-20261007/cleanup.json'),evidence);await master.close();await main.close();}

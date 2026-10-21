// Execute the exact SSMS atomicity demo batch on the configured Main database.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const require=createRequire(path.join(root,'backend','package.json'));
const sql=require('mssql'); const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync(path.join(root,'backend','.env')));
if(env.DB_DATABASE!=='CinemaBookingDB') throw new Error('Refusing: configured database is not Main.');
const pool=await new sql.ConnectionPool({server:env.DB_SERVER,port:Number(env.DB_PORT??1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,
  options:{encrypt:String(env.DB_ENCRYPT).toLowerCase()==='true',trustServerCertificate:String(env.DB_TRUST_SERVER_CERTIFICATE??'true')==='true',useUTC:true},requestTimeout:120000}).connect();
const dest=path.join(root,'.audit-output','main-booking-atomicity-ssms-demo.json');
const evidence={startedUtc:new Date().toISOString(),verdict:'FAIL'};
try{
  const target=(await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if(target.serverName!=='DoanTuanIT'||target.databaseName!=='CinemaBookingDB'||target.state!=='ONLINE') throw new Error(`Wrong target: ${JSON.stringify(target)}`);
  evidence.target=target;
  const script=fs.readFileSync(path.join(root,'database','14_audit','main_booking_atomicity_demo.sql'),'utf8');
  const result=await pool.request().batch(script);
  const rows=(result.recordsets??[]).flat();
  const verdictRow=rows.find(r=>r.TestName==='sp_Booking_Create atomic rollback');
  evidence.actualResult=verdictRow??null;
  if(verdictRow?.Verdict!=='PASS') throw new Error('SSMS script returned no PASS oracle row.');
  const post=(await pool.request().query(`SELECT COUNT(*) violationCount FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1`)).recordset[0];
  evidence.post={untrustedOrDisabledChecks:post.violationCount};
  evidence.verdict='PASS';
}catch(error){evidence.error=error.message; evidence.sqlErrorNumber=error.number??error.originalError?.info?.number??null;}
finally{
  evidence.finishedUtc=new Date().toISOString(); fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(evidence,null,2));
  await pool.close(); console.log(JSON.stringify({...evidence,evidencePath:path.relative(root,dest)},null,2));
  if(evidence.verdict!=='PASS')process.exitCode=1;
}

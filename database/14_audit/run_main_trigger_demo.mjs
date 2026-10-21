// Executes main_trigger_demo.sql on the configured Main database and verifies
// row counts, identity values, FK/check consistency before and after.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const require=createRequire(path.join(ROOT,'backend','package.json'));
const sql=require('mssql'); const dotenv=require('dotenv');
const env=dotenv.parse(fs.readFileSync(path.join(ROOT,'backend','.env')));
if(env.DB_DATABASE!=='CinemaBookingDB') throw new Error('Refusing: backend config must target CinemaBookingDB.');
const cfg={server:env.DB_SERVER,port:Number(env.DB_PORT??1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:String(env.DB_ENCRYPT).toLowerCase()==='true',trustServerCertificate:String(env.DB_TRUST_SERVER_CERTIFICATE??'true')==='true',useUTC:true},requestTimeout:120000};
const pool=await new sql.ConnectionPool(cfg).connect();
const evidence={startedUtc:new Date().toISOString(),target:null,verdict:'BLOCKED',before:null,tests:[],after:null};
async function snapshot(){
 const identity=(await pool.request().query("SELECT @@SERVERNAME serverName,DB_NAME() databaseName,DATABASEPROPERTYEX(DB_NAME(),'Status') state")).recordset[0];
 if(identity.serverName!=='DoanTuanIT'||identity.databaseName!=='CinemaBookingDB'||identity.state!=='ONLINE') throw new Error(`Wrong target ${identity.serverName}/${identity.databaseName}/${identity.state}`);
 const counts=(await pool.request().query(`SELECT 'BANGGIA' n,COUNT_BIG(*) c FROM dbo.BANGGIA UNION ALL SELECT 'CHITIETVE',COUNT_BIG(*) FROM dbo.CHITIETVE UNION ALL SELECT 'DANHGIAPHIM',COUNT_BIG(*) FROM dbo.DANHGIAPHIM UNION ALL SELECT 'SUATCHIEU',COUNT_BIG(*) FROM dbo.SUATCHIEU UNION ALL SELECT 'XULY_KHIEUNAI',COUNT_BIG(*) FROM dbo.XULY_KHIEUNAI UNION ALL SELECT 'KHIEUNAI',COUNT_BIG(*) FROM dbo.KHIEUNAI UNION ALL SELECT 'NGUOIDUNG',COUNT_BIG(*) FROM dbo.NGUOIDUNG`)).recordset;
 const ids=(await pool.request().query(`SELECT IDENT_CURRENT('dbo.BANGGIA') BANGGIA,IDENT_CURRENT('dbo.CHITIETVE') CHITIETVE,IDENT_CURRENT('dbo.DANHGIAPHIM') DANHGIAPHIM,IDENT_CURRENT('dbo.SUATCHIEU') SUATCHIEU,IDENT_CURRENT('dbo.XULY_KHIEUNAI') XULY_KHIEUNAI`)).recordset[0];
 return {identity,counts,ids};
}
try{
 evidence.before=await snapshot(); evidence.target=evidence.before.identity;
 const script=fs.readFileSync(path.join(ROOT,'database','14_audit','main_trigger_demo.sql'),'utf8');
 const result=await pool.request().batch(script);
 evidence.tests=result.recordset??[];
 evidence.after=await snapshot();
 const integrity=await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');
 evidence.integrityViolations=integrity.recordset??[];
 const same=JSON.stringify(evidence.before.counts)===JSON.stringify(evidence.after.counts)&&JSON.stringify(evidence.before.ids)===JSON.stringify(evidence.after.ids);
 const failures=evidence.tests.filter(x=>x.Verdict==='FAIL');
 const blocked=evidence.tests.filter(x=>x.Verdict==='BLOCKED');
 evidence.verdict=same&&evidence.integrityViolations.length===0&&failures.length===0?'PASS':(failures.length?'FAIL':'BLOCKED');
 evidence.rowAndIdentityStateUnchanged=same;
 evidence.failures=failures; evidence.blocked=blocked;
}catch(error){evidence.verdict='FAIL';evidence.error=error.message;evidence.after=await snapshot().catch(e=>({error:e.message}));}
finally{
 evidence.finishedUtc=new Date().toISOString();
 const out=path.join(ROOT,'.audit-output','main-trigger-demo.json'); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,JSON.stringify(evidence,null,2));
 await pool.close(); console.log(JSON.stringify({verdict:evidence.verdict,target:evidence.target,tests:evidence.tests.length,pass:evidence.tests.filter(x=>x.Verdict==='PASS').length,fail:evidence.tests.filter(x=>x.Verdict==='FAIL').length,blocked:evidence.tests.filter(x=>x.Verdict==='BLOCKED').length,rowAndIdentityStateUnchanged:evidence.rowAndIdentityStateUnchanged,error:evidence.error,evidence:path.relative(ROOT,out)},null,2));
 if(evidence.verdict!=='PASS')process.exitCode=1;
}

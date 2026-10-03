import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import sql from '../../backend/node_modules/mssql/index.js';
import {root,credentials,write} from '../db/lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!/^CinemaBookingDB_R0_R1_[A-Za-z0-9_]+$/.test(database||''))throw Error('Disposable migration fixture required.');
const env=credentials();
const pool=await new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true}}).connect();
const birthday=(await pool.request().query('SELECT NgaySinh FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=5')).recordset[0].NgaySinh;
try {
 await pool.request().query("UPDATE dbo.HOSOKHACHHANG SET NgaySinh='2000-01-01' WHERE NguoiDungID=5;");
 const result=spawnSync(process.execPath,[path.join(root,'scripts/r1/migrate-seed.mjs'),`--database=${database}`,'--apply'],{cwd:root,encoding:'utf8',timeout:30000});
 assert.equal(result.status,1);assert.match(result.stderr,/not the exact proven seed/);
 const state=(await pool.request().query("SELECT dbo.fn_BayGio() AS OldClock,SYSUTCDATETIME() AS UtcClock,OBJECT_ID('dbo.fn_GioRap') AS NewHelper")).recordset[0];
 assert.ok(state.OldClock.getTime()-state.UtcClock.getTime()>6*3600000);assert.equal(state.NewHelper,null);
 write(path.join(root,'audit/remediation/evidence/migration-refusal.json'),{status:'PASS',database,reason:'Altered seed row refused; R0 clock/objects remained unchanged; owned test modification restored.'});
 console.log('PASS migration guard: modified/ambiguous seed refused before any conversion or DDL');
}finally{await pool.request().input('Birthday',sql.Date,birthday).query('UPDATE dbo.HOSOKHACHHANG SET NgaySinh=@Birthday WHERE NguoiDungID=5;');await pool.close();}

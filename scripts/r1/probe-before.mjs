import assert from 'node:assert/strict';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, root, write } from '../db/lib.mjs';
const env=credentials();
const pool=await sql.connect({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true}});
try {
 const input='2026-10-03T19:30:00+07:00';
 const result=await pool.request().input('Instant',sql.DateTime2,new Date(input)).query('SELECT @Instant AS DriverRoundtrip, CONVERT(varchar(33),@Instant,126) AS StoredComponents, SYSUTCDATETIME() AS UtcNow, dbo.fn_BayGio() AS DbNow, DATEADD(MINUTE,dbo.fn_ThoiGianGiuChoPhut(),dbo.fn_BayGio()) AS Deadline, dbo.fn_ThoiGianGiuChoPhut() AS HoldMinutes');
 const r=result.recordset[0];
 const delta=r.DbNow.getTime()-r.UtcNow.getTime();
 const trace=[{layer:'Intended local input',raw:'2026-10-03T19:30',timezone:'Asia/Ho_Chi_Minh'},{layer:'HTTP offset input',raw:input},{layer:'Backend Date / mssql input',raw:new Date(input).toISOString(),epoch:new Date(input).getTime()},{layer:'SQL datetime2 stored components / driver roundtrip',raw:r.StoredComponents,returned:r.DriverRoundtrip.toISOString(),epoch:r.DriverRoundtrip.getTime(),expected:'2026-10-03T12:30:00.000Z',delta:0},{layer:'SQL authoritative now',utc:r.UtcNow.toISOString(),actual:r.DbNow.toISOString(),deltaMs:delta},{layer:'SQL hold deadline -> driver -> DTO -> JSON',actual:r.Deadline.toISOString(),expected:new Date(r.UtcNow.getTime()+r.HoldMinutes*60000).toISOString(),deltaMs:r.Deadline.getTime()-(r.UtcNow.getTime()+r.HoldMinutes*60000)},{layer:'React display of mislabeled DB now',actual:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(r.DbNow),expected:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(r.UtcNow)}];
 write(path.join(root,'audit/remediation/evidence/bug-001-before.json'),{input,driver:{mssql:'12.7.2',tedious:'20.0.0',useUTC:true},trace});
 assert.equal(r.DriverRoundtrip.getTime(),new Date(input).getTime(),'Driver itself preserves the input epoch');
 if(process.argv.includes('--expect-bug')) { assert.ok(delta>6*3600000,'Must reproduce local SQL clock mislabeled UTC');console.log(`REPRODUCED BUG-001: DB clock/hold delta=${delta}ms; driver roundtrip epoch unchanged`); }
 else { assert.ok(Math.abs(delta)<1000,`UTC clock regression failed: delta=${delta}ms`); }
} finally {await pool.close();}

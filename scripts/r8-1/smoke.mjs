// R8.1 offline environment smoke. No production implementation changes or main mutations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createServer} from '../../frontend/node_modules/vite/dist/node/index.js';
import bcrypt from '../../backend/node_modules/bcryptjs/index.js';
import {sql,open,fingerprints,moduleParity,root} from '../../database/11_tests/r6-group-a/support.mjs';
import {credentials} from '../db/lib.mjs';
import {preflight,identifier,literal} from '../db/test-target.mjs';
import {smokeBrowser} from './browser.mjs';

const option=key=>process.argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3);
const out=path.resolve(option('output')||'');
assert.ok(out.startsWith(path.join(root,'docs/evidence/r8-1/runs')+path.sep),'Fresh R8.1 evidence output required');
assert.ok(fs.existsSync(path.join(out,'context.json')),'Create a repository/context baseline first');
assert.ok(!fs.existsSync(path.join(out,'environment-result.json')),'Refusing to overwrite an existing smoke run');
const context=JSON.parse(fs.readFileSync(path.join(out,'context.json'),'utf8'));
const database=context.database;
assert.match(database,/^CinemaBookingDB_R0_R81_[A-Za-z0-9_]+$/);
const provision=credentials(),gate=preflight(database);
assert.ok(gate.target,'Build fresh R5 test target first');
assert.equal(option('confirm-target'),gate.confirmation,'Reviewed exact identity token required');
const login='cinema_r81_'+crypto.randomUUID().replaceAll('-','');
const dbPassword=crypto.randomBytes(32).toString('base64url')+'!aA1';
const fixturePassword=crypto.randomBytes(24).toString('base64url')+'!aA1';
const privateDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'cinema-r81-secrets-'));
const secrets=[provision.DB_PASSWORD,dbPassword,fixturePassword].filter(Boolean);
const sanitize=value=>JSON.parse(JSON.stringify(value,(key,item)=>{
 if(/password|token|secret|matkhau/i.test(key))return '[REDACTED]';
 if(typeof item==='string')for(const secret of secrets)item=item.replaceAll(secret,'[REDACTED]');
 return item;
}));
const save=(name,value)=>{assert.equal(path.basename(name),name);fs.writeFileSync(path.join(out,name),JSON.stringify(sanitize(value),null,2)+'\n');};
const result={status:'RUNNING',startedAt:new Date().toISOString(),database,targetIdentity:gate.target,server:gate.server.ServerName,
 phases:[],smoke:[],scope:'R8.1 readiness only; no UC acceptance upgrade'};
let admin,master,main,backend,vite,appPool,initial,mainBefore,fixtureActors=[],complaintIDs=[],loginCreated=false,userCreated=false;
const procedureTrace=[];
const guard=gate.sqlGuard+`IF DB_NAME()<>${literal(database)} THROW 51081,'Wrong R8.1 test target.',1;\n`;
const query=async(text,inputs={})=>{
 const request=admin.request();for(const [name,value]of Object.entries(inputs))request.input(name,
  typeof value==='number'?sql.Int:sql.NVarChar(sql.MAX),value);
 return request.batch(guard+text);
};
try {
 main=await open('CinemaBookingDB',1);mainBefore=await fingerprints(main);save('main-before.json',mainBefore);
 admin=await open(database,2);master=await open('master',1);
 const parity=await moduleParity(admin);assert.equal(parity.modules,159);save('test-parity-before.json',parity);
 initial=await fingerprints(admin);save('test-seed-before.json',initial);
 assert.equal(initial.data.find(x=>x.tableName==='KHIEUNAI').rows,0,'Smoke requires fresh seed-only target');
 assert.equal(initial.data.find(x=>x.tableName==='DONDATVE').rows,0,'Smoke requires empty transaction tables');
 const actorRows=(await query(`SELECT n.NguoiDungID id,n.Email email,n.MatKhau originalHash,v.MaVaiTro role
  FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.Email IN
  ('khachhang1@gmail.com','manager.q1@cinemadb.vn','cskh@cinemadb.vn','admin@cinemadb.vn') ORDER BY n.NguoiDungID;`)).recordset;
 assert.equal(actorRows.length,4);fixtureActors=actorRows;
 fs.writeFileSync(path.join(privateDirectory,'recovery.private.json'),JSON.stringify({database,guid:gate.target.database_guid,
  login,dbPassword,fixturePassword,actors:actorRows,complaintIDs},null,2));
 // Provisioning uses existing local operator credentials only; runtime backend receives a distinct test-only login.
 await master.request().batch(gate.sqlGuard+`IF SUSER_ID(${literal(login)}) IS NOT NULL THROW 51081,'Login exists.',1;
  CREATE LOGIN ${identifier(login)} WITH PASSWORD=${literal(dbPassword)},CHECK_POLICY=ON,DEFAULT_DATABASE=${identifier(database)};`);
 loginCreated=true;
 await query(`CREATE USER ${identifier(login)} FOR LOGIN ${identifier(login)};
  GRANT EXECUTE ON SCHEMA::dbo TO ${identifier(login)};`);userCreated=true;
 const hash=await bcrypt.hash(fixturePassword,10);
 for(const actor of actorRows)await query('UPDATE dbo.NGUOIDUNG SET MatKhau=@Hash WHERE NguoiDungID=@ID;',{Hash:hash,ID:actor.id});
 const customer=actorRows.find(x=>x.role==='KHACH_HANG');
 const rows=(await query(`INSERT dbo.KHIEUNAI(NguoiDungID,LoaiKhieuNai,TieuDe,NoiDung,MucDoUuTien)
  OUTPUT INSERTED.KhieuNaiID id
  SELECT @Customer,N'R81 Smoke',N'R81 Smoke '+priority,N'Owned readiness fixture',priority
  FROM (VALUES(N'Thấp'),(N'Trung bình'),(N'Cao'),(N'Khẩn cấp'))p(priority);`,{Customer:customer.id})).recordset;
 complaintIDs=rows.map(x=>x.id);
 fs.writeFileSync(path.join(privateDirectory,'setup-complete.private.json'),JSON.stringify({database,guid:gate.target.database_guid,
  login,dbPassword,fixturePassword,actors:actorRows,complaintIDs},null,2));
 save('fixture-setup.json',{status:'PASS',scope:'Four seeded role actors with random temporary passwords; four owned unlinked priorities',
  actors:actorRows.map(({id,role})=>({id,role})),complaintIDs,clock:(await query('SELECT dbo.fn_BayGio() utcNow,dbo.fn_HomNay() businessDate;')).recordset,
  privateRecoveryDirectory:privateDirectory,canonicalSeedDate:'SQL-derived by R5 build; no client date override'});
 // Override all runtime values before first import of production backend configuration.
 Object.assign(process.env,provision,{NODE_ENV:'test',DB_DATABASE:database,DB_USER:login,DB_PASSWORD:dbPassword,
  JWT_SECRET:crypto.randomBytes(48).toString('base64url'),VITE_API_BASE_URL:'/api'});
 const {createApp}=await import('../../backend/src/app.js');
 const {getPool}=await import('../../backend/src/db/pool.js');
 appPool=await getPool();assert.equal(appPool.config.database,database);assert.equal(appPool.config.user,login);
 const actual=(await appPool.request().query('SELECT DB_NAME() databaseName,ORIGINAL_LOGIN() loginName,@@TRANCOUNT transactionCount;')).recordset[0];
 assert.equal(actual.databaseName,database);assert.equal(actual.loginName,login);assert.equal(actual.transactionCount,0);
 const deniedMain=await new sql.ConnectionPool({...appPool.config,database:'CinemaBookingDB'}).connect()
  .then(async pool=>{await pool.close();return false;},()=>true);
 assert.equal(deniedMain,true,'Test runtime login must not access main');
 // Observational wrapper around the real mssql pool, preserving the actual typed execute/result.
 const originalRequest=appPool.request.bind(appPool);
 appPool.request=()=>{
  const request=originalRequest(),execute=request.execute.bind(request);
  request.execute=async name=>{
   const row={sequence:procedureTrace.length,name,database,parameters:Object.keys(request.parameters),startedAt:new Date().toISOString()};
   procedureTrace.push(row);
   try{const reply=await execute(name);row.status='PASS';return reply;}catch(error){row.status='FAIL';row.sqlError=error.number;throw error;}
   finally{row.finishedAt=new Date().toISOString();}
  };return request;
 };
 backend=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>backend.once('listening',resolve));
 const backendOrigin=`http://127.0.0.1:${backend.address().port}`;
 vite=await createServer({root:path.join(root,'frontend'),configFile:path.join(root,'frontend/vite.config.js'),
  server:{host:'127.0.0.1',port:0,strictPort:false,hmr:false,proxy:{'/api':{target:backendOrigin,changeOrigin:true}}}});
 await vite.listen();const frontendOrigin=`http://127.0.0.1:${vite.httpServer.address().port}`;
 save('startup.json',{status:'PASS',backendOrigin,frontendOrigin,actualBackendConnection:actual,
  runtimeCredentials:'Unique test-only SQL login; EXECUTE on test dbo schema; unable to connect to main',
  viteConfig:'Existing config + test-only ephemeral host/port/proxy override; actual index.html/main.jsx',
  versions:{node:process.version,vite:JSON.parse(fs.readFileSync(path.join(root,'frontend/node_modules/vite/package.json'))).version,
   react:JSON.parse(fs.readFileSync(path.join(root,'frontend/node_modules/react/package.json'))).version}});
 const plans={
  KHACH_HANG:{route:'/',marker:'CinemaStar',loadedMarker:database,smoke:'SMOKE-03'},
  QUAN_LY_RAP:{route:'/manager',marker:'Manager Portal',loadedMarker:'Phòng hoạt động:',smoke:'SMOKE-04'},
  CSKH:{route:'/support',marker:'CSKH Portal',loadedMarker:'R81 Smoke',smoke:'SMOKE-05'},
  ADMIN:{route:'/admin',marker:'Quản trị hệ thống',loadedMarker:'Tổng quan',smoke:'SMOKE-06'},
 };
 const browser=await smokeBrowser({origin:frontendOrigin,database,out,save,actors:actorRows.map(actor=>
  ({id:actor.id,email:actor.email,role:actor.role,password:fixturePassword,...plans[actor.role]}))});
 result.smoke=browser.checks;result.browserStatus=browser.status;
 assert.ok(procedureTrace.some(x=>x.name==='dbo.sp_Auth_Login'));
 assert.ok(procedureTrace.some(x=>x.name==='dbo.sp_Manager_ListAssignedCinemas'));
 assert.ok(procedureTrace.some(x=>x.name==='dbo.sp_Support_Complaint_List'));
 assert.ok(procedureTrace.every(x=>x.status==='PASS'),'Unexpected SQL execution failure');
 result.status='PASS';
} catch(error) {result.status='FAIL';result.error=error.message;process.exitCode=1;}
finally {
 try {
  if(vite)await vite.close();
  if(backend)await new Promise(resolve=>{backend.close(resolve);backend.closeIdleConnections();});
  if(appPool){const {closePool}=await import('../../backend/src/db/pool.js');await closePool();}
  if(admin&&initial){
   for(const id of complaintIDs)await query('DELETE dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID;DELETE dbo.KHIEUNAI WHERE KhieuNaiID=@ID;',{ID:id});
   for(const actor of fixtureActors)await query('UPDATE dbo.NGUOIDUNG SET MatKhau=@Hash WHERE NguoiDungID=@ID;',{Hash:actor.originalHash,ID:actor.id});
   if(userCreated)await query(`DROP USER ${identifier(login)};`);
   if(loginCreated)await master.request().batch(gate.sqlGuard+`DROP LOGIN ${identifier(login)};`);
   const after=await fingerprints(admin);assert.deepEqual(after,initial,'27 data/metadata fingerprints after cleanup');
   const parity=await moduleParity(admin);assert.equal(parity.modules,159);
   const integrity=(await query(`IF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1)
    OR EXISTS(SELECT 1 FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1)
    OR EXISTS(SELECT 1 FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) THROW 51081,'Protection disabled.',1;
    SELECT @@TRANCOUNT transactionCount;`)).recordset[0];assert.equal(integrity.transactionCount,0);
   const transactions=(await admin.request().query(`SELECT s.session_id FROM sys.dm_tran_session_transactions s
    JOIN sys.dm_tran_database_transactions d ON d.transaction_id=s.transaction_id WHERE d.database_id=DB_ID() AND s.is_user_transaction=1;`)).recordset;
   assert.deepEqual(transactions,[]);
   save('fixture-cleanup.json',{status:'PASS',before:initial,after,moduleParity:parity,session:integrity,openUserTransactions:transactions,
    loginDropped:true,userDropped:true,ownedComplaintRowsRemoved:complaintIDs.length,passwordHashesRestored:fixtureActors.length,
    identityCountersExcluded:'R5 fixture convention: auto-increment advances on this disposable Test DB are retained',
    targetRetained:'Fresh seed-only database; no test runtime credentials remain'});
   result.cleanup='PASS';
  }
  if(main&&mainBefore){const after=await fingerprints(main);assert.deepEqual(after,mainBefore);
   save('main-preservation.json',{status:'PASS',before:mainBefore,after,mainWrites:0});result.mainPreservation='PASS';}
  if(result.status==='PASS'&&result.cleanup==='PASS'&&result.mainPreservation==='PASS'){
   result.smoke.push({id:'SMOKE-07',result:'PASS',assertions:['Test backend exact identity + login denied main',
    'Owned fixture cleanup restores all27 data/metadata fingerprints; main unchanged']});result.readiness='READY';
  }else result.readiness='NOT_READY';
 }catch(error){result.status='FAIL';result.cleanupError=error.message;result.readiness='NOT_READY';process.exitCode=1;}
 save('procedure-trace.json',{status:procedureTrace.every(x=>x.status==='PASS')?'PASS':'FAIL',mode:'Observed real typed Request.execute; no fake results',calls:procedureTrace});
 result.finishedAt=new Date().toISOString();save('environment-result.json',result);
 await Promise.allSettled([admin?.close(),master?.close(),main?.close()]);
 console.log(JSON.stringify(sanitize({status:result.status,readiness:result.readiness,database,smoke:result.smoke.length,
  cleanup:result.cleanup,mainPreservation:result.mainPreservation,error:result.error,cleanupError:result.cleanupError,out})));
}

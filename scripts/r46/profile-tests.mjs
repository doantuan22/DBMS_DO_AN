import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,env,database,disposable,connect,snapshot,summarize,write,read,batches,evidenceRoot} from './common.mjs';
import {createFixtures,reset,state,update,cleanup} from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const {closePool}=await import('../../backend/src/db/pool.js');
const {authService}=await import('../../backend/src/services/authService.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,report={database,status:'RUNNING',cases:[],requests:[],races:[],at:new Date().toISOString()};
let fixtures,before,triggerCreated=false;const originalUpdate=authService.updateProfile;
const pass=(name,details={})=>report.cases.push({name,status:'PASS',...details});
async function api(name,route,{method='PUT',body,token,status=200,code}={}){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(method==='GET'?{}:{body:JSON.stringify(body??{})}),signal:AbortSignal.timeout(30000)});
 const value=await response.json();report.requests.push({name,method,route,status:response.status,expected:status,code:value?.error?.code});
 assert.equal(response.status,status,`${name}: ${value?.error?.code}`);if(code)assert.equal(value.error.code,code);
 assert.equal(JSON.stringify(value).includes('R46_ProfileFailure'),false);assert.equal(JSON.stringify(value).includes('MatKhau'),false);
 return value;
}
async function noTransaction(){const row=(await pool.request().query('SELECT @@TRANCOUNT n,XACT_STATE() s')).recordset[0];assert.deepEqual(row,{n:0,s:0});}
async function reject(user,patch,number){const old=await state(pool,user);await assert.rejects(update(pool,user,patch),e=>e.number===number);assert.deepEqual(await state(pool,user),old);await noTransaction();}
async function role(user,value){await pool.request().input('ID',sql.Int,user.id).input('Role',sql.VarChar(50),value).query('UPDATE dbo.NGUOIDUNG SET VaiTroID=(SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro=@Role) WHERE NguoiDungID=@ID');}
async function race(name,user,{profile=false,changeRole=false,staff=false}={}){
 await reset(pool,user,profile);const first=await connect(),second=await connect();let waiting;
 try{
  const a=(await first.request().query('SELECT @@SPID id')).recordset[0].id,b=(await second.request().query('SELECT @@SPID id')).recordset[0].id;
  await first.request().batch('BEGIN TRANSACTION;');
  if(changeRole)await first.request().input('ID',sql.Int,user.id).query("UPDATE dbo.NGUOIDUNG SET VaiTroID=(SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro='ADMIN') WHERE NguoiDungID=@ID");
  else await update(first,user,{HoTen:'R46 race first',...(staff?{}:{NgaySinh:'1991-03-02',GioiTinh:'Nam'})});
  waiting=update(second,user,{HoTen:'R46 race second',...(staff?{}:{NgaySinh:'1992-04-03',GioiTinh:'Nữ'})}).then(v=>({value:v}),e=>({number:e.number}));
  let blocked;const until=Date.now()+8000;
  while(Date.now()<until){blocked=(await pool.request().input('ID',sql.Int,b).query('SELECT session_id,blocking_session_id,wait_type FROM sys.dm_exec_requests WHERE session_id=@ID')).recordset[0];if(blocked?.blocking_session_id===a)break;await new Promise(r=>setTimeout(r,50));}
  assert.equal(blocked?.blocking_session_id,a,'Must observe real concurrent lock blocking.');assert.match(blocked.wait_type,/^LCK/);
  await first.request().batch('COMMIT TRANSACTION;');const result=await waiting,s=await state(pool,user);
  if(changeRole){assert.equal(result.number,50301);assert.equal(s.profiles.length,0);assert.equal(s.user.HoTen,'R46 original '+user.role);}
  else{assert.ok(result.value);assert.equal(s.user.HoTen,'R46 race second');assert.equal(s.profiles.length,staff?0:1);if(!staff){assert.equal(s.profiles[0].NgaySinh.toISOString().slice(0,10),'1992-04-03');assert.equal(s.profiles[0].GioiTinh,'Nữ');assert.equal(s.profiles[0].DiemTichLuy,profile?23:0);}}
  for(const p of [first,second])assert.deepEqual((await p.request().query('SELECT @@TRANCOUNT n,XACT_STATE() s')).recordset[0],{n:0,s:0});
  report.races.push({name,status:'PASS',sessions:[a,b],observedBlocking:blocked,profileCount:s.profiles.length,error:result.number});pass(name);
 }finally{await first.request().batch('IF @@TRANCOUNT>0 ROLLBACK;').catch(()=>{});await waiting;await first.close();await second.close();await reset(pool,user,profile);}
}
try{
 before=await snapshot(pool);fixtures=await createFixtures(pool);const [customer,manager,support,admin,custom]=fixtures.users;
 const tokens={};for(const u of fixtures.users){const logged=await api('login '+u.role,'/auth/login',{method:'POST',body:{Email:u.email,MatKhau:'123456'}});assert.equal(logged.user.role,u.role);tokens[u.role]=logged.token;}
 await update(pool,customer,{HoTen:'R46 Customer common',SoDienThoai:'0909460001',NgaySinh:'1990-02-01',GioiTinh:'Nam'});
 let s=await state(pool,customer);assert.equal(s.user.HoTen,'R46 Customer common');assert.equal(s.user.SoDienThoai,'0909460001');assert.equal(s.profiles[0].DiemTichLuy,23);pass('R4.6-01 Customer common');
 await update(pool,customer,{NgaySinh:'1995-06-07',GioiTinh:'Nữ'});s=await state(pool,customer);assert.equal(s.profiles[0].NgaySinh.toISOString().slice(0,10),'1995-06-07');assert.equal(s.profiles[0].GioiTinh,'Nữ');assert.equal(s.profiles[0].DiemTichLuy,23);pass('R4.6-02 Customer specific, points preserved');
 await reset(pool,customer);for(let i=0;i<3;i++)await update(pool,customer);s=await state(pool,customer);assert.equal(s.profiles.length,1);assert.deepEqual({date:s.profiles[0].NgaySinh,gender:s.profiles[0].GioiTinh,points:s.profiles[0].DiemTichLuy},{date:null,gender:null,points:0});pass('R4.6-03/16 missing Customer valid NULL profile, repeated no duplicate');
 for(const [i,u] of [manager,support,admin].entries()){
  await reset(pool,u);const old=await state(pool,u);for(let n=0;n<3;n++)await update(pool,u,{HoTen:'R46 staff '+n});s=await state(pool,u);assert.equal(s.user.HoTen,'R46 staff 2');assert.equal(s.profiles.length,0);
  assert.deepEqual({...s.user,HoTen:old.user.HoTen},old.user);pass(`R4.6-${4+i*2}/${5+i*2} ${u.role} common repeated, no profile/role/security change`);
  await reject(u,{NgaySinh:'1990-02-01'},50301);await reject(u,{GioiTinh:'Nam'},50301);pass('non-Customer specific rejected '+u.role);
  await reset(pool,u,true);const anomaly=await state(pool,u);await update(pool,u);assert.deepEqual((await state(pool,u)).profiles,anomaly.profiles);await reject(u,{GioiTinh:'Nữ'},50301);pass('R4.6-18 abnormal staff profile preserved '+u.role);
 }
 await reset(pool,custom);await update(pool,custom);assert.equal((await state(pool,custom)).profiles.length,0);await reject(custom,{GioiTinh:'Nam'},50301);pass('R4.6-17 schema-valid custom role common only');
 await reset(pool,customer,true);await reject(customer,{NgaySinh:'2999-01-01'},50400);await reject(customer,{GioiTinh:'invalid'},547);await reject(customer,{HoTen:null},515);
 await reset(pool,customer);await reject(customer,{GioiTinh:'invalid'},547);pass('R4.6-11/14 invalid existing/missing profile constraints roll back common write');
 await reset(pool,manager);await update(pool,manager,{SoDienThoai:'0909460002'});await reject(customer,{SoDienThoai:'0909460002'},50015);pass('duplicate phone existing domain error, no writes');
 await reject({id:-2147483000},{},50300);pass('R4.6-13 missing user no profile');
 for(const status of ['Bị khóa','Chưa kích hoạt']){await pool.request().input('ID',sql.Int,customer.id).input('Status',sql.NVarChar(50),status).query('UPDATE dbo.NGUOIDUNG SET TrangThai=@Status WHERE NguoiDungID=@ID');await reject(customer,{},50300);await api('account status '+status,'/auth/me',{token:tokens.KHACH_HANG,body:{HoTen:'Forbidden'},status:401,code:'UNAUTHENTICATED'});}
 await reset(pool,customer,true);pass('SQL and HTTP live inactive account rejection');
 await assert.rejects(pool.request().input('NguoiDungID',sql.Int,admin.id).input('HoTen',sql.NVarChar(100),'Spoof').input('Role',sql.VarChar(50),'KHACH_HANG').execute('dbo.sp_User_UpdateProfile'),e=>[8144,8145].includes(e.number));pass('direct SP has no trusted client role parameter');
 // Before Frontend correction: the existing form re-sends anomalous Staff birthday/gender.
 await reset(pool,admin,true);const dto=(await api('old form Staff load','/auth/me',{method:'GET',token:tokens.ADMIN})).user;
 const oldForm={HoTen:'R46 common edit old form',SoDienThoai:dto.phone||null,NgaySinh:dto.birthday||null,GioiTinh:dto.gender||null};
 const unchanged=await state(pool,admin);await api('old Profile form common edit blocked','/auth/me',{token:tokens.ADMIN,body:oldForm,status:403,code:'FORBIDDEN'});assert.deepEqual(await state(pool,admin),unchanged);
 write(path.join(evidenceRoot,'frontend-compatibility.json'),{status:'REPRODUCED',source:'frozen Task13 Profile form',database,request:oldForm,http:403,code:'FORBIDDEN',unchanged:true,reason:'Existing Staff profile values are auto-submitted by common edit; editable Customer fields also exposed to every role.'});pass('direct Frontend compatibility defect reproduced with actual old payload and real HTTP/SQL');
 for(const u of fixtures.users){await reset(pool,u,u.role==='KHACH_HANG');const old=await state(pool,u);const response=await api('profile write '+u.role,'/auth/me',{token:tokens[u.role],body:{HoTen:'R46 HTTP '+u.role,SoDienThoai:null,...(u.role==='KHACH_HANG'?{NgaySinh:'1993-05-04',GioiTinh:'Nữ'}:{})}});assert.deepEqual(Object.keys(response),['user']);const me=(await api('profile reload '+u.role,'/auth/me',{method:'GET',token:tokens[u.role]})).user;s=await state(pool,u);assert.equal(me.name,s.user.HoTen);assert.equal(me.role,u.role);assert.equal(me.birthday,u.role==='KHACH_HANG'?'1993-05-04':null);assert.equal(s.profiles.length,u.role==='KHACH_HANG'?1:0);assert.deepEqual({...s.user,HoTen:old.user.HoTen},old.user);pass('real typed API write/read-after-write '+u.role);}
 await api('NULL/omitted Customer clears optional','/auth/me',{token:tokens.KHACH_HANG,body:{HoTen:'R46 NULL'}});s=await state(pool,customer);assert.equal(s.profiles[0].NgaySinh,null);assert.equal(s.profiles[0].GioiTinh,null);assert.equal(s.profiles[0].DiemTichLuy,23);pass('HTTP PUT optional omitted is NULL, existing points unchanged');
 for(const field of ['role','roleId','userId','NguoiDungID','permissions','TrangThai','Email','MatKhau','DiemTichLuy']){const stable=await snapshot(pool);await api('spoof '+field,'/auth/me',{token:tokens.ADMIN,body:{HoTen:'Spoof', [field]:field==='role'?'KHACH_HANG':customer.id},status:400});assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));}
 await api('unauthenticated profile','/auth/me',{body:{HoTen:'Spoof'},status:401,code:'UNAUTHENTICATED'});await api('invalid JWT','/auth/me',{token:'invalid',body:{HoTen:'Spoof'},status:401,code:'UNAUTHENTICATED'});pass('R4.6-10/20 identity, role/owner/security whitelist spoofing rejected, all tables unchanged');
 await api('staff specific HTTP','/auth/me',{token:tokens.ADMIN,body:{HoTen:'Denied',GioiTinh:'Nam'},status:403,code:'FORBIDDEN'});
 await api('phone assigned HTTP','/auth/me',{token:tokens.ADMIN,body:{HoTen:'Denied',SoDienThoai:'0909460002'},status:200});
 await api('phone conflict Customer HTTP','/auth/me',{token:tokens.KHACH_HANG,body:{HoTen:'Denied',SoDienThoai:'0909460002'},status:409,code:'PHONE_IN_USE'});pass('HTTP existing 403/409 error contracts');
 // Change role after authentication but before the actual, unmodified typed service executes.
 await reset(pool,customer);authService.updateProfile=async(id,fields)=>{assert.equal(id,customer.id);await role(customer,'ADMIN');return originalUpdate(id,fields);};
 const old=await state(pool,customer);await api('DB role changed after auth','/auth/me',{token:tokens.KHACH_HANG,body:{HoTen:'Must not commit',NgaySinh:'1990-02-01'},status:403,code:'FORBIDDEN'});s=await state(pool,customer);assert.equal(s.user.HoTen,old.user.HoTen);assert.equal(s.profiles.length,0);authService.updateProfile=originalUpdate;await reset(pool,customer,true);pass('current SQL role overrides previously authenticated Customer role');
 await reset(pool,admin);authService.updateProfile=async(id,fields)=>{assert.equal(id,admin.id);await role(admin,'KHACH_HANG');return originalUpdate(id,fields);};
 const switched=await api('SQL role now Customer','/auth/me',{token:tokens.ADMIN,body:{HoTen:'Now Customer',GioiTinh:'Nam'}});assert.equal(switched.user.role,'KHACH_HANG');assert.equal((await state(pool,admin)).profiles.length,1);authService.updateProfile=originalUpdate;await reset(pool,admin);pass('current SQL Customer role permits creation with old identity-only JWT');
 // A temporary fixture-scoped trigger throws after the first common write.
 assert.equal((await pool.request().query("SELECT OBJECT_ID('dbo.R46_ProfileFailure') id")).recordset[0].id,null);
 await batches(pool,read(path.join(root,'database/11_tests/profile/update_rollback.sql')));triggerCreated=true;
 for(const exists of [true,false]){
  await reset(pool,customer,exists);const old=await state(pool,customer);
  await pool.request().input('ID',sql.Int,customer.id).query("EXEC sys.sp_set_session_context @key=N'R46FailureID',@value=@ID");
  await reject(customer,{HoTen:'R46 fault after common',GioiTinh:'Nữ'},51046);
  const observed=(await pool.request().query("SELECT CONVERT(nvarchar(100),SESSION_CONTEXT(N'R46ObservedName')) name")).recordset[0].name;assert.equal(observed,'R46 fault after common');assert.deepEqual(await state(pool,customer),old);
  await pool.request().query("EXEC sys.sp_set_session_context @key=N'R46FailureID',@value=NULL;EXEC sys.sp_set_session_context @key=N'R46ObservedName',@value=NULL");pass('R4.6-12 real injected profile '+(exists?'UPDATE':'INSERT')+' failure restores both tables, no open transaction',{observedCommonWrite:observed});
 }
 for(const exists of [true,false]){await reset(pool,customer,exists);const old=await state(pool,customer);const failed=await api('HTTP actual profile fault '+exists,'/auth/me',{token:tokens.KHACH_HANG,body:{HoTen:'R46 HTTP fault',GioiTinh:'Nữ'},status:500,code:'EREQUEST'});assert.equal(failed.error.message,'Internal server error');assert.deepEqual(await state(pool,customer),old);pass('HTTP actual SQL failure '+(exists?'UPDATE':'INSERT')+' restores both tables and hides SQL details');}
 await reset(pool,admin,true);await pool.request().input('ID',sql.Int,admin.id).query("EXEC sys.sp_set_session_context @key=N'R46FailureID',@value=@ID");await update(pool,admin);assert.equal((await state(pool,admin)).profiles[0].DiemTichLuy,23);assert.equal((await pool.request().query("SELECT SESSION_CONTEXT(N'R46ObservedName') name")).recordset[0].name,null);await pool.request().query("EXEC sys.sp_set_session_context @key=N'R46FailureID',@value=NULL");pass('staff anomaly never fires profile trigger (no HS write)');
 await pool.request().batch('DROP TRIGGER dbo.R46_ProfileFailure;');triggerCreated=false;
 // Caller owns the transaction: success does not commit, committable error rolls back only the savepoint.
 await reset(pool,customer,true);const outerBefore=await state(pool,customer);
 await pool.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');await update(pool,customer,{HoTen:'Outer success',GioiTinh:'Nữ'});assert.equal((await pool.request().query('SELECT @@TRANCOUNT n')).recordset[0].n,1);await pool.request().batch('ROLLBACK;');assert.deepEqual(await state(pool,customer),outerBefore);pass('caller success remains uncommitted and caller rollback restores both');
 await pool.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');await pool.request().input('ID',sql.Int,admin.id).query("UPDATE dbo.NGUOIDUNG SET HoTen=N'Outer marker' WHERE NguoiDungID=@ID");await assert.rejects(update(pool,customer,{HoTen:'Failed inner',GioiTinh:'invalid'}),e=>e.number===547);assert.deepEqual((await pool.request().query('SELECT @@TRANCOUNT n,XACT_STATE() s')).recordset[0],{n:1,s:1});assert.equal((await state(pool,admin)).user.HoTen,'Outer marker');assert.deepEqual(await state(pool,customer),outerBefore);await pool.request().batch('ROLLBACK;');await noTransaction();pass('committable error rolls back SP savepoint, preserves caller prior work');
 await pool.request().batch('SET XACT_ABORT ON;BEGIN TRANSACTION;');await assert.rejects(update(pool,customer,{HoTen:'Doomed',GioiTinh:'invalid'}),e=>e.number===547);await noTransaction();assert.deepEqual(await state(pool,customer),outerBefore);await pool.request().batch('SET XACT_ABORT OFF;');pass('doomed caller transaction rolled back fully, no partial writes');
 await race('R4.6-19 concurrent missing Customer creates exactly one whole profile',customer);
 await race('concurrent existing Customer update produces whole last update',customer,{profile:true});
 await race('concurrent Staff common-only never creates profile',manager,{staff:true});
 await race('concurrent role change rechecked after real blocking',customer,{changeRole:true});
 await cleanup(pool,fixtures);fixtures=null;await noTransaction();const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
 Object.assign(report,{status:'PASS',cleanup:'PASS',before:summarize(before),after:summarize(after),finishedAt:new Date().toISOString()});
 console.log(`PASS profile: ${report.cases.length} SQL/HTTP cases; ${report.requests.length} HTTP requests; ${report.races.length} real two-session races; 27 tables and all metadata restored.`);
}catch(error){report.status='FAIL';report.error=error.message;throw error;}
finally{authService.updateProfile=originalUpdate;await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;').catch(()=>{});if(triggerCreated)await pool.request().batch('DROP TRIGGER dbo.R46_ProfileFailure;');if(fixtures)await cleanup(pool,fixtures);write(path.join(evidenceRoot,'profile-tests.json'),report);await new Promise(r=>server.close(r));await closePool();await pool.close();}

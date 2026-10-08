import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,database,disposable,env,connect,snapshot,summarize,write,evidenceRoot} from './common.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const {authService}=await import('../../backend/src/services/authService.js');
const {env:config}=await import('../../backend/src/config/env.js');
const {verifyToken}=await import('../../backend/src/utils/jwt.js');
const {verifyPassword}=await import('../../backend/src/utils/password.js');
const policy=config.authRateLimit,downstream={login:0,register:0},originalLogin=authService.login,originalRegister=authService.registerCustomer;
authService.login=async input=>{downstream.login++;return originalLogin(input);};
authService.registerCustomer=async input=>{downstream.register++;return originalRegister(input);};
let time=0,before,canClean=false,userId;
const pool=await connect(),app=createApp({authRateLimit:{now:()=>time}}),server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,spent={login:0,register:0};
const emails=['r45-auth@example.test','r45-blocked@example.test','r45-phone@example.test'];
const registration={HoTen:'R45 Auth Fixture',Email:emails[0],MatKhau:'R45-Password-123!',SoDienThoai:'0909450001',NgaySinh:'1990-02-01',GioiTinh:'Nam'};
const report={status:'RUNNING',database,startedAt:new Date().toISOString(),policy,trustProxy:app.get('trust proxy'),cases:[],requests:[],downstream};
const pass=(name,details={})=>report.cases.push({name,status:'PASS',...details});
async function api(name,route,{method='POST',body={},raw,token,status=200,code,headers={}}={}){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},...(method==='GET'?{}:{body:raw??JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const value=await response.json().catch(()=>null);
 report.requests.push({name,route,method,status:response.status,expected:status,error:value?.error?.code,retryAfter:response.headers.get('retry-after')});
 assert.equal(response.status,status,`${name}: ${value?.error?.code}`);if(code)assert.equal(value.error.code,code);
 if(route==='/auth/login'&&method==='POST'&&status!==429)spent.login++;
 if(route==='/auth/register'&&method==='POST'&&status!==429)spent.register++;
 return value;
}
async function cleanup(){
 if(canClean)await pool.request().input('First',sql.VarChar(150),emails[0]).input('Blocked',sql.VarChar(150),emails[1]).input('Phone',sql.VarChar(150),emails[2]).query('DELETE h FROM dbo.HOSOKHACHHANG h JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=h.NguoiDungID WHERE n.Email IN(@First,@Blocked,@Phone);DELETE dbo.NGUOIDUNG WHERE Email IN(@First,@Blocked,@Phone)');
}
try{
 before=await snapshot(pool);
 const collision=(await pool.request().input('First',sql.VarChar(150),emails[0]).input('Blocked',sql.VarChar(150),emails[1]).input('Phone',sql.VarChar(150),emails[2]).input('Number',sql.VarChar(20),registration.SoDienThoai).query('SELECT COUNT(*) n FROM dbo.NGUOIDUNG WHERE Email IN(@First,@Blocked,@Phone) OR SoDienThoai=@Number')).recordset[0].n;
 assert.equal(collision,0,'Never overwrite a preexisting fixture account.');canClean=true;
 const registered=await api('valid registration','/auth/register',{body:registration,status:201});userId=registered.user.userId;
 assert.deepEqual(Object.keys(registered).sort(),['message','user']);assert.equal(registered.message,'Registration completed. Please sign in.');assert.equal(registered.user.role,'KHACH_HANG');assert.equal('token' in registered,false);
 const stored=(await pool.request().input('ID',sql.Int,userId).query('SELECT n.MatKhau,h.NgaySinh,h.GioiTinh,h.DiemTichLuy FROM dbo.NGUOIDUNG n JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=n.NguoiDungID WHERE n.NguoiDungID=@ID')).recordset[0];
 assert.match(stored.MatKhau,/^\$2[aby]\$/);assert.equal(await verifyPassword(registration.MatKhau,stored.MatKhau),true);assert.equal(stored.DiemTichLuy,0);assert.equal(stored.NgaySinh.toISOString().slice(0,10),'1990-02-01');
 pass('valid registration follows real typed SP gateway and creates only Customer/profile',{userId,passwordHashVerified:true,profile:'PASS',successContract:'unchanged'});
 const authenticated=await api('new user valid login','/auth/login',{body:{Email:registration.Email,MatKhau:registration.MatKhau}}),ownToken=authenticated.token;
 assert.deepEqual(Object.keys(authenticated).sort(),['expiresIn','token','user']);assert.equal(verifyToken(ownToken).userId,userId);
 const claims=JSON.parse(Buffer.from(ownToken.split('.')[1],'base64url'));assert.deepEqual(Object.keys(claims).sort(),['exp','iat','sub']);assert.equal(claims.sub,String(userId));assert.ok(claims.exp>claims.iat);
 const me=(await api('own JWT current user','/auth/me',{method:'GET',token:ownToken})).user;assert.equal(me.userId,userId);assert.equal(me.role,'KHACH_HANG');assert.equal(me.birthday,'1990-02-01');assert.ok(me.permissions.some(p=>p.code==='DAT_VE'));
 pass('registered user login bcrypt JWT and live identity unchanged',{claims:{keys:Object.keys(claims).sort(),subject:claims.sub},permissions:me.permissions.map(p=>p.code)});
 await api('invalid password','/auth/login',{body:{Email:registration.Email,MatKhau:'wrong-password'},status:401,code:'INVALID_CREDENTIALS'});
 await api('unknown account','/auth/login',{body:{Email:emails[1],MatKhau:'wrong-password'},status:401,code:'INVALID_CREDENTIALS'});
 pass('under-limit invalid/unknown credentials keep existing generic401');
 const stable=await snapshot(pool);
 await api('duplicate email','/auth/register',{body:registration,status:409,code:'EMAIL_IN_USE'});
 await api('duplicate phone','/auth/register',{body:{...registration,Email:emails[2]},status:409,code:'PHONE_IN_USE'});
 await api('malformed registration','/auth/register',{body:{},status:400,code:'INVALID_REQUEST'});
 await api('role escalation','/auth/register',{body:{...registration,role:'ADMIN'},status:400,code:'ACCESS_FIELDS_NOT_ALLOWED'});
 assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));pass('invalid/duplicate registration contracts and no-write rollback unchanged');
 const tokens={};
 for(const [role,email] of [['KHACH_HANG','khachhang1@gmail.com'],['QUAN_LY_RAP','manager.q1@cinemadb.vn'],['CSKH','cskh@cinemadb.vn'],['ADMIN','admin@cinemadb.vn']]){
  const result=await api('seed login '+role,'/auth/login',{body:{Email:email,MatKhau:'123456'}});tokens[role]=result.token;
  assert.equal(result.user.role,role);
  const identity=(await api('live identity '+role,'/auth/me',{method:'GET',token:result.token})).user;
  assert.equal(identity.role,role);
  const grants=(await pool.request().input('ID',sql.Int,identity.userId).query('SELECT q.MaQuyen FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO_QUYEN g ON g.VaiTroID=n.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=g.QuyenID WHERE n.NguoiDungID=@ID ORDER BY q.MaQuyen')).recordset.map(r=>r.MaQuyen);
  assert.deepEqual(identity.permissions.map(p=>p.code).sort(),grants);
  assert.equal(identity.cinemaAssignments.length>0,role==='QUAN_LY_RAP');
  pass('real login JWT/current permissions/assignments '+role,{permissions:grants,assignments:identity.cinemaAssignments.length});
 }
 await api('Customer cannot access Admin','/admin/users',{method:'GET',token:ownToken,status:403});
 await api('Admin authorized read','/admin/users',{method:'GET',token:tokens.ADMIN});
 await api('Manager authorized read','/manager/cinemas',{method:'GET',token:tokens.QUAN_LY_RAP});
 await api('Support authorized read','/support/complaints',{method:'GET',token:tokens.CSKH});
 pass('real four-role RBAC and non-auth endpoints preserved');
 await pool.request().input('ID',sql.Int,userId).query("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Bị khóa' WHERE NguoiDungID=@ID");
 await api('locked login','/auth/login',{body:{Email:registration.Email,MatKhau:registration.MatKhau},status:401,code:'INVALID_CREDENTIALS'});
 await api('old JWT locked user','/auth/me',{method:'GET',token:ownToken,status:401,code:'UNAUTHENTICATED'});
 await pool.request().input('ID',sql.Int,userId).query("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Hoạt động' WHERE NguoiDungID=@ID");
 await api('restored user old JWT','/auth/me',{method:'GET',token:ownToken});pass('account status and existing JWT live recheck unchanged');
 for(const endpoint of ['login','register']){
  const maximum=endpoint==='login'?policy.loginMax:policy.registerMax;
  assert.ok(spent[endpoint]<maximum,'Normal regression must fit the real policy.');
  while(spent[endpoint]<maximum)await api('counted invalid input '+endpoint,'/auth/'+endpoint,{body:{},status:400,code:'INVALID_REQUEST'});
  const unchanged=await snapshot(pool),count=downstream[endpoint];
  const body=endpoint==='login'?{Email:registration.Email,MatKhau:registration.MatKhau}:{...registration,Email:emails[1],SoDienThoai:null};
  await api('valid credentials beyond threshold '+endpoint,'/auth/'+endpoint,{body,status:429,code:'RATE_LIMIT_EXCEEDED'});
  assert.equal(downstream[endpoint],count);assert.deepEqual(summarize(await snapshot(pool)),summarize(unchanged));
  assert.equal(report.requests.at(-1).retryAfter,String(Math.ceil(policy.windowMs/1000)));
  pass('R4.5-'+(endpoint==='login'?'07':'08')+' '+endpoint+' beyond production threshold never calls actual service/SQL',{maximum,downstreamBefore:count,downstreamAfter:downstream[endpoint],allRowsUnchanged:true});
 }
 for(let i=0;i<3;i++)await api('forged headers cannot bypass','/auth/login',{headers:{'X-Forwarded-For':`203.0.113.${i+1}`,'Forwarded':`for=203.0.113.${i+1}`},status:429,code:'RATE_LIMIT_EXCEEDED'});
 await api('health after limiter saturation','/health',{method:'GET'});await api('authenticated me after login saturated','/auth/me',{method:'GET',token:ownToken});await api('Admin after saturation','/admin/users',{method:'GET',token:tokens.ADMIN});
 pass('spoof resistance and other endpoints work with login/register counters exhausted');
 time=policy.windowMs-1;await api('last millisecond before expiry','/auth/login',{status:429,code:'RATE_LIMIT_EXCEEDED'});assert.equal(report.requests.at(-1).retryAfter,'1');
 time=policy.windowMs;spent.login=0;spent.register=0;
 const retry=await api('valid login exact window expiry','/auth/login',{body:{Email:registration.Email,MatKhau:registration.MatKhau}});assert.equal(verifyToken(retry.token).userId,userId);
 await api('register recovered after expiry','/auth/register',{body:registration,status:409,code:'EMAIL_IN_USE'});
 pass('R4.5-04/10 exact expiry allows manual retry through real auth SP without sleeps');
 await cleanup();canClean=false;
 const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
 Object.assign(report,{status:'PASS',cleanup:'PASS',before:summarize(before),after:summarize(after),finishedAt:new Date().toISOString()});
 write(path.join(evidenceRoot,'auth-tests.json'),report);console.log(`PASS real auth SQL/HTTP: ${report.cases.length} cases, ${report.requests.length} requests; normal four-role/JWT/register,429 short-circuit, expiry and full cleanup.`);
}catch(error){report.status='FAIL';report.error=error.message;write(path.join(evidenceRoot,'auth-tests.json'),report);throw error;}
finally{await cleanup();authService.login=originalLogin;authService.registerCustomer=originalRegister;await new Promise(r=>server.close(r));await closePool();await pool.close();}

import assert from 'node:assert/strict';
import path from 'node:path';
import { database,env,root,connect,snapshot,summarize,write,read,evidenceRoot,normalizeModule } from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const mode=process.argv.find(arg=>arg.startsWith('--mode='))?.slice(7)??'isolation';
assert.ok(['isolation','readonly'].includes(mode));
const pool=await connect(),e={database,mode,at:new Date().toISOString(),status:'RUNNING'};let server,closePool;
try{
 const before=await snapshot(pool);
 if(mode==='isolation'){
  const expected=JSON.parse(read(path.join(evidenceRoot,'audit-before.json'))).main;
  assert.deepEqual(summarize(before),expected);e.before=expected;e.after=summarize(before);e.noTestWritesToMain='PASS';
 }else{
  Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
  const {createApp}=await import('../../backend/src/app.js');({closePool}=await import('../../backend/src/db/pool.js'));
  server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  e.http=[];
  for(const [role,email] of [['KHACH_HANG','khachhang1@gmail.com'],['QUAN_LY_RAP','manager.q1@cinemadb.vn'],['CSKH','cskh@cinemadb.vn'],['ADMIN','admin@cinemadb.vn']]){
   const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:email,MatKhau:'123456'})});assert.equal(login.status,200);const {token}=await login.json();assert.ok(token);
   const response=await fetch(base+'/auth/me',{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200);const dto=await response.json();assert.equal(dto.user.role,role);
   const permissions=await fetch(base+'/auth/permissions',{headers:{Authorization:'Bearer '+token}});assert.equal(permissions.status,200);
   e.http.push({role,login:200,profile:response.status,permissions:permissions.status,user:{userId:dto.user.userId,role:dto.user.role,name:dto.user.name,birthday:dto.user.birthday,gender:dto.user.gender,loyaltyPoints:dto.user.loyaltyPoints}});
  }
  const signature=before.metadata.parameters.filter(row=>row.objectName==='sp_Order_GetDetailByCustomer');assert.equal(signature.length,2);e.parameters=signature;
  const manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
  assert.deepEqual(before.metadata.parameters,manifest.expected.parameters);
  for(const [name,file] of Object.entries(manifest.modules)){
   const source=read(path.join(root,'database',file)),match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);
   assert.ok(match,name);
   assert.equal(normalizeModule(before.metadata.objects.find(row=>row.name===name).definition),normalizeModule(source.slice(match.index).replace(/\s+GO\s*$/i,'')),name);
  }
  e.allModuleSourceParity={status:'PASS',modules:Object.keys(manifest.modules).length};e.allParameterParity='PASS';
  const existing=(await pool.request().query("SELECT TOP(1) d.DonDatVeID,n.Email FROM dbo.DONDATVE d JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=d.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' ORDER BY d.DonDatVeID")).recordset[0];
  // Main has no orders at the frozen baseline. Never create a positive fixture here.
  assert.equal(existing,undefined);assert.equal(before.data.find(r=>r.table==='DONDATVE').rows,0);
  const logged=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'khachhang1@gmail.com',MatKhau:'123456'})});assert.equal(logged.status,200);const token=(await logged.json()).token;
  const response=await fetch(base+'/orders/2147483647',{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,404);assert.equal((await response.json()).error.code,'ORDER_NOT_FOUND');
  e.detailGet={method:'GET',endpoint:'/api/orders/2147483647',status:404,code:'ORDER_NOT_FOUND',positive:'N/A: main has zero persisted orders; positive/expired/fault/race proof exclusively disposable DB'};
  const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.readOnly='PASS';
 }
 e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,mode==='isolation'?'main-test-isolation.json':'main-readonly.json'),e);if(server)await new Promise(resolve=>server.close(resolve));if(closePool)await closePool();await pool.close();}
console.log(`PASS main ${mode}:27 tables/data/metadata fingerprint verified.`);

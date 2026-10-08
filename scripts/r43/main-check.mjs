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
  const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'admin@cinemadb.vn',MatKhau:'123456'})});assert.equal(login.status,200);const {token}=await login.json();assert.ok(token);
  const response=await fetch(base+'/admin/pricing',{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200);const dto=await response.json();
  assert.ok(Array.isArray(dto.pricing));
  const keys=['GiaID','RapID','TenRap','LoaiGhe','LoaiNgay','DinhDang','PhuThu','NgayBatDau','NgayKetThuc','TrangThai'];
  for(const row of dto.pricing)assert.deepEqual(Object.keys(row),keys);
  const signature=before.metadata.parameters.filter(row=>row.objectName==='usp_Admin_Pricing_Update');
  assert.equal(signature.length,10);e.parameters=signature;
  const manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
  assert.deepEqual(before.metadata.parameters,manifest.expected.parameters);
  for(const [name,file] of Object.entries(manifest.modules)){
   const source=read(path.join(root,'database',file)),match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);
   assert.ok(match,name);
   assert.equal(normalizeModule(before.metadata.objects.find(row=>row.name===name).definition),normalizeModule(source.slice(match.index).replace(/\s+GO\s*$/i,'')),name);
  }
  e.allModuleSourceParity={status:'PASS',modules:Object.keys(manifest.modules).length};e.allParameterParity='PASS';
  const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.http={method:'GET',endpoint:'/api/admin/pricing',status:response.status,response:dto};e.readOnly='PASS';
 }
 e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,mode==='isolation'?'main-test-isolation.json':'main-readonly.json'),e);if(server)await new Promise(resolve=>server.close(resolve));if(closePool)await closePool();await pool.close();}
console.log(`PASS main ${mode}:27 tables/data/metadata fingerprint verified.`);

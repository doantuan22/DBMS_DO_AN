import assert from 'node:assert/strict';
import path from 'node:path';
import { database,env,root,connect,snapshot,summarize,write,read,evidenceRoot } from './common.mjs';
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
  const response=await fetch(base+'/admin/reports/revenue',{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200);const dto=await response.json();
  assert.deepEqual(Object.keys(dto),['summary','byCinema','byMovie','byDate','cinemas','totals']);assert.deepEqual(dto.cinemas,dto.byCinema);assert.deepEqual(dto.totals,dto.summary);
  assert.ok(Array.isArray(dto.byCinema)&&Array.isArray(dto.byMovie)&&Array.isArray(dto.byDate));
  const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.http={method:'GET',endpoint:'/api/admin/reports/revenue',status:response.status,response:dto};e.readOnly='PASS';
 }
 e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,mode==='isolation'?'main-test-isolation.json':'main-readonly.json'),e);if(server)await new Promise(resolve=>server.close(resolve));if(closePool)await closePool();await pool.close();}
console.log(`PASS main ${mode}:27 tables/data/metadata fingerprint verified.`);

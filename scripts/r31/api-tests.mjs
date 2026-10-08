import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,env,root,connect,snapshot,summarize,read,write,evidenceRoot } from './common.mjs';
import { createFixture,cleanupFixture,state,list,assertPersisted,cleanSession,set } from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const url=`http://127.0.0.1:${server.address().port}/api`,tokens={},e={database,startedAt:new Date().toISOString(),status:'RUNNING',requests:[],cases:[]};let f,permissionRemoved=false;
async function api(role,method,route,body,expected,raw=false){
 const response=await fetch(url+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body!==undefined?{body:raw?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)}),result=await response.json();
 e.requests.push({role,method,route,status:response.status,expected,...(result.error?{error:result.error}:{})});assert.equal(response.status,expected,JSON.stringify(result));
 if(result.error)assert.ok(!/dbo\.|nvarchar|SELECT|THROW|stack|connection|51031|Injected/i.test(JSON.stringify(result.error)));
 return result;
}
async function readCast(expected){
 const publicDetail=await api('none','GET',`/movies/${f.movie}`,undefined,200);assert.deepEqual(publicDetail.actors.map(r=>({DienVienID:r.id,VaiDien:r.role})).sort((a,b)=>a.DienVienID-b.DienVienID),expected.map(r=>({DienVienID:r.DienVienID,VaiDien:r.VaiDien??null})).sort((a,b)=>a.DienVienID-b.DienVienID));
 const adminList=await api('admin','GET','/admin/movies',undefined,200),movie=adminList.movies.find(r=>r.PhimID===f.movie);
 // The existing DISTINCT/correlated read emits SQL NULL for an empty cast;
 // public detail emits [], and the existing editor hydrates NULL as [].
 if(expected.length===0)assert.ok(movie.DanhSachDienVienJson===null||movie.DanhSachDienVienJson==='[]');
 else assert.equal(typeof movie.DanhSachDienVienJson,'string');
 const adminCast=JSON.parse(movie.DanhSachDienVienJson??'[]');assert.deepEqual(adminCast,expected.map(r=>({actorId:r.DienVienID,...(r.VaiDien==null?{}:{role:r.VaiDien})})).sort((a,b)=>a.actorId-b.actorId));
 return {publicActors:publicDetail.actors,adminRawCast:movie.DanhSachDienVienJson,adminCast};
}
try{
 const before=await snapshot(pool);f=await createFixture(pool);const initial=await state(pool,f),good=list(f),body={cast:good.map(r=>({actorId:r.DienVienID,role:r.VaiDien}))},route=`/admin/movies/${f.movie}/actors`;
 for(const [role,Email] of [['admin','admin@cinemadb.vn'],['customer','khachhang1@gmail.com']])tokens[role]=(await api(role,'POST','/auth/login',{Email,MatKhau:'123456'},200)).token;
 const reply=await api('admin','PUT',route,body,200);assert.deepEqual(reply.actors.map(({DienVienID,VaiDien})=>({DienVienID,VaiDien})),good);await assertPersisted(pool,f,good,initial);
 e.cases.push({name:'valid-replace-three-with-two',response:reply,reads:await readCast(good),final:await state(pool,f),status:'PASS'});
 const cases=[['one-invalid',{cast:[...body.cast,{actorId:2147483647,role:'bad'}]},404,'ACTOR_NOT_FOUND'],['all-invalid',{cast:[{actorId:2147483647,role:'bad'},{actorId:2147483646,role:'bad'}]},404,'ACTOR_NOT_FOUND'],['duplicate',{cast:[body.cast[0],{...body.cast[0],role:'different'}]},400,'MOVIE_CAST_INVALID'],['movie-missing',body,404,'MOVIE_NOT_FOUND',`/admin/movies/2147483647/actors`],['null-cast',{cast:null},400,'INVALID_REQUEST'],['omitted-cast',{},400,'INVALID_REQUEST'],['object-cast',{cast:{}},400,'INVALID_REQUEST'],['missing-id',{cast:[{role:'bad'}]},400,'INVALID_REQUEST'],['string-id',{cast:[{actorId:String(good[0].DienVienID),role:'bad'}]},400,'INVALID_REQUEST'],['role-too-long',{cast:[{actorId:good[0].DienVienID,role:'x'.repeat(151)}]},400,'INVALID_REQUEST'],['null-role',{cast:[{actorId:good[0].DienVienID,role:null}]},400,'INVALID_REQUEST'],['spoof-admin',{...body,ActorID:f.admin},400,'UNKNOWN_REQUEST_FIELD'],['non-admin',body,403,'ADMIN_REQUIRED',route,'customer'],['unauthenticated',body,401,'UNAUTHENTICATED',route,'none']];
 for(const [name,input,code,errorCode,path=route,role='admin'] of cases){const pre=await snapshot(pool),start=await state(pool,f),response=await api(role,'PUT',path,input,code);assert.equal(response.error.code,errorCode);assert.deepEqual(await state(pool,f),start);assert.deepEqual((await snapshot(pool)).data,pre.data);e.cases.push({name,response,initial:start,reads:await readCast(good),final:await state(pool,f),status:'PASS'});}
 const malformedStart=await state(pool,f),malformed=await api('admin','PUT',route,'{"cast":[',400,true);assert.deepEqual(await state(pool,f),malformedStart);e.cases.push({name:'malformed-http-json',response:malformed,reads:await readCast(good),final:await state(pool,f),status:'PASS'});
 // Existing Admin identity remains ADMIN; remove only its live role grant and
 // restore the exact datetime2(7) row from a session-local table, including on fail.
 await pool.request().batch(`SELECT vq.* INTO #R31Permission FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG n ON n.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE n.NguoiDungID=${f.admin} AND q.MaQuyen='QL_DANHMUC_PHIM';DELETE vq FROM dbo.VAITRO_QUYEN vq JOIN #R31Permission p ON p.VaiTroID=vq.VaiTroID AND p.QuyenID=vq.QuyenID;`);permissionRemoved=true;
 const forbiddenStart=await state(pool,f),forbidden=await api('admin','PUT',route,body,403);assert.equal(forbidden.error.code,'FORBIDDEN');await assert.rejects(set(pool,f,good),r=>r.number===50302);assert.deepEqual(await state(pool,f),forbiddenStart);
 await pool.request().batch('INSERT dbo.VAITRO_QUYEN SELECT * FROM #R31Permission;DROP TABLE #R31Permission;');permissionRemoved=false;
 e.cases.push({name:'admin-missing-live-permission',response:forbidden,sqlError:50302,reads:await readCast(good),final:await state(pool,f),status:'PASS'});
 const trigger=read(path.join(root,'database/11_tests/admin/movie_actor_atomicity.sql')).replace("TRY_CONVERT(INT, SESSION_CONTEXT(N'R31_Target'))",String(f.movie));await pool.request().batch(trigger);
 const injectedStart=await state(pool,f);let failure;try{failure=await api('admin','PUT',route,{cast:[{actorId:f.actors[5],role:'Injected'}]},500);}finally{await pool.request().batch('DROP TRIGGER IF EXISTS dbo.R31_InjectFailure;');}
 assert.equal(failure.error.message,'Internal server error');assert.deepEqual(await state(pool,f),injectedStart);e.cases.push({name:'unexpected-db-failure-safe-response-rollback',response:failure,initial:injectedStart,reads:await readCast(good),final:await state(pool,f),status:'PASS'});
 await api('admin','PUT',route,{cast:[]},200);await assertPersisted(pool,f,[],initial);e.cases.push({name:'explicit-empty-clears-cast',reads:await readCast([]),final:await state(pool,f),status:'PASS'});
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.session=await cleanSession(pool);e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{try{if(permissionRemoved)await pool.request().batch('INSERT dbo.VAITRO_QUYEN SELECT * FROM #R31Permission;DROP TABLE #R31Permission;');await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R31_InjectFailure;');if(f)await cleanupFixture(pool,f);}catch(error){e.cleanupError={message:error.message,number:error.number};e.status='FAIL';}finally{e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'api-tests.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();}}
console.log(`PASS real API: ${e.requests.length} requests,${e.cases.length} cases;GET persisted state,Admin RBAC,reject preservation,clear,500 rollback;no drift.`);

import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,disposable,database,env,root,connect,actors,fixture,cleanupRoom,roomState,snapshot,summarize,write,evidenceRoot } from './common.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const baseURL=`http://127.0.0.1:${server.address().port}/api`,tokens={},rooms=[];
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',requests:[],states:[]};
async function api(role,method,route,body,expected) {
 const response=await fetch(baseURL+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const result=await response.json();evidence.requests.push({role,method,route,status:response.status,expected,...(result.error?{error:result.error}:{})});
 assert.ok((Array.isArray(expected)?expected:[expected]).includes(response.status),`${route}: ${JSON.stringify(result)}`);
 return {status:response.status,data:result.data??result};
}
async function overlapCount(room) {return(await pool.request().input('Room',sql.Int,room).query(`SELECT COUNT(*) count FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
 WHERE a.PhongID=@Room AND a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau`)).recordset[0].count;}
try {
 const before=await snapshot(pool),actor=await actors(pool);
 const timing=(await pool.request().input('Movie',sql.Int,actor.movie).query('SELECT DATEADD(DAY,10,dbo.fn_BayGio()) base,ThoiLuong FROM dbo.PHIM WHERE PhimID=@Movie')).recordset[0];
 const span=timing.ThoiLuong+60,time=minutes=>new Date(timing.base.getTime()+minutes*60000).toISOString();
 const body=(room,start=0,end=start+span)=>({movieId:actor.movie,roomId:room,startsAt:time(start),endsAt:time(end),format:'2D',basePrice:80000});
 for(const [role,email] of [['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn']]) {
  tokens[role]=(await api(role,'POST','/auth/login',{Email:email,MatKhau:'123456'},200)).data.token;
  const room=await fixture(pool,actor.cinema);rooms.push(room);
  await api(role,'POST',`/${role}/showtimes`,body(room),role==='manager'?201:200);
  const initial=await roomState(pool,room),show=initial.shows[0].SuatChieuID;
  for(const [start,end] of [[0,span],[30,30+timing.ThoiLuong],[-30,span+30],[-timing.ThoiLuong,60],[timing.ThoiLuong,timing.ThoiLuong+span]]) {
   const failed=await api(role,'POST',`/${role}/showtimes`,body(room,start,end),409);assert.equal(failed.data.error.code,'SHOWTIME_OVERLAP');
   assert.deepEqual(await roomState(pool,room),initial);
  }
  await api(role,'POST',`/${role}/showtimes`,body(room,span,2*span),role==='manager'?201:200);
  const updateBody=(start,end=start+span)=>{const payload=body(room,start,end);delete payload.roomId;return{...payload,status:'Mở bán'};};
  await api(role,'PUT',`/${role}/showtimes/${show}`,updateBody(0),200);
  const beforeConflict=await roomState(pool,room);
  const failed=await api(role,'PUT',`/${role}/showtimes/${show}`,updateBody(span),409);assert.equal(failed.data.error.code,'SHOWTIME_OVERLAP');assert.deepEqual(await roomState(pool,room),beforeConflict);
  await api(role,'PUT',`/${role}/showtimes/${show}`,updateBody(720),200);
  await api(role,'POST',`/${role}/showtimes/${show}/cancel`,null,200);
  await api(role,'POST',`/${role}/showtimes`,body(room,720),role==='manager'?201:200);
  const list=await api(role,'GET',role==='manager'?`/manager/cinemas/${actor.cinema}/showtimes?fromDate=2026-01-01&toDate=2040-12-31`:`/admin/showtimes?cinemaId=${actor.cinema}&fromDate=2026-01-01&toDate=2040-12-31`,null,200);
  assert.ok(list.data.showtimes.length>0);assert.equal(await overlapCount(room),0);
  evidence.states.push({role,initial,final:await roomState(pool,room),overlapCount:0,status:'PASS'});
  const invalid=await api(role,'POST',`/${role}/showtimes`,body(room,1440,1440+timing.ThoiLuong-1),400);assert.equal(invalid.data.error.code,'SHOWTIME_TIME_INVALID');
  const missingRoom=await api(role,'POST',`/${role}/showtimes`,body(2147483600),404);assert.equal(missingRoom.data.error.code,'ROOM_NOT_FOUND');
  const missingShow=await api(role,'PUT',`/${role}/showtimes/2147483600`,updateBody(0),404);assert.equal(missingShow.data.error.code,'SHOWTIME_NOT_FOUND');
  const missingCancel=await api(role,'POST',`/${role}/showtimes/2147483600/cancel`,null,404);assert.equal(missingCancel.data.error.code,'SHOWTIME_NOT_FOUND');
  await cleanupRoom(pool,room);
 }
 const foreign=(await pool.request().input('Cinema',sql.Int,actor.cinema).query('SELECT TOP(1) RapID FROM dbo.RAPCHIEUPHIM WHERE RapID<>@Cinema ORDER BY RapID')).recordset[0].RapID;
 const deniedRoom=await fixture(pool,foreign);rooms.push(deniedRoom);const initialDenied=await roomState(pool,deniedRoom);
 const forbidden=await api('manager','POST',`/manager/showtimes?RapID=${actor.cinema}`,body(deniedRoom),403);assert.equal(forbidden.data.error.code,'MANAGER_CINEMA_FORBIDDEN');assert.deepEqual(await roomState(pool,deniedRoom),initialDenied);
 await cleanupRoom(pool,deniedRoom);
 const concurrentRoom=await fixture(pool,actor.cinema);rooms.push(concurrentRoom);
 const results=await Promise.all(['manager','admin'].map(role=>api(role,'POST',`/${role}/showtimes`,body(concurrentRoom),[200,201,409])));
 assert.equal(results.filter(row=>row.status<300).length,1);assert.equal(results.find(row=>row.status===409).data.error.code,'SHOWTIME_OVERLAP');
 const finalConcurrent=await roomState(pool,concurrentRoom);assert.equal(finalConcurrent.shows.length,1);assert.equal(await overlapCount(concurrentRoom),0);
 evidence.states.push({case:'real-HTTP-manager-vs-admin',results:results.map(row=>({status:row.status,error:row.data.error})),final:finalConcurrent,overlapCount:0,status:'PASS'});await cleanupRoom(pool,concurrentRoom);
 const faultRoom=await fixture(pool,actor.cinema);rooms.push(faultRoom);const faultBefore=await roomState(pool,faultRoom);
 await pool.request().batch(`CREATE TRIGGER dbo.TRG_R12_HTTP_Fault ON dbo.SUATCHIEU AFTER INSERT,UPDATE AS BEGIN IF EXISTS(SELECT 1 FROM inserted WHERE PhongID=${faultRoom}) THROW 59812,N'PRIVATE SQL fault',1;END;`);
 try {for(const role of ['manager','admin']) {const result=await api(role,'POST',`/${role}/showtimes`,body(faultRoom),500);assert.equal(result.data.error.message,'Internal server error');assert.ok(!JSON.stringify(result).includes('PRIVATE'));assert.deepEqual(await roomState(pool,faultRoom),faultBefore);}}
 finally {await pool.request().batch('DROP TRIGGER dbo.TRG_R12_HTTP_Fault;');}
 await cleanupRoom(pool,faultRoom);
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.fixtureCleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error=error.message;throw error;}
finally {await pool.request().batch('DROP TRIGGER IF EXISTS dbo.TRG_R12_HTTP_Fault;');for(const room of rooms) await cleanupRoom(pool,room);
 evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'api-tests.json'),evidence);await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}
console.log(`PASS real HTTP showtimes: ${evidence.requests.length} requests; overlap409, preserved state, zero committed overlap, safe errors.`);

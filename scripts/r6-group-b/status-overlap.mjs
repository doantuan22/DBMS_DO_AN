// Supplement R1.2: closed/completed showtimes still occupy their room.
import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,database,env,connect,write,evidenceRoot,actors,fixture,cleanupRoom,roomState} from './common.mjs';
import {fingerprints} from '../../database/11_tests/r6-group-a/support.mjs';
Object.assign(process.env,env,{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},rooms=[],e={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};
async function api(role,method,route,input,status,code){const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},body:JSON.stringify(input),signal:AbortSignal.timeout(30000)}),body=await response.json();assert.equal(response.status,status,JSON.stringify(body));if(code)assert.equal(body.error?.code,code);return body;}
try{
 e.before=await fingerprints(pool);const actor=await actors(pool),timing=(await pool.request().input('Movie',sql.Int,actor.movie).query('SELECT DATEADD(DAY,10,dbo.fn_BayGio()) starts,ThoiLuong+10 span FROM dbo.PHIM WHERE PhimID=@Movie')).recordset[0];
 for(const [role,Email] of [['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn']]){
  tokens[role]=(await api(role,'POST','/auth/login',{Email,MatKhau:'123456'},200)).token;
  for(const status of ['Đóng bán','Hoàn thành']){
   const room=await fixture(pool,actor.cinema);rooms.push(room);
   const body=(offset=0)=>({movieId:actor.movie,roomId:room,startsAt:new Date(timing.starts.getTime()+offset*60000).toISOString(),endsAt:new Date(timing.starts.getTime()+(offset+timing.span)*60000).toISOString(),format:'2D',basePrice:80000});
   await api(role,'POST',`/${role}/showtimes`,body(),role==='manager'?201:200);await api(role,'POST',`/${role}/showtimes`,body(720),role==='manager'?201:200);
   let state=await roomState(pool,room);const show=state.shows[0].SuatChieuID,other=state.shows[1].SuatChieuID;
   await pool.request().input('ID',sql.Int,show).input('Status',sql.NVarChar(50),status).query('UPDATE dbo.SUATCHIEU SET TrangThai=@Status WHERE SuatChieuID=@ID');state=await roomState(pool,room);
   for(const kind of ['create','update']){
    const initial=await fingerprints(pool),{roomId,...update}=body(),input=kind==='create'?body():{...update,status:'Mở bán'},route=kind==='create'?`/${role}/showtimes`:`/${role}/showtimes/${other}`;
    const actual=await api(role,kind==='create'?'POST':'PUT',route,input,409,'SHOWTIME_OVERLAP');const final=await roomState(pool,room);assert.deepEqual(final,state);assert.deepEqual(await fingerprints(pool),initial);
    e.cases.push({id:`R6.7-status-${role}-${status}-${kind}`,role,occupyingStatus:status,kind,input,expected:{http:409,code:'SHOWTIME_OVERLAP',persisted:'unchanged'},actual,initial:state,final,status:'PASS',cleanup:'PASS'});
   }
   await cleanupRoom(pool,room);
  }
 }
 e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{try{for(const room of rooms)await cleanupRoom(pool,room);e.after=await fingerprints(pool);assert.deepEqual(e.after,e.before);e.cleanup='PASS';}catch(error){e.status='FAIL';e.cleanupError=error.message;process.exitCode=1;}e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'status-overlap.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();}
console.log(`PASS ${e.cases.length} closed/completed overlap conflicts, safe409 and persisted rollback.`);

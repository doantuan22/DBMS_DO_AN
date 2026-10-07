import assert from 'node:assert/strict';
import path from 'node:path';
import { sql, disposable, database, env, root, connect, actors, fixture, cleanupRoom, roomState, snapshot, summarize, write, evidenceRoot } from './common.mjs';
disposable();
Object.assign(process.env,env,{ DB_DATABASE:database });
process.chdir(path.join(root,'backend'));
const { createApp }=await import('../../backend/src/app.js');
const { closePool }=await import('../../backend/src/db/pool.js');
const pool=await connect();
const server=createApp().listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
const tokens={},rooms=[];
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',requests:[],states:[]};
async function api(role,method,route,body,expected) {
  const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  evidence.requests.push({role,method,route,status:response.status,expected,...(result.error?{error:result.error}:{}),...(method==='DELETE'?{response:result}:{})});
  assert.equal(response.status,expected,`${method} ${route}: ${JSON.stringify(result)}`);
  return result.data??result;
}
try {
  const before=await snapshot(pool),actor=await actors(pool);
  for(const [role,email] of [['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn']]) {
    tokens[role]=(await api(role,'POST','/auth/login',{Email:email,MatKhau:'123456'},200)).token;
    assert.ok(tokens[role]);
    for(const historical of [false,true]) {
      const created=await api(role,'POST',role==='manager'?`/manager/cinemas/${actor.cinema}/rooms`:'/admin/rooms',
        {name:`R11 HTTP ${role} ${Date.now()}`,type:'2D',...(role==='admin'?{cinemaId:actor.cinema}:{})},role==='manager'?201:200);
      const room=created.room.id??created.room.PhongID; rooms.push(room); assert.ok(Number.isInteger(room));
      await api(role,'POST',role==='manager'?`/manager/rooms/${room}/seats`:'/admin/seats',
        {row:'A',number:1,type:'Thường',...(role==='admin'?{roomId:room}:{})},role==='manager'?201:200);
      await api(role,'PUT',`/${role}/rooms/${room}`,{name:`R11 HTTP updated ${room}`,type:'2D',status:'Hoạt động'},200);
      if(historical) {
        const time=(await pool.request().input('Movie',sql.Int,actor.movie).query(`SELECT DATEADD(DAY,10,dbo.fn_BayGio()) starts,DATEADD(MINUTE,ThoiLuong+10,DATEADD(DAY,10,dbo.fn_BayGio())) ends FROM dbo.PHIM WHERE PhimID=@Movie`)).recordset[0];
        await api(role,'POST',`/${role}/showtimes`,{movieId:actor.movie,roomId:room,startsAt:time.starts.toISOString(),endsAt:time.ends.toISOString(),format:'2D',basePrice:80000},role==='manager'?201:200);
      }
      const initial=await roomState(pool,room);
      // Untrusted body/query values cannot choose the resource cinema or actor.
      const response=await api(role,'DELETE',`/${role}/rooms/${room}?RapID=2147483600`,{RapID:2147483600,NguoiDungID:2147483600},200);
      const outcome=role==='manager'?response:response.result;
      assert.equal(outcome.deleted??outcome.Deleted,!historical); assert.equal(outcome.deactivated??outcome.Deactivated,historical);
      const final=await roomState(pool,room);
      if(historical) {
        assert.equal(final.rooms[0].TrangThai,'Ngưng hoạt động');
        for(const key of ['seats','shows','orders','tickets']) assert.deepEqual(final[key],initial[key]);
        const list=await api(role,'GET',role==='manager'?`/manager/cinemas/${actor.cinema}/rooms`:`/admin/rooms?cinemaId=${actor.cinema}`,null,200);
        const row=list.rooms.find(row=>(row.id??row.PhongID)===room);
        assert.equal(row.status??row.TrangThai,'Ngưng hoạt động');
        const again=await api(role,'DELETE',`/${role}/rooms/${room}`,null,200);
        assert.equal(role==='manager'?again.deactivated:again.result.Deactivated,true);
        assert.deepEqual(await roomState(pool,room),final);
      } else assert.deepEqual(final,{rooms:[],seats:[],shows:[],orders:[],tickets:[]});
      evidence.states.push({role,historical,initial,final,result:'PASS'});
      await cleanupRoom(pool,room);
    }
    const missing=await api(role,'DELETE',`/${role}/rooms/2147483600`,null,404); assert.equal(missing.error.code,'ROOM_NOT_FOUND');
    await api(role,'DELETE',`/${role}/rooms/not-an-id`,null,400);
  }
  const foreign=(await pool.request().input('Cinema',sql.Int,actor.cinema).query('SELECT TOP(1) RapID FROM dbo.RAPCHIEUPHIM WHERE RapID<>@Cinema ORDER BY RapID')).recordset[0].RapID;
  const forbidden=await fixture(pool,foreign); rooms.push(forbidden);
  const scopeBefore=await roomState(pool,forbidden);
  const denied=await api('manager','DELETE',`/manager/rooms/${forbidden}?RapID=${actor.cinema}`,{RapID:actor.cinema},403);
  assert.equal(denied.error.code,'MANAGER_CINEMA_FORBIDDEN'); assert.deepEqual(await roomState(pool,forbidden),scopeBefore);
  evidence.states.push({case:'spoofed-cinema-out-of-scope',initial:scopeBefore,final:await roomState(pool,forbidden),result:'PASS'});
  await cleanupRoom(pool,forbidden);
  for(const nativeConflict of [false,true]) {
    const room=await fixture(pool,actor.cinema); rooms.push(room);
    const initial=await roomState(pool,room);
    await pool.request().batch(`CREATE OR ALTER TRIGGER dbo.TRG_R11_HTTP_Failure ON dbo.PHONGCHIEU INSTEAD OF DELETE AS
      BEGIN SET NOCOUNT ON;
        IF EXISTS(SELECT 1 FROM deleted WHERE PhongID=${room})
        BEGIN
          IF EXISTS(SELECT 1 FROM dbo.GHE WHERE PhongID=${room}) THROW 59802,N'Injection before seat deletion',1;
          ${nativeConflict?`INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
          VALUES(2147483600,${room},dbo.fn_BayGio(),DATEADD(HOUR,3,dbo.fn_BayGio()),N'2D',1,N'Mở bán');`:`THROW 59801,N'PRIVATE R11 SQL fault details',1;`}
        END;
        DELETE p FROM dbo.PHONGCHIEU p JOIN deleted d ON d.PhongID=p.PhongID;
      END;`);
    try {
      for(const role of ['manager','admin']) {
        const result=await api(role,'DELETE',`/${role}/rooms/${room}`,null,nativeConflict?409:500);
        if(nativeConflict) assert.equal(result.error.code,'ROOM_DELETE_CONFLICT');
        else assert.equal(result.error.message,'Internal server error');
        assert.ok(!JSON.stringify(result).includes('PRIVATE'));
        assert.deepEqual(await roomState(pool,room),initial);
      }
      evidence.states.push({case:nativeConflict?'real-FK-error-409':'unexpected-DB-error-500',initial,final:await roomState(pool,room),result:'PASS'});
    } finally { await pool.request().batch('DROP TRIGGER dbo.TRG_R11_HTTP_Failure;'); }
    await cleanupRoom(pool,room);
  }
  await api(null,'DELETE','/manager/rooms/1',null,401);
  const after=await snapshot(pool); assert.deepEqual(after.data,before.data); assert.deepEqual(after.metadata,before.metadata);
  evidence.before=summarize(before); evidence.after=summarize(after); evidence.fixtureCleanup='PASS'; evidence.status='PASS';
} catch(error) { evidence.status='FAIL'; evidence.error=error.message; throw error; }
finally {
  await pool.request().batch('DROP TRIGGER IF EXISTS dbo.TRG_R11_HTTP_Failure;');
  for(const room of rooms) await cleanupRoom(pool,room);
  evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'api-tests.json'),evidence);
  await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();
}
console.log(`PASS REST room-delete: ${evidence.requests.length} requests; final states and safe errors verified.`);

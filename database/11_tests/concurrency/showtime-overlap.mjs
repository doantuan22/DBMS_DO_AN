// Two real SQL sessions. Barriers/transactions live in SQL Server; no runtime JS mutex.
import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,disposable,database,connect,actors,fixture,cleanupRoom,roomState,snapshot,summarize,write,evidenceRoot } from '../../../scripts/r12/common.mjs';
disposable();
const [a,b,observer]=await Promise.all([connect(),connect(),connect()]);
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',scenarios:[],stress:[]};
const event=(test,session,action,details={})=>test.timeline.push({at:new Date().toISOString(),session,action,...details});
// Capture between statements: an autocommit RCSI SELECT can itself report XACT_STATE()=1.
const session=async pool=>(await pool.request().batch('DECLARE @Count INT=@@TRANCOUNT,@State INT=XACT_STATE(); SELECT @@SPID spid,@Count transactions,@State state;')).recordset[0];
const rollback=async pool=>pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;');
let actor,base,duration,ids;
function operation(kind,role,room,show,start=0) {
 const prefix=role==='admin'?'usp_Admin_Showtime_':'sp_Manager_Showtime_';
 const identity=role==='admin'?'ActorID':'NguoiDungID';
 const proc=role==='alias'?'sp_ThemSuatChieu':prefix+kind;
 return {kind,role,room,show,startsAt:new Date(base.getTime()+start*60000).toISOString(),endsAt:new Date(base.getTime()+(start+duration)*60000).toISOString(),procedure:proc,identity,actor:role==='admin'?actor.admin:actor.manager};
}
async function execute(pool,op) {
 const request=pool.request().input(op.identity,sql.Int,op.actor);
 if(op.kind==='Cancel') request.input('SuatChieuID',sql.Int,op.show);
 else {
  request.input('PhimID',sql.Int,actor.movie).input('ThoiGianBatDau',sql.DateTime2,new Date(op.startsAt)).input('ThoiGianKetThuc',sql.DateTime2,new Date(op.endsAt))
   .input('DinhDang',sql.NVarChar(50),'2D').input('GiaVeCoBan',sql.Decimal(18,2),80000);
  if(op.kind==='Create') request.input('PhongID',sql.Int,op.room);
  else request.input('SuatChieuID',sql.Int,op.show).input('TrangThai',sql.NVarChar(50),'Mở bán');
 }
 try {const result=await request.execute('dbo.'+op.procedure);return {status:'SUCCESS',recordsets:result.recordsets};}
 catch(error) {return {status:'ERROR',number:error.number,message:error.message};}
}
async function overlaps(roomIds) {
 assert.ok(roomIds.every(Number.isInteger));
 return (await observer.request().query(`SELECT COUNT(*) count FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
  WHERE a.PhongID IN (${roomIds.join(',')}) AND a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau`)).recordset[0].count;
}
async function waits(test,blocked,blocker) {
 const end=Date.now()+10000;
 while(Date.now()<end) {
  const rows=(await observer.request().input('Session',sql.Int,blocked).query('SELECT session_id,blocking_session_id,wait_type,wait_resource,status FROM sys.dm_exec_requests WHERE session_id=@Session')).recordset;
  if(rows.some(row=>row.blocking_session_id===blocker&&row.wait_type?.startsWith('LCK_'))) {event(test,'observer','confirmed SQL lock wait',{rows});test.wait=rows;return;}
  await new Promise(resolve=>setTimeout(resolve,20));
 }
 throw new Error('Expected actual SQL blocking was not observed.');
}
async function assertFinal(test,rooms) {
 test.final=await Promise.all(rooms.map(room=>roomState(observer,room)));
 test.overlapCount=await overlaps(rooms);assert.equal(test.overlapCount,0);
 for(let i=0;i<rooms.length;i++) assert.deepEqual(test.final[i].seats,test.initial[i].seats,'Showtime race must preserve seats.');
 test.sessionsAfter=await Promise.all([session(a),session(b)]);assert.ok(test.sessionsAfter.every(row=>row.transactions===0&&row.state===0));
 assert.equal(test.sessionsAfter[0].spid,test.sessionA);assert.equal(test.sessionsAfter[1].spid,test.sessionB);
 test.status='PASS';
}
async function race(name,roleA,roleB,mode='gated',iteration) {
 const rooms=[await fixture(observer,actor.cinema)];
 if(name==='different_rooms') rooms.push(await fixture(observer,actor.cinema));
 const room=rooms[0],test={name,iteration,mode,sessionA:ids[0].spid,sessionB:ids[1].spid,timeline:[],status:'RUNNING'};
 (iteration===undefined?evidence.scenarios:evidence.stress).push(test);
 let pending;
 try {
  let firstShow,secondShow;
  if(['create_update','update_create','update_update','same_show_updates','cancel_create','create_cancel'].includes(name)) {
   const initial=operation('Create','manager',room,null,['cancel_create','create_cancel'].includes(name)?0:720);
   assert.equal((await execute(observer,initial)).status,'SUCCESS');firstShow=(await roomState(observer,room)).shows[0].SuatChieuID;
  }
  if(name==='update_update') {assert.equal((await execute(observer,operation('Create','manager',room,null,1440))).status,'SUCCESS');secondShow=(await roomState(observer,room)).shows[1].SuatChieuID;}
  let opA=operation('Create',roleA,room,null,0),opB=operation('Create',roleB,rooms.at(-1),null,name==='non_overlap'?duration:0);
  if(name==='create_update') opB=operation('Update',roleB,room,firstShow,0);
  if(name==='update_create') opA=operation('Update',roleA,room,firstShow,0);
  if(name==='update_update') {opA=operation('Update',roleA,room,firstShow,0);opB=operation('Update',roleB,room,secondShow,0);}
  if(name==='same_show_updates') {opA=operation('Update',roleA,room,firstShow,0);opB=operation('Update',roleB,room,firstShow,360);}
  if(name==='cancel_create') opA=operation('Cancel',roleA,room,firstShow);
  if(name==='create_cancel') opB=operation('Cancel',roleB,room,firstShow);
  test.operations={A:opA,B:opB};test.initial=await Promise.all(rooms.map(room=>roomState(observer,room)));
  if(mode==='simultaneous') {
   event(test,'A+B','release both real procedure requests together');
   const promises=[execute(a,opA),execute(b,opB)];
   test.wait=(await observer.request().query(`SELECT session_id,blocking_session_id,wait_type,wait_resource FROM sys.dm_exec_requests WHERE session_id IN (${ids[0].spid},${ids[1].spid})`)).recordset;
   test.results=await Promise.all(promises);event(test,'A+B','both requests completed',{results:test.results});
  } else {
   await a.request().input('Room',sql.Int,room).batch('SET XACT_ABORT ON; BEGIN TRANSACTION; DECLARE @Locked INT; SELECT @Locked=PhongID FROM dbo.PHONGCHIEU WITH(UPDLOCK,HOLDLOCK) WHERE PhongID=@Room;');
   event(test,'A','SQL barrier acquired room mutex before executing writer');
   const held=await session(a);assert.equal(held.spid,ids[0].spid);assert.equal(held.transactions,1);
   event(test,'B','start actual competing procedure');pending=execute(b,opB);
   if(name==='different_rooms') {
    const second=await Promise.race([pending,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Different-room writer must commit while A is still open.')),5000))]);
    assert.equal(second.status,'SUCCESS');event(test,'B','independent room committed while A remains open',{result:second});
    const first=await execute(a,opA);assert.equal(first.status,'SUCCESS');await a.request().batch('COMMIT TRANSACTION;');
    event(test,'A','COMMIT confirmed');test.results=[first,second];test.independentCommit=true;
   } else {
    await waits(test,ids[1].spid,ids[0].spid);
    const first=await execute(a,opA);event(test,'A','first procedure completed',{result:first});
    if(first.status==='SUCCESS') {await a.request().batch('COMMIT TRANSACTION;');event(test,'A','COMMIT confirmed');}
    else {await rollback(a);event(test,'A','ROLLBACK confirmed');}
    const second=await pending;event(test,'B','competing procedure completed',{result:second});test.results=[first,second];
   }
  }
  await Promise.all([rollback(a),rollback(b)]);
  if(name==='overlap') {
   assert.equal(test.results.filter(row=>row.status==='SUCCESS').length,1);
   assert.equal(test.results.find(row=>row.status==='ERROR').number,50001);
  } else if(['create_update','update_create','update_update'].includes(name)) {
   assert.equal(test.results[0].status,'SUCCESS');assert.equal(test.results[1].number,50001);
  } else if(name==='create_cancel') {assert.equal(test.results[0].number,50001);assert.equal(test.results[1].status,'SUCCESS');}
  else assert.ok(test.results.every(row=>row.status==='SUCCESS'));
  await assertFinal(test,rooms);
  const shows=test.final.flatMap(state=>state.shows);
  if(name==='overlap') assert.equal(shows.length,1);
  if(name==='non_overlap') {assert.equal(shows.length,2);assert.equal(shows[0].ThoiGianKetThuc.getTime(),shows[1].ThoiGianBatDau.getTime());}
  if(name==='different_rooms') assert.ok(test.final.every(state=>state.shows.length===1));
  if(name==='cancel_create') {assert.equal(shows.length,2);assert.equal(shows.filter(row=>row.TrangThai==='Đã hủy').length,1);}
  if(name==='create_cancel') {assert.equal(shows.length,1);assert.equal(shows[0].TrangThai,'Đã hủy');}
  if(name==='create_update') assert.equal(shows.find(row=>row.SuatChieuID===firstShow).ThoiGianBatDau.getTime(),base.getTime()+720*60000);
  if(name==='update_update') assert.equal(shows.find(row=>row.SuatChieuID===secondShow).ThoiGianBatDau.getTime(),base.getTime()+1440*60000);
  if(name==='same_show_updates') {assert.equal(shows.length,1);assert.equal(shows[0].ThoiGianBatDau.getTime(),base.getTime()+360*60000);}
  if(iteration===undefined) console.log(`PASS ${name}: ${roleA}/${roleB}, overlap=0`);
 } finally {await Promise.all([rollback(a),rollback(b)]);if(pending) await pending;for(const id of rooms) await cleanupRoom(observer,id);}
}
try {
 const before=await snapshot(observer);assert.equal(before.metadata.environment[0].is_read_committed_snapshot_on,true);
 actor=await actors(observer);ids=await Promise.all([session(a),session(b)]);assert.notEqual(ids[0].spid,ids[1].spid);
 const time=(await observer.request().input('Movie',sql.Int,actor.movie).query('SELECT DATEADD(DAY,10,dbo.fn_BayGio()) base,ThoiLuong duration FROM dbo.PHIM WHERE PhimID=@Movie')).recordset[0];base=time.base;duration=time.duration+10;
 const pairs=[['manager','manager'],['manager','admin'],['admin','manager'],['admin','admin'],['alias','manager'],['manager','alias']];
 for(const [x,y] of pairs) await race('overlap',x,y);
 for(const [x,y] of pairs.slice(0,4)) {await race('non_overlap',x,y);await race('different_rooms',x,y);}
 for(const [x,y] of [['manager','admin'],['admin','manager']]) for(const name of ['create_update','update_create','update_update','same_show_updates','cancel_create','create_cancel']) await race(name,x,y);
 for(let i=1;i<=125;i++) {
  const [x,y]=pairs[(i-1)%pairs.length];await race('overlap',x,y,i<=100?'gated':'simultaneous',i);
  if(i%25===0) console.log(`PASS stress ${i}/125: actual final overlap=0 for every iteration`);
 }
 const after=await snapshot(observer);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 const global=(await observer.request().query(`SELECT COUNT(*) count FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID=b.PhongID AND a.SuatChieuID<b.SuatChieuID
  WHERE a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy' AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND a.ThoiGianKetThuc>b.ThoiGianBatDau`)).recordset[0].count;
 assert.equal(global,0);evidence.finalCommittedOverlapCount=global;evidence.globalFinalStateQuery='PASS';
 evidence.stressRaces=evidence.stress.length;evidence.fixtureCleanup='PASS';evidence.before=summarize(before);evidence.after=summarize(after);evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'concurrency.json'),evidence);await Promise.all([a.close(),b.close(),observer.close()]);}

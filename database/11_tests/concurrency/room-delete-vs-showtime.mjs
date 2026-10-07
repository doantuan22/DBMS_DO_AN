// Real SQL sessions; synchronization transactions are SQL batches, not application transactions.
import assert from 'node:assert/strict';
import path from 'node:path';
import { sql, disposable, database, connect, actors, fixture, cleanupRoom, roomState, snapshot, summarize, write, evidenceRoot } from '../../../scripts/r11/common.mjs';
disposable();
const [a,b,observer]=await Promise.all([connect(),connect(),connect()]);
const evidence={ database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[] };
const event=(test,session,action,details={})=>test.timeline.push({at:new Date().toISOString(),session,action,...details});
const session=async pool=>(await pool.request().query('SELECT @@SPID spid,@@TRANCOUNT transactions')).recordset[0];
const rollback=async pool=>pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;');
const resultOf=async (test,label,promise)=>{
  try { const result=await promise; event(test,label,'procedure returned',{recordsets:result.recordsets}); return {status:'SUCCESS',recordsets:result.recordsets}; }
  catch(error) { const result={status:'ERROR',number:error.number,message:error.message}; event(test,label,'procedure failed',result); return result; }
};
async function waitBlocked(test,blocked,blocker) {
  const end=Date.now()+10000;
  while(Date.now()<end) {
    const rows=(await observer.request().input('Session',sql.Int,blocked).query(`SELECT session_id,blocking_session_id,wait_type,wait_resource,status FROM sys.dm_exec_requests WHERE session_id=@Session`)).recordset;
    if(rows.some(row=>row.blocking_session_id===blocker && row.wait_type?.startsWith('LCK_'))) {
      event(test,'observer','confirmed actual SQL lock wait',{rows}); return;
    }
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw new Error(`No actual lock wait from ${blocked} on ${blocker}; refusing to call the race deterministic.`);
}
try {
  const before=await snapshot(observer);
  const actor=await actors(observer);
  const ids=await Promise.all([session(a),session(b)]);
  assert.notEqual(ids[0].spid,ids[1].spid);
  const pairs=[['manager','manager'],['manager','admin'],['manager','alias'],['admin','manager'],['admin','admin']];
  for(const [deleter,creator] of pairs) for(const winner of ['delete','create']) {
    const room=await fixture(observer,actor.cinema);
    const test={deleter,creator,winner,room,sessionA:ids[0].spid,sessionB:ids[1].spid,timeline:[],initial:await roomState(observer,room),status:'RUNNING'};
    evidence.cases.push(test);
    const deletion=`EXEC dbo.${deleter==='admin'?'usp_Admin_Room_Delete':'sp_Manager_Room_Delete'} @${deleter==='admin'?'ActorID':'NguoiDungID'}=${actor[deleter]},@PhongID=${room};`;
    const creation=`DECLARE @Start DATETIME2=DATEADD(DAY,10,dbo.fn_BayGio()),@End DATETIME2;
      SELECT @End=DATEADD(MINUTE,ThoiLuong+10,@Start) FROM dbo.PHIM WHERE PhimID=${actor.movie};
      EXEC dbo.${creator==='admin'?'usp_Admin_Showtime_Create':creator==='alias'?'sp_ThemSuatChieu':'sp_Manager_Showtime_Create'}
      @${creator==='admin'?'ActorID':'NguoiDungID'}=${creator==='admin'?actor.admin:actor.manager},@PhimID=${actor.movie},@PhongID=${room},
      @ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=N'2D',@GiaVeCoBan=80000;`;
    let pending;
    try {
      const first=winner==='delete'?a:b, second=winner==='delete'?b:a;
      const firstLabel=winner==='delete'?'A':'B',secondLabel=winner==='delete'?'B':'A';
      event(test,firstLabel,'BEGIN SQL transaction and execute winning procedure');
      const firstResult=await resultOf(test,firstLabel,first.request().batch('SET XACT_ABORT ON; BEGIN TRANSACTION;'+(winner==='delete'?deletion:creation)));
      assert.equal(firstResult.status,'SUCCESS');
      const firstState=await session(first);
      assert.equal(firstState.spid,winner==='delete'?ids[0].spid:ids[1].spid);
      assert.equal(firstState.transactions,1,'Procedure commit must leave the coordination transaction open.');
      test.beforeWinnerCommit=await roomState(first,room);
      event(test,secondLabel,'start competing procedure on independent connection');
      pending=resultOf(test,secondLabel,second.request().batch(winner==='delete'?creation:deletion));
      await waitBlocked(test,winner==='delete'?ids[1].spid:ids[0].spid,firstState.spid);
      await first.request().batch('COMMIT TRANSACTION;'); event(test,firstLabel,'COMMIT confirmed');
      const secondResult=await pending;
      test.transactions={winner:firstResult,competitor:secondResult};
      await Promise.all([rollback(a),rollback(b)]);
      test.final=await roomState(observer,room);
      if(winner==='delete') {
        assert.equal(secondResult.status,'ERROR'); assert.ok([50056,547].includes(secondResult.number));
        assert.deepEqual(test.final,{rooms:[],seats:[],shows:[],orders:[],tickets:[]});
      } else {
        assert.equal(secondResult.status,'SUCCESS'); assert.equal(test.final.rooms[0].TrangThai,'Ngưng hoạt động');
        assert.deepEqual(test.final.seats,test.initial.seats); assert.equal(test.final.shows.length,1);
        assert.deepEqual(test.final.shows,test.beforeWinnerCommit.shows);
      }
      const last=await Promise.all([session(a),session(b)]);
      assert.ok(last.every(row=>row.transactions===0));
      test.invariant='PASS'; test.status='PASS';
      console.log(`PASS ${deleter} delete / ${creator} create / ${winner} wins: room=${test.final.rooms.length}, seats=${test.final.seats.length}, shows=${test.final.shows.length}`);
    } finally {
      await Promise.all([rollback(a),rollback(b)]);
      if(pending) await pending;
      await cleanupRoom(observer,room);
    }
  }
  const after=await snapshot(observer);
  assert.deepEqual(after.data,before.data); assert.deepEqual(after.metadata,before.metadata);
  evidence.before=summarize(before); evidence.after=summarize(after); evidence.fixtureCleanup='PASS'; evidence.status='PASS';
} catch(error) { evidence.status='FAIL'; evidence.error={number:error.number,message:error.message}; throw error; }
finally {
  evidence.completedAt=new Date().toISOString(); write(path.join(evidenceRoot,'concurrency.json'),evidence);
  await Promise.all([a.close(),b.close(),observer.close()]);
}

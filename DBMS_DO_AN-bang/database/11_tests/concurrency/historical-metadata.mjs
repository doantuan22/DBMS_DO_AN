import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sql,disposable,database,connect,snapshot,summarize,write,evidenceRoot } from '../../../scripts/db/concurrency-support/common-r32.mjs';
import { createFixture,cleanupFixture,state,bookingRequest,updateShow,updateSeat,cleanSession } from '../../../scripts/db/concurrency-support/fixtures-r32.mjs';
disposable();const a=await connect(),b=await connect(),observer=await connect();
const e={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};let f;
const outcome=p=>p.then(r=>({success:true,outputs:r.output,rows:r.recordset}),r=>({success:false,error:{number:r.number,message:r.message}}));
async function blocked(waiter,blocker){
 const end=Date.now()+10000;while(Date.now()<end){const row=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query('SELECT session_id,blocking_session_id,wait_type,wait_resource,status FROM sys.dm_exec_requests WHERE session_id=@Waiter AND blocking_session_id=@Blocker')).recordset[0];
  if(row){assert.match(row.wait_type,/^LCK_M_/);const locks=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query(`SELECT l.request_session_id,l.resource_type,l.request_mode,l.request_status,OBJECT_NAME(p.object_id) objectName,i.name indexName,l.resource_description FROM sys.dm_tran_locks l LEFT JOIN sys.partitions p ON p.hobt_id=l.resource_associated_entity_id LEFT JOIN sys.indexes i ON i.object_id=p.object_id AND i.index_id=p.index_id WHERE l.request_session_id IN(@Waiter,@Blocker) AND p.object_id IN(OBJECT_ID('dbo.PHONGCHIEU'),OBJECT_ID('dbo.SUATCHIEU'),OBJECT_ID('dbo.GHE'),OBJECT_ID('dbo.DONDATVE'),OBJECT_ID('dbo.CHITIETVE'));`)).recordset;assert.ok(locks.some(l=>l.request_status==='WAIT'));return {at:new Date().toISOString(),...row,locks};}await delay(25);
 }throw Error(`Missing actual resource blocking ${waiter}->${blocker}`);
}
async function race(role,kind,first,finish){
 f=await createFixture(observer);const initial=await state(observer,f),sa=await cleanSession(a),sb=await cleanSession(b),spids={a:sa.spid,b:sb.spid};assert.notEqual(sa.spid,sb.spid);
 const delta=kind==='seat'?{LoaiGhe:'Thường'}:kind==='movie'?{PhimID:f.alternateMovie}:{GiaVeCoBan:90000,DinhDang:'3D'},book=p=>bookingRequest(p,f,f.customer).execute('dbo.sp_Booking_Create'),update=p=>kind==='seat'?updateSeat(p,f,role,initial.seats[0],delta):updateShow(p,f,role,initial.show[0],delta),row={name:`${role}/${kind}/${first}-first/${finish}`,role,kind,firstWriter:first,finish,spids,initial,requested:delta,timeline:[]};
 await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');row.first=await outcome(first==='booking'?book(a):update(a));assert.equal(row.first.success,true);row.timeline.push({at:new Date().toISOString(),event:'first procedure completed;caller transaction retains locks'});
 const pending=outcome(first==='booking'?update(b):book(b));row.blocking=await blocked(sb.spid,sa.spid);assert.deepEqual(await state(observer,f),initial);row.uncommitted=await state(a,f);
 await a.request().batch(finish+';');row.timeline.push({at:new Date().toISOString(),event:finish});row.second=await pending;row.final=await state(observer,f);
 if(first==='booking'&&finish==='COMMIT'){
  assert.equal(row.second.success,false);assert.equal(row.second.error.number,kind==='seat'?50207:50120);assert.deepEqual(row.final.show,initial.show);assert.deepEqual(row.final.seats,initial.seats);assert.equal(row.final.orders.length,1);assert.equal(row.final.tickets.length,2);assert.ok(row.final.tickets.every(t=>t.GiaVe===95000));
 }else if(first==='update'&&kind==='movie'&&finish==='COMMIT'){
  assert.equal(row.second.success,false);assert.equal(row.second.error.number,50022);assert.equal(row.final.show[0].PhimID,f.alternateMovie);assert.equal(row.final.orders.length,0);assert.equal(row.final.tickets.length,0);
 }else{
  assert.equal(row.second.success,true);
  if(first==='booking'){assert.equal(row.final.orders.length,0);assert.equal(row.final.tickets.length,0);}
  else{assert.equal(row.final.orders.length,1);assert.equal(row.final.tickets.length,2);const expected=finish==='ROLLBACK'?[95000,95000]:kind==='seat'?[80000,95000]:[105000,105000];assert.deepEqual(row.final.tickets.map(t=>t.GiaVe),expected);assert.equal(row.final.orders[0].TongTienVe,expected.reduce((x,y)=>x+y,0));assert.equal(row.final.orders[0].TongTienDoAn,10000);assert.equal(row.final.orders[0].TienGiamGia,1000);}
  const changed=(first==='booking'||finish==='COMMIT');if(kind==='seat'){assert.equal(row.final.seats[0].LoaiGhe,changed?'Thường':'VIP');assert.deepEqual(row.final.seats.slice(1),initial.seats.slice(1));assert.deepEqual(row.final.show,initial.show);}else{for(const [key,value] of Object.entries(delta))assert.deepEqual(row.final.show[0][key],changed?value:initial.show[0][key]);assert.deepEqual(row.final.seats,initial.seats);}
 }
 for(const key of ['movie','alternateMovie','room','cinema','pricing','product','payments'])assert.deepEqual(row.final[key],initial[key]);row.sessions={a:await cleanSession(a),b:await cleanSession(b)};row.status='PASS';e.cases.push(row);await cleanupFixture(observer,f);f=null;
}
try{
 const before=await snapshot(observer);
 for(const role of ['manager','admin'])for(const kind of ['show','seat'])for(const first of ['booking','update'])for(const finish of ['COMMIT','ROLLBACK'])await race(role,kind,first,finish);
 for(const role of ['manager','admin'])for(const finish of ['COMMIT','ROLLBACK'])await race(role,'movie','update',finish);
 const after=await snapshot(observer);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{await a.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await b.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');if(f)await cleanupFixture(observer,f);e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'historical-concurrency.json'),e);await a.close();await b.close();await observer.close();}
console.log(`PASS ${e.cases.length} real booking/update races: both winner orders,commit/rollback,current pricing,stale movie revalidation;DMV resource waits and final states;no drift/leaks.`);

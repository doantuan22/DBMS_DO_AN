import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sql,disposable,database,connect,snapshot,summarize,write,evidenceRoot } from '../../../scripts/db/concurrency-support/common-r22.mjs';
import { createFixture,cleanupFixture,state,bookingRequest,cleanSession } from '../../../scripts/db/concurrency-support/fixtures-r21.mjs';
disposable();const a=await connect(),b=await connect(),observer=await connect(),fixtures=[];
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',lastQuota:[],adminRaces:[]};
const outcome=promise=>promise.then(result=>({commit:true,output:result.output,recordsets:result.recordsets}),error=>({commit:false,error:{number:error.number,message:error.message}}));
async function blocked(waiter,blocker){
 const end=Date.now()+10000;
 while(Date.now()<end){
  const row=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query(`SELECT session_id,blocking_session_id,wait_type,wait_resource,status FROM sys.dm_exec_requests WHERE session_id=@Waiter AND blocking_session_id=@Blocker;`)).recordset[0];
  if(row){assert.match(row.wait_type,/^LCK_M_/);const locks=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query(`SELECT l.request_session_id,l.resource_type,l.request_mode,l.request_status,OBJECT_NAME(p.object_id) objectName,i.name indexName,l.resource_description FROM sys.dm_tran_locks l LEFT JOIN sys.partitions p ON p.hobt_id=l.resource_associated_entity_id LEFT JOIN sys.indexes i ON i.object_id=p.object_id AND i.index_id=p.index_id WHERE l.request_session_id IN(@Waiter,@Blocker) AND p.object_id=OBJECT_ID('dbo.KHUYENMAI');`)).recordset;assert.ok(locks.some(l=>l.objectName==='KHUYENMAI'));return{at:new Date().toISOString(),...row,locks};}await delay(25);
 }throw Error(`Missing actual promotion blocking ${waiter}->${blocker}`);
}
async function fixture(){const f=await createFixture(observer);fixtures.push(f);return f;}
function update(pool,f,row,kind){
 const admin=f.users.find(u=>u.Email==='admin@cinemadb.vn').NguoiDungID;
 const req=pool.request().input('ActorID',sql.Int,admin).input('KhuyenMaiID',sql.Int,f.promotion);
 if(kind==='delete')return req.execute('dbo.sp_Admin_Promotion_Delete');
 return req.input('MoTa',sql.NVarChar(255),row.MoTa).input('LoaiGiamGia',sql.NVarChar(20),row.LoaiGiamGia)
 .input('GiaTriGiam',sql.Decimal(18,2),kind==='value'?2000:row.GiaTriGiam).input('DonHangToiThieu',sql.Decimal(18,2),kind==='minimum'?170000.01:row.DonHangToiThieu)
 .input('GiamToiDa',sql.Decimal(18,2),row.GiamToiDa).input('NgayBatDau',sql.DateTime2(7),row.NgayBatDau)
 .input('NgayKetThuc',sql.DateTime2(7),kind==='end'?new Date(row.NgayBatDau.getTime()+1000):row.NgayKetThuc)
 .input('SoLuong',sql.Int,kind==='quota'?1:row.SoLuong).input('TrangThai',sql.NVarChar(50),kind==='pause'?'Tạm dừng':row.TrangThai).execute('dbo.sp_Admin_Promotion_Update');
}
try {
 const before=await snapshot(observer),sa=await cleanSession(a),sb=await cleanSession(b);assert.notEqual(sa.spid,sb.spid);
 for(const winner of ['customerA','customerB']){
  const f=await fixture(),g=await fixture();g.code=f.code;
  await observer.request().query(`UPDATE dbo.KHUYENMAI SET SoLuong=1 WHERE KhuyenMaiID=${f.promotion}`);
  const users=[f.users.find(u=>u.Email==='khachhang1@gmail.com').NguoiDungID,g.users.find(u=>u.Email==='khachhang2@gmail.com').NguoiDungID];
  const entry={name:winner+'-wins-last-quota',promotionId:f.promotion,code:f.code,quota:1,initialUsage:0,customers:users,spids:{a:sa.spid,b:sb.spid},initial:{a:await state(observer,f),b:await state(observer,g)},timeline:[]};
  const selected=winner==='customerA'?[f,g]:[g,f],actors=winner==='customerA'?users:[...users].reverse();
  await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');
  const started=new Date().toISOString();entry.first=await outcome(bookingRequest(a,selected[0],actors[0]).execute('dbo.sp_Booking_Create'));assert.equal(entry.first.commit,true);entry.timeline.push({started,event:'booking-consumed-inside-uncommitted-transaction'});
  const pending=outcome(bookingRequest(b,selected[1],actors[1]).execute('dbo.sp_Booking_Create'));
  entry.blocking=await blocked(sb.spid,sa.spid);entry.beforeCommit=await state(a,selected[0]);assert.equal(entry.beforeCommit.promotion.find(p=>p.KhuyenMaiID===f.promotion)?.SoLuongDaDung??(await a.request().query(`SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=${f.promotion}`)).recordset[0].SoLuongDaDung,1);
  await a.request().batch('COMMIT;');entry.timeline.push({at:new Date().toISOString(),event:'commit-first'});entry.second=await pending;assert.equal(entry.second.commit,false);assert.equal(entry.second.error.number,50029);
  entry.final={a:await state(observer,f),b:await state(observer,g)};assert.equal(entry.final.a.promotion[0].SoLuongDaDung,1);assert.equal(entry.final.a.orders.length+entry.final.b.orders.length,1);assert.equal(entry.final.a.tickets.length+entry.final.b.tickets.length,2);assert.equal(entry.final.a.foods.length+entry.final.b.foods.length,1);
  entry.sessions={a:await cleanSession(a),b:await cleanSession(b)};entry.status='PASS';evidence.lastQuota.push(entry);await cleanupFixture(observer,g);await cleanupFixture(observer,f);
 }
 for(const kind of ['pause','quota','end','minimum','value','delete'])for(const first of ['booking','admin']){
  const f=await fixture(),customer=f.users.find(u=>u.Email==='khachhang1@gmail.com').NguoiDungID;
  // Quota shrinking to one stays valid even after the booking-first consumption.
  // Produce initial usage through a real booking on separate parents/seats.
  let quotaFixture;
  if(kind==='quota'){
   await observer.request().query(`UPDATE dbo.KHUYENMAI SET SoLuong=2 WHERE KhuyenMaiID=${f.promotion}`);
   quotaFixture=await fixture();quotaFixture.code=f.code;
   const other=quotaFixture.users.find(u=>u.Email==='khachhang2@gmail.com').NguoiDungID;
   await bookingRequest(observer,quotaFixture,other).execute('dbo.sp_Booking_Create');
  }
  const initial=await state(observer,f),row=initial.promotion[0];
  const entry={name:`${kind}/${first}-first`,kind,first,spids:{a:sa.spid,b:sb.spid},initial,...(quotaFixture?{initialUsageBooking:await state(observer,quotaFixture)}:{}),timeline:[]};
  await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');
  const action=first==='booking'?bookingRequest(a,f,customer).execute('dbo.sp_Booking_Create'):update(a,f,row,kind);
  entry.first=await outcome(action);assert.equal(entry.first.commit,true,JSON.stringify(entry.first));
  const pending=outcome(first==='booking'?update(b,f,row,kind):bookingRequest(b,f,customer).execute('dbo.sp_Booking_Create'));
  entry.blocking=await blocked(sb.spid,sa.spid);entry.beforeCommit=await state(a,f);
  await a.request().batch('COMMIT;');entry.timeline.push({at:new Date().toISOString(),event:'commit-first'});entry.second=await pending;
  if(first==='admin'&&kind!=='value'){assert.equal(entry.second.commit,false);assert.equal(entry.second.error.number,50029);}
  else if(first==='booking'&&kind==='delete'){assert.equal(entry.second.commit,false);assert.equal(entry.second.error.number,50108);}
  else if(first==='booking'&&kind==='quota'){assert.equal(entry.second.commit,false);assert.equal(entry.second.error.number,547);}
  else assert.equal(entry.second.commit,true,JSON.stringify(entry.second));
  entry.final=await state(observer,f);const success=first==='booking'||kind==='value';assert.equal(entry.final.orders.length,success?1:0);assert.equal(entry.final.tickets.length,success?2:0);assert.equal(entry.final.foods.length,success?1:0);
  if(entry.final.promotion.length)assert.equal(entry.final.promotion[0].SoLuongDaDung,(kind==='quota'?1:0)+(success?1:0));
  if(success)assert.equal(Number(entry.final.orders[0].TienGiamGia),first==='admin'&&kind==='value'?2000:1000);
  entry.sessions={a:await cleanSession(a),b:await cleanSession(b)};entry.status='PASS';evidence.adminRaces.push(entry);if(quotaFixture)await cleanupFixture(observer,quotaFixture);await cleanupFixture(observer,f);
 }
 const after=await snapshot(observer);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);evidence.before=summarize(before);evidence.after=summarize(after);evidence.cleanup='PASS';evidence.status='PASS';
}catch(error){evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally{await a.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await b.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');for(const f of [...fixtures].reverse())await cleanupFixture(observer,f);evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'promotion-concurrency.json'),evidence);await a.close();await b.close();await observer.close();}
console.log(`PASS ${evidence.lastQuota.length} deterministic final-quota races and ${evidence.adminRaces.length} Admin races: DMV blocking/current values/clean transactions; no drift.`);

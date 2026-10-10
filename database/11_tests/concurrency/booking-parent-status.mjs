// Real two-session R2.1 protocol regression. All transaction boundaries are SQL Server statements.
import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sql,disposable,database,connect,snapshot,summarize,write,evidenceRoot } from '../../../scripts/db/concurrency-support/common-r21.mjs';
import { createFixture,cleanupFixture,state,bookingRequest,cleanSession } from '../../../scripts/db/concurrency-support/fixtures-r21.mjs';
disposable();const a=await connect(),b=await connect(),observer=await connect();
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]},fixtures=[];
const outcome=promise=>promise.then(result=>({commit:true,output:result.output}),error=>({commit:false,error:{number:error.number,message:error.message}}));
async function blocked(waiter,blocker) {
 const end=Date.now()+10000;
 while(Date.now()<end) {
  const row=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query(`
   SELECT session_id,blocking_session_id,wait_type,wait_resource,status FROM sys.dm_exec_requests WHERE session_id=@Waiter AND blocking_session_id=@Blocker;`)).recordset[0];
  if(row) {assert.match(row.wait_type,/^LCK_M_/);return{at:new Date().toISOString(),...row};}await delay(25);
 }
 throw new Error(`No real SQL blocking: ${waiter} -> ${blocker}`);
}
function writer(pool,f,kind) {
 const manager=f.users.find(u=>u.Email.startsWith('manager.')).NguoiDungID,admin=f.users.find(u=>u.Email.startsWith('admin@')).NguoiDungID;
 let req=pool.request();
 if(kind==='room-manager') return req.input('NguoiDungID',sql.Int,manager).input('PhongID',sql.Int,f.room).input('TenPhong',sql.NVarChar(100),'R21 API').input('LoaiPhong',sql.NVarChar(50),'2D').input('TrangThai',sql.NVarChar(50),'Bảo trì').execute('dbo.sp_Manager_Room_Update');
 if(kind==='room-admin') return req.input('ActorID',sql.Int,admin).input('PhongID',sql.Int,f.room).input('TenPhong',sql.NVarChar(100),'R21 API').input('LoaiPhong',sql.NVarChar(50),'2D').input('TrangThai',sql.NVarChar(50),'Ngưng hoạt động').execute('dbo.usp_Admin_Room_Update');
 if(kind==='cinema') return req.input('ActorID',sql.Int,admin).input('RapID',sql.Int,f.cinema).input('TenRap',sql.NVarChar(150),'R21 API').input('DiaChi',sql.NVarChar(255),'Fixture').input('ThanhPho',sql.NVarChar(100),'HCM').input('SoDienThoai',sql.VarChar(20),null).input('MoTa',sql.NVarChar(500),null).input('TrangThai',sql.NVarChar(50),'Tạm đóng').execute('dbo.sp_Admin_Cinema_Update');
 if(kind==='seat') return req.input('NguoiDungID',sql.Int,manager).input('GheID',sql.Int,f.seats[0]).input('LoaiGhe',sql.NVarChar(50),'Thường').input('TrangThai',sql.NVarChar(50),'Hỏng').execute('dbo.sp_Manager_Seat_Update');
 return req.input('ActorID',sql.Int,admin).input('PhimID',sql.Int,f.movie).input('TenPhim',sql.NVarChar(255),'R21 API').input('ThoiLuong',sql.Int,60)
 .input('NgayKhoiChieu',sql.Date,new Date(f.showDate.getTime()+(kind==='release-start'?1:-2)*86400000))
 .input('NgayKetThuc',sql.Date,new Date(f.showDate.getTime()+(kind==='release-end'?-1:2)*86400000))
 .input('TrangThai',sql.NVarChar(50),kind==='movie'?'Ngừng chiếu':'Sắp chiếu').execute('dbo.sp_Admin_Movie_Update');
}
try {
 const before=await snapshot(observer);const sa=await cleanSession(a),sb=await cleanSession(b);assert.notEqual(sa.spid,sb.spid);
 for(const kind of ['room-manager','room-admin','cinema','movie','release-start','release-end','seat']) for(const first of ['parent','booking']) {
  const f=await createFixture(observer);fixtures.push(f);const customer=f.users.find(u=>u.Email==='khachhang1@gmail.com').NguoiDungID;
  const entry={name:`${kind}/${first}-first`,kind,first,spids:{a:sa.spid,b:sb.spid},initial:await state(observer,f),timeline:[]};
  await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');
  try {
   const firstResult=await outcome(first==='parent'?writer(a,f,kind):bookingRequest(a,f,customer).execute('dbo.sp_Booking_Create'));
   assert.equal(firstResult.commit,true,JSON.stringify(firstResult));entry.firstResult=firstResult;
   const pending=outcome(first==='parent'?bookingRequest(b,f,customer).execute('dbo.sp_Booking_Create'):writer(b,f,kind));
   entry.blocking=await blocked(sb.spid,sa.spid);
   // A's locks still cover the current status at the actual commit boundary.
   entry.beforeCommit=await state(a,f);entry.timeline.push({at:new Date().toISOString(),event:'first-commit'});
   await a.request().batch('COMMIT TRANSACTION;');entry.secondResult=await pending;
   if(first==='parent') {assert.equal(entry.secondResult.commit,false);assert.equal(entry.secondResult.error.number,kind==='seat'?50024:50022);}
   else if(kind==='seat') {assert.equal(entry.secondResult.commit,false);assert.equal(entry.secondResult.error.number,50207);}
   else assert.equal(entry.secondResult.commit,true,JSON.stringify(entry.secondResult));
   entry.final=await state(observer,f);const count=first==='parent'?0:1;
   assert.equal(entry.final.orders.length,count);assert.equal(entry.final.tickets.length,count*2);assert.equal(entry.final.foods.length,count);assert.equal(entry.final.promotion[0].SoLuongDaDung,count);
   if(first==='booking') assert.equal(entry.beforeCommit.availability[0].IsBookable,true);
   entry.sessions={a:await cleanSession(a),b:await cleanSession(b)};assert.equal(entry.sessions.a.spid,sa.spid);assert.equal(entry.sessions.b.spid,sb.spid);
   entry.status='PASS';evidence.cases.push(entry);
  } finally {await a.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await b.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await cleanupFixture(observer,f);}
 }
 const after=await snapshot(observer);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.cleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {await a.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await b.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');for(const f of fixtures) await cleanupFixture(observer,f);
 evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'parent-concurrency.json'),evidence);await a.close();await b.close();await observer.close();}
console.log(`PASS ${evidence.cases.length} real parent/booking races: actual DMV blocking, ordered commits/rejects, atomic rows, clean transactions/schema.`);

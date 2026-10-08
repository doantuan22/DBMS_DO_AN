import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,env,database,disposable,connect,snapshot,summarize,batches,read,write,evidenceRoot} from './common.mjs';
import {createFixture,cleanupFixture,clearBookings,bookingRequest,state,cleanSession} from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const {startExpirePendingOrdersJob}=await import('../../backend/src/jobs/expirePendingOrders.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},e={database,status:'RUNNING',startedAt:new Date().toISOString(),cases:[],requests:[],races:[],nonMutation:[],job:[]};
let f,before,trigger=false,job;
const pass=(name,details={})=>e.cases.push({name,status:'PASS',...details});
async function current(){const s=await state(pool,f);s.payments=(await pool.request().input('Show',sql.Int,f.show).query('SELECT t.* FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show ORDER BY t.ThanhToanID')).recordset;return s;}
const money=s=>({orders:s.orders.map(({DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia})=>({DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia})),tickets:s.tickets.map(({VeID,GiaVe})=>({VeID,GiaVe})),foods:s.foods.map(({ChiTietDoAnID,DonGia,SoLuong})=>({ChiTietDoAnID,DonGia,SoLuong})),payments:s.payments.map(({ThanhToanID,SoTien})=>({ThanhToanID,SoTien}))});
async function unchanged(name,action){const old=await snapshot(pool),result=await action(),after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(old),name);e.nonMutation.push({name,status:'PASS',tables:27,before:summarize(old),after:summarize(after)});return result;}
async function api(role,method,route,body,status=200,code){
 const action=async()=>{const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)}),value=await response.json();e.requests.push({role,method,route,status:response.status,expected:status,code:value?.error?.code});assert.equal(response.status,status,`${method} ${route}: ${value?.error?.code}`);if(code)assert.equal(value.error.code,code);return value;};
 return method==='GET'?unchanged('HTTP '+role+' '+route,action):action();
}
function detail(p,id,user=f.customer){return p.request().input('NguoiDungID',sql.Int,user).input('DonDatVeID',sql.Int,id).execute('dbo.sp_Order_GetDetailByCustomer');}
function expire(p){return p.request().input('SuatChieuID',sql.Int,f.show).execute('dbo.sp_Order_ExpirePending');}
async function book(user=f.customer,seats=f.seats.slice(0,2)){const result=await bookingRequest(pool,f,user,seats).execute('dbo.sp_Booking_Create');const id=result.output.NewDonDatVeID;assert.ok(id);assert.equal((await pool.request().input('ID',sql.Int,id).query('SELECT DATEDIFF(SECOND,NgayDat,HanGiuCho) duration FROM dbo.DONDATVE WHERE DonDatVeID=@ID')).recordset[0].duration,300);return id;}
async function past(id){await pool.request().input('ID',sql.Int,id).query('UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(MINUTE,-1,dbo.fn_BayGio()) WHERE DonDatVeID=@ID');}
function attempt(p,id){return p.request().input('NguoiDungID',sql.Int,f.customer).input('DonDatVeID',sql.Int,id).input('PhuongThuc',sql.NVarChar(50),'VNPAY').output('ThanhToanID',sql.Int).output('MaGiaoDich',sql.VarChar(100)).execute('dbo.sp_Payment_CreateAttempt');}
function payment(p,id,status='Thành công'){return p.request().input('NguoiDungID',sql.Int,f.customer).input('ThanhToanID',sql.Int,id).input('TrangThaiThanhToan',sql.NVarChar(50),status).execute('dbo.sp_Payment_UpdateResult');}
async function readCase(name,id,expected,persisted=expected){
 const initial=await current(),sqlResult=await unchanged(name+' directSQL',()=>detail(pool,id));assert.equal(sqlResult.recordsets.length,4);assert.equal(sqlResult.recordsets[0][0].TrangThaiDon,expected);assert.equal(sqlResult.recordsets[0][0].NguoiDungID,f.customer);
 const response=await api('customer','GET',`/orders/${id}`);assert.deepEqual(Object.keys(response),['order']);assert.equal(response.order.status,expected);assert.equal(response.order.user.id,f.customer);assert.equal(response.order.total,169000);assert.equal(response.order.tickets.length,2);assert.equal(response.order.products[0].unitPrice,10000);
 const after=await current();assert.deepEqual(after,initial);assert.equal(after.orders.find(o=>o.DonDatVeID===id).TrangThai,persisted);pass(name,{order:id,projection:expected,persisted,sqlAndHttp:'PASS'});return response;
}
async function blocked(waiter,blocker){const end=Date.now()+8000;while(Date.now()<end){const r=(await pool.request().input('ID',sql.Int,waiter).query('SELECT session_id,blocking_session_id,wait_type FROM sys.dm_exec_requests WHERE session_id=@ID')).recordset[0];if(r?.blocking_session_id===blocker){assert.match(r.wait_type,/^LCK/);return r;}await new Promise(r=>setTimeout(r,30));}throw Error('Must observe actual lock blocking.');}
async function concurrency(kind){
 await clearBookings(pool,f);const id=await book();await past(id);const initial=await current(),a=await connect(),b=await connect();let pending;
 try{
  const sa=(await cleanSession(a)).spid,sb=(await cleanSession(b)).spid;
  if(kind==='read-first')await a.request().batch('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;BEGIN TRANSACTION;');else await a.request().batch('BEGIN TRANSACTION;');
  if(kind==='read-first'){const r=await detail(a,id);assert.equal(r.recordsets[0][0].TrangThaiDon,'Hết hạn');pending=expire(b).then(result=>({result}),error=>({number:error.number}));}
  else if(kind==='payment-first'){
   // Restore a valid hold before calling the unmodified payment command.
   await a.request().input('ID',sql.Int,id).query('UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(MINUTE,5,dbo.fn_BayGio()) WHERE DonDatVeID=@ID');
   const attemptResult=await attempt(a,id);await payment(a,attemptResult.output.ThanhToanID);pending=expire(b).then(result=>({result}),error=>({number:error.number}));
  }else{assert.equal((await expire(a)).recordset[0].SoDonHetHan,1);
   const action=kind==='expiry-before-payment'?attempt(b,id):kind==='expiry-before-booking'?bookingRequest(b,f,f.other,f.seats.slice(0,2)).execute('dbo.sp_Booking_Create'):detail(b,id);
   pending=action.then(result=>({result}),error=>({number:error.number}));
  }
  let wait,snapshotRead;
  if(kind==='expiry-before-read'){
   // Production database uses READ_COMMITTED_SNAPSHOT: reader sees committed versions.
   const committedBefore=await current();assert.deepEqual(committedBefore,initial);
   const read=await Promise.race([pending,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('RCSI reader did not finish before writer commit')),5000);timer.unref();})]);
   assert.ok(read.result);assert.equal(read.result.recordsets[0][0].TrangThaiDon,'Hết hạn');assert.ok(read.result.recordsets[1].every(t=>t.TrangThaiVe==='Đã đặt'));
   assert.equal((await a.request().query('SELECT @@TRANCOUNT n')).recordset[0].n,1);
   const during=await api('customer','GET',`/orders/${id}`);assert.equal(during.order.status,'Hết hạn');assert.ok(during.order.tickets.every(t=>t.status==='Đã đặt'));snapshotRead={completedBeforeWriterCommit:true,persistedCommittedStatus:committedBefore.orders[0].TrangThai,projection:read.result.recordsets[0][0].TrangThaiDon,ticketStatus:'Đã đặt',httpDuringWriter:200};
  }else wait=await blocked(sb,sa);
  await a.request().batch('COMMIT;');const result=await pending;
  if(kind==='expiry-before-payment'){assert.equal(result.number,50111);assert.equal((await current()).payments.length,0);}
  else assert.ok(result.result,JSON.stringify(result));
  const final=await current();
  if(kind==='payment-first'){assert.equal(result.result.recordset[0].SoDonHetHan,0);assert.equal(final.orders[0].TrangThai,'Đã thanh toán');assert.equal(final.promotion[0].SoLuongDaDung,1);assert.equal(final.payments[0].TrangThai,'Thành công');}
  else if(kind==='expiry-before-booking'){assert.equal(final.orders.length,2);assert.equal(final.orders.find(o=>o.DonDatVeID===id).TrangThai,'Hết hạn');assert.equal(final.promotion[0].SoLuongDaDung,1);assert.equal(final.tickets.filter(t=>t.TrangThai==='Đã hủy').length,2);assert.equal(final.tickets.filter(t=>t.TrangThai!=='Đã hủy').length,2);}
  else{assert.equal(final.orders[0].TrangThai,'Hết hạn');assert.equal(final.promotion[0].SoLuongDaDung,0);assert.ok(final.tickets.every(t=>t.TrangThai==='Đã hủy'));assert.deepEqual(money(final),money(initial));}
  if(kind==='expiry-before-read'){const afterRead=await unchanged('post-writer commit detail pure read',()=>detail(b,id));assert.equal(afterRead.recordsets[0][0].TrangThaiDon,'Hết hạn');assert.ok(afterRead.recordsets[1].every(t=>t.TrangThaiVe==='Đã hủy'));}
  await cleanSession(a);await cleanSession(b);e.races.push({name:kind,status:'PASS',sessions:[sa,sb],blocking:wait,snapshotRead,initial,final});pass('actual two-session '+kind);
 }finally{await a.request().batch('IF @@TRANCOUNT>0 ROLLBACK;').catch(()=>{});await pending;await a.close();await b.close();}
}
try{
 before=await snapshot(pool);e.isolation=(await pool.request().query('SELECT is_read_committed_snapshot_on,snapshot_isolation_state_desc FROM sys.databases WHERE database_id=DB_ID()')).recordset[0];assert.equal(e.isolation.is_read_committed_snapshot_on,true);assert.equal((await pool.request().query("SELECT COUNT(*) n FROM dbo.DONDATVE WHERE TrangThai=N'Chờ thanh toán' AND(HanGiuCho IS NULL OR HanGiuCho<=dbo.fn_BayGio())")).recordset[0].n,0,'Independent global job needs no preexisting eligible orders.');f=await createFixture(pool);
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['other','khachhang2@gmail.com'],['manager','manager.q1@cinemadb.vn'],['support','cskh@cinemadb.vn'],['admin','admin@cinemadb.vn']])tokens[role]=(await api(role,'POST','/auth/login',{Email:email,MatKhau:'123456'})).token;
 let id=await book(),attemptResult=await attempt(pool,id);
 await readCase('R4.7-01/10/11/12 future pending with held quota, tickets, processing payment',id,'Chờ thanh toán');
 const seats=await unchanged('public seat availability before deadline',()=>pool.request().input('SuatChieuID',sql.Int,f.show).execute('dbo.sp_Seat_ListByShowtime'));assert.equal(seats.recordset.filter(r=>r.TrangThaiGhe==='Đang giữ').length,2);pass('future holds occupy seats independent of detail');
 const otherId=await book(f.other,f.seats.slice(2,4));await past(id);await past(otherId);
 for(let n=0;n<3;n++)await readCase('R4.7-02/06/10/11/12 repeated expired pending '+n,id,'Hết hạn','Chờ thanh toán');
 let s=await current();assert.equal(s.promotion[0].SoLuongDaDung,2);assert.ok(s.orders.every(o=>o.TrangThai==='Chờ thanh toán'));assert.ok(s.tickets.every(t=>t.TrangThai==='Đã đặt'));pass('expired GET does not expire another Customer order or return either quota');
 const available=await unchanged('expired hold availability is read-only',()=>pool.request().input('SuatChieuID',sql.Int,f.show).execute('dbo.sp_Seat_ListByShowtime'));assert.ok(available.recordset.every(r=>r.TrangThaiGhe==='Trống'));pass('physical seat/held tickets preserved; availability ignores expired hold via existing SQL');
 for(const [user,number] of [[f.other,50033],[-12345,50300],[f.users.find(u=>u.Email==='admin@cinemadb.vn').NguoiDungID,50301]])await unchanged('direct unauthorized '+number,()=>assert.rejects(detail(pool,id,user),err=>err.number===number));
 await unchanged('direct missing order',()=>assert.rejects(detail(pool,2147483647),err=>err.number===50033));
 await api('other','GET',`/orders/${id}?userId=${f.customer}&role=KHACH_HANG&status=Đã%20thanh%20toán`,undefined,404,'ORDER_NOT_FOUND');
 for(const role of ['manager','support','admin'])await api(role,'GET',`/orders/${id}`,undefined,403,'CUSTOMER_REQUIRED');
 await api('none','GET',`/orders/${id}`,undefined,401,'UNAUTHENTICATED');await api('customer','GET','/orders/2147483647',undefined,404,'ORDER_NOT_FOUND');
 for(const value of ['0','-1','abc','2147483648'])await api('customer','GET','/orders/'+value,undefined,400,'INVALID_REQUEST');
 pass('R4.7-07/08 ownership/RBAC/missing/invalid/spoof inputs never mutate any table');
 assert.equal((await expire(pool)).recordset[0].SoDonHetHan,2);await readCase('R4.7-05 persisted expired after explicit lifecycle',id,'Hết hạn');
 const expiredStable=await snapshot(pool);assert.equal((await expire(pool)).recordset[0].SoDonHetHan,0);assert.deepEqual(summarize(await snapshot(pool)),summarize(expiredStable));pass('explicit expiry repeats idempotently without double quota return');
 await clearBookings(pool,f);id=await book();attemptResult=await attempt(pool,id);await payment(pool,attemptResult.output.ThanhToanID);await past(id);await readCase('R4.7-03 paid past deadline never effectively expired',id,'Đã thanh toán');
 const paidStable=await snapshot(pool);assert.equal((await expire(pool)).recordset[0].SoDonHetHan,0);assert.deepEqual(summarize(await snapshot(pool)),summarize(paidStable));pass('expiry cannot touch paid past/NULL deadline, payment or money');
 for(const status of ['Đã hủy','Hoàn tiền','Hoàn thành']){
  await pool.request().input('ID',sql.Int,id).input('Status',sql.NVarChar(50),status).query('UPDATE dbo.DONDATVE SET TrangThai=@Status,HanGiuCho=NULL WHERE DonDatVeID=@ID');
  await readCase('R4.7-04/schema-state read '+status+' NULL deadline',id,status);const stable=await snapshot(pool);assert.equal((await expire(pool)).recordset[0].SoDonHetHan,0);assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));pass('non-pending '+status+' excluded from expiry');
 }
 await clearBookings(pool,f);id=await book();await unchanged('pending NULL forbidden by existing trusted CHECK',()=>assert.rejects(pool.request().input('ID',sql.Int,id).query('UPDATE dbo.DONDATVE SET HanGiuCho=NULL WHERE DonDatVeID=@ID'),err=>err.number===547));pass('pending NULL runtime scenario N/A: CHECK enforces deadline, native547 without constraint disabling');
 // Execute the actual unchanged view expression at a single SQL DB instant for exact equality.
 const view=read(path.join(root,'database/06_views/vw_ChiTietDonDatVe.sql')),expression=/(CASE WHEN ddv\.TrangThai[^\n]+END) AS TrangThaiDon/.exec(view)[1].replaceAll('dbo.fn_BayGio()','@Now');
 const boundary=(await pool.request().query(`DECLARE @Now DATETIME2(7)=dbo.fn_BayGio();SELECT c.CaseName,c.Expected,${expression} projected,@Now dbNow,ddv.HanGiuCho deadline FROM(VALUES('before',N'Chờ thanh toán',DATEADD(SECOND,1,@Now),N'Chờ thanh toán'),('equal',N'Chờ thanh toán',@Now,N'Hết hạn'),('after',N'Chờ thanh toán',DATEADD(SECOND,-1,@Now),N'Hết hạn'),('paid',N'Đã thanh toán',DATEADD(SECOND,-1,@Now),N'Đã thanh toán'),('cancelled',N'Đã hủy',NULL,N'Đã hủy'),('expired',N'Hết hạn',NULL,N'Hết hạn'),('completed',N'Hoàn thành',NULL,N'Hoàn thành'),('refund',N'Hoàn tiền',NULL,N'Hoàn tiền')) c(CaseName,TrangThai,HanGiuCho,Expected) CROSS APPLY(SELECT c.TrangThai,c.HanGiuCho) ddv`)).recordset;
 assert.equal(boundary.length,8);for(const row of boundary)assert.equal(row.projected,row.Expected);assert.equal(boundary.find(r=>r.CaseName==='equal').dbNow.getTime(),boundary.find(r=>r.CaseName==='equal').deadline.getTime());e.boundary={status:'PASS',rows:boundary,method:'Actual view expression at one DB fn_BayGio instant, no global clock alteration'};pass('R4.7-09 exact SQL equality/before/after and every schema state');
 await pool.request().input('ID',sql.Int,id).query('UPDATE dbo.DONDATVE SET HanGiuCho=dbo.fn_BayGio() WHERE DonDatVeID=@ID');await readCase('runtime at-or-after DB deadline, persisted pending',id,'Hết hạn','Chờ thanh toán');
 // Independent default typed job: two eligible orders, one future hold and one paid order.
 await clearBookings(pool,f);const a=await book(f.customer,[f.seats[0]]),b=await book(f.other,[f.seats[1]]),future=await book(f.other,[f.seats[2]]),paid=await book(f.customer,[f.seats[3]]);const pa=await attempt(pool,paid);await payment(pool,pa.output.ThanhToanID);await past(a);await past(b);
 const jobBefore=await current(),requestsBefore=e.requests.length,logs=[],errors=[];
 job=startExpirePendingOrdersJob({intervalMs:30,log:{info:(message,data)=>logs.push({message,...data}),error:(message,data)=>errors.push({message,error:data.error?.number})}});
 const end=Date.now()+15000;while(!logs.some(r=>r.count===2)){if(Date.now()>end)throw Error('Actual timer-driven expiry did not execute.');await new Promise(r=>setTimeout(r,30));}job.stop();await job.tick();
 const jobAfter=await current();assert.equal(e.requests.length,requestsBefore);assert.equal(errors.length,0);assert.equal(jobAfter.orders.find(o=>o.DonDatVeID===future).TrangThai,'Chờ thanh toán');assert.equal(jobAfter.orders.find(o=>o.DonDatVeID===paid).TrangThai,'Đã thanh toán');assert.equal(jobAfter.orders.filter(o=>o.TrangThai==='Hết hạn').length,2);assert.equal(jobAfter.promotion[0].SoLuongDaDung,2);assert.deepEqual(money(jobAfter),money(jobBefore));
 const repeat=await snapshot(pool);for(let n=0;n<3;n++)await job.tick();assert.deepEqual(summarize(await snapshot(pool)),summarize(repeat));e.job.push({status:'PASS',timerMs:30,productionDefaultMs:60000,defaultTypedClient:true,noGetRequests:true,requestsBefore,requestsAfter:e.requests.length,logs,errors,before:jobBefore,after:jobAfter,repeatedTicks:3});pass('existing actual timer job expires without GET, releases only eligible tickets/quota once and preserves paid/future/money');job=undefined;
 // Fault after all three writes: failure must roll back order/ticket/quota atomically.
 await clearBookings(pool,f);id=await book();await past(id);assert.equal((await pool.request().query("SELECT OBJECT_ID('dbo.R47_ExpiryFailure') id")).recordset[0].id,null);await batches(pool,read(path.join(root,'database/11_tests/orders/expiry_rollback.sql')));trigger=true;
 await pool.request().input('ID',sql.Int,f.promotion).query("EXEC sys.sp_set_session_context @key=N'R47FailPromo',@value=@ID");const faultBefore=await snapshot(pool);await assert.rejects(expire(pool),err=>err.number===51047);assert.deepEqual(summarize(await snapshot(pool)),summarize(faultBefore));
 const observed=(await pool.request().query("SELECT CONVERT(INT,SESSION_CONTEXT(N'R47ObservedExpired')) expired,CONVERT(INT,SESSION_CONTEXT(N'R47ObservedUsage')) usage")).recordset[0];assert.deepEqual(observed,{expired:1,usage:0});await cleanSession(pool);await pool.request().query("EXEC sys.sp_set_session_context @key=N'R47FailPromo',@value=NULL;EXEC sys.sp_set_session_context @key=N'R47ObservedExpired',@value=NULL;EXEC sys.sp_set_session_context @key=N'R47ObservedUsage',@value=NULL");await pool.request().batch('DROP TRIGGER dbo.R47_ExpiryFailure;');trigger=false;pass('expiry fault after order/ticket/quota writes rolls back all tables, no open transaction',{observed});
 // Expired payment remains rejected even though GET no longer mutates it first.
 await api('customer','POST',`/orders/${id}/payments`,{paymentMethod:'VNPAY'},409,'ORDER_HOLD_EXPIRED');s=await current();assert.equal(s.orders[0].TrangThai,'Hết hạn');assert.equal(s.promotion[0].SoLuongDaDung,0);assert.equal(s.payments.length,0);pass('POST expired attempt revalidates SQL deadline and performs authoritative expiry independently');
 await clearBookings(pool,f);id=await book();const p1=await api('customer','POST',`/orders/${id}/payments`,{paymentMethod:'VNPAY'},201);const originalDeadline=(await current()).orders[0].HanGiuCho;await api('customer','POST',`/orders/${id}/payments/${p1.payment.id}/result`,{status:'Thất bại'});assert.equal((await current()).orders[0].HanGiuCho.getTime(),originalDeadline.getTime());
 const p2=await api('customer','POST',`/orders/${id}/payments`,{paymentMethod:'MOMO'},201);await api('customer','POST',`/orders/${id}/payments/${p2.payment.id}/result`,{status:'Thành công'});const paidSnapshot=await snapshot(pool);await api('customer','POST',`/orders/${id}/payments/${p2.payment.id}/result`,{status:'Thành công'});assert.deepEqual(summarize(await snapshot(pool)),summarize(paidSnapshot));await readCase('real HTTP failed attempt/retry/payment success and repeated result',id,'Đã thanh toán');
 await clearBookings(pool,f);id=await book();const late=await attempt(pool,id);await past(id);await api('customer','POST',`/orders/${id}/payments/${late.output.ThanhToanID}/result`,{status:'Thành công'},409,'ORDER_HOLD_EXPIRED');s=await current();assert.equal(s.orders[0].TrangThai,'Hết hạn');assert.equal(s.payments[0].TrangThai,'Đang xử lý');assert.equal(s.promotion[0].SoLuongDaDung,0);pass('late result retains existing50111 rule; no success/points/amount alteration, no hold extension');
 for(const kind of ['expiry-before-read','read-first','expiry-before-payment','payment-first','expiry-before-booking'])await concurrency(kind);
 await cleanupFixture(pool,f);f=null;await cleanSession(pool);const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));Object.assign(e,{status:'PASS',cleanup:'PASS',before:summarize(before),after:summarize(after),completedAt:new Date().toISOString()});
 console.log(`PASS detail/expiry: ${e.cases.length} cases; ${e.requests.length} HTTP requests; ${e.nonMutation.length} full 27-table non-mutation checks; ${e.races.length} actual races; independent real timer job; cleanup PASS.`);
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{job?.stop();await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;').catch(()=>{});if(trigger)await pool.request().batch('DROP TRIGGER dbo.R47_ExpiryFailure;');if(f)await cleanupFixture(pool,f);write(path.join(evidenceRoot,'detail-tests.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();}

import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,disposable,database,connect,snapshot,summarize,batches,root,read,write,evidenceRoot } from './common.mjs';
import { createFixture,cleanupFixture,state,monetary,bookingRequest,cleanSession,updateShow,updateSeat,cancel,historicalState,paid,paymentAttempt,pricingUpdate,productUpdate } from './fixtures.mjs';
disposable();const pool=await connect(),e={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[],monetary:[],rollback:[]};let f;
async function run(name,role,kind,prepare,change,errorNumber){
 f=await createFixture(pool);if(prepare)await prepare(f);const initial=await state(pool,f),row=kind==='show'?initial.show[0]:initial.seats[0],delta=typeof change==='function'?change(f,row):change;
 const pre=errorNumber?await snapshot(pool):null;
 if(errorNumber)await assert.rejects(kind==='show'?updateShow(pool,f,role,row,delta):updateSeat(pool,f,role,row,delta),r=>r.number===errorNumber);
 else {const result=await (kind==='show'?updateShow(pool,f,role,row,delta):updateSeat(pool,f,role,row,delta));if(kind==='show'){assert.equal(result.recordset.length,1);assert.equal(result.recordset[0].SuatChieuID,f.show);}}
 const final=await state(pool,f);assert.deepEqual(monetary(final),monetary(initial),name);
 if(errorNumber){assert.deepEqual(final,initial,name);assert.deepEqual((await snapshot(pool)).data,pre.data,name);}
 else{const changed=kind==='show'?final.show[0]:final.seats[0];for(const [key,value] of Object.entries(delta))assert.deepEqual(changed[key],value,name+':'+key);for(const key of ['tickets','foods','orders','payments','movie','room','cinema','pricing','product'])assert.deepEqual(final[key],initial[key],name+':'+key);}
 e.cases.push({name,role,kind,requested:delta,...(errorNumber?{sqlError:errorNumber}:{}),initial,final,session:await cleanSession(pool),status:'PASS'});await cleanupFixture(pool,f);f=null;
}
async function book(f){return bookingRequest(pool,f,f.customer).execute('dbo.sp_Booking_Create');}
const history=(status,ticket='Đã hủy')=>async f=>{await book(f);if(status==='active')return;if(status==='Đã thanh toán'){await paid(pool,f,(await state(pool,f)).orders[0].DonDatVeID);return;}await historicalState(pool,f,status,ticket);};
try{
 const before=await snapshot(pool);
 for(const role of ['manager','admin']){
  for(const [name,change] of [['unused-time',(_f,r)=>({ThoiGianBatDau:new Date(r.ThoiGianBatDau.getTime()+1800000),ThoiGianKetThuc:new Date(r.ThoiGianKetThuc.getTime()+1800000)})],['unused-format',{DinhDang:'3D'}],['unused-price',{GiaVeCoBan:90000}],['unused-movie',f=>({PhimID:f.alternateMovie})]])await run(name,role,'show',null,change);
  const changes=[['movie',f=>({PhimID:f.alternateMovie})],['start',(_f,r)=>({ThoiGianBatDau:new Date(r.ThoiGianBatDau.getTime()+900000)})],['end',(_f,r)=>({ThoiGianKetThuc:new Date(r.ThoiGianKetThuc.getTime()+900000)})],['format',()=>({DinhDang:'3D'})],['price',()=>({GiaVeCoBan:90000})]];
  for(const status of ['Đã hủy','Hết hạn'])for(const [field,change] of changes)await run(`history-${status}-${field}-mixed-status`,role,'show',history(status),(f,r)=>({...change(f,r),TrangThai:'Đóng bán'}),50120);
  for(const status of ['active','Đã thanh toán','Hoàn thành','Hoàn tiền','Chờ thanh toán'])await run(`history-${status}-price`,role,'show',history(status),{GiaVeCoBan:90000},50120);
  for(const status of ['active','Đã thanh toán','Đã hủy','Hết hạn','Hoàn thành','Hoàn tiền','Chờ thanh toán']){
   await run(`history-${status}-unchanged`,role,'show',history(status),{});
   await run(`history-${status}-close-sale`,role,'show',history(status),{TrangThai:'Đóng bán'});
  }
  await run('historical-null-price',role,'show',history('Đã hủy'),{GiaVeCoBan:null},50120);
  await run('show-missing',role,'show',null,{SuatChieuID:2147483647},50058);
  await run('unused-seat-type',role,'seat',null,{LoaiGhe:'Thường'});
  for(const [status,ticket] of [['active','Đã đặt'],['Đã hủy','Đã hủy'],['Hết hạn','Đã hủy'],['Hoàn thành','Đã sử dụng']])await run(`seat-history-${status}-mixed-type-status`,role,'seat',history(status,ticket),{LoaiGhe:'Thường',TrangThai:'Hỏng'},50207);
  for(const status of ['Hoạt động','Bảo trì','Hỏng'])await run('historical-canceled-seat-status-'+status,role,'seat',history('Đã hủy'),{TrangThai:status});
  await run('used-ticket-unchanged-type',role,'seat',history('Hoàn thành','Đã sử dụng'),{},undefined);
  await run('active-future-ticket-unchanged-still-operationally-blocked',role,'seat',history('active'),{},50207);
  await run('historical-null-seat-type',role,'seat',history('Đã hủy'),{LoaiGhe:null},50207);
  await run('seat-missing',role,'seat',null,{GheID:2147483647},role==='admin'?50206:50109);
  // Canonical cancellation keeps held-order guard and monetary snapshots.
  for(const usage of ['active','Hết hạn','Đã thanh toán']){
   f=await createFixture(pool);await history(usage)(f);const initial=await state(pool,f);
   if(usage==='active')await assert.rejects(cancel(pool,f,role),r=>r.number===50118);else await cancel(pool,f,role);
   const final=await state(pool,f);assert.deepEqual(monetary(final),monetary(initial));if(usage==='active')assert.deepEqual(final,initial);else{assert.equal(final.show[0].TrangThai,'Đã hủy');assert.equal(final.show[0].PhimID,initial.show[0].PhimID);assert.equal(final.orders.length,1);}
   e.cases.push({name:`canonical-cancel-${usage}`,role,kind:'cancel',initial,final,...(usage==='active'?{sqlError:50118}:{}),session:await cleanSession(pool),status:'PASS'});await cleanupFixture(pool,f);f=null;
  }
 }
 // Scope and roles are checked before any target changes.
 f=await createFixture(pool);const scopeInitial=await state(pool,f);
 for(const kind of ['show','seat'])for(const [role,id,number] of [['manager',f.outsideManager.NguoiDungID,50050],['admin',f.customer,50301]]){
  const operation=kind==='show'?updateShow(pool,f,role,scopeInitial.show[0],{GiaVeCoBan:90000},id):updateSeat(pool,f,role,scopeInitial.seats[0],{LoaiGhe:'Thường'},id);await assert.rejects(operation,r=>r.number===number);assert.deepEqual(await state(pool,f),scopeInitial);e.cases.push({name:kind+'-'+(number===50050?'scope':'wrong-role'),role,kind,sqlError:number,initial:scopeInitial,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'});
 }
 for(const role of ['manager','admin']){
  const show=scopeInitial.show[0],req=pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,f[role]).input('SuatChieuID',sql.Int,f.show).input('PhimID',sql.Int,show.PhimID).input('ThoiGianBatDau',sql.DateTime2(7),show.ThoiGianBatDau).input('ThoiGianKetThuc',sql.DateTime2(7),show.ThoiGianKetThuc).input('DinhDang',sql.NVarChar(50),show.DinhDang).input('GiaVeCoBan',sql.Decimal(18,2),show.GiaVeCoBan).input('TrangThai',sql.NVarChar(50),show.TrangThai).input('PhongID',sql.Int,f.room);let contractError;
  await assert.rejects(req.execute(role==='admin'?'dbo.usp_Admin_Showtime_Update':'dbo.sp_Manager_Showtime_Update'),r=>{contractError=r.number;return [8144,8145].includes(r.number);});assert.deepEqual(await state(pool,f),scopeInitial);e.cases.push({name:'room-transfer-not-supported',role,kind:'contract',sqlError:contractError,final:scopeInitial,status:'PASS'});
  await assert.rejects(pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,f[role]).input('SuatChieuID',sql.Int,f.show).execute(role==='admin'?'dbo.usp_Admin_Showtime_Update':'dbo.sp_Manager_Showtime_Update'),r=>r.number===201);e.cases.push({name:'required-structural-parameters-not-patch',role,kind:'contract',sqlError:201,final:scopeInitial,status:'PASS'});
 }
 await cleanupFixture(pool,f);f=null;
 // Native SQL values keep full datetime2(7) equality, including sub-milliseconds.
 f=await createFixture(pool);await pool.request().query(`UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(NANOSECOND,100,ThoiGianBatDau),ThoiGianKetThuc=DATEADD(NANOSECOND,100,ThoiGianKetThuc) WHERE SuatChieuID=${f.show};`);await book(f);
 for(const role of ['manager','admin'])await pool.request().batch(`DECLARE @Movie INT,@Start DATETIME2(7),@End DATETIME2(7),@Format NVARCHAR(50),@Price DECIMAL(18,2),@Status NVARCHAR(50);SELECT @Movie=PhimID,@Start=ThoiGianBatDau,@End=ThoiGianKetThuc,@Format=DinhDang,@Price=GiaVeCoBan,@Status=TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=${f.show};EXEC dbo.${role==='admin'?'usp_Admin_Showtime_Update @ActorID':'sp_Manager_Showtime_Update @NguoiDungID'}=${f[role]},@SuatChieuID=${f.show},@PhimID=@Movie,@ThoiGianBatDau=@Start,@ThoiGianKetThuc=@End,@DinhDang=@Format,@GiaVeCoBan=@Price,@TrangThai=@Status;`);
 e.precision={name:'native-datetime2-7-unchanged',final:await state(pool,f),session:await cleanSession(pool),status:'PASS'};await cleanupFixture(pool,f);f=null;
 // Historical monetary values stay stored while canonical catalog pricing changes.
 for(const role of ['manager','admin']){
  f=await createFixture(pool);const booking=await book(f),order=booking.output.NewDonDatVeID;await paid(pool,f,order);const initial=await state(pool,f),values=monetary(initial);assert.equal(values.tickets[0].GiaVe,95000);assert.equal(values.foods[0].DonGia,10000);assert.equal(values.payments[0].SoTien,199000);
  await pricingUpdate(pool,f,role,45000);await productUpdate(pool,f,40000);const current=(await pool.request().query(`SELECT dbo.fn_TinhGiaVe(${f.show},${f.seats[0]}) currentTicketPrice`)).recordset[0].currentTicketPrice;assert.equal(current,125000);
  const detail=await pool.request().input('NguoiDungID',sql.Int,f.customer).input('DonDatVeID',sql.Int,order).execute('dbo.sp_Order_GetDetailByCustomer');assert.equal(detail.recordsets[1][0].GiaVe,95000);assert.equal(detail.recordsets[2][0].DonGia,10000);assert.equal(detail.recordsets[3][0].SoTien,199000);assert.equal(detail.recordsets[2][0].TenSanPham,'R32 renamed product');const final=await state(pool,f);assert.deepEqual(monetary(final),values);e.monetary.push({role,initial,currentCatalog:{ticketPrice:current,productPrice:40000},detail:detail.recordsets.map((rows,i)=>i===0?rows.map(({TongTienVe,TongTienDoAn,TienGiamGia,TongTienThanhToan})=>({TongTienVe,TongTienDoAn,TienGiamGia,TongTienThanhToan})):rows),final,session:await cleanSession(pool),status:'PASS'});await cleanupFixture(pool,f);f=null;
 }
 f=await createFixture(pool);const start=await state(pool,f);await pool.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');await updateShow(pool,f,'admin',start.show[0],{GiaVeCoBan:90000});await updateSeat(pool,f,'manager',start.seats[0],{LoaiGhe:'Thường'});const outer=(await pool.request().query('SELECT @@TRANCOUNT trancount,XACT_STATE() xactState')).recordset[0];assert.deepEqual(outer,{trancount:1,xactState:1});await pool.request().batch('ROLLBACK;');assert.deepEqual(await state(pool,f),start);e.outerTransaction={outer,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'};
 await pool.request().query(`EXEC sys.sp_set_session_context @key=N'R32_Show',@value=${f.show};EXEC sys.sp_set_session_context @key=N'R32_Seat',@value=${f.seats[0]};`);await batches(pool,read(path.join(root,'database/11_tests/history/update_rollback.sql')));
 try{for(const role of ['manager','admin'])for(const kind of ['show','seat']){await assert.rejects(kind==='show'?updateShow(pool,f,role,start.show[0],{GiaVeCoBan:90000}):updateSeat(pool,f,role,start.seats[0],{LoaiGhe:'Thường',TrangThai:'Hỏng'}),r=>r.number===(kind==='show'?51032:51033));const observed=(await pool.request().query("SELECT CONVERT(DECIMAL(18,2),SESSION_CONTEXT(N'R32_ObservedPrice')) price,CONVERT(NVARCHAR(50),SESSION_CONTEXT(N'R32_ObservedType')) seatType")).recordset[0];if(kind==='show')assert.equal(observed.price,90000);else assert.equal(observed.seatType,'Thường');assert.deepEqual(await state(pool,f),start);e.rollback.push({role,kind,observed,initial:start,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'});}}
 finally{await pool.request().batch('DROP TRIGGER IF EXISTS dbo.R32_ShowFailure;DROP TRIGGER IF EXISTS dbo.R32_SeatFailure;');}
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={number:error.number,message:error.message};throw error;}
finally{await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R32_ShowFailure;DROP TRIGGER IF EXISTS dbo.R32_SeatFailure;');if(f)await cleanupFixture(pool,f);e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'sql-tests.json'),e);await pool.close();}
console.log(`PASS SQL history:${e.cases.length} cases,${e.monetary.length} monetary regressions,${e.rollback.length} injected write rollbacks;native precision/outer transaction;no data/schema drift.`);

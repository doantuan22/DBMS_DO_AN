import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,env,root,connect,snapshot,summarize,read,write,evidenceRoot,batches } from './common.mjs';
import { createFixture,cleanupFixture,state,monetary,historicalState,cleanSession,updateShow,updateSeat } from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const url=`http://127.0.0.1:${server.address().port}/api`,tokens={},e={database,startedAt:new Date().toISOString(),status:'RUNNING',requests:[],cases:[],monetary:[]};let f,permissionRemoved=false;
async function api(role,method,route,body,expected){
 const response=await fetch(url+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)}),result=await response.json();
 e.requests.push({role,method,route,status:response.status,expected,...(result.error?{error:result.error}:{})});assert.equal(response.status,expected,JSON.stringify(result));
 if(result.error)assert.ok(!/dbo\.|nvarchar|SELECT|THROW|stack|connection|5103[23]|Injected/i.test(JSON.stringify(result.error)));return result;
}
const showBody=r=>({movieId:r.PhimID,startsAt:r.ThoiGianBatDau.toISOString(),endsAt:r.ThoiGianKetThuc.toISOString(),format:r.DinhDang,basePrice:r.GiaVeCoBan,status:r.TrangThai});
const seatBody=r=>({type:r.LoaiGhe,status:r.TrangThai});
async function book(){await api('customer','POST','/bookings',{showtimeId:f.show,seatIds:f.seats.slice(0,2),products:[{productId:f.product,quantity:1}],promotionCode:f.code},201);return (await state(pool,f)).orders[0].DonDatVeID;}
async function reads(role,kind){const s=await state(pool,f),reply=await api(role,'GET',kind==='show'?(role==='admin'?`/admin/showtimes?cinemaId=${f.cinema}`:`/manager/cinemas/${f.cinema}/showtimes`):(role==='admin'?`/admin/seats?roomId=${f.room}`:`/manager/rooms/${f.room}/seats`),undefined,200),row=reply[kind==='show'?'showtimes':'seats'].find(r=>(r.id??r.SuatChieuID??r.GheID)===(kind==='show'?f.show:f.seats[0]));assert.ok(row);if(kind==='show'){assert.equal(row.basePrice??row.GiaVeCoBan,s.show[0].GiaVeCoBan);assert.equal(row.status??row.TrangThaiSuatChieu??row.TrangThai,s.show[0].TrangThai);}else{assert.equal(row.type??row.LoaiGhe,s.seats[0].LoaiGhe);assert.equal(row.status??row.TrangThai,s.seats[0].TrangThai);}return row;}
async function run(name,role,kind,usage,delta,expected=200,errorCode,actingRole=role,target){
 f=await createFixture(pool);if(usage){const order=await book();if(usage==='paid'){const p=await api('customer','POST',`/orders/${order}/payments`,{paymentMethod:'VNPAY'},201);await api('customer','POST',`/orders/${order}/payments/${p.payment.id}/result`,{status:'Thành công'},200);}else if(usage!=='active')await historicalState(pool,f,usage,usage==='Hoàn thành'?'Đã sử dụng':'Đã hủy');}
 const initial=await state(pool,f),row=kind==='show'?initial.show[0]:initial.seats[0],base=kind==='show'?showBody(row):seatBody(row),body=typeof delta==='function'?delta(base,f):{...base,...delta},pre=expected===200?null:await snapshot(pool),response=await api(actingRole,'PUT',`/${role}/${kind==='show'?'showtimes':'seats'}/${target??(kind==='show'?f.show:f.seats[0])}`,body,expected);
 if(errorCode)assert.equal(response.error.code,errorCode);const final=await state(pool,f);assert.deepEqual(monetary(final),monetary(initial));
 if(expected!==200){assert.deepEqual(final,initial);assert.deepEqual((await snapshot(pool)).data,pre.data);}else{const changed=kind==='show'?showBody(final.show[0]):seatBody(final.seats[0]);assert.deepEqual(changed,body);if(kind==='show'&&role==='manager'){assert.equal(response.showtime.id,f.show);assert.equal(response.showtime.status,body.status);}for(const key of ['tickets','foods','orders','payments','movie','room','cinema','pricing','product'])assert.deepEqual(final[key],initial[key]);}
 e.cases.push({name,role,kind,response,initial,read:await reads(role,kind),final,session:await cleanSession(pool),status:'PASS'});await cleanupFixture(pool,f);f=null;
}
try{
 const before=await snapshot(pool);
 for(const [role,Email] of [['admin','admin@cinemadb.vn'],['manager','manager.q1@cinemadb.vn'],['customer','khachhang1@gmail.com'],['outside','manager.q7@cinemadb.vn']]){if(role==='outside')continue;tokens[role]=(await api(role,'POST','/auth/login',{Email,MatKhau:'123456'},200)).token;}
 f=await createFixture(pool);tokens.outside=(await api('outside','POST','/auth/login',{Email:f.outsideManager.Email,MatKhau:'123456'},200)).token;await cleanupFixture(pool,f);f=null;
 for(const role of ['manager','admin']){
  for(const [name,delta] of [['unused-time',b=>({...b,startsAt:new Date(Date.parse(b.startsAt)+900000).toISOString(),endsAt:new Date(Date.parse(b.endsAt)+900000).toISOString()})],['unused-format',{format:'3D'}],['unused-price',{basePrice:90000}],['unused-movie',(b,f)=>({...b,movieId:f.alternateMovie})]])await run(name,role,'show',null,delta);
  for(const [field,delta] of [['movieId',(b,f)=>({...b,movieId:f.alternateMovie,status:'Đóng bán'})],['startsAt',b=>({...b,startsAt:new Date(Date.parse(b.startsAt)+900000).toISOString(),status:'Đóng bán'})],['endsAt',b=>({...b,endsAt:new Date(Date.parse(b.endsAt)+900000).toISOString(),status:'Đóng bán'})],['format',{format:'3D',status:'Đóng bán'}],['basePrice',{basePrice:90000,status:'Đóng bán'}]])await run('canceled-history-'+field,role,'show','Đã hủy',delta,409,'SHOWTIME_HAS_ORDERS');
  for(const usage of ['active','paid','Hết hạn','Hoàn thành','Hoàn tiền'])await run('history-'+usage+'-price',role,'show',usage,{basePrice:90000},409,'SHOWTIME_HAS_ORDERS');
  await run('history-unchanged',role,'show','Đã hủy',{});await run('history-close-sales',role,'show','paid',{status:'Đóng bán'});
  await run('unused-seat-type',role,'seat',null,{type:'Thường'});
  for(const usage of ['active','Đã hủy','Hết hạn','Hoàn thành'])await run('history-seat-'+usage,role,'seat',usage,{type:'Thường',status:'Hỏng'},409,'SEAT_HAS_TICKET_HISTORY');
  for(const status of ['Hoạt động','Bảo trì','Hỏng'])await run('history-seat-operational-'+status,role,'seat','Đã hủy',{status});
  await run('used-seat-unchanged',role,'seat','Hoàn thành',{});await run('active-seat-unchanged-existing-guard',role,'seat','active',{},409,'SEAT_HAS_TICKET_HISTORY');
  for(const kind of ['show','seat']){
   await run('omitted-required-'+kind,role,kind,'Đã hủy',()=>({}),400,'INVALID_REQUEST');
   await run('null-required-'+kind,role,kind,'Đã hủy',kind==='show'?{basePrice:null}:{type:null},400,'INVALID_REQUEST');
   await run('missing-'+kind,role,kind,null,{},404,kind==='show'?'SHOWTIME_NOT_FOUND':role==='manager'?'MANAGER_RESOURCE_NOT_FOUND':'SEAT_NOT_FOUND',role,2147483647);
   await run('wrong-role-'+kind,role,kind,null,{},403,role==='manager'?'MANAGER_REQUIRED':'ADMIN_REQUIRED','customer');
   await run('unauthenticated-'+kind,role,kind,null,{},401,'UNAUTHENTICATED','none');
  }
  await run('room-transfer-unsupported',role,'show','Đã hủy',(b,f)=>({...b,roomId:f.room}),400,'UNKNOWN_REQUEST_FIELD');
 }
 for(const kind of ['show','seat'])await run('manager-outside-scope-'+kind,'manager',kind,null,{},403,'MANAGER_CINEMA_FORBIDDEN','outside');
 f=await createFixture(pool);const permissionInitial=await state(pool,f);
 await pool.request().batch(`SELECT vq.* INTO #R32Permission FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG n ON n.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE n.NguoiDungID=${f.admin} AND q.MaQuyen IN('QL_SUAT_CHIEU','QL_GHE');DELETE vq FROM dbo.VAITRO_QUYEN vq JOIN #R32Permission p ON p.VaiTroID=vq.VaiTroID AND p.QuyenID=vq.QuyenID;`);permissionRemoved=true;
 for(const kind of ['show','seat']){const response=await api('admin','PUT',kind==='show'?`/admin/showtimes/${f.show}`:`/admin/seats/${f.seats[0]}`,kind==='show'?showBody(permissionInitial.show[0]):seatBody(permissionInitial.seats[0]),403);assert.equal(response.error.code,'FORBIDDEN');await assert.rejects(kind==='show'?updateShow(pool,f,'admin',permissionInitial.show[0]):updateSeat(pool,f,'admin',permissionInitial.seats[0]),r=>r.number===50302);assert.deepEqual(await state(pool,f),permissionInitial);e.cases.push({name:'admin-live-permission-'+kind,sqlError:50302,response,initial:permissionInitial,final:await state(pool,f),status:'PASS'});}
 await pool.request().batch('INSERT dbo.VAITRO_QUYEN SELECT * FROM #R32Permission;DROP TABLE #R32Permission;');permissionRemoved=false;await cleanupFixture(pool,f);f=null;
 for(const role of ['manager','admin']){
  f=await createFixture(pool);const order=await book(),p=await api('customer','POST',`/orders/${order}/payments`,{paymentMethod:'VNPAY'},201);await api('customer','POST',`/orders/${order}/payments/${p.payment.id}/result`,{status:'Thành công'},200);
  const initial=await state(pool,f),detailBefore=(await api('customer','GET',`/orders/${order}`,undefined,200)).order;
  await api(role,'PUT',`/${role}/pricing/${f.pricing}`,{surcharge:45000,status:'Áp dụng'},200);
  await api('admin','PUT',`/admin/products/${f.product}`,{name:'R32 renamed product',type:'Snack',price:40000,status:'Đang bán'},200);
  const detail=(await api('customer','GET',`/orders/${order}`,undefined,200)).order,final=await state(pool,f);assert.deepEqual(monetary(final),monetary(initial));for(const key of ['ticketTotal','productTotal','discountTotal','total','tickets','payments'])assert.deepEqual(detail[key],detailBefore[key]);assert.equal(detail.tickets[0].price,95000);assert.equal(detail.products[0].unitPrice,10000);assert.equal(detail.payments[0].amount,199000);assert.equal(detail.products[0].name,'R32 renamed product');assert.equal(final.pricing[0].PhuThu,45000);assert.equal(final.product[0].Gia,40000);e.monetary.push({role,detailBefore,detail,initial,final,status:'PASS'});await cleanupFixture(pool,f);f=null;
 }
 f=await createFixture(pool);const injectedStart=await state(pool,f),hook=read(path.join(root,'database/11_tests/history/update_rollback.sql')).replace("TRY_CONVERT(INT,SESSION_CONTEXT(N'R32_Show'))",String(f.show)).replace("TRY_CONVERT(INT,SESSION_CONTEXT(N'R32_Seat'))",String(f.seats[0]));
 await batches(pool,hook);
 try{for(const role of ['manager','admin'])for(const kind of ['show','seat']){const response=await api(role,'PUT',kind==='show'?`/${role}/showtimes/${f.show}`:`/${role}/seats/${f.seats[0]}`,kind==='show'?{...showBody(injectedStart.show[0]),basePrice:90000}:{...seatBody(injectedStart.seats[0]),type:'Thường'},500);assert.equal(response.error.message,'Internal server error');assert.deepEqual(await state(pool,f),injectedStart);e.cases.push({name:'unexpected-after-write-'+role+'-'+kind,response,initial:injectedStart,read:await reads(role,kind),final:await state(pool,f),status:'PASS'});}}
 finally{await pool.request().batch('DROP TRIGGER IF EXISTS dbo.R32_ShowFailure;DROP TRIGGER IF EXISTS dbo.R32_SeatFailure;');}
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.session=await cleanSession(pool);e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{try{if(permissionRemoved)await pool.request().batch('INSERT dbo.VAITRO_QUYEN SELECT * FROM #R32Permission;DROP TABLE #R32Permission;');await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R32_ShowFailure;DROP TRIGGER IF EXISTS dbo.R32_SeatFailure;');if(f)await cleanupFixture(pool,f);}catch(error){e.status='FAIL';e.cleanupError={message:error.message,number:error.number};}finally{e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'api-tests.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();}}
console.log(`PASS real Express/SQL: ${e.requests.length} requests,${e.cases.length} cases,${e.monetary.length} monetary API regressions;persisted GET/DB states,scope/RBAC,safe409/500,cleanup.`);

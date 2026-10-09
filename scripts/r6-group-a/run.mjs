// Real HTTP + SQL Server verification. No mocked service, pool, procedure or clock.
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { credentials,write } from '../db/lib.mjs';
import { createContext,open,fingerprints,moduleParity,directBooking,concurrentBookings,source,root,sql } from '../../database/11_tests/r6-group-a/support.mjs';

const option=key=>process.argv.find(arg=>arg.startsWith('--'+key+'='))?.slice(key.length+3);
const database=option('database'),phase=option('phase');
if(phase) assert.ok(['R6.1','R6.2','R6.3'].includes(phase));
const repetitions=Number(option('repetitions')||3);
assert.ok(Number.isSafeInteger(repetitions)&&repetitions>=3&&repetitions<=10,'Race scenarios require 3–10 repetitions.');
const runID=new Date().toISOString().replaceAll(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8);
const dir=path.join(root,'docs/evidence/r6-group-a/runs',runID);
const evidence={runID,database,phase:phase||'ALL',repetitions,startedAt:new Date().toISOString(),status:'RUNNING',cases:[],requests:[]};
const save=()=>write(path.join(dir,'result.json'),evidence);
save();
const sanitize=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value,(key,item)=>
 /token|secret|password|matkhau|email|phone|birthday/i.test(key)?'[REDACTED]':item));
const cases=[];
const test=(id,scenario,expected,work)=>cases.push({id,scenario,expected,work});
let context,main,mainBefore,server,closePool,current;
const tokens=[];
async function api(actor,method,route,body) {
 const request={actor,method,route,input:body===undefined?null:sanitize(body),startedAt:new Date().toISOString()};
 evidence.requests.push(request);if(current) current.requests.push(evidence.requests.length-1);
 const response=await fetch(evidence.baseURL+route,{method,headers:{'Content-Type':'application/json',...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const value=await response.json();
 Object.assign(request,{completedAt:new Date().toISOString(),status:response.status,response:sanitize(value)});
 if(route==='/bookings'&&value.booking?.id) context.owned.add(value.booking.id);
 save();return {status:response.status,body:value};
}
function expect(reply,status,code) {
 assert.equal(reply.status,status,JSON.stringify(reply.body));
 if(code) assert.equal(reply.body.error?.code,code);
 return reply.body;
}
const record=(name,value)=>{current.checks.push({name,value:sanitize(value)});save();return value;};
const seats=()=>context.seats(context.show);
const input=(indices=[0],extra={})=>({showtimeId:context.show.SuatChieuID,seatIds:indices.map(i=>seats()[i]),products:[],...extra});
const promoInput=(indices=[0,1])=>input(indices,{promotionCode:context.promotion.MaCode,products:[{productId:context.catalog.products[0].SanPhamID,quantity:2}]});
const state=async label=>record(label,await context.state());
async function noWrites(label,action) {
 const before=await fingerprints(context.pool),result=await action(),after=await fingerprints(context.pool);
 assert.deepEqual(after,before,label+' changed persisted data or metadata');
 record(label,{result:sanitize(result),before,after,status:'PASS'});return result;
}
async function rejectBooking(request,code,status=409,actor=0) {
 return noWrites(code,async()=>expect(await api(actor,'POST','/bookings',request),status,code));
}
async function book(request=input(),actor=0) {
 const value=expect(await api(actor,'POST','/bookings',request),201).booking;
 assert.equal(value.userId,context.catalog.customers[actor].NguoiDungID);
 assert.equal(value.showtimeId,request.showtimeId);assert.equal(value.status,'Chờ thanh toán');
 const s=await context.state(),order=s.orders.find(o=>o.DonDatVeID===value.id);
 assert.ok(order);assert.equal(order.NguoiDungID,value.userId);
 assert.equal(value.ticketCount,request.seatIds.length);
 assert.equal(s.tickets.filter(v=>v.DonDatVeID===value.id).length,request.seatIds.length);
 assert.deepEqual(s.tickets.filter(v=>v.DonDatVeID===value.id).map(v=>v.GheID).sort((a,b)=>a-b),[...request.seatIds].sort((a,b)=>a-b));
 assert.equal(value.ticketTotal,order.TongTienVe);assert.equal(value.productTotal,order.TongTienDoAn);
 assert.equal(value.discountTotal,order.TienGiamGia);assert.equal(value.total,order.TongTienVe+order.TongTienDoAn-order.TienGiamGia);
 assert.equal(order.TrangThai,'Chờ thanh toán');assert.ok(value.total>0);
 // SQL verifies all price/quantity snapshots, including fn_TinhGiaVe at creation.
 const mismatch=(await context.execute(source('prices'),{ID:value.id})).recordsets;
 assert.deepEqual(mismatch[0],[]);assert.deepEqual(mismatch[1],[]);assert.equal(mismatch[2][0].duration,300);
 const foods=s.foods.filter(f=>f.DonDatVeID===value.id);
 assert.equal(foods.length,request.products?.length||0);
 for(const p of request.products||[]) assert.equal(foods.find(f=>f.SanPhamID===p.productId)?.SoLuong,p.quantity);
 record('booking persisted snapshots',{request,value,order,tickets:s.tickets.filter(t=>t.DonDatVeID===value.id),foods});
 return value.id;
}
async function attempt(order,actor=0) {
 const payment=expect(await api(actor,'POST',`/orders/${order}/payments`,{paymentMethod:'VNPAY'}),201).payment;
 const s=await context.state(),p=s.payments.find(p=>p.ThanhToanID===payment.id),o=s.orders.find(o=>o.DonDatVeID===order);
 assert.ok(p);assert.equal(p.DonDatVeID,order);assert.equal(p.TrangThai,'Đang xử lý');
 assert.equal(payment.orderId,order);assert.equal(payment.amount,o.TongTienVe+o.TongTienDoAn-o.TienGiamGia);
 assert.equal(payment.amount,p.SoTien);assert.equal(p.NgayThanhToan,null);
 record('attempt stored',s);return payment.id;
}
const resultRoute=(order,payment)=>`/orders/${order}/payments/${payment}/result`;
async function result(order,payment,status,actor=0) {
 const reply=expect(await api(actor,'POST',resultRoute(order,payment),{status}),200);
 assert.equal(reply.payment.status,status);assert.equal(reply.payment.id,payment);
 await state('after result '+status);return reply;
}
async function paid(request=input(),actor=0) {
 const order=await book(request,actor),payment=await attempt(order,actor);
 const before=await context.state();await result(order,payment,'Thành công',actor);
 const after=await context.state(),user=context.catalog.customers[actor].NguoiDungID;
 assert.equal(after.orders.find(o=>o.DonDatVeID===order).TrangThai,'Đã thanh toán');
 assert.equal(after.orders.find(o=>o.DonDatVeID===order).HanGiuCho,null);
 assert.equal(after.points.find(p=>p.NguoiDungID===user).DiemTichLuy-before.points.find(p=>p.NguoiDungID===user).DiemTichLuy,
  Math.floor(after.payments.find(p=>p.ThanhToanID===payment).SoTien/1000));
 return {order,payment};
}
async function preview(request) {
 return noWrites('promotion preview is read-only',async()=>expect(await api(0,'POST','/promotions/validate',request),200).promotion);
}

test('R6.1-01','Normal booking','Movie → showtime → seat → food → promo → booking → detail; SQL snapshots/amounts match',async()=>{
 const movies=expect(await api(null,'GET','/movies'),200).movies;assert.ok(movies.some(m=>m.id===context.show.PhimID));
 expect(await api(null,'GET',`/movies/${context.show.PhimID}`),200);
 const shows=expect(await api(null,'GET',`/movies/${context.show.PhimID}/showtimes`),200).showtimes;
 assert.ok(shows.some(s=>s.id===context.show.SuatChieuID));
 expect(await api(null,'GET',`/showtimes/${context.show.SuatChieuID}`),200);
 const available=expect(await api(null,'GET',`/showtimes/${context.show.SuatChieuID}/seats`),200).seats;
 assert.ok(available.some(s=>s.id===seats()[0]&&s.status==='Trống'));
 const products=expect(await api(null,'GET','/products'),200).products;
 assert.ok(products.some(p=>p.id===context.catalog.products[0].SanPhamID));
 const request=promoInput(),p=await preview(request);assert.equal(p.isValid,true);
 const order=await book(request),detail=expect(await api(0,'GET',`/orders/${order}`),200).order;
 assert.equal(detail.discountTotal,p.discountAmount);assert.equal(detail.tickets.length,2);
 assert.equal(detail.products[0].quantity,2);assert.equal(detail.payments.length,0);await state('persisted normal flow');
});
test('R6.1-02','No food','201; zero food rows and productTotal=0',async()=>{
 const order=await book(input());const s=await state('no food');assert.equal(s.foods.length,0);
 assert.equal(s.orders.find(o=>o.DonDatVeID===order).TongTienDoAn,0);
});
test('R6.1-03','With food','201; two products retain quantity and DB unit-price snapshots',async()=>{
 await book(input([0],{products:context.catalog.products.slice(0,2).map((p,i)=>({productId:p.SanPhamID,quantity:i+2}))}));
 await state('food quantities and prices');
});
test('R6.1-04','With promotion','SQL preview matches final discount and quota increases once',async()=>{
 const before=await context.state(),request=promoInput(),p=await preview(request);assert.equal(p.isValid,true);
 const order=await book(request),s=await state('promotion persisted');
 const o=s.orders.find(o=>o.DonDatVeID===order);assert.equal(o.KhuyenMaiID,p.promotionId);assert.equal(o.TienGiamGia,p.discountAmount);
 assert.equal(s.promotions.find(p=>p.KhuyenMaiID===o.KhuyenMaiID).SoLuongDaDung,before.promotions.find(p=>p.KhuyenMaiID===o.KhuyenMaiID).SoLuongDaDung+1);
});
test('R6.1-05','Without promotion','NULL promo, zero discount, every counter unchanged',async()=>{
 const before=await context.state(),order=await book(input([0],{promotionCode:null})),s=await state('without promo');
 assert.equal(s.orders.find(o=>o.DonDatVeID===order).KhuyenMaiID,null);assert.equal(s.orders[0].TienGiamGia,0);assert.deepEqual(s.promotions,before.promotions);
});
test('R6.1-06','Wrong seat room','409 SEAT_UNAVAILABLE; no persisted mutation',async()=>{
 await rejectBooking(input([0],{seatIds:[context.seats(context.otherShow)[0]]}),'SEAT_UNAVAILABLE');
});
test('R6.1-07','Inactive seat','Maintenance and broken seats rejected; no persisted mutation',async()=>{
 for(const status of ['Bảo trì','Hỏng']) {
  await context.execute('UPDATE dbo.GHE SET TrangThai=@Status WHERE GheID=@ID',{ID:seats()[0],Status:status});
  // seats() uses captured seed catalog, which is intentionally immutable.
  await rejectBooking(input(),'SEAT_UNAVAILABLE');
 }
});
test('R6.1-08','Same seat duplicate','Paid seat rejects second booking; duplicate input rejected separately; no partial commit',async()=>{
 await paid();await rejectBooking(input(),'SEAT_CONFLICT',409,1);
 await rejectBooking(input([1],{seatIds:[seats()[1],seats()[1]]}),'DUPLICATE_SEAT',400);
 const s=await state('single paid seat');assert.equal(s.orders.length,1);assert.equal(s.tickets.length,1);
});
test('R6.1-09','Held seat','Live held seat unavailable to another customer; persisted state unchanged',async()=>{
 await book();const available=expect(await api(null,'GET',`/showtimes/${context.show.SuatChieuID}/seats`),200).seats;
 assert.equal(available.find(s=>s.id===seats()[0]).status,'Đang giữ');
 await rejectBooking(input(),'SEAT_CONFLICT',409,1);await state('live held seat');
});
test('R6.1-10','Expired hold','Effective expiry reads without writes; same-seat reuse persists expiry and releases promo exactly once',async()=>{
 const order=await book(promoInput([0]));await context.age(order);
 const before=await context.state();assert.equal(before.orders[0].TrangThai,'Chờ thanh toán');
 await noWrites('expired detail remains read-only',async()=>assert.equal(expect(await api(0,'GET',`/orders/${order}`),200).order.status,'Hết hạn'));
 const available=expect(await api(null,'GET',`/showtimes/${context.show.SuatChieuID}/seats`),200).seats;
 assert.equal(available.find(s=>s.id===seats()[0]).status,'Trống');
 await book(promoInput([0]),1);const after=await state('expired seat reused');
 assert.equal(after.orders.find(o=>o.DonDatVeID===order).TrangThai,'Hết hạn');
 assert.equal(after.tickets.find(t=>t.DonDatVeID===order).TrangThai,'Đã hủy');
 assert.equal(after.promotions.find(p=>p.KhuyenMaiID===context.promotion.KhuyenMaiID).SoLuongDaDung,1);
 await noWrites('repeat expiry idempotent',async()=>context.pool.request().input('SuatChieuID',sql.Int,context.show.SuatChieuID).input('TraVeKetQua',sql.Bit,false).execute('dbo.sp_Order_ExpirePending'));
});
test('R6.1-11','Max seats','10 accepted; 11 rejected by HTTP and SQL50026; no mutation on reject',async()=>{
 await rejectBooking(input(Array.from({length:11},(_,i)=>i)),'SEAT_LIMIT_EXCEEDED',400);
 await noWrites('SQL independently enforces seat ceiling',()=>assert.rejects(directBooking(context,input(Array.from({length:11},(_,i)=>i))),e=>e.number===50026));
 await book(input(Array.from({length:10},(_,i)=>i)));await state('10-seat boundary');
});
test('R6.1-12','Max food quantity','10 each for distinct products accepted; 11 and split 6+5 rejected by SQL; no mutation',async()=>{
 const productId=context.catalog.products[0].SanPhamID;
 await rejectBooking(input([0],{products:[{productId,quantity:11}]}),'PRODUCT_QUANTITY_LIMIT_EXCEEDED',400);
 for(const products of [[{productId,quantity:11}],[{productId,quantity:6},{productId,quantity:5}]])
  await noWrites('SQL aggregated food ceiling',()=>assert.rejects(directBooking(context,input([0],{products})),e=>e.number===50027));
 await book(input([0],{products:context.catalog.products.slice(0,2).map(p=>({productId:p.SanPhamID,quantity:10}))}));
 await state('10+10 distinct products');
});
test('R6.1-13','Inactive parent','Cinema, room and movie eligibility each reject 409 SHOWTIME_UNAVAILABLE without writes',async()=>{
 for(const [table,column,id,status,restore] of [
  ['RAPCHIEUPHIM','RapID',context.show.RapID,'Tạm đóng','Hoạt động'],
  ['PHONGCHIEU','PhongID',context.show.PhongID,'Bảo trì','Hoạt động'],
  ['PHIM','PhimID',context.show.PhimID,'Ngừng chiếu',context.catalog.movies.find(m=>m.PhimID===context.show.PhimID).TrangThai]
 ]) {
  await context.execute(`UPDATE dbo.${table} SET TrangThai=@Status WHERE ${column}=@ID`,{ID:id,Status:status});
  await rejectBooking(input(),'SHOWTIME_UNAVAILABLE');
  await context.execute(`UPDATE dbo.${table} SET TrangThai=@Status WHERE ${column}=@ID`,{ID:id,Status:restore});
 }
});
test('R6.1-14','Past showtime','R5 past show with Mở bán status still rejects 409 SHOWTIME_UNAVAILABLE; SQL time is the blocking condition',async()=>{
 const past=context.catalog.past[0];
 const original=(await context.execute('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID',{ID:past.SuatChieuID})).recordset[0].TrangThai;
 try {
  // Isolate the time rule from the completed-status rule on owned test data.
  await context.execute("UPDATE dbo.SUATCHIEU SET TrangThai=N'Mở bán' WHERE SuatChieuID=@ID",{ID:past.SuatChieuID});
  const eligibility=(await context.execute(`SELECT IsBookable,TrangThaiRap,TrangThaiPhong,TrangThaiPhim,TrangThaiSuatChieu,
   CASE WHEN ThoiGianBatDau<=dbo.fn_BayGio() THEN 1 ELSE 0 END IsPast,
   CASE WHEN NgayChieu>=NgayKhoiChieu AND (NgayKetThuc IS NULL OR NgayChieu<=NgayKetThuc) THEN 1 ELSE 0 END InReleaseWindow
   FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID=@ID`,{ID:past.SuatChieuID})).recordset[0];
  assert.equal(eligibility.IsPast,1);assert.equal(eligibility.InReleaseWindow,1);assert.equal(eligibility.IsBookable,false);
  assert.equal(eligibility.TrangThaiRap,'Hoạt động');assert.equal(eligibility.TrangThaiPhong,'Hoạt động');
  assert.notEqual(eligibility.TrangThaiPhim,'Ngừng chiếu');assert.equal(eligibility.TrangThaiSuatChieu,'Mở bán');record('past time independently blocks booking',eligibility);
  await rejectBooking({showtimeId:past.SuatChieuID,seatIds:context.catalog.seats.filter(g=>g.PhongID===past.PhongID).slice(0,1).map(g=>g.GheID),products:[]},'SHOWTIME_UNAVAILABLE');
 } finally {await context.execute('UPDATE dbo.SUATCHIEU SET TrangThai=@Status WHERE SuatChieuID=@ID',{ID:past.SuatChieuID,Status:original});}
});

async function race(name,requests,expectedSuccess,code,expectedSeats,barrier='room') {
 const calls=requests.map(({actor,body})=>()=>api(actor,'POST','/bookings',body));
 const {observation,replies}=await concurrentBookings(context,calls,barrier);record('SQL-proven overlap '+name,observation);
 const winners=replies.filter(r=>r.status===201),losers=replies.filter(r=>r.status!==201);
 assert.equal(winners.length,expectedSuccess);
 for(const loser of losers) expect(loser,409,code);
 for(const winner of winners) expect(winner,201);
 const s=await state('concurrent committed state '+name);
 assert.equal(s.orders.length,expectedSuccess);assert.equal(s.tickets.length,expectedSeats);
 assert.equal(s.foods.length,requests.filter((_,i)=>replies[i].status===201).reduce((n,r)=>n+(r.body.products?.length||0),0));
 for(let i=0;i<replies.length;i++) if(replies[i].status===201) {
  const order=replies[i].body.booking.id;
  assert.deepEqual(s.tickets.filter(v=>v.DonDatVeID===order).map(v=>v.GheID).sort((a,b)=>a-b),[...requests[i].body.seatIds].sort((a,b)=>a-b));
 }
 return {s,replies};
}
test('R6.2-01','Same showtime, same seat','Two SQL-overlapping HTTP calls; exactly one complete order and one SEAT_CONFLICT',async()=>{
 await race('same seat',[{actor:0,body:input()},{actor:1,body:input()}],1,'SEAT_CONFLICT',1);
});
test('R6.2-02','Overlapping seat lists','One complete two-seat winner; losing exclusive seat remains free; no partial order/food/quota',async()=>{
 const a=promoInput([0,1]),b=promoInput([1,2]);
 const {s,replies}=await race('overlapping lists',[{actor:0,body:a},{actor:1,body:b}],1,'SEAT_CONFLICT',2);
 assert.equal(s.promotions.find(p=>p.KhuyenMaiID===context.promotion.KhuyenMaiID).SoLuongDaDung,1);
 const losingExclusive=replies[0].status===201?seats()[2]:seats()[0];
 assert.ok(!s.tickets.some(v=>v.GheID===losingExclusive));
 const available=expect(await api(null,'GET',`/showtimes/${context.show.SuatChieuID}/seats`),200).seats;
 assert.equal(available.find(g=>g.id===losingExclusive).status,'Trống');
});
test('R6.2-03','Different seats','Both SQL-overlapping independent HTTP bookings commit',async()=>{
 await race('different seats',[{actor:0,body:input([0])},{actor:1,body:input([1])}],2,undefined,2);
});
test('R6.2-04','Same customer hold limit','Four SQL-overlapping requests for distinct seats; exactly three live orders, one ACTIVE_ORDER_LIMIT_REACHED',async()=>{
 const {s}=await race('customer hold limit',Array.from({length:4},(_,i)=>({actor:0,body:input([i])})),3,'ACTIVE_ORDER_LIMIT_REACHED',3);
 assert.ok(s.orders.every(o=>o.NguoiDungID===context.catalog.customers[0].NguoiDungID));
});
test('R6.2-05','Promotion last quota','Different shows/rooms; both wait on promo lock; exactly one usage and complete booking',async()=>{
 await context.execute('UPDATE dbo.KHUYENMAI SET SoLuong=1 WHERE KhuyenMaiID=@ID',{ID:context.promotion.KhuyenMaiID});
 const a=promoInput(),b={...promoInput(),showtimeId:context.otherShow.SuatChieuID,seatIds:context.seats(context.otherShow).slice(0,2)};
 const {s}=await race('last promotion quota',[{actor:0,body:a},{actor:1,body:b}],1,'PROMOTION_NOT_AVAILABLE',2,'promotion');
 assert.equal(s.promotions.find(p=>p.KhuyenMaiID===context.promotion.KhuyenMaiID).SoLuongDaDung,1);
});

test('R6.3-01','Fail → retry → success','Every step persists correct state; failed history retained; amount SQL-owned; order/loyalty consistent',async()=>{
 const order=await book(promoInput()),first=await attempt(order);
 const pending=await context.state();await result(order,first,'Thất bại');
 const failed=await state('failed attempt history');assert.equal(failed.orders[0].TrangThai,'Chờ thanh toán');assert.deepEqual(failed.points,pending.points);
 const firstRow=failed.payments.find(p=>p.ThanhToanID===first),second=await attempt(order);assert.notEqual(first,second);
 const retry=await state('second attempt appended');assert.deepEqual(retry.payments.find(p=>p.ThanhToanID===first),firstRow);assert.equal(retry.payments.length,2);
 assert.equal(retry.payments[0].SoTien,retry.payments[1].SoTien);
 await result(order,second,'Thành công');const success=await state('success with preserved failed history');
 assert.deepEqual(success.payments.find(p=>p.ThanhToanID===first),firstRow);assert.equal(success.orders[0].TrangThai,'Đã thanh toán');assert.equal(success.orders[0].HanGiuCho,null);
 const user=context.catalog.customers[0].NguoiDungID;
 assert.equal(success.points.find(p=>p.NguoiDungID===user).DiemTichLuy-pending.points.find(p=>p.NguoiDungID===user).DiemTichLuy,Math.floor(success.payments.find(p=>p.ThanhToanID===second).SoTien/1000));
 await noWrites('re-read paid order',async()=>{
  const detail=expect(await api(0,'GET',`/orders/${order}`),200).order;
  assert.equal(detail.status,'Đã thanh toán');assert.equal(detail.payments.length,2);
  assert.equal(detail.payments.find(p=>p.id===first).status,'Thất bại');assert.equal(detail.payments.find(p=>p.id===second).status,'Thành công');
  assert.equal(detail.total,success.payments.find(p=>p.ThanhToanID===second).SoTien);
  const orders=expect(await api(0,'GET','/orders'),200).orders;
  assert.equal(orders.find(o=>o.id===order).latestPaymentStatus,'Thành công');
 });
});
test('R6.3-02','Wrong owner','Foreign attempt/read/result each 404 ORDER_NOT_FOUND; no mutation; SQL ownership rejects directly',async()=>{
 const order=await book(),payment=await attempt(order);
 for(const [method,route,body] of [['GET',`/orders/${order}`,undefined],['POST',`/orders/${order}/payments`,{paymentMethod:'VNPAY'}],['POST',resultRoute(order,payment),{status:'Thành công'}]])
  await noWrites('foreign owner '+route,async()=>expect(await api(1,method,route,body),404,'ORDER_NOT_FOUND'));
 await noWrites('direct SQL payment ownership',()=>assert.rejects(context.pool.request()
  .input('NguoiDungID',sql.Int,context.catalog.customers[1].NguoiDungID).input('ThanhToanID',sql.Int,payment)
  .input('TrangThaiThanhToan',sql.NVarChar(50),'Thành công').execute('dbo.sp_Payment_UpdateResult'),e=>e.number===50033));
});
test('R6.3-03','Wrong payment/order','Payment from another owned order rejected 404 PAYMENT_NOT_FOUND; both orders/attempts unchanged',async()=>{
 const a=await book(input([0])),b=await book(input([1])),payment=await attempt(a);await attempt(b);
 await noWrites('payment/order mismatch',async()=>expect(await api(0,'POST',resultRoute(b,payment),{status:'Thành công'}),404,'PAYMENT_NOT_FOUND'));
 await state('both pending orders unchanged');
});
test('R6.3-04','Same terminal result replay','Failure and success replay return 200; exact hashes unchanged including history/points/timestamps',async()=>{
 const order=await book(promoInput()),first=await attempt(order);await result(order,first,'Thất bại');
 await noWrites('failed result replay',()=>result(order,first,'Thất bại'));
 const second=await attempt(order);await result(order,second,'Thành công');
 await noWrites('success result replay',()=>result(order,second,'Thành công'));
});
test('R6.3-05','Different terminal result replay','Both terminal flip directions reject 409 PAYMENT_FINALIZED without writes',async()=>{
 const order=await book(),first=await attempt(order);await result(order,first,'Thất bại');
 await noWrites('failed to success flip',async()=>expect(await api(0,'POST',resultRoute(order,first),{status:'Thành công'}),409,'PAYMENT_FINALIZED'));
 const second=await attempt(order);await result(order,second,'Thành công');
 await noWrites('success to failed flip',async()=>expect(await api(0,'POST',resultRoute(order,second),{status:'Thất bại'}),409,'PAYMENT_FINALIZED'));
});
test('R6.3-06','Expired order','Aged order rejects settlement/new attempt; existing expiry cancels ticket/releases quota once; no success/loyalty',async()=>{
 const order=await book(promoInput()),payment=await attempt(order);await context.age(order);
 const before=await context.state();
 await noWrites('effective expiry GET',async()=>assert.equal(expect(await api(0,'GET',`/orders/${order}`),200).order.status,'Hết hạn'));
 expect(await api(0,'POST',resultRoute(order,payment),{status:'Thành công'}),409,'ORDER_HOLD_EXPIRED');
 const expired=await state('expiry committed by payment command');assert.equal(expired.orders[0].TrangThai,'Hết hạn');
 assert.ok(expired.tickets.every(v=>v.TrangThai==='Đã hủy'));assert.deepEqual(expired.payments,before.payments);assert.deepEqual(expired.points,before.points);
 assert.equal(expired.promotions.find(p=>p.KhuyenMaiID===context.promotion.KhuyenMaiID).SoLuongDaDung,0);
 await noWrites('expired new attempt rejected',async()=>expect(await api(0,'POST',`/orders/${order}/payments`,{paymentMethod:'MOMO'}),409,'ORDER_HOLD_EXPIRED'));
 // Also exercise expiry occurring at attempt creation, with no existing attempt.
 await context.cleanup();
 const other=await book(promoInput());await context.age(other);
 expect(await api(0,'POST',`/orders/${other}/payments`,{paymentMethod:'VNPAY'}),409,'ORDER_HOLD_EXPIRED');
 const s=await state('expired attempt creation');assert.equal(s.orders[0].TrangThai,'Hết hạn');assert.equal(s.payments.length,0);
});
test('R6.3-07','Already paid order','Reject new attempt and another in-flight success; one completion and loyalty credit only',async()=>{
 const order=await book(),first=await attempt(order),second=await attempt(order);await result(order,first,'Thành công');
 await noWrites('paid new attempt rejected',async()=>expect(await api(0,'POST',`/orders/${order}/payments`,{paymentMethod:'MOMO'}),409,'ORDER_NOT_PAYABLE'));
 await noWrites('second completion rejected',async()=>expect(await api(0,'POST',resultRoute(order,second),{status:'Thành công'}),409,'ORDER_NOT_PAYABLE'));
 const s=await state('one paid completion');assert.equal(s.payments.filter(p=>p.TrangThai==='Thành công').length,1);assert.equal(s.payments.find(p=>p.ThanhToanID===second).TrangThai,'Đang xử lý');
});

test('REG-BOOKING-NEGATIVE','Invalid promo/product and client spoofing','Exact errors and full SQL hashes unchanged',async()=>{
 await rejectBooking({...promoInput(),promotionCode:'R6-MISSING'},'PROMOTION_NOT_AVAILABLE');
 await context.execute("UPDATE dbo.KHUYENMAI SET TrangThai=N'Tạm dừng' WHERE KhuyenMaiID=@ID",{ID:context.promotion.KhuyenMaiID});
 await rejectBooking(promoInput(),'PROMOTION_NOT_AVAILABLE');
 await context.execute("UPDATE dbo.KHUYENMAI SET TrangThai=N'Hoạt động',SoLuongDaDung=SoLuong WHERE KhuyenMaiID=@ID",{ID:context.promotion.KhuyenMaiID});
 await rejectBooking(promoInput(),'PROMOTION_NOT_AVAILABLE');
 await rejectBooking(input([0],{products:[{productId:2147483647,quantity:1}]}),'INVALID_PRODUCT',400);
 for(const field of ['userId','NguoiDungID','total','discountAmount']) await rejectBooking({...input(),[field]:1},'UNKNOWN_REQUEST_FIELD',400);
 await noWrites('payment identity/amount fields',async()=>{
  // Validation precedes lookup; it never trusts client identity or money.
  for(const field of ['userId','amount']) expect(await api(0,'POST','/orders/2147483647/payments',{paymentMethod:'VNPAY',[field]:1}),400,'UNKNOWN_REQUEST_FIELD');
 });
});
test('REG-BOOKING-ROLLBACK','Failure after booking writes','Injected SQL51061 proves order/ticket/food/promo writes reached; full rollback; following booking succeeds',async()=>{
 assert.equal((await context.execute("SELECT OBJECT_ID('dbo.R6A_BookingFault') id")).recordset[0].id,null);
 // Dynamic test DDL is a separate batch in the same guarded physical session.
 await context.execute('EXEC sys.sp_executesql @DDL',{DDL:source('booking-fault')});
 try {
  const before=await fingerprints(context.pool);
  await assert.rejects(directBooking(context,promoInput()),e=>e.number===51061);
  assert.deepEqual(await fingerprints(context.pool),before);record('SQL fault number',{number:51061,stage:'after order/tickets/food/quota writes',before,after:await fingerprints(context.pool)});
  const reply=await noWrites('HTTP booking post-write fault rollback',()=>api(0,'POST','/bookings',promoInput()));expect(reply,500,'EREQUEST');
 } finally {await context.execute('DROP TRIGGER IF EXISTS dbo.R6A_BookingFault;');}
 await book(promoInput());
});
test('REG-PAYMENT-ROLLBACK','Failure after payment and order updates','Existing numeric overflow at loyalty update rolls back success/order/hold/history; retry succeeds after fixture restore',async()=>{
 const order=await book(promoInput()),payment=await attempt(order),user=context.catalog.customers[0].NguoiDungID;
 await context.execute('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=2147483647 WHERE NguoiDungID=@ID',{ID:user});
 await noWrites('post-write payment overflow rollback',async()=>expect(await api(0,'POST',resultRoute(order,payment),{status:'Thành công'}),400,'INVALID_REQUEST'));
 const s=await state('rolled back payment/order');assert.equal(s.payments[0].TrangThai,'Đang xử lý');assert.equal(s.orders[0].TrangThai,'Chờ thanh toán');assert.ok(s.orders[0].HanGiuCho);
 await context.execute('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@ID',{ID:user,Points:context.catalog.customers[0].DiemTichLuy});
 await result(order,payment,'Thành công');
});

try {
 context=await createContext(database,option('confirm-target'));
 evidence.target={server:context.gate.server.ServerName,guid:context.gate.target.database_guid,files:context.gate.target.files};
 evidence.seedBaseline=context.initial;evidence.catalog=sanitize(context.catalog);
 main=await open('CinemaBookingDB');mainBefore=await fingerprints(main);evidence.mainBefore=mainBefore;
 evidence.moduleParityBefore=await moduleParity(context.pool);
 const env=credentials();Object.assign(process.env,env,{DB_DATABASE:database,JWT_SECRET:env.JWT_SECRET||crypto.randomBytes(32).toString('hex')});
 const appModule=await import('../../backend/src/app.js');({closePool}=await import('../../backend/src/db/pool.js'));
 server=appModule.createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 evidence.baseURL=`http://127.0.0.1:${server.address().port}/api`;
 for(let actor=0;actor<4;actor++) {
  const response=expect(await api(actor,'POST','/auth/login',{Email:`khachhang${actor+1}@gmail.com`,MatKhau:'123456'}),200);
  assert.equal(response.user.userId,context.catalog.customers[actor].NguoiDungID);tokens[actor]=response.token;
 }
 for(const t of cases.filter(t=>!phase||t.id.startsWith(phase)||t.id.startsWith('REG-')&&phase==='R6.1'&&t.id.startsWith('REG-BOOKING')||t.id==='REG-PAYMENT-ROLLBACK'&&phase==='R6.3')) {
  const repeat=t.id.startsWith('R6.2')?repetitions:1;
  current={testID:t.id,scenario:t.scenario,input:'See exact request inputs and SQL fixture changes in linked evidence',expected:t.expected,status:'RUNNING',requests:[],checks:[],rounds:[],fix:'None — production behavior unchanged'};
  evidence.cases.push(current);save();
  for(let round=1;round<=repeat;round++) {
   const r={round,startedAt:new Date().toISOString(),status:'RUNNING',sqlOperationStart:context.operations.length};current.rounds.push(r);
   console.log(`RUN ${t.id} round ${round}: ${t.scenario}`);
   try {await t.work();r.integrity=await context.integrity();r.finalState=await context.state();r.status='PASS';}
   catch(error) {r.status='FAIL';r.error={message:error.message,number:error.number};console.error(`FAIL ${t.id}: ${error.message}`);}
   finally {
    // Capture the actual failed persisted state before fixture cleanup.
    try {r.finalState??=await context.state();await context.cleanup();r.cleanup='PASS';}
    catch(error) {r.cleanup='FAIL';r.status='FAIL';r.cleanupError=error.message;throw error;}
    r.sqlOperations=context.operations.slice(r.sqlOperationStart);r.completedAt=new Date().toISOString();save();
   }
   if(r.status==='PASS')console.log(`PASS ${t.id} round ${round}`);
  }
  current.status=current.rounds.every(r=>r.status==='PASS')?'PASS':'FAIL';current.actual=current.rounds.map(r=>({round:r.round,status:r.status,error:r.error,integrity:r.integrity,cleanup:r.cleanup}));save();
 }
 assert.equal(evidence.cases.filter(c=>/^R6\./.test(c.testID)).length,phase?{'R6.1':14,'R6.2':5,'R6.3':7}[phase]:26);
 evidence.moduleParityAfter=await moduleParity(context.pool);
 evidence.testAfter=await fingerprints(context.pool);assert.deepEqual(evidence.testAfter,context.initial);
 evidence.status=evidence.cases.every(c=>c.status==='PASS')?'PASS':'FAIL';
} catch(error) {
 evidence.status='FAIL';evidence.error={message:error.message,number:error.number};console.error(error.message);
 if(current?.status==='RUNNING') {current.status='FAIL';current.actual=error.message;}
 for(const t of cases.filter(t=>/^R6\./.test(t.id)&&(!phase||t.id.startsWith(phase)))) if(!evidence.cases.some(c=>c.testID===t.id))
  evidence.cases.push({testID:t.id,scenario:t.scenario,expected:t.expected,status:'BLOCKED',actual:'Suite could not reach scenario: '+error.message,fix:'None',requests:[],checks:[],rounds:[]});
} finally {
 if(server)await new Promise(resolve=>server.close(resolve));if(closePool)await closePool();
 if(context) {
  try {await context.cleanup();evidence.finalCleanup='PASS';}catch(error){evidence.finalCleanup='FAIL';evidence.cleanupError=error.message;evidence.status='FAIL';}
  await context.pool.close();
 }
 if(main) {
  try {evidence.mainAfter=await fingerprints(main);assert.deepEqual(evidence.mainAfter,mainBefore);evidence.mainPreservation='PASS';}
  catch(error){evidence.mainPreservation='FAIL';evidence.mainError=error.message;evidence.status='FAIL';}
  await main.close();
 }
 evidence.completedAt=new Date().toISOString();save();
 write(path.join(root,'docs/evidence/r6-group-a/latest-'+(phase||'all')+'.json'),{runID,path:path.relative(root,path.join(dir,'result.json')).replaceAll('\\','/'),status:evidence.status});
 console.log(`${evidence.status}: ${evidence.cases.filter(c=>c.status==='PASS').length}/${evidence.cases.length} scenarios; evidence ${dir}`);
 if(evidence.status!=='PASS') process.exitCode=1;
}

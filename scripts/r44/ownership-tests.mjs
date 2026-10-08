import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,disposable,database,env,root,connect,snapshot,summarize,write,evidenceRoot} from './common.mjs';
import {createFixture,cleanupFixture,clearBookings,state,cleanSession} from '../r21/fixtures.mjs';
import {MAX_SEATS_PER_ORDER,MAX_PRODUCT_QUANTITY} from '../../backend/src/validators/bookingValidator.js';
import {MAX_PERCENT_DISCOUNT} from '../../backend/src/validators/adminValidator.js';
import * as fe from '../../frontend/src/constants/bookingLimits.js';

disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},e={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[],requests:[]};
let f,before,profiles;
async function api(role,method,route,input,status=200){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(input===undefined?{}:{body:JSON.stringify(input)}),signal:AbortSignal.timeout(30000)}),value=await response.json();
 e.requests.push({role,method,route,status:response.status,expected:status,...(value.error?{error:value.error}:{})});assert.equal(response.status,status,JSON.stringify(value));return value;
}
const input=(patch={})=>({showtimeId:f.show,seatIds:f.seats.slice(0,2),products:[{productId:f.product,quantity:1}],promotionCode:f.code,...patch});
const pass=(name,details={})=>e.cases.push({name,status:'PASS',...details});
async function newFixture(){
 f=await createFixture(pool);f.customer=f.users.find(r=>r.Email==='khachhang1@gmail.com').NguoiDungID;f.admin=f.users.find(r=>r.Email==='admin@cinemadb.vn').NguoiDungID;
 return f;
}
async function clear(){if(f){await pool.request().input('Cinema',sql.Int,f.cinema).query('DELETE dbo.BANGGIA WHERE RapID=@Cinema');await cleanupFixture(pool,f);f=null;}}
async function current(){return await state(pool,f);}
function bookingRequest(value){return pool.request().input('NguoiDungID',sql.Int,f.customer).input('SuatChieuID',sql.Int,value.showtimeId).input('MaKhuyenMai',sql.VarChar(50),value.promotionCode??null).input('DanhSachGheId',sql.VarChar(sql.MAX),value.seatIds.join(',')).input('DanhSachDoAnJson',sql.NVarChar(sql.MAX),JSON.stringify(value.products.map(p=>({SanPhamID:p.productId,SoLuong:p.quantity})))).output('NewDonDatVeID',sql.Int);}
async function direct(value){const result=await bookingRequest(value).execute('dbo.sp_Booking_Create');return result.recordsets.flat().find(r=>r.DonDatVeID);}
async function preview(value=input(),valid=true,subtotal=170000,discount=1000){
 const stable=await snapshot(pool),response=await api('customer','POST','/promotions/validate',value);
 assert.equal(response.promotion.isValid,valid);assert.equal(response.promotion.provisionalSubtotal,subtotal);assert.equal(response.promotion.discountAmount,valid?discount:0);
 assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));return response.promotion;
}
async function successful(name,value,ticketTotal,productTotal,discountTotal){
 for(const layer of ['SQL','HTTP']){
  const result=layer==='SQL'?await direct(value):(await api('customer','POST','/bookings',value,201)).booking,actual=await current();
  assert.equal(actual.orders.length,1);assert.equal(actual.tickets.length,value.seatIds.length);
  assert.deepEqual([actual.orders[0].TongTienVe,actual.orders[0].TongTienDoAn,actual.orders[0].TienGiamGia],[ticketTotal,productTotal,discountTotal]);
  assert.deepEqual(layer==='SQL'?[result.TongTienVe,result.TongTienDoAn,result.TienGiamGia,result.TongThanhToan]:[result.ticketTotal,result.productTotal,result.discountTotal,result.total],[ticketTotal,productTotal,discountTotal,Number((ticketTotal+productTotal-discountTotal).toFixed(2))]);
  assert.equal(actual.promotion[0].SoLuongDaDung,value.promotionCode?1:0);
  pass(name+'-'+layer,{input:value,amounts:{ticketTotal,productTotal,discountTotal},readAfterWrite:'PASS'});
  await clearBookings(pool,f);await cleanSession(pool);
 }
}
async function rejected(name,value,sqlNumber,httpCode,httpStatus=400){
 const stable=await snapshot(pool);
 await assert.rejects(direct(value),error=>error.number===sqlNumber);assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));await cleanSession(pool);
 const response=await api('customer','POST','/bookings',value,httpStatus);assert.equal(response.error.code,httpCode);assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));
 pass(name,{sqlError:sqlNumber,httpStatus,httpCode,allRowsUnchanged:true,noPartialBooking:true});
}
async function promotion(patch){
 const row=(await current()).promotion[0];
 return api('admin','PUT',`/admin/promotions/${f.promotion}`,{description:row.MoTa,discountType:row.LoaiGiamGia,discountValue:row.GiaTriGiam,minimumOrder:row.DonHangToiThieu,maximumDiscount:row.GiamToiDa,startsAt:row.NgayBatDau.toISOString(),endsAt:row.NgayKetThuc.toISOString(),quantity:row.SoLuong,status:row.TrangThai,...patch});
}
try{
 before=await snapshot(pool);assert.equal(before.data.find(r=>r.table==='DONDATVE').rows,0,'Use transaction-free disposable DB; never clear existing orders.');profiles=(await pool.request().query('SELECT * FROM dbo.HOSOKHACHHANG ORDER BY NguoiDungID')).recordset;
 const contract={seats:10,foodPerProduct:10,percent:99,holding:3,minutes:5};
 const actual=(await pool.request().query('SELECT dbo.fn_GioiHanGheMoiDon() seats,dbo.fn_GioiHanSoLuongSanPham() foodPerProduct,dbo.fn_GioiHanGiamGiaPhanTram() [percent],dbo.fn_GioiHanDonDangGiu() holding,dbo.fn_ThoiGianGiuChoPhut() minutes')).recordset[0];assert.deepEqual(actual,contract);
 assert.deepEqual([MAX_SEATS_PER_ORDER,MAX_PRODUCT_QUANTITY,MAX_PERCENT_DISCOUNT,fe.MAX_SEATS_PER_ORDER,fe.MAX_PRODUCT_QUANTITY,fe.MAX_HOLDING_ORDERS,fe.HOLD_MINUTES],[10,10,99,10,10,3,5]);pass('verified-contract-FE-BE-live-SQL-parity',{contract});
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['admin','admin@cinemadb.vn']])tokens[role]=(await api(role,'POST','/auth/login',{Email:email,MatKhau:'123456'})).token;
 await newFixture();
 await pool.request().input('Room',sql.Int,f.room).query("INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) SELECT @Room,'B',n,N'Thường',N'Hoạt động' FROM (VALUES(1),(2),(3),(4),(5),(6),(7)) numbers(n)");
 f.seats=(await pool.request().input('Room',sql.Int,f.room).query('SELECT GheID FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID')).recordset.map(r=>r.GheID);
 for(const [number,n] of [['01',9],['02',10]])await successful(`R4.4-${number}-seats-${n}`,input({seatIds:f.seats.slice(0,n)}),80000*n,10000,1000);
 await rejected('R4.4-03-09-10-eleven-seats-direct-HTTP-bypass',input({seatIds:f.seats}),50026,'SEAT_LIMIT_EXCEEDED');
 for(const [number,n] of [['04',9],['05',10]])await successful(`R4.4-${number}-food-${n}`,input({seatIds:[f.seats[0]],products:[{productId:f.product,quantity:n}]}),80000,10000*n,1000);
 await rejected('R4.4-06-09-10-eleven-units-direct-HTTP-bypass',input({products:[{productId:f.product,quantity:11}]}),50027,'PRODUCT_QUANTITY_LIMIT_EXCEEDED');
 await rejected('split-duplicate-product-cannot-bypass-summed-cap',input({products:[{productId:f.product,quantity:6},{productId:f.product,quantity:6}]}),50027,'DUPLICATE_PRODUCT');
 // A second legitimate fixture product proves there is no invented per-order food cap.
 const second=(await pool.request().input('Product',sql.Int,f.product).query('INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,TrangThai) SELECT TenSanPham,LoaiSanPham,Gia,TrangThai FROM dbo.SANPHAM WHERE SanPhamID=@Product;SELECT CONVERT(INT,SCOPE_IDENTITY()) id')).recordset[0].id;
 try{await successful('distinct-products-ten-each-twenty-total',input({seatIds:[f.seats[0]],products:[{productId:f.product,quantity:10},{productId:second,quantity:10}]}),80000,200000,1000);}
 finally{await pool.request().input('ID',sql.Int,second).query('DELETE dbo.SANPHAM WHERE SanPhamID=@ID');}
 await promotion({discountType:'PERCENT',discountValue:99,maximumDiscount:null});
 await preview(input(),true,170000,168300);await successful('R4.4-07-percent99-boundary',input(),160000,10000,168300);
 const stable=await snapshot(pool);await assert.rejects(pool.request().input('Promo',sql.Int,f.promotion).query('UPDATE dbo.KHUYENMAI SET GiaTriGiam=100 WHERE KhuyenMaiID=@Promo'),error=>error.number===547);assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));
 const over=await api('admin','PUT',`/admin/promotions/${f.promotion}`,{description:null,discountType:'PERCENT',discountValue:100,minimumOrder:0,maximumDiscount:null,startsAt:(await current()).promotion[0].NgayBatDau.toISOString(),endsAt:(await current()).promotion[0].NgayKetThuc.toISOString(),quantity:100,status:'Hoạt động'},400);assert.equal(over.error.code,'INVALID_REQUEST');assert.deepEqual(summarize(await snapshot(pool)),summarize(stable));pass('R4.4-08-percentage100-DB-CHECK-and-HTTP-rejection',{sqlError:547,noPartialUpdate:true});
 await promotion({discountType:'PERCENT',discountValue:10,maximumDiscount:5000});await preview(input(),true,170000,5000);await successful('percent-versus-maximum-monetary-discount',input(),160000,10000,5000);
 await promotion({discountType:'FIXED',discountValue:1000000,maximumDiscount:null});await preview(input(),true,170000,168300);await successful('fixed-discount-also-obeys99percent-subtotal-cap',input(),160000,10000,168300);
 await clear();
 // Fractional DB prices are valid DECIMAL(18,2), with independently known cent oracle.
 await newFixture();await pool.request().input('Show',sql.Int,f.show).input('Product',sql.Int,f.product).query('UPDATE dbo.SUATCHIEU SET GiaVeCoBan=0.10 WHERE SuatChieuID=@Show;UPDATE dbo.SANPHAM SET Gia=0.10 WHERE SanPhamID=@Product');
 await promotion({discountType:'FIXED',discountValue:0.10,minimumOrder:0.30});
 const cent=await preview(input(),true,0.30,0.10);pass('R4.4-11-12-fractional-preview-read-only-and-minimum-equality',{preview:cent,allRowsUnchanged:true});
 await successful('fractional-preview-and-authoritative-booking-consistent',input(),0.20,0.10,0.10);
 await promotion({minimumOrder:0.31});await preview(input(),false,0.30);await rejected('fractional-minimum-one-cent-above',input(),50029,'PROMOTION_NOT_AVAILABLE',409);
 await promotion({minimumOrder:0,discountType:'PERCENT',discountValue:99,maximumDiscount:null});const cap=await preview(input(),true,0.30,0.29);await successful('decimal99percent-cap-truncates-and-keeps-positive-total',input(),0.20,0.10,0.29);pass('decimal-cap-independent-oracle',{preview:cap,subtotal:0.30,discount:0.29,total:0.01});
 await clear();
 // Valid preview can become invalid; booking must reject atomically rather than silently drop it.
 for(const change of ['paused','quota-exhausted','minimum-raised']){
  await newFixture();const p=await preview();
  if(change==='paused')await promotion({status:'Tạm dừng'});
  else if(change==='minimum-raised')await promotion({minimumOrder:170000.01});
  else await pool.request().input('Promo',sql.Int,f.promotion).query('UPDATE dbo.KHUYENMAI SET SoLuongDaDung=SoLuong WHERE KhuyenMaiID=@Promo');
  await rejected('R4.4-13-14-stale-preview-'+change,input(),50029,'PROMOTION_NOT_AVAILABLE',409);pass('stale-preview-'+change+'-was-valid',{preview:p});await clear();
 }
 // Old quote differs from final: current DB pricing, food and promotion are reread at booking.
 await newFixture();const quote=await preview(input({seatIds:[f.seats[0]]}),true,90000,1000);
 await api('admin','POST','/admin/pricing',{cinemaId:f.cinema,seatType:'Tất cả',dayType:'Tất cả',format:'Tất cả',surcharge:5000,startsOn:'2000-01-01',endsOn:null});
 await api('admin','PUT',`/admin/products/${f.product}`,{name:'R44 product',type:'Snack',price:12000,description:null,image:null,status:'Đang bán'});await promotion({discountValue:2000});
 const booked=(await api('customer','POST','/bookings',input({seatIds:[f.seats[0]]}),201)).booking;
 assert.deepEqual([booked.ticketTotal,booked.productTotal,booked.discountTotal,booked.total],[85000,12000,2000,95000]);assert.notEqual(booked.total,quote.provisionalSubtotal-quote.discountAmount);
 pass('R4.4-15-16-preview-differs-final-response-uses-current-SQL-snapshots',{preview:quote,booking:booked});
 const payment=(await api('customer','POST',`/orders/${booked.id}/payments`,{paymentMethod:'VNPAY'},201)).payment;
 assert.equal(payment.amount,95000);
 const paid=await api('customer','POST',`/orders/${booked.id}/payments/${payment.id}/result`,{status:'Thành công'});assert.equal(paid.order.total,95000);
 const money=(await pool.request().input('Order',sql.Int,booked.id).query('SELECT TongTienVe,TongTienDoAn,TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID=@Order;SELECT GiaVe FROM dbo.CHITIETVE WHERE DonDatVeID=@Order;SELECT DonGia,SoLuong FROM dbo.CHITIETDOAN WHERE DonDatVeID=@Order;SELECT SoTien FROM dbo.THANHTOAN WHERE DonDatVeID=@Order')).recordsets;
 const rule=(await pool.request().input('Cinema',sql.Int,f.cinema).query('SELECT GiaID FROM dbo.BANGGIA WHERE RapID=@Cinema')).recordset[0].GiaID;
 await api('admin','PUT',`/admin/pricing/${rule}`,{surcharge:45000,status:'Áp dụng'});await api('admin','PUT',`/admin/products/${f.product}`,{name:'R44 product later',type:'Snack',price:40000,description:null,image:null,status:'Đang bán'});await promotion({discountValue:50000});
 const afterMoney=(await pool.request().input('Order',sql.Int,booked.id).query('SELECT TongTienVe,TongTienDoAn,TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID=@Order;SELECT GiaVe FROM dbo.CHITIETVE WHERE DonDatVeID=@Order;SELECT DonGia,SoLuong FROM dbo.CHITIETDOAN WHERE DonDatVeID=@Order;SELECT SoTien FROM dbo.THANHTOAN WHERE DonDatVeID=@Order')).recordsets;
 assert.deepEqual(afterMoney,money);const detail=await api('customer','GET',`/orders/${booked.id}`);assert.equal(detail.order.total,95000);assert.equal(detail.order.payments[0].amount,95000);
 pass('R4.4-17-18-payment-and-historical-money-never-use-preview',{quote,booking:booked,payment,monetaryBefore:money,monetaryAfter:afterMoney});
 // Whitelist blocks client attempts to overwrite price, discount, quota or accepted preview.
 const noWrite=await snapshot(pool);
 for(const field of ['total','price','discountAmount','provisionalSubtotal','isValid','remainingQuota'])for(const route of ['/bookings','/promotions/validate']){
  const reply=await api('customer','POST',route,{...input({seatIds:[f.seats[2]]}),[field]:0.01},400);assert.equal(reply.error.code,'UNKNOWN_REQUEST_FIELD');assert.deepEqual(summarize(await snapshot(pool)),summarize(noWrite));
 }
 const spoof=await api('customer','POST',`/orders/${booked.id}/payments`,{paymentMethod:'VNPAY',amount:0.01},400);assert.equal(spoof.error.code,'UNKNOWN_REQUEST_FIELD');assert.deepEqual(summarize(await snapshot(pool)),summarize(noWrite));pass('spoofed-money-acceptance-quota-rejected-no-writes');
 await pool.request().input('Show',sql.Int,f.show).query('DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show');await clear();
 for(const p of profiles)await pool.request().input('User',sql.Int,p.NguoiDungID).input('Points',sql.Int,p.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');
 const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));Object.assign(e,{status:'PASS',before:summarize(before),after:summarize(after),cleanup:'PASS',session:await cleanSession(pool)});
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{
 if(f){await pool.request().input('Show',sql.Int,f.show).query('DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show');await clear();}
 for(const p of profiles??[])await pool.request().input('User',sql.Int,p.NguoiDungID).input('Points',sql.Int,p.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');
 e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,'ownership-tests.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();
}
console.log(`PASS R4.4: ${e.cases.length} cases / ${e.requests.length} real HTTP requests; all 18 required scenarios, direct SQL boundaries, fractional preview, authoritative payment/history; original data/metadata restored.`);

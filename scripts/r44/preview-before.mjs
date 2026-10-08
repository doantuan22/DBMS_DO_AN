// One-time reproduction against frozen pre-fix Backend and real SQL Server.
import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,disposable,database,env,root,connect,snapshot,summarize,write,evidenceRoot} from './common.mjs';
import {createFixture,cleanupFixture,bookingRequest,state} from '../r21/fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),before=await snapshot(pool);let f,server;
try {
 f=await createFixture(pool);const customer=f.users.find(r=>r.Email==='khachhang1@gmail.com').NguoiDungID;
 await pool.request().input('Show',sql.Int,f.show).input('Product',sql.Int,f.product).input('Promo',sql.Int,f.promotion).query('UPDATE dbo.SUATCHIEU SET GiaVeCoBan=0.10 WHERE SuatChieuID=@Show;UPDATE dbo.SANPHAM SET Gia=0.10 WHERE SanPhamID=@Product;UPDATE dbo.KHUYENMAI SET GiaTriGiam=0.10 WHERE KhuyenMaiID=@Promo');
 server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;
 const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'khachhang1@gmail.com',MatKhau:'123456'})});assert.equal(login.status,200);const token=(await login.json()).token;
 const input={showtimeId:f.show,seatIds:f.seats.slice(0,2),products:[{productId:f.product,quantity:1}],promotionCode:f.code};
 const stable=await state(pool,f),response=await fetch(base+'/promotions/validate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(input)}),error=await response.json();
 assert.equal(response.status,400);assert.equal(error.error.code,'INVALID_REQUEST');assert.deepEqual(await state(pool,f),stable);
 const created=await bookingRequest(pool,f,customer).execute('dbo.sp_Booking_Create'),order=created.recordsets.flat().find(r=>r.DonDatVeID);
 assert.equal(order.TongTienVe,0.20);assert.equal(order.TongTienDoAn,0.10);assert.equal(order.TienGiamGia,0.10);assert.equal(order.TongThanhToan,0.20);
 const evidence={at:new Date().toISOString(),database,status:'REPRODUCED',inputAmounts:{seatPrices:[0.10,0.10],productPrice:0.10,quantity:1},jsSubtotal:0.10+0.10+0.10,previewHttp:response.status,error,sqlBooking:{ticketTotal:order.TongTienVe,productTotal:order.TongTienDoAn,discountTotal:order.TienGiamGia,total:order.TongThanhToan},previewNoWrites:'PASS',rootCause:'Binary floating-point subtotal has more than two decimal places; typed DECIMAL(18,2) guard rejects valid DB-cent input before the preview SP.'};
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));Object.assign(evidence,{cleanup:'PASS',before:summarize(before),after:summarize(after)});write(path.join(evidenceRoot,'preview-before.json'),evidence);
 console.log('REPRODUCED real HTTP: 0.10 + 0.10 + 0.10 preview -> 400; SQL booking -> 0.20 final; all data/metadata restored.');
}finally{if(f)await cleanupFixture(pool,f);if(server)await new Promise(r=>server.close(r));await closePool();await pool.close();}

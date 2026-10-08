import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,env,database,disposable,connect,snapshot,summarize,write,evidenceRoot} from './common.mjs';
import {createFixture,cleanupFixture,clearBookings,bookingRequest,state} from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,e={database,status:'RUNNING',cases:[]};let f,before;
try{
 before=await snapshot(pool);f=await createFixture(pool);
 const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'khachhang1@gmail.com',MatKhau:'123456'})});assert.equal(login.status,200);const {token}=await login.json();
 for(const mode of ['direct-SQL','HTTP-GET']){
  await clearBookings(pool,f);const booked=await bookingRequest(pool,f,f.customer,f.seats.slice(0,2)).execute('dbo.sp_Booking_Create');const id=booked.output.NewDonDatVeID;
  await bookingRequest(pool,f,f.other,f.seats.slice(2,4)).execute('dbo.sp_Booking_Create');
  await pool.request().input('Show',sql.Int,f.show).query('UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(MINUTE,-1,dbo.fn_BayGio()) WHERE SuatChieuID=@Show');
  const initial=await state(pool,f),fingerprint=await snapshot(pool);assert.equal(initial.promotion[0].SoLuongDaDung,2);assert.ok(initial.orders.every(o=>o.TrangThai==='Chờ thanh toán'));
  if(mode==='direct-SQL')await pool.request().input('NguoiDungID',sql.Int,f.customer).input('DonDatVeID',sql.Int,id).execute('dbo.sp_Order_GetDetailByCustomer');
  else {const response=await fetch(base+`/orders/${id}`,{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200);assert.equal((await response.json()).order.status,'Hết hạn');}
  const after=await state(pool,f),fullAfter=await snapshot(pool);assert.ok(after.orders.every(o=>o.TrangThai==='Hết hạn'));assert.ok(after.tickets.every(t=>t.TrangThai==='Đã hủy'));assert.equal(after.promotion[0].SoLuongDaDung,0);
  const changedTables=fullAfter.data.filter(r=>r.sha256!==fingerprint.data.find(old=>old.table===r.table).sha256).map(r=>r.table);assert.deepEqual(changedTables.sort(),['CHITIETVE','DONDATVE','KHUYENMAI']);
  e.cases.push({mode,status:'REPRODUCED',requestedOrder:id,ownAndOtherCustomerExpired:after.orders.length,initial,after,changedTables,before:summarize(fingerprint),afterFingerprint:summarize(fullAfter)});
 }
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));Object.assign(e,{status:'REPRODUCED',cleanup:'PASS',before:summarize(before),after:summarize(after)});
 console.log('REPRODUCED direct SQL and real HTTP GET: own+other Customer orders expired, tickets cancelled, promotion2→0; full cleanup PASS.');
}catch(error){e.status='FAIL';e.error=error.message;throw error;}
finally{if(f)await cleanupFixture(pool,f);write(path.join(evidenceRoot,'detail-before.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();}

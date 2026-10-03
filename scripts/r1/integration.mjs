// Live integration writes are restricted to a disposable R1 database.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, root, write } from '../db/lib.mjs';
import { businessLocalToInstant, instantToBusinessLocal, defaultShowtimeLocal, formatTime, formatDateTime, remainingHoldSeconds } from '../../frontend/src/utils/dateTime.js';

const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!/^CinemaBookingDB_R0_R1_[A-Za-z0-9_]+$/.test(database||''))throw new Error('Use an existing disposable --database=CinemaBookingDB_R0_R1_<name>.');
const env=credentials();
Object.assign(process.env,env,{DB_DATABASE:database,JWT_SECRET:env.JWT_SECRET||crypto.randomBytes(48).toString('base64url')});
process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const {closePool}=await import('../../backend/src/db/pool.js');
const {createProcedureClient}=await import('../../backend/src/db/procedureClient.js');
const {databaseConfig}=await import('../../backend/src/config/database.js');
const pool=await new sql.ConnectionPool({...databaseConfig}).connect();
const client=createProcedureClient(async()=>pool);
const server=createApp().listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
const requests=[],checks=[],trace=[];
const check=(name,fn)=>{fn();checks.push({name,status:'PASS'});};
async function request(route,{method='GET',body,token,status=200}={}) {
 const response=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
 const data=await response.json();requests.push({route,method,status:response.status});
 assert.equal(response.status,status,`${route}: ${JSON.stringify(data)}`);return data.data??data;
}
try {
 const manager=await request('/auth/login',{method:'POST',body:{Email:'manager.q1@cinemadb.vn',MatKhau:'123456'}});
 const email=`r1-${crypto.randomUUID()}@example.invalid`;
 await request('/auth/register',{method:'POST',body:{HoTen:'R1 timezone fixture',Email:email,MatKhau:'R1Timezone123!',NgaySinh:'2000-01-01'},status:201});
 const customer=await request('/auth/login',{method:'POST',body:{Email:email,MatKhau:'R1Timezone123!'}});
 const current=(await request('/auth/me',{token:customer.token})).user;
 check('SQL-generated registration instant',()=>{
  assert.ok(current.createdAt.endsWith('Z'));assert.equal(current.birthday,'2000-01-01');
  assert.ok(Math.abs(Date.parse(current.createdAt)-Date.now())<10000);
 });
 const admin=await request('/auth/login',{method:'POST',body:{Email:'admin@cinemadb.vn',MatKhau:'123456'}});
 const local=defaultShowtimeLocal(30,'19:30');const localEnd=local.replace('19:30','22:16');const instant=businessLocalToInstant(local);
 const {room}=await request('/manager/cinemas/1/rooms',{method:'POST',token:manager.token,body:{name:`R1-${crypto.randomUUID().slice(0,8)}`,type:'2D'},status:201});
 await request(`/manager/rooms/${room.id}/seats`,{method:'POST',token:manager.token,body:{row:'A',number:1,type:'Thường'},status:201});
 const input={movieId:1,roomId:room.id,startsAt:instant,endsAt:businessLocalToInstant(localEnd),format:'2D',basePrice:80000};
 const {showtime:created}=await request('/manager/showtimes',{method:'POST',token:manager.token,body:input,status:201});
 const id=created.id;
 const raw=(await pool.request().input('ID',sql.Int,id).query('SELECT CONVERT(varchar(33),ThoiGianBatDau,126) AS Stored FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID')).recordset[0];
 const driver=(await pool.request().input('SuatChieuID',sql.Int,id).execute('dbo.sp_Showtime_GetDetail')).recordset[0];
 const dto=(await client.executeProcedure('SHOWTIME_GET_DETAIL',{SuatChieuID:{type:sql.Int,value:id}})).recordset[0];
 const read=await request(`/showtimes/${id}`);
 const show=read;
 check('showtime HTTP create/read -> SQL -> driver -> DTO -> JSON -> UI epoch roundtrip',()=>{
  assert.equal(Date.parse(raw.Stored+'Z'),Date.parse(instant));assert.equal(driver.ThoiGianBatDau.getTime(),Date.parse(instant));
  assert.equal(dto.ThoiGianBatDau,instant);assert.equal(show.startsAt,instant);assert.equal(formatTime(show.startsAt),'19:30');
  assert.equal(businessLocalToInstant(instantToBusinessLocal(show.startsAt)),instant);
 });
 trace.push(...[{layer:'Frontend datetime-local',raw:local,zone:'Asia/Ho_Chi_Minh'},{layer:'HTTP request',raw:input.startsAt},{layer:'Backend/mssql typed Date',raw:new Date(input.startsAt).toISOString()},{layer:'SQL create SP -> stored datetime2',raw:raw.Stored,zone:'UTC components'},{layer:'SQL read SP -> mssql JS Date',raw:driver.ThoiGianBatDau.toISOString(),epoch:driver.ThoiGianBatDau.getTime()},{layer:'Procedure Client/DTO',raw:dto.ThoiGianBatDau},{layer:'HTTP JSON',raw:show.startsAt},{layer:'React parse instant',epoch:Date.parse(show.startsAt)},{layer:'React business display',raw:formatDateTime(show.startsAt),zone:'Asia/Ho_Chi_Minh'}].map(r=>({...r,expectedEpoch:Date.parse(instant),deltaMs:0})));
 await request('/manager/showtimes',{method:'POST',token:manager.token,body:{...input,startsAt:local},status:400});
 await request('/admin/showtimes',{method:'POST',token:admin.token,body:{...input,startsAt:local},status:400});
 const update={...input,startsAt:businessLocalToInstant(local.replace('19:30','19:45')),endsAt:businessLocalToInstant(localEnd.replace('22:16','22:31')),status:'Mở bán'};delete update.roomId;
 const {showtime:updated}=await request(`/manager/showtimes/${id}`,{method:'PUT',token:manager.token,body:update});
 check('showtime edit datetime-local preserves 19:45',()=>assert.equal(formatTime(updated.startsAt),'19:45'));
 const offsetRead=await request(`/manager/showtimes/${id}`,{method:'PUT',token:manager.token,body:{...update,startsAt:local.replace('19:30','19:45')+'+07:00',endsAt:localEnd.replace('22:16','22:31')+'+07:00'}});
 check('HTTP explicit offset input is equivalent to canonical UTC',()=>assert.equal(offsetRead.showtime.startsAt,updated.startsAt));
 await request('/manager/showtimes',{method:'POST',token:manager.token,body:{...input,startsAt:businessLocalToInstant(local.replace('19:30','20:00')),endsAt:businessLocalToInstant(localEnd.replace('22:16','22:46'))},status:409});
 checks.push({name:'Existing overlap rule and ambiguous request validation',status:'PASS'});
 const midnight=local.replace('19:30','00:30');const midnightInstant=businessLocalToInstant(midnight);
 const {showtime:near}=await request('/manager/showtimes',{method:'POST',token:manager.token,body:{...input,startsAt:midnightInstant,endsAt:businessLocalToInstant(midnight.replace('00:30','03:16'))},status:201});
 const date=midnight.slice(0,10);
 const filtered=await request(`/movies/1/showtimes?date=${date}`);
 const listed=await request(`/manager/cinemas/1/showtimes?fromDate=${date}&toDate=${date}`,{token:manager.token});
 const adminListed=await request(`/admin/showtimes?fromDate=${date}&toDate=${date}`,{token:admin.token});
 check('near-midnight list/filter uses cinema date, not UTC calendar date',()=>{
  assert.equal(formatTime(near.startsAt),'00:30');assert.notEqual(near.startsAt.slice(0,10),date);
  assert.ok(filtered.showtimes.some(s=>s.id===near.id));assert.ok(listed.showtimes.some(s=>s.id===near.id));assert.ok(adminListed.showtimes.some(s=>s.SuatChieuID===near.id));
 });
 const promoInput={code:`R1-${crypto.randomUUID().slice(0,8)}`,description:'R1 temporal fixture',discountType:'Phần trăm',discountValue:10,minimumOrder:0,maximumDiscount:10000,startsAt:midnightInstant,endsAt:businessLocalToInstant(localEnd),quantity:10};
 await request('/admin/promotions',{method:'POST',token:admin.token,body:promoInput,status:201});
 const promoRows=(await request('/admin/promotions',{token:admin.token})).promotions;
 const savedPromo=promoRows.find(p=>p.MaCode===promoInput.code);
 check('promotion datetime2 API create/read uses UTC instant semantics',()=>{
  assert.ok(savedPromo);assert.equal(savedPromo.NgayBatDau,midnightInstant);assert.equal(formatTime(savedPromo.NgayBatDau),'00:30');
 });
 const profile=await request('/auth/me',{method:'PUT',token:customer.token,body:{HoTen:customer.user.name,NgaySinh:'2000-01-01'}});
 const actors=await request('/admin/actors',{token:admin.token});
 const movies=await request('/admin/movies',{token:admin.token});
 const pricing=await request('/manager/cinemas/1/pricing',{token:manager.token});
 check('real SQL DATE -> driver metadata -> all current DTO paths',()=>{
  assert.equal(profile.user.birthday,'2000-01-01');
  assert.ok(actors.actors.every(a=>a.NgaySinh==null||/^\d{4}-\d{2}-\d{2}$/.test(a.NgaySinh)));
  assert.ok(movies.movies.every(m=>/^\d{4}-\d{2}-\d{2}$/.test(m.NgayKhoiChieu)));
  assert.ok(pricing.pricing.every(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.startsOn)));
 });
 const seats=await request(`/showtimes/${id}/seats`);const seat=seats.seats.find(s=>s.status==='Trống');assert.ok(seat);
 const {booking}=await request('/bookings',{method:'POST',token:customer.token,body:{showtimeId:id,seatIds:[seat.id],products:[]},status:201});
 const order=(await request(`/orders/${booking.id}`,{token:customer.token})).order;
 const timing=(await pool.request().input('ID',sql.Int,booking.id).query('SELECT NgayDat,HanGiuCho,SYSUTCDATETIME() AS NowUtc,dbo.fn_ThoiGianGiuChoPhut() AS HoldMinutes FROM dbo.DONDATVE WHERE DonDatVeID=@ID')).recordset[0];
 check('hold deadline uses UTC and original five-minute duration',()=>{
  assert.equal(order.holdExpiresAt,booking.holdExpiresAt);assert.ok(Math.abs(timing.NgayDat.getTime()-timing.NowUtc.getTime())<10000);
  assert.ok(Math.abs((Date.parse(booking.holdExpiresAt)-Date.parse(booking.bookedAt))-timing.HoldMinutes*60000)<1000);
  assert.ok(remainingHoldSeconds(booking.holdExpiresAt,timing.NowUtc.getTime())<=300);
 });
 const {payment}=await request(`/orders/${booking.id}/payments`,{method:'POST',token:customer.token,body:{paymentMethod:'VNPAY'},status:201});
 const paid=await request(`/orders/${booking.id}/payments/${payment.id}/result`,{method:'POST',token:customer.token,body:{status:'Thành công'}});
 check('payment-generated timestamps have UTC serialization and unchanged lifecycle',()=>{
  assert.equal(paid.order.status,'Đã thanh toán');assert.ok(payment.createdAt.endsWith('Z'));
  assert.ok(paid.order.payments[0].paidAt.endsWith('Z'));assert.ok(Math.abs(Date.parse(paid.order.payments[0].paidAt)-Date.now())<10000);
 });
 write(path.join(root,'audit/remediation/evidence',`integration-${(process.env.TZ||'host').replaceAll('/','_')}.json`),{status:'PASS',database,timezone:process.env.TZ||'host',checks,requests,trace,booking:{id:booking.id,bookedAt:booking.bookedAt,holdExpiresAt:booking.holdExpiresAt},note:'All fixture writes are in the explicitly named disposable database. No credentials/tokens are recorded.'});
 console.log(`PASS R1 HTTP/SQL integration: ${checks.length} checks, ${requests.length} requests, TZ=${(process.env.TZ||'host').replaceAll('/','_')}`);
}catch(error){write(path.join(root,'audit/remediation/evidence',`integration-${(process.env.TZ||'host').replaceAll('/','_')}.json`),{status:'FAIL',database,checks,requests,error:error.message});throw error;}
finally{await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}

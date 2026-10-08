import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,env,root,connect,snapshot,summarize,write,evidenceRoot } from './common.mjs';
import { createFixture,cleanupFixture,clearBookings,state } from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const url=`http://127.0.0.1:${server.address().port}/api`,tokens={},fixtures=[];
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',requests:[],cases:[],concurrency:[]};
async function api(role,method,route,body,expected) {
 const response=await fetch(url+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const result=await response.json();evidence.requests.push({role,method,route,status:response.status,expected,...(result.error?{error:result.error}:{})});
 assert.ok((Array.isArray(expected)?expected:[expected]).includes(response.status),`${route}: ${JSON.stringify(result)}`);
 if(result.error) assert.ok(!/dbo\.|nvarchar|SELECT|THROW/.test(JSON.stringify(result.error)));
 return {status:response.status,data:result};
}
async function fixture() {const f=await createFixture(pool);fixtures.push(f);return f;}
const roomBody=status=>({name:'R21 API',type:'2D',status});
const movieBody=(f,status='Đang chiếu',releaseDate,endDate)=>({title:'R21 API',durationMinutes:60,releaseDate:releaseDate??new Date(f.showDate.getTime()-86400000).toISOString().slice(0,10),endDate:endDate??new Date(f.showDate.getTime()+86400000).toISOString().slice(0,10),status,genreIds:[]});
const bookBody=f=>({showtimeId:f.show,seatIds:f.seats.slice(0,2),products:[{productId:f.product,quantity:1}],promotionCode:f.code});
try {
 const before=await snapshot(pool);
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['customer2','khachhang2@gmail.com'],['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn']])
  tokens[role]=(await api(role,'POST','/auth/login',{Email:email,MatKhau:'123456'},200)).data.token;
 const scenarios=[
  ['active-positive',null,true],['upcoming-valid',async f=>api('admin','PUT',`/admin/movies/${f.movie}`,movieBody(f,'Sắp chiếu'),200),true],
  ['null-release-end',async f=>pool.request().query(`UPDATE dbo.PHIM SET NgayKetThuc=NULL WHERE PhimID=${f.movie}`),true],
  ['stale-room-manager-maintenance',async f=>api('manager','PUT',`/manager/rooms/${f.room}`,roomBody('Bảo trì'),200),false],
  ['stale-room-admin-inactive',async f=>api('admin','PUT',`/admin/rooms/${f.room}`,roomBody('Ngưng hoạt động'),200),false],
  ['stale-cinema-closed',async f=>api('admin','PUT',`/admin/cinemas/${f.cinema}`,{name:'R21 API',address:'Fixture',city:'HCM',status:'Tạm đóng'},200),false],
  ['stale-cinema-maintenance',async f=>api('admin','PUT',`/admin/cinemas/${f.cinema}`,{name:'R21 API',address:'Fixture',city:'HCM',status:'Bảo trì'},200),false],
  ['stale-movie-stopped',async f=>api('admin','PUT',`/admin/movies/${f.movie}`,movieBody(f,'Ngừng chiếu'),200),false],
  ['stale-release-before-start',async f=>api('admin','PUT',`/admin/movies/${f.movie}`,movieBody(f,'Sắp chiếu',new Date(f.showDate.getTime()+86400000).toISOString().slice(0,10),new Date(f.showDate.getTime()+2*86400000).toISOString().slice(0,10)),200),false],
  ['stale-release-after-end',async f=>api('admin','PUT',`/admin/movies/${f.movie}`,movieBody(f,'Đang chiếu',new Date(f.showDate.getTime()-2*86400000).toISOString().slice(0,10),new Date(f.showDate.getTime()-86400000).toISOString().slice(0,10)),200),false],
  ...['Đóng bán','Đã hủy','Hoàn thành'].map(status=>['show-'+status,async f=>pool.request().query(`UPDATE dbo.SUATCHIEU SET TrangThai=N'${status}' WHERE SuatChieuID=${f.show}`),false]),
  ['show-started',async f=>pool.request().query(`UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(MINUTE,-1,dbo.fn_BayGio()),ThoiGianKetThuc=DATEADD(MINUTE,89,dbo.fn_BayGio()) WHERE SuatChieuID=${f.show}`),false],
 ];
 for(const [name,change,positive] of scenarios) {
  const f=await fixture();const loadedShow=await api('customer','GET',`/showtimes/${f.show}`,null,200),loadedSeats=await api('customer','GET',`/showtimes/${f.show}/seats`,null,200);
  assert.equal(loadedShow.data.id,f.show);assert.equal(loadedSeats.data.seats.length,4);
  if(change) await change(f);const initial=await state(pool,f);
  const list=await api('customer','GET',`/movies/${f.movie}/showtimes`,null,200);assert.equal(list.data.showtimes.length,positive?1:0);
  await api('customer','GET',`/showtimes/${f.show}`,null,positive?200:404);
  const seatRead=await api('customer','GET',`/showtimes/${f.show}/seats`,null,positive?200:409);if(!positive) assert.equal(seatRead.data.error.code,'SHOWTIME_UNAVAILABLE');
  const booked=await api('customer','POST','/bookings',bookBody(f),positive?201:409);const final=await state(pool,f);
  if(positive) {assert.equal(final.orders.length,1);assert.equal(final.tickets.length,2);assert.equal(final.foods.length,1);assert.equal(final.promotion[0].SoLuongDaDung,1);assert.equal(booked.data.booking.ticketCount,2);}
  else {assert.equal(booked.data.error.code,'SHOWTIME_UNAVAILABLE');assert.deepEqual(final,initial);assert.equal(final.orders.length,0);}
  evidence.cases.push({name,loadedSelection:{show:f.show,seats:bookBody(f).seatIds},initial,final,status:'PASS'});await cleanupFixture(pool,f);
 }
 for(const status of ['Hỏng','Bảo trì']) {
  const f=await fixture();await pool.request().query(`UPDATE dbo.GHE SET TrangThai=N'${status}' WHERE GheID=${f.seats[1]}`);
  const seats=await api('customer','GET',`/showtimes/${f.show}/seats`,null,200);assert.equal(seats.data.seats.find(s=>s.id===f.seats[1]).status,'Bảo trì');
  const initial=await state(pool,f),result=await api('customer','POST','/bookings',bookBody(f),409);assert.equal(result.data.error.code,'SEAT_UNAVAILABLE');assert.deepEqual(await state(pool,f),initial);
  evidence.cases.push({name:'mixed-seat-'+status,initial,final:await state(pool,f),status:'PASS'});await cleanupFixture(pool,f);
 }
 for(const [name,selections] of [['same-seat',[[0],[0]]],['overlapping-lists',[[0,1],[1,2]]]]) {
  const f=await fixture();const replies=await Promise.all(['customer','customer2'].map((role,i)=>api(role,'POST','/bookings',{...bookBody(f),seatIds:selections[i].map(n=>f.seats[n])},[201,409])));
  assert.equal(replies.filter(r=>r.status===201).length,1);assert.equal(replies.find(r=>r.status===409).data.error.code,'SEAT_CONFLICT');
  const final=await state(pool,f);assert.equal(final.orders.length,1);assert.equal(new Set(final.tickets.map(t=>t.GheID)).size,final.tickets.length);assert.equal(final.foods.length,1);assert.equal(final.promotion[0].SoLuongDaDung,1);
  evidence.concurrency.push({name,replies:replies.map(r=>({status:r.status,error:r.data.error})),final,status:'PASS'});await cleanupFixture(pool,f);
 }
 const f=await fixture();const other=await fixture();const initial=await state(pool,f);
 const wrong=await api('customer','POST','/bookings',{...bookBody(f),seatIds:[f.seats[0],other.seats[0]]},409);assert.equal(wrong.data.error.code,'SEAT_UNAVAILABLE');assert.deepEqual(await state(pool,f),initial);
 const spoof=await api('customer','POST','/bookings',{...bookBody(f),isBookable:true},400);assert.equal(spoof.data.error.code,'UNKNOWN_REQUEST_FIELD');assert.deepEqual(await state(pool,f),initial);
 await cleanupFixture(pool,f);await cleanupFixture(pool,other);
 const missing=await api('customer','GET','/showtimes/2147483600/seats',null,404);assert.equal(missing.data.error.code,'SHOWTIME_NOT_FOUND');
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.cleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={message:error.message,number:error.number};throw error;}
finally {for(const f of fixtures) await cleanupFixture(pool,f);evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'api-tests.json'),evidence);await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}
console.log(`PASS real API: ${evidence.requests.length} requests, ${evidence.cases.length} bookability/stale cases, ${evidence.concurrency.length} double-seat races; atomic state and cleanup.`);

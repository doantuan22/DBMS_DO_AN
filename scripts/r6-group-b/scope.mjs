// Missing R6.5 coverage: real authentication, live assignment changes and indirect scope.
import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,database,env,connect,write,evidenceRoot,roomState} from './common.mjs';
import {fingerprints} from '../../database/11_tests/r6-group-a/support.mjs';
import {createFixture,cleanupFixture,cleanSession} from '../r32/fixtures.mjs';
Object.assign(process.env,env,{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},e={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[],requests:[]};let f,foreign,assignment,permissions=[];
async function api(role,method,route,input,status,code){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(input===undefined?{}:{body:JSON.stringify(input)}),signal:AbortSignal.timeout(30000)}),body=await response.json();
 e.requests.push({role,method,route,input,expected:{status,code},actual:{status:response.status,...(body.error?{error:body.error}:{})}});
 assert.equal(response.status,status,JSON.stringify(body));if(code)assert.equal(body.error?.code,code);if(body.error)assert.ok(!/dbo\.|SELECT|THROW|stack|nvarchar|PRIVATE/i.test(JSON.stringify(body.error)));return body;
}
async function noWrites(action){const before=await fingerprints(pool),reply=await action(),after=await fingerprints(pool);assert.deepEqual(after,before);return {reply,before,after,status:'PASS'};}
async function resources(){return {owned:await roomState(pool,f.room),foreign:await roomState(pool,foreign.room),assignment:(await pool.request().input('Cinema',sql.Int,f.cinema).input('Manager',sql.Int,f.manager).query('SELECT *,dbo.fn_KiemTraQuanLyRapScope(NguoiDungID,RapID) allowed FROM dbo.PHANCONG_RAP WHERE RapID=@Cinema AND NguoiDungID=@Manager')).recordset};}
async function scenario(id,description,expected,work){const row={id,description,expected,initial:await resources(),requestsFrom:e.requests.length,startedAt:new Date().toISOString(),status:'RUNNING'};e.cases.push(row);try{row.assertions=await work();row.final=await resources();row.requestsTo=e.requests.length;row.session=await cleanSession(pool);row.status='PASS';row.cleanup='PASS (assignment/permissions restored; owned fixtures removed in suite finally)';}catch(error){row.status='FAIL';throw error;}finally{row.completedAt=new Date().toISOString();}}
async function restoreAssignment(){if(assignment)await pool.request().input('ID',sql.Int,assignment.PhanCongID).input('Start',sql.Date,assignment.NgayBatDau).input('End',sql.Date,assignment.NgayKetThuc).input('Status',sql.NVarChar(50),assignment.TrangThai).query('UPDATE dbo.PHANCONG_RAP SET NgayBatDau=@Start,NgayKetThuc=@End,TrangThai=@Status WHERE PhanCongID=@ID');}
async function restorePermissions(){for(const p of permissions)await pool.request().input('Role',sql.Int,p.VaiTroID).input('Permission',sql.Int,p.QuyenID).input('AssignedAt',sql.DateTime2(7),p.NgayGan).query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID,NgayGan) SELECT @Role,@Permission,@AssignedAt WHERE NOT EXISTS(SELECT 1 FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@Role AND QuyenID=@Permission)');permissions=[];}
const roomBody={name:'R6B scope updated',type:'2D',status:'Hoạt động'};
try{
 e.before=await fingerprints(pool);f=await createFixture(pool);
 foreign=(await pool.request().input('Movie',sql.Int,f.movie).input('Start',sql.DateTime2(3),f.startsAt).query(`DECLARE @Cinema INT,@Room INT,@Seat INT,@Show INT;
 INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R6B foreign',N'Fixture',N'HCM',N'Hoạt động');SET @Cinema=SCOPE_IDENTITY();
 INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R6B foreign',N'2D',N'Hoạt động');SET @Room=SCOPE_IDENTITY();
 INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động');SET @Seat=SCOPE_IDENTITY();
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(@Movie,@Room,@Start,DATEADD(MINUTE,90,@Start),N'2D',80000,N'Mở bán');SET @Show=SCOPE_IDENTITY();
 SELECT @Cinema cinema,@Room room,@Seat seat,@Show show;`)).recordset[0];
 assignment=(await pool.request().query(`SELECT * FROM dbo.PHANCONG_RAP WHERE RapID=${f.cinema} AND NguoiDungID=${f.manager}`)).recordset[0];assert.ok(assignment);
 for(const [role,Email] of [['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn'],['customer','khachhang1@gmail.com']])tokens[role]=(await api(role,'POST','/auth/login',{Email,MatKhau:'123456'},200)).token;
 const showBody=(room=f.room,minutes=0)=>({movieId:f.movie,roomId:room,startsAt:new Date(f.startsAt.getTime()+minutes*60000).toISOString(),endsAt:new Date(f.startsAt.getTime()+(minutes+90)*60000).toISOString(),format:'2D',basePrice:80000});
 const updateBody=()=>{const {roomId,...body}=showBody();return {...body,status:'Mở bán'};};
 const denied=(method,route,input,role='manager',code='MANAGER_CINEMA_FORBIDDEN')=>noWrites(()=>api(role,method,route,input,403,code));
 await scenario('R6.5-01','Assigned cinema read and assignment list','200; only valid assigned cinemas',async()=>{
  const result=await noWrites(async()=>{const list=await api('manager','GET','/manager/cinemas',undefined,200);assert.ok(list.cinemas.some(r=>r.id===f.cinema));assert.ok(!list.cinemas.some(r=>r.id===foreign.cinema));const rooms=await api('manager','GET',`/manager/cinemas/${f.cinema}/rooms`,undefined,200);assert.ok(rooms.rooms.some(r=>r.id===f.room));assert.ok(rooms.rooms.every(r=>r.cinemaId===f.cinema));return {list,rooms};});return [result];
 });
 await scenario('R6.5-02','Foreign cinema direct reads','403 MANAGER_CINEMA_FORBIDDEN; no writes or foreign payload',async()=>[
  await denied('GET',`/manager/cinemas/${foreign.cinema}/rooms`),await denied('GET',`/manager/cinemas/${foreign.cinema}/showtimes`),await denied('GET',`/manager/cinemas/${foreign.cinema}/pricing`)
 ]);
 for(const [id,mode] of [['R6.5-03','expired'],['R6.5-04','revoked']])await scenario(id,'Live '+mode+' assignment after real login','Existing token cannot retain scope; list hides revoked/expired cinema',async()=>{
  await pool.request().input('ID',sql.Int,assignment.PhanCongID).query(mode==='expired'?"UPDATE dbo.PHANCONG_RAP SET NgayBatDau=DATEADD(DAY,-10,dbo.fn_HomNay()),NgayKetThuc=DATEADD(DAY,-1,dbo.fn_HomNay()),TrangThai=N'Hiệu lực' WHERE PhanCongID=@ID":"UPDATE dbo.PHANCONG_RAP SET TrangThai=N'Đã hủy' WHERE PhanCongID=@ID");
  try{const inputs=await resources();assert.equal(inputs.assignment[0].allowed,false);return [inputs,
   await noWrites(async()=>{const result=await api('manager','GET','/manager/cinemas',undefined,200);assert.ok(!result.cinemas.some(r=>r.id===f.cinema));return result;}),
   await denied('GET',`/manager/cinemas/${f.cinema}/rooms`),await denied('PUT',`/manager/rooms/${f.room}`,roomBody),
   await denied('GET',`/manager/rooms/${f.room}/seats`),await denied('PUT',`/manager/seats/${f.seats[0]}`,{type:'Thường',status:'Hoạt động'}),
   await denied('POST','/manager/showtimes',showBody(f.room,360)),await denied('PUT',`/manager/showtimes/${f.show}`,updateBody()),await denied('POST',`/manager/showtimes/${f.show}/cancel`,{})];
  }finally{await restoreAssignment();}
 });
 await scenario('R6.5-05','Assigned room create/update; role and live permission enforcement','201/200 persisted; wrong role/permission403 no writes',async()=>{
  const room=(await api('manager','POST',`/manager/cinemas/${f.cinema}/rooms`,{name:'R6B assigned new room',type:'2D'},201)).room;
  assert.equal(room.cinemaId,f.cinema);const updated=(await api('manager','PUT',`/manager/rooms/${room.id}`,roomBody,200)).room;assert.equal(updated.id,room.id);assert.equal(updated.name,roomBody.name);
  const persisted=await roomState(pool,room.id);assert.equal(persisted.rooms[0].RapID,f.cinema);assert.equal(persisted.rooms[0].TenPhong,roomBody.name);
  const wrong=await denied('PUT',`/manager/rooms/${room.id}`,roomBody,'customer','MANAGER_REQUIRED');
  permissions=(await pool.request().query(`SELECT vq.* FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG n ON n.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE n.NguoiDungID=${f.manager} AND q.MaQuyen IN('QL_PHONG','QL_GHE','QL_SUAT_CHIEU')`)).recordset;assert.equal(permissions.length,3);
  e.permissionFixtureOriginals=permissions;
  try{for(const p of permissions)await pool.request().input('Role',sql.Int,p.VaiTroID).input('Permission',sql.Int,p.QuyenID).query('DELETE dbo.VAITRO_QUYEN WHERE VaiTroID=@Role AND QuyenID=@Permission');
   const deniedPermissions=[await denied('PUT',`/manager/rooms/${f.room}`,roomBody,'manager','FORBIDDEN'),await denied('PUT',`/manager/seats/${f.seats[0]}`,{type:'Thường',status:'Hoạt động'},'manager','FORBIDDEN'),await denied('PUT',`/manager/showtimes/${f.show}`,updateBody(),'manager','FORBIDDEN')];return [{room,updated,persisted},wrong,...deniedPermissions];
  }finally{await restorePermissions();}
 });
 await scenario('R6.5-06','Foreign room reads/create/update/delete with spoofed allowed cinema','Actual room determines scope;403, full DB unchanged',async()=>[
  await denied('GET',`/manager/rooms/${foreign.room}/seats?RapID=${f.cinema}`),
  await denied('PUT',`/manager/rooms/${foreign.room}?RapID=${f.cinema}`,roomBody),
  await denied('DELETE',`/manager/rooms/${foreign.room}?RapID=${f.cinema}`,{RapID:f.cinema,NguoiDungID:f.admin}),
  await denied('POST',`/manager/rooms/${foreign.room}/seats?RapID=${f.cinema}`,{row:'B',number:1,type:'Thường'}),
  await denied('POST',`/manager/cinemas/${foreign.cinema}/rooms?RapID=${f.cinema}`,{name:'Forbidden room',type:'2D'})
 ]);
 await scenario('R6.5-07','Indirect seat scope, read/create/update/delete controls','Assigned works; foreign denies even with allowed RapID',async()=>{
  const list=await noWrites(()=>api('manager','GET',`/manager/rooms/${f.room}/seats`,undefined,200));assert.ok(list.reply.seats.every(r=>r.roomId===f.room));
  const seat=(await api('manager','POST',`/manager/rooms/${f.room}/seats`,{row:'B',number:1,type:'Thường'},201)).seat;
  const updated=(await api('manager','PUT',`/manager/seats/${seat.id}`,{type:'VIP',status:'Bảo trì'},200)).seat;assert.equal(updated.roomId,f.room);assert.equal(updated.type,'VIP');assert.equal((await roomState(pool,f.room)).seats.find(r=>r.GheID===seat.id).TrangThai,'Bảo trì');
  const results=[list,{seat,updated},await denied('PUT',`/manager/seats/${foreign.seat}?RapID=${f.cinema}`,{type:'VIP',status:'Bảo trì'}),await denied('DELETE',`/manager/seats/${foreign.seat}?RapID=${f.cinema}`,{RapID:f.cinema})];
  await api('manager','DELETE',`/manager/seats/${seat.id}`,undefined,200);assert.ok(!(await roomState(pool,f.room)).seats.some(r=>r.GheID===seat.id));return results;
 });
 await scenario('R6.5-08','Indirect show scope, create/update/cancel controls','Assigned works; foreign create/update/cancel403 and no writes',async()=>{
  const created=(await api('manager','POST','/manager/showtimes',showBody(f.room,360),201)).showtime;assert.equal(created.roomId,f.room);
  const {roomId,...update}=showBody(f.room,540);const updated=(await api('manager','PUT',`/manager/showtimes/${created.id}`,{...update,status:'Đóng bán'},200)).showtime;assert.equal(updated.roomId,f.room);assert.equal(updated.status,'Đóng bán');
  const results=[{created,updated},await denied('POST',`/manager/showtimes?RapID=${f.cinema}`,showBody(foreign.room,360)),await denied('PUT',`/manager/showtimes/${foreign.show}?RapID=${f.cinema}`,updateBody()),await denied('POST',`/manager/showtimes/${foreign.show}/cancel?RapID=${f.cinema}`,{})];
  await api('manager','POST',`/manager/showtimes/${created.id}/cancel`,{reason:'R6B scope control'},200);assert.equal((await roomState(pool,f.room)).shows.find(r=>r.SuatChieuID===created.id).TrangThai,'Đã hủy');return results;
 });
 e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{
 try{await restorePermissions();await restoreAssignment();if(foreign)await pool.request().query(`DELETE dbo.SUATCHIEU WHERE PhongID=${foreign.room};DELETE dbo.GHE WHERE PhongID=${foreign.room};DELETE dbo.PHONGCHIEU WHERE PhongID=${foreign.room};DELETE dbo.RAPCHIEUPHIM WHERE RapID=${foreign.cinema};`);if(f)await cleanupFixture(pool,f);e.after=await fingerprints(pool);assert.deepEqual(e.after,e.before);e.session=await cleanSession(pool);e.cleanup='PASS';}
  catch(error){e.status='FAIL';e.cleanup='FAIL';e.cleanupError=error.message;console.error(error.message);process.exitCode=1;}
 e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'scope.json'),e);await new Promise(r=>server.close(r));await closePool();await pool.close();
}
console.log(`${e.status} scope: ${e.cases.length} scenarios, ${e.requests.length} real HTTP requests, exact live scope/permission and persisted-state checks.`);

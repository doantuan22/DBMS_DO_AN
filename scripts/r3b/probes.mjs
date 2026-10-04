// Offline authorization fixtures only. No application raw SQL or main DB writes.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { credentials, root, dbRoot, read, write } from '../db/lib.mjs';
import { connect, ask, sql, rbacInventory } from '../r3a/common.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R3B[A-Za-z0-9_]+$/);
Object.assign(process.env,credentials(),{DB_DATABASE:database});
process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const {closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database);
assert.equal((await ask(pool,'SELECT DB_NAME() AS name')).recordset[0].name,database);
const server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`;
const out=path.join(root,'audit/remediation/r3b/evidence');
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const endpoints=JSON.parse(read(path.join(root,'audit/remediation/r3a/evidence/endpoint-inventory.json'))).endpoints;
const originals=await rbacInventory(pool), tokens={}, ids={}, checks=[], requests=[];
const report={database,status:'RUNNING',checks,requests};
const save=()=>write(path.join(out,'probes.json'),report);
async function api(name,route,{actor,method='GET',body,status=200}={}) {
 const response=await fetch(base+route,{method,headers:{...(actor?{Authorization:'Bearer '+tokens[actor]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const data=await response.json();requests.push({name,method,route,actor:actor??'PUBLIC',status:response.status,error:data.error?.code});
 assert.equal(response.status,status,`${name}: ${response.status} ${data.error?.code}`);return data.data??data;
}
async function setPermissions(role,codes) {
 const id=originals.roles.find(r=>r.MaVaiTro===role).VaiTroID;
 await pool.request().input('Role',sql.Int,id).query('DELETE FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@Role');
 for(const code of codes)await pool.request().input('Role',sql.Int,id).input('Permission',sql.Int,originals.permissions.find(p=>p.MaQuyen===code).QuyenID).query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID) VALUES(@Role,@Permission)');
}
const all=role=>originals.grants.filter(g=>g.MaVaiTro===role).map(g=>g.MaQuyen);
async function grants(role,codes,action) {await setPermissions(role,codes);try{return await action();}finally{await setPermissions(role,all(role));}}
function typeFor(p) {
 const t=p.typeName.toLowerCase();
 if(t==='nvarchar')return sql.NVarChar(p.max_length===-1?sql.MAX:p.max_length/2);
 if(t==='varchar')return sql.VarChar(p.max_length===-1?sql.MAX:p.max_length);
 if(t==='decimal'||t==='numeric')return sql.Decimal(p.precision,p.scale);
 const map={int:sql.Int,bit:sql.Bit,date:sql.Date,datetime2:sql.DateTime2,datetime:sql.DateTime,bigint:sql.BigInt};
 assert.ok(map[t],'Unrecognized fixture type '+t);return map[t];
}
async function direct(name,procedure,values,error=null) {
 const req=pool.request();
 for(const p of manifest.expected.parameters.filter(p=>p.objectName===procedure.split('.').at(-1)&&p.parameter_id>0)) {
  const key=p.name.slice(1); if(p.is_output)req.output(key,typeFor(p));else req.input(key,typeFor(p),values[key]??null);
 }
 let actual=null,result;try{result=await req.execute(procedure);}catch(e){actual=e.number??e.originalError?.info?.number;}
 checks.push({name,procedure,error:actual,expected:error,status:actual===error?'PASS':'FAIL'});
 assert.equal(actual,error,name);return result;
}
const q=(source,key,value)=>pool.request().input(key,sql.Int,value).query(source);
try {
 for(const e of endpoints.filter(e=>e.authenticated))await api('anonymous denied',e.route.slice(4).replace(/:[A-Za-z]+/g,'1'),{method:e.method,body:['POST','PUT','PATCH'].includes(e.method)?{}:undefined,status:401});
 for(const [actor,email] of Object.entries({customer:'khachhang1@gmail.com',customer2:'khachhang2@gmail.com',manager:'manager.q1@cinemadb.vn',support:'cskh@cinemadb.vn',admin:'admin@cinemadb.vn'})) {
  const result=await api('login '+actor,'/auth/login',{method:'POST',body:{Email:email,MatKhau:'123456'}});tokens[actor]=result.token;ids[actor]=result.user.userId;
  assert.deepEqual(Object.keys(JSON.parse(Buffer.from(result.token.split('.')[1],'base64url'))).sort(),['exp','iat','sub']);
 }
 const assigned=(await api('manager bootstrap','/manager/cinemas',{actor:'manager'})).cinemas;
 const cinema=assigned[0].id, foreign=(await ask(pool,`SELECT TOP(1) RapID FROM dbo.RAPCHIEUPHIM WHERE RapID NOT IN (SELECT RapID FROM dbo.PHANCONG_RAP WHERE NguoiDungID=${ids.manager})`)).recordset[0].RapID;
 await api('wrong cinema scope',`/manager/cinemas/${foreign}/rooms`,{actor:'manager',status:403});
 await direct('DB wrong scope','dbo.sp_Manager_Room_List',{NguoiDungID:ids.manager,RapID:foreign},50050);
 const room=(await api('manager create room',`/manager/cinemas/${cinema}/rooms`,{actor:'manager',method:'POST',body:{name:'R3B-'+crypto.randomUUID().slice(0,8),type:'2D'},status:201})).room;
 const seats=[];for(let i=1;i<=4;i++)seats.push((await api('manager create seat',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{row:'A',number:i,type:'Thường'},status:201})).seat.id);
 const start=new Date(Date.now()+50*86400000);
 const show=(await api('manager create showtime','/manager/showtimes',{actor:'manager',method:'POST',body:{movieId:1,roomId:room.id,startsAt:start.toISOString(),endsAt:new Date(start.getTime()+166*60000).toISOString(),format:'2D',basePrice:120000},status:201})).showtime;
 const booking={showtimeId:show.id,seatIds:[seats[0]],products:[]};
 const order=(await api('DAT_VE booking','/bookings',{actor:'customer',method:'POST',body:booking,status:201})).booking.id;
 const promo={...booking,seatIds:[seats[1]],promotionCode:'R3B_NONE'};
 await api('DAT_VE promotion preview','/promotions/validate',{actor:'customer',method:'POST',body:promo});
 const payment=(await api('THANH_TOAN attempt',`/orders/${order}/payments`,{actor:'customer',method:'POST',body:{paymentMethod:'MOMO'},status:201})).payment.id;
 const complaintBody={type:'Hỗ trợ',title:'R3B fixture',content:'Authorization fixture',orderId:order};
 const complaint=(await api('GUI complaint','/complaints',{actor:'customer',method:'POST',body:complaintBody,status:201})).complaint.id;
 const customerWrites=[['DAT_VE','/bookings',booking,'dbo.sp_Booking_Create'],['DAT_VE','/promotions/validate',promo,'dbo.sp_Promotion_Validate'],['THANH_TOAN',`/orders/${order}/payments`,{paymentMethod:'MOMO'},'dbo.sp_Payment_CreateAttempt'],['THANH_TOAN',`/orders/${order}/payments/${payment}/result`,{status:'Thành công'},'dbo.sp_Payment_UpdateResult'],['DANH_GIA','/movies/1/reviews',{rating:5,content:'RBAC'},'dbo.sp_Review_Create'],['GUI_KHIEU_NAI','/complaints',complaintBody,'dbo.sp_Complaint_Create']];
 for(const [permission,route,body,procedure] of customerWrites)await grants('KHACH_HANG',all('KHACH_HANG').filter(p=>p!==permission),async()=>{
  await api('old JWT revoke '+permission,route,{actor:'customer',method:'POST',body,status:403});
  await direct('DB revoke '+permission,procedure,{NguoiDungID:ids.customer},50302);
 });
 await grants('KHACH_HANG',[],async()=>{
  for(const route of ['/orders',`/orders/${order}`,'/complaints',`/complaints/${complaint}`])await api('own history without write grants',route,{actor:'customer'});
  await direct('own DB order read without write grants','dbo.sp_Order_GetDetailByCustomer',{NguoiDungID:ids.customer,DonDatVeID:order});
  await direct('own DB complaint read without write grants','dbo.sp_Complaint_GetByCustomer',{NguoiDungID:ids.customer,KhieuNaiID:complaint});
 });
 for(const route of [`/orders/${order}`,`/complaints/${complaint}`])await api('foreign safe 404',route,{actor:'customer2',status:404});
 await api('foreign payment create',`/orders/${order}/payments`,{actor:'customer2',method:'POST',body:{paymentMethod:'MOMO'},status:404});
 await api('foreign payment result',`/orders/${order}/payments/${payment}/result`,{actor:'customer2',method:'POST',body:{status:'Thành công'},status:404});
 await direct('foreign DB payment create','dbo.sp_Payment_CreateAttempt',{NguoiDungID:ids.customer2,DonDatVeID:order,PhuongThuc:'MOMO'},50033);
 await direct('foreign DB payment result','dbo.sp_Payment_UpdateResult',{NguoiDungID:ids.customer2,ThanhToanID:payment,TrangThaiThanhToan:'Thành công'},50033);
 await api('Customer successful payment',`/orders/${order}/payments/${payment}/result`,{actor:'customer',method:'POST',body:{status:'Thành công'}});
 await grants('QUAN_LY_RAP',[],async()=>{
  assert.equal((await api('bootstrap no functional grants','/manager/cinemas',{actor:'manager'})).cinemas.length,assigned.length);
  for(const e of endpoints.filter(e=>e.actor==='QUAN_LY_RAP'&&e.backendPermission!=='Không'))await api('Manager HTTP exact permission denied',e.route.slice(4).replace(/:[A-Za-z]+/g,'1'),{actor:'manager',method:e.method,body:['POST','PUT','PATCH'].includes(e.method)?{}:undefined,status:403});
  for(const name of Object.keys(manifest.modules).filter(n=>n.startsWith('sp_Manager_')&&!n.includes('ListAssigned')))await direct('Manager DB permission denied',`dbo.${name}`,{NguoiDungID:ids.manager},50302);
 });
 const assignments=(await q('SELECT * FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@ID','ID',ids.manager)).recordset;
 await q("UPDATE dbo.PHANCONG_RAP SET TrangThai=N'Đã hủy' WHERE NguoiDungID=@ID",'ID',ids.manager);
 try {
  assert.equal((await api('bootstrap no assignment','/manager/cinemas',{actor:'manager'})).cinemas.length,0);
  await api('old JWT revoked scope',`/manager/cinemas/${cinema}/rooms`,{actor:'manager',status:403});
  await direct('DB revoked scope','dbo.sp_Manager_Room_List',{NguoiDungID:ids.manager,RapID:cinema},50050);
 }finally{for(const a of assignments)await pool.request().input('ID',sql.Int,a.PhanCongID).input('Status',sql.NVarChar(50),a.TrangThai).query('UPDATE dbo.PHANCONG_RAP SET TrangThai=@Status WHERE PhanCongID=@ID');}
 await grants('QUAN_LY_RAP',['QL_SUAT_CHIEU'],async()=>{await api('manager partial showtimes',`/manager/cinemas/${cinema}/showtimes`,{actor:'manager'});await direct('manager partial DB showtimes','dbo.sp_Manager_Showtime_List',{NguoiDungID:ids.manager,RapID:cinema});await api('manager same grant cannot enter global Admin','/admin/showtimes',{actor:'manager',status:403});});
 const supportOps=[['/support/complaints','GET',null,'dbo.sp_Support_Complaint_List',['QL_KHIEUNAI']], [`/support/complaints/${complaint}`,'GET',null,'dbo.sp_Support_Complaint_GetDetail',['QL_KHIEUNAI']], [`/support/complaints/${complaint}/order-reference`,'GET',null,'dbo.sp_Support_Complaint_GetOrderReference',['QL_KHIEUNAI','TRA_CUU_DON']], [`/support/complaints/${complaint}/processings`,'POST',{content:'R3B processing',nextStatus:'Đang xử lý'},'dbo.sp_Support_Complaint_AddProcessing',['QL_KHIEUNAI','XULY_KHIEUNAI']], [`/support/complaints/${complaint}/status`,'PUT',{status:'Đang xử lý'},'dbo.sp_Support_Complaint_UpdateStatus',['QL_KHIEUNAI','XULY_KHIEUNAI']]];
 for(const held of [[],['QL_KHIEUNAI'],['XULY_KHIEUNAI'],['TRA_CUU_DON'],['QL_KHIEUNAI','XULY_KHIEUNAI'],['QL_KHIEUNAI','TRA_CUU_DON']])await grants('CSKH',held,async()=>{
  for(const [route,method,body,procedure,required] of supportOps){const allowed=required.every(p=>held.includes(p));await api('Support combination '+held.join('+'),route,{actor:'support',method,body,status:allowed?(method==='POST'?201:200):403});await direct('Support DB same combination '+held.join('+'),procedure,{NguoiDungID:ids.support,KhieuNaiID:complaint,NoiDungXuLy:'R3B direct fixture',TrangThaiSauXuLy:'Đang xử lý',TrangThaiMoi:'Đang xử lý'},allowed?null:50302);}
 });
 await grants('ADMIN',[],async()=>{
  for(const e of endpoints.filter(e=>e.actor==='ADMIN'))await api('Admin no grants denied',e.route.slice(4).replace(/:[A-Za-z]+/g,'1'),{actor:'admin',method:e.method,body:['POST','PUT','PATCH'].includes(e.method)?{}:undefined,status:403});
  for(const name of Object.keys(manifest.modules).filter(n=>/^u?sp_Admin_/.test(n)))await direct('Admin DB no grant denied',`dbo.${name}`,{ActorID:ids.admin},50302);
  await direct('Admin cascade no NULL bypass','dbo.sp_Showtime_CancelCascade',{NguoiDungID:ids.admin,SuatChieuID:show.id},50302);
  assert.equal((await q("SELECT dbo.fn_KiemTraQuyenNguoiDung(@ID,'QL_NGUOIDUNG') AS allowed",'ID',ids.admin)).recordset[0].allowed,false);
 });
 assert.equal((await q("SELECT dbo.fn_KiemTraQuyenNguoiDung(@ID,'R3B_UNKNOWN') AS allowed",'ID',ids.admin)).recordset[0].allowed,false);
 assert.equal((await q('SELECT dbo.fn_KiemTraQuanLyRapScope(@ID,1) AS allowed','ID',ids.admin)).recordset[0].allowed,false);
 await direct('Admin NULL actor denied','dbo.usp_Admin_Showtime_Cancel',{ActorID:null,SuatChieuID:show.id},50300);
 await direct('Cascade NULL actor denied','dbo.sp_Showtime_CancelCascade',{NguoiDungID:null,SuatChieuID:show.id},50300);
 const history=(await q('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID','ID',order)).recordset;
 const before=(await q('SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID','ID',ids.customer)).recordset[0].DiemTichLuy;
 await api('Admin explicit cancel','/admin/showtimes/'+show.id+'/cancel',{actor:'admin',method:'POST',body:{}});
 await api('Admin retry cancel','/admin/showtimes/'+show.id+'/cancel',{actor:'admin',method:'POST',body:{}});
 assert.deepEqual((await q('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID','ID',order)).recordset,history);
 assert.equal((await q('SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID','ID',ids.customer)).recordset[0].DiemTichLuy-before,120);
 await direct('review wrong actor role','dbo.sp_Review_Create',{NguoiDungID:ids.manager},50301);
 await direct('support wrong actor role','dbo.sp_Support_Complaint_List',{NguoiDungID:ids.manager},50301);
 for(const actor of ['customer','manager','support','admin']){
  await q("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Bị khóa' WHERE NguoiDungID=@ID",'ID',ids[actor]);
  try{await api('locked old JWT '+actor,'/auth/me',{actor,status:401});await direct('locked DB actor '+actor,actor==='admin'?'dbo.sp_Admin_User_List':actor==='manager'?'dbo.sp_Manager_ListAssignedCinemas':actor==='support'?'dbo.sp_Support_Complaint_List':'dbo.sp_Order_ListByCustomer',{ActorID:ids[actor],NguoiDungID:ids[actor]},50300);}finally{await q("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Hoạt động' WHERE NguoiDungID=@ID",'ID',ids[actor]);}
 }
 await q(`UPDATE dbo.NGUOIDUNG SET VaiTroID=${originals.roles.find(r=>r.MaVaiTro==='KHACH_HANG').VaiTroID} WHERE NguoiDungID=@ID`,'ID',ids.manager);
 try{await api('changed role old JWT','/manager/cinemas',{actor:'manager',status:403});await direct('changed role DB','dbo.sp_Manager_ListAssignedCinemas',{NguoiDungID:ids.manager},50301);}finally{await q(`UPDATE dbo.NGUOIDUNG SET VaiTroID=${originals.roles.find(r=>r.MaVaiTro==='QUAN_LY_RAP').VaiTroID} WHERE NguoiDungID=@ID`,'ID',ids.manager);}
 for(const route of ['/movies','/movies/1','/genres','/cinemas','/movies/1/showtimes',`/showtimes/${show.id}/seats`,'/products'])await api('public catalog without JWT',route);
 const current=await rbacInventory(pool);assert.deepEqual(current.permissions,originals.permissions);assert.deepEqual(current.roles,originals.roles);
 assert.equal((await ask(pool,'SELECT COUNT(*) AS count FROM sys.tables WHERE is_ms_shipped=0')).recordset[0].count,27);
 report.status='PASS';report.tableCount=27;report.identityOnlyJWT=true;report.finishedAt=new Date().toISOString();save();console.log(`PASS R3B: ${requests.length} HTTP requests, ${checks.length} direct DB authorization checks.`);
}catch(e){report.status='FAIL';report.error=e.message;save();throw e;}
finally{await new Promise(r=>server.close(r));await closePool();await pool.close();}

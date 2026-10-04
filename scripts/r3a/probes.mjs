// All mutations are restricted to a disposable R3A fixture. No application SQL changes.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {credentials} from '../db/lib.mjs';
import {root,evidence,read,write,connect,ask,sql,rbacInventory} from './common.mjs';
import {userCanEnterArea,visibleAreasFor} from '../../frontend/src/utils/authorization.js';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
assert.match(database??'',/^CinemaBookingDB_R0_R3A_[A-Za-z0-9_]+$/);
const env=credentials();Object.assign(process.env,env,{DB_DATABASE:database,JWT_SECRET:env.JWT_SECRET||crypto.randomBytes(48).toString('base64url')});
process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const {closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database);
assert.equal((await ask(pool,'SELECT DB_NAME() AS name')).recordset[0].name,database);
const server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
const requests=[],observations=[],feObservations=[];
const tokens={},initialUsers={},originalGrants=(await rbacInventory(pool)).grants;
const roles=(await ask(pool,'SELECT VaiTroID,MaVaiTro FROM dbo.VAITRO')).recordset;
const permissionRows=(await ask(pool,'SELECT QuyenID,MaQuyen FROM dbo.QUYEN')).recordset;
const result={database,at:new Date().toISOString(),status:'RUNNING',requests,observations,frontend:feObservations,
 note:'PASS means source-derived behavior was reproduced; policyConformant=false is an audit finding, not repaired behavior. Tokens/credentials/private response bodies are never saved.'};
const save=()=>write(path.join(evidence,'probes.json'),result);
async function api(name,route,{actor,method='GET',body,current=200,target=current,context}={}) {
 const response=await fetch(base+route,{method,headers:{...(actor?{Authorization:'Bearer '+tokens[actor]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 const data=await response.json();
 const entry={name,method,route,actor:actor??'ANONYMOUS',status:response.status,errorCode:data.error?.code??null,context};requests.push(entry);
 assert.equal(response.status,current,`Unexpected current behavior: ${name}: ${response.status} (${data.error?.code??'no code'})`);
 observations.push({...entry,targetExpectedStatus:target,policyConformant:response.status===target,oldTokenReused:Boolean(actor)});
 return data.data??data;
}
async function login(actor,email) {
 const data=await api('fixture login: '+actor,'/auth/login',{method:'POST',body:{Email:email,MatKhau:'123456'}});
 tokens[actor]=data.token;initialUsers[actor]=data.user;
 const claims=Object.keys(JSON.parse(Buffer.from(data.token.split('.')[1],'base64url')));
 observations.push({name:'JWT claim names: '+actor,claims,containsPermissions:claims.includes('permissions'),containsRole:claims.includes('role')});
}
async function withPermissions(role,keep,action) {
 const roleId=roles.find(r=>r.MaVaiTro===role).VaiTroID;
 const original=originalGrants.filter(g=>g.MaVaiTro===role).map(g=>g.MaQuyen);
 async function set(codes) {
  await pool.request().input('Role',sql.Int,roleId).query('DELETE FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@Role');
  for(const code of codes)await pool.request().input('Role',sql.Int,roleId).input('Permission',sql.Int,permissionRows.find(p=>p.MaQuyen===code).QuyenID)
   .query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID) VALUES(@Role,@Permission)');
 }
 await set(keep);try{return await action();}finally{await set(original);}
}
const without=(role,codes,action)=>withPermissions(role,originalGrants.filter(g=>g.MaVaiTro===role&&!codes.includes(g.MaQuyen)).map(g=>g.MaQuyen),action);
async function direct(name,procedure,inputs,currentError=null,context={}) {
 const request=pool.request();for(const [key,[type,value]] of Object.entries(inputs))request.input(key,type,value);
 let observedError=null,count=0;
 try{const result=await request.execute(procedure);count=result.recordsets?.reduce((n,r)=>n+r.length,0)??0;}catch(error){observedError=error.number??error.originalError?.info?.number;}
 assert.equal(observedError,currentError,'Unexpected direct DB behavior: '+name);
 observations.push({name,directProcedure:procedure,errorNumber:observedError,rowsReturned:count,context});
}
function fe(name,user,role,permission,expected) {
 const allowed=userCanEnterArea(user,role,permission);assert.equal(allowed,expected);
 feObservations.push({name,role,gatePermission:permission,heldPermissions:user.permissions.map(p=>p.code),allowed,
  visibleAreas:visibleAreasFor(user).map(([code,area])=>({role:code,path:area.path}))});
}
try {
 const endpoints=JSON.parse(read(path.join(evidence,'endpoint-inventory.json'))).endpoints;
 for(const e of endpoints.filter(e=>e.authenticated))await api('no JWT: '+e.method+' '+e.route,e.route.replace('/api','').replace(/:[A-Za-z]+/g,'1'),{method:e.method,body:['POST','PUT','PATCH'].includes(e.method)?{}:undefined,current:401});
 result.anonymousProtectedEndpointsChecked=endpoints.filter(e=>e.authenticated).length;
 await login('customer','khachhang1@gmail.com');await login('customer2','khachhang2@gmail.com');
 await login('manager','manager.q1@cinemadb.vn');await login('support','cskh@cinemadb.vn');await login('admin','admin@cinemadb.vn');
 const ids=Object.fromEntries(Object.entries(initialUsers).map(([actor,u])=>[actor,u.userId]));
 const managerAssignments=(await api('manager: own assigned cinemas','/manager/cinemas',{actor:'manager'})).cinemas;
 const cinemaId=managerAssignments[0].id;
 const foreignCinema=(await pool.request().input('User',sql.Int,ids.manager).query("SELECT TOP(1) RapID FROM dbo.RAPCHIEUPHIM WHERE dbo.fn_KiemTraQuanLyRapScope(@User,RapID)=0 ORDER BY RapID")).recordset[0].RapID;
 await api('manager: permission + correct cinema',`/manager/cinemas/${cinemaId}/rooms`,{actor:'manager'});
 await api('manager: permission + foreign cinema',`/manager/cinemas/${foreignCinema}/rooms`,{actor:'manager',current:403});
 const room=(await api('fixture room','/manager/cinemas/'+cinemaId+'/rooms',{actor:'manager',method:'POST',body:{name:'R3A-'+crypto.randomUUID().slice(0,8),type:'2D'},current:201})).room;
 const seats=[];for(let i=1;i<=5;i++)seats.push((await api('fixture seat '+i,`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{row:'A',number:i,type:'Thường'},current:201})).seat.id);
 const start=new Date(Date.now()+40*86400000);
 const show=(await api('fixture showtime','/manager/showtimes',{actor:'manager',method:'POST',body:{movieId:1,roomId:room.id,startsAt:start.toISOString(),endsAt:new Date(start.getTime()+166*60000).toISOString(),format:'2D',basePrice:120000},current:201})).showtime;
 const bookBody=index=>({showtimeId:show.id,seatIds:[seats[index]],products:[]});
 const order=(await api('Customer DAT_VE present: booking','/bookings',{actor:'customer',method:'POST',body:bookBody(0),current:201})).booking.id;
 await api('Customer own order detail','/orders/'+order,{actor:'customer'});
 await api('Customer foreign order denied','/orders/'+order,{actor:'customer2',current:404});
 await without('KHACH_HANG',['DAT_VE'],async()=>{
  const me=(await api('old customer JWT loads revoked DAT_VE','/auth/me',{actor:'customer'})).user;assert.ok(!me.permissions.some(p=>p.code==='DAT_VE'));
  await api('BUG-019: booking after DAT_VE revoked','/bookings',{actor:'customer',method:'POST',body:bookBody(1),current:201,target:403,context:'DAT_VE revoked; same JWT'});
  await api('BUG-019: promotion preview after DAT_VE revoked','/promotions/validate',{actor:'customer',method:'POST',body:{...bookBody(2),promotionCode:'R3A_NO_MATCH'},current:200,target:403});
  await api('Customer order history without DAT_VE','/orders',{actor:'customer',context:'Permission mapping for own history remains a review decision'});
  fe('BUG-020: old current customer profile denied orders area by DAT_VE',me,'KHACH_HANG','DAT_VE',false);
 });
 await without('KHACH_HANG',['THANH_TOAN'],async()=>{
  const me=(await api('old customer JWT loads revoked THANH_TOAN','/auth/me',{actor:'customer'})).user;assert.ok(!me.permissions.some(p=>p.code==='THANH_TOAN'));
  const payment=(await api('BUG-019: payment attempt after permission revoked',`/orders/${order}/payments`,{actor:'customer',method:'POST',body:{paymentMethod:'MOMO'},current:201,target:403})).payment.id;
  await api('BUG-019: payment result after permission revoked',`/orders/${order}/payments/${payment}/result`,{actor:'customer',method:'POST',body:{status:'Thành công'},current:200,target:403});
  await api('Foreign payment attempt still denied',`/orders/${order}/payments`,{actor:'customer2',method:'POST',body:{paymentMethod:'MOMO'},current:404});
  await api('Foreign payment result still denied',`/orders/${order}/payments/${payment}/result`,{actor:'customer2',method:'POST',body:{status:'Thành công'},current:404});
 });
 const order2=(await api('fixture second customer booking','/bookings',{actor:'customer2',method:'POST',body:bookBody(3),current:201})).booking.id;
 const payment2=(await api('Customer THANH_TOAN present: attempt',`/orders/${order2}/payments`,{actor:'customer2',method:'POST',body:{paymentMethod:'MOMO'},current:201})).payment.id;
 await api('Customer THANH_TOAN present: result',`/orders/${order2}/payments/${payment2}/result`,{actor:'customer2',method:'POST',body:{status:'Thành công'}});
 // Only the disposable fixture showtime is moved into the past to satisfy existing review eligibility.
 await pool.request().input('Show',sql.Int,show.id).query('UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(DAY,-3,dbo.fn_BayGio()),ThoiGianKetThuc=DATEADD(MINUTE,166,DATEADD(DAY,-3,dbo.fn_BayGio())) WHERE SuatChieuID=@Show');
 await api('Customer DANH_GIA present: eligible review','/movies/1/reviews',{actor:'customer',method:'POST',body:{rating:5,content:'R3A fixture'},current:201});
 await without('KHACH_HANG',['DANH_GIA'],async()=>{
  await api('BUG-019: review after DANH_GIA revoked','/movies/1/reviews',{actor:'customer2',method:'POST',body:{rating:4,content:'R3A revoked permission fixture'},current:201,target:403});
  await api('Unwatched eligibility remains enforced','/movies/2/reviews',{actor:'customer2',method:'POST',body:{rating:4,content:'R3A fixture'},current:403});
 });
 const complaintBody={type:'R3A audit',title:'R3A fixture',content:'Disposable RBAC audit data',orderId:order};
 const complaint=(await api('Customer GUI_KHIEU_NAI present','/complaints',{actor:'customer',method:'POST',body:complaintBody,current:201})).complaint.id;
 await without('KHACH_HANG',['GUI_KHIEU_NAI'],async()=>{
  await api('BUG-019: complaint after GUI_KHIEU_NAI revoked','/complaints',{actor:'customer',method:'POST',body:complaintBody,current:201,target:403});
  await api('Complaint foreign order reference denied','/complaints',{actor:'customer2',method:'POST',body:complaintBody,current:404});
 });
 await api('Customer foreign complaint denied','/complaints/'+complaint,{actor:'customer2',current:404});
 await withPermissions('KHACH_HANG',['GUI_KHIEU_NAI'],async()=>{
  const me=(await api('Customer only GUI_KHIEU_NAI current profile','/auth/me',{actor:'customer'})).user;
  await api('Customer only GUI_KHIEU_NAI can create','/complaints',{actor:'customer',method:'POST',body:complaintBody,current:201});
  fe('BUG-020: legitimate complaint permission hidden by DAT_VE',me,'KHACH_HANG','DAT_VE',false);
 });

 await without('QUAN_LY_RAP',['QL_PHONG'],async()=>{
  await api('Manager old JWT permission revoked',`/manager/cinemas/${cinemaId}/rooms`,{actor:'manager',current:403});
  await direct('Manager SP checks scope only, not QL_PHONG','dbo.sp_Manager_Room_List',{NguoiDungID:[sql.Int,ids.manager],RapID:[sql.Int,cinemaId]},null,{QL_PHONG:false,assigned:true});
 });
 const assignment=(await pool.request().input('User',sql.Int,ids.manager).input('Cinema',sql.Int,cinemaId).query("SELECT TOP(1) * FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@User AND RapID=@Cinema AND TrangThai=N'Hiệu lực'")).recordset[0];
 await pool.request().input('ID',sql.Int,assignment.PhanCongID).query("UPDATE dbo.PHANCONG_RAP SET TrangThai=N'Đã hủy' WHERE PhanCongID=@ID");
 try {
  const me=(await api('Manager old JWT current assignments after revoke','/auth/me',{actor:'manager'})).user;assert.ok(!me.cinemaAssignments.some(c=>c.cinemaId===cinemaId));
  await api('Manager old JWT scope revoked',`/manager/cinemas/${cinemaId}/rooms`,{actor:'manager',current:403});
  await direct('Manager direct SP scope revoked','dbo.sp_Manager_Room_List',{NguoiDungID:[sql.Int,ids.manager],RapID:[sql.Int,cinemaId]},50050);
 } finally {await pool.request().input('ID',sql.Int,assignment.PhanCongID).input('Status',sql.NVarChar(50),assignment.TrangThai).query('UPDATE dbo.PHANCONG_RAP SET TrangThai=@Status WHERE PhanCongID=@ID');}
 await withPermissions('QUAN_LY_RAP',['QL_SUAT_CHIEU'],async()=>{
  const me=(await api('Manager only QL_SUAT_CHIEU profile','/auth/me',{actor:'manager'})).user;
  await api('Manager legitimate showtime API under partial grants',`/manager/cinemas/${cinemaId}/showtimes`,{actor:'manager'});
  fe('BUG-020: QL_SUAT_CHIEU hidden by QL_PHONG portal',me,'QUAN_LY_RAP','QL_PHONG',false);
 });
 await withPermissions('QUAN_LY_RAP',['QL_PHONG'],async()=>{
  const me=(await api('Manager only QL_PHONG profile','/auth/me',{actor:'manager'})).user;
  fe('Manager partial grants enters portal',me,'QUAN_LY_RAP','QL_PHONG',true);
  for(const feature of ['showtimes','pricing','dashboard','revenue'])await api('ManagerPortal composite fetch lacks permission: '+feature,`/manager/cinemas/${cinemaId}/${feature}`,{actor:'manager',current:403});
 });
 await api('Manager holds DAT_VE but role blocks Customer API','/bookings',{actor:'manager',method:'POST',body:bookBody(4),current:403});

 await api('CSKH permission present','/support/complaints',{actor:'support'});
 await api('CSKH XULY present: processing',`/support/complaints/${complaint}/processings`,{actor:'support',method:'POST',body:{content:'R3A fixture processing',nextStatus:'Đang xử lý'},current:201});
 await without('CSKH',['QL_KHIEUNAI'],async()=>{
  await api('CSKH old JWT QL revoked','/support/complaints',{actor:'support',current:403});
  await direct('DB read permits XULY alone while HTTP requires QL','dbo.sp_Support_Complaint_List',{NguoiDungID:[sql.Int,ids.support]},null,{QL_KHIEUNAI:false,XULY_KHIEUNAI:true});
 });
 await without('CSKH',['XULY_KHIEUNAI'],async()=>{
  await api('CSKH old JWT XULY revoked',`/support/complaints/${complaint}/processings`,{actor:'support',method:'POST',body:{content:'R3A denied',nextStatus:'Đang xử lý'},current:403});
  await direct('CSKH direct DB XULY revoked','dbo.sp_Support_Complaint_AddProcessing',{NguoiDungID:[sql.Int,ids.support],KhieuNaiID:[sql.Int,complaint],NoiDungXuLy:[sql.NVarChar(sql.MAX),'R3A denied'],TrangThaiSauXuLy:[sql.NVarChar(50),'Đang xử lý']},50060);
 });
 await withPermissions('CSKH',['QL_KHIEUNAI'],async()=>{
  await api('MISMATCH: order reference without TRA_CUU_DON',`/support/complaints/${complaint}/order-reference`,{actor:'support',current:200,target:403,context:'QL only; no TRA_CUU_DON'});
  await api('CSKH QL only can read detail',`/support/complaints/${complaint}`,{actor:'support'});
 });
 await withPermissions('CSKH',['TRA_CUU_DON'],async()=>{
  await api('MISMATCH: TRA_CUU_DON alone rejected',`/support/complaints/${complaint}/order-reference`,{actor:'support',current:403,target:200});
  await direct('DB also ignores TRA_CUU_DON','dbo.sp_Support_Complaint_GetOrderReference',{NguoiDungID:[sql.Int,ids.support],KhieuNaiID:[sql.Int,complaint]},50060);
 });
 await withPermissions('CSKH',[],async()=>{
  await api('CSKH all permissions revoked','/support/complaints',{actor:'support',current:403});
  await direct('CSKH direct DB all permissions revoked','dbo.sp_Support_Complaint_List',{NguoiDungID:[sql.Int,ids.support]},50060);
 });

 await api('Admin permission present','/admin/users',{actor:'admin'});
 await withPermissions('ADMIN',[],async()=>{
  const me=(await api('Admin old JWT current permissions empty','/auth/me',{actor:'admin'})).user;assert.equal(me.permissions.length,0);
  const adminEndpoints=endpoints.filter(e=>e.actor==='ADMIN');
  for(const e of adminEndpoints)await api('Admin no permissions: '+e.method+' '+e.route,e.route.replace('/api','').replace(/:[A-Za-z]+/g,'1'),{actor:'admin',method:e.method,body:['POST','PUT','PATCH'].includes(e.method)?{}:undefined,current:403});
  result.adminNoPermissionEndpointsChecked=adminEndpoints.length;
  const bypass=(await pool.request().input('Admin',sql.Int,ids.admin).input('Cinema',sql.Int,foreignCinema).query("SELECT dbo.fn_KiemTraQuyenNguoiDung(@Admin,'XULY_KHIEUNAI') AS MissingPermissionAllowed,dbo.fn_KiemTraQuyenNguoiDung(@Admin,'R3A_NONEXISTENT') AS UnknownPermissionAllowed,dbo.fn_KiemTraQuanLyRapScope(@Admin,@Cinema) AS UnassignedCinemaAllowed")).recordset[0];
  assert.equal(bypass.MissingPermissionAllowed,true);assert.equal(bypass.UnknownPermissionAllowed,true);assert.equal(bypass.UnassignedCinemaAllowed,true);
  observations.push({name:'CONFLICT-005: Admin DB bypass with no permissions',...bypass,targetExpectedPermissionAllowed:false,policyConformant:false});
  await direct('Admin actor-less SP executable without grant','dbo.sp_Admin_User_List',{},null,{adminRolePermissions:[]});
  await direct('Admin direct support read bypass','dbo.sp_Support_Complaint_List',{NguoiDungID:[sql.Int,ids.admin]},null,{adminRolePermissions:[]});
  await direct('Admin direct support write bypass','dbo.sp_Support_Complaint_AddProcessing',{NguoiDungID:[sql.Int,ids.admin],KhieuNaiID:[sql.Int,complaint],NoiDungXuLy:[sql.NVarChar(sql.MAX),'R3A Admin bypass fixture'],TrangThaiSauXuLy:[sql.NVarChar(50),'Đang xử lý']},null,{XULY_KHIEUNAI:false});
  await direct('Admin direct Manager scope bypass','dbo.sp_Manager_Room_List',{NguoiDungID:[sql.Int,ids.admin],RapID:[sql.Int,foreignCinema]},null,{QL_PHONG:false,assigned:false});
 });
 await withPermissions('ADMIN',['XEM_BAO_CAO_TOANHE'],async()=>{
  const me=(await api('Admin report-only current profile','/auth/me',{actor:'admin'})).user;
  await api('Admin report-only legitimate API','/admin/dashboard',{actor:'admin'});
  fe('BUG-020: report-only Admin hidden by QL_NGUOIDUNG',me,'ADMIN','QL_NGUOIDUNG',false);
 });
 await withPermissions('ADMIN',['QL_NGUOIDUNG'],async()=>{
  const me=(await api('Admin user-only current profile','/auth/me',{actor:'admin'})).user;
  fe('Admin user-only enters portal',me,'ADMIN','QL_NGUOIDUNG',true);
  await api('Admin default dashboard blocked under user-only grants','/admin/dashboard',{actor:'admin',current:403});
 });
 fe('Menu shows foreign areas for full Admin; role still blocks their routes',initialUsers.admin,'KHACH_HANG','DAT_VE',false);
 assert.ok(visibleAreasFor(initialUsers.admin).some(([role])=>role==='KHACH_HANG'));
 await withPermissions('QUAN_LY_RAP',['QL_KHIEUNAI','XULY_KHIEUNAI'],async()=>{
  await api('Permission granted but support hardcode role rejects','/support/complaints',{actor:'manager',current:403});
  await direct('Processing trigger rejects non-CSKH/Admin despite XULY grant','dbo.sp_Support_Complaint_AddProcessing',{NguoiDungID:[sql.Int,ids.manager],KhieuNaiID:[sql.Int,complaint],NoiDungXuLy:[sql.NVarChar(sql.MAX),'R3A trigger role fixture'],TrangThaiSauXuLy:[sql.NVarChar(50),'Đang xử lý']},50005);
 });
 for(const actor of ['customer','manager','support','admin']) {
  await pool.request().input('User',sql.Int,ids[actor]).query("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Bị khóa' WHERE NguoiDungID=@User");
  try{await api('Locked account old JWT rejected: '+actor,'/auth/me',{actor,current:401});}
  finally{await pool.request().input('User',sql.Int,ids[actor]).query("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Hoạt động' WHERE NguoiDungID=@User");}
 }
 await pool.request().input('User',sql.Int,ids.manager).input('Role',sql.Int,roles.find(r=>r.MaVaiTro==='KHACH_HANG').VaiTroID).query('UPDATE dbo.NGUOIDUNG SET VaiTroID=@Role WHERE NguoiDungID=@User');
 try{await api('Role change affects old manager JWT','/manager/cinemas',{actor:'manager',current:403});}
 finally{await pool.request().input('User',sql.Int,ids.manager).input('Role',sql.Int,roles.find(r=>r.MaVaiTro==='QUAN_LY_RAP').VaiTroID).query('UPDATE dbo.NGUOIDUNG SET VaiTroID=@Role WHERE NguoiDungID=@User');}
 const end=await rbacInventory(pool);
 assert.deepEqual(end.roles.map(r=>r.MaVaiTro).sort(),roles.map(r=>r.MaVaiTro).sort());
 assert.deepEqual(end.permissions.map(p=>p.MaQuyen).sort(),permissionRows.map(p=>p.MaQuyen).sort());
 result.catalogRolesAndPermissionsUnchanged=true;result.status='PASS';result.finishedAt=new Date().toISOString();save();
 console.log(`PASS audit probes: ${requests.length} HTTP requests; ${result.anonymousProtectedEndpointsChecked} no-JWT routes; ${result.adminNoPermissionEndpointsChecked} Admin routes with zero permissions; findings reproduced without fixes`);
} catch(error){result.status='FAIL';result.error=error.message;save();throw error;}
finally{await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}

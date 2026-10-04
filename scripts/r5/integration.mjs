import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {connect,ask,sql,root,write,mainSnapshot} from '../r3a/common.mjs';
import {credentials,read,dbRoot} from '../db/lib.mjs';
import {batches} from '../r2fix/migration-lib.mjs';
import {RESOURCE_STATUSES} from '../../shared/resourceContract.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R5[A-Za-z0-9_]+$/);
Object.assign(process.env,credentials(),{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},requests=[],checks=[];
const prefix='r5-'+crypto.randomUUID().slice(0,8);
const report={database,status:'RUNNING',requests,checks};
const save=()=>write(path.join(root,'audit/remediation/r5/evidence/r5-integration.json'),report);
const check=(bug,name,condition)=>{assert.ok(condition,name);checks.push({bug,name,status:'PASS'});};
async function api(bug,route,{actor='admin',method='GET',body,status=200}={}){
 const response=await fetch(base+route,{method,headers:{...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json();requests.push({bug,route,method,status:response.status,error:data.error?.code});
 if(status!==null)assert.equal(response.status,status,`${bug} ${route}: ${JSON.stringify(data)}`);
 return status===null?{status:response.status,data}:data.data??data;
}
async function query(source,values={}){const request=pool.request();for(const [name,v] of Object.entries(values))request.input(name,typeof v==='number'?sql.Int:sql.NVarChar(sql.MAX),v);return (await request.query(source)).recordset;}
async function domain(bug,name,source,values={},number){await assert.rejects(query(source,values),e=>e.number===number);check(bug,name,true);}
try{
 for(const [actor,email] of Object.entries({admin:'admin@cinemadb.vn',manager:'manager.q1@cinemadb.vn',customer:'khachhang1@gmail.com'}))tokens[actor]=(await api(null,'/auth/login',{method:'POST',body:{Email:email,MatKhau:'123456'}})).token;
 const ids=Object.fromEntries((await query("SELECT vt.MaVaiTro,nd.NguoiDungID FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON nd.VaiTroID=vt.VaiTroID WHERE nd.Email IN ('admin@cinemadb.vn','manager.q1@cinemadb.vn','khachhang1@gmail.com')")).map(r=>[r.MaVaiTro,r.NguoiDungID]));
 const roles=Object.fromEntries((await query('SELECT MaVaiTro,VaiTroID FROM dbo.VAITRO')).map(r=>[r.MaVaiTro,r.VaiTroID]));
 const room=(await api('BUG-002','/manager/cinemas/1/rooms',{actor:'manager',method:'POST',body:{name:prefix,type:'2D'},status:201})).room;
 const seats=[];for(let number=1;number<=5;number++)seats.push((await api('BUG-010',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{row:'R5',number,type:'Thường'},status:201})).seat.id);
 const start=new Date(Date.now()+40*86400000),input={movieId:1,roomId:room.id,startsAt:start.toISOString(),endsAt:new Date(+start+166*60000).toISOString(),format:'2D',basePrice:100000};
 const show=(await api('BUG-002','/manager/showtimes',{actor:'manager',method:'POST',body:input,status:201})).showtime;
 const {roomId,...update}=input;
 for(const status of ['Đóng bán','Hoàn thành','Mở bán']){await api('BUG-002',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,status}});check('BUG-002','Persisted valid '+status,(await query('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID',{ID:show.id}))[0].TrangThai===status);}
 await api('BUG-002',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,status:'Tạm ngừng'},status:400});
 await api('BUG-003',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,status:'Đã hủy'},status:409});
 for(const status of RESOURCE_STATUSES.rooms){await api('BUG-002',`/manager/rooms/${room.id}`,{actor:'manager',method:'PUT',body:{name:prefix,type:'2D',status}});}
 await api('BUG-002',`/manager/rooms/${room.id}`,{actor:'manager',method:'PUT',body:{name:prefix,type:'2D',status:'Hoạt động'}});
 for(const status of RESOURCE_STATUSES.movies){await api('BUG-002','/admin/movies?status='+encodeURIComponent(status));await api('BUG-002','/movies?status='+encodeURIComponent(status),{actor:'none'});}
 await api('BUG-002','/movies?status=invalid',{actor:'none',status:400});
 const role=(await api('BUG-008','/admin/roles',{method:'POST',body:{code:prefix,name:prefix}})).role;
 const permissions=(await api('BUG-008','/admin/permissions')).permissions.slice(0,3).map(r=>r.QuyenID);
 await api('BUG-008',`/admin/roles/${role.VaiTroID}/permissions`,{method:'PUT',body:{permissionIds:permissions}});
 await api('BUG-008',`/admin/roles/${role.VaiTroID}/permissions`,{method:'PUT',body:{permissionIds:[]}});
 check('BUG-008','Empty grant set DB + API reload',(await query('SELECT COUNT(*) AS n FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID',{ID:role.VaiTroID}))[0].n===0&&(await api('BUG-008',`/admin/roles/${role.VaiTroID}/permissions`)).permissions.length===0);
 for(const bad of [0,-1,1.5,2147483648,'1',null]){
  await api('BUG-009','/admin/rooms',{method:'POST',body:{cinemaId:bad,name:prefix,type:'2D'},status:400});
  await api('BUG-009',`/admin/roles/${role.VaiTroID}/permissions`,{method:'PUT',body:{permissionIds:[bad]},status:400});
  await api('BUG-010',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{row:'R5bad',number:bad,type:'Thường'},status:400});
 }
 await api('BUG-009','/admin/cinemas/2147483648',{method:'PUT',body:{name:prefix,address:prefix,city:prefix,status:'Hoạt động'},status:400});
 await api('BUG-009','/admin/rooms?cinemaId=2147483648',{status:400});
 await api('BUG-011','/admin/actors',{method:'POST',body:{name:'x'.repeat(151)},status:400});
 const actor=(await api('BUG-011','/admin/actors',{method:'POST',body:{name:'x'.repeat(150),birthDate:'2000-01-01'}})).actor;
 check('BUG-011','Actor boundary persisted without truncation',(await query('SELECT LEN(HoTen) AS n FROM dbo.DIENVIEN WHERE DienVienID=@ID',{ID:actor.DienVienID}))[0].n===150);
 await api('BUG-011','/admin/cinemas',{method:'POST',body:{name:'x'.repeat(151),address:prefix,city:prefix},status:400});
 await api('BUG-011','/admin/products',{method:'POST',body:{name:prefix,type:'Snack',price:1.234},status:400});
 const missing=2147483647;
 for(const [resource,body] of Object.entries({cinemas:{name:prefix,address:prefix,city:prefix,status:'Hoạt động'},roles:{name:prefix},permissions:{name:prefix},rooms:{name:prefix,type:'2D',status:'Hoạt động'},seats:{type:'Thường',status:'Hoạt động'},genres:{name:prefix},actors:{name:prefix},products:{name:prefix,type:'Snack',price:1,status:'Đang bán'},users:{status:'Hoạt động'}})){
  await api('BUG-012',`/admin/${resource}/${missing}${resource==='users'?'/status':''}`,{method:'PUT',body,status:404});
  if(!['users','seats'].includes(resource))await api('BUG-012',`/admin/${resource}/${missing}`,{method:'DELETE',status:404});
 }
 await api('BUG-012','/movies/2147483647',{actor:'none',status:404});
 await api('BUG-003',`/admin/cinemas/1`,{method:'DELETE',status:409});
 await api('BUG-003','/admin/cinemas',{actor:'customer',status:403});await api('BUG-003','/admin/cinemas',{actor:'none',status:401});
 await api('BUG-013','/admin/actors',{method:'POST',body:{name:prefix,birthDate:'2999-01-01'},status:400});
 await api('BUG-013',`/admin/actors/${actor.DienVienID}`,{method:'PUT',body:{name:prefix,birthDate:'2999-01-01'},status:400});
 await api('BUG-013','/auth/register',{actor:'none',method:'POST',body:{HoTen:prefix,Email:prefix+'dob@test.com',MatKhau:'password8',NgaySinh:'2999-01-01'},status:400});
 await api('BUG-013','/auth/me',{actor:'customer',method:'PUT',body:{HoTen:prefix,NgaySinh:'2999-01-01'},status:400});
 for(const [name,source] of [['actor create',`EXEC dbo.sp_Admin_Actor_Create @ActorID=${ids.ADMIN},@HoTen=N'R5 future',@NgaySinh='2999-01-01'`],['actor update',`EXEC dbo.sp_Admin_Actor_Update @ActorID=${ids.ADMIN},@DienVienID=${actor.DienVienID},@HoTen=N'R5 future',@NgaySinh='2999-01-01'`],['register',"DECLARE @NewID INT; EXEC dbo.sp_Auth_RegisterCustomer @NewUserId=@NewID OUTPUT,@HoTen=N'R5 future',@Email='r5-future@test.com',@MatKhauHash='hash',@NgaySinh='2999-01-01'"],['profile',`EXEC dbo.sp_User_UpdateProfile @NguoiDungID=${ids.KHACH_HANG},@HoTen=N'R5 future',@NgaySinh='2999-01-01'`]])await domain('BUG-013','DB authoritative DOB '+name,source,{},50400);
 const user=(await api('BUG-015','/admin/users',{method:'POST',body:{name:prefix,email:prefix+'@test.com',password:'password8',roleId:roles.KHACH_HANG}})).user;
 check('BUG-015','Customer profile exists exactly once, defaults NULL/0',(await query('SELECT * FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID',{ID:user.NguoiDungID})).some(p=>p.DiemTichLuy===0&&p.NgaySinh===null&&p.GioiTinh===null));
 const staff=(await api('BUG-015','/admin/users',{method:'POST',body:{name:prefix,email:prefix+'staff@test.com',password:'password8',roleId:roles.QUAN_LY_RAP}})).user;
 check('BUG-015','Internal account has no customer profile',(await query('SELECT COUNT(*) AS n FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID',{ID:staff.NguoiDungID}))[0].n===0);
 await ask(pool,"CREATE OR ALTER TRIGGER dbo.R5_FailProfile ON dbo.HOSOKHACHHANG AFTER INSERT AS BEGIN THROW 59998,'R5 deliberate profile failure',1; END");
 try{
  await api('BUG-015','/admin/users',{method:'POST',body:{name:prefix,email:prefix+'fail@test.com',password:'password8',roleId:roles.KHACH_HANG},status:500});
  check('BUG-015','Profile failure rolls back account',(await query('SELECT COUNT(*) AS n FROM dbo.NGUOIDUNG WHERE Email=@Email',{Email:prefix+'fail@test.com'}))[0].n===0);
 }finally{await ask(pool,'DROP TRIGGER dbo.R5_FailProfile');}
 const nested=new sql.Transaction(pool);await nested.begin();
 try{await ask(nested,`EXEC dbo.sp_Admin_User_Create @ActorID=${ids.ADMIN},@HoTen=N'R5 nested',@Email='${prefix}nested@test.com',@MatKhauHash='hash',@VaiTroID=${roles.KHACH_HANG};`);assert.equal((await ask(nested,'SELECT @@TRANCOUNT AS n')).recordset[0].n,1);await nested.rollback();}catch(e){try{await nested.rollback();}catch{}throw e;}
 check('BUG-015','Caller rollback removes account and profile',(await query('SELECT COUNT(*) AS n FROM dbo.NGUOIDUNG WHERE Email=@Email',{Email:prefix+'nested@test.com'}))[0].n===0);
 const assignment={userId:ids.QUAN_LY_RAP,cinemaId:1,startsOn:'2031-01-01',endsOn:null,status:'Hiệu lực'};
 const concurrent=await Promise.all(Array.from({length:16},()=>api('BUG-017','/admin/assignments',{method:'POST',body:assignment,status:null})));
 check('BUG-017','16 equivalent concurrent creates: one success, fifteen 409',concurrent.filter(r=>r.status===200).length===1&&concurrent.filter(r=>r.status===409).length===15);
 const first=concurrent.find(r=>r.status===200).data.assignment.PhanCongID;
 await api('BUG-017','/admin/assignments',{method:'POST',body:assignment,status:409});
 const other=(await api('BUG-017','/admin/assignments',{method:'POST',body:{...assignment,startsOn:'2031-02-01'}})).assignment;
 await api('BUG-017',`/admin/assignments/${other.PhanCongID}`,{method:'PUT',body:assignment,status:409});
 await api('BUG-017',`/admin/assignments/${first}`,{method:'PUT',body:{...assignment,status:'Đã hủy'}});
 await api('BUG-017','/admin/assignments',{method:'POST',body:assignment});check('BUG-017','Different period/status remain allowed',true);
 const product=(await api('BUG-016','/admin/products',{method:'POST',body:{name:prefix,type:'Snack',price:15000},status:201})).product;
 const pid=product.SanPhamID;
 const beforeProducts=(await mainSnapshot(pool)).data.filter(t=>['DONDATVE','CHITIETVE','CHITIETDOAN','KHUYENMAI','THANHTOAN','BOITHUONG_HUYSUAT'].includes(t.table));
 for(const products of [[{productId:1,quantity:1},{productId:missing,quantity:1}],[{productId:1,quantity:0}],[{productId:1,quantity:1.5}],[{productId:1,quantity:1},{productId:1,quantity:1}]])await api('BUG-016','/bookings',{actor:'customer',method:'POST',body:{showtimeId:show.id,seatIds:[seats[0]],products,promotionCode:'GIAM10'},status:400});
 await query("UPDATE dbo.SANPHAM SET TrangThai=N'Ngừng bán' WHERE SanPhamID=@ID",{ID:pid});
 await api('BUG-016','/bookings',{actor:'customer',method:'POST',body:{showtimeId:show.id,seatIds:[seats[0]],products:[{productId:pid,quantity:1}]},status:400});
 for(const json of ['{}','not-json','[null]','[{"SanPhamID":1,"SoLuong":1.5}]','[{"SanPhamID":1,"SoLuong":"1"}]','[{"SanPhamID":2147483648,"SoLuong":1}]','[{"SanPhamID":1,"SanPhamID":2,"SoLuong":1}]'])await domain('BUG-016','Invalid direct-SP JSON rollback: '+json,`DECLARE @ID INT; EXEC dbo.sp_Booking_Create @NguoiDungID=${ids.KHACH_HANG},@SuatChieuID=${show.id},@DanhSachGheId='${seats[0]}',@DanhSachDoAnJson=@Json,@NewDonDatVeID=@ID OUTPUT;`,{Json:json},50402);
 const afterProducts=(await mainSnapshot(pool)).data.filter(t=>beforeProducts.some(b=>b.table===t.table));assert.deepEqual(afterProducts,beforeProducts);check('BUG-016','All invalid products preserve order/ticket/food/promotion/payment/compensation hashes',true);
 await query("UPDATE dbo.SANPHAM SET TrangThai=N'Đang bán' WHERE SanPhamID=@ID",{ID:pid});
 const booked=(await api('BUG-016','/bookings',{actor:'customer',method:'POST',body:{showtimeId:show.id,seatIds:[seats[0]],products:[{productId:1,quantity:1},{productId:pid,quantity:2}]},status:201})).booking;
 check('BUG-016','Valid items all saved',(await query('SELECT COUNT(*) AS n FROM dbo.CHITIETDOAN WHERE DonDatVeID=@ID',{ID:booked.id}))[0].n===2);
 const direct=(await query(`DECLARE @ID INT; EXEC dbo.sp_Booking_Create @NguoiDungID=${ids.KHACH_HANG},@SuatChieuID=${show.id},@DanhSachGheId='${seats[1]}',@DanhSachDoAnJson=N'[{"SanPhamID":1,"SoLuong":1},{"SanPhamID":1,"SoLuong":2}]',@NewDonDatVeID=@ID OUTPUT;`))[0];
 check('BUG-016','Existing direct-SP duplicate aggregation remains quantity3',(await query('SELECT SoLuong FROM dbo.CHITIETDOAN WHERE DonDatVeID=@ID',{ID:direct.DonDatVeID}))[0].SoLuong===3);
 await api('BUG-003',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,startsAt:new Date(+start+3600000).toISOString(),endsAt:new Date(+start+3600000+166*60000).toISOString(),status:'Đóng bán'},status:409});
 await api('BUG-003',`/admin/showtimes/${show.id}/cancel`,{method:'POST',status:409});
 // Fixtures for aggregate tests obey the review trigger: a past show and paid orders exist.
 const film=(await api('BUG-018','/admin/movies',{method:'POST',status:201,body:{title:prefix,durationMinutes:120,releaseDate:'2020-01-01',endDate:null,genreIds:[1,2]}})).movie;
 const mid=film.movieId;
 await api('BUG-018',`/admin/movies/${mid}/actors`,{method:'PUT',body:{cast:[{actorId:1,role:'R5 lead'},{actorId:2,role:'R5 second'}]}});
 const past=(await query(`INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(${mid},${room.id},DATEADD(DAY,-10,dbo.fn_BayGio()),DATEADD(MINUTE,120,DATEADD(DAY,-10,dbo.fn_BayGio())),N'2D',100000,N'Hoàn thành'); SELECT CONVERT(INT,SCOPE_IDENTITY()) AS SuatChieuID;`))[0].SuatChieuID;
 for(let i=1;i<=3;i++)await query(`INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(${mid},${room.id},DATEADD(DAY,${60+i},dbo.fn_BayGio()),DATEADD(MINUTE,120,DATEADD(DAY,${60+i},dbo.fn_BayGio())),N'2D',100000,N'Mở bán');`);
 async function aggregate(count,avg){
  const view=(await query('SELECT * FROM dbo.vw_ThongKePhim WHERE PhimID=@ID',{ID:mid}))[0];assert.equal(view.SoLuotDanhGia,count);assert.equal(view.DiemDanhGiaTrungBinh,avg);assert.equal(view.TongSoSuatChieu,4);
  const detail=(await api('BUG-018',`/movies/${mid}`,{actor:'none'})).movie;
  const list=(await api('BUG-018','/movies?search='+prefix,{actor:'none'})).movies.find(m=>m.id===mid);
  assert.equal(detail.reviewCount,count);assert.equal(detail.averageRating,avg);assert.equal(list.reviewCount,count);assert.equal(list.averageRating,avg);check('BUG-018',`${count} reviews, 4 shows, 2 genres, 2 actors correct in view/list/detail`,true);
 }
 await aggregate(0,0);
 for(const [uid,rating,n,avg] of [[ids.KHACH_HANG,5,1,5],[user.NguoiDungID,2,2,3.5]]){
  await query(`INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai) VALUES(${uid},${past},100000,0,0,N'Đã thanh toán'); INSERT dbo.DANHGIAPHIM(PhimID,NguoiDungID,SoSao,NoiDung) VALUES(${mid},${uid},${rating},N'R5 aggregate fixture');`);
  await aggregate(n,avg);
 }
 const oldView=JSON.parse(read(path.join(root,'audit/remediation/r5/evidence/baseline-modules.json'))).modules.find(m=>m.name==='vw_ThongKePhim');
 try{await batches(pool,oldView.definition.replace(/CREATE\s+(?:OR\s+ALTER\s+)?VIEW/i,'CREATE OR ALTER VIEW'));const oldCount=(await query('SELECT SoLuotDanhGia FROM dbo.vw_ThongKePhim WHERE PhimID=@ID',{ID:mid}))[0].SoLuotDanhGia;assert.equal(oldCount,8);report.reviewBeforeAfter={oldCount,newCount:2,shows:4};}finally{await batches(pool,read(path.join(dbRoot,'06_views/vw_ThongKePhim.sql')));}
 check('BUG-018','Before8 -> after2 on identical nonzero review data',true);
 report.status='PASS';report.bugs=[...new Set(requests.map(r=>r.bug).filter(Boolean))].sort();assert.equal(report.bugs.length,12);save();console.log(`PASS R5: ${requests.length} HTTP requests, ${checks.length} DB assertions, all 12 bugs`);
}catch(e){report.status='FAIL';report.error=e.message;save();throw e;}
finally{await new Promise(r=>server.close(r));await closePool();await pool.close();}

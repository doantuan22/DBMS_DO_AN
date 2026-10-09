// Owned fixtures for every supported Admin operation outside specialized replays.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {read,root,write,evidenceRoot,sql} from './common.mjs';
import {start} from './harness.mjs';
import {fingerprints} from '../../database/11_tests/r6-group-a/support.mjs';
import {cleanSession} from '../r21/fixtures.mjs';
const h=await start('admin-operations'),{e,pool,query}=h,matrix=JSON.parse(read(path.join(root,'docs/evidence/r6-group-c/inspection/operation-matrix.json'))).rows;
const prefix='R6C-'+crypto.randomUUID().slice(0,8),owned={},probed=new Set();let n=0,adminId;
const own=(table,key,id)=>{assert.ok(Number.isInteger(id));(owned[table]??={key,ids:[]}).ids.push(id);return id;};
const raw=value=>value?.recordset?.[0]??value?.detail?.[0]??value;
const operation=(method,route)=>matrix.find(r=>r.method===method&&new RegExp('^'+r.api.slice(4).replace(/:[A-Za-z]+/g,'[^/]+')+'$').test(route.split('?')[0]));
const caseId=()=>`R6.9-admin-${String(++n).padStart(3,'0')}`;
async function call(module,scenario,method,route,input,http=200,code,verify){
 const op=operation(method,route);assert.ok(op,method+' '+route);const key=op.method+' '+op.api;
 if(!probed.has(key)){
  probed.add(key);
  const spoofedInput=method==='GET'?undefined:{...(input||{}),ActorID:adminId,role:'ADMIN',permissions:op.permissions};
  const spoofedRoute=method==='GET'?route+(route.includes('?')?'&':'?')+'ActorID='+adminId+'&role=ADMIN':route;
  await h.test(caseId(),module,'Wrong role with spoofed actor/role/permissions: '+key,'customer',method,spoofedRoute,spoofedInput,403,'ADMIN_REQUIRED');
  for(const permission of op.permissions)await h.revoked(adminId,permission,()=>h.test(caseId(),module,'Missing '+permission+': '+key,'admin',method,route,input,403,'FORBIDDEN'));
 }
 let stats;
 if(http<400)stats=await query('SELECT OBJECT_NAME(object_id) name,SUM(execution_count) executions FROM sys.dm_exec_procedure_stats WHERE database_id=DB_ID() GROUP BY object_id');
 const reply=await h.test(caseId(),module,scenario,'admin',method,route,input,http,code,async(body,q)=>{
  if(verify)await verify(body,q);
  if(http<400){const after=await q('SELECT OBJECT_NAME(object_id) name,SUM(execution_count) executions FROM sys.dm_exec_procedure_stats WHERE database_id=DB_ID() GROUP BY object_id');
   for(const p of op.procedures){const name=p.split('.').at(-1),before=Number(stats.find(r=>r.name===name)?.executions||0),actual=Number(after.find(r=>r.name===name)?.executions||0);assert.ok(actual>before,'Actual SQL procedure did not execute: '+name);}
  }
 });const current=e.cases.at(-1);current.operation={api:op.api,useCase:op.useCase,permissions:op.permissions,procedureKeys:op.procedureKeys,procedures:op.procedures};return reply;
}
async function persisted(q,table,key,id,fields){const row=(await q(`SELECT * FROM dbo.${table} WHERE ${key}=@ID`,{ID:id}))[0];assert.ok(row);for(const [column,value] of Object.entries(fields)){const actual=row[column] instanceof Date?(typeof value==='string'&&value.length===10?row[column].toISOString().slice(0,10):row[column].toISOString()):row[column];assert.equal(actual,value,table+'.'+column);}return row;}
async function create(module,route,body,table,key,envelope,fields={},status=200){let id;const reply=await call(module,'Create persisted','POST',route,body,status,undefined,async(r,q)=>{id=envelope==='movie'?r.movie.movieId:raw(r[envelope])[key];own(table,key,id);await persisted(q,table,key,id,fields);});await call(module,'Reject omitted create fields','POST',route,{},400,'INVALID_REQUEST');return {id,reply};}
async function edit(module,route,body,table,key,id,fields){await call(module,'Update persisted','PUT',route,body,200,undefined,(r,q)=>persisted(q,table,key,id,fields));await call(module,'Reject omitted update fields','PUT',route,{},400,'INVALID_REQUEST');}
async function list(module,route,envelope,key,id){return call(module,'Read persisted owned row','GET',route,undefined,200,undefined,async(r)=>{assert.ok(Array.isArray(r[envelope]));if(id!==undefined)assert.ok(r[envelope].some(row=>row[key]===id));});}
async function remove(module,route,table,key,id){await call(module,'Delete owned resource','DELETE',route,undefined,200,undefined,async(r,q)=>assert.deepEqual(await q(`SELECT * FROM dbo.${table} WHERE ${key}=@ID`,{ID:id}),[]));}
async function cleanup(){
 const ids=table=>owned[table]?.ids.join(',')||'NULL';
 await pool.request().batch(`IF @@TRANCOUNT>0 ROLLBACK;
 DELETE dbo.PHIM_DIENVIEN WHERE PhimID IN(${ids('PHIM')});DELETE dbo.PHIM_THELOAI WHERE PhimID IN(${ids('PHIM')});
 DELETE dbo.VAITRO_QUYEN WHERE VaiTroID IN(${ids('VAITRO')}) OR QuyenID IN(${ids('QUYEN')});
 DELETE dbo.HOSOKHACHHANG WHERE NguoiDungID IN(${ids('NGUOIDUNG')});`);
 for(const table of ['SUATCHIEU','GHE','HINHANH_RAPCHIEUPHIM','BANGGIA','PHANCONG_RAP','PHONGCHIEU','PHIM','DIENVIEN','THELOAI','SANPHAM','KHUYENMAI','NGUOIDUNG','QUYEN','VAITRO','RAPCHIEUPHIM'])if(owned[table])await query(`DELETE dbo.${table} WHERE ${owned[table].key} IN(${ids(table)})`);
}
try{
 e.before=await fingerprints(pool);const users=await query("SELECT NguoiDungID,Email FROM dbo.NGUOIDUNG WHERE Email IN('admin@cinemadb.vn','khachhang1@gmail.com')");adminId=users.find(r=>r.Email.startsWith('admin@')).NguoiDungID;
 await h.login('admin','admin@cinemadb.vn');await h.login('customer','khachhang1@gmail.com');
 const roles=await query('SELECT * FROM dbo.VAITRO'),managerRole=roles.find(r=>r.MaVaiTro==='QUAN_LY_RAP').VaiTroID;
 const clock=(await query('SELECT dbo.fn_HomNay() today,DATEADD(DAY,10,dbo.fn_HomNay()) showDate,DATEADD(DAY,11,dbo.fn_HomNay()) endDate,CONVERT(DATETIME2(3),DATEADD(DAY,10,dbo.fn_BayGio())) starts'))[0],day=d=>d.toISOString().slice(0,10);
 await call('User','Reproduce legacy six-byte seed password rejected for new user','POST','/admin/users',{name:prefix,email:prefix+'short@example.test',password:'123456',roleId:managerRole},400,'INVALID_REQUEST');
 const person=await create('User','/admin/users',{name:prefix,email:prefix+'@example.test',password:'12345678',roleId:managerRole},'NGUOIDUNG','NguoiDungID','user',{VaiTroID:managerRole,HoTen:prefix,TrangThai:'Hoạt động'});
 await list('User','/admin/users?roleId='+managerRole,'users','NguoiDungID',person.id);
 await call('User','Duplicate email','POST','/admin/users',{name:prefix,email:prefix+'@example.test',password:'12345678',roleId:managerRole},409,'EMAIL_ALREADY_EXISTS');
 await call('User','Invalid role FK rolls back user','POST','/admin/users',{name:prefix,email:prefix+'bad@example.test',password:'12345678',roleId:2147483647},400,'INVALID_REFERENCE');
 await edit('User',`/admin/users/${person.id}/status`,{status:'Bị khóa'},'NGUOIDUNG','NguoiDungID',person.id,{TrangThai:'Bị khóa'});
 await call('User','Reactivate owned account','PUT',`/admin/users/${person.id}/status`,{status:'Hoạt động'},200,undefined,(r,q)=>persisted(q,'NGUOIDUNG','NguoiDungID',person.id,{TrangThai:'Hoạt động'}));
 await h.login('newManager',prefix+'@example.test','12345678');
 const role=await create('Role','/admin/roles',{code:prefix,name:prefix,description:'owned role'},'VAITRO','VaiTroID','role',{MaVaiTro:prefix,TenVaiTro:prefix});await list('Role','/admin/roles','roles','VaiTroID',role.id);
 await edit('Role',`/admin/roles/${role.id}`,{name:prefix+' edit',description:'edit'},'VAITRO','VaiTroID',role.id,{TenVaiTro:prefix+' edit'});
 const permission=await create('Permission','/admin/permissions',{code:prefix,name:prefix,description:'owned permission'},'QUYEN','QuyenID','permission',{MaQuyen:prefix,TenQuyen:prefix});await list('Permission','/admin/permissions','permissions','QuyenID',permission.id);
 await edit('Permission',`/admin/permissions/${permission.id}`,{name:prefix+' edit',description:'edit'},'QUYEN','QuyenID',permission.id,{TenQuyen:prefix+' edit'});
 await call('Permission','Duplicate permission code','POST','/admin/permissions',{code:prefix,name:'duplicate'},409,'PERMISSION_CODE_EXISTS');
 await call('Role-Permission','Grant exact permission list','PUT',`/admin/roles/${role.id}/permissions`,{permissionIds:[permission.id]},200,undefined,async(r,q)=>{assert.equal(r.permissions.length,1);assert.deepEqual((await q('SELECT QuyenID FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID',{ID:role.id})).map(x=>x.QuyenID),[permission.id]);});
 await list('Role-Permission',`/admin/roles/${role.id}/permissions`,'permissions','QuyenID',permission.id);
 await call('Role-Permission','Invalid replacement FK restores previous grants','PUT',`/admin/roles/${role.id}/permissions`,{permissionIds:[2147483647]},400,'INVALID_REFERENCE');
 await call('Role','Role with grants protected','DELETE',`/admin/roles/${role.id}`,undefined,409,'ROLE_IN_USE');
 await call('Permission','Permission with dependency protected','DELETE',`/admin/permissions/${permission.id}`,undefined,409,'PERMISSION_IN_USE');
 await call('Role-Permission','Explicit empty clears own grants','PUT',`/admin/roles/${role.id}/permissions`,{permissionIds:[]},200,undefined,async(r,q)=>{assert.deepEqual(r.permissions,[]);assert.deepEqual(await q('SELECT * FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID',{ID:role.id}),[]);});
 await remove('Permission',`/admin/permissions/${permission.id}`,'QUYEN','QuyenID',permission.id);await remove('Role',`/admin/roles/${role.id}`,'VAITRO','VaiTroID',role.id);
 const cinema=await create('Cinema','/admin/cinemas',{name:prefix,address:'Fixture',city:'HCM'},'RAPCHIEUPHIM','RapID','cinema',{TenRap:prefix,TrangThai:'Hoạt động'});await list('Cinema','/admin/cinemas','cinemas','RapID',cinema.id);
 await edit('Cinema',`/admin/cinemas/${cinema.id}`,{name:prefix+' edit',address:'Edited',city:'HCM',status:'Hoạt động'},'RAPCHIEUPHIM','RapID',cinema.id,{TenRap:prefix+' edit',DiaChi:'Edited'});
 const assignmentBody={userId:person.id,cinemaId:cinema.id,startsOn:day(clock.today),endsOn:null};
 const assignment=await create('Assignment','/admin/assignments',assignmentBody,'PHANCONG_RAP','PhanCongID','assignment',{NguoiDungID:person.id,RapID:cinema.id,TrangThai:'Hiệu lực'});
 await list('Assignment',`/admin/assignments?cinemaId=${cinema.id}&userId=${person.id}`,'assignments','PhanCongID',assignment.id);
 await call('Assignment','Duplicate assignment','POST','/admin/assignments',assignmentBody,409,'ASSIGNMENT_DUPLICATE');
 await call('Assignment','Wrong assigned role','POST','/admin/assignments',{...assignmentBody,userId:adminId},400,'ASSIGNMENT_MANAGER_REQUIRED');
 await call('Assignment','Missing cinema FK','POST','/admin/assignments',{...assignmentBody,cinemaId:2147483647},400,'INVALID_REFERENCE');
 await call('Assignment','Admin assignment grants actual Manager scope','GET','/admin/assignments?userId='+person.id,undefined,200,undefined,async(r,q)=>{assert.equal((await q(`SELECT dbo.fn_KiemTraQuanLyRapScope(${person.id},${cinema.id}) allowed`))[0].allowed,true);const reply=await h.request('newManager','GET',`/manager/cinemas/${cinema.id}/rooms`,undefined,200);assert.deepEqual(reply.rooms,[]);});
 await edit('Assignment',`/admin/assignments/${assignment.id}`,{...assignmentBody,status:'Đã hủy'},'PHANCONG_RAP','PhanCongID',assignment.id,{TrangThai:'Đã hủy'});
 await call('Assignment','Admin revoked assignment removes scope','GET','/admin/assignments?userId='+person.id,undefined,200,undefined,async(r,q)=>{assert.equal((await q(`SELECT dbo.fn_KiemTraQuanLyRapScope(${person.id},${cinema.id}) allowed`))[0].allowed,false);await h.request('newManager','GET',`/manager/cinemas/${cinema.id}/rooms`,undefined,403,'MANAGER_CINEMA_FORBIDDEN');});
 const imageBase={url:'/r6c-image.svg',description:'owned image',displayOrder:1,status:'Hoạt động'},imagePath=`/admin/cinemas/${cinema.id}/images`;
 const image=await create('Image',imagePath,{...imageBase,cover:true},'HINHANH_RAPCHIEUPHIM','HinhAnhRapID','image',{RapID:cinema.id,LaAnhDaiDien:true},201);
 const image2=await create('Image',imagePath,{...imageBase,displayOrder:2,cover:false},'HINHANH_RAPCHIEUPHIM','HinhAnhRapID','image',{RapID:cinema.id,LaAnhDaiDien:false},201);await list('Image',imagePath,'images','HinhAnhRapID',image.id);
 await edit('Image',imagePath+'/'+image.id,{...imageBase,description:'updated'},'HINHANH_RAPCHIEUPHIM','HinhAnhRapID',image.id,{MoTa:'updated',LaAnhDaiDien:true});
 await call('Image','Set one cover without losing other image metadata','PATCH',imagePath+'/'+image2.id+'/cover',{cover:true},200,undefined,async(r,q)=>{const rows=await q('SELECT * FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID',{ID:cinema.id});assert.equal(rows.filter(r=>r.LaAnhDaiDien).length,1);assert.equal(rows.find(r=>r.LaAnhDaiDien).HinhAnhRapID,image2.id);assert.equal(rows.find(r=>r.HinhAnhRapID===image.id).MoTa,'updated');});
 await call('Image','Cover false unsupported','PATCH',imagePath+'/'+image2.id+'/cover',{cover:false},400,'INVALID_REQUEST');
 await remove('Image',imagePath+'/'+image.id,'HINHANH_RAPCHIEUPHIM','HinhAnhRapID',image.id);await remove('Image',imagePath+'/'+image2.id,'HINHANH_RAPCHIEUPHIM','HinhAnhRapID',image2.id);
 const room=await create('Room','/admin/rooms',{cinemaId:cinema.id,name:prefix,type:'2D'},'PHONGCHIEU','PhongID','room',{RapID:cinema.id,TenPhong:prefix});await list('Room','/admin/rooms?cinemaId='+cinema.id,'rooms','PhongID',room.id);
 await edit('Room','/admin/rooms/'+room.id,{name:prefix+' edit',type:'2D',status:'Hoạt động'},'PHONGCHIEU','PhongID',room.id,{TenPhong:prefix+' edit'});
 await call('Room','Duplicate room in cinema','POST','/admin/rooms',{cinemaId:cinema.id,name:prefix+' edit',type:'2D'},409,'ROOM_NAME_CONFLICT');
 const seat=await create('Seat','/admin/seats',{roomId:room.id,row:'A',number:1,type:'Thường'},'GHE','GheID','seat',{PhongID:room.id,HangGhe:'A',SoGhe:1,LoaiGhe:'Thường'});await list('Seat','/admin/seats?roomId='+room.id,'seats','GheID',seat.id);
 await edit('Seat','/admin/seats/'+seat.id,{type:'VIP',status:'Bảo trì'},'GHE','GheID',seat.id,{LoaiGhe:'VIP',TrangThai:'Bảo trì'});
 await call('Seat','Duplicate seat position','POST','/admin/seats',{roomId:room.id,row:'A',number:1,type:'Thường'},409,'SEAT_POSITION_CONFLICT');await remove('Seat','/admin/seats/'+seat.id,'GHE','GheID',seat.id);
 const genre=await create('Genre','/admin/genres',{name:prefix},'THELOAI','TheLoaiID','genre',{TenTheLoai:prefix});await list('Genre','/admin/genres','genres','TheLoaiID',genre.id);await edit('Genre','/admin/genres/'+genre.id,{name:prefix+' edit'},'THELOAI','TheLoaiID',genre.id,{TenTheLoai:prefix+' edit'});
 const actor=await create('Actor','/admin/actors',{name:prefix,birthDate:'1990-01-01',nationality:'VN'},'DIENVIEN','DienVienID','actor',{HoTen:prefix,NgaySinh:'1990-01-01'});await list('Actor','/admin/actors','actors','DienVienID',actor.id);await edit('Actor','/admin/actors/'+actor.id,{name:prefix+' edit',birthDate:'1991-01-01',nationality:'VN'},'DIENVIEN','DienVienID',actor.id,{HoTen:prefix+' edit',NgaySinh:'1991-01-01'});
 const movieBody={title:prefix,durationMinutes:60,releaseDate:day(clock.today),endDate:day(clock.endDate),language:'Việt',ageRating:'P',genreIds:[genre.id]};
 const movie=await create('Movie','/admin/movies',movieBody,'PHIM','PhimID','movie',{TenPhim:prefix,ThoiLuong:60},201);await list('Movie','/admin/movies?genreId='+genre.id,'movies','PhimID',movie.id);
 await edit('Movie','/admin/movies/'+movie.id,{...movieBody,title:prefix+' edit',status:'Đang chiếu'},'PHIM','PhimID',movie.id,{TenPhim:prefix+' edit'});
 await call('Movie','Invalid genre replacement rolls back title and association','PUT','/admin/movies/'+movie.id,{...movieBody,title:'must rollback',genreIds:[2147483647],status:'Đang chiếu'},400,'INVALID_REFERENCE');
 await call('Cast','Persist movie actor association','PUT',`/admin/movies/${movie.id}/actors`,{cast:[{actorId:actor.id,role:'Lead'}]},200,undefined,async(r,q)=>{assert.equal(r.actors[0].DienVienID,actor.id);assert.deepEqual(await q('SELECT DienVienID,VaiDien FROM dbo.PHIM_DIENVIEN WHERE PhimID=@ID',{ID:movie.id}),[{DienVienID:actor.id,VaiDien:'Lead'}]);});
 await call('Cast','Invalid actor preserves cast','PUT',`/admin/movies/${movie.id}/actors`,{cast:[{actorId:2147483647,role:'bad'}]},404,'ACTOR_NOT_FOUND');
 await call('Actor','Actor dependency protected','DELETE','/admin/actors/'+actor.id,undefined,409,'ACTOR_IN_USE');await call('Genre','Genre dependency protected','DELETE','/admin/genres/'+genre.id,undefined,409,'GENRE_IN_USE');
 const showBody={movieId:movie.id,roomId:room.id,startsAt:clock.starts.toISOString(),endsAt:new Date(clock.starts.getTime()+90*60000).toISOString(),format:'2D',basePrice:80000};
 const show=await create('Showtime','/admin/showtimes',showBody,'SUATCHIEU','SuatChieuID','showtime',{PhimID:movie.id,PhongID:room.id,GiaVeCoBan:80000});await list('Showtime','/admin/showtimes?cinemaId='+cinema.id,'showtimes','SuatChieuID',show.id);
 const {roomId,...showUpdate}=showBody;await edit('Showtime','/admin/showtimes/'+show.id,{...showUpdate,basePrice:90000,status:'Đóng bán'},'SUATCHIEU','SuatChieuID',show.id,{GiaVeCoBan:90000,TrangThai:'Đóng bán'});
 await call('Showtime','Overlap current closed show','POST','/admin/showtimes',showBody,409,'SHOWTIME_OVERLAP');
 await call('Showtime','Cancel actual owned show','POST',`/admin/showtimes/${show.id}/cancel`,undefined,200,undefined,(r,q)=>persisted(q,'SUATCHIEU','SuatChieuID',show.id,{TrangThai:'Đã hủy'}));
 await call('Showtime','Missing cancel','POST','/admin/showtimes/2147483647/cancel',undefined,404,'SHOWTIME_NOT_FOUND');
 await call('Movie','Historical show dependency protected','DELETE','/admin/movies/'+movie.id,undefined,409,'MOVIE_HAS_DEPENDENCIES');
 const priceBody={cinemaId:cinema.id,seatType:'VIP',dayType:'Cuối tuần',format:'2D',surcharge:15000,startsOn:day(clock.today),endsOn:null};
 const price=await create('Pricing','/admin/pricing',priceBody,'BANGGIA','GiaID','pricing',{RapID:cinema.id,LoaiNgay:'Cuối tuần',PhuThu:15000});await list('Pricing','/admin/pricing?cinemaId='+cinema.id,'pricing','GiaID',price.id);
 await edit('Pricing','/admin/pricing/'+price.id,{surcharge:20000,status:'Áp dụng'},'BANGGIA','GiaID',price.id,{PhuThu:20000,LoaiNgay:'Cuối tuần'});
 await call('Pricing','Holiday not in contract','POST','/admin/pricing',{...priceBody,dayType:'Ngày lễ'},400,'INVALID_REQUEST');
 const productBody={name:prefix,type:'Snack',price:10000,image:'/r6c-snack.svg'};const product=await create('Product','/admin/products',productBody,'SANPHAM','SanPhamID','product',{TenSanPham:prefix,Gia:10000},201);await list('Product','/admin/products','products','SanPhamID',product.id);await edit('Product','/admin/products/'+product.id,{...productBody,price:20000,status:'Đang bán'},'SANPHAM','SanPhamID',product.id,{Gia:20000});await remove('Product','/admin/products/'+product.id,'SANPHAM','SanPhamID',product.id);
 const promotionBody={code:prefix,description:'owned promo',discountType:'Phần trăm',discountValue:10,minimumOrder:0,maximumDiscount:10000,startsAt:clock.starts.toISOString(),endsAt:new Date(clock.starts.getTime()+86400000).toISOString(),quantity:10};const promo=await create('Promotion','/admin/promotions',promotionBody,'KHUYENMAI','KhuyenMaiID','promotion',{MaCode:prefix,GiaTriGiam:10},201);await list('Promotion','/admin/promotions','promotions','KhuyenMaiID',promo.id);
 const {code:promoCode,...promoUpdate}=promotionBody;await edit('Promotion','/admin/promotions/'+promo.id,{...promoUpdate,discountValue:20,status:'Hoạt động'},'KHUYENMAI','KhuyenMaiID',promo.id,{GiaTriGiam:20});await call('Promotion','Invalid percent100','POST','/admin/promotions',{...promotionBody,code:prefix+'bad',discountValue:100},400,'INVALID_REQUEST');await remove('Promotion','/admin/promotions/'+promo.id,'KHUYENMAI','KhuyenMaiID',promo.id);
 await call('Report','SQL four recordsets mapped','GET','/admin/reports/revenue?cinemaId='+cinema.id,undefined,200,undefined,async(r)=>{assert.ok(r.summary);assert.ok(Array.isArray(r.byCinema)&&Array.isArray(r.byMovie)&&Array.isArray(r.byDate));assert.equal(r.summary.TongDoanhThuThucTe,0);});
 await call('Report','Admin dashboard real SP','GET','/admin/dashboard',undefined,200,undefined,async(r)=>assert.ok(r.dashboard));
 await call('Room','Historical room deactivate preserves show','DELETE','/admin/rooms/'+room.id,undefined,200,undefined,async(r,q)=>{assert.equal(r.result.Deleted,false);assert.equal(r.result.Deactivated,true);await persisted(q,'PHONGCHIEU','PhongID',room.id,{TrangThai:'Ngưng hoạt động'});await persisted(q,'SUATCHIEU','SuatChieuID',show.id,{TrangThai:'Đã hủy'});});
 await call('Cinema','Cinema with dependencies protected','DELETE','/admin/cinemas/'+cinema.id,undefined,409,'CINEMA_HAS_DEPENDENCIES');
 // Positive delete controls use unused resources through the same supported routes.
 await query('DELETE dbo.SUATCHIEU WHERE SuatChieuID=@ID',{ID:show.id});await remove('Room','/admin/rooms/'+room.id,'PHONGCHIEU','PhongID',room.id);
 await remove('Movie','/admin/movies/'+movie.id,'PHIM','PhimID',movie.id);await remove('Actor','/admin/actors/'+actor.id,'DIENVIEN','DienVienID',actor.id);await remove('Genre','/admin/genres/'+genre.id,'THELOAI','TheLoaiID',genre.id);
 await query('DELETE dbo.BANGGIA WHERE GiaID=@ID',{ID:price.id});await query('DELETE dbo.PHANCONG_RAP WHERE PhanCongID=@ID',{ID:assignment.id});await remove('Cinema','/admin/cinemas/'+cinema.id,'RAPCHIEUPHIM','RapID',cinema.id);
 e.coveredOperations=[...probed];e.owned=owned;e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{try{await cleanup();e.after=await fingerprints(pool);assert.deepEqual(e.after,e.before);e.session=await cleanSession(pool);e.cleanup='PASS';}catch(error){e.status='FAIL';e.cleanupError=error.message;process.exitCode=1;}e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'admin.json'),e);await h.close();}
console.log(e.status+' Admin owned HTTP/SQL: '+e.cases.length+' cases, '+probed.size+' operations.');

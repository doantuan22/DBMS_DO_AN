import {createJourney} from './journey-fixture.mjs';
import {helpers} from './journey-helpers.mjs';
import {customer} from './customer.mjs';
import {support} from './support.mjs';
import {admin} from './admin.mjs';
import {manager} from './manager.mjs';
import {states} from './state-edges.mjs';
import {mutations} from './mutation-edges.mjs';
export async function run(t){
 const f=await createJourney(t),h=helpers(t);
 await customer(t,h,f);await support(t,h,f);await admin(t,h,f);await manager(t,h,f);
 await t.resume('KHACH_HANG');await states(t,h,f);await t.resume('QUAN_LY_RAP');await mutations(t,h,f);await edges(t,h,f);
 t.save('journey-result.json',{status:'PASS',scope:'Full role journeys, targeted state/mutation regressions and negative/transport/safety edges',fixtureIDs:f});
}
async function edges(t,h,f){
 const {assert,check,go,navigate,fill,labeled,click,until,evaluate,pause,fault,sqlCheck,query}=t;const login=t.resume;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 const countRequests=(start,method,suffix)=>t.network.slice(start).filter(n=>n.method===method&&new URL(n.url).pathname.endsWith(suffix)).length;
 await login('KHACH_HANG');
 await check('EDGE-CUSTOMER-GRANTS-NO-WRITE',['KH-07','KH-08','KH-09','KH-10','KH-11','KH-12','KH-13','KH-14'],'REAL_BROWSER_SQL',()=>h.noWrite('customer-grants',async()=>{
  const seat=(await query('SELECT TOP(1) GheID id FROM dbo.GHE WHERE PhongID=@Room AND SoGhe=3;',{Room:f.room})).recordset[0].id;
  await h.revoke(f.customer,'DAT_VE',async()=>{await h.deny('POST','/bookings',{showtimeId:f.showB,seatIds:[seat]});await h.deny('POST','/promotions/validate',{showtimeId:f.showB,seatIds:[seat],promotionCode:f.code});await go('/booking/'+f.showB);await until("document.querySelector('.seat-button')");assert.ok(await evaluate("[...document.querySelectorAll('button')].find(n=>n.textContent==='Đặt vé').disabled"));});
  await h.revoke(f.customer,'THANH_TOAN',async()=>{await h.deny('POST',`/orders/${f.order}/payments`,{paymentMethod:'MOMO'});await go('/orders');await waitText('Đơn #'+f.order);await go('/orders/'+f.order);await waitText('R82 Journey Snack');});
  await h.revoke(f.customer,'DANH_GIA',()=>h.deny('POST',`/movies/${f.movie}/reviews`,{rating:5,content:'Denied review'}));
  await h.revoke(f.customer,'GUI_KHIEU_NAI',()=>h.deny('POST','/complaints',{type:'R82',title:'Denied complaint',content:'Denied',orderId:f.order}));
 }));
 await check('EDGE-AUTH-LOCKED-CURRENT-JWT',['KH-02','QLR-01','CSKH-01','ADM-01'],'REAL_BROWSER_SQL',async()=>{
  for(const actor of t.actors){await login(actor.role);await query("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Bị khóa' WHERE NguoiDungID=@ID;",{ID:actor.id});try{await h.noWrite('locked-'+actor.role,()=>h.deny('GET','/auth/me',undefined,401));await go('/profile');await until("location.pathname==='/login'");}finally{await query("UPDATE dbo.NGUOIDUNG SET TrangThai=N'Hoạt động' WHERE NguoiDungID=@ID;",{ID:actor.id});}}
 });
 await login('ADMIN');
 await check('EDGE-ADMIN-WRITE-GRANTS-NO-WRITE',['ADM-02','ADM-03','ADM-04','ADM-05','ADM-06','ADM-07','ADM-08','ADM-09','ADM-10','ADM-11','ADM-12','ADM-13','ADM-14','ADM-15'],'REAL_BROWSER_SQL',()=>h.noWrite('admin-grants',async()=>{
  const actor=t.actors.find(a=>a.role==='ADMIN').id;
  for(const [permission,path,body]of [
   ['QL_NGUOIDUNG','users',{name:'Denied',email:'r82.denied@example.invalid',password:t.actors[0].password,roleId:1}],
   ['QL_VAITRO','roles',{code:'R82_DENIED',name:'Denied'}],['QL_QUYEN','permissions',{code:'R82_DENIED',name:'Denied'}],
   ['PHANCONG_RAP','assignments',{userId:f.manager,cinemaId:f.adminCinema,startsOn:f.today}],['QL_RAP','cinemas',{name:'Denied',address:'Denied',city:'Denied'}],
   ['QL_PHONG','rooms',{cinemaId:f.adminCinema,name:'Denied',type:'2D'}],['QL_GHE','seats',{roomId:f.adminRoom,row:'D',number:2,type:'Thường'}],
   ['QL_DANHMUC_PHIM','movies',{title:'Denied',durationMinutes:60,releaseDate:f.today,genreIds:[]}],['QL_THELOAI','genres',{name:'Denied'}],
   ['QL_SANPHAM','products',{name:'Denied',type:'Snack',price:100.25}],['QL_KHUYENMAI','promotions',{code:'R82DENIED',discountType:'Số tiền',discountValue:1,startsAt:f.startsAt,endsAt:f.endsAt,quantity:10}],
   ['QL_BANG_GIA','pricing',{cinemaId:f.adminCinema,seatType:'Tất cả',dayType:'Tất cả',format:'Tất cả',surcharge:1,startsOn:f.today}],
   ['QL_SUAT_CHIEU','showtimes',{roomId:f.adminRoom,movieId:f.adminMovie,startsAt:f.startsAt,endsAt:f.endsAt,format:'2D',basePrice:100.25}],
   ['XULY_KHIEUNAI',`complaints/${f.complaint}/processings`,{content:'Denied',nextStatus:'Đang xử lý'}]
  ])await h.revoke(actor,permission,()=>h.deny('POST','/admin/'+path,body));
  await h.revoke(actor,'QL_QUYEN',()=>h.deny('PUT',`/admin/roles/${f.role}/permissions`,{permissionIds:[]}));
 }));
 await check('EDGE-ADMIN-ROLE-ALLOWLIST-WITHOUT-ROLE-GRANT',['ADM-02'],'REAL_BROWSER_SQL',async()=>{
  const actor=t.actors.find(a=>a.role==='ADMIN').id;
  await h.revoke(actor,'QL_VAITRO',async()=>{await go('/admin');await waitText('Quản trị hệ thống');await click('Tài khoản');await until("document.querySelector('select[aria-label=\"Mã vai trò\"] option[value]')");assert.equal(await evaluate("[...document.querySelectorAll('select[aria-label=\"Mã vai trò\"] option')].filter(n=>n.value).length"),3);assert.equal(await evaluate("[...document.querySelectorAll('nav[aria-label=\"Phân hệ quản trị\"] button')].some(n=>n.textContent==='Vai trò')"),false);});
  await login('ADMIN');const role=(await query("SELECT VaiTroID id FROM dbo.VAITRO WHERE MaVaiTro='KHACH_HANG';")).recordset[0].id;
  return h.noWrite('admin-role-policy',()=>h.deny('POST','/admin/users',{name:'Disallowed',email:'r82.disallowed@example.invalid',password:t.actors[0].password,roleId:role}));
 });
 await check('EDGE-ADMIN-INVALID-HISTORY-NO-WRITE',['ADM-03','ADM-04','ADM-05','ADM-06','ADM-07','ADM-08','ADM-09','ADM-10','ADM-11','ADM-12','ADM-13','ADM-14'],'REAL_BROWSER_SQL',()=>h.noWrite('admin-invalid',async()=>{
  const role=(await query("SELECT VaiTroID id FROM dbo.NGUOIDUNG WHERE NguoiDungID=@ID;",{ID:f.customer})).recordset[0].id;
  const permission=(await query('SELECT TOP(1) QuyenID id FROM dbo.VAITRO_QUYEN ORDER BY QuyenID;')).recordset[0].id;
  const promo=(await query('SELECT KhuyenMaiID id FROM dbo.KHUYENMAI WHERE MaCode=@Code;',{Code:f.code})).recordset[0].id;
  for(const [method,path,body,statuses]of [
   ['DELETE',`roles/${role}`,undefined,[409]],['DELETE',`permissions/${permission}`,undefined,[409]],
   ['PUT',`roles/${role}/permissions`,{permissionIds:[2147483647]},[400,404,409]],
   ['POST','assignments',{userId:f.manager,cinemaId:f.adminAssignedCinema,startsOn:f.today},[409]],
   ['POST','assignments',{userId:f.customer,cinemaId:f.adminCinema,startsOn:f.today},[400,409]],
   ['DELETE',`cinemas/${f.cinema}`,undefined,[409]],
   ['DELETE',`seats/${(await query('SELECT GheID id FROM dbo.CHITIETVE WHERE DonDatVeID=@ID;',{ID:f.order})).recordset[0].id}`,undefined,[409]],
   ['DELETE',`movies/${f.movie}`,undefined,[409]],['DELETE',`products/${f.product}`,undefined,[409]],['DELETE',`promotions/${promo}`,undefined,[409]],
   ['POST','products',{name:'Invalid decimal',type:'Snack',price:-1},[400]],['POST','products',{name:'Invalid enum',type:'Not a type',price:0},[400]],
   ['POST','pricing',{cinemaId:f.cinema,seatType:'Tất cả',dayType:'Lễ',format:'Tất cả',surcharge:1,startsOn:f.today},[400]],
   ['POST','pricing',{cinemaId:f.cinema,seatType:'Tất cả',dayType:'Tất cả',format:'Tất cả',surcharge:1,startsOn:f.today},[409]],
   ['POST','showtimes',{roomId:f.room,movieId:f.movie,startsAt:new Date(new Date(f.startsAt).getTime()+86400000).toISOString(),endsAt:new Date(new Date(f.endsAt).getTime()+86400000).toISOString(),format:'2D',basePrice:1},[409]],
   ['POST','genres',{name:''},[400]],['PUT',`movies/${f.adminMovie}/actors`,{cast:[{actorId:2147483647,role:'Missing'}]},[400,404,409]],
   ['POST','actors',{name:'Future birthday',birthDate:f.futureDate},[400]],
   ['POST','promotions',{code:'R82INVALIDPERCENT',discountType:'Phần trăm',discountValue:100,startsAt:f.startsAt,endsAt:f.endsAt,quantity:10},[400]],
  ])await h.failure(method,'/admin/'+path,body,statuses);
 }));
 await check('EDGE-ADMIN-HISTORICAL-ROOM-DEACTIVATION',['ADM-08'],'REAL_BROWSER_SQL',async()=>{
  await go('/admin');await waitText('Quản trị hệ thống');await click('Phòng');await waitText('R82 Admin Room Updated');await t.confirm(()=>h.rowButton('R82 Admin Room Updated','Xóa'));await waitText('Phòng có lịch sử suất chiếu đã chuyển sang Ngưng hoạt động.');
  await sqlCheck('SQL-ADMIN-HISTORICAL-ROOM-RETAINED',"SELECT r.TrangThai status,(SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE PhongID=r.PhongID) shows,(SELECT COUNT(*) FROM dbo.GHE WHERE PhongID=r.PhongID) seats FROM dbo.PHONGCHIEU r WHERE r.PhongID=@ID;",{ID:f.adminRoom},r=>{assert.equal(r[0].status,'Ngưng hoạt động');assert.equal(r[0].shows,1);assert.equal(r[0].seats,1);});
 });
 await login('QUAN_LY_RAP');
 await check('EDGE-MANAGER-WRITE-GRANTS-NO-WRITE',['QLR-02','QLR-03','QLR-04','QLR-05','QLR-06','QLR-07'],'REAL_BROWSER_SQL',()=>h.noWrite('manager-grants',async()=>{
  for(const [grant,method,path,body]of [
   ['QL_PHONG','POST',`cinemas/${f.cinema}/rooms`,{name:'Denied',type:'2D'}],['QL_GHE','POST',`rooms/${f.room}/seats`,{row:'D',number:2,type:'VIP'}],
   ['QL_SUAT_CHIEU','POST','showtimes',{roomId:f.room,movieId:f.movie,startsAt:f.startsAt,endsAt:f.endsAt,format:'2D',basePrice:1}],
   ['QL_SUAT_CHIEU','PUT',`showtimes/${f.managerShow}`,{movieId:f.movie,startsAt:f.startsAt,endsAt:f.endsAt,format:'2D',basePrice:1,status:'Mở bán'}],
   ['QL_SUAT_CHIEU','POST',`showtimes/${f.showB}/cancel`,{}],['QL_BANG_GIA','POST',`cinemas/${f.cinema}/pricing`,{seatType:'Tất cả',dayType:'Tất cả',format:'Tất cả',surcharge:1,startsOn:f.today}]
  ])await h.revoke(f.manager,grant,()=>h.deny(method,'/manager/'+path,body));
 }));
 await check('EDGE-MANAGER-REVOKED-ASSIGNMENT',['QLR-01','QLR-02','QLR-08','QLR-09'],'REAL_BROWSER_SQL',async()=>{
  await query("UPDATE dbo.PHANCONG_RAP SET TrangThai=N'Đã hủy' WHERE NguoiDungID=@Manager AND RapID=@Cinema;",{Manager:f.manager,Cinema:f.cinema});
  try{return await h.noWrite('manager-revoked-scope',async()=>{await h.deny('GET',`/manager/cinemas/${f.cinema}/rooms`);await h.deny('GET',`/manager/cinemas/${f.cinema}/dashboard`);await h.deny('GET',`/manager/cinemas/${f.cinema}/revenue`);await go('/manager');await waitText('Manager Portal');assert.equal(await evaluate(`Boolean(document.querySelector('select[aria-label="Rạp hiện tại"] option[value="${f.cinema}"]'))`),false);});}
  finally{await query("UPDATE dbo.PHANCONG_RAP SET TrangThai=N'Hiệu lực' WHERE NguoiDungID=@Manager AND RapID=@Cinema;",{Manager:f.manager,Cinema:f.cinema});}
 });
 await login('KHACH_HANG');
 await check('EDGE-BOOKING-CONFLICT-REFRESH',['KH-06','KH-07'],'REAL_BROWSER_SQL',async()=>{
  await go('/booking/'+f.showB);await until("document.querySelector('.seat-button[aria-label^=\"A3 —\"]')");await evaluate("document.querySelector('.seat-button[aria-label^=\"A3 —\"]').click()");await pause(80);
  const seat=(await query('SELECT GheID id FROM dbo.GHE WHERE PhongID=@ID AND SoGhe=3;',{ID:f.room})).recordset[0].id;
  await query("DECLARE @Order int,@Seats varchar(max)=CONVERT(varchar(20),@Seat); EXEC dbo.sp_DatVe @NguoiDungID=@Owner,@SuatChieuID=@Show,@DanhSachGheId=@Seats,@NewDonDatVeID=@Order OUTPUT;SELECT @Order id;",{Seat:seat,Owner:f.otherCustomer,Show:f.showB});
  t.save('concurrent-seat-fixture.json',{scope:'TEST_ONLY_FIXTURE',actor:f.otherCustomer,seat,show:f.showB,mechanism:'Actual canonical booking SP after browser selection, before browser submit'});
  const before=await t.fingerprint();await click('Đặt vé');await until("document.querySelector('[role=alert]')");await until("document.querySelector('.seat-button[aria-label^=\"A3 —\"]').disabled");assert.deepEqual(await t.fingerprint(),before);
  await sqlCheck('SQL-CONFLICT-ONE-HOLD','SELECT COUNT(*) n FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE v.GheID=@Seat AND d.SuatChieuID=@Show AND d.TrangThai=N\'Chờ thanh toán\';',{Seat:seat,Show:f.showB},r=>assert.equal(r[0].n,1));
 });
 await check('EDGE-FOOD-SEAT-LIMITS-NO-WRITE',['KH-06','KH-07','KH-08'],'REAL_BROWSER_SQL',()=>h.noWrite('booking-limits',async()=>{
  const seats=(await query('SELECT GheID id FROM dbo.GHE WHERE PhongID=@ID ORDER BY SoGhe;',{ID:f.room})).recordset.map(r=>r.id);
  await h.failure('POST','/bookings',{showtimeId:f.showB,seatIds:seats.slice(0,11)},[400]);
  await h.failure('POST','/bookings',{showtimeId:f.showB,seatIds:[seats[3]],products:[{productId:f.product,quantity:11}]},[400]);
  await fill('input[aria-label="Số lượng R82 Journey Snack"]',10);await waitText('Đã đạt tối đa 10 mỗi sản phẩm.');await fill('input[aria-label="Số lượng R82 Journey Snack"]',11);assert.equal(await evaluate("document.querySelector('input[aria-label=\"Số lượng R82 Journey Snack\"]').value"),'10');
 }));
 await check('EDGE-PROMOTION-INVALID-STATES',['KH-09'],'REAL_BROWSER_SQL',async()=>{
  await go('/booking/'+f.showB);await until("document.querySelector('.seat-button[aria-label^=\"A4 —\"]')");await evaluate("document.querySelector('.seat-button[aria-label^=\"A4 —\"]').click()");await pause(80);await labeled('Mã khuyến mãi',f.code);
  for(const [name,change]of [['exhausted','SoLuongDaDung=SoLuong'],['expired','NgayBatDau=DATEADD(DAY,-2,dbo.fn_BayGio()),NgayKetThuc=DATEADD(DAY,-1,dbo.fn_BayGio())'],['minimum','DonHangToiThieu=999999']]){
   await query('UPDATE dbo.KHUYENMAI SET '+change+' WHERE MaCode=@Code;',{Code:f.code});
   await h.noWrite('promo-'+name,async()=>{await click('Áp dụng');await until("document.querySelector('#promotion-heading').parentElement.querySelector('[role=status]')");assert.ok(!(await t.visible()).includes('Giảm tạm tính:'));});
   await query("UPDATE dbo.KHUYENMAI SET SoLuongDaDung=1,NgayBatDau=DATEADD(DAY,-1,dbo.fn_BayGio()),NgayKetThuc=DATEADD(DAY,7,dbo.fn_BayGio()),DonHangToiThieu=0 WHERE MaCode=@Code;",{Code:f.code});
  }
  await click('Áp dụng');await waitText('Giảm tạm tính:');await query("UPDATE dbo.KHUYENMAI SET TrangThai=N'Tạm dừng' WHERE MaCode=@Code;",{Code:f.code});
  await h.noWrite('promo-final-conflict',async()=>{await click('Đặt vé');await until("document.querySelector('[role=alert]')");assert.ok(!(await t.visible()).includes('Đặt vé thành công.'));});await query("UPDATE dbo.KHUYENMAI SET TrangThai=N'Hoạt động' WHERE MaCode=@Code;",{Code:f.code});
 });
 await check('EDGE-PAYMENT-FOREIGN-TERMINAL-NO-WRITE',['KH-10','KH-12'],'REAL_BROWSER_SQL',()=>h.noWrite('payment-terminal',async()=>{
  await h.failure('POST',`/orders/${f.order}/payments`,{paymentMethod:'MOMO'},[409]);await h.failure('POST',`/orders/${f.order}/payments`,{paymentMethod:'INVALID'},[400]);
  const foreign=(await query('SELECT DonDatVeID id FROM dbo.DONDATVE WHERE NguoiDungID=@ID;',{ID:f.otherCustomer})).recordset[0].id;await h.deny('GET',`/orders/${foreign}`,undefined,404);await h.deny('POST',`/orders/${foreign}/payments`,{paymentMethod:'MOMO'},404);
 }));
 await check('EDGE-PAID-CANCEL-COMPENSATION',['QLR-06','KH-10','KH-11','KH-12','QLR-09','ADM-16'],'REAL_BROWSER_SQL',async()=>{
  await login('QUAN_LY_RAP');await fill('select[aria-label="Rạp hiện tại"]',f.cinema);await waitText('R82 Journey Room');
  const date=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(new Date(f.startsAt).getTime()+86400000));
  const cancel=()=>evaluate(`(()=>{const row=[...document.querySelectorAll('section[aria-label="Suất chiếu"] li')].find(n=>n.innerText.includes('R82 Journey Room')&&n.innerText.includes(${JSON.stringify(date)}));if(!row)throw Error('Missing paid future show');[...row.querySelectorAll('button')].find(n=>n.textContent==='Hủy').click()})()`);
  await h.noWrite('cancel-live-hold',async()=>{await cancel();await until("document.querySelector('[role=alert]')");});
  await query("UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(SECOND,-1,dbo.fn_BayGio()) WHERE NguoiDungID=@Owner AND SuatChieuID=@Show AND TrangThai=N'Chờ thanh toán';EXEC dbo.sp_Order_ExpirePending @SuatChieuID=@Show,@TraVeKetQua=0;",{Owner:f.otherCustomer,Show:f.showB});
  t.save('held-cancel-fixture.json',{scope:'TEST_ONLY_FIXTURE',show:f.showB,owner:f.otherCustomer,operation:'After actual UI live-hold409, expire only owned foreign hold using SQL clock and canonical expiry SP'});
  await cancel();await waitText('Đã hủy suất chiếu.');
  await sqlCheck('SQL-PAID-CANCEL-ONCE',"SELECT d.TrangThai status,(SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID=d.DonDatVeID) credits,(SELECT SUM(SoTien) FROM dbo.THANHTOAN WHERE DonDatVeID=d.DonDatVeID AND TrangThai=N'Thành công') receipts FROM dbo.DONDATVE d WHERE DonDatVeID=@ID;",{ID:f.pendingOrder},r=>{assert.equal(r[0].status,'Đã hủy');assert.equal(r[0].credits,1);assert.equal(r[0].receipts,1000.25);});
  await h.api('POST',`/manager/showtimes/${f.showB}/cancel`,{});await sqlCheck('SQL-CANCEL-REPLAY-ONE','SELECT COUNT(*) n FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID=@ID;',{ID:f.pendingOrder},r=>assert.equal(r[0].n,1));
  await login('KHACH_HANG');await go('/orders/'+f.pendingOrder);await waitText('Điểm bồi thường đã cộng:');await waitText('Đã hủy');await go('/orders/'+f.pendingOrder+'/payment');await waitText('Điểm bồi thường đã cộng:');
  await login('ADMIN');await click('Doanh thu');await waitText('Tổng hợp doanh thu');assert.ok((await t.visible()).includes('2175.75'));await sqlCheck('SQL-RECEIPTS-AFTER-CANCELLATION',"SELECT SUM(SoTien) receipts FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công';",{},r=>assert.equal(r[0].receipts,2175.75));
 });
 await check('EDGE-HOLD-EXPIRY-AND-MULTI-FOOD',['KH-06','KH-07','KH-08','KH-09','KH-10','KH-11','KH-12'],'REAL_BROWSER_SQL',async()=>{
  await login('KHACH_HANG');
  const rows=(await query("DECLARE @Start datetime2=DATEADD(DAY,4,dbo.fn_BayGio());INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(@Movie,@Room,@Start,DATEADD(MINUTE,90,@Start),N'2D',123.25,N'Mở bán');SELECT CONVERT(int,SCOPE_IDENTITY()) id;INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,TrangThai) VALUES(N'R82 Extra Snack',N'Snack',10.25,N'Đang bán');",{Movie:f.movie,Room:f.room})).recordset;f.extraShow=rows[0].id;
  const book=async(seat,withFood=false)=>{await go('/booking/'+f.extraShow);await until("document.querySelectorAll('.seat-button').length===12");await evaluate(`document.querySelector('.seat-button[aria-label^="${seat} —"]').click()`);await pause(80);if(withFood){await fill('input[aria-label="Số lượng R82 Journey Snack"]',10);await fill('input[aria-label="Số lượng R82 Extra Snack"]',10);}else await labeled('Mã khuyến mãi',f.code);await click('Đặt vé');await waitText('Đặt vé thành công.');return (await query('SELECT TOP(1) DonDatVeID id FROM dbo.DONDATVE WHERE SuatChieuID=@Show AND NguoiDungID=@Owner ORDER BY DonDatVeID DESC;',{Show:f.extraShow,Owner:f.customer})).recordset[0].id;};
  f.expiredOrder=await book('A1');await query('UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(SECOND,-1,dbo.fn_BayGio()) WHERE DonDatVeID=@ID;',{ID:f.expiredOrder});
  t.save('hold-expiry-fixture.json',{scope:'TEST_ONLY_FIXTURE',order:f.expiredOrder,operation:'Actual UI-created promotion hold; advance only owned deadline relative to SQL clock; read endpoints must remain read-only'});
  await h.noWrite('expired-reads',async()=>{await go('/orders/'+f.expiredOrder);await waitText('ĐƠN #'+f.expiredOrder);await until(`!document.querySelector('a[href="/orders/${f.expiredOrder}/payment"]')&&document.body.innerText.includes('Hết hạn')`);
   await go('/orders/'+f.expiredOrder+'/payment');await waitText('Đơn đã hết thời gian giữ ghế.');assert.equal(await evaluate("[...document.querySelectorAll('button')].some(n=>n.textContent==='Xác nhận thanh toán'&&!n.disabled)"),false);});
  // The SQL view projects an elapsed hold as Hết hạn without writes. The following payment command performs canonical expiry and returns409.
  await h.failure('POST',`/orders/${f.expiredOrder}/payments`,{paymentMethod:'MOMO'},[409]);
  await sqlCheck('SQL-EXPIRED-HOLD-RELEASE',"SELECT d.TrangThai status,(SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID AND TrangThai=N'Đã hủy') released,(SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode=@Code) used FROM dbo.DONDATVE d WHERE DonDatVeID=@ID;",{ID:f.expiredOrder,Code:f.code},r=>{assert.equal(r[0].status,'Hết hạn');assert.equal(r[0].released,1);assert.equal(r[0].used,1);});
  f.foodOrder=await book('A2',true);await sqlCheck('SQL-MULTI-FOOD-20','SELECT COUNT(*) lines,SUM(SoLuong) quantity,MIN(SoLuong) minimumQuantity,MAX(SoLuong) maximumQuantity FROM dbo.CHITIETDOAN WHERE DonDatVeID=@ID;',{ID:f.foodOrder},r=>{assert.equal(r[0].lines,2);assert.equal(r[0].quantity,20);assert.equal(r[0].minimumQuantity,10);assert.equal(r[0].maximumQuantity,10);});
  await book('A3',true);await book('A4',true);
  await go('/booking/'+f.extraShow);await until("document.querySelectorAll('.seat-button').length===12");await evaluate("document.querySelector('.seat-button[aria-label^=\"A5 —\"]').click()");await pause(80);await h.noWrite('max-three-live-holds',async()=>{await click('Đặt vé');await until("document.querySelector('[role=alert]')");});
  await sqlCheck('SQL-EXACTLY-THREE-HOLDS',"SELECT COUNT(*) n FROM dbo.DONDATVE WHERE NguoiDungID=@Owner AND TrangThai=N'Chờ thanh toán' AND HanGiuCho>dbo.fn_BayGio();",{Owner:f.customer},r=>assert.equal(r[0].n,3));
 });
 await transportTail(t,h,f);
}
export async function transportTail(t,h,f){
 const {assert,check,go,fill,labeled,click,until,evaluate,pause,fault,sqlCheck}=t;const login=t.resume;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 await check('EDGE-ERROR-RETRY-PAGES',['KH-04','KH-11','KH-12','KH-14','CSKH-02','CSKH-03','CSKH-04','ADM-03','ADM-16','QLR-09'],'CONTROLLED_TRANSPORT',async()=>{
  for(const [role,route,match,loaded]of [['KHACH_HANG','/movies','/api/movies','Danh sách phim'],['KHACH_HANG','/orders','/api/orders','Đơn đặt vé của tôi'],['KHACH_HANG','/orders/'+f.order,'/api/orders/'+f.order,'R82 Journey Snack'],['KHACH_HANG','/complaints/'+f.complaint,'/api/complaints/'+f.complaint,'R82 Journey Complaint']]){
   await login(role);const rule=fault(match,{status:503,times:20});await go(route);await until("document.querySelector('[role=alert]')");await pause(100);rule.remaining=0;await click('Thử lại');await until("!document.querySelector('[role=alert]')");await waitText(loaded);
  }
  await login('CSKH');const queueFault=fault('/api/support/complaints',{status:500,times:20});await go('/support');await until("document.querySelector('[role=alert]')");await pause(100);queueFault.remaining=0;await click('Thử lại');await waitText('R82 Journey Complaint');
  const referenceFault=fault(`/support/complaints/${f.complaint}/order-reference`,{fail:'InternetDisconnected',times:20});await evaluate("[...document.querySelectorAll('.catalog-list button')].find(n=>n.innerText.includes('R82 Journey Complaint')).click()");await until("document.querySelector('[role=alert]')");await pause(100);referenceFault.remaining=0;await click('Thử lại');await waitText('R82 Journey Snack');
  await login('ADMIN');fault('/api/admin/roles',{status:503});await click('Vai trò');await until("document.querySelector('[role=alert]')");await click('Thử lại');await until("!document.querySelector('[role=alert]')&&document.querySelector('table')");
  fault('/admin/reports/revenue',{status:500});await click('Doanh thu');await until("document.querySelector('[role=alert]')");await click('Thử lại');await waitText('Tổng hợp doanh thu');
  await login('QUAN_LY_RAP');const revenueFault=fault(`/manager/cinemas/${f.cinema}/revenue`,{status:503,times:20});await fill('select[aria-label="Rạp hiện tại"]',f.cinema);await until("document.querySelector('section[aria-label=\"Doanh thu\"] [role=alert]')");await pause(100);revenueFault.remaining=0;await click('Thử lại');await waitText('2175.75');
 });
 await check('EDGE-PRIORITY-ALL-AND',['CSKH-02'],'REAL_BROWSER_SQL',async()=>{
  await login('CSKH');await until("document.querySelector('.catalog-list button')");await labeled('Lọc loại khiếu nại','R82 Smoke');await labeled('Lọc trạng thái','Mới');await labeled('Tìm khiếu nại','R82 Smoke');
  for(const priority of ['Thấp','Trung bình','Cao','Khẩn cấp']){await labeled('Lọc mức ưu tiên',priority);await click('Lọc hàng chờ');await until(`document.querySelectorAll('.catalog-list button').length===1&&document.querySelector('.catalog-list').innerText.includes(${JSON.stringify('ưu tiên '+priority)})`);}
  const start=t.network.length;await labeled('Lọc mức ưu tiên','');await click('Lọc hàng chờ');await until("document.querySelectorAll('.catalog-list button').length===4");assert.ok(t.network.slice(start).filter(n=>new URL(n.url).pathname==='/api/support/complaints').every(n=>!new URL(n.url).searchParams.has('priority')));
 });
 await check('EDGE-REGISTER-INVALID-AND-429',['KH-01'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/register');await until("document.querySelector('input[type=email]')");for(const [label,value]of [['Họ tên *','R82 Retained'],['Email *','r82.invalid@example.invalid'],['Mật khẩu *','é'.repeat(37)]])await labeled(label,value);
  await h.noWrite('register-byte-limit',async()=>{await h.submit('.auth-card form');await until("document.querySelector('[role=alert]')");});
  await labeled('Mật khẩu *',t.actors[0].password);fault('/auth/register',{status:429});await h.submit('.auth-card form');await until("document.querySelector('[role=alert]')");assert.equal(await evaluate("document.querySelector('input[type=email]').value"),'r82.invalid@example.invalid');
  // Response-stage injection occurs after real registration; retained-input retry must truthfully report the duplicate, not invent a second create.
  await h.submit('.auth-card form');await waitText('Email đã được sử dụng.');await sqlCheck('SQL-REGISTER-429-REAL-BACKEND-COMMIT',"SELECT COUNT(*) n FROM dbo.NGUOIDUNG WHERE Email='r82.invalid@example.invalid';",{},r=>assert.equal(r[0].n,1));
 });
 await check('EDGE-RESPONSIVE-A11Y',['ADM-02','ADM-11','ADM-12','ADM-13','ADM-14','ADM-15','ADM-16','CSKH-02','KH-07','KH-10','KH-14'],'REAL_BROWSER_SQL',async()=>{
  const evidence=[];
  for(const width of [1440,390]){
   await t.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
   for(const [role,route,module,marker]of [['ADMIN','/admin','Tài khoản','Mã vai trò'],['ADMIN','/admin','Doanh thu','Tổng hợp doanh thu'],['CSKH','/support',null,'Lọc hàng chờ'],['KHACH_HANG','/complaints',null,'Gửi khiếu nại']]){
    await login(role);await go(route);if(module){await waitText('Quản trị hệ thống');await click(module);}await waitText(marker);await pause(120);
    const audit=await evaluate("(()=>{const nodes=[...document.querySelectorAll('input,select,textarea')].filter(n=>n.type!=='hidden');return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,controls:nodes.map(n=>({type:n.type,label:n.getAttribute('aria-label')||n.labels?.[0]?.innerText.trim()||'',disabled:n.disabled})),focusable:document.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)').length}})()");assert.ok(audit.controls.every(n=>n.label));assert.ok(audit.pageWidth<=width+1,'Page overflow '+JSON.stringify({width,role,module,pageWidth:audit.pageWidth}));
    await t.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await t.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.ok(await evaluate("document.activeElement!==document.body"));
    const screenshot=await t.capture(`edge-${role}-${module??'portal'}-${width}`);evidence.push({role,route,module,width,audit,screenshot});
   }
  }
  await t.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});t.save('responsive-a11y.json',{status:'PASS',scope:'Changed-area native labels, keyboard Tab reachability, page overflow at390/1440; screenshots; font fallback recorded separately',checks:evidence});
 });
}

import {createJourney} from './journey-fixture.mjs';
import {helpers} from './journey-helpers.mjs';
import {customer} from './customer.mjs';
import {support} from './support.mjs';
import {admin} from './admin.mjs';
import {manager} from './manager.mjs';

export async function run(t,phase){
 const f=await createJourney(t),h=helpers(t);await customer(t,h,f);
 const {assert,check,go,navigate,labeled,fill,click,until,evaluate,pause,fault,query,sqlCheck}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 const module=async name=>{await click(name);await until("!document.body.innerText.includes('Đang tải dữ liệu…')&&document.querySelector('table')");};
 await check('FINAL-REVIEW-IMMEDIATE-DOUBLE',['KH-13'],'CONTROLLED_TRANSPORT',async()=>{
  await query('DELETE dbo.DANHGIAPHIM WHERE PhimID=@Movie AND NguoiDungID=@Owner;',{Movie:f.movie,Owner:f.customer});
  t.save('review-double-fixture.json',{scope:'TEST_ONLY_FIXTURE',operation:'Remove owned review so genuinely paid past-show customer may create again',movie:f.movie,owner:f.customer});
  await go('/movies/'+f.movie);await until("document.querySelector('#movie-reviews')&&document.querySelector('textarea')");await labeled('Điểm',1);
  const start=t.network.length;fault(`/movies/${f.movie}/reviews`,{method:'POST',delay:600,times:2});
  await evaluate("(()=>{const f=document.querySelector('section[aria-labelledby=movie-reviews] form');f.requestSubmit();f.requestSubmit()})()");
  await pause(1100);assert.equal(t.network.slice(start).filter(n=>n.method==='POST'&&n.url.includes(`/movies/${f.movie}/reviews`)).length,1,'Immediate review submit sends duplicate non-idempotent requests');await waitText('Đã gửi đánh giá.');
  await sqlCheck('SQL-REVIEW-RATING1-NULL-ONE','SELECT SoSao rating,NoiDung content FROM dbo.DANHGIAPHIM WHERE PhimID=@Movie AND NguoiDungID=@Owner;',{Movie:f.movie,Owner:f.customer},r=>{assert.equal(r.length,1);assert.equal(r[0].rating,1);assert.equal(r[0].content,null);});
 });
 if(!phase.startsWith('reproduce')){await support(t,h,f);await admin(t,h,f);await manager(t,h,f);await t.resume('ADMIN');}
 else await t.login('ADMIN');
 await check('FINAL-ADMIN-LATE-DELETE-MODULE',['ADM-03','ADM-09'],'CONTROLLED_TRANSPORT',async()=>{
  await module('Vai trò');await labeled('Tên vai trò','R82 Late Delete Role');await labeled('Mã vai trò','R82_LATE_DELETE');await click('Lưu');await waitText('R82_LATE_DELETE');
  const role=(await query("SELECT VaiTroID id FROM dbo.VAITRO WHERE MaVaiTro='R82_LATE_DELETE';")).recordset[0].id;
  fault(`/admin/roles/${role}`,{method:'DELETE',delay:700});await t.confirm(()=>h.rowButton('R82_LATE_DELETE','Xóa'));await click('Phim');await waitText('R82 Journey Movie');await pause(1000);
  assert.ok(await evaluate("[...document.querySelectorAll('tbody tr')].some(n=>n.innerText.includes('R82 Journey Movie'))"),'Late delete refresh removes current movie rows');assert.ok(!(await t.visible()).includes('R82_LATE_DELETE'));
  await sqlCheck('SQL-LATE-DELETE-TARGET','SELECT (SELECT COUNT(*) FROM dbo.VAITRO WHERE VaiTroID=@Role) deletedRole,(SELECT COUNT(*) FROM dbo.PHIM WHERE PhimID=@Movie) retainedMovie;',{Role:role,Movie:f.movie},r=>{assert.equal(r[0].deletedRole,0);assert.equal(r[0].retainedMovie,1);});
 });
 await check('FINAL-ADMIN-STATUS-PENDING',['ADM-02'],'CONTROLLED_TRANSPORT',async()=>{
  await module('Tài khoản');const user=(await query("SELECT NguoiDungID id FROM dbo.NGUOIDUNG WHERE Email='r82.journey@example.invalid';")).recordset[0].id;
  fault(`/admin/users/${user}/status`,{method:'PUT',delay:700});const start=t.network.length;await t.confirm(()=>h.rowButton('r82.journey@example.invalid','Khóa'));
  const disabled=await evaluate("[...document.querySelectorAll('tbody tr')].find(n=>n.innerText.includes('r82.journey@example.invalid')).querySelector('td:last-child button:last-child').disabled");
  if(!disabled)await t.confirm(()=>h.rowButton('r82.journey@example.invalid','Khóa'));await pause(1000);
  assert.equal(t.network.slice(start).filter(n=>n.method==='PUT'&&n.url.includes(`/users/${user}/status`)).length,1,'Pending account status change allows duplicate requests');
  await sqlCheck('SQL-STATUS-CONFIRMED-TARGET','SELECT TrangThai status FROM dbo.NGUOIDUNG WHERE NguoiDungID=@ID;',{ID:user},r=>assert.equal(r[0].status,'Bị khóa'));
 });
 if(phase.startsWith('reproduce'))return;
 await check('FINAL-CATALOG-FILTER-RACES-404',['KH-04','KH-05'],'CONTROLLED_TRANSPORT',async()=>{
  await t.resume('KHACH_HANG');await go('/movies');await until("document.querySelector('input[type=search]')");fault('/api/movies?search=',{delay:700});await labeled('Tìm phim hoặc đạo diễn','R82 Journey');await pause(250);await labeled('Tìm phim hoặc đạo diễn','R82 absent');await waitText('Không tìm thấy phim phù hợp.');await pause(900);assert.ok(!(await t.visible()).includes('R82 Journey Movie'));
  await go('/movies/2147483647');await until("document.querySelector('[role=alert]')");assert.ok(!(await t.visible()).includes('R82 Journey Movie'));
  await go('/movies/'+f.movie);await until("document.querySelector('input[type=date]')");await labeled('Rạp chiếu',f.cinema);fault(`/movies/${f.movie}/showtimes`,{delay:700});await labeled('Ngày chiếu',h.local(f.startsAt).slice(0,10));await pause(100);await labeled('Ngày chiếu',f.today);await waitText('Không có suất chiếu phù hợp');await pause(900);assert.ok(!await evaluate(`document.querySelector('a[href="/booking/${f.showB}"]')`));
 });
 await t.resume('ADMIN');
 await check('FINAL-ADMIN-OPTIONAL-MOVIE-ACTOR-GENRE-CRUD',['ADM-09','ADM-10'],'REAL_BROWSER_SQL',async()=>{
  await module('Thể loại');await labeled('Tên thể loại','R82 Final Genre');await click('Lưu');await waitText('R82 Final Genre');
  const genre=(await query("SELECT TheLoaiID id FROM dbo.THELOAI WHERE TenTheLoai=N'R82 Final Genre';")).recordset[0].id;
  await h.rowButton('R82 Final Genre','Sửa');await labeled('Tên thể loại','R82 Final Genre Updated');await click('Lưu');await waitText('R82 Final Genre Updated');
  await module('Diễn viên');await labeled('Họ tên','R82 Final Actor');await click('Lưu');await waitText('R82 Final Actor');const actor=(await query("SELECT DienVienID id FROM dbo.DIENVIEN WHERE HoTen=N'R82 Final Actor';")).recordset[0].id;
  await h.rowButton('R82 Final Actor','Sửa');await labeled('Họ tên','R82 Final Actor Updated');await labeled('Ngày sinh','1990-01-02');await click('Lưu');await waitText('R82 Final Actor Updated');
  await module('Phim');for(const[label,value]of[['Tên phim','R82 Final Movie'],['Thời lượng (phút)',60],['Ngày khởi chiếu',f.today],['Mã thể loại (phân cách dấu phẩy)',genre]])await labeled(label,value);await click('Lưu');await waitText('R82 Final Movie');const movie=(await query("SELECT PhimID id FROM dbo.PHIM WHERE TenPhim=N'R82 Final Movie';")).recordset[0].id;
  await h.rowButton('R82 Final Movie','Sửa');assert.equal(await evaluate("document.querySelector('input[aria-label=\"Mã thể loại (phân cách dấu phẩy)\"]').value"),String(genre));await fill('textarea[aria-label="Danh sách diễn viên phim"]',JSON.stringify([{actorId:actor,role:'Final lead'}]));await click('Lưu diễn viên');await waitText('Đã cập nhật danh sách diễn viên.');await h.rowButton('R82 Final Movie','Sửa');await labeled('Tên phim','R82 Final Movie Updated');await labeled('Mã thể loại (phân cách dấu phẩy)','');await click('Lưu');await waitText('R82 Final Movie Updated');
  await sqlCheck('SQL-FINAL-MOVIE-ACTOR-GENRE',"SELECT (SELECT TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID=@Genre) genre,(SELECT HoTen FROM dbo.DIENVIEN WHERE DienVienID=@Actor) actor,(SELECT QuocTich FROM dbo.DIENVIEN WHERE DienVienID=@Actor) nationality,(SELECT TenPhim FROM dbo.PHIM WHERE PhimID=@Movie) movie,(SELECT COUNT(*) FROM dbo.PHIM_THELOAI WHERE PhimID=@Movie) genreCount,(SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN WHERE PhimID=@Movie) castCount;",{Genre:genre,Actor:actor,Movie:movie},r=>{assert.equal(r[0].genre,'R82 Final Genre Updated');assert.equal(r[0].actor,'R82 Final Actor Updated');assert.equal(r[0].nationality,null);assert.equal(r[0].movie,'R82 Final Movie Updated');assert.equal(r[0].genreCount,0);assert.equal(r[0].castCount,1);});
  await h.noWrite('actor-in-cast-delete',async()=>{await module('Diễn viên');await t.confirm(()=>h.rowButton('R82 Final Actor Updated','Xóa'));await until("document.querySelector('[role=alert]')");});
  await module('Phim');await h.rowButton('R82 Final Movie Updated','Sửa');await fill('textarea[aria-label="Danh sách diễn viên phim"]','[]');await click('Lưu diễn viên');await waitText('Đã cập nhật danh sách diễn viên.');await t.confirm(()=>h.rowButton('R82 Final Movie Updated','Xóa'));await until("!document.body.innerText.includes('R82 Final Movie Updated')");
  await module('Diễn viên');await t.confirm(()=>h.rowButton('R82 Final Actor Updated','Xóa'));await until("!document.body.innerText.includes('R82 Final Actor Updated')");await module('Thể loại');await t.confirm(()=>h.rowButton('R82 Final Genre Updated','Xóa'));await until("!document.body.innerText.includes('R82 Final Genre Updated')");
  await sqlCheck('SQL-FINAL-CATALOG-DELETED','SELECT (SELECT COUNT(*) FROM dbo.PHIM WHERE PhimID=@Movie) movies,(SELECT COUNT(*) FROM dbo.DIENVIEN WHERE DienVienID=@Actor) actors,(SELECT COUNT(*) FROM dbo.THELOAI WHERE TheLoaiID=@Genre) genres;',{Movie:movie,Actor:actor,Genre:genre},r=>assert.deepEqual(r,[{movies:0,actors:0,genres:0}]));
 });
 await check('FINAL-ADMIN-PRICING-ASSIGNMENT-EDIT',['ADM-06','ADM-13'],'REAL_BROWSER_SQL',async()=>{
  await module('Bảng giá');await h.rowButton(String(f.adminPricing),'Sửa');for(const[label,value]of[['Phụ thu',15.75],['Loại ghế','VIP'],['Loại ngày','Cuối tuần'],['Định dạng','3D'],['Ngày kết thúc',f.futureDate],['Trạng thái','Tạm dừng']])await labeled(label,value);await click('Lưu');await waitText('Đã lưu thay đổi.');await sqlCheck('SQL-PRICING-FULL-EDIT',"SELECT PhuThu surcharge,LoaiGhe seatType,LoaiNgay dayType,DinhDang format,TrangThai status FROM dbo.BANGGIA WHERE GiaID=@ID;",{ID:f.adminPricing},r=>assert.deepEqual(r,[{surcharge:15.75,seatType:'VIP',dayType:'Cuối tuần',format:'3D',status:'Tạm dừng'}]));
  await module('Phân công');await h.rowButton(String(f.assignment),'Sửa');await labeled('Ngày kết thúc',f.today);await labeled('Trạng thái','Đã hủy');await click('Lưu');await waitText('Đã lưu thay đổi.');await sqlCheck('SQL-ASSIGNMENT-ENDED',"SELECT TrangThai status,CONVERT(varchar(10),NgayKetThuc,23) endsOn FROM dbo.PHANCONG_RAP WHERE PhanCongID=@ID;",{ID:f.assignment},r=>assert.deepEqual(r,[{status:'Đã hủy',endsOn:f.today}]));
 });
 await check('FINAL-MANAGER-EMPTY-SEAT-ROOM-DELETE',['QLR-02','QLR-03'],'REAL_BROWSER_SQL',async()=>{
  await t.resume('QUAN_LY_RAP');await fill('select[aria-label="Rạp hiện tại"]',f.cinema);await until("document.querySelector('form[aria-label=\"Tạo phòng\"]')");await h.formFill('form[aria-label="Tạo phòng"]','Tên phòng','R82 Empty Delete Room');await h.formFill('form[aria-label="Tạo phòng"]','Loại phòng','2D');await h.submit('form[aria-label="Tạo phòng"]');await waitText('R82 Empty Delete Room');const room=(await query("SELECT PhongID id FROM dbo.PHONGCHIEU WHERE TenPhong=N'R82 Empty Delete Room';")).recordset[0].id;
  await h.rowButton('R82 Empty Delete Room','Ghế');await waitText('Chưa có ghế trong phòng.');for(const[label,value]of[['Hàng ghế','Z'],['Số ghế',1],['Loại ghế','Thường']])await h.formFill('form[aria-label="Tạo ghế"]',label,value);await h.submit('form[aria-label="Tạo ghế"]');await waitText('Z1');await h.rowButton('Z1 · Thường','Sửa ghế');assert.ok(!await evaluate("document.querySelector('form[aria-label=\"Sửa ghế\"] input[aria-label=\"Hàng ghế\"]')"));await h.formFill('form[aria-label="Sửa ghế"]','Trạng thái','Bảo trì');await h.submit('form[aria-label="Sửa ghế"]');await waitText('Đã cập nhật.');await h.rowButton('Z1 · Thường','Xóa');await waitText('Chưa có ghế trong phòng.');await h.rowButton('R82 Empty Delete Room','Xóa');await until("!document.body.innerText.includes('R82 Empty Delete Room')");await sqlCheck('SQL-EMPTY-SEAT-ROOM-DELETE','SELECT (SELECT COUNT(*) FROM dbo.GHE WHERE PhongID=@ID) seats,(SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE PhongID=@ID) rooms;',{ID:room},r=>assert.deepEqual(r,[{seats:0,rooms:0}]));
 });
 await check('FINAL-RESPONSIVE-BOOKING-PAYMENT-MANAGER',['KH-05','KH-06','KH-07','KH-08','KH-09','KH-10','QLR-02','QLR-03'],'REAL_BROWSER_SQL',async()=>{
  const audits=[];
  for(const width of [1440,390]){await t.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});for(const[role,route,marker]of[['KHACH_HANG','/booking/'+f.showB,'Mã suất chiếu:'],['KHACH_HANG','/orders/'+f.pendingOrder+'/payment','Xác nhận thanh toán'],['QUAN_LY_RAP','/manager','Manager Portal']]){await t.resume(role);await go(route);await waitText(marker);await pause(200);const audit=await evaluate("({width:innerWidth,pageWidth:document.documentElement.scrollWidth,unlabeled:[...document.querySelectorAll('input,select,textarea')].filter(n=>!n.getAttribute('aria-label')&&!n.labels?.length).length})");assert.equal(audit.unlabeled,0);assert.ok(audit.pageWidth<=width+1);await t.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await t.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.ok(await evaluate('document.activeElement!==document.body'));audits.push({role,route,width,audit,screenshot:await t.capture(`final-${role}-${route.includes('payment')?'payment':route.includes('booking')?'booking':'manager'}-${width}`)});}}
  t.save('responsive-additional.json',{status:'PASS',scope:'Changed-area Booking, Payment and Manager native labels, keyboard navigation and overflow',audits});
 });
}

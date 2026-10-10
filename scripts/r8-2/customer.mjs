export async function customer(t,h,f){
 const {assert,check,go,navigate,login,labeled,fill,click,until,evaluate,sqlCheck,query}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 await check('P3-KH01-REGISTER',['KH-01'],'REAL_BROWSER_SQL',async()=>{
  await go('/register');await until("document.querySelector('input[type=email]')");
  for(const [label,value] of [['Họ tên *','R82 Journey Customer'],['Email *','r82.journey@example.invalid'],['Mật khẩu *',t.actors[0].password]])await labeled(label,value);
  await h.submit('.auth-card form');await until("location.pathname==='/login'");
  const rows=await sqlCheck('SQL-REGISTER',`SELECT u.NguoiDungID id,v.MaVaiTro role,COUNT(h.NguoiDungID) profiles FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID WHERE u.Email='r82.journey@example.invalid' GROUP BY u.NguoiDungID,v.MaVaiTro;`,{},r=>{assert.equal(r.length,1);assert.equal(r[0].role,'KHACH_HANG');assert.equal(r[0].profiles,1);});f.otherCustomer=rows[0].id;
  await go('/register');await until("document.querySelector('input[type=email]')");
  for(const [label,value] of [['Họ tên *','R82 Duplicate'],['Email *','r82.journey@example.invalid'],['Mật khẩu *',t.actors[0].password]])await labeled(label,value);
  await h.submit('.auth-card form');await waitText('Email đã được sử dụng.');
  await sqlCheck('SQL-REGISTER-DUPLICATE-NO-WRITE',"SELECT COUNT(*) n FROM dbo.NGUOIDUNG WHERE Email='r82.journey@example.invalid';",{},r=>assert.equal(r[0].n,1));
 });
 await check('P3-KH02-LOGIN',['KH-02'],'REAL_BROWSER_SQL',async()=>{
  await go('/login');await until("document.querySelector('input[type=email]')");await fill('input[type=email]',t.actors.find(a=>a.role==='KHACH_HANG').email);await fill('input[type=password]','incorrect-R82-password');await h.submit('.auth-card form');await until("document.querySelector('[role=alert]')");assert.equal(await evaluate('location.pathname'),'/login');
  await login('KHACH_HANG');await h.deny('GET','/admin/users');await h.deny('GET','/manager/cinemas');await h.deny('GET','/support/complaints');
  await go('/admin');await waitText('Không có quyền truy cập');await go('/account');await waitText('Tài khoản khách hàng');
 });
 await check('P3-KH03-PROFILE',['KH-03'],'REAL_BROWSER_SQL',async()=>{
  await go('/profile');await until("document.querySelector('input[type=email]')");await labeled('Họ tên','R82 Customer Profile');await labeled('Ngày sinh','1994-05-06');await labeled('Giới tính','Khác');await click('Lưu hồ sơ');await waitText('Đã cập nhật hồ sơ cá nhân thành công.');
  await sqlCheck('SQL-PROFILE',`SELECT u.HoTen name,h.GioiTinh gender,CONVERT(varchar(10),h.NgaySinh,23) birthday FROM dbo.NGUOIDUNG u JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID WHERE u.NguoiDungID=@ID;`,{ID:f.customer},r=>{assert.equal(r[0].name,'R82 Customer Profile');assert.equal(r[0].gender,'Khác');assert.equal(r[0].birthday,'1994-05-06');});
  await go('/profile');await until("document.querySelector('input[type=email]')");assert.equal(await evaluate("[...document.querySelectorAll('label')].find(n=>n.innerText.startsWith('Họ tên')).querySelector('input').value"),'R82 Customer Profile');
 });
 await check('P3-KH04-CATALOG',['KH-04'],'REAL_BROWSER_SQL',async()=>{
  await go('/movies');await until("document.querySelector('input[type=search]')");await labeled('Tìm phim hoặc đạo diễn','R82 Journey');await waitText('R82 Journey Movie');
  await labeled('Tìm phim hoặc đạo diễn','R82 absent movie');await waitText('Không tìm thấy phim phù hợp.');await labeled('Tìm phim hoặc đạo diễn','R82 Journey');await waitText('R82 Journey Movie');
  await go('/movies/'+f.movie);await waitText('R82 Journey Movie');await sqlCheck('SQL-CATALOG',"SELECT COUNT(*) n FROM dbo.PHIM WHERE PhimID=@ID AND TenPhim=N'R82 Journey Movie';",{ID:f.movie},r=>assert.equal(r[0].n,1));
 });
 await check('P3-KH05-SCHEDULE',['KH-05'],'REAL_BROWSER_SQL',async()=>{
  await until("document.querySelector('input[type=date]')");await labeled('Rạp chiếu',f.cinema);await labeled('Ngày chiếu',h.local(f.startsAt).slice(0,10));await until(`document.querySelector('a[href="/booking/${f.show}"]')`);
  await labeled('Ngày chiếu',f.today);await waitText('Không có suất chiếu phù hợp');await labeled('Ngày chiếu',h.local(f.startsAt).slice(0,10));await until(`document.querySelector('a[href="/booking/${f.show}"]')`);await click('Chọn suất này');await until("document.querySelectorAll('.seat-button').length===12");
  await sqlCheck('SQL-SCHEDULE',"SELECT SuatChieuID id,PhimID movie,PhongID room FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID;",{ID:f.show},r=>{assert.equal(r[0].movie,f.movie);assert.equal(r[0].room,f.room);});
 });
 await check('P3-KH06-SEATS',['KH-06'],'REAL_BROWSER_SQL',async()=>{
  assert.equal(await evaluate("document.querySelectorAll('.seat-button:disabled').length"),2);
  await click('Đặt vé');await waitText('Hãy chọn ít nhất một ghế.');
  await evaluate("document.querySelector('.seat-button[aria-label^=\"A1 —\"]').click()");await t.pause(80);assert.ok((await t.visible()).includes('Ghế đã chọn: A1'));
  await sqlCheck('SQL-SEAT-SELECTION-READ-ONLY',"SELECT (SELECT COUNT(*) FROM dbo.DONDATVE WHERE SuatChieuID=@ID) orders,(SELECT COUNT(*) FROM dbo.GHE WHERE PhongID=@Room AND TrangThai<>N'Hoạt động') unavailable;",{ID:f.show,Room:f.room},r=>{assert.equal(r[0].orders,0);assert.equal(r[0].unavailable,2);});
 });
 await check('P3-KH08-FOOD',['KH-08'],'REAL_BROWSER_SQL',async()=>{
  await fill('input[aria-label="Số lượng R82 Journey Snack"]',0);assert.ok(!(await t.visible()).includes('0 × R82 Journey Snack'));
  await fill('input[aria-label="Số lượng R82 Journey Snack"]',2);assert.ok((await t.visible()).includes('2 × R82 Journey Snack'));
  await sqlCheck('SQL-FOOD-PREBOOK-NO-WRITE',"SELECT COUNT(*) n FROM dbo.CHITIETDOAN;",{},r=>assert.equal(r[0].n,0));
 });
 await check('P3-KH09-PROMOTION',['KH-09'],'REAL_BROWSER_SQL',async()=>{
  await labeled('Mã khuyến mãi','R82INVALID');await click('Áp dụng');await until("document.querySelector('#promotion-heading').parentElement.querySelector('[role=status]')");assert.ok(!(await t.visible()).includes('Giảm tạm tính:'));
  await labeled('Mã khuyến mãi',f.code);await click('Áp dụng');await waitText('Giảm tạm tính:');
  await sqlCheck('SQL-PROMOTION-PREVIEW-READ-ONLY',"SELECT SoLuongDaDung used,GiaTriGiam discount FROM dbo.KHUYENMAI WHERE MaCode=@Code;",{Code:f.code},r=>{assert.equal(r[0].used,0);assert.equal(r[0].discount,25.25);});
 });
 await check('P3-KH07-BOOKING',['KH-07','KH-08','KH-09'],'REAL_BROWSER_SQL',async()=>{
  await click('Đặt vé');await waitText('Đặt vé thành công.');
  const rows=await sqlCheck('SQL-BOOKING-SNAPSHOTS',`SELECT d.DonDatVeID id,d.NguoiDungID owner,d.TongTienVe tickets,d.TongTienDoAn foods,d.TienGiamGia discount,d.TrangThai status,CASE WHEN d.HanGiuCho>dbo.fn_BayGio() THEN 1 ELSE 0 END live,(SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID) ticketCount,(SELECT SoLuong FROM dbo.CHITIETDOAN WHERE DonDatVeID=d.DonDatVeID) quantity,(SELECT DonGia FROM dbo.CHITIETDOAN WHERE DonDatVeID=d.DonDatVeID) unitPrice FROM dbo.DONDATVE d WHERE SuatChieuID=@Show;`,{Show:f.show},r=>{assert.equal(r.length,1);assert.equal(r[0].owner,f.customer);assert.equal(r[0].ticketCount,1);assert.equal(r[0].tickets,1000.25);assert.equal(r[0].foods,200.5);assert.equal(r[0].discount,25.25);assert.equal(r[0].quantity,2);assert.equal(r[0].unitPrice,100.25);assert.equal(r[0].live,1);});f.order=rows[0].id;
  assert.ok(await evaluate(`Boolean(document.querySelector('a[href="/orders/${f.order}/payment"]'))`));
 });
 await check('P3-KH10-PAYMENT',['KH-10'],'REAL_BROWSER_SQL',async()=>{
  await click('Thanh toán đơn này');await waitText('Xác nhận thanh toán');await labeled('Phương thức','MOMO');await click('Xác nhận thanh toán');await waitText('Đã xác nhận thanh toán thành công.');
  await sqlCheck('SQL-PAYMENT',`SELECT d.TrangThai status,d.HanGiuCho deadline,p.PhuongThuc method,p.TrangThai paymentStatus,p.SoTien amount,(SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID=d.DonDatVeID) attempts,(SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=d.NguoiDungID) points FROM dbo.DONDATVE d JOIN dbo.THANHTOAN p ON p.DonDatVeID=d.DonDatVeID WHERE d.DonDatVeID=@ID;`,{ID:f.order},r=>{assert.equal(r.length,1);assert.equal(r[0].status,'Đã thanh toán');assert.equal(r[0].paymentStatus,'Thành công');assert.equal(r[0].amount,1175.5);assert.equal(r[0].method,'MOMO');assert.equal(r[0].attempts,1);assert.equal(r[0].deadline,null);});
  await go('/orders/'+f.order+'/payment');await waitText('Đã thanh toán');assert.equal(await evaluate("[...document.querySelectorAll('button')].filter(n=>n.textContent==='Xác nhận thanh toán').length"),0);
 });
 await check('P3-KH11-ORDERS',['KH-11'],'REAL_BROWSER_SQL',async()=>{
  await go('/booking/'+f.showB);await until("document.querySelectorAll('.seat-button').length===12");await evaluate("document.querySelector('.seat-button[aria-label^=\"A2 —\"]').click()");await t.pause(80);await click('Đặt vé');await waitText('Đặt vé thành công.');
  f.pendingOrder=(await sqlCheck('SQL-SECOND-OWNED-ORDER','SELECT DonDatVeID id FROM dbo.DONDATVE WHERE SuatChieuID=@ID;',{ID:f.showB},r=>assert.equal(r.length,1)))[0].id;
  await go('/orders');await waitText('Đơn #'+f.order);await labeled('Lọc trạng thái đơn','Đã thanh toán');await waitText('Đơn #'+f.order);assert.ok(!(await t.visible()).includes('Đơn #'+f.pendingOrder+' ·'));
  await sqlCheck('SQL-ORDER-OWNERSHIP',"SELECT COUNT(*) n FROM dbo.DONDATVE WHERE DonDatVeID=@ID AND NguoiDungID=@Owner;",{ID:f.order,Owner:f.customer},r=>assert.equal(r[0].n,1));
 });
 await check('P3-KH12-ORDER-DETAIL',['KH-12'],'REAL_BROWSER_SQL',async()=>{
  await go('/orders/'+f.order);await waitText('R82 Journey Snack');await waitText('MOMO');assert.ok((await t.visible()).includes('R82 Journey Movie'));
  assert.ok(await evaluate(`Boolean(document.querySelector('a[href="/complaints?orderId=${f.order}"]'))`));
  await go('/orders/2147483647');await until("document.querySelector('[role=alert]')");assert.ok(!(await t.visible()).includes('R82 Journey Snack'));await go('/orders/'+f.order);await waitText('R82 Journey Snack');
 });
 await check('P3-KH13-ELIGIBILITY',['KH-13'],'REAL_BROWSER_SQL',async()=>{
  await go('/movies/'+f.movie);await until("document.querySelector('#movie-reviews')&&document.querySelector('textarea')");await labeled('Nội dung (không bắt buộc)','R82 eligible review');await click('Gửi đánh giá');await waitText('Bạn chỉ có thể đánh giá sau khi đã xem phim.');
  await sqlCheck('SQL-REVIEW-INELIGIBLE-NO-WRITE','SELECT COUNT(*) n FROM dbo.DANHGIAPHIM WHERE PhimID=@Movie AND NguoiDungID=@Owner;',{Movie:f.movie,Owner:f.customer},r=>assert.equal(r[0].n,0));
  // Test-only clock fixture transition: the owned, genuinely paid show has now occurred.
  await query('UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(HOUR,-2,dbo.fn_BayGio()),ThoiGianKetThuc=DATEADD(HOUR,-1,dbo.fn_BayGio()) WHERE SuatChieuID=@ID;',{ID:f.show});
  t.save('review-eligibility-fixture.json',{scope:'TEST_ONLY_FIXTURE',show:f.show,order:f.order,operation:'Move owned paid show into SQL-clock past; protections remain enabled'});
  await click('Gửi đánh giá');await waitText('Đã gửi đánh giá.');await click('Gửi đánh giá');await waitText('Bạn đã đánh giá phim này.');
  await sqlCheck('SQL-REVIEW-ONE',"SELECT SoSao rating,NoiDung content FROM dbo.DANHGIAPHIM WHERE PhimID=@Movie AND NguoiDungID=@Owner;",{Movie:f.movie,Owner:f.customer},r=>{assert.equal(r.length,1);assert.equal(r[0].rating,5);assert.equal(r[0].content,'R82 eligible review');});
 });
 await check('P3-KH14-COMPLAINT',['KH-14'],'REAL_BROWSER_SQL',async()=>{
  await go('/complaints?orderId='+f.order);await until("document.querySelector('select')&&!document.querySelector('select').disabled");assert.equal(await evaluate("document.querySelector('select').value"),String(f.order));
  for(const [label,value] of [['Loại khiếu nại','R82 Journey'],['Tiêu đề','R82 Journey Complaint'],['Nội dung','R82 owned linked complaint']])await labeled(label,value);
  await click('Gửi khiếu nại');await waitText('Đã gửi khiếu nại.');
  const rows=await sqlCheck('SQL-COMPLAINT',"SELECT KhieuNaiID id,NguoiDungID owner,DonDatVeID orderId,TrangThai status FROM dbo.KHIEUNAI WHERE TieuDe=N'R82 Journey Complaint';",{},r=>{assert.equal(r.length,1);assert.equal(r[0].owner,f.customer);assert.equal(r[0].orderId,f.order);assert.equal(r[0].status,'Mới');});f.complaint=rows[0].id;
  await go('/complaints/'+f.complaint);await waitText('R82 owned linked complaint');await waitText('Chưa có lịch sử xử lý.');
 });
 await check('P3-CUSTOMER-FOREIGN-OWNERSHIP',['KH-11','KH-12','KH-14'],'REAL_BROWSER_SQL',async()=>{
  await go('/');await evaluate("sessionStorage.removeItem('cinema_access_token')");await go('/login');await until("document.querySelector('input[type=email]')");await fill('input[type=email]','r82.journey@example.invalid');await fill('input[type=password]',t.actors[0].password);await h.submit('.auth-card form');await until("location.pathname!=='/login'");
  await go('/orders/'+f.order);await until("document.querySelector('[role=alert]')");assert.ok(!(await t.visible()).includes('R82 Journey Snack'));
  await go('/complaints/'+f.complaint);await until("document.querySelector('[role=alert]')");assert.ok(!(await t.visible()).includes('R82 owned linked complaint'));
  await go('/complaints?orderId='+f.order);await until("document.querySelector('select')&&!document.querySelector('select').disabled");assert.equal(await evaluate("document.querySelector('select').value"),'');
  await sqlCheck('SQL-FOREIGN-READ-NO-WRITE',"SELECT COUNT(*) n FROM dbo.DONDATVE WHERE NguoiDungID=@Owner;",{Owner:f.otherCustomer},r=>assert.equal(r[0].n,0));
 });
 await login('KHACH_HANG');await t.capture('p3-customer-desktop');
}

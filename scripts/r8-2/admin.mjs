export async function admin(t,h,f){
 const {assert,check,login,click,labeled,until,sqlCheck,evaluate,query}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 const module=async name=>{await click(name);await until("!document.body.innerText.includes('Đang tải dữ liệu…')&&document.querySelector('table')");};
 const create=async(name,fields,text)=>{await module(name);for(const [label,value] of fields)await labeled(label,value);await click('Lưu');await waitText('Đã lưu thay đổi.');if(text)await waitText(text);};
 const edit=async(text,fields)=>{await h.rowButton(text,'Sửa');for(const [label,value]of fields)await labeled(label,value);await click('Lưu');await waitText('Đã lưu thay đổi.');};
 const remove=async(text)=>{await t.confirm(()=>h.rowButton(text,'Xóa'));await until(`![...document.querySelectorAll('tbody tr')].some(n=>n.innerText.includes(${JSON.stringify(text)}))`);};
 await check('P3-ADM01-LOGIN',['ADM-01'],'REAL_BROWSER_SQL',async()=>{await login('ADMIN');await waitText('Quản trị hệ thống');await waitText('Tổng quan');await h.deny('GET','/support/complaints');});
 await check('P3-ADM02-USERS',['ADM-02'],'REAL_BROWSER_SQL',async()=>{
  await module('Tài khoản');const choices=await evaluate("[...document.querySelectorAll('select[aria-label=\"Mã vai trò\"] option')].filter(n=>n.value).map(n=>({id:Number(n.value),name:n.textContent}))");assert.equal(choices.length,3);
  await labeled('Họ tên','R82 Journey Staff');await labeled('Email','r82.journey.staff@example.invalid');await labeled('Mã vai trò',choices.find(r=>r.name.includes('CSKH')||r.name.toLowerCase().includes('chăm sóc'))?.id??choices[0].id);await labeled('Mật khẩu ban đầu',t.actors[0].password);await click('Lưu');await waitText('r82.journey.staff@example.invalid');
  const r=await sqlCheck('SQL-ADMIN-CREATE-STAFF',"SELECT u.NguoiDungID id,v.MaVaiTro role,COUNT(h.NguoiDungID) profiles FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID WHERE u.Email='r82.journey.staff@example.invalid' GROUP BY u.NguoiDungID,v.MaVaiTro;",{},r=>{assert.equal(r.length,1);assert.ok(['ADMIN','CSKH','QUAN_LY_RAP'].includes(r[0].role));assert.equal(r[0].profiles,0);});f.staff=r[0].id;
  await t.confirm(()=>h.rowButton('r82.journey.staff@example.invalid','Khóa'));await waitText('Đã cập nhật tài khoản.');await sqlCheck('SQL-ADMIN-LOCK',"SELECT TrangThai status FROM dbo.NGUOIDUNG WHERE NguoiDungID=@ID;",{ID:f.staff},r=>assert.equal(r[0].status,'Bị khóa'));
  await t.confirm(()=>h.rowButton('r82.journey.staff@example.invalid','Mở khóa'));await until("[...document.querySelectorAll('tbody tr')].find(n=>n.innerText.includes('r82.journey.staff@example.invalid'))?.innerText.includes('Hoạt động')");await sqlCheck('SQL-ADMIN-UNLOCK',"SELECT TrangThai status FROM dbo.NGUOIDUNG WHERE NguoiDungID=@ID;",{ID:f.staff},r=>assert.equal(r[0].status,'Hoạt động'));
 });
 await check('P3-ADM03-ROLES',['ADM-03'],'REAL_BROWSER_SQL',async()=>{
  await create('Vai trò',[['Tên vai trò','R82 Journey Role'],['Mô tả','Owned browser role'],['Mã vai trò','R82_JOURNEY_ROLE']],'R82 Journey Role');
  const rows=await sqlCheck('SQL-ROLE-CREATE',"SELECT VaiTroID id FROM dbo.VAITRO WHERE MaVaiTro='R82_JOURNEY_ROLE';",{},r=>assert.equal(r.length,1));f.role=rows[0].id;
  await edit('R82_JOURNEY_ROLE',[['Tên vai trò','R82 Journey Role Updated']]);await sqlCheck('SQL-ROLE-UPDATE',"SELECT TenVaiTro name FROM dbo.VAITRO WHERE VaiTroID=@ID;",{ID:f.role},r=>assert.equal(r[0].name,'R82 Journey Role Updated'));
 });
 await check('P3-ADM04-PERMISSIONS',['ADM-04'],'REAL_BROWSER_SQL',async()=>{
  await create('Quyền',[['Tên quyền','R82 Journey Permission'],['Mô tả','Owned browser permission'],['Mã quyền','R82_JOURNEY_PERMISSION']],'R82_JOURNEY_PERMISSION');
  const rows=await sqlCheck('SQL-PERMISSION-CREATE',"SELECT QuyenID id FROM dbo.QUYEN WHERE MaQuyen='R82_JOURNEY_PERMISSION';",{},r=>assert.equal(r.length,1));f.permission=rows[0].id;
  await edit('R82_JOURNEY_PERMISSION',[['Tên quyền','R82 Journey Permission Updated']]);await sqlCheck('SQL-PERMISSION-UPDATE',"SELECT TenQuyen name FROM dbo.QUYEN WHERE QuyenID=@ID;",{ID:f.permission},r=>assert.equal(r[0].name,'R82 Journey Permission Updated'));
 });
 await check('P3-ADM05-GRANTS',['ADM-05'],'REAL_BROWSER_SQL',async()=>{
  await t.fill('input[aria-label="Mã vai trò nhận quyền"]',f.role);await click('Đọc quyền hiện tại');await labeled('QuyenID (phân cách dấu phẩy)',f.permission);await click('Lưu quyền vai trò');await waitText('Đã cập nhật quyền của vai trò.');
  await sqlCheck('SQL-GRANT-REPLACE','SELECT QuyenID id FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID;',{ID:f.role},r=>{assert.equal(r.length,1);assert.equal(r[0].id,f.permission);});
  await labeled('QuyenID (phân cách dấu phẩy)','');await click('Lưu quyền vai trò');await t.pause(200);await sqlCheck('SQL-GRANT-CLEAR','SELECT COUNT(*) n FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID;',{ID:f.role},r=>assert.equal(r[0].n,0));
  await remove('R82_JOURNEY_PERMISSION');await module('Vai trò');await remove('R82_JOURNEY_ROLE');
 });
 await check('P3-ADM06-ASSIGNMENTS',['ADM-06'],'REAL_BROWSER_SQL',async()=>{
  const spare=(await query('SELECT TOP(1) RapID id FROM dbo.RAPCHIEUPHIM WHERE RapID<>@Owned AND RapID NOT IN(SELECT RapID FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@Manager AND TrangThai=N\'Hiệu lực\') ORDER BY RapID;',{Owned:f.cinema,Manager:f.manager})).recordset[0];assert.ok(spare);f.adminAssignedCinema=spare.id;
  await create('Phân công',[['Mã quản lý',f.manager],['Mã rạp',spare.id],['Ngày bắt đầu',f.today],['Trạng thái','Hiệu lực']]);
  const rows=await sqlCheck('SQL-ASSIGNMENT','SELECT PhanCongID id,TrangThai status FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@Manager AND RapID=@Cinema;',{Manager:f.manager,Cinema:spare.id},r=>{assert.equal(r.length,1);assert.equal(r[0].status,'Hiệu lực');});f.assignment=rows[0].id;
 });
 await check('P3-ADM07-CINEMAS',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
  await create('Rạp',[['Tên rạp','R82 Admin Cinema'],['Địa chỉ','R82 address'],['Thành phố','HCM']],'R82 Admin Cinema');
  const rows=await sqlCheck('SQL-CINEMA','SELECT RapID id FROM dbo.RAPCHIEUPHIM WHERE TenRap=N\'R82 Admin Cinema\';',{},r=>assert.equal(r.length,1));f.adminCinema=rows[0].id;
  await edit('R82 Admin Cinema',[['Địa chỉ','R82 updated address']]);await sqlCheck('SQL-CINEMA-UPDATE','SELECT DiaChi address FROM dbo.RAPCHIEUPHIM WHERE RapID=@ID;',{ID:f.adminCinema},r=>assert.equal(r[0].address,'R82 updated address'));
  await click('Ảnh rạp');await until(`document.querySelector('select[aria-label="Chọn rạp"] option[value="${f.adminCinema}"]')`);await t.fill('select[aria-label="Chọn rạp"]',f.adminCinema);await waitText('Rạp này chưa có ảnh.');
  await labeled('URL hoặc đường dẫn ảnh','/vite.svg');await labeled('Mô tả','R82 cover A');await click('Lưu');await waitText('R82 cover A');await h.rowButton('R82 cover A','Sửa');await labeled('Mô tả','R82 cover A updated');await click('Lưu');await waitText('R82 cover A updated');
  await labeled('URL hoặc đường dẫn ảnh','/vite.svg');await labeled('Mô tả','R82 cover B');await labeled('Thứ tự hiển thị',1);await click('Lưu');await waitText('R82 cover B');await h.rowButton('R82 cover B','Chọn đại diện');await waitText('Đã chọn ảnh đại diện.');
  await sqlCheck('SQL-CINEMA-IMAGES','SELECT COUNT(*) n,SUM(CASE WHEN LaAnhDaiDien=1 THEN 1 ELSE 0 END) covers FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID;',{ID:f.adminCinema},r=>{assert.equal(r[0].n,2);assert.equal(r[0].covers,1);});
  await t.confirm(()=>h.rowButton('R82 cover A updated','Xóa'));await until("!document.body.innerText.includes('R82 cover A updated')");
 });
 await check('P3-ADM08-ROOM-SEAT',['ADM-08'],'REAL_BROWSER_SQL',async()=>{
  await create('Phòng',[['Tên phòng','R82 Admin Room'],['Loại phòng','2D'],['Mã rạp',f.adminCinema]],'R82 Admin Room');const rows=await sqlCheck('SQL-ADMIN-ROOM','SELECT PhongID id FROM dbo.PHONGCHIEU WHERE TenPhong=N\'R82 Admin Room\';',{},r=>assert.equal(r.length,1));f.adminRoom=rows[0].id;
  await edit('R82 Admin Room',[['Tên phòng','R82 Admin Room Updated']]);
  await create('Ghế',[['Loại ghế','Thường'],['Mã phòng',f.adminRoom],['Hàng','R'],['Số ghế',1]]);const seats=await sqlCheck('SQL-ADMIN-SEAT','SELECT GheID id,TrangThai status FROM dbo.GHE WHERE PhongID=@ID;',{ID:f.adminRoom},r=>assert.equal(r.length,1));f.adminSeat=seats[0].id;
  await h.rowButton(String(f.adminSeat),'Sửa');await labeled('Trạng thái','Bảo trì');await click('Lưu');await waitText('Đã lưu thay đổi.');await sqlCheck('SQL-ADMIN-SEAT-UPDATE','SELECT TrangThai status FROM dbo.GHE WHERE GheID=@ID;',{ID:f.adminSeat},r=>assert.equal(r[0].status,'Bảo trì'));
 });
 await check('P3-ADM10-GENRES',['ADM-10'],'REAL_BROWSER_SQL',async()=>{
  await create('Thể loại',[['Tên thể loại','R82 Journey Genre']],'R82 Journey Genre');const r=await sqlCheck('SQL-GENRE','SELECT TheLoaiID id FROM dbo.THELOAI WHERE TenTheLoai=N\'R82 Journey Genre\';',{},r=>assert.equal(r.length,1));f.genre=r[0].id;await edit('R82 Journey Genre',[['Tên thể loại','R82 Journey Genre Updated']]);
 });
 await check('P3-ADM09-MOVIES-CAST',['ADM-09'],'REAL_BROWSER_SQL',async()=>{
  await create('Diễn viên',[['Họ tên','R82 Journey Actor'],['Quốc tịch','VN']],'R82 Journey Actor');const a=await sqlCheck('SQL-ACTOR','SELECT DienVienID id FROM dbo.DIENVIEN WHERE HoTen=N\'R82 Journey Actor\';',{},r=>assert.equal(r.length,1));f.actor=a[0].id;
  await create('Phim',[['Tên phim','R82 Admin Movie'],['Thời lượng (phút)',60],['Ngày khởi chiếu',f.today],['Ngày kết thúc',f.futureDate],['Mã thể loại (phân cách dấu phẩy)',f.genre]],'R82 Admin Movie');const m=await sqlCheck('SQL-ADMIN-MOVIE','SELECT PhimID id FROM dbo.PHIM WHERE TenPhim=N\'R82 Admin Movie\';',{},r=>assert.equal(r.length,1));f.adminMovie=m[0].id;
  await h.rowButton('R82 Admin Movie','Sửa');await t.fill('textarea[aria-label="Danh sách diễn viên phim"]',JSON.stringify([{actorId:f.actor,role:'R82 Lead'}]));await click('Lưu diễn viên');await waitText('Đã cập nhật danh sách diễn viên.');
  await sqlCheck('SQL-CAST-AND-GENRE','SELECT (SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN WHERE PhimID=@Movie AND DienVienID=@Actor) actors,(SELECT COUNT(*) FROM dbo.PHIM_THELOAI WHERE PhimID=@Movie AND TheLoaiID=@Genre) genres;',{Movie:f.adminMovie,Actor:f.actor,Genre:f.genre},r=>{assert.equal(r[0].actors,1);assert.equal(r[0].genres,1);});
 });
 await check('P3-ADM11-PRODUCT-DECIMAL',['ADM-11'],'REAL_BROWSER_SQL',async()=>{
  await create('Sản phẩm',[['Tên sản phẩm','R82 Admin Product'],['Loại sản phẩm','Snack'],['Giá',100.25]],'R82 Admin Product');await edit('R82 Admin Product',[['Giá',200.75]]);
  await sqlCheck('SQL-PRODUCT-DECIMAL','SELECT Gia price FROM dbo.SANPHAM WHERE TenSanPham=N\'R82 Admin Product\';',{},r=>{assert.equal(r.length,1);assert.equal(r[0].price,200.75);});await remove('R82 Admin Product');
 });
 await check('P3-ADM12-PROMOTION-DECIMAL',['ADM-12'],'REAL_BROWSER_SQL',async()=>{
  await create('Khuyến mãi',[['Mô tả','R82 Admin Promotion'],['Loại giảm giá','Số tiền'],['Giá trị giảm',25.25],['Đơn tối thiểu',100.25],['Giảm tối đa',50.75],['Bắt đầu (giờ Việt Nam)',h.local(new Date(f.startsAt).getTime()-86400000)],['Kết thúc (giờ Việt Nam)',h.local(new Date(f.startsAt).getTime()+86400000)],['Số lượng',10],['Mã khuyến mãi','R82ADMINPROMO']],'R82ADMINPROMO');
  await edit('R82ADMINPROMO',[['Giá trị giảm',30.75]]);await sqlCheck('SQL-PROMOTION-DECIMAL','SELECT GiaTriGiam discount,DonHangToiThieu minimumOrder,GiamToiDa maximumDiscount FROM dbo.KHUYENMAI WHERE MaCode=\'R82ADMINPROMO\';',{},r=>{assert.equal(r[0].discount,30.75);assert.equal(r[0].minimumOrder,100.25);assert.equal(r[0].maximumDiscount,50.75);});await remove('R82ADMINPROMO');
 });
 await check('P3-ADM13-PRICING-DECIMAL',['ADM-13'],'REAL_BROWSER_SQL',async()=>{
  await create('Bảng giá',[['Phụ thu',10.25],['Loại ghế','Tất cả'],['Loại ngày','Tất cả'],['Định dạng','Tất cả'],['Ngày bắt đầu',f.today],['Mã rạp',f.adminCinema]]);
  const rows=await sqlCheck('SQL-ADMIN-PRICING','SELECT GiaID id,PhuThu surcharge FROM dbo.BANGGIA WHERE RapID=@ID;',{ID:f.adminCinema},r=>{assert.equal(r.length,1);assert.equal(r[0].surcharge,10.25);});f.adminPricing=rows[0].id;
 });
 await check('P3-ADM14-SHOW-DECIMAL',['ADM-14'],'REAL_BROWSER_SQL',async()=>{
  await create('Suất chiếu',[['Mã phim',f.adminMovie],['Bắt đầu (giờ Việt Nam)',h.local(f.startsAt)],['Kết thúc (giờ Việt Nam)',h.local(f.endsAt)],['Định dạng','2D'],['Giá vé cơ bản',100.25],['Mã phòng',f.adminRoom]],'R82 Admin Movie');
  const rows=await sqlCheck('SQL-ADMIN-SHOW','SELECT SuatChieuID id,GiaVeCoBan price FROM dbo.SUATCHIEU WHERE PhongID=@ID;',{ID:f.adminRoom},r=>{assert.equal(r.length,1);assert.equal(r[0].price,100.25);});f.adminShow=rows[0].id;
  await h.rowButton('R82 Admin Movie','Sửa');await labeled('Giá vé cơ bản',200.75);await click('Lưu');await waitText('Đã lưu thay đổi.');await sqlCheck('SQL-ADMIN-SHOW-UPDATE','SELECT GiaVeCoBan price FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID;',{ID:f.adminShow},r=>assert.equal(r[0].price,200.75));
  await t.confirm(()=>h.rowButton('R82 Admin Movie','Hủy'));await waitText('Đã hủy suất chiếu.');
 });
 await check('P3-ADM15-COMPLAINT',['ADM-15'],'REAL_BROWSER_SQL',async()=>{
  await module('Khiếu nại');await click(`Mở khiếu nại #${f.complaint} · R82 Journey Complaint`);await waitText('R82 Journey Snack');await waitText('MOMO');await labeled('Nội dung xử lý','R82 Admin processed');await click('Ghi diễn biến');await waitText('R82 Admin processed');
  await sqlCheck('SQL-ADMIN-COMPLAINT','SELECT NguoiXuLyID actor,NoiDungXuLy content FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID ORDER BY XuLyID;',{ID:f.complaint},r=>{assert.equal(r.length,3);assert.equal(r[2].actor,t.actors.find(a=>a.role==='ADMIN').id);assert.equal(r[2].content,'R82 Admin processed');});
 });
 await check('P3-ADM16-REVENUE',['ADM-16'],'REAL_BROWSER_SQL',async()=>{
  await click('Doanh thu');await waitText('Tổng hợp doanh thu');for(const title of ['Theo rạp','Theo phim','Theo ngày'])await waitText(title);
  await labeled('Từ ngày',f.today);await labeled('Đến ngày',f.today);await click('Lọc doanh thu');await waitText('R82 Journey Movie');
  const amounts=await sqlCheck('SQL-ADMIN-RECEIPTS',"SELECT SUM(p.SoTien) receipts,COUNT(*) payments,COUNT(DISTINCT d.DonDatVeID) orders FROM dbo.THANHTOAN p JOIN dbo.DONDATVE d ON d.DonDatVeID=p.DonDatVeID WHERE p.TrangThai=N'Thành công' AND dbo.fn_NgayKinhDoanh(p.NgayThanhToan)=@Day;",{Day:f.today},r=>{assert.equal(r[0].receipts,1175.5);assert.equal(r[0].payments,1);assert.equal(r[0].orders,1);});
  assert.ok((await t.visible()).includes('1175.5'));await labeled('Từ ngày',f.futureDate);await labeled('Đến ngày',f.futureDate);await click('Lọc doanh thu');await until("!document.body.innerText.includes('R82 Journey Movie')&&document.body.innerText.includes('Theo ngày')");return [amounts[0],'Four canonical dimensions, inclusive business date, future range excludes receipt'];
 });
 await check('P3-ADMIN-GRANT-DENIAL',['ADM-02','ADM-03','ADM-04','ADM-05','ADM-06','ADM-07','ADM-08','ADM-09','ADM-10','ADM-11','ADM-12','ADM-13','ADM-14','ADM-15','ADM-16'],'REAL_BROWSER_SQL',async()=>{
  const id=t.actors.find(a=>a.role==='ADMIN').id;
  for(const [grant,path]of [['QL_NGUOIDUNG','users'],['QL_VAITRO','roles'],['QL_QUYEN','permissions'],['PHANCONG_RAP','assignments'],['QL_RAP','cinemas'],['QL_PHONG','rooms'],['QL_GHE','seats'],['QL_DANHMUC_PHIM','movies'],['QL_THELOAI','genres'],['QL_DANHMUC_PHIM','actors'],['QL_SANPHAM','products'],['QL_KHUYENMAI','promotions'],['QL_BANG_GIA','pricing'],['QL_SUAT_CHIEU','showtimes'],['QL_KHIEUNAI','complaints'],['XEM_BAO_CAO_TOANHE','reports/revenue']]){
   await h.revoke(id,grant,async()=>{await h.deny('GET','/admin/'+path);});
  }
  await sqlCheck('SQL-ADMIN-DENIED-NO-WRITE','SELECT COUNT(*) n FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID;',{ID:f.complaint},r=>assert.equal(r[0].n,3));
 });
 await t.capture('p3-admin-desktop');
}

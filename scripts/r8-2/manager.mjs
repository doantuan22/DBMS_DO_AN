export async function manager(t,h,f){
 const {assert,check,login,until,click,sqlCheck,query,evaluate}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 const form=async(name,fields)=>{for(const [label,value]of fields)await h.formFill(`form[aria-label="${name}"]`,label,value);await h.submit(`form[aria-label="${name}"]`);await waitText('Đã tạo.');await until("document.querySelector('section[aria-label=\"Phòng chiếu\"]')");};
 const ownedCinema=async()=>{await t.fill('select[aria-label="Rạp hiện tại"]',f.cinema);await waitText('R82 Journey Room');await until("document.querySelector('form[aria-label=\"Tạo phòng\"]')");};
 await check('P3-QLR01-LOGIN-SCOPE',['QLR-01'],'REAL_BROWSER_SQL',async()=>{
  await login('QUAN_LY_RAP');await waitText('Manager Portal');await ownedCinema();assert.ok(!(await t.visible()).includes('R82 Admin Room Updated'));await h.deny('GET',`/manager/cinemas/${f.adminCinema}/rooms`);await h.deny('GET','/admin/users');
  await sqlCheck('SQL-MANAGER-ASSIGNMENT','SELECT COUNT(*) n FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@Manager AND RapID=@Cinema AND TrangThai=N\'Hiệu lực\';',{Manager:f.manager,Cinema:f.cinema},r=>assert.equal(r[0].n,1));
 });
 await check('P3-QLR02-ROOM',['QLR-02'],'REAL_BROWSER_SQL',async()=>{
  await form('Tạo phòng',[['Tên phòng','R82 Manager Room'],['Loại phòng','2D']]);await waitText('R82 Manager Room');const rows=await sqlCheck('SQL-MANAGER-ROOM','SELECT PhongID id,RapID cinema FROM dbo.PHONGCHIEU WHERE TenPhong=N\'R82 Manager Room\';',{},r=>{assert.equal(r.length,1);assert.equal(r[0].cinema,f.cinema);});f.managerRoom=rows[0].id;
  await h.rowButton('R82 Manager Room','Sửa phòng');await h.formFill('form[aria-label="Sửa phòng"]','Tên phòng','R82 Manager Room Updated');await h.submit('form[aria-label="Sửa phòng"]');await waitText('Đã cập nhật.');
  await sqlCheck('SQL-MANAGER-ROOM-UPDATE','SELECT TenPhong name FROM dbo.PHONGCHIEU WHERE PhongID=@ID;',{ID:f.managerRoom},r=>assert.equal(r[0].name,'R82 Manager Room Updated'));
 });
 await check('P3-QLR03-SEAT',['QLR-03'],'REAL_BROWSER_SQL',async()=>{
  await h.rowButton('R82 Manager Room Updated','Ghế');await until("document.querySelector('form[aria-label=\"Tạo ghế\"]')");await form('Tạo ghế',[['Hàng ghế','R'],['Số ghế',1],['Loại ghế','VIP']]);await waitText('R1');
  const rows=await sqlCheck('SQL-MANAGER-SEAT','SELECT GheID id,LoaiGhe type FROM dbo.GHE WHERE PhongID=@ID;',{ID:f.managerRoom},r=>{assert.equal(r.length,1);assert.equal(r[0].type,'VIP');});f.managerSeat=rows[0].id;
  await h.rowButton('R1 · VIP','Sửa ghế');await h.formFill('form[aria-label="Sửa ghế"]','Trạng thái','Bảo trì');await h.submit('form[aria-label="Sửa ghế"]');await waitText('Đã cập nhật.');await sqlCheck('SQL-MANAGER-SEAT-UPDATE','SELECT TrangThai status FROM dbo.GHE WHERE GheID=@ID;',{ID:f.managerSeat},r=>assert.equal(r[0].status,'Bảo trì'));
 });
 await check('P3-QLR04-CREATE-SHOW',['QLR-04'],'REAL_BROWSER_SQL',async()=>{
  await form('Tạo suất',[['Movie ID',f.movie],['Mã phòng suất chiếu',f.managerRoom],['Bắt đầu',h.local(f.startsAt)],['Kết thúc',h.local(f.endsAt)],['Giá vé cơ bản',100.25]]);
  const r=await sqlCheck('SQL-MANAGER-CREATE-SHOW','SELECT SuatChieuID id,GiaVeCoBan price FROM dbo.SUATCHIEU WHERE PhongID=@ID;',{ID:f.managerRoom},r=>{assert.equal(r.length,1);assert.equal(r[0].price,100.25);});f.managerShow=r[0].id;
 });
 await check('P3-QLR05-UPDATE-SHOW',['QLR-05'],'REAL_BROWSER_SQL',async()=>{
  await h.rowButton('R82 Manager Room Updated','Sửa suất');await h.formFill('form[aria-label="Sửa suất"]','Giá vé cơ bản',200.75);await h.submit('form[aria-label="Sửa suất"]');await waitText('Đã cập nhật.');await sqlCheck('SQL-MANAGER-UPDATE-SHOW','SELECT GiaVeCoBan price FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID;',{ID:f.managerShow},r=>assert.equal(r[0].price,200.75));
  await h.deny('PUT',`/manager/showtimes/${f.adminShow}`,{movieId:f.adminMovie,startsAt:f.startsAt,endsAt:f.endsAt,format:'2D',basePrice:100.25,status:'Mở bán'});
 });
 await check('P3-QLR06-CANCEL-SHOW',['QLR-06'],'REAL_BROWSER_SQL',async()=>{
  await h.rowButton('R82 Manager Room Updated','Hủy');await waitText('Đã hủy suất chiếu.');await sqlCheck('SQL-MANAGER-CANCEL','SELECT TrangThai status FROM dbo.SUATCHIEU WHERE SuatChieuID=@ID;',{ID:f.managerShow},r=>assert.equal(r[0].status,'Đã hủy'));
 });
 await check('P3-QLR07-PRICING',['QLR-07'],'REAL_BROWSER_SQL',async()=>{
  await form('Tạo giá',[['Loại ghế bảng giá','Tất cả'],['Loại ngày','Tất cả'],['Định dạng bảng giá','Tất cả'],['Phụ thu',12.25],['Ngày áp dụng',f.today]]);
  const r=await sqlCheck('SQL-MANAGER-PRICING','SELECT GiaID id,PhuThu surcharge FROM dbo.BANGGIA WHERE RapID=@ID;',{ID:f.cinema},r=>{assert.equal(r.length,1);assert.equal(r[0].surcharge,12.25);});f.managerPricing=r[0].id;
  await h.rowButton('12.25','Sửa giá');await h.formFill('form[aria-label="Sửa giá"]','Phụ thu',14.75);await h.submit('form[aria-label="Sửa giá"]');await waitText('Đã cập nhật.');await sqlCheck('SQL-MANAGER-PRICING-UPDATE','SELECT PhuThu surcharge FROM dbo.BANGGIA WHERE GiaID=@ID;',{ID:f.managerPricing},r=>assert.equal(r[0].surcharge,14.75));
 });
 await check('P3-QLR08-DASHBOARD',['QLR-08'],'REAL_BROWSER_SQL',async()=>{
  const rows=await sqlCheck('SQL-MANAGER-FOUR-METRICS',`SELECT (SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE RapID=@Cinema AND TrangThai=N'Hoạt động') rooms,(SELECT COUNT(*) FROM dbo.GHE g JOIN dbo.PHONGCHIEU r ON r.PhongID=g.PhongID WHERE r.RapID=@Cinema AND g.TrangThai=N'Hoạt động') seats,(SELECT COUNT(*) FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU r ON r.PhongID=s.PhongID WHERE r.RapID=@Cinema AND dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau)=dbo.fn_HomNay() AND s.TrangThai<>N'Đã hủy') shows,(SELECT COUNT(DISTINCT p.DonDatVeID) FROM dbo.THANHTOAN p JOIN dbo.DONDATVE d ON d.DonDatVeID=p.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU r ON r.PhongID=s.PhongID WHERE r.RapID=@Cinema AND p.TrangThai=N'Thành công' AND dbo.fn_NgayKinhDoanh(p.NgayThanhToan)=dbo.fn_HomNay()) paid;`,{Cinema:f.cinema},r=>{assert.equal(r.length,1);assert.equal(r[0].paid,1);});
  const text=await t.visible();for(const [label,key] of [['Phòng hoạt động:','rooms'],['Ghế:','seats'],['Suất hôm nay:','shows'],['Đơn đã thanh toán hôm nay:','paid']])assert.ok(text.includes(label+' '+rows[0][key]),label);
 });
 await check('P3-QLR09-REVENUE',['QLR-09'],'REAL_BROWSER_SQL',async()=>{
  await waitText('1175.5');await t.fill('input[aria-label="Từ ngày doanh thu"]',f.today);await t.fill('input[aria-label="Đến ngày doanh thu"]',f.today);await click('Lọc doanh thu');await waitText('1175.5');
  await sqlCheck('SQL-MANAGER-RECEIPT','SELECT SUM(p.SoTien) receipts FROM dbo.THANHTOAN p JOIN dbo.DONDATVE d ON d.DonDatVeID=p.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU r ON r.PhongID=s.PhongID WHERE r.RapID=@Cinema AND p.TrangThai=N\'Thành công\';',{Cinema:f.cinema},r=>assert.equal(r[0].receipts,1175.5));
  await t.fill('input[aria-label="Từ ngày doanh thu"]',f.futureDate);await t.fill('input[aria-label="Đến ngày doanh thu"]',f.futureDate);await click('Lọc doanh thu');await waitText('Không có doanh thu trong khoảng đã chọn.');
  await t.fill('input[aria-label="Từ ngày doanh thu"]',f.futureDate);await t.fill('input[aria-label="Đến ngày doanh thu"]',f.today);await click('Lọc doanh thu');await waitText('Từ ngày không được sau đến ngày.');
 });
 await check('P3-MANAGER-SCOPE-GRANTS',['QLR-02','QLR-03','QLR-04','QLR-05','QLR-06','QLR-07','QLR-08','QLR-09'],'REAL_BROWSER_SQL',async()=>{
  await h.deny('GET',`/manager/rooms/${f.adminRoom}/seats`);await h.deny('DELETE',`/manager/rooms/${f.adminRoom}`);await h.deny('DELETE',`/manager/seats/${f.adminSeat}`);
  for(const [grant,path]of [['QL_PHONG',`cinemas/${f.cinema}/rooms`],['QL_GHE',`rooms/${f.room}/seats`],['QL_SUAT_CHIEU',`cinemas/${f.cinema}/showtimes`],['QL_BANG_GIA',`cinemas/${f.cinema}/pricing`],['XEM_BAO_CAO_RAP',`cinemas/${f.cinema}/dashboard`],['XEM_BAO_CAO_RAP',`cinemas/${f.cinema}/revenue`]])await h.revoke(f.manager,grant,()=>h.deny('GET','/manager/'+path));
  await sqlCheck('SQL-MANAGER-DENIED-NO-WRITE','SELECT COUNT(*) rooms,(SELECT COUNT(*) FROM dbo.GHE WHERE GheID=@Seat) seats FROM dbo.PHONGCHIEU WHERE PhongID=@Room;',{Room:f.adminRoom,Seat:f.adminSeat},r=>{assert.equal(r[0].rooms,1);assert.equal(r[0].seats,1);});
 });
 await t.capture('p3-manager-desktop');
}

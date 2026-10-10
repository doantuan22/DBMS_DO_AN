export async function run(t,phase){
 const {assert,check,login,click,go,navigate,fill,labeled,evaluate,until,pause,fault,query,sqlCheck,capture}=t;
 const complaints=(await query('SELECT KhieuNaiID id,TieuDe title,MucDoUuTien priority FROM dbo.KHIEUNAI ORDER BY KhieuNaiID;')).recordset;
 const [a,b]=complaints;
 await login('ADMIN');await click('Khiếu nại');await until("document.querySelector('.catalog-list button')!==null");
 await check('P1-I11-LATE-DETAIL',['ADM-15'],'CONTROLLED_TRANSPORT',async()=>{
  fault('/admin/complaints/'+a.id,{delay:1000});await click(`Mở khiếu nại #${a.id} · ${a.title}`);
  await click(`Mở khiếu nại #${b.id} · ${b.title}`);await until(`document.querySelector('h3')?.textContent.includes(${JSON.stringify('#'+b.id+' ·')})`);
  await pause(1300);assert.ok((await evaluate("[...document.querySelectorAll('h3')].map(n=>n.textContent).join('|')")).includes('#'+b.id+' ·'),'Late A overwrites visible complaint B');
  return ['Real backend detail A delayed1000ms; B latest detail remains after A arrives'];
 });
 await login('CSKH');await until("document.querySelector('.catalog-list button')!==null");
 await check('P1-I15-LATE-QUEUE',['CSKH-02'],'CONTROLLED_TRANSPORT',async()=>{
  fault('/support/complaints?search=',{delay:1000});await fill('input[aria-label="Tìm khiếu nại"]',a.title);
  await pause(120);await fill('input[aria-label="Tìm khiếu nại"]',b.title);
  await until(`document.querySelector('.catalog-list')?.innerText.includes(${JSON.stringify(b.title)})`);await pause(1200);
  assert.ok((await evaluate("document.querySelector('.catalog-list')?.innerText||''")).includes(b.title),'Old filter overwrites current queue');
  return ['Real SQL filtered response A delayed; only B rows remain'];
 });
 const shows=(await query('SELECT TOP(2) SuatChieuID id FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1 ORDER BY SuatChieuID;')).recordset;
 const [s1,s2]=shows;await login('KHACH_HANG');
 await check('P1-I19-CONTEXT-RESET',['KH-05','KH-06','KH-08','KH-09'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/booking/'+s1.id);await until("document.querySelector('.booking-product input')&&document.querySelector('.seat-button:not(:disabled)')");
  await evaluate("document.querySelector('.seat-button:not(:disabled)').click()");await fill('.booking-product input',3);await labeled('Mã khuyến mãi','R82-CONTEXT-A');
  await navigate('/booking/'+s2.id);await until(`document.body.innerText.includes('Mã suất chiếu: ${s2.id}')&&document.querySelector('.booking-product input')`);
  assert.equal(await evaluate("document.querySelector('input[maxlength=\"50\"]').value"),'','Promotion code belongs to old showtime');
  assert.ok(await evaluate("[...document.querySelectorAll('.booking-product input')].every(n=>Number(n.value)===0)"),'Old product quantities retained');
  assert.equal(await evaluate("document.querySelectorAll('.seat-button[aria-pressed=true]').length"),0);
  return ['BrowserRouter same mounted route transition A→B resets seats/code/products'];
 });
 await check('P1-I21-ORDER-LOOKUP',['KH-14'],'CONTROLLED_TRANSPORT',async()=>{
  fault('/api/orders',{status:503,times:2});await go('/complaints');await until("document.body.innerText.includes('Khiếu nại của tôi')");await pause(650);
  assert.ok(await evaluate("document.querySelector('[role=alert]')!==null"),'Order lookup failure is masked as an empty list');
  if(!phase.startsWith('reproduce')){await click('Thử lại');await until("document.querySelector('[role=alert]')===null");}
  return ['503 order lookup produces error, manual retry returns legitimate successful empty'];
 });
 if(phase.startsWith('reproduce'))return;
 await login('ADMIN');await click('Khiếu nại');await until("document.querySelector('.catalog-list button')!==null");
 await check('P1-I11-MODULE-INVALIDATION',['ADM-15'],'CONTROLLED_TRANSPORT',async()=>{
  fault('/admin/complaints/'+a.id,{delay:700});await click(`Mở khiếu nại #${a.id} · ${a.title}`);await click('Tổng quan');await pause(900);await click('Khiếu nại');
  assert.equal(await evaluate("[...document.querySelectorAll('h3')].some(n=>n.textContent.startsWith('#'))"),false);return ['Pending old detail cannot reappear on module return'];
 });
 await check('P1-I11-WRITE-TARGET',['ADM-15'],'REAL_BROWSER_SQL',async()=>{
  await click(`Mở khiếu nại #${a.id} · ${a.title}`);await until(`document.querySelector('h3')?.textContent.startsWith('#${a.id} ')`);
  await labeled('Nội dung xử lý','R82 admin target A');
  fault('/admin/complaints/'+a.id+'/processings',{delay:700,method:'POST'});
  await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent==='Ghi diễn biến');b.click();b.click()})()");
  await click(`Mở khiếu nại #${b.id} · ${b.title}`);await until(`document.querySelector('h3')?.textContent.startsWith('#${b.id} ')`);await pause(1000);
  assert.ok((await evaluate("document.querySelector('h3').textContent")).startsWith('#'+b.id+' '));
  await sqlCheck('SQL-ADMIN-WRITE-TARGET',`SELECT KhieuNaiID id,COUNT(*) n FROM dbo.XULY_KHIEUNAI WHERE NoiDungXuLy=N'R82 admin target A' GROUP BY KhieuNaiID;`,{},rows=>{assert.deepEqual(rows,[{id:a.id,n:1}]);});
  return ['Double-click creates exactly one processing at confirmed A; late write never restores selection A after switch B'];
 });
 await check('P1-I21-ADMIN-REFERENCE-RETRY',['ADM-15'],'CONTROLLED_TRANSPORT',async()=>{
  fault('/admin/complaints/'+a.id+'/order-reference',{status:500});await click(`Mở khiếu nại #${a.id} · ${a.title}`);
  await until("document.querySelector('[role=alert]')!==null");await click('Thử lại');await until("document.querySelector('[role=alert]')===null");
  await until("document.body.innerText.includes('không gắn với đơn đặt vé tham chiếu')");return ['500 reference distinct from successful order:null, current reference retry'];
 });
 await login('CSKH');await until("document.querySelector('.catalog-list button')!==null");
 await check('P1-PRIORITY-AND',['CSKH-02'],'REAL_BROWSER_SQL',async()=>{
  for(const c of complaints){await fill('select[aria-label="Lọc mức ưu tiên"]',c.priority);await until(`document.querySelector('.catalog-list')?.innerText.includes(${JSON.stringify(c.title)})`);
   assert.equal(await evaluate("document.querySelectorAll('.catalog-list li').length"),1);}
  await fill('input[aria-label="Lọc loại khiếu nại"]','not-existing');await until("document.body.innerText.includes('Không có khiếu nại phù hợp.')");
  await fill('input[aria-label="Lọc loại khiếu nại"]','R81 Smoke');await fill('select[aria-label="Lọc mức ưu tiên"]','');
  // Actual fixture type comes from the reused canonical R8.1 setup pattern.
  await fill('input[aria-label="Lọc loại khiếu nại"]','');await until("document.querySelectorAll('.catalog-list li').length===4");
  return ['All four priority values sent to SQL; AND type produces true empty; omitting priority restores all four'];
 });
 await check('P1-SUPPORT-PROCESS-STATUS',['CSKH-03','CSKH-04','CSKH-05','CSKH-06'],'REAL_BROWSER_SQL',async()=>{
  await evaluate(`(()=>{const b=[...document.querySelectorAll('.catalog-list button')].find(n=>n.innerText.includes('#${b.id} ·'));b.click()})()`);
  await until(`document.querySelector('h2')?.textContent.startsWith('#${b.id} ')`);await fill('textarea[aria-label="Nội dung xử lý"]','R82 support target B');await click('Ghi diễn biến');
  await until("document.body.innerText.includes('R82 support target B')");await fill('select[aria-label="Trạng thái mới"]','Đã giải quyết');await click('Cập nhật trạng thái');
  await until("document.body.innerText.includes('Đã cập nhật trạng thái và ghi vào lịch sử.')");
  await sqlCheck('SQL-SUPPORT-TIMELINE',`SELECT k.KhieuNaiID id,k.TrangThai status,COUNT(x.XuLyID) processingCount FROM dbo.KHIEUNAI k JOIN dbo.XULY_KHIEUNAI x ON x.KhieuNaiID=k.KhieuNaiID WHERE k.KhieuNaiID=@ID GROUP BY k.KhieuNaiID,k.TrangThai;`,{ID:b.id},rows=>{assert.equal(rows[0].status,'Đã giải quyết');assert.equal(rows[0].processingCount,2);});
  return ['Support detail, unlinked reference, processing and status append SQL timeline on B'];
 });
 await login('KHACH_HANG');
 await query(`INSERT dbo.KHUYENMAI(MaCode,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai) VALUES('R82PROMO',N'Số tiền',25.25,0,DATEADD(DAY,-1,dbo.fn_BayGio()),DATEADD(DAY,1,dbo.fn_BayGio()),10,0,N'Hoạt động');`);
 await check('P1-BOOKING-PERSISTENCE',['KH-05','KH-06','KH-07','KH-08','KH-09'],'REAL_BROWSER_SQL',async()=>{
  await go('/booking/'+s1.id);await until("document.querySelectorAll('.seat-button:not(:disabled)').length>=11&&document.querySelector('.booking-product input')");
  for(let i=0;i<11;i++){await evaluate(`document.querySelectorAll('.seat-button:not(:disabled)')[${i}].click()`);await pause(40);}
  assert.equal(await evaluate("document.querySelectorAll('.seat-button[aria-pressed=true]').length"),10);
  await fill('.booking-product input',11);assert.equal(await evaluate("document.querySelector('.booking-product input').value"),'10');
  await fill('.booking-product input',1);await labeled('Mã khuyến mãi','R82PROMO');await click('Áp dụng');await until("document.body.innerText.includes('Giảm tạm tính:')");
  await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent==='Đặt vé');b.click();b.click()})()");
  await until("document.body.innerText.includes('Đặt vé thành công.')");
  await sqlCheck('SQL-BOOKING-SNAPSHOT',`SELECT d.DonDatVeID id,d.SuatChieuID showtimeId,d.TongTienVe ticketTotal,d.TongTienDoAn foodTotal,d.TienGiamGia discount,COUNT(v.VeID) seats,(SELECT COUNT(*) FROM dbo.CHITIETDOAN f WHERE f.DonDatVeID=d.DonDatVeID) foodLines FROM dbo.DONDATVE d JOIN dbo.CHITIETVE v ON v.DonDatVeID=d.DonDatVeID GROUP BY d.DonDatVeID,d.SuatChieuID,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia;`,{},rows=>{assert.equal(rows.length,1);assert.equal(rows[0].showtimeId,s1.id);assert.equal(rows[0].seats,10);assert.equal(rows[0].foodLines,1);assert.equal(rows[0].discount,25.25);});
  return ['11th seat blocked; product11 clamped10; actual double-click creates one SQL order with10 tickets and1 food line'];
 });
 await check('P1-I19-LATE-BOOKING',['KH-07'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/booking/'+s2.id);await until("document.querySelector('.seat-button:not(:disabled)')!==null");
  await evaluate("document.querySelector('.seat-button:not(:disabled)').click()");await pause(80);
  fault('/api/bookings',{method:'POST',delay:900});await click('Đặt vé');await navigate('/booking/'+s1.id);
  await until(`document.body.innerText.includes('Mã suất chiếu: ${s1.id}')`);await pause(1200);
  assert.ok(!(await t.visible()).includes('Đặt vé thành công.'));
  await sqlCheck('SQL-BOOKING-PENDING-CONTEXT',`SELECT SuatChieuID id,COUNT(*) n FROM dbo.DONDATVE GROUP BY SuatChieuID;`,{},rows=>{assert.equal(rows.length,2);assert.ok(rows.every(r=>r.n===1));});
  return ['Real SQL booking B committed once; delayed success cannot enter current A context or retarget payload'];
 });
 await capture('p1-desktop');await t.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await capture('p1-mobile');
}

export async function support(t,h,f){
 const {assert,check,login,until,labeled,click,go,sqlCheck,evaluate}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 const open=async()=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('.catalog-list button')].find(n=>n.innerText.includes('R82 Journey Complaint'));if(!b)throw Error('Missing owned complaint');b.click()})()`);await waitText('R82 owned linked complaint');};
 await check('P3-CSKH01-LOGIN',['CSKH-01'],'REAL_BROWSER_SQL',async()=>{await login('CSKH');await waitText('CSKH Portal');await h.deny('GET','/admin/users');await h.deny('GET','/manager/cinemas');});
 await check('P3-CSKH02-QUEUE',['CSKH-02'],'REAL_BROWSER_SQL',async()=>{
  await waitText('R82 Journey Complaint');await labeled('Tìm khiếu nại','R82 Journey');await labeled('Lọc loại khiếu nại','R82 Journey');await click('Lọc hàng chờ');await waitText('R82 Journey Complaint');
  await labeled('Lọc mức ưu tiên','Khẩn cấp');await click('Lọc hàng chờ');await waitText('Không có khiếu nại');
  await labeled('Lọc mức ưu tiên','');await click('Lọc hàng chờ');await waitText('R82 Journey Complaint');
  await sqlCheck('SQL-QUEUE-AND',"SELECT COUNT(*) matches FROM dbo.KHIEUNAI WHERE TieuDe LIKE N'%R82 Journey%' AND LoaiKhieuNai=N'R82 Journey';",{},r=>assert.equal(r[0].matches,1));
  await h.deny('GET','/support/complaints?priority=INVALID',undefined,400);
 });
 await check('P3-CSKH03-DETAIL',['CSKH-03'],'REAL_BROWSER_SQL',async()=>{await open();await sqlCheck('SQL-COMPLAINT-DETAIL','SELECT COUNT(*) n FROM dbo.KHIEUNAI WHERE KhieuNaiID=@ID AND DonDatVeID=@Order;',{ID:f.complaint,Order:f.order},r=>assert.equal(r[0].n,1));});
 await check('P3-CSKH04-REFERENCE',['CSKH-04'],'REAL_BROWSER_SQL',async()=>{
  await waitText('R82 Journey Snack');await waitText('MOMO');assert.ok((await t.visible()).includes('A1'));
  await sqlCheck('SQL-REFERENCE-LEDGER',"SELECT p.SoTien amount,(SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID=p.DonDatVeID) tickets FROM dbo.THANHTOAN p WHERE p.DonDatVeID=@ID AND p.TrangThai=N'Thành công';",{ID:f.order},r=>{assert.equal(r[0].amount,1175.5);assert.equal(r[0].tickets,1);});
 });
 await check('P3-CSKH05-PROCESS',['CSKH-05'],'REAL_BROWSER_SQL',async()=>{
  await labeled('Nội dung xử lý','R82 Support processed');await labeled('Trạng thái sau xử lý','Đang xử lý');await click('Ghi diễn biến');await waitText('R82 Support processed');
  await sqlCheck('SQL-SUPPORT-PROCESS',"SELECT x.NguoiXuLyID actor,x.NoiDungXuLy content,k.TrangThai status FROM dbo.XULY_KHIEUNAI x JOIN dbo.KHIEUNAI k ON k.KhieuNaiID=x.KhieuNaiID WHERE x.KhieuNaiID=@ID;",{ID:f.complaint},r=>{assert.equal(r.length,1);assert.equal(r[0].actor,t.actors.find(a=>a.role==='CSKH').id);assert.equal(r[0].content,'R82 Support processed');assert.equal(r[0].status,'Đang xử lý');});
 });
 await check('P3-CSKH06-STATUS',['CSKH-06'],'REAL_BROWSER_SQL',async()=>{
  await labeled('Trạng thái mới','Đã giải quyết');await click('Cập nhật trạng thái');await waitText('Đã giải quyết');
  await sqlCheck('SQL-SUPPORT-STATUS',"SELECT k.TrangThai status,COUNT(x.XuLyID) events FROM dbo.KHIEUNAI k JOIN dbo.XULY_KHIEUNAI x ON x.KhieuNaiID=k.KhieuNaiID WHERE k.KhieuNaiID=@ID GROUP BY k.TrangThai;",{ID:f.complaint},r=>{assert.equal(r[0].status,'Đã giải quyết');assert.equal(r[0].events,2);});
  await h.deny('PUT',`/support/complaints/${f.complaint}/status`,{status:'Mới'},400);
  await sqlCheck('SQL-SUPPORT-INVALID-NO-WRITE','SELECT COUNT(*) n FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID;',{ID:f.complaint},r=>assert.equal(r[0].n,2));
 });
 await check('P3-SUPPORT-GRANT-DENIAL',['CSKH-02','CSKH-03','CSKH-04','CSKH-05','CSKH-06'],'REAL_BROWSER_SQL',async()=>{
  const id=t.actors.find(a=>a.role==='CSKH').id;
  await h.revoke(id,'TRA_CUU_DON',async()=>{await h.deny('GET',`/support/complaints/${f.complaint}/order-reference`);await go('/support');await waitText('R82 Journey Complaint');await open();assert.ok(!(await t.visible()).includes('R82 Journey Snack'));});
  await h.revoke(id,'XULY_KHIEUNAI',async()=>{await h.deny('POST',`/support/complaints/${f.complaint}/processings`,{content:'Denied write',nextStatus:'Đang xử lý'});});
  await h.revoke(id,'QL_KHIEUNAI',async()=>{await h.deny('GET','/support/complaints');await h.deny('GET',`/support/complaints/${f.complaint}/order-reference`);});
  await sqlCheck('SQL-SUPPORT-DENIED-NO-WRITE','SELECT COUNT(*) n FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID;',{ID:f.complaint},r=>assert.equal(r[0].n,2));
 });
 await login('CSKH');await t.capture('p3-support-desktop');
}

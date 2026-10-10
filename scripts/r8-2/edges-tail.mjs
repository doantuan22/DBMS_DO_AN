import {createJourney} from './journey-fixture.mjs';
import {helpers} from './journey-helpers.mjs';
import {transportTail} from './edges.mjs';
export async function run(t){
 const f=await createJourney(t),h=helpers(t);
 const {assert,check,go,click,until,labeled,evaluate,fill,query,sqlCheck,pause}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 await t.login('KHACH_HANG');
 await check('TAIL-REAL-READ-ERROR-FIXTURE',['KH-07','KH-10','KH-14'],'REAL_BROWSER_SQL',async()=>{
  await go('/booking/'+f.show);await until("document.querySelector('.seat-button[aria-label^=\"A1 —\"]')&&document.querySelector('input[aria-label=\"Số lượng R82 Journey Snack\"]')");await evaluate("document.querySelector('.seat-button[aria-label^=\"A1 —\"]').click()");await pause(80);await fill('input[aria-label="Số lượng R82 Journey Snack"]',2);await labeled('Mã khuyến mãi',f.code);await click('Đặt vé');await waitText('Đặt vé thành công.');f.order=(await query('SELECT DonDatVeID id FROM dbo.DONDATVE WHERE SuatChieuID=@ID;',{ID:f.show})).recordset[0].id;await click('Thanh toán đơn này');await waitText('Xác nhận thanh toán');await labeled('Phương thức','MOMO');await click('Xác nhận thanh toán');await waitText('Đã xác nhận thanh toán thành công.');
  await go('/complaints?orderId='+f.order);await until("document.querySelector('select')&&!document.querySelector('select').disabled");for(const[label,value]of[['Loại khiếu nại','R82 Journey'],['Tiêu đề','R82 Journey Complaint'],['Nội dung','R82 owned linked complaint']])await labeled(label,value);await click('Gửi khiếu nại');await waitText('Đã gửi khiếu nại.');f.complaint=(await query("SELECT KhieuNaiID id FROM dbo.KHIEUNAI WHERE TieuDe=N'R82 Journey Complaint';")).recordset[0].id;
  await go('/booking/'+f.showB);await until("document.querySelector('.seat-button[aria-label^=\"A2 —\"]')");await evaluate("document.querySelector('.seat-button[aria-label^=\"A2 —\"]').click()");await pause(80);await click('Đặt vé');await waitText('Đặt vé thành công.');await click('Thanh toán đơn này');await waitText('Xác nhận thanh toán');await click('Xác nhận thanh toán');await waitText('Đã xác nhận thanh toán thành công.');
  await sqlCheck('SQL-TAIL-REAL-RECEIPTS',"SELECT SUM(SoTien) cash FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công';",{},r=>assert.equal(r[0].cash,2175.75));
 });
 for(const role of ['ADMIN','CSKH','QUAN_LY_RAP'])await t.login(role);
 await transportTail(t,h,f);
}

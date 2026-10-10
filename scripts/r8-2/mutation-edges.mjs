import {createJourney} from './journey-fixture.mjs';
import {helpers} from './journey-helpers.mjs';
import {customer} from './customer.mjs';
import {support} from './support.mjs';
import {admin} from './admin.mjs';
import {manager} from './manager.mjs';
export async function run(t){const f=await createJourney(t),h=helpers(t);await customer(t,h,f);await support(t,h,f);await admin(t,h,f);await manager(t,h,f);await mutations(t,h,f);}
export async function mutations(t,h,f){
 const {assert,check,click,labeled,fill,until,evaluate,pause,fault,sqlCheck,query}=t;const login=t.resume;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 const double=async selector=>evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw Error('Missing submit');b.click();b.click()})()`);
 await check('EDGE-MANAGER-DOUBLE-CREATE',['QLR-02'],'CONTROLLED_TRANSPORT',async()=>{
  await fill('select[aria-label="Rạp hiện tại"]',f.cinema);await waitText('R82 Journey Room');await h.formFill('form[aria-label="Tạo phòng"]','Tên phòng','R82 Double Room');fault(`/manager/cinemas/${f.cinema}/rooms`,{method:'POST',delay:700,times:2});const start=t.network.length;await double('form[aria-label="Tạo phòng"] button');await pause(1300);assert.equal(t.network.slice(start).filter(n=>n.method==='POST'&&n.url.endsWith(`/manager/cinemas/${f.cinema}/rooms`)).length,1,'Manager emitted duplicate create requests');
  await sqlCheck('SQL-MANAGER-DOUBLE-CREATE',"SELECT COUNT(*) n FROM dbo.PHONGCHIEU WHERE TenPhong=N'R82 Double Room';",{},r=>assert.equal(r[0].n,1));
 });
 await login('ADMIN');await click('Phim');await waitText('R82 Admin Movie');
 await check('EDGE-MOVIE-EMPTY-GENRES',['ADM-09'],'REAL_BROWSER_SQL',async()=>{
  await h.rowButton('R82 Admin Movie','Sửa');await labeled('Mã thể loại (phân cách dấu phẩy)','');const valid=await evaluate("document.querySelector('input[aria-label=\"Mã thể loại (phân cách dấu phẩy)\"]').validity.valid");assert.equal(valid,true,'Approved empty genre array is blocked by HTML required');await click('Lưu');await waitText('Đã lưu thay đổi.');await sqlCheck('SQL-MOVIE-GENRES-EMPTY','SELECT COUNT(*) n FROM dbo.PHIM_THELOAI WHERE PhimID=@ID;',{ID:f.adminMovie},r=>assert.equal(r[0].n,0));
 });
 await check('EDGE-CAST-DOUBLE-SUBMIT',['ADM-09'],'CONTROLLED_TRANSPORT',async()=>{
  await h.rowButton('R82 Admin Movie','Sửa');await fill('textarea[aria-label="Danh sách diễn viên phim"]','[]');fault(`/admin/movies/${f.adminMovie}/actors`,{method:'PUT',delay:700,times:2});const start=t.network.length;await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent==='Lưu diễn viên');b.click();b.click()})()");await pause(1300);assert.equal(t.network.slice(start).filter(n=>n.method==='PUT'&&n.url.endsWith(`/admin/movies/${f.adminMovie}/actors`)).length,1,'Cast emitted duplicate writes');await sqlCheck('SQL-CAST-EMPTY','SELECT COUNT(*) n FROM dbo.PHIM_DIENVIEN WHERE PhimID=@ID;',{ID:f.adminMovie},r=>assert.equal(r[0].n,0));
 });
 await check('EDGE-GRANTS-DOUBLE-SUBMIT',['ADM-05'],'CONTROLLED_TRANSPORT',async()=>{
  await click('Quyền');await until("document.querySelector('input[aria-label=\"Mã vai trò nhận quyền\"]')");const role=(await query("SELECT VaiTroID id FROM dbo.VAITRO WHERE MaVaiTro='CSKH';")).recordset[0].id;
  // Preserve the complete seed grants: submit the actual current set, never clear a live role.
  await fill('input[aria-label="Mã vai trò nhận quyền"]',role);await click('Đọc quyền hiện tại');await until("[...document.querySelectorAll('label')].find(n=>n.innerText.startsWith('QuyenID')).querySelector('input').value!==''");fault(`/admin/roles/${role}/permissions`,{method:'PUT',delay:700,times:2});const start=t.network.length;await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent==='Lưu quyền vai trò');b.click();b.click()})()");await pause(1300);assert.equal(t.network.slice(start).filter(n=>n.method==='PUT'&&n.url.endsWith(`/admin/roles/${role}/permissions`)).length,1,'Role grants emitted duplicate writes');
 });
 await check('EDGE-IMAGE-DOUBLE-CREATE',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
  await click('Ảnh rạp');await until(`document.querySelector('select[aria-label="Chọn rạp"] option[value="${f.adminCinema}"]')`);await fill('select[aria-label="Chọn rạp"]',f.adminCinema);await waitText('R82 cover B');await labeled('URL hoặc đường dẫn ảnh','/favicon.svg');await labeled('Mô tả','R82 Double Image');fault(`/admin/cinemas/${f.adminCinema}/images`,{method:'POST',delay:700,times:2});const start=t.network.length;await double('form.catalog-form button');await pause(1300);assert.equal(t.network.slice(start).filter(n=>n.method==='POST'&&n.url.endsWith(`/admin/cinemas/${f.adminCinema}/images`)).length,1,'Image emitted duplicate creates');await sqlCheck('SQL-IMAGE-DOUBLE-ONCE','SELECT COUNT(*) n FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID AND MoTa=N\'R82 Double Image\';',{ID:f.adminCinema},r=>assert.equal(r[0].n,1));
 });
}

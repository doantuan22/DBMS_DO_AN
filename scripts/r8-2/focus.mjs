import {createJourney} from './journey-fixture.mjs';
export async function run(t){
 const f=await createJourney(t);
 const {assert,check,go,click,until,labeled,evaluate,query,sqlCheck,pause}=t;
 const waitText=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
 await t.login('KHACH_HANG');
 await check('FOCUS-ACTUAL-ELIGIBLE-REVIEW-SETUP',['KH-13'],'REAL_BROWSER_SQL',async()=>{
  await go('/booking/'+f.show);await until("document.querySelector('.seat-button[aria-label^=\"A1 —\"]')");await evaluate("document.querySelector('.seat-button[aria-label^=\"A1 —\"]').click()");await pause(80);await click('Đặt vé');await waitText('Đặt vé thành công.');await click('Thanh toán đơn này');await waitText('Xác nhận thanh toán');await click('Xác nhận thanh toán');await waitText('Đã xác nhận thanh toán thành công.');
  await query('UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(HOUR,-2,dbo.fn_BayGio()),ThoiGianKetThuc=DATEADD(HOUR,-1,dbo.fn_BayGio()) WHERE SuatChieuID=@ID;',{ID:f.show});t.save('focus-clock-fixture.json',{scope:'TEST_ONLY_FIXTURE',operation:'Actual UI-paid owned show moved into SQL-clock past for review eligibility',show:f.show});
  await go('/movies/'+f.movie);await until("document.querySelector('section[aria-labelledby=movie-reviews] button[type=submit]')");await labeled('Nội dung (không bắt buộc)','R82 focused review');await click('Gửi đánh giá');await waitText('Đã gửi đánh giá.');await waitText('R82 focused review');await sqlCheck('SQL-FOCUS-REAL-REVIEW','SELECT SoSao rating,NoiDung content FROM dbo.DANHGIAPHIM WHERE PhimID=@ID AND NguoiDungID=@Owner;',{ID:f.movie,Owner:f.customer},r=>assert.deepEqual(r,[{rating:5,content:'R82 focused review'}]));
 });
 await check('CRITICAL-FOCUS-AFTER-ERROR',['KH-13'],'REAL_BROWSER_SQL',async()=>{
  await pause(200);await evaluate("document.querySelector('section[aria-labelledby=movie-reviews] button[type=submit]').focus()");assert.ok(await evaluate("document.activeElement===document.querySelector('section[aria-labelledby=movie-reviews] button[type=submit]')"));
  await t.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await t.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await waitText('Bạn đã đánh giá phim này.');
  assert.ok(await evaluate("document.activeElement===document.querySelector('section[aria-labelledby=movie-reviews] [role=alert]')"),'Keyboard submit error must receive focus instead of losing focus to body');assert.ok(await evaluate("[...document.querySelectorAll('button')].every(n=>(n.getAttribute('aria-label')||n.innerText).trim())"));
 });
}

import { CDP } from './cdp.mjs';
import { fixtures,persist } from './api.mjs';
import { save } from './collect.mjs';
const cdp=new CDP(),checks=[];
const check=(label,ok,evidence)=>{checks.push({label,status:ok?'PASS':'FAIL',evidence});console.log(`${ok?'PASS':'FAIL'} ${label}`);};
try{
  await cdp.open();await cdp.nav('/login');await cdp.eval('sessionStorage.clear()');await cdp.nav('/login');await cdp.until("!!document.querySelector('input[type=email]')");
  await cdp.set('input[type=email]',fixtures.users.find(u=>u.kind==='browser').email);await cdp.set('input[type=password]',`Audit!${fixtures.runId}987`);await cdp.click('Đăng nhập');await cdp.until("location.pathname!=='/login'");
  await cdp.nav('/complaints');await cdp.until("!!document.querySelector('textarea')");
  await cdp.set('form input', 'AUDIT Browser');await cdp.set('form input[maxlength="200"]',`${fixtures.prefix}_BrowserComplaint`);await cdp.set('textarea','AUDIT browser complaint with own paid order');await cdp.set('form select',String(fixtures.browserNewOrderId));await cdp.click('Gửi khiếu nại');await cdp.until("document.body.innerText.includes('Đã gửi khiếu nại.')");
  check('browser-complaint-created',true);await cdp.snapshot('extra-complaint');
  const detailLink=await cdp.eval(`([...document.querySelectorAll('article')].find(e=>e.textContent.includes(${JSON.stringify(fixtures.prefix+'_BrowserComplaint')}))).querySelector('a').getAttribute('href')`);
  fixtures.browserComplaintId=Number(detailLink.split('/').at(-1));persist();await cdp.nav(detailLink);await cdp.until(`document.body.innerText.includes(${JSON.stringify(fixtures.prefix+'_BrowserComplaint')})`);check('browser-complaint-detail-owned',true);
  await cdp.nav(`/movies/${fixtures.movieId}`);await cdp.until("!!document.querySelector('textarea')");await cdp.set('textarea','AUDIT Browser watched-film review');await cdp.click('Gửi đánh giá');await cdp.until("document.body.innerText.includes('Đã gửi đánh giá.') || document.body.innerText.includes('Bạn chỉ có thể đánh giá')");
  check('browser-watched-review-created',await cdp.eval("document.body.innerText.includes('Đã gửi đánh giá.')"));await cdp.snapshot('extra-review');
  await cdp.click('Gửi đánh giá');await cdp.until("!!document.querySelector('[role=alert]')");check('browser-review-duplicate-denied',await cdp.eval("document.querySelector('[role=alert]').textContent.includes('đã đánh giá')"));
  await cdp.nav(`/booking/${fixtures.browserShowtimeId}`);await cdp.until("document.querySelectorAll('.seat-button').length>0");await cdp.eval("[...document.querySelectorAll('.seat-button')].find(b=>!b.disabled).click()");await cdp.set(`input[aria-label="Số lượng ${fixtures.prefix}_Product"]`,'2');await cdp.set('input[maxlength="50"]',fixtures.prefix.toUpperCase());await cdp.click('Áp dụng');await cdp.until("document.body.innerText.includes('Giảm tạm tính')");check('browser-product-and-promotion-preview',true);
  await cdp.click('Đặt vé');await cdp.until("document.body.innerText.includes('Đặt vé thành công')");const newOrder=await cdp.eval("Number([...document.querySelectorAll('a')].find(a=>a.textContent==='Thanh toán đơn này').getAttribute('href').split('/')[2])");fixtures.orders.push({id:newOrder,owner:35,purpose:'browser-food-and-promotion'});persist();
  const order=await cdp.eval(`fetch('/api/orders/${newOrder}',{headers:{authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')}}).then(r=>r.json()).then(v=>v.order)`);
  check('browser-food-and-discount-persist',order.productTotal===60000&&order.discountTotal>0,order);await cdp.snapshot('extra-food-promo-booking');
}catch(error){save('browser-extra-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}finally{save('browser-extra-checks.json',checks);save('browser-extra-network.json',cdp.events);cdp.ws?.close();}

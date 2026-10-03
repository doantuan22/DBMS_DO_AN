import fs from 'node:fs';
import path from 'node:path';
import { out,save } from './collect.mjs';
import { fixtures,persist,date } from './api.mjs';

class CDP {
  pending=new Map(); next=1; events=[];
  async open(){const target=await (await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();this.ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{this.ws.onopen=resolve;this.ws.onerror=reject;});this.ws.onmessage=e=>{const v=JSON.parse(e.data);if(v.id){const p=this.pending.get(v.id);this.pending.delete(v.id);v.error?p?.reject(Error(JSON.stringify(v.error))):p?.resolve(v.result);}else if(['Network.requestWillBeSent','Network.responseReceived','Runtime.exceptionThrown'].includes(v.method)){if(v.method==='Network.requestWillBeSent'){this.events.push({method:v.method,url:v.params.request.url,httpMethod:v.params.request.method,body:v.params.request.postData?.replace(/"(?:MatKhau|password)":"[^"]*"/g,'"password":"[REDACTED]"')});}else if(v.method==='Network.responseReceived')this.events.push({method:v.method,url:v.params.response.url,status:v.params.response.status});else this.events.push({method:v.method,details:v.params.exceptionDetails.text});}};await this.send('Page.enable');await this.send('Runtime.enable');await this.send('Network.enable');}
  send(method,params={}){return new Promise((resolve,reject)=>{const id=this.next++;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+': '+r.result?.description);return r.result?.value;}
  async nav(route){await this.send('Page.navigate',{url:'http://127.0.0.1:5173'+route});await this.until("document.readyState==='complete'");}
  async until(expression,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.eval(expression))return true;}catch{}await new Promise(r=>setTimeout(r,150));}throw Error(`Browser timeout: ${expression}`);}
  async set(selector,value){return this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');const setter=Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));return true;})()`);}
  async click(text){await this.eval(`(()=>{const b=[...document.querySelectorAll('button'),...document.querySelectorAll('a')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing action: '+${JSON.stringify(text)});b.click();})()`);}
  async snapshot(name){const text=await this.eval('document.body.innerText');save(`browser-${name}.txt`,text);const r=await this.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,`browser-${name}.png`),Buffer.from(r.data,'base64'));return text;}
}

const resumeAdmin=process.argv.includes('--from-admin');
const cdp=new CDP(),checks=resumeAdmin&&fs.existsSync(path.join(out,'browser-checks.json'))?JSON.parse(fs.readFileSync(path.join(out,'browser-checks.json'),'utf8')):[];
const check=(label,ok,evidence)=>{checks.push({label,status:ok?'PASS':'FAIL',evidence});save('browser-checks.json',checks);console.log(`${ok?'PASS':'FAIL'} ${label}`);};
const password=`Audit!${fixtures.runId}987`;
async function signIn(kind){await cdp.nav('/login');await cdp.eval("sessionStorage.clear()");await cdp.nav('/login');await cdp.until("!!document.querySelector('input[type=email]')");await cdp.set('input[type=email]',kind==='admin'?'admin@cinemadb.vn':fixtures.users.find(x=>x.kind===kind).email);await cdp.set('input[type=password]',kind==='admin'?'123456':password);await cdp.click('Đăng nhập');await cdp.until("location.pathname!=='/login'");await cdp.until("!document.body.innerText.includes('Đang khởi tạo phiên')");}
try{
  await cdp.open();save('browser-version.json',await (await fetch('http://127.0.0.1:9223/json/version')).json());
  if(!resumeAdmin){
  await cdp.nav('/cinemas');await cdp.until("document.querySelectorAll('.cinema-card').length>0");
  check('public-cinema-real-cover-and-fallback',await cdp.eval("document.querySelectorAll('.cinema-card img').length>0 && document.querySelectorAll('[aria-label=\"Chưa có ảnh đại diện\"]').length>0"));
  await cdp.snapshot('public-cinemas');
  await signIn('managerA');await cdp.until("document.body.innerText.includes('Phòng hoạt động:')");
  check('manager-ui-real-assignments',await cdp.eval(`document.body.innerText.includes(${JSON.stringify(fixtures.prefix+'_Cinema_A')})`));
  check('manager-ui-showtime-update-exposed',await cdp.eval("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Sửa suất'))"));
  const mgrRoom=fixtures.rooms.find(x=>x.purpose==='manager-ui-tests').id;
  await cdp.eval(`(()=>{const li=[...document.querySelectorAll('li')].find(e=>e.textContent.includes(${JSON.stringify(fixtures.prefix+'_ManagerRoom')}));[...li.querySelectorAll('button')].find(e=>e.textContent==='Ghế').click();})()`);
  await cdp.until(`document.body.innerText.includes('Ghế phòng #${mgrRoom}')`);
  await cdp.eval("(()=>{const section=[...document.querySelectorAll('section')].find(e=>e.querySelector('h2')?.textContent.startsWith('Ghế ')); const form=section.querySelector('form');const row=form.querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(row,'UI');row.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();})()");
  await cdp.until("!!document.querySelector('[role=alert]')");
  const seatErr=await cdp.eval("document.querySelector('[role=alert]').textContent");
  check('manager-ui-seat-create-success',!seatErr.includes('unsupported'),seatErr);await cdp.snapshot('manager-seat-error');
  check('manager-revenue-date-filter-exposed',await cdp.eval("[...document.querySelectorAll('input')].some(e=>e.getAttribute('aria-label')?.includes('Từ ngày'))"));
  await signIn('support');await cdp.until("document.body.innerText.includes('AUDIT')");
  await cdp.eval(`(()=>{const b=[...document.querySelectorAll('li button')].find(e=>e.textContent.includes(${JSON.stringify(fixtures.prefix+'_Complaint')}));b.click();})()`);
  await cdp.until("!!document.querySelector('textarea[aria-label=\"Nội dung xử lý\"]')");
  const beforeText=await cdp.snapshot('support-detail');
  check('support-order-reference-full-details',beforeText.includes('92000')||beforeText.includes('121500')||beforeText.includes('121.500'),beforeText.slice(-1300));
  await cdp.set('textarea[aria-label="Nội dung xử lý"]','AUDIT Browser processing');await cdp.click('Ghi diễn biến');
  await cdp.until("document.body.innerText.includes('AUDIT Browser processing')");check('support-browser-processing-persists',true);
  }
  await signIn('admin');await cdp.until("[...document.querySelectorAll('button')].some(b=>b.textContent==='Ảnh rạp')");await cdp.click('Rạp');await cdp.until("document.querySelectorAll('tbody tr').length>0");
  await cdp.eval(`(()=>{const tr=[...document.querySelectorAll('tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(fixtures.prefix+'_Cinema_A')}));[...tr.querySelectorAll('button')].find(e=>e.textContent==='Sửa').click();})()`);
  await cdp.until("!!document.querySelector('input[aria-label=\"Trạng thái\"]')");
  const status=await cdp.eval("document.querySelector('input[aria-label=\"Trạng thái\"]').value");
  check('admin-cinema-edit-status-initialized',status==='Hoạt động',{value:status});
  await cdp.click('Lưu');await cdp.until("!!document.querySelector('[role=alert]')");await cdp.snapshot('admin-cinema-edit-error');
  await cdp.click('Ảnh rạp');await cdp.until("!!document.querySelector('select')");await cdp.snapshot('admin-images');
  await cdp.set('select[aria-label="Chọn rạp"]',String(fixtures.cinemas[0].id));await cdp.until("document.querySelectorAll('tbody tr').length===3");
  await cdp.click('Sửa');await cdp.click('Lưu');await cdp.until("!!document.querySelector('[role=alert]')");
  const imageError=await cdp.eval("document.querySelector('[role=alert]').textContent");check('admin-image-ui-update-supported',!imageError.includes('unsupported'),imageError);await cdp.snapshot('admin-image-update-error');
  const uiRole=await cdp.eval(`fetch('/api/admin/roles',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')},body:JSON.stringify({code:${JSON.stringify(fixtures.prefix.toUpperCase()+'_UI')},name:${JSON.stringify(fixtures.prefix+'_UiRole')}})}).then(r=>r.json()).then(v=>v.role)`);
  fixtures.uiRoleId=uiRole.VaiTroID;fixtures.other.push({table:'VAITRO',id:uiRole.VaiTroID,purpose:'browser-role-edit'});persist();
  await cdp.eval(`fetch('/api/admin/roles/${uiRole.VaiTroID}/permissions',{method:'PUT',headers:{'content-type':'application/json',authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')},body:JSON.stringify({permissionIds:[1]})}).then(r=>r.json())`);
  await cdp.click('Vai trò');await cdp.until(`document.body.innerText.includes(${JSON.stringify(fixtures.prefix+'_UiRole')})`);
  const selectUiRole=async()=>cdp.eval(`(()=>{const tr=[...document.querySelectorAll('tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(fixtures.prefix+'_UiRole')}));[...tr.querySelectorAll('button')].find(e=>e.textContent==='Sửa').click();})()`);
  await selectUiRole();await cdp.until("document.querySelector('input[aria-label=\"QuyenID cần gán\"]')?.value==='1'");
  await cdp.set('input[aria-label="Tên vai trò"]',fixtures.prefix+'_UiRoleRenamed');await cdp.click('Lưu');await cdp.until("document.body.innerText.includes('Đã lưu thay đổi.')");
  const roleNow=await cdp.eval(`fetch('/api/admin/roles',{headers:{authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')}}).then(r=>r.json()).then(v=>v.roles.find(r=>r.VaiTroID===${uiRole.VaiTroID}))`);
  check('admin-role-name-edit-persists',roleNow.TenVaiTro===fixtures.prefix+'_UiRoleRenamed',roleNow);
  await selectUiRole();await cdp.until("document.querySelector('input[aria-label=\"QuyenID cần gán\"]')?.value==='1'");await cdp.set('input[aria-label="QuyenID cần gán"]','');await cdp.click('Lưu');await cdp.until("!!document.querySelector('[role=alert]')");
  check('admin-ui-can-clear-role-permissions',false,await cdp.eval("document.querySelector('[role=alert]').textContent"));await cdp.snapshot('admin-role-permission-error');
  check('admin-config-absent',!await cdp.eval("document.body.innerText.includes('Cấu hình hệ thống')"));
  // Complete a new customer flow using the rendered Register/Login/Booking/Payment screens.
  await cdp.nav('/register');await cdp.eval('sessionStorage.clear()');await cdp.nav('/register');await cdp.until("!!document.querySelector('input[autocomplete=name]')");
  const email=`audit.${fixtures.runId}.browser@example.invalid`;
  await cdp.set('input[autocomplete=name]',`${fixtures.prefix}_Browser`);await cdp.set('input[type=email]',email);await cdp.set('input[type=password]',password);await cdp.click('Tạo tài khoản');await cdp.until("location.pathname==='/login'");check('browser-registration-completed',true);
  fixtures.users.push({kind:'browser',email,role:'KHACH_HANG',createdVia:'browser'});persist();
  await cdp.set('input[type=email]',email);await cdp.set('input[type=password]',password);await cdp.click('Đăng nhập');await cdp.until("location.pathname==='/'");check('browser-customer-login-completed',true);
  const me=await cdp.eval("fetch('/api/auth/me',{headers:{authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')}}).then(r=>r.json()).then(v=>({id:v.user?.userId,role:v.user?.role}))");fixtures.users.find(x=>x.kind==='browser').id=me.id;persist();
  await cdp.nav('/profile');await cdp.until("!!document.querySelector('input[type=date]')");check('browser-profile-loaded',await cdp.eval(`document.body.innerText.includes(${JSON.stringify('Hồ sơ cá nhân')})`));
  await cdp.nav(`/movies/${fixtures.movieId}`);await cdp.until("document.body.innerText.includes('Chọn suất') || document.body.innerText.includes('Xem ghế') || document.body.innerText.includes('Lịch chiếu')");await cdp.snapshot('customer-movie-detail');
  await cdp.nav(`/booking/${fixtures.browserShowtimeId}`);await cdp.until("document.querySelectorAll('.seat-button').length>0");
  await cdp.eval("[...document.querySelectorAll('.seat-button')].find(b=>!b.disabled && !b.textContent.startsWith('A14')).click()");
  await cdp.click('Đặt vé');await cdp.until("document.body.innerText.includes('Đặt vé thành công')");
  const bookingLink=await cdp.eval("[...document.querySelectorAll('a')].find(a=>a.textContent==='Thanh toán đơn này').getAttribute('href')");fixtures.browserNewOrderId=Number(bookingLink.split('/')[2]);fixtures.orders.push({id:fixtures.browserNewOrderId,owner:me.id,purpose:'browser-customer-full-flow'});persist();check('browser-seat-and-booking-persisted',true);
  await cdp.click('Thanh toán đơn này');await cdp.until("document.body.innerText.includes('Tạo giao dịch thanh toán')");await cdp.click('Tạo giao dịch thanh toán');await cdp.until("document.body.innerText.includes('Mô phỏng thành công')");await cdp.click('Mô phỏng thành công');await cdp.until("document.body.innerText.includes('Trạng thái đơn: Đã thanh toán')");check('browser-payment-completed',true);await cdp.snapshot('customer-payment');
  await cdp.nav('/orders');await cdp.until(`document.body.innerText.includes('#${fixtures.browserNewOrderId}')`);check('browser-order-history-visible',true);
  await cdp.nav(`/orders/${fixtures.browserNewOrderId}`);await cdp.until("document.body.innerText.includes('Đã thanh toán')");check('browser-order-detail-visible',true);await cdp.snapshot('customer-order-detail');
  await cdp.nav('/complaints');await cdp.until("!!document.querySelector('form')");await cdp.snapshot('customer-complaints');
  await cdp.nav('/admin');await cdp.until("location.pathname==='/forbidden'");check('customer-direct-admin-route-denied',true);
}catch(error){save('browser-error.txt',error.stack);try{await cdp.snapshot('blocker');}catch{}console.error(error.message);process.exitCode=1;}
finally{save('browser-checks.json',checks);if(resumeAdmin&&fs.existsSync(path.join(out,'browser-network.json')))save('browser-network.json',[...JSON.parse(fs.readFileSync(path.join(out,'browser-network.json'),'utf8')),...cdp.events]);else save('browser-network.json',cdp.events);cdp.ws?.close();}

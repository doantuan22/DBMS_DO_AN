import { CDP } from './cdp.mjs';
import {fixtures,persist,date} from './api.mjs';
import {save} from './collect.mjs';
const cdp=new CDP(),checks=[];
const check=(label,ok,evidence)=>{checks.push({label,status:ok?'PASS':'FAIL',evidence});console.log(`${ok?'PASS':'FAIL'} ${label}`);};
try{
  await cdp.open();await cdp.nav('/login');await cdp.eval('sessionStorage.clear()');await cdp.nav('/login');await cdp.until("!!document.querySelector('input[type=email]')");await cdp.set('input[type=email]','admin@cinemadb.vn');await cdp.set('input[type=password]','123456');await cdp.click('Đăng nhập');await cdp.until("location.pathname==='/admin'");
  for(const [tab,id] of [['Tài khoản',28],['Rạp',40],['Phòng',35],['Ghế',273],['Phim',14],['Sản phẩm',12],['Khuyến mãi',17],['Bảng giá',21],['Suất chiếu',60]]){
    await cdp.click(tab);await cdp.until(`[...document.querySelectorAll('tbody tr')].some(r=>r.querySelector('td')?.textContent===${JSON.stringify(String(id))})`);
    await cdp.eval(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.querySelector('td')?.textContent===${JSON.stringify(String(id))});if(!row)throw Error('Own fixture row absent');[...row.querySelectorAll('button')].find(b=>['Sửa','Trạng thái'].includes(b.textContent)).click();})()`);
    await cdp.until("!!document.querySelector('input[aria-label=\"Trạng thái\"]')");
    const value=await cdp.eval("document.querySelector('input[aria-label=\"Trạng thái\"]').value");check(`admin-${tab}-edit-status-loaded`,Boolean(value),{id,value});
  }
  for(const [tab,path,idName,nameLabel,codeLabel] of [['Thể loại','genres','TheLoaiID','Tên thể loại',null],['Quyền','permissions','QuyenID','Tên quyền','Mã quyền']]){
    const name=fixtures.prefix+'_Browser'+path;
    await cdp.click(tab);await cdp.until(`!!document.querySelector('input[aria-label=${JSON.stringify(nameLabel)}]')`);await cdp.set(`input[aria-label="${nameLabel}"]`,name);if(codeLabel)await cdp.set(`input[aria-label="${codeLabel}"]`,(fixtures.prefix+'_BROWSER').toUpperCase());await cdp.click('Lưu');await cdp.until(`document.body.innerText.includes(${JSON.stringify(name)}) && document.body.innerText.includes('Đã lưu thay đổi.')`);check(`browser-admin-${path}-create`,true);
    const id=await cdp.eval(`fetch('/api/admin/${path}',{headers:{authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')}}).then(r=>r.json()).then(v=>v.${path}.find(x=>x.${path==='genres'?'TenTheLoai':'TenQuyen'}===${JSON.stringify(name)}).${idName})`);fixtures.other.push({table:path==='genres'?'THELOAI':'QUYEN',id,purpose:'browser-crud'});persist();
    await cdp.eval(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.querySelector('td')?.textContent===${JSON.stringify(String(id))});[...row.querySelectorAll('button')].find(b=>b.textContent==='Sửa').click();})()`);await cdp.set(`input[aria-label="${nameLabel}"]`,name+'_Renamed');await cdp.click('Lưu');await cdp.until(`document.body.innerText.includes(${JSON.stringify(name+'_Renamed')})`);check(`browser-admin-${path}-update`,true);
    await cdp.eval(`(()=>{window.confirm=()=>true;const row=[...document.querySelectorAll('tbody tr')].find(r=>r.querySelector('td')?.textContent===${JSON.stringify(String(id))});[...row.querySelectorAll('button')].find(b=>b.textContent==='Xóa').click();})()`);await cdp.until(`!document.body.innerText.includes(${JSON.stringify(name+'_Renamed')}) && document.body.innerText.includes('Đã xóa.')`);check(`browser-admin-${path}-delete`,true);fixtures.other.find(o=>o.id===id&&o.purpose==='browser-crud').deleted=true;persist();
  }
  await cdp.click('Doanh thu');await cdp.until("!!document.querySelector('input[type=date]')");await cdp.set('input[type=date]',date(-1));await cdp.set('label:nth-child(2) input[type=date]',date());await cdp.click('Lọc doanh thu');await cdp.until("document.querySelectorAll('tbody tr').length>0");check('browser-admin-revenue-date-filter',true);await cdp.snapshot('admin-extra-revenue');
}catch(error){save('browser-admin-extra-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}finally{save('browser-admin-extra-checks.json',checks);save('browser-admin-extra-network.json',cdp.events);cdp.ws?.close();}

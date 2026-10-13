// Actual React event handlers; the captured payloads are also exercised against SQL by R4 integration.
export async function testR4Pages() {
  const {RESOURCE_STATUSES}=await import('../../shared/resourceContract.mjs');
  const inventory=(await (await fetch('/__r4-inventory')).json()).forms;
  const [{default:React},{createRoot},{flushSync},{MemoryRouter},{AuthContext},{default:Admin},{default:Manager},{default:Images},{ADMIN_SECTION_PERMISSIONS}]=await Promise.all([
    import('react'),import('react-dom/client'),import('react-dom'),import('react-router-dom'),import('/src/context/AuthContext.jsx'),import('/src/pages/AdminPortal.jsx'),import('/src/pages/ManagerPortal.jsx'),import('/src/components/CinemaImageManager.jsx'),import('/src/utils/authorization.js'),
  ]);
  const box=document.createElement('div');document.body.append(box);const root=createRoot(box),oldFetch=window.fetch,checks=[],calls=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,status:'PASS'});};
  const wait=async fn=>{const end=Date.now()+10000;while(!fn()){if(Date.now()>end)throw Error('R4 browser timeout '+box.innerText);await new Promise(r=>setTimeout(r,20));}};
  const settle=()=>new Promise(r=>setTimeout(r,40));
  const button=text=>[...box.querySelectorAll('button')].find(b=>b.textContent===text);
  const buttons=text=>[...box.querySelectorAll('button')].filter(b=>b.textContent===text);
  const set=async(node,value)=>{Object.getOwnPropertyDescriptor(node instanceof HTMLSelectElement?HTMLSelectElement.prototype:node instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event(node instanceof HTMLSelectElement?'change':'input',{bubbles:true}));await settle();};
  const actor=role=>({role,permissions:[...Object.values(ADMIN_SECTION_PERMISSIONS),'XULY_KHIEUNAI','TRA_CUU_DON'].map(code=>({code}))});let renderId=0;
  const render=(Component,user=actor('ADMIN'),extra={})=>flushSync(()=>root.render(React.createElement(AuthContext.Provider,{key:++renderId,value:{user,...extra}},React.createElement(MemoryRouter,null,React.createElement(Component)))));
  const labels={users:'Tài khoản',roles:'Vai trò',permissions:'Quyền',assignments:'Phân công',cinemas:'Rạp',rooms:'Phòng',seats:'Ghế',movies:'Phim',genres:'Thể loại',actors:'Diễn viên',products:'Sản phẩm',promotions:'Khuyến mãi',pricing:'Bảng giá',showtimes:'Suất chiếu'};
  let delayRoute=null,release=null;
  const images=[{HinhAnhRapID:1,URL:'/old.svg',MoTa:'Cover note',ThuTuHienThi:0,TrangThai:'Hoạt động',LaAnhDaiDien:true},{HinhAnhRapID:2,URL:'/other.svg',MoTa:'Other note',ThuTuHienThi:2,TrangThai:'Tạm ẩn',LaAnhDaiDien:false}];
  window.fetch=async(url,opts={})=>{
    const route=new URL(url,location.href).pathname,method=opts.method??'GET',body=opts.body?JSON.parse(opts.body):undefined;calls.push({route,method,body});let data={};
    const key=route.split('/')[3],entry=inventory.find(e=>e.key===key);
    if(route==='/api/manager/cinemas')data={cinemas:[{id:1,name:'R4 cinema',city:'R4'}]};
    else if(route==='/api/manager/rooms/1/seats')data={seats:[],seat:{id:1}};
    else if(route.endsWith('/images'))data={images};
    else if(route==='/api/admin/dashboard')data={dashboard:{}};
    else if(route==='/api/admin/complaints')data={complaints:[{id:1,title:'R4 complaint',status:'Mới'}]};
    else if(route==='/api/admin/complaints/1')data={complaint:{id:1,title:'R4 complaint',content:'R4',type:'Hỗ trợ',status:'Mới',processings:[]}};
    else if(route.endsWith('/order-reference'))data={order:null};
    else if(route.endsWith('/permissions')&&key==='roles')data={permissions:[{QuyenID:1}]};
    else if(entry){const row2={...entry.row};for(const [name,,kind,col] of entry.fields){if(kind==='text'&&name!=='status'&&name!=='type'&&name!=='format'&&name!=='discountType')row2[col]='Second row';}row2[Object.keys(entry.row).find(k=>k.endsWith('ID'))]=999;data={[key]:[entry.row,row2]};}
    if(route===delayRoute)await new Promise(resolve=>{release=resolve;});
    return new Response(JSON.stringify(data),{status:200});
  };
  try {
    for(const entry of inventory){
      calls.length=0;render(Admin);await wait(()=>button(labels[entry.key]));button(labels[entry.key]).click();
      await wait(()=>buttons(entry.key==='users'?'Trạng thái':'Sửa').length===2);
      buttons(entry.key==='users'?'Trạng thái':'Sửa')[0].click();await settle();
      const form=[...box.querySelectorAll('form')].find(f=>f.querySelector('h3')?.textContent==='Cập nhật');check(entry.key+' edit form exists',Boolean(form));
      for(const [name,label,kind] of entry.fields){const input=[...form.querySelectorAll('input,select')].find(i=>i.getAttribute('aria-label')===label),expected=entry.payload[name];
        check(entry.key+' hydration '+name,Boolean(input)&&((kind==='datetime-local'&&new Date(expected).getTime()===new Date(input.value+'+07:00').getTime())||(kind==='csv'&&input.value===(expected??[]).join(','))||(kind==='number'&&Number(input.value)===expected)||(kind!=='datetime-local'&&kind!=='csv'&&kind!=='number'&&input.value===(expected??''))));
      }
      check(entry.key+' edit only allowed fields',form.querySelectorAll('input,select').length===entry.fields.length);
      if(RESOURCE_STATUSES[entry.key]&&entry.fields.some(([name])=>name==='status')){
        const status=form.querySelector('[aria-label="Trạng thái"]');
        check('R5 BUG002 '+entry.key+' options match DB enum',JSON.stringify([...status.options].map(o=>o.value).filter(Boolean))===JSON.stringify(RESOURCE_STATUSES[entry.key]));
      }
      button('Bỏ chọn').click();await settle();check(entry.key+' cancel sends no mutation',!calls.some(c=>c.method!=='GET'));
      buttons(entry.key==='users'?'Trạng thái':'Sửa')[1].click();await settle();
      buttons(entry.key==='users'?'Trạng thái':'Sửa')[0].click();await settle();
      const selectedForm=[...box.querySelectorAll('form')].find(f=>f.querySelector('h3')?.textContent==='Cập nhật');
      selectedForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait(()=>calls.some(c=>c.method==='PUT'));
      const write=calls.find(c=>c.method==='PUT');check(entry.key+' exact update endpoint',write.route===entry.route.replace('/admin/','/api/admin/'));
      check(entry.key+' exact payload after row switch',JSON.stringify(write.body)===JSON.stringify(entry.payload));
      if(entry.key==='roles')check('BUG007 metadata save never sends grants',!calls.some(c=>c.method==='PUT'&&c.route.endsWith('/permissions')));
    }
    calls.length=0;render(Admin);await wait(()=>button('Vai trò'));delayRoute='/api/admin/roles';button('Vai trò').click();await wait(()=>release);
    button('Rạp').click();await wait(()=>buttons('Sửa').length===2);delayRoute=null;release();release=null;await settle();
    const headers=[...box.querySelectorAll('th')].map(node=>node.textContent.replaceAll(' ',''));
    check('BUG006 late list response cannot overwrite current resource',headers.includes('RapID')&&!headers.includes('VaiTroID'));
    buttons('Sửa')[0].click();await settle();button('Vai trò').click();await wait(()=>buttons('Sửa').length===2);check('BUG006 resource switch clears selection',!button('Bỏ chọn'));
    calls.length=0;render(Manager,{role:'QUAN_LY_RAP',permissions:[{code:'QL_GHE'}]});await wait(()=>button('Tải ghế'));
    await set(box.querySelector('[aria-label="Mã phòng xem ghế"]'),'1');button('Tải ghế').click();await wait(()=>button('Tạo ghế'));
    await set(box.querySelector('[aria-label="Mã phòng xem ghế"]'),'999'); // The create form belongs to the loaded room.
    button('Tạo ghế').click();await wait(()=>calls.some(c=>c.method==='POST'));
    const seat=calls.find(c=>c.method==='POST');check('BUG004 Manager loaded room and exact body',seat.route==='/api/manager/rooms/1/seats'&&JSON.stringify(seat.body)===JSON.stringify({row:'Z',number:1,type:'Thường'}));
    calls.length=0;render(Images);await wait(()=>box.querySelectorAll('select option').length>1);await set(box.querySelector('select'),box.querySelectorAll('select option')[1].value);await wait(()=>buttons('Sửa').length===2);
    buttons('Sửa')[0].click();await settle();check('BUG005 edit checkbox hidden',!box.querySelector('input[type="checkbox"]'));
    const editForm=box.querySelector('form');check('BUG005 image hydration',editForm.querySelectorAll('input')[0].value==='/old.svg'&&editForm.querySelector('select').value==='Hoạt động');
    button('Bỏ chọn').click();await settle();check('BUG005 cancel no mutation',!calls.some(c=>c.method!=='GET'));
    buttons('Sửa')[0].click();await settle();button('Lưu').click();await wait(()=>calls.some(c=>c.method==='PUT'));
    check('BUG005 metadata body excludes cover',JSON.stringify(calls.find(c=>c.method==='PUT').body)===JSON.stringify({url:'/old.svg',description:'Cover note',displayOrder:0,status:'Hoạt động'}));
    await wait(()=>button('Chọn đại diện'));button('Chọn đại diện').click();await wait(()=>calls.some(c=>c.method==='PATCH'));
    check('BUG005 cover separate API',calls.find(c=>c.method==='PATCH').route.endsWith('/2/cover'));
    calls.length=0;render(Admin);await wait(()=>button('Quyền'));button('Quyền').click();await wait(()=>button('Lưu quyền vai trò'));
    await set(box.querySelector('[aria-label="Mã vai trò nhận quyền"]'),'5');button('Lưu quyền vai trò').click();await wait(()=>calls.some(c=>c.method==='PUT'));
    check('BUG007 grant-only payload',calls.find(c=>c.method==='PUT').route==='/api/admin/roles/5/permissions'&&JSON.stringify(calls.find(c=>c.method==='PUT').body)==='{"permissionIds":[]}');
    delayRoute='/api/admin/roles/5/permissions';button('Đọc quyền hiện tại').click();await wait(()=>release);await set(box.querySelector('[aria-label="Mã vai trò nhận quyền"]'),'6');delayRoute=null;release();release=null;await settle();
    check('BUG006 changing role clears stale permission response',button('Lưu quyền vai trò').closest('form').querySelectorAll('input')[1].value==='');
    calls.length=0;render(Admin);await wait(()=>button('Phim'));button('Phim').click();await wait(()=>buttons('Sửa').length===2);buttons('Sửa')[0].click();await wait(()=>button('Lưu diễn viên'));
    button('Lưu diễn viên').click();await wait(()=>calls.some(c=>c.method==='PUT'));
    check('movie cast separate edit contract',calls.find(c=>c.method==='PUT').route.endsWith('/actors')&&Array.isArray(calls.find(c=>c.method==='PUT').body.cast));
    calls.length=0;render(Admin);await wait(()=>button('Khiếu nại'));button('Khiếu nại').click();await wait(()=>[...box.querySelectorAll('button')].some(b=>b.textContent.startsWith('Mở khiếu nại')));
    [...box.querySelectorAll('button')].find(b=>b.textContent.startsWith('Mở khiếu nại')).click();await wait(()=>button('Cập nhật trạng thái'));
    button('Cập nhật trạng thái').click();await wait(()=>calls.some(c=>c.method==='PUT'));check('complaint status edit contract',JSON.stringify(calls.find(c=>c.method==='PUT').body)==='{"status":"Đang xử lý"}');
    await wait(()=>button('Ghi diễn biến'));await set(box.querySelector('textarea'),'R4 processing');button('Ghi diễn biến').click();await wait(()=>calls.some(c=>c.method==='POST'));check('complaint processing edit contract',calls.find(c=>c.method==='POST').body.content==='R4 processing');
    const {default:Register}=await import('/src/pages/auth/Register.jsx');let registration;
    render(Register,null,{register:async body=>{registration=body;}});
    await set(box.querySelector('input[autocomplete="name"]'),'R4 Unicode');await set(box.querySelector('input[type="email"]'),'r4-browser@example.test');await set(box.querySelector('input[type="password"]'),'🙂🙂');
    box.querySelector('form').requestSubmit();await wait(()=>registration);
    check('BUG014 registration accepts byte-valid Unicode without character minLength',registration.MatKhau==='🙂🙂');
    return {status:'PASS',checks,genericEditForms:inventory.length,additionalEditForms:['cinema image','role grants','movie cast','complaint status','complaint processing']};
  }finally{root.unmount();box.remove();window.fetch=oldFetch;}
}

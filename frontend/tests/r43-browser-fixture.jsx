// Real Admin form -> HTTP -> Backend -> SQL; launched only by guarded offline tooling.
export async function testR43Pricing(pricingId,cinemaId){
 const [{default:React},{createRoot},{default:AdminPortal},{AuthContext},{authTokenStorage}]=await Promise.all([import('react'),import('react-dom/client'),import('/src/pages/AdminPortal.jsx'),import('/src/context/AuthContext.jsx'),import('/src/api/authToken.js')]);
 const originalFetch=window.fetch,calls=[],checks=[],box=document.createElement('div');document.body.append(box);const root=createRoot(box);
 const check=(name,condition)=>{if(!condition)throw Error(`${name}: ${box.textContent}`);checks.push({name,status:'PASS'});};
 const wait=async fn=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('Timeout: '+box.textContent);await new Promise(r=>setTimeout(r,30));}};
 const button=text=>[...box.querySelectorAll('button')].find(b=>b.textContent===text);
 const edit=()=>[...box.querySelectorAll('tbody tr')].find(tr=>tr.firstElementChild.textContent===String(pricingId))?.querySelector('button');
 const change=async(label,value)=>{const node=box.querySelector(`[aria-label="${label}"]`);if(!node)throw Error('Missing '+label);Object.getOwnPropertyDescriptor(node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));await new Promise(r=>setTimeout(r,50));};
 window.fetch=async(url,options={})=>{const response=await originalFetch(url,options);calls.push({route:new URL(url,location.href).pathname,method:options.method??'GET',status:response.status,...(options.body?{body:JSON.parse(options.body)}:{})});return response;};
 try{
  const login=await originalFetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'admin@cinemadb.vn',MatKhau:'123456'})});if(!login.ok)throw Error('Login failed');authTokenStorage.set((await login.json()).token);
  const user=(await(await originalFetch('/api/auth/me',{headers:{Authorization:'Bearer '+authTokenStorage.get()}})).json()).user;
  root.render(React.createElement(AuthContext.Provider,{value:{user}},React.createElement(AdminPortal)));
  await wait(()=>button('Bảng giá'));button('Bảng giá').click();await wait(()=>edit());edit().click();await wait(()=>button('Bỏ chọn'));
  check('hydrates all seven persisted fields',Object.entries({'Phụ thu':'15000','Loại ghế':'VIP','Loại ngày':'Tất cả','Định dạng':'Tất cả','Ngày bắt đầu':window.r43StartsOn,'Ngày kết thúc':'','Trạng thái':'Áp dụng'}).every(([label,value])=>box.querySelector(`[aria-label="${label}"]`)?.value===value));
  check('cinema immutable during edit',!box.querySelector('[aria-label="Mã rạp"]'));
  check('three official day choices',[...box.querySelector('[aria-label="Loại ngày"]').options].slice(1).map(x=>x.value).join('|')==='Ngày thường|Cuối tuần|Tất cả');
  for(const [label,value] of [['Phụ thu','25000'],['Loại ghế','Thường'],['Loại ngày','Cuối tuần'],['Định dạng','IMAX'],['Ngày bắt đầu','2031-01-01'],['Ngày kết thúc','2031-12-31'],['Trạng thái','Tạm dừng']])await change(label,value);
  const getsBefore=calls.filter(c=>c.route==='/api/admin/pricing'&&c.method==='GET').length;button('Lưu').click();await wait(()=>box.querySelector('[role="status"]'));await wait(()=>edit()&&calls.filter(c=>c.route==='/api/admin/pricing'&&c.method==='GET').length>getsBefore);
  const saved=calls.filter(c=>c.method==='PUT').at(-1);
  check('real full PUT succeeds with exact seven-field payload',saved.status===200&&JSON.stringify(saved.body)===JSON.stringify({surcharge:25000,seatType:'Thường',dayType:'Cuối tuần',format:'IMAX',startsOn:'2031-01-01',endsOn:'2031-12-31',status:'Tạm dừng'}));
  edit().click();await wait(()=>button('Bỏ chọn'));check('reload hydrates saved date and dimensions',box.querySelector('[aria-label="Ngày kết thúc"]').value==='2031-12-31'&&box.querySelector('[aria-label="Định dạng"]').value==='IMAX');
  await change('Ngày kết thúc','');button('Lưu').click();await wait(()=>!button('Bỏ chọn')&&edit());
  check('clearing end date sends explicit NULL',calls.filter(c=>c.method==='PUT').at(-1).body.endsOn===null);
  edit().click();await wait(()=>button('Bỏ chọn'));await change('Trạng thái','Áp dụng');button('Lưu').click();await wait(()=>box.querySelector('[role="alert"]'));
  check('real overlap shows conflict without false success',calls.filter(c=>c.method==='PUT').at(-1).status===409&&!box.querySelector('[role="status"]'));
  check('rejected form remains editable',!!button('Bỏ chọn')&&!button('Lưu').disabled&&box.querySelector('[aria-label="Trạng thái"]').value==='Áp dụng');
  await change('Trạng thái','Tạm dừng');button('Lưu').click();await wait(()=>!button('Bỏ chọn')&&edit());check('valid retry succeeds and reloads',calls.filter(c=>c.method==='PUT').at(-1).status===200);
  const response=await originalFetch(`/api/admin/pricing?cinemaId=${cinemaId}`,{headers:{Authorization:'Bearer '+authTokenStorage.get()}}),rows=(await response.json()).pricing;
  const actual=rows.find(r=>r.GiaID===pricingId);check('persisted read after failure and retry',actual.TrangThai==='Tạm dừng'&&actual.NgayKetThuc===null&&actual.PhuThu===25000&&actual.LoaiGhe==='Thường');
  return{status:'PASS',checks,calls,actual};
 }finally{root.unmount();box.remove();authTokenStorage.clear();window.fetch=originalFetch;}
}

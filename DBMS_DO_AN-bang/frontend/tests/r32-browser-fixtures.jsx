// Supplementary UI evidence; authoritative history rules are tested in real SQL/API.
export async function testR32Pages(){
 const [{default:React},client,{default:AdminPortal},{default:ManagerPortal},{AuthContext}]=await Promise.all([import('react'),import('react-dom/client'),import('/src/pages/AdminPortal.jsx'),import('/src/pages/ManagerPortal.jsx'),import('/src/context/AuthContext.jsx')]);
 const {createRoot}=client.default??client,originalFetch=window.fetch,checks=[],calls=[];
 for(const role of ['admin','manager'])for(const kind of ['show','seat']){
  const box=document.createElement('div');document.body.append(box);const root=createRoot(box);
  let show={id:7,movieId:9,movieTitle:'R32 historical movie',roomId:3,roomName:'R32 room',cinemaId:2,startsAt:'2035-10-08T05:00:00.123Z',endsAt:'2035-10-08T06:30:00.123Z',format:'2D',basePrice:80000,status:'Mở bán'},seat={id:4,roomId:3,label:'A1',row:'A',number:1,type:'VIP',status:'Hoạt động'};
  const rawShow=()=>({SuatChieuID:show.id,PhimID:show.movieId,TenPhim:show.movieTitle,PhongID:3,TenPhong:'R32 room',RapID:2,ThoiGianBatDau:show.startsAt,ThoiGianKetThuc:show.endsAt,DinhDang:show.format,GiaVeCoBan:show.basePrice,TrangThai:show.status}),rawSeat=()=>({GheID:4,PhongID:3,TenGhe:'A1',LoaiGhe:seat.type,TrangThai:seat.status});
  const check=(name,condition)=>{if(!condition)throw Error(`${role}/${kind}/${name}: ${box.textContent}`);checks.push({name:`${role}/${kind}/${name}`,status:'PASS'});};
  const wait=async fn=>{const end=Date.now()+10000;while(!fn()){if(Date.now()>end)throw Error(`Timeout ${role}/${kind}: ${box.textContent}`);await new Promise(r=>setTimeout(r,25));}};
  const button=text=>[...box.querySelectorAll('button')].find(b=>b.textContent===text),settle=()=>new Promise(r=>setTimeout(r,60));
  const change=async (label,value)=>{const node=box.querySelector(`[aria-label="${label}"]`);if(!node)throw Error('Missing '+label);Object.getOwnPropertyDescriptor(node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));await settle();};
  window.fetch=async(url,options={})=>{
   const route=new URL(url,location.href).pathname,body=options.body?JSON.parse(options.body):undefined,method=options.method??'GET';calls.push({role,kind,route,method,body});
   if(method==='PUT'){
    const conflict=kind==='show'?body.basePrice!==80000:body.type!=='VIP';
    if(conflict)return new Response(JSON.stringify({error:{code:kind==='show'?'SHOWTIME_HAS_ORDERS':'SEAT_HAS_TICKET_HISTORY',message:'Historical conflict.'}}),{status:409});
    if(kind==='show')show={...show,...body};else seat={...seat,...body};return new Response(JSON.stringify(kind==='show'?{showtime:show}:{seat}),{status:200});
   }
   const result=route.endsWith('/cinemas')?{cinemas:[{id:2,name:'R32 cinema',city:'HCM'}]}:route.endsWith('/rooms')?{rooms:[{id:3,name:'R32 room',type:'2D',status:'Hoạt động',seatCount:1}]}:route.endsWith('/showtimes')?{showtimes:[role==='admin'?rawShow():show]}:route.endsWith('/seats')?{seats:[role==='admin'?rawSeat():seat]}:{};
   return new Response(JSON.stringify(result),{status:200});
  };
  try{
   const permissions=(kind==='show'?['QL_SUAT_CHIEU']:role==='manager'?['QL_GHE','QL_PHONG']:['QL_GHE']).map(code=>({code}));
   root.render(React.createElement(AuthContext.Provider,{value:{user:{userId:1,role:role==='admin'?'ADMIN':'QUAN_LY_RAP',permissions}}},React.createElement(role==='admin'?AdminPortal:ManagerPortal)));
   if(role==='manager'&&kind==='seat'){await wait(()=>button('Tải ghế'));await change('Mã phòng xem ghế','3');button('Tải ghế').click();}
   const edit=role==='admin'?'Sửa':kind==='show'?'Sửa suất':'Sửa ghế';await wait(()=>button(edit));button(edit).click();await wait(()=>button('Bỏ chọn'));
   check('hydrates persisted values',kind==='show'?box.querySelector('[aria-label="Giá vé cơ bản"]').value==='80000':box.querySelector('[aria-label="Loại ghế"]').value==='VIP');
   await change(kind==='show'?'Giá vé cơ bản':'Loại ghế',kind==='show'?'90000':'Thường');button('Lưu').click();await wait(()=>box.querySelector('[role="alert"]'));
   check('friendly rejection without false success',box.textContent.includes(kind==='show'?'lịch sử đơn':'lịch sử vé')&&!box.querySelector('[role="status"]'));
   check('rejected input remains editable',box.querySelector(`[aria-label="${kind==='show'?'Giá vé cơ bản':'Loại ghế'}"]`).value===(kind==='show'?'90000':'Thường')&&!button('Lưu').disabled);
   check('persisted display and metadata unchanged',show.basePrice===80000&&seat.type==='VIP'&&(role==='admin'?box.querySelector('tbody').textContent.includes(kind==='show'?'80000':'VIP'):box.querySelector(`[aria-label="${kind==='show'?'Suất chiếu':'Ghế'}"] ul`).textContent.includes(kind==='show'?'80000':'VIP')));
   const getBefore=calls.filter(c=>c.role===role&&c.kind===kind&&c.method==='GET').length;
   await change(kind==='show'?'Giá vé cơ bản':'Loại ghế',kind==='show'?'80000':'VIP');await change('Trạng thái',kind==='show'?'Đóng bán':'Bảo trì');button('Lưu').click();await wait(()=>box.querySelector('[role="status"]'));await wait(()=>calls.filter(c=>c.role===role&&c.kind===kind&&c.method==='GET').length>getBefore);await settle();
   check('valid operational retry saves and reloads',kind==='show'?show.status==='Đóng bán':seat.status==='Bảo trì');
   const last=calls.filter(c=>c.role===role&&c.kind===kind&&c.method==='PUT').at(-1);check('complete payload preserves identity and has no room transfer',kind==='show'?last.body.basePrice===80000&&last.body.movieId===9&&!Object.hasOwn(last.body,'roomId')&&last.body.startsAt===show.startsAt:last.body.type==='VIP');
  }finally{root.unmount();box.remove();}
 }
 window.fetch=originalFetch;return{status:'PASS',checks,calls};
}

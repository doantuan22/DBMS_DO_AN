// Supplemental UI regression with controlled HTTP timing; business evidence uses real SQL/API.
export async function testR22Pages() {
 const [{default:React},client,router,{default:Booking},{AuthContext}]=await Promise.all([
  import('react'),import('react-dom/client'),import('react-router-dom'),import('/src/pages/BookingPreparation.jsx'),import('/src/context/AuthContext.jsx')]);
 const {createRoot}=client.default??client,{MemoryRouter,Routes,Route}=router;
 const originalFetch=window.fetch,box=document.createElement('div');document.body.append(box);const root=createRoot(box),calls=[],checks=[];
 const check=(name,value)=>{if(!value)throw Error(name+': '+box.textContent);checks.push({name,status:'PASS'});};
 const wait=async predicate=>{const until=Date.now()+10000;while(!predicate()){if(Date.now()>until)throw Error('UI timeout: '+box.textContent);await new Promise(r=>setTimeout(r,25));}};
 const settle=()=>new Promise(r=>setTimeout(r,80));
 const button=text=>[...box.querySelectorAll('button')].find(b=>b.textContent===text);
 const set=async(input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));await settle();};
 const seat=n=>box.querySelector(`[aria-label="A${n} — Trống"]`);
 const show={id:7,movieId:1,movieTitle:'Promotion UI',cinemaName:'Cinema',roomName:'Room',format:'2D',startsAt:new Date(Date.now()+86400000).toISOString()};
 let releasePreview,delayed=false;
 window.fetch=async(url,options={})=>{
  const route=new URL(url,location.href).pathname,body=options.body?JSON.parse(options.body):null;calls.push({route,body});
  let payload={};
  if(route==='/api/showtimes/7')payload=show;
  else if(route.endsWith('/seats'))payload={seats:[1,2].map(id=>({id,label:'A'+id,row:'A',number:id,price:80000,status:'Trống',type:'Thường'}))};
  else if(route==='/api/products')payload={products:[{id:3,name:'Snack',price:10000}]};
  else if(route==='/api/promotions/validate'){
   if(delayed)await new Promise(resolve=>{releasePreview=resolve;});
   payload={promotion:{isValid:true,code:body.promotionCode,discountAmount:1000,message:'PREVIEW_RESULT_'+body.promotionCode}};
  }else if(route==='/api/bookings')return new Response(JSON.stringify({error:{code:'PROMOTION_NOT_AVAILABLE',message:'Promotion changed'}}),{status:409});
  return new Response(JSON.stringify(payload),{status:200});
 };
 try{
  root.render(React.createElement(AuthContext.Provider,{value:{user:{role:'KHACH_HANG',permissions:[{code:'DAT_VE'}]}}},
   React.createElement(MemoryRouter,{initialEntries:['/booking/7']},React.createElement(Routes,null,React.createElement(Route,{path:'/booking/:showtimeId',element:React.createElement(Booking)})))));
  await wait(()=>seat(1));seat(1).click();await settle();
  const input=box.querySelector('input[maxlength="50"]');await set(input,'OLD');
  for(const change of ['code','seat','food']){
   delayed=true;releasePreview=null;button('Áp dụng').click();await wait(()=>releasePreview);
   if(change==='code')await set(input,'NEW');
   else if(change==='seat'){seat(2).click();await settle();}
   else{const qty=box.querySelector('input[type="number"]');await set(qty,'1');}
   releasePreview();await wait(()=>button('Áp dụng')&&!button('Áp dụng').disabled);await settle();
   check('stale preview ignored after '+change,!box.textContent.includes('PREVIEW_RESULT_'));
  }
  delayed=false;button('Áp dụng').click();await wait(()=>box.textContent.includes('PREVIEW_RESULT_NEW'));
  check('preview shown as provisional',box.textContent.includes('kết quả')||box.textContent.includes('tạm tính'));
  // A preview in flight must not overwrite a booking rejection with a valid badge.
  delayed=true;releasePreview=null;button('Áp dụng').click();await wait(()=>releasePreview);
  button('Đặt vé').click();await wait(()=>box.textContent.includes('Khuyến mãi không còn khả dụng'));
  releasePreview();await wait(()=>button('Áp dụng')&&!button('Áp dụng').disabled);await settle();
  check('no booking success',!box.textContent.includes('Đặt vé thành công'));
  check('requested code preserved for review',input.value==='NEW');
  check('price review message',box.textContent.includes('kiểm tra lại giá và đơn'));
  check('stale preview cannot overwrite rejection',!box.textContent.includes('PREVIEW_RESULT_'));
  const bookings=calls.filter(c=>c.route==='/api/bookings');check('one submit and no full-price retry',bookings.length===1&&bookings[0].body.promotionCode==='NEW');
  check('selection preserved for explicit review',seat(1).getAttribute('aria-pressed')==='true');
  return{checks,calls,status:'PASS'};
 }finally{root.unmount();box.remove();window.fetch=originalFetch;}
}

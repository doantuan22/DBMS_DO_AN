// Supplementary real UI proof: existing BookingPreparation/PaymentPage, no HTTP mocks.
export async function testR44Ownership(f){
 const [{default:React},{createRoot},{MemoryRouter,Routes,Route},{default:Booking},{default:Payment},{AuthContext},{authTokenStorage}]=await Promise.all([import('react'),import('react-dom/client'),import('react-router-dom'),import('/src/pages/BookingPreparation.jsx'),import('/src/pages/PaymentPage.jsx'),import('/src/context/AuthContext.jsx'),import('/src/api/authToken.js')]);
 const originalFetch=window.fetch,box=document.createElement('div');document.body.append(box);let root=createRoot(box);const calls=[],checks=[];
 const wait=async fn=>{const end=Date.now()+15000;while(!fn()){if(Date.now()>end)throw Error('Timeout: '+box.textContent);await new Promise(r=>setTimeout(r,30));}};
 const check=(name,condition)=>{if(!condition)throw Error(name+': '+box.textContent);checks.push({name,status:'PASS'});};
 const button=text=>[...box.querySelectorAll('button')].find(node=>node.textContent===text);
 const set=async(node,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,70));};
 async function login(email){const r=await originalFetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:email,MatKhau:'123456'})});if(!r.ok)throw Error('Login');return (await r.json()).token;}
 async function admin(route,body){const r=await originalFetch('/api/admin/'+route,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+adminToken},body:JSON.stringify(body)});if(!r.ok)throw Error('Fixture edit '+JSON.stringify(await r.json()));}
 let adminToken;
 window.fetch=async(url,options={})=>{const r=await originalFetch(url,options),payload=await r.clone().json();calls.push({route:new URL(url,location.href).pathname,method:options.method??'GET',status:r.status,...(options.body?{body:JSON.parse(options.body)}:{}),response:payload});return r;};
 try{
  const token=await login('khachhang1@gmail.com');adminToken=await login('admin@cinemadb.vn');authTokenStorage.set(token);
  const user=(await(await originalFetch('/api/auth/me',{headers:{Authorization:'Bearer '+token}})).json()).user;
  const render=(component,route,path)=>root.render(React.createElement(AuthContext.Provider,{value:{user}},React.createElement(MemoryRouter,{initialEntries:[route]},React.createElement(Routes,null,React.createElement(Route,{path,element:React.createElement(component)})))));
  render(Booking,`/booking/${f.show}`,'/booking/:showtimeId');
  await wait(()=>box.querySelector('[aria-label="A1 — Trống"]'));box.querySelector('[aria-label="A1 — Trống"]').click();await new Promise(r=>setTimeout(r,80));
  await wait(()=>box.querySelector('[aria-label="Số lượng R21 API"]'));
  await set(box.querySelector('[aria-label="Số lượng R21 API"]'),'1');await set(box.querySelector('input[maxlength="50"]'),f.code);button('Áp dụng').click();
  await wait(()=>box.textContent.includes('Giảm tạm tính'));
  const quote=calls.find(c=>c.route==='/api/promotions/validate').response.promotion;
  check('valid real preview clearly provisional',quote.isValid&&quote.provisionalSubtotal===90000&&quote.discountAmount===1000&&box.textContent.includes('mã sẽ được kiểm tra lại khi đặt vé'));
  await admin(`promotions/${f.promotion}`,{...f.promotionBody,status:'Tạm dừng'});button('Đặt vé').click();await wait(()=>box.textContent.includes('Khuyến mãi không còn khả dụng'));
  check('stale preview rejected without success or automatic full-price retry',calls.filter(c=>c.route==='/api/bookings').length===1&&calls.find(c=>c.route==='/api/bookings').status===409&&!box.textContent.includes('Đặt vé thành công')&&!box.querySelector('a[href*="/payment"]'));
  check('invalidated promotion requires explicit review',!box.textContent.includes('Giảm tạm tính')&&box.querySelector('input[maxlength="50"]').value===f.code);
  await admin(`promotions/${f.promotion}`,f.promotionBody);
  await admin(`products/${f.product}`,{name:'R21 API',type:'Snack',price:12000,description:null,image:null,status:'Đang bán'});
  button('Áp dụng').click();await wait(()=>box.textContent.includes('Giảm tạm tính'));
  const latestQuote=calls.filter(c=>c.route==='/api/promotions/validate').at(-1).response.promotion;check('new preview reads current DB prices',latestQuote.provisionalSubtotal===92000);
  await admin(`products/${f.product}`,{name:'R21 API',type:'Snack',price:14000,description:null,image:null,status:'Đang bán'});
  button('Đặt vé').click();await wait(()=>box.textContent.includes('Đặt vé thành công'));const created=calls.filter(c=>c.route==='/api/bookings').at(-1),booking=created.response.booking;
  check('booking final amount replaces old preview',created.status===201&&booking.total===93000&&box.textContent.includes('93.000')&&latestQuote.provisionalSubtotal-latestQuote.discountAmount===91000);
  check('booking payload contains only IDs quantities and code',Object.keys(created.body).sort().join('|')==='products|promotionCode|seatIds|showtimeId');
  root.unmount();box.replaceChildren();root=createRoot(box);render(Payment,`/orders/${booking.id}/payment`,'/orders/:orderId/payment');
  await wait(()=>button('Xác nhận thanh toán')&&!button('Xác nhận thanh toán').disabled);
  check('payment page displays authoritative order amount',box.textContent.includes('Database chốt tổng thanh toán')&&box.textContent.includes('93.000'));
  button('Xác nhận thanh toán').click();await wait(()=>box.textContent.includes('Đã xác nhận thanh toán thành công'));
  const attempt=calls.find(c=>c.route===`/api/orders/${booking.id}/payments`);
  check('payment amount comes from stored order without client money',JSON.stringify(attempt.body)===JSON.stringify({paymentMethod:'VNPAY'})&&attempt.response.payment.amount===93000);
  return{status:'PASS',checks,calls,booking,preview:latestQuote};
 }finally{root.unmount();box.remove();authTokenStorage.clear();window.fetch=originalFetch;}
}

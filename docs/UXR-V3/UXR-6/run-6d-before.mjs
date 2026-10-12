import assert from 'node:assert/strict';
import { createEnvironment } from './test-environment.mjs';
const e=await createEnvironment({browser:true,baseline:true,phase:'6D-before'}); let error;
try {
 const order=(await e.api(5,'GET','/orders')).orders[0]; assert.ok(order);
 const complaint=(await e.api(5,'GET','/complaints')).complaints[0]; assert.ok(complaint);
 for (const [name,actor,path,ready] of [['orders',5,'/orders',"Boolean(document.querySelector('.catalog-card'))"],['order',5,`/orders/${order.id}`,"document.body.textContent.includes('Lịch sử thanh toán')"],['payment',5,`/orders/${order.id}/payment`,"document.body.textContent.includes('Lịch sử giao dịch')"],['profile',5,'/profile',"Boolean(document.querySelector('input[readonly]'))"],['login',0,'/login',"Boolean(document.querySelector('input[type=password]'))"],['register',0,'/register',"Boolean(document.querySelector('input[type=password]'))"],['complaints',5,'/complaints',"Boolean(document.querySelector('textarea'))"],['complaint',5,`/complaints/${complaint.id}`,"document.body.textContent.includes('Lịch sử xử lý')"]]) {
  await e.navigate(actor,path,'',ready); for(const width of [390,768,1280,1440,1920]) { e.pass(`${name} before ${width}px`,await e.resize(width,false)); await e.screenshot(`6D-${name}-${width}`); }
 }
}catch(failure){error=failure;}
await e.close('6D-before.json',error);

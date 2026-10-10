import {createJourney} from './journey-fixture.mjs';
import {helpers} from './journey-helpers.mjs';
import {customer} from './customer.mjs';
export async function run(t){const f=await createJourney(t),h=helpers(t);await customer(t,h,f);await states(t,h,f);}
export async function states(t,h,f){
 const {assert,check,go,navigate,until,pause,fault,evaluate,sqlCheck,query}=t;
 const b=(await query("SELECT TOP(1) KhieuNaiID id,TieuDe title FROM dbo.KHIEUNAI WHERE DonDatVeID IS NULL ORDER BY KhieuNaiID;")).recordset[0];
 await check('EDGE-COMPLAINT-LATE-DETAIL',['KH-14'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/complaints');await until("document.querySelector('h1')?.textContent==='Khiếu nại của tôi'");fault('/complaints/'+f.complaint,{delay:800});await navigate('/complaints/'+f.complaint);await pause(140);await navigate('/complaints/'+b.id);await until(`document.querySelector('h1')?.textContent===${JSON.stringify(b.title)}`);await pause(1000);assert.equal(await evaluate("document.querySelector('h1').textContent"),b.title,'Late complaint A overwrites B');
 });
 await check('EDGE-ORDER-LATE-DETAIL',['KH-12'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/orders');await until("document.querySelector('h1')?.textContent==='Đơn đặt vé của tôi'");fault('/orders/'+f.order,{delay:800});await navigate('/orders/'+f.order);await pause(140);await navigate('/orders/'+f.pendingOrder);await until(`document.querySelector('.catalog-eyebrow')?.textContent==='ĐƠN #${f.pendingOrder}'`);await pause(1000);assert.equal(await evaluate("document.querySelector('.catalog-eyebrow').textContent"),'ĐƠN #'+f.pendingOrder,'Late order A overwrites B');
 });
 await check('EDGE-PAYMENT-LATE-READ',['KH-10'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/orders');await until("document.querySelector('h1')?.textContent==='Đơn đặt vé của tôi'");fault('/orders/'+f.order,{delay:800});await navigate('/orders/'+f.order+'/payment');await pause(140);await navigate('/orders/'+f.pendingOrder+'/payment');await until(`document.querySelector('h1')?.textContent==='Đơn #${f.pendingOrder}'`);await pause(1000);assert.equal(await evaluate("document.querySelector('h1').textContent"),'Đơn #'+f.pendingOrder,'Late paid order A overwrites pending payment B');
 });
 await check('EDGE-PAYMENT-DOUBLE-SUBMIT',['KH-10'],'CONTROLLED_TRANSPORT',async()=>{
  await go('/orders/'+f.pendingOrder+'/payment');await until("[...document.querySelectorAll('button')].some(n=>n.textContent==='Xác nhận thanh toán'&&!n.disabled)");fault('/orders/'+f.pendingOrder+'/payments',{method:'POST',delay:700,times:2});
  await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent==='Xác nhận thanh toán');b.click();b.click()})()");await pause(1600);
  await sqlCheck('SQL-PAYMENT-DOUBLE-ONCE','SELECT COUNT(*) attempts,SUM(CASE WHEN TrangThai=N\'Thành công\' THEN 1 ELSE 0 END) successes FROM dbo.THANHTOAN WHERE DonDatVeID=@ID;',{ID:f.pendingOrder},r=>{assert.equal(r[0].attempts,1,'Immediate double click created multiple payment attempts');assert.equal(r[0].successes,1);});assert.ok((await t.visible()).includes('Đã xác nhận thanh toán thành công.'));
 });
}

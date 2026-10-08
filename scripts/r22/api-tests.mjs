import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,env,root,connect,snapshot,summarize,write,evidenceRoot } from './common.mjs';
import { createFixture,cleanupFixture,state,cleanSession } from '../r21/fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const url=`http://127.0.0.1:${server.address().port}/api`,tokens={},fixtures=[];
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',requests:[],cases:[],concurrency:[]};
async function api(role,method,route,body,expected) {
 const startedAt=new Date().toISOString();
 const response=await fetch(url+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const result=await response.json();evidence.requests.push({role,method,route,startedAt,completedAt:new Date().toISOString(),status:response.status,expected,...(result.error?{error:result.error}:{})});
 assert.ok((Array.isArray(expected)?expected:[expected]).includes(response.status),`${route}: ${JSON.stringify(result)}`);
 if(result.error)assert.ok(!/dbo\.|nvarchar|SELECT|THROW|stack|connection/i.test(JSON.stringify(result.error)));
 return{status:response.status,data:result};
}
async function fixture(){const f=await createFixture(pool);fixtures.push(f);return f;}
const body=f=>({showtimeId:f.show,seatIds:f.seats.slice(0,2),products:[{productId:f.product,quantity:1}],promotionCode:f.code});
const adminBody=(row,delta={})=>({description:row.MoTa,discountType:row.LoaiGiamGia,discountValue:Number(row.GiaTriGiam),minimumOrder:Number(row.DonHangToiThieu),maximumDiscount:row.GiamToiDa==null?null:Number(row.GiamToiDa),startsAt:row.NgayBatDau.toISOString(),endsAt:row.NgayKetThuc.toISOString(),quantity:row.SoLuong,status:row.TrangThai,...delta});
async function preview(f,expectedValid=true){const initial=await state(pool,f),r=await api('customer','POST','/promotions/validate',body(f),200);assert.equal(r.data.promotion.isValid,expectedValid);assert.deepEqual(await state(pool,f),initial);return r.data.promotion;}
try {
 const before=await snapshot(pool);
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['customer2','khachhang2@gmail.com'],['admin','admin@cinemadb.vn']]) tokens[role]=(await api(role,'POST','/auth/login',{Email:email,MatKhau:'123456'},200)).data.token;
 const cases=[
  ['valid-fixed',null,1000],['no-promotion',null,0],
  ['valid-percent-max',row=>({discountType:'PERCENT',discountValue:10,maximumDiscount:5000}),5000],
  ['minimum-equality',row=>({minimumOrder:170000}),1000],
  ['preview-stale-paused',row=>({status:'Tạm dừng'}),null],
  ['preview-stale-expired-time',row=>({endsAt:new Date(row.NgayBatDau.getTime()+1000).toISOString()}),null],
  ['preview-stale-start-in-future',row=>({startsAt:new Date(row.NgayKetThuc.getTime()-1000).toISOString()}),null],
  ['preview-stale-minimum',row=>({minimumOrder:170000.01}),null],
  ['preview-stale-value-recalculate',row=>({discountValue:2000}),2000],
  ['preview-stale-type-recalculate',row=>({discountType:'PERCENT',discountValue:10}),17000],
  ['preview-stale-max-recalculate',row=>({discountType:'PERCENT',discountValue:10,maximumDiscount:3000}),3000],
  ['exhausted-quota',async(f)=>pool.request().query(`UPDATE dbo.KHUYENMAI SET SoLuongDaDung=SoLuong WHERE KhuyenMaiID=${f.promotion}`),null],
  ['unknown-code',null,null],['preview-stale-deleted',async f=>api('admin','DELETE',`/admin/promotions/${f.promotion}`,null,200),null],
 ];
 for(const [name,change,discount] of cases){
  const f=await fixture();const p=await preview(f);assert.equal(p.discountAmount,1000);
  if(change){if(change.constructor.name==='AsyncFunction')await change(f);else await api('admin','PUT',`/admin/promotions/${f.promotion}`,adminBody((await state(pool,f)).promotion[0],change((await state(pool,f)).promotion[0])),200);}
  const request=body(f);if(name==='no-promotion')delete request.promotionCode;if(name==='unknown-code')request.promotionCode='R22-MISSING';
  const initial=await state(pool,f),reply=await api('customer','POST','/bookings',request,discount===null?409:201),final=await state(pool,f);
  if(discount===null){assert.equal(reply.data.error.code,'PROMOTION_NOT_AVAILABLE');assert.deepEqual(final,initial);assert.equal(final.orders.length,0);}
  else{assert.equal(final.orders.length,1);assert.equal(final.tickets.length,2);assert.equal(final.foods.length,1);assert.equal(Number(final.orders[0].TienGiamGia),discount);assert.equal(reply.data.booking.total,170000-discount);assert.equal(final.promotion[0].SoLuongDaDung,name==='no-promotion'?0:1);}
  evidence.cases.push({name,preview:p,initial,reply:reply.data,final,status:'PASS'});await cleanupFixture(pool,f);
 }
 // Both preview the final quota. Separate parents/shows/seats avoid a seat/room race
 // masking the promotion outcome; HTTP requests run against the real API/database.
 const f=await fixture(),g=await fixture();g.code=f.code;
 await pool.request().query(`UPDATE dbo.KHUYENMAI SET SoLuong=1 WHERE KhuyenMaiID=${f.promotion}`);
 const previews=await Promise.all([api('customer','POST','/promotions/validate',body(f),200),api('customer2','POST','/promotions/validate',body(g),200)]);assert.ok(previews.every(r=>r.data.promotion.isValid));
 const initial={a:await state(pool,f),b:await state(pool,g)};
 const replies=await Promise.all([api('customer','POST','/bookings',body(f),[201,409]),api('customer2','POST','/bookings',body(g),[201,409])]);
 assert.equal(replies.filter(r=>r.status===201).length,1);assert.equal(replies.find(r=>r.status===409).data.error.code,'PROMOTION_NOT_AVAILABLE');
 const final={a:await state(pool,f),b:await state(pool,g)};assert.equal(final.a.promotion[0].SoLuongDaDung,1);assert.equal(final.a.orders.length+final.b.orders.length,1);assert.equal(final.a.tickets.length+final.b.tickets.length,2);assert.equal(final.a.foods.length+final.b.foods.length,1);
 evidence.concurrency.push({name:'last-quota-two-real-HTTP-requests',promotionId:f.promotion,code:f.code,customers:[f.users[0],g.users[1]],previews:previews.map(r=>r.data.promotion),initial,replies,final,session:await cleanSession(pool),status:'PASS'});
 await cleanupFixture(pool,g);await cleanupFixture(pool,f);
 const group=[];for(let i=0;i<4;i++)group.push(await fixture());for(const h of group)h.code=group[0].code;
 await pool.request().query(`UPDATE dbo.KHUYENMAI SET SoLuong=2 WHERE KhuyenMaiID=${group[0].promotion}`);
 const multi=await Promise.all(group.map((h,i)=>api(i%2?'customer2':'customer','POST','/bookings',body(h),[201,409])));
 assert.equal(multi.filter(r=>r.status===201).length,2);assert.ok(multi.filter(r=>r.status===409).every(r=>r.data.error.code==='PROMOTION_NOT_AVAILABLE'));
 const states=await Promise.all(group.map(h=>state(pool,h)));assert.equal(states.reduce((n,s)=>n+s.orders.length,0),2);assert.equal(states[0].promotion[0].SoLuongDaDung,2);
 evidence.concurrency.push({name:'quota-two-four-requests',quota:2,replies:multi,final:states,status:'PASS'});for(const h of [...group].reverse())await cleanupFixture(pool,h);
 const spoof=await fixture();const stable=await state(pool,spoof);
 for(const field of ['discountAmount','finalTotal','previewTotal','remainingQuota','isValid']){const result=await api('customer','POST','/bookings',{...body(spoof),[field]:1},400);assert.equal(result.data.error.code,'UNKNOWN_REQUEST_FIELD');assert.deepEqual(await state(pool,spoof),stable);}
 await cleanupFixture(pool,spoof);
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.cleanup='PASS';evidence.status='PASS';
} catch(error){evidence.status='FAIL';evidence.error={message:error.message,number:error.number};throw error;}
finally {for(const f of [...fixtures].reverse())await cleanupFixture(pool,f);evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'api-tests.json'),evidence);await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}
console.log(`PASS real promotion API: ${evidence.requests.length} requests,${evidence.cases.length} cases,${evidence.concurrency.length} quota races; preview read-only and no state/schema leak.`);

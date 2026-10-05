// Additional final races and mid-transaction failures; disposable fixture only.
import crypto from 'node:crypto';
import {credentials} from '../db/lib.mjs';
import {assert,path,root,fixture,fixtures,connect,ask,sql,mainSnapshot,save,load} from './common.mjs';
const database=fixture(fixtures[0]);Object.assign(process.env,credentials(),{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database),server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},users={},prefix='R8TX-'+crypto.randomUUID().slice(0,8),checks=[],rollbacks=[];
const raw=async(route,{actor='manager',method='GET',body}={})=>{const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});return{status:res.status,data:await res.json()};};
const api=async(route,options={},status=200)=>{const res=await raw(route,options);assert.equal(res.status,status,route+' '+res.data.error?.code);return res.data;};
const check=(name,condition,invariant)=>{assert.ok(condition,name);checks.push({name,status:'PASS',invariant});save('concurrency-final.json',{status:'RUNNING',database,checks});};
const query=async(source,values={})=>{const request=pool.request();for(const [key,value]of Object.entries(values))request.input(key,typeof value==='number'?sql.Int:sql.NVarChar(sql.MAX),value);return(await request.query(source)).recordset;};
let trigger;
async function failure(name,table,event,operation){
 trigger='trg_R8_InjectFailure';await ask(pool,`CREATE TRIGGER dbo.[${trigger}] ON dbo.[${table}] AFTER ${event} AS BEGIN SET NOCOUNT ON; THROW 59992,'R8 intentional transaction failure',1; END;`);
 try{const before=(await mainSnapshot(pool)).data;await operation();assert.deepEqual((await mainSnapshot(pool)).data,before,name+' all 27 table fingerprints unchanged');rollbacks.push({name,status:'PASS',invariant:'All 27 table fingerprints identical; no partial rows/counters/history updates'});save('rollback-final.json',{status:'RUNNING',database,checks:rollbacks});}
 finally{await ask(pool,`DROP TRIGGER dbo.[${trigger}];`);trigger=null;}
}
try{
 for(const [actor,email]of [['admin','admin@cinemadb.vn'],['manager','manager.q1@cinemadb.vn'],['support','cskh@cinemadb.vn']]){const login=await api('/auth/login',{actor:'public',method:'POST',body:{Email:email,MatKhau:'123456'}});tokens[actor]=login.token;users[actor]=login.user;}
 for(let i=0;i<4;i++){const actor='c'+i,email=prefix+'-'+i+'@example.invalid';await api('/auth/register',{actor:'public',method:'POST',body:{HoTen:prefix,Email:email,MatKhau:'R8TxFixturePass!'}},201);const login=await api('/auth/login',{actor:'public',method:'POST',body:{Email:email,MatKhau:'R8TxFixturePass!'}});tokens[actor]=login.token;users[actor]=login.user;}
 const room=(await api('/manager/cinemas/1/rooms',{method:'POST',body:{name:prefix,type:'2D'}},201)).room.id,seats=[];
 for(let n=1;n<=20;n++)seats.push((await api(`/manager/rooms/${room}/seats`,{method:'POST',body:{row:'TX',number:n,type:'Thường'}},201)).seat.id);
 let nextShow=0;const showInput=()=>{const start=new Date(Date.now()+(100+nextShow++)*86400000);return{movieId:1,roomId:room,startsAt:start.toISOString(),endsAt:new Date(+start+166*60000).toISOString(),format:'2D',basePrice:100000};};
 const newShow=async()=>{const input=showInput();return{input,id:(await api('/manager/showtimes',{method:'POST',body:input},201)).showtime.id};};
 const show=await newShow();const promotionBody={code:prefix.toUpperCase(),discountType:'Phần trăm',discountValue:10,minimumOrder:0,startsAt:new Date(Date.now()-86400000).toISOString(),endsAt:new Date(Date.now()+200*86400000).toISOString(),quantity:1};
 const promo=(await api('/admin/promotions',{actor:'admin',method:'POST',body:promotionBody},201)).promotion.KhuyenMaiID;
 const raceShows=[show,await newShow()];
 const race=await Promise.all(['c0','c1'].map((actor,i)=>raw('/bookings',{actor,method:'POST',body:{showtimeId:raceShows[i].id,seatIds:[seats[i]],products:[{productId:1,quantity:1}],promotionCode:promotionBody.code}})));
 assert.ok(race.every(result=>result.status===201));assert.equal(race.filter(result=>result.data.booking.discountTotal>0).length,1);
 const winning=race.findIndex(result=>result.data.booking.discountTotal>0),actor='c'+winning,order=race[winning].data.booking.id,paidShow=raceShows[winning].id;
 const usage=(await query('SELECT SoLuongDaDung AS used,(SELECT COUNT(*) FROM dbo.DONDATVE WHERE KhuyenMaiID=@ID) AS orders FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@ID',{ID:promo}))[0];
 check('Promotion last quantity race across distinct showtimes',usage.used===1&&usage.orders===1,'Exactly one order consumes last unit; other booking has zero discount and NULL promotion under existing fallback contract');
 const points=async user=>(await query('SELECT DiemTichLuy AS points FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID',{ID:users[user].userId}))[0].points;
 const attempt=(await api(`/orders/${order}/payments`,{actor,method:'POST',body:{paymentMethod:'MOMO'}},201)).payment.id,beforePoints=await points(actor);
 const paymentRace=await Promise.all(Array.from({length:8},()=>raw(`/orders/${order}/payments/${attempt}/result`,{actor,method:'POST',body:{status:'Thành công'}})));
 assert.ok(paymentRace.every(result=>result.status===200));
 const paymentHistory=(await query('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID ORDER BY ThanhToanID',{ID:order}));
 check('Concurrent duplicate payment result/retry',paymentHistory.length===1&&await points(actor)===beforePoints+Math.floor(Number(paymentHistory[0].SoTien)/1000),'Idempotent retries return 200; one payment row and exactly one earned-point credit');
 const beforeCancel=await points(actor);const cancellation=await Promise.all(Array.from({length:8},()=>raw(`/manager/showtimes/${paidShow}/cancel`,{method:'POST',body:{reason:'R8 concurrent cancel'}})));
 assert.ok(cancellation.every(result=>result.status===200));const ledger=(await query('SELECT DiemBoiThuong FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID=@ID',{ID:order}));
 check('Concurrent showtime cancel and compensation retry',ledger.length===1&&await points(actor)===beforeCancel+ledger[0].DiemBoiThuong,'UNIQUE order ledger; credit once only');assert.deepEqual(await query('SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID ORDER BY ThanhToanID',{ID:order}),paymentHistory);
 check('Cancelled paid show preserves payment history',true,'Every payment row identical; no refund/history rewrite');
 const complaint=(await api('/complaints',{actor,method:'POST',body:{type:'R8 TX',title:prefix,content:'Concurrent history',orderId:order}},201)).complaint.id;
 const processing=await Promise.all(Array.from({length:12},(_,i)=>raw(`/support/complaints/${complaint}/processings`,{actor:'support',method:'POST',body:{content:prefix+' event '+i,nextStatus:'Đang xử lý'}})));
 assert.ok(processing.every(result=>result.status===201));const events=await query('SELECT XuLyID,NoiDungXuLy FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID',{ID:complaint});check('Complaint concurrent processing',events.length===12&&new Set(events.map(e=>e.NoiDungXuLy)).size===12,'All 12 distinct events retained; no lost processing history');
 const cinema=(await api('/admin/cinemas',{actor:'admin',method:'POST',body:{name:prefix,address:'R8 fixture',city:'R8'}},200)).cinema.RapID;
 const startsOn=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}),assignmentBody={userId:users.manager.userId,cinemaId:cinema,startsOn,endsOn:null};
 const assignments=await Promise.all(Array.from({length:16},()=>raw('/admin/assignments',{actor:'admin',method:'POST',body:assignmentBody})));
 assert.equal(assignments.filter(result=>result.status===200).length,1);assert.ok(assignments.every(result=>[200,409].includes(result.status)));check('Manager assignment duplicate create',((await query('SELECT COUNT(*) AS rows FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@User AND RapID=@Cinema',{User:users.manager.userId,Cinema:cinema}))[0].rows)===1,'16 creates -> one row, 15 conflicts');
 const failingShow=await newShow();const bookingBody={showtimeId:failingShow.id,seatIds:[seats[4]],products:[{productId:1,quantity:1}]};
 await failure('Booking child insert rollback','CHITIETDOAN','INSERT',()=>api('/bookings',{actor:'c2',method:'POST',body:bookingBody},500));
 await failure('Customer/profile registration rollback','HOSOKHACHHANG','INSERT',()=>api('/auth/register',{actor:'public',method:'POST',body:{HoTen:prefix,Email:prefix+'-failure@example.invalid',MatKhau:'R8TxFixturePass!'}},500));
 const rollbackOrder=(await api('/bookings',{actor:'c2',method:'POST',body:bookingBody},201)).booking.id;const rollbackPayment=(await api(`/orders/${rollbackOrder}/payments`,{actor:'c2',method:'POST',body:{paymentMethod:'MOMO'}},201)).payment.id;
 await failure('Payment history and profile points rollback','HOSOKHACHHANG','UPDATE',()=>api(`/orders/${rollbackOrder}/payments/${rollbackPayment}/result`,{actor:'c2',method:'POST',body:{status:'Thành công'}},500));
 await api(`/orders/${rollbackOrder}/payments/${rollbackPayment}/result`,{actor:'c2',method:'POST',body:{status:'Thành công'}});
 await failure('Cancel ledger/profile/order/show rollback','HOSOKHACHHANG','UPDATE',()=>api(`/manager/showtimes/${failingShow.id}/cancel`,{method:'POST',body:{reason:'Injected R8 failure'}},500));
 await failure('Complaint processing/status rollback','XULY_KHIEUNAI','INSERT',()=>api(`/support/complaints/${complaint}/processings`,{actor:'support',method:'POST',body:{content:'Injected R8 failure',nextStatus:'Đã giải quyết'}},500));
 await failure('Assignment row rollback','PHANCONG_RAP','INSERT',()=>api('/admin/assignments',{actor:'admin',method:'POST',body:{...assignmentBody,startsOn:'2038-01-01'}},500));
 const pricing=(await api('/manager/cinemas/1/pricing',{method:'POST',body:{seatType:'Đôi',dayType:'Ngày lễ',format:'4DX',surcharge:1234,startsOn:'2038-01-01',endsOn:'2038-01-01'}},201)).pricing.id;
 await failure('Pricing update rollback','BANGGIA','UPDATE',()=>api(`/manager/pricing/${pricing}`,{method:'PUT',body:{surcharge:4321,status:'Tạm dừng'}},500));
 await failure('Showtime insert rollback','SUATCHIEU','INSERT',()=>api('/manager/showtimes',{method:'POST',body:showInput()},500));
 const before=(await mainSnapshot(pool)).data,tx=new sql.Transaction(pool);await tx.begin();try{await new sql.Request(tx).input('NguoiDungID',sql.Int,users.support.userId).input('KhieuNaiID',sql.Int,complaint).input('NoiDungXuLy',sql.NVarChar(sql.MAX),'Caller rollback event').input('TrangThaiSauXuLy',sql.NVarChar(50),'Đang xử lý').execute('dbo.sp_Support_Complaint_AddProcessing');await tx.rollback();}catch(error){await tx.rollback().catch(()=>{});throw error;}assert.deepEqual((await mainSnapshot(pool)).data,before);rollbacks.push({name:'Complaint caller transaction rollback',status:'PASS',invariant:'All 27 data fingerprints identical after outer rollback'});
 const prior=load('regression-concurrency.json');assert.ok(prior.every(result=>result.code===0));save('concurrency-final.json',{status:'PASS',database,checks,existingSuites:prior,assignmentUpdateEvidence:'legacy-reruns/supplemental.json',r2CancelPaymentEvidence:'r1-r2/integration.json'});
 save('rollback-final.json',{status:'PASS',database,checks:rollbacks,priorPhaseEvidence:['r1-r2/integration.json','legacy-reruns/r5-integration.json','legacy-reruns/supplemental.json']});console.log(`PASS final races ${checks.length}; injected rollback paths ${rollbacks.length}; all final DB invariants checked.`);
}catch(error){save('transactions-error.json',{status:'FAIL',error:error.message,checks,rollbacks});throw error;}
finally{if(trigger)await ask(pool,`DROP TRIGGER dbo.[${trigger}];`);await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}

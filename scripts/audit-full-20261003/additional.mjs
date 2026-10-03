import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fixtures,checks,transcript,check,call,must,persist,login,adminLogin,date,finish } from './api.mjs';
import { out,save } from './collect.mjs';
const p=fixtures.prefix;
const resume=process.argv.includes('--resume');
if(resume){checks.push(...JSON.parse(fs.readFileSync(path.join(out,'additional-checks.json'),'utf8')));transcript.push(...JSON.parse(fs.readFileSync(path.join(out,'additional-transcript.json'),'utf8')));}
try {
  const admin=await adminLogin(),a=await login('customerA'),b=await login('customerB'),m=await login('managerA');
  const seat=fixtures.seats.filter(s=>s.roomId===fixtures.rooms[0].id).map(s=>s.id);
  if(!resume){
  // Every mutation targets the recorded audit fixtures. No direct INSERT/UPDATE is used.
  const longPassword='Audit!'+ 'x'.repeat(67);
  const email=`audit.${fixtures.runId}.longpassword@example.invalid`;
  const user=await call('admin-73-byte-password-create','POST','/admin/users',admin,{name:`${p}_LongPassword`,email,password:longPassword,roleId:3});
  if(user.body?.user){fixtures.users.push({kind:'longpassword',id:user.body.user.NguoiDungID,email,role:'CSKH',purpose:'password-boundary'});persist();}
  const longLogin=await call('admin-created-original-password-login','POST','/auth/login',null,{Email:email,MatKhau:longPassword});
  check('admin-created-password-can-login',user.status<300&&longLogin.status===200,{create:user.status,login:longLogin.status,passwordBytes:Buffer.byteLength(longPassword)});
  const truncated=await call('admin-created-truncated-password-login','POST','/auth/login',null,{Email:email,MatKhau:longPassword.slice(0,72)});
  check('bcrypt-truncated-password-does-not-authenticate',truncated.status===401,{status:truncated.status});
  const expiry=fixtures.expiry;
  const expiredBefore=(await must('expiry-state-before-late-result','GET',`/orders/${expiry.orderId}`,b)).order;
  const late=await call('late-success-seat-free','POST',`/orders/${expiry.orderId}/payments/${expiry.paymentId}/result`,b,{status:'Thành công'});
  check('late-success-free-seat-policy',late.status===200&&late.body.order?.status==='Đã thanh toán',{elapsedMilliseconds:Date.now()-Date.parse(expiry.createdAt),before:expiredBefore,result:late});
  check('expired-start-payment-denied',(await call('expired-start-payment','POST',`/orders/${fixtures.orders.find(o=>o.id===38).id}/payments`,a,{paymentMethod:'MOMO'})).status===409);
  const invalidFood=await call('unknown-product-booking','POST','/bookings',b,{showtimeId:fixtures.browserShowtimeId,seatIds:[seat[11]],products:[{productId:2147483647,quantity:1}]});
  if(invalidFood.body?.booking){fixtures.orders.push({id:invalidFood.body.booking.id,owner:27,purpose:'unknown-product-validation'});persist();}
  check('unknown-product-not-silently-removed',invalidFood.status===400||invalidFood.status===404||invalidFood.status===409,invalidFood);
  const managerB=fixtures.users.find(u=>u.kind==='managerB'),cinemaB=fixtures.cinemas[1].id;
  const assignmentBody={userId:managerB.id,cinemaId:cinemaB,startsOn:date(30),endsOn:null,status:'Hiệu lực'};
  const assignments=await Promise.all([0,1].map(i=>call(`assignment-create-concurrency-${i}`,'POST','/admin/assignments',admin,assignmentBody)));
  for(const r of assignments)if(r.body?.assignment){fixtures.other.push({table:'PHANCONG_RAP',id:r.body.assignment.PhanCongID,purpose:'future-assignment-concurrency'});persist();}
  check('assignment-identical-concurrency-no-duplicate',assignments.filter(r=>r.status===200).length===1&&assignments.filter(r=>r.status===409).length===1,assignments);
  const mb=await login('managerB');
  check('future-assignment-denied-now',(await call('future-assignment-scope','GET',`/manager/cinemas/${cinemaB}/rooms`,mb)).status===403);
  }
  const assignedBody={userId:28,cinemaId:fixtures.cinemas[0].id,startsOn:date(-1),endsOn:null,status:'Đã hủy'};
  await must('revoke-own-fixture-assignment','PUT',`/admin/assignments/${fixtures.primaryAssignmentId}`,admin,assignedBody);
  check('assignment-revocation-applies-to-old-token',(await call('revoked-old-manager-token','GET',`/manager/cinemas/${assignedBody.cinemaId}/rooms`,m)).status===403);
  await must('restore-own-fixture-assignment','PUT',`/admin/assignments/${fixtures.primaryAssignmentId}`,admin,{...assignedBody,status:'Hiệu lực'});
  await must('lock-own-fixture-manager','PUT','/admin/users/28/status',admin,{status:'Bị khóa'});
  check('locked-account-old-token-denied',[401,403].includes((await call('locked-old-manager-token','GET','/manager/cinemas',m)).status));
  await must('restore-own-fixture-manager','PUT','/admin/users/28/status',admin,{status:'Hoạt động'});
  // Natural clock progression: create a new showing one minute ahead using the observed
  // datetime2 wall-clock contract. This workaround is test setup evidence for the timezone bug.
  const localStart=new Date(Date.now()+7*3600000+60000),localEnd=new Date(localStart.getTime()+90*60000);
  const nearBody={movieId:fixtures.movieId,roomId:fixtures.rooms[1].id,startsAt:localStart.toISOString(),endsAt:localEnd.toISOString(),format:'2D',basePrice:80000};
  const near=(await must('near-future-review-showtime-create','POST','/admin/showtimes',admin,nearBody)).showtime.recordset[0].SuatChieuID;
  fixtures.showtimes.push({id:near,body:nearBody,purpose:'natural-clock-review'});fixtures.reviewShowtimeId=near;fixtures.reviewReadyAt=new Date(Date.now()+65000).toISOString();persist();
  const browser=await login('browser');
  const reviewBooking=(await must('near-future-review-booking','POST','/bookings',browser,{showtimeId:near,seatIds:[fixtures.seats.find(s=>s.roomId===fixtures.rooms[1].id).id],products:[]})).booking;
  fixtures.orders.push({id:reviewBooking.id,owner:35,purpose:'natural-clock-review'});persist();
  const reviewPayment=(await must('near-future-review-payment','POST',`/orders/${reviewBooking.id}/payments`,browser,{paymentMethod:'MOMO'})).payment;
  await must('near-future-review-paid','POST',`/orders/${reviewBooking.id}/payments/${reviewPayment.id}/result`,browser,{status:'Thành công'});
  // Cross-show promotion race: hold a read-only update lock on this newly created promotion
  // for six seconds, so both booking sessions read the same RCSI snapshot before their UPDATE.
  const raceBody={movieId:fixtures.movieId,roomId:fixtures.rooms[0].id,startsAt:`${date(8)}T17:00:00+07:00`,endsAt:`${date(8)}T18:30:00+07:00`,format:'2D',basePrice:80000};
  const otherShow=(await must('cross-show-promo-showtime-create','POST','/admin/showtimes',admin,raceBody)).showtime.recordset[0].SuatChieuID;
  fixtures.showtimes.push({id:otherShow,body:raceBody,purpose:'cross-show-promotion-race'});persist();
  const code=`${p}_CROSS`.toUpperCase();
  const promo=(await must('cross-show-one-use-promo-create','POST','/admin/promotions',admin,{code,discountType:'FIXED',discountValue:1000,startsAt:`${date(-1)}T00:00:00+07:00`,endsAt:`${date(10)}T23:59:59+07:00`,quantity:1})).promotion.KhuyenMaiID;
  fixtures.other.push({table:'KHUYENMAI',id:promo,purpose:'cross-show-promotion-race'});persist();
  const lock=spawn('sqlcmd',['-S','localhost','-d','CinemaBookingDB','-E','-C','-I','-b','-l','8','-t','20','-f','65001','-Q',`SET NOCOUNT ON; BEGIN TRAN; SELECT KhuyenMaiID FROM dbo.KHUYENMAI WITH(UPDLOCK,HOLDLOCK) WHERE KhuyenMaiID=${promo}; RAISERROR('AUDIT_LOCK_READY',10,1) WITH NOWAIT; WAITFOR DELAY '00:00:06'; ROLLBACK;`],{windowsHide:true});
  let lockText='';const done=new Promise(resolve=>{lock.stdout.on('data',s=>lockText+=s);lock.stderr.on('data',s=>lockText+=s);lock.on('close',resolve);});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Read-only promotion lock did not become ready')),10000);const ready=s=>{if(String(s).includes('AUDIT_LOCK_READY')){clearTimeout(timer);resolve();}};lock.stdout.on('data',ready);lock.stderr.on('data',ready);});
  const r0=await login('race0'),r1=await login('race1');
  const promoRace=await Promise.all([call('cross-show-promo-race-0','POST','/bookings',r0,{showtimeId:fixtures.browserShowtimeId,seatIds:[seat[9]],products:[],promotionCode:code}),call('cross-show-promo-race-1','POST','/bookings',r1,{showtimeId:otherShow,seatIds:[seat[10]],products:[],promotionCode:code})]);
  await done;save('promotion-read-only-lock.txt',lockText);
  promoRace.forEach((r,i)=>{if(r.body?.booking)fixtures.orders.push({id:r.body.booking.id,owner:32+i,purpose:'cross-show-promotion-race'});});persist();
  check('cross-show-last-use-no-server-error',promoRace.every(r=>r.status<500),promoRace);
  check('cross-show-last-use-at-most-one-discount',promoRace.filter(r=>r.body?.booking?.discountTotal>0).length<=1,promoRace);
} catch(error){save('additional-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;} finally {finish('additional');}

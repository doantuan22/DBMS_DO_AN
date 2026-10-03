import { spawn } from 'node:child_process';
import { fixtures,check,call,persist,login,finish } from './api.mjs';
import { save } from './collect.mjs';
try {
  const r0=await login('race0'),r1=await login('race1');
  const promo=fixtures.other.find(o=>o.purpose==='cross-show-promotion-race').id;
  const code=`${fixtures.prefix}_CROSS`.toUpperCase(),otherShow=fixtures.showtimes.find(s=>s.purpose==='cross-show-promotion-race').id;
  const seats=fixtures.seats.filter(s=>s.roomId===fixtures.rooms[0].id);
  const lock=spawn('sqlcmd',['-S','localhost','-d','CinemaBookingDB','-E','-C','-I','-b','-l','8','-t','20','-f','65001','-Q',`SET NOCOUNT ON; BEGIN TRAN; SELECT KhuyenMaiID FROM dbo.KHUYENMAI WITH(UPDLOCK,HOLDLOCK) WHERE KhuyenMaiID=${promo}; RAISERROR('AUDIT_LOCK_READY',10,1) WITH NOWAIT; WAITFOR DELAY '00:00:06'; ROLLBACK;`],{windowsHide:true});
  let log='';const done=new Promise(resolve=>{lock.stdout.on('data',s=>log+=s);lock.stderr.on('data',s=>log+=s);lock.on('close',resolve);});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Lock did not become ready')),10000);const ready=s=>{if(String(s).includes('AUDIT_LOCK_READY')){clearTimeout(timer);resolve();}};lock.stdout.on('data',ready);lock.stderr.on('data',ready);});
  const results=await Promise.all([call('cross-show-promo-race-0','POST','/bookings',r0,{showtimeId:fixtures.browserShowtimeId,seatIds:[seats[9].id],products:[],promotionCode:code}),call('cross-show-promo-race-1','POST','/bookings',r1,{showtimeId:otherShow,seatIds:[seats[10].id],products:[],promotionCode:code})]);
  await done;save('promotion-read-only-lock.txt',log);
  results.forEach((r,i)=>{if(r.body?.booking)fixtures.orders.push({id:r.body.booking.id,owner:32+i,purpose:'cross-show-promotion-race'});});persist();
  check('cross-show-last-use-no-server-error',results.every(r=>r.status<500),results);
  check('cross-show-last-use-at-most-one-discount',results.filter(r=>r.body?.booking?.discountTotal>0).length<=1,results);
}catch(error){save('promotion-race-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}finally{finish('promotion-race');}

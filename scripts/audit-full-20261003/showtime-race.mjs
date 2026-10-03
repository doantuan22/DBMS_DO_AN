import { spawn } from 'node:child_process';
import { fixtures,check,call,persist,adminLogin,date,finish } from './api.mjs';
import { save } from './collect.mjs';
import { inspect } from './live-inspect.mjs';
try{
  const admin=await adminLogin(),room=fixtures.rooms.find(r=>r.purpose==='manager-ui-tests').id;
  const starts=`${date(12)}T17:00:00`,ends=`${date(12)}T18:30:00`;
  const sql=`SET NOCOUNT ON; BEGIN TRAN; EXEC dbo.usp_Admin_Showtime_Create @PhimID=${fixtures.movieId},@PhongID=${room},@ThoiGianBatDau='${starts}',@ThoiGianKetThuc='${ends}',@DinhDang=N'2D',@GiaVeCoBan=80000; RAISERROR('AUDIT_SHOWTIME_READY',10,1) WITH NOWAIT; WAITFOR DELAY '00:00:06'; COMMIT;`;
  const session=spawn('sqlcmd',['-S','localhost','-d','CinemaBookingDB','-E','-C','-I','-b','-l','8','-t','20','-f','65001','-Q',sql],{windowsHide:true});
  let log='';const done=new Promise(resolve=>{session.stdout.on('data',s=>log+=s);session.stderr.on('data',s=>log+=s);session.on('close',resolve);});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('First SP transaction did not become ready')),10000);const ready=s=>{if(String(s).includes('AUDIT_SHOWTIME_READY')){clearTimeout(timer);resolve();}};session.stdout.on('data',ready);session.stderr.on('data',ready);});
  const second=await call('overlap-other-session-while-first-uncommitted','POST','/admin/showtimes',admin,{movieId:fixtures.movieId,roomId:room,startsAt:starts+'Z',endsAt:ends+'Z',format:'2D',basePrice:80000});
  const exit=await done;save('showtime-race-sp-session.txt',log);
  const rows=inspect('showtime-race-final-state',`SELECT SuatChieuID,PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,TrangThai FROM dbo.SUATCHIEU WHERE PhongID=${room} AND ThoiGianBatDau='${starts}'`);
  rows.forEach(r=>fixtures.showtimes.push({id:r.SuatChieuID,purpose:'showtime-overlap-concurrency',body:{movieId:r.PhimID,roomId:r.PhongID,startsAt:starts,endsAt:ends}}));persist();
  check('showtime-concurrent-overlap-rejected',exit===0&&second.status===409&&rows.length===1,{firstSessionExit:exit,secondStatus:second.status,finalRows:rows});
}catch(error){save('showtime-race-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}finally{finish('showtime-race');}

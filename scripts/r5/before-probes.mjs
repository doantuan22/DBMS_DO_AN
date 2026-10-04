import assert from 'node:assert/strict';
import path from 'node:path';
import {connect,ask,root,write,sql} from '../r3a/common.mjs';
import {credentials} from '../db/lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R5[A-Za-z0-9_]+$/);
Object.assign(process.env,credentials(),{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},probes=[];
async function api(bug,route,{actor='admin',method='GET',body}={}){
 const response=await fetch(base+route,{method,headers:{...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json();if(bug)probes.push({bug,route,method,status:response.status,error:data.error?.code});return data;
}
try{
 for(const [actor,email] of Object.entries({admin:'admin@cinemadb.vn',manager:'manager.q1@cinemadb.vn',customer:'khachhang1@gmail.com'}))tokens[actor]=(await api(null,'/auth/login',{method:'POST',body:{Email:email,MatKhau:'123456'}})).token;
 const room=(await api(null,'/manager/cinemas/1/rooms',{actor:'manager',method:'POST',body:{name:'R5 before fixture',type:'2D'}})).room;
 const seat=(await api(null,`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{row:'R5',number:1,type:'Thường'}})).seat;
 const start=new Date(Date.now()+30*86400000),input={movieId:1,roomId:room.id,startsAt:start.toISOString(),endsAt:new Date(+start+166*60000).toISOString(),format:'2D',basePrice:100000};
 const show=(await api(null,'/manager/showtimes',{actor:'manager',method:'POST',body:input})).showtime;
 const {roomId,...update}=input;
 await api('BUG-002',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,status:'Đóng bán'}});
 await api('BUG-002',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,status:'Tạm ngừng'}});
 await api('BUG-003',`/manager/showtimes/${show.id}`,{actor:'manager',method:'PUT',body:{...update,status:'Đã hủy'}});
 await api('BUG-009','/admin/cinemas/2147483648',{method:'PUT',body:{name:'R5',address:'R5',city:'R5',status:'Hoạt động'}});
 await api('BUG-010','/admin/actors',{method:'POST',body:{name:'R5 actor before',birthDate:'2999-01-01'}});
 await api('BUG-011','/admin/actors',{method:'POST',body:{name:'R'.repeat(151)}});
 await api('BUG-012','/admin/cinemas/2147483647',{method:'PUT',body:{name:'R5',address:'R5',city:'R5',status:'Hoạt động'}});
 await api('BUG-013','/admin/actors',{method:'POST',body:{name:'R5 future before',birthDate:'2999-01-01'}});
 const customerRole=(await ask(pool,"SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro='KHACH_HANG'")).recordset[0].VaiTroID;
 const user=(await api('BUG-015','/admin/users',{method:'POST',body:{name:'R5 before Customer',email:'r5-before@example.test',password:'r5-password',roleId:customerRole}})).user;
 const missing=(await pool.request().input('ID',sql.Int,user.NguoiDungID).query('SELECT COUNT(*) AS profiles FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID')).recordset[0].profiles;
 probes.push({bug:'BUG-015',profilesForNewCustomer:missing});
 await api('BUG-016','/bookings',{actor:'customer',method:'POST',body:{showtimeId:show.id,seatIds:[seat.id],products:[{productId:1,quantity:1},{productId:2147483647,quantity:1}]}});
 const actorId=(await ask(pool,"SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'")).recordset[0].NguoiDungID;
 const assignment={userId:actorId,cinemaId:1,startsOn:'2030-01-01',endsOn:null,status:'Hiệu lực'};
 await api('BUG-017','/admin/assignments',{method:'POST',body:assignment});await api('BUG-017','/admin/assignments',{method:'POST',body:assignment});
 const aggregates=(await ask(pool,'SELECT (SELECT COUNT(*) FROM dbo.DANHGIAPHIM WHERE PhimID=1) AS actualReviews,SoLuotDanhGia FROM dbo.vw_ThongKePhim WHERE PhimID=1')).recordset;
 probes.push({bug:'BUG-018',aggregates,source:'Review/showtime join multiplies nonzero reviews; tested with explicit nonzero fixtures in after tests'});
 write(path.join(root,'audit/remediation/r5/evidence/before-probes.json'),{status:'PASS',database,probes});console.log(`PASS captured ${probes.length} original outcomes; only fixture was mutated`);
}finally{await new Promise(r=>server.close(r));await closePool();await pool.close();}

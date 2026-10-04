import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {connect,ask,root,sql,write,mainSnapshot} from '../r3a/common.mjs';
import {credentials} from '../db/lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R5[A-Za-z0-9_]+$/);
Object.assign(process.env,credentials(),{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,tokens={},prefix='R5S'+crypto.randomUUID().slice(0,8),checks=[],requests=[];
const query=async s=>(await ask(pool,s)).recordset;
async function api(name,route,{actor='admin',method='GET',body,status=200}={}){const res=await fetch(base+route,{method,headers:{...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const data=await res.json();requests.push({name,route,status:res.status,error:data.error?.code});if(status!==null)assert.equal(res.status,status,JSON.stringify(data));return status===null?{status:res.status,data}:data;}
const check=(name,value)=>{assert.ok(value,name);checks.push({name,status:'PASS'});};
try{
 for(const [actor,email] of Object.entries({admin:'admin@cinemadb.vn',manager:'manager.q1@cinemadb.vn'}))tokens[actor]=(await api('login','/auth/login',{method:'POST',body:{Email:email,MatKhau:'123456'}})).token;
 const uid=(await query("SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'"))[0].NguoiDungID;
 const baseAssignment={userId:uid,cinemaId:1,endsOn:null,status:'Hiệu lực'},ids=[];
 for(let i=1;i<=16;i++)ids.push((await api('create distinct assignment','/admin/assignments',{method:'POST',body:{...baseAssignment,startsOn:`2034-01-${String(i).padStart(2,'0')}`}})).assignment.PhanCongID);
 const results=await Promise.all(ids.map(id=>api('concurrent equivalent UPDATE',`/admin/assignments/${id}`,{method:'PUT',body:{...baseAssignment,startsOn:'2035-01-01'},status:null})));
 check('16 concurrent assignment updates -> exactly1 success,15 conflicts',results.filter(r=>r.status===200).length===1&&results.filter(r=>r.status===409).length===15);
 check('No fully identical assignment groups in fixture',(await query('SELECT NguoiDungID FROM dbo.PHANCONG_RAP GROUP BY NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai HAVING COUNT(*)>1')).length===0);
 await api('missing movie empty genres404','/admin/movies/2147483647',{method:'PUT',body:{title:prefix,durationMinutes:120,releaseDate:'2020-01-01',endDate:null,genreIds:[],status:'Đang chiếu'},status:404});
 await api('missing movie nonempty genres404','/admin/movies/2147483647',{method:'PUT',body:{title:prefix,durationMinutes:120,releaseDate:'2020-01-01',endDate:null,genreIds:[1],status:'Đang chiếu'},status:404});
 await api('missing pricing404','/admin/pricing/2147483647',{method:'PUT',body:{surcharge:0,status:'Áp dụng'},status:404});
 await api('missing assignment404','/admin/assignments/2147483647',{method:'PUT',body:{...baseAssignment,startsOn:'2035-01-01'},status:404});
 const registered=await api('customer for promotion rollback','/auth/register',{actor:'none',method:'POST',body:{HoTen:prefix,Email:prefix+'@test.com',MatKhau:'password8'},status:201});assert.ok(registered.user);
 tokens.customer=(await api('customer login','/auth/login',{method:'POST',body:{Email:prefix+'@test.com',MatKhau:'password8'}})).token;
 const promo=(await api('active promotion fixture','/admin/promotions',{method:'POST',status:201,body:{code:prefix,discountType:'Phần trăm',discountValue:10,minimumOrder:0,maximumDiscount:100000,startsAt:new Date(Date.now()-3600000).toISOString(),endsAt:new Date(Date.now()+86400000).toISOString(),quantity:100}})).promotion;
 const room=(await api('create room','/manager/cinemas/1/rooms',{actor:'manager',method:'POST',body:{name:prefix,type:'2D'},status:201})).room;
 const seat=(await api('create seat',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{row:'R5S',number:1,type:'Thường'},status:201})).seat;
 const start=new Date(Date.now()+80*86400000),show=(await api('create show','/manager/showtimes',{actor:'manager',method:'POST',status:201,body:{movieId:1,roomId:room.id,startsAt:start.toISOString(),endsAt:new Date(+start+166*60000).toISOString(),format:'2D',basePrice:100000}})).showtime;
 const request={showtimeId:show.id,seatIds:[seat.id],promotionCode:prefix};
 const before=(await mainSnapshot(pool)).data;
 await api('invalid product with real active promotion','/bookings',{actor:'customer',method:'POST',body:{...request,products:[{productId:1,quantity:1},{productId:2147483647,quantity:1}]},status:400});
 assert.deepEqual((await mainSnapshot(pool)).data,before);check('Invalid booking leaves all27 data hashes unchanged with real active promotion',true);
 await api('valid products/promotion succeed','/bookings',{actor:'customer',method:'POST',body:{...request,products:[{productId:1,quantity:1}]},status:201});
 check('Promotion usage increments once only for valid commit',(await query(`SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=${promo.KhuyenMaiID}`))[0].SoLuongDaDung===1);
 // Role statuses may be present in SQL; account guard remains authoritative under R3.
 const report={database,status:'PASS',checks,requests};write(path.join(root,'audit/remediation/r5/evidence/supplemental.json'),report);console.log(`PASS supplemental: ${checks.length} assertions, ${requests.length} requests`);
}finally{await new Promise(r=>server.close(r));await closePool();await pool.close();}

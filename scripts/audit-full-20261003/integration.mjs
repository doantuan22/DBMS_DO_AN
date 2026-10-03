import { save } from './collect.mjs';
const base='http://127.0.0.1:4000/api';
const runId=Date.now().toString(36);
const prefix=`AUDIT_${runId}`;
const password=`Audit!${runId}987`;
const transcript=[],checks=[],fixtures={runId,prefix,createdAt:new Date().toISOString(),database:'CinemaBookingDB',users:[],cinemas:[],rooms:[],seats:[],showtimes:[],orders:[],images:[],other:[]};
const redacted=(v)=>JSON.parse(JSON.stringify(v, (key,value)=>/^(token|password|MatKhau|MatKhauHash|MatKhauHashMoi)$/i.test(key)?'[REDACTED]':value));
const persist=()=>{save('integration-transcript.json',transcript);save('integration-checks.json',checks);save('fixture-manifest.json',fixtures);};
async function call(label,method,path,token,body){
  const started=performance.now();
  const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const json=await r.json().catch(()=>null);
  transcript.push({label,method,path,status:r.status,ms:Math.round(performance.now()-started),request:body?redacted(body):undefined,response:redacted(json)});persist();
  console.log(`${r.status} ${label}${json?.error?' '+json.error.code:''}`);
  return {status:r.status,body:json};
}
function check(label,ok,evidence){checks.push({label,status:ok?'PASS':'FAIL',evidence});persist();console.log(`${ok?'PASS':'FAIL'} ${label}`);}
async function must(label,method,path,token,body){const r=await call(label,method,path,token,body);if(r.status>=400)throw new Error(`Fixture blocked: ${label}: ${r.status} ${r.body?.error?.code}`);return r.body;}
const date=(days=0)=>new Date(Date.now()+days*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
const findId=(v,key)=>v?.[key]??v?.recordsets?.flat().find(x=>x[key]!==undefined)?.[key];
try {
  await must('health','GET','/health');await must('db-health','GET','/health/db');
  const admin=(await must('admin-login','POST','/auth/login',null,{Email:'admin@cinemadb.vn',MatKhau:'123456'})).token;
  const roles=(await must('role-list','GET','/admin/roles',admin)).roles;
  const roleId=code=>roles.find(r=>r.MaVaiTro===code).VaiTroID;
  const people={};
  for(const [kind,role] of [['customerA','KHACH_HANG'],['customerB','KHACH_HANG'],['managerA','QUAN_LY_RAP'],['managerB','QUAN_LY_RAP'],['support','CSKH']]){
    const email=`audit.${runId}.${kind.toLowerCase()}@example.invalid`;
    const created=role==='KHACH_HANG'
      ?await must(`${kind}-register`,'POST','/auth/register',null,{HoTen:`${prefix}_${kind}`,Email:email,MatKhau:password})
      :await must(`${kind}-create`,'POST','/admin/users',admin,{name:`${prefix}_${kind}`,email,password,roleId:roleId(role)});
    const login=await must(`${kind}-login`,'POST','/auth/login',null,{Email:email,MatKhau:password});
    people[kind]={id:login.user.userId,email,token:login.token};fixtures.users.push({kind,id:login.user.userId,email,role});persist();
  }
  const a=people.customerA.token,b=people.customerB.token,m=people.managerA.token,support=people.support.token;
  check('registration persists customer profile',(await must('customer-me','GET','/auth/me',a)).user.role==='KHACH_HANG');
  await must('customer-profile-update','PUT','/auth/me',a,{HoTen:`${prefix}_A_updated`,SoDienThoai:null,NgaySinh:'2000-01-01',GioiTinh:'Nam'});
  check('duplicate-register-conflict',(await call('duplicate-register','POST','/auth/register',null,{HoTen:prefix,Email:people.customerA.email,MatKhau:password})).status===409);
  check('invalid-login-rejected',(await call('wrong-password','POST','/auth/login',null,{Email:people.customerA.email,MatKhau:'WrongPassword!'})).status===401);
  check('identity-spoof-rejected',(await call('profile-role-spoof','PUT','/auth/me',a,{HoTen:prefix,VaiTroID:1})).status===400);
  for(const [path,token,expected] of [['/admin/users',null,401],['/admin/users',a,403],['/manager/cinemas',a,403],['/support/complaints',m,403],['/orders',admin,403]])check(`role-boundary ${path} ${expected}`,(await call(`role-boundary ${path}`,'GET',path,token)).status===expected);
  for(const name of ['A','B']){
    const v=await must(`cinema-${name}-create`,'POST','/admin/cinemas',admin,{name:`${prefix}_Cinema_${name}`,address:'AUDIT test address',city:'AUDIT City'});
    fixtures.cinemas.push({name,id:v.cinema.RapID});persist();
  }
  const cinema=fixtures.cinemas[0].id,foreign=fixtures.cinemas[1].id;
  const assignment=await must('manager-assignment-create','POST','/admin/assignments',admin,{userId:people.managerA.id,cinemaId:cinema,startsOn:date(-1),endsOn:null,status:'Hiệu lực'});
  fixtures.other.push({table:'PHANCONG_RAP',id:assignment.assignment?.PhanCongID});persist();
  check('assignment-visible-with-old-token',(await must('manager-own-cinemas','GET','/manager/cinemas',m)).cinemas.some(c=>c.id===cinema));
  check('wrong-role-assignment-denied',(await call('customer-assignment-invalid','POST','/admin/assignments',admin,{userId:people.customerA.id,cinemaId:cinema,startsOn:date(),endsOn:null,status:'Hiệu lực'})).status===400);
  for(const c of [cinema,foreign]){
    const v=await must(`room-create-${c}`,'POST','/admin/rooms',admin,{cinemaId:c,name:`${prefix}_Room`,type:'2D'});
    const id=v.room.PhongID;fixtures.rooms.push({id,cinemaId:c});persist();
    for(let n=1;n<=14;n++){
      const q=await must(`seat-create-${c}-${n}`,'POST','/admin/seats',admin,{roomId:id,row:'A',number:n,type:n===14?'VIP':'Thường'});
      fixtures.seats.push({id:q.seat.GheID,roomId:id,number:n});persist();
    }
  }
  const room=fixtures.rooms[0].id,otherRoom=fixtures.rooms[1].id,seats=fixtures.seats.filter(x=>x.roomId===room).map(x=>x.id),otherSeat=fixtures.seats.find(x=>x.roomId===otherRoom).id;
  const genre=(await must('audit-genre-create','POST','/admin/genres',admin,{name:`${prefix}_Genre`})).genre.TheLoaiID;
  fixtures.other.push({table:'THELOAI',id:genre});persist();
  const movieBody={title:`${prefix}_Movie`,durationMinutes:90,releaseDate:date(-1),endDate:date(365),genreIds:[genre],posterUrl:'/favicon.svg'};
  const movie=(await must('audit-movie-create','POST','/admin/movies',admin,movieBody)).movie.movieId;
  fixtures.movieId=movie;fixtures.movieBody=movieBody;persist();
  const actor=(await must('audit-actor-create','POST','/admin/actors',admin,{name:`${prefix}_Actor`,nationality:'Việt Nam'})).actor.DienVienID;
  fixtures.other.push({table:'DIENVIEN',id:actor});persist();
  await must('movie-cast-set','PUT',`/admin/movies/${movie}/actors`,admin,{cast:[{actorId:actor,role:'AUDIT Role'}]});
  check('public-movie-cast-persists',(await must('public-movie-detail','GET',`/movies/${movie}`)).actors.some(x=>x.id===actor));
  const showBody={movieId:movie,roomId:room,startsAt:`${date(1)}T10:00:00+07:00`,endsAt:`${date(1)}T11:30:00+07:00`,format:'2D',basePrice:80000};
  const show=(await must('audit-showtime-create','POST','/admin/showtimes',admin,showBody)).showtime;
  const showId=findId(show,'SuatChieuID');if(!showId)throw Error('No showtime id');fixtures.showtimes.push({id:showId,body:showBody});persist();
  check('public-showtime-visible',(await must('public-showtimes','GET',`/movies/${movie}/showtimes`)).showtimes.some(x=>x.id===showId));
  const catalog=await must('public-showtime-detail','GET',`/showtimes/${showId}`);
  check('showtime-database-wall-clock-matches-input',catalog.startTime?.startsWith('10:00'),{submitted:showBody.startsAt,returned:catalog});
  const productBody={name:`${prefix}_Product`,type:'Snack',price:25000,description:'AUDIT snapshot test'};
  const product=(await must('audit-product-create','POST','/admin/products',admin,productBody)).product.SanPhamID;fixtures.productId=product;persist();
  const promoBody={code:`AUDIT_${runId}`.toUpperCase(),discountType:'PERCENT',discountValue:10,minimumOrder:0,startsAt:`${date(-1)}T00:00:00+07:00`,endsAt:`${date(10)}T23:59:59+07:00`,quantity:20};
  const promo=(await must('audit-promotion-create','POST','/admin/promotions',admin,promoBody)).promotion.KhuyenMaiID;fixtures.promotionId=promo;persist();
  const pricing=(await must('audit-pricing-create','POST','/admin/pricing',admin,{cinemaId:cinema,seatType:'Tất cả',dayType:'Tất cả',format:'Tất cả',surcharge:5000,startsOn:date(),endsOn:null})).pricing.GiaID;fixtures.pricingId=pricing;persist();
  check('promotion-valid-preview',(await must('promotion-valid','POST','/promotions/validate',a,{showtimeId:showId,seatIds:[seats[0]],products:[{productId:product,quantity:2}],promotionCode:promoBody.code})).promotion.isValid===true);
  await call('promotion-invalid-preview','POST','/promotions/validate',a,{showtimeId:showId,seatIds:[seats[0]],products:[],promotionCode:'AUDIT_NOT_FOUND'});
  const order=(await must('booking-with-food-promo','POST','/bookings',a,{showtimeId:showId,seatIds:[seats[0]],products:[{productId:product,quantity:2}],promotionCode:promoBody.code})).booking;
  fixtures.orders.push({id:order.id,owner:people.customerA.id,purpose:'snapshot-and-payment'});persist();
  check('money-authoritative-correct',order.ticketTotal===85000&&order.productTotal===50000&&order.discountTotal===13500&&order.total===121500,order);
  const expiredLater=(await must('booking-expiry-fixture','POST','/bookings',b,{showtimeId:showId,seatIds:[seats[13]],products:[]})).booking;
  const expiryAttempt=(await must('expiry-attempt','POST',`/orders/${expiredLater.id}/payments`,b,{paymentMethod:'MOMO'})).payment;
  fixtures.orders.push({id:expiredLater.id,owner:people.customerB.id,purpose:'expiry-after-five-minutes',paymentId:expiryAttempt.id,holdExpiresAt:expiredLater.holdExpiresAt});persist();
  for(const path of [`/orders/${order.id}`,`/complaints/2147483647`])check(`foreign-or-missing-${path}`,(await call(`ownership ${path}`,'GET',path,b)).status===404);
  check('foreign-order-payment-denied',(await call('foreign-order-pay','POST',`/orders/${order.id}/payments`,b,{paymentMethod:'MOMO'})).status===404);
  check('amount-manipulation-denied',(await call('spoof-price','POST','/bookings',a,{showtimeId:showId,seatIds:[seats[1]],products:[],total:1})).status===400);
  check('wrong-room-seat-denied',(await call('wrong-room-booking','POST','/bookings',a,{showtimeId:showId,seatIds:[otherSeat],products:[]})).status===409);
  check('unwatched-review-denied',(await call('unwatched-review','POST',`/movies/${movie}/reviews`,a,{rating:5,content:'AUDIT not yet watched'})).status===403);
  const p1=(await must('payment-fail-attempt','POST',`/orders/${order.id}/payments`,a,{paymentMethod:'MOMO'})).payment;
  await must('payment-first-failure','POST',`/orders/${order.id}/payments/${p1.id}/result`,a,{status:'Thất bại'});
  const p2=(await must('payment-retry-attempt','POST',`/orders/${order.id}/payments`,a,{paymentMethod:'VNPAY'})).payment;
  const paid=await must('payment-success','POST',`/orders/${order.id}/payments/${p2.id}/result`,a,{status:'Thành công'});
  check('payment-history-appended',paid.order.payments.length===2&&paid.order.payments.some(x=>x.id===p1.id&&x.status==='Thất bại')&&paid.order.status==='Đã thanh toán');
  check('conflicting-final-result-denied',(await call('payment-overwrite-denied','POST',`/orders/${order.id}/payments/${p2.id}/result`,a,{status:'Thất bại'})).status===409);
  await must('pricing-snapshot-change','PUT',`/admin/pricing/${pricing}`,admin,{surcharge:12000,status:'Áp dụng'});
  await must('product-snapshot-change','PUT',`/admin/products/${product}`,admin,{...productBody,price:30000,status:'Đang bán'});
  await must('promotion-snapshot-change','PUT',`/admin/promotions/${promo}`,admin,{description:'AUDIT changed',discountType:'PERCENT',discountValue:20,minimumOrder:0,startsAt:promoBody.startsAt,endsAt:promoBody.endsAt,quantity:20,status:'Hoạt động'});
  const snapshot=(await must('snapshot-after-config-change','GET',`/orders/${order.id}`,a)).order;
  check('historical-money-unchanged',snapshot.ticketTotal===85000&&snapshot.productTotal===50000&&snapshot.discountTotal===13500&&snapshot.total===121500,snapshot);
  const complaint=(await must('own-order-complaint','POST','/complaints',a,{type:'AUDIT Payment',title:`${prefix}_Complaint`,content:'AUDIT append-only history',orderId:order.id})).complaint;
  fixtures.complaintId=complaint.id;persist();
  check('foreign-order-complaint-denied',(await call('foreign-order-complaint','POST','/complaints',b,{type:'AUDIT',title:prefix,content:'AUDIT',orderId:order.id})).status===404);
  const noRef=(await must('null-order-complaint','POST','/complaints',a,{type:'AUDIT',title:`${prefix}_NoRef`,content:'AUDIT no reference',orderId:null})).complaint;fixtures.nullComplaintId=noRef.id;persist();
  check('null-order-reference-supported',(await must('support-null-reference','GET',`/support/complaints/${noRef.id}/order-reference`,support)).order===null);
  await must('support-queue','GET','/support/complaints',support);
  await must('support-order-reference','GET',`/support/complaints/${complaint.id}/order-reference`,support);
  const procResults=await Promise.all(['Đang xử lý','Đã giải quyết'].map((nextStatus,i)=>call(`concurrent-complaint-${i}`,'POST',`/support/complaints/${complaint.id}/processings`,support,{content:`AUDIT concurrent ${i}`,nextStatus})));
  check('concurrent-complaint-processing-success',procResults.every(r=>r.status===201));
  await must('admin-complaint-status','PUT',`/admin/complaints/${complaint.id}/status`,admin,{status:'Đã đóng'});
  const history=(await must('customer-complaint-history','GET',`/complaints/${complaint.id}`,a)).complaint;
  check('complaint-history-preserved',history.processingHistory?.length===3&&history.status==='Đã đóng',history);
  const coverBefore=(await must('revenue-before-images','GET',`/admin/reports/revenue?cinemaId=${cinema}`,admin));
  for(let i=1;i<=3;i++){
    const v=await must(`image-create-${i}`,'POST',`/admin/cinemas/${cinema}/images`,admin,{url:'/favicon.svg',description:`AUDIT image ${i}`,displayOrder:i,cover:true});
    fixtures.images.push({id:v.image.HinhAnhRapID,cinemaId:cinema});persist();
  }
  const imageIds=fixtures.images.map(x=>x.id);
  const covers=await Promise.all(Array.from({length:12},(_,i)=>call(`cover-concurrency-${i}`,'PATCH',`/admin/cinemas/${cinema}/images/${imageIds[i%3]}/cover`,admin,{cover:true})));
  const images=(await must('images-final-state','GET',`/admin/cinemas/${cinema}/images`,admin)).images;
  check('concurrent-setcover-one-cover',covers.every(r=>r.status===200)&&images.filter(x=>x.LaAnhDaiDien).length===1,images);
  const cList=(await must('public-cinemas-after-images','GET','/cinemas')).cinemas;
  check('cinema-list-not-multiplied',cList.filter(x=>x.id===cinema).length===1);
  check('public-gallery-three-images',(await must('public-gallery','GET',`/cinemas/${cinema}/images`)).images.length===3);
  const revAfter=await must('revenue-after-images','GET',`/admin/reports/revenue?cinemaId=${cinema}`,admin);
  check('revenue-not-multiplied-by-images',JSON.stringify(coverBefore)===JSON.stringify(revAfter),{before:coverBefore,after:revAfter});
  for(const suffix of ['rooms','showtimes','pricing','dashboard','revenue'])check(`manager-foreign-${suffix}`,(await call(`manager-foreign-${suffix}`,'GET',`/manager/cinemas/${foreign}/${suffix}`,m)).status===403);
  check('manager-foreign-seats',(await call('manager-foreign-seats','GET',`/manager/rooms/${otherRoom}/seats`,m)).status===403);
  check('manager-foreign-write',(await call('manager-foreign-room-write','POST',`/manager/cinemas/${foreign}/rooms`,m,{name:prefix,type:'2D'})).status===403);
  await must('manager-room-list','GET',`/manager/cinemas/${cinema}/rooms`,m);
  const mgrRoom=(await must('manager-room-create','POST',`/manager/cinemas/${cinema}/rooms`,m,{name:`${prefix}_ManagerRoom`,type:'2D'})).room;
  fixtures.rooms.push({id:mgrRoom.id,cinemaId:cinema,purpose:'manager-ui-tests'});persist();
  await must('manager-room-update','PUT',`/manager/rooms/${mgrRoom.id}`,m,{name:`${prefix}_ManagerRoom`,type:'2D',status:'Hoạt động'});
  const mgrSeat=(await must('manager-seat-create-clean','POST',`/manager/rooms/${mgrRoom.id}/seats`,m,{row:'B',number:1,type:'Thường'})).seat;
  fixtures.seats.push({id:mgrSeat.id,roomId:mgrRoom.id});persist();
  const badSeat=await call('manager-seat-create-frontend-payload','POST',`/manager/rooms/${mgrRoom.id}/seats`,m,{roomId:String(mgrRoom.id),row:'B',number:2,type:'Thường'});
  check('manager-frontend-seat-create-supported',badSeat.status===201||badSeat.status===200,badSeat);
  await must('manager-seat-update','PUT',`/manager/seats/${mgrSeat.id}`,m,{type:'VIP',status:'Hoạt động'});
  const ms={...showBody,roomId:mgrRoom.id,startsAt:`${date(2)}T10:00:00+07:00`,endsAt:`${date(2)}T11:30:00+07:00`};
  const mgrShow=(await must('manager-showtime-create','POST','/manager/showtimes',m,ms)).showtime;
  fixtures.showtimes.push({id:mgrShow.id,body:ms,purpose:'manager-update-status'});persist();
  const closed=await call('manager-close-correct-domain','PUT',`/manager/showtimes/${mgrShow.id}`,m,{movieId:movie,startsAt:ms.startsAt,endsAt:ms.endsAt,format:'2D',basePrice:80000,status:'Đóng bán'});
  check('manager-close-showtime-supported',closed.status===200,closed);
  const unsupported=await call('manager-pause-wrong-domain','PUT',`/manager/showtimes/${mgrShow.id}`,m,{movieId:movie,startsAt:ms.startsAt,endsAt:ms.endsAt,format:'2D',basePrice:80000,status:'Tạm ngừng'});
  check('unsupported-status-is-client-error',unsupported.status===400,unsupported);
  for(const [label,body] of [['short-duration',{...ms,endsAt:`${date(3)}T10:01:00+07:00`,startsAt:`${date(3)}T10:00:00+07:00`}],['overlap',ms]]){
    const rr=await call(`manager-${label}`,'POST','/manager/showtimes',m,body);check(`${label}-proper-domain-error`,rr.status===400||rr.status===409,rr);
  }
  check('paid-showtime-cancel-denied',(await call('cancel-paid-showtime','POST',`/admin/showtimes/${showId}/cancel`,admin,{})).status===409);
  await must('manager-cancel-empty-showtime','POST',`/manager/showtimes/${mgrShow.id}/cancel`,m,{});
  for(const path of ['/admin/dashboard','/admin/users','/admin/permissions','/admin/assignments','/admin/cinemas','/admin/rooms','/admin/seats','/admin/movies','/admin/genres','/admin/actors','/admin/products','/admin/promotions','/admin/pricing','/admin/showtimes','/admin/complaints','/admin/reports/revenue'])check(`admin-read ${path}`,(await call(`admin-read ${path}`,'GET',path,admin)).status===200);
  for(const [label,path,body] of [
    ['missing-cinema','/admin/cinemas/2147483647',{name:prefix,address:'AUDIT',city:'AUDIT',status:'Hoạt động'}],
    ['missing-role','/admin/roles/2147483647',{name:prefix}],
    ['integer-overflow','/admin/rooms',{cinemaId:2147483648,name:prefix,type:'2D'}],
    ['fractional-seat','/admin/seats',{roomId:room,row:'F',number:1.5,type:'Thường'}],
  ]){const rr=await call(label,label.startsWith('missing')?'PUT':'POST',path,admin,body);check(`${label}-handled-correctly`,label.startsWith('missing')?rr.status===404:rr.status===400,rr);}
  // Customer A is paid; B holds only the dedicated expiry order. Requests use fresh seats.
  const concurrent=await Promise.all([call('same-seat-A','POST','/bookings',a,{showtimeId:showId,seatIds:[seats[1]],products:[]}),call('same-seat-B','POST','/bookings',b,{showtimeId:showId,seatIds:[seats[1]],products:[]})]);
  concurrent.forEach((r,i)=>{if(r.body?.booking)fixtures.orders.push({id:r.body.booking.id,owner:people[i?'customerB':'customerA'].id,purpose:'same-seat-concurrency'});});persist();
  check('two-customer-one-seat-concurrency',concurrent.filter(r=>r.status===201).length===1&&concurrent.filter(r=>r.status===409).length===1,concurrent);
  const overlap=await Promise.all([call('overlapping-seats-A','POST','/bookings',a,{showtimeId:showId,seatIds:[seats[2],seats[3]],products:[]}),call('overlapping-seats-B','POST','/bookings',b,{showtimeId:showId,seatIds:[seats[3],seats[4]],products:[]})]);
  overlap.forEach((r,i)=>{if(r.body?.booking)fixtures.orders.push({id:r.body.booking.id,owner:people[i?'customerB':'customerA'].id,purpose:'overlap-concurrency'});});persist();
  check('multi-seat-concurrency-atomic',overlap.filter(r=>r.status===201).length===1&&overlap.filter(r=>r.status===409).length===1,overlap);
  const historyOrders=(await must('customer-order-history','GET','/orders',a)).orders;
  check('order-history-owned',historyOrders.some(x=>x.id===order.id)&&!historyOrders.some(x=>x.id===expiredLater.id));
  save('integration-summary.json',{checks:checks.length,pass:checks.filter(x=>x.status==='PASS').length,fail:checks.filter(x=>x.status==='FAIL').length,runId});
}catch(error){save('integration-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}
finally{persist();}

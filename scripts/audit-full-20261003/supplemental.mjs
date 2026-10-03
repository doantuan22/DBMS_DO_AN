import { fixtures,check,call,must,persist,login,adminLogin,date,finish } from './api.mjs';
import { save } from './collect.mjs';
const p=fixtures.prefix;
try{
  const admin=await adminLogin(),a=await login('customerA'),b=await login('customerB'),m=await login('managerA');
  const room=fixtures.rooms[0].id,cinema=fixtures.cinemas[0].id;
  const showBody={movieId:fixtures.movieId,roomId:room,startsAt:`${date(4)}T17:00:00+07:00`,endsAt:`${date(4)}T18:30:00+07:00`,format:'2D',basePrice:80000};
  const show=(await must('concurrency-showtime-create','POST','/admin/showtimes',admin,showBody)).showtime.recordset[0].SuatChieuID;
  fixtures.showtimes.push({id:show,body:showBody,purpose:'concurrency-and-browser'});fixtures.browserShowtimeId=show;persist();
  const seats=fixtures.seats.filter(x=>x.roomId===room).map(x=>x.id);
  const booking=(label,token,seatIds,extra={})=>call(label,'POST','/bookings',token,{showtimeId:show,seatIds,products:[],...extra});
  const recordOrder=(r,kind,purpose)=>{if(r.body?.booking)fixtures.orders.push({id:r.body.booking.id,owner:fixtures.users.find(u=>u.kind===kind).id,purpose});persist();};
  const one=await Promise.all([booking('single-seat-A',a,[seats[0]]),booking('single-seat-B',b,[seats[0]])]);
  one.forEach((r,i)=>recordOrder(r,i?'customerB':'customerA','same-seat-concurrency'));
  check('two-customer-one-seat-concurrency',one.filter(x=>x.status===201).length===1&&one.filter(x=>x.status===409).length===1,one);
  const overlap=await Promise.all([booking('multi-seat-A',a,[seats[1],seats[2]]),booking('multi-seat-B',b,[seats[2],seats[3]])]);
  overlap.forEach((r,i)=>recordOrder(r,i?'customerB':'customerA','multi-seat-concurrency'));
  check('multi-seat-concurrency-one-atomic-winner',overlap.filter(x=>x.status===201).length===1&&overlap.filter(x=>x.status===409).length===1,overlap);
  const expiry=await booking('real-five-minute-expiry-order',b,[seats[13]]);recordOrder(expiry,'customerB','real-five-minute-expiry');
  if(expiry.status===201){const payment=(await must('expiry-before-hold-end','POST',`/orders/${expiry.body.booking.id}/payments`,b,{paymentMethod:'MOMO'})).payment;fixtures.expiry={orderId:expiry.body.booking.id,paymentId:payment.id,createdAt:new Date().toISOString(),holdExpiresAt:expiry.body.booking.holdExpiresAt};persist();}
  // Use a third customer so the three-hold limit cannot contaminate money/payment checks.
  const email=`audit.${fixtures.runId}.extra@example.invalid`,password=`Audit!${fixtures.runId}987`;
  const extra=(await must('extra-customer-register','POST','/auth/register',null,{HoTen:`${p}_Extra`,Email:email,MatKhau:password})).user;
  const loginExtra=await must('extra-customer-login','POST','/auth/login',null,{Email:email,MatKhau:password});const x=loginExtra.token;
  fixtures.users.push({kind:'extra',id:loginExtra.user.userId,email,role:'KHACH_HANG'});persist();
  const ordinary=await booking('browser-unpaid-order',x,[seats[4]]);recordOrder(ordinary,'extra','browser-payment');fixtures.browserOrderId=ordinary.body.booking?.id;persist();
  const paidAttempt=(await must('multi-payment-attempt-1','POST',`/orders/${fixtures.browserOrderId}/payments`,x,{paymentMethod:'MOMO'})).payment;
  await must('multi-payment-failure-1','POST',`/orders/${fixtures.browserOrderId}/payments/${paidAttempt.id}/result`,x,{status:'Thất bại'});
  const paidAttempt2=(await must('multi-payment-attempt-2','POST',`/orders/${fixtures.browserOrderId}/payments`,x,{paymentMethod:'MOMO'})).payment;
  await must('multi-payment-failure-2','POST',`/orders/${fixtures.browserOrderId}/payments/${paidAttempt2.id}/result`,x,{status:'Thất bại'});
  const paidAttempt3=(await must('multi-payment-attempt-3','POST',`/orders/${fixtures.browserOrderId}/payments`,x,{paymentMethod:'MOMO'})).payment;
  const duplicate=await Promise.all([0,1].map(i=>call(`duplicate-payment-result-${i}`,'POST',`/orders/${fixtures.browserOrderId}/payments/${paidAttempt3.id}/result`,x,{status:'Thành công'})));
  check('duplicate-payment-result-idempotent',duplicate.every(r=>r.status===200),duplicate);
  check('multiple-failed-attempts-retained',duplicate[0].body.order.payments.length===3&&duplicate[0].body.order.payments.filter(p=>p.status==='Thất bại').length===2);
  const rev1=await must('paid-revenue-with-three-images','GET',`/admin/reports/revenue?cinemaId=${cinema}`,admin);
  const image=fixtures.images[0].id;
  await must('hide-one-image','PUT',`/admin/cinemas/${cinema}/images/${image}`,admin,{url:'/favicon.svg',description:'AUDIT hidden',displayOrder:1,status:'Tạm ẩn'});
  const rev2=await must('paid-revenue-with-two-images','GET',`/admin/reports/revenue?cinemaId=${cinema}`,admin);
  check('nonzero-revenue-invariant-image-count',JSON.stringify(rev1)===JSON.stringify(rev2),{before:rev1,after:rev2});
  check('nonzero-revenue-equals-paid-order',rev2.totals?.TongDoanhThuThucTe===92000,rev2);
  await must('manager-dashboard-real','GET',`/manager/cinemas/${cinema}/dashboard`,m);await must('manager-revenue-real','GET',`/manager/cinemas/${cinema}/revenue`,m);
  const showDetail=await must('wall-clock-contract-check','GET',`/showtimes/${show}`);
  check('local-cinema-clock-preserved',showDetail.startTime==='17:00',{submitted:showBody.startsAt,returned:showDetail.startTime});
  for(const id of [seats[5],seats[6],seats[7],seats[8]]){const r=await booking(`holding-limit-${id}`,x,[id]);recordOrder(r,'extra','three-order-limit');}
  const hist=(await must('holding-limit-order-state','GET','/orders',x)).orders;
  check('holding-limit-never-above-three',hist.filter(q=>q.status==='Chờ thanh toán').length===3,hist.map(q=>({id:q.id,status:q.status})));
  const lastPromo=(await must('one-use-promotion-create','POST','/admin/promotions',admin,{code:`${p}_LAST`.toUpperCase(),discountType:'FIXED',discountValue:1000,startsAt:`${date(-1)}T00:00:00+07:00`,endsAt:`${date(10)}T23:59:59+07:00`,quantity:1})).promotion.KhuyenMaiID;
  fixtures.other.push({table:'KHUYENMAI',id:lastPromo});persist();
  // Create two fresh customers for the last-use race; all mutations still go through the API.
  const raceTokens=[];
  for(let i=0;i<2;i++){const e=`audit.${fixtures.runId}.race${i}@example.invalid`;await must(`race-customer-${i}`,'POST','/auth/register',null,{HoTen:`${p}_Race${i}`,Email:e,MatKhau:password});const l=await must(`race-login-${i}`,'POST','/auth/login',null,{Email:e,MatKhau:password});fixtures.users.push({kind:`race${i}`,id:l.user.userId,email:e,role:'KHACH_HANG'});raceTokens.push(l.token);persist();}
  const race=await Promise.all(raceTokens.map((t,i)=>booking(`last-promo-race-${i}`,t,[seats[9+i]],{promotionCode:`${p}_LAST`.toUpperCase()})));
  race.forEach((r,i)=>recordOrder(r,`race${i}`,'last-promotion-use'));
  check('last-promotion-use-one-discounted-order',race.filter(r=>r.body?.booking?.discountTotal>0).length===1&&race.every(r=>r.status<500),race);
  // CRUD on new role and permission only; seeded RBAC is never changed.
  const role=(await must('audit-role-create','POST','/admin/roles',admin,{code:p.toUpperCase(),name:`${p}_Role`})).role.VaiTroID;
  const permission=(await must('audit-permission-create','POST','/admin/permissions',admin,{code:p.toUpperCase(),name:`${p}_Permission`})).permission.QuyenID;
  fixtures.other.push({table:'VAITRO',id:role},{table:'QUYEN',id:permission});persist();
  await must('role-permission-replace','PUT',`/admin/roles/${role}/permissions`,admin,{permissionIds:[permission]});
  check('role-permission-readback',(await must('role-permission-list','GET',`/admin/roles/${role}/permissions`,admin)).permissions.some(q=>q.QuyenID===permission));
  await must('role-update','PUT',`/admin/roles/${role}`,admin,{name:`${p}_RenamedRole`});await must('permission-update','PUT',`/admin/permissions/${permission}`,admin,{name:`${p}_RenamedPermission`});
  check('role-permission-clear',(await call('role-permission-clear','PUT',`/admin/roles/${role}/permissions`,admin,{permissionIds:[]})).status===200);
  await must('audit-role-delete','DELETE',`/admin/roles/${role}`,admin);await must('audit-permission-delete','DELETE',`/admin/permissions/${permission}`,admin);
  fixtures.other.filter(o=>o.table==='VAITRO'&&o.id===role||o.table==='QUYEN'&&o.id===permission).forEach(o=>o.deleted=true);persist();
  // New-only invalid dates, truncation and role checks. Record any unexpected created ids.
  const future=await call('future-birthday-profile','PUT','/auth/me',a,{HoTen:`${p}_A_updated`,NgaySinh:'2999-01-01'});
  check('future-birthday-rejected',future.status===400,future);
  const longRoom=await call('overlength-room-name','POST','/admin/rooms',admin,{cinemaId:cinema,name:`${p}_`+'x'.repeat(110),type:'2D'});
  if(longRoom.body.room)fixtures.rooms.push({id:longRoom.body.room.PhongID,cinemaId:cinema,purpose:'truncation-test'});persist();
  check('overlength-room-name-rejected',longRoom.status===400,{status:longRoom.status,returnedLength:longRoom.body.room?.TenPhong.length});
  const staffCustomer=await call('admin-customer-role-create','POST','/admin/users',admin,{name:`${p}_WrongStaffRole`,email:`audit.${fixtures.runId}.wrongstaff@example.invalid`,password,roleId:4});
  if(staffCustomer.body.user)fixtures.users.push({kind:'wrongstaff',id:staffCustomer.body.user.NguoiDungID,email:staffCustomer.body.user.Email,role:'KHACH_HANG',purpose:'admin-staff-role-contract'});persist();
  check('admin-staff-create-rejects-customer-role',staffCustomer.status===400,staffCustomer);
  const assignment=await must('assignment-list-after-fixtures','GET',`/admin/assignments?userId=${fixtures.users.find(u=>u.kind==='managerA').id}`,admin);
  const assigned=assignment.assignments.find(q=>q.RapID===cinema);
  fixtures.primaryAssignmentId=assigned?.PhanCongID;persist();
}catch(error){save('supplemental-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}
finally{finish('supplemental');}

import { fixtures,check,call,must,persist,login,adminLogin,date,finish } from './api.mjs';
import { save } from './collect.mjs';
try{
  const a=await login('customerA'),b=await login('customerB'),admin=await adminLogin(),manager=await login('managerA'),support=await login('support');
  const seats=fixtures.seats.filter(s=>s.roomId===fixtures.rooms[0].id).map(s=>s.id),show=fixtures.browserShowtimeId;
  for(const [label,body,expected] of [
    ['eleven-seats',{showtimeId:show,seatIds:seats.slice(0,11),products:[]},400],
    ['eleven-products',{showtimeId:show,seatIds:[seats[12]],products:[{productId:fixtures.productId,quantity:11}]},400],
    ['split-product-quantity',{showtimeId:show,seatIds:[seats[12]],products:[{productId:fixtures.productId,quantity:6},{productId:fixtures.productId,quantity:5}]},400],
    ['duplicate-seat-input',{showtimeId:show,seatIds:[seats[12],seats[12]],products:[]},400],
    ['empty-seat-input',{showtimeId:show,seatIds:[],products:[]},400],
    ['booking-user-spoof',{showtimeId:show,seatIds:[seats[12]],products:[],userId:27},400],
  ])check(label,(await call(label,'POST','/bookings',a,body)).status===expected);
  check('movie-missing-404',(await call('movie-missing','GET','/movies/2147483647')).status===404);
  check('showtime-missing-404',(await call('showtime-missing','GET','/showtimes/2147483647')).status===404);
  check('customer-support-write-denied',(await call('customer-support-write','POST',`/support/complaints/${fixtures.complaintId}/processings`,a,{content:'AUDIT denied',nextStatus:'Đang xử lý'})).status===403);
  check('support-admin-write-denied',(await call('support-admin-write','POST','/admin/cinemas',support,{name:'AUDIT denied',address:'AUDIT',city:'AUDIT'})).status===403);
  check('manager-customer-booking-denied',(await call('manager-customer-booking','POST','/bookings',manager,{showtimeId:show,seatIds:[seats[12]],products:[]})).status===403);
  check('foreign-complaint-detail-denied',(await call('foreign-complaint-detail','GET',`/complaints/${fixtures.complaintId}`,b)).status===404);
  check('foreign-payment-result-denied',(await call('foreign-payment-result','POST',`/orders/41/payments/21/result`,b,{status:'Thành công'})).status===404);
  const image=fixtures.images[1].id;
  check('wrong-cinema-image-update-denied',(await call('wrong-cinema-image-update','PUT',`/admin/cinemas/${fixtures.cinemas[1].id}/images/${image}`,admin,{url:'/favicon.svg',displayOrder:2,status:'Hoạt động'})).status===404);
  check('inactive-cover-denied',(await call('inactive-cover','PATCH',`/admin/cinemas/${fixtures.cinemas[0].id}/images/${fixtures.images[0].id}/cover`,admin,{cover:true})).status===409);
  check('invalid-image-protocol-denied',(await call('invalid-image-protocol','POST',`/admin/cinemas/${fixtures.cinemas[0].id}/images`,admin,{url:'javascript:alert(1)',displayOrder:0})).status===400);
  check('percent-100-denied',(await call('percent-100','POST','/admin/promotions',admin,{code:fixtures.prefix+'_100',discountType:'PERCENT',discountValue:100,startsAt:`${date()}T00:00:00+07:00`,endsAt:`${date(1)}T23:59:59+07:00`,quantity:1})).status===400);
  const before=(await must('food-snapshot-order-before','GET',`/orders/${fixtures.orders.find(o=>o.purpose==='browser-food-and-promotion').id}`,await login('browser'))).order;
  check('food-and-promo-final-total',before.ticketTotal===92000&&before.productTotal===60000&&before.discountTotal===30400&&before.total===121600,before);
  const noDepend=(await must('deletable-cinema-create','POST','/admin/cinemas',admin,{name:fixtures.prefix+'_Delete',address:'AUDIT',city:'AUDIT'})).cinema.RapID;
  fixtures.cinemas.push({id:noDepend,purpose:'delete-new-empty-fixture'});persist();
  check('delete-own-empty-cinema',(await call('deletable-cinema-delete','DELETE',`/admin/cinemas/${noDepend}`,admin)).status===200);fixtures.cinemas.find(c=>c.id===noDepend).deleted=true;persist();
  check('delete-own-cinema-with-history-denied',(await call('cinema-dependency-delete','DELETE',`/admin/cinemas/${fixtures.cinemas[0].id}`,admin)).status===409);
  check('delete-own-product-with-order-denied',(await call('product-dependency-delete','DELETE',`/admin/products/${fixtures.productId}`,admin)).status===409);
  check('delete-own-seat-with-ticket-denied',(await call('seat-dependency-delete','DELETE',`/admin/seats/${seats[0]}`,admin)).status===409);
  const overlappingPricing={cinemaId:fixtures.cinemas[0].id,seatType:'Tất cả',dayType:'Tất cả',format:'Tất cả',surcharge:100,startsOn:date(),endsOn:null};
  check('pricing-overlap-denied',(await call('pricing-overlap','POST','/admin/pricing',admin,overlappingPricing)).status===409);
}catch(error){save('boundaries-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}finally{finish('boundaries');}

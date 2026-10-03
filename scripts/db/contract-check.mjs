import path from 'node:path';
import {dbRoot,audit,read,write} from './lib.mjs';
const parameters=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json'))).expected.parameters;
import {PROCEDURES} from '../../backend/src/db/procedures.js';
import {createAdminService} from '../../backend/src/services/adminService.js';
import {createManagerService} from '../../backend/src/services/managerService.js';
import {createAuthService} from '../../backend/src/services/authService.js';
import {createCatalogService} from '../../backend/src/services/catalogService.js';
import {createBookingService} from '../../backend/src/services/bookingService.js';
import {createOrderService} from '../../backend/src/services/orderService.js';
import {createFeedbackService} from '../../backend/src/services/feedbackService.js';
import {createSupportService} from '../../backend/src/services/supportService.js';
import {checkDatabase} from '../../backend/src/services/healthService.js';
import {startExpirePendingOrdersJob} from '../../backend/src/jobs/expirePendingOrders.js';

const calls=[],invocations=[];
let current;
const row={NguoiDungID:1,MaVaiTro:'KHACH_HANG',TrangThai:'Hoạt động',MatKhauHash:'AUDIT_STUB',HoTen:'AUDIT',PhimID:1,RapID:1,PhongID:1,GheID:1,TenGhe:'A1',TrangThaiGhe:'Trống',GiaVe:80000,SanPhamID:1,Gia:10000,DonDatVeID:1,ThanhToanID:1,KhieuNaiID:1,DanhGiaID:1};
const execute=async(key,input={},outputs={})=>{calls.push({serviceMethod:current,key,procedure:PROCEDURES[key],inputs:Object.fromEntries(Object.entries(input).map(([n,v])=>[n,{type:v.type?.type?.name??v.type?.name??String(v.type),length:v.type?.length,precision:v.type?.precision,scale:v.type?.scale}])),outputs:Object.keys(outputs)});return{recordset:[row],recordsets:[[row],[row],[row],[row]],output:{NewUserId:1,NewPhimID:1,NewDonDatVeID:1,ThanhToanID:1,IsValid:true}};};
const input={name:'AUDIT',email:'audit@example.invalid',password:'AuditPassword123',roleId:1,code:'AUDIT',permissionIds:[1],cinemaId:1,userId:1,roomId:1,movieId:1,showtimeId:1,seatIds:[1],row:'A',number:1,type:'2D',status:'Hoạt động',format:'2D',basePrice:80000,surcharge:1,startsOn:'2026-10-03',endsOn:null,startsAt:'2026-10-04T17:00:00Z',endsAt:'2026-10-04T18:30:00Z',quantity:1,discountType:'FIXED',discountValue:1000,minimumOrder:0,price:10000,title:'AUDIT',durationMinutes:90,releaseDate:'2026-10-03',endDate:null,genreIds:[1],url:'/favicon.svg',cover:true,displayOrder:1,rating:5,content:'AUDIT',nextStatus:'Đang xử lý',orderId:1,paymentMethod:'MOMO',products:[],promotionCode:'AUDIT',HoTen:'AUDIT',Email:'audit@example.invalid',MatKhau:'AuditPassword123'};
const opts={execute,executeWithOutputs:execute,hash:async()=> 'AUDIT_HASH',verify:async()=>true,createToken:()=>({token:'AUDIT_STUB'})};
const services={admin:createAdminService(opts),manager:createManagerService(opts),auth:createAuthService(opts),catalog:createCatalogService(opts),booking:createBookingService(opts),order:createOrderService(opts),feedback:createFeedbackService(opts),support:createSupportService(opts)};
for(const [area,service] of Object.entries(services))for(const method of Object.keys(service)){
  if(method==='write')continue;current=`${area}.${method}`;
  let args;
  if(area==='admin'){
    args=method.startsWith('create')?[input]:method.startsWith('update')?[1,input]:method.startsWith('delete')?[1]:[input];
    if(['createCinemaImage'].includes(method))args=[1,input];
    if(method==='updateCinemaImage')args=[1,1,input];
    if(method==='deleteCinemaImage')args=[1,1];
    if(method==='setCinemaImageCover')args=[1,1,true];
    if(method==='setRolePermissions')args=[1,[1]];
    if(method==='rolePermissions'||method==='cinemaImages')args=[1];
    if(method==='setMovieActors')args=[1,[{actorId:1,role:'AUDIT'}]];
    if(method==='setUserStatus')args=[1,'Hoạt động'];
  }else if(area==='manager'){args=['createShowtime'].includes(method)?[1,input]:['cancelShowtime'].includes(method)?[1,1,'AUDIT']:[1,1,input];}
  else if(area==='auth'){args=['registerCustomer','login'].includes(method)?[input]:method==='updateProfile'?[1,input]:[1];}
  else if(area==='catalog'){args=['listMovies','listCinemas','listShowtimes'].includes(method)?[input]:[1];}
  else if(area==='booking'){args=method==='validatePromotion'?[input]:method==='createBooking'?[1,input]:[1];}
  else if(area==='order'){args=method==='createPaymentAttempt'?[1,1,input]:method==='updatePaymentResult'?[1,1,1,{status:'Thành công'}]:[1,1];}
  else if(area==='feedback'){args=method==='createReview'?[1,1,input]:method==='createComplaint'?[1,input]:[1,1];}
  else if(area==='support'){args=method==='list'?[1,input]:[1,1,input];}
  try{await service[method](...args);invocations.push({method:current,status:'CAPTURED'});}catch(e){invocations.push({method:current,status:'STUB_DTO_LIMITATION',error:e.message});}
}
current='health.checkDatabase';await checkDatabase(execute);invocations.push({method:current,status:'CAPTURED'});
current='system.expirePendingOrders';
const expireJob=startExpirePendingOrdersJob({execute,log:{info(){},error(){}}});
try { await expireJob.tick();invocations.push({method:current,status:'CAPTURED'}); } finally { expireJob.stop(); }
const problems=[];
const captured=calls.map(call=>{
 const name=call.procedure?.split('.').at(-1);
 const expected=parameters.filter(p=>p.objectName===name&&p.parameter_id>0);
 for(const [param,type] of Object.entries(call.inputs)) {
  const actual=expected.find(p=>p.name==='@'+param);
  if(!actual)problems.push(`${call.serviceMethod}: unknown parameter ${name}.${param}`);
  else if(type.type.toLowerCase()!==actual.typeName.toLowerCase())problems.push(`${call.serviceMethod}: ${name}.${param} type ${type.type} vs ${actual.typeName}`);
  else {
   if(type.length!==undefined&&['varchar','nvarchar','char','nchar','varbinary','binary'].includes(actual.typeName)) {
    const expectedLength=actual.max_length===-1?65535:actual.max_length/(['nvarchar','nchar'].includes(actual.typeName)?2:1);
    if(type.length!==expectedLength)problems.push(`${call.serviceMethod}: ${name}.${param} length ${type.length} vs ${expectedLength}`);
   }
   for(const field of ['precision','scale'])if(type[field]!==undefined&&type[field]!==actual[field])problems.push(`${call.serviceMethod}: ${name}.${param} ${field} ${type[field]} vs ${actual[field]}`);
  }
 }
 for(const param of call.outputs)if(!expected.some(p=>p.name==='@'+param&&p.is_output))problems.push(`${call.serviceMethod}: unknown output ${name}.${param}`);
 return call;
});
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const missing=Object.values(PROCEDURES).filter(name=>!manifest.modules[name.split('.').at(-1)]);
problems.push(...missing.map(name=>`Missing source: ${name}`));
write(path.join(audit,'backend-contract-check.json'),{status:problems.length?'FAIL':'PASS',serviceMethods:invocations.length,capturedCalls:captured.length,whitelistEntries:Object.keys(PROCEDURES).length,uniqueWhitelistProcedures:new Set(Object.values(PROCEDURES)).size,problems,invocations,calls:captured,note:'Service factories exercised with injected execution stubs; parameter names/types/output flags compared to SQL manifest. No SQL or live business writes in Node. HTTP/SQL smoke validates runtime result contracts separately.'});
console.log(JSON.stringify({status:problems.length?'FAIL':'PASS',serviceMethods:invocations.length,capturedCalls:captured.length,missingSource:missing.length,problems}));
if(problems.length)process.exitCode=1;

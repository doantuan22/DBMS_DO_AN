import fs from 'node:fs';
import path from 'node:path';
import {root,out,save,walk} from './collect.mjs';
import {PROCEDURES} from '../../backend/src/db/procedures.js';
import {createAdminService} from '../../backend/src/services/adminService.js';
import {createManagerService} from '../../backend/src/services/managerService.js';
import {createAuthService} from '../../backend/src/services/authService.js';
import {createCatalogService} from '../../backend/src/services/catalogService.js';
import {createBookingService} from '../../backend/src/services/bookingService.js';
import {createOrderService} from '../../backend/src/services/orderService.js';
import {createFeedbackService} from '../../backend/src/services/feedbackService.js';
import {createSupportService} from '../../backend/src/services/supportService.js';

// Contract capture only. Injected execution stubs never open a database connection.
const live=JSON.parse(fs.readFileSync(path.join(out,'live-objects.json'),'utf8'));
const parameters=JSON.parse(fs.readFileSync(path.join(out,'live-parameters.json'),'utf8'));
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
const contracts=calls.map(c=>{const name=c.procedure?.replace('dbo.',''),expected=parameters.filter(p=>p.objectName===name&&p.parameter_id>0);return{...c,unknownInputs:Object.keys(c.inputs).filter(n=>!expected.some(p=>p.name==='@'+n)),unknownOutputs:c.outputs.filter(n=>!expected.some(p=>p.name==='@'+n&&p.is_output)),deployedParameters:expected};});
save('backend-sp-contract-capture.json',contracts);save('contract-invocations.json',invocations);
const deps=JSON.parse(fs.readFileSync(path.join(out,'live-dependencies.json'),'utf8'));
const drift=JSON.parse(fs.readFileSync(path.join(out,'module-drift.json'),'utf8'));
const catalog=live.filter(o=>o.definition).map(o=>{
  const d=o.definition,src=drift.find(s=>s.name===o.name);
  return{name:o.name,type:o.type.trim(),source:src?.source,sourceStatus:src?.status,parameters:parameters.filter(p=>p.objectName===o.name),references:[...new Set(deps.filter(x=>x.objectName===o.name).map(x=>x.referenced_entity_name))],callers:[...new Set(deps.filter(x=>x.referenced_entity_name===o.name).map(x=>x.objectName))],backendCallers:[...new Set(calls.filter(c=>c.procedure==='dbo.'+o.name).map(c=>c.serviceMethod))],transaction:/BEGIN\s+TRAN/i.test(d),savepoint:/SAVE\s+TRAN/i.test(d),tryCatch:/BEGIN\s+TRY/i.test(d),xactAbort:/XACT_ABORT\s+ON/i.test(d),updates:/\b(?:INSERT|UPDATE|DELETE|MERGE)\s+(?:INTO\s+)?(?:dbo\.|@)/i.test(d),locks:[...new Set(d.match(/\b(?:UPDLOCK|HOLDLOCK|SERIALIZABLE|NOLOCK|TABLOCKX)\b/gi)??[])],throwNumbers:[...new Set([...d.matchAll(/\bTHROW\s+(\d+)/gi)].map(m=>Number(m[1])))],multirowReview:o.type.trim()==='TR'?(/\bINSERTED\b/i.test(d)&&!/=\s*\w+\s+FROM\s+INSERTED/i.test(d)?'SET_BASED_SOURCE_REVIEW; runtime batch not executed':'REVIEW_NEEDED'):undefined,verification:'STATIC CONTRACT/METADATA; not all branches executed'};
});save('complete-module-audit.json',catalog);
const routes=JSON.parse(fs.readFileSync(path.join(out,'api-inventory.json'),'utf8'));
const chain=routes.map(r=>{const routeSource=fs.readFileSync(path.join(root,r.file),'utf8');const refs=[...r.handlers.matchAll(/\b(\w+)\.(\w+)/g)].filter(m=>!['req','res'].includes(m[1]));let controllerFile,controller,body='';
  for(const ref of refs){const re=new RegExp(`import\\s+\\*\\s+as\\s+${ref[1]}\\s+from\\s+'([^']+)'`);const imp=re.exec(routeSource);if(imp&&imp[1].includes('/controllers/')){controllerFile=path.resolve(path.dirname(path.join(root,r.file)),imp[1]);controller=ref[2];break;}}
  if(!controllerFile)for(const imp of routeSource.matchAll(/import\s+\{([^}]+)\}\s+from\s+'([^']*\/controllers\/[^']+)'/g)){const found=imp[1].split(',').map(s=>s.trim()).find(n=>new RegExp(`\\b${n}\\b`).test(r.handlers));if(found){controllerFile=path.resolve(path.dirname(path.join(root,r.file)),imp[2]);controller=found;break;}}
  if(controllerFile){const file=fs.readFileSync(controllerFile,'utf8');const start=file.search(new RegExp(`export\\s+(?:const\\s+${controller}\\s|async\\s+function\\s+${controller}\\b)`));if(start>=0){const next=/\nexport\s+(?:const|async\s+function)/.exec(file.slice(start+1));body=file.slice(start,next?start+1+next.index:undefined);}}
  else body=r.handlers;
  const serviceMethods=[...body.matchAll(/(\w+)Service\.(\w+)\(/g)].map(m=>`${m[1]}.${m[2]}`);
  if(['currentUser','currentPermissions'].includes(controller))serviceMethods.push('auth.getCurrentUser');
  const sp=[...new Set(calls.filter(c=>serviceMethods.includes(c.serviceMethod)).map(c=>c.procedure))];
  if(r.path==='/api/health/db')sp.push(PROCEDURES.SYSTEM_HEALTH_CHECK);
  return{...r,globalGuards:[...routeSource.matchAll(/router\.use\(([^;]+)\);/g)].map(m=>m[1].trim()),controller:controllerFile?path.relative(root,controllerFile).replaceAll('\\','/')+'#'+controller:r.file+'#inline',validators:[...new Set(body.match(/(?:validators\.\w+|validate\w+)(?=\()/g)??[])],serviceMethods,procedures:sp,tablesAndDependencies:[...new Set(catalog.filter(c=>sp.includes('dbo.'+c.name)).flatMap(c=>c.references))],note:sp.length?'captured service call contracts; dependent objects in complete-module-audit.json':r.path==='/api/health'?'liveness only; no database call':'controller mapping requires manual review'};
});save('api-chain-inventory.json',chain);
const sourceFiles=walk(path.join(root,'backend/src')).filter(p=>p.endsWith('.js'));save('raw-sql-manual-review.json',sourceFiles.map(p=>{const s=fs.readFileSync(p,'utf8');return{file:path.relative(root,p).replaceAll('\\','/'),queryCalls:[...s.matchAll(/\.(query|batch)\s*\(/g)].map(m=>({line:s.slice(0,m.index).split('\n').length,call:m[0]})),executeCalls:(s.match(/\.execute\s*\(/g)??[]).length};}));
console.log(JSON.stringify({serviceMethods:invocations.length,calls:calls.length,signatureIssues:contracts.filter(c=>c.unknownInputs.length||c.unknownOutputs.length),stubLimitations:invocations.filter(i=>i.status!=='CAPTURED'),mappedEndpoints:chain.filter(c=>c.procedures.length).length,endpointCount:chain.length},null,2));

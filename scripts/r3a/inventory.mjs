import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root,dbRoot,read,write,directory,evidence,productionHashes } from './common.mjs';
import { credentials } from '../db/lib.mjs';
Object.assign(process.env,credentials());
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const captures=JSON.parse(read(path.join(evidence,'service-contracts.json'))).calls;
const line=(body,index)=>body.slice(0,index).split('\n').length;
const ref=(file,number)=>`${file}:${number}`;
const analysisDocument='Phân Tích _ Thiết Kế.md';
const analysisBody=read(path.join(root,analysisDocument));
const useCases=Object.fromEntries([...analysisBody.matchAll(/\| \*\*Mã Use Case\*\* \| ((?:KH|QLR|CSKH|ADM)-\d+)[^\n]*\n\| \*\*Tên Use Case\*\* \| ([^|]+)\|/g)].map(m=>[m[1],{id:m[1],name:m[2].trim(),source:ref(analysisDocument,line(analysisBody,m.index))}]));
assert.equal(Object.keys(useCases).length,45);
function useCaseIds(route,method) {
 if(route==='/api/auth/register')return ['KH-01'];
 if(route==='/api/auth/login')return ['KH-02','QLR-01','CSKH-01','ADM-01'];
 if(route.startsWith('/api/auth/me'))return ['KH-03'];
 if(route.startsWith('/api/auth/permissions'))return [];
 if(route.startsWith('/api/admin/')) {
  const key=route.split('/')[3];
  if(key==='roles'&&route.includes('/permissions'))return ['ADM-05'];
  const map={users:'ADM-02',roles:'ADM-03',permissions:'ADM-04',assignments:'ADM-06',cinemas:'ADM-07',rooms:'ADM-08',seats:'ADM-08',movies:'ADM-09',actors:'ADM-09',genres:'ADM-10',products:'ADM-11',promotions:'ADM-12',pricing:'ADM-13',showtimes:'ADM-14',complaints:'ADM-15',reports:'ADM-16',dashboard:'ADM-16'};
  return [map[key]];
 }
 if(route.startsWith('/api/manager/')) {
  if(route==='/api/manager/cinemas')return ['QLR-01'];
  if(route.includes('/showtimes'))return [method==='POST'&&route.endsWith('/cancel')?'QLR-06':method==='PUT'?'QLR-05':'QLR-04'];
  if(route.includes('/seats'))return ['QLR-03'];if(route.includes('/rooms'))return ['QLR-02'];if(route.includes('/pricing'))return ['QLR-07'];
  if(route.endsWith('/dashboard'))return ['QLR-08'];if(route.endsWith('/revenue'))return ['QLR-09'];
 }
 if(route.startsWith('/api/support/'))return [route.endsWith('order-reference')?'CSKH-04':route.endsWith('/processings')?'CSKH-05':route.endsWith('/status')?'CSKH-06':route==='/api/support/complaints'?'CSKH-02':'CSKH-03'];
 if(route==='/api/bookings')return ['KH-07','KH-08','KH-09'];
 if(route.startsWith('/api/orders'))return [route.includes('/payments')?'KH-10':route==='/api/orders'?'KH-11':'KH-12'];
 if(route.startsWith('/api/complaints'))return ['KH-14'];
 if(route.startsWith('/api/promotions'))return ['KH-09'];
 if(route.startsWith('/api/products'))return ['KH-08'];
 if(route.includes('/reviews'))return ['KH-13'];
 if(route.includes('/showtimes')||route.startsWith('/api/cinemas'))return [route.endsWith('/seats')?'KH-06':'KH-05'];
 if(route.startsWith('/api/movies')||route.startsWith('/api/genres'))return ['KH-04'];
 return [];
}
function closeParen(body,start) {
 let depth=0,quote=null;
 for(let i=start;i<body.length;i++) {
  const c=body[i];
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='/'&&body[i+1]==='/'){i=body.indexOf('\n',i);continue;}
  if(c==='/'&&body[i+1]==='*'){i=body.indexOf('*/',i+2)+1;continue;}
  if(c==='(')depth++;if(c===')'&&!--depth)return i;
 }
 throw Error('Unbalanced route source.');
}
const sqlObjects={};
for(const [name,file] of Object.entries(manifest.modules)) {
 const body=read(path.join(dbRoot,file));
 const executable=body.replace(/\/\*[\s\S]*?\*\//g,'').replace(/--[^\r\n]*/g,'');
 const calls=[...executable.matchAll(/\bEXEC(?:UTE)?\s+(?:dbo\.)?([a-zA-Z_]\w*)/gi)].map(m=>m[1]);
 const permissionChecks=[...executable.matchAll(/fn_KiemTraQuyenNguoiDung\s*\([^,]+,\s*N?'([^']+)'\s*\)/gi)].map(m=>m[1]);
 const scope=executable.includes('fn_KiemTraQuanLyRapScope(');
 const findings=body.split(/\r?\n/).flatMap((text,i)=>/fn_KiemTraQuyenNguoiDung\(|fn_KiemTraQuanLyRapScope\(|MaVaiTro\s*(?:=|(?:NOT\s+)?IN)|@NguoiDungID IS NOT NULL|@NguoiDungID\s*=\s*NULL|NguoiDungID\s*=\s*@NguoiDungID|TrangThai\s*(?:=|<>)\s*N'Hoạt động'/.test(text)&&!text.trim().startsWith('--')?[{reference:ref('database/'+file,i+1),text:text.trim()}]:[]);
 sqlObjects[name]={name,file:'database/'+file,type:manifest.expected.objects.find(o=>o.name===name)?.type.trim(),
  permissionChecks:[...new Set(permissionChecks)],scopeCheck:scope,execCalls:[...new Set(calls)],
  hasActorParameter:/@NguoiDungID\s+INT\b/i.test(executable.split(/\bAS\b/i)[0]),
  bypassAdmin:name==='fn_KiemTraQuyenNguoiDung'||name==='fn_KiemTraQuanLyRapScope',
  nullableActorScope:name==='sp_Showtime_CancelCascade',passesNullActor:/@NguoiDungID\s*=\s*NULL/i.test(executable),findings};
}
function closure(names) {
 const seen=new Set();function visit(name){if(seen.has(name)||!sqlObjects[name])return;seen.add(name);sqlObjects[name].execCalls.forEach(visit);}
 names.forEach(name=>visit(name.split('.').at(-1)));return [...seen];
}
function serviceMethods(fragment) {
 return [...new Set([...fragment.matchAll(/\b(\w+)Service\.(\w+)\s*\(/g)].map(m=>`${m[1]}.${m[2]}`))];
}
function controllerFragment(file,name) {
 const body=read(path.join(root,file));const exports=[...body.matchAll(/export\s+(?:(?:async\s+)?function|const)\s+(\w+)/g)];
 const at=exports.findIndex(m=>m[1]===name);assert.ok(at>=0,`Missing controller ${file}#${name}`);
 return {body:body.slice(exports[at].index,exports[at+1]?.index??body.length),reference:ref(file,line(body,exports[at].index))};
}
const mountBody=read(path.join(root,'backend/src/routes/index.js'));
const imports=Object.fromEntries([...mountBody.matchAll(/import\s+(\w+)\s+from\s+'\.\/(\w+\.js)'/g)].map(m=>[m[1],m[2]]));
const mounts=[...mountBody.matchAll(/router\.use\('([^']+)',\s*(\w+)\)/g)];
const rows=[];const unresolved=[];
for(const mount of mounts) {
 const file='backend/src/routes/'+imports[mount[2]],body=read(path.join(root,file));
 const namespaces=Object.fromEntries([...body.matchAll(/import\s+\*\s+as\s+(\w+)\s+from\s+'([^']+)'/g)].map(m=>[m[1],path.relative(root,path.resolve(path.dirname(path.join(root,file)),m[2])).replaceAll('\\','/')]));
 const namedControllers=[...body.matchAll(/import\s+\{([^}]+)\}\s+from\s+'([^']*\/controllers\/[^']+)'/g)].flatMap(m=>m[1].split(',').map(binding=>{
  const [exported,local=exported]=binding.trim().split(/\s+as\s+/);
  return {exported,local,file:path.relative(root,path.resolve(path.dirname(path.join(root,file)),m[2])).replaceAll('\\','/')};
 }));
 const router=(await import('../../'+file)).default;
 const registered=router.stack.filter(l=>l.route);
 const expressions=[...body.matchAll(/router\.(get|post|put|patch|delete|use)\s*\(/g)].map(m=>({method:m[1],start:m.index,text:body.slice(m.index+m[0].length,closeParen(body,m.index+m[0].length-1))}));
 const declarations=expressions.filter(e=>e.method!=='use');
 assert.equal(declarations.length,registered.length,'Runtime/source route inventory mismatch: '+file);
 const global=expressions.filter(e=>e.method==='use'&&!/^\s*['"]/.test(e.text)).map(e=>e.text).join(', ');
 for(const entry of declarations) {
  const relative=/^\s*['"]([^'"]+)['"]/.exec(entry.text)[1];
  const route='/api'+mount[1]+(relative==='/'?'':relative);
  const layer=registered.find(l=>l.route.path===relative&&l.route.methods[entry.method]);assert.ok(layer,route);
  const expression=global+', '+entry.text;
  const authenticated=/\bauthenticate\b/.test(expression);
  const roleGuard=/\brequire(Customer|Manager|Support|Admin)\b/.exec(expression)?.[0]??null;
  const actor={requireCustomer:'KHACH_HANG',requireManager:'QUAN_LY_RAP',requireSupport:'CSKH',requireAdmin:'ADMIN'}[roleGuard]??(authenticated?'Mọi tài khoản hoạt động':'PUBLIC');
  const backendPermission=/requirePermission\('([^']+)'\)/.exec(expression)?.[1]??null;
  let methods=serviceMethods(entry.text),references=[];
  for(const m of entry.text.matchAll(/\b(\w+)\.(\w+)\b/g)) {
   if(!namespaces[m[1]]?.includes('/controllers/'))continue;
   const fragment=controllerFragment(namespaces[m[1]],m[2]);references.push(fragment.reference);methods.push(...serviceMethods(fragment.body));
  }
  for(const binding of namedControllers)if(new RegExp('\\b'+binding.local+'\\b').test(entry.text)) {
   const fragment=controllerFragment(binding.file,binding.exported);references.push(fragment.reference);methods.push(...serviceMethods(fragment.body));
  }
  methods=[...new Set(methods)];
  if(route.startsWith('/api/auth/')&&authenticated)methods.push('auth.getCurrentUser');
  const procedures=[...new Set(methods.flatMap(method=>captures.filter(c=>c.serviceMethod===method).map(c=>c.procedure)))];
  if((methods.length&&!procedures.length)||(!methods.length&&route!=='/api/health'))unresolved.push({route,methods});
  const dbClosure=closure(procedures);
  const authorizationObjects=dbClosure.map(n=>sqlObjects[n]).filter(o=>o.permissionChecks.length||o.scopeCheck||o.passesNullActor||o.nullableActorScope);
  const authenticationProcedures=authenticated?['dbo.sp_User_GetCurrent','dbo.sp_RBAC_GetPermissionsByUser',...(actor==='QUAN_LY_RAP'?['dbo.sp_Manager_ListAssignedCinemas']:[])]:[];
  let expected=backendPermission??'PUBLIC',expectedBasis='Backend route hiện hành';
  let ownership='Không',managerScope='Không',feRoute='Public',feMenu='Navigation công khai',feAction='Không có guard permission';
  let useCase=methods.join(', ')||'Health HTTP',flags=[],notes=[];
  if(actor==='KHACH_HANG') {
   const customerPermissions={booking:'DAT_VE',orderPayment:'THANH_TOAN',review:'DANH_GIA',complaintCreate:'GUI_KHIEU_NAI'};
   const key=route==='/api/bookings'||route==='/api/promotions/validate'?'booking':route.includes('/payments')?'orderPayment':route.includes('/reviews')?'review':route==='/api/complaints'&&entry.method==='post'?'complaintCreate':null;
   expected=key?customerPermissions[key]:'CHƯA CHỐT: catalog không có quyền đọc dữ liệu Customer riêng';
   expectedBasis=key?'QUYEN seed: mô tả chức năng tương ứng':'KH-11/KH-12 hoặc lịch sử khiếu nại có ownership; cần review mapping, không tự đặt permission mới';
   ownership=route.includes('/orders')?'Có: order.NguoiDungID=req.user.userId; payment phải thuộc order đã kiểm ownership':route.includes('/complaints')?'Có: NguoiDungID từ token; order tham chiếu và complaint thuộc người dùng':route.includes('/reviews')?'Có: author từ token; eligibility vé đã xem ở trigger':route.includes('/promotions')?'Không: preview không truy cập dữ liệu riêng':'Có: chủ đơn mới từ token; không nhận userId từ body';
   feRoute=route==='/api/bookings'?'Public /booking/:showtimeId':route.includes('/reviews')?'Public /movies/:movieId':'KHACH_HANG + DAT_VE (/orders và /complaints)';
   feMenu='ROLE_AREAS: DAT_VE; links tĩnh Đơn của tôi/Khiếu nại không lọc permission';
   feAction=route==='/api/bookings'?'role KHACH_HANG + login; không DAT_VE':route.includes('/reviews')?'Boolean(user); không role/permission':'Chỉ trạng thái nghiệp vụ/loading; không permission từng chức năng';
   flags.push(key?'MISSING':'ROLE-ONLY');if(route.includes('/payments')||route.includes('/complaints'))flags.push('MISMATCH');
  } else if(actor==='QUAN_LY_RAP') {
   managerScope='Có: PHANCONG_RAP status Hiệu lực + ngày hiện hành; RapID lấy từ cinema/room/seat/showtime/pricing ở DB';
   feRoute='QUAN_LY_RAP + QL_PHONG (/manager)';feMenu='Area link QL_PHONG; page không lọc theo quyền chức năng';
   feAction='Không permission từng action; form/list phụ thuộc data success';
   if(route==='/api/manager/cinemas'){expected='CHƯA CHỐT: bootstrap danh sách rạp của chính mình';expectedBasis='Không permission riêng trong catalog; SP lọc assignments';flags.push('ROLE-ONLY');}
   else if(backendPermission!=='QL_PHONG')flags.push('MISMATCH');
   notes.push('ManagerPortal tải rooms/showtimes/pricing/dashboard/revenue bằng một Promise.all, quyền thiếu ở một API làm toàn data load lỗi.');
  } else if(actor==='CSKH'||(actor==='ADMIN'&&route.includes('/complaints'))) {
   expected=route.includes('order-reference')?'TRA_CUU_DON':backendPermission;
   expectedBasis=route.includes('order-reference')?'QUYEN.TRA_CUU_DON: xem đơn tham chiếu; hiện BE/DB không dùng':'Route + QUYEN seed';
   ownership='Không ownership Customer: queue CSKH; order bị giới hạn theo complaint liên kết, không nhận orderId tự do';
   feRoute=actor==='CSKH'?'CSKH + QL_KHIEUNAI (/support)':'ADMIN + QL_NGUOIDUNG (/admin)';
   feMenu=actor==='CSKH'?'Area QL_KHIEUNAI':'Area QL_NGUOIDUNG; tab complaints không guard';feAction='Processing/status form hiện khi detail success; không XULY_KHIEUNAI/TRA_CUU_DON guard';
   if(route.includes('order-reference')||backendPermission==='XULY_KHIEUNAI'||actor==='ADMIN')flags.push('MISMATCH');
   if(authorizationObjects.some(o=>o.permissionChecks.includes('QL_KHIEUNAI')&&o.permissionChecks.includes('XULY_KHIEUNAI'))){flags.push('MISMATCH');notes.push('DB cho QL_KHIEUNAI OR XULY_KHIEUNAI; BE read chỉ cho QL_KHIEUNAI.');}
   if(actor==='ADMIN')flags.push('BYPASS');
  } else if(actor==='ADMIN') {
   feRoute='ADMIN + QL_NGUOIDUNG (/admin)';feMenu='Area QL_NGUOIDUNG; tất cả tab sections không lọc permission';
   feAction='Form/create/edit/delete/status/cancel theo section/state; không permission riêng';
   if(backendPermission!=='QL_NGUOIDUNG')flags.push('MISMATCH');
   if(authorizationObjects.some(o=>o.passesNullActor)){flags.push('BYPASS');notes.push('Admin wrapper truyền actor NULL, bỏ qua scope; danh tính actor không xuống SP.');}
   if(!authorizationObjects.some(o=>o.permissionChecks.length))notes.push('SP Admin không kiểm permission actor; tin HTTP guard/runtime executor.');
  } else if(authenticated) {
   expected='AUTHENTICATED_SELF (không permission chuyên biệt trong catalog)';expectedBasis='auth routes + USER_GET_CURRENT/RBAC current state';
   ownership='Có: userId lấy từ authenticate, không do request cung cấp';feRoute='RequireAuth (/profile); /auth/permissions không page riêng';feMenu='Hồ sơ khi user tồn tại';feAction='Login guard, không permission nghiệp vụ riêng';
  }
  if(!authenticated)expectedBasis='Route công khai hiện tại; public catalog/XEM_PHIM cần được giữ thành quyết định policy rõ ràng';
  const dbSummary=procedures.map(p=>{
   const name=p.split('.').at(-1),o=sqlObjects[name];
   if(['sp_Admin_Assignment_Create','usp_Admin_Assignment_Update'].includes(name))return `${name}: kiểm target user.MaVaiTro=QUAN_LY_RAP, không kiểm actor permission PHANCONG_RAP`;
   if(name==='sp_Booking_Create')return `${name}: active account + booking business rules; không DAT_VE`;
   if(name==='sp_Review_Create')return `${name}: author/duplicate; trigger kiểm đã mua vé và suất đã diễn ra; không DANH_GIA`;
   if(o.permissionChecks.length)return `${name}: ${o.permissionChecks.join(' OR ')} (helper có Admin bypass)`;
   if(o.scopeCheck)return `${name}: scope, không permission chức năng`;
   if(o.execCalls.length&&closure([name]).some(n=>sqlObjects[n].scopeCheck))return `${name}: delegate scope; ${o.passesNullActor?'actor NULL':'actor từ caller'}`;
   if(o.findings.some(f=>/NguoiDungID\s*=\s*@NguoiDungID/.test(f.text)))return `${name}: lọc ownership/identity, không permission`;
   return `${name}: không permission actor; ${o.hasActorParameter?'có tham số user (kiểm rule cụ thể trong source)':'không tham số actor'}`;
  }).join('; ')||'Không gọi DB';
  const status=flags.includes('MISSING')?'MISSING':flags.includes('BYPASS')?'BYPASS':flags.includes('MISMATCH')?'MISMATCH':flags.includes('ROLE-ONLY')?'ROLE-ONLY':'MATCH';
  const ucIds=useCaseIds(route,entry.method.toUpperCase());
  assert.ok(ucIds.every(id=>useCases[id]),'Every business UC link must exist in the analysis document: '+route);
  useCase=(ucIds.length?ucIds.map(id=>id+' '+useCases[id].name).join('; '):'SYSTEM/session/health')+' ['+useCase+']';
  const page=actor==='ADMIN'?'frontend/src/pages/AdminPortal.jsx':actor==='QUAN_LY_RAP'?'frontend/src/pages/ManagerPortal.jsx':actor==='CSKH'?'frontend/src/pages/SupportPortal.jsx':actor==='KHACH_HANG'?route.includes('/reviews')?'frontend/src/components/MovieReviews.jsx':route.includes('/bookings')||route.includes('/promotions')?'frontend/src/pages/BookingPreparation.jsx':route.includes('/complaints')?'frontend/src/pages/Complaints.jsx':route.includes('/payments')?'frontend/src/pages/PaymentPage.jsx':relative==='/'?'frontend/src/pages/Orders.jsx':'frontend/src/pages/OrderDetail.jsx':authenticated?'frontend/src/pages/auth/Profile.jsx':null;
  const feReferences=page?[ref(page,1),'frontend/src/utils/authorization.js:1','frontend/src/layouts/AreaLayout.jsx:1',...(actor==='KHACH_HANG'&&route.includes('/complaints/:')?['frontend/src/pages/ComplaintDetail.jsx:1']:[])]:[];
  const dbReferences=dbClosure.flatMap(name=>sqlObjects[name].findings.map(f=>f.reference));
  if(authorizationObjects.some(o=>o.permissionChecks.length))dbReferences.push('database/05_functions/fn_KiemTraQuyenNguoiDung.sql:15');
  if(authorizationObjects.some(o=>o.scopeCheck))dbReferences.push('database/05_functions/fn_KiemTraQuanLyRapScope.sql:14');
  rows.push({actor,useCase,useCaseIds:ucIds,method:entry.method.toUpperCase(),route,authenticated,accountStatus:'authenticate đọc active NGUOIDUNG mỗi request'+(authenticated?'':' (route public không dùng)'),roleGuard,expectedPermission:expected,expectedBasis,backendPermission:backendPermission??'Không',ownership,managerScope,procedures,authenticationProcedures,dbClosure,dbAuthorization:dbSummary,feRouteGuard:feRoute,feMenuGuard:feMenu,feActionGuard:feAction,status,flags:[...new Set(flags)],notes,
   sourceReferences:[...new Set([ref(file,line(body,entry.start)),...ucIds.map(id=>useCases[id].source),...references,...procedures.map(p=>ref(sqlObjects[p.split('.').at(-1)].file,1)),...dbReferences,...feReferences,...(actor==='ADMIN'||actor==='CSKH'||actor==='QUAN_LY_RAP'||actor==='KHACH_HANG'?['frontend/src/routes/index.jsx:1','frontend/src/constants/roles.js:1']:[])])],runtimeHandlers:layer.route.stack.map(l=>l.handle.name)});
 }
}
assert.deepEqual(unresolved,[],'Every service operation must resolve to captured SPs.');
assert.equal(new Set(rows.map(r=>r.method+' '+r.route)).size,rows.length);
const ucCoverage=Object.values(useCases).map(uc=>({...uc,endpoints:rows.filter(r=>r.useCaseIds.includes(uc.id)).map(r=>r.method+' '+r.route)}));
assert.ok(ucCoverage.every(uc=>uc.endpoints.length),'Every one of the 45 analysis use cases must have current API trace coverage.');
write(path.join(evidence,'usecase-coverage.json'),ucCoverage);
const summary={at:new Date().toISOString(),totalEndpoints:rows.length,protectedEndpoints:rows.filter(r=>r.authenticated).length,publicEndpoints:rows.filter(r=>!r.authenticated).length,
 byStatus:Object.fromEntries(['MATCH','MISSING','MISMATCH','ROLE-ONLY','BYPASS'].map(s=>[s,rows.filter(r=>r.status===s).length])),customerRoleOnly:rows.filter(r=>r.actor==='KHACH_HANG').map(r=>r.method+' '+r.route),unresolved};
write(path.join(evidence,'endpoint-inventory.json'),{summary,endpoints:rows});
write(path.join(evidence,'database-authorization.json'),Object.values(sqlObjects));
const fields=[['Actor/Role','actor'],['Use Case/service action','useCase'],['HTTP Method + Route',r=>r.method+' '+r.route],['Authentication/current status',r=>r.authenticated?'Bearer + live active account':'PUBLIC'],['Permission mong đợi','expectedPermission'],['Căn cứ/quyết định cần review','expectedBasis'],['Permission BE','backendPermission'],['Hardcode role','roleGuard'],['Ownership','ownership'],['Manager Scope','managerScope'],['SP operation',r=>r.procedures.join(', ')],['DB kiểm gì','dbAuthorization'],['FE route guard','feRouteGuard'],['FE menu guard','feMenuGuard'],['FE action guard','feActionGuard'],['Trạng thái','status'],['Flags',r=>r.flags.join(', ')],['Trace',r=>r.sourceReferences.join('; ')],['Ghi chú',r=>r.notes.join('; ')]];
const val=(r,f)=>typeof f==='function'?f(r):r[f]??'';
const csv=value=>'"'+String(value).replaceAll('"','""')+'"';
write(path.join(directory,'PERMISSION_MATRIX.csv'),'\uFEFF'+[fields.map(f=>csv(f[0])).join(','),...rows.map(r=>fields.map(f=>csv(val(r,f[1]))).join(','))].join('\n')+'\n');
const cell=value=>String(value).replaceAll('|','\\|').replaceAll('\n',' ');
write(path.join(directory,'PERMISSION_MATRIX.md'),'# Permission Matrix R3A\n\nSource-traced current behavior; đề xuất cần review, chưa là policy production. CSV/JSON chứa toàn bộ field và trace. `CHƯA CHỐT` là thiếu mapping trong catalog, không suy đoán permission mới. Một row có thể có nhiều flags; status ưu tiên MISSING → BYPASS → MISMATCH → ROLE-ONLY → MATCH. MATCH chỉ mô tả các lớp permission đã map, không chứng nhận toàn SP có defense in depth.\n\n'+fields.map(f=>cell(f[0])).join(' | ').replace(/^/,'| ').replace(/$/,' |')+'\n| '+fields.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+fields.map(f=>cell(val(r,f[1]))).join(' | ')+' |').join('\n')+'\n');
const catalog=JSON.parse(read(path.join(evidence,'rbac-inventory.json')));
const permissionUsage=catalog.permissions.map(p=>({id:p.QuyenID,code:p.MaQuyen,name:p.TenQuyen,description:p.MoTa,
 roles:catalog.grants.filter(g=>g.MaQuyen===p.MaQuyen).map(g=>g.MaVaiTro),
 backendRoutes:rows.filter(r=>r.backendPermission===p.MaQuyen).map(r=>r.method+' '+r.route),
 expectedRoutes:rows.filter(r=>r.expectedPermission===p.MaQuyen).map(r=>r.method+' '+r.route),
 databasePermissionChecks:Object.values(sqlObjects).filter(o=>o.permissionChecks.includes(p.MaQuyen)).map(o=>o.name),
 feAreaGates:['DAT_VE','QL_PHONG','QL_KHIEUNAI','QL_NGUOIDUNG'].includes(p.MaQuyen),
 source:'database/10_seed/002_reference.sql'}));
write(path.join(evidence,'permission-usage.json'),permissionUsage);
const guardSites=Object.entries(productionHashes()).filter(([file])=>file.startsWith('frontend/src/')).flatMap(([file])=>read(path.join(root,file)).split(/\r?\n/).flatMap((text,i)=>/userHasPermission|userCanEnterArea|visibleAreasFor|RequireRole|RequireAuth|ROLE_AREAS|user\.role|auth:forbidden|refreshCurrentUser/.test(text)?[{file,line:i+1,text:text.trim()}]:[]));
write(path.join(evidence,'frontend-guards.json'),guardSites);
console.log(JSON.stringify(summary,null,2));

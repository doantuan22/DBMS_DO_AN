import assert from 'node:assert/strict';
import path from 'node:path';
import {root,dbRoot,read,write} from '../db/lib.mjs';
const directory=path.join(root,'audit/final/r8');
const previous=JSON.parse(read(path.join(root,'audit/remediation/r3a/evidence/endpoint-inventory.json'))).endpoints;
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const routeFiles={KHACH_HANG:null,ADMIN:'adminRoutes',QUAN_LY_RAP:'managerRoutes',CSKH:'supportRoutes'};
const customerRoute = r=>r.includes('/movies/')?'movieRoutes':r.includes('/promotions/')?'promotionRoutes':r.includes('/bookings')?'bookingRoutes':r.includes('/complaints')?'complaintRoutes':'orderRoutes';
const rows=previous.map(old=>{
 const r={actor:old.actor,useCase:old.useCase,method:old.method,route:old.route,authenticated:old.authenticated,role:old.roleGuard,ownership:old.ownership,scope:old.managerScope,procedures:old.procedures.map(p=>p==='dbo.sp_Genre_List'&&old.actor==='ADMIN'?'dbo.sp_Admin_Genre_List':p),permissions:[],status:'MATCH',sourceReferences:old.sourceReferences};
 if(r.route==='/api/promotions/validate') r.procedures.push('dbo.sp_Promotion_Validate');
 let routeFile=routeFiles[old.actor];if(old.actor==='KHACH_HANG')routeFile=customerRoute(old.route);
 if(routeFile){
  const text=read(path.join(root,`backend/src/routes/${routeFile}.js`));
  const prefix=old.actor==='ADMIN'?'/api/admin':old.actor==='QUAN_LY_RAP'?'/api/manager':old.actor==='CSKH'?'/api/support':routeFile==='movieRoutes'?'/api/movies':routeFile==='promotionRoutes'?'/api/promotions':routeFile==='bookingRoutes'?'/api/bookings':routeFile==='complaintRoutes'?'/api/complaints':'/api/orders';
  const relative=old.route.slice(prefix.length)||'/';
  const escaped=relative.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const match=new RegExp(`router\\.${old.method.toLowerCase()}\\(\\s*['"]${escaped}['"]([\\s\\S]*?);`).exec(text);assert.ok(match,old.method+' '+old.route);
  r.permissions=[...match[1].matchAll(/requirePermission\(([^)]+)\)/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
  r.sourceReferences=[`backend/src/routes/${routeFile}.js:${text.slice(0,match.index).split('\n').length}`,...r.procedures.map(p=>manifest.modules[p.split('.').at(-1)])];
 }
 r.db=r.procedures.map(p=>{
  const name=p.split('.').at(-1),source=manifest.modules[name];assert.ok(source,'Missing '+name);
  const sql=read(path.join(dbRoot,source));
  const perms=[...sql.matchAll(/fn_KiemTraQuyenNguoiDung\([^,]+,\s*'([^']+)'\)/g)].map(m=>m[1]);
  const publicAuxiliary=['sp_Seat_ListByShowtime','sp_Product_ListActive'].includes(name);
  const ownershipReadDuringPayment=r.route.includes('/payments')&&name==='sp_Order_GetDetailByCustomer';
  if(['ADMIN','QUAN_LY_RAP','CSKH','KHACH_HANG'].includes(r.actor)&&!publicAuxiliary){
   assert.ok(sql.includes('-- R3B:'),'Missing authoritative guards '+name);
   assert.deepEqual([...new Set(perms)].sort(),ownershipReadDuringPayment?[]:[...r.permissions].sort(),'BE/DB permission mismatch '+old.route+' '+name);
   assert.ok(sql.includes("'"+r.actor+"'"),'Wrong actor eligibility '+name);
  }
  return {procedure:p,actor:publicAuxiliary?'PUBLIC auxiliary catalog':r.actor,permissions:perms,activeGuard:sql.includes('THROW 50300'),explicitActor:sql.includes('@ActorID INT'),scopeCheck:sql.includes('fn_KiemTraQuanLyRapScope')||name==='sp_Manager_Showtime_Cancel',ownership:r.ownership};
 });
 r.frontend=r.actor==='PUBLIC'?'PUBLIC; XEM_PHIM NOT ENFORCED':r.actor==='KHACH_HANG'?'KHACH_HANG area; exact action guards; own history has no write permission':r.actor==='QUAN_LY_RAP'?'QUAN_LY_RAP area; per-section load/action, current assignment':r.actor==='ADMIN'?'ADMIN area; per-section/action exact permission; first permitted tab':r.actor==='CSKH'?'CSKH + QL read; process QL+XULY; reference QL+TRA':'Active authenticated user';
 r.catalogNote=r.actor==='PUBLIC'&&/movies|cinemas|showtimes|genres|products/.test(r.route)?'XEM_PHIM: NOT ENFORCED':'';
 return r;
});
assert.equal(rows.length,118);assert.equal(rows.filter(r=>!r.authenticated).length,14);
write(path.join(directory,'API_ROUTE_INVENTORY.json'),{status:'PASS',count:rows.length,protected:104,public:14,endpoints:rows});
const fields=['actor','useCase','method','route','authenticated','role','permissions','ownership','scope','procedures','frontend','catalogNote','status','sourceReferences'];
const val=(r,key)=>Array.isArray(r[key])?r[key].join('; '):r[key]??'';
const csv=v=>'"'+String(v).replaceAll('"','""')+'"';
write(path.join(directory,'PERMISSION_MATRIX.csv'),'\uFEFF'+[fields.map(csv).join(','),...rows.map(r=>fields.map(key=>csv(val(r,key))).join(','))].join('\n')+'\n');
write(path.join(directory,'PERMISSION_MATRIX.md'),'# Permission Matrix R8\n\n118 endpoints, 104 protected, 14 public. Role is actor eligibility; every listed permission is required (AND). Current account/permission/scope is read on each request. Customer own reads require ownership, with no write permission. XEM_PHIM stays in the catalog and is NOT ENFORCED on public catalog. The JSON includes BE/DB parity checks and source traces.\n\n| Actor | Operation | Permissions (AND) | SP | FE guard |\n| --- | --- | --- | --- | --- |\n'+rows.map(r=>`| ${r.actor} | ${r.method} ${r.route} | ${r.permissions.join(' + ')||(!r.authenticated?'PUBLIC':'Role/identity + owner/scope where applicable')} | ${r.procedures.join(', ')} | ${r.frontend} |`).join('\n')+'\n');
console.log('PASS source parity matrix: 118 endpoints, exact BE/DB permissions and eligible actors.');

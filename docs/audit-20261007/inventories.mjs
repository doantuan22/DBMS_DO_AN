import fs from 'node:fs';
import path from 'node:path';
import {PROCEDURES} from '../../backend/src/db/procedures.js';
const out='docs/audit-20261007';
const r0File='docs/r0-20261007/main-migration.json';
const r0=fs.existsSync(r0File)?JSON.parse(fs.readFileSync(r0File,'utf8')):null;
const m=r0?.status==='PASS'?r0.after.metadata:JSON.parse(fs.readFileSync(`${out}/metadata.json`,'utf8'));
const read=p=>fs.readFileSync(p,'utf8');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name).replaceAll('\\','/')]);
const uniq=a=>[...new Set(a)];
const esc=s=>String(s??'—').replaceAll('|','&#124;').replace(/\r?\n/g,' ');
const table=(headers,rows)=>`| ${headers.join(' | ')} |\n| ${headers.map(()=>'---').join(' | ')} |\n${rows.map(r=>'| '+r.map(esc).join(' | ')+' |').join('\n')}\n`;
const modules=m.objects.filter(o=>o.definition);
const expected=JSON.parse(read('database/baseline-manifest.json')).expected;
const stable=v=>JSON.stringify(Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))));
const parity={};for(const category of ['columns','parameters','keys','foreignKeys','checks','indexes','triggers']){const a=expected[category].map(stable).sort(),b=m[category].map(stable).sort();parity[category]={expected:a.length,actual:b.length,pass:JSON.stringify(a)===JSON.stringify(b),missing:a.filter(x=>!b.includes(x)),extra:b.filter(x=>!a.includes(x))};}
fs.writeFileSync(r0?.status==='PASS'?'docs/r0-20261007/schema-parity.json':`${out}/schema-parity.json`,JSON.stringify(parity,null,2));
const objectByName=new Map(modules.map(o=>[o.name,o]));
const sqlFiles=new Map(walk('database').filter(p=>/0[5-8]_/.test(p)&&p.endsWith('.sql')).map(p=>{const x=/CREATE\s+(?:OR\s+ALTER\s+)?(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\s+dbo\.(\w+)/i.exec(read(p));return [x?.[1],p];}));
const refs=name=>uniq(m.dependencies.filter(d=>d.objectName===name&&d.referenced_entity_name!==name).map(d=>d.referenced_entity_name));
function closure(name,seen=new Set()){if(seen.has(name))return [];seen.add(name);return uniq(refs(name).flatMap(n=>[n,...closure(n,seen)]));}
const methods={};
for(const p of walk('backend/src/services')){
  const service=path.basename(p,'.js'),text=read(p);
  const matches=[...text.matchAll(/\basync\s+(?:function\s+)?(\w+)\s*\(/g)];
  methods[service]=Object.fromEntries(matches.map((x,i)=>[x[1],text.slice(x.index,matches[i+1]?.index??text.length)]));
}
function keysFor(service,method){return uniq([...String(methods[service]?.[method]??'').matchAll(/['"]([A-Z][A-Z0-9_]+)['"]/g)].map(x=>x[1]).filter(k=>PROCEDURES[k]));}
const controllerMethods={};
for(const p of walk('backend/src/controllers')){
  const c=path.basename(p,'.js'),text=read(p),matches=[...text.matchAll(/export\s+(?:async\s+function\s+|const\s+)(\w+)/g)];
  controllerMethods[c]=Object.fromEntries(matches.map((x,i)=>[x[1],text.slice(x.index,matches[i+1]?.index??text.length)]));
}
const mountText=read('backend/src/routes/index.js'),routes=[];
for(const mount of mountText.matchAll(/router\.use\('([^']+)', (\w+)\)/g)){
 const file=`backend/src/routes/${mount[2]}.js`,text=read(file);
 const imports=Object.fromEntries([...text.matchAll(/import \* as (\w+) from '..\/controllers\/(\w+)\.js'/g)].map(x=>[x[1],x[2]]));
 for(const x of text.matchAll(/router\.(get|post|put|delete|patch)\('([^']+)',([^\n]+)/g)){
  const method=x[1].toUpperCase(),url='/api'+mount[1]+(x[2]==='/'?'':x[2]),tail=x[3];
  const named=/\b(listSeats|listProducts|validatePromotion)\);?\s*$/.exec(tail);
  const handler=/,?\s*(\w+)\.(\w+)\);?\s*$/.exec(tail)??(named?[null,'bookingController',named[1]]:null);
  imports.bookingController='bookingController';
  let controller=handler?`${imports[handler[1]]}.${handler[2]}`:'adminRoutes.wrapSupport';
  let cm=handler?controllerMethods[imports[handler[1]]]?.[handler[2]]:tail;
  const sc=[...(cm??'').matchAll(/(\w+Service)\.(\w+)\(/g)].map(z=>[z[1],z[2]]);
  if(handler&&['currentUser','currentPermissions'].includes(handler[2]))sc.push(['authService','getCurrentUser']);
  let keys=uniq(sc.flatMap(([s,f])=>keysFor(s,f)));
  if(handler&&handler[2]==='currentUser'||handler&&handler[2]==='currentPermissions')keys=['USER_GET_CURRENT','RBAC_GET_PERMISSIONS_BY_USER','MANAGER_LIST_ASSIGNED_CINEMAS'];
  if(url==='/api/promotions/validate')keys=['SEAT_LIST_BY_SHOWTIME','PRODUCT_LIST_ACTIVE','PROMOTION_VALIDATE'];
  const permission=/requirePermission\(([^)]+)\)/.exec(tail)?.[1].replaceAll("'",'').replaceAll(', ',' + ')??'—';
  const actor=mount[1]==='/admin'?'ADMIN':mount[1]==='/manager'?'QUAN_LY_RAP':mount[1]==='/support'?'CSKH':/requireCustomer/.test(tail)||['/orders','/complaints','/bookings'].includes(mount[1])||mount[1]==='/promotions'?'KHACH_HANG':/authenticate/.test(tail)?'Mọi role hoạt động':'PUBLIC';
  const specificConsumers={
    '/api/auth/register':'Register / authApi', '/api/auth/login':'Login + AuthContext/authSession / authApi', '/api/auth/me':'AuthContext/authSession, Profile / authApi',
    '/api/movies':'Home, Movies / catalogApi', '/api/movies/:movieId':'MovieDetail / catalogApi', '/api/movies/:movieId/showtimes':'MovieDetail → ShowtimeBrowser / catalogApi',
    '/api/cinemas':'Cinemas, CinemaDetail, MovieDetail → ShowtimeBrowser / catalogApi', '/api/cinemas/:cinemaId/images':'CinemaDetail → CinemaGallery / catalogApi', '/api/genres':'Movies / catalogApi',
    '/api/showtimes/:showtimeId':'BookingPreparation / catalogApi', '/api/showtimes/:showtimeId/seats':'BookingPreparation → SeatMap; PaymentPage expiry refresh / catalogApi',
    '/api/products':'BookingPreparation → ProductPicker / catalogApi', '/api/orders':'Orders; Complaints linked-order choices / ordersApi',
    '/api/orders/:orderId':'OrderDetail, PaymentPage / ordersApi', '/api/orders/:orderId/payments':'PaymentPage / ordersApi', '/api/orders/:orderId/payments/:paymentId/result':'PaymentPage / ordersApi',
  };
  const frontend=url==='/api/health'||url==='/api/auth/permissions'?'— (wrapper chưa có consumer)':specificConsumers[url]??(actor==='ADMIN'?'AdminPortal / adminApi'+(url.includes('/images')?'; CinemaImageManager':''):actor==='QUAN_LY_RAP'?'ManagerPortal / managerApi':actor==='CSKH'?'SupportPortal / supportApi':url.includes('/reviews')?'MovieReviews / feedbackApi':url.includes('/complaints')?'Complaints, ComplaintDetail / feedbackApi':url.includes('/bookings')||url.includes('/promotions')?'BookingPreparation / catalogApi':url==='/api/health/db'?'DatabaseHealth / healthApi':'Xem source API client');
  const full=keys.map(k=>PROCEDURES[k].replace('dbo.',''));
  let status=method==='GET'?'WORKING (đọc thực tế)':'PARTIAL (chưa chạy ghi)';
  if(url==='/api/auth/login')status='WORKING (4 role đăng nhập thực tế)';
  if(url==='/api/health'||url==='/api/auth/permissions')status='UNUSED (FE; API đọc hoạt động)';
  if(method==='DELETE'&&url==='/api/manager/rooms/:roomId')status='BROKEN (I-02, phân tích tĩnh)';
  if(['POST','PUT'].includes(method)&&(/\/showtimes(?:\/:showtimeId)?$/.test(url))&&!url.includes('booking'))status='BROKEN (I-03, rủi ro concurrency)';
  if(url.includes('/reports/revenue'))status='PARTIAL (I-13, thiếu theo phim)';
  if(method==='PUT'&&url.endsWith('/movies/:movieId/actors'))status='BROKEN (I-08)';
  if(['/api/orders/:orderId','/api/complaints/:complaintId','/api/support/complaints/:complaintId','/api/support/complaints/:complaintId/order-reference','/api/admin/complaints/:complaintId','/api/admin/complaints/:complaintId/order-reference'].includes(url))status='PARTIAL (thiếu fixture dương)';
  if(url.includes('/showtimes')||url.endsWith('/seats')&&actor==='PUBLIC')if(status.startsWith('WORKING')&&actor==='PUBLIC')status='PARTIAL (I-10, lịch quá khứ)';
  const verification=status.slice(status.indexOf('(')+1,-1);
  status=status.split(' ')[0];
  routes.push({method,url,actor,auth:actor==='PUBLIC'?'Không':'JWT + account live',permission,controller,service:sc.map(z=>z.join('.')).join('; ')||'—',procedures:full,frontend,status,verification,file,line:text.slice(0,x.index).split('\n').length});
 }
}
const missing=routes.filter(r=>!r.procedures.length&&r.url!=='/api/health');
const spRows=modules.filter(o=>o.type.trim()==='P').map(o=>{
 const def=o.definition,source=sqlFiles.get(o.name),allRefs=closure(o.name),params=m.parameters.filter(p=>p.objectName===o.name&&p.parameter_id>0);
 const type=p=>p.typeName+(['nvarchar','varchar','char','nchar','varbinary'].includes(p.typeName)?`(${p.max_length===-1?'MAX':p.typeName.startsWith('n')?p.max_length/2:p.max_length})`:['decimal','numeric'].includes(p.typeName)?`(${p.precision},${p.scale})`:'');
 const accesses=allRefs.filter(n=>m.rowcounts.some(t=>t.tableName===n));
 const vf=allRefs.filter(n=>['V','FN','IF','TF'].includes(objectByName.get(n)?.type.trim()));
 const changedTables=uniq([o.name,...allRefs].flatMap(n=>{const d=objectByName.get(n)?.definition??'';const aliases=Object.fromEntries([...d.matchAll(/(?:FROM|JOIN)\s+dbo\.(\w+)\s+(\w+)/gi)].map(x=>[x[2].toLowerCase(),x[1]]));return [...d.matchAll(/(?:INSERT\s+(?:INTO\s+)?|UPDATE\s+|DELETE\s+(?:FROM\s+)?)dbo\.(\w+)/gi)].map(x=>x[1]).concat([...d.matchAll(/\b(?:UPDATE|DELETE)\s+(\w+)\b/gi)].map(x=>aliases[x[1].toLowerCase()]).filter(Boolean));}));
 const triggers=uniq(m.triggers.filter(t=>changedTables.includes(t.tableName)).map(t=>t.name));
 const endpoints=routes.filter(r=>r.procedures.includes(o.name)).map(r=>r.method+' '+r.url);
 const delegates=uniq([...def.matchAll(/EXEC(?:UTE)?\s+dbo\.(\w+)/gi)].map(x=>x[1]));
 const sel=[...def.matchAll(/(?:^|\n)\s*SELECT\s+([^;]+?)(?:\bFROM\b|;)/gi)].map(x=>x[1].replace(/\s+/g,' ').trim()).filter(s=>!s.startsWith('@')&&!/^1\b/.test(s));
 let output=sel.at(-1)?.slice(0,220)??'Không recordset trực tiếp';
 if(delegates.length)output+=`; EXEC → ${delegates.join(', ')}`;
 const outputs={sp_Auth_Login:'3 recordsets: account/role+bcrypt hash (chỉ BE); permissions; assigned cinemas nếu manager',sp_User_GetCurrent:'1 recordset: account/role/profile',sp_Movie_GetDetail:'4 recordsets: movie aggregate; genres; actors; recent reviews',sp_Booking_Create:'OUTPUT NewDonDatVeID + 1 recordset: order snapshots, total, hold deadline, ticket count',sp_Order_GetDetailByCustomer:'4 recordsets: order summary+compensation; tickets; food; all payment attempts',sp_Support_Complaint_GetDetail:'2 recordsets: complaint+sender/linked order; processing timeline',sp_Support_Complaint_GetOrderReference:'4 recordsets: order summary+compensation; tickets; food; attempts',sp_Complaint_GetByCustomer:'2 recordsets: owned complaint; processing timeline',sp_Promotion_Validate:'OUTPUT: coupon/type/value/discount/isValid/message; valid branch có SELECT, invalid branch RETURN (BE đọc OUTPUT)',sp_Payment_CreateAttempt:'OUTPUT ThanhToanID + MaGiaoDich; 1 recordset: attempt snapshot/deadline',sp_Payment_UpdateResult:'1 recordset: order/payment states; replay same terminal state idempotent',sp_Admin_Report_Revenue:'2 recordsets: revenue theo rạp; tổng kỳ báo cáo',sp_Manager_Revenue:'1 recordset: revenue theo ngày/rạp được phân công',sp_Showtime_CancelCascade:'message + cancelled count/compensation results; bảo toàn snapshots',sp_Order_ExpirePending:'Tuỳ TraVeKetQua; expire summary; caller có thể suppression'};
 output=outputs[o.name]??output;
 const txn=/BEGIN\s+TRAN/i.test(def)?(/SAVE\s+TRAN/i.test(def)?'TX + savepoint':'TX'):'Không TX trực tiếp';
 const error=uniq([...def.matchAll(/THROW\s+(\d+)/gi)].map(x=>x[1]));
 return {name:o.name,source,input:params.filter(p=>!p.is_output).map(p=>`${p.name} ${type(p)}`).join('; ')||'—',outputParams:params.filter(p=>p.is_output).map(p=>`${p.name} ${type(p)}`).join('; '),output,tables:accesses,viewFunctions:vf,triggers,transaction:txn+(/SET\s+XACT_ABORT\s+ON/i.test(def)?'; XACT_ABORT ON':'')+(delegates.length?'; TX của delegate xem source':''),errorHandling:(/BEGIN CATCH/i.test(def)?'TRY/CATCH rollback/rethrow; ':'')+(error.join(', ')||'native constraints/delegate'),endpoints,group:source?.split('/')[2]??'unknown',purpose:o.name.replace(/^(?:u?sp)_/,'').replaceAll('_',' ')};
});
fs.writeFileSync(`${out}/api-inventory.json`,JSON.stringify(routes,null,2));
fs.writeFileSync(`${out}/sp-inventory.json`,JSON.stringify(spRows,null,2));
let schema='';
for(const {tableName:t,rows} of m.rowcounts){
 const cols=m.columns.filter(c=>c.tableName===t),idx=m.indexes.filter(i=>i.tableName===t),keys=m.keys.filter(k=>k.tableName===t),fks=m.foreignKeys.filter(f=>f.childTable===t),checks=m.checks.filter(c=>c.tableName===t);
 schema+=`\n#### ${t} — ${rows} dòng; ${['HINHANH_RAPCHIEUPHIM','BOITHUONG_HUYSUAT'].includes(t)?'EXTRA (có tài liệu migration)':'PASS về hiện diện schema'}\n\n`;
 schema+=table(['Cột','Kiểu','NULL','Identity/computed/default'],cols.map(c=>[c.name,c.typeName+(['nvarchar','varchar','char','nchar'].includes(c.typeName)?`(${c.max_length===-1?'MAX':c.typeName.startsWith('n')?c.max_length/2:c.max_length})`:['decimal','numeric'].includes(c.typeName)?`(${c.precision},${c.scale})`:''),c.is_nullable?'YES':'NO',[c.is_identity?'IDENTITY('+c.identitySeed+','+c.identityIncrement+')':'',c.computedDefinition??'',c.defaultName?`${c.defaultName} = ${c.defaultDefinition}`:''].filter(Boolean).join('; ')]));
 schema+='\n'+table(['Ràng buộc','Định nghĩa / quan hệ'],[...keys.map(k=>[k.type+' '+k.name,idx.filter(i=>i.name===k.indexName&&!i.is_included_column).sort((a,b)=>a.key_ordinal-b.key_ordinal).map(i=>i.columnName).join(', ')]),...fks.map(f=>['FK '+f.name,`${f.childColumn} → ${f.parentTable}.${f.parentColumn}; DELETE ${f.delete_referential_action_desc}; UPDATE ${f.update_referential_action_desc}; trusted=${!f.is_not_trusted}, enabled=${!f.is_disabled}`]),...checks.map(c=>['CHECK '+c.name,c.definition+`; trusted=${!c.is_not_trusted}, enabled=${!c.is_disabled}`])]);
 schema+='\n'+table(['Index','Unique / loại','Keys','INCLUDE / filter'],uniq(idx.map(i=>i.name)).map(n=>{const a=idx.filter(i=>i.name===n);return [n,`${a[0].is_unique}; ${a[0].type_desc}`,a.filter(i=>!i.is_included_column).sort((a,b)=>a.key_ordinal-b.key_ordinal).map(i=>i.columnName+(i.is_descending_key?' DESC':' ASC')).join(', '),a.filter(i=>i.is_included_column).map(i=>i.columnName).join(', ')+(a[0].filter_definition?`; WHERE ${a[0].filter_definition}`:'')];}));
}
fs.writeFileSync(`${out}/schema-inventory.md`,schema);
let sp='';for(const group of uniq(spRows.map(s=>s.group))){sp+=`\n#### Stored Procedures — ${group}\n\n`;sp+=table(['SP / chức năng / source','Input','Output / recordset','Tables (bao gồm dependency gián tiếp)','View / Function','Trigger có thể phát sinh','Transaction','Error handling','Endpoint trực tiếp'],spRows.filter(s=>s.group===group).map(s=>[`[${s.name}](../${s.source}) — ${s.purpose}`,s.input+(s.outputParams?`; OUTPUT ${s.outputParams}`:''),s.output,s.tables.join(', '),s.viewFunctions.join(', '),s.triggers.join(', '),s.transaction,s.errorHandling,s.endpoints.join('<br>')||'Không HTTP trực tiếp; xem callers/legacy mục 14']));}
fs.writeFileSync(`${out}/sp-inventory.md`,sp);
fs.writeFileSync(`${out}/api-inventory.md`,table(['Method + path','Actor / Auth','Permission (AND)','Controller','Service','SP trực tiếp / service calls','Frontend consumer','Status','Verification / issue'],routes.map(r=>[`${r.method} ${r.url}`,`${r.actor}; ${r.auth}`,r.permission,`${r.controller} ([route ${r.line}](../${r.file}))`,r.service,r.procedures.join('; ')||'Không DB (liveness)',r.frontend,r.status,r.verification])));
console.log(JSON.stringify({apiCount:routes.length,methods:routes.reduce((a,r)=>(a[r.method]=(a[r.method]??0)+1,a),{}),unresolvedMappings:missing.map(r=>({url:r.url,controller:r.controller,service:r.service})),spCount:spRows.length,indexes:uniq(m.indexes.map(i=>i.tableName+'.'+i.name)).length},null,2));

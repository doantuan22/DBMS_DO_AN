// Read probes against a temporary Express listener. No expiry job is started.
import fs from 'node:fs';
import {credentials} from '../../scripts/db/lib.mjs';
Object.assign(process.env,credentials());
const {createApp}=await import('../../backend/src/app.js');
const {issueToken}=await import('../../backend/src/utils/jwt.js');
const {getPool,closePool}=await import('../../backend/src/db/pool.js');
const {requirePermission}=await import('../../backend/src/middleware/requirePermission.js');
const server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`;
const results=[];
async function probe(label,path,userId=null,expected=200,options={}) {
  const response=await fetch(base+path,{...options,headers:{'Content-Type':'application/json',...(userId?{Authorization:`Bearer ${issueToken(userId).token}`}:{})},body:options.body?JSON.stringify(options.body):undefined});
  const body=await response.json();
  results.push({label,path,method:options.method??'GET',actorId:userId,expected,status:response.status,passed:response.status===expected,error:body.error?.code,collections:Object.fromEntries(Object.entries(body).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])),fields:Object.keys(body)});
}
try {
  for(const path of ['/health','/health/db','/movies','/movies/1','/movies/1/showtimes','/movies/1/reviews','/cinemas','/cinemas/1/images','/genres','/products','/showtimes/2','/showtimes/2/seats']) await probe('public-read',path);
  for(const uid of [1,2,4,5]) {
    await probe('current-user','/auth/me',uid);
    await probe('permissions','/auth/permissions',uid);
  }
  for(const path of ['/manager/cinemas','/manager/cinemas/1/rooms','/manager/rooms/1/seats','/manager/cinemas/1/showtimes','/manager/cinemas/1/pricing','/manager/cinemas/1/dashboard','/manager/cinemas/1/revenue'])await probe('manager-read',path,2);
  await probe('manager-wrong-cinema','/manager/cinemas/2/rooms',2,403);
  await probe('manager-wrong-room','/manager/rooms/4/seats',2,403);
  await probe('customer-manager-denied','/manager/cinemas',5,403);
  await probe('customer-support-denied','/support/complaints',5,403);
  await probe('manager-admin-denied','/admin/users',2,403);
  await probe('support-admin-denied','/admin/users',4,403);
  await probe('anonymous-admin-denied','/admin/users',null,401);
  await probe('customer-orders','/orders',5);
  await probe('customer-complaints','/complaints',5);
  // DB has no orders: ownership guard throws before the detail SP can expire holds.
  await probe('missing-order-nondisclosure','/orders/2147483647',5,404);
  await probe('missing-complaint-nondisclosure','/complaints/2147483647',5,404);
  await probe('support-queue','/support/complaints',4);
  await probe('support-missing-detail','/support/complaints/2147483647',4,404);
  for(const path of ['/admin/dashboard','/admin/users','/admin/roles','/admin/permissions','/admin/roles/1/permissions','/admin/assignments','/admin/cinemas','/admin/cinemas/1/images','/admin/rooms','/admin/seats','/admin/pricing','/admin/showtimes','/admin/movies','/admin/genres','/admin/actors','/admin/products','/admin/promotions','/admin/reports/revenue','/admin/complaints'])await probe('admin-read',path,1);
  // Login is a SELECT-only procedure. Demo password is explicitly documented.
  const demoAccounts=(await (await getPool()).request().query("SELECT Email,MaVaiTro FROM (SELECT u.Email,v.MaVaiTro,ROW_NUMBER() OVER(PARTITION BY v.MaVaiTro ORDER BY u.NguoiDungID) n FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE u.TrangThai=N'Hoạt động') x WHERE n=1")).recordset;
  for(const {Email:email,MaVaiTro:expectedRole} of demoAccounts) {
    const response=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:email,MatKhau:'123456'})});
    const body=await response.json();results.push({label:'documented-demo-login',expectedRole,status:response.status,passed:response.status===200,role:body.user?.role,tokenReturned:!!body.token,error:body.error?.code});
  }
  let guardError;requirePermission('QL_NGUOIDUNG')({user:{role:'ADMIN',permissions:[]}},null,e=>guardError=e);
  results.push({label:'admin-no-permission-middleware-unit',status:guardError?.status,passed:guardError?.status===403,note:'Injected req.user; no DB permissions changed.'});
  fs.writeFileSync('docs/audit-20261007/api-probes.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify({probes:results.length,statuses:results.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),unexpected:results.filter(r=>r.passed===false),logins:results.filter(r=>r.label==='documented-demo-login')},null,2));
}finally {await new Promise(r=>server.close(r));await closePool();}

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {connect,ask,sql,root,write} from '../r3a/common.mjs';
import {credentials} from '../db/lib.mjs';
import {adminForms,formFields,inputValue,toBody} from '../../frontend/src/utils/adminForms.js';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R(?:4|5)[A-Za-z0-9_]+$/);
Object.assign(process.env,credentials(),{DB_DATABASE:database});
process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const {closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(database),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`,requests=[],checks=[],tokens={},inventory=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push({name,status:'PASS'});};
async function api(name,route,{actor='admin',method='GET',body,status=200}={}){
 const response=await fetch(base+route,{method,headers:{...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json();requests.push({name,route,method,status:response.status,error:data.error?.code});
 assert.equal(response.status,status,`${name}: ${JSON.stringify(data)}`);return data.data??data;
}
const query=async(source,values={})=>{const req=pool.request();for(const [name,value] of Object.entries(values))req.input(name,typeof value==='number'?sql.Int:sql.NVarChar(150),value);return (await req.query(source)).recordset;};
try{
 for(const [actor,email] of Object.entries({admin:'admin@cinemadb.vn',manager:'manager.q1@cinemadb.vn'}))tokens[actor]=(await api('login '+actor,'/auth/login',{method:'POST',body:{Email:email,MatKhau:'123456'}})).token;
 const assigned=(await api('Manager scope bootstrap','/manager/cinemas',{actor:'manager'})).cinemas[0].id;
 const room=(await api('Manager create fixture room',`/manager/cinemas/${assigned}/rooms`,{actor:'manager',method:'POST',body:{name:'R4-'+crypto.randomUUID().slice(0,8),type:'2D'},status:201})).room;
 const seatBody={row:'R4',number:1,type:'Thường'};
 await api('BUG004 old payload extra roomId',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{...seatBody,roomId:room.id},status:400});
 const seat=(await api('BUG004 correct create',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:seatBody,status:201})).seat;
 check('BUG004 persisted integer seat',(await query('SELECT SoGhe FROM dbo.GHE WHERE GheID=@ID',{ID:seat.id}))[0].SoGhe===1);
 await api('BUG004 duplicate position409',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:seatBody,status:409});
 for(const number of [0,-1,1.5,2147483648])await api('BUG004 invalid number400',`/manager/rooms/${room.id}/seats`,{actor:'manager',method:'POST',body:{...seatBody,number},status:400});
 const foreign=(await ask(pool,`SELECT TOP(1) PhongID FROM dbo.PHONGCHIEU WHERE RapID NOT IN (SELECT RapID FROM dbo.PHANCONG_RAP WHERE NguoiDungID=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'))`)).recordset[0].PhongID;
 await api('BUG004 wrong scope403',`/manager/rooms/${foreign}/seats`,{actor:'manager',method:'POST',body:seatBody,status:403});
 const start=new Date(Date.now()+50*86400000);
 const show=(await api('R4 unbooked edit showtime','/manager/showtimes',{actor:'manager',method:'POST',body:{movieId:1,roomId:room.id,startsAt:start.toISOString(),endsAt:new Date(start.getTime()+166*60000).toISOString(),format:'2D',basePrice:120000},status:201})).showtime;
 const imageBase={url:'/r4-image.svg',description:'R4 image',displayOrder:10,status:'Hoạt động'};
 const image1=(await api('BUG005 create cover',`/admin/cinemas/${assigned}/images`,{method:'POST',body:{...imageBase,cover:true},status:201})).image;
 const image2=(await api('BUG005 create other',`/admin/cinemas/${assigned}/images`,{method:'POST',body:{...imageBase,url:'/r4-other.svg',cover:false},status:201})).image;
 const iid=image1.HinhAnhRapID,other=image2.HinhAnhRapID;
 const imagesBefore=await query('SELECT * FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID',{ID:assigned});
 await api('BUG005 old edit DTO400',`/admin/cinemas/${assigned}/images/${iid}`,{method:'PUT',body:{...imageBase,cover:true},status:400});
 await api('BUG005 metadata edit',`/admin/cinemas/${assigned}/images/${iid}`,{method:'PUT',body:{...imageBase,description:'R4 updated'}});
 const imagesAfter=await query('SELECT * FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID',{ID:assigned});
 assert.deepEqual(imagesAfter.filter(x=>x.HinhAnhRapID!==iid),imagesBefore.filter(x=>x.HinhAnhRapID!==iid));
 check('BUG005 metadata preserves cover and every other image',imagesAfter.find(x=>x.HinhAnhRapID===iid).LaAnhDaiDien===true);
 await api('BUG005 separate set cover',`/admin/cinemas/${assigned}/images/${other}/cover`,{method:'PATCH',body:{cover:true}});
 check('BUG005 exactly one cover',(await query('SELECT * FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID AND LaAnhDaiDien=1',{ID:assigned})).length===1);
 await api('BUG005 missing image404',`/admin/cinemas/${assigned}/images/2147483647`,{method:'PUT',body:imageBase,status:404});
 const roleCode='R4_ROLE_'+crypto.randomUUID().slice(0,8);
 const role=(await api('BUG007 create custom role','/admin/roles',{method:'POST',body:{code:roleCode,name:'R4 original',description:'R4'}})).role;
 const grant=[(await api('permissions inventory','/admin/permissions')).permissions[0].QuyenID];
 await api('BUG007 old UI operation grants only',`/admin/roles/${role.VaiTroID}/permissions`,{method:'PUT',body:{permissionIds:grant}});
 check('BUG007 old UI operation does not rename DB',(await query('SELECT TenVaiTro FROM dbo.VAITRO WHERE VaiTroID=@ID',{ID:role.VaiTroID}))[0].TenVaiTro==='R4 original');
 const grantsBefore=await query('SELECT * FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID',{ID:role.VaiTroID});
 await api('BUG007 metadata rename',`/admin/roles/${role.VaiTroID}`,{method:'PUT',body:{name:'R4 renamed',description:'R4 metadata'}});
 assert.deepEqual(await query('SELECT * FROM dbo.VAITRO_QUYEN WHERE VaiTroID=@ID',{ID:role.VaiTroID}),grantsBefore);
 check('BUG007 DB reload persisted metadata',(await query('SELECT TenVaiTro FROM dbo.VAITRO WHERE VaiTroID=@ID',{ID:role.VaiTroID}))[0].TenVaiTro==='R4 renamed');
 await api('BUG007 grant only after rename',`/admin/roles/${role.VaiTroID}/permissions`,{method:'PUT',body:{permissionIds:[]}});
 check('BUG007 grants never overwrite name',(await api('BUG007 reload roles','/admin/roles')).roles.find(r=>r.VaiTroID===role.VaiTroID).TenVaiTro==='R4 renamed');
 await api('BUG007 duplicate unique code409','/admin/roles',{method:'POST',body:{code:roleCode,name:'Another label'},status:409});
 for(const name of ['', ' ', 'x'.repeat(101)])await api('BUG007 invalid name400',`/admin/roles/${role.VaiTroID}`,{method:'PUT',body:{name},status:400});
 const countsBefore=(await ask(pool,'SELECT COUNT(*) AS n FROM dbo.NGUOIDUNG')).recordset[0].n;
 for(const password of ['a'.repeat(73),'é'.repeat(36)+'a','🙂'.repeat(18)+'a']){
  await api('BUG014 reject admin >72bytes','/admin/users',{method:'POST',body:{name:'R4 reject',email:'r4-reject@example.test',password,roleId:role.VaiTroID},status:400});
  await api('BUG014 reject register >72bytes','/auth/register',{method:'POST',body:{HoTen:'R4 reject',Email:'r4-reject@example.test',MatKhau:password},status:400});
 }
 check('BUG014 rejected create has no DB record',(await ask(pool,'SELECT COUNT(*) AS n FROM dbo.NGUOIDUNG')).recordset[0].n===countsBefore);
 for(const [i,password] of ['a'.repeat(71),'a'.repeat(72),'é'.repeat(36),'🙂'.repeat(18),' abcdefg '].entries()){
  const email=`r4-${role.VaiTroID}-boundary-${i}@example.test`;
  await api('BUG014 valid admin boundary','/admin/users',{method:'POST',body:{name:'R4 boundary',email,password,roleId:role.VaiTroID}});
  const login=await api('BUG014 original password login','/auth/login',{method:'POST',body:{Email:email,MatKhau:password}});
  if(i===0)tokens.renamedRole=login.token;
  check('BUG014 exact original login '+i,Boolean(login.token));
  if(i===4)await api('BUG014 trimmed prefix denied','/auth/login',{method:'POST',body:{Email:email,MatKhau:password.trim()},status:401});
  if(Buffer.byteLength(password)===72)await api('BUG014 oversized login rejected','/auth/login',{method:'POST',body:{Email:email,MatKhau:password+'x'},status:400});
 }
 await api('BUG007 rename after existing login',`/admin/roles/${role.VaiTroID}`,{method:'PUT',body:{name:'R4 refresh label',description:'R4'}});
 check('BUG007 existing JWT sees refreshed role label',(await api('BUG007 refresh current user','/auth/me',{actor:'renamedRole'})).user.roleName==='R4 refresh label');
 check('BUG007 relogin sees saved role label',(await api('BUG007 relogin','/auth/login',{method:'POST',body:{Email:`r4-${role.VaiTroID}-boundary-0@example.test`,MatKhau:'a'.repeat(71)}})).user.roleName==='R4 refresh label');
 for(const [i,password] of ['a'.repeat(71),'é'.repeat(36),'🙂'.repeat(18)].entries()){
  const email=`r4-${role.VaiTroID}-register-${i}@example.test`;
  await api('BUG014 valid register boundary','/auth/register',{method:'POST',body:{HoTen:'R4 register',Email:email,MatKhau:password},status:201});
  check('BUG014 register original login '+i,Boolean((await api('BUG014 register login','/auth/login',{method:'POST',body:{Email:email,MatKhau:password}})).token));
 }
 // Exercise every generic edit contract against current HTTP list output and actual SP.
 for(const [key,definition] of Object.entries(adminForms)){
  const rows=(await api('BUG006 current list '+key,`/admin/${definition.path}`))[key];
  assert.ok(rows?.length,'No fixture row for '+key);
  const ownId={seats:seat.id,rooms:room.id,showtimes:show.id}[key];
  const row=ownId?rows.find(r=>r[definition.id]===ownId):rows[0],fields=formFields(definition,true);
  assert.ok(row,'No editable fixture row for '+key);
  const values=Object.fromEntries(fields.map(([name,,kind,column])=>[name,inputValue(row[column],kind)]));
  if(key==='movies')values.genreIds=inputValue(row.TheLoaiIdList,'csv');
  const payload=toBody(values,fields),route=`/admin/${definition.path}/${row[definition.id]}${key==='users'?'/status':''}`;
  const changed={...payload};
  if(changed.name)changed.name+=' R4';else if(changed.title)changed.title+=' R4';
  else if(key==='users')changed.status='Bị khóa';else if(key==='seats')changed.type='VIP';
  else if(key==='pricing')changed.surcharge+=1;else if(key==='showtimes')changed.basePrice+=1000;
  else if(key==='promotions')changed.description='R4 updated note';
  await api('BUG006 edit HTTP/SP '+key,route,{method:'PUT',body:changed});
  const saved=(await api('BUG006 reload after edit '+key,`/admin/${definition.path}`))[key].find(r=>r[definition.id]===row[definition.id]);
  for(const [name,,kind,column] of fields){
   if(name==='genreIds'){assert.deepEqual(String(saved.TheLoaiIdList??'').split(',').filter(Boolean).map(Number),changed[name]);continue;}
   const actual=saved[column],expected=changed[name];
   if(kind==='datetime-local')assert.equal(Date.parse(actual),Date.parse(expected));
   else if(kind==='date')assert.equal(actual==null?null:String(actual).slice(0,10),expected);
   else assert.equal(actual??null,expected,key+'.'+name);
  }
  check('BUG006 saved values verified '+key,true);
  inventory.push({key,id:row[definition.id],fields,row,payload,persistedPayload:changed,route,status:'PASS'});
 }
 write(path.join(root,process.env.R4_EVIDENCE_DIR||'audit/remediation/r4/evidence','edit-inventory.json'),{status:'PASS',database,forms:inventory});
 write(path.join(root,process.env.R4_EVIDENCE_DIR||'audit/remediation/r4/evidence','functional-api.json'),{status:'PASS',database,checks,requests});
 console.log(`PASS R4 HTTP/SP: ${requests.length} requests, ${checks.length} DB assertions; ${inventory.length} edit contracts`);
}catch(error){write(path.join(root,process.env.R4_EVIDENCE_DIR||'audit/remediation/r4/evidence','functional-api.json'),{status:'FAIL',database,checks,requests,error:error.message});throw error;}
finally{await new Promise(r=>server.close(r));await closePool();await pool.close();}

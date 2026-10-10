import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import {start,write,evidenceRoot,sql} from './harness.mjs';
import {fingerprints,moduleParity,open} from '../../database/11_tests/r6-group-a/support.mjs';
import {cleanSession,integrity} from './fixtures.mjs';
const reproduce=process.argv.includes('--reproduce'),h=await start(reproduce?'R7.2 policy defect reproduction':'R7.2 approved policy regression'),{e,query}=h;
const main=await open('CinemaBookingDB',1);e.mainBefore=await fingerprints(main);e.fixtures=[];e.decisions={source:'User reply in this task on 2026-10-09',complaintPriority:'Bắt buộc thêm bộ lọc ưu tiên',adminCreateRoles:['QUAN_LY_RAP','CSKH','ADMIN'],dashboard:'Bốn số liệu hiện tại đủ cho R7.2'};
const roles=await query('SELECT VaiTroID,MaVaiTro FROM dbo.VAITRO');
const actors=await query("SELECT n.NguoiDungID,n.Email,v.MaVaiTro FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.Email IN('admin@cinemadb.vn','khachhang1@gmail.com') OR v.MaVaiTro='CSKH' ORDER BY n.NguoiDungID");
const admin=actors.find(r=>r.MaVaiTro==='ADMIN'),support=actors.find(r=>r.MaVaiTro==='CSKH'),customer=actors.find(r=>r.MaVaiTro==='KHACH_HANG');
const roleId=code=>roles.find(r=>r.MaVaiTro===code).VaiTroID;
async function scenario(id,label,work){
 const before=await fingerprints(h.pool),index=e.cases.length,tag='R72-'+crypto.randomBytes(8).toString('hex');
 const f={id,tag,users:[],complaints:[],customRoles:[],setup:[]},row={id,label,status:'RUNNING'};e.fixtures.push(row);
 f.q=async(text,inputs={})=>{const rows=await query(text,inputs);f.setup.push({text,inputs,rows});return rows;};
 try{await work(f);row.integrity=await integrity(h);row.status='PASS';}catch(error){row.status='FAIL';row.error={message:error.message,number:error.number};throw error;}
 finally{
  try{for(const id of f.complaints)await query('DELETE dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID;DELETE dbo.KHIEUNAI WHERE KhieuNaiID=@ID',{ID:id});
   // Capture users by the unique fixture email prefix even if an assertion failed after creation.
   const made=await query('SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email LIKE @Prefix',{Prefix:tag+'%'});
   for(const {NguoiDungID} of made)await query('DELETE dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID;DELETE dbo.NGUOIDUNG WHERE NguoiDungID=@ID',{ID:NguoiDungID});
   for(const id of f.customRoles)await query('DELETE dbo.VAITRO_QUYEN WHERE VaiTroID=@ID;DELETE dbo.VAITRO WHERE VaiTroID=@ID',{ID:id});
   row.after=await fingerprints(h.pool);assert.deepEqual(row.after,before);row.session=await cleanSession(h.pool);row.cleanup='PASS';
  }catch(error){row.cleanup='FAIL';row.status='FAIL';row.cleanupError=error.message;throw error;}
  finally{row.setup=f.setup;for(const c of e.cases.slice(index)){c.ucId=id.startsWith('CSKH')?'CSKH-02':'ADM-02';c.gapId=id.startsWith('CSKH')?'R71-CT-01':'R71-CT-02';c.fixtureId=id;c.cleanup=row.cleanup;c.fix=reproduce?'NOT_APPLIED':c.ucId==='CSKH-02'?'SQL priority parameter/predicate + typed binding + validation':'SQL role allowlist + HTTP error mapping';}write(path.join(evidenceRoot,'p2.json'),e);}
 }
}
async function t(id,label,role,method,route,input,http=200,code,verify){const body=await h.test(id,id.startsWith('CSKH')?'CSKH-02':'ADM-02',label,role,method,route,input,http,code,verify);const row=e.cases.at(-1);if(method==='GET')assert.deepEqual(row.after,row.before);return body;}
async function complaints(f){
 for(const [i,priority,status] of [[0,'Cao','Mới'],[1,'Thấp','Mới'],[2,'Khẩn cấp','Đang xử lý'],[3,'Trung bình','Mới'],[4,'Cao','Đã giải quyết']]){
  const r=(await f.q('INSERT dbo.KHIEUNAI(NguoiDungID,LoaiKhieuNai,TieuDe,NoiDung,MucDoUuTien,TrangThai) VALUES(@User,@Type,@Title,@Content,@Priority,@Status);SELECT CONVERT(INT,SCOPE_IDENTITY()) id;',{User:customer.NguoiDungID,Type:f.tag,Title:f.tag+' '+i,Content:'R72 complaint',Priority:priority,Status:status}))[0];f.complaints.push(r.id);
 }
}
const userBody=(f,code='QUAN_LY_RAP',more={})=>({name:'R72 internal account',email:f.tag+'@example.invalid',password:'StrongPass1!',roleId:roleId(code),...more});
async function userPersist(f,b,q,code){const r=(await q('SELECT n.NguoiDungID,n.VaiTroID,n.HoTen,n.TrangThai,v.MaVaiTro,(SELECT COUNT(*) FROM dbo.HOSOKHACHHANG p WHERE p.NguoiDungID=n.NguoiDungID) profiles FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.NguoiDungID=@ID',{ID:b.user.NguoiDungID}))[0];assert.equal(r.MaVaiTro,code);assert.equal(r.HoTen,'R72 internal account');assert.equal(r.profiles,0);assert.equal(r.TrangThai,'Hoạt động');}
async function queue(f,b,q,filter){const rows=await q('SELECT KhieuNaiID,MucDoUuTien,TrangThai,LoaiKhieuNai,TieuDe FROM dbo.KHIEUNAI WHERE LoaiKhieuNai=@Type ORDER BY KhieuNaiID',{Type:f.tag});const expected=rows.filter(filter).map(r=>r.KhieuNaiID).sort((a,b)=>a-b);assert.deepEqual(b.complaints.map(r=>r.id).sort((a,b)=>a-b),expected);for(const r of b.complaints){const original=rows.find(x=>x.KhieuNaiID===r.id);assert.equal(r.priority,original.MucDoUuTien);assert.equal(r.status,original.TrangThai);}}
async function directDenied(f,id,params,expected){const before=await fingerprints(h.pool);let actual;try{await h.pool.request().input('ActorID',sql.Int,admin.NguoiDungID).input('HoTen',sql.NVarChar(100),'R72').input('Email',sql.VarChar(150),f.tag+'sql@example.invalid').input('MatKhauHash',sql.VarChar(255),'test hash fixture').input('VaiTroID',sql.Int,params).execute('dbo.sp_Admin_User_Create');}catch(error){actual=error.number;}assert.equal(actual,expected);const after=await fingerprints(h.pool);assert.deepEqual(after,before);e.cases.push({id,module:'ADM-02',scenario:'Direct SQL authoritative role policy',expected:{sqlError:expected,persisted:'unchanged'},actual:{sqlError:actual},before,after,status:'PASS'});}
try{
 e.before=await fingerprints(h.pool);e.parityBefore=await moduleParity(h.pool);
 for(const table of ['DONDATVE','CHITIETVE','CHITIETDOAN','THANHTOAN','BOITHUONG_HUYSUAT','DANHGIAPHIM','KHIEUNAI','XULY_KHIEUNAI'])assert.equal(e.before.data.find(r=>r.tableName===table).rows,0,'Refuse nonempty transaction target: '+table);
 for(const [role,a] of [['admin',admin],['support',support],['customer',customer]])await h.login(role,a.Email);
 if(reproduce){
  await scenario('CSKH02-REPRO','Required filter rejected before fix',async f=>{await complaints(f);await t('CSKH02-REPRO','Current API rejects required priority','support','GET','/support/complaints?type='+f.tag+'&priority=Cao',undefined,400,'UNKNOWN_QUERY_PARAMETER');e.cases.at(-1).contractMismatch={approvedExpected:200,currentActual:400,rootCause:'SQL and backend lack priority filter parameter'};});
  await scenario('ADM02-REPRO','Customer creation contradicts approved policy',async f=>{await t('ADM02-REPRO','Current create permits Customer','admin','POST','/admin/users',userBody(f,'KHACH_HANG'),200,undefined,async(b,q)=>{const row=(await q('SELECT n.NguoiDungID,v.MaVaiTro,(SELECT COUNT(*) FROM dbo.HOSOKHACHHANG p WHERE p.NguoiDungID=n.NguoiDungID) profiles FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.NguoiDungID=@ID',{ID:b.user.NguoiDungID}))[0];assert.equal(row.MaVaiTro,'KHACH_HANG');assert.equal(row.profiles,1);});e.cases.at(-1).contractMismatch={approvedExpected:403,currentActual:200,rootCause:'SQL create accepts any valid role and creates a Customer profile'};});
 }else{
  for(let n=1;n<=9;n++)await scenario('CSKH02-'+String(n).padStart(2,'0'),'Priority and existing filters '+n,async f=>{
   await complaints(f);const base='/support/complaints?type='+f.tag;
   if(n===7){await t('CSKH02-07','Invalid priority','support','GET',base+'&priority=Urgent',undefined,400,'INVALID_PRIORITY');
    const before=await fingerprints(h.pool);let actual;try{await h.pool.request().input('NguoiDungID',sql.Int,support.NguoiDungID).input('MucDoUuTien',sql.NVarChar(50),'Urgent').execute('dbo.sp_Support_Complaint_List');}catch(error){actual=error.number;}assert.equal(actual,50405);const after=await fingerprints(h.pool);assert.deepEqual(after,before);e.cases.push({id:'CSKH02-07-sql',module:'CSKH-02',scenario:'Invalid priority rejected by SQL',expected:{sqlError:50405,persisted:'unchanged'},actual:{sqlError:actual},before,after,status:'PASS'});
   }
   else if(n===8)await h.revoked(support.NguoiDungID,'QL_KHIEUNAI',()=>t('CSKH02-08','Missing grant','support','GET',base+'&priority=Cao',undefined,403,'FORBIDDEN'));
   else if(n===9)await t('CSKH02-09','Wrong role','customer','GET',base+'&priority=Cao',undefined,403,'SUPPORT_REQUIRED');
   else{const filters={1:['&status='+encodeURIComponent('Mới'),r=>r.TrangThai==='Mới'],2:['&priority=Cao',r=>r.MucDoUuTien==='Cao'],3:['&priority=Cao&status='+encodeURIComponent('Mới'),r=>r.MucDoUuTien==='Cao'&&r.TrangThai==='Mới'],4:['&priority=Cao&search='+f.tag+'%200',r=>r.MucDoUuTien==='Cao'&&r.TieuDe.endsWith(' 0')],5:['&priority='+encodeURIComponent('Khẩn cấp')+'&status='+encodeURIComponent('Mới'),()=>false],6:['',()=>true]};const [suffix,filter]=filters[n];await t('CSKH02-'+String(n).padStart(2,'0'),'SQL filtered readback','support','GET',base+suffix,undefined,200,undefined,(b,q)=>queue(f,b,q,filter));
    if(n===2){const direct=await h.pool.request().input('NguoiDungID',sql.Int,support.NguoiDungID).input('LoaiKhieuNai',sql.NVarChar(100),f.tag).input('MucDoUuTien',sql.NVarChar(50),'Cao').execute('dbo.sp_Support_Complaint_List');assert.deepEqual(direct.recordset.map(r=>r.KhieuNaiID).sort((a,b)=>a-b),f.complaints.filter((_,i)=>[0,4].includes(i)));e.cases.at(-1).directSQL={procedure:'sp_Support_Complaint_List',priority:'Cao',ids:direct.recordset.map(r=>r.KhieuNaiID)};
     for(const [i,priority] of ['Thấp','Trung bình','Khẩn cấp'].entries())await t('CSKH02-02-priority-'+i,'Official priority enum','support','GET',base+'&priority='+encodeURIComponent(priority),undefined,200,undefined,(b,q)=>queue(f,b,q,r=>r.MucDoUuTien===priority));
    }
    if(n===6){await t('CSKH02-06-admin-consumer','Shared Admin queue priority','admin','GET','/admin/complaints?type='+f.tag+'&priority=Cao',undefined,200,undefined,(b,q)=>queue(f,b,q,r=>r.MucDoUuTien==='Cao'));await t('CSKH02-06-admin-default','Shared Admin queue default remains compatible','admin','GET','/admin/complaints?type='+f.tag,undefined,200,undefined,(b,q)=>queue(f,b,q,()=>true));}
   }
  });
  for(let n=1;n<=8;n++)await scenario('ADM02-'+String(n).padStart(2,'0'),'Approved account policy '+n,async f=>{
   if(n===1){for(const code of ['QUAN_LY_RAP','CSKH','ADMIN'])await t('ADM02-01-'+code,'Allowed role','admin','POST','/admin/users',userBody(f,code,{email:f.tag+code+'@example.invalid'}),200,undefined,(b,q)=>userPersist(f,b,q,code));}
   if(n===2){const custom=(await f.q('INSERT dbo.VAITRO(MaVaiTro,TenVaiTro) VALUES(@Code,@Name);SELECT CONVERT(INT,SCOPE_IDENTITY()) id;',{Code:f.tag,Name:'R72 custom role'}))[0].id;f.customRoles.push(custom);for(const [suffix,role] of [['customer',roleId('KHACH_HANG')],['custom',custom]]){await t('ADM02-02-'+suffix,'Disallowed role','admin','POST','/admin/users',userBody(f,'QUAN_LY_RAP',{roleId:role}),403,'ROLE_CREATE_FORBIDDEN');await directDenied(f,'ADM02-02-sql-'+suffix,role,50404);}}
   if(n===3){const missing=(await query('SELECT MAX(VaiTroID)+1 id FROM dbo.VAITRO'))[0].id;await t('ADM02-03','Invalid role FK','admin','POST','/admin/users',userBody(f,'QUAN_LY_RAP',{roleId:missing}),400,'INVALID_REFERENCE');}
   if(n===4)await h.revoked(admin.NguoiDungID,'QL_NGUOIDUNG',()=>t('ADM02-04','Missing grant','admin','POST','/admin/users',userBody(f),403,'FORBIDDEN'));
   if(n===5)await t('ADM02-05','Wrong role and spoof','support','POST','/admin/users',{...userBody(f),actorId:admin.NguoiDungID},403,'ADMIN_REQUIRED');
   if(n===6){await h.request('admin','POST','/admin/users',userBody(f),200);await t('ADM02-06-duplicate','Duplicate email','admin','POST','/admin/users',userBody(f,'ADMIN'),409,'EMAIL_ALREADY_EXISTS');await t('ADM02-06-invalid','Invalid email','admin','POST','/admin/users',userBody(f,'CSKH',{email:'bad'}),400,'INVALID_REQUEST');}
   if(n===7){await t('ADM02-07','Forbidden Customer creates neither user nor profile','admin','POST','/admin/users',userBody(f,'KHACH_HANG'),403,'ROLE_CREATE_FORBIDDEN');const phone=(await query('SELECT TOP(1) SoDienThoai phone FROM dbo.NGUOIDUNG WHERE SoDienThoai IS NOT NULL ORDER BY NguoiDungID'))[0].phone;await t('ADM02-07-failure','Unique phone failure rolls back allowed user insert','admin','POST','/admin/users',userBody(f,'ADMIN',{phone}),409,'DUPLICATE_RECORD');
    const before=await fingerprints(h.pool);const state=(await h.pool.request().input('Actor',sql.Int,admin.NguoiDungID).input('Role',sql.Int,roleId('KHACH_HANG')).input('Mail',sql.VarChar(150),f.tag+'nested@example.invalid').query(`SET XACT_ABORT OFF;BEGIN TRANSACTION;
    DECLARE @Error INT;BEGIN TRY EXEC dbo.sp_Admin_User_Create @ActorID=@Actor,@HoTen=N'R72',@Email=@Mail,@MatKhauHash='fixture',@VaiTroID=@Role;END TRY BEGIN CATCH SET @Error=ERROR_NUMBER();END CATCH;
    DECLARE @T INT=@@TRANCOUNT,@X INT=XACT_STATE();IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    SELECT @Error errorNumber,@T callerTransactionCount,@X callerState,@@TRANCOUNT finalTransactionCount;`)).recordset[0];assert.deepEqual(state,{errorNumber:50404,callerTransactionCount:1,callerState:1,finalTransactionCount:0});const after=await fingerprints(h.pool);assert.deepEqual(after,before);e.cases.push({id:'ADM02-07-savepoint',module:'ADM-02',scenario:'Disallowed role preserves committable caller transaction; outer rollback leaves no write',expected:{errorNumber:50404,callerTransactionCount:1,callerState:1,finalTransactionCount:0},actual:state,before,after,status:'PASS'});
   }
   if(n===8){const b=await h.request('admin','POST','/admin/users',userBody(f,'ADMIN'),200);await t('ADM02-08-status','Status update','admin','PUT',`/admin/users/${b.user.NguoiDungID}/status`,{status:'Bị khóa'},200,undefined,async(_,q)=>assert.equal((await q('SELECT TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID=@ID',{ID:b.user.NguoiDungID}))[0].TrangThai,'Bị khóa'));await t('ADM02-08-list','List readback','admin','GET','/admin/users',undefined,200,undefined,async(reply)=>{const user=reply.users.find(r=>r.NguoiDungID===b.user.NguoiDungID);assert.equal(user.TrangThai,'Bị khóa');assert.equal(user.MaVaiTro,'ADMIN');});}
  });
 }
 e.after=await fingerprints(h.pool);assert.deepEqual(e.after,e.before);e.parityAfter=await moduleParity(h.pool);e.session=await cleanSession(h.pool);e.status=reproduce?'REPRODUCED':'PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};process.exitCode=1;}
finally{e.mainAfter=await fingerprints(main);try{assert.deepEqual(e.mainAfter,e.mainBefore);e.mainUnchanged='PASS';}catch(error){e.mainUnchanged='FAIL';e.status='FAIL';process.exitCode=1;}e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'p2.json'),e);await main.close();await h.close();console.log(JSON.stringify({status:e.status,cases:e.cases.length,fixtures:e.fixtures.length,error:e.error,evidenceRoot}));}

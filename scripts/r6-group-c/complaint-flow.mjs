import assert from 'node:assert/strict';
import path from 'node:path';
import {database,connect,root,write,evidenceRoot} from './common.mjs';
import {start,sql} from './harness.mjs';
import {fingerprints} from '../../database/11_tests/r6-group-a/support.mjs';
import {createFixture,cleanupFixture,cleanSession} from '../r32/fixtures.mjs';
const h=await start('complaint-linked-flow'),{e,pool,test,request,query}=h;let f;const owned=[];
try{
 e.before=await fingerprints(pool);f=await createFixture(pool);const support=(await query("SELECT TOP(1) n.NguoiDungID,n.Email FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='CSKH' ORDER BY n.NguoiDungID"))[0];
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['other','khachhang2@gmail.com'],['support',support.Email],['admin','admin@cinemadb.vn']])await h.login(role,email);
 const booking=(await request('customer','POST','/bookings',{showtimeId:f.show,seatIds:f.seats.slice(0,2),products:[{productId:f.product,quantity:1}],promotionCode:f.code},201)).booking;
 let num=0;const t=(scenario,role,method,route,input,http=200,code,verify)=>test('R6.8-linked-'+String(++num).padStart(2,'0'),'Complaint',scenario,role,method,route,input,http,code,verify);
 for(const linked of [true,false]){
  let id;const input={type:'R6C integration',title:linked?'Linked complaint':'Unlinked complaint',content:'Customer permitted timeline',orderId:linked?booking.id:null};
  const made=await t('Customer create '+(linked?'linked':'unlinked'),'customer','POST','/complaints',input,201,undefined,async(reply,q)=>{id=reply.complaint.id;owned.push(id);const row=(await q('SELECT * FROM dbo.KHIEUNAI WHERE KhieuNaiID=@ID',{ID:id}))[0];assert.equal(row.NguoiDungID,f.customer);assert.equal(row.DonDatVeID,input.orderId);assert.equal(row.NoiDung,input.content);assert.equal(row.LoaiKhieuNai,input.type);assert.equal(row.TrangThai,'Mới');assert.equal(row.MucDoUuTien,'Trung bình');assert.ok(row.NgayTao instanceof Date);});
  await t('CSKH filter queue','support','GET','/support/complaints?status=Mới&type=R6C%20integration',undefined,200,undefined,async(reply)=>{assert.ok(reply.complaints.some(r=>r.id===id));assert.ok(reply.complaints.every(r=>r.status==='Mới'&&r.type===input.type));});
  await t('CSKH detail','support','GET',`/support/complaints/${id}`,undefined,200,undefined,async(reply)=>{assert.equal(reply.complaint.id,id);assert.equal(reply.complaint.orderId,input.orderId);assert.deepEqual(reply.complaint.processings,[]);});
  for(const role of ['support','admin'])await t('Actual '+role+' linked reference '+linked,role,'GET',`/${role}/complaints/${id}/order-reference`,undefined,200,undefined,async(reply,q)=>{if(linked){const row=(await q('SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@ID',{ID:booking.id}))[0];assert.equal(reply.order.id,booking.id);assert.equal(reply.order.total,row.TongTienVe+row.TongTienDoAn-row.TienGiamGia);assert.equal(reply.order.tickets.length,2);assert.equal(reply.order.products[0].unitPrice,10000);}else{assert.equal(reply.order,null);assert.ok(reply.message);}});
  await t('CSKH append processing','support','POST',`/support/complaints/${id}/processings`,{content:'R6C first public processing',nextStatus:'Đang xử lý'},201,undefined,async(reply,q)=>{const rows=await q('SELECT * FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID ORDER BY XuLyID',{ID:id});assert.equal(rows.length,1);assert.equal(rows[0].NguoiXuLyID,support.NguoiDungID);assert.equal(rows[0].NoiDungXuLy,'R6C first public processing');assert.equal((await q('SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID=@ID',{ID:id}))[0].TrangThai,'Đang xử lý');});
  const previous=await query('SELECT * FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID ORDER BY XuLyID',{ID:id});
  await t('CSKH status appends event','support','PUT',`/support/complaints/${id}/status`,{status:'Đã giải quyết'},200,undefined,async(reply,q)=>{const rows=await q('SELECT * FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID ORDER BY XuLyID',{ID:id});assert.equal(rows.length,2);assert.deepEqual(rows[0],previous[0]);assert.equal(reply.complaint.status,'Đã giải quyết');assert.equal((await q('SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID=@ID',{ID:id}))[0].TrangThai,rows.at(-1).TrangThaiSauXuLy);});
  await t('Customer permitted timeline','customer','GET',`/complaints/${id}`,undefined,200,undefined,async(reply,q)=>{const history=await q('SELECT XuLyID,NoiDungXuLy,TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID=@ID ORDER BY XuLyID',{ID:id});assert.equal(reply.complaint.status,'Đã giải quyết');assert.equal(reply.complaint.processingHistory.length,2);for(const event of reply.complaint.processingHistory){assert.deepEqual(Object.keys(event).sort(),['content','id','processedAt','status']);const sqlRow=history.find(r=>r.XuLyID===event.id);assert.equal(event.content,sqlRow.NoiDungXuLy);assert.equal(event.status,sqlRow.TrangThaiSauXuLy);}});
  await t('Foreign Customer non-disclosing detail','other','GET',`/complaints/${id}`,undefined,404,'COMPLAINT_NOT_FOUND');
  await t('Foreign Customer list excludes complaint','other','GET','/complaints',undefined,200,undefined,async(reply)=>assert.ok(!reply.complaints.some(r=>r.id===id)));
 }
 const body={type:'R6C',title:'Foreign order denied',content:'must not persist',orderId:booking.id};
 for(const [prefix,role,user,roleCode] of [['admin','admin',f.admin,'ADMIN_REQUIRED'],['support','support',support.NguoiDungID,'SUPPORT_REQUIRED']])for(const suffix of ['',`/${owned[0]}`]){
  const route=`/${prefix}/complaints${suffix}`;
  await t(prefix+' queue/detail rejects Customer role and actor spoof','customer','GET',route+`?actorId=${user}&role=${role.toUpperCase()}&permissions=QL_KHIEUNAI`,undefined,403,roleCode);
  await h.revoked(user,'QL_KHIEUNAI',async()=>t(prefix+' queue/detail requires QL_KHIEUNAI',role,'GET',route,undefined,403,'FORBIDDEN'));
 }
 for(const [prefix,user,roleCode] of [['admin',f.admin,'ADMIN_REQUIRED'],['support',support.NguoiDungID,'SUPPORT_REQUIRED']]){
  const spoof={actorId:user,role:prefix.toUpperCase(),permissions:['QL_KHIEUNAI','XULY_KHIEUNAI','TRA_CUU_DON']};
  await t(prefix+' reference rejects Customer role and actor spoof','customer','GET',`/${prefix}/complaints/${owned[0]}/order-reference?actorId=${user}&role=${prefix.toUpperCase()}`,undefined,403,roleCode);
  await t(prefix+' processing rejects Customer role and actor spoof','customer','POST',`/${prefix}/complaints/${owned[0]}/processings`,{content:'must not append',...spoof},403,roleCode);
  await t(prefix+' status rejects Customer role and actor spoof','customer','PUT',`/${prefix}/complaints/${owned[0]}/status`,{status:'Đã đóng',...spoof},403,roleCode);
 }
 await t('Foreign order cannot attach','other','POST','/complaints',body,404,'ORDER_REFERENCE_INVALID');
 await t('Missing order same non-disclosing contract','customer','POST','/complaints',{...body,orderId:2147483647},404,'ORDER_REFERENCE_INVALID');
 for(const [role,user] of [['support',support.NguoiDungID],['admin',f.admin]])for(const permission of ['QL_KHIEUNAI','TRA_CUU_DON'])await h.revoked(user,permission,async()=>{
  await t(role+' reference requires '+permission,role,'GET',`/${role}/complaints/${owned[0]}/order-reference`,undefined,403,'FORBIDDEN');
  const initial=await fingerprints(pool);await assert.rejects(pool.request().input('NguoiDungID',sql.Int,user).input('KhieuNaiID',sql.Int,owned[0]).execute('dbo.sp_Support_Complaint_GetOrderReference'),r=>r.number===50302);assert.deepEqual(await fingerprints(pool),initial);
 });
 e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{try{if(owned.length)await query('DELETE dbo.KHIEUNAI WHERE KhieuNaiID IN('+owned.join(',')+')');if(f)await cleanupFixture(pool,f);e.after=await fingerprints(pool);assert.deepEqual(e.after,e.before);e.session=await cleanSession(pool);e.cleanup='PASS';}catch(error){e.status='FAIL';e.cleanupError=error.message;process.exitCode=1;}e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'complaint-flow.json'),e);await h.close();}
console.log(e.status+' linked/unlinked complaint: '+e.cases.length+' cases.');

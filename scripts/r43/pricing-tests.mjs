import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,disposable,database,env,root,connect,snapshot,summarize,write,evidenceRoot } from './common.mjs';
import { createFixture,cleanupFixture,state,monetary,paid,bookingRequest,cleanSession } from '../r32/fixtures.mjs';

disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const url=`http://127.0.0.1:${server.address().port}/api`,tokens={};
const db={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]},http={database,startedAt:db.startedAt,status:'RUNNING',cases:[],requests:[]};
const keys=['GiaID','RapID','LoaiGhe','LoaiNgay','DinhDang','PhuThu','NgayBatDau','NgayKetThuc','TrangThai'];
const group=['seatType','dayType','format','startsOn','endsOn'];
const columns={seatType:'LoaiGhe',dayType:'LoaiNgay',format:'DinhDang',surcharge:'PhuThu',startsOn:'NgayBatDau',endsOn:'NgayKetThuc',status:'TrangThai'};
const plain=row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value instanceof Date?value.toISOString().slice(0,10):value]));
const body=row=>Object.fromEntries(Object.entries(columns).map(([key,column])=>[key,plain(row)[column]]));
let original,f,permissionRemoved=false,grant;

async function rules(){return (await pool.request().input('Cinema',sql.Int,f.cinema).query('SELECT * FROM dbo.BANGGIA WHERE RapID=@Cinema ORDER BY GiaID')).recordset.map(plain);}
async function row(id=f.pricing){return (await rules()).find(row=>row.GiaID===id);}
async function api(role,route,method='GET',input,status=200){
 const response=await fetch(url+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(input===undefined?{}:{body:JSON.stringify(input)}),signal:AbortSignal.timeout(30000)});
 const value=await response.json();http.requests.push({role,route,method,status:response.status,expected:status,...(value.error?{error:value.error}:{})});assert.equal(response.status,status,JSON.stringify(value));return value;
}
async function update(input,role='admin',id=f.pricing,actor=f[role],flag){
 const request=pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,actor).input('GiaID',sql.Int,id).input('PhuThu',sql.Decimal(18,2),input.surcharge).input('TrangThai',sql.NVarChar(50),input.status);
 if(group.some(key=>Object.hasOwn(input,key))) {
  for(const key of group)request.input(columns[key],key.endsWith('On')?sql.Date:sql.NVarChar(50),input[key]??null);
  request.input('CapNhatDieuKien',sql.Bit,flag??true);
 }
 return request.execute(role==='admin'?'dbo.usp_Admin_Pricing_Update':'dbo.sp_Manager_Pricing_Update');
}
async function create(input){
 const request=pool.request().input('ActorID',sql.Int,f.admin).input('RapID',sql.Int,f.cinema);
 for(const [key,column] of Object.entries(columns).filter(([key])=>key!=='status'))request.input(column,key==='surcharge'?sql.Decimal(18,2):key.endsWith('On')?sql.Date:sql.NVarChar(50),input[key]??null);
 return plain((await request.execute('dbo.usp_Admin_Pricing_Create')).recordset[0]);
}
async function success(name,input,role='admin'){
 const before=await row(),result=await update(input,role),actual=await row();
 assert.deepEqual(Object.keys(actual),keys);assert.deepEqual(plain(result.recordset[0]),actual);
 assert.equal(actual.GiaID,before.GiaID);assert.equal(actual.RapID,before.RapID);
 const expected=group.some(key=>Object.hasOwn(input,key))?{...before,...Object.fromEntries(Object.entries(columns).map(([key,column])=>[column,input[key]??null]))}:{...before,PhuThu:input.surcharge,TrangThai:input.status};
 assert.deepEqual(actual,expected);await cleanSession(pool);
 db.cases.push({name,status:'PASS',before,input,actual});return actual;
}
async function reject(name,input,number,role='admin',id=f.pricing,actor=f[role]){
 const before=await rules(),money=monetary(await state(pool,f));
 await assert.rejects(update(input,role,id,actor),error=>error.number===number);
 assert.deepEqual(await rules(),before);assert.deepEqual(monetary(await state(pool,f)),money);await cleanSession(pool);
 db.cases.push({name,status:'PASS',expectedError:number,allPricingRowsUnchanged:true,monetaryUnchanged:true});
}
async function apiSuccess(name,input){
 const before=await row(),reply=await api('admin',`/admin/pricing/${f.pricing}`,'PUT',input),actual=await row();
 assert.deepEqual(reply,{pricing:actual});assert.equal(actual.RapID,before.RapID);
 const expected=group.some(key=>Object.hasOwn(input,key))?{...before,...Object.fromEntries(Object.entries(columns).map(([key,column])=>[column,input[key]??null]))}:{...before,PhuThu:input.surcharge,TrangThai:input.status};assert.deepEqual(actual,expected);
 const listed=await api('admin',`/admin/pricing?cinemaId=${f.cinema}`),listedRow=listed.pricing.find(r=>r.GiaID===f.pricing);
 assert.deepEqual(listedRow,{...actual,TenRap:'R21 API'});
 http.cases.push({name,status:'PASS',input,actual,readAfterWrite:'PASS'});return actual;
}
async function apiReject(name,input,status,code,role='admin',id=f.pricing){
 const before=await rules(),money=monetary(await state(pool,f)),reply=await api(role,`/admin/pricing/${id}`,'PUT',input,status);
 if(code)assert.equal(reply.error.code,code);assert.match(reply.error.message,/^(?![\s\S]*(?:dbo\.|SELECT|THROW))[\s\S]*$/);
 assert.deepEqual(await rules(),before);assert.deepEqual(monetary(await state(pool,f)),money);
 http.cases.push({name,status:'PASS',expectedHttp:status,error:reply.error,allPricingRowsUnchanged:true,monetaryUnchanged:true});
}
try {
 original=await snapshot(pool);assert.equal(original.data.find(row=>row.table==='DONDATVE').rows,0,'Transaction-free disposable fixture required.');
 f=await createFixture(pool);
 for(const [role,email] of [['admin','admin@cinemadb.vn'],['manager','manager.q1@cinemadb.vn'],['customer','khachhang1@gmail.com'],['support','cskh@cinemadb.vn']])tokens[role]=(await api(role,'/auth/login','POST',{Email:email,MatKhau:'123456'})).token;
 const initial=await row();
 for(const [index,key,value] of [[1,'seatType','Thường'],[2,'dayType','Cuối tuần'],[3,'format','IMAX'],[4,'surcharge',20000],[5,'startsOn','2031-01-01'],[6,'endsOn','2031-12-31'],[7,'status','Tạm dừng']])await success(`R4.3-${String(index).padStart(2,'0')}-${key}`,{...body(await row()),[key]:value});
 const anchor={seatType:'VIP',dayType:'Ngày thường',format:'2D',surcharge:25000,startsOn:'2031-01-01',endsOn:'2031-01-10',status:'Áp dụng'};
 await success('R4.3-08-all-seven-fields',anchor);
 // Each blocker differs in exactly one condition/date before the rejected edit.
 for(const [key,value] of [['seatType','Thường'],['dayType','Cuối tuần'],['format','IMAX'],['startsOn','2031-01-21'],['endsOn','2030-12-20']]){
  let blockerInput={...anchor},candidate={...anchor};
  if(key==='startsOn'){blockerInput.startsOn='2030-12-20';blockerInput.endsOn='2030-12-31';candidate.startsOn='2030-12-31';}
  else if(key==='endsOn'){blockerInput.startsOn='2031-01-11';blockerInput.endsOn='2031-01-21';candidate.endsOn='2031-01-11';}
  else {blockerInput[key]=value;candidate[key]=value;}
  const blocker=await create(blockerInput);
  await reject(`R4.3-09-overlap-${key}`,candidate,50215);
  await apiReject(`overlap-${key}`,candidate,409,'PRICING_OVERLAP');
  await pool.request().input('ID',sql.Int,blocker.GiaID).query('DELETE dbo.BANGGIA WHERE GiaID=@ID');
 }
 const multiple=await create({...anchor,seatType:'Thường',dayType:'Cuối tuần',format:'IMAX'});
 await reject('overlap-multiple-dimensions',{...anchor,seatType:'Thường',dayType:'Cuối tuần',format:'IMAX'},50215);
 await pool.request().input('ID',sql.Int,multiple.GiaID).query('DELETE dbo.BANGGIA WHERE GiaID=@ID');
 const adjacent=await create({...anchor,startsOn:'2031-01-11',endsOn:'2031-01-21'});
 await success('R4.3-10-non-overlap-adjacent-inclusive-period',anchor);
 await success('R4.3-19-no-op-active-self-not-overlap',anchor);
 await pool.request().input('ID',sql.Int,adjacent.GiaID).query('DELETE dbo.BANGGIA WHERE GiaID=@ID');
 for(const [key,value] of [['seatType','invalid'],['dayType','Ngày lễ'],['format','invalid'],['status','invalid']])await reject('R4.3-11-invalid-'+key,{...anchor,[key]:value},547);
 await reject('R4.3-12-reversed-dates',{...anchor,endsOn:'2030-12-31'},50209);
 await reject('R4.3-13-negative-surcharge',{...anchor,surcharge:-1},50209);
 await reject('R4.3-14-missing-ID',anchor,50210,'admin',2147483647);
 await reject('R4.3-15-wrong-role',anchor,50301,'admin',f.pricing,f.customer);
 await reject('inactive-or-missing-account',anchor,50300,'admin',f.pricing,2147483647);
 await success('R4.3-16-legacy-omitted-conditions',{surcharge:12345,status:'Áp dụng'});
 assert.equal((await row()).NgayKetThuc,anchor.endsOn);
 await success('R4.3-16-explicit-null-end-clears',{...anchor,endsOn:null});
 for(const key of ['seatType','dayType','format','startsOn'])await reject('null-required-'+key,{...anchor,[key]:null},50209);
 await reject('null-surcharge',{...anchor,surcharge:null},515);
 await reject('null-status',{...anchor,status:null},515);
 // SQL's optional flag defaults to zero: even supplied condition parameters are ignored.
 const old=await row();await update({...anchor,seatType:'IMAGINARY'},'admin',f.pricing,f.admin,false);assert.deepEqual(await row(),{...old,PhuThu:anchor.surcharge,TrangThai:anchor.status});
 db.cases.push({name:'legacy-SQL-flag-zero-retains-condition-values',status:'PASS'});
 // Existing nested transaction/savepoint convention is preserved.
 await pool.request().batch('BEGIN TRANSACTION;');
 await update(anchor);assert.equal((await pool.request().query('SELECT @@TRANCOUNT n')).recordset[0].n,1);
 await pool.request().batch('ROLLBACK;');await cleanSession(pool);
 db.cases.push({name:'successful-update-does-not-commit-caller-transaction',status:'PASS'});
 await pool.request().batch('BEGIN TRANSACTION;');
 await assert.rejects(update({...anchor,endsOn:'2030-01-01'}),e=>e.number===50209);
 assert.equal((await pool.request().query('SELECT @@TRANCOUNT n')).recordset[0].n,1);await pool.request().batch('ROLLBACK;');await cleanSession(pool);
 db.cases.push({name:'pre-update-failure-restores-savepoint-with-caller-transaction',status:'PASS'});
 await pool.request().batch(`CREATE OR ALTER TRIGGER dbo.TRG_R43_PricingFault ON dbo.BANGGIA AFTER UPDATE AS
 BEGIN SET NOCOUNT ON;IF EXISTS(SELECT 1 FROM inserted WHERE GiaID=${f.pricing})
 BEGIN DECLARE @Value DECIMAL(18,2)=(SELECT PhuThu FROM inserted WHERE GiaID=${f.pricing});
 EXEC sys.sp_set_session_context @key=N'R43ObservedSurcharge',@value=@Value;
 RAISERROR(N'R43 disposable post-update failure',16,1);END;END;`);
 try {
  await reject('R4.3-17-post-update-trigger-failure',{...anchor,surcharge:98765},50000);
  assert.equal((await pool.request().query("SELECT CONVERT(DECIMAL(18,2),SESSION_CONTEXT(N'R43ObservedSurcharge')) value")).recordset[0].value,98765);
  await apiReject('post-update-failure-atomic-and-safe',{...anchor,surcharge:87654},500,'EREQUEST');
 } finally {await pool.request().batch("DROP TRIGGER dbo.TRG_R43_PricingFault;EXEC sys.sp_set_session_context @key=N'R43ObservedSurcharge',@value=NULL;");}
 await success('R4.3-20-admin-parity',anchor);
 const adminRow=await row();await success('R4.3-20-manager-parity',anchor,'manager');assert.deepEqual(await row(),adminRow);
 const managerFull=await api('manager',`/manager/pricing/${f.pricing}`,'PUT',anchor);
 const managerDto={id:f.pricing,cinemaId:f.cinema,...anchor};
 assert.deepEqual(managerFull,{pricing:managerDto});
 const managerList=await api('manager',`/manager/cinemas/${f.cinema}/pricing`);
 assert.deepEqual(managerList.pricing.find(r=>r.id===f.pricing),managerDto);
 http.cases.push({name:'real-Manager-full-update-and-readback-parity',status:'PASS',response:managerFull});
 const managerPartial=await api('manager',`/manager/pricing/${f.pricing}`,'PUT',{surcharge:22000,status:'Áp dụng'});
 assert.deepEqual(managerPartial,{pricing:{...managerDto,surcharge:22000}});
 http.cases.push({name:'real-Manager-legacy-partial-preserves-conditions',status:'PASS',response:managerPartial});
 await reject('manager-parity-overlap-or-invalid-dates',{...anchor,endsOn:'2030-12-31'},50209,'manager');
 await reject('manager-outside-cinema-scope',anchor,50050,'manager',f.pricing,f.outsideManager.NguoiDungID);
 for(const key of group){const valid={...body(await row()),[key]:({seatType:'Thường',dayType:'Cuối tuần',format:'IMAX',startsOn:'2031-01-02',endsOn:null})[key]};await apiSuccess('valid-'+key,valid);}
 await apiSuccess('full-seven-field-update',anchor);
 const {endsOn,...openGroup}=anchor;
 await apiSuccess('complete-group-with-omitted-end-opens-period',openGroup);
 await apiSuccess('legacy-partial-preserves-condition-group',{surcharge:13000,status:'Tạm dừng'});
 for(const patch of [{seatType:'invalid'},{dayType:'Ngày lễ'},{format:'invalid'},{status:'invalid'},{endsOn:'2030-12-31'},{startsOn:'2031-02-30'},{surcharge:-1},{surcharge:0.001},{surcharge:1e16},{seatType:null},{surcharge:null},{cinemaId:f.cinema},{ActorID:f.admin},{GiaID:f.pricing},{CapNhatDieuKien:true}])await apiReject('invalid-'+Object.keys(patch)[0],{...anchor,...patch},400);
 await apiReject('incomplete-condition-group',{surcharge:1,status:'Áp dụng',endsOn:null},400,'INVALID_REQUEST');
 await apiReject('missing-ID',anchor,404,'PRICING_NOT_FOUND','admin',2147483647);
 for(const [role,status,code] of [['none',401,'UNAUTHENTICATED'],['manager',403,'ADMIN_REQUIRED'],['support',403,'ADMIN_REQUIRED'],['customer',403,'ADMIN_REQUIRED']])await apiReject('authorization-'+role,anchor,status,code,role);
 grant=(await pool.request().input('User',sql.Int,f.admin).query("SELECT vq.*,CONVERT(VARCHAR(33),vq.NgayGan,126) NgayGanExact FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG n ON n.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE n.NguoiDungID=@User AND q.MaQuyen='QL_BANG_GIA'")).recordset[0];assert.ok(grant);
 await pool.request().input('Role',sql.Int,grant.VaiTroID).input('Permission',sql.Int,grant.QuyenID).query('DELETE dbo.VAITRO_QUYEN WHERE VaiTroID=@Role AND QuyenID=@Permission');permissionRemoved=true;
 try {await apiReject('live-permission-revocation',anchor,403,'FORBIDDEN');await reject('SQL-missing-permission',anchor,50302);}
 finally {await pool.request().input('Role',sql.Int,grant.VaiTroID).input('Permission',sql.Int,grant.QuyenID).input('Stamp',sql.VarChar(33),grant.NgayGanExact).query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID,NgayGan) VALUES(@Role,@Permission,CONVERT(DATETIME2(7),@Stamp))');permissionRemoved=false;}
 // Paid real booking and positive revenue provide a historical oracle, before editing the rule.
 await success('restore-bookable-rule',body(initial));
 const booking=(await bookingRequest(pool,f,f.customer).execute('dbo.sp_Booking_Create')).output.NewDonDatVeID;
 await paid(pool,f,booking);const money=monetary(await state(pool,f));
 assert.deepEqual(money.tickets.map(row=>row.GiaVe),[95000,95000]);assert.equal(money.foods[0].DonGia,10000);assert.equal(money.payments[0].SoTien,199000);
 const revenueBefore=await api('admin',`/admin/reports/revenue?cinemaId=${f.cinema}`);
 assert.equal(revenueBefore.summary.TongDoanhThuThucTe,199000);
 await apiSuccess('historical-full-edit',{...body(initial),format:'2D',surcharge:45000,endsOn:null});
 assert.deepEqual(monetary(await state(pool,f)),money);
 const futurePrice=(await pool.request().input('Show',sql.Int,f.show).input('Seat',sql.Int,f.seats[0]).query('SELECT dbo.fn_TinhGiaVe(@Show,@Seat) value')).recordset[0].value;assert.equal(futurePrice,125000);
 assert.deepEqual(await api('admin',`/admin/reports/revenue?cinemaId=${f.cinema}`),revenueBefore);
 db.cases.push({name:'R4.3-18-paid-booking-snapshots-payment-and-revenue-preserved',status:'PASS',before:money,after:monetary(await state(pool,f)),futurePrice,successfulReceipt:199000});
 http.cases.push({name:'history-price-payment-revenue-unchanged-after-real-PUT',status:'PASS',money,revenueBefore,futurePrice});
 await cleanupFixture(pool,f);f=null;
 const final=await snapshot(pool);assert.deepEqual(summarize(final),summarize(original));
 for(const e of [db,http])Object.assign(e,{status:'PASS',before:summarize(original),after:summarize(final),cleanup:'PASS',session:await cleanSession(pool)});
} catch(error) {for(const e of [db,http])Object.assign(e,{status:'FAIL',error:{message:error.message,number:error.number}});throw error;}
finally {
 await pool.request().batch("IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.TRG_R43_PricingFault;");
 if(permissionRemoved)await pool.request().input('Role',sql.Int,grant.VaiTroID).input('Permission',sql.Int,grant.QuyenID).input('Stamp',sql.VarChar(33),grant.NgayGanExact).query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID,NgayGan) VALUES(@Role,@Permission,CONVERT(DATETIME2(7),@Stamp))');
 if(f)await cleanupFixture(pool,f);
 for(const [name,e] of [['sql-tests',db],['api-tests',http]]){e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,name+'.json'),e);}
 await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();
}
console.log(`PASS R4.3: ${db.cases.length} SQL cases;${http.cases.length} API cases/${http.requests.length} real requests; snapshots/trigger/permissions preserved; full cleanup.`);

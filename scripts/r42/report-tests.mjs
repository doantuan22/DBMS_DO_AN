import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,disposable,database,env,root,connect,snapshot,summarize,write,evidenceRoot } from './common.mjs';
import { createFixture,cleanupFixture,bookingRequest,cleanSession } from '../r21/fixtures.mjs';
import { paymentAttempt,productUpdate,pricingUpdate,cancel } from '../r32/fixtures.mjs';

disposable();Object.assign(process.env,env,{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const url=`http://127.0.0.1:${server.address().port}/api`,tokens={},fixtures=[],ledger=[];
const dbEvidence={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};
const apiEvidence={database,startedAt:dbEvidence.startedAt,status:'RUNNING',requests:[],cases:[]};
const summaryKeys=['TongSoDonToanHeThong','TongSoVeBan','TongDoanhThuVe','TongDoanhThuDoAn','TongTienGiam','TongDoanhThuThucTe'];
const groupKeys=['SoDon','SoVeBan','DoanhThuVe','DoanhThuDoAn','TongTienGiam','DoanhThuThucTe'];
let original,profiles;

async function api(role,route,status=200,body){
 const response=await fetch(url+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const value=await response.json();apiEvidence.requests.push({role,route,status:response.status,expected:status,...(value.error?{error:value.error}:{})});assert.equal(response.status,status,JSON.stringify(value));return value;
}
async function rawReport(filters={},actor=fixtures[0]?.admin){return pool.request().input('ActorID',sql.Int,actor).input('TuNgay',sql.Date,filters.fromDate??null).input('DenNgay',sql.Date,filters.toDate??null).input('RapID',sql.Int,filters.cinemaId??null).execute('dbo.sp_Admin_Report_Revenue');}
const dateOnly=value=>value instanceof Date?value.toISOString().slice(0,10):value;
const plainSets=result=>result.recordsets.map(set=>set.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,key==='Ngay'?dateOnly(value):value]))));
// Independent oracle: explicit fixture receipts and snapshots; never derive expected
// amounts from any report result. Arithmetic here is offline test code only.
function expected(filters={}){
 const selected=ledger.filter(row=>(!filters.fromDate||row.day>=filters.fromDate)&&(!filters.toDate||row.day<=filters.toDate)&&(!filters.cinemaId||row.cinema===filters.cinemaId));
 const vector=rows=>[rows.length,...['tickets','ticketGross','foodGross','discount','cash'].map(key=>rows.reduce((sum,row)=>sum+row[key],0))];
 const grouped=key=>[...new Set(selected.map(row=>row[key]))].sort().map(id=>({id,metrics:Object.fromEntries(groupKeys.map((name,index)=>[name,vector(selected.filter(row=>row[key]===id))[index]]))}));
 return {selected,summary:Object.fromEntries(summaryKeys.map((name,index)=>[name,vector(selected)[index]])),cinema:grouped('cinema'),movie:grouped('movie'),date:grouped('day')};
}
function verifySets(sets,oracle){
 assert.equal(sets.length,4);assert.deepEqual(sets[0],[oracle.summary]);
 const cinemaNonZero=sets[1].filter(row=>row.SoDon!==0).map(({RapID,...row})=>({id:RapID,metrics:Object.fromEntries(groupKeys.map(key=>[key,row[key]]))}));assert.deepEqual(cinemaNonZero,oracle.cinema);
 for(const row of sets[1].filter(row=>row.SoDon===0))for(const key of groupKeys)assert.equal(row[key],0);
 for(const [index,key,groups] of [[2,'PhimID',oracle.movie],[3,'Ngay',oracle.date]]){
  assert.deepEqual(sets[index].map(row=>({id:row[key],metrics:Object.fromEntries(groupKeys.map(name=>[name,row[name]]))})),groups);
 }
 for(const index of [1,2,3])for(let column=0;column<groupKeys.length;column++)assert.equal(sets[index].reduce((sum,row)=>sum+row[groupKeys[column]],0),oracle.summary[summaryKeys[column]]);
}
async function check(name,filters={}){
 const oracle=expected(filters),result=await rawReport(filters),sets=plainSets(result);verifySets(sets,oracle);
 assert.deepEqual(Object.keys(sets[0][0]),summaryKeys);
 assert.equal(result.recordsets[3].columns.Ngay.type,sql.Date);
 const cinemaIds=(await pool.request().query('SELECT RapID FROM dbo.RAPCHIEUPHIM ORDER BY RapID')).recordset.map(row=>row.RapID).filter(id=>!filters.cinemaId||id===filters.cinemaId);
 assert.deepEqual(sets[1].map(row=>row.RapID),cinemaIds);
 const query=new URLSearchParams(Object.entries(filters).map(([key,value])=>[key,String(value)]));
 const dto=await api('admin','/admin/reports/revenue'+(query.size?'?'+query:''));
 assert.deepEqual(Object.keys(dto),['summary','byCinema','byMovie','byDate','cinemas','totals']);
 assert.deepEqual(dto,{summary:sets[0][0],byCinema:sets[1],byMovie:sets[2],byDate:sets[3],cinemas:sets[1],totals:sets[0][0]});
 dbEvidence.cases.push({name,filters,expected:oracle,actual:sets,metadata:result.recordsets.map(rows=>Object.fromEntries(Object.entries(rows.columns??{}).map(([key,value])=>[key,{type:value.type.name,precision:value.precision,scale:value.scale}]))),status:'PASS'});
 apiEvidence.cases.push({name,filters,expected:oracle.summary,response:dto,status:'PASS'});
 return sets;
}
async function finish(f,payment,status){return pool.request().input('NguoiDungID',sql.Int,f.customer).input('ThanhToanID',sql.Int,payment).input('TrangThaiThanhToan',sql.NVarChar(50),status).execute('dbo.sp_Payment_UpdateResult');}
async function order(f,seats,stamp,day,multiple=false){
 const foodGross=multiple?50000:10000;
 const request=multiple?pool.request().input('NguoiDungID',sql.Int,f.customer).input('SuatChieuID',sql.Int,f.show).input('MaKhuyenMai',sql.VarChar(50),f.code)
  .input('DanhSachGheId',sql.VarChar(sql.MAX),seats.join(',')).input('DanhSachDoAnJson',sql.NVarChar(sql.MAX),JSON.stringify([{SanPhamID:f.product,SoLuong:2},{SanPhamID:fixtures[1].product,SoLuong:3}])).output('NewDonDatVeID',sql.Int)
  :bookingRequest(pool,f,f.customer,seats);
 const result=await request.execute('dbo.sp_Booking_Create'),id=result.output.NewDonDatVeID;
 const row=(await pool.request().input('Order',sql.Int,id).query('SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@Order')).recordset[0];
 assert.deepEqual([row.TongTienVe,row.TongTienDoAn,row.TienGiamGia],[80000*seats.length,foodGross,1000]);
 let failed,pending;
 if(multiple){failed=(await paymentAttempt(pool,f,id)).output.ThanhToanID;await finish(f,failed,'Thất bại');pending=(await paymentAttempt(pool,f,id)).output.ThanhToanID;}
 const success=(await paymentAttempt(pool,f,id)).output.ThanhToanID;await finish(f,success,'Thành công');
 if(pending)await assert.rejects(finish(f,pending,'Thành công'),error=>error.number===50113);
 // Deterministic boundary fixture: only newly created test payment timestamps change.
 await pool.request().input('Payment',sql.Int,success).input('Instant',sql.VarChar(40),stamp.replace(/Z$/,'')).query('UPDATE dbo.THANHTOAN SET NgayThanhToan=CONVERT(DATETIME2(7),@Instant) WHERE ThanhToanID=@Payment');
 const amount=(await pool.request().input('Payment',sql.Int,success).query('SELECT SoTien FROM dbo.THANHTOAN WHERE ThanhToanID=@Payment')).recordset[0].SoTien;
 assert.equal(amount,80000*seats.length+foodGross-1000);
 ledger.push({id,cinema:f.cinema,movie:f.movie,day,tickets:seats.length,ticketGross:80000*seats.length,foodGross,discount:1000,cash:80000*seats.length+foodGross-1000});
 return{id,success,failed,pending};
}
async function money(){return (await pool.request().query(`SELECT d.DonDatVeID,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia FROM dbo.DONDATVE d ORDER BY d.DonDatVeID;SELECT VeID,GiaVe FROM dbo.CHITIETVE ORDER BY VeID;SELECT ChiTietDoAnID,DonGia,SoLuong FROM dbo.CHITIETDOAN ORDER BY ChiTietDoAnID;SELECT ThanhToanID,SoTien FROM dbo.THANHTOAN ORDER BY ThanhToanID;`)).recordsets;}

try{
 original=await snapshot(pool);assert.equal(original.data.find(row=>row.table.toUpperCase()==='DONDATVE').rows,0,'Use the existing transaction-free disposable DB; do not delete existing data.');
 profiles=(await pool.request().query('SELECT * FROM dbo.HOSOKHACHHANG ORDER BY NguoiDungID')).recordset;
 for(let i=0;i<2;i++){
  const f=await createFixture(pool);f.admin=f.users.find(row=>row.Email==='admin@cinemadb.vn').NguoiDungID;f.customer=f.users.find(row=>row.Email==='khachhang1@gmail.com').NguoiDungID;f.manager=f.users.find(row=>row.Email==='manager.q1@cinemadb.vn').NguoiDungID;
  f.pricing=(await pool.request().input('Cinema',sql.Int,f.cinema).query("INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,TrangThai) VALUES(@Cinema,N'Thường',N'Tất cả',N'Tất cả',0,'2000-01-01',N'Áp dụng');SELECT CONVERT(INT,SCOPE_IDENTITY()) id;")).recordset[0].id;
  fixtures.push(f);
 }
 const [a,b]=fixtures;
 for(const [role,email] of [['admin','admin@cinemadb.vn'],['manager','manager.q1@cinemadb.vn'],['customer','khachhang1@gmail.com'],['support','cskh@cinemadb.vn']])tokens[role]=(await api(role,'/auth/login',200,{Email:email,MatKhau:'123456'})).token;
 await check('R4.2-01-empty-period',{fromDate:'2050-01-01',toDate:'2050-01-02'});
 const first=await order(a,a.seats.slice(0,2),'2031-01-01T17:00:00.000Z','2031-01-02',true);
 await check('R4.2-02-single-cinema');await check('R4.2-04-single-movie');await check('R4.2-10-failed-pending-success-attempts-one-order');await check('R4.2-11-two-tickets-two-food-lines-discount-no-fanout');
 await order(b,b.seats.slice(0,1),'2031-01-02T16:59:59.9999999Z','2031-01-02');
 await order(a,a.seats.slice(2,3),'2031-01-01T16:59:59.9999999Z','2031-01-01');
 await order(b,b.seats.slice(1,2),'2031-01-02T17:00:00.000Z','2031-01-03');
 await check('R4.2-03-multiple-cinemas');await check('R4.2-05-multiple-movies');await check('R4.2-06-multi-day');
 await check('R4.2-07-day-start-and-final-datetime2-tick',{fromDate:'2031-01-02',toDate:'2031-01-02'});
 await check('R4.2-07-previous-day-boundary',{fromDate:'2031-01-01',toDate:'2031-01-01'});
 await check('R4.2-07-next-day-boundary',{fromDate:'2031-01-03',toDate:'2031-01-03'});
 await check('cinema-filter-preserves-legacy-parameters',{cinemaId:a.cinema});
 await check('open-start-bound',{toDate:'2031-01-02'});await check('open-end-bound',{fromDate:'2031-01-02'});
 await check('nonexistent-cinema-zero-summary-empty-breakdowns',{cinemaId:2147483647});
 const unpaid=[];
 for(const [f,seat] of [[a,a.seats[3]],[b,b.seats[2]],[b,b.seats[3]]]){const r=await bookingRequest(pool,f,f.customer,[seat]).execute('dbo.sp_Booking_Create');unpaid.push({f,id:r.output.NewDonDatVeID});}
 const failure=(await paymentAttempt(pool,b,unpaid[2].id)).output.ThanhToanID;await finish(b,failure,'Thất bại');
 await check('R4.2-08-failed-and-unpaid-orders-excluded');
 await pool.request().query(`UPDATE dbo.DONDATVE SET HanGiuCho=DATEADD(MINUTE,-1,dbo.fn_BayGio()) WHERE DonDatVeID IN(${unpaid.map(row=>row.id).join(',')});`);
 await pool.request().execute('dbo.sp_Order_ExpirePending');await check('expired-orders-excluded');
 await cancel(pool,b,'admin');for(const row of ledger.filter(row=>row.cinema===b.cinema))row.tickets=0;
 const compensation=(await pool.request().query('SELECT * FROM dbo.BOITHUONG_HUYSUAT ORDER BY DonDatVeID')).recordset;assert.equal(compensation.length,2);assert.ok(compensation.every(row=>row.DiemBoiThuong>0));
 await check('R4.2-09-canceled-paid-orders-retain-success-receipts-compensation-not-refund');
 await pool.request().input('Payment',sql.Int,first.success).query("UPDATE dbo.THANHTOAN SET NgayThanhToan=NULL,NgayTao='2031-01-01T17:00:00.000' WHERE ThanhToanID=@Payment");await check('legacy-null-payment-time-falls-back-to-created-time');
 // Refund status exists in schema; there is no refund API. An isolated failed
 // test attempt supplies that status fixture, without changing paid receipts.
 await pool.request().input('Payment',sql.Int,failure).query("UPDATE dbo.THANHTOAN SET TrangThai=N'Đã hoàn tiền' WHERE ThanhToanID=@Payment");
 await check('schema-supported-refunded-attempt-excluded');
 const monetary=await money();
 await productUpdate(pool,a,777777);await pricingUpdate(pool,a,'admin',55555);
 await pool.request().input('Promo',sql.Int,a.promotion).query('UPDATE dbo.KHUYENMAI SET GiaTriGiam=50000 WHERE KhuyenMaiID=@Promo');
 assert.deepEqual(await money(),monetary);await check('R4.2-12-catalog-pricing-promotion-changes-preserve-snapshots');
 const stable=plainSets(await rawReport());assert.deepEqual(plainSets(await rawReport()),stable);dbEvidence.cases.push({name:'repeat-identical-state-identical-report',status:'PASS',actual:stable});
 for(const [role,status,code] of [['none',401,'UNAUTHENTICATED'],['customer',403,'ADMIN_REQUIRED'],['manager',403,'ADMIN_REQUIRED'],['support',403,'ADMIN_REQUIRED']]){const response=await api(role,'/admin/reports/revenue',status);assert.equal(response.error.code,code);apiEvidence.cases.push({name:'authorization-'+role,status:'PASS',response});}
 for(const query of ['ActorID=1','role=ADMIN','amount=1','fromDate=2031-02-30','fromDate=2031-01-03&toDate=2031-01-01','cinemaId=2147483648']){await api('admin','/admin/reports/revenue?'+query,400);apiEvidence.cases.push({name:'validation-'+query,status:'PASS'});}
 // Live permission/account changes only in the disposable database; restore in finally.
 await pool.request().batch(`SELECT vq.* INTO #R42Grant FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG n ON n.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE n.NguoiDungID=${a.admin} AND q.MaQuyen='XEM_BAO_CAO_TOANHE';DELETE vq FROM dbo.VAITRO_QUYEN vq JOIN #R42Grant g ON g.VaiTroID=vq.VaiTroID AND g.QuyenID=vq.QuyenID;`);
 try{const reply=await api('admin','/admin/reports/revenue',403);assert.equal(reply.error.code,'FORBIDDEN');await assert.rejects(rawReport({},a.admin),error=>error.number===50302);apiEvidence.cases.push({name:'live-revoked-permission',status:'PASS',reply});}
 finally{await pool.request().batch('INSERT dbo.VAITRO_QUYEN SELECT * FROM #R42Grant;DROP TABLE #R42Grant;');}
 await assert.rejects(rawReport({},a.customer),error=>error.number===50301);await assert.rejects(rawReport({},2147483647),error=>error.number===50300);
 const valid=await api('admin','/admin/reports/revenue');assert.deepEqual(valid.summary,expected().summary);
 dbEvidence.compensation=compensation;dbEvidence.historicalMonetarySnapshotsUnchanged='PASS';
 for(const f of fixtures){await pool.request().input('Show',sql.Int,f.show).input('Cinema',sql.Int,f.cinema).query('DELETE b FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@Show;DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show;DELETE dbo.BANGGIA WHERE RapID=@Cinema;');await cleanupFixture(pool,f);}
 fixtures.length=0;
 for(const profile of profiles)await pool.request().input('User',sql.Int,profile.NguoiDungID).input('Points',sql.Int,profile.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');
 const final=await snapshot(pool);assert.deepEqual(summarize(final),summarize(original));
 for(const e of [dbEvidence,apiEvidence]){e.before=summarize(original);e.after=summarize(final);e.cleanup='PASS';e.session=await cleanSession(pool);e.status='PASS';}
}catch(error){for(const e of [dbEvidence,apiEvidence]){e.status='FAIL';e.error={message:error.message,number:error.number};}throw error;}
finally{
 for(const f of fixtures){await pool.request().input('Show',sql.Int,f.show).input('Cinema',sql.Int,f.cinema).query('DELETE b FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=@Show;DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show;DELETE dbo.BANGGIA WHERE RapID=@Cinema;');await cleanupFixture(pool,f);}
 for(const p of profiles??[])await pool.request().input('User',sql.Int,p.NguoiDungID).input('Points',sql.Int,p.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');
 for(const [file,e] of [['sql-tests',dbEvidence],['api-tests',apiEvidence]]){e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,file+'.json'),e);}
 await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();
}
console.log(`PASS R4.2: ${dbEvidence.cases.length} SQL cases;${apiEvidence.cases.length} API cases/${apiEvidence.requests.length} real requests;independent fixture oracle;full cleanup.`);

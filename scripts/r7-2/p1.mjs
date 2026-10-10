import assert from 'node:assert/strict';
import path from 'node:path';
import {start,write,evidenceRoot} from './harness.mjs';
import {fingerprints,moduleParity,open} from '../../database/11_tests/r6-group-a/support.mjs';
import {createFixture,cleanupFixture,historicalOrder,eligible,assignment,dataset,cleanSession,integrity} from './fixtures.mjs';
const h=await start('R7.2 four P1 gaps'),{e,query}=h;
const gap={KH13:['KH-13','R71-DB-01'],QLR07:['QLR-07','R71-DB-02'],QLR08:['QLR-08','R71-DB-03'],QLR09:['QLR-09','R71-DB-04']};
const main=await open('CinemaBookingDB',1);e.mainBefore=await fingerprints(main);e.fixtures=[];
async function scenario(id,label,work){
 const before=await fingerprints(h.pool),index=e.cases.length;let f;const row={id,label,status:'RUNNING'};e.fixtures.push(row);
 try{f=await createFixture(h);row.ids={cinema:f.cinema,movie:f.movie,room:f.room,show:f.show,seats:f.seats};await work(f);row.integrity=await integrity(h);row.status='PASS';}
 catch(error){row.status='FAIL';row.error={message:error.message,number:error.number};throw error;}
 finally{if(f){try{row.session=await cleanupFixture(h,f);row.after=await fingerprints(h.pool);assert.deepEqual(row.after,before);row.cleanup='PASS';}catch(error){row.cleanup='FAIL';row.cleanupError=error.message;row.status='FAIL';throw error;}finally{row.setup=f.setup;for(const c of e.cases.slice(index)){[c.ucId,c.gapId]=gap[id.split('-')[0]];c.fixtureId=id;c.cleanup=row.cleanup;c.fix='NONE';}write(path.join(evidenceRoot,'p1.json'),e);}}}
}
async function t(id,label,role,method,route,input,http=200,code,verify){
 const body=await h.test(id,id.split('-')[0],label,role,method,route,input,http,code,verify);
 const row=e.cases.at(-1);if(method==='GET')assert.deepEqual(row.after,row.before);return body;
}
const pricing=(f,more={})=>({seatType:'Thường',dayType:'Tất cả',format:'2D',surcharge:20.25,startsOn:f.date,endsOn:null,...more});
const pRoute=f=>`/manager/cinemas/${f.cinema}/pricing`;
async function pricingRead(f,body,check){
 const r=(await check('SELECT * FROM dbo.BANGGIA WHERE GiaID=@ID',{ID:body.pricing.id}))[0];
 assert.equal(r.RapID,f.cinema);assert.equal(r.LoaiGhe,body.pricing.seatType);assert.equal(r.LoaiNgay,body.pricing.dayType);assert.equal(r.DinhDang,body.pricing.format);assert.equal(r.PhuThu,body.pricing.surcharge);assert.equal(r.NgayBatDau.toISOString().slice(0,10),body.pricing.startsOn);assert.equal(r.NgayKetThuc?.toISOString().slice(0,10)??null,body.pricing.endsOn);assert.equal(r.TrangThai,body.pricing.status);
 const read=await h.request('manager','GET',pRoute(f),undefined,200);assert.deepEqual(read.pricing.find(x=>x.id===r.GiaID),body.pricing);
}
async function snapshots(f){return query(`SELECT (SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@ID FOR JSON PATH,INCLUDE_NULL_VALUES) orders,(SELECT * FROM dbo.CHITIETVE WHERE DonDatVeID=@ID FOR JSON PATH,INCLUDE_NULL_VALUES) tickets,(SELECT * FROM dbo.CHITIETDOAN WHERE DonDatVeID=@ID FOR JSON PATH,INCLUDE_NULL_VALUES) foods,(SELECT * FROM dbo.THANHTOAN WHERE DonDatVeID=@ID FOR JSON PATH,INCLUDE_NULL_VALUES) payments`,{ID:f.order});}
async function dashOracle(f,body,check){
 const expected=(await check(`SELECT @Cinema cinemaId,1 activeRooms,9 activeSeats,2 showtimesToday,3 paidOrdersToday;
 `,{Cinema:f.cinema}))[0];for(const [key,value] of Object.entries(expected))assert.equal(body.dashboard[key],value,key);
 const facts=await check(`SELECT p.PhongID,p.TrangThai roomStatus,g.GheID,g.TrangThai seatStatus FROM dbo.PHONGCHIEU p JOIN dbo.GHE g ON g.PhongID=p.PhongID WHERE p.RapID=@Cinema ORDER BY p.PhongID,g.GheID;`,{Cinema:f.cinema});assert.equal(new Set(facts.filter(r=>r.roomStatus==='Hoạt động').map(r=>r.PhongID)).size,1);assert.equal(facts.filter(r=>r.seatStatus==='Hoạt động').length,9);
 await check(`IF (SELECT COUNT(*) FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE p.RapID=@Cinema AND s.TrangThai<>N'Đã hủy' AND CONVERT(DATE,s.ThoiGianBatDau AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time')=dbo.fn_HomNay())<>2 THROW 51072,'Fixture show facts differ.',1;
 SELECT t.ThanhToanID,d.DonDatVeID,d.TrangThai orderStatus,t.TrangThai paymentStatus,t.NgayThanhToan,CONVERT(DATE,t.NgayThanhToan AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time') businessDate,CONVERT(DATE,t.NgayThanhToan) utcDate FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE p.RapID=@Cinema ORDER BY t.ThanhToanID;`,{Cinema:f.cinema});
 const paid=(await check(`SELECT COUNT(DISTINCT t.DonDatVeID) n FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE p.RapID=@Cinema AND t.TrangThai=N'Thành công' AND CONVERT(DATE,COALESCE(t.NgayThanhToan,t.NgayTao) AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time')=dbo.fn_HomNay();`,{Cinema:f.cinema}))[0].n;assert.equal(body.dashboard.paidOrdersToday,paid);
}
async function revenueOracle(f,body,check,from=f.yesterday,to=f.tomorrow){
 // Independent persisted receipt ledger: no production SP/view or business-date function.
 // Canonical uniqueness is asserted before joining separate ticket counts, avoiding fan-out.
 const ledger=await check(`DECLARE @Receipts TABLE(id INT,day DATE,ticketRevenue DECIMAL(18,2),productRevenue DECIMAL(18,2),discount DECIMAL(18,2),totalRevenue DECIMAL(18,2));
 INSERT @Receipts SELECT d.DonDatVeID,CONVERT(DATE,COALESCE(t.NgayThanhToan,t.NgayTao) AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time'),d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,t.SoTien
 FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE p.RapID=@Cinema AND t.TrangThai=N'Thành công';
 IF EXISTS(SELECT id FROM @Receipts GROUP BY id HAVING COUNT(*)<>1) THROW 51072,'Fixture must retain canonical successful receipt uniqueness.',1;
 DECLARE @Tickets TABLE(id INT,n INT);INSERT @Tickets SELECT v.DonDatVeID,COUNT(*) FROM dbo.CHITIETVE v WHERE v.TrangThai<>N'Đã hủy' AND v.DonDatVeID IN(SELECT id FROM @Receipts) GROUP BY v.DonDatVeID;
 SELECT r.day date,COUNT(*) orderCount,SUM(ISNULL(t.n,0)) ticketCount,SUM(r.ticketRevenue) ticketRevenue,SUM(r.productRevenue) productRevenue,SUM(r.discount) discount,SUM(r.totalRevenue) totalRevenue
 FROM @Receipts r LEFT JOIN @Tickets t ON t.id=r.id WHERE r.day BETWEEN CAST(@From AS DATE) AND CAST(@To AS DATE) GROUP BY r.day ORDER BY r.day DESC;`,{Cinema:f.cinema,From:from,To:to});
 for(const r of ledger)r.date=r.date.toISOString().slice(0,10);assert.deepEqual(body.revenue,ledger,'Persisted independent SQL ledger must match HTTP');
 // Expected ledger is defined by fixture facts, without calling the production SP/view.
 const expected=await check(`SELECT day date,orders orderCount,tickets ticketCount,CAST(orders*100.10 AS DECIMAL(18,2)) ticketRevenue,CAST(orders*25.25 AS DECIMAL(18,2)) productRevenue,CAST(orders*5.05 AS DECIMAL(18,2)) discount,CAST(orders*120.30 AS DECIMAL(18,2)) totalRevenue FROM (VALUES(CAST(@Yesterday AS DATE),1,1),(CAST(@Today AS DATE),3,2),(CAST(@Tomorrow AS DATE),1,1))v(day,orders,tickets) WHERE day BETWEEN CAST(@From AS DATE) AND CAST(@To AS DATE) ORDER BY day DESC;`,{Yesterday:f.yesterday,Today:f.today,Tomorrow:f.tomorrow,From:from,To:to});
 assert.equal(body.revenue.length,expected.length);
 for(let i=0;i<expected.length;i++){const r=expected[i];r.date=r.date.toISOString().slice(0,10);assert.deepEqual(body.revenue[i],r);}
 await check(`DECLARE @Actual TABLE(day DATE,orders INT,tickets INT,ticketRevenue DECIMAL(18,2),productRevenue DECIMAL(18,2),discount DECIMAL(18,2),totalRevenue DECIMAL(18,2));
 INSERT @Actual SELECT * FROM OPENJSON(@Json) WITH(day DATE '$.date',orders INT '$.orderCount',tickets INT '$.ticketCount',ticketRevenue DECIMAL(18,2) '$.ticketRevenue',productRevenue DECIMAL(18,2) '$.productRevenue',discount DECIMAL(18,2) '$.discount',totalRevenue DECIMAL(18,2) '$.totalRevenue');
 IF EXISTS(SELECT 1 FROM @Actual WHERE totalRevenue<>CAST(orders*120.30 AS DECIMAL(18,2)) OR ticketRevenue<>CAST(orders*100.10 AS DECIMAL(18,2)) OR productRevenue<>CAST(orders*25.25 AS DECIMAL(18,2)) OR discount<>CAST(orders*5.05 AS DECIMAL(18,2))) THROW 51072,'Decimal breakdown mismatch.',1;
 SELECT * FROM @Actual ORDER BY day DESC;`,{Json:JSON.stringify(body.revenue)});
}
try{
 e.before=await fingerprints(h.pool);e.parityBefore=await moduleParity(h.pool);
 for(const table of ['DONDATVE','CHITIETVE','CHITIETDOAN','THANHTOAN','BOITHUONG_HUYSUAT','DANHGIAPHIM','KHIEUNAI','XULY_KHIEUNAI'])assert.equal(e.before.data.find(r=>r.tableName===table).rows,0,'Refuse nonempty transaction target: '+table);
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['manager','manager.q1@cinemadb.vn'],['admin','admin@cinemadb.vn']])await h.login(role,email);
 await scenario('KH13-01','Eligible persisted review and public readback',async f=>{
  await eligible(f);await t('KH13-01','Eligible review','customer','POST',`/movies/${f.movie}/reviews`,{rating:5,content:'  R72 valid review  '},201,undefined,async(body,q)=>{const r=(await q('SELECT d.*,n.HoTen FROM dbo.DANHGIAPHIM d JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=d.NguoiDungID WHERE d.DanhGiaID=@ID',{ID:body.review.id}))[0];assert.equal(r.NguoiDungID,f.customer);assert.equal(r.PhimID,f.movie);assert.equal(r.SoSao,5);assert.equal(r.NoiDung,'R72 valid review');const list=await h.request('public','GET',`/movies/${f.movie}/reviews`,undefined,200);assert.deepEqual(list.reviews,[{...body.review,reviewerName:r.HoTen}]);assert.ok(!('userId' in list.reviews[0]));});
 });
 await scenario('KH13-02','Noneligible SQL trigger',async f=>{
  await t('KH13-02','No qualifying order','customer','POST',`/movies/${f.movie}/reviews`,{rating:4},403,'REVIEW_NOT_ELIGIBLE',async(_,q)=>assert.equal((await q('SELECT COUNT(*) n FROM dbo.DANHGIAPHIM WHERE PhimID=@ID',{ID:f.movie}))[0].n,0));
  await historicalOrder(f);await t('KH13-02-future','Paid future show is ineligible','customer','POST',`/movies/${f.movie}/reviews`,{rating:4},403,'REVIEW_NOT_ELIGIBLE');
  await f.q(`UPDATE dbo.DONDATVE SET TrangThai=N'Chờ thanh toán',HanGiuCho=DATEADD(MINUTE,5,dbo.fn_BayGio()) WHERE DonDatVeID=@Order;
  UPDATE dbo.THANHTOAN SET TrangThai=N'Thất bại',NgayThanhToan=NULL WHERE DonDatVeID=@Order;
  UPDATE dbo.PHIM SET NgayKhoiChieu=DATEADD(DAY,-5,dbo.fn_HomNay()),NgayKetThuc=DATEADD(DAY,20,dbo.fn_HomNay()) WHERE PhimID=@Movie;
  UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=DATEADD(DAY,-1,dbo.fn_BayGio()),ThoiGianKetThuc=DATEADD(MINUTE,90,DATEADD(DAY,-1,dbo.fn_BayGio())) WHERE SuatChieuID=@Show;`,{Order:f.order,Movie:f.movie,Show:f.show});
  await t('KH13-02-pending','Pending past show is ineligible','customer','POST',`/movies/${f.movie}/reviews`,{rating:4},403,'REVIEW_NOT_ELIGIBLE');
 });
 await scenario('KH13-03','Duplicate',async f=>{await eligible(f);await h.request('customer','POST',`/movies/${f.movie}/reviews`,{rating:4},201);await t('KH13-03','Duplicate review','customer','POST',`/movies/${f.movie}/reviews`,{rating:5},409,'REVIEW_ALREADY_EXISTS');});
 await scenario('KH13-04','Invalid rating boundaries',async f=>{for(const [i,rating] of [0,6,1.5,'5'].entries())await t(`KH13-04-${i}`,'Invalid rating','customer','POST',`/movies/${f.movie}/reviews`,{rating},400,'INVALID_RATING');});
 await scenario('KH13-05','Current grant',async f=>{await eligible(f);await h.revoked(f.customer,'DANH_GIA',()=>t('KH13-05','Missing permission','customer','POST',`/movies/${f.movie}/reviews`,{rating:5},403,'FORBIDDEN'));});
 await scenario('KH13-06','Role and spoof',async f=>{await eligible(f);await t('KH13-06-role','Wrong role','manager','POST',`/movies/${f.movie}/reviews`,{rating:5},403,'CUSTOMER_REQUIRED');await t('KH13-06-spoof','Spoof actor','customer','POST',`/movies/${f.movie}/reviews`,{rating:5,userId:f.manager},400,'UNKNOWN_REQUEST_FIELD');});
 await scenario('QLR07-01','Create readback SQL pricing and history',async f=>{await historicalOrder(f);const before=await snapshots(f);await t('QLR07-01','Scoped create','manager','POST',pRoute(f),pricing(f),201,undefined,async(body,q)=>{await pricingRead(f,body,q);assert.equal((await q('SELECT CONVERT(VARCHAR(40),dbo.fn_TinhGiaVe(@Show,@Seat)) price',{Show:f.show,Seat:f.seats[0]}))[0].price,'80020.25');assert.deepEqual(await snapshots(f),before);});});
 await scenario('QLR07-02','Full dimensions and status',async f=>{const made=await h.request('manager','POST',pRoute(f),pricing(f),201);await t('QLR07-02','Full update','manager','PUT',`/manager/pricing/${made.pricing.id}`,pricing(f,{seatType:'VIP',format:'3D',dayType:'Ngày thường',surcharge:10.10,status:'Tạm dừng',endsOn:f.date}),200,undefined,(b,q)=>pricingRead(f,b,q));});
 await scenario('QLR07-03','Official day types',async f=>{for(const [i,dayType] of ['Ngày thường','Cuối tuần','Tất cả'].entries())await t(`QLR07-03-${i}`,'Official day type','manager','POST',pRoute(f),pricing(f,{dayType}),201,undefined,(b,q)=>pricingRead(f,b,q));await t('QLR07-03-invalid','Holiday refused','manager','POST',pRoute(f),pricing(f,{dayType:'Ngày lễ'}),400,'INVALID_REQUEST');});
 await scenario('QLR07-04','Open ended date',async f=>{const made=await h.request('manager','POST',pRoute(f),pricing(f,{endsOn:f.date}),201);await t('QLR07-04','Explicit null update','manager','PUT',`/manager/pricing/${made.pricing.id}`,pricing(f,{status:'Áp dụng'}),200,undefined,async(b,q)=>{assert.equal(b.pricing.endsOn,null);await pricingRead(f,b,q);});});
 await scenario('QLR07-05','Overlap',async f=>{await h.request('manager','POST',pRoute(f),pricing(f),201);await t('QLR07-05','Overlap rejected','manager','POST',pRoute(f),pricing(f),409,'PRICING_OVERLAP');});
 await scenario('QLR07-06','Foreign scope',async f=>{await assignment(h,f,'revoked',()=>t('QLR07-06','Unassigned cinema','manager','POST',pRoute(f),pricing(f),403,'MANAGER_CINEMA_FORBIDDEN'));});
 await scenario('QLR07-07','Current assignment despite old JWT',async f=>{for(const mode of ['revoked','expired'])await assignment(h,f,mode,()=>t(`QLR07-07-${mode}`,mode,'manager','POST',pRoute(f),pricing(f),403,'MANAGER_CINEMA_FORBIDDEN'));});
 await scenario('QLR07-08','Grant and role',async f=>{await h.revoked(f.manager,'QL_BANG_GIA',()=>t('QLR07-08-grant','Missing grant','manager','POST',pRoute(f),pricing(f),403,'FORBIDDEN'));await t('QLR07-08-role','Wrong role','admin','POST',pRoute(f),pricing(f),403,'MANAGER_REQUIRED');});
 for(const [prefix,count] of [['QLR08',6],['QLR09',8]])for(let n=1;n<=count;n++){
  const id=`${prefix}-${String(n).padStart(2,'0')}`,dashboard=prefix==='QLR08',feature=dashboard?'dashboard':'revenue';
  await scenario(id,feature+' scenario '+n,async f=>{
   await dataset(f);const route=`/manager/cinemas/${f.cinema}/${feature}`,range=`?fromDate=${f.yesterday}&toDate=${f.tomorrow}`,read=dashboard?route:route+range;
   const oracle=(b,q)=>dashboard?dashOracle(f,b,q):revenueOracle(f,b,q);
   const revokeCase=dashboard?4:5,grantCase=dashboard?5:6,isolationCase=dashboard?2:4;
   if(n===revokeCase){for(const mode of ['revoked','expired'])await assignment(h,f,mode,()=>t(id+'-'+mode,mode,'manager','GET',read,undefined,403,'MANAGER_CINEMA_FORBIDDEN'));}
   else if(n===grantCase){await h.revoked(f.manager,'XEM_BAO_CAO_RAP',()=>t(id+'-grant','Missing grant','manager','GET',read,undefined,403,'FORBIDDEN'));await t(id+'-role','Wrong role','customer','GET',read,undefined,403,'MANAGER_REQUIRED');}
   else if(n===isolationCase){let foreign;try{foreign=await createFixture(h);foreign.customer=foreign.users.find(r=>r.Email==='khachhang2@gmail.com').NguoiDungID;await dataset(foreign);await t(id,'Cinema isolation','manager','GET',read,undefined,200,undefined,oracle);await assignment(h,foreign,'revoked',()=>t(id+'-foreign','Foreign cinema','manager','GET',`/manager/cinemas/${foreign.cinema}/${feature}`,undefined,403,'MANAGER_CINEMA_FORBIDDEN'));}finally{if(foreign)await cleanupFixture(h,foreign);}}
   else if(!dashboard && n===3){for(const [suffix,from,to] of [['start',f.yesterday,f.today],['end',f.today,f.tomorrow],['same',f.today,f.today]])await t(id+'-'+suffix,'Inclusive range','manager','GET',route+`?fromDate=${from}&toDate=${to}`,undefined,200,undefined,(b,q)=>revenueOracle(f,b,q,from,to));await t(id+'-default','Default range excludes future receipts','manager','GET',route,undefined,200,undefined,(b,q)=>revenueOracle(f,b,q,f.yesterday,f.today));}
   else if(!dashboard && n===7){for(const [i,suffix,code] of [[0,'?fromDate=not-a-date','INVALID_REQUEST'],[1,`?fromDate=${f.tomorrow}&toDate=${f.yesterday}`,'INVALID_REQUEST'],[2,'?actorId=999','UNKNOWN_QUERY_PARAMETER']])await t(id+'-invalid-'+i,'Invalid date/query','manager','GET',route+suffix,undefined,400,code);await t(id+'-empty','Empty range','manager','GET',route+'?fromDate=2000-01-01&toDate=2000-01-02',undefined,200,undefined,(b,q)=>revenueOracle(f,b,q,'2000-01-01','2000-01-02'));}
   else await t(id,feature+' numerical oracle and read-only','manager','GET',read,undefined,200,undefined,oracle);
  });
 }
 e.after=await fingerprints(h.pool);assert.deepEqual(e.after,e.before);e.parityAfter=await moduleParity(h.pool);e.session=await cleanSession(h.pool);e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};process.exitCode=1;}
finally{e.mainAfter=await fingerprints(main);try{assert.deepEqual(e.mainAfter,e.mainBefore);e.mainUnchanged='PASS';}catch(error){e.mainUnchanged='FAIL';e.status='FAIL';process.exitCode=1;}e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'p1.json'),e);await main.close();await h.close();console.log(JSON.stringify({status:e.status,cases:e.cases.length,fixtures:e.fixtures.length,error:e.error,evidenceRoot}));}

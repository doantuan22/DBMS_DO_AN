// Executes only source-classified read-only procedures not covered by the
// previous 21-procedure Main runtime audit. Outputs contain counts only.
import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');const require=createRequire(path.join(ROOT,'backend','package.json'));const sql=require('mssql');const dotenv=require('dotenv');const env=dotenv.parse(fs.readFileSync(path.join(ROOT,'backend','.env')));if(env.DB_DATABASE!=='CinemaBookingDB')throw new Error('Refusing: backend config must target Main.');
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-source-procedure-inventory.json'),'utf8'));
const prior=JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-readonly-procedures.json'),'utf8'));
const done=new Set(prior.results.map(x=>x.name.split(' ')[0].toLowerCase()));
const candidates=inventory.objects.filter(x=>!x.writeCapable&&!done.has(x.name.toLowerCase()));
const pool=await new sql.ConnectionPool({server:env.DB_SERVER,port:Number(env.DB_PORT??1433),database:env.DB_DATABASE,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:String(env.DB_ENCRYPT).toLowerCase()==='true',trustServerCertificate:String(env.DB_TRUST_SERVER_CERTIFICATE??'true')==='true',useUTC:true},requestTimeout:120000}).connect();
const ev={startedUtc:new Date().toISOString(),target:null,planned:candidates.length,tests:[],verdict:'BLOCKED'};
const identitySql="SELECT @@SERVERNAME serverName,DB_NAME() databaseName,DATABASEPROPERTYEX(DB_NAME(),'Status') state";
async function identity(){const i=(await pool.request().query(identitySql)).recordset[0];if(i.serverName!=='DoanTuanIT'||i.databaseName!=='CinemaBookingDB'||i.state!=='ONLINE')throw new Error(`Wrong database identity ${JSON.stringify(i)}`);return i;}
async function snapshot(){const id=await identity();const counts=(await pool.request().query(`SELECT s.name schemaName,t.name tableName,SUM(ps.row_count) row_count FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN(0,1) WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name`)).recordset;const identities=(await pool.request().query(`SELECT OBJECT_SCHEMA_NAME(object_id) schemaName,OBJECT_NAME(object_id) tableName,name columnName,IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id))) identityValue FROM sys.identity_columns ORDER BY object_id,column_id`)).recordset;return{id,counts,identities};}
const paramRows=(await pool.request().query(`SELECT o.name procedureName,p.name parameterName,p.parameter_id,p.system_type_id,t.name typeName,p.max_length,p.precision,p.scale,p.is_output FROM sys.procedures o JOIN sys.parameters p ON p.object_id=o.object_id JOIN sys.types t ON t.user_type_id=p.user_type_id WHERE SCHEMA_NAME(o.schema_id)='dbo' AND o.is_ms_shipped=0 ORDER BY o.name,p.parameter_id`)).recordset;
const meta=new Map();for(const r of paramRows){const k=r.procedureName.toLowerCase();if(!meta.has(k))meta.set(k,[]);meta.get(k).push(r);}
function typeFor(p){const n=p.typeName.toLowerCase();if(n==='int')return sql.Int;if(n==='smallint')return sql.SmallInt;if(n==='tinyint')return sql.TinyInt;if(n==='bigint')return sql.BigInt;if(n==='bit')return sql.Bit;if(n==='date')return sql.Date;if(n==='datetime')return sql.DateTime;if(n==='datetime2')return sql.DateTime2(p.scale);if(n==='uniqueidentifier')return sql.UniqueIdentifier;if(n==='decimal'||n==='numeric')return sql.Decimal(p.precision,p.scale);if(n==='money')return sql.Money;if(n==='float')return sql.Float;if(n==='real')return sql.Real;if(n==='varbinary')return p.max_length<0?sql.VarBinary(sql.MAX):sql.VarBinary(p.max_length);if(n==='binary')return sql.Binary(p.max_length);if(n==='nchar')return sql.NChar(Math.max(1,p.max_length/2));if(n==='nvarchar')return p.max_length<0?sql.NVarChar(sql.MAX):sql.NVarChar(Math.max(1,p.max_length/2));if(n==='char')return sql.Char(Math.max(1,p.max_length));return n==='varchar'?(p.max_length<0?sql.VarChar(sql.MAX):sql.VarChar(Math.max(1,p.max_length))):sql.NVarChar(sql.MAX);}
function actorFor(name,role){const n=name.toLowerCase();if(n.includes('manager'))return role.managerId;if(n.includes('staffbooking'))return role.adminId;if(n.includes('support')||n.includes('complaint_chat')||n.includes('complaint_unassigned')||n.includes('escalation_getdetail')||n.includes('escalation_list_cskh'))return role.cskhId;if(n.includes('admin')||n.includes('escalation_list_admin'))return role.adminId;if(n.includes('complaint_getbycustomer')||n.includes('complaint_listbycustomer'))return role.complaintCustomerId??role.customerId;return role.customerId;}
function valueFor(proc,p,f){const n=proc.name.toLowerCase(),k=p.parameterName.replace(/^@/,'').toLowerCase();
 if(['actorid','adminid'].includes(k))return actorFor(proc.name,f);
 if(k==='portalrole')return proc.name.toLowerCase().includes('staffbooking')?'ADMIN':'CSKH';
 if(proc.name.toLowerCase()==='sp_staffbooking_customers'&&k==='search')return '__AUDIT_NO_MATCH__';
 if(proc.name.toLowerCase()==='sp_staffbooking_options'&&k==='dondatveid')return null;
 if(k==='nguoidungid')return actorFor(proc.name,f);
 if(k==='customerid')return f.customerId;
 const manager=proc.name.toLowerCase().includes('manager');const complaintCustomer=proc.name.toLowerCase().includes('complaint_getbycustomer')||proc.name.toLowerCase().includes('complaint_listbycustomer');
 const ids={rapid:manager?f.managerCinemaId:f.cinemaId,cinemaid:manager?f.managerCinemaId:f.cinemaId,phimid:f.movieId,suatchieuid:f.showtimeId,gheid:f.seatId,phongid:manager?f.managerRoomId:f.roomId,dondatveid:f.orderId,khieunaiid:f.complaintId,yeucauid:f.escalationId,hinhanhrapid:f.imageId,giaid:f.priceId,theloaiid:f.genreId,vaitroid:f.roleId,quyenid:f.permissionId,dienvienid:f.actorId,sanphamid:f.productId,khuyenmaiid:f.promotionId,thanhtoanid:f.paymentId,userid:f.customerId,khachhangid:f.customerId};
 if(complaintCustomer&&['nguoidungid','customerid'].includes(k))return f.complaintCustomerId??f.customerId;
 if(Object.hasOwn(ids,k))return ids[k]??null;
 if(k==='email')return f.customerEmail;
 if(k==='search'||k==='searchterm'||k==='status'||k==='trangthai'||k==='loaikhieunai'||k==='mucdouutien'||k==='madcode'||k==='macode')return null;
 if(k==='tu ngay'||k==='tungay')return new Date('2000-01-01T00:00:00Z');if(k==='denngay')return new Date('2040-12-31T00:00:00Z');
 if(k==='page')return 1;if(k==='pagesize')return 50;if(k==='lainoibo')return false;
 if(k==='laanhdaidien')return false;if(k==='traveketqua')return true;
 if(k==='matkhauhash'||k==='newpasswordhash')return 'AuditOnly-PasswordHash-NotUsed';
 if(k==='ngaybatdau'||k==='ngayketthuc')return null;
 if(k==='portalrole')return 'CSKH';
 if(p.is_output)return null;
 return null;
}
function bindParams(request,proc,fixtures){for(const p of meta.get(proc.name.toLowerCase())??[]){const t=typeFor(p);if(p.is_output)request.output(p.parameterName.slice(1),t);else request.input(p.parameterName.slice(1),t,valueFor(proc,p,fixtures));}}
async function runReadOnlyProcedure(proc,fixtures){
 if(proc.name.toLowerCase()==='sp_staffbooking_lockshow'){
  const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  try{const request=tx.request();bindParams(request,proc,fixtures);const actual=await request.execute(`dbo.${proc.name}`);await tx.rollback();return actual;}
  catch(error){try{await tx.rollback();}catch{}throw error;}
 }
 const request=pool.request();bindParams(request,proc,fixtures);return request.execute(`dbo.${proc.name}`);
}
try{
 const before=await snapshot();ev.target=before.id;ev.before=before;
 const fx=(await pool.request().query(`
 SELECT
  (SELECT TOP(1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) adminId,
  (SELECT TOP(1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='CSKH' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) cskhId,
  (SELECT TOP(1) p.NguoiDungID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động' AND p.TrangThai=N'Hiệu lực' AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc) ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC) managerId,
  (SELECT TOP(1) p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động' AND p.TrangThai=N'Hiệu lực' AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc) ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC) managerCinemaId,
  (SELECT TOP(1) r.PhongID FROM dbo.PHONGCHIEU r JOIN dbo.PHANCONG_RAP p ON p.RapID=r.RapID JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=p.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='QUAN_LY_RAP' AND u.TrangThai=N'Hoạt động' AND p.TrangThai=N'Hiệu lực' AND dbo.fn_HomNay()>=p.NgayBatDau AND (p.NgayKetThuc IS NULL OR dbo.fn_HomNay()<=p.NgayKetThuc) ORDER BY p.NgayBatDau DESC,p.PhanCongID DESC,r.PhongID) managerRoomId,
  (SELECT TOP(1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) customerId,
  (SELECT TOP(1) u.Email FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) customerEmail,
  (SELECT TOP(1) v.PhimID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) movieId,
  (SELECT TOP(1) v.SuatChieuID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) showtimeId,
  (SELECT TOP(1) v.RapID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) cinemaId,
  (SELECT TOP(1) v.PhongID FROM dbo.vw_LichChieuChiTiet v WHERE v.IsBookable=1 ORDER BY v.ThoiGianBatDau,v.SuatChieuID) roomId,
  (SELECT TOP(1) g.GheID FROM dbo.GHE g ORDER BY g.GheID) seatId,
  (SELECT TOP(1) d.DonDatVeID FROM dbo.DONDATVE d WHERE d.NguoiDungID=(SELECT TOP(1) u.NguoiDungID FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID) ORDER BY d.DonDatVeID DESC) orderId,
  (SELECT TOP(1) kn.NguoiDungID FROM dbo.KHIEUNAI kn JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=kn.NguoiDungID JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' ORDER BY kn.KhieuNaiID) complaintCustomerId,
  (SELECT TOP(1) KhieuNaiID FROM dbo.KHIEUNAI ORDER BY KhieuNaiID) complaintId,
  (SELECT TOP(1) YeuCauID FROM dbo.YEUCAU_CHUYENCAP ORDER BY YeuCauID) escalationId,
  (SELECT TOP(1) HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM ORDER BY HinhAnhRapID) imageId,
  (SELECT TOP(1) GiaID FROM dbo.BANGGIA ORDER BY GiaID) priceId,
  (SELECT TOP(1) TheLoaiID FROM dbo.THELOAI ORDER BY TheLoaiID) genreId,
  (SELECT TOP(1) VaiTroID FROM dbo.VAITRO ORDER BY VaiTroID) roleId,
  (SELECT TOP(1) QuyenID FROM dbo.QUYEN ORDER BY QuyenID) permissionId,
  (SELECT TOP(1) DienVienID FROM dbo.DIENVIEN ORDER BY DienVienID) actorId,
  (SELECT TOP(1) SanPhamID FROM dbo.SANPHAM ORDER BY SanPhamID) productId,
  (SELECT TOP(1) KhuyenMaiID FROM dbo.KHUYENMAI ORDER BY KhuyenMaiID) promotionId,
  (SELECT TOP(1) ThanhToanID FROM dbo.THANHTOAN ORDER BY ThanhToanID) paymentId
 `)).recordset[0];
 const fixtures={...fx};if(!fx.adminId||!fx.cskhId||!fx.managerId||!fx.customerId||!fx.movieId||!fx.showtimeId||!fx.cinemaId||!fx.roomId||!fx.orderId||!fx.managerCinemaId||!fx.managerRoomId)throw new Error('Missing required read-only fixture; no procedures were invoked.');
 for(const proc of candidates){const retired=['sp_Admin_Permission_Create','sp_Admin_Permission_Delete','sp_Admin_Permission_Update','sp_Admin_RolePermission_Set','sp_Admin_Role_Create','sp_Admin_Role_Delete','sp_Admin_Role_Update'].includes(proc.name);const expectedError=retired?50405:null;const result={procedure:proc.name,category:'READ_ONLY',input:'source-backed existing fixture/default filters',expected:expectedError?`intentional refusal error ${expectedError}`:'successful runtime call',recordsetRows:[],verdict:'FAIL'};try{await identity();const actual=await runReadOnlyProcedure(proc,fixtures);result.recordsetRows=(actual.recordsets??[]).map(s=>s.length);result.outputNames=Object.keys(actual.output??{});result.actual='success';result.verdict=expectedError===null?'PASS':'FAIL';}catch(e){const number=Number(e.number??e.originalError?.info?.number);result.actual=`error ${number||'unknown'}`;result.message=e.message;result.expectedError=expectedError;result.verdict=expectedError===number?'PASS':'FAIL';}
   ev.tests.push(result);
 }
 ev.after=await snapshot();const same=JSON.stringify(ev.before.counts)===JSON.stringify(ev.after.counts)&&JSON.stringify(ev.before.identities)===JSON.stringify(ev.after.identities);ev.stateUnchanged=same;ev.failures=ev.tests.filter(x=>x.verdict==='FAIL');ev.verdict=same&&ev.failures.length===0?'PASS':'FAIL';
}catch(e){ev.verdict='FAIL';ev.error=e.message;ev.after=await snapshot().catch(x=>({error:x.message}));}
finally{ev.finishedUtc=new Date().toISOString();const out=path.join(ROOT,'.audit-output','main-remaining-readonly-procedures.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(ev,null,2));await pool.close();console.log(JSON.stringify({verdict:ev.verdict,target:ev.target,planned:ev.planned,executed:ev.tests.length,pass:ev.tests.filter(x=>x.verdict==='PASS').length,fail:ev.tests.filter(x=>x.verdict==='FAIL').length,stateUnchanged:ev.stateUnchanged,error:ev.error,evidence:path.relative(ROOT,out)},null,2));if(ev.verdict!=='PASS')process.exitCode=1;}

// Main-DB atomicity drill: force sp_Booking_Create to fail after consuming a
// one-use promotion, then prove that SQL Server rolled that consumption back.
// The isolated fixtures are deleted and identity metadata is checked at end.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(root, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend configuration does not target Main.');
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const token = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const neg = -300000000 - (Number.parseInt(token.slice(0, 6), 16) % 500000000);
const customerId = neg;
const promotionId = neg - 1;
const email = `atomicity-${token}@example.invalid`;
const promoCode = `ATOMIC${token}`;
const backupDir = path.join(root, '.audit-output', 'database-backups');
const backupPath = path.join(backupDir, `CinemaBookingDB_pre_atomicity_${stamp}_${token}.bak`);
const config = {
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 120000, pool: { max: 2, min: 1, idleTimeoutMillis: 30000 },
};
const pool = await new sql.ConnectionPool(config).connect();
const out = { startedUtc: new Date().toISOString(), verdict: 'BLOCKED', target: null, fixture: { customerId, promotionId, email, promoCode }, tests: [], checks: [] };
let fixtureStarted = false;
const check = (ok, message) => { if (!ok) throw new Error(message); };

async function target() {
  const r = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state,@@SPID spid`)).recordset[0];
  check(r.serverName === 'DoanTuanIT' && r.databaseName === 'CinemaBookingDB' && r.state === 'ONLINE', `Wrong target identity/status: ${JSON.stringify(r)}`);
  return r;
}
async function state() {
  const id = await target();
  const counts = (await pool.request().query(`
    SELECT s.name schemaName,t.name tableName,SUM(ps.row_count) row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.dm_db_partition_stats ps ON ps.object_id=t.object_id AND ps.index_id IN(0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name
  `)).recordset;
  const identities = (await pool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) schemaName,OBJECT_NAME(object_id) tableName,name columnName,
           IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id))) identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id
  `)).recordset;
  return { id, counts, identities };
}
const sameDataState = (a,b) => JSON.stringify(a.counts) === JSON.stringify(b.counts) && JSON.stringify(a.identities) === JSON.stringify(b.identities);
async function noForeignTransactions(ownSpid) {
  const rows = (await pool.request().input('spid',sql.Int,ownSpid).query(`
    SELECT DISTINCT s.session_id,s.program_name,s.status
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID() AND s.is_user_process=1 AND s.session_id<>@spid
  `)).recordset;
  check(rows.length===0,`Foreign open transaction found; refusing DML: ${JSON.stringify(rows)}`);
}
async function dbcc() {
  const r=await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS');
  const rows=(r.recordsets??[]).flat();
  return { violations: rows.length, clean: rows.length===0 };
}

try {
  const before=await state(); out.target=before.id; out.before=before;
  const dbs=(await pool.request().query(`SELECT name,state_desc,create_date FROM sys.databases WHERE name IN(N'CinemaBookingDB',N'CinemaBookingDB_Test') ORDER BY name`)).recordset;
  check(dbs.length===2 && dbs.every(x=>x.state_desc==='ONLINE'),'Main/Test online preflight failed.'); out.mainAndTestBefore=dbs;
  await noForeignTransactions(before.id.spid);
  const collision=(await pool.request().input('uid',sql.Int,customerId).input('pid',sql.Int,promotionId).input('email',sql.VarChar(150),email).input('code',sql.VarChar(50),promoCode).query(`
    SELECT (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE NguoiDungID=@uid OR Email=@email) userHits,
           (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@pid OR MaCode=@code) promotionHits
  `)).recordset[0];
  check(collision.userHits===0&&collision.promotionHits===0,'Unique fixture collision; refusing DML.');
  const fx=(await pool.request().query(`
    SELECT TOP(1) v.SuatChieuID showtimeId,
           (SELECT TOP(1) f.GheID FROM dbo.fn_DanhSachGheSuatChieu(v.SuatChieuID) f WHERE f.TrangThaiGhe=N'Trống' ORDER BY f.GheID) seatId,
           r.VaiTroID roleId,u.TrangThai customerStatus
    FROM dbo.vw_LichChieuChiTiet v CROSS JOIN dbo.VAITRO r
    JOIN dbo.NGUOIDUNG u ON u.VaiTroID=r.VaiTroID
    WHERE v.IsBookable=1 AND v.ThoiGianBatDau>=DATEADD(minute,30,dbo.fn_BayGio())
      AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=v.SuatChieuID)
      AND r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động'
      AND EXISTS(SELECT 1 FROM dbo.fn_DanhSachGheSuatChieu(v.SuatChieuID) f WHERE f.TrangThaiGhe=N'Trống')
    ORDER BY v.ThoiGianBatDau,v.SuatChieuID,u.NguoiDungID
  `)).recordset[0];
  check(fx?.showtimeId && fx.seatId && fx.roleId,'No safe future showtime with a free seat and active customer role.');
  out.fixture.showtimeId=fx.showtimeId; out.fixture.seatId=fx.seatId;
  const backupSql=backupPath.replaceAll("'","''"); fs.mkdirSync(backupDir,{recursive:true}); check(!fs.existsSync(backupPath),'Backup path already exists.');
  await pool.request().query(`BACKUP DATABASE [CinemaBookingDB] TO DISK=N'${backupSql}' WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=N'${backupSql}' WITH CHECKSUM;`);
  out.backup={path:path.relative(root,backupPath),bytes:fs.statSync(backupPath).size,verifyOnly:true};

  const baselinePromo=(await pool.request().query(`SELECT IDENT_CURRENT(N'dbo.DONDATVE') orderIdentity,IDENT_CURRENT(N'dbo.CHITIETVE') ticketIdentity`)).recordset[0];
  out.identityBaseline=baselinePromo;
  await pool.request().input('uid',sql.Int,customerId).input('pid',sql.Int,promotionId).input('role',sql.Int,fx.roleId)
    .input('status',sql.NVarChar(50),fx.customerStatus).input('email',sql.VarChar(150),email).input('code',sql.VarChar(50),promoCode).query(`
      SET XACT_ABORT ON; BEGIN TRANSACTION;
      BEGIN TRY
        SET IDENTITY_INSERT dbo.NGUOIDUNG ON;
        INSERT dbo.NGUOIDUNG(NguoiDungID,VaiTroID,HoTen,Email,MatKhau,SoDienThoai,NgayTao,TrangThai)
        VALUES(@uid,@role,N'Audit atomicity fixture',@email,'AUDIT-ONLY-NOT-A-CREDENTIAL',NULL,dbo.fn_BayGio(),@status);
        SET IDENTITY_INSERT dbo.NGUOIDUNG OFF;
        INSERT dbo.HOSOKHACHHANG(NguoiDungID,NgaySinh,GioiTinh,DiemTichLuy) VALUES(@uid,NULL,NULL,0);
        SET IDENTITY_INSERT dbo.KHUYENMAI ON;
        INSERT dbo.KHUYENMAI(KhuyenMaiID,MaCode,MoTa,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,GiamToiDa,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai)
        VALUES(@pid,@code,N'Audit atomicity fixture','PERCENT',10,0,NULL,'20000101','20991231',1,0,N'Hoạt động');
        SET IDENTITY_INSERT dbo.KHUYENMAI OFF;
        COMMIT TRANSACTION;
      END TRY BEGIN CATCH
        BEGIN TRY SET IDENTITY_INSERT dbo.NGUOIDUNG OFF; END TRY BEGIN CATCH END CATCH;
        BEGIN TRY SET IDENTITY_INSERT dbo.KHUYENMAI OFF; END TRY BEGIN CATCH END CATCH;
        IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW;
      END CATCH;
    `);
  fixtureStarted=true;
  const promoBefore=(await pool.request().input('id',sql.Int,promotionId).query(`SELECT SoLuong,SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@id`)).recordset[0];
  check(promoBefore?.SoLuong===1&&promoBefore.SoLuongDaDung===0,'Promotion fixture did not start unused/quota 1.');
  let caught=null;
  try {
    const req=pool.request().input('NguoiDungID',sql.Int,customerId).input('SuatChieuID',sql.Int,fx.showtimeId)
      .input('MaKhuyenMai',sql.VarChar(50),promoCode).input('DanhSachGheId',sql.VarChar(sql.MAX),String(fx.seatId))
      .input('DanhSachDoAnJson',sql.NVarChar(sql.MAX),null).input('DiemSuDung',sql.Int,-1).input('ChiXemTruoc',sql.Bit,false)
      .output('NewDonDatVeID',sql.Int);
    await req.execute('dbo.sp_Booking_Create');
  } catch(error) { caught={number:Number(error.number??error.originalError?.info?.number??0),message:error.message}; }
  check(caught?.number===50410,`Expected sp_Booking_Create error 50410 after promo consumption; got ${caught?.number||'no SQL error'}: ${caught?.message??'no error returned'}.`);
  const rollbackState=(await pool.request().input('pid',sql.Int,promotionId).input('uid',sql.Int,customerId).input('show',sql.Int,fx.showtimeId).query(`
    SELECT (SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@pid) promotionUsed,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE NguoiDungID=@uid AND SuatChieuID=@show) orderRows,
      (SELECT COUNT(*) FROM dbo.DONDATVE d JOIN dbo.CHITIETVE v ON v.DonDatVeID=d.DonDatVeID WHERE d.NguoiDungID=@uid AND d.SuatChieuID=@show) ticketRows,
      (SELECT COUNT(*) FROM dbo.CHITIETDOAN c JOIN dbo.DONDATVE d ON d.DonDatVeID=c.DonDatVeID WHERE d.NguoiDungID=@uid AND d.SuatChieuID=@show) foodRows
  `)).recordset[0];
  check(rollbackState.promotionUsed===0&&rollbackState.orderRows===0&&rollbackState.ticketRows===0&&rollbackState.foodRows===0,
    `Atomic rollback leaked state: ${JSON.stringify(rollbackState)}`);
  out.tests.push({name:'booking_error_after_promotion_consumption_rolls_back_atomically',input:{showtimeId:fx.showtimeId,seatId:fx.seatId,promotionQuota:1,requestedPoints:-1},expected:'error 50410; promo used=0; no order/ticket/food rows; identity values unchanged',actual:{error:caught,...rollbackState},verdict:'PASS'});
  const identitiesAfterCall=(await pool.request().query(`SELECT IDENT_CURRENT(N'dbo.DONDATVE') orderIdentity,IDENT_CURRENT(N'dbo.CHITIETVE') ticketIdentity`)).recordset[0];
  check(JSON.stringify(identitiesAfterCall)===JSON.stringify(baselinePromo),'Identity metadata changed on rejected booking.');

  await pool.request().input('uid',sql.Int,customerId).input('pid',sql.Int,promotionId).input('email',sql.VarChar(150),email).input('code',sql.VarChar(50),promoCode).query(`
    SET XACT_ABORT ON; BEGIN TRANSACTION;
    BEGIN TRY
      IF EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE NguoiDungID=@uid OR KhuyenMaiID=@pid) THROW 52999,N'Unexpected dependent order rows: refuse cleanup.',1;
      DELETE FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@pid AND MaCode=@code AND SoLuongDaDung=0;
      DELETE FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@uid;
      DELETE FROM dbo.NGUOIDUNG WHERE NguoiDungID=@uid AND Email=@email;
      COMMIT TRANSACTION;
    END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END CATCH;
  `);
  fixtureStarted=false;
  const after=await state(); out.after=after; out.stateUnchanged=sameDataState(before,after);
  out.constraintState=await dbcc();
  out.mainAndTestAfter=(await pool.request().query(`SELECT name,state_desc,create_date FROM sys.databases WHERE name IN(N'CinemaBookingDB',N'CinemaBookingDB_Test') ORDER BY name`)).recordset;
  check(out.stateUnchanged,'Main row counts or identity metadata changed after atomicity drill.');
  check(out.constraintState.clean,'DBCC CHECKCONSTRAINTS reported violations after atomicity drill.');
  check(JSON.stringify(dbs)===JSON.stringify(out.mainAndTestAfter),'Main/Test state changed during drill.');
  await noForeignTransactions(before.id.spid);
  out.verdict='PASS';
} catch(error) {
  out.error=error.message; out.verdict='FAIL';
  if(fixtureStarted) {
    try {
      await pool.request().input('uid',sql.Int,customerId).input('pid',sql.Int,promotionId).input('email',sql.VarChar(150),email).input('code',sql.VarChar(50),promoCode).query(`
        IF NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE NguoiDungID=@uid OR KhuyenMaiID=@pid)
        BEGIN DELETE FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@pid AND MaCode=@code AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE WHERE KhuyenMaiID=@pid);
              DELETE FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@uid; DELETE FROM dbo.NGUOIDUNG WHERE NguoiDungID=@uid AND Email=@email; END
      `);
      out.cleanup={attempted:true};
    } catch(cleanupError) { out.cleanup={attempted:true,error:cleanupError.message}; out.verdict='BLOCKED'; }
  }
  try { out.after=await state(); if(out.before) out.stateUnchanged=sameDataState(out.before,out.after); out.constraintState=await dbcc(); } catch(verifyError) { out.postFailureVerificationError=verifyError.message; }
} finally {
  out.finishedUtc=new Date().toISOString();
  const dest=path.join(root,'.audit-output','main-booking-atomicity-drill.json');
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(out,null,2));
  await pool.close(); console.log(JSON.stringify({verdict:out.verdict,target:out.target,backup:out.backup,tests:out.tests,stateUnchanged:out.stateUnchanged,constraintState:out.constraintState,error:out.error,cleanup:out.cleanup,evidence:path.relative(root,dest)},null,2));
  if(out.verdict!=='PASS') process.exitCode=1;
}

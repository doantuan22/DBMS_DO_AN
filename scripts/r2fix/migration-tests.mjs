// Isolated, reproducible legacy R2 fixtures, constraint failures and in-place migration proofs.
import assert from 'node:assert/strict';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { root, dbRoot, credentials, read, write, expandSql, sqlcmd } from '../db/lib.mjs';
import { batches, migrate } from './migration-lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!/^CinemaBookingDB_R0_R1_R2_FixMigration[A-Za-z0-9_]*$/.test(database||'')) throw Error('A NEW disposable --database=CinemaBookingDB_R0_R1_R2_FixMigration<name> is required.');
let build=expandSql('build-objects.sql');
for(const [current,fixture] of [
 ['02_tables/boithuong_huysuat.sql','boithuong_huysuat.before.sql'],
 ['08_procedures/system/sp_Showtime_CancelCascade.sql','sp_Showtime_CancelCascade.before.sql'],
 ['08_procedures/customer/sp_Order_GetDetailByCustomer.sql','sp_Order_GetDetailByCustomer.before.sql']
]) build=build.replace(read(path.join(dbRoot,current)),read(path.join(root,'audit/remediation/r2fix/fixtures',fixture)));
// CREATE refuses an existing database; this test never resets or drops a database/table.
sqlcmd((build+'\n'+expandSql('10_seed/seed-all.sql')).replaceAll('CinemaBookingDB',database).replaceAll('$(SeedDate)','2026-10-04'),{database:'master',file:true});
const env=credentials();
const pool=await new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true}}).connect();
const evidence=path.join(root,'audit/remediation/r2fix/evidence');
const checks=[];
const check=name=>{checks.push({name,status:'PASS'});console.log('PASS '+name);};
const legacyColumns=async()=> (await pool.request().query("SELECT name FROM sys.columns WHERE object_id=OBJECT_ID('dbo.BOITHUONG_HUYSUAT') ORDER BY column_id")).recordset.map(r=>r.name);
const events=async()=> (await pool.request().query('SELECT * FROM dbo.BOITHUONG_HUYSUAT ORDER BY DonDatVeID')).recordset;
const snapshot=async()=> (await pool.request().query(`
 SELECT OBJECT_ID('dbo.BOITHUONG_HUYSUAT') AS TableObjectID;
 SELECT * FROM dbo.DONDATVE ORDER BY DonDatVeID;
 SELECT * FROM dbo.THANHTOAN ORDER BY ThanhToanID;
 SELECT * FROM dbo.HOSOKHACHHANG ORDER BY NguoiDungID;
 SELECT * FROM dbo.SUATCHIEU ORDER BY SuatChieuID;
 SELECT * FROM dbo.KHUYENMAI ORDER BY KhuyenMaiID;`)).recordsets;
async function inTransaction(action,{commit=false}={}) {
 const transaction=new sql.Transaction(pool);let open=false;transaction.on('rollback',()=>{open=false;});
 try {await transaction.begin();open=true;const result=await action(transaction);if(open){commit?await transaction.commit():await transaction.rollback();open=false;}return result;}
 finally {if(open)await transaction.rollback();}
}
try {
 const fixture=(await pool.request().query(`
 DECLARE @User INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com'),
         @Actor INT=(SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'),
         @Show INT=(SELECT TOP(1) SuatChieuID FROM dbo.SUATCHIEU ORDER BY SuatChieuID),
         @First INT, @Second INT, @Free INT;
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai)
 VALUES(@User,@Show,120000,80000,50000,N'Đã hủy');SET @First=SCOPE_IDENTITY();
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai)
 VALUES(@User,@Show,120000,0,0,N'Đã hủy');SET @Second=SCOPE_IDENTITY();
 INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai)
 VALUES(@User,@Show,80000,0,0,N'Đã thanh toán');SET @Free=SCOPE_IDENTITY();
 INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,NgayThanhToan,MaGiaoDich,TrangThai,GhiChu)
 VALUES(@First,N'MOMO',150000,'2026-10-04T04:00:00','R2FIX-HISTORY-1',N'Thành công',N'Preserve original payment'),
       (@Second,N'MOMO',120000,'2026-10-04T04:01:00','R2FIX-HISTORY-2',N'Thành công',NULL);
 INSERT dbo.BOITHUONG_HUYSUAT(DonDatVeID,SuatChieuID,NguoiDungID,TongTienVe,TongTienDoAn,TienGiamGia,TienVeThucTra,DiemCong,NgayBoiThuong,NguoiThucHienID)
 VALUES(@First,@Show,@User,120000,80000,50000,90000,90,'2026-10-04T05:00:00.1234567',@Actor),
       (@Second,@Show,@User,120000,0,0,120000,117,'2026-10-04T05:01:00.7654321',NULL);
 SELECT @First AS FirstID,@Second AS SecondID,@Free AS FreeID,@Actor AS ActorID;
 `)).recordset[0];
 const beforeEvents=await events(), beforeState=await snapshot(), beforeColumns=await legacyColumns();
 // A historical event of 117 deliberately differs from today's formula (120): never recalculate history.
 await inTransaction(async tx=>{
  await new sql.Request(tx).input('ID',sql.Int,fixture.SecondID).query('UPDATE dbo.BOITHUONG_HUYSUAT SET DiemCong=2147483648 WHERE DonDatVeID=@ID');
  await assert.rejects(migrate(tx),e=>e.number===51041);
 });
 assert.deepEqual(await events(),beforeEvents);assert.deepEqual(await legacyColumns(),beforeColumns);
 check('out-of-INT historical points refused before DDL; entire transaction unchanged');
 await inTransaction(async tx=>{
  await new sql.Request(tx).input('ID',sql.Int,fixture.FirstID).query('UPDATE dbo.BOITHUONG_HUYSUAT SET TongTienVe=TongTienVe+1 WHERE DonDatVeID=@ID');
  await assert.rejects(migrate(tx),e=>e.number===51045);
 });
 assert.deepEqual(await events(),beforeEvents);assert.deepEqual(await legacyColumns(),beforeColumns);
 check('disagreeing duplicate snapshots refused without discarding historical information');
 await inTransaction(async tx=>{
  await migrate(tx);
  const count=(await new sql.Request(tx).query('SELECT COUNT(*) AS C FROM dbo.BOITHUONG_HUYSUAT')).recordset[0].C;
  assert.equal(count,2);
 });
 assert.deepEqual(await events(),beforeEvents);assert.deepEqual(await legacyColumns(),beforeColumns);assert.deepEqual(await snapshot(),beforeState);
 check('caller rollback restores old schema, records and every business state');
 // Simulate a deployment failure AFTER DDL but before matching procedure deployment.
 await inTransaction(async tx=>{
  await batches(tx,read(path.join(dbRoot,'13_migrations/r2fix_compensation_3nf.sql')));
  await assert.rejects(new sql.Request(tx).query("THROW 51044, 'Injected deployment failure', 1;"),e=>e.number===51044);
 });
 assert.deepEqual(await events(),beforeEvents);assert.deepEqual(await legacyColumns(),beforeColumns);
 check('failure after schema changes rolls back in-place DDL without losing events');
 await inTransaction(tx=>migrate(tx),{commit:true});
 const afterEvents=await events();assert.deepEqual(await snapshot(),beforeState);
 assert.deepEqual(afterEvents.map(r=>({order:r.DonDatVeID,points:r.DiemBoiThuong,at:r.NgayBoiThuong,note:r.GhiChu})),
  beforeEvents.map(r=>({order:r.DonDatVeID,points:Number(r.DiemCong),at:r.NgayBoiThuong,note:r.NguoiThucHienID===null?null:`Người thực hiện ID: ${r.NguoiThucHienID}`})));
 // Compare SQL text, not JS Date milliseconds, to prove preservation of all seven fractional timestamp digits.
 const timestampRows=(await pool.request().query("SELECT DonDatVeID,CONVERT(VARCHAR(40),NgayBoiThuong,126) AS At FROM dbo.BOITHUONG_HUYSUAT ORDER BY DonDatVeID")).recordset;
 assert.deepEqual(timestampRows.map(r=>r.At),['2026-10-04T05:00:00.1234567','2026-10-04T05:01:00.7654321']);
 assert.equal(afterEvents.length,2);assert.equal(new Set(afterEvents.map(r=>r.BoiThuongID)).size,2);
 check('in-place object ID/count/order/points/timestamp(7)/actor notes preserved; no payment or points rewrites');
 await inTransaction(tx=>migrate(tx),{commit:true});
 assert.deepEqual(await events(),afterEvents);assert.deepEqual(await snapshot(),beforeState);
 check('migration retry is idempotent and preserves generated identity IDs');
 const insert=async(id,points)=>pool.request().input('ID',sql.Int,id).input('Points',sql.Int,points).query('INSERT dbo.BOITHUONG_HUYSUAT(DonDatVeID,DiemBoiThuong,NgayBoiThuong) VALUES(@ID,@Points,SYSUTCDATETIME());');
 await assert.rejects(insert(fixture.FirstID,90),e=>[2601,2627].includes(e.number));check('UNIQUE(DonDatVeID) rejects duplicate event');
 await assert.rejects(insert(2147483647,0),e=>e.number===547);check('FK rejects nonexistent order');
 await assert.rejects(insert(fixture.FreeID,-1),e=>e.number===547);check('CHECK rejects negative points');
 await assert.rejects(pool.request().input('ID',sql.Int,fixture.FirstID).query('DELETE dbo.DONDATVE WHERE DonDatVeID=@ID;'),e=>e.number===547);
 check('order delete cannot cascade away audit history');
 // Atomic deployment schema is logically equal to a fresh baseline despite unchanged physical column ordinals.
 sqlcmd(expandSql('12_verify/verify_database.sql').replaceAll('CinemaBookingDB',database),{database,file:true});
 check('full migrated DB schema/constraints/modules/dependencies/security verification PASS');
 write(path.join(evidence,'migration.json'),{status:'PASS',database,checks,beforeEvents,afterEvents,timestampRows,beforeColumns,afterColumns:await legacyColumns(),tableObjectID:beforeState[0][0].TableObjectID});
}catch(error){write(path.join(evidence,'migration.json'),{status:'FAIL',database,checks,error:error.message});throw error;}
finally{await pool.close();}

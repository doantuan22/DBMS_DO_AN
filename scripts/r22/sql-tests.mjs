import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,connect,batches,snapshot,summarize,read,write,root,evidenceRoot,sql } from './common.mjs';
import { createFixture,cleanupFixture,state,bookingRequest,cleanSession } from '../r21/fixtures.mjs';
disposable();const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};let f;
try {
 const before=await snapshot(pool);
 const result=await batches(pool,read(path.join(root,'database/11_tests/booking/promotion_atomicity.sql')));
 evidence.cases=result.recordsets.find(rows=>rows[0]?.CaseName)??[];
 assert.equal(evidence.cases.length,28);assert.ok(evidence.cases.every(row=>row.Status==='PASS'));
 f=await createFixture(pool);const user=f.users.find(u=>u.Email==='khachhang1@gmail.com').NguoiDungID;
 const initial=await state(pool,f);
 // Disposable-only trigger records the actual post-consumption value before failing
 // the order write. No hook goes into source modules or the application database.
 await pool.request().batch(`CREATE TRIGGER dbo.R22_InjectFailure ON dbo.DONDATVE AFTER INSERT AS BEGIN
  SET NOCOUNT ON;
  IF EXISTS(SELECT 1 FROM inserted WHERE SuatChieuID=${f.show}) BEGIN
   DECLARE @Used INT=(SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID=${f.promotion});
   EXEC sys.sp_set_session_context @key=N'R22_ConsumedBeforeFailure',@value=@Used;
   THROW 51022,'Disposable injected failure after promotion consumption.',1;
  END; END;`);
 try {await assert.rejects(bookingRequest(pool,f,user).execute('dbo.sp_Booking_Create'),error=>error.number===51022);}
 finally {await pool.request().batch('DROP TRIGGER IF EXISTS dbo.R22_InjectFailure;');}
 const consumed=(await pool.request().query("SELECT CONVERT(INT,SESSION_CONTEXT(N'R22_ConsumedBeforeFailure')) usageBeforeFailure")).recordset[0];assert.equal(consumed.usageBeforeFailure,1);
 const afterFailure=await state(pool,f);assert.deepEqual(afterFailure,initial);
 evidence.rollbackInjection={initial,consumed,final:afterFailure,session:await cleanSession(pool),status:'PASS'};
 await bookingRequest(pool,f,user).execute('dbo.sp_Booking_Create');
 const committed=await state(pool,f);assert.equal(committed.orders.length,1);assert.equal(committed.promotion[0].SoLuongDaDung,1);
 assert.equal(Number(committed.orders[0].TongTienVe),160000);assert.equal(Number(committed.orders[0].TongTienDoAn),10000);assert.equal(Number(committed.orders[0].TienGiamGia),1000);
 evidence.committedPositive={initial,final:committed,session:await cleanSession(pool),status:'PASS'};
 await cleanupFixture(pool,f);f=null;
 // Existing schema rejects malformed types/values/max/quota; no invented rule.
 const checks=[['type',"LoaiGiamGia=N'INVALID'"],['value','GiaTriGiam=0'],['percent99',"LoaiGiamGia=N'PERCENT',GiaTriGiam=100"],['max','GiamToiDa=-1'],['minimum','DonHangToiThieu=-1'],['quota','SoLuongDaDung=SoLuong+1']];
 evidence.constraintCases=[];
 for(const [name,assignment] of checks) {
  f=await createFixture(pool);const start=await state(pool,f);
  await assert.rejects(pool.request().input('Promo',sql.Int,f.promotion).query(`UPDATE dbo.KHUYENMAI SET ${assignment} WHERE KhuyenMaiID=@Promo`),e=>e.number===547);
  assert.deepEqual(await state(pool,f),start);evidence.constraintCases.push({name,sqlError:547,status:'PASS'});await cleanupFixture(pool,f);f=null;
 }
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.cleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R22_InjectFailure;');if(f)await cleanupFixture(pool,f);evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'sql-tests.json'),evidence);await pool.close();}
console.log(`PASS SQL promotion: ${evidence.cases.length} cases,6 constraints,post-consumption failure rollback and committed snapshots; no data/schema drift.`);

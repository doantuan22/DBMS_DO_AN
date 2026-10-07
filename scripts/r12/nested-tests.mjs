import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,disposable,database,connect,actors,fixture,cleanupRoom,roomState,snapshot,summarize,write,evidenceRoot,read,dbRoot,batches } from './common.mjs';
disposable();const pool=await connect(),rooms=[];
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};
const dependencies=['08_procedures/public/sp_Showtime_GetDetail.sql','08_procedures/customer/sp_Order_ExpirePending.sql'].map(file=>read(path.join(dbRoot,file)));
let originalPrefixes={};
async function restoreDependencies() {
 for(const source of dependencies) {
  const name=/CREATE\s+OR\s+ALTER\s+PROCEDURE\s+dbo\.(\w+)/i.exec(source)[1];
  for(const batch of source.split(/^GO\s*$/gmi).filter(value=>value.trim())) {
   const body=batch.trimStart();
   await pool.request().batch(/CREATE\s+OR\s+ALTER\s+PROCEDURE/i.test(body)?(originalPrefixes[name]??'')+body:body);
  }
 }
}
const state=async()=>(await pool.request().batch('DECLARE @Count INT=@@TRANCOUNT,@State INT=XACT_STATE();SELECT @Count transactions,@State state;')).recordset[0];
async function call(actor,role,kind,room,show,start,end) {
 const request=pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,actor[role]);
 if(kind==='Cancel') request.input('SuatChieuID',sql.Int,show);
 else {
  request.input('PhimID',sql.Int,actor.movie).input('ThoiGianBatDau',sql.DateTime2,start).input('ThoiGianKetThuc',sql.DateTime2,end)
   .input('DinhDang',sql.NVarChar(50),'2D').input('GiaVeCoBan',sql.Decimal(18,2),80000);
  if(kind==='Create') request.input('PhongID',sql.Int,room);
  else request.input('SuatChieuID',sql.Int,show).input('TrangThai',sql.NVarChar(50),'Mở bán');
 }
 return request.execute('dbo.'+(role==='admin'?'usp_Admin_Showtime_':'sp_Manager_Showtime_')+kind);
}
try {
 const before=await snapshot(pool),actor=await actors(pool);
 originalPrefixes=Object.fromEntries(before.metadata.objects.filter(row=>['sp_Showtime_GetDetail','sp_Order_ExpirePending'].includes(row.name)).map(row=>[row.name,/^\s*/.exec(row.definition)[0]]));
 const times=(await pool.request().input('Movie',sql.Int,actor.movie).query('SELECT DATEADD(DAY,10,dbo.fn_BayGio()) start,ThoiLuong FROM dbo.PHIM WHERE PhimID=@Movie')).recordset[0];
 const start=times.start,end=new Date(start.getTime()+(times.ThoiLuong+10)*60000);
 // Inject a dependency failure with XACT_ABORT OFF in the callee to exercise a genuinely
 // committable error; other cases retain ON and verify doomed-transaction rollback.
 // Only this fixture's session/room is affected; both dependencies are restored afterward.
 const fault=`IF EXISTS(SELECT 1 FROM dbo.SUATCHIEU WHERE SuatChieuID=@SuatChieuID AND PhongID=TRY_CONVERT(INT,SESSION_CONTEXT(N'R12_FaultRoom')))
    BEGIN SET XACT_ABORT OFF; EXEC dbo.R12_IntentionallyMissingDependency; END;`;
 for(const source of dependencies) await batches(pool,source.replace('SET NOCOUNT ON;','SET NOCOUNT ON;\n'+fault));
 for(const role of ['manager','admin']) for(const kind of ['Create','Update','Cancel']) for(const mode of ['success','committable_failure']) {
  const room=await fixture(pool,actor.cinema);rooms.push(room);
  let show;
  if(kind!=='Create') {await call(actor,'manager','Create',room,null,start,end);show=(await roomState(pool,room)).shows[0].SuatChieuID;}
  const initial=await roomState(pool,room);
  const test={role,kind,mode,initial};evidence.cases.push(test);
  await pool.request().input('Room',sql.Int,room).batch("SET XACT_ABORT OFF;BEGIN TRANSACTION;UPDATE dbo.PHONGCHIEU SET TenPhong=TenPhong+N' caller marker' WHERE PhongID=@Room;");
  if(mode==='committable_failure') await pool.request().input('Room',sql.Int,room).batch("EXEC sys.sp_set_session_context @key=N'R12_FaultRoom',@value=@Room;");
  try {
   const result=await call(actor,role,kind,room,show,kind==='Update'?new Date(start.getTime()+360*60000):start,kind==='Update'?new Date(end.getTime()+360*60000):end);
   test.procedureResult={status:'SUCCESS',recordsets:result.recordsets};assert.equal(mode,'success');
  } catch(error) {test.procedureResult={status:'ERROR',number:error.number,message:error.message};assert.equal(mode,'committable_failure');assert.equal(error.number,2812);}
  test.transactionAfterProcedure=await state();assert.deepEqual(test.transactionAfterProcedure,{transactions:1,state:1});
  test.afterProcedure=await roomState(pool,room);assert.ok(test.afterProcedure.rooms[0].TenPhong.endsWith(' caller marker'));
  if(mode==='committable_failure') assert.deepEqual(test.afterProcedure.shows,initial.shows,'Savepoint must roll back only procedure writes.');
  else if(kind==='Create') assert.equal(test.afterProcedure.shows.length,1);
  else if(kind==='Update') assert.equal(test.afterProcedure.shows[0].ThoiGianBatDau.getTime(),start.getTime()+360*60000);
  else assert.equal(test.afterProcedure.shows[0].TrangThai,'Đã hủy');
  await pool.request().batch("IF @@TRANCOUNT>0 ROLLBACK;EXEC sys.sp_set_session_context @key=N'R12_FaultRoom',@value=NULL;");
  test.final=await roomState(pool,room);assert.deepEqual(test.final,initial);test.finalTransaction=await state();assert.deepEqual(test.finalTransaction,{transactions:0,state:0});test.status='PASS';
  await cleanupRoom(pool,room);
 }
 for(const role of ['manager','admin']) {
  const room=await fixture(pool,actor.cinema);rooms.push(room);await call(actor,'manager','Create',room,null,start,end);
  const initial=await roomState(pool,room),test={role,kind:'Create',mode:'doomed_overlap',initial};evidence.cases.push(test);
  await pool.request().input('Room',sql.Int,room).batch("SET XACT_ABORT OFF;BEGIN TRANSACTION;UPDATE dbo.PHONGCHIEU SET TenPhong=TenPhong+N' caller marker' WHERE PhongID=@Room;");
  try {await call(actor,role,'Create',room,null,start,end);assert.fail('Overlap must fail.');}
  catch(error) {test.procedureResult={status:'ERROR',number:error.number,message:error.message,precedingErrors:(error.precedingErrors??[]).map(err=>({number:err.number,message:err.message}))};assert.ok([error.number,...(error.precedingErrors??[]).map(err=>err.number)].includes(50001));}
  test.finalTransaction=await state();assert.deepEqual(test.finalTransaction,{transactions:0,state:0});test.final=await roomState(pool,room);assert.deepEqual(test.final,initial);test.status='PASS';await cleanupRoom(pool,room);
 }
 await restoreDependencies();
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.fixtureCleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {
 await pool.request().batch("IF @@TRANCOUNT>0 ROLLBACK;EXEC sys.sp_set_session_context @key=N'R12_FaultRoom',@value=NULL;");
 await restoreDependencies();
 for(const room of rooms) await cleanupRoom(pool,room);
 evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'nested-tests.json'),evidence);await pool.close();
}
console.log(`PASS nested transactions/savepoints: ${evidence.cases.length} cases; caller-owned success/committable errors preserved; doomed errors roll back safely.`);

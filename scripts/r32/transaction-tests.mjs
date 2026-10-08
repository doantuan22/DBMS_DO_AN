// Disposable caller/savepoint evidence, with exact module restoration.
import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,connect,snapshot,summarize,batches,root,read,write,evidenceRoot,normalizeModule } from './common.mjs';
import { createFixture,cleanupFixture,state,updateShow,updateSeat,cleanSession } from './fixtures.mjs';
disposable();const pool=await connect(),e={database,startedAt:new Date().toISOString(),status:'RUNNING',cases:[]};let f;const originals=[];
const session=async()=>(await pool.request().batch('DECLARE @T INT=@@TRANCOUNT,@X INT=XACT_STATE();SELECT @T trancount,@X xactState;')).recordset[0];
async function caller(){await pool.request().batch(`SET XACT_ABORT OFF;BEGIN TRANSACTION;UPDATE dbo.SANPHAM SET Gia=20000 WHERE SanPhamID=${f.product};`);}
const alter=definition=>definition.replace(/\bCREATE(?:\s+OR\s+ALTER)?\s+PROCEDURE/i,'CREATE OR ALTER PROCEDURE');
async function restore(){for(const x of originals)await pool.request().batch(alter(x.definition));}
try{
 const before=await snapshot(pool);f=await createFixture(pool);const initial=await state(pool,f);
 for(const role of ['manager','admin']){
  await caller();await updateSeat(pool,f,role,initial.seats[0],{LoaiGhe:'Thường',TrangThai:'Bảo trì'});assert.deepEqual(await session(),{trancount:1,xactState:1});const inside=await state(pool,f);assert.equal(inside.product[0].Gia,20000);assert.equal(inside.seats[0].LoaiGhe,'Thường');await pool.request().batch('ROLLBACK;');assert.deepEqual(await state(pool,f),initial);e.cases.push({name:'seat-caller-success-'+role,inside,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'});
 }
 for(const name of ['sp_Manager_Seat_Update','usp_Admin_Seat_Update'])originals.push(before.metadata.objects.find(r=>r.name===name));
 for(const x of originals){assert.ok(x.definition.includes('IF @OwnTran=1 COMMIT TRANSACTION;'));await pool.request().batch(alter(x.definition).replace('IF @OwnTran=1 COMMIT TRANSACTION;',`IF @GheID=${f.seats[0]} BEGIN SET XACT_ABORT OFF;EXEC dbo.R32_IntentionallyMissingDependency;END;\nIF @OwnTran=1 COMMIT TRANSACTION;`));}
 try{for(const role of ['manager','admin']){await caller();await assert.rejects(updateSeat(pool,f,role,initial.seats[0],{LoaiGhe:'Thường',TrangThai:'Hỏng'}),r=>r.number===2812);const held=await session();assert.deepEqual(held,{trancount:1,xactState:1});const inside=await state(pool,f);assert.deepEqual(inside.seats,initial.seats);assert.equal(inside.product[0].Gia,20000);await pool.request().batch('ROLLBACK;');assert.deepEqual(await state(pool,f),initial);e.cases.push({name:'seat-savepoint-committable-after-write-'+role,sqlError:2812,caller:held,inside,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'});}}
 finally{await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await restore();}
 await pool.request().batch(`EXEC sys.sp_set_session_context @key=N'R32_Show',@value=${f.show};EXEC sys.sp_set_session_context @key=N'R32_Seat',@value=${f.seats[0]};`);await batches(pool,read(path.join(root,'database/11_tests/history/update_rollback.sql')));
 try{for(const role of ['manager','admin'])for(const kind of ['show','seat']){await caller();await assert.rejects(kind==='show'?updateShow(pool,f,role,initial.show[0],{GiaVeCoBan:90000}):updateSeat(pool,f,role,initial.seats[0],{LoaiGhe:'Thường',TrangThai:'Hỏng'}),r=>r.number===(kind==='show'?51032:51033));assert.deepEqual(await state(pool,f),initial);e.cases.push({name:'doomed-caller-after-write-'+role+'-'+kind,sqlError:kind==='show'?51032:51033,initial,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'});}}
 finally{await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R32_ShowFailure;DROP TRIGGER IF EXISTS dbo.R32_SeatFailure;');}
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool),canonical=m=>({...m,objects:m.objects.map(r=>originals.some(x=>x.name===r.name)?{...r,definition:normalizeModule(r.definition)}:r)});assert.deepEqual(after.data,before.data);assert.deepEqual(canonical(after.metadata),canonical(before.metadata));e.before=summarize(before);e.after=summarize(after);e.definitionNormalization='Only CREATE/ALTER spelling on the two restored seat modules; repository SQL-token normalizer; all other metadata exact.';e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R32_ShowFailure;DROP TRIGGER IF EXISTS dbo.R32_SeatFailure;');await restore();if(f)await cleanupFixture(pool,f);e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'transaction-tests.json'),e);await pool.close();}
console.log(`PASS ${e.cases.length} caller cases: seat success/savepoints,committable post-write errors,and doomed failures for four writers;full cleanup/exact definitions restored.`);

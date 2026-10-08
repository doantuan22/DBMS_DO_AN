import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,connect,snapshot,summarize,read,write,root,evidenceRoot,sql } from './common.mjs';
import { createFixture,cleanupFixture,state,list,set,setRequest,deleteActor,assertPersisted,cleanSession } from './fixtures.mjs';
disposable();const pool=await connect(),e={database,startedAt:new Date().toISOString(),status:'RUNNING',positive:[],negative:[]};let f;
try {
 const before=await snapshot(pool);f=await createFixture(pool);const initial=await state(pool,f);
 const positives=[['replace-three-with-two',list(f)],['same-list',list(f)],['role-change',list(f,[3,4],'changed')],['role-150',list(f,[3],'x'.repeat(149))],['nullable-role',[{DienVienID:f.actors[3],VaiDien:null}]],['omitted-role',[{DienVienID:f.actors[3]}]],['empty-role',[{DienVienID:f.actors[3],VaiDien:''}]],['clear-empty',[]],['restore-list',list(f)]];
 for(const [name,input] of positives){const start=await state(pool,f),result=await set(pool,f,input);const final=await assertPersisted(pool,f,input,initial);assert.equal(result.recordset.length,input.length);assert.ok(result.recordset.every(r=>Object.keys(r).join(',')==='PhimID,DienVienID,HoTen,VaiDien'));e.positive.push({name,input,initial:start,response:result.recordset,final,session:await cleanSession(pool),status:'PASS'});}
 const id=f.actors[3],good=list(f),stable=await state(pool,f);
 const negatives=[
 ['one-missing',JSON.stringify([...good,{DienVienID:2147483647,VaiDien:'bad'}]),50100],['all-missing','[{"DienVienID":2147483647},{"DienVienID":2147483646}]',50100],
 ['duplicate',JSON.stringify([good[0],{...good[0],VaiDien:'different'}]),50103],['movie-missing',JSON.stringify(good),50102,2147483647],
 ['malformed','[{',50103],['object-root',JSON.stringify(good[0]),50103],['json-null','null',50103],['sql-null',null,50103],['blank','',50103],['scalar-root','1',50103],
 ['scalar-item','[1]',50103],['null-item','[null]',50103],['array-item','[[]]',50103],['missing-id','[{"VaiDien":"bad"}]',50103],['null-id','[{"DienVienID":null}]',50103],
 ['string-id',JSON.stringify([{DienVienID:String(id)}]),50103],['bool-id','[{"DienVienID":true}]',50103],['decimal-id','[{"DienVienID":1.5}]',50103],['overflow-id','[{"DienVienID":2147483648}]',50103],['zero-id','[{"DienVienID":0}]',50103],['negative-id','[{"DienVienID":-1}]',50103],
 ['role-number',JSON.stringify([{DienVienID:id,VaiDien:1}]),50103],['role-object',JSON.stringify([{DienVienID:id,VaiDien:{}}]),50103],['role-array',JSON.stringify([{DienVienID:id,VaiDien:[]}]),50103],
 ['role-151',JSON.stringify([{DienVienID:id,VaiDien:'x'.repeat(151)}]),50103],['role-trailing-overflow',JSON.stringify([{DienVienID:id,VaiDien:'x'+' '.repeat(150)}]),50103],
 ['duplicate-id-key',`[{"DienVienID":${id},"DienVienID":${id}}]`,50103],['duplicate-role-key',`[{"DienVienID":${id},"VaiDien":"a","VaiDien":"b"}]`,50103],
 ['non-admin',JSON.stringify(good),50301,f.movie,f.customer],['inactive-identity',JSON.stringify(good),50300,f.movie,2147483647]
 ];
 for(const [name,json,number,movie=f.movie,admin=f.admin] of negatives){const pre=await snapshot(pool);await assert.rejects(setRequest(pool,f,json,movie,admin).execute('dbo.sp_Admin_MovieActor_Set'),r=>r.number===number);const final=await state(pool,f);assert.deepEqual(final,stable,name);assert.deepEqual((await snapshot(pool)).data,pre.data,name);e.negative.push({name,input:json,number,initial:stable,final,session:await cleanSession(pool),status:'PASS'});}
 // SQL invocation without the mandatory JSON parameter must never imply [].
 await assert.rejects(pool.request().input('ActorID',sql.Int,f.admin).input('PhimID',sql.Int,f.movie).execute('dbo.sp_Admin_MovieActor_Set'),r=>r.number===201);assert.deepEqual(await state(pool,f),stable);e.omittedParameter={number:201,final:stable,session:await cleanSession(pool),status:'PASS'};
 await pool.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');await set(pool,f,[]);let session=(await pool.request().query('SELECT @@TRANCOUNT trancount,XACT_STATE() xactState')).recordset[0];assert.deepEqual(session,{trancount:1,xactState:1});await pool.request().batch('ROLLBACK;');assert.deepEqual(await state(pool,f),stable);e.outerSuccess={session,rollbackRestored:'PASS',status:'PASS'};
 await pool.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');await assert.rejects(set(pool,f,[{DienVienID:2147483647}]),r=>r.number===50100);assert.deepEqual(await state(pool,f),stable);e.outerDoomedFailure={session:await cleanSession(pool),callerTransaction:'XACT_ABORT doomed caller is fully rolled back, matching accepted convention',status:'PASS'};
 // Whitespace prefix is valid JSON; Unicode and trailing spaces stay exact.
 const spaced=[{DienVienID:id,VaiDien:'Vai chính 😀  '}];await setRequest(pool,f,'\t\r\n '+JSON.stringify(spaced)).execute('dbo.sp_Admin_MovieActor_Set');await assertPersisted(pool,f,spaced,initial);e.unicodeWhitespace={input:spaced,final:await state(pool,f),status:'PASS'};await set(pool,f,good);
 await set(pool,f,initial.cast.filter(r=>r.PhimID===f.movie).map(({DienVienID,VaiDien})=>({DienVienID,VaiDien})));const old=await state(pool,f);
 await pool.request().query(`EXEC sys.sp_set_session_context @key=N'R31_Target',@value=${f.movie};EXEC sys.sp_set_session_context @key=N'R31_Old1',@value=${f.actors[0]};EXEC sys.sp_set_session_context @key=N'R31_Old2',@value=${f.actors[1]};EXEC sys.sp_set_session_context @key=N'R31_Old3',@value=${f.actors[2]};`);
 await pool.request().batch(read(path.join(root,'database/11_tests/admin/movie_actor_atomicity.sql')));
 try{await assert.rejects(set(pool,f,good),r=>r.number===51031);}finally{await pool.request().batch('DROP TRIGGER IF EXISTS dbo.R31_InjectFailure;');}
 const observed=(await pool.request().query("SELECT CONVERT(INT,SESSION_CONTEXT(N'R31_OldRemaining')) oldRemaining,CONVERT(INT,SESSION_CONTEXT(N'R31_NewInserted')) newInserted")).recordset[0];assert.deepEqual(observed,{oldRemaining:0,newInserted:2});assert.deepEqual(await state(pool,f),old);
 e.rollbackInjection={initial:old,observed,final:await state(pool,f),session:await cleanSession(pool),status:'PASS'};
 // An unhandled trigger RAISERROR also aborts the write/caller on this SQL Server.
 // The failed exploratory trials preserve the disproved recoverable assumption.
 await pool.request().batch(read(path.join(root,'database/11_tests/admin/movie_actor_atomicity.sql')).replace("THROW 51031, 'Disposable failure after old cast DELETE and new cast INSERT.', 1;", "RAISERROR('Disposable trigger replacement failure.', 16, 1); RETURN;"));
 await pool.request().batch(`SET XACT_ABORT OFF;BEGIN TRANSACTION;UPDATE dbo.DIENVIEN SET HoTen=N'caller change' WHERE DienVienID=${f.actors[6]};`);
 try{await assert.rejects(set(pool,f,good),r=>r.number===50000);session=await cleanSession(pool);assert.deepEqual(await state(pool,f),old);e.outerTriggerFailure={number:50000,session,callerAndCastRolledBack:true,status:'PASS'};}finally{await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R31_InjectFailure;');}
 assert.deepEqual(await state(pool,f),old);
 await assert.rejects(deleteActor(pool,f,f.actors[0]),r=>r.number===50101);await assert.rejects(deleteActor(pool,f,2147483647),r=>r.number===50100);await deleteActor(pool,f,f.actors[6]);assert.equal((await state(pool,f)).actors.length,6);e.actorDelete={referenced:50101,missing:50100,unusedDeleted:f.actors[6],session:await cleanSession(pool),status:'PASS'};
 await cleanupFixture(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={number:error.number,message:error.message};throw error;}
finally{await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;DROP TRIGGER IF EXISTS dbo.R31_InjectFailure;');if(f)await cleanupFixture(pool,f);e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'sql-tests.json'),e);await pool.close();}
console.log(`PASS ${e.positive.length} committed positives,${e.negative.length} negatives,omitted/outer/Unicode cases,write failure rollback and Actor Delete;data/schema restored.`);

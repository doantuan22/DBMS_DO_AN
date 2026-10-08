import assert from 'node:assert/strict';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { sql,disposable,database,connect,snapshot,summarize,write,evidenceRoot } from '../../../scripts/r31/common.mjs';
import { createFixture,cleanupFixture,state,list,set,cast,deleteActor,cleanSession } from '../../../scripts/r31/fixtures.mjs';
disposable();const a=await connect(),b=await connect(),observer=await connect(),fixtures=[];
const e={database,startedAt:new Date().toISOString(),status:'RUNNING',replacements:[],actorDelete:[],movieDelete:[]};
const outcome=promise=>promise.then(r=>({success:true,rows:r.recordset}),r=>({success:false,error:{number:r.number,message:r.message}}));
async function blocked(waiter,blocker){
 const end=Date.now()+10000;while(Date.now()<end){
  const row=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query('SELECT session_id,blocking_session_id,wait_type,wait_resource,status FROM sys.dm_exec_requests WHERE session_id=@Waiter AND blocking_session_id=@Blocker')).recordset[0];
  if(row){assert.match(row.wait_type,/^LCK_M_/);const locks=(await observer.request().input('Waiter',sql.Int,waiter).input('Blocker',sql.Int,blocker).query(`SELECT l.request_session_id,l.resource_type,l.request_mode,l.request_status,OBJECT_NAME(p.object_id) objectName,i.name indexName,l.resource_description FROM sys.dm_tran_locks l LEFT JOIN sys.partitions p ON p.hobt_id=l.resource_associated_entity_id LEFT JOIN sys.indexes i ON i.object_id=p.object_id AND i.index_id=p.index_id WHERE l.request_session_id IN(@Waiter,@Blocker) AND p.object_id IN(OBJECT_ID('dbo.PHIM'),OBJECT_ID('dbo.DIENVIEN'),OBJECT_ID('dbo.PHIM_DIENVIEN'));`)).recordset;assert.ok(locks.length);return{at:new Date().toISOString(),...row,locks};}await delay(25);
 }throw Error(`Missing real blocking ${waiter}->${blocker}`);
}
async function fixture(){const f=await createFixture(observer);fixtures.push(f);return f;}
const movieDelete=(pool,f)=>pool.request().input('ActorID',sql.Int,f.admin).input('PhimID',sql.Int,f.movie).execute('dbo.sp_Admin_Movie_Delete');
try{
 const before=await snapshot(observer),sa=await cleanSession(a),sb=await cleanSession(b);assert.notEqual(sa.spid,sb.spid);const spids={a:sa.spid,b:sb.spid};
 for(const [name,ids,secondIds,finish] of [['A-then-B',[3,4],[5,6],'COMMIT'],['B-then-A',[5,6],[3,4],'COMMIT'],['first-rollback',[3,4],[5,6],'ROLLBACK'],['clear-then-replace',[],[5,6],'COMMIT']]){
  const f=await fixture(),initial=await state(observer,f),firstInput=list(f,ids),secondInput=list(f,secondIds),row={name,spids,initial,firstInput,secondInput,timeline:[]};
  await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');row.first=await outcome(set(a,f,firstInput));assert.equal(row.first.success,true);assert.deepEqual(row.first.rows.map(({PhimID,DienVienID,VaiDien})=>({PhimID,DienVienID,VaiDien})),cast(f,firstInput));row.timeline.push({at:new Date().toISOString(),event:'first writer complete;caller transaction open'});
  const pending=outcome(set(b,f,secondInput));row.blocking=await blocked(sb.spid,sa.spid);assert.deepEqual(await state(observer,f),initial);row.insideFirst=await state(a,f);assert.deepEqual(row.insideFirst.cast.filter(r=>r.PhimID===f.movie),cast(f,firstInput));
  await a.request().batch(finish+';');row.timeline.push({at:new Date().toISOString(),event:finish});row.second=await pending;assert.equal(row.second.success,true);assert.deepEqual(row.second.rows.map(({PhimID,DienVienID,VaiDien})=>({PhimID,DienVienID,VaiDien})),cast(f,secondInput));row.final=await state(observer,f);assert.deepEqual(row.final.cast.filter(r=>r.PhimID===f.movie),cast(f,secondInput));
  assert.deepEqual(row.final.cast.filter(r=>r.PhimID===f.other),initial.cast.filter(r=>r.PhimID===f.other));for(const k of ['movies','actors','genres'])assert.deepEqual(row.final[k],initial[k]);row.sessions={a:await cleanSession(a),b:await cleanSession(b)};row.status='PASS';e.replacements.push(row);await cleanupFixture(observer,f);
 }
 for(const first of ['replacement','delete'])for(const finish of ['COMMIT','ROLLBACK']){
  const f=await fixture(),id=f.actors[5],input=list(f,[5,6]),initial=await state(observer,f),row={name:`${first}-first/${finish}`,spids,actorId:id,input,initial};
  await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');row.first=await outcome(first==='replacement'?set(a,f,input):deleteActor(a,f,id));assert.equal(row.first.success,true);
  const pending=outcome(first==='replacement'?deleteActor(b,f,id):set(b,f,input));row.blocking=await blocked(sb.spid,sa.spid);assert.deepEqual(await state(observer,f),initial);
  await a.request().batch(finish+';');row.second=await pending;row.final=await state(observer,f);
  if(finish==='COMMIT'){assert.equal(row.second.success,false);assert.equal(row.second.error.number,first==='replacement'?50101:50100);assert.deepEqual(row.final.cast.filter(r=>r.PhimID===f.movie),first==='replacement'?cast(f,input):initial.cast.filter(r=>r.PhimID===f.movie));}
  else {assert.equal(row.second.success,true);assert.deepEqual(row.final.cast.filter(r=>r.PhimID===f.movie),first==='replacement'?initial.cast.filter(r=>r.PhimID===f.movie):cast(f,input));}
  const actorDeleted=(first==='delete'&&finish==='COMMIT')||(first==='replacement'&&finish==='ROLLBACK');assert.deepEqual(row.final.actors,initial.actors.filter(r=>!actorDeleted||r.DienVienID!==id));for(const k of ['movies','genres'])assert.deepEqual(row.final[k],initial[k]);assert.deepEqual(row.final.cast.filter(r=>r.PhimID===f.other),initial.cast.filter(r=>r.PhimID===f.other));row.sessions={a:await cleanSession(a),b:await cleanSession(b)};row.status='PASS';e.actorDelete.push(row);await cleanupFixture(observer,f);
 }
 for(const first of ['replacement','delete']){
  const f=await fixture(),input=list(f),initial=await state(observer,f),row={name:`${first}-first`,spids,initial,input};await a.request().batch('SET XACT_ABORT OFF;BEGIN TRANSACTION;');row.first=await outcome(first==='replacement'?set(a,f,input):movieDelete(a,f));assert.equal(row.first.success,true);
  const pending=outcome(first==='replacement'?movieDelete(b,f):set(b,f,input));row.blocking=await blocked(sb.spid,sa.spid);await a.request().batch('COMMIT;');row.second=await pending;if(first==='replacement')assert.equal(row.second.success,true);else{assert.equal(row.second.success,false);assert.equal(row.second.error.number,50102);}
  row.final=await state(observer,f);assert.deepEqual(row.final.cast,initial.cast.filter(r=>r.PhimID===f.other));assert.deepEqual(row.final.movies,initial.movies.filter(r=>r.PhimID===f.other));assert.deepEqual(row.final.actors,initial.actors);row.sessions={a:await cleanSession(a),b:await cleanSession(b)};row.status='PASS';e.movieDelete.push(row);await cleanupFixture(observer,f);
 }
 const after=await snapshot(observer);assert.deepEqual(summarize(after),summarize(before));e.before=summarize(before);e.after=summarize(after);e.cleanup='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={number:error.number,message:error.message};throw error;}
finally{await a.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');await b.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');for(const f of fixtures.reverse())await cleanupFixture(observer,f);e.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'movie-actor-concurrency.json'),e);await a.close();await b.close();await observer.close();}
console.log(`PASS real two-session races: ${e.replacements.length} replacements,${e.actorDelete.length} Actor Delete,${e.movieDelete.length} Movie Delete;DMV blocking,exact final cast,no drift/leak.`);

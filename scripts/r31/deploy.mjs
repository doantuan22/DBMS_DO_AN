// Existing-module deployment with SQL-owned atomic DDL and verified development backup.
import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,database,connect,batches,snapshot,summarize,dbRoot,read,write,normalizeModule,evidenceRoot } from './common.mjs';
import { expandSql } from '../db/lib.mjs';
assert.match(database??'',/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/);
const main=database==='CinemaBookingDB',allowed=['sp_Admin_MovieActor_Set','sp_Admin_Actor_Delete'];
if(main) {
 const target=JSON.parse(read(path.join(evidenceRoot,'checks.json'))).database;
 assert.match(target,/^CinemaBookingDB_R0_[A-Za-z0-9_]+$/);
 for(const file of ['sql-tests','api-tests','movie-actor-concurrency','r22-regression','r21-regression','r1-regression','checks']) {
  const result=JSON.parse(read(path.join(evidenceRoot,file+'.json')));assert.equal(result.status,'PASS',file);assert.equal(result.database,target,file);
 }
 assert.equal(JSON.parse(read(path.join(evidenceRoot,'main-test-isolation.json'))).status,'PASS');
 assert.equal(JSON.parse(read(path.join(evidenceRoot,'browser.json'))).status,'PASS');
}
if(!process.argv.includes('--apply')) throw new Error('Explicit --apply is required for module deployment.');
const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
async function parity(objects) {
 const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json'))),drift=[];
 for(const [name,file] of Object.entries(manifest.modules)) {
  const source=read(path.join(dbRoot,file)),start=/CREATE\s+OR\s+ALTER\s+(?:FUNCTION|PROCEDURE|VIEW|TRIGGER)/i.exec(source)?.index;
  const actual=objects.find(row=>row.name===name);
  if(!actual||normalizeModule(actual.definition)!==normalizeModule(source.slice(start).replace(/\s+GO\s*$/i,'').replaceAll('CinemaBookingDB',database))) drift.push(name);
 }
 assert.deepEqual(drift,[]);return{modules:Object.keys(manifest.modules).length,drift,status:'PASS'};
}
try {
 if(main) {
  const directory=(await pool.request().query("SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) directory")).recordset[0].directory;assert.ok(directory);
  const location=directory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R31_${Date.now()}.bak`;
  await pool.request().input('BackupPath',sql.NVarChar(4000),location).query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM;RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
  evidence.backup={copyOnly:true,checksum:true,restoreVerifyOnly:'PASS',location};
 }
 await pool.request().batch('SET XACT_ABORT ON;BEGIN TRANSACTION;');
 try {
  const before=await snapshot(pool,true);assert.equal(before.data.length,27);assert.equal(before.metadata.environment[0].databaseName,database);
  if(main)assert.deepEqual(summarize(before),JSON.parse(read(path.join(evidenceRoot,'main-test-isolation.json'))).after);
  await batches(pool,expandSql('13_migrations/r31_movie_actor_atomicity.sql').replaceAll('CinemaBookingDB',database));
  const after=await snapshot(pool);assert.equal(after.metadata.environment[0].databaseName,database);assert.deepEqual(after.data,before.data);
  for(const key of Object.keys(before.metadata).filter(key=>!['objects','dependencies'].includes(key))) assert.deepEqual(after.metadata[key],before.metadata[key],key);
  assert.deepEqual(after.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})),before.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})));
  const changed=after.metadata.objects.filter(row=>row.definition!==before.metadata.objects.find(old=>old.name===row.name&&old.type===row.type)?.definition).map(row=>row.name);
  assert.ok(changed.every(name=>allowed.includes(name)));
  const protectedObjects=before.metadata.objects.filter(row=>!allowed.includes(row.name));
  for(const object of protectedObjects) assert.deepEqual(after.metadata.objects.find(row=>row.name===object.name&&row.type===object.type),object,object.name);
  evidence.before=summarize(before);evidence.after=summarize(after);evidence.changedModules=changed;evidence.sourceParity=await parity(after.metadata.objects);
  evidence.r1AndOtherModulesPreserved='PASS';await pool.request().batch('COMMIT TRANSACTION;');evidence.transaction='COMMIT';evidence.preservation='PASS';
 } catch(error) {await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');evidence.transaction='ROLLBACK';throw error;}
 const final=await snapshot(pool);assert.deepEqual(final.data,evidence.after.data);evidence.postCommitData='PASS';
 assert.equal(final.metadata.environment[0].is_read_committed_snapshot_on,true);assert.ok(final.metadata.foreignKeys.every(row=>!row.is_disabled&&!row.is_not_trusted));
 assert.ok(final.metadata.checks.every(row=>!row.is_disabled&&!row.is_not_trusted));evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,main?'main-migration.json':'migration-replay.json'),evidence);await pool.close();}
console.log(`PASS ${database}: ${evidence.changedModules.length} module definitions changed; all27 tables/data/schema/grants/signatures/R1 preserved.`);

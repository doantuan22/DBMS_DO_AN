// Existing-module migration only. SQL Server owns all transactions.
import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,database,connect,batches,snapshot,summarize,dbRoot,read,write,normalizeModule,evidenceRoot } from './common.mjs';
import { expandSql } from '../db/lib.mjs';
assert.match(database??'',/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/);
const main=database==='CinemaBookingDB',allowed=['sp_Showtime_ValidateTimes','sp_Showtime_CancelCascade','sp_Manager_Showtime_Create','sp_Manager_Showtime_Update','usp_Admin_Showtime_Create','usp_Admin_Showtime_Update'];
if(main) {
 for(const file of ['sql-tests','nested-tests','api-tests','concurrency','room-delete-regression','checks']) assert.equal(JSON.parse(read(path.join(evidenceRoot,file+'.json'))).status,'PASS',file);
 const races=JSON.parse(read(path.join(evidenceRoot,'concurrency.json')));assert.ok(races.stressRaces>=100);assert.equal(races.finalCommittedOverlapCount,0);
}
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
  const location=directory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R12_${Date.now()}.bak`;
  await pool.request().input('BackupPath',sql.NVarChar(4000),location).query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM;RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
  evidence.backup={copyOnly:true,checksum:true,restoreVerifyOnly:'PASS',location};
 }
 await pool.request().batch('SET XACT_ABORT ON;BEGIN TRANSACTION;');
 try {
  const before=await snapshot(pool,true);assert.equal(before.data.length,27);
  await batches(pool,expandSql('13_migrations/r12_showtime_overlap_safety.sql'));
  const after=await snapshot(pool);assert.deepEqual(after.data,before.data);
  for(const key of Object.keys(before.metadata).filter(key=>!['objects','dependencies','parameters'].includes(key))) assert.deepEqual(after.metadata[key],before.metadata[key],key);
  assert.deepEqual(after.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})),before.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})));
  const unrelated=row=>row.objectName!=='sp_Showtime_ValidateTimes';assert.deepEqual(after.metadata.parameters.filter(unrelated),before.metadata.parameters.filter(unrelated));
  const oldHelper=before.metadata.parameters.filter(row=>!unrelated(row)),newHelper=after.metadata.parameters.filter(row=>!unrelated(row));
  assert.deepEqual(newHelper.filter(row=>row.parameter_id<=3),oldHelper.filter(row=>row.parameter_id<=3));
  assert.deepEqual(newHelper,JSON.parse(read(path.join(dbRoot,'baseline-manifest.json'))).expected.parameters.filter(row=>!unrelated(row)));
  const changed=after.metadata.objects.filter(row=>row.definition!==before.metadata.objects.find(old=>old.name===row.name&&old.type===row.type)?.definition).map(row=>row.name);
  assert.ok(changed.every(name=>allowed.includes(name)));
  for(const name of ['sp_Manager_Room_Delete','usp_Admin_Room_Delete','TRG_SuatChieu_KiemTraTrungLich','sp_ThemSuatChieu']) assert.equal(after.metadata.objects.find(row=>row.name===name).definition,before.metadata.objects.find(row=>row.name===name).definition,name+' must stay unchanged');
  evidence.before=summarize(before);evidence.after=summarize(after);evidence.changedModules=changed;evidence.optionalHelperParameters=newHelper;evidence.sourceParity=await parity(after.metadata.objects);
  await pool.request().batch('COMMIT TRANSACTION;');evidence.transaction='COMMIT';evidence.preservation='PASS';
 } catch(error) {await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');evidence.transaction='ROLLBACK';throw error;}
 const final=await snapshot(pool);assert.deepEqual(final.data,evidence.after.data);evidence.postCommitData='PASS';
 assert.equal(final.metadata.environment[0].is_read_committed_snapshot_on,true);assert.ok(final.metadata.foreignKeys.every(row=>!row.is_disabled&&!row.is_not_trusted));
 assert.ok(final.metadata.checks.every(row=>!row.is_disabled&&!row.is_not_trusted));evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,main?'main-migration.json':'migration-replay.json'),evidence);await pool.close();}
console.log(`PASS ${database}: ${evidence.changedModules.length} existing modules changed; all27 tables/data/schema/grants/R1.1 preserved.`);

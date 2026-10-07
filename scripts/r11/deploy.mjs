// Offline ALTER-only migration. All coordination transactions are SQL Server batches.
import assert from 'node:assert/strict';
import path from 'node:path';
import { database, connect, batches, snapshot, summarize, dbRoot, read, write, normalizeModule, evidenceRoot } from './common.mjs';
import { expandSql } from '../db/lib.mjs';
assert.match(database??'',/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/);
const main=database==='CinemaBookingDB';
if(main) for(const file of ['sql-tests.json','api-tests.json','concurrency.json','checks.json']) assert.equal(JSON.parse(read(path.join(evidenceRoot,file))).status,'PASS',file+' must pass first');
const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
async function parity() {
  const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
  const objects=(await snapshot(pool)).metadata.objects;
  const drift=[];
  for(const [name,file] of Object.entries(manifest.modules)) {
    const source=read(path.join(dbRoot,file)),start=/CREATE\s+OR\s+ALTER\s+(?:FUNCTION|PROCEDURE|VIEW|TRIGGER)/i.exec(source)?.index;
    const actual=objects.find(row=>row.name===name);
    if(!actual||normalizeModule(actual.definition)!==normalizeModule(source.slice(start).replace(/\s+GO\s*$/i,'').replaceAll('CinemaBookingDB',database))) drift.push(name);
  }
  assert.deepEqual(drift,[]);return {modules:Object.keys(manifest.modules).length,drift,status:'PASS'};
}
try {
  if(main) {
    const directory=(await pool.request().query("SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) directory")).recordset[0].directory;
    assert.ok(directory);
    const location=directory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R11_${Date.now()}.bak`;
    await pool.request().input('BackupPath', (await import('../../backend/node_modules/mssql/index.js')).default.NVarChar(4000),location)
      .query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
    evidence.backup={copyOnly:true,checksum:true,restoreVerifyOnly:'PASS',location};
  }
  await pool.request().batch('SET XACT_ABORT ON; BEGIN TRANSACTION;');
  try {
    const before=await snapshot(pool,true);assert.equal(before.data.length,27);
    await batches(pool,expandSql('13_migrations/r11_room_delete_atomicity.sql'));
    const after=await snapshot(pool);
    assert.deepEqual(after.data,before.data);
    for(const key of Object.keys(before.metadata).filter(key=>!['objects','dependencies'].includes(key))) assert.deepEqual(after.metadata[key],before.metadata[key],key);
    assert.deepEqual(after.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})),before.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})));
    const changed=after.metadata.objects.filter(row=>row.definition!==before.metadata.objects.find(old=>old.name===row.name&&old.type===row.type)?.definition).map(row=>row.name);
    assert.ok(changed.every(name=>['sp_Manager_Room_Delete','usp_Admin_Room_Delete'].includes(name)));
    evidence.before=summarize(before);evidence.after=summarize(after);evidence.changedModules=changed;evidence.sourceParity=await parity();
    await pool.request().batch('COMMIT TRANSACTION;');
    evidence.transaction='COMMIT';evidence.preservation='PASS';
  } catch(error) { await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;');evidence.transaction='ROLLBACK';throw error; }
  evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,main?'main-migration.json':'migration-replay.json'),evidence);await pool.close();}
console.log(`PASS ${database}: module-only migration, data/schema/grants preserved; changed=${evidence.changedModules.join(',')||'none (replay)'}.`);

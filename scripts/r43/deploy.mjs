import assert from 'node:assert/strict';
import path from 'node:path';
import { sql,database,connect,snapshot,summarize,batches,root,read,write,evidenceRoot,normalizeModule } from './common.mjs';
assert.match(database??'',/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/);
assert.ok(process.argv.includes('--apply'),'Explicit --apply is required.');
const main=database==='CinemaBookingDB';
if(main) for(const file of ['sql-tests','api-tests','checks','main-test-isolation']) assert.equal(JSON.parse(read(path.join(evidenceRoot,file+'.json'))).status,'PASS',file);
const pool=await connect(),e={database,at:new Date().toISOString(),status:'RUNNING'};
try{
 if(main){
  const directory=(await pool.request().query("SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) directory")).recordset[0].directory;
  assert.ok(directory);const file=directory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R43_${Date.now()}.bak`;
  await pool.request().input('BackupPath',sql.NVarChar(4000),file).query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM;RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
  e.backup={file,copyOnly:true,checksum:true,verifyOnly:'PASS'};
 }
 await pool.request().batch('SET XACT_ABORT ON;BEGIN TRANSACTION;');
 try{
  const before=await snapshot(pool,true);
  await batches(pool,read(path.join(root,'database/08_procedures/admin/usp_Admin_Pricing_Update.sql')));
  const after=await snapshot(pool);
  assert.equal(after.data.length,27);assert.deepEqual(after.data,before.data);
  for(const key of Object.keys(before.metadata).filter(k=>!['objects','dependencies','parameters'].includes(k)))assert.deepEqual(after.metadata[key],before.metadata[key],key);
  assert.deepEqual(after.metadata.parameters.filter(row=>row.objectName!=='usp_Admin_Pricing_Update'),before.metadata.parameters.filter(row=>row.objectName!=='usp_Admin_Pricing_Update'));
  e.parameters=after.metadata.parameters.filter(row=>row.objectName==='usp_Admin_Pricing_Update');
  assert.equal(e.parameters.length,10);
  const changed=after.metadata.objects.filter(row=>row.definition!==before.metadata.objects.find(old=>old.name===row.name&&old.type===row.type)?.definition).map(row=>row.name);
  assert.ok(changed.every(name=>name==='usp_Admin_Pricing_Update'));
  assert.deepEqual(after.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})),before.metadata.objects.map(({schemaName,name,type})=>({schemaName,name,type})));
  for(const object of before.metadata.objects.filter(o=>o.name!=='usp_Admin_Pricing_Update'))assert.deepEqual(after.metadata.objects.find(o=>o.name===object.name&&o.type===object.type),object);
  const source=read(path.join(root,'database/08_procedures/admin/usp_Admin_Pricing_Update.sql'));
  assert.equal(normalizeModule(after.metadata.objects.find(o=>o.name==='usp_Admin_Pricing_Update').definition),normalizeModule(source.slice(source.indexOf('CREATE OR ALTER')).replace(/\s+GO\s*$/i,'')));
  e.before=summarize(before);e.after=summarize(after);e.changedModules=changed;e.otherModulesPreserved=before.metadata.objects.filter(o=>o.definition&&o.name!=='usp_Admin_Pricing_Update').length;e.sourceParity='PASS';
  await pool.request().batch('COMMIT TRANSACTION;');e.transaction='COMMIT';
 }catch(error){await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');throw error;}
 assert.deepEqual((await snapshot(pool)).data,e.after.data);e.postCommitData='PASS';e.status='PASS';
}catch(error){e.status='FAIL';e.error={message:error.message,number:error.number};throw error;}
finally{e.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,main?'main-deployment.json':'test-deployment.json'),e);await pool.close();}
console.log(`PASS ${database}: ${e.changedModules.length} pricing module changed;27 tables/data/schema and ${e.otherModulesPreserved} other modules preserved.`);

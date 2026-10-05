// Backup/read-only main checks, real restore clone, and source-only clean build.
import { assert,fs,path,root,dbRoot,out,fixtures,restoreName,fixture,connect,ask,mainSnapshot,inventory,expectedInventory,load,save,read,write,run,sql } from './common.mjs';
import { credentials, expandSql } from '../db/lib.mjs';
import { batches } from '../r2fix/migration-lib.mjs';
import { verify } from '../db/verify.mjs';
const main=await connect('CinemaBookingDB'),master=await connect('master');
try{
 const before=load('main-before.json').snapshot;assert.deepEqual(await mainSnapshot(main),before);
 const location=(await ask(master,"SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS backupDirectory,CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultDataPath')) AS dataDirectory,CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultLogPath')) AS logDirectory")).recordset[0];
 const backupPath=location.backupDirectory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_R8_${Date.now()}.bak`;
 await main.request().input('Backup',sql.NVarChar(4000),backupPath).query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@Backup WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@Backup WITH CHECKSUM;');
 write(path.join(dbRoot,'_audit/R8-recovery-location.local.json'),{database:'CinemaBookingDB',path:backupPath,copyOnly:true,checksum:true,restoreVerified:true,at:new Date().toISOString()});
 save('backup-verify.json',{status:'PASS',database:'CinemaBookingDB',copyOnly:true,checksum:true,restoreVerifyOnly:'PASS',localRecoveryFile:'database/_audit/R8-recovery-location.local.json',at:new Date().toISOString()});
 fixture(restoreName);assert.ok(!(await ask(master,`SELECT name FROM sys.databases WHERE name=N'${restoreName}'`)).recordset.length,'Restore target already exists; no overwrite.');
 const files=(await master.request().input('Backup',sql.NVarChar(4000),backupPath).query('RESTORE FILELISTONLY FROM DISK=@Backup')).recordset;
 const restore=master.request().input('Backup',sql.NVarChar(4000),backupPath);
 const moves=files.map((file,index)=>{assert.ok(['D','L'].includes(file.Type));const directory=file.Type==='L'?location.logDirectory:location.dataDirectory;const filePath=directory.replace(/[\\/]?$/,'\\')+`${restoreName}_${index}.${file.Type==='L'?'ldf':'mdf'}`;restore.input('File'+index,sql.NVarChar(4000),filePath);return `MOVE N'${file.LogicalName.replaceAll("'","''")}' TO @File${index}`;});
 await restore.query(`RESTORE DATABASE [${restoreName}] FROM DISK=@Backup WITH ${moves.join(',')},RECOVERY,CHECKSUM;`);
 const clone=await connect(restoreName);
 try{
  const snapshot=await mainSnapshot(clone);assert.deepEqual(snapshot,before);assert.deepEqual(await inventory(clone),expectedInventory);
  await batches(clone,expandSql('12_verify/verify_database.sql').replaceAll('USE CinemaBookingDB;',`USE [${restoreName}];`));
  await ask(clone,`DBCC CHECKDB ([${restoreName}]) WITH NO_INFOMSGS,ALL_ERRORMSGS;`);
  const previous=path.join(dbRoot,'_audit',`verify-${restoreName}.json`);verify(restoreName);save('restore-parity.json',read(previous));
  run('restore-http-smoke',['scripts/db/backend-smoke.mjs',`--database=${restoreName}`,'--allow-no-future-shows']);save('restore-smoke.json',read(path.join(dbRoot,'_audit',`backend-smoke-${restoreName}.json`)));
  assert.deepEqual(await mainSnapshot(clone),before);
  save('restore-test.json',{status:'PASS',database:restoreName,realRestore:true,inventory:expectedInventory,dataHashesEqual:true,moduleHashesEqual:true,grantsEqual:true,checkDB:'PASS',backendSmoke:'PASS',snapshot});
 }finally{await clone.close();}
 assert.deepEqual(await mainSnapshot(main),before);
 console.log('PASS COPY_ONLY backup/checksum, VERIFYONLY and real restore with exact data/modules/grants and HTTP smoke.');
}finally{await main.close();await master.close();}
const scratch=path.resolve(root,'.r8-clean-source');assert.ok(scratch.startsWith(path.resolve(root)+path.sep));assert.ok(!fs.existsSync(scratch),'Clean-source scratch exists; refusing overwrite.');
fs.mkdirSync(path.join(scratch,'backend'),{recursive:true});
try{
 fs.cpSync(dbRoot,path.join(scratch,'database'),{recursive:true,filter:file=>!['_audit','_legacy_snapshot'].includes(path.basename(file))});
 fs.cpSync(path.join(root,'scripts/db'),path.join(scratch,'scripts/db'),{recursive:true});fs.cpSync(path.join(root,'shared'),path.join(scratch,'shared'),{recursive:true});
 fs.copyFileSync(path.join(root,'package.json'),path.join(scratch,'package.json'));fs.copyFileSync(path.join(root,'backend/.env.example'),path.join(scratch,'backend/.env.example'));
 run('clean-build',['scripts/db/run.mjs','build',`--database=${fixtures[2]}`],{cwd:scratch,env:credentials()});
 const built=await connect(fixtures[2]);try{assert.deepEqual(await inventory(built),expectedInventory);await ask(built,`DBCC CHECKDB ([${fixtures[2]}]) WITH NO_INFOMSGS,ALL_ERRORMSGS;`);save('clean-build.json',{status:'PASS',database:fixtures[2],sourceOnly:true,environmentFileCopied:false,oldAuditOrBackupCopied:false,inventory:expectedInventory,checkDB:'PASS'});}finally{await built.close();}
 console.log('PASS clean build from source-only checkout without .env/node_modules/backups/audit.');
}finally{assert.equal(scratch,path.resolve(root,'.r8-clean-source'));fs.rmSync(scratch,{recursive:true,force:true});}

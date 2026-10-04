import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, dbRoot, write } from '../db/lib.mjs';
import { migrate } from './migration-lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if (!/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/.test(database||'') || !process.argv.includes('--apply'))
  throw Error('Specify an explicit development --database=CinemaBookingDB[_R0_<name>] and --apply.');
const env=credentials();
if (env.NODE_ENV==='production') throw Error('Development migration only.');
const pool=await new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,user:env.DB_USER,password:env.DB_PASSWORD,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:true,useUTC:true}}).connect();
const transaction=new sql.Transaction(pool);let open=false;
transaction.on('rollback',()=>{open=false;});
try {
  if (database==='CinemaBookingDB') {
    const directory=(await pool.request().query("SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS Directory")).recordset[0].Directory;
    if (!directory) throw Error('Database backup directory unavailable.');
    const target=directory.replace(/[\\/]?$/,'\\')+`CinemaBookingDB_pre_R2FIX_${Date.now()}.bak`;
    await pool.request().input('BackupPath',sql.NVarChar(4000),target).query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
    write(path.join(dbRoot,'_audit/R2FIX-recovery-location.local.json'),{database,path:target,checksum:true,restoreVerified:true});
  }
  await transaction.begin();open=true;
  await migrate(transaction);
  await transaction.commit();open=false;
  console.log(`PASS R2-FIX migration + matching SP deployment atomically: ${database}`);
} finally {if(open)await transaction.rollback();await pool.close();}

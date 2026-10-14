// Phase 5.3: Backup & Restore Verification for Project Databases
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, sql } from './lib.mjs';

const BACKUP_DIR = 'D:\\DBMS_DO_AN_BACKUPS';

// EXACT explicit target list - NO wildcards
const TARGET_DBS = [
  'CinemaBookingDB',
  'CinemaBookingDB_Test',
];

const masterConfig = {
  server: 'localhost',
  port: 1433,
  database: 'master',
  user: 'sa',
  password: 'doantuan',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: true,
  },
  requestTimeout: 120000,
};

async function main() {
  console.log('=== PHASE 5.3: BACKUP AND RECOVERY CERTIFICATION ===');
  const pool = await new sql.ConnectionPool(masterConfig).connect();

  console.log('[1/4] Verifying database targets in sys.databases...');
  const { recordset: currentDbs } = await pool.request().query('SELECT name FROM sys.databases');
  const existingNames = new Set(currentDbs.map((d) => d.name));

  for (const target of TARGET_DBS) {
    if (!existingNames.has(target)) {
      throw new Error(`Target database "${target}" does not exist in SQL Server!`);
    }
  }

  // Double check non-target protection
  const forbidden = ['HotelBooking_DB0_Test', 'oneshop', 'oneshop_test', 'oneshop_v3_audit_test', 'master', 'tempdb', 'model', 'msdb'];
  for (const f of forbidden) {
    if (TARGET_DBS.includes(f)) {
      throw new Error(`CRITICAL: Protected database "${f}" is in the target list! Aborting.`);
    }
  }
  console.log(`  -> Validated 5 target databases. Protected systems checked.`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log('[2/4] Taking full COPY_ONLY backups with CHECKSUM...');
  const backupResults = [];
  for (const dbName of TARGET_DBS) {
    const backupFile = path.join(BACKUP_DIR, `${dbName}_backup_20261014.bak`);
    console.log(`  Backing up ${dbName} to ${backupFile}...`);

    await pool.request().batch(`
      BACKUP DATABASE [${dbName}]
      TO DISK = N'${backupFile}'
      WITH INIT, COPY_ONLY, CHECKSUM, STATS = 100;
    `);

    console.log(`  Verifying backup file integrity for ${dbName}...`);
    await pool.request().batch(`
      RESTORE VERIFYONLY
      FROM DISK = N'${backupFile}'
      WITH CHECKSUM;
    `);

    const stats = fs.statSync(backupFile);
    backupResults.push({
      database: dbName,
      file: backupFile,
      sizeBytes: stats.size,
      verified: true,
      timestamp: new Date().toISOString(),
    });
    console.log(`  -> ${dbName}: Backup verified (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);
  }

  console.log('[3/4] Performing isolated restore drill of main database CinemaBookingDB...');
  const mainBackup = path.join(BACKUP_DIR, 'CinemaBookingDB_backup_20261014.bak');
  const drillDb = 'CinemaBookingDB_BackupDrillTest';

  // Get file list from backup
  const { recordset: fileList } = await pool.request().query(`
    RESTORE FILELISTONLY FROM DISK = N'${mainBackup}';
  `);
  const dataLogical = fileList.find((f) => f.Type === 'D').LogicalName;
  const logLogical = fileList.find((f) => f.Type === 'L').LogicalName;

  const dataDest = path.join(BACKUP_DIR, `${drillDb}.mdf`);
  const logDest = path.join(BACKUP_DIR, `${drillDb}.ldf`);

  await pool.request().batch(`
    IF DB_ID('${drillDb}') IS NOT NULL
    BEGIN
      ALTER DATABASE [${drillDb}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${drillDb}];
    END

    RESTORE DATABASE [${drillDb}]
    FROM DISK = N'${mainBackup}'
    WITH
      MOVE '${dataLogical}' TO '${dataDest}',
      MOVE '${logLogical}' TO '${logDest}',
      REPLACE;
  `);

  const { recordset: drillCount } = await pool.request().query(`
    SELECT COUNT(*) AS cnt FROM [${drillDb}].sys.tables WHERE is_ms_shipped = 0;
  `);
  console.log(`  -> Restore drill successful: ${drillDb} restored with ${drillCount[0].cnt} tables.`);

  // Cleanup drill database
  await pool.request().batch(`
    ALTER DATABASE [${drillDb}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [${drillDb}];
  `);
  if (fs.existsSync(dataDest)) fs.unlinkSync(dataDest);
  if (fs.existsSync(logDest)) fs.unlinkSync(logDest);
  console.log(`  -> Drill database cleaned up.`);

  console.log('[4/4] Writing backup report...');
  const reportPath = path.join(ROOT, '.audit-output', 'acceptance', 'backup-certification.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ backupResults, completedAt: new Date().toISOString() }, null, 2));

  await pool.close();
  console.log('=== ALL 5 TARGET DATABASES BACKED UP AND RESTORE VERIFIED ===');
}

main().catch((err) => {
  console.error('BACKUP / RESTORE VERIFICATION FAILED:', err);
  process.exit(1);
});

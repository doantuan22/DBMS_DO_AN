// Main database backup and optional, non-destructive restore drill.
// The script reads credentials from the ignored backend/.env and never prints them.
// It never drops or overwrites a database. A restore drill requires the exact
// temporary target CinemaBookingDB_Test to be absent and leaves it in place.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, sql } from './lib.mjs';

const MAIN_DB = 'CinemaBookingDB';
const TEST_DB = 'CinemaBookingDB_Test';
const BACKUP_DIR = path.join(ROOT, '.audit-output', 'database-backups');
const ENV_PATH = path.join(ROOT, 'backend', '.env');
const RESTORE_DRILL = process.argv.includes('--restore-drill');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');

const quoteSql = (value) => String(value).replaceAll("'", "''");

function loadMainConfig() {
  if (!fs.existsSync(ENV_PATH)) throw new Error('Missing backend/.env.');
  const env = dotenv.parse(fs.readFileSync(ENV_PATH));
  for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
    if (!env[key]) throw new Error(`backend/.env is missing ${key}.`);
  }
  if (env.DB_DATABASE !== MAIN_DB) {
    throw new Error(`Refusing backup: backend/.env must target ${MAIN_DB}.`);
  }
  return {
    server: env.DB_SERVER,
    port: Number(env.DB_PORT ?? 1433),
    database: 'master',
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    options: {
      encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
      trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
      useUTC: true,
    },
    requestTimeout: 120000,
  };
}

async function main() {
  const config = loadMainConfig();
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupFile = path.join(BACKUP_DIR, `${MAIN_DB}_pre_cleanup_${stamp}.bak`);
  const escapedBackupFile = quoteSql(backupFile);
  const pool = await new sql.ConnectionPool(config).connect();

  try {
    const { recordset } = await pool.request().query(`
      SELECT name, state_desc FROM sys.databases
      WHERE name IN (N'${MAIN_DB}', N'${TEST_DB}');
    `);
    const databases = new Map(recordset.map((row) => [row.name, row.state_desc]));
    if (databases.get(MAIN_DB) !== 'ONLINE') {
      throw new Error(`${MAIN_DB} is missing or not ONLINE.`);
    }
    if (RESTORE_DRILL && databases.has(TEST_DB)) {
      throw new Error(`Restore drill requires ${TEST_DB} to be absent; it will not overwrite or drop it.`);
    }

    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[1/2] Backing up ${MAIN_DB} with CHECKSUM...`);
    await pool.request().batch(`
      BACKUP DATABASE [${MAIN_DB}]
      TO DISK = N'${escapedBackupFile}'
      WITH COPY_ONLY, CHECKSUM, COMPRESSION, STATS = 10;
    `);

    console.log('[2/2] Verifying the backup with RESTORE VERIFYONLY...');
    await pool.request().batch(`
      RESTORE VERIFYONLY
      FROM DISK = N'${escapedBackupFile}'
      WITH CHECKSUM;
    `);
    console.log(`Backup verified: ${backupFile} (${fs.statSync(backupFile).size} bytes).`);

    if (!RESTORE_DRILL) {
      console.log('Restore drill not requested. No database was created or changed.');
      return;
    }

    const { recordset: files } = await pool.request().query(`
      RESTORE FILELISTONLY FROM DISK = N'${escapedBackupFile}';
    `);
    const dataFile = files.find((file) => file.Type === 'D');
    const logFile = files.find((file) => file.Type === 'L');
    if (!dataFile || !logFile) throw new Error('Backup file list does not contain one data and one log file.');

    const dataPath = path.join(BACKUP_DIR, `${TEST_DB}_${stamp}.mdf`);
    const logPath = path.join(BACKUP_DIR, `${TEST_DB}_${stamp}.ldf`);
    await pool.request().batch(`
      RESTORE DATABASE [${TEST_DB}]
      FROM DISK = N'${escapedBackupFile}'
      WITH
        MOVE N'${quoteSql(dataFile.LogicalName)}' TO N'${quoteSql(dataPath)}',
        MOVE N'${quoteSql(logFile.LogicalName)}' TO N'${quoteSql(logPath)}',
        RECOVERY, CHECKSUM;
    `);
    const { recordset: inventory } = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM [${TEST_DB}].sys.tables WHERE is_ms_shipped = 0) AS tables,
        (SELECT COUNT(*) FROM [${TEST_DB}].sys.procedures WHERE is_ms_shipped = 0) AS procedures,
        (SELECT COUNT(*) FROM [${TEST_DB}].sys.views WHERE is_ms_shipped = 0) AS views;
    `);
    console.log(`Restore drill passed in ${TEST_DB}: ${JSON.stringify(inventory[0])}.`);
    console.log(`${TEST_DB} was left in place; remove it only after explicit scope confirmation.`);
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(`Backup workflow failed: ${error.message}`);
  process.exitCode = 1;
});

// Create and verify a rollback backup before replacing only this run's synthetic seed rows.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAIN_DB = 'CinemaBookingDB';
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing backup: backend/.env must target exactly ${MAIN_DB}.`);
const targetDir = path.join(ROOT, '.audit-output', 'database-backups');
fs.mkdirSync(targetDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const backupPath = path.join(targetDir, `CinemaBookingDB_seed_before_utc_reseed_${stamp}.bak`);
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 120000,
}).connect();
try {
  const identity = (await pool.request().query('SELECT DB_NAME() AS db;')).recordset[0];
  if (identity.db !== MAIN_DB) throw new Error(`Connected to ${identity.db}; expected ${MAIN_DB}.`);
  await pool.request().input('backupPath', sql.NVarChar(4000), backupPath).query(`
    BACKUP DATABASE [CinemaBookingDB] TO DISK=@backupPath
    WITH COPY_ONLY, INIT, CHECKSUM, COMPRESSION;
    RESTORE VERIFYONLY FROM DISK=@backupPath WITH CHECKSUM;
  `);
  const stat = fs.statSync(backupPath);
  if (!stat.isFile() || stat.size < 1024) throw new Error('Backup file is missing or unexpectedly small.');
  const result = { database: MAIN_DB, backupPath: path.relative(ROOT, backupPath), bytes: stat.size, restoreVerifyOnly: 'PASS', createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(ROOT, '.audit-output', 'seed-pre-reseed-backup.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
} finally { await pool.close(); }

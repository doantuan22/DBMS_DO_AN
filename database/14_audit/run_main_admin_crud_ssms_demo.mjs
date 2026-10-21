// Execute the SSMS-ready Admin CRUD demo as a single, guard-checked connection.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target Main.');
const priorConcurrency = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'main-concurrency-drill.json'), 'utf8'));
const backupPath = path.join(ROOT, priorConcurrency.backup.path);
if (!fs.existsSync(backupPath)) throw new Error(`Verified pre-test backup missing: ${backupPath}`);
const source = fs.readFileSync(path.join(ROOT, 'database', '14_audit', 'main_admin_crud_success_demo.sql'), 'utf8');
const batches = source.split(/^\s*GO\s*$/gim).map(s => s.trim()).filter(Boolean);
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 180000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const evidence = { startedUtc: new Date().toISOString(), target: null, backup: path.relative(ROOT, backupPath), batches: batches.length, rows: [], verdict: 'BLOCKED' };
try {
  evidence.target = (await pool.request().query(`SELECT @@SERVERNAME serverName, DB_NAME() databaseName, CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (evidence.target.serverName !== 'DoanTuanIT' || evidence.target.databaseName !== 'CinemaBookingDB' || evidence.target.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(evidence.target)}`);
  await pool.request().query(`RESTORE VERIFYONLY FROM DISK=N'${backupPath.replaceAll("'", "''")}' WITH CHECKSUM;`);
  evidence.backupVerifyOnly = 'PASS';
  for (const batch of batches) {
    const result = await pool.request().batch(batch);
    for (const row of (result.recordsets ?? []).flat()) {
      if (row && row.ObjectName && row.Verdict) evidence.rows.push(row);
    }
  }
  const failed = evidence.rows.filter(r => r.Verdict !== 'PASS');
  if (evidence.rows.length !== 16 || failed.length) throw new Error(`Expected 16 PASS rows; got ${evidence.rows.length}; failed=${JSON.stringify(failed)}`);
  evidence.verdict = 'PASS';
} catch (e) {
  evidence.error = { message: e.message, number: e.number, state: e.state, class: e.class };
  evidence.verdict = 'FAIL';
  throw e;
} finally {
  evidence.finishedUtc = new Date().toISOString();
  fs.mkdirSync(path.join(ROOT, '.audit-output'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, '.audit-output', 'main-admin-crud-ssms-demo.json'), JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify(evidence, null, 2));
}

// Parse-only checks for the manual two-session SSMS scripts; no test DML runs.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(root, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: configured database is not Main.');
const files = [
  'main_schedule_concurrency_session_a_hold.sql',
  'main_schedule_concurrency_session_a_commit.sql',
  'main_schedule_concurrency_session_b.sql',
  'main_schedule_concurrency_monitor.sql',
  'main_schedule_concurrency_cleanup.sql',
];
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  pool: { max: 1, min: 1, idleTimeoutMillis: 30000 }, requestTimeout: 120000,
}).connect();
const evidence = { startedUtc: new Date().toISOString(), target: null, executedStatements: false, scripts: [], verdict: 'FAIL' };
try {
  const target = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (target.serverName !== 'DoanTuanIT' || target.databaseName !== 'CinemaBookingDB' || target.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(target)}`);
  evidence.target = target;
  await pool.request().query('SET PARSEONLY ON;');
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, 'database', '14_audit', file), 'utf8');
    const batches = source.split(/^\s*GO\s*$/gim).map(x => x.trim()).filter(Boolean);
    for (const batch of batches) await pool.request().query(batch);
    evidence.scripts.push({ file, batches: batches.length, verdict: 'PASS' });
  }
  evidence.verdict = 'PASS';
} catch (error) {
  evidence.error = error.message;
  evidence.sqlErrorNumber = error.number ?? error.originalError?.info?.number ?? null;
} finally {
  evidence.finishedUtc = new Date().toISOString();
  const out = path.join(root, '.audit-output', 'main-schedule-ssms-demo-parse-only.json');
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify({ ...evidence, evidence: path.relative(root, out) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}

// SQLCMD compiles each SSMS concurrency script with NOEXEC ON. This validates
// the SQL Server parser/binder without executing fixture DML or opening txns.
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
const evidence = { startedUtc: new Date().toISOString(), configuredTarget: 'DoanTuanIT / CinemaBookingDB', executedDml: false, validator: 'mssql request batch with SET NOEXEC ON', scripts: [], verdict: 'FAIL' };
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  pool: { max: 1, min: 1, idleTimeoutMillis: 30000 }, requestTimeout: 120000,
}).connect();
try {
  const target = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (target.serverName !== 'DoanTuanIT' || target.databaseName !== 'CinemaBookingDB' || target.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(target)}`);
  evidence.target = target;
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, 'database', '14_audit', file), 'utf8');
    const body = source.replace(/^\s*GO\s*$/gim, '');
    await pool.request().batch(`SET NOEXEC ON;\n${body}`);
    evidence.scripts.push({ file, compileOnly: true, executedDml: false, verdict: 'PASS' });
  }
  evidence.verdict = 'PASS';
} catch (error) {
  evidence.error = error.message;
  evidence.sqlErrorNumber = error.number ?? error.originalError?.info?.number ?? null;
} finally {
  evidence.finishedUtc = new Date().toISOString();
  const out = path.join(root, '.audit-output', 'main-schedule-ssms-demo-noexec-mssql.json');
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2));
  await pool.close();
  console.log(JSON.stringify({ ...evidence, evidence: path.relative(root, out) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}

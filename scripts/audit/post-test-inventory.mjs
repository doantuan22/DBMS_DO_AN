// Read-only inventory of the exact isolated Test database after audit:all.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEST_DB = 'CinemaBookingDB_Test';
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env.test')));
if (env.DB_DATABASE !== TEST_DB || String(env.DB_USER).toLowerCase() === 'sa') {
  throw new Error('Refusing inventory: .env.test must target exact CinemaBookingDB_Test with a non-sa login.');
}
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: TEST_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
}).connect();
try {
  const identity = (await pool.request().query('SELECT DB_NAME() AS db, SUSER_SNAME() AS login;')).recordset[0];
  if (identity.db !== TEST_DB || identity.login !== env.DB_USER) throw new Error('Connected identity does not match the exact Test target.');
  const inventory = (await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0) AS triggers,
      (SELECT COUNT(*) FROM sys.foreign_keys) AS foreign_keys,
      (SELECT COUNT(*) FROM sys.check_constraints) AS checks,
      (SELECT COUNT(*) FROM sys.database_role_members drm JOIN sys.database_principals r ON r.principal_id=drm.role_principal_id JOIN sys.database_principals u ON u.principal_id=drm.member_principal_id WHERE r.name=N'db_owner' AND u.name=N'CinemaTestUser') AS test_owner_membership;
  `)).recordset[0];
  const tables = (await pool.request().query(`
    SELECT s.name AS schema_name, t.name AS table_name, SUM(p.rows) AS row_count
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name;
  `)).recordset.map((row) => ({ ...row, row_count: Number(row.row_count) }));
  const summary = {
    database: identity.db,
    login: identity.login,
    online: true,
    schemaInventory: inventory,
    totalTableRows: tables.reduce((sum, row) => sum + row.row_count, 0),
    tables,
    action: 'Retained after isolated verification; final drop is pending separate explicit approval.',
  };
  fs.mkdirSync(path.join(ROOT, '.audit-output'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, '.audit-output', 'test-db-post-tests.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(summary, null, 2));
} finally { await pool.close(); }

// Re-map the pre-existing dedicated test login after the approved Main-backup restore.
// This script is pinned to CinemaBookingDB_Test and never edits Main or server logins.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEST_DB = 'CinemaBookingDB_Test';
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const mainEnv = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
const testEnv = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env.test')));
if (testEnv.DB_DATABASE !== TEST_DB || testEnv.DB_USER !== 'CinemaTestUser') {
  throw new Error('Refusing access repair: .env.test must target CinemaBookingDB_Test with the existing CinemaTestUser login.');
}
if (mainEnv.DB_DATABASE !== 'CinemaBookingDB' || String(mainEnv.DB_USER).toLowerCase() !== 'sa') {
  throw new Error('Refusing access repair: expected current privileged connection in backend/.env, but target remains pinned to Test.');
}
const pool = await new sql.ConnectionPool({
  server: mainEnv.DB_SERVER, port: Number(mainEnv.DB_PORT ?? 1433), database: TEST_DB,
  user: mainEnv.DB_USER, password: mainEnv.DB_PASSWORD,
  options: { encrypt: String(mainEnv.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(mainEnv.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 30000,
}).connect();
try {
  const identity = await pool.request().query('SELECT DB_NAME() AS db;');
  if (identity.recordset[0].db !== TEST_DB) throw new Error('Connected database is not exact CinemaBookingDB_Test.');
  const login = await pool.request().query(`SELECT name,is_disabled FROM sys.sql_logins WHERE name='CinemaTestUser';`);
  if (login.recordset.length !== 1 || login.recordset[0].is_disabled) throw new Error('The existing SQL Server login is absent or disabled.');
  await pool.request().query(`
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;
    IF DB_NAME() <> N'CinemaBookingDB_Test' THROW 50910, N'Wrong database; access repair aborted.', 1;
    IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name=N'CinemaTestUser')
      CREATE USER [CinemaTestUser] FOR LOGIN [CinemaTestUser];
    IF NOT EXISTS (
      SELECT 1 FROM sys.database_role_members drm
      JOIN sys.database_principals r ON r.principal_id=drm.role_principal_id AND r.name=N'db_owner'
      JOIN sys.database_principals u ON u.principal_id=drm.member_principal_id AND u.name=N'CinemaTestUser'
    ) ALTER ROLE [db_owner] ADD MEMBER [CinemaTestUser];
    COMMIT TRANSACTION;
  `);
  const verify = await pool.request().query(`
    SELECT DB_NAME() AS db, dp.name AS user_name,
      IS_ROLEMEMBER(N'db_owner', N'CinemaTestUser') AS is_test_db_owner
    FROM sys.database_principals dp WHERE dp.name=N'CinemaTestUser';
  `);
  const row = verify.recordset[0];
  if (row.db !== TEST_DB || row.user_name !== 'CinemaTestUser' || row.is_test_db_owner !== 1) {
    throw new Error('Test-only user mapping verification failed.');
  }
  console.log('Restored CinemaTestUser mapping in CinemaBookingDB_Test only; db_owner membership verified.');
} finally { await pool.close(); }

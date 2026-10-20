// Drops only the explicitly approved existing temporary database so the restore drill can use
// the exact target name. Requires backend/.env.test to name CinemaBookingDB_Test.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from './lib.mjs';

const MAIN_DB = 'CinemaBookingDB';
const TEST_DB = 'CinemaBookingDB_Test';
const envFile = path.join(ROOT, 'backend', '.env.test');
if (!fs.existsSync(envFile)) throw new Error('Missing backend/.env.test');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(envFile));
for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
  if (!env[key]) throw new Error(`backend/.env.test is missing ${key}.`);
}
if (env.DB_DATABASE !== TEST_DB) throw new Error(`Refusing: .env.test must target ${TEST_DB}.`);
if (String(env.DB_USER).toLowerCase() === 'sa') throw new Error('Refusing to use the sa login.');

const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: 'master',
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 120000,
}).connect();

try {
  const { recordset } = await pool.request().query(`
    SELECT name, state_desc FROM sys.databases
    WHERE name IN (N'${MAIN_DB}', N'${TEST_DB}');
  `);
  const states = new Map(recordset.map(({ name, state_desc }) => [name, state_desc]));
  if (states.get(MAIN_DB) !== 'ONLINE' || states.get(TEST_DB) !== 'ONLINE') {
    throw new Error(`Refusing drop; expected both approved targets ONLINE. Found ${JSON.stringify(Object.fromEntries(states))}.`);
  }
  await pool.request().batch(`
    ALTER DATABASE [${TEST_DB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [${TEST_DB}];
  `);
  const remaining = await pool.request().query(`SELECT DB_ID(N'${TEST_DB}') AS test_db_id;`);
  if (remaining.recordset[0].test_db_id !== null) throw new Error(`${TEST_DB} still exists after DROP DATABASE.`);
  console.log(`Dropped only the approved ${TEST_DB}; ${MAIN_DB} remained ONLINE.`);
} finally {
  await pool.close();
}

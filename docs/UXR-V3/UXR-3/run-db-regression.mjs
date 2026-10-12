// Offline acceptance harness. Never imported by frontend/backend application code.
import fs from 'node:fs';
import path from 'node:path';
import { query, sqlcmd } from '../../../scripts/db/lib.mjs';
const database = 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2';
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const identity = query(`SELECT DB_NAME() AS DatabaseName, DB_ID() AS DatabaseID`, { database })[0];
if (identity?.DatabaseName !== database || !identity.DatabaseID || database === 'CinemaBookingDB') throw new Error('Isolated database identity verification failed');
fs.writeFileSync(path.join(directory, 'db-identity.json'), JSON.stringify({ ...identity, timestamp: new Date().toISOString(), writes: 'existing SP calls inside rollback only', schemaChanges: false, rbacChanges: false }, null, 2));
try {
  const output = sqlcmd(fs.readFileSync(path.join(directory, 'db-regression.sql'), 'utf8'), { database, file: true });
  fs.writeFileSync(path.join(directory, 'db-regression.log'), `${output}\nExit code: 0\n`);
  console.log(JSON.stringify({ database, exitCode: 0, evidence: 'db-regression.log' }));
} catch (error) {
  fs.writeFileSync(path.join(directory, 'db-regression.log'), `${error.message}\nExit code: 1\n`);
  console.log(JSON.stringify({ database, exitCode: 1, evidence: 'db-regression.log' }));
  process.exitCode = 1;
}

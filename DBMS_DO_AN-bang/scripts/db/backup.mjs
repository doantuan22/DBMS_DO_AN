import path from 'node:path';
import { sqlcmd, query, audit, write } from './lib.mjs';
// SQL Server's configured backup directory is used; baseline DDL contains no file paths.
const info = query(
  `SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) backupDirectory`,
  { database: 'master', integrated: true },
)[0];
if (!info.backupDirectory) throw new Error('SQL Server default backup directory unavailable.');
const target =
  info.backupDirectory.replace(/[\\/]?$/, '\\') + 'CinemaBookingDB_pre_R0_20261003.bak';
const quote = (s) => "N'" + s.replaceAll("'", "''") + "'";
sqlcmd(
  `BACKUP DATABASE [CinemaBookingDB] TO DISK=${quote(target)} WITH COPY_ONLY, CHECKSUM; RESTORE VERIFYONLY FROM DISK=${quote(target)} WITH CHECKSUM;`,
  { database: 'master', integrated: true },
);
write(path.join(audit, 'recovery-location.local.json'), {
  database: 'CinemaBookingDB',
  path: target,
  copyOnly: true,
  checksum: true,
  restoreVerifyOnly: 'PASS',
  at: new Date().toISOString(),
});
console.log(
  'COPY_ONLY backup + RESTORE VERIFYONLY: PASS (location in ignored recovery-location.local.json).',
);

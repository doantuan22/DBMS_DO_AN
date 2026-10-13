import path from 'node:path';
import assert from 'node:assert/strict';
import { dbRoot, audit, read, write, sqlcmd, expandSql } from './lib.mjs';
import { verify } from './verify.mjs';
const database = process.argv.find((a) => a.startsWith('--database='))?.slice(11);
if (!database || !/^CinemaBookingDB_R0_[A-Za-z0-9_]+$/.test(database))
  throw new Error('Negative verify requires an explicitly named disposable R0 database.');
const tests = [];
try {
  sqlcmd(read(path.join(dbRoot, '11_tests/schema/tamper_definition.sql')), {
    database,
    file: true,
  });
  try {
    verify(database);
    throw new Error('Definition drift was accepted.');
  } catch (error) {
    assert.match(error.message, /Definition drift: sp_Clock_GetNow/);
    tests.push({ name: 'Changed definition with identical object counts', status: 'PASS' });
  }
} finally {
  sqlcmd(read(path.join(dbRoot, '08_procedures/system/sp_Clock_GetNow.sql')), {
    database,
    file: true,
  });
}
try {
  sqlcmd(read(path.join(dbRoot, '11_tests/schema/tamper_trigger.sql')), { database, file: true });
  try {
    sqlcmd(expandSql('12_verify/verify_database.sql').replaceAll('CinemaBookingDB', database), {
      database,
      file: true,
    });
    throw new Error('Disabled trigger drift was accepted.');
  } catch (error) {
    assert.match(error.message, /Verify triggers failed/);
    tests.push({ name: 'Disabled trigger with identical object counts', status: 'PASS' });
  }
} finally {
  sqlcmd(read(path.join(dbRoot, '11_tests/schema/restore_trigger.sql')), { database, file: true });
}
verify(database);
write(path.join(audit, 'negative-verify-checks.json'), { database, status: 'PASS', tests });
console.log(
  'PASS negative verification: changed definition and disabled trigger rejected; baseline restored.',
);

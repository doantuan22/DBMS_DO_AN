// Rebuild a NEW disposable database from edited source, then regenerate structural expectations.
// Never adopts objects manually changed in the running application database.
import path from 'node:path';
import { dbRoot, read, write, sqlcmd, expandSql } from './lib.mjs';
import { inventory } from './inventory.mjs';
import { generateVerification } from './generate-verification.mjs';
const database = process.argv.find((a) => a.startsWith('--database='))?.slice(11);
if (!database || !/^CinemaBookingDB_R0_[A-Za-z0-9_]+$/.test(database))
  throw new Error('Specify a NEW --database=CinemaBookingDB_R0_<name> disposable target.');
const integrated = process.argv.includes('--integrated');
const steps = [...read(path.join(dbRoot, 'build-objects.sql')).matchAll(/^:r\s+\.\/(.+)$/gm)].map(
  (m) => m[1],
);
sqlcmd(expandSql('build-objects.sql').replaceAll('CinemaBookingDB', database), {
  database: 'master',
  integrated,
  file: true,
});
const expected = inventory(database, integrated);
const modules = {};
for (const file of steps) {
  const m = /CREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\s+(?:dbo\.)?\[?(\w+)/i.exec(
    read(path.join(dbRoot, file)),
  );
  if (m) modules[m[1]] = file;
}
write(path.join(dbRoot, 'baseline-manifest.json'), {
  format: 1,
  provenance: 'Rebuilt exclusively from source: ' + new Date().toISOString(),
  steps,
  modules,
  expected,
});
generateVerification(expected);
console.log(
  `Refreshed manifest/SQL verification from ${database}. Review Git diff and run a clean reset + tests. Disposable database left available for inspection.`,
);

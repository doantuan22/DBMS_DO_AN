import path from 'node:path';
import crypto from 'node:crypto';
import { dbRoot, audit, read, query, write } from './lib.mjs';
const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
const database =
  process.argv.find((a) => a.startsWith('--database='))?.slice(11) || 'CinemaBookingDB';
const prefix = process.argv.find((a) => a.startsWith('--prefix='))?.slice(9) || 'seed';
if (!/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/.test(database) || !/^[A-Za-z0-9_-]+$/.test(prefix))
  throw new Error('Invalid fingerprint target/prefix.');
const q = (s) => '[' + s.replaceAll(']', ']]') + ']';
const tables = [];
for (const table of manifest.expected.objects.filter((o) => o.type.trim() === 'U')) {
  const columns = manifest.expected.columns
    .filter((c) => c.tableName === table.name)
    .map((c) => q(c.name))
    .join(',');
  const keys = manifest.expected.indexes
    .filter((i) => i.tableName === table.name && i.is_primary_key && i.key_ordinal > 0)
    .sort((a, b) => a.key_ordinal - b.key_ordinal)
    .map((i) => q(i.columnName))
    .join(',');
  const rows = query(`SELECT ${columns} FROM dbo.${q(table.name)} ORDER BY ${keys}`, { database });
  tables.push({
    table: table.name,
    rows: rows.length,
    sha256: crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
  });
}
write(path.join(audit, `${prefix}-seed-fingerprint.json`), { database, tables });
console.log(`Fingerprint captured: ${tables.length} tables (hashes only, no row data exported).`);

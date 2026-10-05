import assert from 'node:assert/strict';
import path from 'node:path';
import { connect, ask, mainSnapshot, productionHashes, root, read, write } from '../r3a/common.mjs';
const pool = await connect('CinemaBookingDB');
try {
  const snapshot = await mainSnapshot(pool);
  assert.equal(snapshot.data.length, 27);
  const r6 = JSON.parse(read(path.join(root, 'audit/remediation/r6a/evidence/main-final.json')));
  assert.deepEqual(snapshot, r6.snapshot, 'Main changed since R6A; investigate before R7');
  const modules = (await ask(pool, 'SELECT o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY o.name')).recordset;
  write(path.join(root, 'audit/remediation/r7/evidence/main-before.json'), { status: 'PASS', database: 'CinemaBookingDB', snapshot, sourceHashes: productionHashes(), r6FingerprintMatches: true });
  write(path.join(root, 'audit/remediation/r7/evidence/baseline-modules.json'), { status: 'PASS', modules });
  write(path.join(root, 'audit/remediation/r7/evidence/baseline-manifest-before.json'), read(path.join(root, 'database/baseline-manifest.json')));
  console.log(`PASS R7 before: ${snapshot.data.length} tables, ${modules.length} modules; main unchanged from R6A`);
} finally { await pool.close(); }

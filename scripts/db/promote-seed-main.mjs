// Offline deployment of the canonical demo seed. Never imported by application runtime.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { root, dbRoot, read, write, query, sqlcmd, expandSql, credentials } from './lib.mjs';
import { preflight, hash, identifier } from './test-target.mjs';
import { snapshot, targets } from './seed-demo.mjs';
import { verify } from './verify.mjs';

const source = targets[0];
const destination = 'CinemaBookingDB';
const deployment = 'deployments/seed-v2-main/';
function substitute(sql, values) {
  return sql.replace(/\$\(([A-Za-z]+)\)/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error('Missing SQL placeholder: ' + key);
    return String(values[key]).replaceAll("'", "''");
  });
}
// Match the original seed audit's hashing algorithm without exporting user records.
function legacyFingerprint(database) {
  const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
  return manifest.expected.objects
    .filter((o) => o.type.trim() === 'U')
    .map((table) => {
      const columns = manifest.expected.columns
        .filter((c) => c.tableName === table.name)
        .map((c) => identifier(c.name))
        .join(',');
      const keys = manifest.expected.indexes
        .filter((i) => i.tableName === table.name && i.is_primary_key && i.key_ordinal > 0)
        .sort((a, b) => a.key_ordinal - b.key_ordinal)
        .map((i) => identifier(i.columnName))
        .join(',');
      const rows = query(`SELECT ${columns} FROM dbo.${identifier(table.name)} ORDER BY ${keys}`, {
        database,
      });
      return {
        table: table.name,
        rows: rows.length,
        sha256: crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
      };
    });
}
export async function main(args = process.argv.slice(2)) {
  const opt = (key) => args.find((a) => a.startsWith('--' + key + '='))?.slice(key.length + 3);
  const mode = args[0];
  if (!['preflight', 'apply'].includes(mode)) throw new Error('Use preflight or apply');
  if (opt('source') !== source || opt('database') !== destination)
    throw new Error('Exact reviewed DEMO source and CinemaBookingDB destination required');
  const env = credentials();
  if (env.NODE_ENV === 'production') throw new Error('Main demo promotion refuses production');
  const local = ['localhost', '127.0.0.1', process.env.COMPUTERNAME?.toLowerCase()];
  if (!local.includes((env.DB_SERVER || 'localhost').split('\\')[0].toLowerCase()))
    throw new Error('Local SQL Server only');
  const gate = preflight(source);
  assert.ok(gate.target && gate.main, 'Existing separate demo and Main required');
  assert.equal(gate.main.state_desc, 'ONLINE');
  assert.equal(gate.main.is_read_only, false);
  for (const db of [gate.main, gate.target]) {
    assert.equal(db.files.length, 2, 'Exactly one ROWS and one LOG file required');
    assert.equal(db.files.filter((f) => f.type_desc === 'ROWS').length, 1);
    assert.equal(db.files.filter((f) => f.type_desc === 'LOG').length, 1);
  }
  const before = snapshot(destination),
    demoBefore = snapshot(source);
  const dir = path.join(
    root,
    '.audit-output/seed-v2',
    new Date().toISOString().replaceAll(/[:.]/g, '-') + '-promote-main',
  );
  const receipt = JSON.parse(
    read(path.join(root, '.audit-output/seed-v2/provenance-' + source + '.json')),
  );
  assert.equal(receipt.server, gate.server.ServerName, 'Demo provenance server');
  assert.equal(receipt.guid, gate.target.database_guid, 'Demo provenance GUID');
  assert.deepEqual(demoBefore, receipt.snapshot, 'Demo has changes outside reviewed seed');
  const baseline = path.join(
    root,
    '.audit-output/database/real-media-main-after-seed-fingerprint.json',
  );
  assert.ok(
    fs.existsSync(baseline),
    'Original Main seed audit required; never classify arbitrary data',
  );
  assert.deepEqual(
    legacyFingerprint(destination),
    JSON.parse(read(baseline)).tables,
    'Main changed since old seed audit; refuse replacement',
  );
  verify(source);
  const identity = {
    server: gate.server.ServerName,
    source: gate.target,
    destination: gate.main,
    before,
    demoBefore,
  };
  const confirmation = hash(identity);
  const sessions = query(
    `SELECT session_id,program_name,host_name,status FROM sys.dm_exec_sessions WHERE is_user_process=1 AND database_id IN(DB_ID(N'CinemaBookingDB'),DB_ID(N'${source}'))`,
    { database: 'master' },
  );
  const run = (name, sql, database = 'master') => {
    const output = sqlcmd(sql, { database, file: true });
    write(path.join(dir, name + '.log'), output);
    return output;
  };
  write(path.join(dir, 'preflight.json'), {
    environment: 'local-development',
    ...identity,
    confirmation,
    sessions,
  });
  run('main-dry-run', expandSql('10_seed/verify/preflight.sql'), destination);
  run('demo-dry-run', expandSql('10_seed/verify/preflight.sql'), source);
  console.log(
    JSON.stringify({
      source,
      destination,
      server: identity.server,
      confirmation,
      sessions,
      evidence: dir,
    }),
  );
  if (mode === 'preflight' || args.includes('--dry-run')) {
    console.log('DRY RUN: no database writes');
    return;
  }
  if (!args.includes('--replace-main-demo-data') || opt('confirm-main') !== confirmation)
    throw new Error(
      'Review preflight and supply --replace-main-demo-data plus exact --confirm-main',
    );
  assert.equal(sessions.length, 0, 'Close all Main/demo app connections');
  const [backupDir] = query(
    `SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) BackupPath`,
    { database: 'master' },
  );
  assert.ok(backupDir.BackupPath, 'Verified SQL backup directory required');
  const prefix = backupDir.BackupPath.replace(/[\\/]?$/, '\\');
  const values = {
    ActualServer: identity.server,
    MainGuid: gate.main.database_guid,
    DemoGuid: gate.target.database_guid,
    MainDataPath: gate.main.files.find((f) => f.type_desc === 'ROWS').physical_name,
    MainLogPath: gate.main.files.find((f) => f.type_desc === 'LOG').physical_name,
    MainDataLogical: gate.main.files.find((f) => f.type_desc === 'ROWS').name,
    MainLogLogical: gate.main.files.find((f) => f.type_desc === 'LOG').name,
    DemoDataLogical: gate.target.files.find((f) => f.type_desc === 'ROWS').name,
    DemoLogLogical: gate.target.files.find((f) => f.type_desc === 'LOG').name,
    MainBackupPath: prefix + destination + '-' + path.basename(dir) + '-before.bak',
    DemoBackupPath: prefix + source + '-' + path.basename(dir) + '-source.bak',
    MainSnapshot: JSON.stringify(before),
    DemoSnapshot: JSON.stringify(demoBefore),
    SnapshotSQL: expandSql('10_seed/verify/snapshot.sql').replace(/^GO\s*$/gim, ''),
  };
  write(path.join(dir, 'recovery.json'), {
    ...values,
    SnapshotSQL: undefined,
    MainSnapshot: undefined,
    DemoSnapshot: undefined,
    recoveryTemplate: 'database/' + deployment + 'rollback.sql',
    note: 'Backups usable only after backup/VERIFYONLY completes in promotion.log',
  });
  try {
    run('promotion', substitute(expandSql(deployment + 'promote.sql'), values));
    const after = snapshot(destination);
    assert.deepEqual(after, demoBefore, 'All 27 Main data hashes must equal source');
    assert.deepEqual(snapshot(source), demoBefore, 'Source demo must remain unchanged');
    run('seed-integrity', expandSql('10_seed/verify/seed-v2.sql'), destination);
    run('schema-invariants', expandSql('12_verify/verify_database.sql'), destination);
    const actual = verify(destination);
    write(path.join(dir, 'metadata.json'), actual);
    write(path.join(dir, 'snapshot.json'), after);
    const [current] = query(
      `SELECT CONVERT(nvarchar(36),database_guid) MainGuid FROM sys.database_recovery_status WHERE database_id=DB_ID(N'CinemaBookingDB')`,
      { database: 'master' },
    );
    write(path.join(dir, 'recovery.json'), {
      ...values,
      SnapshotSQL: undefined,
      MainSnapshot: undefined,
      DemoSnapshot: undefined,
      CurrentMainGuid: current.MainGuid,
      backupVerifyOnly: 'PASS',
      recoveryTemplate: 'database/' + deployment + 'rollback.sql',
    });
    write(path.join(dir, 'result.json'), {
      status: 'PASS',
      source,
      destination,
      rows: after,
      dataHashesEqual: true,
      sourceUnchanged: true,
      backupVerifyOnly: 'PASS',
      schemaTables: actual.objects.filter((o) => o.type.trim() === 'U').length,
      modules: actual.objects.filter((o) => o.definition).length,
      authorization: 'Explicit user request to promote demo to Main',
      at: new Date().toISOString(),
    });
    console.log('PASS demo promoted to Main; verified 27 table hashes and canonical SQL modules');
  } catch (error) {
    write(path.join(dir, 'result.json'), {
      status: 'FAIL',
      error: error.message,
      source,
      destination,
      recovery: 'Inspect recovery.json and verified backups; no automatic reset/retry',
    });
    throw error;
  }
}
if (process.argv[1] === import.meta.filename)
  await main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

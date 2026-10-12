// Offline seed orchestrator; application runtime never imports this module.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root, read, write, sqlcmd, expandSql, credentials } from './lib.mjs';
import { preflight, literal } from './test-target.mjs';
import { verify } from './verify.mjs';
export const targets = [
  'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',
  'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012',
];
export function snapshot(database, integrated = false) {
  return JSON.parse(
    sqlcmd(expandSql('10_seed/verify/snapshot.sql'), {
      database,
      integrated,
      json: true,
      file: true,
    })
      .trim()
      .split(/\r?\n/)
      .join(''),
  );
}
export async function main(args = process.argv.slice(2)) {
  const mode = args[0] || 'preflight';
  const opt = (k) => args.find((a) => a.startsWith('--' + k + '='))?.slice(k.length + 3);
  const database = opt('database');
  if (!targets.includes(database))
    throw new Error('Exact --database from disposable allowlist required; Main is refused.');
  if (
    !['preflight', 'create', 'base', 'demo-dynamic', 'test-fixtures', 'verify', 'reset'].includes(
      mode,
    )
  )
    throw new Error('Invalid seed command');
  const env = credentials();
  if (env.NODE_ENV === 'production') throw new Error('Seed tooling refuses production environment');
  const localHosts = ['localhost', '127.0.0.1', process.env.COMPUTERNAME?.toLowerCase()];
  if (!localHosts.includes((env.DB_SERVER || 'localhost').split('\\')[0].toLowerCase()))
    throw new Error('This demo pipeline is restricted to the local SQL Server');
  if (opt('seed-date')) throw new Error('Seed date is derived only from SQL Server');
  const integrated = args.includes('--integrated'),
    gate = preflight(database, integrated);
  const dir = path.join(
    root,
    '.audit-output/seed-v2',
    new Date().toISOString().replaceAll(/[:.]/g, '-') + '-' + mode,
  );
  const state = path.join(root, '.audit-output/seed-v2/provenance-' + database + '.json');
  write(path.join(dir, 'preflight.json'), { ...gate, environment: 'local-disposable' });
  console.log(
    JSON.stringify({
      environment: 'local-disposable',
      database,
      server: gate.server.ServerName,
      existing: !!gate.target,
      confirmation: gate.confirmation,
      files: gate.target?.files || gate.expectedNewFiles,
      evidence: dir,
    }),
  );
  const prepare = (f) => expandSql(f).replaceAll('CinemaBookingDB', database);
  const execute = (name, source, connection = database) => {
    const output = sqlcmd(source, { database: connection, integrated, file: true });
    write(path.join(dir, name + '.log'), output);
    return output;
  };
  if (mode === 'preflight' || args.includes('--dry-run')) {
    if (gate.target) execute('dry-run', expandSql('10_seed/verify/preflight.sql'));
    console.log('DRY RUN: no database writes');
    return;
  }
  if (opt('confirm-target') !== gate.confirmation)
    throw new Error('Review preflight then pass exact --confirm-target token');
  let mainBefore;
  if (gate.main) mainBefore = snapshot('CinemaBookingDB', integrated);
  try {
    if (mode === 'create' || mode === 'reset') {
      if (mode === 'create' && gate.target)
        throw new Error('Create requires absent target; never resets existing data');
      if (mode === 'reset') {
        if (
          !gate.target ||
          !args.includes('--reset-demo-data') ||
          opt('confirm-reset') !== gate.confirmation
        )
          throw new Error(
            'Reset requires existing reviewed target, --reset-demo-data and separate --confirm-reset',
          );
        execute('dry-run', expandSql('10_seed/verify/preflight.sql'));
        if (!fs.existsSync(state))
          throw new Error('No external seed provenance receipt; cannot classify/delete rows');
        const receipt = JSON.parse(read(state));
        assert.equal(receipt.guid, gate.target.database_guid, 'Database GUID changed');
        if (receipt.server) assert.equal(receipt.server, gate.server.ServerName, 'Server changed');
        assert.deepEqual(
          snapshot(database, integrated),
          receipt.snapshot,
          'Rows changed since seed receipt; refuse deletion',
        );
        const context =
          gate.sqlGuard +
          `\nEXEC sys.sp_set_session_context @key=N'SeedV2Target',@value=${literal(database)};\n`;
        execute('reset-guard', context + expandSql('10_seed/verify/reset-guard.sql'));
        const [backupDir] = JSON.parse(
          sqlcmd(expandSql('10_seed/verify/backup-directory.sql'), {
            database,
            integrated,
            json: true,
            file: true,
          }).trim(),
        );
        if (!backupDir.BackupPath) throw new Error('Cannot verify SQL backup directory');
        const backupPath =
          backupDir.BackupPath.replace(/[\\/]?$/, '\\') +
          database +
          '-' +
          path.basename(dir) +
          '.bak';
        const backup = expandSql('10_seed/verify/backup.sql')
          .replaceAll('$(TargetDatabase)', database)
          .replaceAll('$(BackupPath)', backupPath.replaceAll("'", "''"));
        execute('backup', gate.sqlGuard + '\n' + backup);
        write(path.join(dir, 'backup.json'), {
          database,
          guid: gate.target.database_guid,
          backupPath,
          verifyOnly: 'PASS',
          restoreTemplate: 'database/10_seed/verify/restore.sql',
        });
        // SQL session rechecks reviewed identity after successful backup. Existing canonical drop script only.
        execute(
          'reset',
          context +
            expandSql('10_seed/verify/reset-guard.sql') +
            '\n' +
            prepare('00_database/001_drop_database.sql'),
        );
      }
      const empty = preflight(database, integrated);
      if (empty.target) throw new Error('Creation requires absent target');
      execute(
        'build',
        'USE master;\n' + empty.sqlGuard + '\n' + prepare('build-objects.sql'),
        'master',
      );
    }
    const current = preflight(database, integrated);
    if (!current.target) throw new Error('Target not built');
    const seededEmpty =
      ['base', 'demo-dynamic'].includes(mode) &&
      snapshot(database, integrated).every((t) => t.Rows === 0);
    const context =
      current.sqlGuard +
      `\nIF DB_NAME()<>${literal(database)} THROW 51100,'Selected database changed.',1;\nEXEC sys.sp_set_session_context @key=N'SeedV2Target',@value=${literal(database)};\n`;
    if (['create', 'reset', 'base', 'demo-dynamic'].includes(mode)) {
      const profile = mode === 'base' ? 'base' : 'demo-dynamic';
      execute(
        'seed',
        context + expandSql('10_seed/seed-all.sql').replaceAll('$(SeedProfile)', profile),
      );
    }
    if (mode === 'test-fixtures') {
      if (database !== targets[1])
        throw new Error('Negative/test fixtures require exact TEST target');
      execute(
        'negative-tests',
        context +
          `EXEC sys.sp_set_session_context @key=N'V2DisposableTarget',@value=${literal(database)};\n` +
          expandSql('10_seed/test_fixture/negative-v2.sql'),
      );
      execute('domain-tests', context + expandSql('10_seed/test_fixture/domain-v2.sql'));
      const regressionBefore = snapshot(database, integrated);
      execute('existing-regressions', context + prepare('11_tests/test-all.sql'));
      assert.deepEqual(
        snapshot(database, integrated),
        regressionBefore,
        'Existing regression suite changed persisted rows',
      );
    }
    execute('verification', context + expandSql('10_seed/verify/seed-v2.sql'));
    execute('schema-invariants', context + prepare('12_verify/verify_database.sql'));
    const actual = verify(database, integrated);
    write(path.join(dir, 'metadata.json'), actual);
    const after = snapshot(database, integrated);
    write(path.join(dir, 'snapshot.json'), after);
    // Existing receipts must never absorb user writes through a verify/no-op call.
    if (['create', 'reset'].includes(mode) || seededEmpty)
      write(state, {
        database,
        server: current.server.ServerName,
        guid: current.target.database_guid,
        snapshot: after,
        createdBy: 'seed-v2',
        at: new Date().toISOString(),
      });
    write(path.join(dir, 'result.json'), {
      status: 'PASS',
      mode,
      database,
      rows: after.map((t) => ({ table: t.TableName, rows: t.Rows })),
      schemaTables: actual.objects.filter((o) => o.type.trim() === 'U').length,
      modules: actual.objects.filter((o) => o.definition).length,
    });
    console.log('PASS ' + mode + ' ' + database);
  } catch (error) {
    write(path.join(dir, 'result.json'), { status: 'FAIL', mode, database, error: error.message });
    throw error;
  } finally {
    if (mainBefore) {
      const after = snapshot('CinemaBookingDB', integrated);
      assert.deepEqual(after, mainBefore, 'Main data changed during operation');
      write(path.join(dir, 'main-preservation.json'), {
        status: 'PASS',
        before: mainBefore,
        after,
      });
    }
  }
}
if (process.argv[1] === import.meta.filename)
  await main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });

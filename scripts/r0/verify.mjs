// Offline R0 deployment/test tooling. Never imported by backend/src.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { credentials, dbRoot, root, read, write, normalizeModule } from '../db/lib.mjs';
import { queries } from '../db/inventory.mjs';
import { batches } from '../r2fix/migration-lib.mjs';

const database = process.argv.find(arg => arg.startsWith('--database='))?.slice(11);
assert.match(database ?? '', /^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/);
const main = database === 'CinemaBookingDB';
const apply = process.argv.includes('--apply');
const exercise = process.argv.includes('--exercise-precondition');
assert.ok(!main || !exercise, 'Legacy fixture injection is forbidden on the application database.');
const env = credentials();
assert.notEqual(env.NODE_ENV, 'production', 'R0 is local/project tooling.');
const evidence = { database, startedAt: new Date().toISOString(), mode: exercise ? 'precondition-fixture' : apply ? 'apply' : 'inspect', status: 'RUNNING', checks: [] };
const file = path.join(root, `docs/r0-20261007/${exercise ? 'migration-precondition' : main ? 'main-migration' : 'database-contract'}.json`);
const save = () => write(file, evidence);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const quote = name => '[' + name.replaceAll(']', ']]') + ']';
const config = { server: env.DB_SERVER || 'localhost', port: Number(env.DB_PORT || 1433), database, user: env.DB_USER, password: env.DB_PASSWORD,
  connectionTimeout: 10000, requestTimeout: 180000, options: { encrypt: env.DB_ENCRYPT === 'true', trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false', useUTC: true } };
const pool = await new sql.ConnectionPool(config).connect();
const ask = async (provider, source) => (await new sql.Request(provider).query(source)).recordset;
const mark = (name, details = {}) => evidence.checks.push({ name, status: 'PASS', ...details });
async function snapshot(provider, lock = false) {
  const metadata = {};
  for (const [name, source] of Object.entries(queries)) metadata[name] = await ask(provider, source);
  const data = [];
  for (const { tableName } of metadata.rowcounts) {
    const rows = await ask(provider, `SELECT * FROM dbo.${quote(tableName)}${lock ? ' WITH(TABLOCKX,HOLDLOCK)' : ''}`);
    data.push({ table: tableName, rows: rows.length, sha256: sha(rows.map(row => JSON.stringify(row)).sort().join('\n')) });
  }
  return { metadata, data };
}
async function parity(provider) {
  const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
  const objects = await ask(provider, queries.objects);
  const drift = [];
  for (const [name, sourceFile] of Object.entries(manifest.modules)) {
    const body = read(path.join(dbRoot, sourceFile));
    const start = /CREATE\s+OR\s+ALTER\s+(?:FUNCTION|PROCEDURE|VIEW|TRIGGER)/i.exec(body)?.index;
    const actual = objects.find(row => row.name === name);
    if (!actual || normalizeModule(actual.definition) !== normalizeModule(body.slice(start).replace(/\s+GO\s*$/i, '').replaceAll('CinemaBookingDB', database))) drift.push(name);
  }
  assert.deepEqual(drift, []);
  mark('Source/module parity', { modules: Object.keys(manifest.modules).length, drift });
}
async function migrate(provider) {
  await batches(provider, read(path.join(dbRoot, '13_migrations/r0_remove_holiday_pricing.sql')));
  await batches(provider, read(path.join(dbRoot, '05_functions/fn_TinhGiaVe.sql')));
}
try {
  evidence.before = await snapshot(pool);
  assert.equal(evidence.before.data.length, 27);
  if (exercise) {
    // A committed synthetic legacy row on a disposable database proves rejection preserves existing data/DDL.
    await pool.request().query(`ALTER TABLE dbo.BANGGIA DROP CONSTRAINT CK_BANGGIA_LoaiNgay;
      ALTER TABLE dbo.BANGGIA WITH CHECK ADD CONSTRAINT CK_BANGGIA_LoaiNgay CHECK (LoaiNgay IN (N'Ngày thường',N'Cuối tuần',N'Tất cả',N'Ngày lễ'));
      INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
        SELECT TOP(1) RapID,N'Đôi',N'Ngày lễ',N'4DX',1234,dbo.fn_HomNay(),NULL,N'Áp dụng' FROM dbo.RAPCHIEUPHIM ORDER BY RapID;`);
    const beforeFailure = await snapshot(pool);
    assert.equal((await ask(pool, "SELECT COUNT(*) AS n FROM dbo.BANGGIA WHERE LoaiNgay=N'Ngày lễ'"))[0].n, 1);
    await assert.rejects(() => migrate(pool), error => error.number === 51000 && /R0 migration refused/.test(error.message));
    const afterFailure = await snapshot(pool);
    assert.deepEqual(afterFailure.data, beforeFailure.data);
    for (const key of Object.keys(queries).filter(key => key !== 'environment')) assert.deepEqual(afterFailure.metadata[key], beforeFailure.metadata[key], key);
    evidence.beforeRejectedMigration = beforeFailure;
    evidence.afterRejectedMigration = afterFailure;
    mark('Legacy precondition rejects with 51000; all 27 table fingerprints, constraint and SQL modules unchanged', { legacyRowsRetained: 1 });
  } else {
    evidence.preconditionRows = (await ask(pool, "SELECT COUNT(*) AS n FROM dbo.BANGGIA WHERE LoaiNgay=N'Ngày lễ'"))[0].n;
    assert.equal(evidence.preconditionRows, 0, 'Existing legacy rows require an explicit business decision; no migration/data cleanup is attempted.');
    if (apply) {
      if (main) {
        assert.equal(env.DB_DATABASE, database);
        const prior = JSON.parse(read(path.join(root, 'docs/r0-20261007/database-contract.json')));
        const rejection = JSON.parse(read(path.join(root, 'docs/r0-20261007/migration-precondition.json')));
        assert.equal(prior.status, 'PASS'); assert.equal(rejection.status, 'PASS');
        const directory = (await ask(pool, "SELECT CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) AS directory"))[0].directory;
        assert.ok(directory);
        const backupPath = directory.replace(/[\\/]?$/, '\\') + `CinemaBookingDB_pre_R0_${Date.now()}.bak`;
        await pool.request().input('BackupPath', sql.NVarChar(4000), backupPath)
          .query('BACKUP DATABASE [CinemaBookingDB] TO DISK=@BackupPath WITH COPY_ONLY,CHECKSUM; RESTORE VERIFYONLY FROM DISK=@BackupPath WITH CHECKSUM;');
        evidence.backup = { path: backupPath, copyOnly: true, checksum: true, restoreVerified: true };
        mark('Main backup/RESTORE VERIFYONLY');
      }
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        // Snapshot and locks protect existing data across the whole in-place migration.
        const before = await snapshot(transaction, true);
        await migrate(transaction);
        const after = await snapshot(transaction);
        assert.deepEqual(after.data, before.data);
        for (const key of ['columns','keys','foreignKeys','indexes','triggers','principals','permissions','memberships','parameters']) assert.deepEqual(after.metadata[key], before.metadata[key], key);
        assert.deepEqual(after.metadata.checks.filter(row => row.name !== 'CK_BANGGIA_LoaiNgay'), before.metadata.checks.filter(row => row.name !== 'CK_BANGGIA_LoaiNgay'));
        const changedModules = after.metadata.objects.filter(row => row.definition !== before.metadata.objects.find(old => old.name === row.name && old.type === row.type)?.definition).map(row => row.name);
        assert.ok(changedModules.every(name => name === 'fn_TinhGiaVe'));
        evidence.before = before; evidence.after = after; evidence.changedModules = changedModules;
        await parity(transaction);
        await transaction.commit();
        mark('In-place migration preserves all 27 tables/data, grants, columns and unrelated objects');
      } catch (error) { try { await transaction.rollback(); } catch {} throw error; }
      if (!main) {
        const beforeReplay = await snapshot(pool);
        await migrate(pool);
        const afterReplay = await snapshot(pool);
        assert.deepEqual(afterReplay.data, beforeReplay.data);
        assert.deepEqual(afterReplay.metadata.checks, beforeReplay.metadata.checks);
        mark('Migration is safe to replay');
      }
    }
    if (!main) {
      const beforeTests = await snapshot(pool);
      await batches(pool, read(path.join(dbRoot, '11_tests/pricing/contract.sql')));
      mark('Authoritative fn_TinhGiaVe: weekday/Saturday/Sunday/all-day/base/additive/filters/DATEFIRST/local-midnight');
      for (const dayType of ['Ngày thường','Cuối tuần','Tất cả']) {
        const transaction = new sql.Transaction(pool); await transaction.begin();
        try {
          const request = new sql.Request(transaction);
          const result = await request.input('DayType', sql.NVarChar(50), dayType).query(`INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
            SELECT TOP(1) RapID,N'Đôi',@DayType,N'ScreenX',1,dbo.fn_HomNay(),NULL,N'Áp dụng' FROM dbo.RAPCHIEUPHIM ORDER BY RapID;
            SELECT LoaiNgay FROM dbo.BANGGIA WHERE GiaID=SCOPE_IDENTITY();`);
          assert.equal(result.recordset[0].LoaiNgay, dayType); mark('DB CHECK accepts ' + dayType);
        } finally { await transaction.rollback(); }
      }
      for (const dayType of ['Ngày lễ','holiday','Holiday','HOLIDAY','Không hợp lệ']) {
        await assert.rejects(() => pool.request().input('DayType', sql.NVarChar(50), dayType).query(`INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
          SELECT TOP(1) RapID,N'Đôi',@DayType,N'ScreenX',1,dbo.fn_HomNay(),NULL,N'Áp dụng' FROM dbo.RAPCHIEUPHIM ORDER BY RapID;`), error => error.number === 547 && /CK_BANGGIA_LoaiNgay/.test(error.message));
        mark('DB CHECK rejects ' + dayType, { sqlNumber: 547 });
      }
      evidence.afterTests = await snapshot(pool);
      assert.deepEqual(evidence.afterTests.data, beforeTests.data); mark('Pricing test fixtures leave all 27 tables unchanged');
    }
    const check = (await ask(pool, queries.checks)).find(row => row.name === 'CK_BANGGIA_LoaiNgay');
    assert.ok(check && !check.is_disabled && !check.is_not_trusted && !/Ngày lễ|holiday/i.test(check.definition));
    evidence.constraint = check; mark('CHECK enabled and trusted, only official day types');
  }
  evidence.status = 'PASS';
  console.log(JSON.stringify({ database, status: evidence.status, checks: evidence.checks.length, evidence: path.relative(root, file) }));
} catch (error) {
  evidence.status = 'FAIL'; evidence.error = { number: error.number, message: error.message }; throw error;
} finally { evidence.completedAt = new Date().toISOString(); save(); await pool.close(); }

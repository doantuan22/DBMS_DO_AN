// Offline R6A audit. No write statements, fixture creation, reset, or migration.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { connect, ask, mainSnapshot, productionHashes, root, read, write, sql, sha, normalizeModule } from '../r3a/common.mjs';
import { walk } from '../db/lib.mjs';
import { queries } from '../db/inventory.mjs';

const output = path.join(root, 'audit/remediation/r6a/evidence');
const before = JSON.parse(read(path.join(output, 'main-before.json')));
const manifest = JSON.parse(read(path.join(root, 'database/baseline-manifest.json')));
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const sorted = rows => rows.map(canonical).sort();
const digest = rows => sha(JSON.stringify(sorted(rows)));
const supplementalHashes = () => Object.fromEntries([
  'shared', 'backend/tests', 'frontend/tests', 'scripts/db', 'scripts/r1', 'scripts/r2',
  'scripts/r2fix', 'scripts/r3a', 'scripts/r3b', 'scripts/r4', 'scripts/r5',
].filter(dir => fs.existsSync(path.join(root, dir))).flatMap(dir => walk(path.join(root, dir)))
  .sort().map(file => [path.relative(root, file).replaceAll('\\', '/'), sha(fs.readFileSync(file))]));
const supplements = supplementalHashes();
write(path.join(output, 'supplemental-source-before.json'), supplements);

// This guard applies to every standalone audit query. Quoted literals/comments are not SQL tokens.
function assertReadOnly(source) {
  const tokens = source.replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\//g, ' ');
  assert.match(tokens.trim(), /^SELECT\b/i);
  assert.doesNotMatch(tokens, /\b(?:INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|EXEC(?:UTE)?|GRANT|DENY|REVOKE|INTO|DBCC|BACKUP|RESTORE)\b/i);
}
async function metadata(pool) {
  const result = {};
  for (const [name, source] of Object.entries(queries)) {
    assertReadOnly(source);
    result[name] = (await ask(pool, source)).recordset;
  }
  return result;
}
function safeMetadata(raw) {
  return { ...raw, objects: raw.objects.map(({ definition, ...object }) => ({
    ...object, definitionSha256: definition === null ? null : sha(definition),
  })) };
}
const labels = {
  'DATA-001': ['orders', 'paymentAttempts', 'ticketDetails', 'foodDetails', 'referencedPromotions', 'originalOrder'],
  'DATA-002': ['cancelledPaidOrders', 'originalOrders', 'paymentHistory', 'compensationLedger', 'originalShowtime'],
  'DATA-003': ['shortShowtimes', 'originalShowtimes'],
  'DATA-004': ['outsideReleaseWindow', 'originalShowtimes'],
  'DATA-005': ['futureProfiles', 'originalUsers', 'nullableDOB'],
  'DATA-006': ['allCustomers', 'originalUsers', 'orphanOrWrongRoleProfiles'],
  'DATA-007': ['exactDuplicateGroups', 'allAssignments', 'overlapPairs', 'originalAssignments', 'originalCancelledGroup'],
  'DATA-008': ['promotionLifecycleCounters', 'promotionOrders'],
  'DATA-009': ['endedOpenShowtimes', 'bookingsAfterShowStart', 'runningOpenShowtimes'],
};
const pool = await connect('CinemaBookingDB');
try {
  assert.equal((await ask(pool, 'SELECT DB_NAME() AS databaseName')).recordset[0].databaseName, 'CinemaBookingDB');
  assert.deepEqual(productionHashes(), before.sourceHashes, 'Production source changed since audit start');
  const metadataBefore = await metadata(pool);
  const problems = [];
  for (const [name, file] of Object.entries(manifest.modules)) {
    const body = read(path.join(root, 'database', file));
    const start = /\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
    assert.ok(start, file);
    const source = body.slice(start.index).replace(/\s+GO\s*$/i, '');
    const actual = metadataBefore.objects.find(o => o.name === name);
    if (!actual || normalizeModule(source) !== normalizeModule(actual.definition)) problems.push(`Definition drift: ${name}`);
    const expected = manifest.expected.objects.find(o => o.name === name);
    if (actual && (actual.uses_ansi_nulls !== expected.uses_ansi_nulls || actual.uses_quoted_identifier !== expected.uses_quoted_identifier)) problems.push(`SET option drift: ${name}`);
  }
  const actualModuleNames = metadataBefore.objects.filter(o => o.definition !== null).map(o => o.name).sort();
  assert.deepEqual(actualModuleNames, Object.keys(manifest.modules).sort(), 'Unexpected module set');
  // Row counts belong to data fingerprints, not to the empty schema manifest.
  for (const name of Object.keys(queries).filter(n => !['rowcounts', 'objects', 'environment'].includes(n))) {
    if (canonical(sorted(metadataBefore[name])) !== canonical(sorted(manifest.expected[name]))) problems.push(`Manifest drift: ${name}`);
  }
  const actualObjects = metadataBefore.objects.map(({ definition, ...o }) => o);
  const expectedObjects = manifest.expected.objects.map(({ definition, ...o }) => o);
  if (canonical(sorted(actualObjects)) !== canonical(sorted(expectedObjects))) problems.push('Manifest drift: object inventory');
  const withoutDatabaseName = ({ databaseName, ...environment }) => environment;
  if (canonical(metadataBefore.environment.map(withoutDatabaseName)) !== canonical(manifest.expected.environment.map(withoutDatabaseName))) problems.push('Manifest drift: environment');
  write(path.join(output, 'inventory-before.json'), safeMetadata(metadataBefore));
  write(path.join(output, 'source-parity.json'), {
    status: problems.length ? 'FAIL' : 'PASS', modulesChecked: actualModuleNames.length,
    tablesChecked: metadataBefore.rowcounts.length, manifest: 'database/baseline-manifest.json',
    manifestSha256: sha(read(path.join(root, 'database/baseline-manifest.json'))), problems,
  });
  assert.deepEqual(problems, [], 'DB/source/manifest parity failed');

  for (const [finding, names] of Object.entries(labels)) {
    const relativeQuery = `scripts/r6a/queries/${finding}.sql`;
    const source = read(path.join(root, relativeQuery));
    assertReadOnly(source);
    const request = new sql.Request(pool)
      .input('AuditNow', sql.DateTime2(7), new Date(before.clock.utcNow))
      .input('BusinessDate', sql.Date, new Date(`${before.clock.businessDate}T00:00:00.000Z`));
    const result = await request.query(source);
    assert.equal(result.recordsets.length, names.length, finding);
    write(path.join(output, `${finding}.json`), {
      status: 'PASS', finding, database: 'CinemaBookingDB', auditNow: before.clock.utcNow,
      businessDate: before.clock.businessDate, query: relativeQuery, querySha256: sha(source),
      results: Object.fromEntries(names.map((name, i) => [name, result.recordsets[i]])),
    });
    console.log(`${finding}: ${names.map((name, i) => `${name}=${result.recordsets[i].length}`).join(', ')}`);
  }

  const showQuery = `SELECT s.SuatChieuID,s.PhimID,s.PhongID,s.TrangThai,s.ThoiGianBatDau,s.ThoiGianKetThuc,
    CONVERT(varchar(10),dbo.fn_NgayKinhDoanh(s.ThoiGianBatDau),23) AS businessDate,
    p.ThoiLuong,CONVERT(varchar(10),p.NgayKhoiChieu,23) AS releaseDate,CONVERT(varchar(10),p.NgayKetThuc,23) AS endDate,
    CASE WHEN s.ThoiGianKetThuc<=@AuditNow THEN 'PAST' WHEN s.ThoiGianBatDau<=@AuditNow THEN 'CURRENT' ELSE 'FUTURE' END AS timeClass,
    DATEDIFF(MINUTE,s.ThoiGianBatDau,s.ThoiGianKetThuc) AS durationMinutes,
    (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID) AS bookingCount
    FROM dbo.SUATCHIEU s JOIN dbo.PHIM p ON p.PhimID=s.PhimID ORDER BY s.SuatChieuID`;
  assertReadOnly(showQuery);
  const showtimes = (await new sql.Request(pool).input('AuditNow', sql.DateTime2(7), new Date(before.clock.utcNow)).query(showQuery)).recordset;
  write(path.join(output, 'all-showtimes.json'), { query: showQuery, rows: showtimes });

  // Both procedures were inspected and verified against source above; neither executes writes/jobs.
  const healthRow = (await new sql.Request(pool).execute('dbo.sp_System_HealthCheck')).recordset[0];
  assert.equal(healthRow.Status, 'Healthy');
  assert.equal(healthRow.DatabaseName, 'CinemaBookingDB');
  const publicListings = [];
  for (const PhimID of [...new Set(showtimes.map(s => s.PhimID))]) {
    const rows = (await new sql.Request(pool).input('PhimID', sql.Int, PhimID).execute('dbo.sp_Showtime_ListByMovie')).recordset;
    publicListings.push({ PhimID, SuatChieuIDs: rows.map(r => r.SuatChieuID) });
    assert.ok(rows.every(r => r.TrangThaiSuatChieu === 'Mở bán' && new Date(r.ThoiGianBatDau) > new Date(before.clock.utcNow)));
  }
  const databases = (await ask(pool, "SELECT name,state_desc FROM master.sys.databases WHERE name LIKE N'CinemaBookingDB%' ORDER BY name")).recordset;
  write(path.join(output, 'health-and-cleanup.json'), {
    status: 'PASS', health: { Status: healthRow.Status, ServerTime: healthRow.ServerTime, DatabaseName: healthRow.DatabaseName },
    publicListings, databases, fixtureDatabasesCreated: [], fixtureDatabasesDeleted: [],
    cleanup: databases.every(d => d.name === 'CinemaBookingDB') ? 'PASS: no CinemaBookingDB fixture remains' : 'EXISTING DATABASES: review names; R6A did not create/delete any',
  });
  const metadataAfter = await metadata(pool);
  const structuralHashes = raw => Object.fromEntries(Object.entries(raw).map(([name, rows]) => [name, digest(rows)]));
  assert.deepEqual(structuralHashes(metadataAfter), structuralHashes(metadataBefore));
  const snapshot = await mainSnapshot(pool);
  assert.deepEqual(snapshot, before.snapshot, 'Main DB fingerprint changed during R6A');
  assert.deepEqual(productionHashes(), before.sourceHashes);
  assert.deepEqual(supplementalHashes(), supplements);
  const r5 = JSON.parse(read(path.join(root, 'audit/remediation/r5/evidence/main-after.json')));
  const dataVersusR5 = snapshot.data.map(row => ({ table: row.table, rows: row.rows,
    matchesR5: canonical(row) === canonical(r5.snapshot.data.find(old => old.table === row.table)) }));
  write(path.join(output, 'main-after.json'), {
    status: 'PASS', database: 'CinemaBookingDB', snapshot, sourceHashes: productionHashes(),
    beforeAfterIdentical: true, sourceUnchanged: true, supplementalSourceUnchanged: true,
    metadataBeforeHashes: structuralHashes(metadataBefore), metadataAfterHashes: structuralHashes(metadataAfter),
    dataVersusR5, r5ModuleHashMatches: snapshot.modulesSha256 === r5.snapshot.modulesSha256,
    r5SchemaHashMatches: snapshot.schemaSha256 === r5.snapshot.schemaSha256,
    r5GrantsHashMatches: snapshot.dbPermissionsSha256 === r5.snapshot.dbPermissionsSha256,
  });
  console.log(JSON.stringify({ status: 'PASS', tableCount: 27, moduleCount: actualModuleNames.length,
    beforeAfterIdentical: true, matchesR5Tables: dataVersusR5.filter(r => r.matchesR5).length, databases }));
} finally {
  await pool.close();
}

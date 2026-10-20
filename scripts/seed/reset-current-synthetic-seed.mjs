// Replace only the exact synthetic dataset created by this seed run to correct UTC encoding.
// Requires the verified row-count snapshot and a passing Main backup immediately beforehand.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAIN_DB = 'CinemaBookingDB';
const PROTECTED = new Map([['VAITRO', 4], ['QUYEN', 33], ['VAITRO_QUYEN', 59]]);
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
const verifiedPath = path.join(ROOT, '.audit-output', 'seed-data-verification.json');
const backupPath = path.join(ROOT, '.audit-output', 'seed-pre-reseed-backup.json');
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing reset: backend/.env must target exactly ${MAIN_DB}.`);
if (!fs.existsSync(verifiedPath) || !fs.existsSync(backupPath)) throw new Error('Missing verified seed snapshot or pre-reset backup proof.');
const verified = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
if (verified.database !== MAIN_DB || verified.result !== 'PASS' || backup.database !== MAIN_DB || backup.restoreVerifyOnly !== 'PASS') {
  throw new Error('Seed snapshot or backup proof does not match exact passing Main artifacts.');
}
const verifiedBackupPath = path.resolve(ROOT, backup.backupPath);
if (!fs.existsSync(verifiedBackupPath) || fs.statSync(verifiedBackupPath).size !== Number(backup.bytes)) {
  throw new Error('The passing pre-reset backup file is missing or has changed.');
}
const snapshot = new Map(Object.entries(verified.tableRowCounts).map(([name, value]) => [name, Number(value)]));
for (const name of PROTECTED.keys()) snapshot.delete(name);

const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 120000,
}).connect();
const tx = new sql.Transaction(pool);
const quote = (value) => `[${String(value).replaceAll(']', ']]')}]`;
function deleteOrder(edges) {
  const names = new Set(snapshot.keys());
  const parents = new Map([...names].map((name) => [name, new Set()]));
  const children = new Map([...names].map((name) => [name, new Set()]));
  for (const edge of edges) {
    if (!names.has(edge.child_table) || !names.has(edge.parent_table)) continue;
    parents.get(edge.child_table).add(edge.parent_table);
    children.get(edge.parent_table).add(edge.child_table);
  }
  const ready = [...names].filter((name) => children.get(name).size === 0).sort();
  const result = [];
  while (ready.length) {
    const child = ready.shift();
    result.push(child);
    for (const parent of parents.get(child)) {
      children.get(parent).delete(child);
      if (children.get(parent).size === 0) { ready.push(parent); ready.sort(); }
    }
  }
  if (result.length !== names.size) throw new Error('FK cycle found; no Main rows were changed.');
  return result;
}
async function query(connection, text) { return connection.request().query(text); }
let committed = false;
try {
  const identity = (await query(pool, 'SELECT DB_NAME() AS db;')).recordset[0];
  if (identity.db !== MAIN_DB) throw new Error(`Connected to ${identity.db}; expected ${MAIN_DB}.`);
  const objects = (await query(pool, `
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0) AS triggers,
      (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) AS bad_fks,
      (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) AS bad_checks,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled=1) AS disabled_triggers;
  `)).recordset[0];
  if (objects.tables !== 29 || objects.procedures !== 147 || objects.views !== 6 || objects.functions !== 21 || objects.triggers !== 9
    || objects.bad_fks !== 0 || objects.bad_checks !== 0 || objects.disabled_triggers !== 0) {
    throw new Error(`Schema or constraint state drift; no Main rows were changed. ${JSON.stringify(objects)}.`);
  }
  const edgeRows = (await query(pool, `
    SELECT child.name AS child_table, parent.name AS parent_table
    FROM sys.foreign_keys fk JOIN sys.tables child ON child.object_id=fk.parent_object_id
    JOIN sys.tables parent ON parent.object_id=fk.referenced_object_id
    WHERE child.is_ms_shipped=0 AND parent.is_ms_shipped=0;
  `)).recordset;
  const order = deleteOrder(edgeRows);

  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  const txIdentity = (await query(tx, 'SELECT DB_NAME() AS db;')).recordset[0];
  if (txIdentity.db !== MAIN_DB) throw new Error('Transaction identity changed.');
  const lockNames = [...new Set([...snapshot.keys(), ...PROTECTED.keys()])].sort();
  const current = new Map();
  for (const name of lockNames) {
    const row = (await query(tx, `SELECT COUNT_BIG(*) AS row_count FROM dbo.${quote(name)} WITH (TABLOCKX,HOLDLOCK);`)).recordset[0];
    current.set(name, Number(row.row_count));
  }
  const mismatches = [];
  for (const [name, expected] of snapshot) if (current.get(name) !== expected) mismatches.push(`${name} expected ${expected}, found ${current.get(name)}`);
  for (const [name, expected] of PROTECTED) if (current.get(name) !== expected) mismatches.push(`${name} protected expected ${expected}, found ${current.get(name)}`);
  if (mismatches.length) throw new Error(`Seed snapshot drift; transaction will roll back. ${mismatches.join('; ')}.`);
  const crossEdges = edgeRows.filter((edge) => !snapshot.has(edge.child_table) && snapshot.has(edge.parent_table));
  if (crossEdges.length) throw new Error(`Protected child table references seed rows: ${JSON.stringify(crossEdges)}.`);

  const expectedTotal = [...snapshot.values()].reduce((sum, count) => sum + count, 0);
  const beforeCounts = Object.fromEntries(snapshot);
  for (const name of order) {
    await query(tx, `DELETE FROM dbo.${quote(name)};`);
    const remaining = (await query(tx, `SELECT COUNT_BIG(*) AS row_count FROM dbo.${quote(name)};`)).recordset[0];
    if (Number(remaining.row_count) !== 0) throw new Error(`${name} still contains rows; rollback requested.`);
  }
  const protectedAfter = {};
  for (const [name, expected] of PROTECTED) {
    const count = Number((await query(tx, `SELECT COUNT_BIG(*) AS row_count FROM dbo.${quote(name)} WITH (HOLDLOCK);`)).recordset[0].row_count);
    protectedAfter[name] = count;
    if (count !== expected) throw new Error(`${name} changed while replacing synthetic seed.`);
  }
  const dbcc = await query(tx, 'DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');
  if (dbcc.recordset?.length) throw new Error(`DBCC reported ${dbcc.recordset.length} issue(s).`);
  await tx.commit();
  committed = true;
  const report = {
    database: MAIN_DB, reason: 'Replace only this run\'s synthetic rows after correcting UTC encoding for Asia/Ho_Chi_Minh.',
    backup: backup.backupPath, backupVerified: true,
    syntheticRowsRemoved: expectedTotal, operationalTablesCleared: order.length,
    preservedRbac: protectedAfter, constraintsAndTriggersChanged: false,
    snapshotCounts: beforeCounts, deleteOrder: order, committed: true,
  };
  fs.writeFileSync(path.join(ROOT, '.audit-output', 'seed-utc-correction-reset.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Removed exactly ${expectedTotal} rows from ${order.length} operational Main tables under the verified seed snapshot; RBAC preserved.`);
} catch (error) {
  if (!committed) { try { await tx.rollback(); } catch { /* the server may already have rolled back */ } }
  throw error;
} finally { await pool.close(); }

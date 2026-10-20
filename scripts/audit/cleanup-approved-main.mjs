// Transactional implementation of the user's approved 3,302-row Main cleanup.
// It refuses any target/count/schema drift and leaves all schema objects, RBAC, and constraints intact.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from './lib.mjs';

const MAIN_DB = 'CinemaBookingDB';
const targets = new Map([
  ['BOITHUONG_HUYSUAT', 0], ['THANHTOAN', 600], ['CHITIETDOAN', 80], ['CHITIETVE', 501],
  ['TINNHAN_KHIEUNAI', 0], ['YEUCAU_CHUYENCAP', 0], ['XULY_KHIEUNAI', 47], ['KHIEUNAI', 60],
  ['DANHGIAPHIM', 100], ['DONDATVE', 501], ['PHANCONG_RAP', 4], ['HOSOKHACHHANG', 206],
  ['NGUOIDUNG', 212], ['SUATCHIEU', 512], ['GHE', 320], ['PHONGCHIEU', 8], ['BANGGIA', 20],
  ['HINHANH_RAPCHIEUPHIM', 4], ['RAPCHIEUPHIM', 4], ['PHIM_DIENVIEN', 22], ['PHIM_THELOAI', 36],
  ['PHIM', 18], ['DIENVIEN', 22], ['THELOAI', 12], ['SANPHAM', 8], ['KHUYENMAI', 5],
]);
const protectedCounts = new Map([['VAITRO', 4], ['QUYEN', 33], ['VAITRO_QUYEN', 59]]);
const expectedObjects = { tables: 29, procedures: 147, views: 6, functions: 21, triggers: 9 };
const expectedCleanupTotal = 3302;

const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const envPath = path.join(ROOT, 'backend', '.env');
if (!fs.existsSync(envPath)) throw new Error('Missing backend/.env');
const env = dotenv.parse(fs.readFileSync(envPath));
for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
  if (!env[key]) throw new Error(`backend/.env is missing ${key}.`);
}
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing cleanup: backend/.env must target ${MAIN_DB}.`);

const config = {
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: MAIN_DB,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 120000,
};
const pool = await new sql.ConnectionPool(config).connect();
const tx = new sql.Transaction(pool);

function quoteIdent(value) { return `[${String(value).replaceAll(']', ']]')}]`; }

function topologicalDeleteOrder(edges) {
  const names = new Set(targets.keys());
  const dependencies = new Map([...names].map((name) => [name, new Set()]));
  const children = new Map([...names].map((name) => [name, new Set()]));
  for (const { child_table, parent_table } of edges) {
    if (!names.has(child_table) || !names.has(parent_table)) continue;
    dependencies.get(child_table).add(parent_table);
    children.get(parent_table).add(child_table);
  }
  // Child-to-parent edges: begin at leaves with no other table referencing them.
  const ready = [...names].filter((name) => children.get(name).size === 0).sort();
  const order = [];
  while (ready.length) {
    const name = ready.shift();
    order.push(name);
    for (const parent of dependencies.get(name)) {
      children.get(parent).delete(name);
      if (children.get(parent).size === 0) {
        ready.push(parent);
        ready.sort();
      }
    }
  }
  if (order.length !== names.size) {
    const cyclic = [...names].filter((name) => !order.includes(name));
    throw new Error(`Foreign-key cycle among cleanup tables; no writes performed: ${cyclic.join(', ')}`);
  }
  return order;
}

async function queryOn(connection, query) {
  return connection.request().query(query);
}

try {
  const identity = await queryOn(pool, 'SELECT DB_NAME() AS db, SUSER_SNAME() AS login;');
  if (identity.recordset[0].db !== MAIN_DB) throw new Error(`Connected to ${identity.recordset[0].db}, expected ${MAIN_DB}.`);

  const inventory = await queryOn(pool, `
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped=0) AS tables,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped=0) AS procedures,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped=0) AS views,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped=0) AS functions,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0) AS triggers,
      (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) AS bad_fks,
      (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) AS bad_checks,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled=1) AS disabled_triggers,
      (SELECT COUNT(*) FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id
       WHERE t.is_ms_shipped=0 AND e.type_desc='DELETE') AS delete_triggers;
  `);
  const objectCounts = inventory.recordset[0];
  for (const [key, expected] of Object.entries(expectedObjects)) {
    if (Number(objectCounts[key]) !== expected) throw new Error(`Schema inventory drift for ${key}: expected ${expected}, found ${objectCounts[key]}.`);
  }
  if (objectCounts.bad_fks || objectCounts.bad_checks || objectCounts.disabled_triggers || objectCounts.delete_triggers) {
    throw new Error(`Constraint/trigger state drift: ${JSON.stringify(objectCounts)}.`);
  }

  const fkResult = await queryOn(pool, `
    SELECT child.name AS child_table, parent.name AS parent_table
    FROM sys.foreign_keys fk
    JOIN sys.tables child ON child.object_id=fk.parent_object_id
    JOIN sys.tables parent ON parent.object_id=fk.referenced_object_id
    WHERE child.is_ms_shipped=0 AND parent.is_ms_shipped=0;
  `);
  const edges = fkResult.recordset;
  const order = topologicalDeleteOrder(edges);

  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  const txIdentity = await queryOn(tx, 'SELECT DB_NAME() AS db;');
  if (txIdentity.recordset[0].db !== MAIN_DB) throw new Error('Transaction database identity changed.');

  const countMap = new Map();
  // Acquire table locks in a stable order; the snapshot assertions and deletes then share one view.
  const allTables = [...targets.keys(), ...protectedCounts.keys()].sort();
  for (const name of allTables) {
    const result = await queryOn(tx, `SELECT COUNT_BIG(*) AS row_count FROM dbo.${quoteIdent(name)} WITH (TABLOCKX, HOLDLOCK);`);
    countMap.set(name, Number(result.recordset[0].row_count));
  }
  const mismatches = [];
  for (const [name, count] of targets) {
    if (countMap.get(name) !== count) mismatches.push(`${name} expected ${count}, found ${countMap.get(name)}`);
  }
  for (const [name, count] of protectedCounts) {
    if (countMap.get(name) !== count) mismatches.push(`${name} protected expected ${count}, found ${countMap.get(name)}`);
  }
  if (mismatches.length) throw new Error(`Approved row snapshot drift; transaction will roll back. ${mismatches.join('; ')}`);

  // Ensure no preserved table contains rows that reference records slated for deletion.
  const outgoing = edges.filter((edge) => !targets.has(edge.child_table) && targets.has(edge.parent_table));
  if (outgoing.length) {
    throw new Error(`Preserved/non-target child tables reference cleanup targets; transaction will roll back: ${outgoing.map((e) => `${e.child_table}->${e.parent_table}`).join(', ')}`);
  }

  let deleted = 0;
  const deletionLog = [];
  for (const name of order) {
    await queryOn(tx, `DELETE FROM dbo.${quoteIdent(name)};`);
    const remaining = await queryOn(tx, `SELECT COUNT_BIG(*) AS row_count FROM dbo.${quoteIdent(name)};`);
    const count = Number(remaining.recordset[0].row_count);
    if (count !== 0) throw new Error(`${name} has ${count} rows after DELETE; transaction will roll back.`);
    deleted += countMap.get(name);
    deletionLog.push({ table: name, deleted: countMap.get(name) });
  }
  if (deleted !== expectedCleanupTotal) throw new Error(`Deleted row total expected ${expectedCleanupTotal}, found ${deleted}.`);

  const protectedAfter = new Map();
  for (const name of protectedCounts.keys()) {
    const result = await queryOn(tx, `SELECT COUNT_BIG(*) AS row_count FROM dbo.${quoteIdent(name)} WITH (HOLDLOCK);`);
    protectedAfter.set(name, Number(result.recordset[0].row_count));
  }
  for (const [name, count] of protectedCounts) {
    if (protectedAfter.get(name) !== count) throw new Error(`${name} changed from protected count ${count} to ${protectedAfter.get(name)}; transaction will roll back.`);
  }

  const violations = await queryOn(tx, 'DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');
  if (violations.recordset?.length) throw new Error(`DBCC CHECKCONSTRAINTS reported ${violations.recordset.length} issue(s); transaction will roll back.`);
  await tx.commit();
  console.log(`Approved cleanup committed on ${MAIN_DB}: ${deleted} rows across ${order.length} operational tables.`);
  console.log(`Preserved RBAC rows: VAITRO 4, QUYEN 33, VAITRO_QUYEN 59.`);
  console.log(`FK-safe deletion order: ${order.join(' -> ')}`);
} catch (error) {
  if (tx._aborted !== true) {
    try { await tx.rollback(); } catch { /* transaction may not have begun or already rolled back */ }
  }
  throw error;
} finally {
  await pool.close();
}

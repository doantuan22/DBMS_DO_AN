import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { connect, ask, mainSnapshot, productionHashes, sql, sha, quote, root, dbRoot, read, write } from '../r3a/common.mjs';
export { assert, fs, path, connect, ask, mainSnapshot, productionHashes, sql, sha, quote, root, dbRoot, read, write };
export const out = path.join(root, 'audit/final/r8');
export const fixtures = ['CinemaBookingDB_R0_R1_R2_R5R7R8Regression', 'CinemaBookingDB_R0_R1_R2_R5R7R8Flows', 'CinemaBookingDB_R0_R8Clean'];
export const restoreName = 'CinemaBookingDB_R8_Restore_Final';
export const save = (name, value) => write(path.join(out, name), value);
export const load = name => JSON.parse(read(path.join(out, name)));
export function fixture(database) { assert.ok(fixtures.includes(database) || database === restoreName, 'Explicit disposable R8 target required'); assert.notEqual(database, 'CinemaBookingDB'); return database; }
export async function inventory(pool) {
  const types = (await ask(pool, 'SELECT RTRIM(type) AS type,COUNT(*) AS count FROM sys.objects WHERE is_ms_shipped=0 GROUP BY type')).recordset;
  const count = (...names) => types.filter(row => names.includes(row.type)).reduce((sum, row) => sum + row.count, 0);
  return { tables: count('U'), procedures: count('P'), views: count('V'), functions: count('FN','IF','TF'), triggers: count('TR'), modules: count('P','V','FN','IF','TF','TR'), indexes: (await ask(pool,'SELECT COUNT(*) AS count FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id WHERE t.is_ms_shipped=0 AND i.index_id>0')).recordset[0].count, constraints: count('PK','UQ','F','C','D') };
}
export const expectedInventory = { tables:27,procedures:125,views:6,functions:21,triggers:7,modules:159,indexes:63,constraints:161 };
export function run(name, args, { cwd = root, env = {}, legacy = [] } = {}) {
  const previous = legacy.map(file => fs.existsSync(file) ? fs.readFileSync(file) : null);
  let result;
  try {
    result = spawnSync(process.execPath, args, { cwd, env:{...process.env,...env}, encoding:'utf8', maxBuffer:24*1024*1024, timeout:600000 });
    save(`${name}.txt`, (result.stdout ?? '') + (result.stderr ?? ''));
    legacy.forEach(file => { if(fs.existsSync(file)) save(`legacy-reruns/${path.basename(file)}`, fs.readFileSync(file,'utf8')); });
  } finally {
    legacy.forEach((file,index) => { if(previous[index]) fs.writeFileSync(file,previous[index]); else if(fs.existsSync(file)) fs.unlinkSync(file); });
  }
  assert.equal(result.status,0,`${name}: ${((result.stdout??'')+(result.stderr??'')).slice(-2500)}`);
  return { name,status:'PASS',exitCode:result.status };
}

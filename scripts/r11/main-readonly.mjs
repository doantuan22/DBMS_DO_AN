import assert from 'node:assert/strict';
import path from 'node:path';
import { database, connect, snapshot, summarize, read, write, evidenceRoot } from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
try {
  const state=await snapshot(pool),migration=JSON.parse(read(path.join(evidenceRoot,'main-migration.json')));
  assert.equal(migration.status,'PASS');assert.deepEqual(state.data,migration.after.data);
  const types=state.metadata.objects.reduce((counts,row)=>{const type=row.type.trim();counts[type]=(counts[type]??0)+1;return counts;},{});
  assert.equal(types.U,27);assert.equal(types.P,125);assert.equal(types.TR,7);
  assert.ok(state.metadata.foreignKeys.every(row=>!row.is_disabled&&!row.is_not_trusted));
  assert.ok(state.metadata.checks.every(row=>!row.is_disabled&&!row.is_not_trusted));
  assert.equal(state.metadata.environment[0].is_read_committed_snapshot_on,true);
  evidence.objectCounts=types;evidence.foreignKeys='ENABLED_TRUSTED';evidence.checks='ENABLED_TRUSTED';
  evidence.state=summarize(state);evidence.dataPreserved='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error=error.message;throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'main-readonly.json'),evidence);await pool.close();}
console.log('PASS main read-only: 27 tables preserved; RCSI ON; all FK/CHECK enabled and trusted.');

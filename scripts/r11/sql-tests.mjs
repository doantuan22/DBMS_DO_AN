import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable, database, connect, batches, snapshot, summarize, dbRoot, read, write, evidenceRoot } from './common.mjs';
disposable();
const pool=await connect();
const evidence={ database, startedAt:new Date().toISOString(), status:'RUNNING' };
try {
  const before=await snapshot(pool);
  const result=await batches(pool,read(path.join(dbRoot,'11_tests/rooms/delete_atomicity.sql')));
  const report=result.recordsets.find(rows=>rows[0]?.BeforeState !== undefined);
  assert.ok(report,'SQL must return the actual state report.');
  evidence.cases=report.map(row=>({...row,BeforeState:JSON.parse(row.BeforeState),AfterState:JSON.parse(row.AfterState)}));
  assert.equal(evidence.cases.length,20);
  assert.ok(evidence.cases.every(row=>row.Result==='PASS'));
  const after=await snapshot(pool);
  assert.deepEqual(after.data,before.data,'Fixtures must leave all 27 tables unchanged.');
  assert.deepEqual(after.metadata,before.metadata,'Injection trigger must be removed; schema/grants unchanged.');
  evidence.before=summarize(before); evidence.after=summarize(after); evidence.fixtureCleanup='PASS'; evidence.status='PASS';
} catch(error) { evidence.status='FAIL'; evidence.error={number:error.number,message:error.message}; throw error; }
finally { evidence.completedAt=new Date().toISOString(); write(path.join(evidenceRoot,'sql-tests.json'),evidence); await pool.close(); }
console.log(`PASS SQL room-delete: ${evidence.cases.length} cases; all tables/schema preserved.`);

import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,connect,batches,snapshot,summarize,dbRoot,read,write,evidenceRoot } from './common.mjs';
disposable();const pool=await connect();
const evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
try {
 const before=await snapshot(pool);
 const result=await batches(pool,read(path.join(dbRoot,'11_tests/showtimes/overlap_safety.sql')));
 const report=result.recordsets.find(rows=>rows[0]?.BeforeState!==undefined);
 assert.ok(report);assert.equal(report.length,49);
 evidence.cases=report.map(row=>({...row,BeforeState:JSON.parse(row.BeforeState),AfterState:JSON.parse(row.AfterState)}));
 assert.ok(evidence.cases.every(row=>row.Result==='PASS'&&row.OverlapCount===0));
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.fixtureCleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'sql-tests.json'),evidence);await pool.close();}
console.log(`PASS showtime SQL: ${evidence.cases.length} cases; zero committed overlap; all27 tables/schema preserved.`);

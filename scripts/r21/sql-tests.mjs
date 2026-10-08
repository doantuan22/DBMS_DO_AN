import assert from 'node:assert/strict';
import path from 'node:path';
import { disposable,database,connect,batches,snapshot,summarize,read,write,root,evidenceRoot } from './common.mjs';
disposable();const pool=await connect(),evidence={database,startedAt:new Date().toISOString(),status:'RUNNING'};
try {
 const before=await snapshot(pool);
 const result=await batches(pool,read(path.join(root,'database/11_tests/booking/bookability.sql')));
 evidence.cases=result.recordsets.find(rows=>rows[0]?.CaseName)??[];
 assert.equal(evidence.cases.length,30);assert.ok(evidence.cases.every(row=>row.Status==='PASS'));
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);assert.deepEqual(after.metadata,before.metadata);
 evidence.before=summarize(before);evidence.after=summarize(after);evidence.cleanup='PASS';evidence.status='PASS';
} catch(error) {evidence.status='FAIL';evidence.error={number:error.number,message:error.message};throw error;}
finally {await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');evidence.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'sql-tests.json'),evidence);await pool.close();}
console.log(`PASS SQL bookability: ${evidence.cases.length} cases; real booking/read/seat/food/promotion and caller rollback; no data/schema drift.`);

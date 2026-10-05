import assert from 'node:assert/strict';
import path from 'node:path';
import {root,dbRoot,read,write} from '../db/lib.mjs';
import {connect,ask,mainSnapshot,sql} from '../r3a/common.mjs';
import {batches} from '../r2fix/migration-lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R5R7[A-Za-z0-9_]+$/);
const files=JSON.parse(read(path.join(root,'audit/remediation/r7/evidence/migration-files.json'))).files;
const old=JSON.parse(read(path.join(root,'audit/remediation/r7/evidence/baseline-modules.json'))).modules.filter(m=>files.some(f=>f.endsWith('/'+m.name+'.sql')));
assert.equal(old.length,files.length);
const pool=await connect(database),report={database,status:'RUNNING',checks:[]};
async function change(fn){const tx=new sql.Transaction(pool);await tx.begin();try{await fn(tx);await tx.commit();}catch(e){try{await tx.rollback();}catch{}throw e;}}
try{
 const initial=await mainSnapshot(pool);
 await change(async tx=>{for(const m of old){await ask(tx,`SET ANSI_NULLS ${m.uses_ansi_nulls?'ON':'OFF'}; SET QUOTED_IDENTIFIER ${m.uses_quoted_identifier?'ON':'OFF'};`);await batches(tx,m.definition.replace(/\b(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+(PROCEDURE|VIEW)\b/i,'CREATE OR ALTER $1'));}});
 const before=await mainSnapshot(pool);assert.deepEqual(before.data,initial.data);
 await assert.rejects(change(async tx=>{await batches(tx,read(path.join(dbRoot,files[0])));await ask(tx,"THROW 59999,'R7 intentional migration failure',1;");}),e=>e.number===59999);
 assert.deepEqual(await mainSnapshot(pool),before);report.checks.push('Failure rolls back changed module and all data');
 await change(async tx=>{for(const file of files)await batches(tx,read(path.join(dbRoot,file)));});
 const after=await mainSnapshot(pool);assert.deepEqual(after.data,before.data);assert.equal(after.schemaSha256,before.schemaSha256);assert.equal(after.dbPermissionsSha256,before.dbPermissionsSha256);report.checks.push('Upgrade from captured pre-R7 definitions preserves all 27 tables including existing anomalous fixture records');
 await change(async tx=>{for(const file of files)await batches(tx,read(path.join(dbRoot,file)));});
 assert.deepEqual(await mainSnapshot(pool),after);report.checks.push('Applying migration twice is idempotent');
 report.status='PASS';report.before=before;report.after=after;write(path.join(root,'audit/remediation/r7/evidence/migration-upgrade.json'),report);console.log('PASS migration: upgrade, failure atomicity, idempotency; all data preserved');
}finally{await pool.close();}

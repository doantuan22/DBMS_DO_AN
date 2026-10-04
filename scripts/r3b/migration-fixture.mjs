// Reproduce the actual pre-R3B module baseline in the disposable fixture, preserving its data.
import assert from 'node:assert/strict';
import path from 'node:path';
import {root,read,write} from '../db/lib.mjs';
import {connect,ask,mainSnapshot,sql} from '../r3a/common.mjs';
import {batches} from '../r2fix/migration-lib.mjs';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
assert.match(database??'',/^CinemaBookingDB_R0_R1_R2_R3B[A-Za-z0-9_]+$/);
const names=JSON.parse(read(path.join(root,'audit/remediation/r3b/evidence/migration-files.json'))).files.map(file=>file.split('/').at(-1).replace('.sql',''));
const main=await connect('CinemaBookingDB'),fixture=await connect(database);
try{
 const before=await mainSnapshot(fixture);
 const old=(await ask(main,'SELECT o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0')).recordset.filter(o=>names.includes(o.name));
 assert.equal(old.length,names.length-1,'Expected only the new Admin genre wrapper to be absent before R3B.');
 const tx=new sql.Transaction(fixture);await tx.begin();
 try{
  await ask(tx,'DROP PROCEDURE dbo.sp_Admin_Genre_List;');
  for(const o of old){await ask(tx,`SET ANSI_NULLS ${o.uses_ansi_nulls?'ON':'OFF'}; SET QUOTED_IDENTIFIER ${o.uses_quoted_identifier?'ON':'OFF'};`);await batches(tx,o.definition.replace(/\b(?:CREATE(?:\s+OR\s+ALTER)?|ALTER)\s+(PROCEDURE|FUNCTION)\b/i,'CREATE OR ALTER $1'));}
  const after=await mainSnapshot(tx);assert.deepEqual(after.data,before.data);
  await tx.commit();write(path.join(root,'audit/remediation/r3b/evidence/migration-before.json'),{database,status:'PASS',preR3BModulesRestored:old.length,before,after});
 }catch(e){try { await tx.rollback(); } catch { /* SQL Server may already have aborted the fixture transaction. */ } throw e;}
 console.log('PASS restored pre-R3B module signatures in fixture; business data unchanged.');
}finally{await fixture.close();await main.close();}

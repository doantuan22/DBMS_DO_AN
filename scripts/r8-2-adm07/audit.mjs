// Final read-only identity, seed, module/protection and main preservation audit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {open,fingerprints,moduleParity,root} from '../../database/11_tests/r6-group-a/support.mjs';
import {preflight} from '../db/test-target.mjs';
const option=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const out=path.resolve(option('output')||'');
assert.ok(out.startsWith(path.join(root,'docs/evidence/r8-2-adm07/runs')+path.sep));
assert.ok(fs.existsSync(path.join(out,'context.json')));
assert.ok(!fs.existsSync(path.join(out,'final-read-only-audit.json')));
const database='CinemaBookingDB_R0_R81_20261010_3d49fc44',gate=preflight(database);
assert.equal(gate.target.database_guid,'33876608-D109-43B5-ACEC-0B84C2639A73');
assert.equal(gate.target.database_id,48);assert.equal(gate.server.ServerName,'DESKTOP-E67DPCV');
const last=path.join(root,'docs/evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0');
let test,main,master;
try{
 test=await open(database,1);main=await open('CinemaBookingDB',1);master=await open('master',1);
 const testState=await fingerprints(test),mainState=await fingerprints(main),parity=await moduleParity(test);
 assert.deepEqual(testState,JSON.parse(fs.readFileSync(path.join(last,'fixture-cleanup.json'),'utf8')).after);
 assert.deepEqual(mainState,JSON.parse(fs.readFileSync(path.join(last,'main-preservation.json'),'utf8')).after);
 assert.equal(parity.modules,159);
 const integrity=(await test.request().query(`
  SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) disabledOrUntrustedFK,
   (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) disabledOrUntrustedChecks,
   (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) disabledTriggers,
   (SELECT COUNT(*) FROM sys.dm_tran_session_transactions s JOIN sys.dm_tran_database_transactions d ON d.transaction_id=s.transaction_id WHERE d.database_id=DB_ID() AND s.is_user_transaction=1) openUserTransactions,
   (SELECT COUNT(*) FROM sys.database_principals WHERE name LIKE 'cinema[_]r82hf[_]%') testRuntimeUsers,
   (SELECT COUNT(*) FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1) bookableShowtimes,
   @@TRANCOUNT transactionCount;`)).recordset[0];
 for(const key of ['disabledOrUntrustedFK','disabledOrUntrustedChecks','disabledTriggers','openUserTransactions','testRuntimeUsers','transactionCount'])assert.equal(integrity[key],0,key);
 assert.ok(integrity.bookableShowtimes>0);
 const logins=(await master.request().query("SELECT name FROM sys.server_principals WHERE name LIKE 'cinema[_]r82hf[_]%';")).recordset;assert.deepEqual(logins,[]);
 fs.writeFileSync(path.join(out,'final-read-only-audit.json'),JSON.stringify({status:'PASS',scope:'SELECT/read-only preflight only; zero database mutations',time:new Date().toISOString(),database,server:gate.server.ServerName,target:gate.target,moduleParity:parity,integrity,testRuntimeLogins:logins,testSeedFingerprints:testState,mainFingerprints:mainState,mainWrites:0},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',database,modules:parity.modules,tables:testState.data.length,mainWrites:0}));
}finally{await Promise.allSettled([test?.close(),main?.close(),master?.close()]);}

// Recovery for an interrupted owned R8.2 run. Never resets/drops a database or disables protections.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {open,fingerprints,moduleParity,root} from '../../database/11_tests/r6-group-a/support.mjs';
import {preflight,identifier} from '../db/test-target.mjs';
import {restore} from './fixtures.mjs';
const option=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const out=path.resolve(option('output')||'');
assert.ok(out.startsWith(path.join(root,'docs/evidence/r8-2/runs')+path.sep));
assert.ok(!fs.existsSync(path.join(out,'crash-recovery.json')),'Never overwrite recovery evidence');
const load=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const context=load(path.join(out,'context.json')),gate=preflight(context.database);
assert.equal(option('confirm-target'),gate.confirmation);
const setup=load(path.join(out,'fixture-setup.json'));
const privateDir=setup.privateRecoveryDirectory;
assert.ok(path.basename(privateDir).startsWith('cinema-r82-secrets-'));
const privateState=load(path.join(privateDir,'setup-complete.private.json'));
assert.equal(privateState.database,context.database);assert.equal(privateState.guid,gate.target.database_guid);
assert.match(privateState.login,/^cinema_r82_[a-f0-9]{32}$/);
const guard=gate.sqlGuard;
const save=(name,data)=>{assert.ok(!fs.existsSync(path.join(out,name)),'No overwrite '+name);fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');};
let db,master,main;
try{
 db=await open(context.database,2);master=await open('master',1);main=await open('CinemaBookingDB',1);
 await restore(db,guard,load(path.join(privateDir,'seed-snapshot.private.json')),save);
 await db.request().batch(guard+`DROP USER ${identifier(privateState.login)};`);
 await master.request().batch(guard+`DROP LOGIN ${identifier(privateState.login)};`);
 const after=await fingerprints(db),before=load(path.join(out,'test-seed-before.json'));
 assert.deepEqual(after,before);
 const mainAfter=await fingerprints(main);assert.deepEqual(mainAfter,load(path.join(out,'main-before.json')));
 const parity=await moduleParity(db);assert.equal(parity.modules,159);
 save('crash-recovery.json',{status:'PASS',reason:'CDP test harness URL parser failed on Chrome data: image; process terminated outside finally',
  database:context.database,identity:gate.target,restoredDataAndMetadata:after,moduleParity:parity,loginDropped:true,userDropped:true,
  mainPreservation:'PASS',mainWrites:0,productionChangesForThisFailure:0});
 console.log(JSON.stringify({status:'PASS',database:context.database,cleanup:'PASS',mainPreservation:'PASS'}));
}finally{await Promise.allSettled([db?.close(),master?.close(),main?.close()]);}

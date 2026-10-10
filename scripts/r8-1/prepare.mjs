// Read-only target review and fresh evidence context for the R8.1 smoke harness.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {preflight} from '../db/test-target.mjs';
import {root} from '../db/lib.mjs';

const database=process.argv.find(x=>x.startsWith('--database='))?.slice(11);
assert.match(database||'',/^CinemaBookingDB_R0_R81_[A-Za-z0-9_]+$/,'Explicit R8.1 test database required');
const gate=preflight(database);
assert.ok(gate.target,'Build a new absent target using the R5 pipeline first');
const review={database,server:gate.server.ServerName,target:gate.target,confirmation:gate.confirmation,
 scope:'Read-only identity review; no fixture mutations; review this identity before smoke'};
if(!process.argv.includes('--check')) {
 const runID=new Date().toISOString().replaceAll(':','-').replace('.','-')+'-'+crypto.randomUUID().slice(0,8);
 const directory=path.join(root,'docs/evidence/r8-1/runs',runID);
 fs.mkdirSync(directory,{recursive:false});
 fs.writeFileSync(path.join(directory,'context.json'),JSON.stringify({runID,database,
  initialHEAD:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),
  target:gate.target,scope:'New readiness smoke; no frontend acceptance upgrade'},null,2)+'\n');
 fs.writeFileSync(path.join(directory,'target-review.json'),JSON.stringify(review,null,2)+'\n');
 review.output=path.relative(root,directory).replaceAll('\\','/');
 review.nextCommand=`node scripts/r8-1/smoke.mjs --output=${review.output} --confirm-target=${gate.confirmation}`;
}
console.log(JSON.stringify(review,null,2));

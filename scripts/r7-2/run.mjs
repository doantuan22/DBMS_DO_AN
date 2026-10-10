// Reviewed existing target must be newly built by the R5 pipeline for this task.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {root,write} from '../db/lib.mjs';
import {preflight,hash} from '../db/test-target.mjs';
const database=process.argv.find(s=>s.startsWith('--database='))?.slice(11);
const confirmation=process.argv.find(s=>s.startsWith('--confirm-target='))?.slice(17);
const gate=preflight(database);assert.ok(gate.target);assert.equal(confirmation,gate.confirmation,'Review the current existing-target identity before running fixtures.');
const pipeline=process.argv.find(s=>s.startsWith('--build-evidence='))?.slice(17);assert.ok(pipeline);
const build=JSON.parse(fs.readFileSync(path.resolve(root,pipeline),'utf8'));assert.equal(build.database,database);assert.equal(build.status,'PASS');assert.equal(build.mode,'build-test');assert.equal(build.targetIdentity.target.database_guid,gate.target.database_guid,'The reviewed target must retain the GUID created by this build.');
const run=path.join(root,'docs/evidence/r7-2/runs',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex'));fs.mkdirSync(run,{recursive:true});write(path.join(run,'preflight.json'),gate);
const files=['scripts/r6-group-c/harness.mjs','scripts/r21/fixtures.mjs',...fs.readdirSync(path.join(root,'scripts/r7-2')).filter(s=>s.endsWith('.mjs')).map(s=>'scripts/r7-2/'+s)];write(path.join(run,'source-hashes.json'),Object.fromEntries(files.map(s=>[s,hash(fs.readFileSync(path.join(root,s)))])));
const suite=process.argv.find(s=>s.startsWith('--suite='))?.slice(8)||'p1';assert.ok(['p1','p2','reproduce','apply'].includes(suite));
const file=suite==='apply'?'apply-contracts':suite==='p1'?'p1':'p2';
const child=spawnSync(process.execPath,['scripts/r7-2/'+file+'.mjs','--database='+database,...(suite==='reproduce'?['--reproduce']:[])],{cwd:root,encoding:'utf8',timeout:600000,env:{...process.env,R72_EVIDENCE_DIR:run,R72_SQL_GUARD:gate.sqlGuard}});write(path.join(run,suite+'.log'),(child.stdout||'')+(child.stderr||''));console.log(child.stdout);if(child.error)console.log(child.error.message);console.log('Evidence: '+run);process.exitCode=child.status??1;

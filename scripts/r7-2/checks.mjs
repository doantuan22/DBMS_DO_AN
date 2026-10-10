import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {root,write} from '../db/lib.mjs';
const run=path.join(root,'docs/evidence/r7-2/runs',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex'));fs.mkdirSync(run,{recursive:true});
const result={status:'RUNNING',startedAt:new Date().toISOString(),checks:[]};
function check(id,args,cwd=root){const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:300000});write(path.join(run,id+'.log'),(r.stdout||'')+(r.stderr||''));const item={id,args,cwd:path.relative(root,cwd)||'.',exitCode:r.status,status:r.status===0?'PASS':'FAIL'};const counts=Object.fromEntries([...(r.stdout||'').matchAll(/^# (tests|pass|fail|cancelled|skipped) (\d+)$/gm)].map(m=>[m[1],Number(m[2])]));Object.assign(item,counts);result.checks.push(item);write(path.join(run,'checks.json'),result);assert.equal(r.status,0,id+' failed; review preserved log.');console.log(id+' PASS '+JSON.stringify(counts));}
try{
 check('targeted-backend',['--test','--test-reporter=tap','tests/feedbackService.test.js','tests/feedbackValidator.test.js','tests/managerService.test.js','tests/supportService.test.js','tests/adminService.test.js','tests/r3bAuthorization.test.js','tests/r7-contract.test.js'],path.join(root,'backend'));
 check('full-backend',['--test','--test-reporter=tap','tests/**/*.test.js'],path.join(root,'backend'));
 check('no-sql',['scripts/audit-no-sql.mjs']);
 // Redirect the existing read-only contract checker output, keeping previous audit artifacts intact.
 const original=new URL('../db/contract-check.mjs',import.meta.url);let source=fs.readFileSync(original,'utf8');
 source=source.replace('{dbRoot,audit,read,write}','{dbRoot,read,write}');source='const audit='+JSON.stringify(run)+';\n'+source;
 source=source.replace(/(['"])(\.\.?\/[^'"]+)\1/g,(_,q,s)=>q+new URL(s,original).href+q);
 check('typed-contracts',['--input-type=module','-e',source]);result.status='PASS';
}catch(error){result.status='FAIL';result.error=error.message;process.exitCode=1;}
finally{result.completedAt=new Date().toISOString();write(path.join(run,'checks.json'),result);console.log('Evidence: '+run);}

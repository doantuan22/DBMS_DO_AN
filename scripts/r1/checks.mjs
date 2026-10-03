import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, write } from '../db/lib.mjs';
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const checks=[
 ['backend',['--test','tests/**/*.test.js'],'backend'],
 ['frontend',['--test','--test-concurrency=1','tests/*.test.js'],'frontend'],
 ['frontend-build',[path.join(root,'frontend/node_modules/vite/bin/vite.js'),'build'],'frontend'],
 ['frontend-lint',[npm,'run','lint'],'frontend'],
 ['no-raw-sql',['scripts/audit-no-sql.mjs'],''],
 ['procedure-contracts',['scripts/db/contract-check.mjs'],''],
];
const results=[];
for(const [name,args,area] of checks) {
 const result=spawnSync(process.execPath,args,{cwd:path.join(root,area),encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000});
 const output=(result.stdout||'')+(result.stderr||'');
 write(path.join(root,`audit/remediation/evidence/${name}-final.txt`),output);
 results.push({name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,summary:output.match(/(?:tests|pass|fail) \d+|PASS[^\r\n]*|NO RAW BUSINESS SQL IN BACKEND = PASS/g)});
 console.log(`${result.status===0?'PASS':'FAIL'} ${name}`);
 if(result.status!==0)console.error(output.slice(-5000));
}
write(path.join(root,'audit/remediation/evidence/checks-final.json'),results);
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;

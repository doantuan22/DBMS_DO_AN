import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,evidenceRoot,write,read } from './common.mjs';
disposable();const only=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7).split(',');
const previous=only?JSON.parse(read(path.join(evidenceRoot,'checks.json'))):null;
if(previous&&previous.database!==database) throw new Error('Retry requires the same test database.');
const report={database,startedAt:new Date().toISOString(),checks:previous?structuredClone(previous.checks):[],...(previous?{history:[...(previous.history??[]),{startedAt:previous.startedAt,completedAt:previous.completedAt,status:previous.status,checks:structuredClone(previous.checks)}]}:{})};
const commands=[
 ['backend',['--test','tests/**/*.test.js'],path.join(root,'backend')],
 ['frontend',['--test','--test-concurrency=1','tests/*.test.js'],path.join(root,'frontend')],
 ['no-sql',['scripts/audit-no-sql.mjs'],root],
 ['frontend-lint',['node_modules/oxlint/bin/oxlint'],path.join(root,'frontend')],
 ['frontend-build',['node_modules/vite/bin/vite.js','build'],path.join(root,'frontend')],
 ['procedure-contract',['scripts/db/contract-check.mjs'],root],
 ['booking-sql',['scripts/r22/sql-tests.mjs',`--database=${database}`],root],
 ['booking-http',['scripts/r22/api-tests.mjs',`--database=${database}`],root],
 ['promotion-concurrency',['database/11_tests/concurrency/promotion-atomicity.mjs',`--database=${database}`],root],
 ['promotion-browser',['scripts/r22/browser.mjs'],root],
 ['r21-regression',['scripts/r22/r21-regression.mjs',`--database=${database}`],root],
 ['r1-regression',['scripts/r22/r1-regression.mjs',`--database=${database}`],root],
 ['sql-regression',['scripts/db/run.mjs','test',`--database=${database}`],root],
 ['sql-verification',['scripts/db/run.mjs','verify',`--database=${database}`],root],
];
for(const [name,args,cwd] of commands) {
 if(only&&!only.includes(name)) continue;
 const result=spawnSync(process.execPath,args,{cwd,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
 const output=(result.stdout??'')+(result.stderr??'');write(path.join(evidenceRoot,name+'.txt'),output);
 const tests=output.match(/(?:ℹ|#) tests (\d+)/)?.[1],skipped=output.match(/(?:ℹ|#) skipped (\d+)/)?.[1];
 const entry={name,status:result.status===0?'PASS':'FAIL',exitCode:result.status,command:['node',...args].join(' '),...(tests?{tests:Number(tests),skipped:Number(skipped)}:{}),...(result.error?{error:result.error.message}:{})};
 const i=report.checks.findIndex(row=>row.name===name);if(i<0) report.checks.push(entry);else report.checks[i]=entry;
 console.log(`${entry.status} ${name}${tests?`: ${tests} tests, ${skipped} skipped`:''}`);
 if(name==='procedure-contract'&&result.status===0) write(path.join(evidenceRoot,'procedure-contract.json'),read(path.join(root,'database/_audit/backend-contract-check.json')));
 if(['sql-regression','sql-verification'].includes(name)&&result.status===0) {
  const mode=name==='sql-regression'?'test':'verify';write(path.join(evidenceRoot,name+'-detail.txt'),read(path.join(root,`database/_audit/${mode}-${database}.log`)).replace(/\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}/g,'[demo password hash redacted]'));
  if(mode==='verify') write(path.join(evidenceRoot,'source-parity.json'),read(path.join(root,`database/_audit/verify-${database}.json`)));
 }
 report.status=report.checks.every(row=>row.status==='PASS'&&(row.skipped??0)===0)?'PASS':'FAIL';write(path.join(evidenceRoot,'checks.json'),report);
}
report.completedAt=new Date().toISOString();write(path.join(evidenceRoot,'checks.json'),report);if(report.status!=='PASS') process.exitCode=1;

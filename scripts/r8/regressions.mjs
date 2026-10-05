import { assert,path,root,dbRoot,read,save,run,fixture,fixtures,out } from './common.mjs';
const database=fixture(process.argv.find(arg=>arg.startsWith('--database='))?.slice(11)??fixtures[0]);
const relative=path.relative(root,out).replaceAll('\\','/');
const tasks=[
 ['r1-r2',['scripts/r2/checks.mjs',`--database=${database}`],{R2_EVIDENCE_DIR:relative+'/r1-r2'},[path.join(dbRoot,'_audit/backend-contract-check.json')]],
 ['r3-authorization',['scripts/r3b/probes.mjs',`--database=${database}`],{R3B_EVIDENCE_DIR:relative+'/r3'}],
 ['r3-browser',['scripts/r3b/browser.mjs'],{R3B_EVIDENCE_DIR:relative+'/r3'}],
 ['r4-functional',['scripts/r4/integration.mjs',`--database=${database}`],{R4_EVIDENCE_DIR:relative+'/r4'}],
 ['r4-browser',['scripts/r3b/browser.mjs'],{R4_BROWSER:'1',R3B_EVIDENCE_DIR:relative+'/r4'}],
 ['r5-validation',['scripts/r5/integration.mjs',`--database=${database}`],{},[path.join(root,'audit/remediation/r5/evidence/r5-integration.json')]],
 ['r5-integrity',['scripts/r5/supplemental.mjs',`--database=${database}`],{},[path.join(root,'audit/remediation/r5/evidence/supplemental.json')]],
 ['r7-browser',['scripts/r7/browser.mjs'],{R3B_EVIDENCE_DIR:relative+'/r7'}],
];
const report={status:'RUNNING',database,checks:[]};
try {
 for(const [name,args,env,legacy=[]] of tasks){report.checks.push(run(name,args,{env,legacy}));save('regressions.json',report);console.log('PASS '+name);}
 const core=JSON.parse(read(path.join(out,'r1-r2/checks.json')));assert.equal(core.status,'PASS');assert.equal(core.checks.length,16);
 for(const name of ['backend','frontend','frontend-build','frontend-lint','no-raw-sql','procedure-contracts'])save(({backend:'backend-tests',frontend:'frontend-tests'}[name]??name)+'.txt',read(path.join(out,`r1-r2/${name}.txt`)));
 for(const name of ['verify','backend-smoke','concurrency'])save(`regression-${name}.json`,read(path.join(dbRoot,'_audit',`${name}-${database}.json`)));
 report.status='PASS';save('regressions.json',report);
}catch(error){report.status='FAIL';report.error=error.message;save('regressions.json',report);throw error;}

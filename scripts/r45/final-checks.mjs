import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,read,write,evidenceRoot} from './common.mjs';
const json=name=>JSON.parse(read(path.join(evidenceRoot,name+'.json')));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const checks=json('checks'),auth=json('auth-tests'),browser=json('browser'),main=json('main-unchanged');
for(const name of ['audit-before','checks','auth-tests','browser','main-unchanged'])assert.equal(json(name).status,'PASS',name);
assert.ok(checks.checks.length>0&&checks.checks.every(row=>row.status==='PASS'&&row.exitCode===0));
assert.equal(checks.r41Reproducibility.status,'PASS');assert.equal(checks.r41Reproducibility.runs,3);
assert.equal(checks.testDatabaseCleanup,'PASS');assert.equal(checks.sourceInputsUnchanged,'PASS');
assert.deepEqual(checks.testDatabaseBefore,checks.testDatabaseAfter);
for(const row of checks.checks.filter(row=>row.tests)){
 assert.equal(row.pass,row.tests);for(const key of ['fail','cancelled','skipped','todo'])assert.equal(row[key],0);
}
assert.equal(auth.cleanup,'PASS');assert.equal(browser.cleanup,'PASS');
assert.ok(auth.cases.length>0&&auth.cases.every(row=>row.status==='PASS'));
assert.ok(browser.result.checks.length>0&&browser.result.checks.every(row=>row.status==='PASS'));
assert.equal(auth.trustProxy,false);assert.equal(json('audit-before').trustProxy,false);
assert.deepEqual(auth.policy,{windowMs:60000,loginMax:20,registerMax:10,maxKeys:10000});
assert.deepEqual(auth.policy,browser.policy);
assert.ok(auth.requests.some(row=>row.status===429&&row.retryAfter==='60'));
assert.ok(auth.requests.some(row=>row.status===429&&row.retryAfter==='1'));
assert.ok(auth.cases.filter(row=>row.name.includes('beyond production threshold')).every(row=>row.downstreamBefore===row.downstreamAfter&&row.allRowsUnchanged));
assert.equal(main.dataAndMetadataUnchanged,'PASS');assert.deepEqual(main.changedModules,[]);
assert.deepEqual(main.after,json('audit-before').main);
for(const phase of ['r42','r43','r44']){
 for(const file of fs.readdirSync(path.join(evidenceRoot,'regression',phase)).filter(file=>file.endsWith('.json'))){
  const evidence=JSON.parse(read(path.join(evidenceRoot,'regression',phase,file)));
  assert.equal(evidence.status,'PASS',phase+'/'+file);assert.equal(evidence.cleanup,'PASS',phase+'/'+file);
 }
}
const protectedBefore=json('preserved-before');
const allowed=['backend/src/app.js','backend/src/config/env.js','backend/.env.example','docs/FULL_SYSTEM_AUDIT.md'],changed=[];
for(const [file,hash] of Object.entries(protectedBefore)){
 assert.ok(fs.existsSync(path.join(root,file)),`Original file deleted: ${file}`);
 if(sha(file)!==hash){assert.ok(allowed.includes(file),`Out-of-scope modified file: ${file}`);changed.push(file);}
}
assert.deepEqual(changed.sort(),[...allowed].sort());
const all=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const added=all.filter(file=>!Object.hasOwn(protectedBefore,file));
const newFiles=['backend/src/middleware/authRateLimit.js','backend/tests/authRateLimit.test.js','frontend/tests/auth-rate-limit.test.js','frontend/tests/r45-browser-fixture.jsx','docs/contracts/AUTH_RATE_LIMITING.md','docs/evidence/R4_AUTH_RATE_LIMITING.md'];
for(const file of added)assert.ok(file.startsWith('scripts/r45/')||file.startsWith('docs/evidence/r45/')||newFiles.includes(file),`Out-of-scope new file: ${file}`);
for(const [file,hash] of Object.entries(checks.sourceInputs))assert.equal(sha(file),hash,`Current tested source differs: ${file}`);
const normalize=source=>source.replaceAll('\r\n','\n');
const beforeSource=file=>normalize(read(path.join(evidenceRoot,'before-source',file)));
const currentSource=file=>normalize(read(path.join(root,file)));
const expectedApp=beforeSource('backend/src/app.js')
 .replace("import { env } from './config/env.js';","import { env } from './config/env.js';\nimport { createAuthRateLimiter } from './middleware/authRateLimit.js';")
 .replace('export function createApp() {','export function createApp({ authRateLimit } = {}) {')
 .replace('  app.use(express.json());',"  app.use('/api/auth', createAuthRateLimiter(authRateLimit));\n  app.use(express.json());");
assert.equal(currentSource('backend/src/app.js'),expectedApp,'App change outside isolated auth middleware');
const helper="\nconst positiveInt = (name, fallback) => {\n  const value = process.env[name];\n  if (value === undefined || value === '') return fallback;\n  if (!/^[1-9]\\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {\n    throw new Error(`${name} must be a positive safe integer.`);\n  }\n  return Number(value);\n};\n";
const policy="  authRateLimit: Object.freeze({\n    windowMs: positiveInt('AUTH_RATE_LIMIT_WINDOW_MS', 60000),\n    loginMax: positiveInt('AUTH_RATE_LIMIT_LOGIN_MAX', 20),\n    registerMax: positiveInt('AUTH_RATE_LIMIT_REGISTER_MAX', 10),\n    maxKeys: positiveInt('AUTH_RATE_LIMIT_MAX_KEYS', 10000),\n  }),\n";
const expectedEnv=beforeSource('backend/src/config/env.js').replace('\nexport const env =',helper+'\nexport const env =').replace("  db: Object.freeze({",policy+"  db: Object.freeze({");
assert.equal(currentSource('backend/src/config/env.js'),expectedEnv,'Existing DB/JWT/global configuration changed');
const settings="\n# Task 13: per-client/per-endpoint fixed-window HTTP guard; positive integers.\nAUTH_RATE_LIMIT_WINDOW_MS=60000\nAUTH_RATE_LIMIT_LOGIN_MAX=20\nAUTH_RATE_LIMIT_REGISTER_MAX=10\nAUTH_RATE_LIMIT_MAX_KEYS=10000\n";
assert.equal(currentSource('backend/.env.example'),beforeSource('backend/.env.example').replace('NODE_ENV=development\n','NODE_ENV=development\n'+settings));
assert.ok(currentSource('docs/FULL_SYSTEM_AUDIT.md').endsWith(beforeSource('docs/FULL_SYSTEM_AUDIT.md').replace(/^# FULL SYSTEM AUDIT\n\n/,'')),'Historical audit text changed');
const previous=JSON.parse(read(path.join(root,'docs/evidence/r44/current-audit-status.json'))),status=structuredClone(previous);
Object.assign(status,{at:new Date().toISOString(),phase:'R4.5',status:'PASS',base:'Accepted working state after Task 12, pending source and all prior evidence preserved',changedUseCases:[],resolvedIssues:['I-18']});
const issue=status.findings.issues.find(row=>row.id==='I-18');assert.equal(issue.status,'ACTIVE');
Object.assign(issue,{status:'RESOLVED R4.5',evidence:'docs/contracts/AUTH_RATE_LIMITING.md; docs/evidence/R4_AUTH_RATE_LIMITING.md; docs/evidence/r45/{auth-tests,browser,checks,main-unchanged,final-checks}.json',resolution:'Only roadmap R4.5 Login/Register rate-policy scope resolved: per-app bounded in-memory IP/endpoint counters before JSON parsing, default20/10 requests per minute,429/Retry-After, no forwarded-header bypass under unchanged trust proxy=false. Unit boundaries/expiry/short-circuit, real HTTP/SQL four-role/JWT/register, browser manual retry and clean full regression PASS.',impact:'Existing JWT/session/password/RBAC contracts preserved. Server logout revocation remains unsupported and explicitly outside R4.5, rather than claimed as implemented. All UC grades and other findings unchanged.',remainingOutsideR45:'No server token revocation, denylist, refresh tokens or distributed protection; not requested by R4.5.'});
status.findings.baseline.active=status.findings.issues.filter(row=>row.status==='ACTIVE').length;
status.findings.baseline.resolved=status.findings.issues.filter(row=>row.status.startsWith('RESOLVED')).length;
status.findings.severity={CRITICAL:0,HIGH:0,MEDIUM:0,LOW:0};for(const row of status.findings.issues.filter(row=>row.status==='ACTIVE'))status.findings.severity[row.severity]++;
assert.deepEqual(status.matrix,previous.matrix);
assert.deepEqual(status.findings.issues.filter(row=>row.id!=='I-18'),previous.findings.issues.filter(row=>row.id!=='I-18'));
write(path.join(evidenceRoot,'current-audit-status.json'),status);
execFileSync('git',['diff','--check'],{cwd:root});
for(const file of all.filter(file=>file.startsWith('scripts/r45/')&&file.endsWith('.mjs')))execFileSync(process.execPath,['--check',path.join(root,file)]);
const patch=changed.map(file=>{try{return execFileSync('git',['diff','--no-index','--',path.join(evidenceRoot,'before-source',file),path.join(root,file)],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){assert.equal(e.status,1);return String(e.stdout);}}).join('\n');
write(path.join(evidenceRoot,'source-changes.patch'),patch);
for(const reportFile of ['docs/evidence/R4_AUTH_RATE_LIMITING.md','docs/contracts/AUTH_RATE_LIMITING.md']){
 for(const match of read(path.join(root,reportFile)).matchAll(/\]\(([^)]+)\)/g)){
  const target=path.resolve(root,path.dirname(reportFile),match[1]);
  assert.ok(target===path.join(evidenceRoot,'final-checks.json')||fs.existsSync(target),`Broken evidence link: ${match[1]}`);
 }
}
const result={at:new Date().toISOString(),phase:'R4.5',status:'PASS',policy:auth.policy,changedOriginalFiles:changed,addedFiles:added,preservedOriginalFiles:Object.keys(protectedBefore).length-changed.length,priorTasks9To12AndR0ToR44Preserved:'PASS',testedSourceMatchesCurrent:'PASS',authFocusedTests:checks.checks.find(row=>row.name==='auth-focused').tests,backendTests:checks.r41Reproducibility.tests,backendRuns:checks.r41Reproducibility.runs,frontendTests:checks.checks.find(row=>row.name==='frontend-test').tests,authSqlHttpCases:auth.cases.length,authHttpRequests:auth.requests.length,authBrowserChecks:browser.result.checks.length,mainTables:main.tables,mainModuleParity:main.moduleParity,changedDatabaseModules:[],mainDataAndMetadataPreserved:'PASS',testDatabaseCleanup:'PASS',useCaseGradesUnchanged:status.matrix.rows.length,onlyResolvedFinding:'I-18 rate-policy scope',gitDiffCheck:'PASS',syntax:'PASS',scope:'Only I-18/R4.5: POST login/register HTTP guard and configuration, tests, contract/evidence. Auth business/SQL/Frontend production unchanged. Stop before R4.6.'};
write(path.join(evidenceRoot,'final-checks.json'),result);
console.log(`PASS final R4.5: ${result.backendTests} Backend x${result.backendRuns}, ${result.authFocusedTests} auth-focused, ${result.frontendTests} Frontend, ${result.authSqlHttpCases} real SQL/HTTP cases/${result.authHttpRequests} requests, ${result.authBrowserChecks} browser checks; ${result.preservedOriginalFiles} original files preserved.`);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync,spawn } from 'node:child_process';
import { disposable,database,root,env,connect,snapshot,summarize,write,read,evidenceRoot } from './common.mjs';
disposable();
const sourceOnly=fs.mkdtempSync(path.join(os.tmpdir(),'dbms-r42-regression-'));
const sourceRoots=['backend','shared','database','scripts','package.json'];
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard','--',...sourceRoots],{cwd:root,encoding:'utf8'}).split('\0').filter(file=>file&&!file.startsWith('database/_audit/')&&!file.startsWith('database/_legacy_snapshot/'));
const hashes={};
for(const file of files){const value=fs.readFileSync(path.join(root,file));hashes[file]=crypto.createHash('sha256').update(value).digest('hex');const target=path.join(sourceOnly,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
const report={database,startedAt:new Date().toISOString(),sourceOnly,checks:[],sourceInputs:hashes,status:'RUNNING',source:'Current versioned source plus proposed R4.2/R4.1 files; no .env, audit/evidence or node_modules copied; byte-identical working source.'};
const npmCli=process.env.npm_execpath??path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const commandEnv={...process.env,...env,DB_DATABASE:database,FORCE_COLOR:'0'},unitEnv={...commandEnv};
for(const key of Object.keys(unitEnv))if(/^(DB_|JWT_|DOTENV_|NODE_OPTIONS$|NODE_PATH$|NODE_ENV$|TZ$)/i.test(key))delete unitEnv[key];
async function command(name,args,cwd=sourceOnly,environment=commandEnv){
 const startedAt=new Date().toISOString();
 const r=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.setEncoding('utf8').on('data',s=>{stdout+=s;});child.stderr.setEncoding('utf8').on('data',s=>{stderr+=s;});child.once('error',reject);child.once('close',(exitCode,signal)=>resolve({exitCode,signal,stdout,stderr}));});
 write(path.join(evidenceRoot,name+'.txt'),JSON.stringify({executable:process.execPath,args,cwd,exitCode:r.exitCode,signal:r.signal})+'\n'+r.stdout+'\n'+r.stderr);
 const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const match=new RegExp(`^(?:ℹ |# )${key} (\\d+)$`,'m').exec(r.stdout);if(match)counts[key]=Number(match[1]);}
 const row={name,args,cwd,startedAt,finishedAt:new Date().toISOString(),exitCode:r.exitCode,status:r.exitCode===0?'PASS':'FAIL',...counts};report.checks.push(row);write(path.join(evidenceRoot,'checks.json'),report);console.log(`${row.status} ${name}${counts.tests?`: ${counts.pass}/${counts.tests},skip=${counts.skipped}`:''}`);
 assert.equal(r.exitCode,0,`${name}: see ${name}.txt`);if(counts.tests){assert.equal(counts.pass,counts.tests);for(const key of ['fail','cancelled','skipped','todo'])assert.equal(counts[key],0);}
 return row;
}
try{
 for(const file of ['backend/.env','backend/node_modules','database/_audit','docs/evidence'])assert.equal(fs.existsSync(path.join(sourceOnly,file)),false,file);
 const pool=await connect();let before;try{before=await snapshot(pool);}finally{await pool.close();}
 await command('clean-npm-ci',[npmCli,'ci','--no-audit','--no-fund'],path.join(sourceOnly,'backend'),unitEnv);
 await command('backend',[npmCli,'test'],path.join(sourceOnly,'backend'),unitEnv);
 await command('backend-repeat',[npmCli,'test'],path.join(sourceOnly,'backend'),unitEnv);
 const testFiles=files.filter(file=>/^backend\/tests\/.*\.test\.js$/.test(file)).map(file=>file.slice('backend/'.length)).sort().reverse();
 await command('backend-reverse',['--test','--test-reporter=spec','--test-concurrency=1',...testFiles],path.join(sourceOnly,'backend'),unitEnv);
 const backendRuns=report.checks.filter(row=>row.name.startsWith('backend'));assert.ok(backendRuns.length===3&&backendRuns.every(row=>row.tests===backendRuns[0].tests));
 assert.equal(fs.existsSync(path.join(sourceOnly,'database/_audit')),false);assert.equal(fs.existsSync(path.join(sourceOnly,'backend/.env')),false);
 report.r41Reproducibility={status:'PASS',node:process.version,npm:execFileSync(process.execPath,[npmCli,'--version'],{encoding:'utf8'}).trim(),install:'npm ci',auditAbsentDuringBackendRuns:true,envFileAbsent:true,tests:backendRuns[0].tests,runs:3};
 const commands=[
  ['no-sql',['scripts/audit-no-sql.mjs']],
  ['procedure-contract',['scripts/db/contract-check.mjs']],
  ['admin-report',['scripts/r42/report-tests.mjs',`--database=${database}`]],
  ['r33-sql',['scripts/r33/sql-tests.mjs',`--database=${database}`]],
  ['r32-sql',['scripts/r32/sql-tests.mjs',`--database=${database}`]],
  ['r31-sql',['scripts/r31/sql-tests.mjs',`--database=${database}`]],
  ['r22-sql',['scripts/r22/sql-tests.mjs',`--database=${database}`]],
  ['r21-sql',['scripts/r21/sql-tests.mjs',`--database=${database}`]],
  ['r11-sql',['scripts/r11/sql-tests.mjs',`--database=${database}`]],
  ['r12-sql',['scripts/r12/sql-tests.mjs',`--database=${database}`]],
  ['database-tests',['scripts/db/run.mjs','test',`--database=${database}`]],
  ['database-verify',['scripts/db/run.mjs','verify',`--database=${database}`]],
 ];
 for(const [name,args] of commands)await command(name,args);
 for(const phase of ['r11','r12','r21','r22','r31','r32','r33']){const dir=path.join(sourceOnly,'docs/evidence',phase);if(fs.existsSync(dir))fs.cpSync(dir,path.join(evidenceRoot,'regression',phase),{recursive:true});}
 for(const file of ['sql-tests.json','api-tests.json']){const value=JSON.parse(read(path.join(sourceOnly,'docs/evidence/r42',file)));assert.equal(value.status,'PASS');write(path.join(evidenceRoot,file),value);}
 for(const file of ['backend-contract-check.json',`test-${database}.log`,`verify-${database}.log`,`verify-${database}.json`]){
  const input=path.join(sourceOnly,'database/_audit',file);assert.ok(fs.existsSync(input),file);write(path.join(evidenceRoot,file),read(input).replace(/\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}/g,'[demo hash redacted]'));
 }
 for(const [file,hash] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceOnly,file))).digest('hex'),hash,file);
 const afterPool=await connect();try{const after=await snapshot(afterPool);assert.deepEqual(summarize(after),summarize(before));report.testDatabaseBefore=summarize(before);report.testDatabaseAfter=summarize(after);report.testDatabaseCleanup='PASS';}finally{await afterPool.close();}
 report.sourceInputsUnchanged='PASS';report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{report.finishedAt=new Date().toISOString();write(path.join(evidenceRoot,'checks.json'),report);}

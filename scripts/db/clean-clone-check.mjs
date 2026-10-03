import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root,dbRoot,audit,credentials,read,write } from './lib.mjs';

// Fresh source-only directory: no .env, node_modules, backup, audit or legacy SQL copied.
const target=path.join(root,'.r0-clean-clone');
if(fs.existsSync(target))throw new Error('Clean clone scratch directory already exists; refusing overwrite.');
fs.mkdirSync(path.join(target,'backend'),{recursive:true});
fs.cpSync(dbRoot,path.join(target,'database'),{recursive:true,filter:p=>!['_audit','_legacy_snapshot'].includes(path.basename(p))});
fs.cpSync(path.join(root,'scripts/db'),path.join(target,'scripts/db'),{recursive:true});
fs.copyFileSync(path.join(root,'package.json'),path.join(target,'package.json'));
fs.copyFileSync(path.join(root,'backend/.env.example'),path.join(target,'backend/.env.example'));
const env=credentials();
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11)||'CinemaBookingDB_R0_Clone';
if(!/^CinemaBookingDB_R0_[A-Za-z0-9_]+$/.test(database))throw new Error('Clean clone requires a disposable R0 target.');
const result=spawnSync(process.execPath,['scripts/db/run.mjs','build',`--database=${database}`,'--seed-date=2026-10-03'],{cwd:target,env:{...process.env,...env},encoding:'utf8',maxBuffer:32*1024*1024});
write(path.join(audit,'clean-clone-check.json'),{status:result.status===0?'PASS':'FAIL',database,sourceOnly:true,ignoredFilesCopied:false,nodeModulesNeededForDatabaseBuild:false,output:result.stdout+result.stderr,at:new Date().toISOString()});
console.log(result.stdout+result.stderr);
process.exitCode=result.status??1;

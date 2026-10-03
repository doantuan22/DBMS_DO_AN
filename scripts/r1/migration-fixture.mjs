// Replay the pinned, pre-R1 source into a NEW disposable database for migration tests.
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,sqlcmd} from '../db/lib.mjs';
const commit='9867d15ba93f73dd8afcd618f99ab1c226289e11';
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
if(!/^CinemaBookingDB_R0_R1_[A-Za-z0-9_]+$/.test(database||''))throw Error('New disposable R1 migration fixture required.');
const expand=file=>{const result=spawnSync('git',['show',`${commit}:database/${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw Error('Pinned R0 source unavailable: '+file);return result.stdout.replace(/^:on error exit\s*$/gm,'').replace(/^:r\s+\.\/(.+)$/gm,(_,ref)=>expand(ref.trim()));};
sqlcmd(expand('run-all.sql').replaceAll('CinemaBookingDB',database).replaceAll('$(SeedDate)','2026-10-03'),{database:'master',file:true});
console.log(`PASS pinned R0 migration fixture built: ${database}`);

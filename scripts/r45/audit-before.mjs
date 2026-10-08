import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,database,connect,snapshot,summarize,read,write,evidenceRoot} from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(f=>f&&!f.startsWith('scripts/r45/')&&!f.startsWith('docs/evidence/r45/'));
write(path.join(evidenceRoot,'preserved-before.json'),Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])));
for(const file of ['backend/src/app.js','backend/src/config/env.js','backend/.env.example','docs/FULL_SYSTEM_AUDIT.md'])write(path.join(evidenceRoot,'before-source',file),read(path.join(root,file)));
process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const app=createApp(),server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const pool=await connect();
try{
 const before=await snapshot(pool),requests=[];
 for(const [endpoint,count] of [['login',22],['register',12]]){
  for(let i=0;i<count;i++){
   const response=await fetch(`http://127.0.0.1:${server.address().port}/api/auth/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
   const payload=await response.json();assert.equal(response.status,400);assert.equal(payload.error.code,'INVALID_REQUEST');
   requests.push({endpoint,status:response.status,error:payload.error.code});
  }
 }
 assert.deepEqual(summarize(await snapshot(pool)),summarize(before));
 write(path.join(evidenceRoot,'audit-before.json'),{status:'PASS',at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),baseline:'Current working state after Task 12 including pending Tasks 9–12; all prior source/evidence frozen.',database,main:summarize(before),express:JSON.parse(read(path.join(root,'backend/node_modules/express/package.json'))).version,trustProxy:app.get('trust proxy'),existingLimiter:false,requests,middlewareOrder:['helmet','cors','express.json','/api routes','notFound','errorHandler'],responseConvention:'{error:{code,message}} via existing HttpError/errorHandler',frontendCompatibility:'Login/Register preserve form, finally clear busy, display generic retry error for429; httpClient throws status/code, no automatic retry; no FE change needed',decisions:{windowMs:60000,loginMax:20,registerMax:10,maxKeys:10000,key:'endpoint + Express req.ip; IPv4-mapped normalized, IPv6 /64',placement:'auth prefix, explicit POST login/register guard before JSON parsing',state:'factory per app, bounded ordered Map, opportunistic expiry; no timers/external storage',proxy:'Keep default trust proxy=false; forged forwarded headers ignored'},plannedExistingFiles:['backend/src/app.js','backend/src/config/env.js','backend/.env.example','docs/FULL_SYSTEM_AUDIT.md']});
 console.log('PASS before: 22 login/12 register requests all400, no existing rate protection; trust proxy=false; prior source/main fingerprint frozen.');
}finally{await new Promise(r=>server.close(r));await pool.close();}

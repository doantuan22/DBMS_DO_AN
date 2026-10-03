import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { root,audit,credentials,write } from './lib.mjs';

const env=credentials();
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11)||env.DB_DATABASE||'CinemaBookingDB';
if(env.DB_USER!=='sa' && !process.argv.includes('--allow-app-user'))throw new Error('R0 DEV integration requires DB_USER=sa. Configure its password in environment.');
if(!env.DB_PASSWORD)throw new Error('DB_PASSWORD is required.');
Object.assign(process.env,env,{DB_DATABASE:database,JWT_SECRET:env.JWT_SECRET||crypto.randomBytes(48).toString('base64url')});
process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js');
const {closePool}=await import('../../backend/src/db/pool.js');
const server=createApp().listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
const results=[];
async function request(route,{token,body}={}) {
 const response=await fetch(base+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 assert.equal(response.status,200,`${route}: ${JSON.stringify(data)}`);
 results.push({route,status:response.status});
 return data.data??data;
}
try {
 await request('/health');
 const health=await request('/health/db');
 assert.equal(health.ok,true);
 assert.equal(health.database,database);
 const {movies}=await request('/movies');
 assert.ok(movies.length>0);
 const movie=movies[0];
 await request(`/movies/${movie.id}`);
 const {showtimes:shows}=await request(`/movies/${movie.id}/showtimes`);
 assert.ok(shows.length>0,'SeedDate must supply future shows.');
 await request(`/showtimes/${shows[0].id}`);
 await request(`/showtimes/${shows[0].id}/seats`);
 await request('/cinemas');await request('/genres');await request('/products');
 for(const [role,email] of [['customer','khachhang1@gmail.com'],['manager','manager.q1@cinemadb.vn'],['support','cskh@cinemadb.vn'],['admin','admin@cinemadb.vn']]) {
  const login=await request('/auth/login',{body:{Email:email,MatKhau:'123456'}});
  assert.ok(login.token,`${role}: missing JWT`);
  await request('/auth/me',{token:login.token});
  const routes={customer:['/orders','/complaints'],manager:['/manager/cinemas','/manager/cinemas/1/rooms','/manager/cinemas/1/showtimes','/manager/cinemas/1/dashboard','/manager/cinemas/1/revenue'],support:['/support/complaints'],admin:['/admin/dashboard','/admin/users','/admin/roles','/admin/permissions','/admin/cinemas','/admin/movies','/admin/reports/revenue']};
  for(const route of routes[role])await request(route,{token:login.token});
 }
 if(process.argv.includes('--stress')) {
  if(!database.startsWith('CinemaBookingDB_R0_'))throw new Error('Stress fixtures require a disposable CinemaBookingDB_R0_* database.');
  const stress=[];
  for(const [file,args] of [['booking-stress.mjs',['--customers=4','--seat-requests=24','--overlap-requests=32','--burst=4','--movie-id=4']],['pricing-overlap-stress.mjs',['--rounds=4','--parallel=2']],['cinema-image-lock-stress.mjs',['--rounds=1','--requests=40','--concurrency=4']]]) {
   const result=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(root,'database/11_tests/concurrency',file),'--email=admin@cinemadb.vn',`--base-url=${base}`,...args],{env:{...process.env,STRESS_ADMIN_PASSWORD:'123456',STRESS_CONFIRM_DISPOSABLE:'yes'}});
    let log='';child.stdout.on('data',chunk=>{log+=chunk;});child.stderr.on('data',chunk=>{log+=chunk;});child.on('error',reject);child.on('exit',code=>resolve({file,code,log}));
   });
   stress.push(result);console.log(`${result.code===0?'PASS':'FAIL'} concurrency ${file}`);
  }
  write(path.join(audit,`concurrency-${database}.json`),stress);
  assert.ok(stress.every(s=>s.code===0),'Concurrency check failed; see saved report.');
 }
 write(path.join(audit,`backend-smoke-${database}.json`),{status:'PASS',database,connectionUser:env.DB_USER,health,requests:results,at:new Date().toISOString(),note:'Read-only HTTP integration. SQL write flows tested with rollback in 11_tests/procedures/smoke.sql.'});
 console.log(`PASS HTTP backend smoke: ${results.length} requests; login=${env.DB_USER}; database=${database}`);
} catch(error) {
 write(path.join(audit,`backend-smoke-${database}.json`),{status:'FAIL',database,connectionUser:env.DB_USER,requests:results,error:error.message,at:new Date().toISOString()});
 console.error(error.message);process.exitCode=1;
} finally {
 await new Promise(resolve=>server.close(resolve));await closePool();
}

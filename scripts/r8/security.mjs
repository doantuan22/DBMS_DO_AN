import crypto from 'node:crypto';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {credentials,walk} from '../db/lib.mjs';
import {assert,fs,path,root,fixture,fixtures,connect,ask,sql,save,load} from './common.mjs';
const database=fixture(fixtures[1]),env=credentials(),master=await connect('master'),pool=await connect(database);
const login='R8Restricted_'+crypto.randomUUID().replaceAll('-',''),password='R8!'+crypto.randomBytes(36).toString('base64url'),jwtSecret=crypto.randomBytes(48).toString('base64url'),checks=[];
let restricted;
const check=(name,condition,evidence)=>{assert.ok(condition,name);checks.push({name,status:'PASS',evidence});};
async function launch(overrides,operation){
 const reservation=net.createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const child=spawn(process.execPath,['src/server.js'],{cwd:path.join(root,'backend'),env:{...process.env,...env,NODE_ENV:'production',PORT:String(port),DB_DATABASE:database,DB_USER:login,DB_PASSWORD:password,JWT_SECRET:jwtSecret,FRONTEND_URL:'http://localhost:5173',...overrides},windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
 const base=`http://127.0.0.1:${port}/api`;
 try{const deadline=Date.now()+12000;while(!log.includes('API listening')){assert.ok(Date.now()<deadline&&child.exitCode===null,'Production backend startup');await new Promise(resolve=>setTimeout(resolve,40));}await operation(base);check('No unhandled process rejection',!/UnhandledPromiseRejection|unhandledRejection/.test(log),'Production child logs checked in memory; secrets not exported');}
 finally{child.kill('SIGTERM');await Promise.race([new Promise(resolve=>child.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,3000))]);}
}
const jsonRequest=async(base,route,options={})=>{const response=await fetch(base+route,{...options,signal:AbortSignal.timeout(10000)});return{response,body:await response.json()};};
try{
 await ask(master,`CREATE LOGIN [${login}] WITH PASSWORD=N'${password.replaceAll("'","''")}',CHECK_POLICY=ON,CHECK_EXPIRATION=OFF;`);
 await ask(pool,`CREATE USER [${login}] FOR LOGIN [${login}]; ALTER ROLE [db_executor] ADD MEMBER [${login}];`);
 restricted=await new sql.ConnectionPool({server:env.DB_SERVER??'localhost',port:Number(env.DB_PORT??1433),database,user:login,password,requestTimeout:30000,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:env.DB_TRUST_SERVER_CERTIFICATE!=='false'}}).connect();
 const privileged=(await ask(restricted,"SELECT IS_SRVROLEMEMBER('sysadmin') AS sysadmin,IS_ROLEMEMBER('db_owner') AS dbOwner,IS_ROLEMEMBER('db_executor') AS executor")).recordset[0];check('Restricted actual SQL login',privileged.sysadmin===0&&privileged.dbOwner===0&&privileged.executor===1,'Non-sysadmin/non-db_owner; db_executor member');
 const catalog=await restricted.request().execute('dbo.sp_Movie_List');check('Restricted login executes allowed SP',catalog.recordset.length>0,'Actual SQL authentication connection; wrapper SP/view chain succeeds');
 for(const [verb,source]of [['SELECT','SELECT TOP(1) PhimID FROM dbo.PHIM'],['INSERT',"INSERT dbo.THELOAI(TenTheLoai) SELECT N'R8 denied' WHERE 1=0"],['UPDATE','UPDATE dbo.PHIM SET TenPhim=TenPhim WHERE 1=0'],['DELETE','DELETE dbo.PHIM WHERE 1=0']]){await assert.rejects(ask(restricted,source),error=>error.number===229);check('Direct business '+verb+' denied',true,'SQL error 229; no data written');}
 await launch({},async base=>{
  const health=await jsonRequest(base,'/health/db');check('Production start and restricted DB health',health.response.status===200&&health.body.database===database,'Production server.js startup and real EXECUTE-only DB connection');
  check('Helmet security headers',health.response.headers.get('x-content-type-options')==='nosniff','Helmet middleware');
  const cors=await jsonRequest(base,'/health',{headers:{Origin:'http://localhost:5173'}});check('Configured CORS',cors.response.headers.get('access-control-allow-origin')==='http://localhost:5173','Configured allowed frontend origin');
  const unauthorized=await jsonRequest(base,'/orders');check('Protected endpoint without JWT',unauthorized.response.status===401&&unauthorized.body.error.code==='UNAUTHENTICATED','Live production HTTP');
  const auth=await jsonRequest(base,'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'khachhang1@gmail.com',MatKhau:'123456'})});assert.equal(auth.response.status,200);
  const claims=JSON.parse(Buffer.from(auth.body.token.split('.')[1],'base64url'));check('Identity-only JWT',Object.keys(claims).sort().join(',')==='exp,iat,sub','Only claim names exported; token never saved');
  const email='r8-executor-'+crypto.randomUUID()+'@example.invalid';const registered=await jsonRequest(base,'/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({HoTen:'R8 restricted app fixture',Email:email,MatKhau:'R8ExecutorPass!123'})});check('Restricted SP write chain',registered.response.status===201,'Customer/profile creation works through SP while direct table DML denied');
  const oversized=await jsonRequest(base,'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'x'.repeat(150000),MatKhau:'fixture'})});check('Request payload limit',oversized.response.status===413&&typeof oversized.body.error.code==='string','Express JSON 100KB default and standardized envelope');
 });
 await launch({JWT_SECRET:''},async base=>{const response=await jsonRequest(base,'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:'khachhang1@gmail.com',MatKhau:'123456'})});check('Missing JWT environment validation',response.response.status===503&&response.body.error.code==='AUTH_NOT_CONFIGURED','Refuses issuing token when secret is absent');});
 await launch({DB_DATABASE:'R8_Nonexistent_ConnectionTest'},async base=>{const health=await jsonRequest(base,'/health');check('HTTP stays available on DB failure',health.response.status===200,'Lazy pool connection');const failed=await jsonRequest(base,'/health/db');check('Graceful DB connection failure',failed.response.status===503&&failed.body.error.code==='SERVICE_UNAVAILABLE','No unhandled rejection; no credential exported');});
 const files=walk(path.join(root,'backend/src')).filter(file=>/\.js$/.test(file));const hardcoded=[],logging=[];
 for(const file of files){const source=fs.readFileSync(file,'utf8');const literals=[...source.matchAll(/\b(?:password|jwtSecret|JWT_SECRET|DB_PASSWORD)\s*[:=]\s*['"]([^'"]+)['"]/gi)];if(literals.some(match=>match[1]!=='password'&&!/^dbo\.[a-z_]+$/i.test(match[1])))hardcoded.push(path.relative(root,file));if(/(?:console\.(?:log|error)|logger\.(?:info|error))\([^\n]*(?:req\.body|req\.headers|MatKhauHash|password|\.token)/i.test(source))logging.push(path.relative(root,file));}
 save('security-source-scan.json',{filesScanned:files.length,possibleLiteralSecretFiles:hardcoded,possibleSecretLoggingFiles:logging});
 check('Application source secret/log scan',!hardcoded.length&&!logging.length,{filesScanned:files.length,hardcodedSecretMatches:hardcoded,secretLoggingMatches:logging});
 const trackedEnv=(await import('node:child_process')).execFileSync('git',['ls-files','--','**/.env','.env'],{cwd:root,encoding:'utf8'}).trim();check('.env is not tracked',trackedEnv==='','git ls-files');
 const r3=JSON.parse(fs.readFileSync(path.join(root,'audit/final/r8/r3/probes.json'),'utf8'));assert.equal(r3.status,'PASS');
 save('security-final.json',{status:'PASS',database,configuredDevelopmentCredentialMode:env.DB_USER==='sa'?'DEV administrative login; unchanged':'Configured application login; unchanged',restrictedAppLoginTested:true,restrictedLoginRemoved:true,checks,authorizationEvidence:['r3/probes.json','r3/partial-grants-browser.json','legacy-reruns/integration.json'],credentialsExported:false});console.log('PASS final security: restricted SQL login/SP writes/direct DML deny, production runtime/env/failure/header/payload/JWT/source checks.');
}finally{await restricted?.close();await ask(pool,`IF USER_ID(N'${login}') IS NOT NULL DROP USER [${login}];`);await pool.close();await ask(master,`IF SUSER_ID(N'${login}') IS NOT NULL DROP LOGIN [${login}];`);await master.close();}

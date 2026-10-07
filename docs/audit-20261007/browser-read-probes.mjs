// Audit-only listener, isolated headless browser, persistent DB writes blocked.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {credentials} from '../../scripts/db/lib.mjs';
Object.assign(process.env,credentials());
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const express=require('express');
const {createApp}=await import('../../backend/src/app.js');
const {getPool,closePool}=await import('../../backend/src/db/pool.js');
const outer=express(),api=createApp();
outer.use((req,res,next)=>{
  if(!req.path.startsWith('/api/')) return next();
  if(req.method!=='GET'&&!(req.method==='POST'&&req.path==='/api/auth/login')) return res.status(405).json({error:{code:'AUDIT_READ_ONLY'}});
  return api(req,res,next);
});
const build=path.resolve('docs/audit-20261007/frontend-build');
outer.use(express.static(build));outer.use((req,res)=>res.sendFile(path.join(build,'index.html')));
const server=outer.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cinema-read-audit-'));
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const results=[],errors=[],requests=[],pending=new Map();let seq=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},15000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const until=async expression=>{const deadline=Date.now()+12000;do {if(await evaluate(expression))return;await pause(120);}while(Date.now()<deadline);throw Error('Timed out: '+expression);};
async function navigate(route,role){const n=requests.length;await send('Page.navigate',{url:origin+route});await until("document.readyState==='complete'&&document.querySelector('h1')!==null");await pause(650);results.push({role,requestedRoute:route,...await evaluate("({actualRoute:location.pathname,title:document.querySelector('h1')?.textContent,alerts:[...document.querySelectorAll('[role=alert]')].map(x=>x.textContent),horizontalOverflow:document.documentElement.scrollWidth>innerWidth})"),api:requests.slice(n)});}
try {
  const deadline=Date.now()+12000;while(!fs.existsSync(path.join(profile,'DevToolsActivePort'))){if(Date.now()>deadline)throw Error('Chrome did not start');await pause(100);}
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=e=>{const v=JSON.parse(e.data);if(v.id){const p=pending.get(v.id);pending.delete(v.id);v.error?p?.reject(Error(JSON.stringify(v.error))):p?.resolve(v.result);}else if(v.method==='Network.responseReceived'&&v.params.response.url.startsWith(origin+'/api/'))requests.push({path:new URL(v.params.response.url).pathname,status:v.params.response.status});else if(v.method==='Runtime.exceptionThrown')errors.push(v.params.exceptionDetails.text);};
  for(const method of ['Page.enable','Runtime.enable','Network.enable'])await send(method);
  for(const route of ['/','/movies','/movies/1','/cinemas','/cinemas/1','/booking/2','/register','/absent-audit-route'])await navigate(route,'PUBLIC');
  const accounts=(await(await getPool()).request().query("SELECT Email,MaVaiTro FROM (SELECT u.Email,v.MaVaiTro,ROW_NUMBER() OVER(PARTITION BY v.MaVaiTro ORDER BY u.NguoiDungID) n FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID WHERE u.TrangThai=N'Hoạt động') x WHERE n=1")).recordset;
  for(const {Email,MaVaiTro} of accounts){
    await evaluate('sessionStorage.clear()');await navigate('/login','PUBLIC');
    await evaluate(`(()=>{for(const [selector,value] of ${JSON.stringify([['input[type=email]',Email],['input[type=password]','123456']])}){const e=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}document.querySelector('form').requestSubmit();})()`);
    await until("location.pathname!=='/login'");await pause(700);
    results.push({role:MaVaiTro,action:'login-form',...await evaluate("({actualRoute:location.pathname,title:document.querySelector('h1')?.textContent})")});
    const routes=MaVaiTro==='KHACH_HANG'?['/account','/profile','/orders','/complaints','/manager','/admin']:MaVaiTro==='QUAN_LY_RAP'?['/manager','/admin']:MaVaiTro==='CSKH'?['/support','/admin']:['/admin'];
    for(const route of routes)await navigate(route,MaVaiTro);
  }
  for(const width of [360,1280]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===360});await navigate('/movies','PUBLIC');results.at(-1).viewport=width;}
  const report={results,errors,requests,writesBlocked:true,expiryJobStarted:false,coverage:'Read pages and four actual login forms only; no booking, payments or other writes.'};
  fs.writeFileSync('docs/audit-20261007/browser-probes.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({pages:results.length,runtimeErrors:errors,loginResults:results.filter(x=>x.action==='login-form'),apiResponses:requests.length,overflows:results.filter(x=>x.horizontalOverflow).map(x=>({route:x.requestedRoute,viewport:x.viewport}))},null,2));
}catch(error){fs.writeFileSync('docs/audit-20261007/browser-probes.json',JSON.stringify({results,errors,requests,blocker:error.message,writesBlocked:true,expiryJobStarted:false},null,2));console.error(error.message);process.exitCode=1;
}finally {if(ws?.readyState===1){try{await Promise.race([send('Browser.close'),pause(1500)]);}catch{}ws.close();}child.kill();server.closeAllConnections();await new Promise(r=>server.close(r));await closePool();}

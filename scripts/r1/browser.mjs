// Dedicated headless profile; never attaches to the user's existing browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { root, write } from '../db/lib.mjs';
const chrome=process.env.R1_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
if(!fs.existsSync(chrome))throw new Error('Chrome binary required (or set R1_CHROME_PATH).');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cinema-r1-browser-'));
const vite=await createServer({root:path.join(root,'frontend'),configFile:path.join(root,'frontend/vite.config.js'),appType:'custom',server:{host:'127.0.0.1',port:0,hmr:false}});
vite.middlewares.use((req,res,next)=>{
 if(req.url==='/__r1-forms.mjs'){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(path.join(root,'scripts/r1/browser-forms.mjs'),'utf8'));return;}
 if(req.url!=='/__r1')return next();res.setHeader('Content-Type','text/html');res.end('<html><body><input id="time" type="datetime-local" step="0.001"><span id="display"></span><script type="module">import "/@vite/client";</script></body></html>');
});
await vite.listen();const address=vite.httpServer.address();const base=`http://127.0.0.1:${address.port}`;
const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const pending=new Map();let id=0;
const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;const timer=setTimeout(()=>{pending.delete(next);reject(Error(`CDP timeout: ${method}`));},5000);pending.set(next,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id:next,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.result?.description||r.exceptionDetails.text);return r.result.value;};
try {
 const portFile=path.join(profile,'DevToolsActivePort');const deadline=Date.now()+15000;
 while(!fs.existsSync(portFile)){if(Date.now()>deadline)throw Error('Headless Chrome startup timed out');await new Promise(r=>setTimeout(r,100));}
 const port=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);
 const target=await(await fetch(`http://127.0.0.1:${port}/json/new?${base}/__r1`,{method:'PUT'})).json();
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=event=>{const r=JSON.parse(event.data);if(!r.id)return;const p=pending.get(r.id);pending.delete(r.id);r.error?p.reject(Error(r.error.message)):p.resolve(r.result);};
 await send('Page.enable');await send('Runtime.enable');
 await send('Page.navigate',{url:base+'/__r1'});
 const pageDeadline=Date.now()+15000;
 while(!(await evaluate("document.readyState==='complete'&&!!document.querySelector('#time')"))){if(Date.now()>pageDeadline)throw Error('Browser fixture page load timed out');await new Promise(r=>setTimeout(r,50));}
 const results=[];
 for(const timezoneId of ['UTC','Asia/Ho_Chi_Minh','America/Los_Angeles']) {
  await send('Emulation.setTimezoneOverride',{timezoneId});
  const result=await evaluate(`(async()=>{const t=await import('/src/utils/dateTime.js');const local='2026-10-03T19:30';const value=t.businessLocalToInstant(local);document.querySelector('#time').value=t.instantToBusinessLocal(value);document.querySelector('#display').textContent=t.formatDateTime(value);return {host:Intl.DateTimeFormat().resolvedOptions().timeZone,instant:value,editValue:document.querySelector('#time').value,display:document.querySelector('#display').textContent,midnight:t.businessLocalToInstant('2026-10-03T00:30'),birthday:t.formatDate('2000-01-01'),roundtrip:t.businessLocalToInstant(document.querySelector('#time').value)};})()`);
  assert.equal(result.instant,'2026-10-03T12:30:00.000Z');assert.match(result.editValue,/^2026-10-03T19:30/);
  assert.equal(result.roundtrip,result.instant);assert.match(result.display,/19:30/);assert.match(result.display,/03\/10\/2026/);
  assert.equal(result.midnight,'2026-10-02T17:30:00.000Z');assert.equal(result.birthday,'01/01/2000');
  const portals=await evaluate("(async()=>{const {testPortalForms}=await import('/__r1-forms.mjs');return testPortalForms();})()");
  assert.equal(portals.movieChangePreservesLocalState,true);
  assert.equal(portals.manager.startsAt,'2026-10-03T12:30:00.000Z');assert.equal(portals.manager.endsAt,'2026-10-03T14:30:00.000Z');
  assert.equal(portals.admin.startsAt,'2026-10-03T12:30:00.123Z');assert.equal(portals.admin.endsAt,'2026-10-03T14:30:00.123Z');
  assert.equal(portals.promotion.startsAt,portals.admin.startsAt);assert.equal(portals.promotion.endsAt,portals.admin.endsAt);
  result.portals=portals;
  results.push(result);
 }
 write(path.join(root,'audit/remediation/evidence/browser-timezone.json'),{status:'PASS',engine:'Dedicated headless Chrome',results});
 console.log('PASS real browser timezone independence: UTC/Vietnam/Los Angeles; datetime-local create/edit, display, midnight, date-only');
}finally{
 if(ws){try{await send('Browser.close');}catch{}ws.close();}else child.kill();
 await vite.close();
 // The owned temporary Chrome profile can contain locked files briefly after exit.
 if(path.resolve(profile).startsWith(path.resolve(os.tmpdir())+path.sep+'cinema-r1-browser-')){try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
}

// Test-only Chrome/CDP harness following the existing R4/R8 tooling pattern.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function smokeBrowser({origin, actors, database, out, save}) {
 const chrome = process.env.R81_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
 assert.ok(fs.existsSync(chrome), 'Chrome executable required; set R81_CHROME_PATH if necessary');
 const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cinema-r81-browser-'));
 const child = spawn(chrome, ['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'about:blank'],
  {windowsHide:true,stdio:'ignore'});
 let ws, next = 0;
 const pending = new Map(), network = [], exceptions = [], consoleErrors = [], failures = [], checks = [];
 const requests = new Map();
 const send = (method,params={}) => new Promise((resolve,reject)=>{
  const id=++next, timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},30000);
  pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate = async expression => {
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails) throw Error(result.exceptionDetails.text);
  return result.result.value;
 };
 const until = async expression => {
  const end=Date.now()+25000;
  while(true) {if(await evaluate(expression))return;assert.ok(Date.now()<end,'Browser wait: '+expression);await pause(100);}
 };
 const go = async route => {
  await send('Page.navigate',{url:origin+route});
  await until(`document.readyState==='complete' && location.origin===${JSON.stringify(origin)}`);
 };
 const fill = (selector,value) => evaluate(`(async()=>{
  const node=document.querySelector(${JSON.stringify(selector)});if(!node)throw Error('Missing input');
  const prototype=node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype,'value').set.call(node,${JSON.stringify(value)});
  node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 })()`);
 const capture = async name => {
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(screenshot.data,'base64'));
  return {screenshot:name+'.png',route:await evaluate('location.pathname'),headings:await evaluate("[...document.querySelectorAll('h1,h2')].map(node=>node.textContent)")};
 };
 const check = async (id,assertions,extra={}) => {checks.push({id,result:'PASS',assertions,...extra});save('browser-smoke.json',{status:'RUNNING',checks});};
 let version;
 try {
  const portFile=path.join(profile,'DevToolsActivePort'), end=Date.now()+20000;
  while(!fs.existsSync(portFile)){assert.ok(Date.now()<end,'Chrome startup timeout');await pause(100);}
  const port=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);
  // DevToolsActivePort can precede HTTP readiness on Windows. Use the startup page,
  // avoiding an additional renderer startup race before Page.enable.
  while(!version){try{version=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();}
   catch(error){assert.ok(Date.now()<end,'CDP HTTP startup timeout');await pause(150);}}
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target=targets.find(item=>item.type==='page'&&item.url==='about:blank');assert.ok(target,'Dedicated Chrome startup target');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=event=>{
   const message=JSON.parse(event.data);
   if(message.id){const callback=pending.get(message.id);pending.delete(message.id);
    if(message.error)callback?.reject(Error(message.error.message));else callback?.resolve(message.result);return;}
   const p=message.params;
   if(message.method==='Network.requestWillBeSent') {
    const url=new URL(p.request.url);
    requests.set(p.requestId,{url:url.origin+url.pathname+url.search,method:p.request.method});
   } else if(message.method==='Network.responseReceived') {
    const request=requests.get(p.requestId);
    if(request&&request.url.includes('/api/'))network.push({...request,requestId:p.requestId,status:p.response.status});
   } else if(message.method==='Network.loadingFailed') {
    failures.push({...requests.get(p.requestId),error:p.errorText,canceled:p.canceled===true});
   } else if(message.method==='Runtime.exceptionThrown')exceptions.push({text:p.exceptionDetails.text});
   else if(message.method==='Runtime.consoleAPICalled'&&p.type==='error')consoleErrors.push({text:p.args.map(x=>x.value||x.description||'').join(' ')});
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await go('/');await until("document.querySelector('#main-content')!==null&&document.querySelector('.area__brand')!==null");
  await check('SMOKE-01',['Actual main.jsx/App/AuthProvider/BrowserRouter/AppRoutes/AreaLayout mounted'],await capture('public-desktop'));
  await until(`document.body.innerText.includes(${JSON.stringify(database)})`);
  const health=network.find(row=>row.url.endsWith('/api/health/db')&&row.status===200);
  // The health path is read from actual frontend/backend source; retain its exact observed URL.
  assert.ok(health);
  await check('SMOKE-02',['Real browser API health response identifies isolated Test DB; proxy targets this run Express'],{database});
  await go('/admin');await until("location.pathname==='/login'");
  assert.equal(await evaluate("sessionStorage.getItem('cinema_access_token')"),null);
  for(const actor of actors) {
   await go('/login');await evaluate("sessionStorage.clear()");await go('/login');
   await until("document.querySelector('input[type=email]')!==null");
   const networkStart=network.length;
   await fill('input[type=email]',actor.email);await fill('input[type=password]',actor.password);
   await evaluate("document.querySelector('.auth-card form').requestSubmit()");
   await until(`location.pathname===${JSON.stringify(actor.route)}&&document.querySelector('.area__user-name')!==null`);
   await until(`document.body.innerText.includes(${JSON.stringify(actor.marker)})`);
   assert.ok(await evaluate("Boolean(sessionStorage.getItem('cinema_access_token'))"));
   const actorRequests=network.slice(networkStart);
   assert.ok(actorRequests.some(row=>row.url.endsWith('/api/auth/login')&&row.status===200));
   const meResponse=actorRequests.findLast(row=>row.url.endsWith('/api/auth/me')&&row.status===200);
   assert.ok(meResponse);
   const meBody=await send('Network.getResponseBody',{requestId:meResponse.requestId});
   const current=JSON.parse(meBody.base64Encoded?Buffer.from(meBody.body,'base64').toString('utf8'):meBody.body).user;
   assert.equal(current.role,actor.role);assert.equal(current.userId,actor.id);
   await until(`document.body.innerText.includes(${JSON.stringify(actor.loadedMarker)})`);
   await check(actor.smoke,['Actual Login form -> auth/me/current grants -> expected role default route','Real role-area read rendered'],
    {role:actor.role,actorID:actor.id,currentRole:current.role,permissionCount:current.permissions.length,
     assignmentCount:current.cinemaAssignments?.length??0,...await capture(actor.role.toLowerCase()+'-desktop'),networkStart,networkEnd:network.length});
   if(actor.role==='KHACH_HANG') {
    await go('/admin');await until("location.pathname==='/forbidden'");
    await go('/profile');await until("document.querySelector('.auth-card')!==null");
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await capture('customer-mobile');
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
   }
   if(actor.role==='ADMIN') {
    await evaluate("[...document.querySelectorAll('nav[aria-label=\"Phân hệ quản trị\"] button')].find(node=>node.textContent==='Khiếu nại').click()");
    await until("document.body.innerText.includes('R81 Smoke')");await capture('admin-complaints-desktop');
   }
   // Storage cleared before the next full navigation; tokens are never exported.
   await evaluate('sessionStorage.clear()');
  }
  await send('Page.navigate',{url:'about:blank'});await pause(150);
  const externalFontFailures=failures.filter(row=>!row.canceled&&row.url?.startsWith('https://fonts.googleapis.com/')&&row.error==='net::ERR_NETWORK_ACCESS_DENIED');
  const unexpectedFailures=failures.filter(row=>!row.canceled&&!externalFontFailures.includes(row));
  const knownConsoleWarnings=consoleErrors.filter(row=>row.text.includes('Each child in a list should have a unique')&&row.text.includes('AdminPortal'));
  const unexpectedConsoleErrors=consoleErrors.filter(row=>!knownConsoleWarnings.includes(row));
  assert.equal(exceptions.length,0,'Fatal runtime exception');
  assert.equal(unexpectedConsoleErrors.length,0,'Unexplained browser console errors');
  assert.equal(unexpectedFailures.length,0,'Unexpected network failures');
  assert.ok(network.every(row=>row.status<400),'Unexpected API error in smoke');
  await check('SMOKE-08',['Diagnostics collected; no fatal Runtime exception/unexplained console error/local API network failure/API error',
   'Known AdminPortal React key warning remains pending R8.2; external Google Font denied by environment uses existing CSS fallback'],
   {canceledRequests:failures.filter(x=>x.canceled).length,knownConsoleWarnings,externalFontFailures,
    visualBaselineLimit:'Configured brand font unavailable over network; screenshots show existing CSS fallback font'});
  const result={status:'PASS',engine:version.Browser,protocolVersion:version['Protocol-Version'],
   mode:'Actual AppRoutes in Vite; real HTTP/typed SP/Test SQL; no mock API or fault injection',
   checks,network,exceptions,consoleErrors,failures,origin,profileRetention:'Dedicated temp profile, not user profile; no profile contents exported'};
  save('browser-smoke.json',result);return result;
 } catch(error) {
  if(ws) await capture('failure-diagnostic').catch(()=>{});
  save('browser-smoke.json',{status:'FAIL',checks,network,exceptions,consoleErrors,failures,error:error.message});throw error;
 } finally {
  ws?.close();child.kill();
  if(child.exitCode===null)await Promise.race([new Promise(resolve=>child.once('exit',resolve)),pause(5000)]);
 }
}

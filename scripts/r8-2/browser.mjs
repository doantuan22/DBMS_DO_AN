// Chrome CDP transport reused from R8.1; actual application routes, no component fixture app.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function runBrowser({origin,database,out,save,actors,phase,query,fingerprint}){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cinema-r82-browser-'));
 const child=spawn(process.env.R81_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--no-first-run','--no-default-browser-check',
   '--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 save('browser-config.json',{engine:'Existing Chrome CDP',ownedPID:child.pid,ownedTempProfile:profile,viewport:{width:1440,height:1000},commandTimeoutMs:30000,waitTimeoutMs:15000});
 let ws,next=0,version,currentDocument;
 const pending=new Map(),requests=new Map(),network=[],exceptions=[],consoleErrors=[],failures=[],checks=[],controls=[],sqlAssertions=[];
 const rules=[],sessions=new Map(),sessionEvents=[],harnessErrors=[],canceledInterceptions=[],canceledRequests=new Set(),interceptPatterns=new Set();let dialogArmed=false,dialogResolve;
 const confirm=async work=>{assert.equal(dialogArmed,false);dialogArmed=true;const answered=new Promise(resolve=>{dialogResolve=resolve;});try{await work();await Promise.race([answered,pause(5000).then(()=>{throw Error('Expected native confirmation dialog');})]);}finally{dialogArmed=false;dialogResolve=undefined;}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},30000);
  pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
 const until=async(expression,timeout=15000)=>{const end=Date.now()+timeout;while(!await evaluate('Boolean('+expression+')')){assert.ok(Date.now()<end,'Wait '+expression);await pause(80);}};
 const go=async route=>{await send('Page.navigate',{url:origin+route});await until(`document.readyState==='complete'&&location.origin===${JSON.stringify(origin)}`);};
 const navigate=async route=>{await evaluate(`history.pushState({},'',${JSON.stringify(route)});window.dispatchEvent(new PopStateEvent('popstate'));`);await pause(80);};
 const fill=async(selector,value)=>evaluate(`(async()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing input '+${JSON.stringify(selector)});
  const p=n.tagName==='SELECT'?HTMLSelectElement.prototype:n.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(p,'value').set.call(n,${JSON.stringify(String(value))});n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
 const click=async text=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('button,a')].find(n=>n.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing button '+${JSON.stringify(text)});b.click()})()`);await pause(100);};
 const labeled=async(label,value)=>{const selector=await evaluate(`(()=>{const label=${JSON.stringify(label)};const n=[...document.querySelectorAll('label')].find(n=>n.childNodes[0]?.textContent.trim()===label);const i=n?.querySelector('input,select,textarea')??[...document.querySelectorAll('input,select,textarea')].find(n=>n.getAttribute('aria-label')===label);if(!i)throw Error('Missing label '+label);i.setAttribute('data-r82-field','current');return '[data-r82-field="current"]'})()`);await fill(selector,value);await evaluate("document.querySelector('[data-r82-field]').removeAttribute('data-r82-field')");};
 const capture=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));return name+'.png';};
 const fault=(match,config={})=>{
  const rule={match,...config,remaining:config.times??1};rules.push(rule);
  // Intercept only scenario endpoints. Unrelated real requests never enter Fetch.
  // CDP messages are ordered: Fetch.enable is sent before the subsequent UI command.
  const pattern=origin+'*'+match+'*';
  if(!interceptPatterns.has(pattern)){interceptPatterns.add(pattern);void send('Fetch.enable',{patterns:[...interceptPatterns].map(urlPattern=>({urlPattern,requestStage:'Response'}))}).catch(error=>harnessErrors.push({text:error.message,operation:'Fetch.enable',match}));}
  return rule;
 };
 const check=async(id,ucs,kind,work)=>{
  const start=network.length,sqlStart=sqlAssertions.length,controlStart=controls.length,ruleStart=rules.length;
  const row={id,UCs:ucs,kind,status:'RUNNING',startedAt:new Date().toISOString()};checks.push(row);
  try{const value=await work();row.status='PASS';if(value)row.assertions=value;}
  catch(error){row.status='FAIL';row.error=error.message;row.screenshot=await capture(id+'-FAIL');
   if(!phase.startsWith('reproduce'))throw error;}
  finally{rules.splice(ruleStart);row.networkRange=[start,network.length];row.sqlRange=[sqlStart,sqlAssertions.length];row.controlRange=[controlStart,controls.length];if(controls.length>controlStart)row.kind='CONTROLLED_TRANSPORT';row.finishedAt=new Date().toISOString();save('browser-cases.json',{phase,checks});}
 };
 const sqlCheck=async(id,text,inputs,validate)=>{const rows=(await query(text,inputs)).recordset;validate(rows);sqlAssertions.push({id,status:'PASS',query:text,inputs,rows});save('sql-assertions.json',{status:'CAPTURED',assertions:sqlAssertions});return rows;};
 const login=async role=>{
  await go('/');await evaluate("sessionStorage.removeItem('cinema_access_token')");await go('/login');
  const actor=actors.find(a=>a.role===role);assert.ok(actor);await until("document.querySelector('input[type=email]')!==null");
  await fill('input[type=email]',actor.email);await fill('input[type=password]',actor.password);await evaluate("document.querySelector('.auth-card form').requestSubmit()");
  await until("location.pathname!=='/login'");
  const ready={ADMIN:"document.body.innerText.includes('Quản trị hệ thống')",CSKH:"document.body.innerText.includes('CSKH Portal')",QUAN_LY_RAP:"document.querySelector('select[aria-label=\"Rạp hiện tại\"]')"};if(ready[role])await until(ready[role]);sessions.set(role,await evaluate("sessionStorage.getItem('cinema_access_token')"));sessionEvents.push({kind:'ACTUAL_UI_LOGIN',role,userId:actor.id,time:new Date().toISOString()});return actor;
 };
 const resume=async(role,marker)=>{assert.ok(sessions.get(role),'Actual UI login must precede session restore');await go('/');await evaluate(`sessionStorage.setItem('cinema_access_token',${JSON.stringify(sessions.get(role))})`);await go({ADMIN:'/admin',CSKH:'/support',QUAN_LY_RAP:'/manager',KHACH_HANG:'/account'}[role]);await until(`document.body.innerText.includes(${JSON.stringify(marker??{ADMIN:'Quản trị hệ thống',CSKH:'CSKH Portal',QUAN_LY_RAP:'Manager Portal',KHACH_HANG:'Tài khoản khách hàng'}[role])})`);sessionEvents.push({kind:'RESTORE_LEGITIMATE_SESSION_AND_REAL_AUTH_ME',role,time:new Date().toISOString()});return actors.find(a=>a.role===role);};
 const visible=()=>evaluate('document.body.innerText');
 try{
  const end=Date.now()+20000,portFile=path.join(profile,'DevToolsActivePort');
  while(!fs.existsSync(portFile)){assert.ok(Date.now()<end,'Chrome startup');await pause(100);}
  const port=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);
  while(!version){try{version=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();}catch{assert.ok(Date.now()<end,'CDP startup');await pause(100);}}
  const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=event=>{
   const m=JSON.parse(event.data),p=m.params;if(m.id){const cb=pending.get(m.id);pending.delete(m.id);if(m.error)cb?.reject(Error(m.error.message));else cb?.resolve(m.result);return;}
   if(m.method==='Page.frameNavigated'&&!p.frame.parentId)currentDocument=p.frame.loaderId;
   if(m.method==='Network.requestWillBeSent'){const u=new URL(p.request.url);if(['http:','https:'].includes(u.protocol))requests.set(p.requestId,{method:p.request.method,url:p.request.url,document:p.loaderId});}
   if(m.method==='Network.responseReceived'&&requests.get(p.requestId)&&new URL(requests.get(p.requestId).url).pathname.startsWith('/api/'))network.push({...requests.get(p.requestId),requestId:p.requestId,status:p.response.status});
   if(m.method==='Network.loadingFailed'){failures.push({...requests.get(p.requestId),requestId:p.requestId,error:p.errorText,canceled:p.canceled===true});if(p.canceled===true)canceledRequests.add(p.requestId);}
   if(m.method==='Runtime.exceptionThrown')exceptions.push({text:p.exceptionDetails.text,description:p.exceptionDetails.exception?.description});
   if(m.method==='Runtime.consoleAPICalled'&&p.type==='error')consoleErrors.push({text:p.args.map(a=>a.value||a.description||'').join(' ')});
   if(m.method==='Page.javascriptDialogOpening'&&dialogArmed){void send('Page.handleJavaScriptDialog',{accept:true}).then(()=>dialogResolve?.()).catch(e=>harnessErrors.push({text:e.message}));}
   if(m.method==='Fetch.requestPaused'){
    const rule=new URL(p.request.url).pathname.startsWith('/api/')&&rules.find(r=>r.remaining>0&&p.request.url.includes(r.match)&&(!r.method||r.method===p.request.method));
    if(rule){rule.remaining--;controls.push({match:rule.match,url:p.request.url,method:p.request.method,backendStatus:p.responseStatusCode,
     delay:rule.delay??0,syntheticStatus:rule.status??null,networkFailure:rule.fail??null,kind:'CONTROLLED_TRANSPORT'});}
    void (async()=>{if(rule?.delay)await pause(rule.delay);
     if(rule?.fail)await send('Fetch.failRequest',{requestId:p.requestId,errorReason:rule.fail});
     else if(rule?.status)await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:rule.status,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify({error:{message:'R82 controlled failure',code:'R82_TEST_FAULT'}})).toString('base64')});
     else await send('Fetch.continueRequest',{requestId:p.requestId});})().catch(e=>{
      const originalDocument=requests.get(p.networkId)?.document;
      const event={text:e.message,url:p.request.url,networkId:p.networkId,interceptionId:p.requestId,originalDocument,currentDocument};
      if(e.message==='Invalid InterceptionId.'&&(canceledRequests.has(p.networkId)||(originalDocument&&originalDocument!==currentDocument)))canceledInterceptions.push({...event,reason:canceledRequests.has(p.networkId)?'Correlated Network.loadingFailed canceled=true: React aborted the read before CDP release':'Correlated Page.frameNavigated.loaderId differs from Network.requestWillBeSent.loaderId: old document was replaced before CDP release'});
      else harnessErrors.push(event);
     });
   }
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const tools={assert,pause,send,evaluate,until,go,navigate,fill,labeled,click,capture,check,sqlCheck,login,resume,visible,fault,query,actors,network,database,save,confirm,fingerprint};
  const {run}=await import('./'+(phase.includes('p1')?'p1':phase.includes('p2')?'p2':phase.includes('state')?'state-edges':phase.includes('mutations')?'mutation-edges':phase.includes('optional')?'optional':phase.includes('final')?'final-edges':phase==='focus'?'focus':phase==='edges-tail'?'edges-tail':phase==='edges'?'edges':phase==='critical'?'critical-edges':'p3')+'.mjs');await run(tools,phase);
  assert.equal(exceptions.length,0,'Fatal browser exceptions');
  assert.equal(consoleErrors.length,0,'Browser console errors');
  assert.equal(harnessErrors.length,0,'Unexplained CDP harness errors');
  return {status:checks.every(c=>c.status==='PASS')?'PASS':'REPRODUCED',checks};
 }finally{
  save('session-events.json',{scope:'Private in-memory legitimate JWT reuse; values never exported; default auth limiter remains enabled',events:sessionEvents});
  save('browser-diagnostics.json',{phase,engine:version?.Browser,origin,network,exceptions,consoleErrors,failures,controls,harnessErrors,canceledInterceptions,
   profileRetention:'Dedicated OS temp profile; owned browser stopped; no user profile'});
  try{if(ws?.readyState===WebSocket.OPEN){await send('Page.navigate',{url:'about:blank'});ws.close();}}catch{}
  child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve);});
 }
}

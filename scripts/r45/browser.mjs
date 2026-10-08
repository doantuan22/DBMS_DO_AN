import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { sql,root,write,env,database,disposable,connect,snapshot,summarize } from './common.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),before=await snapshot(pool);let backend,vite,child,time=0;
const {env:config}=await import('../../backend/src/config/env.js');
const pending = new Map(); let ws, nextId = 0;
try {
backend=createApp({authRateLimit:{now:()=>time}}).listen(0,'127.0.0.1');await new Promise(r=>backend.once('listening',r));

const chrome = process.env.R45_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chrome)) throw Error('Chrome required (or set R45_CHROME_PATH).');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cinema-r45-browser-'));
const evidence = path.join(root, 'docs/evidence/r45');
vite = await createServer({ root: path.join(root, 'frontend'), configFile: path.join(root, 'frontend/vite.config.js'), appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false, proxy:{'/api':`http://127.0.0.1:${backend.address().port}`}  } });
vite.middlewares.use((req, res, next) => {
  if (req.url !== '/__r45') return next();
  res.setHeader('Content-Type', 'text/html'); res.end('<html><body><script type="module">import "/@vite/client";</script></body></html>');
});
await vite.listen();
const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 30000);
  pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.result?.description || result.exceptionDetails.text);
  return result.result.value;
};
  const portFile = path.join(profile, 'DevToolsActivePort'), end = Date.now() + 15000;
  while (!fs.existsSync(portFile)) { if (Date.now() > end) throw Error('Chrome startup timeout'); await new Promise(r => setTimeout(r, 100)); }
  const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${base}/__r45`, { method: 'PUT' })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const result = JSON.parse(event.data);
    if (!result.id) return;
    const handler = pending.get(result.id); pending.delete(result.id);
    if (!handler) return;
    result.error ? handler.reject(Error(result.error.message)) : handler.resolve(result.result);
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/__r45' });
  const ready = Date.now() + 10000;
  while (!(await evaluate("document.readyState==='complete'"))) { if (Date.now() > ready) throw Error('Page timeout'); await new Promise(r => setTimeout(r, 50)); }
  const results=[];
  for(const page of ['login','register']){
    time+=config.authRateLimit.windowMs;
    const maximum=page==='login'?config.authRateLimit.loginMax:config.authRateLimit.registerMax;
    for(let i=0;i<maximum;i++){
      const response=await fetch(`http://127.0.0.1:${backend.address().port}/api/auth/${page}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      assert.equal(response.status,400);
    }
    const blocked=await evaluate(`(async()=>{const f=await import('/tests/r45-browser-fixture.jsx');return f.mountR45AuthForm('${page}');})()`);
    assert.equal(blocked.status,'PASS');
    time+=config.authRateLimit.windowMs;
    const result=await evaluate("(async()=>{const f=await import('/tests/r45-browser-fixture.jsx');return f.retryR45AuthForm();})()");
    assert.equal(result.status,'PASS');assert.ok(result.checks.every(row=>row.status==='PASS'));results.push({page,...result});
    await evaluate("import('/tests/r45-browser-fixture.jsx').then(f=>f.cleanupR45AuthForm())");
  }
  const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
  const result={status:'PASS',checks:results.flatMap(row=>row.checks),forms:results};
  write(path.join(evidence,'browser.json'),{status:'PASS',engine:'Dedicated headless Chrome; actual Login/Register/AuthProvider -> Vite proxy -> Backend -> real SQL Server; no HTTP mocking',database,policy:config.authRateLimit,result,cleanup:'PASS',before:summarize(before),after:summarize(after)});
  console.log(`PASS real auth UI: ${result.checks.length} checks; 429 errors, retained inputs, manual retry after expiry; no DB writes.`);
} catch (error) {
  write(path.join(root,'docs/evidence/r45/browser.json'), { status: 'FAIL', error: error.message }); throw error;
} finally {
  ws?.close();child?.kill();if(vite)await vite.close();if(backend)await new Promise(r=>backend.close(r));await closePool();await pool.close();
  // Dedicated profile is left in the OS temp directory; never touches the user browser profile.
}

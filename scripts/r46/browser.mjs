import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { sql,root,write,env,database,disposable,connect,snapshot,summarize } from './common.mjs';
import {createFixtures,reset,state,cleanup} from './fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),before=await snapshot(pool);let backend,vite,child,fixtures;

const pending = new Map(); let ws, nextId = 0;
try {
backend=createApp().listen(0,'127.0.0.1');await new Promise(r=>backend.once('listening',r));

const chrome = process.env.R46_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chrome)) throw Error('Chrome required (or set R46_CHROME_PATH).');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cinema-r46-browser-'));
const evidence = path.join(root, 'docs/evidence/r46');
vite = await createServer({ root: path.join(root, 'frontend'), configFile: path.join(root, 'frontend/vite.config.js'), appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false, proxy:{'/api':`http://127.0.0.1:${backend.address().port}`}  } });
vite.middlewares.use((req, res, next) => {
  if (req.url !== '/__r46') return next();
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
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${base}/__r46`, { method: 'PUT' })).json();
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
  await send('Page.navigate', { url: base + '/__r46' });
  const ready = Date.now() + 10000;
  while (!(await evaluate("document.readyState==='complete'"))) { if (Date.now() > ready) throw Error('Page timeout'); await new Promise(r => setTimeout(r, 50)); }
  const results=[];fixtures=await createFixtures(pool);
  for(const user of fixtures.users.slice(0,4)){
    await reset(pool,user,true);
    const loginResponse=await fetch(`http://127.0.0.1:${backend.address().port}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Email:user.email,MatKhau:'123456'})});
    assert.equal(loginResponse.status,200);const login=await loginResponse.json();
    const result=await evaluate(`import('/tests/r46-browser-fixture.jsx').then(f=>f.mountR46Profile(${JSON.stringify(login.token)},${JSON.stringify(user.role)}))`);
    assert.equal(result.status,'PASS');assert.ok(result.checks.every(c=>c.status==='PASS'));
    const current=await state(pool,user);assert.equal(current.user.HoTen,'R46 browser '+user.role);assert.equal(current.profiles.length,1);assert.equal(current.profiles[0].DiemTichLuy,23);
    assert.equal(current.profiles[0].NgaySinh.toISOString().slice(0,10),user.role==='KHACH_HANG'?'1996-07-08':'1990-02-01');
    results.push({role:user.role,...result});await evaluate("import('/tests/r46-browser-fixture.jsx').then(f=>f.cleanupR46Profile())");
  }
  await cleanup(pool,fixtures);fixtures=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
  write(path.join(evidence,'browser.json'),{status:'PASS',database,engine:'Dedicated headless Chrome; actual Profile/AuthProvider -> Vite proxy -> Backend -> SQL Server; no HTTP mocks',checks:results.flatMap(row=>row.checks),results,cleanup:'PASS',before:summarize(before),after:summarize(after)});
  console.log(`PASS real Profile UI: ${results.reduce((n,r)=>n+r.checks.length,0)} checks; four roles and anomaly preservation; all 27 tables/metadata restored.`);
} catch (error) {
  write(path.join(root,'docs/evidence/r46/browser.json'), { status: 'FAIL', error: error.message }); throw error;
} finally {
  ws?.close();child?.kill();if(vite)await vite.close();if(backend)await new Promise(r=>backend.close(r));await closePool();if(fixtures)await cleanup(pool,fixtures);await pool.close();
  // Dedicated profile is left in the OS temp directory; never touches the user browser profile.
}

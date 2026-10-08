import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { sql,root,write,env,database,disposable,connect,snapshot,summarize } from './common.mjs';
import { createFixture,cleanupFixture } from '../r32/fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),before=await snapshot(pool);let f,backend,vite,child;
const pending = new Map(); let ws, nextId = 0;
try {
f=await createFixture(pool);
const startsOn=(await pool.request().input('ID',sql.Int,f.pricing).query('SELECT NgayBatDau FROM dbo.BANGGIA WHERE GiaID=@ID')).recordset[0].NgayBatDau.toISOString().slice(0,10);
await pool.request().input('Cinema',sql.Int,f.cinema).query("INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai) VALUES(@Cinema,N'Thường',N'Cuối tuần',N'IMAX',9000,'2031-01-01',NULL,N'Áp dụng')");
backend=createApp().listen(0,'127.0.0.1');await new Promise(r=>backend.once('listening',r));

const chrome = process.env.R43_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chrome)) throw Error('Chrome required (or set R43_CHROME_PATH).');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cinema-r43-browser-'));
const evidence = path.join(root, 'docs/evidence/r43');
vite = await createServer({ root: path.join(root, 'frontend'), configFile: path.join(root, 'frontend/vite.config.js'), appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false, proxy:{'/api':`http://127.0.0.1:${backend.address().port}`}  } });
vite.middlewares.use((req, res, next) => {
  if (req.url !== '/__r43') return next();
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
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${base}/__r43`, { method: 'PUT' })).json();
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
  await send('Page.navigate', { url: base + '/__r43' });
  const ready = Date.now() + 10000;
  while (!(await evaluate("document.readyState==='complete'"))) { if (Date.now() > ready) throw Error('Page timeout'); await new Promise(r => setTimeout(r, 50)); }
  await evaluate(`window.r43StartsOn=${JSON.stringify(startsOn)}`);
  const result = await evaluate(`(async()=>{const {testR43Pricing}=await import('/tests/r43-browser-fixture.jsx');return testR43Pricing(${f.pricing},${f.cinema});})()`);
  assert.equal(result.status,'PASS');assert.ok(result.checks.every(row=>row.status==='PASS'));
  await cleanupFixture(pool,f);f=null;
  const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
  write(path.join(evidence,'browser.json'),{status:'PASS',engine:'Dedicated headless Chrome; actual Admin React form -> Vite proxy -> Backend -> real SQL Server; no HTTP mocking',database,result,cleanup:'PASS',before:summarize(before),after:summarize(after)});
  console.log(`PASS real Admin pricing UI: ${result.checks.length} checks; seven fields, NULL, conflict, read-after-write and retry.`);
} catch (error) {
  write(path.join(root,'docs/evidence/r43/browser.json'), { status: 'FAIL', error: error.message }); throw error;
} finally {
  ws?.close();child?.kill();if(vite)await vite.close();if(backend)await new Promise(r=>backend.close(r));await closePool();if(f)await cleanupFixture(pool,f);await pool.close();
  // Dedicated profile is left in the OS temp directory; never touches the user browser profile.
}

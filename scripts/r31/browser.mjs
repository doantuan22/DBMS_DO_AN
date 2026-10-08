import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { root, write } from '../db/lib.mjs';

const chrome = process.env.R31_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chrome)) throw Error('Chrome required (or set R31_CHROME_PATH).');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cinema-r31-browser-'));
const evidence = path.join(root, 'docs/evidence/r31');
const vite = await createServer({ root: path.join(root, 'frontend'), configFile: path.join(root, 'frontend/vite.config.js'), appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false } });
vite.middlewares.use((req, res, next) => {
  if (req.url !== '/__r31') return next();
  res.setHeader('Content-Type', 'text/html'); res.end('<html><body><script type="module">import "/@vite/client";</script></body></html>');
});
await vite.listen();
const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
const child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pending = new Map(); let ws, nextId = 0;
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
try {
  const portFile = path.join(profile, 'DevToolsActivePort'), end = Date.now() + 15000;
  while (!fs.existsSync(portFile)) { if (Date.now() > end) throw Error('Chrome startup timeout'); await new Promise(r => setTimeout(r, 100)); }
  const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${base}/__r31`, { method: 'PUT' })).json();
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
  await send('Page.navigate', { url: base + '/__r31' });
  const ready = Date.now() + 10000;
  while (!(await evaluate("document.readyState==='complete'"))) { if (Date.now() > ready) throw Error('Page timeout'); await new Promise(r => setTimeout(r, 50)); }
  const result = await evaluate("(async()=>{const {testR31Pages}=await import('/tests/r31-browser-fixtures.jsx');return testR31Pages();})()");
  assert.equal(result.status,'PASS');assert.ok(result.checks.every(row=>row.status==='PASS'));
  write(path.join(evidence,'browser.json'),{status:'PASS',engine:'Dedicated headless Chrome; actual React page, supplementary controlled HTTP timing',result});
  console.log(`PASS movie cast UI: ${result.checks.length} checks; Admin cast rejection/retry, persisted reload, blank/malformed protection, explicit clear.`);
} catch (error) {
  write(path.join(evidence, 'browser.json'), { status: 'FAIL', error: error.message }); throw error;
} finally {
  ws?.close(); child.kill(); await vite.close();
  // Dedicated profile is left in the OS temp directory; never touches the user browser profile.
}

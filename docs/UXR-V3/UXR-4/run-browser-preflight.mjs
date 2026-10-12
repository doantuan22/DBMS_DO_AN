import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const evidence = { timestamp: new Date().toISOString(), status: 'BLOCKED', attempts: [] };
for (const [name, executable, port] of [['chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe', 9401], ['edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 9402]]) {
  const result = { name, mode: 'real Chromium headless renderer', steps: [] }; evidence.attempts.push(result);
  if (!fs.existsSync(executable)) { result.error = 'Executable unavailable'; continue; }
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${path.resolve('.audit-output', `uxr4-${name}-${Date.now()}`)}`, 'about:blank'];
  const log = fs.openSync(path.join(directory, `${name}-startup.log`), 'w');
  const child = spawn(executable, args, { windowsHide: true, stdio: ['ignore', log, log] });
  child.on('exit', (code) => { result.exitCode = code; });
  let socket;
  try {
    let target;
    for (let i = 0; i < 8; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try { const rows = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1000) }).then((r) => r.json()); target = rows.find((r) => r.type === 'page'); if (target) break; } catch { /* Wait for owned browser startup. */ }
    }
    if (!target) throw new Error('No renderer target');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Renderer unavailable')), 4000); socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true }); socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Renderer unavailable')); }, { once: true }); });
    let id = 0; const callbacks = new Map();
    socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); callbacks.get(message.id)?.(message); });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const sequence = ++id, timer = setTimeout(() => reject(new Error(`${method}: timeout`)), 4000); callbacks.set(sequence, (r) => { clearTimeout(timer); callbacks.delete(sequence); r.error ? reject(new Error(r.error.message)) : resolve(r.result); }); socket.send(JSON.stringify({ id: sequence, method, params })); });
    const value = await send('Runtime.evaluate', { expression: `document.body.innerHTML='<input id="x"><button id="y" onclick="document.body.dataset.ok=x.value">Test</button>';x.value='renderer-ok';y.click();document.body.dataset.ok`, returnByValue: true });
    if (value.result?.value !== 'renderer-ok') throw new Error('JavaScript/input/button failed'); result.steps.push('JavaScript/input/button');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(directory, `${name}-preflight.png`), Buffer.from(screenshot.data, 'base64')); result.steps.push('Screenshot'); result.status = 'PASS'; evidence.status = 'PASS';
    await send('Browser.close');
  } catch (error) { result.status = 'BLOCKED'; result.error = error.message; }
  finally { socket?.close(); child.kill(); fs.closeSync(log); }
}
fs.writeFileSync(path.join(directory, 'browser-preflight.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence));

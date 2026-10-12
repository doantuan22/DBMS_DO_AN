import fs from 'node:fs/promises';
import path from 'node:path';

const [port = '9375', browser = 'edge'] = process.argv.slice(2);
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const result = { browser, port, status: 'BLOCKED', steps: [], timestamp: new Date().toISOString() };
let socket;
try {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json());
  const target = targets.find((entry) => entry.type === 'page');
  if (!target) throw new Error('No page target');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Renderer WebSocket unavailable')), 5000);
    socket.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Renderer WebSocket error')); }, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (request) { pending.delete(message.id); request(message); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => reject(new Error(`${method} timed out`)), 5000);
    pending.set(id, (message) => { clearTimeout(timeout); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Page.navigate', { url: 'data:text/html,<input id="input"><button id="button" onclick="document.body.dataset.clicked=input.value">Test</button>' });
  const evaluated = await send('Runtime.evaluate', { expression: `document.getElementById('input').value='renderer-ok';document.getElementById('button').click();document.body.dataset.clicked`, returnByValue: true });
  if (evaluated.result?.value !== 'renderer-ok') throw new Error('Input/button/JavaScript preflight did not complete');
  result.steps.push('JavaScript, input, button');
  const capture = await send('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(path.join(directory, `${browser}-preflight.png`), Buffer.from(capture.data, 'base64'));
  result.steps.push('Screenshot'); result.status = 'PASS';
} catch (error) { result.error = error.message; }
finally { socket?.close(); }
await fs.writeFile(path.join(directory, `${browser}-preflight.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));

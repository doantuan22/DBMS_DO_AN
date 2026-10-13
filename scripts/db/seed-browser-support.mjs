import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { credentials, root } from '../../scripts/db/lib.mjs';
import { preflight } from '../../scripts/db/test-target.mjs';
import { createServer, preview } from '../../frontend/node_modules/vite/dist/node/index.js';
export const database = 'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012';
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function open({
  production = false,
  database: selectedDatabase = database,
  cacheDir,
} = {}) {
  if (
    ![
      'CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012',
      'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012',
    ].includes(selectedDatabase)
  )
    throw new Error('Explicit demo/test browser target required');
  const proof = preflight(selectedDatabase);
  if (!proof.target) throw new Error('Test target missing');
  Object.assign(process.env, credentials(), { DB_DATABASE: selectedDatabase });
  const { createApp } = await import('../../backend/src/app.js');
  const { closePool } = await import('../../backend/src/db/pool.js');
  const api = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => api.once('listening', resolve));
  const apiBase = `http://127.0.0.1:${api.address().port}`;
  const vite = production
    ? await preview({
        root: root + '/frontend',
        build: { outDir: root + '/.audit-output/public-redesign-dist' },
        preview: { host: '127.0.0.1', port: 0, proxy: { '/api': apiBase } },
      })
    : await createServer({
        root: root + '/frontend',
        ...(cacheDir ? { cacheDir } : {}),
        server: { host: '127.0.0.1', port: 0, proxy: { '/api': apiBase } },
      });
  if (!production) await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const profile = root + '/.audit-output/seed-v2/browser/edge-' + Date.now();
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      'about:blank',
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  const poll = async (fn, message = 'condition', timeout = 20000) => {
    const until = Date.now() + timeout;
    while (Date.now() < until) {
      if (await fn()) return;
      await wait(100);
    }
    throw new Error('Timeout: ' + message);
  };
  await poll(() => fs.existsSync(profile + '/DevToolsActivePort'), 'Edge');
  const port = fs.readFileSync(profile + '/DevToolsActivePort', 'utf8').split('\n')[0];
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let next = 0;
  const pending = new Map(),
    errors = [],
    listeners = new Set();
  ws.addEventListener('message', (event) => {
    const m = JSON.parse(event.data);
    if (m.id) {
      const p = pending.get(m.id);
      if (p) {
        clearTimeout(p.timer);
        pending.delete(m.id);
        m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
      }
    } else {
      if (m.method === 'Runtime.exceptionThrown')
        errors.push(
          m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text,
        );
      for (const listener of listeners) listener(m);
    }
  });
  const cdp = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++next,
        timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error('CDP timeout ' + method));
        }, 20000);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await cdp('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails)
      throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  const request = async (p, method = 'GET', body, token) => {
    const r = await fetch(apiBase + '/api' + p, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, data: await r.json() };
  };
  const login = async (email) => {
    const r = await request('/auth/login', 'POST', {
      Email: email,
      MatKhau: 'CinemaStarDemo!2026',
    });
    if (!r.data.token) throw new Error('Login failed ' + email);
    return r.data.token;
  };
  const navigate = async (route, token) => {
    const hook = await cdp('Page.addScriptToEvaluateOnNewDocument', {
      source: `sessionStorage.clear();${token ? `sessionStorage.setItem('cinema_access_token',${JSON.stringify(token)});` : ''}`,
    });
    await cdp('Page.navigate', { url: origin + route });
    await poll(
      () =>
        evaluate(
          "Boolean(document.querySelector('main')) && !document.body.textContent.includes('Đang khôi phục phiên đăng nhập')",
        ),
      'page ' + route,
    );
    await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: hook.identifier });
    await wait(700);
    await poll(
      () =>
        evaluate(
          "!document.body.textContent.includes('Đang tải') && !document.body.textContent.includes('Đang xác nhận')",
        ),
      'data ' + route,
    ).catch(() => {});
    await evaluate('document.fonts.ready.then(()=>true)');
  };
  const size = (width, height) =>
    cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  const screenshot = async (file) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  };
  const close = async () => {
    ws.close();
    child.kill();
    await vite.close();
    await new Promise((resolve) => api.close(resolve));
    await closePool();
  };
  return {
    cdp,
    evaluate,
    poll,
    request,
    login,
    navigate,
    size,
    screenshot,
    close,
    errors,
    origin,
    root,
    onEvent: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

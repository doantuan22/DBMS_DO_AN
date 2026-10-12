import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cdpPort = Number(process.env.UXR2A_CDP_PORT ?? 9359);
const appUrl = process.env.UXR2A_URL ?? 'http://127.0.0.1:5193/tests/uxr2a-components.html';
const root = process.cwd();
const evidenceDir = path.join(root, 'docs', 'UXR-V3', 'UXR-2A');
const screenshotDir = path.join(evidenceDir, 'screenshots');
const mode = process.argv[2];
const commandTimeoutMs = Number(process.env.UXR2A_CDP_TIMEOUT_MS ?? 5000);
const json = async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(commandTimeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).pathname}`);
  return response.json();
};

await fs.mkdir(screenshotDir, { recursive: true });
const version = await json(`http://127.0.0.1:${cdpPort}/json/version`);
const targets = await json(`http://127.0.0.1:${cdpPort}/json/list`);
let target = targets.find((entry) => entry.type === 'page');
if (!target) {
  target = await json(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: 'PUT' });
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('CDP page WebSocket open timed out.')), commandTimeoutMs);
  ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
  ws.addEventListener('error', (error) => { clearTimeout(timer); reject(error); }, { once: true });
  ws.addEventListener('close', () => { clearTimeout(timer); reject(new Error('CDP page WebSocket closed before opening.')); }, { once: true });
});

let sequence = 0;
const pending = new Map();
const runtimeErrors = [];
const serverErrors = [];
ws.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) handlers.reject(new Error(message.error.message));
    else handlers.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') runtimeErrors.push(message.params.entry.text);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 500) {
    serverErrors.push({ status: message.params.response.status, type: message.params.type });
  }
});

const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => {
    pending.delete(id);
    reject(new Error(`${method} timed out after ${commandTimeoutMs}ms.`));
  }, commandTimeoutMs);
  pending.set(id, {
    resolve: (value) => { clearTimeout(timer); resolve(value); },
    reject: (error) => { clearTimeout(timer); reject(error); },
  });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (duration = 150) => new Promise((resolve) => setTimeout(resolve, duration));
const waitFor = async (expression, timeout = 10000) => {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await evaluate(expression)) return;
    await sleep();
  }
  throw new Error(`Timed out waiting for browser condition: ${expression}`);
};
const key = async (keyValue, code = keyValue, modifiers = 0) => {
  const windowsVirtualKeyCode = keyValue.length === 1 ? keyValue.toUpperCase().charCodeAt(0) : ({ Enter: 13, Escape: 27, Tab: 9, ArrowDown: 40 }[keyValue] ?? 0);
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: keyValue, code, modifiers, windowsVirtualKeyCode });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: keyValue, code, modifiers, windowsVirtualKeyCode });
};
const clickByKeyboard = async (selector) => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.focus()`);
  await key('Enter');
  await sleep(120);
};
const screenshot = async (name) => {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await fs.writeFile(path.join(screenshotDir, name), Buffer.from(data, 'base64'));
};
const saveJson = async (name, value) => fs.writeFile(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Log.enable');
await cdp('Network.enable');

if (mode === '--preflight') {
  const html = '<!doctype html><html><body><label>Preflight input <input id="probe"></label><button id="probe-button">Run probe</button><output id="result"></output><script>document.querySelector("#probe-button").addEventListener("click",()=>document.querySelector("#result").textContent=document.querySelector("#probe").value === "renderer-ready" ? "PASS" : "FAIL")</script></body></html>';
  await cdp('Page.navigate', { url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` });
  await waitFor('document.readyState === "complete" && !!document.querySelector("#probe-button")');
  await evaluate('document.querySelector("#probe").focus()');
  await cdp('Input.insertText', { text: 'renderer-ready' });
  await clickByKeyboard('#probe-button');
  await waitFor('document.querySelector("#result")?.textContent === "PASS"');
  const evidence = {
    result: 'PASS',
    browser: version.Browser,
    renderer: await evaluate('({readyState: document.readyState, title: document.title, value: document.querySelector("#probe").value, result: document.querySelector("#result").textContent})'),
    runtimeErrors,
  };
  await screenshot('browser-preflight.png');
  await saveJson('browser-preflight.json', evidence);
  if (runtimeErrors.length) throw new Error(`Preflight emitted browser errors: ${runtimeErrors.join('; ')}`);
  console.log(JSON.stringify(evidence, null, 2));
  ws.close();
  process.exit(0);
}

if (mode !== '--acceptance') throw new Error('Expected --preflight or --acceptance.');

await cdp('Page.navigate', { url: appUrl });
await waitFor('document.readyState === "complete" && document.querySelector("[data-testid=uxr2a-fixture-only]")?.children.length > 0');
await sleep(500);
const checks = [];
const check = async (name, assertion) => {
  if (!assertion) throw new Error(`FAIL: ${name}`);
  checks.push({ name, result: 'PASS' });
};

await check('fixture is rendered in real browser', await evaluate('!!document.querySelector("[data-testid=uxr2a-fixture-only]")'));
await check('selector starts with real selected option value and visible name', await evaluate('document.querySelector("select[aria-label=\\"Cinema fixture\\"]").value === "101" && [...document.querySelector("select[aria-label=\\"Cinema fixture\\"]").options].some((option) => option.value === "101" && option.textContent === "Central Cinema")'));

await evaluate('document.querySelector("select[aria-label=\\"Cinema fixture\\"]").focus()');
await key('ArrowDown', 'ArrowDown');
await check('native selector keyboard changes selected ID', await evaluate('document.querySelector("select[aria-label=\\"Cinema fixture\\"]").value === "102" && document.querySelector("[data-testid=selected-resource]").textContent.includes("102")'));
await evaluate('document.querySelector("input[type=search]").focus()');
await cdp('Input.insertText', { text: 'Riverside' });
await clickByKeyboard('[data-testid=switch-fixture-scope]');
await waitFor('document.querySelector("input[type=search]").value === ""');
await check('changing selector scope remounts search state', await evaluate('document.querySelector("select[aria-label=\\"Cinema fixture\\"]").value === "102" && document.querySelector("input[type=search]").value === ""'));

await evaluate('document.querySelector("[data-testid=filter-search]").focus()');
await cdp('Input.insertText', { text: 'alpha' });
await key('Enter');
await waitFor('document.querySelector(".ui-filter-bar__chips")?.textContent.includes("alpha")');
await check('filter Enter applies draft and exposes applied chip', await evaluate('document.querySelector(".ui-filter-bar__chips").textContent.includes("alpha") && !document.querySelector(".ui-filter-bar__pending")'));
await evaluate('document.querySelector("[data-testid=filter-search]").focus()');
await cdp('Input.insertText', { text: ' edited' });
await check('edited filter remains draft before apply', await evaluate('!!document.querySelector(".ui-filter-bar__pending") && document.querySelector(".ui-filter-bar__chips").textContent.includes("alpha")'));
await clickByKeyboard('button[type=reset]');
await waitFor('document.querySelector("[data-testid=filter-search]").value === ""');
await check('filter reset clears draft and applied state', await evaluate('!document.querySelector(".ui-filter-bar__pending") && !document.querySelector(".ui-filter-bar__chips")'));

// Query the named next control directly; this avoids coupling to neighboring markup.
await evaluate('[...document.querySelectorAll(".ui-resource-table__pagination button")].find((button) => button.textContent.includes("Trang sau"))?.focus()');
await key('Enter');
await waitFor('document.querySelector(".ui-data-table tbody")?.textContent.includes("Resource Gamma")');
await check('server-shaped pagination updates visible fixture rows and global STT', await evaluate('document.querySelector(".ui-data-table tbody").textContent.includes("Resource Gamma") && document.querySelector(".ui-data-table tbody .ui-data-table__row-number").textContent === "3"'));
await check('technical fixture row IDs are not displayed as cells', await evaluate('![...document.querySelectorAll(".ui-data-table td")].some((cell) => cell.textContent.includes("91003"))'));

await clickByKeyboard('.ui-page-header__actions button');
await waitFor('document.querySelector("dialog")?.open === true');
await check('confirmation opens as modal and receives focus inside', await evaluate('document.querySelector("dialog").contains(document.activeElement) && document.querySelector("dialog").getAttribute("aria-modal") === "true"'));
const tabResults = [];
for (let index = 0; index < 7; index++) {
  await key('Tab');
  tabResults.push(await evaluate('document.querySelector("dialog")?.contains(document.activeElement) === true'));
}
for (let index = 0; index < 7; index++) {
  await key('Tab', 'Tab', 8);
  tabResults.push(await evaluate('document.querySelector("dialog")?.contains(document.activeElement) === true'));
}
await check('Tab and Shift+Tab stay inside confirmation dialog', tabResults.every(Boolean));
await key('Escape');
await waitFor('document.querySelector("dialog")?.open === false');
await check('Escape closes dialog and restores focus to opener', await evaluate('document.activeElement?.textContent.includes("Open confirmation")'));

await evaluate('[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Show conflict"))?.focus()');
await key('Enter');
await check('AsyncState conflict announcement is exposed', await evaluate('document.querySelector(".ui-async-state--conflict[role=alert]")?.textContent.includes("Dữ liệu đã thay đổi") === true'));

const viewportResults = [];
for (const width of [390, 768, 1280, 1440, 1920]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
  await sleep(200);
  const result = await evaluate('({width: window.innerWidth, viewportScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, tableScrollWidth: document.querySelector(".ui-data-table-scroll")?.scrollWidth, tableClientWidth: document.querySelector(".ui-data-table-scroll")?.clientWidth})');
  viewportResults.push({ ...result, overflow: result.viewportScrollWidth > width || result.bodyScrollWidth > width });
  await screenshot(`shared-components-${width}.png`);
}
await check('no document-level horizontal overflow at all requested widths', viewportResults.every((entry) => !entry.overflow));
await check('no browser console/runtime errors', runtimeErrors.length === 0);
await check('no HTTP 5xx responses', serverErrors.length === 0);

const evidence = {
  result: 'PASS',
  browser: version.Browser,
  appUrl,
  checks,
  viewportResults,
  runtimeErrors,
  serverErrors,
  scope: 'component interaction fixture only; no application API or business records are used',
};
await saveJson('browser-acceptance.json', evidence);
console.log(JSON.stringify(evidence, null, 2));
ws.close();

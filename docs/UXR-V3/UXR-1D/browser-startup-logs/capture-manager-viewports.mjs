import { mkdirSync, writeFileSync } from 'node:fs';

const port = Number(process.env.UXR1D_CDP_PORT ?? 9350);
const appUrl = process.env.UXR1D_APP_URL ?? 'http://localhost:5174';
const evidenceRoot = 'docs/UXR-V3/UXR-1D';
const screenshotRoot = `${evidenceRoot}/screenshots`;
mkdirSync(screenshotRoot, { recursive: true });

const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((entry) => entry.type === 'page');
if (!target) throw new Error('Dedicated Chrome page is unavailable.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Page connection timeout.')), 5000);
  ws.onopen = () => {
    clearTimeout(timeout);
    resolve();
  };
  ws.onerror = () => reject(new Error('Page connection failed.'));
});

let id = 0;
const waiting = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const item = waiting.get(message.id);
  if (!item) return;
  waiting.delete(message.id);
  if (message.error) item.reject(new Error(message.error.message));
  else item.resolve(message.result);
};
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const commandId = ++id;
  const timeout = setTimeout(() => {
    waiting.delete(commandId);
    reject(new Error(`${method} timeout`));
  }, 8000);
  waiting.set(commandId, {
    resolve: (value) => { clearTimeout(timeout); resolve(value); },
    reject: (error) => { clearTimeout(timeout); reject(error); },
  });
  ws.send(JSON.stringify({ id: commandId, method, params }));
});
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Renderer evaluation failed.');
  return result.result?.value;
};
const waitFor = async (expression) => {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Manager portal did not finish loading.');
};

await call('Page.enable');
await call('Runtime.enable');
await call('Page.navigate', { url: `${appUrl}/manager` });
await waitFor("document.body.innerText.includes('Manager Portal') && document.body.innerText.includes('Phòng chiếu')");

async function capture(width, height, mobile, name, scrollToSelector) {
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (scrollToSelector) {
    await evaluate(`document.querySelector(${JSON.stringify(scrollToSelector)})?.scrollIntoView({block:'start'})`);
  } else {
    await evaluate('window.scrollTo(0, 0)');
  }
  await new Promise((resolve) => setTimeout(resolve, 150));
  const layout = await evaluate(`({
    viewportWidth: innerWidth,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth,
  })`);
  const image = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = `${screenshotRoot}/${name}.png`;
  writeFileSync(path, Buffer.from(image.data, 'base64'));
  return { width, height, ...layout, screenshot: path };
}

const viewports = [];
for (const [width, height, mobile] of [
  [390, 844, true],
  [768, 1024, true],
  [1280, 900, false],
  [1440, 1000, false],
  [1920, 1080, false],
]) viewports.push(await capture(width, height, mobile, `manager-${width}-after`, null));

const detailViews = [
  await capture(390, 844, true, 'manager-showtimes-390-after', '#manager-showtimes'),
  await capture(1280, 900, false, 'manager-showtimes-1280-after', '#manager-showtimes'),
];
const result = {
  browser: version.Browser,
  route: '/manager',
  viewports,
  detailViews,
  horizontalOverflow: [...viewports, ...detailViews].some((item) => item.horizontalOverflow),
};
writeFileSync(`${evidenceRoot}/browser-responsive-evidence.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ browser: result.browser, overflow: result.horizontalOverflow, viewports: viewports.length, detailViews: detailViews.length }));
ws.close();

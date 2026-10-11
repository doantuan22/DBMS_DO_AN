import { writeFileSync } from 'node:fs';

const port = Number(process.env.UXR1D_CDP_PORT ?? 9350);
const screenshotPath =
  process.env.UXR1D_PREFLIGHT_SCREENSHOT ??
  'docs/UXR-V3/UXR-1D/screenshots/browser-preflight-1280.png';
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const browser = await (async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return response.json();
    } catch {
      // Wait for the already-launched, dedicated test browser.
    }
    await pause(250);
  }
  throw new Error('DevTools endpoint unavailable');
})();

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((candidate) => candidate.type === 'page');
if (!target) throw new Error('No page target found');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Page WebSocket open timed out')), 5000);
  socket.onopen = () => {
    clearTimeout(timeout);
    resolve();
  };
  socket.onerror = () => {
    clearTimeout(timeout);
    reject(new Error('Page WebSocket failed'));
  };
});

let commandId = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const item = pending.get(message.id);
  if (!item) return;
  pending.delete(message.id);
  if (message.error) item.reject(new Error(message.error.message));
  else item.resolve(message.result);
};

function command(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, 7000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const html = `<!doctype html><html><head><title>UXR-1D browser preflight</title></head>
<body><label for="sample">Preflight input</label><input id="sample">
<button id="action" onclick="document.querySelector('#result').textContent=document.querySelector('#sample').value">Apply</button>
<output id="result"></output></body></html>`;
await command('Page.navigate', {
  url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
});
await pause(300);

const ready = await command('Runtime.evaluate', {
  expression: 'document.readyState',
  returnByValue: true,
});
if (ready.result.value !== 'complete') throw new Error('Test page did not finish loading');

const interaction = await command('Runtime.evaluate', {
  expression: `(() => {
    const input = document.querySelector('#sample');
    input.focus();
    input.value = 'renderer-ok';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#action').click();
    return {
      title: document.title,
      inputValue: input.value,
      outputValue: document.querySelector('#result').textContent,
    };
  })()`,
  returnByValue: true,
});

const result = interaction.result.value;
if (result.inputValue !== 'renderer-ok' || result.outputValue !== 'renderer-ok') {
  throw new Error('Input/button interaction failed');
}

const screenshot = await command('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: false,
});
writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
socket.close();

console.log(
  JSON.stringify({
    preflight: 'PASS',
    browser: browser.Browser,
    rendererJavascript: true,
    inputButtonInteraction: true,
    screenshotPath,
  }),
);

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const evidenceDir = path.join(root, 'docs', 'UXR-V3', 'UXR-2A');
const screenshotPath = path.join(evidenceDir, 'screenshots', 'renderer-preflight-1280.png');
const cdpPort = Number(process.env.UXR2A_CDP_PORT ?? 9369);
const chromePath = process.env.UXR2A_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profilePath = path.join(root, '.audit-output', `uxr2a-node-spawn-profile-${Date.now()}`);
const evidencePath = path.join(evidenceDir, 'browser-preflight-node-spawn.json');
const stdoutPath = path.join(evidenceDir, 'chrome-node-spawn-preflight.stdout.log');
const stderrPath = path.join(evidenceDir, 'chrome-node-spawn-preflight.stderr.log');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(path.dirname(profilePath), { recursive: true });
await mkdir(path.dirname(screenshotPath), { recursive: true });
const portCheck = createServer();
await new Promise((resolve, reject) => {
  portCheck.once('error', reject);
  portCheck.listen(cdpPort, '127.0.0.1', () => portCheck.close(resolve));
});

const stdout = createWriteStream(stdoutPath);
const stderr = createWriteStream(stderrPath);
const browser = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profilePath}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { cwd: root, env: process.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
browser.stdout.pipe(stdout);
browser.stderr.pipe(stderr);

let stage = 'browser launch';
let browserVersion = null;
let preflightOutput = '';
let runnerError = null;
const pause = (ms) => sleep(ms);
const runTimed = (file, env, timeoutMs) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [file], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let errors = '';
  const timer = setTimeout(() => {
    child.kill();
    reject(new Error(`Preflight runner timed out after ${timeoutMs}ms.`));
  }, timeoutMs);
  child.stdout.on('data', (buffer) => { output += buffer.toString(); });
  child.stderr.on('data', (buffer) => { errors += buffer.toString(); });
  child.once('error', (error) => {
    clearTimeout(timer);
    reject(error);
  });
  child.once('exit', (code) => {
    clearTimeout(timer);
    if (code === 0) resolve(output.trim());
    else reject(new Error(`Preflight runner exited with ${code}: ${errors.slice(0, 500)}`));
  });
});

const result = {
  result: 'BLOCKED',
  browserExecutable: path.basename(chromePath),
  profile: path.relative(root, profilePath),
  launchMethod: 'Node child_process.spawn; matches the UXR-1D host runner',
  cdpPort,
  stage,
  rendererJavascript: 'NOT VERIFIED',
  inputButtonInteraction: 'NOT VERIFIED',
  screenshot: 'NOT CAPTURED',
};

try {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (browser.exitCode !== null) throw new Error(`Browser exited before CDP became ready (${browser.exitCode}).`);
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        browserVersion = await response.json();
        break;
      }
    } catch {
      await pause(200);
    }
  }
  if (!browserVersion) throw new Error('CDP version endpoint did not become available within 8 seconds.');
  result.browser = browserVersion.Browser;
  result.cdp = 'AVAILABLE';
  stage = 'renderer preflight';
  result.stage = stage;

  const preflightScript = path.join(root, 'docs', 'UXR-V3', 'UXR-1D', 'browser-startup-logs', 'host-preflight.mjs');
  preflightOutput = await runTimed(preflightScript, {
    ...process.env,
    UXR1D_CDP_PORT: String(cdpPort),
    UXR1D_PREFLIGHT_SCREENSHOT: path.relative(root, screenshotPath),
  }, 12000);
  const proof = JSON.parse(preflightOutput);
  if (proof.preflight !== 'PASS') throw new Error('Host preflight did not report PASS.');
  result.result = 'PASS';
  result.rendererJavascript = 'PASS';
  result.inputButtonInteraction = 'PASS';
  result.screenshot = path.relative(root, screenshotPath);
  result.preflightProof = proof;
} catch (error) {
  runnerError = error instanceof Error ? error.message : String(error);
  result.error = runnerError;
  result.stage = stage;
} finally {
  if (browser.exitCode === null && browser.signalCode === null) browser.kill();
  stdout.end();
  stderr.end();
  await new Promise((resolve) => setTimeout(resolve, 300));
  await writeFile(evidencePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
  if (result.result !== 'PASS') process.exitCode = 1;
}

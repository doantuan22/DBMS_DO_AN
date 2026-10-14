// Interactive Browser E2E — real Edge (Playwright) → real React frontend → real Express API →
// stored procedures → SQL Server `CinemaBookingDB_Test`.
//   node scripts/audit/browser-e2e.mjs [--headed] [--only=E2E-CUST-BOOK,E2E-ADM-CRUD]
//
// A scenario is marked PASS only when (1) every user step was performed through DOM events
// (click / fill / select — never by calling the API) and (2) the resulting rows were read back
// from SQL Server and matched. API calls are only used for read-only look-ups of fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  ACCOUNTS,
  DEMO_PASSWORD,
  OUTPUT_DIR,
  Reporter,
  assertTestDatabase,
  connectTestDb,
  freePort,
  one,
  rows,
  scalar,
  sleep,
  sql,
  startBackend,
  startFrontend,
} from './lib.mjs';
import { runIntegrityChecks } from './db-integrity.mjs';
import { scenarios } from './browser-scenarios.mjs';

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const SHOTS = path.join(OUTPUT_DIR, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const reporter = new Reporter('browser-e2e');
const { pool, identity, env } = await connectTestDb();
console.log(`Target: ${identity.db} as ${identity.login}`);

// Ports are reserved up-front so CORS (API → frontend origin) and the Vite API base are consistent.
const apiPort = await freePort();
const webPort = await freePort();
const api = await startBackend({ env, port: apiPort, frontendOrigin: `http://127.0.0.1:${webPort}` });
const web = await startFrontend({ apiBase: api.base, port: webPort });

const browser = await chromium.launch({ channel: 'msedge', headless: !headed });
const RUN = Date.now().toString(36);
const suiteContext = { pool, origin: web.origin, apiBase: api.base, RUN, env };

async function runScenario(definition) {
  if (only && !only.includes(definition.id)) return;
  await assertTestDatabase(pool);
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  context.setDefaultTimeout(30000);
  const page = await context.newPage();
  const serverErrors = [];
  const consoleErrors = [];
  page.on('response', (response) => {
    if (response.url().startsWith(api.base) && response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const started = Date.now();
  try {
    const evidence = await definition.run({ page, context, ...suiteContext, assert });
    assert.deepEqual(serverErrors, [], 'API returned 5xx during the scenario');
    assert.deepEqual(consoleErrors, [], 'uncaught page errors');
    await page.screenshot({ path: path.join(SHOTS, `${definition.id}.png`), fullPage: true }).catch(() => {});
    reporter.record(definition.id, definition.title, 'PASS', `${Date.now() - started} ms`, evidence);
  } catch (error) {
    await page.screenshot({ path: path.join(SHOTS, `${definition.id}.FAIL.png`), fullPage: true }).catch(() => {});
    const url = page.url();
    reporter.record(
      definition.id,
      definition.title,
      'FAIL',
      `${String(error.message).split(/\r?\n/).map((part) => part.trim()).filter(Boolean).join(' | ').slice(0, 700)} @ ${url}`,
    );
  } finally {
    await context.close();
  }
}

try {
  for (const definition of scenarios) await runScenario(definition);
  if (!only) await runIntegrityChecks(pool, reporter, { prefix: 'POST-' });
} finally {
  await browser.close();
  api.stop();
  web.stop();
  await pool.close();
}
const summary = reporter.finish({ run: RUN, browser: 'Microsoft Edge (Playwright channel msedge)' });
process.exit(summary.failed === 0 ? 0 : 1);

// Focused remaining exit-gate tests. Requires a real two-assignment fixture.
import { writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const root = 'docs/UXR-V3/UXR-1D';
const port = Number(process.env.UXR1D_CDP_PORT);
const appUrl = process.env.UXR1D_APP_URL;
const apiUrl = process.env.UXR1D_API_URL;
const scopeA = String(process.env.UXR1D_SCOPE_A);
const scopeB = String(process.env.UXR1D_SCOPE_B);
const scopeOther = String(process.env.UXR1D_SCOPE_OTHER);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const consoleErrors = [];
const exceptions = [];
const apiResponses = [];
const dialogs = [];
let nextDialogDecision;
let pausePredicate = null;
const heldResponses = new Set();
const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((entry) => entry.type === 'page');
assert.ok(target, 'A dedicated browser page is required.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
const call = (method, params = {}, timeoutMs = 10000) => new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, timeoutMs);
  pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
  ws.send(JSON.stringify({ id, method, params }));
});
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (pending.has(message.id)) {
    const item = pending.get(message.id); pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
    return;
  }
  if (message.method === 'Page.javascriptDialogOpening') {
    const expected = nextDialogDecision !== undefined;
    const accept = Boolean(nextDialogDecision);
    dialogs.push({ type: message.params.type, expected, accept });
    nextDialogDecision = undefined;
    void call('Page.handleJavaScriptDialog', { accept }).catch(() => {});
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push('console.error');
  if (message.method === 'Runtime.exceptionThrown') exceptions.push('runtime exception');
  if (message.method === 'Network.responseReceived') {
    const path = new URL(message.params.response.url).pathname;
    if (path.startsWith('/api/')) apiResponses.push({ endpoint: path.replace(/\/\d+/g, '/:id'), status: message.params.response.status });
  }
  if (message.method === 'Fetch.requestPaused') {
    const event = message.params;
    if (pausePredicate?.(new URL(event.request.url).pathname) && event.request.method === 'GET') heldResponses.add(event.requestId);
    else void call('Fetch.continueResponse', { requestId: event.requestId }).catch(() => {});
  }
};
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error('Browser evaluation failed.');
  return result.result?.value;
};
const wait = async (expression, timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error('Browser condition did not become true: ' + expression.slice(0, 100));
};
const click = async (selector) => {
  const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)throw Error('Missing control');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
};
const type = async (selector, text) => {
  await click(selector);
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await call('Input.insertText', { text });
};
const select = async (selector, value) => {
  await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event('change',{bubbles:true})); })()`);
};
// Real keyboard events change the existing cinema select and trigger its native confirm.
const changeScope = async (value, decision) => {
  nextDialogDecision = decision;
  const delta = await evaluate(`(() => { const e=document.querySelector('select[aria-label="Rạp hiện tại"]');e.focus();return [...e.options].findIndex(o=>o.value===${JSON.stringify(value)})-e.selectedIndex; })()`);
  assert.equal(Math.abs(delta), 1, 'Fixture should expose two different assigned cinemas.');
  const key = delta > 0 ? 'ArrowDown' : 'ArrowUp';
  const keyCode = delta > 0 ? 40 : 38;
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: keyCode });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: keyCode });
  await sleep(150);
};
const apiGet = (path) => evaluate(`(async()=>{const r=await fetch(${JSON.stringify(apiUrl + path)},{headers:{Authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')}});return {status:r.status,body:await r.json()};})()`);
const snapshot = () => evaluate(`(() => ({
  cinema:document.querySelector('select[aria-label="Rạp hiện tại"]')?.value,
  roomDraft:document.querySelector('#manager-rooms input[aria-label="Tên phòng"]')?.value,
  movie:document.querySelector('#manager-showtimes select[aria-label="Phim"]')?.value,
  showtimeRoom:document.querySelector('#manager-showtimes select[aria-label="Phòng"]')?.value,
  price:document.querySelector('#manager-showtimes input[aria-label="Giá vé cơ bản"]')?.value,
  roomOptions:[...document.querySelectorAll('#manager-showtimes select[aria-label="Phòng"] option')].map(e=>e.value).filter(Boolean).sort(),
  seatRoom:document.querySelector('select[aria-label="Phòng xem ghế"]')?.value,
  seatHeading:document.querySelector('#manager-seats h2')?.textContent.trim(),
  roomRows:[...document.querySelectorAll('#manager-rooms li')].map(e=>e.textContent.trim()),
  seatRows:[...document.querySelectorAll('#manager-seats li')].map(e=>e.textContent.trim()),
  showtimeRows:[...document.querySelectorAll('#manager-showtimes li')].map(e=>e.textContent.trim())
}))()`);
const waitScope = async (id, expected) => {
  await wait(`document.querySelector('select[aria-label="Rạp hiện tại"]')?.value===${JSON.stringify(id)} && document.querySelector('#manager-showtimes select[aria-label="Phòng"]') && !document.body.innerText.includes('Đang tải dữ liệu quản lý')`);
  const state = await snapshot();
  assert.deepEqual(state.roomOptions, expected.rooms.map((row) => String(row.id)).sort());
  assert.equal(state.roomRows.length, expected.rooms.length);
  expected.rooms.forEach((row) => assert.ok(state.roomRows.some((text) => text.startsWith(row.name + ' ·'))));
  assert.equal(state.showtimeRows.length, expected.showtimes.length);
  expected.showtimes.forEach((row) => assert.ok(state.showtimeRows.some((text) => text.startsWith(row.movieTitle + ' · ' + row.roomName + ' ·'))));
  return state;
};
const loadSeats = async (room) => {
  const expected = await apiGet(`/manager/rooms/${room.id}/seats`);
  assert.equal(expected.status, 200);
  assert.ok(expected.body.seats.every((seat) => seat.roomId === room.id));
  await select('select[aria-label="Phòng xem ghế"]', room.id);
  await click('#manager-seats > button');
  await wait(`document.querySelector('#manager-seats h2')?.textContent.includes(${JSON.stringify(room.name)}) && !document.querySelector('#manager-seats')?.innerText.includes('Đang tải ghế')`);
  const state = await snapshot();
  assert.equal(state.seatRoom, String(room.id));
  assert.equal(state.seatRows.length, expected.body.seats.length);
  expected.body.seats.forEach((row) => assert.ok(state.seatRows.some((text) => text.startsWith(row.label + ' ·'))));
};
const screenshot = async (name) => {
  await evaluate('window.scrollTo(0,0)');
  const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = `${root}/screenshots/${name}.png`;
  writeFileSync(path, Buffer.from(shot.data, 'base64'));
  return path;
};
const release = async () => {
  pausePredicate = null;
  for (const requestId of heldResponses) await call('Fetch.continueResponse', { requestId });
  heldResponses.clear();
  await call('Fetch.disable');
  await sleep(700);
};
try {
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${appUrl}/login` });
  await wait('Boolean(document.querySelector("input[type=email]"))');
  await type('input[type=email]', process.env.UXR1D_MANAGER_EMAIL);
  await type('input[type=password]', process.env.UXR1D_MANAGER_PASSWORD);
  await click('form button[type=submit]');
  await wait('location.pathname.startsWith("/manager") && Boolean(document.querySelector("#manager-showtimes"))');
  const assigned = await apiGet('/manager/cinemas');
  assert.equal(assigned.status, 200);
  assert.equal(assigned.body.cinemas.length, 2);
  const resources = {};
  for (const id of [scopeA, scopeB]) {
    const [rooms, shows] = await Promise.all([apiGet(`/manager/cinemas/${id}/rooms`), apiGet(`/manager/cinemas/${id}/showtimes`)]);
    assert.equal(rooms.status, 200); assert.equal(shows.status, 200);
    resources[id] = { rooms: rooms.body.rooms, showtimes: shows.body.showtimes };
    assert.ok(resources[id].rooms.length, 'Each assigned cinema must have a real room.');
    assert.ok(resources[id].rooms.every((room) => String(room.cinemaId) === id));
    assert.ok(resources[id].showtimes.every((show) => String(show.cinemaId) === id));
  }
  await select('select[aria-label="Rạp hiện tại"]', scopeA);
  await waitScope(scopeA, resources[scopeA]);
  await loadSeats(resources[scopeA].rooms[0]);
  const movies = await apiGet('/movies');
  const movie = (movies.body.movies ?? movies.body.data?.movies)[0];
  await type('#manager-rooms input[aria-label="Tên phòng"]', 'UXR1D unsaved room draft');
  await select('#manager-showtimes select[aria-label="Phim"]', movie.id);
  await select('#manager-showtimes select[aria-label="Phòng"]', resources[scopeA].rooms[0].id);
  await type('#manager-showtimes input[aria-label="Giá vé cơ bản"]', '91234.56');
  const draftBefore = await snapshot();
  const dialogCount = dialogs.length;
  await changeScope(scopeB, false);
  assert.equal(dialogs.length, dialogCount + 1);
  assert.equal(dialogs.at(-1).type, 'confirm');
  assert.equal(dialogs.at(-1).accept, false);
  assert.deepEqual(await snapshot(), draftBefore, 'Cancel must preserve scope and every observed form/resource state.');
  results.push({ scenario: 'Dirty form -> change cinema -> Cancel', status: 'PASS', scopeRetained: true, draftAndResourceStateRetained: true, screenshot: await screenshot('manager-scope-cancel-1280') });
  await changeScope(scopeB, true);
  const stateB = await waitScope(scopeB, resources[scopeB]);
  assert.equal(dialogs.length, dialogCount + 2); assert.equal(dialogs.at(-1).accept, true);
  assert.equal(stateB.roomDraft, ''); assert.equal(stateB.movie, ''); assert.equal(stateB.showtimeRoom, '');
  assert.equal(stateB.price, '80000'); assert.equal(stateB.seatRoom, ''); assert.equal(stateB.seatRows.length, 0);
  results.push({ scenario: 'Dirty form -> change cinema -> Confirm', status: 'PASS', targetScopeLoaded: true, dependentFormAndSeatStateReset: true, screenshot: await screenshot('manager-scope-confirm-1280') });
  await loadSeats(resources[scopeB].rooms[0]);
  await changeScope(scopeA);
  const cleanA = await waitScope(scopeA, resources[scopeA]);
  assert.equal(cleanA.seatRoom, ''); assert.equal(cleanA.seatRows.length, 0);
  await loadSeats(resources[scopeA].rooms[0]);
  await changeScope(scopeB); await waitScope(scopeB, resources[scopeB]);
  await loadSeats(resources[scopeB].rooms[0]);
  await changeScope(scopeA); await waitScope(scopeA, resources[scopeA]);
  results.push({ scenario: 'Cinema A -> B -> A resource isolation', status: 'PASS', roomOptionsScoped: true, showtimesScoped: true, previousSeatStateCleared: true, noUnexpectedDialogs: dialogs.length === dialogCount + 2 });

  const roomA = resources[scopeA].rooms[0];
  pausePredicate = (path) => path === `/api/manager/rooms/${roomA.id}/seats`;
  await call('Fetch.enable', { patterns: [{ urlPattern: '*manager/rooms/*/seats', requestStage: 'Response' }] });
  await select('select[aria-label="Phòng xem ghế"]', roomA.id);
  await click('#manager-seats > button');
  const deadline = Date.now() + 15000;
  while (!heldResponses.size && Date.now() < deadline) await sleep(100);
  assert.ok(heldResponses.size, 'A real seat response must be held.');
  await changeScope(scopeB); await waitScope(scopeB, resources[scopeB]);
  await loadSeats(resources[scopeB].rooms[0]);
  const beforeOldSeat = await snapshot();
  await release();
  assert.deepEqual(await snapshot(), beforeOldSeat);
  results.push({ scenario: 'Late seat response from previous cinema', status: 'PASS', realResponseDelayed: true, staleStateIgnored: true });

  pausePredicate = (path) => new RegExp(`/api/manager/cinemas/${scopeA}/(rooms|showtimes|pricing|dashboard)$`).test(path);
  await call('Fetch.enable', { patterns: [{ urlPattern: '*manager/cinemas/*', requestStage: 'Response' }] });
  await changeScope(scopeA);
  const resourceDeadline = Date.now() + 15000;
  while (heldResponses.size < 4 && Date.now() < resourceDeadline) await sleep(100);
  assert.ok(heldResponses.size >= 4, 'Four real earlier-scope resource responses must be held.');
  await changeScope(scopeB); await waitScope(scopeB, resources[scopeB]);
  await loadSeats(resources[scopeB].rooms[0]);
  const beforeOldWorkspace = await snapshot();
  const delayedCount = heldResponses.size;
  await release();
  assert.deepEqual(await snapshot(), beforeOldWorkspace);
  results.push({ scenario: 'Late workspace responses after A -> B -> A -> B', status: 'PASS', realDelayedResponses: delayedCount, staleRoomsAndShowtimesIgnored: true, screenshot: await screenshot('manager-scope-race-1280') });
  const statuses = [];
  for (const id of [scopeA, scopeB, scopeOther]) statuses.push((await apiGet(`/manager/cinemas/${id}/rooms`)).status);
  assert.deepEqual(statuses, [200, 200, 403]);
  results.push({ scenario: 'Backend authorization after context switches', status: 'PASS', assignedScopeA: 200, assignedScopeB: 200, unassignedScope: 403 });
  assert.equal(consoleErrors.length, 0); assert.equal(exceptions.length, 0);
  assert.equal(apiResponses.filter((response) => response.status >= 500).length, 0);
  assert.ok(dialogs.every((dialog) => dialog.expected));
  results.push({ scenario: 'Focused browser console and runtime', status: 'PASS', consoleErrors: 0, runtimeExceptions: 0, api5xx: 0, expectedConfirmDialogs: dialogs.length });
} catch (error) {
  results.push({ scenario: 'Focused exit-gate suite', status: 'FAIL', reason: error.message });
  process.exitCode = 1;
} finally {
  await call('Fetch.disable').catch(() => {});
  const output = { testedAt: new Date().toISOString(), browser: version.Browser, results, dialogs, apiResponses };
  writeFileSync(`${root}/browser-scope-exit-gate-results.json`, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ results }));
  ws.close();
}

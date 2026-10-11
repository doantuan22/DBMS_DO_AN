import { mkdirSync, writeFileSync } from 'node:fs';

const cdpPort = Number(process.env.UXR1D_CDP_PORT ?? 9350);
const appUrl = process.env.UXR1D_APP_URL ?? 'http://localhost:5174';
const apiUrl = process.env.UXR1D_API_URL ?? 'http://localhost:4310/api';
const email = process.env.UXR1D_MANAGER_EMAIL;
const password = process.env.UXR1D_MANAGER_PASSWORD;
const evidenceDir = 'docs/UXR-V3/UXR-1D';
const screenshotDir = `${evidenceDir}/screenshots`;
mkdirSync(screenshotDir, { recursive: true });
if (!email || !password) throw new Error('Set manager test credentials in process environment.');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const requests = [];
const responses = [];
const consoleErrors = [];
const pageExceptions = [];
let fetchControl = null;
let dialogAccept = null;
let dialogEvents = [];

function record(name, status, details = {}) {
  results.push({ name, status, ...details });
}

const browser = await (async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (response.ok) return response.json();
    } catch {
      // The host preflight owns the dedicated browser process.
    }
    await sleep(250);
  }
  throw new Error('Dedicated Chrome DevTools endpoint is unavailable.');
})();
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((item) => item.type === 'page');
if (!target) throw new Error('Dedicated browser has no page target.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Page DevTools connection timed out.')), 5000);
  ws.onopen = () => {
    clearTimeout(timer);
    resolve();
  };
  ws.onerror = () => {
    clearTimeout(timer);
    reject(new Error('Page DevTools connection failed.'));
  };
});

let nextId = 0;
const pending = new Map();
let raceState = null;
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const item = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error')
    consoleErrors.push({ type: 'console.error' });
  if (message.method === 'Runtime.exceptionThrown') pageExceptions.push({ type: 'exception' });
  if (message.method === 'Page.javascriptDialogOpening') {
    dialogEvents.push(message.params.type);
    void call('Page.handleJavaScriptDialog', { accept: Boolean(dialogAccept) }).catch(() => {});
    dialogAccept = null;
  }
  if (message.method === 'Network.requestWillBeSent') {
    const request = message.params.request;
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      let body;
      try {
        body = request.postData ? JSON.parse(request.postData) : undefined;
      } catch {
        body = undefined;
      }
      requests.push({
        method: request.method,
        path: url.pathname,
        body,
        requestId: message.params.requestId,
      });
    }
  }
  if (message.method === 'Network.responseReceived') {
    const url = new URL(message.params.response.url);
    if (url.pathname.startsWith('/api/'))
      responses.push({ path: url.pathname, status: message.params.response.status });
  }
  if (message.method === 'Fetch.requestPaused') void onFetchPaused(message.params);
};

function call(method, params = {}, timeoutMs = 8000) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function onFetchPaused(event) {
  const url = new URL(event.request.url);
  const method = event.request.method;
  const moviePath = `${new URL(apiUrl).pathname.replace(/\/$/, '')}/movies`;
  if (fetchControl && method === 'GET' && url.pathname === moviePath) {
    if (fetchControl.failMovieOnce) {
      fetchControl.failMovieOnce = false;
      await call('Fetch.failRequest', { requestId: event.requestId, errorReason: 'Failed' }).catch(
        () => {},
      );
      return;
    }
    if (fetchControl.pauseMovieOnce) {
      fetchControl.pauseMovieOnce = false;
      fetchControl.pausedMovieId = event.requestId;
      fetchControl.resolveMoviePause?.(event.requestId);
      return;
    }
  }
  if (fetchControl?.raceRoomId && method === 'GET') {
    const match = url.pathname.match(/\/manager\/rooms\/(\d+)\/seats$/);
    if (match && match[1] === String(fetchControl.raceRoomId) && !fetchControl.pausedRaceId) {
      fetchControl.pausedRaceId = event.requestId;
      fetchControl.resolveRacePause?.(event.requestId);
      return;
    }
  }
  if (raceState && method === 'GET') {
    const match = url.pathname.match(/\/manager\/rooms\/(\d+)\/seats$/);
    if (match && match[1] === String(raceState.releaseRoomId)) {
      raceState.secondRoomObserved = true;
      await call('Fetch.continueRequest', { requestId: event.requestId }).catch(() => {});
      raceState.resolveSecondRoom?.();
      return;
    }
  }
  await call('Fetch.continueRequest', { requestId: event.requestId }).catch(() => {});
}

async function evaluate(expression, { awaitPromise = false } = {}) {
  const value = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
    userGesture: true,
  });
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.text ?? 'Renderer evaluation failed.');
  return value.result?.value;
}

async function waitFor(expression, timeoutMs = 15000) {
  const end = Date.now() + timeoutMs;
  let last;
  while (Date.now() < end) {
    try {
      last = await evaluate(expression, { awaitPromise: true });
      if (last) return last;
    } catch {
      // Retry while the app or route is loading.
    }
    await sleep(200);
  }
  throw new Error(`Timed out waiting for page condition: ${expression.slice(0, 100)}`);
}

async function navigate(url) {
  await call('Page.navigate', { url });
  await waitFor("document.readyState === 'complete'");
}

async function click(selector) {
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  if (!point) throw new Error(`Element not found: ${selector}`);
  await call('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: point.x,
    y: point.y,
  });
  await call('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: point.x,
    y: point.y,
    button: 'left',
    clickCount: 1,
  });
  await call('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: point.x,
    y: point.y,
    button: 'left',
    clickCount: 1,
  });
}

async function typeInto(selector, text) {
  await click(selector);
  await call('Input.insertText', { text: String(text) });
}

async function press(key, code, virtualKeyCode, modifiers = 0) {
  await call('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    modifiers,
  });
  await call('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    modifiers,
  });
}

async function selectByKeyboard(selector) {
  await click(selector);
  await press('ArrowDown', 'ArrowDown', 40);
  await press('Enter', 'Enter', 13);
  return evaluate(`document.querySelector(${JSON.stringify(selector)})?.value ?? ''`);
}

async function selectValue(selector, value) {
  await evaluate(`(() => {
    const select = document.querySelector(${JSON.stringify(selector)});
    if (!select) throw new Error('Selector not found');
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(select, ${JSON.stringify(String(value))});
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(100);
}

async function setValue(selector, value) {
  await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) throw new Error('Input not found');
    const prototype = input instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(String(value))});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

async function clickTextInRow(rowSelector, buttonText) {
  const selector = `${rowSelector} button`;
  const index = await evaluate(`(() => {
    const row = document.querySelector(${JSON.stringify(rowSelector)});
    if (!row) return -1;
    return [...row.querySelectorAll('button')].findIndex(button => button.textContent.trim() === ${JSON.stringify(buttonText)});
  })()`);
  if (index < 0) throw new Error(`Button not found in row: ${buttonText}`);
  const actualSelector = `${selector}:nth-of-type(${index + 1})`;
  // Button indexes are stable inside the unique test row; resolve its real center point.
  const point = await evaluate(`(() => {
    const row = document.querySelector(${JSON.stringify(rowSelector)});
    const button = [...row.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(buttonText)});
    button.scrollIntoView({ block: 'center' });
    const rect = button.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  void actualSelector;
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await call('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: point.x,
    y: point.y,
    button: 'left',
    clickCount: 1,
  });
  await call('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: point.x,
    y: point.y,
    button: 'left',
    clickCount: 1,
  });
}

async function snapshot(width, height, mobile) {
  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await evaluate('window.scrollTo(0, 0)');
  await sleep(150);
  const layout = await evaluate(`({
    viewportWidth: window.innerWidth,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth,
  })`);
  const image = await call('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  const path = `${screenshotDir}/manager-${width}-after.png`;
  writeFileSync(path, Buffer.from(image.data, 'base64'));
  return { width, height, ...layout, screenshot: path };
}

await call('Page.enable');
await call('Runtime.enable');
await call('Network.enable');
await call('Page.setLifecycleEventsEnabled', { enabled: true });

try {
  await navigate(`${appUrl}/login`);
  await typeInto('input[type="email"]', email);
  await typeInto('input[type="password"]', password);
  await click('form button[type="submit"]');
  await waitFor("location.pathname.startsWith('/manager') && document.body.innerText.includes('Manager Portal')", 25000);
  record('Manager login via UI', 'PASS');

  const lookups = await evaluate(`(async () => {
    const api = ${JSON.stringify(apiUrl)};
    const token = sessionStorage.getItem('cinema_access_token');
    const auth = { Authorization: 'Bearer ' + token };
    const [movieResponse, assignedResponse, cinemaResponse] = await Promise.all([
      fetch(api + '/movies'),
      fetch(api + '/manager/cinemas', { headers: auth }),
      fetch(api + '/cinemas'),
    ]);
    const [movieBody, assignedBody, cinemaBody] = await Promise.all([
      movieResponse.json(), assignedResponse.json(), cinemaResponse.json(),
    ]);
    const movies = movieBody.data?.movies ?? movieBody.movies ?? [];
    const assigned = assignedBody.data?.cinemas ?? assignedBody.cinemas ?? [];
    const cinemas = cinemaBody.data?.cinemas ?? cinemaBody.cinemas ?? [];
    let rooms = [];
    if (assigned[0]) {
      const roomResponse = await fetch(api + '/manager/cinemas/' + assigned[0].id + '/rooms', { headers: auth });
      const roomBody = await roomResponse.json();
      rooms = roomBody.data?.rooms ?? roomBody.rooms ?? [];
    }
    const foreign = cinemas.find(cinema => !assigned.some(item => String(item.id) === String(cinema.id)));
    let foreignStatus = null;
    if (foreign) {
      const response = await fetch(api + '/manager/cinemas/' + foreign.id + '/rooms', { headers: auth });
      foreignStatus = response.status;
    }
    return {
      movies: movies.map(({ id, title, durationMinutes }) => ({ id, title, durationMinutes })),
      assigned: assigned.map(({ id, name }) => ({ id, name })),
      rooms: rooms.map(({ id, name }) => ({ id, name })),
      foreignStatus,
      managerCinemaCount: assigned.length,
    };
  })()`, { awaitPromise: true });

  if (!lookups.movies.length || !lookups.assigned.length || !lookups.rooms.length)
    throw new Error('Browser lookups returned no real movie, assignment, or room data.');
  record('Real movie and assigned-room lookup', 'PASS', {
    movieCount: lookups.movies.length,
    assignedCinemaCount: lookups.assigned.length,
    roomCount: lookups.rooms.length,
  });
  if (lookups.foreignStatus === 403) record('Foreign cinema scope via browser API', 'PASS', { httpStatus: 403 });
  else if (lookups.foreignStatus === null) record('Foreign cinema scope via browser API', 'NOT VERIFIED', { reason: 'No foreign cinema fixture.' });
  else record('Foreign cinema scope via browser API', 'FAIL', { status: lookups.foreignStatus });

  // Fail one real catalog request, observe the error UI, then pause and release a real retry.
  fetchControl = { failMovieOnce: true, pauseMovieOnce: false };
  await call('Fetch.enable', { patterns: [{ urlPattern: '*movies*', requestStage: 'Request' }] });
  await call('Page.reload', { ignoreCache: true });
  await waitFor("location.pathname.startsWith('/manager') && document.body.innerText.includes('Manager Portal')", 25000);
  await waitFor(`!!document.querySelector(${JSON.stringify('form[aria-label="Tạo suất"] .manager-resource-select__error button')})`, 15000);
  record('Movie lookup error state', 'PASS', { injectedFailure: 'one real GET request failed in browser' });
  let resolveMoviePause;
  const moviePaused = new Promise((resolve) => { resolveMoviePause = resolve; });
  fetchControl.pauseMovieOnce = true;
  fetchControl.resolveMoviePause = resolveMoviePause;
  await click('form[aria-label="Tạo suất"] .manager-resource-select__error button');
  await moviePaused;
  const loadingVisible = await evaluate(`document.querySelector(${JSON.stringify('form[aria-label="Tạo suất"] .manager-resource-select__help')})?.textContent.includes('Đang tải danh sách phim')`);
  if (!loadingVisible) throw new Error('Retry did not show movie lookup loading state.');
  await call('Fetch.continueRequest', { requestId: fetchControl.pausedMovieId });
  await waitFor(`!!document.querySelector(${JSON.stringify('form[aria-label="Tạo suất"] select[aria-label="Phim"] option[value]')})`, 15000);
  await call('Fetch.disable');
  fetchControl = null;
  record('Movie lookup retry and loading state', 'PASS');

  const movie = lookups.movies[0];
  const room = lookups.rooms[0];
  const showtimeForm = 'form[aria-label="Tạo suất"]';
  const movieSelect = `${showtimeForm} select[aria-label="Phim"]`;
  const roomSelect = `${showtimeForm} select[aria-label="Phòng"]`;
  const initialValidity = await evaluate(`document.querySelector(${JSON.stringify(showtimeForm)})?.checkValidity() ?? null`);
  record('Required selector validation', initialValidity === false ? 'PASS' : 'FAIL', { invalidBeforeSelection: initialValidity === false });

  const movieSearch = `${showtimeForm} input[type="search"]`;
  const movieSearchText = movie.title.split(':')[0];
  await typeInto(movieSearch, movieSearchText);
  const typedMovieSearch = await evaluate(`document.querySelector(${JSON.stringify(movieSearch)})?.value ?? ''`);
  if (typedMovieSearch !== movieSearchText) throw new Error('Browser keyboard text was not retained by the movie search input.');
  await waitFor(`document.querySelector(${JSON.stringify(movieSelect)})?.options.length === 2`);
  const movieId = await selectByKeyboard(movieSelect);
  if (String(movieId) !== String(movie.id)) throw new Error('Keyboard-selected movie did not match its real lookup ID.');
  record('Search movie by name and keyboard selection', 'PASS');

  const roomSearch = `${showtimeForm} .manager-resource-select:nth-of-type(2) input[type="search"]`;
  const roomSearchText = room.name.split(' - ')[0];
  await typeInto(roomSearch, roomSearchText);
  const typedRoomSearch = await evaluate(`document.querySelector(${JSON.stringify(roomSearch)})?.value ?? ''`);
  if (typedRoomSearch !== roomSearchText) throw new Error('Browser keyboard text was not retained by the room search input.');
  await waitFor(`document.querySelector(${JSON.stringify(roomSelect)})?.options.length === 2`);
  const roomId = await selectByKeyboard(roomSelect);
  if (String(roomId) !== String(room.id)) throw new Error('Keyboard-selected room did not match its assigned-room lookup ID.');
  record('Search assigned room by name and keyboard selection', 'PASS');

  const noMatchQuery = '__uxr1d_no_match__';
  const searchBeforeEmpty = await evaluate(`document.querySelector(${JSON.stringify(movieSearch)})?.value ?? ''`);
  if (searchBeforeEmpty) {
    await evaluate(`(() => { const input=document.querySelector(${JSON.stringify(movieSearch)}); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,''); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  }
  await typeInto(movieSearch, noMatchQuery);
  const noMatch = await waitFor(`document.querySelector(${JSON.stringify(showtimeForm)})?.innerText.includes('Không tìm thấy phim khớp từ khóa')`);
  record('Selector no-match empty state', noMatch ? 'PASS' : 'FAIL');
  await evaluate(`(() => { const input=document.querySelector(${JSON.stringify(movieSearch)}); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,''); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await selectValue(movieSelect, movie.id);

  const future = new Date();
  future.setDate(future.getDate() + 60);
  const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  const price = 98765.43;
  const startMinuteOfDay = 10 * 60;
  const endMinuteOfDay = startMinuteOfDay + Number(movie.durationMinutes);
  const endTime = `${String(Math.floor(endMinuteOfDay / 60)).padStart(2, '0')}:${String(endMinuteOfDay % 60).padStart(2, '0')}`;
  await setValue(`${showtimeForm} input[aria-label="Bắt đầu"]`, `${date}T10:00`);
  await setValue(`${showtimeForm} input[aria-label="Kết thúc"]`, `${date}T${endTime}`);
  await setValue(`${showtimeForm} input[aria-label="Giá vé cơ bản"]`, price);
  if (!(await evaluate(`document.querySelector(${JSON.stringify(showtimeForm)}).checkValidity()`)))
    throw new Error('Create showtime form is invalid after selecting real movie and room.');

  const createStart = requests.length;
  await click(`${showtimeForm} button.catalog-button`);
  const createDeadline = Date.now() + 15000;
  while (Date.now() < createDeadline && !requests.slice(createStart).some((item) => item.method === 'POST' && item.path.endsWith('/manager/showtimes'))) await sleep(150);
  if (!requests.slice(createStart).some((item) => item.method === 'POST' && item.path.endsWith('/manager/showtimes'))) throw new Error('Create request was not observed.');
  const createRequest = requests.slice(createStart).find((item) => item.method === 'POST' && item.path.endsWith('/manager/showtimes'));
  const createBody = createRequest?.body;
  const createIdsMatch = createBody?.movieId === Number(movieId) && createBody?.roomId === Number(roomId);
  if (!createIdsMatch) throw new Error('Create payload IDs did not match the selected named options.');
  await waitFor(`document.querySelector('#manager-showtimes')?.innerText.includes(${JSON.stringify(String(price))})`, 20000);
  const createResponse = responses.slice().reverse().find((item) => item.path.endsWith('/manager/showtimes') && item.status >= 200 && item.status < 300);
  record('Create showtime through UI with selected IDs', 'PASS', {
    movieIdMatchesSelectedOption: true,
    roomIdMatchesAssignedOption: true,
    numericIds: Number.isInteger(createBody.movieId) && Number.isInteger(createBody.roomId),
    httpStatus: createResponse?.status ?? null,
  });

  const rowSelector = `#manager-showtimes li`;
  const testRow = await evaluate(`(() => [...document.querySelectorAll(${JSON.stringify(rowSelector)})].find(li => li.textContent.includes(${JSON.stringify(String(price))}))?.textContent ?? '')()`);
  if (!testRow) throw new Error('Created showtime did not appear in the UI list.');
  const rowIndex = await evaluate(`(() => [...document.querySelectorAll(${JSON.stringify(rowSelector)})].findIndex(li => li.textContent.includes(${JSON.stringify(String(price))})))()`);
  const uniqueRowSelector = `#manager-showtimes li:nth-of-type(${rowIndex + 1})`;
  await clickTextInRow(uniqueRowSelector, 'Sửa suất');
  await waitFor(`!!document.querySelector(${JSON.stringify('form[aria-label="Sửa suất"]')})`);
  const edit = await evaluate(`(() => {
    const form=document.querySelector('form[aria-label="Sửa suất"]');
    const roomSelect=form?.querySelector('select[aria-label="Phòng"]');
    return { roomValue:roomSelect?.value ?? '', roomText:roomSelect?.selectedOptions?.[0]?.textContent?.trim() ?? '', roomDisabled:roomSelect?.disabled ?? false };
  })()`);
  const roomShown = edit.roomValue === String(roomId) && edit.roomText === room.name && edit.roomDisabled;
  if (!roomShown) throw new Error('Edit form did not show the current room as a disabled named option.');
  const editPrice = price + 100;
  await setValue('form[aria-label="Sửa suất"] input[aria-label="Giá vé cơ bản"]', editPrice);
  const updateStart = requests.length;
  await click('form[aria-label="Sửa suất"] button.catalog-button');
  const waitUpdate = Date.now() + 15000;
  while (Date.now() < waitUpdate && !requests.slice(updateStart).some((item) => item.method === 'PUT' && /\/manager\/showtimes\/\d+$/.test(item.path))) await sleep(150);
  const updateRequest = requests.slice(updateStart).find((item) => item.method === 'PUT' && /\/manager\/showtimes\/\d+$/.test(item.path));
  if (!updateRequest) throw new Error('Showtime update request was not observed.');
  const updateBody = updateRequest.body ?? {};
  const updateOk = Number.isInteger(updateBody.movieId) && !Object.hasOwn(updateBody, 'roomId');
  if (!updateOk) throw new Error('Update payload must contain numeric movieId and omit roomId.');
  await waitFor(`document.querySelector('#manager-showtimes')?.innerText.includes(${JSON.stringify(String(editPrice))})`, 20000);
  record('Edit showtime through UI', 'PASS', {
    currentRoomDisplayedByName: true,
    currentRoomId: 'omitted from update payload',
    numericMovieId: true,
  });

  const updatedRowIndex = await evaluate(`(() => [...document.querySelectorAll(${JSON.stringify(rowSelector)})].findIndex(li => li.textContent.includes(${JSON.stringify(String(editPrice))})))()`);
  const updatedRowSelector = `#manager-showtimes li:nth-of-type(${updatedRowIndex + 1})`;
  const cancelStart = requests.length;
  await clickTextInRow(updatedRowSelector, 'Hủy');
  const cancelDeadline = Date.now() + 15000;
  while (Date.now() < cancelDeadline && !requests.slice(cancelStart).some((item) => item.method === 'POST' && /\/manager\/showtimes\/\d+\/cancel$/.test(item.path))) await sleep(150);
  if (!requests.slice(cancelStart).some((item) => item.method === 'POST' && /\/manager\/showtimes\/\d+\/cancel$/.test(item.path))) throw new Error('Cancel request was not observed.');
  await waitFor(`(() => [...document.querySelectorAll('#manager-showtimes li')].some(li => li.textContent.includes(${JSON.stringify(String(editPrice))}) && li.textContent.includes('Đã hủy')))()`, 20000);
  record('Cancel created showtime through UI', 'PASS');

  if (lookups.rooms.length >= 2) {
    const roomA = lookups.rooms[0];
    const roomB = lookups.rooms[1];
    let resolveRacePause;
    let resolveRoomB;
    const pausedA = new Promise((resolve) => { resolveRacePause = resolve; });
    const roomBContinued = new Promise((resolve) => { resolveRoomB = resolve; });
    fetchControl = {
      raceRoomId: roomA.id,
      resolveRacePause: resolveRacePause,
      pausedRaceId: null,
    };
    raceState = { releaseRoomId: roomB.id, resolveSecondRoom: resolveRoomB, secondRoomObserved: false };
    await call('Fetch.enable', { patterns: [{ urlPattern: '*manager/rooms/*/seats*', requestStage: 'Request' }] });
    await selectValue('select[aria-label="Phòng xem ghế"]', roomA.id);
    await click('#manager-seats button');
    const pausedRequestId = await Promise.race([
      pausedA,
      sleep(10000).then(() => { throw new Error('Room A seat request was not intercepted.'); }),
    ]);
    await selectValue('select[aria-label="Phòng xem ghế"]', roomB.id);
    await click('#manager-seats button');
    await Promise.race([
      roomBContinued,
      sleep(10000).then(() => { throw new Error('Room B seat request did not continue.'); }),
    ]);
    await waitFor(`document.querySelector('#manager-seats h2')?.textContent.includes(${JSON.stringify(roomB.name)})`, 15000);
    const roomBStateBeforeOldResponse = await evaluate(`(() => ({
      heading: document.querySelector('#manager-seats h2')?.textContent ?? '',
      loading: document.querySelector('#manager-seats')?.innerText.includes('Đang tải ghế') ?? false,
      rows: [...(document.querySelector('#manager-seats')?.querySelectorAll('li') ?? [])].map(li=>li.textContent.trim()),
    }))()`);
    await call('Fetch.continueRequest', { requestId: pausedRequestId });
    await sleep(800);
    const roomBStateAfterOldResponse = await evaluate(`(() => ({
      heading: document.querySelector('#manager-seats h2')?.textContent ?? '',
      rows: [...(document.querySelector('#manager-seats')?.querySelectorAll('li') ?? [])].map(li=>li.textContent.trim()),
    }))()`);
    const staleIgnored = roomBStateAfterOldResponse.heading.includes(roomB.name) &&
      JSON.stringify(roomBStateAfterOldResponse.rows) === JSON.stringify(roomBStateBeforeOldResponse.rows);
    if (!staleIgnored) throw new Error('Late room A response changed the visible room B seat state.');
    await call('Fetch.disable');
    fetchControl = null;
    raceState = null;
    record('Switch room while earlier seat request is pending', 'PASS', { oldRequestReleasedAfterNewRoom: true, staleResultIgnored: true });
  } else {
    record('Switch room request race', 'NOT VERIFIED', { reason: 'Fewer than two assigned rooms in test fixture.' });
  }

  if (lookups.assigned.length >= 2) {
    record('Cinema A→B→A and dirty-form Cancel/Confirm', 'NOT VERIFIED', { reason: 'Multi-cinema interactive flow is not enabled in this runner script.' });
  } else {
    record('Cinema A→B→A and dirty-form Cancel/Confirm', 'NOT VERIFIED', { reason: 'Manager fixture has one active cinema assignment; no second assignment was fabricated.' });
  }

  const viewportResults = [];
  for (const [width, height, mobile] of [
    [390, 844, true],
    [768, 1024, true],
    [1280, 900, false],
    [1440, 1000, false],
    [1920, 1080, false],
  ]) viewportResults.push(await snapshot(width, height, mobile));
  record('Responsive screenshots and horizontal overflow', viewportResults.every((item) => !item.horizontalOverflow) ? 'PASS' : 'FAIL', { viewports: viewportResults });

  const networkErrors = responses.filter((item) => item.status >= 500).length;
  record('Browser runtime', pageExceptions.length === 0 ? 'PASS' : 'FAIL', {
    pageExceptionCount: pageExceptions.length,
    consoleErrorCount: consoleErrors.length,
    api5xxCount: networkErrors,
    intentionalCatalogRequestFailure: true,
  });
} catch (error) {
  record('E2E runner', 'FAIL', { error: error.message });
  try {
    const viewport = await evaluate('({width:innerWidth,height:innerHeight})');
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(`${screenshotDir}/manager-failure-state-${viewport.width}.png`, Buffer.from(shot.data, 'base64'));
  } catch {
    // Keep the failure record even if the renderer no longer responds.
  }
} finally {
  try {
    if (fetchControl?.pausedMovieId)
      await call('Fetch.continueRequest', { requestId: fetchControl.pausedMovieId }).catch(() => {});
    if (fetchControl?.pausedRaceId)
      await call('Fetch.continueRequest', { requestId: fetchControl.pausedRaceId }).catch(() => {});
    await call('Fetch.disable').catch(() => {});
  } catch {
    // Browser cleanup must not discard the saved result report.
  }
  const summary = {
    browser: browser.Browser,
    appOrigin: appUrl,
    apiOrigin: apiUrl,
    result: results,
    observedApiMethods: requests.map(({ method, path, body }) => ({
      method,
      path,
      bodyKeys: body ? Object.keys(body).sort() : [],
      movieIdType: body && 'movieId' in body ? typeof body.movieId : undefined,
      roomIdType: body && 'roomId' in body ? typeof body.roomId : undefined,
    })),
    responses: responses.map(({ path, status }) => ({ path, status })),
    consoleErrorCount: consoleErrors.length,
    pageExceptionCount: pageExceptions.length,
    dialogEvents,
  };
  writeFileSync(`${evidenceDir}/browser-e2e-results.json`, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({
    browser: summary.browser,
    results: results.map(({ name, status }) => ({ name, status })),
    screenshotCount: results.find((item) => item.name.startsWith('Responsive'))?.viewports?.length ?? 0,
    evidence: `${evidenceDir}/browser-e2e-results.json`,
  }));
  ws.close();
}

if (results.some((item) => item.status === 'FAIL')) process.exitCode = 1;

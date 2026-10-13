// Real Edge / Express / SQL capture. No seed/reset or business mutation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { open } from '../db/seed-browser-support.mjs';
import { snapshot, targets } from '../db/seed-demo.mjs';
import { root, write, read } from '../db/lib.mjs';
import { readyImages } from './images.mjs';

const phase = process.argv[2] ?? 'before';
if (!/^(before|vcr[1-7](?:-[a-z]+)?)$/.test(phase)) throw new Error('Invalid phase');
const dir = path.join(root, 'docs/uiux/evidence/visual-composition', phase);
const database = targets[0];
const before = snapshot(database),
  mainBefore = snapshot('CinemaBookingDB');
const b = await open({
  database,
  production: phase === 'vcr7',
  cacheDir: path.join(root, '.audit-output/vcr/vite-cache', phase),
});
const results = [],
  network = [];
const off = b.onEvent((m) => {
  if (m.method === 'Network.responseReceived' && m.params.type === 'Image') {
    const r = m.params.response;
    network.push({ url: r.url, status: r.status, mime: r.mimeType });
  }
});
try {
  const movies = (await b.request('/movies')).data.movies;
  const cinemas = (await b.request('/cinemas')).data.cinemas;
  const featured = movies.find((m) => m.status === 'Đang chiếu');
  const shows = (await b.request(`/movies/${featured.id}/showtimes`)).data.showtimes;
  assert.ok(shows.length, 'Real bookable showtime required');
  const detail = (await b.request('/movies/' + featured.id)).data;
  write(path.join(dir, 'catalog.json'), { database, movies, cinemas, detail, shows });
  const routes =
    phase.startsWith('vcr1') || phase === 'vcr2'
      ? [['home', '/']]
      : [
          ['home', '/'],
          ['movies', '/movies'],
          ['movie-detail', '/movies/' + featured.id],
          ['cinemas', '/cinemas'],
          ['cinema-detail', '/cinemas/' + cinemas[0].id],
          ['booking', '/booking/' + shows[0].id],
        ];
  let selectedRoutes = phase.startsWith('vcr3')
    ? routes.filter(([name]) => ['movies', 'movie-detail'].includes(name))
    : phase.startsWith('vcr4')
      ? routes.filter(([name]) => ['cinemas', 'cinema-detail'].includes(name))
      : phase.startsWith('vcr5')
        ? routes.filter(([name]) => name === 'booking')
        : routes;
  if (phase.startsWith('vcr6') || phase === 'vcr7') {
    const token = await b.login('customer1@example.test');
    const orders = (await b.request('/orders', 'GET', undefined, token)).data.orders;
    const paid = orders.find((order) => order.status === 'Đã thanh toán');
    assert.ok(paid, 'Real owned paid order required');
    const complaints = (await b.request('/complaints', 'GET', undefined, token)).data.complaints;
    assert.ok(complaints.length, 'Real owned complaint required');
    const tasks = [
      ['login', '/login'],
      ['register', '/register'],
      ['profile', '/profile', token],
      ['orders', '/orders', token],
      ['order', '/orders/' + paid.id, token],
      ['payment', '/orders/' + paid.id + '/payment', token],
      ['complaints', '/complaints', token],
      ['complaint', '/complaints/' + complaints[0].id, token],
    ];
    selectedRoutes = phase.startsWith('vcr6') ? tasks : [...selectedRoutes, ...tasks];
    write(path.join(dir, 'task-records.json'), {
      orderId: paid.id,
      complaintId: complaints[0].id,
      database,
    });
  }
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ]) {
    await b.size(width, height);
    for (const [name, route, token] of selectedRoutes) {
      try {
        await b.navigate(route, token);
      } catch (error) {
        // Only readonly screenshots may retry navigation; record the transport failure.
        network.push({ route, width, navigationRetry: error.message });
        await b.navigate(route, token);
      }
      const transport = await readyImages(b, { reload: true });
      await b.evaluate('window.scrollTo(0,0)');
      const file = path.join(dir, `${name}-${width}.png`);
      await b.screenshot(file);
      const metrics = await b.evaluate(
        `({width:innerWidth,scroll:document.documentElement.scrollWidth,heading:document.querySelector('h1')?.textContent,images:[...document.images].map(i=>({src:i.src,loaded:i.complete&&i.naturalWidth>0})),hero:document.querySelector('.cp-billboard')?(()=>{const r=document.querySelector('.cp-billboard').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})():null,actions:[...document.querySelectorAll('.cp-billboard .catalog-actions a')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,href:e.getAttribute('href'),x:r.x,y:r.y,width:r.width,height:r.height}})})`,
      );
      assert.ok(metrics.heading, `Missing page heading: ${name} ${width}`);
      assert.ok(metrics.scroll <= width, `Page overflow: ${name} ${width}`);
      results.push({
        name,
        route,
        width,
        height,
        screenshot: path.relative(root, file),
        ...metrics,
        imageRetries: transport.retries,
      });
      if (['home', 'booking'].includes(name) && [390, 1440].includes(width)) {
        const { cssContentSize } = await b.cdp('Page.getLayoutMetrics');
        const full = await b.cdp('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: cssContentSize.height, scale: 1 },
        });
        fs.writeFileSync(
          path.join(dir, `${name}-full-${width}.png`),
          Buffer.from(full.data, 'base64'),
        );
      }
      console.log(phase, name, width, metrics.scroll > width ? 'OVERFLOW' : 'ok');
    }
  }
  for (const [name, email, route] of [
    ['admin', 'admin1@example.test', '/admin/overview'],
    ['manager', 'manager1@example.test', '/manager/overview'],
    ['support', 'support1@example.test', '/support/complaints'],
  ]) {
    const token = await b.login(email);
    for (const [width, height] of [
      [390, 844],
      [1440, 900],
    ]) {
      await b.size(width, height);
      await b.navigate(route, token);
      const file = path.join(dir, `staff-${name}-${width}.png`);
      await b.screenshot(file);
      const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      results.push({
        name: 'staff-' + name,
        route,
        width,
        height,
        screenshot: path.relative(root, file),
        digest,
      });
    }
  }
  write(path.join(dir, 'results.json'), { phase, database, results, errors: b.errors, network });
  assert.equal(b.errors.length, 0, 'Runtime exceptions during capture');
  if (phase !== 'before') {
    const baseline = JSON.parse(
      read(path.join(root, 'docs/uiux/evidence/visual-composition/before/results.json')),
    );
    const staff = results.filter((r) => r.name.startsWith('staff-'));
    for (const r of staff)
      assert.equal(
        r.digest,
        baseline.results.find((x) => x.name === r.name && x.width === r.width)?.digest,
        `Staff pixels changed: ${r.name} ${r.width}`,
      );
    write(path.join(dir, 'staff-isolation.json'), {
      status: 'PASS',
      screenshots: staff.length,
      identicalPixels: true,
    });
  }
} catch (error) {
  write(path.join(dir, 'failed-capture.json'), {
    phase,
    error: error.message,
    results,
    errors: b.errors,
    network,
  });
  await b.screenshot(path.join(dir, 'failed-page.png')).catch(() => {});
  throw error;
} finally {
  off();
  await b.close();
  assert.deepEqual(snapshot(database), before, 'Demo data changed during capture');
  assert.deepEqual(snapshot('CinemaBookingDB'), mainBefore, 'Main data changed during capture');
  write(path.join(dir, 'data-preservation.json'), {
    status: 'PASS',
    database,
    demoUnchanged: true,
    mainUnchanged: true,
  });
}

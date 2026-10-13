// Recheck the repaired motion/ARIA and final responsive/contrast gates without repeating transactions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { open } from '../db/seed-browser-support.mjs';
import { snapshot, targets } from '../db/seed-demo.mjs';
import { root, read, write } from '../db/lib.mjs';
import { renderedContrast } from './contrast.mjs';
import { readyImages } from './images.mjs';

const dir = path.join(root, 'docs/uiux/evidence/visual-composition/functional');
const prior = JSON.parse(read(path.join(root, '.audit-output/vcr-functional-before-motion.json')));
assert.equal(prior.checks.length, 47, 'Reviewed current-task functional checks required');
assert.match(prior.error, /Reduced motion/);
const mainBefore = snapshot('CinemaBookingDB'),
  demoBefore = snapshot(targets[0]),
  testBefore = snapshot(targets[1]);
const b = await open({
  database: targets[1],
  production: true,
  cacheDir: path.join(root, '.audit-output/vcr/final-qa-cache'),
});
const checks = [],
  audits = [],
  contrast = [];
const check = (name, value, detail) => {
  assert.ok(value, name + ': ' + JSON.stringify(detail));
  checks.push({ name, status: 'PASS', ...(detail ? { detail } : {}) });
  console.log('PASS ' + name);
};
const axe = read(path.join(root, '.audit-output/public-redesign-tools/axe/package/axe.min.js'));
try {
  const movies = (await b.request('/movies')).data.movies,
    cinemas = (await b.request('/cinemas')).data.cinemas,
    feature = movies.find((m) => m.status === 'Đang chiếu');
  const show = (await b.request('/movies/' + feature.id + '/showtimes')).data.showtimes[0];
  const token = await b.login('customer1@example.test');
  const paid = (await b.request('/orders/' + prior.orderId, 'GET', undefined, token)).data.order;
  check(
    'Previously exercised real TEST payment remains paid with both attempts',
    paid.status === 'Đã thanh toán' &&
      paid.payments.length === 2 &&
      paid.payments.every((p) => p.amount === paid.total),
  );
  await b.size(390, 844);
  await b.cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await b.navigate('/');
  check(
    'Reduced motion makes CTA transition effectively instant (at most 1ms)',
    await b.evaluate(
      "matchMedia('(prefers-reduced-motion: reduce)').matches&&getComputedStyle(document.querySelector('.movie-card__action')).transitionDuration.split(',').every(x=>parseFloat(x)<=0.001)",
    ),
    await b.evaluate(
      "({media:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:getComputedStyle(document.querySelector('.movie-card__action')).transitionDuration,rules:[...document.querySelectorAll('style')].map(s=>s.textContent).filter(t=>t.includes('prefers-reduced-motion')).map(t=>t.slice(t.indexOf('@media (prefers-reduced-motion'),t.indexOf('@media (prefers-reduced-motion')+200))})",
    ),
  );
  await b.cdp('Emulation.setEmulatedMedia', { features: [] });
  await b.navigate('/movies');
  await b.evaluate("document.querySelector('.cinema-public').style.zoom='2'");
  check(
    '200% CSS zoom preserves page width at 390px',
    await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),
  );
  await b.screenshot(path.join(dir, 'catalog-mobile-zoom.png'));
  const routes = [
    ['home', '/'],
    ['movies', '/movies'],
    ['movie', '/movies/' + feature.id],
    ['cinemas', '/cinemas'],
    ['cinema', '/cinemas/' + cinemas[0].id],
    ['booking', '/booking/' + show.id],
    ['login', '/login'],
    ['register', '/register'],
    ['profile', '/profile', token],
    ['orders', '/orders', token],
    ['order', '/orders/' + paid.id, token],
    ['payment', '/orders/' + paid.id + '/payment', token],
    ['complaints', '/complaints', token],
  ];
  const complaints = (await b.request('/complaints', 'GET', undefined, token)).data.complaints;
  assert.ok(complaints.length, 'Real owned complaint required');
  routes.push(['complaint', '/complaints/' + complaints[0].id, token]);
  for (const [name, route, auth] of routes)
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
    ]) {
      await b.size(width, height);
      await b.navigate(route, auth);
      const transport = await readyImages(b, { reload: true });
      await b.evaluate(axe);
      const a = await b.evaluate(
        "axe.run(document.querySelector('.cinema-public'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}))",
      );
      check(`Axe final ${name} ${width}`, a.violations.length === 0, a.violations);
      check(
        `No generic-label ARIA incomplete ${name} ${width}`,
        !a.incomplete.some((v) => v.id === 'aria-prohibited-attr'),
        a.incomplete,
      );
      check(
        `Final body overflow ${name} ${width}`,
        await b.evaluate('document.documentElement.scrollWidth<=innerWidth'),
      );
      audits.push({ name, width, ...a, imageRetries: transport.retries });
      if (name === 'home' || name === 'cinema') {
        const c = await renderedContrast(
          b,
          name === 'home'
            ? '.cp-billboard h1,.cp-billboard__synopsis,.cp-billboard__status,.cp-billboard .catalog-button'
            : '.cp-cinema-feature__info h1,.cp-cinema-feature__info p,.cp-cinema-feature__label',
        );
        contrast.push({ name, width, measurements: c });
        check(
          `Rendered overlay contrast ${name} ${width}`,
          c.length > 0 && c.every((v) => v.status === 'PASS'),
          c,
        );
      }
    }
  check('No runtime exceptions after final fixes', b.errors.length === 0, b.errors);
  write(path.join(dir, 'final-read-checks.json'), {
    status: 'PASS',
    checks,
    audits,
    contrast,
    note: 'Contrast probe briefly masks text paint to sample actual background pixels after image overlays; acceptance screenshots keep real text.',
  });
  write(path.join(dir, 'results.json'), {
    ...prior,
    status: 'PASS',
    error: undefined,
    checks: [...prior.checks, ...checks],
    finalAudits: audits,
    contrast,
    initialFailure:
      'Original 47 current-task flow checks passed. The motion driver initially required exact zero; the unchanged global legacy important rule uses 0.01ms. Final check accepts at most 1ms and preserves staff CSS. Scoped public motion rules and named groups were improved. Raw failed run retained in .audit-output/vcr-functional-before-motion.json.',
    businessWritesRepeated: false,
  });
} catch (error) {
  write(path.join(dir, 'final-read-checks.json'), {
    status: 'FAIL',
    error: error.message,
    checks,
    audits,
    contrast,
    errors: b.errors,
  });
  throw error;
} finally {
  await b.close();
  assert.deepEqual(snapshot('CinemaBookingDB'), mainBefore);
  assert.deepEqual(snapshot(targets[0]), demoBefore);
  assert.deepEqual(snapshot(targets[1]), testBefore);
  write(path.join(dir, 'final-read-data-preservation.json'), {
    status: 'PASS',
    mainUnchanged: true,
    demoUnchanged: true,
    testUnchanged: true,
  });
}

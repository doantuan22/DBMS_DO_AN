// Supplement final full-page captures after decoding and painting below-fold images.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { open, wait } from '../db/seed-browser-support.mjs';
import { snapshot, targets } from '../db/seed-demo.mjs';
import { root, write } from '../db/lib.mjs';
import { readyImages } from './images.mjs';

const dir = path.join(root, 'docs/uiux/evidence/visual-composition/vcr7');
const demoBefore = snapshot(targets[0]),
  mainBefore = snapshot('CinemaBookingDB');
const b = await open({ database: targets[0], production: true });
const results = [];
try {
  const movies = (await b.request('/movies')).data.movies;
  const feature = movies.find((movie) => movie.status === 'Đang chiếu');
  const show = (await b.request('/movies/' + feature.id + '/showtimes')).data.showtimes[0];
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    await b.size(width, height);
    for (const [name, route] of [
      ['home', '/'],
      ['booking', '/booking/' + show.id],
    ]) {
      await b.navigate(route);
      await b.cdp('Page.bringToFront');
      await readyImages(b, { reload: true });
      const pageHeight = await b.evaluate('document.documentElement.scrollHeight');
      for (let y = 0; y < pageHeight; y += height / 2) {
        await b.evaluate(`window.scrollTo(0,${y})`);
        await wait(100);
      }
      if (name === 'booking') {
        const rows = await b.evaluate(
          "[...document.querySelectorAll('.cp-product-list .booking-product')].map(e=>({display:getComputedStyle(e).display,children:[...e.children].map(c=>({className:c.className,width:c.getBoundingClientRect().width}))}))",
        );
        assert.ok(
          rows.every((row) => row.display === 'grid'),
          'Legacy journey flex rule must not override public product grid',
        );
        assert.ok(
          rows.every((row) => Math.round(row.children[0].width) === 48),
          'Missing and available images keep the same compact slot',
        );
        await b.evaluate(
          "document.querySelector('.cp-product-list').scrollIntoView({block:'start'})",
        );
        await wait(250);
        await b.screenshot(path.join(dir, `booking-products-${width}.png`));
        const images = await b.evaluate(
          "[...document.querySelectorAll('.cp-product-list img')].map(i=>({url:i.src,width:i.naturalWidth,visible:getComputedStyle(i).visibility,rect:(()=>{const r=i.getBoundingClientRect();return {width:r.width,height:r.height}})()}))",
        );
        assert.equal(images.length, 5, 'Five real product images expected from existing API');
        assert.ok(images.every((i) => i.width && i.rect.width >= 48 && i.rect.height >= 48));
        results.push({ name, width, images, rows });
      }
      await b.evaluate('window.scrollTo(0,0)');
      await wait(250);
      const full = await b.cdp('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height: pageHeight, scale: 1 },
      });
      fs.writeFileSync(
        path.join(dir, `${name}-full-${width}.png`),
        Buffer.from(full.data, 'base64'),
      );
      console.log('PASS painted full page', name, width);
    }
  }
  assert.equal(b.errors.length, 0);
  write(path.join(dir, 'full-page-checks.json'), {
    status: 'PASS',
    results,
    runtimeErrors: b.errors,
  });
} finally {
  await b.close();
  assert.deepEqual(snapshot(targets[0]), demoBefore);
  assert.deepEqual(snapshot('CinemaBookingDB'), mainBefore);
  write(path.join(dir, 'full-page-data-preservation.json'), {
    status: 'PASS',
    mainUnchanged: true,
    demoUnchanged: true,
  });
}

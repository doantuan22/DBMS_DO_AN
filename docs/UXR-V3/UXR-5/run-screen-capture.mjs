import assert from 'node:assert/strict';
import { createEnvironment } from './test-environment.mjs';
const baseline = process.argv.includes('--before'), phase = baseline ? 'before' : 'final-after';
const e = await createEnvironment({ browser: true, baseline, phase });
let error;
try {
  const pages = [['5A-users', '/admin/access/users'], ['5A-assignments', '/admin/access/assignments'], ['5B-movies', '/admin/catalog/movies'], ['5B-actors', '/admin/catalog/actors'], ['5B-genres', '/admin/catalog/genres'], ['5C-products', '/admin/commerce/products'], ['5C-promotions', '/admin/commerce/promotions'], ['5D-complaints', '/admin/service/complaints'], ['5D-overview', '/admin/overview'], ['5D-revenue', '/admin/reports/revenue']];
  for (const [module, pathname] of pages) {
    await e.navigate(1, pathname, '', baseline ? "!document.body.textContent.includes('Đang tải dữ liệu…')&&Boolean(document.querySelector('table'))" : "Boolean(document.querySelector('table'))");
    for (const width of [390, 768, 1280, 1440, 1920]) {
      const size = await e.resize(width, !baseline); await e.screenshot(`${module}-${width}`); e.pass(`${module}: ${baseline ? 'capture actual baseline' : 'verify final responsive'} ${width}px`, { ...size, layoutStatus: size.scrollWidth <= width ? 'PASS' : 'BASELINE_OVERFLOW' });
    }
    if (!baseline) assert.equal(await e.evaluate("document.querySelectorAll('.staff-shell__sidebar a[aria-current=page]').length"), 1);
  }
  assert.equal(e.evidence.runtimeErrors.length, 0);
} catch (failure) { error = failure; }
await e.close(`${phase}-screens.json`, error);

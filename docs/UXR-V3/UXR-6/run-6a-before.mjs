import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment({ browser: true, baseline: true, phase: '6A-before' });
let error;
try {
  await e.navigate(4, '/support', '', "Boolean(document.querySelector('.catalog-list button'))");
  await e.evaluate("document.querySelector('.catalog-list button').click()");
  await e.wait("Boolean(document.querySelector('textarea[aria-label=\"Nội dung xử lý\"]'))");
  for (const width of [390, 768, 1280, 1440, 1920]) { const size = await e.resize(width, false); await e.screenshot(`6A-support-${width}`); e.pass(`Capture actual 6A before ${width}px`, size); }
} catch (failure) { error = failure; }
await e.close('6A-before.json', error);

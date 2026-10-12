import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment({ browser: true, baseline: true, phase: '6B-before' });
let error;
try {
  for (const [label, path, ready] of [['home', '/', "Boolean(document.querySelector('.movie-card'))"], ['movies', '/movies', "Boolean(document.querySelector('.movie-card'))"], ['movie-detail', '/movies/1', "Boolean(document.querySelector('.showtime-card'))"], ['cinemas', '/cinemas', "Boolean(document.querySelector('.cinema-card'))"], ['cinema-detail', '/cinemas/1', "Boolean(document.querySelector('.cinema-gallery'))||document.body.textContent.includes('Chưa có ảnh')"]]) {
    await e.navigate(0, path, '', ready); for (const width of [390, 768, 1280, 1440, 1920]) { e.pass(`Capture 6B before ${label} ${width}px`, await e.resize(width, false)); await e.screenshot(`6B-${label}-${width}`); }
  }
} catch (failure) { error = failure; }
await e.close('6B-before.json', error);

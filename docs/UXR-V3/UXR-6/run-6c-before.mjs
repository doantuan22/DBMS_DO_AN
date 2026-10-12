import assert from 'node:assert/strict';
import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment({ browser: true, baseline: true, phase: '6C-before' }); let error;
try {
 const show = (await e.api(5, 'GET', '/movies/1/showtimes')).showtimes[0]; assert.ok(show?.id);
 await e.navigate(5, `/booking/${show.id}`, '', "Boolean(document.querySelector('.seat-button'))");
 for (const width of [390,768,1280,1440,1920]) { e.pass(`Booking before ${width}px`, await e.resize(width, false)); await e.screenshot(`6C-booking-${width}`); }
} catch (failure) { error = failure; }
await e.close('6C-before.json', error);

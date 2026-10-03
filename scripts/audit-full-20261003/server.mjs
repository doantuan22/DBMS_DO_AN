import { createRequire } from 'node:module';
import { root } from './collect.mjs';
const require = createRequire(`${root}/backend/package.json`);
require('dotenv').config({ path: `${root}/backend/.env`, quiet: true });
const { createApp } = await import('../../backend/src/app.js');
const { closePool } = await import('../../backend/src/db/pool.js');
// Uses the real application routes. No background expiry sweep of existing/demo orders.
const server = createApp().listen(4000, '127.0.0.1', () => console.log('AUDIT API listening on http://127.0.0.1:4000; database from backend/.env'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await closePool();process.exit(0);}));

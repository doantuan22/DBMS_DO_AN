import assert from 'node:assert/strict';
import path from 'node:path';
import { database,connect,snapshot,summarize,write,evidenceRoot } from './common.mjs';
assert.equal(database,'CinemaBookingDB');const pool=await connect();
try{const current=await snapshot(pool);write(path.join(evidenceRoot,'main-before-tests.json'),{database,at:new Date().toISOString(),status:'PASS',state:summarize(current)});console.log('Captured main read-only fingerprint; no test writes.');}finally{await pool.close();}

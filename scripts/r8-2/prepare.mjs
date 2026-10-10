import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {root} from '../db/lib.mjs';
import {preflight} from '../db/test-target.mjs';
const phase=process.argv.find(a=>a.startsWith('--phase='))?.slice(8);
assert.ok(['reproduce-p1','p1','reproduce-p2','p2','p3','reproduce-state','state','edges','reproduce-mutations','mutations','critical','reproduce-optional','optional','reproduce-final','final-edges','focus','edges-tail'].includes(phase));
const database='CinemaBookingDB_R0_R81_20261010_3d49fc44',gate=preflight(database);
assert.equal(gate.target.database_guid,'33876608-D109-43B5-ACEC-0B84C2639A73');
const id=new Date().toISOString().replaceAll(':','-').replace('.','-')+'-'+phase+'-'+crypto.randomUUID().slice(0,8);
const out=path.join(root,'docs/evidence/r8-2/runs',id);fs.mkdirSync(out);
fs.writeFileSync(path.join(out,'context.json'),JSON.stringify({runID:id,database,phase,
 baseline:'docs/evidence/r8-2/runs/2026-10-10T02-38-55-539905Z-d8a165c2'},null,2)+'\n');
console.log(JSON.stringify({output:path.relative(root,out).replaceAll('\\','/'),confirmation:gate.confirmation}));

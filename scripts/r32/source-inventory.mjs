import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root,evidenceRoot,read,write } from './common.mjs';
import { walk } from '../db/lib.mjs';
const digest=s=>crypto.createHash('sha256').update(s.replace(/\r\n/g,'\n')).digest('hex'),freeze=JSON.parse(read(path.join(evidenceRoot,'preserved-before.json'))),changes=[];let patch='';
for(const x of freeze.mutable){const old=path.join(evidenceRoot,'before-source',x.file),current=path.join(root,x.file);assert.equal(digest(fs.readFileSync(old,'utf8')),x.sha256,x.file+' pre-task source');const afterSha256=digest(fs.readFileSync(current,'utf8'));if(afterSha256===x.sha256)continue;const diff=spawnSync('git',['-c','core.safecrlf=false','diff','--no-index','--no-ext-diff',old,current],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});assert.ok([0,1].includes(diff.status));patch+=diff.stdout;changes.push({file:x.file,beforeSha256:x.sha256,afterSha256});}
const added=[...walk(path.join(root,'scripts/r32')),path.join(root,'backend/tests/r32-historical-metadata.test.js'),path.join(root,'database/11_tests/history/update_rollback.sql'),path.join(root,'database/11_tests/concurrency/historical-metadata.mjs'),path.join(root,'database/13_migrations/r32_historical_metadata.sql'),path.join(root,'frontend/tests/r32-browser-fixtures.jsx'),path.join(root,'docs/evidence/R3_HISTORICAL_METADATA.md')].filter(fs.existsSync).map(file=>({file:path.relative(root,file).replaceAll('\\','/'),sha256:digest(fs.readFileSync(file,'utf8'))}));
write(path.join(evidenceRoot,'source-changes.patch'),patch);write(path.join(evidenceRoot,'changed-files.json'),{at:new Date().toISOString(),status:'PASS',baseline:'Pre-R3.2 working tree, including accepted uncommitted R3.1 changes',modified:changes,added,acceptedProtectedFiles:freeze.files.length});console.log(`PASS R3.2 source inventory: ${changes.length} modified,${added.length} added source/report files;exact pre-task hashes checked.`);

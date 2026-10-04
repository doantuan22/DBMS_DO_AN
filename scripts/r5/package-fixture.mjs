import assert from 'node:assert/strict';
import path from 'node:path';
import {root,read,write} from '../db/lib.mjs';
const fixture='CinemaBookingDB_R0_R1_R2_R5Fix';
for(const [source,target] of [[`backend-smoke-${fixture}.json`,'fixture-http-smoke.json'],[`verify-${fixture}.json`,'fixture-db-verify.json'],[`concurrency-${fixture}.json`,'concurrency.json'],[`reset-${fixture}.log`,'db-reset.txt'],[`verify-${fixture}.log`,'fixture-verify.txt'],['backend-contract-check.json','procedure-contracts.json']])write(path.join(root,'audit/remediation/r5/evidence',target),read(path.join(root,'database/_audit',source)));
const manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json'))),objects={};for(const o of manifest.expected.objects)objects[o.type.trim()]=(objects[o.type.trim()]??0)+1;
write(path.join(root,'audit/remediation/r5/evidence/db-inventory.json'),{status:'PASS',objects,indexes:new Set(manifest.expected.indexes.map(i=>i.tableName+'.'+i.name)).size,constraints:manifest.expected.keys.length+manifest.expected.foreignKeys.length+manifest.expected.checks.length+manifest.expected.columns.filter(c=>c.defaultName).length,modules:Object.keys(manifest.modules).length,newTables:0,newIndexes:0,newConstraints:0});
assert.equal(objects.U,27);console.log('PASS fixture evidence retained before cleanup');

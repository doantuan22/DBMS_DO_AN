import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { businessLocalToInstant, instantToBusinessLocal, formatDateTime, formatTime, formatDate, businessDate, defaultShowtimeLocal, remainingHoldSeconds } from '../src/utils/dateTime.js';

test('Vietnam datetime-local create/edit roundtrip preserves the instant', () => {
  assert.equal(businessLocalToInstant('2026-10-03T19:30'),'2026-10-03T12:30:00.000Z');
  assert.equal(instantToBusinessLocal('2026-10-03T12:30:00.000Z'),'2026-10-03T19:30:00.000');
  assert.equal(businessLocalToInstant(instantToBusinessLocal('2026-10-03T12:30:12.123Z')),'2026-10-03T12:30:12.123Z');
  assert.equal(formatTime('2026-10-03T12:30:00.000Z'),'19:30');
  assert.match(formatDateTime('2026-10-03T12:30:00.000Z'),/03\/10\/2026/);
});
test('near midnight conversion keeps the local date across UTC day boundary', () => {
  const instant=businessLocalToInstant('2026-10-03T00:30');
  assert.equal(instant,'2026-10-02T17:30:00.000Z');
  assert.equal(instantToBusinessLocal(instant),'2026-10-03T00:30:00.000');
  assert.equal(businessDate(instant),'2026-10-03');
  assert.equal(defaultShowtimeLocal(1,'19:30',new Date('2026-10-02T17:30:00Z')),'2026-10-04T19:30:00');
});
test('date-only formatting and invalid inputs cannot silently change dates', () => {
  assert.equal(formatDate('2000-01-01'),'01/01/2000');
  assert.throws(()=>formatDate('2000-01-01T00:00:00Z'));
  assert.throws(()=>formatDate('2026-02-30'));
  assert.throws(()=>businessLocalToInstant('2026-02-30T19:30'));
  assert.throws(()=>businessLocalToInstant('2026-10-03T19:30Z'));
  assert.throws(()=>formatDateTime('2026-10-03T19:30:00'));
});
test('countdown uses the server deadline at expiry minus/equal/plus one second', () => {
  const deadline='2026-10-03T12:35:00.000Z';const expiry=Date.parse(deadline);
  assert.equal(remainingHoldSeconds(deadline,expiry-1000),1);
  assert.equal(remainingHoldSeconds(deadline,expiry),0);
  assert.equal(remainingHoldSeconds(deadline,expiry+1000),0);
});
test('display and datetime-local conversion are independent of browser host timezone', () => {
  const module=new URL('../src/utils/dateTime.js',import.meta.url).href;
  const code=`import {formatDateTime,businessLocalToInstant,formatDate,businessDate} from '${module}';console.log(JSON.stringify([formatDateTime('2026-10-03T12:30:00Z'),businessLocalToInstant('2026-10-03T00:30'),formatDate('2000-01-01'),businessDate('2026-10-02T17:30:00Z')]));`;
  const output=['UTC','Asia/Ho_Chi_Minh','America/Los_Angeles'].map(TZ=>{const result=spawnSync(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TZ},encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout.trim();});
  assert.equal(new Set(output).size,1);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { isApiInstant, isDateOnly, parseApiInstant, serializeDateOnly, serializeInstant } from '../src/utils/dateTime.js';
import { DbTypes, createProcedureClient, normalizeTemporalResult } from '../src/db/procedureClient.js';
import { databaseConfig } from '../src/config/database.js';
import { showtimeCreate } from '../src/validators/managerValidator.js';
import { showtimeWrite, promotionWrite } from '../src/validators/adminValidator.js';

test('API instants require explicit offsets and valid calendar/time components', () => {
  for (const value of ['2026-10-03T19:30', '2026-10-03 19:30:00', '2026-02-30T12:00:00Z', '2026-10-03T24:00:00Z', 'not a date']) {
    assert.equal(isApiInstant(value), false, value);
    assert.throws(() => parseApiInstant(value), { status: 400 });
  }
  assert.equal(serializeInstant(parseApiInstant('2026-10-03T19:30:00+07:00')), '2026-10-03T12:30:00.000Z');
  assert.equal(serializeInstant('2026-10-03T00:30:00+07:00'), '2026-10-02T17:30:00.000Z');
  assert.equal(databaseConfig.options.useUTC, true);
});

test('date-only leap years and SQL DATE carriers keep their calendar date', () => {
  for (const date of ['2000-01-01', '2000-02-29', '2026-10-03']) assert.equal(serializeDateOnly(date), date);
  for (const date of ['1900-02-29', '2026-02-30', '0000-01-01', '2026-13-01', '2000-01-01T00:00:00Z']) assert.equal(isDateOnly(date), false);
  assert.equal(serializeDateOnly(new Date('2000-01-01T00:00:00Z')), '2000-01-01');
  assert.equal(serializeDateOnly(null), null);
});

test('procedure result metadata separates pricing DATE from promotion datetime2', () => {
  const values = [{ NgayBatDau: new Date('2000-01-01T00:00:00Z'), PromotionStart: new Date('2026-10-03T12:30:00Z'), Nullable: null }];
  values.columns = { NgayBatDau: { type: DbTypes.Date }, PromotionStart: { type: DbTypes.DateTime2 } };
  const result = normalizeTemporalResult({recordsets:[values],recordset:values,output:{Day:new Date('2000-01-01T00:00:00Z')}},{Day:DbTypes.Date});
  assert.equal(result.recordset[0].NgayBatDau, '2000-01-01');
  assert.equal(result.recordset[0].PromotionStart, '2026-10-03T12:30:00.000Z');
  assert.equal(result.output.Day, '2000-01-01');
  assert.equal(JSON.parse(JSON.stringify(result)).recordset[0].NgayBatDau, '2000-01-01');
});

test('procedure binding preserves date-only and offset-equivalent instant inputs', async () => {
  const inputs={}; const request={input:(name,type,value)=>{inputs[name]=value;},execute:async()=>({recordset:[]})};
  const client=createProcedureClient(async()=>({request:()=>request}));
  await client.executeProcedure('SHOWTIME_LIST_BY_MOVIE',{NgayChieu:{type:DbTypes.Date,value:'2000-01-01'}});
  assert.equal(inputs.NgayChieu,'2000-01-01');
  await client.executeProcedure('MANAGER_SHOWTIME_CREATE',{ThoiGianBatDau:{type:DbTypes.DateTime2,value:'2026-10-03T19:30:00+07:00'}});
  assert.equal(inputs.ThoiGianBatDau.toISOString(),'2026-10-03T12:30:00.000Z');
  await assert.rejects(client.executeProcedure('MANAGER_SHOWTIME_CREATE',{ThoiGianBatDau:{type:DbTypes.DateTime2,value:'2026-10-03T19:30'}}),{status:400});
});

test('showtime and promotion request validators reject ambiguous instants', () => {
  const show={movieId:1,roomId:1,startsAt:'2026-10-03T19:30:00+07:00',endsAt:'2026-10-03T21:30:00+07:00',format:'2D',basePrice:80000};
  assert.equal(showtimeCreate(show).startsAt,show.startsAt);
  assert.equal(showtimeWrite(show,true).startsAt,show.startsAt);
  assert.throws(()=>showtimeCreate({...show,startsAt:'2026-10-03T19:30'}),{status:400});
  assert.throws(()=>showtimeWrite({...show,startsAt:'2026-10-03T19:30'},true),{status:400});
  assert.throws(()=>promotionWrite({code:'R1',description:'test',discountType:'Phần trăm',discountValue:10,minimumOrder:0,maximumDiscount:null,startsAt:'2026-10-03T19:30',endsAt:show.endsAt,quantity:100},true),{status:400});
});

test('backend date and instant semantics are independent of process timezone', () => {
  const module=new URL('../src/utils/dateTime.js',import.meta.url).href;
  const code=`import {serializeDateOnly,serializeInstant} from '${module}';console.log(JSON.stringify([serializeDateOnly(new Date('2000-01-01T00:00:00Z')),serializeInstant('2026-10-03T19:30:00+07:00')]));`;
  const output=['UTC','Asia/Ho_Chi_Minh','America/Los_Angeles'].map(TZ=>{
    const result=spawnSync(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TZ},encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);return result.stdout.trim();
  });
  assert.equal(new Set(output).size,1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { adminForms, formFields, inputValue, toBody } from '../src/utils/adminForms.js';

const fields = formFields(adminForms.pricing, true);
const row = { GiaID: 7, RapID: 2, LoaiGhe: 'VIP', LoaiNgay: 'Cuối tuần', DinhDang: 'IMAX', PhuThu: 25000, NgayBatDau: '2031-01-01', NgayKetThuc: '2031-12-31', TrangThai: 'Áp dụng' };
const hydrate = value => Object.fromEntries(fields.map(([name, , kind, column]) => [name, inputValue(value[column], kind)]));

test('R4.3 pricing edit exposes all seven fields and keeps cinema immutable', () => {
  assert.deepEqual(fields.map(([name]) => name), ['surcharge', 'seatType', 'dayType', 'format', 'startsOn', 'endsOn', 'status']);
  assert.equal(fields.some(([name]) => name === 'cinemaId'), false);
  assert.equal(formFields(adminForms.pricing, false).some(([name]) => name === 'cinemaId'), true);
});

test('R4.3 existing editor hydration and payload retain selected values without defaults', () => {
  assert.deepEqual(toBody(hydrate(row), fields), { surcharge: 25000, seatType: 'VIP', dayType: 'Cuối tuần', format: 'IMAX', startsOn: '2031-01-01', endsOn: '2031-12-31', status: 'Áp dụng' });
  assert.deepEqual(toBody({ ...hydrate(row), seatType: 'Thường', startsOn: '2031-02-01' }, fields), { surcharge: 25000, seatType: 'Thường', dayType: 'Cuối tuần', format: 'IMAX', startsOn: '2031-02-01', endsOn: '2031-12-31', status: 'Áp dụng' });
});

test('R4.3 open-ended pricing hydrates blank and clearing end date submits explicit null', () => {
  const values = hydrate({ ...row, NgayKetThuc: null });
  assert.equal(values.endsOn, ''); assert.equal(toBody(values, fields).endsOn, null);
  assert.equal(toBody({ ...hydrate(row), endsOn: '' }, fields).endsOn, null);
});

test('R4.3 Admin edit retains the R0 three-day whitelist', () => {
  for (const dayType of ['Ngày thường', 'Cuối tuần', 'Tất cả']) assert.equal(toBody({ ...hydrate(row), dayType }, fields).dayType, dayType);
  assert.throws(() => toBody({ ...hydrate(row), dayType: 'Ngày lễ' }, fields));
});

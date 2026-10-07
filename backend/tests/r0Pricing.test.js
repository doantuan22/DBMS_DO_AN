import assert from 'node:assert/strict';
import test from 'node:test';
import { DAY_TYPES } from '../../shared/resourceContract.mjs';
import { pricingWrite } from '../src/validators/adminValidator.js';
import { pricingCreate, pricingUpdate } from '../src/validators/managerValidator.js';

const conditions = { seatType: 'VIP', format: '2D', surcharge: 10000, startsOn: '2026-10-07', endsOn: null };
test('R0 pricing exposes exactly three immutable day types', () => {
  assert.deepEqual(DAY_TYPES, ['Ngày thường', 'Cuối tuần', 'Tất cả']);
  assert.ok(Object.isFrozen(DAY_TYPES));
});
for (const dayType of ['Ngày thường', 'Cuối tuần', 'Tất cả']) {
  test(`R0 manager create/edit and admin create accept ${dayType}`, () => {
    const body = { ...conditions, dayType };
    assert.equal(pricingCreate(body).dayType, dayType);
    assert.equal(pricingUpdate({ ...body, status: 'Áp dụng' }).dayType, dayType);
    assert.equal(pricingWrite({ ...body, cinemaId: 1 }, true).dayType, dayType);
  });
}
for (const dayType of ['Ngày lễ', 'holiday', 'Holiday', 'HOLIDAY', '', 'Không hợp lệ']) {
  test(`R0 pricing rejects unsupported day type ${JSON.stringify(dayType)}`, () => {
    const body = { ...conditions, dayType };
    for (const validate of [() => pricingCreate(body), () => pricingUpdate({ ...body, status: 'Áp dụng' }),
      () => pricingWrite({ ...body, cinemaId: 1 }, true)]) {
      assert.throws(validate, error => error.status === 400 && error.code === 'INVALID_REQUEST');
    }
  });
}

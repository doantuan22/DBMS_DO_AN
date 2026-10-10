import test from 'node:test';
import assert from 'node:assert/strict';
import { pricingWrite } from '../src/validators/adminValidator.js';
import { pricingUpdate } from '../src/validators/managerValidator.js';
import { createAdminService } from '../src/services/adminService.js';
import { DbTypes } from '../src/db/procedureClient.js';
import { PROCEDURES } from '../src/db/procedures.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const partial = { surcharge: 15000, status: 'Áp dụng' };
const full = {
  ...partial,
  seatType: 'VIP',
  dayType: 'Tất cả',
  format: '2D',
  startsOn: '2031-01-01',
  endsOn: '2031-12-31',
};

test('R4.3 Admin validates all seven fields and matches Manager condition-edit capability', () => {
  assert.deepEqual(pricingWrite(full), full);
  assert.deepEqual(pricingWrite(full), pricingUpdate(full));
  assert.deepEqual(pricingWrite(partial), partial);
  assert.deepEqual(pricingWrite(partial), pricingUpdate(partial));
  for (const dayType of ['Ngày thường', 'Cuối tuần', 'Tất cả'])
    assert.equal(pricingWrite({ ...full, dayType }).dayType, dayType);
});

test('R4.3 omitted condition group preserves legacy payload; a complete group can clear the end date', () => {
  const { endsOn, ...open } = full;
  assert.deepEqual(pricingWrite(open), { ...open, endsOn: null });
  assert.deepEqual(pricingWrite({ ...full, endsOn: null }), { ...full, endsOn: null });
  for (const field of ['seatType', 'dayType', 'format', 'startsOn']) {
    assert.throws(() => pricingWrite({ ...full, [field]: null }), { status: 400 });
    const input = Object.fromEntries(Object.entries(full).filter(([key]) => key !== field));
    assert.throws(() => pricingWrite(input), { status: 400 });
  }
  assert.throws(() => pricingWrite({ ...partial, endsOn: null }), { status: 400 });
});

test('R4.3 rejects unsupported, malformed, out-of-range and immutable fields', () => {
  for (const patch of [
    { seatType: 'invalid' },
    { dayType: 'Ngày lễ' },
    { format: 'invalid' },
    { status: 'invalid' },
    { startsOn: '2031-02-30' },
    { endsOn: '2030-12-31' },
    { endsOn: '' },
    { surcharge: -1 },
    { surcharge: '1' },
    { surcharge: 0.001 },
    { surcharge: 1e16 },
    { surcharge: null },
    { cinemaId: 1 },
    { ActorID: 1 },
    { CapNhatDieuKien: true },
    { GiaID: 1 },
  ]) {
    assert.throws(() => pricingWrite({ ...full, ...patch }), { status: 400 });
  }
  for (const input of [null, [], {}, { surcharge: 0 }, { status: 'Áp dụng' }])
    assert.throws(() => pricingWrite(input), { status: 400 });
});

test('R4.3 service binds the full typed signature to the existing whitelist procedure and retains the DTO', async () => {
  let call;
  const row = {
    GiaID: 9,
    RapID: 2,
    LoaiGhe: 'VIP',
    LoaiNgay: 'Tất cả',
    DinhDang: '2D',
    PhuThu: 15000,
    NgayBatDau: '2031-01-01',
    NgayKetThuc: '2031-12-31',
    TrangThai: 'Áp dụng',
  };
  const service = createAdminService({
    execute: async (key, params) => {
      call = { key, params };
      return { recordset: [row] };
    },
  });
  assert.strictEqual(await service.updatePricing(7, 9, pricingWrite(full)), row);
  assert.equal(call.key, 'ADMIN_PRICING_UPDATE');
  assert.equal(PROCEDURES[call.key], 'dbo.usp_Admin_Pricing_Update');
  assert.deepEqual(call.params, {
    ActorID: { type: DbTypes.Int, value: 7 },
    GiaID: { type: DbTypes.Int, value: 9 },
    PhuThu: { type: DbTypes.Decimal(18, 2), value: 15000 },
    TrangThai: { type: DbTypes.NVarChar(50), value: 'Áp dụng' },
    LoaiGhe: { type: DbTypes.NVarChar(50), value: 'VIP' },
    LoaiNgay: { type: DbTypes.NVarChar(50), value: 'Tất cả' },
    DinhDang: { type: DbTypes.NVarChar(50), value: '2D' },
    NgayBatDau: { type: DbTypes.Date, value: '2031-01-01' },
    NgayKetThuc: { type: DbTypes.Date, value: '2031-12-31' },
    CapNhatDieuKien: { type: DbTypes.Bit, value: true },
  });
});

test('R4.3 service omits new parameters for old callers and binds SQL NULL only for a complete open-ended edit', async () => {
  const calls = [];
  const service = createAdminService({
    execute: async (_, params) => {
      calls.push(params);
      return { recordset: [] };
    },
  });
  await service.updatePricing(7, 9, pricingWrite(partial));
  assert.deepEqual(Object.keys(calls[0]), ['GiaID', 'PhuThu', 'TrangThai', 'ActorID']);
  await service.updatePricing(7, 9, pricingWrite({ ...full, endsOn: null }));
  assert.equal(calls[1].NgayKetThuc.value, null);
  assert.equal(calls[1].CapNhatDieuKien.value, true);
});

for (const [number, status, code] of [
  [50209, 400, 'PRICING_INVALID'],
  [50210, 404, 'PRICING_NOT_FOUND'],
  [50215, 409, 'PRICING_OVERLAP'],
  [50300, 401, 'ACCOUNT_UNAVAILABLE'],
  [50301, 403, 'FORBIDDEN'],
  [50302, 403, 'FORBIDDEN'],
]) {
  test(`R4.3 keeps existing SQL domain mapping ${number}`, async () => {
    const service = createAdminService({
      execute: async () => {
        throw { originalError: { info: { number } } };
      },
    });
    let error;
    try {
      await service.updatePricing(7, 9, full);
    } catch (caught) {
      error = caught;
    }
    assert.ok(error);
    let response;
    errorHandler(
      error,
      {},
      {
        status(value) {
          assert.equal(value, status);
          return this;
        },
        json(value) {
          response = value;
        },
      },
      () => {},
    );
    assert.equal(response.error.code, code);
    assert.match(response.error.message, /^(?![\s\S]*(?:dbo\.|SELECT|THROW))[\s\S]*$/);
  });
}

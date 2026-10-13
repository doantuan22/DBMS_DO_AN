import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService } from '../src/services/adminService.js';
import { DbTypes } from '../src/db/procedureClient.js';
import { PROCEDURES } from '../src/db/procedures.js';
import { revenueFilters } from '../src/validators/adminValidator.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

test('R4.2 revenue binds authenticated actor and existing DATE/cinema inputs to the fixed procedure', async () => {
  let call;
  const service = createAdminService({
    execute: async (key, params) => {
      call = { key, params };
      return { recordsets: [[], [], [], []] };
    },
  });
  await service.revenue(
    7,
    revenueFilters({ fromDate: '2031-01-01', toDate: '2031-01-03', cinemaId: '2' }),
  );
  assert.equal(call.key, 'ADMIN_REPORT_REVENUE');
  assert.equal(PROCEDURES[call.key], 'dbo.sp_Admin_Report_Revenue');
  assert.deepEqual(call.params, {
    ActorID: { type: DbTypes.Int, value: 7 },
    TuNgay: { type: DbTypes.Date, value: '2031-01-01' },
    DenNgay: { type: DbTypes.Date, value: '2031-01-03' },
    RapID: { type: DbTypes.Int, value: 2 },
  });
});

test('R4.2 maps all four SQL recordsets without changing any financial value and retains legacy aliases', async () => {
  const summary = { TongSoDonToanHeThong: 2, TongDoanhThuThucTe: 258000.25 };
  const byCinema = [{ RapID: 1, DoanhThuThucTe: 169000.25 }];
  const byMovie = [{ PhimID: 2, DoanhThuThucTe: 89000 }];
  const byDate = [{ Ngay: '2031-01-02', DoanhThuThucTe: 258000.25 }];
  const service = createAdminService({
    execute: async () => ({ recordsets: [[summary], byCinema, byMovie, byDate] }),
  });
  const dto = await service.revenue(7);
  assert.deepEqual(dto, { summary, byCinema, byMovie, byDate, cinemas: byCinema, totals: summary });
  for (const [key, expected] of Object.entries({
    summary,
    byCinema,
    byMovie,
    byDate,
    cinemas: byCinema,
    totals: summary,
  }))
    assert.strictEqual(dto[key], expected);
});

test('R4.2 empty recordsets produce an object summary and array breakdowns', async () => {
  let bound;
  const service = createAdminService({
    execute: async (_, params) => {
      bound = params;
      return { recordsets: [[], [], [], []] };
    },
  });
  assert.deepEqual(await service.revenue(7), {
    summary: {},
    byCinema: [],
    byMovie: [],
    byDate: [],
    cinemas: [],
    totals: {},
  });
  assert.equal(bound.TuNgay.value, null);
  assert.equal(bound.DenNgay.value, null);
  assert.equal(bound.RapID.value, null);
});

test('R4.2 report rejects actor/amount/unsupported filters and invalid date ranges through the existing validator', () => {
  for (const input of [
    { ActorID: '7' },
    { role: 'ADMIN' },
    { amount: '1' },
    { fromDate: '2031-02-30' },
    { fromDate: '2031-01-03', toDate: '2031-01-01' },
    { cinemaId: '2147483648' },
  ])
    assert.throws(() => revenueFilters(input));
});

for (const [number, status, code] of [
  [50300, 401, 'ACCOUNT_UNAVAILABLE'],
  [50301, 403, 'FORBIDDEN'],
  [50302, 403, 'FORBIDDEN'],
]) {
  test(`R4.2 SQL authorization error ${number} keeps the shared HTTP error mapping`, async () => {
    const original = { originalError: { info: { number } } };
    const service = createAdminService({
      execute: async () => {
        throw original;
      },
    });
    let error;
    try {
      await service.revenue(7);
    } catch (caught) {
      error = caught;
    }
    assert.strictEqual(error, original);
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

test('R4.2 unexpected procedure failures propagate instead of returning an empty successful report', async () => {
  const failure = new Error('test failure');
  await assert.rejects(
    createAdminService({
      execute: async () => {
        throw failure;
      },
    }).revenue(7),
    (error) => error === failure,
  );
});

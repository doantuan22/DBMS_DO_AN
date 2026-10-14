import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAX_SEATS_PER_ORDER,
  MAX_PRODUCT_QUANTITY,
  validateBooking,
  validatePromotion,
} from '../src/validators/bookingValidator.js';
import { MAX_PERCENT_DISCOUNT, promotionWrite } from '../src/validators/adminValidator.js';
import { createBookingService } from '../src/services/bookingService.js';
import { sqlDecimal } from '../src/utils/inputContract.js';
import { DbTypes } from '../src/db/procedureClient.js';
import * as frontendLimits from '../../frontend/src/constants/bookingLimits.js';

const input = {
  showtimeId: 7,
  seatIds: [1, 2],
  products: [{ productId: 3, quantity: 1 }],
  promotionCode: 'CENT',
};
function previewFixture(seatPrices, productPrice, quantity = 1) {
  const calls = [];
  const service = createBookingService({
    execute: async (key, params) => {
      calls.push({ key, params });
      return {
        recordset:
          key === 'SEAT_LIST_BY_SHOWTIME'
            ? seatPrices.map((price, index) => ({
                GheID: index + 1,
                GiaVe: price,
                TrangThaiGhe: 'Trống',
              }))
            : [{ SanPhamID: 3, Gia: productPrice }],
      };
    },
    executeWithOutputs: async (key, params, outputs) => {
      sqlDecimal(params.TongTienDon.value, 'TongTienDon');
      calls.push({ key, params, outputs });
      return {
        output: {
          IsValid: true,
          KhuyenMaiID: 4,
          TienGiam: 0.1,
          GiaTriGiam: 0.1,
          LoaiGiamGia: 'FIXED',
          Message: 'SQL preview',
        },
      };
    },
  });
  return {
    calls,
    service,
    request: {
      ...input,
      seatIds: seatPrices.map((_, i) => i + 1),
      products: [{ productId: 3, quantity }],
    },
  };
}

test('R4.4 verified 10/10/99 contract matches existing FE/BE constants and canonical SQL owners', () => {
  assert.equal(MAX_SEATS_PER_ORDER, 10);
  assert.equal(MAX_PRODUCT_QUANTITY, 10);
  assert.equal(MAX_PERCENT_DISCOUNT, 99);
  assert.equal(frontendLimits.MAX_SEATS_PER_ORDER, 10);
  assert.equal(frontendLimits.MAX_PRODUCT_QUANTITY, 10);
  for (const name of ['fn_GioiHanGheMoiDon', 'fn_GioiHanSoLuongSanPham'])
    assert.match(
      fs.readFileSync(new URL(`../../database/05_functions/${name}.sql`, import.meta.url), 'utf8'),
      /RETURN\s+10\s*;/,
    );
  assert.match(
    fs.readFileSync(
      new URL('../../database/05_functions/fn_GioiHanGiamGiaPhanTram.sql', import.meta.url),
      'utf8',
    ),
    /RETURN\s+99\s*;/,
  );
  assert.match(
    fs.readFileSync(
      new URL('../../database/03_constraints/003_check_constraints.sql', import.meta.url),
      'utf8',
    ),
    /CK_KHUYENMAI_PhanTram99[^;]+99/,
  );
});

test('R4.4 HTTP boundaries accept nine/ten and reject eleven for both booking and preview', () => {
  for (const validate of [validateBooking, validatePromotion]) {
    for (const n of [9, 10])
      assert.equal(
        validate({ ...input, seatIds: Array.from({ length: n }, (_, i) => i + 1) }).seatIds.length,
        n,
      );
    assert.throws(
      () => validate({ ...input, seatIds: Array.from({ length: 11 }, (_, i) => i + 1) }),
      { status: 400, code: 'SEAT_LIMIT_EXCEEDED' },
    );
    for (const quantity of [9, 10])
      assert.equal(
        validate({ ...input, products: [{ productId: 3, quantity }] }).products[0].quantity,
        quantity,
      );
    assert.throws(() => validate({ ...input, products: [{ productId: 3, quantity: 11 }] }), {
      status: 400,
      code: 'PRODUCT_QUANTITY_LIMIT_EXCEEDED',
    });
    assert.deepEqual(
      validate({
        ...input,
        products: [
          { productId: 3, quantity: 10 },
          { productId: 4, quantity: 10 },
        ],
      }).products,
      [
        { productId: 3, quantity: 10 },
        { productId: 4, quantity: 10 },
      ],
    );
  }
});

test('R4.4 percent boundary is separate from a fixed monetary value and maximum amount', () => {
  const base = {
    code: 'BOUND',
    discountType: 'PERCENT',
    discountValue: 99,
    minimumOrder: 0,
    maximumDiscount: 5000,
    startsAt: '2031-01-01T00:00:00Z',
    endsAt: '2031-12-31T00:00:00Z',
    quantity: 1,
  };
  for (const discountType of ['PERCENT', 'Phần trăm']) {
    assert.equal(promotionWrite({ ...base, discountType }, true).discountValue, 99);
    assert.throws(() => promotionWrite({ ...base, discountType, discountValue: 100 }, true), {
      status: 400,
    });
  }
  assert.equal(
    promotionWrite({ ...base, discountType: 'FIXED', discountValue: 10000 }, true).discountValue,
    10000,
  );
  assert.equal(promotionWrite(base, true).maximumDiscount, 5000);
});

for (const { prices, product, quantity, total } of [
  { prices: [0.1, 0.1], product: 0.1, quantity: 1, total: 0.3 },
  { prices: [80000.1, 80000.1], product: 10000.1, quantity: 1, total: 170000.3 },
  { prices: [0.01], product: 0.29, quantity: 7, total: 2.04 },
])
  test(`R4.4 preview binds database-priced decimal subtotal ${total} without binary noise`, async () => {
    const { service, calls, request } = previewFixture(prices, product, quantity),
      result = await service.validatePromotion(8, request);
    const promotion = calls.find((call) => call.key === 'PROMOTION_VALIDATE');
    assert.deepEqual(promotion.params, {
      NguoiDungID: { type: DbTypes.Int, value: 8 },
      MaCode: { type: DbTypes.VarChar(50), value: 'CENT' },
      TongTienDon: { type: DbTypes.Decimal(18, 2), value: total },
    });
    assert.equal(result.provisionalSubtotal, total);
    assert.equal(result.discountAmount, 0.1);
    assert.deepEqual(
      calls.map((call) => call.key).sort(),
      ['PROMOTION_VALIDATE', 'PRODUCT_LIST_ACTIVE', 'SEAT_LIST_BY_SHOWTIME'].sort(),
    );
    assert.deepEqual(Object.keys(result), [
      'isValid',
      'code',
      'promotionId',
      'discountType',
      'discountValue',
      'discountAmount',
      'message',
      'provisionalSubtotal',
    ]);
  });

test('R4.4 client cannot supply monetary preview or acceptance to booking/preview', () => {
  for (const validate of [validateBooking, validatePromotion])
    for (const field of [
      'total',
      'subtotal',
      'price',
      'discountAmount',
      'provisionalSubtotal',
      'isValid',
      'remainingQuota',
    ])
      assert.throws(() => validate({ ...input, [field]: 0.01 }), {
        status: 400,
        code: 'UNKNOWN_REQUEST_FIELD',
      });
});

test('R4.4 booking maps authoritative SQL values and sends only IDs, quantity and code', async () => {
  let bound;
  const service = createBookingService({
    executeWithOutputs: async (key, params) => {
      bound = { key, params };
      return {
        recordsets: [
          [{ IsValid: true, TienGiam: 999 }],
          [
            {
              DonDatVeID: 9,
              TongTienVe: 0.3,
              TongTienDoAn: 0.1,
              TienGiamGia: 0.12,
              TongThanhToan: 0.28,
              SoLuongVe: 2,
            },
          ],
        ],
      };
    },
  });
  const booking = await service.createBooking(8, validateBooking(input));
  assert.equal(bound.key, 'BOOKING_CREATE');
  assert.deepEqual(Object.keys(bound.params), [
    'NguoiDungID',
    'SuatChieuID',
    'MaKhuyenMai',
    'DanhSachGheId',
    'DanhSachDoAnJson',
    // the customer's points choice and the preview switch; never an amount or a price
    'DiemSuDung',
    'ChiXemTruoc',
  ]);
  assert.equal(bound.params.ChiXemTruoc.value, false);
  assert.deepEqual(
    [booking.ticketTotal, booking.productTotal, booking.discountTotal, booking.total],
    [0.3, 0.1, 0.12, 0.28],
  );
});

test('points booking: the choice is bound as an integer, amounts come only from the database', async () => {
  const calls = [];
  const service = createBookingService({
    executeWithOutputs: async (key, params) => {
      calls.push({ key, params });
      return {
        recordsets: [
          [
            {
              DonDatVeID: 12,
              TongTienVe: 100000,
              TongTienDoAn: 20000,
              TienGiamGia: 70000,
              DiemSuDung: 70,
              TongThanhToan: 50000,
              SoLuongVe: 1,
            },
          ],
        ],
      };
    },
  });
  const booking = await service.createBooking(8, validateBooking({ ...input, points: 70 }));
  assert.equal(calls[0].params.DiemSuDung.value, 70);
  assert.deepEqual([booking.pointsUsed, booking.pointsDiscount, booking.total], [70, 70000, 50000]);
});

test('points preview uses the booking procedure in preview mode and maps the DB preview row', async () => {
  const calls = [];
  const service = createBookingService({
    executeWithOutputs: async (key, params) => {
      calls.push({ key, params });
      return {
        recordsets: [
          [
            {
              SuatChieuID: 3,
              TongTienVe: 90000,
              TongTienDoAn: 0,
              TienGiamGia: 40000,
              DiemSuDung: 40,
              TongThanhToan: 50000,
              SoDuDiem: 100,
              DiemToiDa: 90,
              SoDuDiemSauKhiDat: 60,
            },
          ],
        ],
      };
    },
  });
  const preview = await service.previewBooking(8, validateBooking({ ...input, points: 40 }));
  assert.equal(calls[0].key, 'BOOKING_CREATE');
  assert.equal(calls[0].params.ChiXemTruoc.value, true);
  assert.deepEqual(
    [
      preview.pointsUsed,
      preview.pointsDiscount,
      preview.total,
      preview.maxPoints,
      preview.pointsBalance,
    ],
    [40, 40000, 50000, 90, 100],
  );
});

test('points SQL errors map to stable business errors', async () => {
  for (const [number, status, code] of [
    [50410, 400, 'INVALID_POINTS'],
    [50411, 409, 'POINTS_INSUFFICIENT'],
    [50412, 409, 'POINTS_EXCEED_TICKET_VALUE'],
  ]) {
    const service = createBookingService({
      executeWithOutputs: async () => {
        throw { number };
      },
    });
    await assert.rejects(
      service.createBooking(8, validateBooking({ ...input, points: 5 })),
      (error) => error.status === status && error.code === code,
    );
  }
});

import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let limits;
let constants;
let SeatMap;
let ProductPicker;

before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  limits = await vite.ssrLoadModule('/src/utils/bookingLimits.js');
  constants = await vite.ssrLoadModule('/src/constants/bookingLimits.js');
  ({ default: SeatMap } = await vite.ssrLoadModule('/src/components/SeatMap.jsx'));
  ({ default: ProductPicker } = await vite.ssrLoadModule('/src/components/ProductPicker.jsx'));
});

after(async () => { await vite?.close(); });

test('R2 held-order cancellation conflicts explain the waiting reason in Vietnamese', () => {
  assert.match(limits.bookingErrorMessage({ code: 'SHOWTIME_HAS_HELD_ORDERS' }), /còn đơn giữ ghế\/chờ thanh toán còn hiệu lực/);
  assert.match(limits.bookingErrorMessage({ code: 'ORDER_HOLD_EXPIRED' }), /hết thời gian giữ ghế/);
});

test('the limits are the agreed ones and live in one constants module', () => {
  assert.deepEqual({ ...constants }, { MAX_SEATS_PER_ORDER: 10, MAX_PRODUCT_QUANTITY: 10, MAX_HOLDING_ORDERS: 3, HOLD_MINUTES: 5 });
});

test('seat selection stops at 10 seats and the 11th seat is refused', () => {
  const ten = Array.from({ length: 10 }, (_, i) => i + 1);
  assert.deepEqual(limits.toggleSeatSelection(ten.slice(0, 9), 10), { selectedIds: ten, limitReached: false });
  assert.deepEqual(limits.toggleSeatSelection(ten, 11), { selectedIds: ten, limitReached: true });
  // a selected seat can still be removed at the limit, which clears the notice
  assert.deepEqual(limits.toggleSeatSelection(ten, 3), { selectedIds: ten.filter((id) => id !== 3), limitReached: false });
});

test('product quantity is clamped to 10 and reports when the user asked for more', () => {
  assert.deepEqual(limits.clampQuantity('7'), { quantity: 7, limited: false });
  assert.deepEqual(limits.clampQuantity('10'), { quantity: 10, limited: false });
  assert.deepEqual(limits.clampQuantity('11'), { quantity: 10, limited: true });
  assert.deepEqual(limits.clampQuantity('99999999999'), { quantity: 10, limited: true });
  assert.deepEqual(limits.clampQuantity('-4'), { quantity: 0, limited: false });
  assert.deepEqual(limits.clampQuantity(''), { quantity: 0, limited: false });
});

test('seat map shows the counter, flags the limit and the notice', () => {
  const seats = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, label: `A${i + 1}`, status: 'Trống' }));
  const some = renderToStaticMarkup(React.createElement(SeatMap, { seats, selectedSeatIds: [1, 2, 3], onToggle() {} }));
  assert.match(some, /Đã chọn 3\/10 ghế\./);
  assert.doesNotMatch(some, /role="alert"/);
  const full = renderToStaticMarkup(React.createElement(SeatMap, { seats, selectedSeatIds: seats.slice(0, 10).map((s) => s.id), onToggle() {}, limitNotice: limits.SEAT_LIMIT_MESSAGE }));
  assert.match(full, /Đã chọn 10\/10 ghế — đã đạt tối đa/);
  assert.match(full, /role="alert">Mỗi đơn chỉ được chọn tối đa 10 ghế\./);
});

test('product picker caps the input at 10 and says so at the cap', () => {
  const render = (quantity) => renderToStaticMarkup(React.createElement(ProductPicker, { products: [{ id: 8, name: 'Combo', price: 95000 }], quantities: { 8: quantity }, onQuantityChange() {} }));
  assert.match(render(3), /max="10"/);
  assert.doesNotMatch(render(3), /Đã đạt tối đa/);
  assert.match(render(10), /Đã đạt tối đa 10 mỗi sản phẩm\./);
});

test('limit and hold errors of the booking flow have friendly Vietnamese messages', () => {
  assert.match(limits.bookingErrorMessage({ code: 'ACTIVE_ORDER_LIMIT_REACHED' }), /3 đơn chưa thanh toán.*5 phút/);
  assert.match(limits.bookingErrorMessage({ code: 'SEAT_LIMIT_EXCEEDED' }), /tối đa 10 ghế/);
  assert.match(limits.bookingErrorMessage({ code: 'PRODUCT_QUANTITY_LIMIT_EXCEEDED' }), /tối đa 10/);
  assert.match(limits.bookingErrorMessage({ code: 'ORDER_HOLD_EXPIRED' }), /5 phút/);
  assert.equal(limits.bookingErrorMessage({ code: 'SEAT_CONFLICT' }), null);
  assert.equal(limits.bookingErrorMessage(undefined), null);
});

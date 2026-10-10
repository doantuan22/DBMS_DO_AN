import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

let vite, limits;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  limits = await vite.ssrLoadModule('/src/utils/bookingLimits.js');
});
after(async () => {
  await vite?.close();
});

test('R4.4 UX accepts nine/ten seats and refuses the eleventh without losing selection', () => {
  const nine = Array.from({ length: 9 }, (_, i) => i + 1),
    ten = [...nine, 10];
  assert.deepEqual(limits.toggleSeatSelection(nine, 10), { selectedIds: ten, limitReached: false });
  assert.deepEqual(limits.toggleSeatSelection(ten, 11), { selectedIds: ten, limitReached: true });
  assert.deepEqual(limits.toggleSeatSelection(ten, 10), { selectedIds: nine, limitReached: false });
});
test('R4.4 UX quantity zero means deselection; nine/ten/eleven follow per-product limit', () => {
  for (const quantity of [0, 9, 10])
    assert.deepEqual(limits.clampQuantity(String(quantity)), { quantity, limited: false });
  assert.deepEqual(limits.clampQuantity('11'), { quantity: 10, limited: true });
});
test('R4.4 current booking and payment pages distinguish preview and authoritative responses', () => {
  const booking = fs.readFileSync(
    new URL('../src/pages/BookingPreparation.jsx', import.meta.url),
    'utf8',
  );
  assert.match(booking, /Kết quả khuyến mãi là tạm tính; mã sẽ được kiểm tra lại khi đặt vé/);
  assert.match(booking, /Giảm tạm tính/);
  assert.match(booking, /money\(bookingState\.booking\.total\)/);
  assert.match(booking, /PROMOTION_NOT_AVAILABLE[\s\S]*setPromotion\(\{ isValid: false/);
  assert.match(
    booking,
    /createBooking\s*\(\s*\{\s*showtimeId:\s*Number\(showtimeId\),\s*seatIds:\s*selectedSeatIds,\s*products:\s*selectedProducts,\s*promotionCode:/,
  );
  const payment = fs.readFileSync(new URL('../src/pages/PaymentPage.jsx', import.meta.url), 'utf8');
  assert.match(payment, /money\(order\.total\)/);
  assert.match(payment, /createPaymentAttempt\(orderId, method\)/);
});

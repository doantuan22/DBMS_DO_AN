import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let vite, forms, gallery, Gallery, Details;
before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  forms = await vite.ssrLoadModule('/src/utils/managerForms.js');
  gallery = await vite.ssrLoadModule('/src/utils/cinemaGallery.js');
  ({ default: Gallery } = await vite.ssrLoadModule('/src/components/CinemaGallery.jsx'));
  ({ OrderReferenceDetails: Details } = await vite.ssrLoadModule('/src/components/ComplaintOrderReference.jsx'));
});
after(async () => { await vite?.close(); });
test('R7 edit hydration roundtrips UTC and DATE_ONLY, excluding immutable IDs/room and hidden fields', () => {
  const row = { id: 7, roomId: 2, movieId: 1, startsAt: '2027-01-01T18:30:00.123Z', endsAt: '2027-01-01T21:16:00.123Z', format: 'IMAX', basePrice: 123456.78, status: 'Đóng bán' };
  const body = forms.managerBody('showtime', forms.initialManagerValues('showtime', row), true);
  const expected = Object.fromEntries(Object.entries(row).filter(([key]) => !['id', 'roomId'].includes(key)));
  assert.deepEqual(body, expected);
  assert.deepEqual(forms.managerBody('seat', forms.initialManagerValues('seat', { id: 1, row: 'A', number: 3, type: 'VIP', status: 'Hỏng' }), true), { type: 'VIP', status: 'Hỏng' });
  const pricing = { seatType: 'VIP', dayType: 'Cuối tuần', format: 'IMAX', surcharge: 15000, startsOn: '2027-01-01', endsOn: null, status: 'Áp dụng' };
  assert.deepEqual(forms.managerBody('pricing', forms.initialManagerValues('pricing', pricing), true), pricing);
  assert.throws(() => forms.managerBody('pricing', { ...pricing, endsOn: '2026-12-31' }, true));
});
test('R7 gallery excludes inactive images, sorts cover first then display order, and has accessible empty/single/multi output', () => {
  const rows = [{ id: 1, status: 'Hoạt động', cover: false, displayOrder: 2, url: '/one', description: 'One' },
    { id: 2, status: 'Hoạt động', cover: true, displayOrder: 10, url: '/cover', description: 'Cover' },
    { id: 3, status: 'Tạm ẩn', cover: false, displayOrder: 0, url: '/private' },
    { id: 4, status: 'Hoạt động', cover: false, displayOrder: 1, url: '/four' }];
  assert.deepEqual(gallery.publicGalleryImages(rows).map(row => row.id), [2, 4, 1]);
  assert.deepEqual(rows.map(row => row.id), [1, 2, 3, 4]);
  for (const images of [[], [rows[0]], rows]) {
    const html = renderToStaticMarkup(React.createElement(Gallery, { images, cinemaName: 'Fixture' }));
    assert.ok(!html.includes('/private'));
    assert.equal((html.match(/<figure/g) ?? []).length, images.length ? images.length === 1 ? 1 : 3 : 0);
    if (!images.length) assert.match(html, /Chưa có ảnh rạp/);
    else assert.match(html, /alt=/);
  }
});
test('R7 reference shows financial totals and every payment attempt plus compensation', () => {
  const html = renderToStaticMarkup(React.createElement(Details, { order: { id: 7, status: 'Đã hủy', ticketTotal: 80000, productTotal: 20000, discountTotal: 10000, total: 90000,
    tickets: [{ id: 1, label: 'A1', price: 80000, status: 'Đã hủy' }], products: [],
    payments: [{ id: 1, status: 'Thất bại', amount: 90000 }, { id: 2, status: 'Thành công', amount: 90000 }], compensation: { points: 72 } } }));
  for (const label of ['Tiền vé', 'Tiền đồ ăn', 'Giảm giá', 'Tổng thanh toán', 'Thất bại', 'Thành công', '72 điểm']) assert.ok(html.includes(label));
});

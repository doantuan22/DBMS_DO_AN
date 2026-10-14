import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { passwordMessage } from '../src/features/customer/accountValidation.js';
let vite, Booking, Amounts, History, discovery;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: Booking } = await vite.ssrLoadModule('/src/features/customer/BookingExperience.jsx'));
  ({ OrderAmounts: Amounts, PaymentHistory: History } = await vite.ssrLoadModule(
    '/src/features/customer/OrderReceipt.jsx',
  ));
  discovery = await vite.ssrLoadModule('/src/features/customer/discoveryModel.js');
});
after(async () => {
  await vite?.close();
});
const render = (Page, props) =>
  renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Page, props)));
test('registration validates UTF-8 bytes rather than UTF-16 character length', () => {
  for (const value of ['12345678', 'á'.repeat(36), '😀'.repeat(18)])
    assert.equal(passwordMessage(value), '');
  for (const value of ['1234567', 'á'.repeat(37), '😀'.repeat(19)])
    assert.match(passwordMessage(value), /72 byte/);
});
test('order amounts retain authoritative total even when it differs from line sums; every attempt stays visible', () => {
  const html = render(Amounts, {
    order: { ticketTotal: 80000, productTotal: 20000, discountTotal: 0, total: 77777 },
  });
  assert.match(html, /77\.777/);
  assert.doesNotMatch(html, /100\.000/);
  const history = render(History, {
    payments: [
      {
        id: 91,
        method: 'MOMO',
        amount: 77777,
        status: 'Thất bại',
        createdAt: '2026-10-12T02:00:00Z',
        transactionCode: 'FAILED_REAL_REF',
      },
      {
        id: 92,
        method: 'VNPAY',
        amount: 77777,
        status: 'Thành công',
        createdAt: '2026-10-12T02:01:00Z',
        transactionCode: 'PAID_REAL_REF',
      },
    ],
  });
  assert.match(history, /FAILED_REAL_REF/);
  assert.match(history, /PAID_REAL_REF/);
  assert.match(history, /Thất bại/);
  assert.match(history, /Thành công/);
  assert.doesNotMatch(history, /Hủy đơn|Hoàn tiền|Xóa giao dịch/);
});
test('pending booking disables all seat, product and promotion controls while preserving selected seats', () => {
  const seat = {
    id: 11,
    label: 'A1',
    row: 'A',
    number: 1,
    type: 'Thường',
    status: 'Trống',
    price: 80000,
  };
  const html = render(Booking, {
    showtime: {
      id: 21,
      movieId: 1,
      movieTitle: 'Phim test',
      cinemaName: 'Rạp test',
      roomName: 'Phòng 1',
      format: '2D',
      startsAt: '2026-10-13T02:00:00Z',
    },
    user: { role: 'KHACH_HANG' },
    canBook: true,
    seats: [seat],
    seatsState: { status: 'success' },
    selectedSeatIds: [11],
    selectedSeats: [seat],
    products: [{ id: 31, name: 'Nước', price: 20000 }],
    productsState: { status: 'success' },
    quantities: { 31: 1 },
    selectedProducts: [{ productId: 31, quantity: 1 }],
    promotionCode: '',
    bookingState: { status: 'loading' },
  });
  assert.match(html, /aria-pressed="true" disabled/);
  assert.match(html, /aria-label="Số lượng Nước"[^>]*disabled/);
  assert.match(html, /Đang tạo đơn/);
  assert.doesNotMatch(html, /Mã suất chiếu|DB chốt|SQL Server/);
});
test('discovery groups only actual status and filters only the complete cinema collection supplied', () => {
  const groups = discovery.movieGroups([
    { title: 'A', status: 'Đang chiếu' },
    { title: 'B', status: 'Khác' },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[1][0], 'Khám phá thêm');
  const rows = [
    { name: 'Rạp Một', city: 'Hà Nội', address: 'Đường Một' },
    { name: 'Rạp Hai', city: 'Đà Nẵng', address: 'Đường Hai' },
  ];
  assert.equal(discovery.cinemaView(rows, { search: 'MỘT', city: 'Hà Nội' }).length, 1);
  assert.equal(discovery.cinemaView(rows, { search: 'MỘT', city: 'Đà Nẵng' }).length, 0);
});

test('points panel shows the balance and the SERVER preview; order receipt separates points from cash', () => {
  const seat = {
    id: 11,
    label: 'A1',
    row: 'A',
    number: 1,
    type: 'Thường',
    status: 'Trống',
    price: 100000,
  };
  const base = {
    showtime: {
      id: 21,
      movieId: 1,
      movieTitle: 'Phim',
      cinemaName: 'Rạp',
      roomName: 'P1',
      format: '2D',
      startsAt: '2026-10-13T02:00:00Z',
    },
    user: { role: 'KHACH_HANG', loyaltyPoints: 100 },
    canBook: true,
    seats: [seat],
    seatsState: { status: 'success' },
    selectedSeatIds: [11],
    selectedSeats: [seat],
    products: [],
    productsState: { status: 'success' },
    quantities: {},
    selectedProducts: [],
    promotionCode: '',
    bookingState: { status: 'idle' },
    pointsInput: '30',
    pricePreview: {
      status: 'success',
      data: {
        maxPoints: 100,
        pointsBalance: 100,
        pointsUsed: 30,
        pointsDiscount: 30000,
        discountTotal: 30000,
        total: 70000,
      },
    },
  };
  const html = render(Booking, base);
  assert.match(html, /Dùng điểm/);
  assert.match(html, /100 điểm/);
  assert.match(html, /Dùng 30 điểm: giảm/);
  assert.match(html, /70\.000/);
  assert.match(html, /1 điểm = 1\.000/);
  // a rejected points choice disables the booking buttons and shows the server's reason
  const rejected = render(Booking, {
    ...base,
    pricePreview: {
      status: 'error',
      error: {
        code: 'POINTS_INSUFFICIENT',
        message: 'Số điểm muốn dùng vượt quá số dư điểm hiện có.',
      },
    },
  });
  assert.match(rejected, /vượt quá số dư điểm/);
  const receipt = render(Amounts, {
    order: {
      ticketTotal: 100000,
      productTotal: 0,
      discountTotal: 30000,
      pointsUsed: 30,
      pointsDiscount: 30000,
      total: 70000,
    },
  });
  assert.match(receipt, /Tổng giảm giá/);
  assert.match(receipt, /Trong đó bằng điểm \(30 điểm\)/);
  assert.match(receipt, /70\.000/);
  assert.doesNotMatch(receipt, /hoàn tiền/i);
});

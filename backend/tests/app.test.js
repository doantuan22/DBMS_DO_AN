import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.js';

test('GET /api/health returns ok and unknown routes return JSON 404', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const ok = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { status: 'ok' });
    const missing = await fetch(`http://127.0.0.1:${port}/api/nope`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  } finally {
    server.close();
  }
});

test('auth routes reject missing credentials and role escalation before database access', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const missingToken = await fetch(`http://127.0.0.1:${port}/api/auth/me`);
    assert.equal(missingToken.status, 401);
    assert.equal((await missingToken.json()).error.code, 'UNAUTHENTICATED');

    const escalation = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ HoTen: 'Test', Email: 'test@example.com', MatKhau: 'password-123', role: 'ADMIN' }),
    });
    assert.equal(escalation.status, 400);
    assert.equal((await escalation.json()).error.code, 'ACCESS_FIELDS_NOT_ALLOWED');
  } finally {
    server.close();
  }
});

test('catalog read routes are public and reject invalid filters before a DB call', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const invalidId = await fetch(`http://127.0.0.1:${port}/api/movies/0`);
    assert.equal(invalidId.status, 400);
    assert.equal((await invalidId.json()).error.code, 'INVALID_REQUEST');

    const invalidFilter = await fetch(`http://127.0.0.1:${port}/api/movies?genreId=1&page=1`);
    assert.equal(invalidFilter.status, 400);
    assert.equal((await invalidFilter.json()).error.code, 'UNKNOWN_QUERY_PARAMETER');

    const invalidDate = await fetch(`http://127.0.0.1:${port}/api/movies/1/showtimes?date=2026-02-30`);
    assert.equal(invalidDate.status, 400);
    assert.equal((await invalidDate.json()).error.code, 'INVALID_REQUEST');
  } finally {
    server.close();
  }
});

test('booking requires a customer identity and seat routes validate the showtime ID', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const booking = await fetch(`http://127.0.0.1:${port}/api/bookings`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ showtimeId: 1, seatIds: [1] }),
    });
    assert.equal(booking.status, 401);
    assert.equal((await booking.json()).error.code, 'UNAUTHENTICATED');
    const seats = await fetch(`http://127.0.0.1:${port}/api/showtimes/0/seats`);
    assert.equal(seats.status, 400);
    assert.equal((await seats.json()).error.code, 'INVALID_REQUEST');
  } finally {
    server.close();
  }
});

test('order and payment routes require an authenticated customer before database access', async () => {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    const orders = await fetch(`http://127.0.0.1:${port}/api/orders`);
    assert.equal(orders.status, 401);
    assert.equal((await orders.json()).error.code, 'UNAUTHENTICATED');
    const invalid = await fetch(`http://127.0.0.1:${port}/api/orders/0`);
    assert.equal(invalid.status, 401);
  } finally { server.close(); }
});

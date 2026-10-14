import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import * as admin from '../src/controllers/adminController.js';
import adminRouter from '../src/routes/adminRoutes.js';
import { adminService } from '../src/services/adminService.js';
import { supportService } from '../src/services/supportService.js';

// Every Admin endpoint that inserts a new row must answer 201 Created (F-05).
// Body fields satisfy the real validators in adminValidator.js; the service is stubbed so the
// test needs no database and proves the HTTP status contract of the real controllers.
const CREATE_ENDPOINTS = [
  {
    handler: 'createUser',
    method: 'createUser',
    key: 'user',
    body: { name: 'N', email: 'n@example.invalid', password: 'StrongPass1!', roleId: 2 },
  },
  {
    handler: 'createAssignment',
    method: 'createAssignment',
    key: 'assignment',
    body: { userId: 2, cinemaId: 1, startsOn: '2026-10-14' },
  },
  {
    handler: 'createCinema',
    method: 'createCinema',
    key: 'cinema',
    body: { name: 'C', address: 'A', city: 'HN' },
  },
  {
    handler: 'createCinemaImage',
    method: 'createCinemaImage',
    key: 'image',
    body: { url: 'https://example.invalid/a.jpg', displayOrder: 0 },
    params: { cinemaId: '1' },
  },
  {
    handler: 'createRoom',
    method: 'createRoom',
    key: 'room',
    body: { cinemaId: 1, name: 'R', type: '2D' },
  },
  {
    handler: 'createSeat',
    method: 'createSeat',
    key: 'seat',
    body: { roomId: 1, row: 'A', number: 1, type: 'Thường' },
  },
  {
    handler: 'createPricing',
    method: 'createPricing',
    key: 'pricing',
    body: {
      cinemaId: 1,
      seatType: 'Tất cả',
      dayType: 'Tất cả',
      format: 'Tất cả',
      startsOn: '2026-10-14',
      surcharge: 0,
    },
  },
  {
    handler: 'createShowtime',
    method: 'createShowtime',
    key: 'showtime',
    body: {
      movieId: 1,
      roomId: 1,
      startsAt: '2026-10-20T10:00:00Z',
      endsAt: '2026-10-20T12:00:00Z',
      format: '2D',
      basePrice: 90000,
    },
  },
  { handler: 'createGenre', method: 'createGenre', key: 'genre', body: { name: 'G' } },
  { handler: 'createActor', method: 'createActor', key: 'actor', body: { name: 'A' } },
  {
    handler: 'createMovie',
    method: 'createMovie',
    key: 'movie',
    body: { title: 'M', durationMinutes: 100, releaseDate: '2026-10-14', genreIds: [1] },
  },
  {
    handler: 'createProduct',
    method: 'createProduct',
    key: 'product',
    body: { name: 'P', type: 'Combo', price: 1000 },
  },
  {
    handler: 'createPromotion',
    method: 'createPromotion',
    key: 'promotion',
    body: {
      code: 'X',
      discountType: 'Phần trăm',
      discountValue: 10,
      startsAt: '2026-10-14T00:00:00Z',
      endsAt: '2026-10-30T00:00:00Z',
      quantity: 5,
    },
  },
];

async function withServer(configure, run) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { userId: 1 };
    next();
  });
  configure(app);
  app.use((error, _req, res, _next) => res.status(error.status ?? 500).json({ code: error.code }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('admin create handlers return 201 Created with the created resource', async () => {
  const original = {};
  for (const { method } of CREATE_ENDPOINTS) original[method] = adminService[method];
  try {
    await withServer(
      (app) => {
        for (const { handler, method, key, params } of CREATE_ENDPOINTS) {
          adminService[method] = async () => ({ id: 77, key });
          app.post(`/${handler}${params ? '/:cinemaId' : ''}`, admin[handler]);
        }
      },
      async (base) => {
        for (const { handler, key, body, params } of CREATE_ENDPOINTS) {
          const response = await fetch(`${base}/${handler}${params ? `/${params.cinemaId}` : ''}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          });
          assert.equal(response.status, 201, `${handler} must answer 201`);
          assert.deepEqual(await response.json(), { [key]: { id: 77, key } }, handler);
        }
      },
    );
  } finally {
    Object.assign(adminService, original);
  }
});

test('invalid admin create bodies still fail with 400, never 201', async () => {
  await withServer(
    (app) => app.post('/genres', admin.createGenre),
    async (base) => {
      const response = await fetch(`${base}/genres`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'G', unexpected: true }),
      });
      assert.equal(response.status, 400);
    },
  );
});

test('update and delete handlers keep 200 OK', async () => {
  const original = adminService.updateGenre;
  adminService.updateGenre = async () => ({ id: 1 });
  try {
    await withServer(
      (app) => app.put('/genres/:genreId', admin.updateGenre),
      async (base) => {
        const response = await fetch(`${base}/genres/1`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'G2' }),
        });
        assert.equal(response.status, 200);
      },
    );
  } finally {
    adminService.updateGenre = original;
  }
});

// Guard: a new Admin POST route that creates a row must be added to CREATE_ENDPOINTS above.
const ACTION_POSTS = new Set(['/showtimes/:showtimeId/cancel']);
const PROCESSING_PATH = '/complaints/:complaintId/processings';
test('every admin collection POST route is covered by the 201 contract', () => {
  const covered = new Set(CREATE_ENDPOINTS.map((entry) => admin[entry.handler]));
  const postRoutes = adminRouter.stack
    .filter((layer) => layer.route?.methods.post)
    .map((layer) => ({ path: layer.route.path, handlers: layer.route.stack.map((s) => s.handle) }));
  assert.ok(postRoutes.length >= 14);
  for (const { path, handlers } of postRoutes) {
    if (ACTION_POSTS.has(path)) continue;
    const isCovered = handlers.some((handle) => covered.has(handle));
    assert.ok(isCovered || path === PROCESSING_PATH, `${path} not covered`);
  }
});

test('admin complaint processing log entry (append-only create) returns 201', async () => {
  const layer = adminRouter.stack.find(
    (entry) => entry.route?.path === PROCESSING_PATH && entry.route.methods.post,
  );
  assert.ok(layer, 'processing route must exist');
  const handle = layer.route.stack.at(-1).handle;
  const original = supportService.addProcessing;
  supportService.addProcessing = async () => ({ id: 5 });
  try {
    await withServer(
      (app) => app.post('/complaints/:complaintId/processings', handle),
      async (base) => {
        const response = await fetch(`${base}/complaints/3/processings`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: 'Đã liên hệ khách', nextStatus: 'Đang xử lý' }),
        });
        assert.equal(response.status, 201);
        assert.deepEqual(await response.json(), { processing: { id: 5 } });
      },
    );
  } finally {
    supportService.addProcessing = original;
  }
});

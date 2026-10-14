import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import express from '../../backend/node_modules/express/index.js';
import { createServer } from 'vite';
import * as admin from '../../backend/src/controllers/adminController.js';
import { adminService } from '../../backend/src/services/adminService.js';

// F-05: Admin create endpoints answer 201 Created. The shared HTTP client must treat it as success
// and hand the unchanged JSON body to callers (it only rejects when response.ok is false).
let vite, adminApi, authTokenStorage;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ adminApi } = await vite.ssrLoadModule('/src/api/adminApi.js'));
  ({ authTokenStorage } = await vite.ssrLoadModule('/src/api/authToken.js'));
});
after(async () => {
  await vite?.close();
});

test('admin create calls resolve with the created resource on HTTP 201', async (t) => {
  const stubbed = ['createGenre', 'createProduct', 'createCinemaImage'];
  const original = Object.fromEntries(stubbed.map((name) => [name, adminService[name]]));
  for (const name of stubbed) adminService[name] = async () => ({ id: 41, name });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { userId: 1 };
    next();
  });
  app.post('/api/admin/genres', admin.createGenre);
  app.post('/api/admin/products', admin.createProduct);
  app.post('/api/admin/cinemas/:cinemaId/images', admin.createCinemaImage);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const originalFetch = globalThis.fetch;
  const statuses = [];
  globalThis.fetch = async (url, options) => {
    const response = await originalFetch(base + url, options);
    statuses.push(response.status);
    return response;
  };
  t.after(async () => {
    globalThis.fetch = originalFetch;
    Object.assign(adminService, original);
    authTokenStorage.clear?.();
    await new Promise((resolve) => server.close(resolve));
  });

  assert.deepEqual(await adminApi.create('genres', { name: 'Hài' }), {
    genre: { id: 41, name: 'createGenre' },
  });
  assert.equal(
    (await adminApi.create('products', { name: 'P', type: 'Combo', price: 1 })).product.id,
    41,
  );
  assert.equal(
    (await adminApi.createCinemaImage(3, { url: 'https://example.invalid/a.jpg', displayOrder: 0 }))
      .image.id,
    41,
  );
  assert.deepEqual(statuses, [201, 201, 201]);
});

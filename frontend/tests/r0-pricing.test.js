import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DAY_TYPES } from '../../shared/resourceContract.mjs';
let vite, manager, admin, Form, AdminPortal, AuthContext;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  manager = await vite.ssrLoadModule('/src/utils/managerForms.js');
  admin = await vite.ssrLoadModule('/src/utils/adminForms.js');
  ({ default: Form } = await vite.ssrLoadModule('/src/components/ManagerResourceForm.jsx'));
  ({ default: AdminPortal } = await vite.ssrLoadModule('/src/pages/AdminPortal.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
});
after(async () => {
  await vite?.close();
});
test('R0 rendered Admin pricing uses a required dropdown with exactly three supported choices', () => {
  const user = { role: 'ADMIN', permissions: [{ code: 'QL_BANG_GIA' }] };
  const html = renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { user } },
      React.createElement(AdminPortal),
    ),
  );
  const select = /<select aria-label="Loại ngày"[^>]*required[^>]*>(.*?)<\/select>/.exec(html)?.[1];
  assert.ok(select, 'Admin pricing must render the real day type dropdown');
  assert.equal(
    (select.match(/<option/g) ?? []).length,
    4,
    'three supported choices plus an empty required placeholder',
  );
  for (const day of DAY_TYPES) assert.ok(select.includes(day));
  assert.ok(!/Ngày lễ|holiday/i.test(html));
  assert.ok(!/<input aria-label="Loại ngày"/.test(html));
});
test('R0 rendered manager pricing forms expose only the three day choices', () => {
  assert.deepEqual(DAY_TYPES, ['Ngày thường', 'Cuối tuần', 'Tất cả']);
  for (const row of [
    undefined,
    { id: 1, ...manager.initialManagerValues('pricing'), status: 'Áp dụng' },
  ]) {
    const html = renderToStaticMarkup(React.createElement(Form, { kind: 'pricing', row }));
    const select = /<select aria-label="Loại ngày"[^>]*>(.*?)<\/select>/.exec(html)?.[1];
    assert.ok(select);
    assert.equal((select.match(/<option/g) ?? []).length, 3);
    for (const day of DAY_TYPES) assert.ok(select.includes(day));
    assert.ok(!/Ngày lễ|holiday/i.test(html));
  }
});
test('R0 admin and manager payload builders accept all three official day types', () => {
  const fields = admin.formFields(admin.adminForms.pricing, false);
  for (const dayType of DAY_TYPES) {
    const values = { ...manager.initialManagerValues('pricing'), dayType, cinemaId: '1' };
    for (const editing of [false, true])
      assert.equal(manager.managerBody('pricing', values, editing).dayType, dayType);
    assert.equal(admin.toBody(values, fields).dayType, dayType);
  }
});
test('R0 admin and manager payload builders reject obsolete or unknown day types', () => {
  for (const dayType of ['Ngày lễ', 'holiday', 'Holiday', 'HOLIDAY', '', 'Không hợp lệ']) {
    const values = { ...manager.initialManagerValues('pricing'), dayType };
    for (const editing of [false, true])
      assert.throws(
        () => manager.managerBody('pricing', values, editing),
        /Loại ngày không hợp lệ/,
      );
    assert.throws(
      () => admin.toBody(values, admin.formFields(admin.adminForms.pricing, false)),
      /Loại ngày không hợp lệ/,
    );
  }
});

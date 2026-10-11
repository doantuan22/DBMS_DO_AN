import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

let vite, StaffBookings, StaffShell, AuthContext, createStaffBookingApi;
before(async () => {
  vite = await createServer({ configFile: 'vite.config.js', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: StaffBookings } = await vite.ssrLoadModule('/src/features/staff-bookings/StaffBookings.jsx'));
  ({ default: StaffShell } = await vite.ssrLoadModule('/src/layouts/StaffShell.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ createStaffBookingApi } = await vite.ssrLoadModule('/src/api/staffBookingApi.js'));
});
after(async () => { await vite?.close(); });
function render(portal, user, shell = false) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [`/${portal}/bookings`] },
    React.createElement(AuthContext.Provider, { value: { user } }, shell
      ? React.createElement(StaffShell, { portal }, React.createElement(StaffBookings, { portal }))
      : React.createElement(StaffBookings, { portal }))));
}
test('staff booking requires exact portal role and DAT_VE', () => {
  for (const [portal, role] of [['admin', 'ADMIN'], ['manager', 'QUAN_LY_RAP']]) {
    assert.match(render(portal, { userId: 1, role, permissions: [] }), /không đủ quyền/);
    assert.match(render(portal, { userId: 1, role: 'KHACH_HANG', permissions: [{ code: 'DAT_VE' }] }), /không đủ quyền/);
  }
});
test('booking workspace uses named filters/shared table and route-specific active menu', () => {
  for (const [portal, role] of [['admin', 'ADMIN'], ['manager', 'QUAN_LY_RAP']]) {
    const html = render(portal, { userId: 1, role, permissions: [{ code: 'DAT_VE' }] }, true);
    assert.match(html, /Quản lý đặt vé/);
    assert.match(html, /Bộ lọc đơn đặt vé/);
    assert.match(html, /Đang tải dữ liệu/);
    assert.match(html, /aria-live="polite"/);
    assert.ok(html.includes(`href="/${portal}/bookings"`));
    assert.match(html, /aria-current="page"/);
    assert.doesNotMatch(html, />Vai trò<|>Quyền<|Gán quyền/);
  }
});
test('staff booking client refuses unsupported portals', () => {
  for (const portal of ['customer', 'support', '../admin', undefined]) assert.throws(() => createStaffBookingApi(portal));
});

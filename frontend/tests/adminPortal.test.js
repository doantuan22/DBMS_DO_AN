import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let AdminPortal;
let AuthContext;

before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: AdminPortal } = await vite.ssrLoadModule('/src/pages/AdminPortal.jsx'));
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
});

after(async () => {
  await vite?.close();
});

test('Admin portal exposes the ADM resource work areas, including global cinema resources', async () => {
  const { ADMIN_SECTION_PERMISSIONS } = await vite.ssrLoadModule('/src/utils/authorization.js');
  const user = {
    role: 'ADMIN',
    permissions: Object.values(ADMIN_SECTION_PERMISSIONS).map((code) => ({ code })),
  };
  const html = renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { user } },
      React.createElement(AdminPortal),
    ),
  );
  for (const label of [
    'Tài khoản',
    'Phân công',
    'Rạp',
    'Ảnh rạp',
    'Phòng',
    'Ghế',
    'Phim',
    'Sản phẩm',
    'Khuyến mãi',
    'Bảng giá',
    'Suất chiếu',
    'Khiếu nại',
    'Doanh thu',
  ]) {
    assert.ok(html.includes(label), `missing Admin area: ${label}`);
  }
  assert.doesNotMatch(html, />Vai trò<|>Quyền<|Gán quyền|Lưu quyền vai trò/);
  assert.match(html, /aria-label="Cổng quản trị hệ thống"/);
});

test('cinema image status is chosen from the whitelist, not typed freely', async () => {
  const { CINEMA_IMAGE_STATUSES } = await vite.ssrLoadModule(
    '/src/constants/cinemaImageStatuses.js',
  );
  assert.deepEqual(CINEMA_IMAGE_STATUSES, ['Hoạt động', 'Tạm ẩn']);
  const { default: Editor } = await vite.ssrLoadModule('/src/features/facilities/FacilityEditor.jsx');
  const html = renderToStaticMarkup(React.createElement(Editor, {
    kind: 'images', editor: { row: null, values: { url: '', description: '', displayOrder: 0, cover: false, status: 'Hoạt động' }, errors: {} },
    contextLabel: 'Rạp A', controller: { closeEditor() {}, changeField() {}, save() {} },
  }));
  const statusSelect = html.match(/<select\b[^>]*>[\s\S]*?<\/select>/)?.[0];
  assert.ok(statusSelect);
  for (const status of CINEMA_IMAGE_STATUSES) assert.ok(statusSelect.includes(`>${status}</option>`));
  assert.equal((statusSelect.match(/<option/g) ?? []).length, CINEMA_IMAGE_STATUSES.length);
});

test('fixed roles remain creation-only and Manager references use named selectors', async () => {
  const { adminForms, formFields } = await vite.ssrLoadModule('/src/utils/adminForms.js');
  assert.equal(adminForms.roles, undefined);
  assert.equal(adminForms.permissions, undefined);
  assert.ok(formFields(adminForms.users, false).some(([name]) => name === 'roleId'));
  assert.ok(formFields(adminForms.users, true).every(([name]) => name !== 'roleId'));
  const { ManagerAssignmentSelect, ManagerAssignmentsContext } = await vite.ssrLoadModule('/src/components/ManagerAssignmentFields.jsx');
  const managers = [{ NguoiDungID: 2, HoTen: 'Quản lý Q1', Email: 'manager@example.test' }];
  const cinemas = [{ RapID: 1, TenRap: 'Rạp Quận 1' }];
  const html = renderToStaticMarkup(React.createElement(ManagerAssignmentSelect, { field: 'userId', label: 'Quản lý', value: 2, managers, cinemas, editing: true, onChange() {} }));
  assert.match(html, /<select[^>]*aria-label="Quản lý"[^>]*disabled/);
  assert.match(html, /Quản lý Q1 · manager@example.test/);
  assert.doesNotMatch(html, /<input/);
  const context = renderToStaticMarkup(React.createElement(ManagerAssignmentsContext, { managerId: 2, assignments: [
    { PhanCongID: 1, NguoiDungID: 2, TenRap: 'Rạp Quận 1', NgayBatDau: '2026-01-01', NgayKetThuc: null, TrangThai: 'Hiệu lực' },
    { PhanCongID: 2, NguoiDungID: 3, TenRap: 'Rạp của Manager khác' },
  ] }));
  assert.match(context, /Rạp Quận 1/);
  assert.doesNotMatch(context, /Rạp của Manager khác/);
});

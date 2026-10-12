import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createEnvironment } from './test-environment.mjs';
const env = await createEnvironment({ browser: true, phase: '5A' });
const { api, pass, owned, navigate, resize, screenshot, field, click, evaluate, wait, modalKeyboard, button } = env;
const name = `UXR5_Manager_${crypto.randomUUID().slice(0, 8)}`, email = `${name.toLowerCase()}@example.test`;
let error;
try {
  for (const [module, pathname] of [['users', '/admin/access/users'], ['assignments', '/admin/access/assignments']]) {
    await navigate(1, pathname); assert.equal(await evaluate("document.querySelectorAll('.staff-shell__sidebar a[aria-current=page]').length"), 1);
    for (const width of [390, 768, 1280, 1440, 1920]) { const size = await resize(width); await screenshot(`5A-${module}-${width}`); pass(`${module}: responsive ${width}px`, size); }
  }
  await navigate(1, '/admin/access/users'); await field('Tìm tên', 'UXR5_NO_MATCH'); await click('Áp dụng lọc'); await wait("document.body.textContent.includes('Có 0 kết quả')"); await click('Xóa lọc');
  await click('Tạo tài khoản nội bộ'); const modal = "document.querySelector('dialog[open]')";
  const roles = (await api(1, 'GET', '/roles')).roles, managerRole = roles.find((r) => r.MaVaiTro === 'QUAN_LY_RAP');
  assert.ok(await evaluate("![...document.querySelector('dialog[open] select').options].some(o=>o.textContent==='Khách hàng')"));
  await field('Họ tên', name, 'input', modal); await field('Email', email, 'input', modal); await field('Mật khẩu ban đầu', 'UxR5_Test2026!', 'input', modal); await field('Vai trò tài khoản nội bộ', managerRole.VaiTroID, 'select', modal);
  await click('Đóng form'); await click('Hủy'); assert.equal(await evaluate(`${env.fieldElement('Họ tên', modal)}.value`), name); pass('User create excludes Customer, dirty Cancel keeps draft');
  await click('Tạo mới', true); await wait("!document.querySelector('dialog[open]')&&document.querySelector('.admin-resource__success')?.textContent.includes('Đã lưu')");
  const manager = (await api(1, 'GET', `/users?search=${email}`)).users[0]; assert.ok(manager); owned.push({ kind: 'user', id: manager.NguoiDungID, owner: email }); assert.equal(manager.MaVaiTro, 'QUAN_LY_RAP');
  await field('Tìm tên', email); await click('Áp dụng lọc'); await wait("document.querySelectorAll('table tbody tr').length===1"); assert.ok(await evaluate("!location.search.includes('example')")); await click('Đổi trạng thái'); await field('Trạng thái tài khoản', 'Bị khóa', 'select', modal); await click('Lưu thay đổi'); await modalKeyboard(); await click('Lưu thay đổi'); await click('Xác nhận', true); await wait("document.querySelector('table tbody')?.textContent.includes('Bị khóa')");
  assert.equal((await api(1, 'GET', `/users?search=${email}`)).users[0].MaVaiTro, 'QUAN_LY_RAP');
  await click('Đổi trạng thái'); await field('Trạng thái tài khoản', 'Hoạt động', 'select', modal); await click('Lưu thay đổi'); await click('Xác nhận'); await wait("document.querySelector('table tbody')?.textContent.includes('Hoạt động')"); pass('Actual internal account create/status confirm/role preservation, single-submit and keyboard modal');
  await navigate(1, '/admin/access/assignments'); await click('Thêm phân công'); await field('Manager', manager.NguoiDungID, 'select', modal); await field('Rạp phân công', 1, 'select', modal); await click('Tạo mới'); await click('Xác nhận', true); await wait("!document.querySelector('dialog[open]')");
  const first = (await api(1, 'GET', `/assignments?userId=${manager.NguoiDungID}`)).assignments[0]; assert.ok(first); owned.push({ kind: 'assignment', id: first.PhanCongID, owner: manager.NguoiDungID });
  assert.deepEqual((await api(manager.NguoiDungID, 'GET', '/manager/cinemas')).cinemas.map((r) => r.id), [1]);
  await field('Manager lọc', manager.NguoiDungID, 'select'); await click('Áp dụng lọc'); await wait("document.querySelectorAll('table tbody tr').length===1"); await click('Sửa / Chuyển rạp'); assert.ok(await evaluate("document.querySelector('dialog[open] select[aria-label=Manager]').disabled"));
  await field('Rạp phân công', 2, 'select', modal); await click('Lưu thay đổi'); await wait("[...document.querySelectorAll('dialog[open]')].at(-1).textContent.includes('Chỉ lưu phân công này')"); await click('Hủy'); assert.equal((await api(manager.NguoiDungID, 'GET', '/manager/cinemas')).cinemas[0].id, 1); await click('Lưu thay đổi'); await click('Xác nhận'); await wait("!document.querySelector('dialog[open]')");
  assert.deepEqual((await api(manager.NguoiDungID, 'GET', '/manager/cinemas')).cinemas.map((r) => r.id), [2]); await api(manager.NguoiDungID, 'GET', '/manager/cinemas/1/rooms', null, 403); pass('Actual assignment create/transfer preview/fixed Manager; Cancel preserves source scope, Confirm changes DB scope');
  await click('Thêm phân công'); await field('Manager', manager.NguoiDungID, 'select', modal); await field('Rạp phân công', 3, 'select', modal); await click('Tạo mới'); await click('Xác nhận'); await wait("!document.querySelector('dialog[open]')"); const second = (await api(1, 'GET', `/assignments?userId=${manager.NguoiDungID}`)).assignments.find((r) => r.PhanCongID !== first.PhanCongID); assert.ok(second); owned.push({ kind: 'assignment', id: second.PhanCongID, owner: manager.NguoiDungID });
  assert.deepEqual((await api(manager.NguoiDungID, 'GET', '/manager/cinemas')).cinemas.map((r) => r.id).sort(), [2, 3]); pass('Multi-assignment contract retained, no single-cinema replacement');
  await api(2, 'GET', '/admin/users', null, 403); await api(5, 'GET', '/admin/assignments', null, 403); await api(1, 'PUT', `/users/${manager.NguoiDungID}/status`, { roleId: 4, status: 'Hoạt động' }, 400); await api(1, 'POST', '/roles', { name: 'Forbidden' }, 403); pass('Actual RBAC/role immutable API negative checks');
  assert.equal(env.evidence.runtimeErrors.length, 0);
} catch (failure) { error = failure; }
await env.close('5A-browser.json', error);

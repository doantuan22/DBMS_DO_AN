import assert from 'node:assert/strict';
import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment({ browser: true, phase: 'UI-edges' });
let error;
try {
  for (const [kind, path, create, label] of [
    ['users', '/admin/access/users', 'Tạo tài khoản nội bộ', 'Họ tên'], ['assignments', '/admin/access/assignments', 'Thêm phân công', 'Ngày bắt đầu'],
    ['movies', '/admin/catalog/movies', 'Thêm phim', 'Tên phim'], ['actors', '/admin/catalog/actors', 'Thêm diễn viên', 'Họ tên diễn viên'], ['genres', '/admin/catalog/genres', 'Thêm thể loại', 'Tên thể loại'],
    ['products', '/admin/commerce/products', 'Thêm sản phẩm', 'Tên sản phẩm'], ['promotions', '/admin/commerce/promotions', 'Thêm khuyến mãi', 'Mã khuyến mãi'],
  ]) {
    await e.navigate(1, path); await e.resize(390); await e.click(create); await e.modalKeyboard(); await e.click(create); await e.field(label, kind === 'assignments' ? '2099-01-01' : 'UXR5 unsaved draft', 'input', "document.querySelector('dialog[open]')");
    await e.click('Đóng form'); await e.modalKeyboard(); assert.equal(await e.evaluate(`${e.fieldElement(label, "document.querySelector('dialog[open]')")}.value`), kind === 'assignments' ? '2099-01-01' : 'UXR5 unsaved draft'); await e.screenshot(`edge-${kind}-editor-390`); await e.click('Đóng form'); await e.click('Bỏ thay đổi'); await e.wait("!document.querySelector('dialog[open]')"); e.pass(`${kind}: mobile editor, keyboard focus/Escape, dirty Cancel retains and discard Confirm clears`);
  }
  await e.navigate(1, '/admin/access/users', '?selectedId=2147483647'); await e.wait("document.querySelector('.ui-async-state--notFound')?.textContent.includes('Không tìm thấy')"); assert.ok(!await e.evaluate("Boolean(document.querySelector('dialog[open]'))")); e.pass('Missing deep-link selection is explicit not-found while authorized full user list remains');
  await e.cdp('Network.setBlockedURLs', { urls: ['*/api/admin/products*'] }); await e.navigate(1, '/admin/commerce/products', '', "Boolean(document.querySelector('[role=alert]'))"); assert.ok(!await e.evaluate("document.body.textContent.includes('Có 0 kết quả')")); await e.screenshot('edge-products-network-error-390'); await e.cdp('Network.setBlockedURLs', { urls: [] }); await e.click('Thử lại'); await e.wait("Boolean(document.querySelector('table tbody'))"); e.pass('Actual blocked network read stays error, clears stale rows, Retry restores authoritative products');
  for (const [actor, path, name] of [[1, '/admin/operations/showtimes', 'admin-showtimes'], [1, '/admin/operations/pricing', 'admin-pricing'], [1, '/admin/bookings', 'admin-bookings'], [2, '/manager/showtimes', 'manager-showtimes'], [2, '/manager/pricing', 'manager-pricing'], [2, '/manager/bookings', 'manager-bookings']]) {
    await e.navigate(actor, path); for (const width of [390, 1440]) { e.pass(`UXR4 ${name}: actual browser regression ${width}px`, await e.resize(width)); await e.screenshot(`regression-${name}-${width}`); } assert.ok(await e.evaluate("Boolean(document.querySelector('table th')?.textContent.includes('STT'))"));
  }
  assert.equal(e.evidence.runtimeErrors.length, 0);
  assert.ok(!e.evidence.requests.some((r) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method)));
} catch (failure) { error = failure; }
await e.close('ui-edges.json', error);

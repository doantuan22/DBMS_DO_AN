import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment({ phase: '5C-edges' }), { api, owned, pass } = e;
const suffix = crypto.randomUUID().slice(0, 8), name = `UXR5_Snapshot_${suffix}`, code = `UXR5QUOTA_${suffix}`;
let error, orderId;
try {
  // Recover only the single uniquely named fixture from the failed status-expectation preflight.
  const previous = (await api(1, 'GET', '/products')).products.filter((p) => p.TenSanPham.startsWith('UXR5_Snapshot_'));
  assert.ok(previous.length <= 1); for (const p of previous) { owned.push({ kind: 'product', id: p.SanPhamID, owner: p.TenSanPham }); }
  const madeProduct = (await api(1, 'POST', '/products', { name, type: 'Snack', price: 12345.67 }, 201)).product;
  assert.ok(madeProduct.SanPhamID); owned.push({ kind: 'product', id: madeProduct.SanPhamID, owner: name });
  const body = { code, discountType: 'PERCENT', discountValue: 10, minimumOrder: 0, maximumDiscount: 10000, startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', quantity: 2 };
  const madePromo = (await api(1, 'POST', '/promotions', body, 201)).promotion;
  assert.ok(madePromo.KhuyenMaiID); owned.push({ kind: 'promotion', id: madePromo.KhuyenMaiID, owner: code });
  const show = (await api(1, 'GET', '/bookings/options')).showtimes[0], seat = (await api(5, 'GET', `/showtimes/${show.SuatChieuID}/seats`)).seats.find((s) => s.status === 'Trống'); assert.ok(seat);
  const booking = (await api(5, 'POST', '/bookings', { showtimeId: show.SuatChieuID, seatIds: [seat.id], products: [{ productId: madeProduct.SanPhamID, quantity: 1 }], promotionCode: code }, 201)).booking;
  orderId = booking.id; assert.ok(orderId); owned.push({ kind: 'order', id: orderId, owner: 5 }); assert.ok(booking.discountTotal > 0);
  const promo = () => api(1, 'GET', '/promotions').then((r) => r.promotions.find((p) => p.KhuyenMaiID === madePromo.KhuyenMaiID));
  assert.equal((await promo()).SoLuongDaDung, 1); pass('Actual Customer booking consumes exactly one DB-owned promotion quota');
  const snapshot = async () => crypto.createHash('sha256').update(JSON.stringify((await e.pool.request().input('Id', e.sql.Int, orderId).query('SELECT DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai FROM dbo.DONDATVE WHERE DonDatVeID=@Id; SELECT SanPhamID,SoLuong,DonGia FROM dbo.CHITIETDOAN WHERE DonDatVeID=@Id; SELECT VeID,GiaVe,TrangThai FROM dbo.CHITIETVE WHERE DonDatVeID=@Id ORDER BY VeID;')).recordsets)).digest('hex');
  const before = await snapshot(); await api(1, 'PUT', `/products/${madeProduct.SanPhamID}`, { name, type: 'Snack', price: 23456.78, status: 'Đang bán' }); const { code: _code, ...update } = body; await api(1, 'PUT', `/promotions/${madePromo.KhuyenMaiID}`, { ...update, discountValue: 20, quantity: 3, status: 'Hoạt động' });
  assert.equal(await snapshot(), before); const saved = await promo(); assert.equal(saved.MaCode, code); assert.equal(saved.SoLuongDaDung, 1); assert.equal(saved.SoLuong, 3); assert.equal(saved.GiaTriGiam, 20); e.evidence.historySnapshot = { before, after: await snapshot() }; pass('Product price and consumed promotion metadata edits preserve ticket/food/discount snapshots, code and used quota');
  await api(1, 'DELETE', `/products/${madeProduct.SanPhamID}`, null, 409); await api(1, 'DELETE', `/promotions/${madePromo.KhuyenMaiID}`, null, 409); assert.equal(await snapshot(), before); pass('In-use product and promotion deletion return 409 without deleting transactional history');
  await api(1, 'PUT', `/promotions/${madePromo.KhuyenMaiID}`, { ...update, discountValue: 100, quantity: 3, status: 'Hoạt động' }, 400); assert.equal((await promo()).GiaTriGiam, 20); pass('Rejected percent 100 leaves consumed promotion unchanged');
  await api(1, 'POST', `/bookings/${orderId}/cancel`, {}); assert.equal((await promo()).SoLuongDaDung, 0); orderId = null; pass('Existing cancellation endpoint releases exactly the test booking quota');
} catch (failure) { error = failure; }
finally { if (orderId) { try { await api(1, 'POST', `/bookings/${orderId}/cancel`, {}); } catch (failure) { error ??= failure; } } }
await e.close('commerce-edges.json', error);

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createOrderService, orderService } from '../src/services/orderService.js';
import { DbTypes } from '../src/db/procedureClient.js';
import { getOrder } from '../src/controllers/orderController.js';
import { startExpirePendingOrdersJob } from '../src/jobs/expirePendingOrders.js';
const rows = (status = 'Hết hạn') => ({
  recordsets: [
    [
      {
        DonDatVeID: 19,
        NguoiDungID: 7,
        TrangThaiDon: status,
        HanGiuCho: '2000-01-01T00:00:00Z',
        TongTienVe: 160000,
        TongTienDoAn: 10000,
        TienGiamGia: 1000,
        TongTienThanhToan: 169000,
      },
    ],
    [{ VeID: 1, GiaVe: 80000, TrangThaiVe: 'Đã đặt' }],
    [{ ChiTietDoAnID: 2, DonGia: 10000, SoLuong: 1, ThanhTien: 10000 }],
    [{ ThanhToanID: 3, SoTien: 169000, TrangThai: 'Đang xử lý' }],
  ],
});
test('detail binds two exact typed authenticated inputs and makes one read call for each GET', async () => {
  const calls = [],
    service = createOrderService({
      execute: async (...args) => {
        calls.push(args);
        return rows();
      },
    });
  for (let n = 0; n < 3; n++) await service.getOrderDetail(7, 19);
  assert.equal(calls.length, 3);
  for (const [key, inputs] of calls) {
    assert.equal(key, 'ORDER_GET_DETAIL_BY_CUSTOMER');
    assert.deepEqual(inputs, {
      NguoiDungID: { type: DbTypes.Int, value: 7 },
      DonDatVeID: { type: DbTypes.Int, value: 19 },
    });
  }
});
test('existing four sets and status projection map without JavaScript expiry or persisted mutation', async () => {
  for (const status of [
    'Chờ thanh toán',
    'Hết hạn',
    'Đã thanh toán',
    'Đã hủy',
    'Hoàn thành',
    'Hoàn tiền',
  ]) {
    const result = rows(status),
      old = structuredClone(result),
      service = createOrderService({ execute: async () => result }),
      order = await service.getOrderDetail(7, 19);
    assert.equal(order.status, status);
    assert.equal(order.total, 169000);
    assert.equal(order.tickets[0].status, 'Đã đặt');
    assert.equal(order.products[0].unitPrice, 10000);
    assert.equal(order.payments[0].amount, 169000);
    assert.deepEqual(result, old);
    assert.equal('effectiveStatus' in order, false);
  }
});
test('SQL missing/ownership error stays indistinguishable safe404', async () => {
  const service = createOrderService({
    execute: async () => {
      throw Object.assign(new Error('private SQL'), { number: 50033 });
    },
  });
  await assert.rejects(service.getOrderDetail(7, 19), { status: 404, code: 'ORDER_NOT_FOUND' });
});
test('detail controller uses authenticated owner despite client query/body identity; invalid ids call no SP', async () => {
  const original = orderService.getOrderDetail,
    calls = [];
  orderService.getOrderDetail = async (...args) => {
    calls.push(args);
    return { id: 19 };
  };
  try {
    let body, error;
    const res = {
        json: (b) => {
          body = b;
        },
      },
      next = (e) => {
        error = e;
      };
    await getOrder(
      {
        user: { userId: 7 },
        params: { orderId: '19' },
        query: { userId: 99, role: 'ADMIN' },
        body: { userId: 99 },
      },
      res,
      next,
    );
    assert.equal(error, undefined);
    assert.deepEqual(calls, [[7, 19]]);
    assert.deepEqual(body, { order: { id: 19 } });
    for (const id of ['0', '-1', 'abc', '2147483648']) {
      await getOrder({ user: { userId: 7 }, params: { orderId: id } }, res, next);
      assert.equal(error.status, 400);
      assert.equal(error.code, 'INVALID_REQUEST');
    }
    assert.equal(calls.length, 1);
  } finally {
    orderService.getOrderDetail = original;
  }
});
test('versioned SQL Detail call graph contains only read routines and preserves live time projection', () => {
  const db = path.resolve('..', 'database'),
    manifest = JSON.parse(fs.readFileSync(path.join(db, 'baseline-manifest.json'), 'utf8')),
    visited = new Set();
  const visit = (name) => {
    if (visited.has(name)) return;
    visited.add(name);
    const source = fs
      .readFileSync(path.join(db, manifest.modules[name]), 'utf8')
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(
      source,
      /^(?![\s\S]*\b(?:EXEC(?:UTE)?|INSERT|UPDATE|DELETE|MERGE|TRUNCATE)\b)[\s\S]*$/i,
      name,
    );
    for (const match of source.matchAll(/dbo\.(\w+)/g))
      if (match[1] !== name && manifest.modules[match[1]]) visit(match[1]);
  };
  visit('sp_Order_GetDetailByCustomer');
  assert.deepEqual([...visited].sort(), [
    'fn_BayGio',
    'sp_Order_GetDetailByCustomer',
    'vw_ChiTietDonDatVe',
  ]);
  const view = fs.readFileSync(path.join(db, manifest.modules.vw_ChiTietDonDatVe), 'utf8');
  assert.match(view, /HanGiuCho <= dbo\.fn_BayGio\(\)/);
});
test('expiry job overlap guard permits one actual gateway call and recovers for subsequent ticks', async () => {
  let release,
    count = 0;
  const gate = new Promise((r) => {
      release = r;
    }),
    job = startExpirePendingOrdersJob({
      intervalMs: 3600000,
      execute: async (key) => {
        assert.equal(key, 'EXPIRE_PENDING_ORDERS');
        count++;
        if (count === 1) await gate;
        return { recordset: [{ SoDonHetHan: 0 }] };
      },
      log: { info() {}, error() {} },
    });
  try {
    const first = job.tick();
    await job.tick();
    assert.equal(count, 1);
    release();
    await first;
    await job.tick();
    assert.equal(count, 2);
  } finally {
    release();
    job.stop();
  }
});
test('existing scheduler timer executes independently and stop prevents further execution', async () => {
  let count = 0,
    done;
  const called = new Promise((r) => {
      done = r;
    }),
    job = startExpirePendingOrdersJob({
      intervalMs: 10,
      execute: async (key) => {
        assert.equal(key, 'EXPIRE_PENDING_ORDERS');
        count++;
        done();
        return { recordset: [{ SoDonHetHan: 1 }] };
      },
      log: { info() {}, error() {} },
    });
  try {
    await Promise.race([
      called,
      new Promise((_, reject) => setTimeout(() => reject(Error('timer did not execute')), 1000)),
    ]);
    job.stop();
    const stopped = count;
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(count, stopped);
  } finally {
    job.stop();
  }
});

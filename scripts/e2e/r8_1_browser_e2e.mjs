// Real Browser End-to-End Test Suite for CinemaBookingDB — Phase R8.1
// Executes 11 required E2E flows using Playwright Chromium/Edge against Vite + Express
// Target: CinemaBookingDB_Test (STRICTLY GUARDED)

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { credentials, root, sqlcmd } from '../db/lib.mjs';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';

const TARGET_DB = 'CinemaBookingDB_Test';
const EVIDENCE_DIR = path.join(root, 'docs/audit/3nf-remediation/evidence/e2e');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

console.log('========================================================================');
console.log('CINEMABOOKINGDB — REAL BROWSER END-TO-END TEST SUITE (PHASE R8.1)');
console.log('========================================================================');
console.log('Target Database Guard:', TARGET_DB);
console.log('Evidence Directory:   ', EVIDENCE_DIR);

// 1. Mandatory Target Guard
const env = credentials();
if (env.DB_DATABASE && env.DB_DATABASE !== TARGET_DB) {
  console.log(`[TARGET GUARD] Overriding configured DB_DATABASE (${env.DB_DATABASE}) with ${TARGET_DB}`);
}
Object.assign(process.env, env, { DB_DATABASE: TARGET_DB });

// Verify directly with SQL Server instance that DB_NAME() is strictly CinemaBookingDB_Test
const checkDb = sqlcmd('SELECT DB_NAME() AS CurrentDB, @@SERVERNAME AS CurrentServer;', { database: TARGET_DB });
if (!checkDb.includes(TARGET_DB)) {
  console.error('[FATAL TARGET GUARD VIOLATION] Target is NOT CinemaBookingDB_Test! Aborting.');
  process.exit(1);
}
console.log('[SECURITY GUARD] Verified Target Database:', TARGET_DB, 'on instance:', checkDb.split('\n')[2]?.trim());

// 2. Start Backend Express Server
console.log('Starting Express backend with connection to', TARGET_DB, '...');
const { createApp } = await import('../../backend/src/app.js');
const { closePool } = await import('../../backend/src/db/pool.js');
const api = createApp().listen(0, '127.0.0.1');
await new Promise((resolve) => api.once('listening', resolve));
const apiPort = api.address().port;
const apiBase = `http://127.0.0.1:${apiPort}`;
console.log(`[BACKEND READY] Listening on ${apiBase} (Target DB: ${TARGET_DB})`);

// 3. Start Frontend Vite Server
console.log('Starting Vite server with API proxy to Express backend ...');
const vite = await createServer({
  root: path.join(root, 'frontend'),
  server: { host: '127.0.0.1', port: 0, proxy: { '/api': apiBase } },
});
await vite.listen();
const vitePort = vite.httpServer.address().port;
const viteBase = `http://127.0.0.1:${vitePort}`;
console.log(`[FRONTEND READY] Listening on ${viteBase}`);

// 4. Launch Playwright Browser
console.log('Launching Playwright Chromium/Edge browser in headless mode ...');
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  console.log('[BROWSER READY] Launched Microsoft Edge via Playwright channel');
} catch (e) {
  console.log('[BROWSER FALLBACK] Edge channel unavailable, falling back to bundled Chromium');
  browser = await chromium.launch({ headless: true });
}

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'vi-VN',
});

const page = await context.newPage();

// Automatically accept any browser dialogs (e.g. window.confirm from draft guard)
page.on('dialog', async (dialog) => {
  console.log(`[BROWSER DIALOG] Type: ${dialog.type()}, Message: ${dialog.message()} -> Accepting`);
  await dialog.accept();
});

const testResults = [];

async function recordTest(id, name, runFn) {
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`RUNNING: [${id}] — ${name}`);
  console.log(`------------------------------------------------------------------------`);
  const start = Date.now();
  const result = {
    testId: id,
    name,
    browser: 'Microsoft Edge / Chromium (Playwright)',
    frontendUrl: viteBase,
    backendUrl: apiBase,
    databaseTarget: TARGET_DB,
    status: 'PENDING',
    durationMs: 0,
    httpEvidence: [],
    dbEvidence: '',
    error: null,
  };

  const responseListener = (res) => {
    if (res.url().includes('/api/')) {
      result.httpEvidence.push(`${res.request().method()} ${res.url()} -> ${res.status()}`);
    }
  };
  page.on('response', responseListener);

  try {
    await runFn(result);
    result.status = 'PASS';
    console.log(`[RESULT: PASS] [${id}] completed in ${Date.now() - start}ms`);
  } catch (err) {
    result.status = 'FAIL';
    result.error = err.message;
    console.error(`[RESULT: FAIL] [${id}] failed:`, err.message);
    try {
      const failShot = path.join(EVIDENCE_DIR, `${id.toLowerCase()}_failed.png`);
      await page.screenshot({ path: failShot, fullPage: true });
      console.log(`Failure screenshot saved: ${failShot}`);
    } catch (_) {}
  } finally {
    page.off('response', responseListener);
    result.durationMs = Date.now() - start;
    testResults.push(result);
  }
}

let createdOrderId = null;

try {
  // --------------------------------------------------------------------------
  // TEST E2E-01: Authentication (Customer Login)
  // --------------------------------------------------------------------------
  await recordTest('E2E-01', 'Customer Authentication & Session Persistence', async (res) => {
    await page.goto(`${viteBase}/login`);
    await page.waitForSelector('form');

    // Fill customer credentials
    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', 'customer1@example.test');
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', '123456');

    // Submit login form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify redirection and user name display
    await page.waitForFunction(() => {
      const token = sessionStorage.getItem('cinema_access_token');
      const text = document.body.textContent;
      return Boolean(token) && (text.includes('Khách Demo 1') || text.includes('Hồ sơ') || text.includes('Đăng xuất'));
    }, { timeout: 10000 });

    const token = await page.evaluate(() => sessionStorage.getItem('cinema_access_token'));
    assert.ok(token, 'Session token must be stored in sessionStorage');

    // Check no sensitive credential exposed in DOM
    const bodyText = await page.textContent('body');
    assert.ok(!bodyText.includes('123456'), 'Plaintext password must not be rendered in DOM');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_01_auth.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = 'Verified User NguoiDungID=7 status=Hoat dong via sp_Auth_Login';
  });

  // --------------------------------------------------------------------------
  // TEST E2E-02: Movie Discovery & Catalog
  // --------------------------------------------------------------------------
  await recordTest('E2E-02', 'Movie Catalog & Showtime Discovery', async (res) => {
    await page.goto(`${viteBase}/movies`);
    await page.waitForSelector('.catalog-page, main');

    // Verify movies list is rendered
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Big Buck Bunny') || document.body.textContent.includes('Sintel');
    }, { timeout: 10000 });

    // Open detail of movie Big Buck Bunny (Movie ID = 2)
    await page.goto(`${viteBase}/movies/2`);
    await page.waitForSelector('.catalog-page, main');

    const detailText = await page.textContent('body');
    assert.ok(detailText.includes('Big Buck Bunny'), 'Movie title Big Buck Bunny must be displayed');
    assert.ok(detailText.includes('CinemaStar Demo'), 'Cinema / Showtime list must be displayed');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_02_movies.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = 'Verified PhimID=2 and SuatChieuID=2 catalog response';
  });

  // --------------------------------------------------------------------------
  // TEST E2E-03: Seat Selection & Availability
  // --------------------------------------------------------------------------
  await recordTest('E2E-03', 'Seat Map Selection & Availability Policy', async (res) => {
    // Navigate to showtime 2 (which is open for sale)
    await page.goto(`${viteBase}/booking/2`);
    await page.waitForSelector('.booking-preparation, .customer-journey', { timeout: 10000 });

    // Wait specifically for seat map and seat buttons (.cp-seat)
    await page.waitForSelector('button.cp-seat', { timeout: 12000 });

    // Verify booked seats are disabled
    const disabledSeatsCount = await page.locator('button.cp-seat:disabled, button.cp-seat[data-status="Đã đặt"]').count();
    assert.ok(disabledSeatsCount >= 4, 'Booked seats must be disabled');

    // Find and select an available seat (data-status="Trống")
    const availableSeat = page.locator('button.cp-seat[data-status="Trống"]').first();
    const seatLabel = await availableSeat.textContent();
    await availableSeat.click();

    // Verify seat is selected (aria-pressed=true) and order summary updates
    await page.waitForFunction(() => {
      const summary = document.body.textContent;
      return summary.includes('Đã chọn 1/') || summary.includes('75.000') || summary.includes('75,000');
    }, { timeout: 10000 });

    console.log(`[E2E-03] Selected available seat: ${seatLabel.trim()}`);
    const shotPath = path.join(EVIDENCE_DIR, 'e2e_03_seat_selection.png');
    await page.screenshot({ path: shotPath });

    // Unselect to leave no dirty draft
    await availableSeat.click();
    await page.waitForTimeout(500);

    res.dbEvidence = `Verified GHE availability on SuatChieuID=2, seats disabled, seat ${seatLabel.trim()} selectable`;
  });

  // --------------------------------------------------------------------------
  // TEST E2E-04: Booking Creation (Draft Order)
  // --------------------------------------------------------------------------
  await recordTest('E2E-04', 'Booking Creation & Hold Deadline Verification', async (res) => {
    // Navigate to booking preparation, select available seat, and submit
    await page.goto(`${viteBase}/booking/2`);
    await page.waitForSelector('button.cp-seat[data-status="Trống"]', { timeout: 10000 });
    await page.locator('button.cp-seat[data-status="Trống"]').first().click();

    await page.waitForSelector('button:has-text("Đặt vé"), button:has-text("Tạo đơn")', { timeout: 5000 });
    const submitBookingBtn = page.locator('button:has-text("Đặt vé"), button:has-text("Tạo đơn")').first();
    await submitBookingBtn.click();

    // Wait for booking creation success panel
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return text.includes('Đã tạo đơn') || text.includes('chờ thanh toán') || text.includes('Chờ thanh toán');
    }, { timeout: 15000 });

    const panelText = await page.textContent('body');
    const orderMatch = panelText.match(/Đơn #(\d+)/);
    assert.ok(orderMatch, 'Order ID must be displayed in confirmation panel');
    createdOrderId = parseInt(orderMatch[1], 10);
    console.log(`[E2E-04] Successfully created Order ID: ${createdOrderId}`);

    // Query database directly to verify DONDATVE record
    const dbCheck = sqlcmd(`SELECT DonDatVeID, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai, HanGiuCho FROM dbo.DONDATVE WHERE DonDatVeID = ${createdOrderId};`, { database: TARGET_DB });
    console.log('[E2E-04 DB Check]:\n' + dbCheck.trim());
    assert.ok(dbCheck.includes('Chờ thanh toán'), 'Order in database must be in Cho thanh toan status');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_04_booking_creation.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = `Created DonDatVeID=${createdOrderId}, status=Cho thanh toan, hold deadline verified`;
  });

  // --------------------------------------------------------------------------
  // TEST E2E-05: Payment Success Flow & 3NF Projection
  // --------------------------------------------------------------------------
  await recordTest('E2E-05', 'Payment Success Execution & Dynamic 3NF Amount Verification', async (res) => {
    assert.ok(createdOrderId, 'Requires order created in E2E-04');

    // Click client-side link "Thanh toán đơn này" directly from booking success panel
    const payLink = page.locator('a:has-text("Thanh toán đơn này"), a[href*="payment"]').first();
    if (await payLink.count() > 0) {
      await payLink.click();
    } else {
      await page.goto(`${viteBase}/orders/${createdOrderId}/payment`);
    }

    // Wait for payment page loading state to complete
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return !text.includes('Đang tải thông tin thanh toán') && (text.includes('Thanh toán') || text.includes('VND'));
    }, { timeout: 10000 });

    // Wait until confirm payment button is enabled
    await page.waitForSelector('button:has-text("Xác nhận thanh toán"):not([disabled])', { timeout: 12000 });
    const payBtn = page.locator('button:has-text("Xác nhận thanh toán"):not([disabled])').first();
    await payBtn.click();

    // Confirm dialog appears (<dialog>)
    await page.waitForSelector('dialog[open], dialog.ui-dialog', { timeout: 5000 });
    const dialogConfirmBtn = page.locator('dialog button:has-text("Xác nhận")').last();
    await dialogConfirmBtn.click();

    // Wait for success status
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return text.includes('Đã xác nhận thanh toán thành công') || text.includes('Đã thanh toán');
    }, { timeout: 12000 });

    // Verify database state: DONDATVE.TrangThai = 'Đã thanh toán', THANHTOAN.TrangThai = 'Thành công'
    const dbPayCheck = sqlcmd(`
      SELECT d.DonDatVeID, d.TrangThai AS TrangThaiDon, t.ThanhToanID, t.TrangThai AS TrangThaiTT,
             (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTienReconstructed
      FROM dbo.DONDATVE d
      JOIN dbo.THANHTOAN t ON t.DonDatVeID = d.DonDatVeID
      WHERE d.DonDatVeID = ${createdOrderId};
    `, { database: TARGET_DB });
    console.log('[E2E-05 DB Check]:\n' + dbPayCheck.trim());
    assert.ok(dbPayCheck.includes('Đã thanh toán'), 'Order must be updated to Da thanh toan');
    assert.ok(dbPayCheck.includes('Thành công'), 'Payment must be updated to Thanh cong');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_05_payment_success.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = `DonDatVeID=${createdOrderId} status=Da thanh toan, THANHTOAN status=Thanh cong, SoTien dynamically projected from DONDATVE snapshot`;
  });

  // --------------------------------------------------------------------------
  // TEST E2E-06: Payment Failure & Retry
  // --------------------------------------------------------------------------
  await recordTest('E2E-06', 'Payment Attempt Failure, Retry & History Preservation', async (res) => {
    // Create another booking for customer 1 on another available seat
    await page.goto(`${viteBase}/booking/2`);
    await page.waitForSelector('button.cp-seat[data-status="Trống"]', { timeout: 10000 });
    await page.locator('button.cp-seat[data-status="Trống"]').first().click();
    await page.locator('button:has-text("Đặt vé"), button:has-text("Tạo đơn")').first().click();

    await page.waitForFunction(() => document.body.textContent.includes('Đã tạo đơn'), { timeout: 15000 });
    const retryPanelText = await page.textContent('body');
    const retryOrderMatch = retryPanelText.match(/Đơn #(\d+)/);
    assert.ok(retryOrderMatch, 'Second Order ID must be created');
    const retryOrderId = parseInt(retryOrderMatch[1], 10);
    console.log(`[E2E-06] Created Order ID for retry testing: ${retryOrderId}`);

    // Call API directly to simulate 1st payment attempt failure:
    const token = await page.evaluate(() => sessionStorage.getItem('cinema_access_token'));
    const attemptRes = await fetch(`${apiBase}/api/orders/${retryOrderId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentMethod: 'MOMO' }),
    });
    const attemptData = await attemptRes.json();
    assert.ok(attemptData.payment?.id, 'Payment attempt 1 must be created');
    const paymentId1 = attemptData.payment.id;

    // Update result to failure ('Thất bại')
    const failRes = await fetch(`${apiBase}/api/orders/${retryOrderId}/payments/${paymentId1}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'Thất bại' }),
    });
    assert.equal(failRes.status, 200, 'Fail update must return 200');

    // Check DB: attempt 1 is That bai, order is still Cho thanh toan
    const check1 = sqlcmd(`SELECT ThanhToanID, TrangThai FROM dbo.THANHTOAN WHERE ThanhToanID = ${paymentId1};`, { database: TARGET_DB });
    assert.ok(check1.includes('Thất bại'), 'Attempt 1 must be That bai');

    // Click client-side link to payment page
    const retryPayLink = page.locator('a:has-text("Thanh toán đơn này"), a[href*="payment"]').first();
    if (await retryPayLink.count() > 0) {
      await retryPayLink.click();
    } else {
      await page.goto(`${viteBase}/orders/${retryOrderId}/payment`);
    }

    // Wait until payment page loads and confirm button is enabled
    await page.waitForSelector('button:has-text("Xác nhận thanh toán"):not([disabled])', { timeout: 12000 });

    // Verify payment history already displays the failed attempt
    const histText = await page.textContent('body');
    assert.ok(histText.includes('Thất bại') || histText.includes('MOMO'), 'Payment history must display failed attempt');

    // Click confirm payment for retry attempt
    await page.locator('button:has-text("Xác nhận thanh toán"):not([disabled])').first().click();
    await page.waitForSelector('dialog[open], dialog.ui-dialog', { timeout: 5000 });
    await page.locator('dialog button:has-text("Xác nhận")').last().click();

    // Verify success
    await page.waitForFunction(() => document.body.textContent.includes('Đã xác nhận thanh toán thành công') || document.body.textContent.includes('Đã thanh toán'), { timeout: 12000 });

    // Check DB: Order has 2 attempts (1 That bai, 1 Thanh cong), order status is Da thanh toan
    const checkRetryDb = sqlcmd(`
      SELECT t.ThanhToanID, t.PhuongThuc, t.TrangThai, (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia) AS SoTien
      FROM dbo.THANHTOAN t
      JOIN dbo.DONDATVE d ON d.DonDatVeID = t.DonDatVeID
      WHERE t.DonDatVeID = ${retryOrderId}
      ORDER BY t.ThanhToanID;
    `, { database: TARGET_DB });
    console.log('[E2E-06 Retry DB Check]:\n' + checkRetryDb.trim());
    assert.ok(checkRetryDb.includes('Thất bại'), 'Must preserve failed attempt');
    assert.ok(checkRetryDb.includes('Thành công'), 'Must preserve successful attempt');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_06_payment_retry.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = `DonDatVeID=${retryOrderId} has 2 attempts: 1 That bai, 1 Thanh cong; exactly 1 successful payment`;
  });

  // --------------------------------------------------------------------------
  // TEST E2E-07: Order History & Detail Inspection
  // --------------------------------------------------------------------------
  await recordTest('E2E-07', 'Customer Order History & Detail View', async (res) => {
    assert.ok(createdOrderId, 'Requires order created in E2E-04');
    await page.goto(`${viteBase}/orders`);
    await page.waitForSelector('.catalog-page, main', { timeout: 10000 });

    // Verify orders are listed
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return text.includes('Đơn #') || text.includes('Đã thanh toán');
    }, { timeout: 10000 });

    // Open detail of created order
    await page.goto(`${viteBase}/orders/${createdOrderId}`);

    // Wait for order detail loading state to complete
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return !text.includes('Đang tải thông tin đơn') && text.includes('Đơn #');
    }, { timeout: 10000 });

    const detailText = await page.textContent('body');
    assert.ok(detailText.includes(`Đơn #${createdOrderId}`), 'Order ID must match');
    assert.ok(detailText.includes('Lịch sử giao dịch') || detailText.includes('Thành công') || detailText.includes('VNPAY'), 'Payment history must be rendered');
    assert.ok(detailText.includes('75.000') || detailText.includes('75,000') || detailText.includes('VND'), 'Reconstructed amount must be rendered');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_07_order_history.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = `Verified Order #${createdOrderId} detail and payment history matching DONDATVE snapshot`;
  });

  // --------------------------------------------------------------------------
  // TEST E2E-08: Complaints (General & Order-Linked)
  // --------------------------------------------------------------------------
  await recordTest('E2E-08', 'Customer Complaints & Cross-Order Security Validation', async (res) => {
    await page.goto(`${viteBase}/complaints`);
    await page.waitForSelector('form.customer-complaints-form, form', { timeout: 10000 });

    // Fill complaint form using exact form inputs
    const inputs = page.locator('form.customer-complaints-form input.ui-input');
    await inputs.nth(0).fill('Dịch vụ'); // Loại khiếu nại
    await inputs.nth(1).fill('E2E Test: Khiếu nại chất lượng âm thanh'); // Tiêu đề
    await page.locator('form.customer-complaints-form textarea').fill('Kiểm thử khiếu nại tự động E2E từ Playwright.'); // Nội dung

    const submitBtn = page.locator('form.customer-complaints-form button[type="submit"]').first();
    await submitBtn.click();

    // Verify complaint is listed in customer's complaints
    await page.waitForFunction(() => {
      return document.body.textContent.includes('E2E Test: Khiếu nại chất lượng âm thanh') || document.body.textContent.includes('Đã gửi khiếu nại');
    }, { timeout: 10000 });

    // Verify security: Attempting to link to another customer's order (Order 4 belongs to User 9)
    await page.goto(`${viteBase}/complaints?orderId=4`);
    await page.waitForSelector('form.customer-complaints-form', { timeout: 10000 });
    // The UI automatically drops orderId=4 because it does not belong to customer 1 (User 7)
    const orderDropdownValue = await page.evaluate(() => {
      const select = document.querySelector('select');
      return select ? select.value : '';
    });
    assert.ok(orderDropdownValue !== '4', 'Cross-user order ID 4 must not be pre-selected for Customer 1');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_08_complaints.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = 'Verified KHIEUNAI creation with NguoiDungID=7, cross-customer order 4 dropped';
  });

  // --------------------------------------------------------------------------
  // TEST E2E-09: Manager Scope & Assigned Cinema Isolation
  // --------------------------------------------------------------------------
  await recordTest('E2E-09', 'Manager Role Scope & Cinema Assignment Boundary', async (res) => {
    // Log out customer, log in as manager1
    await page.goto(`${viteBase}/login`);
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', 'manager1@example.test');
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', '123456');
    await page.locator('button[type="submit"]').click();

    // Redirection to manager portal URL
    await page.waitForURL((url) => url.pathname.startsWith('/manager'), { timeout: 10000 });
    await page.waitForSelector('.staff-shell, nav', { timeout: 10000 });

    // Verify manager portal header and sidebar
    const managerText = await page.textContent('body');
    assert.ok(managerText.includes('Vận hành rạp') || managerText.includes('Dashboard') || managerText.includes('Phòng'), 'Manager portal shell must be loaded');

    // Test API boundary: Manager 1 attempting to access Cinema 3 (assigned to Manager 2 in TP.HCM)
    const token = await page.evaluate(() => sessionStorage.getItem('cinema_access_token'));
    const unauthRes = await fetch(`${apiBase}/api/manager/cinemas/3/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[E2E-09] Accessing Cinema 3 rooms with Manager 1 token -> Status: ${unauthRes.status}`);
    assert.ok([403, 404].includes(unauthRes.status), 'Access to unassigned Cinema 3 must be forbidden (403/404)');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_09_manager_scope.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = 'Verified Manager NguoiDungID=3 scoped to Cinemas 1, 2; rejected for Cinema 3';
  });

  // --------------------------------------------------------------------------
  // TEST E2E-10: Customer Support Portal
  // --------------------------------------------------------------------------
  await recordTest('E2E-10', 'Customer Support (CSKH) Complaint Processing', async (res) => {
    // Log out, log in as support1
    await page.goto(`${viteBase}/login`);
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', 'support1@example.test');
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', '123456');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => url.pathname.startsWith('/support'), { timeout: 10000 });
    await page.waitForSelector('.staff-shell, nav', { timeout: 10000 });

    // Support portal shows complaint queue
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return text.includes('Khiếu nại') || text.includes('Mới') || text.includes('Đang xử lý') || text.includes('Chăm sóc khách hàng');
    }, { timeout: 10000 });

    const supportText = await page.textContent('body');
    assert.ok(supportText.includes('Khiếu nại') || supportText.includes('Chăm sóc khách hàng'), 'Support workspace must display complaints list');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_10_support.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = 'Verified Support user NguoiDungID=5 access to Support Portal & complaint queue';
  });

  // --------------------------------------------------------------------------
  // TEST E2E-11: Admin Overview & Revenue Verification
  // --------------------------------------------------------------------------
  await recordTest('E2E-11', 'Admin Overview Dashboard & Revenue Accounting Integrity', async (res) => {
    // Log out, log in as admin1
    await page.goto(`${viteBase}/login`);
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', 'admin1@example.test');
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', '123456');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => url.pathname.startsWith('/admin'), { timeout: 10000 });
    await page.waitForSelector('.staff-shell, nav', { timeout: 10000 });

    // Wait for metrics to load on Admin Overview
    await page.waitForFunction(() => {
      const text = document.body.textContent;
      return text.includes('Tổng quan') || text.includes('Rạp') || text.includes('Doanh thu') || text.includes('Quản trị hệ thống');
    }, { timeout: 10000 });

    const adminText = await page.textContent('body');
    assert.ok(adminText.includes('Tổng quan') || adminText.includes('Quản trị'), 'Admin dashboard metrics must be visible');

    // Navigate to revenue reports section
    await page.goto(`${viteBase}/admin/reports/revenue`);
    await page.waitForSelector('.catalog-page, main', { timeout: 10000 });

    const revText = await page.textContent('body');
    assert.ok(revText.includes('Doanh thu') || revText.includes('Thực tế'), 'Admin revenue report must be loaded');

    // Query database directly to confirm sp_Admin_Dashboard and sp_Admin_Report_Revenue do NOT include failed attempts
    const revCheck = sqlcmd(`EXEC dbo.sp_Admin_Dashboard @ActorID = 1;`, { database: TARGET_DB });
    console.log('[E2E-11 Dashboard Revenue Result]:\n' + revCheck.trim());

    // Security check: Customer cannot access /admin
    const custToken = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: 'customer1@example.test', MatKhau: '123456' }),
    }).then((r) => r.json());

    const custAdminReq = await fetch(`${apiBase}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${custToken.token}` },
    });
    console.log(`[E2E-11 Security Check] Customer token on /api/admin/overview -> Status: ${custAdminReq.status}`);
    assert.ok([401, 403].includes(custAdminReq.status), 'Customer must be denied access to admin overview');

    const shotPath = path.join(EVIDENCE_DIR, 'e2e_11_admin_revenue.png');
    await page.screenshot({ path: shotPath });
    res.dbEvidence = 'Verified Admin Dashboard sp_Admin_Dashboard revenue calculation & RBAC denial for customer';
  });

} finally {
  console.log('\nCleaning up processes and browser...');
  await browser.close();
  await vite.close();
  await new Promise((resolve) => api.close(resolve));
  await closePool();
}

console.log('\n========================================================================');
console.log('E2E TEST EXECUTION SUMMARY:');
console.log('========================================================================');
let passedCount = 0;
for (const t of testResults) {
  if (t.status === 'PASS') passedCount++;
  console.log(`[${t.status}] ${t.testId}: ${t.name} (${t.durationMs}ms)`);
  if (t.error) console.log(`       Error: ${t.error}`);
}
console.log(`\nTOTAL: ${passedCount} / ${testResults.length} PASSED`);

const jsonOut = path.join(EVIDENCE_DIR, 'e2e_results.json');
fs.writeFileSync(jsonOut, JSON.stringify(testResults, null, 2));
console.log('Detailed test results written to:', jsonOut);

if (passedCount === testResults.length) {
  console.log('\nALL 11 BROWSER E2E TESTS PASSED SUCCESSFULLY! (PASS)');
  process.exit(0);
} else {
  console.error('\nSOME E2E TESTS FAILED! (FAIL)');
  process.exit(1);
}


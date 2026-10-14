// Phase 7: Comprehensive CSKH Lifecycle & Security Integration Test Suite
// Run on isolated test database CinemaBookingDB_Test.
import assert from 'node:assert/strict';
import {
  ACCOUNTS,
  DEMO_PASSWORD,
  Reporter,
  apiClient,
  assertTestDatabase,
  connectTestDb,
  one,
  rows,
  scalar,
  startBackend,
} from './lib.mjs';
import { runIntegrityChecks } from './db-integrity.mjs';

const RUN = Date.now().toString(36);
const reporter = new Reporter('cskh-lifecycle');
const { pool, identity } = await connectTestDb();
console.log(`CSKH Test Target: ${identity.db} as ${identity.login}  run=${RUN}`);
const backend = await startBackend();
const call = apiClient(backend.base);

const tokens = {};
async function login(role, customEmail) {
  const email = customEmail ?? ACCOUNTS[role];
  if (tokens[email]) return tokens[email];
  const response = await call('POST', '/auth/login', {
    body: { Email: email, MatKhau: DEMO_PASSWORD },
  });
  assert.equal(response.status, 200, `login ${role} (${email}): ${response.text}`);
  tokens[email] = response.body.token;
  return tokens[email];
}

async function asRole(role, method, route, body, customEmail) {
  const options = { token: await login(role, customEmail) };
  if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
    options.body = body;
  }
  return call(method, route, options);
}

const expectStatus = (response, status, code) => {
  assert.equal(response.status, status, `expected ${status} got ${response.status}: ${response.text}`);
  if (code) assert.equal(response.body?.error?.code, code, `expected error code ${code}: ${response.text}`);
  return response.body;
};

async function t(id, title, fn) {
  try {
    await assertTestDatabase(pool);
    const evidence = await fn();
    reporter.record(id, title, 'PASS', '', evidence);
  } catch (error) {
    reporter.record(id, title, 'FAIL', error.message.split('\n')[0].slice(0, 400));
  }
}

const ctx = {};

// Setup: Ensure we have customer, CSKH 1 & 2, and Admin accounts
const staff1User = await one(pool, 'SELECT NguoiDungID, Email FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.support });
const staff2User = await one(pool, 'SELECT NguoiDungID, Email FROM dbo.NGUOIDUNG WHERE Email = @e', { e: 'support2@example.test' });
const admin1User = await one(pool, 'SELECT NguoiDungID, Email FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.admin });
const admin2User = await one(pool, 'SELECT NguoiDungID, Email FROM dbo.NGUOIDUNG WHERE Email = @e', { e: 'admin2@example.test' });
const customer1User = await one(pool, 'SELECT NguoiDungID, Email FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.customer });
const customer2User = await one(pool, 'SELECT NguoiDungID, Email FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.customer2 });

ctx.staff1 = staff1User;
ctx.staff2 = staff2User;
ctx.admin1 = admin1User;
ctx.admin2 = admin2User;
ctx.customer1 = customer1User;
ctx.customer2 = customer2User;

console.log(`Staff 1 ID: ${ctx.staff1.NguoiDungID}, Staff 2 ID: ${ctx.staff2.NguoiDungID}`);

// ============================================================================
// TEST GROUP A: Complaint Creation & Assignment Flow
// ============================================================================

await t('CSKH-ASN-01', 'Customer creates a complaint, appears in unassigned queue (NhanVienPhuTrachID IS NULL)', async () => {
  const created = await asRole('customer', 'POST', '/complaints', {
    type: 'Dịch vụ',
    title: `Yêu cầu hỗ trợ CSKH ${RUN}`,
    content: 'Cần hỗ trợ về dịch vụ rạp và hoàn điểm',
  });
  expectStatus(created, 201);
  ctx.complaintId = created.body.complaint.id;
  assert.ok(ctx.complaintId > 0);

  const row = await one(pool, 'SELECT KhieuNaiID, TrangThai, NhanVienPhuTrachID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', {
    id: ctx.complaintId,
  });
  assert.equal(row.TrangThai, 'Mới');
  assert.equal(row.NhanVienPhuTrachID, null);

  const unassigned = await asRole('support', 'GET', '/support/complaints/unassigned');
  expectStatus(unassigned, 200);
  assert.ok(unassigned.body.complaints.some((c) => c.id === ctx.complaintId));
});

await t('CSKH-ASN-02', 'CSKH-1 claims unassigned complaint; concurrency check: CSKH-2 claiming same gets 409', async () => {
  // CSKH 1 claims
  const claimRes = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/claim`);
  expectStatus(claimRes, 200);
  assert.equal(claimRes.body.claim.assignedStaffId, ctx.staff1.NguoiDungID);

  // DB verify assigned
  const dbRow = await one(pool, 'SELECT NhanVienPhuTrachID, TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  assert.equal(dbRow.NhanVienPhuTrachID, ctx.staff1.NguoiDungID);
  assert.equal(dbRow.TrangThai, 'Đang xử lý');

  // CSKH 2 attempts concurrent/duplicate claim -> 409
  const dupClaim = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/claim`, {}, 'support2@example.test');
  expectStatus(dupClaim, 409, 'COMPLAINT_ALREADY_ASSIGNED');
});

await t('CSKH-ASN-03', 'Assignment history is recorded in LICHSU_PHANCONG_KHIEUNAI (append-only)', async () => {
  const history = await asRole('support', 'GET', `/support/complaints/${ctx.complaintId}/assignment-history`);
  expectStatus(history, 200);
  assert.ok(history.body.history.length >= 1);
  const latest = history.body.history[0];
  assert.equal(latest.newStaffId, ctx.staff1.NguoiDungID);
});

await t('CSKH-ASN-04', 'Admin reassigns complaint to CSKH-2; history logged; previous staff loses active assignment', async () => {
  const assignRes = await asRole('admin', 'PUT', `/admin/complaints/${ctx.complaintId}/assign`, {
    staffId: ctx.staff2.NguoiDungID,
    reason: 'Chuyển giao cho ca chiều',
  });
  expectStatus(assignRes, 200);
  assert.equal(assignRes.body.assignment.assignedStaffId, ctx.staff2.NguoiDungID);

  const dbRow = await one(pool, 'SELECT NhanVienPhuTrachID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  assert.equal(dbRow.NhanVienPhuTrachID, ctx.staff2.NguoiDungID);

  const history = await asRole('admin', 'GET', `/admin/complaints/${ctx.complaintId}/assignment-history`);
  expectStatus(history, 200);
  assert.ok(history.body.history.length >= 2);
  const latest = history.body.history.at(-1);
  assert.equal(latest.previousStaffId, ctx.staff1.NguoiDungID);
  assert.equal(latest.newStaffId, ctx.staff2.NguoiDungID);
  assert.equal(latest.reason, 'Chuyển giao cho ca chiều');
});

// ============================================================================
// TEST GROUP B: Conversation & Chat (TINNHAN_KHIEUNAI)
// ============================================================================

await t('CSKH-CHT-01', 'Customer sends message; chronological order and sender role preserved', async () => {
  const msgRes = await asRole('customer', 'POST', `/complaints/${ctx.complaintId}/messages`, {
    content: 'Chào CSKH, tôi cần hỗ trợ kiểm tra điểm tích lũy.',
  });
  expectStatus(msgRes, 201);
  assert.equal(msgRes.body.message.content, 'Chào CSKH, tôi cần hỗ trợ kiểm tra điểm tích lũy.');
  assert.equal(msgRes.body.message.isInternal, false);
  ctx.msg1Id = msgRes.body.message.id;

  const msgs = await asRole('customer', 'GET', `/complaints/${ctx.complaintId}/messages`);
  expectStatus(msgs, 200);
  assert.ok(msgs.body.messages.some((m) => m.id === ctx.msg1Id));
});

await t('CSKH-CHT-02', 'Reassigned CSKH-1 cannot send messages (403); current assigned CSKH-2 replies successfully (201)', async () => {
  // Staff 1 (not assigned) tries to reply -> 403
  const staff1Msg = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/messages`, {
    content: 'Staff 1 cố gắng gửi tin',
  }, 'support1@example.test');
  expectStatus(staff1Msg, 403, 'NOT_ASSIGNED_STAFF');

  // Staff 2 (currently assigned) replies -> 201
  const staff2Msg = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/messages`, {
    content: 'Dạ chào bạn, mình đã tiếp nhận và đang kiểm tra giúp bạn ạ.',
  }, 'support2@example.test');
  expectStatus(staff2Msg, 201);
  ctx.msg2Id = staff2Msg.body.message.id;

  // Customer reads reply
  const customerMsgs = await asRole('customer', 'GET', `/complaints/${ctx.complaintId}/messages`);
  expectStatus(customerMsgs, 200);
  assert.ok(customerMsgs.body.messages.some((m) => m.id === ctx.msg2Id));
});

await t('CSKH-CHT-03', 'CSKH adds internal note; visible to CSKH/Admin but strictly hidden from Customer (leak protection)', async () => {
  const noteRes = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/internal-notes`, {
    content: 'Ghi chú nội bộ: Tài khoản có biến động điểm do suất chiếu 12 bị hủy trước đó.',
  }, 'support2@example.test');
  expectStatus(noteRes, 201);
  ctx.noteId = noteRes.body.note.id;

  // CSKH view contains internal note
  const staffView = await asRole('support', 'GET', `/support/complaints/${ctx.complaintId}/messages`, null, 'support2@example.test');
  expectStatus(staffView, 200);
  assert.ok(staffView.body.messages.some((m) => m.id === ctx.noteId && m.isInternal === true));

  // Customer view MUST NOT contain internal note
  const customerView = await asRole('customer', 'GET', `/complaints/${ctx.complaintId}/messages`);
  expectStatus(customerView, 200);
  assert.ok(!customerView.body.messages.some((m) => m.id === ctx.noteId));
  assert.ok(customerView.body.messages.every((m) => m.isInternal === false));
});

await t('CSKH-CHT-04', 'IDOR & Cross-user boundary: Customer-2 cannot view or send messages in Customer-1 complaint', async () => {
  const crossView = await asRole('customer2', 'GET', `/complaints/${ctx.complaintId}/messages`);
  assert.ok([403, 404].includes(crossView.status), `cross view: ${crossView.status}`);

  const crossSend = await asRole('customer2', 'POST', `/complaints/${ctx.complaintId}/messages`, {
    content: 'Cố tình gửi vào khiếu nại người khác',
  });
  assert.ok([403, 404].includes(crossSend.status), `cross send: ${crossSend.status}`);
});

// ============================================================================
// TEST GROUP C: Escalation Lifecycle (YEUCAU_CHUYENCAP)
// ============================================================================

await t('CSKH-ESC-01', 'CSKH creates escalation request to Admin; duplicate open request on same complaint is rejected (409)', async () => {
  const escRes = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/escalations`, {
    reason: 'Vượt thẩm quyền xử lý bồi thường tài chính',
    priority: 'Cao',
  }, 'support2@example.test');
  expectStatus(escRes, 201);
  ctx.escalationId = escRes.body.escalation.id;
  assert.ok(ctx.escalationId > 0);
  assert.equal(escRes.body.escalation.status, 'Chờ tiếp nhận');

  // Attempt duplicate open escalation
  const dupEsc = await asRole('support', 'POST', `/support/complaints/${ctx.complaintId}/escalations`, {
    reason: 'Trùng lặp yêu cầu chuyển cấp',
    priority: 'Cao',
  }, 'support2@example.test');
  expectStatus(dupEsc, 409, 'ESCALATION_ALREADY_OPEN');
});

await t('CSKH-ESC-02', 'Admin sees escalation in queue and views details with related complaint + messages', async () => {
  const listRes = await asRole('admin', 'GET', '/admin/escalations?status=' + encodeURIComponent('Chờ tiếp nhận'));
  expectStatus(listRes, 200);
  assert.ok(listRes.body.escalations.some((e) => e.id === ctx.escalationId));

  const detailRes = await asRole('admin', 'GET', `/admin/escalations/${ctx.escalationId}`);
  expectStatus(detailRes, 200);
  assert.equal(detailRes.body.escalation.id, ctx.escalationId);
  assert.equal(detailRes.body.complaint.id, ctx.complaintId);
  assert.ok(detailRes.body.messages.length >= 2);
});

await t('CSKH-ESC-03', 'Admin claims escalation; concurrency check: Admin-2 claiming same gets 409', async () => {
  const claimRes = await asRole('admin', 'POST', `/admin/escalations/${ctx.escalationId}/claim`);
  expectStatus(claimRes, 200);
  assert.equal(claimRes.body.escalation.adminId, ctx.admin1.NguoiDungID);
  assert.equal(claimRes.body.escalation.status, 'Đang xử lý');

  // Admin 2 attempts concurrent claim -> 409
  const dupClaim = await asRole('admin', 'POST', `/admin/escalations/${ctx.escalationId}/claim`, {}, 'admin2@example.test');
  expectStatus(dupClaim, 409, 'ESCALATION_ALREADY_CLAIMED');
});

await t('CSKH-ESC-04', 'Admin processing: missing conclusion rejected (400), non-claimant rejected (403), valid conclusion completes', async () => {
  // Missing conclusion -> 400
  const emptyRes = await asRole('admin', 'PUT', `/admin/escalations/${ctx.escalationId}/process`, {
    conclusion: '',
    status: 'Đã giải quyết',
  });
  expectStatus(emptyRes, 400);

  // Admin 2 (not the claimant) tries to process -> 403
  const foreignProcess = await asRole('admin', 'PUT', `/admin/escalations/${ctx.escalationId}/process`, {
    conclusion: 'Admin 2 cố tình xử lý',
    status: 'Đã giải quyết',
  }, 'admin2@example.test');
  expectStatus(foreignProcess, 403, 'ESCALATION_NOT_ASSIGNED');

  // Admin 1 (claimant) successfully resolves
  const processRes = await asRole('admin', 'PUT', `/admin/escalations/${ctx.escalationId}/process`, {
    conclusion: 'Đã xác nhận sự cố kỹ thuật. Duyệt bồi thường 150 điểm cho khách hàng.',
    status: 'Đã giải quyết',
  });
  expectStatus(processRes, 200);
  assert.equal(processRes.body.escalation.status, 'Đã giải quyết');
  assert.equal(processRes.body.escalation.result, 'Đã xác nhận sự cố kỹ thuật. Duyệt bồi thường 150 điểm cho khách hàng.');

  // CSKH views conclusion
  const cskhList = await asRole('support', 'GET', '/support/escalations', null, 'support2@example.test');
  expectStatus(cskhList, 200);
  const found = cskhList.body.escalations.find((e) => e.id === ctx.escalationId);
  assert.ok(found);
  assert.equal(found.status, 'Đã giải quyết');
  assert.match(found.result, /150 điểm/);
});

// ============================================================================
// TEST GROUP D: Support Read-Only Customer Points Lookup & Security
// ============================================================================

await t('CSKH-SEC-01', 'CSKH can look up customer points history; customer/manager denied (403)', async () => {
  const pointsRes = await asRole('support', 'GET', `/support/customers/${ctx.customer1.NguoiDungID}/points`, null, 'support2@example.test');
  expectStatus(pointsRes, 200);
  assert.equal(pointsRes.body.customer.id, ctx.customer1.NguoiDungID);
  assert.ok(typeof pointsRes.body.customer.currentPoints === 'number');
  assert.ok(Array.isArray(pointsRes.body.history));

  // Customer cannot call CSKH endpoint -> 403
  const custCall = await asRole('customer', 'GET', `/support/customers/${ctx.customer1.NguoiDungID}/points`);
  expectStatus(custCall, 403);

  // Manager cannot call CSKH endpoint -> 403
  const mgrCall = await asRole('manager', 'GET', `/support/customers/${ctx.customer1.NguoiDungID}/points`);
  expectStatus(mgrCall, 403);
});

await t('CSKH-SEC-02', 'Fixed RBAC enforcement: Manager cannot access CSKH/Admin escalation routes (403)', async () => {
  expectStatus(await asRole('manager', 'GET', '/support/complaints/unassigned'), 403);
  expectStatus(await asRole('manager', 'GET', '/support/escalations'), 403);
  expectStatus(await asRole('manager', 'GET', '/admin/escalations'), 403);
});

// ============================================================================
// TEST GROUP E: Database Integrity & 3NF Post-Verification
// ============================================================================

await t('CSKH-INT-01', 'Database 3NF verification: TINNHAN_KHIEUNAI and YEUCAU_CHUYENCAP have no denormalized name/email columns', async () => {
  const tinNhanCols = (await rows(pool, `
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TINNHAN_KHIEUNAI'
  `)).map((c) => c.COLUMN_NAME.toLowerCase());

  assert.ok(!tinNhanCols.includes('tennguoigui'), 'No TenNguoiGui in TINNHAN_KHIEUNAI');
  assert.ok(!tinNhanCols.includes('emailnguoigui'), 'No EmailNguoiGui in TINNHAN_KHIEUNAI');

  const yeuCauCols = (await rows(pool, `
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'YEUCAU_CHUYENCAP'
  `)).map((c) => c.COLUMN_NAME.toLowerCase());

  assert.ok(!yeuCauCols.includes('tennguoiyecau'), 'No TenNguoiYeuCau in YEUCAU_CHUYENCAP');
  assert.ok(!yeuCauCols.includes('tenadminphutrach'), 'No TenAdminPhuTrach in YEUCAU_CHUYENCAP');
});

await runIntegrityChecks(pool, reporter, { prefix: 'POST-CSKH-' });

backend.stop();
await pool.close();
const summary = reporter.finish({ run: RUN });
process.exit(summary.failed === 0 ? 0 : 1);

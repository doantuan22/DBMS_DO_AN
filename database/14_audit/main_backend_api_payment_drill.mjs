// Safe Main API integration drill. It imports createApp directly, never server.js,
// so the production expiry worker is not started. API calls are bound to an outer
// SQL transaction and explicitly rolled back after the successful payment flow.
import fs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const envFile = path.join(ROOT, 'backend', '.env');
const parsedEnv = dotenv.parse(fs.readFileSync(envFile));
for (const [name, value] of Object.entries(parsedEnv)) {
  if (process.env[name] === undefined) process.env[name] = value;
}
if (parsedEnv.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend .env does not target CinemaBookingDB.');

const OUT = path.join(ROOT, '.audit-output', 'main-backend-api-payment-drill.json');
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'seed-credentials.json'), 'utf8'));
const accounts = (SEED.accounts ?? []).filter((account) => account.role === 'KHACH_HANG');
if (accounts.length === 0) throw new Error('No seeded customer login is available for read-only API authentication.');

const tokenTag = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const appContext = new AsyncLocalStorage();
const txSessions = new Map();
const txQueues = new WeakMap();
const evidence = {
  startedUtc: new Date().toISOString(),
  target: null,
  backendMode: { bootstrap: 'createApp() directly', productionServerImported: false, expiryWorkerStarted: false, listenAddress: '127.0.0.1 ephemeral port' },
  backup: null,
  fixture: { source: 'existing seeded KHACH_HANG account and currently free future seat', tag: tokenTag },
  tests: [],
  transactionGroups: [],
  verdict: 'BLOCKED',
};

const dbModule = await import('../../backend/src/db/pool.js');
const configModule = await import('../../backend/src/config/database.js');
const { createApp } = await import('../../backend/src/app.js');
const { databaseConfig } = configModule;
const appPool = await dbModule.getPool();
const controlPool = await new sql.ConnectionPool({
  ...databaseConfig,
  pool: { max: 2, min: 1, idleTimeoutMillis: 30000 },
  requestTimeout: 180000,
}).connect();
const originalPoolRequest = appPool.request.bind(appPool);
function serializeTxRequest(tx, action) {
  const current = txQueues.get(tx) ?? Promise.resolve();
  const next = current.then(action, action);
  txQueues.set(tx, next.catch(() => {}));
  return next;
}
appPool.request = (...args) => {
  const tx = appContext.getStore();
  if (!tx) return originalPoolRequest(...args);
  const request = tx.request(...args);
  for (const method of ['query', 'execute', 'batch', 'bulk']) {
    const original = request[method]?.bind(request);
    if (original) request[method] = (...methodArgs) => serializeTxRequest(tx, () => original(...methodArgs));
  }
  return request;
};

let httpServer = null;
const listeners = [];
let selectedAccount = null;
let authToken = null;
let userId = null;

function add(name, input, expected, actual, pass) {
  const verdict = pass ? 'PASS' : 'FAIL';
  evidence.tests.push({ name, input, expected, actual, verdict });
  if (!pass) throw new Error(`${name} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
}

function equalJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

async function identity(pool = controlPool) {
  const row = (await pool.request().query(`
    SELECT @@SERVERNAME AS serverName, DB_NAME() AS databaseName,
      CONVERT(nvarchar(30), DATABASEPROPERTYEX(DB_NAME(),'Status')) AS state,
      (SELECT is_read_committed_snapshot_on FROM sys.databases WHERE database_id=DB_ID()) AS rcsi,
      @@SPID AS sessionId
  `)).recordset[0];
  if (row.serverName !== 'DoanTuanIT' || row.databaseName !== 'CinemaBookingDB' || row.state !== 'ONLINE') {
    throw new Error(`Refusing wrong Main target: ${JSON.stringify(row)}`);
  }
  return row;
}

async function fingerprint() {
  const id = await identity();
  const tables = (await controlPool.request().query(`
    SELECT t.object_id, QUOTENAME(s.name)+'.'+QUOTENAME(t.name) AS qualifiedName,
      COALESCE((SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY ic.key_ordinal)
        FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
        JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE i.object_id=t.object_id AND i.is_primary_key=1),
        (SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY c.column_id)
         FROM sys.columns c WHERE c.object_id=t.object_id)) AS sortColumns
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    WHERE t.is_ms_shipped=0 ORDER BY t.object_id;
  `)).recordset;
  const rows = [];
  for (const table of tables) {
    const data = (await controlPool.request().query(`SELECT * FROM ${table.qualifiedName} ORDER BY ${table.sortColumns};`)).recordset;
    const encoded = JSON.stringify(data, (_key, value) => Buffer.isBuffer(value) ? value.toString('base64') : value);
    rows.push({ table: table.qualifiedName, count: data.length, sha256: createHash('sha256').update(encoded).digest('hex') });
  }
  const identities = (await controlPool.request().query(`
    SELECT OBJECT_SCHEMA_NAME(object_id) AS schemaName, OBJECT_NAME(object_id) AS tableName,
      name AS columnName, CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) AS identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id;
  `)).recordset;
  return { id, rows, identities };
}

async function backupAndVerify() {
  const dir = path.join(ROOT, '.audit-output', 'database-backups');
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `CinemaBookingDB_pre_backend_api_${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}_${tokenTag}.bak`;
  const backupPath = path.join(dir, fileName);
  const literal = backupPath.replaceAll("'", "''");
  await controlPool.request().batch(`
    BACKUP DATABASE [CinemaBookingDB] TO DISK=N'${literal}' WITH COPY_ONLY,CHECKSUM,COMPRESSION,INIT,STATS=10;
    RESTORE VERIFYONLY FROM DISK=N'${literal}' WITH CHECKSUM;
  `);
  const stat = fs.statSync(backupPath);
  evidence.backup = { path: path.relative(ROOT, backupPath), bytes: stat.size, copyOnly: true, checksum: true, restoreVerifyOnly: 'PASS' };
}

async function beginGroup(name) {
  const groupId = `main-api-${tokenTag}-${evidence.transactionGroups.length + 1}`;
  const tx = new sql.Transaction(appPool);
  await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  txSessions.set(groupId, tx);
  evidence.transactionGroups.push({ name, transactionId: groupId, started: true, rolledBack: false });
  const appTarget = await identity(appPool);
  if (appTarget.databaseName !== 'CinemaBookingDB' || appTarget.serverName !== 'DoanTuanIT') throw new Error('Backend pool target changed during test.');
  return { id: groupId, tx, group: evidence.transactionGroups.at(-1) };
}

async function rollbackGroup(group) {
  await (txQueues.get(group.tx) ?? Promise.resolve());
  const txCount = (await group.tx.request().query('SELECT @@TRANCOUNT AS transactionCount, XACT_STATE() AS transactionState')).recordset[0];
  group.group.transactionCountBeforeRollback = txCount.transactionCount;
  group.group.transactionStateBeforeRollback = txCount.transactionState;
  await group.tx.rollback();
  txSessions.delete(group.id);
  group.group.rolledBack = true;
  group.group.transactionCountAfterRollback = 0;
}

async function api(pathname, options = {}) {
  const headers = { accept: 'application/json' };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.txId) headers['x-audit-transaction'] = options.txId;
  const response = await fetch(`http://127.0.0.1:${httpServer.address().port}${pathname}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let body;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}

async function captureUser(user) {
  return (await controlPool.request().input('userId', sql.Int, user).query(`
    SELECT u.NguoiDungID, h.DiemTichLuy FROM dbo.NGUOIDUNG u
    LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID
    WHERE u.NguoiDungID=@userId;
  `)).recordset[0] ?? null;
}

async function pickAccount() {
  const activeStatus = 'Ho\u1ea1t \u0111\u1ed9ng';
  for (const candidate of accounts) {
    const result = await controlPool.request().input('email', sql.VarChar(150), candidate.email).query(`
      SELECT TOP(1) u.NguoiDungID, u.TrangThai, r.MaVaiTro, h.DiemTichLuy,
        (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE d.NguoiDungID=u.NguoiDungID
          AND d.TrangThai=N'Ch\u1edd thanh to\u00e1n' AND d.HanGiuCho>dbo.fn_BayGio()) AS activeHolds,
        dbo.fn_GioiHanDonDangGiu() AS maxActiveHolds
      FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
      LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID
      WHERE u.Email=@email AND r.MaVaiTro='KHACH_HANG';
    `);
    const row = result.recordset[0];
    if (row && row.TrangThai === activeStatus && Number(row.activeHolds) < Number(row.maxActiveHolds)) {
      return { candidate, row };
    }
  }
  throw new Error('No seeded active customer with available order-hold capacity was found.');
}

async function pickBookableFixture() {
  const row = (await controlPool.request().query(`
    SELECT TOP(1) v.SuatChieuID AS showtimeId, v.PhimID AS movieId, v.RapID AS cinemaId,
      v.PhongID AS roomId, v.ThoiGianBatDau AS startsAt,
      (SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(v.SuatChieuID) f
       WHERE f.TrangThaiGhe=N'Tr\u1ed1ng') AS availableSeats
    FROM dbo.vw_LichChieuChiTiet v
    WHERE v.IsBookable=1 AND v.ThoiGianBatDau>=DATEADD(hour,2,dbo.fn_BayGio())
      AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=v.SuatChieuID)
    ORDER BY v.ThoiGianBatDau,v.SuatChieuID;
  `)).recordset[0];
  if (!row || Number(row.availableSeats) < 1) throw new Error('No empty, future, bookable showtime with a free seat is available.');
  return row;
}

async function assertNoOpenTransactions() {
  const rows = (await controlPool.request().query(`
    SELECT DISTINCT s.session_id,s.program_name
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    WHERE dt.database_id=DB_ID() AND s.is_user_process=1;
  `)).recordset;
  return rows;
}

try {
  evidence.target = await identity(controlPool);
  evidence.before = await fingerprint();
  await backupAndVerify();

  const apiWrapper = require('express')();
  apiWrapper.use((req, res, next) => {
    const id = req.get('x-audit-transaction');
    if (!id) return next();
    const tx = txSessions.get(id);
    if (!tx) return res.status(500).json({ error: { code: 'AUDIT_TRANSACTION_NOT_FOUND' } });
    return appContext.run(tx, next);
  });
  apiWrapper.use(createApp());
  httpServer = apiWrapper.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    httpServer.once('listening', resolve);
    httpServer.once('error', reject);
  });
  evidence.backendMode.port = httpServer.address().port;

  const readGroup = await beginGroup('health, seeded customer authentication, permissions, and seat API');
  try {
    const health = await api('/api/health/db', { txId: readGroup.id });
    add('backend_database_health', 'GET /api/health/db; direct createApp bootstrap', { status: 200, body: { ok: true } }, health, health.status === 200 && health.body?.ok === true);

    const selection = await pickAccount();
    selectedAccount = selection.candidate;
    const login = await api('/api/auth/login', {
      method: 'POST', txId: readGroup.id,
      body: { Email: selectedAccount.email, MatKhau: selectedAccount.password },
    });
    authToken = login.body?.token;
    userId = Number(login.body?.user?.userId);
    const permissions = (login.body?.user?.permissions ?? []).map((permission) => permission.code);
    add('backend_auth_login_and_permissions', 'POST /api/auth/login; seeded customer credential from local audit manifest',
      { status: 200, role: 'KHACH_HANG', permissions: ['DAT_VE', 'THANH_TOAN'] },
      { status: login.status, role: login.body?.user?.role, permissionCodes: permissions, userId },
      login.status === 200 && Number.isInteger(userId) && login.body?.user?.role === 'KHACH_HANG' && permissions.includes('DAT_VE') && permissions.includes('THANH_TOAN'));

    const current = await api('/api/auth/me', { token: authToken, txId: readGroup.id });
    add('backend_auth_current_user', 'GET /api/auth/me; bearer token verifies through DB account and RBAC procedures',
      { status: 200, userId, role: 'KHACH_HANG' },
      { status: current.status, userId: current.body?.user?.userId, role: current.body?.user?.role },
      current.status === 200 && Number(current.body?.user?.userId) === userId && current.body?.user?.role === 'KHACH_HANG');

    const fixture = await pickBookableFixture();
    evidence.fixture.showtimeId = fixture.showtimeId;
    evidence.fixture.roomId = fixture.roomId;
    evidence.fixture.availableSeatsBefore = fixture.availableSeats;
    const seats = await api(`/api/showtimes/${fixture.showtimeId}/seats`, { txId: readGroup.id });
    const available = (seats.body?.seats ?? []).filter((seat) => seat.status === 'Tr\u1ed1ng');
    add('backend_seat_list', `GET /api/showtimes/${fixture.showtimeId}/seats`,
      { status: 200, atLeastOneAvailableSeat: true },
      { status: seats.status, seatRows: seats.body?.seats?.length ?? 0, availableSeats: available.length },
      seats.status === 200 && available.length > 0);
    evidence.fixture.seatId = available[0]?.id;
    evidence.fixture.seatLabel = available[0]?.label;
  } finally {
    await rollbackGroup(readGroup);
  }

  const afterRead = await fingerprint();
  add('read_only_api_group_rollback', 'all API reads/auth run inside outer transaction; rollback and all-table fingerprints',
    { rowsUnchanged: true, noOpenTransactions: true },
    { rowsUnchanged: equalJson(evidence.before.rows, afterRead.rows), openTransactions: await assertNoOpenTransactions() },
    equalJson(evidence.before.rows, afterRead.rows) && (await assertNoOpenTransactions()).length === 0);

  const fixtureBefore = await pickBookableFixture();
  const preUser = await captureUser(userId);
  evidence.fixture.userId = userId;
  evidence.fixture.pointsBefore = preUser?.DiemTichLuy ?? null;

  const previewGroup = await beginGroup('booking price preview API');
  try {
    const seats = await api(`/api/showtimes/${fixtureBefore.showtimeId}/seats`, { txId: previewGroup.id });
    const seat = (seats.body?.seats ?? []).find((item) => item.status === 'Tr\u1ed1ng');
    if (!seat) throw new Error('The selected fixture seat was not available at price-preview time.');
    evidence.fixture.seatId = seat.id;
    evidence.fixture.seatLabel = seat.label;
    const preview = await api('/api/bookings/preview', {
      method: 'POST', token: authToken, txId: previewGroup.id,
      body: { showtimeId: fixtureBefore.showtimeId, seatIds: [seat.id], products: [], points: 0 },
    });
    const data = preview.body?.preview;
    add('backend_booking_price_preview', 'POST /api/bookings/preview; same SQL procedure in preview/rollback mode',
      { status: 200, showtimeId: fixtureBefore.showtimeId, oneSeatPricePositive: true, totalMatchesSubtotal: true },
      { status: preview.status, showtimeId: data?.showtimeId, ticketTotal: data?.ticketTotal, productTotal: data?.productTotal, discountTotal: data?.discountTotal, total: data?.total },
      preview.status === 200 && Number(data?.showtimeId) === Number(fixtureBefore.showtimeId) && Number(data?.ticketTotal) > 0 && Number(data?.productTotal) === 0 && Number(data?.total) === Number(data?.ticketTotal) - Number(data?.discountTotal));
    evidence.fixture.preview = { ticketTotal: data.ticketTotal, total: data.total };
  } finally {
    await rollbackGroup(previewGroup);
  }
  const afterPreview = await fingerprint();
  add('preview_api_state_unchanged', 'preview transaction rolled back; all persistent table fingerprints',
    { rowsUnchanged: true, noOpenTransactions: true },
    { rowsUnchanged: equalJson(evidence.before.rows, afterPreview.rows), openTransactions: await assertNoOpenTransactions() },
    equalJson(evidence.before.rows, afterPreview.rows) && (await assertNoOpenTransactions()).length === 0);

  const paymentGroup = await beginGroup('successful booking, simulated payment attempt/callback, idempotent callback');
  try {
    const seatList = await api(`/api/showtimes/${fixtureBefore.showtimeId}/seats`, { txId: paymentGroup.id });
    const seat = (seatList.body?.seats ?? []).find((item) => item.status === 'Tr\u1ed1ng' && Number(item.id) === Number(evidence.fixture.seatId));
    if (!seat) throw new Error('The chosen seat is no longer available; transaction has not written anything.');

    const booking = await api('/api/bookings', {
      method: 'POST', token: authToken, txId: paymentGroup.id,
      body: { showtimeId: fixtureBefore.showtimeId, seatIds: [seat.id], products: [], points: 0 },
    });
    const order = booking.body?.booking;
    const pendingStatus = 'Ch\u1edd thanh to\u00e1n';
    add('backend_booking_create_success', 'POST /api/bookings; one available seat, no promotion/products/points',
      { status: 201, userId, showtimeId: fixtureBefore.showtimeId, ticketCount: 1, orderStatus: pendingStatus },
      { status: booking.status, orderId: order?.id, userId: order?.userId, showtimeId: order?.showtimeId, ticketCount: order?.ticketCount, total: order?.total, orderStatus: order?.status },
      booking.status === 201 && Number(order?.userId) === userId && Number(order?.showtimeId) === Number(fixtureBefore.showtimeId) && Number(order?.ticketCount) === 1 && Number(order?.total) > 0 && order?.status === pendingStatus);
    const orderId = Number(order.id);
    evidence.fixture.orderId = orderId;

    const detailBeforePayment = await api(`/api/orders/${orderId}`, { token: authToken, txId: paymentGroup.id });
    add('backend_order_detail_pending', `GET /api/orders/${orderId} before payment`,
      { status: 200, oneTicket: true, noPayments: true, orderStatus: pendingStatus },
      { status: detailBeforePayment.status, orderStatus: detailBeforePayment.body?.order?.status, tickets: detailBeforePayment.body?.order?.tickets?.length, payments: detailBeforePayment.body?.order?.payments?.length },
      detailBeforePayment.status === 200 && detailBeforePayment.body?.order?.status === pendingStatus && detailBeforePayment.body?.order?.tickets?.length === 1 && detailBeforePayment.body?.order?.payments?.length === 0);

    const attempt = await api(`/api/orders/${orderId}/payments`, {
      method: 'POST', token: authToken, txId: paymentGroup.id, body: { paymentMethod: 'VNPAY' },
    });
    const payment = attempt.body?.payment;
    const processingStatus = '\u0110ang x\u1eed l\u00fd';
    add('backend_payment_attempt', `POST /api/orders/${orderId}/payments; paymentMethod=VNPAY`,
      { status: 201, orderId, amount: order.total, method: 'VNPAY', statusText: processingStatus },
      { status: attempt.status, paymentId: payment?.id, orderId: payment?.orderId, amount: payment?.amount, method: payment?.method, paymentStatus: payment?.status },
      attempt.status === 201 && Number(payment?.orderId) === orderId && Number(payment?.amount) === Number(order.total) && payment?.method === 'VNPAY' && payment?.status === processingStatus);
    const paymentId = Number(payment.id);
    evidence.fixture.paymentId = paymentId;

    const rejectedCallback = await api(`/api/orders/${orderId}/payments/${paymentId}/result`, {
      method: 'POST', token: authToken, txId: paymentGroup.id, body: { status: 'INVALID_AUDIT_RESULT' },
    });
    add('backend_invalid_payment_result_refused', `POST /api/orders/${orderId}/payments/${paymentId}/result; invalid status`,
      { status: 400, errorCode: 'INVALID_PAYMENT_RESULT' },
      { status: rejectedCallback.status, errorCode: rejectedCallback.body?.error?.code },
      rejectedCallback.status === 400 && rejectedCallback.body?.error?.code === 'INVALID_PAYMENT_RESULT');

    const successText = 'Th\u00e0nh c\u00f4ng';
    const paid = await api(`/api/orders/${orderId}/payments/${paymentId}/result`, {
      method: 'POST', token: authToken, txId: paymentGroup.id,
      body: { status: successText },
    });
    const paidOrder = paid.body?.order;
    const paidPayment = paid.body?.payment;
    const paidStatus = '\u0110\u00e3 thanh to\u00e1n';
    add('backend_simulated_payment_success_callback', `POST /api/orders/${orderId}/payments/${paymentId}/result; callback status=success`,
      { status: 200, orderStatus: paidStatus, paymentStatus: successText, paidAtPresent: true },
      { status: paid.status, orderStatus: paidOrder?.status, paymentStatus: paidPayment?.status, paidAtPresent: Boolean(paidPayment?.paidAt), paymentAmount: paidPayment?.amount },
      paid.status === 200 && paidOrder?.status === paidStatus && paidPayment?.status === successText && Boolean(paidPayment?.paidAt) && Number(paidPayment?.amount) === Number(order.total));

    const pointsExpected = Number(preUser?.DiemTichLuy ?? 0) + Math.floor(Number(order.total) / 1000);
    const userAfterPayment = await api('/api/auth/me', { token: authToken, txId: paymentGroup.id });
    add('backend_payment_loyalty_side_effect', 'GET /api/auth/me after successful callback; points computed from paid total',
      { status: 200, points: pointsExpected },
      { status: userAfterPayment.status, points: userAfterPayment.body?.user?.loyaltyPoints },
      userAfterPayment.status === 200 && Number(userAfterPayment.body?.user?.loyaltyPoints) === pointsExpected);

    const duplicate = await api(`/api/orders/${orderId}/payments/${paymentId}/result`, {
      method: 'POST', token: authToken, txId: paymentGroup.id, body: { status: successText },
    });
    const pointsAfterDuplicate = await api('/api/auth/me', { token: authToken, txId: paymentGroup.id });
    add('backend_payment_callback_idempotent', 'repeat the same successful payment callback once; no duplicate rewards',
      { status: 200, paymentStatus: successText, pointsRemain: pointsExpected },
      { status: duplicate.status, paymentStatus: duplicate.body?.payment?.status, points: pointsAfterDuplicate.body?.user?.loyaltyPoints },
      duplicate.status === 200 && duplicate.body?.payment?.status === successText && Number(pointsAfterDuplicate.body?.user?.loyaltyPoints) === pointsExpected);
  } finally {
    await rollbackGroup(paymentGroup);
  }

  evidence.after = await fingerprint();
  const rowsUnchanged = equalJson(evidence.before.rows, evidence.after.rows);
  const identitiesAdvanced = evidence.after.identities.filter((current) => {
    const prior = evidence.before.identities.find((row) => row.schemaName === current.schemaName && row.tableName === current.tableName && row.columnName === current.columnName);
    return prior?.identityValue !== current.identityValue;
  }).map((current) => ({ table: `${current.schemaName}.${current.tableName}`, column: current.columnName,
    before: evidence.before.identities.find((row) => row.schemaName === current.schemaName && row.tableName === current.tableName && row.columnName === current.columnName)?.identityValue,
    after: current.identityValue }));
  evidence.integrity = {};
  const constraints = await controlPool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS,NO_INFOMSGS;');
  const checkDb = await controlPool.request().query("DBCC CHECKDB(N'CinemaBookingDB') WITH NO_INFOMSGS,ALL_ERRORMSGS;");
  const openTransactions = await assertNoOpenTransactions();
  evidence.integrity = { rowsUnchanged, identitiesAdvanced, checkConstraintFindings: (constraints.recordsets ?? []).flat().length,
    checkDbFindings: (checkDb.recordsets ?? []).flat().length, openTransactions };
  add('post_api_rollback_main_integrity', 'all persistent table fingerprints; CHECKCONSTRAINTS; CHECKDB; open transaction DMV',
    { rowsUnchanged: true, checkConstraintFindings: 0, checkDbFindings: 0, openTransactions: 0, identityAdvancesRecorded: true },
    evidence.integrity,
    rowsUnchanged && evidence.integrity.checkConstraintFindings === 0 && evidence.integrity.checkDbFindings === 0 && openTransactions.length === 0);
  evidence.verdict = evidence.tests.every((test) => test.verdict === 'PASS') ? 'PASS' : 'FAIL';
} catch (error) {
  evidence.verdict = 'FAIL';
  evidence.error = error.message;
  evidence.stack = error.stack;
} finally {
  for (const [id, tx] of txSessions) {
    try { await tx.rollback(); } catch { /* preserve original failure and verify Main below */ }
    txSessions.delete(id);
  }
  if (httpServer) {
    httpServer.closeAllConnections?.();
    await new Promise((resolve) => httpServer.close(() => resolve()));
  }
  if (userId) {
    try { evidence.fixture.userPointsAfterRollback = (await captureUser(userId))?.DiemTichLuy ?? null; } catch (error) { evidence.fixture.userPointsAfterRollbackError = error.message; }
  }
  try {
    evidence.finishedUtc = new Date().toISOString();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  } finally {
    await controlPool.close().catch(() => {});
    await dbModule.closePool().catch(() => {});
  }
  console.log(JSON.stringify({ verdict: evidence.verdict, target: evidence.target && { serverName: evidence.target.serverName, databaseName: evidence.target.databaseName, state: evidence.target.state },
    backendMode: evidence.backendMode, tests: evidence.tests.map((test) => ({ name: test.name, verdict: test.verdict })),
    integrity: evidence.integrity ?? null, error: evidence.error, evidence: path.relative(ROOT, OUT) }, null, 2));
  if (evidence.verdict !== 'PASS') process.exitCode = 1;
}

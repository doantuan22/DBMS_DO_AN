import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';

// Regression guard: every business error number (THROW 5xxxx) raised by the SQL sources must be mapped by the
// service of the flow that can raise it, or be listed below with the reason it cannot reach the API.
// Flows: auth | booking | orders (booking payments) | feedback (reviews, complaints) | manager | support | admin.
// The admin flow is additionally covered by the behavioural table in adminService.test.js.
const DB = new URL('../../database/', import.meta.url);
const SERVICES = new URL('../src/services/', import.meta.url);

// service files that must map the codes of a flow
const FLOW_SERVICES = {
  auth: ['authService.js'],
  booking: ['bookingService.js'],
  orders: ['orderService.js'],
  feedback: ['feedbackService.js'],
  manager: ['managerService.js'],
  support: ['supportService.js'],
  admin: ['adminService.js'],
};

// Which flow(s) a code belongs to. Triggers and the pricing trigger are shared, so they are listed by code first.
const CODE_FLOWS = { 50001: ['manager', 'admin'], 50002: ['booking'], 50003: ['booking'], 50004: ['feedback'], 50005: ['support'], 50215: ['manager', 'admin'] };
const FOLDER_FLOWS = [['procedures/auth/', ['auth']], ['procedures/manager/', ['manager']], ['procedures/support/', ['support']], ['procedures/admin/', ['admin']]];
const MIGRATION_FLOWS = { '003': ['feedback'], '004': ['manager'], '005': ['support'], '006': ['support'], '008': ['admin'], '009': ['admin'], '010': ['admin'], '011': ['admin'], '012': ['booking', 'orders'], '013': ['admin', 'manager'] };

function flowsOf(file, code) {
  if (CODE_FLOWS[code]) return CODE_FLOWS[code];
  for (const [prefix, flows] of FOLDER_FLOWS) if (file.startsWith(prefix)) return flows;
  const migration = /^migrations\/(\d{3})_/.exec(file)?.[1];
  if (migration && MIGRATION_FLOWS[migration]) {
    // 012 carries booking codes 50020-50029 and order/payment codes 50030-50039, 50111-50119
    if (migration === '012') return (code >= 50020 && code <= 50029) ? ['booking'] : ['orders'];
    return MIGRATION_FLOWS[migration];
  }
  if (file.startsWith('procedures/customer/')) {
    if (code >= 50040 && code <= 50042) return ['feedback'];
    return (code >= 50020 && code <= 50029) ? ['booking'] : ['orders'];
  }
  return ['unassigned'];
}

// Codes that are thrown but intentionally have no service mapping. Each entry must say why the API cannot return it.
const EXEMPT = {
  'booking:50002': 'trigger TRG_ChiTietVe_KiemTraGheDungPhong: sp_Booking_Create already rejects seats outside the room with 50024 before inserting',
  'orders:50034': 'sp_Order_Cancel is not in the procedure whitelist and has no route (dead from the application)',
  'orders:50035': 'sp_Order_Cancel is not in the procedure whitelist and has no route (dead from the application)',
  'auth:50016': 'sp_User_GetCurrent: the authenticate middleware turns any non-HTTP error into 401',
  'support:50005': 'trigger TRG_XuLyKhieuNai_KiemTraVaiTro: the support procedures check the permission first (50060), so an authorised caller cannot reach it',
};

function sqlSources(extra = {}) {
  const sources = { ...extra };
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(new URL(dir, DB), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(`${dir}${entry.name}/`, `${prefix}${entry.name}/`);
      else if (entry.name.endsWith('.sql')) sources[`${prefix}${entry.name}`] = readFileSync(new URL(`${dir}${entry.name}`, DB), 'utf8');
    }
  };
  for (const dir of ['procedures/', 'triggers/', 'functions/', 'migrations/']) walk(dir, dir);
  return sources;
}

function thrownCodes(sources) {
  const thrown = new Map(); // `${flow}:${code}` -> files
  for (const [file, sql] of Object.entries(sources)) {
    for (const match of sql.matchAll(/THROW\s+(5\d{4})\s*,/g)) {
      const code = Number(match[1]);
      for (const flow of flowsOf(file, code)) {
        const key = `${flow}:${code}`;
        thrown.set(key, [...(thrown.get(key) ?? []), file]);
      }
    }
  }
  return thrown;
}

function mappedCodes(flow) {
  const codes = new Set();
  for (const name of FLOW_SERVICES[flow] ?? []) {
    const text = readFileSync(new URL(name, SERVICES), 'utf8');
    for (const match of text.matchAll(/(?:case\s+|:\s*)(5\d{4})\b/g)) codes.add(Number(match[1]));
  }
  return codes;
}

export function unmappedCodes(extraSources = {}) {
  const problems = [];
  const mapped = Object.fromEntries(Object.keys(FLOW_SERVICES).map((flow) => [flow, mappedCodes(flow)]));
  for (const [key, files] of thrownCodes(sqlSources(extraSources))) {
    const [flow, code] = key.split(':');
    if (flow === 'unassigned') problems.push(`${code} (thrown in ${files[0]}) is not assigned to any flow`);
    else if (!mapped[flow].has(Number(code)) && !EXEMPT[key]) problems.push(`${code} (${files[0]}) is not mapped by ${FLOW_SERVICES[flow].join(', ')}`);
  }
  return problems;
}

test('every error number thrown by the SQL sources is mapped by its flow service or explicitly exempt', () => {
  const thrown = thrownCodes(sqlSources());
  assert.ok(thrown.size >= 90, `the scan found only ${thrown.size} flow/code pairs; the SQL sources were not read`);
  for (const flow of Object.keys(FLOW_SERVICES)) assert.ok([...thrown.keys()].some((key) => key.startsWith(`${flow}:`)), `no codes found for flow ${flow}`);
  assert.deepEqual(unmappedCodes(), []);
});

test('exemptions are real: each exempt code is still thrown and still unmapped, and carries a reason', () => {
  const thrown = thrownCodes(sqlSources());
  for (const [key, reason] of Object.entries(EXEMPT)) {
    const [flow, code] = key.split(':');
    assert.ok(reason.length > 20, `${key} needs a reason`);
    assert.ok(thrown.has(key), `${key} is exempt but no longer thrown: remove the exemption`);
    assert.ok(!mappedCodes(flow).has(Number(code)), `${key} is exempt but is now mapped: remove the exemption`);
  }
});

test('the guard detects a new unmapped code in every flow and an unassigned location', () => {
  for (const [file, flow] of [['procedures/customer/x.sql', 'booking'], ['migrations/012_x.sql', 'orders'], ['procedures/manager/x.sql', 'manager'], ['procedures/support/x.sql', 'support'], ['procedures/admin/x.sql', 'admin'], ['procedures/auth/x.sql', 'auth']]) {
    const problems = unmappedCodes({ [file]: "THROW 59999, N'fake', 1;" });
    assert.equal(problems.length, 1, `${flow}: ${problems}`);
    assert.match(problems[0], /59999/);
  }
  assert.match(unmappedCodes({ 'somewhere/else.sql': "THROW 59999, N'fake', 1;" })[0] ?? '', /not assigned to any flow/);
});

test('flow ownership of the shared codes: showtime overlap and pricing overlap are mapped by manager and admin', () => {
  for (const code of [50001, 50215]) for (const flow of ['manager', 'admin']) assert.ok(mappedCodes(flow).has(code), `${flow} must map ${code}`);
});

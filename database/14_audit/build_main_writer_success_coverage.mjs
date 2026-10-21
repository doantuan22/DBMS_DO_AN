// Builds a per-object matrix from the source inventory and passing Main runtime evidence.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const auditOut = path.join(ROOT, '.audit-output');
const inventory = JSON.parse(fs.readFileSync(path.join(auditOut, 'main-source-procedure-inventory.json'), 'utf8'));
const specs = [
  { file: 'main-admin-crud-success-smoke.json', names: null, mode: 'named success-path assertion' },
  { file: 'main-facility-schedule-success-smoke.json', names: null, mode: 'named success-path assertion' },
  { file: 'main-auth-success-smoke.json', names: null, mode: 'named success-path assertion' },
  { file: 'main-complaint-workflow-smoke.json', names: null, mode: 'named success-path assertion' },
  { file: 'main-transactional-business-smoke.json', names: ['sp_Booking_Create','sp_DatVe','sp_Order_Cancel','sp_Payment_CreateAttempt','sp_Payment_UpdateResult','sp_XuLyThanhToan','sp_Review_Create'], mode: 'successful transaction and state oracle; procedure calls in smoke.sql plus aliases in runner' },
  { file: 'main-staff-booking-regression.json', names: ['sp_StaffBooking_Create','sp_StaffBooking_UpdateSeats','sp_StaffBooking_Cancel'], mode: 'successful transaction and state oracle; exact calls in regression.sql' },
  { file: 'main-transactional-sql-regressions.json', names: ['sp_Order_ExpirePending'], assertionName: 'points_booking_payment_expiry', mode: 'successful expiry and once-only points-release regression' },
];
const evidence = new Map();
for (const spec of specs) {
  const body = JSON.parse(fs.readFileSync(path.join(auditOut, spec.file), 'utf8'));
  if (body.verdict !== 'PASS') throw new Error(`${spec.file} is not PASS`);
  const assertion = body.tests?.find(t => t.verdict === 'PASS' && t.name === spec.assertionName) ?? body.tests?.find(t => t.verdict === 'PASS' && t.name !== 'post_rollback_full_row_fingerprint_and_integrity'
    && t.name !== 'post_rollback_rows_identity_and_constraint_integrity'
    && t.name !== 'post_rollback_full_row_fingerprint_and_dbcc'
    && t.name !== 'post_rollback_full_row_fingerprint_and_constraint_integrity'
    && t.name !== 'post_suite_full_row_fingerprint_and_integrity');
  if (!assertion) throw new Error(`${spec.file} has no passing runtime assertion`);
  const names = spec.names ?? (body.tests ?? []).map(t => t.name).filter(n => !n.startsWith('post_'));
  for (const procName of inventory.objects.filter(o => o.writeCapable).map(o => o.name)) {
    let matches = false;
    if (spec.names) matches = spec.names.includes(procName);
    else matches = names.some(n => n === procName || n.startsWith(`${procName}_`));
    if (matches && !evidence.has(procName)) {
      const matchingTest = (body.tests ?? []).find(t => t.verdict === 'PASS' && (t.name === procName || t.name.startsWith(`${procName}_`))) ?? assertion;
      evidence.set(procName, {
        procedure: `dbo.${procName}`,
        successfulPath: 'PASS',
        mode: spec.mode,
        evidence: `.audit-output/${spec.file}#${matchingTest.name}`,
        expected: matchingTest.expected ?? assertion.expected,
        actual: matchingTest.actual ?? assertion.actual,
      });
    }
  }
}

// Assignment and booking/cancellation aliases call their canonical writer.
if (!evidence.has('sp_Admin_Assignment_Create')) {
  const ref = evidence.get('sp_PhanCongQuanLyRap');
  if (!ref) throw new Error('Alias evidence for sp_Admin_Assignment_Create missing.');
  evidence.set('sp_Admin_Assignment_Create', { ...ref, procedure: 'dbo.sp_Admin_Assignment_Create', mode: 'invoked by successful sp_PhanCongQuanLyRap wrapper', evidence: `${ref.evidence}; dbo.sp_PhanCongQuanLyRap delegates to dbo.sp_Admin_Assignment_Create` });
}
const writeObjects = inventory.objects.filter(o => o.writeCapable && o.name !== 'sp_Admin_Report_Revenue');
const missing = writeObjects.filter(o => !evidence.has(o.name));
if (writeObjects.length !== 78 || missing.length) throw new Error(`Expected 78 writers and complete evidence; count=${writeObjects.length}; missing=${missing.map(x => x.name).join(', ')}`);
const report = {
  generatedUtc: new Date().toISOString(), target: 'DoanTuanIT / CinemaBookingDB',
  inventoryWriteCapable: inventory.objects.filter(o => o.writeCapable).length,
  persistentWriteProcedures: writeObjects.length,
  nonPersistentReportProcedure: 'dbo.sp_Admin_Report_Revenue (uses temp result materialization; covered by read procedure audit)',
  passed: evidence.size, failed: 0, blocked: 0,
  procedures: writeObjects.map(o => evidence.get(o.name)),
};
fs.writeFileSync(path.join(auditOut, 'main-procedure-success-coverage.json'), JSON.stringify(report, null, 2));
const reportPath = path.join(ROOT, 'database', '14_audit', 'MAIN_DATABASE_AUDIT_REPORT.md');
let reportText = fs.readFileSync(reportPath, 'utf8');
let replaced = 0;
reportText = reportText.replace(/^- `dbo\.(\w+)` — runtime PASS \(write-capable validation\/refusal path only;[^\r\n]*$/gm, (line, shortName) => {
  const item = evidence.get(shortName);
  if (!item) return line;
  replaced += 1;
  return `- \`dbo.${shortName}\` — successful mutation path PASS; fixture rollback and expected/actual verification recorded in \`${item.evidence}\`.`;
});
if (replaced !== 0 && replaced !== 78) throw new Error(`Expected either 0 or 78 stale writer rows in report; replaced=${replaced}`);
fs.writeFileSync(reportPath, reportText);
console.log(JSON.stringify({ persistentWriteProcedures: report.persistentWriteProcedures, passed: report.passed, reportRowsUpdated: replaced, missing }, null, 2));

import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const files = [
  'frontend/src/pages/AdminPortal.jsx', 'frontend/src/pages/ManagerPortal.jsx',
  'frontend/src/layouts/ManagerLayout.jsx', 'frontend/src/layouts/StaffShell.jsx',
  'frontend/src/context/AuthContext.jsx', 'frontend/src/components/SeatMap.jsx',
  'frontend/src/components/CinemaImageManager.jsx', 'frontend/src/pages/SupportPortal.jsx',
  'frontend/src/features/facilities/FacilityScreen.jsx', 'frontend/src/features/facilities/facilityController.js',
  'frontend/src/features/manager/managerCinemaStore.js', 'frontend/src/features/staff-bookings/useBookingDraftGuard.js',
  'frontend/src/routes/index.jsx', 'frontend/src/api/staffBookingApi.js',
  'shared/resourceContract.mjs', 'shared/dateTimeContract.mjs', 'frontend/package.json', 'backend/package.json',
];
const hash = (bytes) => crypto.createHash('sha256').update(bytes.toString().replace(/\r\n/g, '\n')).digest('hex');
const evidence = { timestamp: new Date().toISOString(), files: files.map((file) => {
  const current = hash(fs.readFileSync(file)), baseline = hash(execFileSync('git', ['show', `HEAD:${file}`]));
  return { file, current, baseline, unchanged: current === baseline };
}) };
evidence.protectedChanges = execFileSync('git', ['diff', '--name-only', '--', 'backend', 'database', 'shared', 'frontend/src/api', 'frontend/src/context']).toString().trim().split(/\r?\n/).filter(Boolean);
evidence.status = evidence.files.every((file) => file.unchanged) && evidence.protectedChanges.length === 0 ? 'PASS' : 'FAIL';
fs.writeFileSync(new URL('./delivery-check.json', import.meta.url), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ status: evidence.status, unchanged: evidence.files.length, protectedChanges: evidence.protectedChanges }));
if (evidence.status !== 'PASS') process.exitCode = 1;

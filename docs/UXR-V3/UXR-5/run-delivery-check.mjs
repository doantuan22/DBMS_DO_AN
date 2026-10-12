import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), checks = [];
const check = (label, passed, details = {}) => checks.push({ label, status: passed ? 'PASS' : 'FAIL', ...details });
const json = (name) => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const baseline = json('source-baseline.json'), suite = json('browser-suite.json'), final = json('final-checks.json'), after = json('final-after-screens.json');
check('Actual before-source snapshot remains intact', baseline.files.every((file) => hash(path.join(baseline.target, file.file)) === file.hash), { files: baseline.files.length });
check('Final automated/lint/build/preservation checks pass', final.status === 'PASS' && final.checks.every((c) => c.status === 'PASS'), { checks: final.checks });
check('Sequential real-browser suite and fixture/history/RBAC restoration pass', suite.status === 'PASS' && suite.preservation === 'PASS' && suite.runs.length === 8 && suite.browserChecks === 146, { browserChecks: suite.browserChecks, beforeHash: suite.before.hash, afterHash: suite.after.hash });
check('Final current-source responsive capture pass with no console/runtime errors', after.status === 'PASS' && after.checks.length === 50 && after.runtimeErrors.length === 0 && after.consoleErrors.length === 0);
const records = suite.runs.filter((r) => r.status === 'PASS').flatMap((r) => json(r.report).requests);
const errors = records.filter((r) => Number(r.status) >= 500); check('Final suite has no application HTTP 5xx', errors.length === 0, { networkRecords: records.length, http5xx: errors });
const diff = spawnSync('git', ['diff', '--check'], { encoding: 'utf8', windowsHide: true }); check('git diff --check', diff.status === 0, { exitCode: diff.status });
const untouched = spawnSync('git', ['diff', '--name-only', '--', 'backend', 'database', 'shared', 'frontend/src/api', 'frontend/src/context', 'frontend/src/features/operations', 'frontend/src/features/staff-bookings', 'frontend/src/utils/managerForms.js', 'frontend/src/routes/ManagerSectionRoute.jsx'], { encoding: 'utf8', windowsHide: true });
// UXR4 working changes are checked against the pre-UXR5 snapshot rather than HEAD.
const forbiddenChanges = untouched.stdout.split(/\r?\n/).filter(Boolean).filter((file) => !baseline.files.some((f) => f.file === file && hash(file) === f.hash));
check('No UXR5 changes to backend/DB/shared/API/auth/Uxr4 business source', untouched.status === 0 && forbiddenChanges.length === 0, { unexpected: forbiddenChanges });
const sourceFiles = [];
const walk = (root) => { for (const entry of fs.readdirSync(root, { withFileTypes: true })) { const file = path.join(root, entry.name); if (entry.isDirectory()) walk(file); else if (entry.isFile()) sourceFiles.push(file); } };
for (const area of ['admin-resources', 'admin-workspace', 'admin-service', 'admin-analytics']) walk(path.resolve('frontend/src/features', area));
const businessSql = sourceFiles.filter((file) => /\b(?:SELECT\s+.+\s+FROM\s+dbo\.|INSERT\s+INTO\s+dbo\.|UPDATE\s+dbo\.|DELETE\s+FROM\s+dbo\.|EXEC\s+dbo\.)/i.test(fs.readFileSync(file, 'utf8')));
check('Frontend feature code contains no raw business SQL', businessSql.length === 0, { unexpected: businessSql });
sourceFiles.push(path.resolve('frontend/src/layouts/AdminLayout.jsx'), path.resolve('frontend/src/routes/AdminSectionRoute.jsx'), path.resolve('frontend/src/routes/index.jsx'), path.resolve('frontend/src/components/NamedResourceSelect.jsx'), path.resolve('frontend/tests/adminResources.test.js'), path.resolve('frontend/tests/adminServiceAnalytics.test.js'));
const docs = ['UXR-5_FINAL_REPORT.md', 'TEST_EVIDENCE.md', 'BROWSER_EVIDENCE.md', 'ACCEPTANCE_CHECKLIST.md', 'API_UI_CAPABILITY_MATRIX.md', 'SCREEN_SPEC.md'], broken = [];
for (const name of docs) for (const match of fs.readFileSync(path.join(directory, name), 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
  const target = match[1].split('#')[0]; if (target && !/^https?:\/\//i.test(target) && !fs.existsSync(path.resolve(directory, target))) broken.push({ document: name, target });
}
check('All delivery Markdown links resolve', broken.length === 0, { broken });
const modules = ['5A-users', '5A-assignments', '5B-movies', '5B-actors', '5B-genres', '5C-products', '5C-promotions', '5D-complaints', '5D-overview', '5D-revenue'];
check('Before/after at all 5 required widths exist', ['before', 'after'].every((side) => modules.every((module) => [390, 768, 1280, 1440, 1920].every((width) => fs.existsSync(path.join(directory, 'screenshots', side, `${module}-${width}.png`))))), { before: 50, finalAfter: 50 });
const evidence = { timestamp: new Date().toISOString(), status: checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL', checks, finalSource: sourceFiles.sort().map((file) => ({ file: path.relative(process.cwd(), file).replaceAll('\\', '/'), hash: hash(file) })) };
fs.writeFileSync(path.join(directory, 'delivery-check.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify({ status: evidence.status, checks })); if (evidence.status === 'FAIL') process.exitCode = 1;

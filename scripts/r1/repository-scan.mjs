// Read-only source scan, including immutable legacy and audit evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, read, write } from '../db/lib.mjs';
const skip = new Set(['.git', 'node_modules', 'dist', '.clean-clone', '.r0-clean-clone', '.aws', '.codex', '.agents']);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => skip.has(e.name) || e.isSymbolicLink() ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(root).filter(f => /\.(?:sql|js|jsx|mjs|md|json|txt)$/.test(f) && !f.endsWith('.local.json'));
const magic = /DATEADD\s*\(\s*(?:HOUR\s*,\s*[+-]?7\b|MINUTE\s*,\s*[+-]?420\b|SECOND\s*,\s*[+-]?25200\b)|25200000|set(?:UTC)?Hours\([^\n]*[+-]\s*7\b|[+-]\s*7\s*\*\s*(?:60|3600000)|fixTimezone|addVietnamOffset|subtractTimezone|convertHack/i;
const suspect = /toISOString\(\)\.slice|new Date\((?:input\.|datetimeLocal)|toLocaleString\(['"]vi-VN['"]\)/;
const usages = /new Date|Date\.(?:now|parse)|toISOString|toLocale|[gs]et(?:UTC)?Hours|getTimezoneOffset|Intl\.DateTimeFormat|datetime-local|type=["']date["']|Temporal\./;
const classify = file => file.includes('_legacy_snapshot/') ? 'IMMUTABLE_LEGACY'
  : /^(?:audit\/|database\/_audit\/|docs\/audit[^/]*\/)/.test(file) || /REBUILD_REPORT|AUDIT/.test(file) ? 'AUDIT_EVIDENCE'
  : file.endsWith('.md') ? 'DOCUMENTATION'
  : file.startsWith('scripts/') ? 'OFFLINE_TOOL_OR_SCAN_RULE'
  : /\/(?:tests?|11_tests)\//.test(file) ? 'REGRESSION_FIXTURE'
  : /^(backend\/src\/|frontend\/src\/|shared\/|database\/)/.test(file) ? 'ACTIVE_SOURCE' : 'OTHER_REVIEW';
const hits = [], temporalUsages = [];
for (const absolute of files) {
  const file = path.relative(root, absolute).replaceAll('\\', '/');
  if (file.endsWith('repository-static-scan.json')) continue;
  for (const [i, source] of read(absolute).split(/\r?\n/).entries()) {
    if (magic.test(source) || suspect.test(source)) hits.push({ file, line: i + 1, classification: classify(file), kind: magic.test(source) ? 'MAGIC_OFFSET_PATTERN' : 'DATE_CONVERSION_REVIEW', source: source.trim().slice(0, 240) });
    if (/^(backend\/src\/|frontend\/src\/|shared\/)/.test(file) && usages.test(source)) temporalUsages.push({ file, line: i + 1, category: /datetime-local|type=["']date["']/.test(source) ? 'INPUT' : /Date\.parse/.test(source) ? 'COMPARISON_OR_VALIDATED_PARSE' : /Date\.now/.test(source) ? 'COUNTDOWN_OR_NOW' : /format|Intl|toLocale/.test(source) ? 'DISPLAY' : 'API_PARSE_OR_NOW', source: source.trim().slice(0, 300) });
  }
}
const active = hits.filter(h => h.classification === 'ACTIVE_SOURCE');
assert.equal(active.length, 0, JSON.stringify(active));
const other = hits.filter(h => h.classification === 'OTHER_REVIEW');
assert.equal(other.length, 0, JSON.stringify(other));
const counts = Object.fromEntries([...new Set(hits.map(h => h.classification))].map(c => [c, hits.filter(h => h.classification === c).length]));
write(path.join(root, 'audit/remediation/evidence/repository-static-scan.json'), { status: 'PASS', filesScanned: files.length, activeFindings: active, reviewedExceptions: counts, hits, temporalUsages, note: 'Legacy/evidence preserve the original defect; documentation/scan rules name prohibited patterns. These are not runtime conversions. DATE PlainDate.toLocaleString is calendar display with no timezone conversion.' });
console.log(JSON.stringify({ status: 'PASS', filesScanned: files.length, activeFindings: active.length, reviewedExceptions: counts }));

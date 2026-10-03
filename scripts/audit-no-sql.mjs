// Scans backend/src and backend/tests for raw SQL and forbidden data-access APIs.
// Comments are stripped first, so only executable code (including string literals) is judged.
// Usage: node scripts/audit-no-sql.mjs   (exit code 1 when a violation is found)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['backend/src', 'backend/tests'];

const SQL_KEYWORDS = [
  /\bSELECT\b/i, /\bINSERT\b/i, /\bUPDATE\b/i, /(?<!\.)\bDELETE\b/i, /\bMERGE\b/i,
  /(?<!\.)\bJOIN\b/i, /\bGROUP\s+BY\b/i, /\bHAVING\b/i,
  /\bBEGIN\s+TRAN/i, /\bCOMMIT\b/i, /\bROLLBACK\b/i,
];
const FORBIDDEN_APIS = [
  /\.query\s*\(/, /\braw\s*\(/, /\$queryRaw/, /createQueryBuilder/,
  /\bprisma\b/i, /\bsequelize\b/i, /\bknex\b/i, /\btypeorm\b/i,
  /\brawQuery\b/, /\bexecuteSql\b/, /\brunSql\b/,
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === 'node_modules') return [];
    return statSync(full).isDirectory() ? listFiles(full) : /\.(m?js|cjs|jsx|ts)$/.test(name) ? [full] : [];
  });
}

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

const violations = [];
const reviewed = [];
let scanned = 0;
for (const target of targets) {
  for (const file of listFiles(join(root, target))) {
    scanned += 1;
    stripComments(readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
      const location = relative(root,file).replaceAll('\\','/');
      for (const re of FORBIDDEN_APIS) {
        if (re.test(line)) violations.push(`${location}:${i + 1}  ${re}  ->  ${line.trim()}`);
      }
      for (const re of SQL_KEYWORDS) {
        if(!re.test(line)) continue;
        // Narrow reviewed categories. Forbidden DB APIs are always checked above, even in tests.
        const harmless =
          (location==='backend/src/services/adminService.js' && (/const statement = \/\^The/.test(line) || /if \(statement === 'DELETE'\)/.test(line))) ||
          (location==='backend/src/services/bookingService.js' && line.includes("'Select at least one seat.'")) ||
          (location.startsWith('backend/tests/') && (/\btest\('/.test(line) || /assert\.match\(/.test(line) || /const resultSets = body\.split/.test(line) || /statement conflicted|Cannot insert duplicate key/i.test(line) || /\bconst update =|promotionWrite\(\{?\s*(?:\.\.\.)?update/.test(line)));
        const finding = `${location}:${i + 1} ${line.trim()}`;
        if(harmless) reviewed.push(finding); else violations.push(`${finding} (${re})`);
      }
    });
  }
}

const deps = JSON.parse(readFileSync(join(root, 'backend/package.json'), 'utf8')).dependencies ?? {};
for (const banned of ['prisma', '@prisma/client', 'sequelize', 'knex', 'typeorm']) {
  if (banned in deps) violations.push(`backend/package.json depends on ${banned}`);
}

console.log(`Scanned ${scanned} files.`);
console.log(`Reviewed non-SQL keyword matches: ${new Set(reviewed).size}.`);
if (violations.length) {
  console.log('NO RAW BUSINESS SQL IN BACKEND = FAIL');
  violations.forEach((v) => console.log('  ' + v));
  process.exit(1);
}
console.log('NO RAW BUSINESS SQL IN BACKEND = PASS');

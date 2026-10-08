// Replay existing offline checkers with writes redirected to R5.5 evidence.
// Historical expectations are not changed and their failures are not relabeled PASS.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { root, read, write } from '../db/lib.mjs';
const dataUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const libUrl = pathToFileURL(path.join(root, 'scripts/db/lib.mjs')).href;
const wrapper = dataUrl(`import * as lib from ${JSON.stringify(libUrl)};
  import path from 'node:path'; export * from ${JSON.stringify(libUrl)};
  export function write(file,value) {
    const relative=path.relative(lib.root,file).replaceAll('\\\\','/');
    if(!['r51','r52','r53','r54'].some(phase=>relative.startsWith('docs/evidence/'+phase+'/'))) throw new Error('Unrecognized historical output path: '+relative);
    const redirect='docs/evidence/r55/historical-replay/'+relative.slice('docs/evidence/'.length);
    lib.write(path.join(lib.root,redirect),value);
  }`);
const results = [];
const expectedDifferences = {
  r51: new Set(['17 seed files moved once with identical bytes', 'Expanded seed/build/reset SQL exactly preserved', 'Only scoped tracked files changed', 'Fixture sources retained; groups documented without SQL placeholders']),
  r52: new Set(['R5.1 source, base data, dynamic SQL, fixtures, API/schema/UI and orchestration preserved']),
  r53: new Set(['SQL source structure, one DB clock, UTC/business date contract, showtime-only writes', 'Base, schema, contracts, callers/fixtures, R5.1/R5.2 evidence and orchestration preserved']),
  r54: new Set(['R0–R5.3 source and evidence preserved']),
};
for (const phase of ['r51', 'r52', 'r53', 'r54']) {
  const original = read(path.join(root, 'scripts', phase, 'checks.mjs'));
  const adapted = original.replaceAll("'../db/lib.mjs'", JSON.stringify(wrapper))
    .replaceAll("'../../backend/src/utils/password.js'", JSON.stringify(pathToFileURL(path.join(root, 'backend/src/utils/password.js')).href));
  const child = spawnSync(process.execPath, ['--input-type=module'], { input: adapted, cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const dir = path.join(root, 'docs/evidence/r55/historical-replay', phase);
  write(path.join(dir, 'console.txt'), child.stdout + child.stderr);
  const resultFile = path.join(dir, 'checks.json');
  const result = fs.existsSync(resultFile) ? JSON.parse(read(resultFile)) : null;
  const failures = result?.checks.filter(check => check.status !== 'PASS') || [{ error: child.stderr }];
  results.push({ phase, exitCode: child.status, expectation: 'Unmodified historical source snapshots',
    originalEvidenceOverwritten: false, result: result?.status || 'CHECKER ERROR',
    passed: result?.checks.filter(check => check.status === 'PASS').length,
    total: result?.checks.length,
    failures: failures.map(failure => ({ ...failure, classification: expectedDifferences[phase].has(failure.name) ? 'Known phase snapshot / exact alias-text expectation; see current R55 guards and live results' : 'UNEXPECTED REGRESSION' })),
    evidence: `${phase}/checks.json` });
  console.log(`${phase}: ${results.at(-1).passed}/${results.at(-1).total} original checks accepted; exit=${child.status}; historical parity requires review`);
}
write(path.join(root, 'docs/evidence/r55/historical-replay/summary.json'), {
  status: 'HISTORICAL RESULTS; NOT CURRENT ACCEPTANCE', capturedAt: new Date().toISOString(),
  method: 'Original check logic/imports retained; only write() is routed to this R5.5 output directory', results,
});
if (results.some(result => result.failures.some(failure => failure.classification === 'UNEXPECTED REGRESSION'))) process.exitCode = 1;

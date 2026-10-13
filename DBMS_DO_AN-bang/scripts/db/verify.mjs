import path from 'node:path';
import { dbRoot, audit, read, write, normalizeModule } from './lib.mjs';
import { inventory } from './inventory.mjs';

export function verify(database = 'CinemaBookingDB', integrated = false) {
  const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json')));
  const current = inventory(database, integrated);
  const problems = [];
  for (const [name, file] of Object.entries(manifest.modules)) {
    const body = read(path.join(dbRoot, file));
    const match = /\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
    const definition = body
      .slice(match.index)
      .replace(/\s+GO\s*$/i, '')
      .replaceAll('CinemaBookingDB', database);
    const actual = current.objects.find((o) => o.name === name);
    if (!actual || normalizeModule(definition) !== normalizeModule(actual.definition))
      problems.push(`Definition drift: ${name}`);
    const options = manifest.expected.objects.find((o) => o.name === name);
    if (
      actual &&
      (actual.uses_ansi_nulls !== options.uses_ansi_nulls ||
        actual.uses_quoted_identifier !== options.uses_quoted_identifier)
    )
      problems.push(`SET option drift: ${name}`);
  }
  write(path.join(audit, `verify-${database}.json`), {
    database,
    at: new Date().toISOString(),
    modulesChecked: Object.keys(manifest.modules).length,
    problems,
    status: problems.length ? 'FAIL' : 'PASS',
  });
  if (problems.length) throw new Error(problems.join('\n'));
  console.log(`PASS source definition parity: ${Object.keys(manifest.modules).length} modules`);
  return current;
}

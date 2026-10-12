// Compatibility aliases delegate to the single guarded seed-v2 pipeline.
import { main as seedMain } from './seed-demo.mjs';
export async function main(args = process.argv.slice(2)) {
  const aliases = {
    'preflight-test': 'preflight',
    'build-test': 'create',
    'fixture-test': 'test-fixtures',
    'rebuild-test': 'reset',
  };
  const mode = aliases[args[0]];
  if (!mode) throw new Error('Unknown test pipeline alias. See database/10_seed/README.md.');
  if (args.includes('--seed-only'))
    throw new Error('Retired --seed-only contract; use base or demo-dynamic profiles.');
  return seedMain([mode, ...args.slice(1)]);
}
if (process.argv[1] === import.meta.filename) await main();

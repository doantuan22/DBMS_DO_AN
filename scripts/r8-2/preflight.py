"""R8.2 source/evidence preservation baseline; no database mutations."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[2]
run_id = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H-%M-%S-%fZ-') + uuid.uuid4().hex[:8]
OUT = ROOT / 'docs/evidence/r8-2/runs' / run_id
OUT.mkdir(parents=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: p.read_text(encoding='utf-8-sig')
save = lambda name, data: (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
command = lambda args, cwd=ROOT: subprocess.run(args, cwd=cwd, capture_output=True, encoding='utf-8', errors='replace')
docs = ['ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md', 'docs/R8_1_FRONTEND_INSPECTION_REPORT.md',
 'docs/R8_FRONTEND_GAP_MATRIX.md', 'docs/R8_2_EXECUTION_BACKLOG.md', 'docs/R8_TEST_ENVIRONMENT.md',
 'docs/USE_CASE_BASELINE_45.md', 'docs/USE_CASE_MATRIX_45.md', 'docs/R7_3_FINAL_ACCEPTANCE_REPORT.md',
 'docs/MAIN_DATABASE_SYNC_REPORT.md', 'docs/PROJECT_ACCEPTED_CONSTRAINTS.md', 'scripts/db/TEST_PIPELINE.md']
docs += [p.relative_to(ROOT).as_posix() for p in (ROOT / 'docs/contracts').glob('*.md')]
save('required-reading.json', {name: {'SHA256': sha(ROOT/name), 'lines': len(read(ROOT/name).splitlines())} for name in docs})
sealed = json.loads(read(ROOT / 'docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/quality-gate.json'))
assert all(sha(ROOT/name) == digest for name, digest in sealed['SHA256'].items())
files = {}
for p in ROOT.rglob('*'):
 if p.is_file() and not any(x in p.parts for x in ['.git', 'node_modules', 'dist', '__pycache__']) and not p.is_relative_to(OUT):
  files[p.relative_to(ROOT).as_posix()] = sha(p)
save('repository-before.json', files)
context = {'runID': run_id, 'initialHEAD': command(['git','rev-parse','HEAD']).stdout.strip(),
 'initialGitStatus': command(['git','status','--short']).stdout, 'baselineFiles': len(files),
 'database': 'CinemaBookingDB_R0_R81_20261010_3d49fc44', 'scope':'R8.2 only; original R8.1 preserved'}
save('context.json', context)
checks = {}
for name, args, cwd in [
 ('frontend-tests', ['node','--test','--test-concurrency=1','tests/*.test.js'], ROOT/'frontend'),
 ('frontend-lint', ['node','node_modules/oxlint/bin/oxlint'], ROOT/'frontend'),
 ('frontend-build', ['node','node_modules/vite/bin/vite.js','build','--outDir',str(OUT/'build-baseline')], ROOT/'frontend')]:
 reply = command(args, cwd)
 (OUT / (name+'.log')).write_text(reply.stdout + reply.stderr, encoding='utf-8')
 checks[name] = {'exitCode': reply.returncode, 'cwd': str(cwd)}
 assert reply.returncode == 0, name + ': see retained log'
reply=command(['node','scripts/r8-1/prepare.mjs','--database='+context['database'],'--check'])
assert reply.returncode == 0, reply.stderr
identity=json.loads(reply.stdout)
save('test-target-review.json', identity)
save('preflight.json', {'status':'PASS','R81ArtifactHashes':'PASS','baseline':context,'checks':checks,'target':identity['target']})
print(OUT.relative_to(ROOT).as_posix())

"""Capture frontend package-equivalent checks into a new checkpoint artifact directory."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
OUT=(ROOT/sys.argv[1]).resolve()
assert OUT.is_relative_to(ROOT/'docs/evidence/r8-2/runs') and (OUT/'context.json').exists()
assert not (OUT/'frontend-checks.json').exists()
checks={}
for name,args in [
 ('frontend-tests',['node','--test','--test-concurrency=1','tests/*.test.js']),
 ('frontend-lint',['node','node_modules/oxlint/bin/oxlint']),
 ('frontend-build',['node','node_modules/vite/bin/vite.js','build','--outDir',str(OUT/'build')])]:
 result=subprocess.run(args,cwd=ROOT/'frontend',capture_output=True,encoding='utf-8',errors='replace')
 (OUT/(name+'.log')).write_text(result.stdout+result.stderr,encoding='utf-8')
 checks[name]={'exitCode':result.returncode}
 assert result.returncode==0,name
manifest={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'frontend/src').rglob('*') if p.is_file()}
(OUT/'frontend-checks.json').write_text(json.dumps({'status':'PASS','checks':checks,'sourceSHA256':manifest},indent=2)+'\n',encoding='utf-8')
print('PASS frontend tests/lint/build: '+str(OUT))

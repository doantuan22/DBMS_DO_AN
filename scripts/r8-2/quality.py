"""Validate R8.2 evidence graph, preservation, documents and seal actual artifacts."""
from pathlib import Path
from urllib.parse import unquote
from collections import Counter
import hashlib
import json
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
OUT=(ROOT/sys.argv[1]).resolve()
assert OUT.is_relative_to(ROOT/'docs/evidence/r8-2/runs')
read=lambda p:p.read_text(encoding='utf-8-sig')
data=lambda p:json.loads(read(p))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rel=lambda p:p.relative_to(ROOT).as_posix()
save=lambda n,o:(OUT/n).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not(OUT/'quality-gate.json').exists(),'Refusing to overwrite final quality seal'
a=data(OUT/'assembly.json');base=ROOT/a['baseline'];r81=ROOT/a['R81']
v=data(OUT/'verification-45.json')['UCs'];g=data(OUT/'gaps-43.json')['gaps']
assert len(v)==45 and len({u['ucId']for u in v})==45
assert Counter(u['actor']for u in v)=={'Customer':14,'Manager':9,'CSKH':6,'Admin':16}
assert len(g)==43 and len({u['gapId']for u in g})==43
assert Counter(u['originalCategory']for u in g)=={'FIX_REQUIRED':7,'CONTRACT_ALIGNMENT_REQUIRED':7,'TEST_REQUIRED':29}
assert all(u['proposedStatus']=='PASS_CANDIDATE'and u['cleanup']=='PASS'and u['remainingIssue']is None for u in v)
assert all(u['status']=='RESOLVED'for u in g)

# Check actual JSON selectors and every proof classification; no text-only PASS.
def select(ref):
 obj=data(ROOT/ref['artifact'])
 for key in ref['selector'].lstrip('/').split('/'):
  obj=obj[int(key)]if isinstance(obj,list)else obj[key]
 return obj
selected=data(OUT/'selected-cases.json')['cases']
assert len({c['id']for c in selected})==len(selected)
for c in selected:
 actual=select(c);assert actual['id']==c['id']and actual['status']=='PASS'and actual['kind']==c['kind']
 run=(ROOT/c['artifact']).parent
 env=data(run/'environment-result.json');diag=data(run/'browser-diagnostics.json')
 assert env['status']==c['runStatus']and env['cleanup']=='PASS'and env['mainPreservation']=='PASS'
 assert not diag['exceptions']and not diag['consoleErrors']
 controls=diag['controls'][slice(*actual['controlRange'])]
 if controls:assert actual['kind']=='CONTROLLED_TRANSPORT'
 if env['status']!='PASS':assert rel(run)in a['failedAttemptsUsedOnlyByPASSSelector']
 else:assert not diag.get('harnessErrors')
for u in v:
 p=u['primaryRealBrowserSQL'];assert select(p)['kind']=='REAL_BROWSER_SQL'
 assert p['runStatus']=='PASS'and u['ucId']in select(p)['UCs']
 assert u['cases']and u['realSPProof']['selectors']
 calls=data(ROOT/u['realSPProof']['artifact'])['calls']
 assert all(calls[int(s.split('/')[-1])]['status']=='PASS'for s in u['realSPProof']['selectors'])
 for r in u['independentSQLAssertions']:assert select(r)['status']=='PASS'
 for file in u['noWriteFingerprints']:
  n=data(ROOT/file);assert n['status']=='PASS'and n['before']==n['after']and len(n['before']['data'])==27

frontend=data(ROOT/a['frontendChecks']);assert frontend['status']=='PASS'
assert all(c['exitCode']==0 for c in frontend['checks'].values())
assert all(sha(ROOT/p)==h for p,h in frontend['sourceSHA256'].items()),'Frontend changed after tested checkpoint'
assert re.search(r'tests 62',read((ROOT/a['frontendChecks']).parent/'frontend-tests.log'))
assert re.search(r'pass 62',read((ROOT/a['frontendChecks']).parent/'frontend-tests.log'))
backend=data(ROOT/a['backendChecks']);assert backend['status']=='PASS'and all(c['exitCode']==0 for c in backend['checks'].values())
blog=read((ROOT/a['backendChecks']).parent/'backend-tests.log');assert 'tests 192'in blog and'pass 192'in blog
assert 'NO RAW BUSINESS SQL IN BACKEND = PASS'in read((ROOT/a['backendChecks']).parent/'no-sql.log')

before=data(base/'repository-before.json')
production=data(OUT/'source-manifest.json')['productionFrontend']
allowed=set(production)|{'docs/R8_FRONTEND_GAP_MATRIX.md'}
changed=[]
for name,h in before.items():
 p=ROOT/name
 if not p.exists()or sha(p)!=h:
  changed.append(name)
  assert name in allowed or name.startswith(('docs/evidence/r8-2/','scripts/r8-2/')),'Unauthorized original-file change: '+name
assert len([n for n in changed if n.startswith('frontend/src/')])==10
assert len(production)==11
protected=[n for n in before if n.startswith(('backend/','shared/','database/','scripts/r8-1/','docs/evidence/r8-1/'))or n.startswith('frontend/')and(n.endswith('.css')or n.endswith('package.json')or n.endswith('package-lock.json')or'/routes/'in n or n.endswith('main.jsx'))]
assert all(sha(ROOT/n)==before[n]for n in protected)
head=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,encoding='utf-8',check=True).stdout.strip()
assert head==data(base/'context.json')['initialHEAD']
diff=subprocess.run(['git','diff','--check'],cwd=ROOT,capture_output=True,encoding='utf-8');assert diff.returncode==0
(OUT/'git-diff-check.log').write_text(diff.stdout+diff.stderr,encoding='utf-8')
patch=subprocess.run(['git','diff','--no-ext-diff','--no-color','--','frontend/src'],cwd=ROOT,capture_output=True,encoding='utf-8',check=True).stdout
new_path='frontend/src/components/AdminRevenue.jsx'
new_lines=read(ROOT/new_path).splitlines()
patch+='diff --git a/'+new_path+' b/'+new_path+'\nnew file mode 100644\n--- /dev/null\n+++ b/'+new_path+'\n@@ -0,0 +1,'+str(len(new_lines))+' @@\n'+''.join('+'+line+'\n'for line in new_lines)
(OUT/'production-frontend.patch').write_text(patch,encoding='utf-8')

r81seal=data(r81/'quality-gate.json');archive=base/'R8_FRONTEND_GAP_MATRIX_R8_1.md'
for name,h in r81seal['SHA256'].items():
 actual=archive if name=='docs/R8_FRONTEND_GAP_MATRIX.md'else ROOT/name
 assert sha(actual)==h,'R8.1 historical artifact changed: '+name
assert read(ROOT/'docs/R8_FRONTEND_GAP_MATRIX.md').startswith(read(archive).rstrip())
assert sha(ROOT/'docs/R8_1_TONG_HOP_BAO_CAO.md')==before['docs/R8_1_TONG_HOP_BAO_CAO.md']

# Full completed-run safety, including failed attempts and independently recovered crash.
attempts=[]
for p in (ROOT/'docs/evidence/r8-2/runs').glob('*/environment-result.json'):
 env=data(p);assert env.get('cleanup')=='PASS'and env.get('mainPreservation')=='PASS',str(p)
 clean=data(p.parent/'fixture-cleanup.json');main=data(p.parent/'main-preservation.json')
 assert clean['status']=='PASS'and clean['before']==clean['after']and len(clean['after']['data'])==27
 assert clean['moduleParity']['modules']==159 and clean['session']['transactionCount']==0 and clean['openUserTransactions']==[]
 assert clean['loginDropped']and clean['userDropped']
 assert main['before']==main['after']and main['mainWrites']==0
 attempts.append(rel(p))
crash=ROOT/'docs/evidence/r8-2/runs/2026-10-10T02-56-59-487Z-reproduce-p2-7d871871'
recovery=data(crash/'crash-recovery.json');assert recovery['status']=='PASS'and recovery['mainWrites']==0 and recovery['loginDropped']and recovery['userDropped']
assert data(crash/'browser-recovery.json')['status']=='PASS'
audit=data(OUT/'final-read-only-audit.json');assert audit['status']=='PASS'and audit['mainWrites']==0 and audit['moduleParity']['modules']==159 and len(audit['testSeedFingerprints']['data'])==27

docs=[ROOT/'docs/R8_2_IMPLEMENTATION_REPORT.md',ROOT/'docs/R8_FRONTEND_GAP_MATRIX.md',ROOT/'docs/R8_2_VERIFICATION_MATRIX.md']
link_count=0
for p in docs:
 text=read(p)
 for target in re.findall(r'\]\(([^)]+)\)',text):
  if target.startswith(('http:','https:','#')):continue
  file=(p.parent/unquote(target.split('#')[0])).resolve()
  assert file.exists(),(rel(p),target)
  link_count+=1
vm=read(docs[2]);rows=[line for line in vm.splitlines()if re.match(r'\| (KH|QLR|CSKH|ADM)-\d\d \|',line)]
assert len(rows)==45
assert all(len(re.split(r'(?<!\\)\|',line))-2==14 for line in rows)
new_matrix=read(docs[1]).split('# R8.2 — Kết quả xử lý 43 inherited gaps')[1]
assert len([line for line in new_matrix.splitlines()if line.startswith('| R71-FE-')])==43
for title in list('ABCDEFGH'):assert '## '+title+'.'in read(docs[0])
assert 'ADM-17'not in {u['ucId']for u in v}

responsive=[]
for p in [ROOT/a['primaryRun']/'responsive-additional.json',next(ROOT/r/'responsive-a11y.json'for r in a['passingRuns']if data(ROOT/r/'browser-cases.json')['phase']=='edges-tail')]:
 d=data(p);assert d['status']=='PASS'
 audits=d.get('audits',d.get('checks'));assert {item['width']for item in audits}=={390,1440}
 for item in audits:assert(p.parent/item['screenshot']).exists()
 responsive.append(rel(p))

# Scan new public JSON/text evidence for credential values, rather than parameter names.
secret_findings=[]
for p in (ROOT/'docs/evidence/r8-2').rglob('*'):
 if p.is_file()and p.suffix in ['.json','.log','.md']:
  s=read(p)
  if re.search(r'eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}',s):secret_findings.append(rel(p))
  if re.search(r'\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}',s):secret_findings.append(rel(p))
assert not secret_findings,secret_findings

save('source-preservation.json',{'status':'PASS','baselineFiles':len(before),'originalFilesChanged':changed,'protectedFilesUnchanged':len(protected),'productionFrontendCount':11,'HEAD':head,'R81HistoricalSeal':'PASS using byte-identical archived gap matrix for authorized current-matrix update','originalConsolidatedReport':'UNCHANGED','paletteFontCSSRoutesBackendSharedSQL':'UNCHANGED'})
save('source-manifest.json',{'productionFrontend':{p:sha(ROOT/p)for p in production},'tooling':{rel(p):sha(p)for p in (ROOT/'scripts/r8-2').glob('*')if p.is_file()}})
a['status']='PASS';save('assembly.json',a)
artifacts={}
for run in (ROOT/'docs/evidence/r8-2/runs').iterdir():
 if run.is_dir():
  for p in run.rglob('*'):
   if p.is_file()and p.name!='quality-gate.json':artifacts[rel(p)]=sha(p)
for p in docs:artifacts[rel(p)]=sha(p)
for p in (ROOT/'scripts/r8-2').glob('*'):
 if p.is_file():artifacts[rel(p)]=sha(p)
save('quality-gate.json',{'status':'PASS','scope':'R8.2 candidate readiness only; R8.3 not executed','checks':{'43OriginalGaps': 'RESOLVED','45ActualPositiveUCs':'PASS_CANDIDATE','caseSelectorsAndEvidenceKinds':'PASS','SQLPersistenceAndNoWrite':'PASS','currentFrontend62LintBuild':'PASS','backend192NoSQL':'PASS','sourceAndR81Preservation':'PASS','DB159Modules27SeedCleanupMain0Writes':'PASS','RuntimeConsoleAndTargetedHarness':'PASS','changedAreaA11y3901440':'PASS','documentsLinksAndCounts':'PASS','publicEvidenceSecretScan':'PASS'},'uniqueScenarioCounts':data(OUT/'counts.json'),'verifiedDocumentLinks':link_count,'completedRunsWithCleanup':len(attempts),'crashRecovery':'PASS','acceptedPASSCasesFromFailedAttemptsRemainSuiteFAILED':a['failedAttemptsUsedOnlyByPASSSelector'],'artifactCount':len(artifacts),'SHA256':artifacts,'remaining':['R8.3 final independent acceptance pending','External fonts/images denied by environment; approved fallback preserved','Controlled transport is distinct from full unmodified E2E']})
print(json.dumps({'status':'PASS','gaps':43,'UCs':45,'links':link_count,'sealedArtifacts':len(artifacts),'output':rel(OUT)}))

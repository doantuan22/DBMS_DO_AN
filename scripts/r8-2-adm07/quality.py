"""Verify and seal current ADM-07 hotfix without upgrading Phase R8 acceptance."""
from pathlib import Path
from collections import Counter
from urllib.parse import unquote,urlparse
import hashlib
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/(ROOT/'scripts/r8-2-adm07/current-output.txt').read_text(encoding='utf-8')
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def emit(name,value): (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not (OUT/'quality-gate.json').exists(),'Refuse to overwrite final seal'
context=read(OUT/'context.json')
changed=[p for p,h in context['beforeSHA256'].items()if sha(ROOT/p)!=h]
assert changed==['frontend/src/components/CinemaImageManager.jsx'],changed
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==context['HEAD']
current=read(OUT/'frontend-checks.json')
assert current['status']=='PASS' and all(c['exitCode']==0 for c in current['checks'].values())
assert all(sha(ROOT/p)==h for p,h in current['sourceSHA256'].items())
log=(OUT/'frontend-tests.log').read_text(encoding='utf-8');assert 'tests 65' in log and 'pass 65' in log and 'fail 0' in log
assert 'synchronous pending' not in log or 'fail 0' in log
cases=read(OUT/'browser-cases.json')['checks'];diag=read(OUT/'browser-diagnostics.json');sql=read(OUT/'sql-assertions.json')['assertions']
assert len(cases)==19 and all(c['status']=='PASS'for c in cases)
assert Counter(c['kind']for c in cases)=={'REAL_BROWSER_SQL':7,'CONTROLLED_TRANSPORT':12}
assert len(sql)==15 and all(s['status']=='PASS'for s in sql)
assert not diag['exceptions'] and not diag['consoleErrors'] and not diag['harnessErrors']
for c in cases:
    for key,values in [('networkRange',diag['network']),('controlRange',diag['controls']),('sqlRange',sql)]:
        a,b=c[key];assert 0<=a<=b<=len(values)
    a,b=c['controlRange'];assert (b>a)==(c['kind']=='CONTROLLED_TRANSPORT')
    if c['kind']=='REAL_BROWSER_SQL':assert c['controlRange'][0]==c['controlRange'][1]
no_write=list(OUT.glob('no-write-*.json'));assert len(no_write)==8
for p in no_write:
    proof=read(p);assert proof['status']=='PASS'and proof['before']==proof['after']and len(proof['before']['data'])==27
env=read(OUT/'environment-result.json');assert env['status']=='PASS'and env['browserStatus']=='PASS'and env['cleanup']=='PASS'and env['mainPreservation']=='PASS'
assert env['targetIdentity']['database_guid']=='33876608-D109-43B5-ACEC-0B84C2639A73'
cleanup=read(OUT/'fixture-cleanup.json');assert cleanup['status']=='PASS'and cleanup['before']==cleanup['after']
assert cleanup['loginDropped']and cleanup['userDropped']and cleanup['openUserTransactions']==[]
assert cleanup['moduleParity']['modules']==159 and len(cleanup['after']['data'])==27
main=read(OUT/'main-preservation.json');assert main['before']==main['after']and main['mainWrites']==0
audit=read(OUT/'final-read-only-audit.json');assert audit['status']=='PASS'and audit['moduleParity']['modules']==159 and audit['mainWrites']==0
assert len(audit['testSeedFingerprints']['data'])==27
assert all(audit['integrity'][k]==0 for k in ['disabledOrUntrustedFK','disabledOrUntrustedChecks','disabledTriggers','openUserTransactions','testRuntimeUsers','transactionCount'])
assert audit['testRuntimeLogins']==[]
for c in cases:
    if c['id'].startswith('HF-PENDING-'):
        action=c['id'].split('-')[2].lower();proof=read(OUT/f'pending-{action}.json')
        assert proof['oldRefreshRequests']==0 and proof['otherCinemaRowsUnchanged']and len(proof['writes'])==1
        assert '/cinemas/'+str(proof['capturedCinema'])+'/images' in proof['writes'][0]['url']
        assert proof['capturedCinema']!=proof['displayedCinema']
fe=read(OUT/'fe01-no-stale-observation.json');assert fe['staleRows']==0and fe['mutationRequests']==0and fe['submitDisabled']
for name in ['image-retry-observation.json','cinema-list-retry-observation.json']:
    obs=read(OUT/name);assert obs['status']=='PASS'and obs['errorRetainedWhilePending']and obs['requests']
sp=read(OUT/'procedure-trace.json')['calls'];assert all(c['database']==context['database']for c in sp)
required={'dbo.sp_Admin_Cinema_Create','dbo.sp_Admin_Cinema_Update','dbo.sp_Admin_Cinema_Delete','dbo.usp_Admin_Cinema_List',
    'dbo.usp_Admin_CinemaImage_Create','dbo.usp_Admin_CinemaImage_Update','dbo.usp_Admin_CinemaImage_Delete','dbo.usp_Admin_CinemaImage_SetCover','dbo.usp_Admin_CinemaImage_List'}
assert required<=set(c['name']for c in sp if c['status']=='PASS')
assert len([c for c in sp if c['name']=='dbo.sp_Auth_Login'and c['status']=='PASS'])==4
# Rehash history; source changes do not alter immutable snapshots or reports.
r83=ROOT/'docs/evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88'
historical=read(r83/'quality-gate.json');assert all(sha(ROOT/p)==h for p,h in historical['SHA256'].items())
r82=ROOT/'docs/evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5'
old=read(r82/'quality-gate.json')
assert all(sha(r83/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md'if p=='docs/R8_FRONTEND_GAP_MATRIX.md'else ROOT/p)==h for p,h in old['SHA256'].items())
assert read(OUT/'hotfix-tracking.json')['R83ReAcceptance']=='PENDING'
assert read(OUT/'hotfix-tracking.json')['phaseR8Accepted'] is False
docs=['docs/R8_2_ADM07_HOTFIX_REPORT.md','docs/R8_2_ADM07_HOTFIX_TRACKING.md'];links=0
for name in docs:
    p=ROOT/name;content=p.read_text(encoding='utf-8');assert 'PENDING' in content
    for href in re.findall(r'\[[^\]\n]*\]\((<[^>\n]*>|[^\s)]+)\)',content):
        href=href.strip('<>')
        if href.startswith(('http:','https:','#')):continue
        target=(p.parent/unquote(href.split('#')[0])).resolve()
        assert target.is_file() or target==OUT/'quality-gate.json',(name,href)
        links+=1
status=subprocess.run(['git','diff','--check'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
(OUT/'git-diff-check.log').write_text(status.stdout+status.stderr,encoding='utf-8');assert status.returncode==0
(OUT/'git-status-final.log').write_text(subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True,encoding='utf-8'),encoding='utf-8')
sources={p.relative_to(ROOT).as_posix():sha(p)for folder in ['frontend/src','frontend/tests','scripts/r8-2-adm07']for p in (ROOT/folder).rglob('*')if p.is_file()}
emit('final-source-manifest.json',{'scope':'Current source verified against fresh65 checks and actual final19-case browser execution','SHA256':sources})
failures=Counter((x.get('error'),x.get('canceled'),'/api/'in x.get('url',''))for x in diag['failures'])
assert all((canceled and error=='net::ERR_ABORTED')or (not local and error=='net::ERR_NETWORK_ACCESS_DENIED')for error,canceled,local in failures)
emit('verification-summary.json',{'status':'PASS','hotfix':'DONE','phaseR8Accepted':False,'R83ReAcceptance':'PENDING',
    'productionExistingFilesChanged':changed,'otherOriginalFilesUnchanged':len(context['beforeSHA256'])-1,
    'historicalR82ArtifactsVerified':len(old['SHA256']),'historicalR83ArtifactsVerified':len(historical['SHA256']),
    'browserCases':19,'kinds':dict(Counter(c['kind']for c in cases)),'SQLAssertions':15,'full27NoWriteProofs':8,
    'frontendTests':65,'lint':'PASS','build':'PASS','consoleErrors':0,'runtimeExceptions':0,'harnessErrors':0,
    'networkFailureClasses':{str(k):v for k,v in failures.items()},'canonicalTables':27,'canonicalModules':159,
    'cleanup':'PASS','mainWrites':0,'mainPreservation':'PASS','documentLinksVerified':links})
for p in OUT.rglob('*'):
    if p.is_file() and p.suffix in ('.json','.log','.md'):
        s=p.read_text(encoding='utf-8',errors='replace')
        assert not re.search(r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}',s),p
        assert not re.search(r'\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}',s),p
files=[p for p in OUT.rglob('*')if p.is_file()and p.name!='quality-gate.json']
files += [ROOT/p for p in docs]+[p for p in (ROOT/'scripts/r8-2-adm07').rglob('*')if p.is_file()]
files += [ROOT/'frontend/src/components/CinemaImageManager.jsx',ROOT/'frontend/tests/cinemaImageManager.test.js']
manifest={p.relative_to(ROOT).as_posix():sha(p)for p in files}
emit('quality-gate.json',{'status':'PASS','scope':'R8.2 ADM-07 hotfix only; final Phase R8 acceptance excluded',
    'hotfixStatus':'HOTFIX_DONE','R83ReAcceptance':'PENDING','phaseR8Accepted':False,
    'checks':{'R83-FE-01':'PASS','R83-FE-02':'PASS','ADM07Regression19':'PASS','frontend65LintBuild':'PASS',
        'realBrowserHTTPStoredProcedureSQL':'PASS','DB27Modules159CleanupMain0Writes':'PASS','scopeAndHistoryPreservation':'PASS',
        'linksAndSecretScan':'PASS'},'artifactCount':len(manifest),'SHA256':manifest})
print(json.dumps({'status':'HOTFIX_DONE','browserCases':19,'SQLAssertions':15,'frontendTests':65,'sealedArtifacts':len(manifest),
    'historicalArtifactsUnchanged':len(old['SHA256'])+len(historical['SHA256']),'R83ReAcceptance':'PENDING'}))

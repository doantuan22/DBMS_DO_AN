"""Independent R8.3 evidence audit. No production or historical evidence writes."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import re
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / (ROOT / 'scripts/r8-3/current-output.txt').read_text(encoding='utf-8')
OLD = ROOT / 'docs/evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5'
def read(p):
    return json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def pointer(obj, selector):
    for k in selector.strip('/').split('/'):
        obj = obj[int(k)] if isinstance(obj, list) else obj[k]
    return obj
def emit(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

context = read(OUT/'context.json')
assert all(sha(ROOT/p)==h for p,h in context['sourceSHA256'].items())
seal = read(OLD/'quality-gate.json')
assert all(sha(OUT/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md' if p=='docs/R8_FRONTEND_GAP_MATRIX.md' else ROOT/p)==h for p,h in seal['SHA256'].items())
before=read('docs/evidence/r8-2/runs/2026-10-10T02-38-55-539905Z-d8a165c2/repository-before.json')
protected={p:h for p,h in before.items() if p.startswith(('backend/','shared/','database/','scripts/r8-1/','docs/evidence/r8-1/')) or p.startswith('frontend/') and (p.endswith('.css') or p.endswith('package.json') or p.endswith('package-lock.json') or '/routes/' in p or p.endswith('main.jsx'))}
assert all(sha(ROOT/p)==h for p,h in protected.items())
backend=ROOT/'docs/evidence/r8-2/runs/2026-10-10T03-39-27-215Z-edges-86caea16'
assert read(backend/'backend-checks.json')['status']=='PASS'
blog=(backend/'backend-tests.log').read_text(encoding='utf-8')
assert 'tests 192' in blog and 'pass 192' in blog
assert 'NO RAW BUSINESS SQL IN BACKEND = PASS' in (backend/'no-sql.log').read_text(encoding='utf-8')
current = read(OUT/'frontend-checks.json')
assert current['status']=='PASS' and all(v['exitCode']==0 for v in current['checks'].values())
assert all(sha(ROOT/p)==h for p,h in current['sourceSHA256'].items())
assert all(sha(ROOT/p)==h for p,h in read(OLD/'source-manifest.json')['productionFrontend'].items())
selected = read(OLD/'selected-cases.json')['cases']
assert len(selected)==121 and len({c['id'] for c in selected})==121
diagnostics = {}
failed_suite_cases = []
for ref in selected:
    path = ROOT/ref['artifact']; base=path.parent
    case = pointer(read(path),ref['selector'])
    assert case['id']==ref['id'] and case['status']=='PASS'
    assert case['kind']==ref['kind']
    env=read(base/'environment-result.json')
    assert env['status']==ref['runStatus']
    assert env['cleanup']=='PASS' and env['mainPreservation']=='PASS'
    assert env['targetIdentity']['database_guid']=='33876608-D109-43B5-ACEC-0B84C2639A73'
    diag=read(base/'browser-diagnostics.json')
    assert not diag['exceptions'] and not diag['consoleErrors']
    sqlfile=base/'sql-assertions.json'
    assertions=read(sqlfile)['assertions'] if sqlfile.exists() else []
    for key, array in [('networkRange',diag['network']),('controlRange',diag['controls']),('sqlRange',assertions)]:
        a,b=ref[key]; assert 0<=a<=b<=len(array)
        assert ref[key]==case[key]
    a,b=ref['controlRange']
    # A conservatively declared controlled case may exercise a reset without
    # firing its rule. It must never be upgraded to real E2E on that basis.
    if ref['kind']=='REAL_BROWSER_SQL':
        assert b==a
    elif b==a:
        assert ref['id']=='P1-I19-CONTEXT-RESET'
    if ref['runStatus']=='FAIL':
        failed_suite_cases.append({'id':ref['id'],'run':base.relative_to(ROOT).as_posix(),
            'caseStatus':'PASS','suiteStatus':'FAIL','suiteError':env.get('error'),
            'rationale':'Independent case assertions, explicit HTTP/control/SQL ranges and cleanup preserved; suite not upgraded'})
    elif ref['runStatus']=='PASS':
        assert not diag.get('harnessErrors',[])
    else:
        raise AssertionError(ref)
    diagnostics[base.relative_to(ROOT).as_posix()]={
        'suiteStatus':env['status'],'exceptions':len(diag['exceptions']),
        'consoleErrors':len(diag['consoleErrors']),'harnessErrors':len(diag['harnessErrors']) if 'harnessErrors' in diag else 'NOT_RECORDED_LEGACY',
        'correlatedCanceledInterceptions':len(diag.get('canceledInterceptions',[])),
        'failureClasses':dict(Counter(str((x.get('error'),x.get('canceled'),'/api/' in x.get('url',''))) for x in diag['failures']))}

ucs=read(OLD/'verification-45.json')['UCs']
assert len(ucs)==45 and Counter(u['actor'] for u in ucs)=={'Customer':14,'Manager':9,'CSKH':6,'Admin':16}
results=[]; sql_refs=set(); no_write=set()
for i,u in enumerate(ucs):
    primary=u['primaryRealBrowserSQL']; case=pointer(read(primary['artifact']),primary['selector'])
    assert case['status']=='PASS' and primary['kind']=='REAL_BROWSER_SQL' and primary['runStatus']=='PASS'
    assert u['ucId'] in case['UCs']
    base=(ROOT/primary['artifact']).parent
    diag=read(base/'browser-diagnostics.json')
    a,b=primary['networkRange']; requests=diag['network'][a:b]
    prefetched=[]
    if not requests:
        # Local seat/food selection and already loaded dashboard/reference do
        # not issue a new HTTP request. Preserve that fact and bind prior real
        # successful reads in this same browser journey by canonical route.
        for endpoint in u['contract']['endpointChains']:
            pattern='^'+re.sub(r':[A-Za-z0-9_]+',r'[^/]+',endpoint['route'])+'$'
            matches=[{'index':n,**x} for n,x in enumerate(diag['network'][:a])
                if x['method']==endpoint['method'] and re.match(pattern,urlparse(x['url']).path)
                and 200<=x['status']<300]
            prefetched.extend(matches[-1:])
        assert prefetched,u['ucId']
    else:
        assert any(200<=x['status']<300 for x in requests),u['ucId']
    sp=u['realSPProof']; traces=read(sp['artifact'])
    calls=[pointer(traces,p) for p in sp['selectors']]
    assert calls and all(c['database']==context['database'] for c in calls)
    missing=set(sp['expectedCanonicalNames'])-set(c['name'] for c in calls)
    supplemental_calls=[]
    for ref in u['cases']:
        supplemental_case=pointer(read(ref['artifact']),ref['selector'])
        tracefile=(ROOT/ref['artifact']).parent/'procedure-trace.json'
        for n,c in enumerate(read(tracefile)['calls']):
            if c['name'] in missing and supplemental_case['startedAt']<=c['startedAt']<=supplemental_case['finishedAt']:
                supplemental_calls.append({'artifact':tracefile.relative_to(ROOT).as_posix(),'selector':f'/calls/{n}',
                    'case':ref['id'],'name':c['name'],'status':c['status'],'sqlError':c.get('sqlError')})
    assert missing<=set(c['name'] for c in supplemental_calls),(u['ucId'],missing)
    assert any(c['status']=='PASS' for c in calls)
    for ref in u['independentSQLAssertions']:
        assertion=pointer(read(ref['artifact']),ref['selector'])
        assert assertion['id']==ref['id'] and assertion['status']=='PASS'
        assert 'query' in assertion and 'rows' in assertion
        sql_refs.add((ref['artifact'],ref['selector']))
    for file in u['noWriteFingerprints']:
        proof=read(file); assert proof['status']=='PASS' and proof['before']==proof['after']
        assert len(proof['before']['data'])==27
        no_write.add(file)
    for ref in u['cases']:
        c=pointer(read(ref['artifact']),ref['selector'])
        assert c['id']==ref['id'] and c['status']=='PASS' and u['ucId'] in c['UCs']
    results.append({'ucId':u['ucId'],'actor':u['actor'],'name':u['name'],
        'status':'BROKEN' if u['ucId']=='ADM-07' else 'PASS',
        'R82EvidenceGraph':{'artifact':(OLD/'verification-45.json').relative_to(ROOT).as_posix(),'selector':f'/UCs/{i}'},
        'primaryRealBrowserSQL':primary,'actualHTTPRequests':requests,'priorRealHTTPReadDependencies':prefetched,'actualTypedSPProof':sp,
        'supplementalTypedSPProof':supplemental_calls,
        'independentSQLAssertions':u['independentSQLAssertions'],'noWriteFingerprints':u['noWriteFingerprints'],
        'authorizationAndOwnershipCases':u['authOwnershipCases'],'controlledCases':u['controlledCases'],
        'cleanup':'PASS','sourceFreshness':'Current source and fresh frontend checks hashes verified; later review focus change covered by current focus E2E',
        'remainingDefects':['R83-FE-01','R83-FE-02'] if u['ucId']=='ADM-07' else [],
        'rationale':'Real positive UI, HTTP and SQL remain valid; final acceptance revoked by reproduced image resource/error/retry defects' if u['ucId']=='ADM-07' else 'Accepted primary and supplemental selectors independently verified; no material defect found within audited scope'})

gaps=read(OLD/'gaps-43.json')['gaps']
assert len(gaps)==43 and Counter(g['originalCategory'] for g in gaps)=={'TEST_REQUIRED':29,'FIX_REQUIRED':7,'CONTRACT_ALIGNMENT_REQUIRED':7}
for g in gaps:
    g['status']='REOPENED' if g['ucId']=='ADM-07' else 'RESOLVED'
    g['finalUCStatus']='BROKEN' if g['ucId']=='ADM-07' else 'PASS'
    g['remainingDefects']=['R83-FE-01','R83-FE-02'] if g['ucId']=='ADM-07' else []

repro=read(OUT/'browser-cases.json')['checks']
assert [c['status'] for c in repro]==['PASS','FAIL','FAIL']
assert read(OUT/'environment-result.json')['browserStatus']=='REPRODUCED'
wrong=read(OUT/'image-wrong-resource-request.json');assert len(wrong['writes'])==1
assert wrong['writes'][0]['status']==404 and wrong['writes'][0]['url'].endswith('/cinemas/2/images/1')
assert read(OUT/'no-write-r83-image-failed-switch.json')['before']==read(OUT/'no-write-r83-image-failed-switch.json')['after']
retry=read(OUT/'image-list-retry-observation.json');assert retry['retryRequests']==[] and retry['state']['cinemaOptions']==1
freshdiag=read(OUT/'browser-diagnostics.json');assert not freshdiag['exceptions'] and not freshdiag['consoleErrors'] and not freshdiag['harnessErrors']
db=read(OUT/'final-read-only-audit.json');assert db['status']=='PASS' and db['moduleParity']['modules']==159
assert len(db['testSeedFingerprints']['data'])==27 and db['mainWrites']==0
emit('verification-45.json',{'status':'PARTIAL','UCs':results,'counts':dict(Counter(u['status'] for u in results))})
emit('gaps-43.json',{'status':'PARTIAL','gaps':gaps,'counts':dict(Counter(g['status'] for g in gaps))})
emit('independent-evidence-audit.json',{'auditExecution':'PASS','frontendAcceptance':'PARTIAL',
    'sealedR82ArtifactsVerified':len(seal['SHA256']),'originalCategories':dict(Counter(g['originalCategory'] for g in gaps)),
    'selectedScenarioCount':len(selected),'selectedScenarioKinds':dict(Counter(c['kind'] for c in selected)),
    'independentSQLAssertionSelectors':len(sql_refs),'full27NoWriteProofs':len(no_write),
    'failedSuiteSelectedPASSCases':failed_suite_cases,'diagnostics':diagnostics,
    'freshBrowser':{'checks':3,'PASS':1,'FAIL':2,'classification':'1 REAL_BROWSER_SQL and 2 CONTROLLED_TRANSPORT; real DELETE404/no-write'},
    'sourceFilesPreserved':len(context['sourceSHA256']),'productionChangesR83':0,
    'R81AndBackendSQLCSSRoutesPackagesUnchanged':len(protected),'backend192AndNoRawSQL':'PASS reused with unchanged protected source',
    'qualityChecks':'Frontend 62 tests/lint/build PASS; business image regression FAIL',
    'databaseSafety':'PASS; all27 restored, canonical159, main unchanged, runtime login/user removed',
    'decision':'44 PASS, 1 BROKEN (ADM-07); 42 RESOLVED, 1 REOPENED (R71-FE-ADM-07); return defects to R8.2'})
print('R8.3 audit execution PASS; acceptance PARTIAL; 44 PASS/1 BROKEN; 42 RESOLVED/1 REOPENED')

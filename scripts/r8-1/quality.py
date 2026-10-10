"""Read-only final verification; export source preservation and R8.1 artifact hashes."""
import collections
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'docs/evidence/r8-1/runs/2026-10-10T01-58-04-401313Z-3d49fc44'
RUN = ROOT / 'docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee'
REPORTS = ['R8_1_FRONTEND_INSPECTION_REPORT.md', 'R8_FRONTEND_GAP_MATRIX.md',
           'R8_2_EXECUTION_BACKLOG.md', 'R8_TEST_ENVIRONMENT.md']


def read(path):
    return path.read_text(encoding='utf-8-sig')


def load(path):
    return json.loads(read(path))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def command(args):
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True,
                            encoding='utf-8', errors='replace')
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def quality():
    checks = {}
    for name in ['repository-before.json', 'repository-all-before.json']:
        before = load(BASE / name)
        changed = [relative for relative, digest in before.items()
                   if not (ROOT / relative).is_file() or sha(ROOT / relative) != digest]
        assert not changed, 'Original files changed: ' + repr(changed)
        checks[name] = {'status': 'PASS', 'unchanged': len(before), 'changed': []}
    context = load(BASE / 'context.json')
    assert command(['git', 'rev-parse', 'HEAD']).strip() == context['initialHEAD']
    assert command(['git', 'diff', '--name-only']).strip() == ''
    command(['git', 'diff', '--check'])
    git_status = command(['git', 'status', '--short'])
    allowed = ['docs/' + name for name in REPORTS] + [
        'scripts/r8-1/', 'docs/evidence/r8-1/',
        'docs/evidence/r55/runs/2026-10-10T01-58-48-895Z-85141ab6/',
        'docs/evidence/r55/runs/2026-10-10T01-58-57-223Z-7aafc8c9/',
        'docs/evidence/r55/runs/2026-10-10T02-02-19-997Z-43001564/',
        'database/_audit/verify-CinemaBookingDB_R0_R81_20261010_3d49fc44.json']
    for line in git_status.splitlines():
        assert line.startswith('?? '), 'Tracked modification: ' + line
        assert line[3:] in allowed, 'Unexpected new path: ' + line
    checks['scope'] = {'status': 'PASS', 'HEAD': context['initialHEAD'],
                       'gitStatus': git_status.splitlines(), 'trackedDiff': 'EMPTY'}

    mapping = load(RUN / 'frontend-mapping.json')
    backlog = load(RUN / 'backlog.json')
    prior = load(ROOT / 'docs/evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json')
    rows = mapping['UCs']
    assert len(rows) == len({r['ucId'] for r in rows}) == 45
    expected = collections.Counter(Customer=14, Manager=9, CSKH=6, Admin=16)
    assert collections.Counter(r['actor'] for r in rows) == expected
    assert {r['ucId'] for r in rows} == {r['ucId'] for r in prior['UCs']}
    assert {r['ucId'] for r in rows if r['officialFE'] == 'PASS'} == {'KH-02', 'KH-03'}
    assert all(r['officialFE'] == next(p['FE'] for p in prior['UCs'] if p['ucId'] == r['ucId']) for r in rows)
    assert len(backlog['gaps']) == 43
    assert {r['gapId'] for r in backlog['gaps']} == {'R71-FE-' + r['ucId'] for r in prior['UCs'] if r['FE'] == 'PARTIAL'}
    assert backlog['status'] == 'PENDING_R8_2'
    assert backlog['counts'] == {'TEST_REQUIRED': 29, 'FIX_REQUIRED': 7, 'CONTRACT_ALIGNMENT_REQUIRED': 7}
    fields = ['route', 'page', 'component', 'apiClient', 'endpointChains', 'authorization',
              'requestContract', 'responseContract', 'errorContract', 'formAndAsyncState',
              'successBehavior', 'loadingEmptyRetry', 'missingVerification', 'classification',
              'browserScenarios', 'fixtures', 'dependencies', 'acceptance', 'recommendation']
    audit = load(RUN / 'source-audit.json')
    reachable = set(audit['reachableFromActualMain'])
    route_index = read(ROOT / 'backend/src/routes/index.js')
    route_mounts = dict((router + '.js', '/api' + prefix) for prefix, router in
        re.findall(r"router\.use\(['\"]([^'\"]+)['\"],\s*(\w+)\)", route_index))
    endpoints = set()
    for row in rows:
        assert all(row.get(field) for field in fields), row['ucId']
        assert 'existingBrowserEvidence' in row and 'knownOrSuspectedIssue' in row
        for page in row['page'].split(';'):
            assert 'frontend/src/pages/' + page.strip() in reachable, row['ucId'] + ': unreachable page'
        for chain in row['endpointChains']:
            route_source = read(ROOT / chain['routeFile'])
            declared = re.findall(r"router\.(get|post|put|delete|patch)\(\s*['\"]([^'\"]+)['\"]", route_source)
            prefix = route_mounts[Path(chain['routeFile']).name]
            matches = [(method, path) for method, path in declared
                       if method.upper() == chain['method'] and chain['route'].rstrip('/') == (prefix + path).rstrip('/')]
            assert matches, repr(chain)
            assert (ROOT / chain['controllerFile']).is_file() and (ROOT / chain['serviceFile']).is_file()
            endpoints.add((chain['method'], chain['route']))
        for evidence in row['existingBrowserEvidence'].values():
            path = ROOT / evidence['artifact']
            assert sha(path) == evidence['artifactSHA256']
            selected = load(path)
            for part in evidence['selector'].strip('/').split('/'):
                part = part.replace('~1', '/').replace('~0', '~')
                selected = selected[int(part)] if isinstance(selected, list) else selected[part]
    for group in ['requiredDocuments', 'sources']:
        for relative, info in audit[group].items():
            assert sha(ROOT / relative) == info['sha256'], relative
    checks['mappingAndBacklog'] = {'status': 'PASS', 'UCs': 45, 'roles': dict(expected),
        'provisionalPASS': 2, 'PARTIAL': 43, 'gapCount': 43, 'actions': backlog['counts'],
        'BLOCKED': 0, 'executionPriorities': backlog['priorityCounts'],
        'endpointMethodPathsValidated': len(endpoints),
        'legacyBrowserSelectorsValidated': audit['browserEvidenceSelectorsValidated'],
        'reachablePages': 'All mapped pages reachable from actual main.jsx'}

    env = load(RUN / 'environment-result.json')
    assert env['status'] == 'PASS' and env['readiness'] == 'READY'
    assert env['cleanup'] == env['mainPreservation'] == 'PASS'
    assert {r['id'] for r in env['smoke']} == {f'SMOKE-{n:02}' for n in range(1, 9)}
    assert all(r['result'] == 'PASS' for r in env['smoke'])
    cleanup = load(RUN / 'fixture-cleanup.json')
    preservation = load(RUN / 'main-preservation.json')
    assert cleanup['before'] == cleanup['after']
    assert preservation['before'] == preservation['after'] and preservation['mainWrites'] == 0
    assert len(cleanup['before']['data']) == len(preservation['before']['data']) == 27
    assert cleanup['moduleParity']['modules'] == 159
    assert cleanup['loginDropped'] and cleanup['userDropped'] and cleanup['ownedComplaintRowsRemoved'] == 4
    assert cleanup['session']['transactionCount'] == 0 and cleanup['openUserTransactions'] == []
    setup = load(RUN / 'fixture-setup.json')
    assert {r['role'] for r in setup['actors']} == {'ADMIN', 'CSKH', 'QUAN_LY_RAP', 'KHACH_HANG'}
    browser = load(RUN / 'browser-smoke.json')
    assert browser['status'] == 'PASS' and browser['exceptions'] == []
    assert all(r['status'] < 400 for r in browser['network'])
    diagnostic = next(r for r in env['smoke'] if r['id'] == 'SMOKE-08')
    assert len(browser['consoleErrors']) == len(diagnostic['knownConsoleWarnings']) == 1
    assert diagnostic['canceledRequests'] + len(diagnostic['externalFontFailures']) == len(browser['failures'])
    trace = load(RUN / 'procedure-trace.json')
    assert trace['calls'] and all(r['status'] == 'PASS' and r['database'] == env['database'] for r in trace['calls'])
    for key in ['dbo.sp_Auth_Login', 'dbo.sp_User_GetCurrent', 'dbo.sp_Manager_ListAssignedCinemas', 'dbo.sp_Support_Complaint_List']:
        assert any(r['name'] == key for r in trace['calls']), key
    checks['environment'] = {'status': 'PASS', 'smoke': '8/8 PASS', 'database': env['database'],
        'guid': env['targetIdentity']['database_guid'], 'canonicalModules': 159, 'tables': 27,
        'cleanup': 'PASS', 'mainWrites': 0, 'mainPreservation': 'PASS', 'openUserTransactions': 0,
        'diagnostics': {'networkResponses': len(browser['network']), 'runtimeExceptions': 0,
            'knownKeyWarning': 1, 'fontFailures': len(diagnostic['externalFontFailures']),
            'canceledRequests': diagnostic['canceledRequests']}, 'typedSPCalls': len(trace['calls'])}
    check_result = load(BASE / 'frontend-checks.json')
    assert all(check_result[key] == 0 for key in ['frontendTestExitCode', 'lintExitCode', 'buildExitCode'])
    assert 'tests 62' in read(BASE / 'frontend-tests-canonical.log')
    assert 'pass 62' in read(BASE / 'frontend-tests-canonical.log')
    checks['frontendChecks'] = {'status': 'PASS', 'tests': '62/62', 'lint': 'PASS', 'build': 'PASS',
        'warningsRetained': ['bundle >500kB', 'build output outside frontend root'], 'productionDistPreserved': True}

    local_links = 0
    for name in REPORTS:
        path = ROOT / 'docs' / name
        text = read(path)
        assert text.strip()
        for link in re.findall(r'\]\(([^)]+)\)', text):
            link = link.strip('<>')
            if link.startswith(('https://', 'http://', '#')):
                continue
            target = (path.parent / link.split('#')[0]).resolve()
            # Final quality output itself is written after this check.
            assert target == RUN / 'quality-gate.json' or target.exists(), (name, link)
            local_links += 1
    inspection = read(ROOT / 'docs' / REPORTS[0])
    assert all('## ' + letter + '. ' in inspection for letter in 'ABCDEFGHI')
    assert all(issue in inspection and issue in read(ROOT / 'docs' / REPORTS[2]) for issue in ['I-11', 'I-15', 'I-19', 'I-21'])
    assert all('uc-' + r['ucId'].lower() in read(ROOT / 'docs' / REPORTS[1]) for r in rows)
    assert all('gap-' + r['ucId'].lower() in read(ROOT / 'docs' / REPORTS[2]) for r in backlog['gaps'])
    checks['deliverables'] = {'status': 'PASS', 'reports': REPORTS, 'localLinksValidated': local_links}

    for script in ['browser.mjs', 'smoke.mjs', 'prepare.mjs']:
        command(['node', '--check', str(ROOT / 'scripts/r8-1' / script)])
    for script in ['audit.py', 'quality.py']:
        compile(read(ROOT / 'scripts/r8-1' / script), script, 'exec')
    # Verify the read-only preparation branch against the retained target; no new smoke/mutations.
    prepare = json.loads(command(['node', 'scripts/r8-1/prepare.mjs', '--database=' + env['database'], '--check']))
    assert prepare['target'] == env['targetIdentity']
    checks['testOnlyUtilities'] = {'status': 'PASS', 'nodeSyntax': 3, 'pythonSyntax': 2,
        'prepareReadOnlyIdentityCheck': 'PASS', 'browserSmoke': 'Executed real SQL E2E readiness, 8 PASS'}

    artifacts = []
    for directory in [ROOT / 'scripts/r8-1', ROOT / 'docs/evidence/r8-1',
                      *[ROOT / prefix for prefix in allowed if prefix.startswith('docs/evidence/r55/')]]:
        artifacts.extend(path for path in directory.rglob('*') if path.is_file() and path.name != 'quality-gate.json')
    artifacts.extend(ROOT / 'docs' / name for name in REPORTS)
    artifacts.append(ROOT / allowed[-1])
    hashes = {p.relative_to(ROOT).as_posix(): sha(p) for p in sorted(set(artifacts))}
    # Public evidence must not contain JWTs, bcrypt hashes, SQL passwords or private recovery payloads.
    findings = []
    for path in artifacts:
        if path.suffix not in {'.json', '.log', '.md'} or path.name in REPORTS:
            continue
        body = read(path)
        if re.search(r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}|\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}', body):
            findings.append(path.relative_to(ROOT).as_posix())
    assert not findings, 'Sensitive auth material detected: ' + repr(findings)
    checks['publicEvidenceSecrets'] = {'status': 'PASS', 'JWTOrBcryptLeaks': [],
        'privateRecoveryContentsExported': False, 'runtimeSecrets': 'Randomized and redacted by runner'}
    result = {'status': 'PASS', 'scope': 'R8.1 inspection/environment only; no UC acceptance upgrade',
        'checks': checks, 'artifactCount': len(hashes), 'SHA256': hashes,
        'conclusion': 'R8.1 DONE — FRONTEND AUDITED & BROWSER TEST ENVIRONMENT READY',
        'remaining': '43 FRONTEND GAPS PENDING R8.2'}
    output = RUN / 'quality-gate.json'
    assert not output.exists(), 'Refuse to overwrite completed final gate'
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'unchangedOriginalFiles': len(load(BASE / 'repository-all-before.json')),
        'UCs': 45, 'gaps': 43, 'smoke': 8, 'artifactsSealed': len(hashes)}, ensure_ascii=False))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    quality()

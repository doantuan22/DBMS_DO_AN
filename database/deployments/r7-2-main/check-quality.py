"""Seal the completed run without connecting to SQL or changing old evidence."""
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[3]
RUN = ROOT / 'docs/evidence/main-db-deployment/runs/2026-10-09T17-02-33-287770Z-8abb07d2'
OUTPUT = RUN / 'quality.json'
REPORT = ROOT / 'docs/MAIN_DATABASE_SYNC_REPORT.md'
TOOLS = ROOT / 'database/deployments/r7-2-main'


def read(path):
    return path.read_text(encoding='utf-8-sig')


def load(path):
    return json.loads(read(path))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def hashes_match(values):
    for relative, expected in values.items():
        require(sha(ROOT / relative) == expected, 'Preservation/hash mismatch: ' + relative)
    return len(values)


def main():
    require(not OUTPUT.exists(), 'Refusing to overwrite an existing quality seal')
    original = hashes_match(load(RUN / 'repository-before.json'))
    r72 = load(ROOT / 'docs/evidence/r7-2/validation/2026-10-09T15-50-07-886Z-4fd88724/quality.json')
    r73 = load(ROOT / 'docs/evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/quality.json')
    tested = hashes_match(r72['testedSourceHashes'])
    historical = hashes_match(r73['artifacts'])
    result = load(RUN / 'result.json')
    before = load(RUN / 'before-atomic.json')
    final = load(RUN / 'final-state.json')
    post = load(RUN / 'postdeploy.json')
    backup = load(RUN / 'backup.json')
    backend = load(RUN / 'backend-compatibility.json')
    typed = load(RUN / 'backend-contract-check.json')
    owned = {'sp_Admin_User_Create', 'sp_Support_Complaint_List'}
    require(result['status'] == 'SUCCESS', 'Deployment not successful')
    require(result['mainStatus'] == 'MAIN_DB_DEPLOYMENT_VERIFIED', 'Main not verified')
    require(result['transaction'] == 'COMMIT_TWO_PROCEDURES', 'Atomic commit missing')
    require(set(result['changedModules']) == owned, 'Unexpected changed module scope')
    parity = result['finalParity']
    require(parity['status'] == 'PASS' and parity['matchingDefinitions'] == 159
            and parity['modules'] == 159 and parity['pendingDefinitions'] == [], 'Canonical parity failed')
    require(before['fingerprints']['data'] == final['fingerprints']['data']
            and len(final['fingerprints']['data']) == 27, 'Business data preservation failed')
    for category in ['schemas', 'columns', 'keys', 'foreignKeys', 'checks', 'indexes',
                     'triggers', 'principals', 'permissions', 'memberships', 'identityCounters']:
        require(before['metadata'][category] == final['metadata'][category], 'Metadata changed: ' + category)
    old = {(x['schemaName'], x['name']): x for x in before['metadata']['objects']}
    new = {(x['schemaName'], x['name']): x for x in final['metadata']['objects']}
    require(old.keys() == new.keys(), 'Object inventory changed')
    differences = {key[1] for key in old if old[key] != new[key]}
    require(differences == owned, 'Unexpected changed objects')
    for category in ['parameters', 'dependencies']:
        keep = lambda values: [x for x in values if x['objectName'] not in owned]
        require(keep(before['metadata'][category]) == keep(final['metadata'][category]),
                'Unrelated signature/dependency change: ' + category)
    require(final['protections'] == {'invalidForeignKeys': 0, 'invalidChecks': 0, 'disabledTriggers': 0},
            'Constraint/trigger protection failed')
    require(final['session']['transactionCount'] == final['session']['xactState'] == 0, 'Transaction not released')
    require(all(not rows for rows in result['finalActivity'].values()), 'Active request/transaction remains')
    require(result['dataPreservation']['status'] == 'PASS' and post['functionalPreservation']['status'] == 'PASS',
            'Preservation gate failed')
    cases = post['functional']['cases']
    require(len(cases) == 14 and all(x['result'] == 'PASS' for x in cases), 'Main probes failed')
    require(all(x['actualCount'] == x['expectedCount'] == 0 for x in cases[:10]), 'Queue evidence changed')
    require(all(x['expected'] == x['actual'] for x in cases[10:]), 'Denial mapping mismatch')
    require(post['functional']['mainDataMutationFixtures'] == 0, 'Mutation fixtures used')
    require(backend['status'] == 'PASS' and all(x['exitCode'] == 0 for x in backend['checks']), 'Backend check failed')
    tap = read(RUN / 'backend-regression.log')
    counts = {k: int(re.search(r'^# ' + k + r' (\d+)$', tap, re.M).group(1))
              for k in ['tests', 'pass', 'fail', 'cancelled', 'skipped']}
    require(counts == {'tests': 192, 'pass': 192, 'fail': 0, 'cancelled': 0, 'skipped': 0}, 'Unexpected test counts')
    require('NO RAW BUSINESS SQL IN BACKEND = PASS' in read(RUN / 'no-sql.log'), 'No-SQL check failed')
    require(typed['status'] == 'PASS' and typed['problems'] == [] and typed['capturedCalls'] == 120
            and typed['serviceMethods'] == 112 and typed['whitelistEntries'] == 120, 'Typed contracts failed')
    require(backup['status'] == 'PASS' and backup['fullBackup']['verifyOnly'] == 'PASS'
            and backup['fullBackup']['checksum'] and backup['fullBackup']['copyOnly']
            and backup['fullBackup']['databaseName'] == 'CinemaBookingDB', 'SQL backup verification failed')
    private = []
    for procedure in backup['procedures']:
        path = Path(procedure['rollbackFile']).resolve()
        require(not path.is_relative_to(ROOT), 'Private rollback SQL inside repository')
        require(sha(path) == procedure['rollbackSQLSHA256'] and procedure['syntaxCheck'] == 'PARSEONLY_PASS',
                'Private rollback readiness failed')
        private.append({'name': procedure['name'], 'file': str(path), 'sha256': sha(path), 'parseOnly': 'PASS'})
    require(len(private) == 2, 'Rollback files missing')
    report = read(REPORT)
    require(len(re.findall(r'^## [A-G]\. ', report, re.M)) == 7, 'Report sections missing')
    for phrase in ['MAIN DATABASE SYNC: DONE', 'CinemaBookingDB: CANONICAL 159/159 VERIFIED',
                   'DATA PRESERVATION: PASS', 'READY FOR R8 FRONTEND STABILIZATION']:
        require(phrase in report, 'Acceptance statement missing: ' + phrase)
    for step in result['steps']:
        require(sha(ROOT / step['source']) == step['sourceSHA256'] and step['sourceSHA256'] in report,
                'Applied source hash mismatch')
    links = 0
    documents = [REPORT, TOOLS / 'README.md', TOOLS / 'PLAN.md']
    for document in documents:
        for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', read(document)):
            if target.startswith(('http:', 'https:', 'mailto:')):
                continue
            filename, _, anchor = unquote(target.strip('<>')).partition('#')
            path = (document.parent / filename).resolve() if filename else document
            require(path == OUTPUT or path.is_file(), 'Broken link: ' + target)
            if anchor:
                body = read(path)
                explicit = re.findall(r'<a\s+[^>]*(?:id|name)=[\"\x27]([^\"\x27]+)', body)
                headings = []
                for heading in re.findall(r'^#+\s+(.+)$', body, re.M):
                    heading = re.sub(r'[^\w\- ]', '', heading.lower()).replace(' ', '-')
                    headings.append(heading)
                require(anchor in explicit + headings, 'Missing link anchor: ' + target)
            links += 1
    selectors = 0
    for row in report.splitlines():
        if not row.startswith('|'):
            continue
        targets = re.findall(r'\[[^\]]+\]\(([^)]+\.json)\)', row)
        pointers = re.findall(r'`(/[^`]+)`', row)
        if len(targets) != 1 or not pointers:
            continue
        value = load((REPORT.parent / targets[0]).resolve())
        for pointer in pointers:
            current = value
            for part in pointer[1:].split('/'):
                part = part.replace('~1', '/').replace('~0', '~')
                current = current[int(part)] if isinstance(current, list) else current[part]
            selectors += 1
    for command in [['git', 'diff', '--check'], ['node', '--check', str(TOOLS / 'deploy.mjs')],
                    ['node', '--check', str(TOOLS / 'verify.mjs')]]:
        checked = subprocess.run(command, cwd=ROOT, capture_output=True)
        require(checked.returncode == 0, 'Syntax/diff check failed: ' + ' '.join(command))
    artifacts = {str(path.relative_to(ROOT)).replace('\\', '/'): sha(path)
                 for path in sorted(list(RUN.iterdir()) + list(TOOLS.iterdir()) + [REPORT])
                 if path.is_file() and path != OUTPUT}
    quality = {
        'status': 'PASS', 'checkedAt': datetime.now(timezone.utc).isoformat(), 'deploymentID': result['deploymentID'],
        'preservedOriginalFiles': original, 'changedOriginalFiles': 0, 'productionSourceChanges': 0,
        'oldEvidenceChanges': 0, 'testedSourceHashesVerified': tested, 'R73ArtifactHashesVerified': historical,
        'canonicalParity': '159/159', 'changedMainModules': sorted(owned), 'businessTablesPreserved': 27,
        'identityCountersUnchanged': True, 'mainMutationFixtures': 0, 'mainProbeCases': 14,
        'mainHTTPBrowser': 'NOT_RUN', 'emptyQueueEvidence': '10 reads; nonempty filter evidence remains Test DB',
        'backendTests': counts, 'noSQL': 'PASS', 'typedContracts': 'PASS',
        'backupVerificationMethod': 'SQL_SERVER_RESTORE_VERIFYONLY_WITH_CHECKSUM_AND_HEADERONLY',
        'fullBackupVerification': 'PASS', 'agentBackupFilesystemAccess': 'ACCESS_DENIED_BY_OS_ACL',
        'fullBackupFileSHA256': 'NOT_COMPUTED', 'privateRollbackFiles': private, 'rollbackExecuted': False,
        'markdownLinksChecked': links, 'JSONSelectorsChecked': selectors, 'brokenLinks': [],
        'gitDiffCheck': 'PASS', 'toolingSyntax': 'PASS', 'finalSession': result['finalSession'],
        'artifacts': artifacts, 'sealExcludesSelf': True,
    }
    with OUTPUT.open('x', encoding='utf-8') as stream:
        json.dump(quality, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    print(json.dumps({k: v for k, v in quality.items() if k not in ['artifacts', 'privateRollbackFiles']}, ensure_ascii=True))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()

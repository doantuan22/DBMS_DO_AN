"""Seal an honest PARTIAL acceptance package, including failed regressions."""
from pathlib import Path
from collections import Counter
from urllib.parse import unquote
import hashlib
import json
import re
import subprocess

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/(ROOT/'scripts/r8-3/current-output.txt').read_text(encoding='utf-8')
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def emit(name,value): (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not (OUT/'quality-gate.json').exists(),'Refuse to overwrite final seal'
context=read(OUT/'context.json')
assert all(sha(ROOT/p)==h for p,h in context['sourceSHA256'].items())
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==context['HEAD']
before=read(OUT/'r82-seal-audit.json')
old=read(ROOT/'docs/evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/quality-gate.json')
for path,h in old['SHA256'].items():
    actual=OUT/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md' if path=='docs/R8_FRONTEND_GAP_MATRIX.md' else ROOT/path
    assert sha(actual)==h,path
assert sha(OUT/'USE_CASE_MATRIX_45_BEFORE_R8_3.md')==context['requiredReading']['docs/USE_CASE_MATRIX_45.md']
assert sha(OUT/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md')==context['requiredReading']['docs/R8_FRONTEND_GAP_MATRIX.md']
ucs=read(OUT/'verification-45.json')['UCs'];gaps=read(OUT/'gaps-43.json')['gaps']
assert len(ucs)==45 and Counter(u['status']for u in ucs)=={'PASS':44,'BROKEN':1}
assert len(gaps)==43 and Counter(g['status']for g in gaps)=={'RESOLVED':42,'REOPENED':1}
assert [u['ucId']for u in ucs if u['status']=='BROKEN']==['ADM-07']
assert [g['gapId']for g in gaps if g['status']=='REOPENED']==['R71-FE-ADM-07']
text=(ROOT/'docs/USE_CASE_MATRIX_45.md').read_text(encoding='utf-8')
rows=[l for l in text.splitlines()if re.match(r'\| \[[A-Z]+-\d+\]\(#uc-',l)]
assert len(rows)==45 and Counter(l.split('|')[11].strip()for l in rows)=={'PASS':44,'BROKEN':1}
runtime=[l for l in text.splitlines()if l.startswith('| PASS |') and l.count('|')==8]
assert len(runtime)==45 and Counter(l.split('|')[6].strip()for l in runtime)=={'PASS':44,'BROKEN':1}
assert text.count('**R8.3 current Frontend/Overall:')==45
gap=(ROOT/'docs/R8_FRONTEND_GAP_MATRIX.md').read_bytes()
assert gap.startswith((OUT/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md').read_bytes())
tail=gap.decode('utf-8').split('# R8.3 — Final acceptance of 43 inherited gaps')[1]
assert len(re.findall(r'^\| R71-FE-',tail,flags=re.M))==43
assert '**REOPENED**' in tail and '**RESOLVED**' in tail
docs=['docs/USE_CASE_MATRIX_45.md','docs/R8_FRONTEND_GAP_MATRIX.md','docs/R8_3_FINAL_ACCEPTANCE_REPORT.md']
checked=0
for name in docs:
    doc=ROOT/name
    for href in re.findall(r'\[[^\]\n]*\]\((<[^>\n]*>|[^\s)]+)\)',doc.read_text(encoding='utf-8')):
        href=href.strip('<>')
        if href.startswith(('http:','https:','mailto:','#')): continue
        target=unquote(href.split('#')[0])
        if not target: continue
        assert (doc.parent/target).resolve().is_file(),(name,href)
        checked+=1
report=(ROOT/docs[-1]).read_text(encoding='utf-8')
assert 'R8.3 PARTIAL — PHASE R8 NOT ACCEPTED' in report
assert 'R8.3 DONE — PHASE R8 ACCEPTED' not in report
for case in read(OUT/'browser-cases.json')['checks']:
    if case['status']=='FAIL':assert (OUT/case['screenshot']).is_file()
assert read(OUT/'environment-result.json')['browserStatus']=='REPRODUCED'
assert read(OUT/'fixture-cleanup.json')['status']=='PASS'
assert read(OUT/'main-preservation.json')['status']=='PASS'
assert read(OUT/'final-read-only-audit.json')['status']=='PASS'
tests=(OUT/'frontend-tests.log').read_text(encoding='utf-8');assert 'tests 62' in tests and 'pass 62' in tests
assert read(OUT/'frontend-checks.json')['status']=='PASS'
check=subprocess.run(['git','diff','--check'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
(OUT/'git-diff-check.log').write_text(check.stdout+check.stderr,encoding='utf-8');assert check.returncode==0
(OUT/'git-status-final.log').write_text(subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True,encoding='utf-8'),encoding='utf-8')
emit('source-preservation.json',{'status':'PASS','R83ProductionChanges':0,'currentProductionTestSQLHashesUnchanged':len(context['sourceSHA256']),
    'HEADUnchanged':True,'R82SealedArtifactsVerifiedWithAuthorizedArchive':len(old['SHA256']),
    'authorizedUpdatedDocuments':docs,'historicalArchives':[
        (OUT/'USE_CASE_MATRIX_45_BEFORE_R8_3.md').relative_to(ROOT).as_posix(),
        (OUT/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md').relative_to(ROOT).as_posix()]})
emit('defects.json',{'status':'OPEN','returnPhase':'R8.2','ucId':'ADM-07','gapId':'R71-FE-ADM-07','defects':[
    {'id':'R83-FE-01','severity':'P1','title':'Failed cinema switch exposes stale image rows and wrong-resource mutation controls',
        'source':'frontend/src/components/CinemaImageManager.jsx','sourceLine':32,'evidenceSelector':'browser-cases.json#/checks/1',
        'actualRequest':'DELETE /api/admin/cinemas/2/images/1 -> real404','actualDatabaseWrites':'NONE; full27 no-write proof',
        'requiredAcceptance':'Failed/late reads never expose/mutate another cinema collection; exact owner target; success/error/retry preserved'},
    {'id':'R83-FE-02','severity':'P1','title':'Cinema-list retry clears error without calling failed list API',
        'source':'frontend/src/components/CinemaImageManager.jsx','sourceLine':86,'evidenceSelector':'browser-cases.json#/checks/2',
        'actualRequest':'No retry GET /api/admin/cinemas; error hidden and only placeholder option',
        'requiredAcceptance':'Retry reloads cinema list; feedback and authorized options restore; image-list retry stays scoped'}]})
# Public raw evidence must never contain actual JWTs or bcrypt password values.
for p in OUT.rglob('*'):
    if p.is_file() and p.suffix in ('.json','.log','.md'):
        s=p.read_text(encoding='utf-8',errors='replace')
        assert not re.search(r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}',s),p
        assert not re.search(r'\$2[aby]\$\d\d\$[A-Za-z0-9./]{53}',s),p
files=[p for p in OUT.rglob('*')if p.is_file() and p.name!='quality-gate.json']
files += [ROOT/p for p in docs]+[p for p in (ROOT/'scripts/r8-3').rglob('*')if p.is_file()]
manifest={p.relative_to(ROOT).as_posix():sha(p)for p in files}
emit('quality-gate.json',{'status':'PARTIAL','verificationExecution':'PASS','phaseR8Accepted':False,
    'acceptanceCounts':{'Frontend':{'PASS':44,'PARTIAL':0,'BROKEN':1,'MISSING':0},'gaps':{'RESOLVED':42,'REOPENED':1}},
    'checks':{'independentEvidenceAudit':'PASS','frontend62LintBuild':'PASS','regression':'FAIL: 2 ADM-07 cases',
        'noMaterialFrontendDefects':'FAIL: R83-FE-01/R83-FE-02','database27Modules159CleanupMain':'PASS',
        'productionSourcePreservation':'PASS','documentationLinksCounts':'PASS','publicEvidenceSecretScan':'PASS'},
    'verifiedDocumentLinks':checked,'R82SealedArtifactsVerified':len(old['SHA256']),
    'artifactCount':len(manifest),'SHA256':manifest,'remaining':['Fix two ADM-07 defects through R8.2','Reverify affected gaps/UC and regressions before R8 acceptance']})
print(json.dumps({'status':'PARTIAL','verificationExecution':'PASS','FrontendPASS':44,'BROKEN':1,'gapsResolved':42,'reopened':1,
    'verifiedDocumentLinks':checked,'sealedArtifacts':len(manifest)}))

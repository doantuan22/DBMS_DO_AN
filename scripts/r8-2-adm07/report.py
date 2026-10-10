"""Describe hotfix evidence without changing historical R8.3 acceptance."""
from pathlib import Path
from collections import Counter
import difflib
import hashlib
import json

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/(ROOT/'scripts/r8-2-adm07/current-output.txt').read_text(encoding='utf-8')
E=OUT.relative_to(ROOT/'docs').as_posix()
def read(name):return json.loads((OUT/name).read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def link(name,label=None):return f'[{label or name}]({E}/{name})'
context=read('context.json');cases=read('browser-cases.json')['checks'];diag=read('browser-diagnostics.json')
assert len(cases)==19 and all(c['status']=='PASS'for c in cases)
assert read('environment-result.json')['browserStatus']=='PASS'
assert read('fixture-cleanup.json')['status']=='PASS' and read('main-preservation.json')['status']=='PASS'
assert read('frontend-checks.json')['status']=='PASS' and read('final-read-only-audit.json')['status']=='PASS'
assert not diag['exceptions'] and not diag['consoleErrors'] and not diag['harnessErrors']
changed=[p for p,h in context['beforeSHA256'].items()if sha(ROOT/p)!=h]
assert changed==['frontend/src/components/CinemaImageManager.jsx'],changed
newtest='frontend/tests/cinemaImageManager.test.js'
source=ROOT/'frontend/src/components/CinemaImageManager.jsx'
patch=''.join(difflib.unified_diff((OUT/'CinemaImageManager_BEFORE.jsx').read_text(encoding='utf-8').splitlines(True),source.read_text(encoding='utf-8').splitlines(True),fromfile='a/frontend/src/components/CinemaImageManager.jsx',tofile='b/frontend/src/components/CinemaImageManager.jsx'))
patch+=''.join(difflib.unified_diff([], (ROOT/newtest).read_text(encoding='utf-8').splitlines(True),fromfile='/dev/null',tofile='b/'+newtest))
(OUT/'hotfix.patch').write_text(patch,encoding='utf-8')
preservation={'status':'PASS','HEAD':context['HEAD'],'baselineFiles':len(context['beforeSHA256']),'existingFilesChanged':changed,
    'newFrontendTests':[newtest],'backendSharedSQLCSSRoutesPackagesAndOther44UCSource':'UNCHANGED',
    'historicalR82R83EvidenceAndMatrices':'UNCHANGED','FrontendSourceSHA256':read('frontend-checks.json')['sourceSHA256']}
(OUT/'source-preservation.json').write_text(json.dumps(preservation,indent=2)+'\n',encoding='utf-8')
tracking={'status':'HOTFIX_DONE','phase':'R8.2 ADM-07 hotfix','UC':'ADM-07','gap':'R71-FE-ADM-07',
    'defects':{'R83-FE-01':{'status':'FIX_VERIFIED','caseSelector':'browser-cases.json#/checks/2'},
               'R83-FE-02':{'status':'FIX_VERIFIED','caseSelectors':['browser-cases.json#/checks/3','browser-cases.json#/checks/4']}},
    'ADM07':'REGRESSION_PASS','R83ReAcceptance':'PENDING','phaseR8Accepted':False,
    'historicalR83Conclusion':'PARTIAL unchanged; no automatic official UC/gap acceptance upgrade'}
(OUT/'hotfix-tracking.json').write_text(json.dumps(tracking,indent=2)+'\n',encoding='utf-8')

descriptions=[
    'Admin login; cinema create/read/update qua UI, SQL exact IDs/address',
    'Image create/read/update/reorder/status; empty list; set cover và SQL một cover',
    'GET B503: ảnh A reset ngay; không có row cũ/PUT/DELETE; disabled submit + handler no-write',
    'Image retry gọi đúng B/images; giữ error khi pending, phục hồi rows/interaction',
    'Cinema-list503 retry đúng /admin/cinemas; giữ error, selector và images phục hồi',
    'A→B→A response success sai thứ tự, latest A thắng; full27 no-write',
    'A→B→A stale503 không ghi lỗi vào A mới; full27 no-write',
    'Foreign image update/delete/cover404, nonexistent cinema404, invalid400, inactive cover409; no-write',
    'Create A pending rồi chọn B: một POST A, commit A, không refresh/notice A ở B',
    'Update A pending rồi chọn B: đúng A/imageA, B unchanged, không late refresh',
    'Delete A pending rồi chọn B: đúng A/imageA, B unchanged, không late refresh',
    'Set cover A pending rồi chọn B: đúng A/imageA, single cover A, B unchanged',
    'GET refresh của mutation A về muộn sau chọn B bị bỏ qua',
    'A→B→A khi write pending: old-context error bị bỏ qua kể cả quay về cùng ID',
    'Immediate double-click create chỉ một POST và một SQL row',
    'Current Admin QL_RAP revoked: GET và bốn writes403/no-write; UI không expose module',
    'Actual Customer/Manager/CSKH login: GET và bốn writes403/full27 no-write',
    '390px/1440px, không overflow, Tab/focus/select labels; CSS identity unchanged',
    'UI delete toàn bộ owned images → empty; delete cả hai empty cinemas; SQL zero rows',
]
rows='\n'.join(f"| {c['id']} | {c['kind']} | **{c['status']}** | {descriptions[i]} | {link('browser-cases.json',f'Case {i}')} `/checks/{i}` |"for i,c in enumerate(cases))
old='evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88'
report=f'''# R8.2 — ADM-07 Hotfix Report

**HOTFIX DONE — R83-FE-01 PASS, R83-FE-02 PASS, ADM-07 REGRESSION PASS.** Ngày 10/10/2026, Asia/Saigon.

Frontend **65/65 tests**, lint và production build PASS. Browser thật **19/19 cases PASS** trên React AppRoutes → Express production → typed Stored Procedures → SQL Server Test DB. Main DB preservation PASS. **R8.3 nghiệm thu lại PENDING; không đánh dấu Phase R8 DONE/ACCEPTED.**

## 1. Baseline và phạm vi

Đã đọc [R8.3 Final Acceptance Report](R8_3_FINAL_ACCEPTANCE_REPORT.md), raw defect cases `/checks/1`, `/checks/2`, screenshots, wrong-resource HTTP và SQL no-write. R8.3 PARTIAL là checkpoint lịch sử giữ nguyên. Trước sửa, component khớp SHA trong R8.3 baseline; toàn bộ 55 artifacts trong R8.3 seal được xác minh, không chạy lại từ đầu các phase cũ.

Chỉ sửa production [CinemaImageManager.jsx](../frontend/src/components/CinemaImageManager.jsx). Thêm [cinemaImageManager.test.js](../frontend/tests/cinemaImageManager.test.js); test tooling/evidence mới dưới `scripts/r8-2-adm07/` và `docs/evidence/r8-2-adm07/`. Không sửa các file production khác, Backend, SQL/schema/SP, API DTO, package, router, CSS, màu, layout hoặc visual identity CinemaStar. {link('context.json','Before hashes')}; {link('source-preservation.json','Source preservation')}; {link('hotfix.patch','Exact hotfix diff')}.

## 2. Root cause và source changes

### R83-FE-01 — stale images / wrong resource

Trước sửa, `images` không có cinema owner, đổi cinema chỉ reset editor. GET B lỗi giữ array A, finally hạ shared loading và render lại A. Delete/Update/Set Cover kết hợp current `cinemaId` với image ID cũ; mutation refresh dùng current closure và chỉ so read request count.

Sau sửa, `imageList` chứa status, cinemaId, rows và error. Đổi cinema đồng bộ `currentCinema`, tăng context/read generations, reset collection/editor/notice **trước** request mới. Read result chỉ apply khi mounted, generation mới nhất và current owner khớp. Loading/error không render collection trước và nút Save bị disable; submit handler cũng chặn programmatic submit trong trạng thái không hợp lệ.

Image row mutation kiểm tra loaded owner, `RapID`, row membership và ready state. Kiểm tra `currentCinema` và read request generation trực tiếp tại thời điểm gọi mutation bảo vệ cả handler giữ closure cũ. Create xác minh selected cinema thuộc authoritative list đã tải, loaded image context sẵn sàng. Bốn mutations capture cinema/image/payload trước await, giữ synchronous pending guard. Async success/error/refresh chỉ apply khi mounted và context generation/owner vẫn khớp. A→B→A tăng generation nên write A đầu không khôi phục notice/editor của A mới dù cùng ID; explicit refresh dùng captured ID.

### R83-FE-02 — retry sai API

Trước sửa, cinema-list read và image-list read dùng chung loading/error; Retry luôn gọi `loadImages()`. Không có selected cinema làm clear error rồi return, không gửi GET cinema list.

Sau sửa, `cinemaList`/`imageList` có status/error/generation riêng. `loadCinemas` và `loadImages` có retry handler riêng; image retry đọc current cinema. Error được giữ khi retry pending, chỉ clear sau successful response hoặc đổi image context có chủ đích. Loading/error không biến thành legitimate empty. Sau retry thành công, selector, image rows và controls phục hồi.

Generation/mounted checks cũng bảo vệ late initial cinema-list request. Giữ nguyên API authority cho grants, scope, image state và cover invariants; không suy diễn permission từ UI hoặc thêm logic Backend.

## 3. Kết quả trước/sau

| Defect | Trước sửa — evidence R8.3 | Sau sửa — evidence mới | Hotfix tracking |
| --- | --- | --- | --- |
| R83-FE-01 | **FAIL**: GET B503 vẫn một row A; DELETE B/imageA real404; SQL không đổi. [Raw]({old}/browser-cases.json) `/checks/1`, [HTTP]({old}/image-wrong-resource-request.json) | **PASS**: loading/error B không có row A, no UI mutation, disabled save và programmatic submit no-write. {link('browser-cases.json')} `/checks/2`; A→B→A/pending cases bổ sung | FIX_VERIFIED |
| R83-FE-02 | **FAIL**: Retry không gọi cinema list, alert biến mất, chỉ placeholder. [Raw]({old}/browser-cases.json) `/checks/2`, [Observation]({old}/image-list-retry-observation.json) | **PASS**: đúng cinema-list và current image-list APIs, giữ alert trong pending, phục hồi dữ liệu/interaction. {link('browser-cases.json')} `/checks/3`, `/checks/4` | FIX_VERIFIED |

Baseline FAIL còn nguyên; không sửa test expected để ép PASS. Assertions mới yêu cầu desired resource/error behavior và SQL invariants. Tracking: [R8_2_ADM07_HOTFIX_TRACKING.md](R8_2_ADM07_HOTFIX_TRACKING.md); {link('hotfix-tracking.json')}.

## 4. Browser regression và SQL evidence

Chrome thật, actual index/main/AppRoutes/AuthProvider, production Express, real typed mssql `Request.execute`. Bốn role đăng nhập qua actual UI; private legitimate sessions chỉ tái sử dụng sau real login, Auth/me vẫn gọi thật. Không có mock component app hay fake database.

| Case ID | Evidence class | Kết quả | Phạm vi / assertions | Raw selector |
| --- | --- | --- | --- | --- |
{rows}

**7 REAL_BROWSER_SQL + 12 CONTROLLED_TRANSPORT**, tổng19; **15 independent SQL assertions**, **8 full27 no-write proofs**. Không cộng các số khác đơn vị thành test count. Raw {link('browser-cases.json')}, {link('browser-diagnostics.json','HTTP/control/console ranges')}, {link('procedure-trace.json','Real SP trace')}, {link('sql-assertions.json')}, {link('fixture-ids.json','Actual fixture IDs')}.

Controlled scenarios chỉ delay/substitute response của request thật sau backend execution. GET503 là transport fault, không phải chứng minh SQL/backend thực sự503. Riêng late-write503 case backend đã commit200, SQL xác nhận persisted A; old error bị bỏ qua trong context mới, **không tuyên bố rollback write**. Supplemental denied/foreign/invalid API cases dùng real browser fetch với actual authenticated session; chúng không thay thế positive UI CRUD.

No accidental wrong-resource UI PUT/DELETE: failed-switch case không có mutation request, pending writes capture đúng A/imageA và B SQL rows không đổi. Programmatic submit ở trạng thái image error dùng form **đã điền URL hợp lệ/checkValidity=true**, vẫn không POST; no-write không chỉ do HTML required validation. Test invalid-ownership **chủ động** gửi B/imageA qua browser REST để kiểm tra canonical404/full27 no-write; đây là negative authorization/scope evidence, không phải UI phát sai request. {link('fe01-no-stale-observation.json')}; {link('no-write-failed-image-switch.json')}; {link('no-write-invalid-ownership.json')}; {link('pending-create.json')}; {link('pending-update.json')}; {link('pending-delete.json')}; {link('pending-cover.json')}.

Đủ cinema create/read/update/delete; image create/read/update/delete/reorder/cover/status, empty, inactive cover409, invalid400, foreign404, revoked/foreign role403, retry/recovery, stale success/error, pending/race/double-submit. SQL confirms single cover, exact owner/value, một row cho double-create; cuối journey UI xóa sạch hai owned cinemas/images, fixture cleanup kiểm tra lại toàn27.

## 5. Quality gates và ảnh hưởng 44 UC đã PASS

| Gate | Kết quả | Evidence |
| --- | --- | --- |
| Frontend tests | **65/65 PASS**: 62 existing + 3 new SSR component checks | {link('frontend-tests.log')} |
| Lint | PASS / exit0 | {link('frontend-lint.log')} |
| Production build | PASS / exit0, output riêng trong evidence | {link('frontend-build.log')} |
| ADM-07 browser regression | **19/19 PASS** | {link('browser-cases.json')} |
| Console / React warnings / exceptions / unexplained harness errors | **0 / 0 / 0 / 0** | {link('browser-diagnostics.json')} |
| Responsive / keyboard | 390px và1440px PASS, no overflow, Tab/focus/labels | {link('HF-images-390.png','390px')}; {link('HF-images-1440.png','1440px')} |
| Diff/source/history preservation | PASS, chỉ một existing production file đổi trong hotfix | {link('source-preservation.json')}; {link('hotfix.patch')} |
| Main DB và fixture safety | PASS | {link('main-preservation.json')}; {link('fixture-cleanup.json')} |

Ba test mới là SSR component checks cho permission AND, initial loading/selector disabled, không expose editor/empty/mutation khi chưa chọn rạp. Không dùng các test đó làm bằng chứng async race hay SQL E2E; các nhánh ấy có actual browser tests riêng.

Không chạy lại toàn45 UC vì chỉ `CinemaImageManager` đổi và component chỉ được mount trong AdminPortal/Ảnh rạp. Source/backend/shared/router/contracts của **44 UC khác không đổi**, toàn65 existing/new FE regression PASS; cả Customer/Manager/CSKH actual login và grant behavior có browser regression bổ sung. Evidence 44 PASS R8.3 còn là lịch sử hợp lệ cho source không đổi; hotfix không tự nâng official matrix hoặc kết luận nghiệm thu R8.3.

## 6. Database safety

Chỉ mutation trên **CinemaBookingDB_R0_R81_20261010_3d49fc44**, server **DESKTOP-E67DPCV**, database_id48, GUID **33876608-D109-43B5-ACEC-0B84C2639A73**, exact reviewed identity guard. Runtime login unique `cinema_r82hf_*`, EXECUTE trên test dbo, không connect được **CinemaBookingDB**. Main chỉ SELECT/fingerprint, mainWrites0.

Canonical **27 tables / 159 modules** kiểm tra trước, cleanup và fresh final read-only audit. Owned cinema/image fixtures tạo/xóa qua real UI. Legacy isolated runner setup bốn complaint rows và temporary fixture passwords trên Test DB; scope được ghi trong fixture setup, không seed Main DB. Revoked grant fixture restore đúng timestamp trong finally. Full27 data/metadata fingerprints restore baseline; passwords, test user/login được thu hồi. FK/CHECK/triggers còn enabled/trusted, zero open user transactions, zero runtime users/logins còn lại.

Main data/metadata toàn27 không đổi trước/sau và khớp fresh read-only audit với baseline trước hotfix. Không sửa Stored Procedure/schema hoặc deploy main. Identity counter holes trên disposable Test DB giữ theo quy ước fixture, không reseed/disable protections.

{link('startup.json','Isolation proof')}; {link('fixture-setup.json')}; {link('fixture-cleanup.json')}; {link('main-preservation.json')}; {link('final-read-only-audit.json')}; {link('no-write-admin-revoked-grant.json','Revoked grants no-write')}.

## 7. Vấn đề còn tồn tại và bàn giao

Không còn reproduced stale-image/wrong-resource/retry defect trong phạm vi hotfix. Browser navigation/StrictMode có aborted local API reads và external font/image access denied được ghi trong diagnostics; không có unexplained local failure hay runtime/React error. Deliberate503 và negative400/403/404/409 là test cases có phân loại. External font fallback và build chunk>500kB warning giữ nguyên; không redesign hay mở rộng tối ưu bundle trong hotfix. Lượt hotfix trước khi bổ sung event-time guard và valid-form submit test cũng19 PASS, được giữ nguyên tại `{context.get('priorHotfixRun','N/A')}`; kết quả trong báo cáo này chỉ tính19 cases trên source cuối, không cộng lượt cũ thành38 scenarios.

**R8.3 nghiệm thu lại PENDING.** Lịch sử vẫn 44 PASS/1 BROKEN, 42 accepted/1 REOPENED, Phase R8 NOT ACCEPTED ở checkpoint R8.3 trước hotfix; report/matrix/evidence lịch sử không chỉnh sửa. Tracking hotfix ADM-07 ghi REGRESSION_PASS và hai defect FIX_VERIFIED để lần R8.3 kế tiếp xét lại, không tự đánh dấu 45/45 final PASS.

Hồ sơ cuối: {link('quality-gate.json','Quality gate và SHA256 seal')}; chỉ xác nhận hotfix, `phaseR8Accepted=false`.

**HOTFIX DONE.** Dừng sau báo cáo và chờ yêu cầu nghiệm thu lại R8.3.
'''
(ROOT/'docs/R8_2_ADM07_HOTFIX_REPORT.md').write_text(report,encoding='utf-8')
tracking_md=f'''# R8.2 — ADM-07 Hotfix Tracking

**HOTFIX DONE / R8.3 RE-ACCEPTANCE PENDING.** Ngày 10/10/2026.

| Item | Hotfix status | Evidence | Final acceptance |
| --- | --- | --- | --- |
| R83-FE-01 | **FIX_VERIFIED — PASS** | {link('browser-cases.json')} `/checks/2`, `/checks/5…6`, `/checks/8…13`; SQL/no-write owner proof | PENDING R8.3 |
| R83-FE-02 | **FIX_VERIFIED — PASS** | {link('browser-cases.json')} `/checks/3`, `/checks/4`; correct API/error retention/recovery | PENDING R8.3 |
| ADM-07 / R71-FE-ADM-07 | **REGRESSION_PASS — 19/19** | {link('hotfix-browser-summary.json')}; {link('hotfix-tracking.json')} | PENDING R8.3 |
| Quality / safety | **PASS — 65 tests, lint, build, canonical27/159, cleanup, main preserved** | {link('frontend-checks.json')}; {link('final-read-only-audit.json')} | Chỉ hotfix scope |

[Hotfix report](R8_2_ADM07_HOTFIX_REPORT.md). Không sửa kết luận lịch sử [R8.3 PARTIAL](R8_3_FINAL_ACCEPTANCE_REPORT.md), official 45-UC/gap matrices hoặc evidence cũ. Không đánh dấu Phase R8 DONE/ACCEPTED.
'''
(ROOT/'docs/R8_2_ADM07_HOTFIX_TRACKING.md').write_text(tracking_md,encoding='utf-8')
print(json.dumps({'status':'HOTFIX_DONE','browserCases':len(cases),'classes':dict(Counter(c['kind']for c in cases)),
    'SQLAssertions':len(read('sql-assertions.json')['assertions']),'noWriteProofs':len(list(OUT.glob('no-write-*.json'))),
    'productionFilesChanged':changed,'R83Acceptance':'PENDING'}))

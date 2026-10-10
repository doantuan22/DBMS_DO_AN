"""Publish R8.3 review documents; preserve historical assessments explicitly."""
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/(ROOT/'scripts/r8-3/current-output.txt').read_text(encoding='utf-8')
E=OUT.relative_to(ROOT/'docs').as_posix()
def load(name): return json.loads((OUT/name).read_text(encoding='utf-8'))
ucs=load('verification-45.json')['UCs']; gaps=load('gaps-43.json')['gaps']
def evidence(name,label=None): return f'[{label or name}]({E}/{name})'
counts='''| Vai trò | Tổng | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 15 | 0 | 1 | 0 |
| **Tổng** | **45** | **44** | **0** | **1** | **0** |'''
gapcounts='''| Category gốc R8.1 | Tổng | RESOLVED được nghiệm thu | REOPENED | Thiếu implementation |
| --- | ---: | ---: | ---: | ---: |
| FIX_REQUIRED | 7 | 7 | 0 | 0 |
| CONTRACT_ALIGNMENT_REQUIRED | 7 | 7 | 0 | 0 |
| TEST_REQUIRED | 29 | 28 | 1 | 0 |
| **Tổng** | **43** | **42** | **1** | **0** |'''
ucrows='\n'.join(f"| {u['ucId']} | {u['actor']} | {u['name']} | **{u['status']}** | [{u['primaryRealBrowserSQL']['id']}]({u['primaryRealBrowserSQL']['artifact'][5:]}) `{u['primaryRealBrowserSQL']['selector']}` | {evidence('verification-45.json',f'UC {i}')} `/UCs/{i}` |" for i,u in enumerate(ucs))
gaprows='\n'.join(f"| {g['gapId']} | {g['ucId']} | {g['originalCategory']} | **{g['status']}** | {evidence('verification-45.json',g['ucId'])} `/UCs/{next(i for i,u in enumerate(ucs) if u['ucId']==g['ucId'])}` | {'R83-FE-01, R83-FE-02; chuyển R8.2' if g['status']=='REOPENED' else 'Source + browser/HTTP/SP/SQL selectors được đối chiếu'} |" for g in gaps)

report=f'''# R8.3 — Final Frontend Verification & Acceptance

**R8.3 PARTIAL — PHASE R8 NOT ACCEPTED.** Ngày 10/10/2026, Asia/Saigon.

Đã hoàn tất kiểm tra độc lập và xuất hồ sơ nghiệm thu. Có **44/45 Frontend PASS, 1 BROKEN (ADM-07)**; **42/43 gaps RESOLVED được nghiệm thu, 1 REOPENED**. Hai defect material ở quản lý ảnh rạp phải xử lý qua R8.2. Không đạt Definition of Done; không chuyển phase tiếp theo và không sửa production code trong R8.3.

## 1. Phạm vi và phương pháp

Đã đọc roadmap, R8.1 inspection, R8.2 implementation, R8 gap matrix, R8.2 verification matrix và matrix 45 UC. Đối chiếu trực tiếp 11 file Frontend đã thay ở R8.2, routes/AuthProvider/API clients, contracts và helpers/assertions browser. Baseline HEAD `{load('context.json')['HEAD']}`; đây là working tree R8.2 đang có sẵn, không reset/checkout hay triển khai lại công việc cũ.

Kiểm chứng SHA256 của **1.171 artifacts** trong seal R8.2 trước khi thay tài liệu. Kiểm tra từng primary case của 45 UC, 121 supplemental/primary scenario IDs, JSON Pointer, HTTP ranges, real typed SP traces, SQL assertions, no-write fingerprints và cleanup. Kết luận R8.2 DONE không được dùng làm bằng chứng tự động. {evidence('r82-seal-audit.json','Seal audit')}; {evidence('independent-evidence-audit.json','Independent audit')}; {evidence('context.json','Baseline/source hashes')}.

Tái sử dụng evidence còn hợp lệ, chạy mới Frontend tests/lint/build, ba browser cases ADM-07 và read-only Database audit. Hai negative cases mới dùng response-stage fault injection trên backend/SQL thật; phân loại CONTROLLED_TRANSPORT. Không sửa backend, Stored Procedures, CSS, palette, font, routes, production Frontend hoặc test R8.2 đã seal.

## 2. 45 Use Case — kết quả theo vai trò

{counts}

Database/Backend giữ nghiệm thu 45/45 PASS của R7; Frontend và Overall hiện là 44 PASS/1 BROKEN. Hai UC KH-02/KH-03 có actual AppRoutes regression trong journey R8.2, không dựa riêng fixture MemoryRouter lịch sử. Bảng chính và trạng thái từng UC đã cập nhật tại [USE_CASE_MATRIX_45.md](USE_CASE_MATRIX_45.md).

| UC | Vai trò | Chức năng | Frontend cuối | Primary actual browser SQL | Audit HTTP/SP/SQL/auth/state |
| --- | --- | --- | --- | --- | --- |
{ucrows}

Mỗi record `/UCs/N` của {evidence('verification-45.json')} liên kết primary UI, HTTP thật, SP canonical, independent SQL, permission/ownership cases, controlled cases, cleanup, source freshness và defect còn mở. KH-06/KH-08 là local seat/food selection; QLR-08/CSKH-04 dùng dữ liệu đã tải khi vào màn hình/chọn detail, nên primary case không có HTTP mới. Audit ghi riêng `priorRealHTTPReadDependencies` cùng index request thực tế; không tạo request giả để lấp range rỗng. ADM-07/ADM-08 có SP delete trong supplemental negative/history cases, được ghi `supplementalTypedSPProof` với selector/timestamp; SQL rejection không biến thành SP success.

## 3. 43 gaps và bốn issue

{gapcounts}

Giữ đúng 43 ID/category gốc; hai defect mới gắn vào **R71-FE-ADM-07**, không tạo UC/gap mở rộng. [R8_FRONTEND_GAP_MATRIX.md](R8_FRONTEND_GAP_MATRIX.md) có bảng nghiệm thu từng gap; {evidence('gaps-43.json')} có record và trạng thái hiện hành.

| Issue / contract | Nghiệm thu | Cơ sở |
| --- | --- | --- |
| I-11 / ADM-15 | RESOLVED | Admin complaint read/reference/write generation, current module, captured target; primary SQL + current P1 + late reference/write selectors |
| I-15 / CSKH-02 | RESOLVED | Latest queue generation, selection reset, refresh theo current filter; stale success/error và pending writes; bốn ưu tiên + AND/omit |
| I-19 / KH-05…09 | RESOLVED | Keyed showtime/auth context, reset seat/food/promotion/result/error; A→B/A→B→A, preview invalidation, pending booking target và SQL snapshots |
| I-21 / KH-14, CSKH-04, ADM-15 | RESOLVED | Error khác empty/unlinked; explicit retry và preserved ownership/prefill; status/network faults ghi controlled |
| React key warning | RESOLVED trong vùng đã sửa | Admin chỉ render collection thuộc `state.resource===active`, stable resource IDs; primary journey và current P1/focus/tail không có console error |
| Approved contracts | PASS | CSKH priority enum/AND, ADM-02 Manager/CSKH/Admin, QLR-08 bốn metric, native money step0.01, Admin revenue đủ bốn DTO dimensions; SQL chốt money/date/scope |
| Toàn Frontend không stale/wrong-resource/error masking | **FAIL** | Hai lỗi ADM-07 bên dưới; không suy rộng bốn issue đã PASS thành toàn app PASS |

## 4. Material defects — chuyển lại R8.2

### R83-FE-01 — ảnh rạp cũ xuất hiện trong context rạp mới khi GET lỗi

**P1 / ADM-07 / R71-FE-ADM-07 / OPEN.** Source: [CinemaImageManager.jsx](../frontend/src/components/CinemaImageManager.jsx#L32), `loadImages`, `chooseCinema`, `remove` và render table. Đổi rạp chỉ reset editor, không xóa/gắn owner cho collection `images`; catch giữ images cũ, finally hạ loading và table được render lại. Write handlers kết hợp `cinemaId` hiện tại với image ID cũ.

Tái hiện: actual Admin login → Ảnh rạp → tải rạp A=1/image=1 thành công → chọn B=2 → response GET B được thay 503 → UI vẫn hiện một row A, nút Sửa/Xóa enabled. Bấm native confirmation Xóa phát **DELETE /api/admin/cinemas/2/images/1 → real HTTP404**, trong khi image thuộc rạp1. SQL ownership guard chặn thao tác; full27 fingerprints trước/sau bằng nhau. Đây là wrong-resource request/stale UI, **không có bằng chứng xóa nhầm hoặc mutation thành công**.

Expected: loading/error của B không hiển thị/mutate collection A; mutation chỉ dùng resource owner đang được hiển thị và đã xác minh. Actual: assertion FAIL. {evidence('browser-cases.json','Case FAIL')} `/checks/1`; {evidence('image-switch-observation.json')}; {evidence('image-wrong-resource-request.json')}; {evidence('no-write-r83-image-failed-switch.json')}; {evidence('R83-ADM07-stale-images-after-503.png','Screenshot')}.

### R83-FE-02 — Retry danh sách rạp che lỗi, không gọi lại API

**P1 / ADM-07 / R71-FE-ADM-07 / OPEN.** Source: [CinemaImageManager.jsx](../frontend/src/components/CinemaImageManager.jsx#L29) và [retry handler](../frontend/src/components/CinemaImageManager.jsx#L86). Initial cinema-list read và image-list read dùng chung `error`; retry luôn gọi `loadImages()`.

Tái hiện: remount Ảnh rạp → hai StrictMode GET /api/admin/cinemas bị thay response503 → alert lỗi hiện đúng → bỏ fault, bấm Thử lại → **không có GET /api/admin/cinemas mới**, alert biến mất, selector chỉ còn option “Chọn rạp”. `cinemaId` trống khiến `loadImages` clear error và return. UI không thể chọn rạp dù backend sẵn sàng.

Expected: retry đọc lại resource đã thất bại, giữ feedback đến khi có kết quả và khôi phục danh sách rạp. Actual: assertion FAIL. {evidence('browser-cases.json','Case FAIL')} `/checks/2`; {evidence('image-list-retry-observation.json')}; {evidence('R83-ADM07-cinema-list-retry.png','Screenshot')}.

**Yêu cầu xử lý qua R8.2:** sửa ownership/reset collection và mutation guards cho ảnh rạp; tách lifecycle/error/retry của cinema-list với image-list. Giữ visual identity và backend contracts. Kiểm chứng lại hai case trên, late success/error khi A→B→A, switch rạp trong pending create/update/delete/setcover, successful retry đúng resource, auth/grants, SQL no-write/target ownership và quality gates. R8.3 không thực hiện các production fixes này; kiểm tra nghiệm thu tiếp chỉ sau evidence R8.2 mới.

## 5. Regression, quality gates và phân loại evidence

| Kiểm tra | Kết quả / phạm vi | Bằng chứng |
| --- | --- | --- |
| Frontend tests mới | **62/62 PASS**, unit/source/contract checks; không thay E2E | {evidence('frontend-tests.log')} |
| Frontend lint mới | PASS / exit0 | {evidence('frontend-lint.log')} |
| Production build mới | PASS / exit0; artifact riêng dưới evidence | {evidence('frontend-build.log')} |
| 45 primary actual AppRoutes journeys R8.2 | Các positive assertions PASS; ADM-07 final grade BROKEN bởi negative regression mới | [57-case primary run](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) |
| Current P1 regressions | 11 cases PASS, I-11/I-15/I-19/I-21 và SQL targets | [P1](evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0/browser-cases.json) |
| Error/empty/retry, responsive Admin/CSKH/Customer | 5 tail cases PASS; 390px/1440px, labels/Tab/overflow ở vùng đã sửa | [Tail](evidence/r8-2/runs/2026-10-10T07-08-12-036Z-edges-tail-555de763/browser-cases.json) |
| Booking/payment/Manager responsive | 6 captures/1440px/390px + keyboard/labels, selected case PASS | [Final responsive](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/56` |
| Review keyboard error focus | 2 cases PASS trên code cuối; native Enter, real duplicate409, focus alert | [Focus](evidence/r8-2/runs/2026-10-10T07-09-34-738Z-focus-4c2e3004/browser-cases.json) |
| Auth/RBAC/current grants/Manager scope/Customer ownership | Selected permission/foreign resource/revoked assignment/locked JWT/no-write assertions hợp lệ; source guards không đổi | {evidence('verification-45.json')} |
| Booking/payment/complaint/CRUD/report/race/double-submit | Selected actual SQL và controlled assertions hợp lệ; ADM-07 error/retry **FAIL** mới | {evidence('independent-evidence-audit.json')} |
| Targeted ADM-07 mới | **1 PASS / 2 FAIL**, browserStatus REPRODUCED | {evidence('browser-cases.json')} |
| Runtime/console/React/harness mới | 0 exceptions, 0 consoleErrors, 0 harnessErrors | {evidence('browser-diagnostics.json')} |
| Backend tests + no raw SQL | Reuse 192/192 PASS; canonical/backend/shared source giữ hash, không chạy lại không cần thiết | [Checks](evidence/r8-2/runs/2026-10-10T03-39-27-215Z-edges-86caea16/backend-checks.json) |
| Toàn bộ regression PASS | **FAIL** vì hai material ADM-07 defects | {evidence('browser-cases.json')} |

R8.2 có **121 unique scenario IDs: 91 REAL_BROWSER_SQL, 30 CONTROLLED_TRANSPORT**, **100 unique independent SQL assertion selectors**, **23 full27 no-write proofs**. Không cộng các số khác đơn vị. R8.3 mới thêm 3 case assertions: một real UI/API/SQL baseline và hai controlled failure cases; real DELETE404 và SQL no-write vẫn là bằng chứng độc lập ở case controlled. Không gọi hai HTTP503 giả lập là backend503 thật. REAL_BROWSER_SQL supplemental negative có thể dùng browser fetch với JWT đăng nhập UI thật; primary 45 UC dùng UI thật.

Hai full suites R8.2 vẫn **FAIL**: expanded edges có một CDP Invalid InterceptionId dù 76 browser assertions PASS; critical có 30 PASS/1 failed focus assertion sau đó được thay bằng targeted focus PASS. R8.3 chỉ tái sử dụng **38 individual PASS selectors** từ hai suites này, kiểm tra raw assertion/timestamp/ranges/SQL/no-write/cleanup và giữ runStatus FAIL. Không nâng suite thành PASS, không dùng failed focus làm bằng chứng. Legacy P2 diagnostics không có trường `harnessErrors`, ghi NOT_RECORDED_LEGACY; không suy ra 0. Primary run/P1/current tail/focus và browser R8.3 có diagnostics đầy đủ.

Component fixture/MemoryRouter evidence R7 và unit/source tests chỉ là bằng chứng hỗ trợ. Không dùng thay actual AppRoutes E2E. A11y là changed-area verification (labels, keyboard/focus/overflow), không phải audit WCAG toàn app. Main primary network failures là 128 aborted local API reads khi navigation/StrictMode và 86 external network denied; deliberate faults/expected HTTP400/403/404/409 được phân loại riêng. External font/image access bị chặn, approved fallback còn giữ; không khẳng định font screenshot parity. Build warning chunk 544.41 kB vẫn tồn tại và không phải lý do nghiệm thu thất bại.

**Lưu ý wrapper:** {evidence('environment-result.json')} ghi infrastructure status PASS/readiness READY vì startup/isolation/cleanup thành công; `browserStatus=REPRODUCED` và hai browser case FAIL. Exit0 của reproduction runner **không** có nghĩa nghiệm thu PASS.

## 6. Database safety

Browser mutation chỉ chạy SQL Test DB **CinemaBookingDB_R0_R81_20261010_3d49fc44**, server **DESKTOP-E67DPCV**, database_id **48**, GUID **33876608-D109-43B5-ACEC-0B84C2639A73**; exact reviewed identity token và guard kiểm tra trước provision/query. Test backend dùng unique login `cinema_r83_*`, EXECUTE trên test dbo và không kết nối được CinemaBookingDB. Credentials/PW snapshots ở OS temp private; không ghi secret vào evidence công khai.

27 bảng, 159 canonical modules; parity kiểm tra trước/sau và read-only audit cuối. Fixture/password/grants/rows được khôi phục toàn27 data/metadata fingerprints, zero disabled/untrusted FK/CHECK, zero disabled triggers, zero open user transactions, zero runtime users/logins còn lại. Identity counters có thể tăng theo quy ước disposable Test DB; không reseed, disable protections hoặc rollback giả kết quả.

**CinemaBookingDB không sửa/seed/mutation.** So sánh toàn27 data/metadata main trước/sau browser bằng nhau và fresh final read-only audit khớp R8.2 baseline. Main preservation PASS, mainWrites0. Không sửa/deploy Backend hay Stored Procedures.

{evidence('startup.json','Runtime isolation')}; {evidence('fixture-cleanup.json','Fixture cleanup')}; {evidence('main-preservation.json','Main preservation')}; {evidence('final-read-only-audit.json','Fresh canonical/integrity/main audit')}; {evidence('no-write-r83-image-failed-switch.json','Rejected DELETE no-write')}.

## 7. Documentation, preservation và Definition of Done

Đã cập nhật [USE_CASE_MATRIX_45.md](USE_CASE_MATRIX_45.md), [R8_FRONTEND_GAP_MATRIX.md](R8_FRONTEND_GAP_MATRIX.md), tạo báo cáo này và per-UC/per-gap audit. Archive byte-identical trước cập nhật: {evidence('USE_CASE_MATRIX_45_BEFORE_R8_3.md')} và {evidence('R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md')}. Seal R8.2 vẫn được kiểm chứng bằng archive cho gap matrix được phép cập nhật; mọi artifact lịch sử còn lại giữ nguyên. Evidence và tooling mới nằm dưới `docs/evidence/r8-3/` và `scripts/r8-3/`; production source R8.3 changes = **0**.

| Điều kiện nghiệm thu | Kết quả |
| --- | --- |
| 43/43 gaps RESOLVED | **FAIL — 42/43; ADM-07 REOPENED** |
| 45/45 Frontend PASS | **FAIL — 44 PASS, 1 BROKEN** |
| Regression và quality gates PASS | **FAIL — tests/lint/build PASS, hai targeted business regressions FAIL** |
| Không còn material Frontend defect | **FAIL — R83-FE-01 và R83-FE-02 OPEN** |
| Main DB bảo toàn | PASS |
| Tài liệu/evidence đầy đủ và trung thực | PASS — gồm cả failed assertions, source, HTTP/SQL/no-write/cleanup |

**Quyết định cuối: R8.3 PARTIAL — PHASE R8 NOT ACCEPTED.** Yêu cầu xử lý hai lỗi ADM-07 qua R8.2 rồi kiểm chứng lại phần bị ảnh hưởng. Dừng tại R8.3 và chờ yêu cầu tiếp theo.
'''
(ROOT/'docs/R8_3_FINAL_ACCEPTANCE_REPORT.md').write_text(report,encoding='utf-8')

# Update current official matrix while retaining dated R7 evidence/rationales.
matrix=ROOT/'docs/USE_CASE_MATRIX_45.md'
s=(OUT/'USE_CASE_MATRIX_45_BEFORE_R8_3.md').read_text(encoding='utf-8-sig')
s=s.replace('Status: FINAL — R7 DATABASE/BACKEND ACCEPTANCE','Status lịch sử R7.3: FINAL — R7 DATABASE/BACKEND ACCEPTANCE',1)
s=s.replace('## Final counts by actor and layer','## Current counts by actor and layer — R8.3',1)
for section in ['Frontend','Overall']:
    a=s.index('### '+section); b=s.index('\n##' if section=='Overall' else '\n###',a+5)
    s=s[:a]+f'### {section}\n\n{counts}\n'+s[b:]
lines=s.splitlines(); changed=0
for n,line in enumerate(lines):
    m=re.match(r'\| \[([A-Z]+-\d+)\]\(#uc-',line)
    if m:
        uc=m.group(1); status='BROKEN' if uc=='ADM-07' else 'PASS'
        cells=line.split('|');assert len(cells)==15
        cells[11]=f' {status} ';cells[12]=f' {status} '
        cells[13]=re.sub(r'R71-FE-[A-Z]+-\d+',lambda _:f'REOPENED(R71-FE-{uc})' if uc=='ADM-07' else f'RESOLVED(R71-FE-{uc})',cells[13])
        cells[9]+=f' [{status} R8.3]({E}/verification-45.json) '
        lines[n]='|'.join(cells);changed+=1
assert changed==45
s='\n'.join(lines)+'\n'
for i,u in enumerate(ucs):
    marker=re.search(r'\n(?:##|###) '+re.escape(u['ucId'])+r' —',s);assert marker,u['ucId']
    a=marker.end(); next_marker=re.search(r'\n<a id="uc-|\n## ',s[a:]);end=a+next_marker.start() if next_marker else len(s)
    block=s[a:end]
    # Per-UC table is current; evidence/rationale prose retains its R7 date.
    blocklines=block.splitlines(); runtime_updates=0
    for n,line in enumerate(blocklines):
        if line.startswith('| PASS |') and line.count('|')==8:
            cells=line.split('|');cells[6]=f" {u['status']} ";cells[7]=f" {u['status']} "
            blocklines[n]='|'.join(cells);runtime_updates+=1
    assert runtime_updates==1,u['ucId']
    block='\n'.join(blocklines)+'\n'
    block=block.replace('**Vì sao chưa toàn PASS:**','**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):**')
    note=f"\n\n**R8.3 current Frontend/Overall: {u['status']}.** {u['rationale']} [{u['ucId']} browser/HTTP/SP/SQL/auth audit]({E}/verification-45.json), JSON Pointer `/UCs/{i}`. "
    note+=('R83-FE-01/R83-FE-02 còn OPEN; gap R71-FE-ADM-07 REOPENED, yêu cầu xử lý qua R8.2.' if u['status']=='BROKEN' else 'Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.')
    s=s[:a]+block+note+'\n'+s[end:]
banner=f'''**Current R8.3 — PARTIAL, PHASE R8 NOT ACCEPTED (10/10/2026).** Database/Backend 45 PASS; Frontend/Overall **44 PASS / 0 PARTIAL / 1 BROKEN / 0 MISSING**. ADM-07 BROKEN do R83-FE-01/R83-FE-02; 42/43 Frontend gaps được nghiệm thu, R71-FE-ADM-07 REOPENED. [Báo cáo nghiệm thu](R8_3_FINAL_ACCEPTANCE_REPORT.md); {evidence('verification-45.json','Per-UC audit')}.

Các mô tả/evidence/rationale R7 bên dưới là lịch sử theo ngày ghi trong tài liệu; những số liệu 2 PASS/43 PARTIAL và MAIN_DB_DEPLOYMENT_PENDING mô tả checkpoint R7.3, không phải trạng thái R8.3. Source/backend/main hiện hành được đối chiếu trong fresh R8.3 audit. Bảng counts, matrix 45 dòng và runtime table từng UC đã cập nhật; đoạn R8.3 current tại mỗi UC là quyết định hiện hành. Bản trước cập nhật: {evidence('USE_CASE_MATRIX_45_BEFORE_R8_3.md')}.

'''
s=s.replace('# Use Case Matrix — 45 UC\n\n','# Use Case Matrix — 45 UC\n\n'+banner,1)
matrix.write_text(s,encoding='utf-8')

gapfile=ROOT/'docs/R8_FRONTEND_GAP_MATRIX.md'
old=(OUT/'R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md').read_bytes()
append=f'''

# R8.3 — Final acceptance of 43 inherited gaps

**CURRENT: R8.3 PARTIAL — PHASE R8 NOT ACCEPTED.** Ngày 10/10/2026. R8.1 inspection và R8.2 RESOLVED/PASS_CANDIDATE ở phần trước là checkpoint lịch sử, được giữ nguyên; bảng R8.3 này là trạng thái nghiệm thu hiện hành.

{gapcounts}

Frontend: **44 PASS / 0 PARTIAL / 1 BROKEN / 0 MISSING**. ADM-07 BROKEN vì stale image collection/wrong-resource DELETE và retry che lỗi cinema list. Mở lại đúng gap **R71-FE-ADM-07**; hai defect không mở rộng baseline 43 gaps/45 UC. Không sửa production trong R8.3. [Báo cáo nghiệm thu](R8_3_FINAL_ACCEPTANCE_REPORT.md); {evidence('independent-evidence-audit.json','Independent audit')}; {evidence('gaps-43.json','43 gap records')}.

| Gap ID | UC | Original category | Final acceptance | Verified evidence selector | Lý do / việc còn lại |
| --- | --- | --- | --- | --- | --- |
{gaprows}

R83-FE-01/R83-FE-02 cần xử lý qua R8.2 rồi kiểm tra lại ADM-07 và shared regression. Main SQL preservation/cleanup/canonical PASS; quality unit/lint/build PASS; targeted ADM-07 có hai FAIL nên toàn Phase R8 chưa ACCEPTED. {evidence('browser-cases.json','Failed browser assertions')} `/checks/1`, `/checks/2`; {evidence('image-wrong-resource-request.json','Real DELETE404')}; {evidence('image-list-retry-observation.json','Missing retry request')}.

Archive trước cập nhật R8.3: {evidence('R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md')}. Mọi selector R8.2 vẫn trỏ evidence cũ, không chỉnh FAIL thành PASS.
'''
gapfile.write_bytes(old+append.encode('utf-8'))
print('Published R8.3 PARTIAL report; updated 45 UC runtime rows and 43 gap acceptance rows')

// Publish actual capture/test evidence and a local before/after viewer.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root, read, write } from '../db/lib.mjs';

const evidence = path.join(root, 'docs/uiux/evidence/visual-composition');
const json = (file) => JSON.parse(read(path.join(evidence, file)));
const final = json('vcr7/results.json');
const isolation = json('vcr7/staff-isolation.json');
const scope = json('source-isolation.json');
const functional = json('functional/results.json');
const e2e = json('existing-e2e/results.json');
const full = json('vcr7/full-page-checks.json');
assert.equal(final.results.length, 76);
assert.equal(isolation.status, 'PASS');
assert.equal(functional.status, 'PASS');
assert.equal(
  functional.finalAudits.length,
  28,
  'All fourteen public routes need final desktop/mobile Axe evidence',
);
assert.equal(e2e.status, 'PASS');
assert.equal(full.status, 'PASS');
assert.equal(final.errors.length, 0);
const phases = [
  'before',
  'vcr1',
  'vcr2',
  'vcr3-final',
  'vcr4-polish',
  'vcr5-polish',
  'vcr6-before',
  'vcr6',
  'vcr7',
];
const screenshots = [];
for (const phase of phases) {
  const result = json(phase + '/results.json');
  screenshots.push({
    phase,
    observations: result.results.length,
    runtimeErrors: result.errors.length,
  });
}
// Retain raw logs for review in the deliverable directory (not only ignored audit output).
for (const phase of ['vcr2', 'vcr3-polish', 'vcr4-polish', 'vcr5-polish', 'vcr6', 'vcr7']) {
  const from = path.join(root, '.audit-output/vcr', phase);
  for (const file of ['checks.json', 'tests.log', 'build.log', 'lint.log'])
    write(path.join(evidence, 'checks', phase, file), read(path.join(from, file)));
}
for (const [source, name] of [
  ['vcr-before-tests.log', 'baseline-tests.log'],
  ['vcr-before-build.log', 'baseline-build.log'],
  ['vcr-before-lint.log', 'baseline-lint.log'],
  ['vcr1-tests.log', 'vcr1-tests.log'],
  ['vcr1-build.log', 'vcr1-build.log'],
  ['vcr1-lint.log', 'vcr1-lint.log'],
  ['vcr-backend-tests.log', 'backend-tests.log'],
  ['vcr-contracts.log', 'contracts.log'],
  ['vcr-no-sql.log', 'no-sql.log'],
  ['vcr-existing-e2e.log', 'existing-e2e.log'],
  ['vcr7-final-browser.log', 'final-browser.log'],
  ['vcr7-full-page-final.log', 'final-full-page.log'],
  ['vcr-final-read-qa-production.log', 'final-read-qa.log'],
]) {
  const file = path.join(root, '.audit-output', source);
  assert.ok(fs.existsSync(file), 'Missing real log ' + source);
  write(path.join(evidence, 'checks', name), read(file));
}
const records = json('vcr7/catalog.json');
const task = json('vcr7/task-records.json');
const routeNotes = {
  home: 'Hero poster fallback; 9 phim thiếu poster được giữ dưới dạng thông báo gọn.',
  movies: 'Bộ lọc REST, URL back/forward; đủ 18 records, không fake poster.',
  'movie-detail':
    'Header gọn → lịch → thông tin phụ/review; excerpt nguyên văn, full credit vẫn đọc được.',
  cinemas: '2 cột landscape desktop, 1 mobile; địa chỉ và nhãn rạp demo nguyên vẹn.',
  'cinema-detail': 'Cover có overlay; chọn phim/ngày, không dropdown chọn rạp thừa.',
  booking: 'Map 40 ghế thật, zoom/keyboard/scroll; sản phẩm có URL thật, summary/hold do server.',
  login: 'Form ưu tiên; ảnh ambience chỉ secondary; redirect booking giữ nguyên.',
  register: 'Form/required/error/focus hiện hữu; không thêm phương thức auth.',
  profile: 'Chỉ public theme; không sửa role/status hoặc source Profile dùng chung staff.',
  orders: 'Poster thật/status/số tiền API; filters và ownership giữ nguyên.',
  order: 'Workspace giao dịch gọn; dữ liệu chủ sở hữu thật trên DEMO.',
  payment: 'Không sửa payment state machine; failed → retry → paid đã chạy trên TEST.',
  complaints: 'Typography và timeline thống nhất; auth/API/hook giữ nguyên.',
  complaint: 'Detail thật của customer; không đổi status/ownership.',
};
const rows = final.results
  .map((r) => {
    const before =
      ['home', 'movies', 'movie-detail', 'cinemas', 'cinema-detail', 'booking'].includes(r.name) ||
      r.name.startsWith('staff-')
        ? 'before'
        : 'vcr6-before';
    const link = (phase) => `[ảnh](evidence/visual-composition/${phase}/${r.name}-${r.width}.png)`;
    const staff = r.name.startsWith('staff-');
    const a11y =
      !staff && [390, 1440].includes(r.width)
        ? 'PASS¹'
        : staff
          ? 'Giữ nguyên'
          : 'Layout/focus; Axe ở 390/1440';
    const visual = staff
      ? 'PASS: pixel giống hệt'
      : ['home', 'movies', 'movie-detail'].includes(r.name)
        ? 'PASS layout; media PARTIAL'
        : 'PASS';
    return `| \`${r.route}\` | ${r.width}×${r.height} | ${link(before)} | ${link('vcr7')} | ${visual} | ${staff ? 'Regression / quyền' : 'PASS flow²'} | ${a11y} | ${staff ? 'SHA-256 bằng baseline' : routeNotes[r.name]} |`;
  })
  .join('\n');
write(
  path.join(root, 'docs/uiux/VISUAL_COMPOSITION_QA.md'),
  `# CinemaStar — Visual Composition QA

Ngày 13/10/2026. **VCR-0 → VCR-7 đã triển khai và kiểm tra. Trạng thái tổng thể: PARTIAL về media/content.** Không gắn DONE toàn diện khi 9/18 poster còn NULL và API chưa có backdrop. Layout/fallback và luồng nghiệp vụ đã được thực hiện trên source hiện tại.

## Môi trường và cách đọc bằng chứng

Edge headless thật qua CDP, Express/SP/SQL Server thật. Capture dùng DEMO, giao dịch kiểm thử chỉ dùng TEST đã có; không reset/reseed. Main \`CinemaBookingDB\` và DEMO unchanged qua full-row hashes. Ảnh chụp dùng URL DB/API; kiểm tra status/MIME/naturalWidth, không mock network/media. Final 76 observations + 4 full-page + 2 vùng sản phẩm = **82 screenshot nghiệm thu**; không tính ảnh failed-page vào bộ PASS.

Ảnh \`before\` của 6 trang khám phá/booking được chụp trước mọi thay đổi. Ảnh \`vcr6-before\` của 8 màn hình tác vụ được chụp **sau foundation VCR-5, trước sửa VCR-6**; không gọi đây là baseline nguyên bản toàn repo. Staff dùng baseline trước mọi sửa. [Viewer tương tác](evidence/visual-composition/compare.html) chọn trang/kích thước và mở ảnh nguyên bản.

¹ Axe WCAG 2 A/AA + 2.1 AA: **${functional.finalAudits.length} lượt cuối** ở 14 trang × 390/1440, 0 violations; thêm 8 lượt trong functional flow. Axe có incomplete color-contrast ở vùng ảnh, nên có đo pixel nền sau overlay cho Hero và cover rạp ở cả 2 viewport. Đây không phải chứng nhận toàn bộ WCAG. Typography/focus/overflow ở 3 viewport khác có screenshot/metrics, không giả định đã chạy Axe tại đó.

² Functional checks chạy một luồng hiện hữu trên desktop/mobile phù hợp, **không chạy lại mọi nghiệp vụ tại cả 5 kích thước**. Xem bảng luồng bên dưới. Staff chỉ đối chiếu pixel, source isolation, quyền API và E2E hiện hữu; không tuyên bố test thủ công mọi thao tác staff.

## Route × viewport trước/sau

| Route | Viewport | Before Screenshot | After Screenshot | Visual | Function | A11y | Notes |
|---|---|---|---|---|---|---|---|
${rows}

## Slice: source, screenshot và kiểm thử

| Slice | Source thực tế | Ảnh / tự chỉnh sau khi xem | Test / gate |
|---|---|---|---|
| VCR-0 | Audit router/API/media/shared CSS; không sửa ứng dụng | [Baseline](evidence/visual-composition/before/results.json): 38 ảnh | Frontend 222/222, build/lint PASS; baseline source 613 files |
| VCR-1 | FeaturedBillboard, filmPresentation, Home; scoped tokens/header/Hero | [Hero](evidence/visual-composition/vcr1/): 5 widths + staff + full Home; poster stage lớn/CTA trong viewport | Frontend 225/225; build/lint success logs; fallback đạt composition, backdrop DATA BLOCKER |
| VCR-2 | FilmRail/MovieCard, HomeSchedule/DateRail/TimeChip, CinemaList | [Home full](evidence/visual-composition/vcr2/): 13 ảnh; rails/arrows/touch thật | 225/225, build/lint exit 0; upcoming media PARTIAL |
| VCR-3 | MovieGrid, Movies/MovieDetail, ShowtimeBrowser | [Final slice](evidence/visual-composition/vcr3-final/): 16 ảnh; sửa margin legacy, chuyển secondary facts xuống sau lịch | 234/234, build/lint exit 0; search/back/forward/null/long title/0 showtime tested |
| VCR-4 | CinemaDetail/Cinemas/CinemaSchedule, CinemaList | [Polish](evidence/visual-composition/vcr4-polish/): 16 ảnh; sửa mobile FilterBar flex-basis | 234/234, build/lint exit 0; exact cinema/showtime ownership, date reset tested |
| VCR-5 | BookingExperience, ProductPicker, SeatMapPanel/MediaFrame; không sửa BookingPreparation/hooks | [Polish](evidence/visual-composition/vcr5-polish/): 11 ảnh; sửa thumbnail flex-grow và spacing; final sửa legacy product flex | 234/234, build/lint exit 0; actual login/409/double submit/payment retry trên TEST PASS |
| VCR-6 | AuthFrame/Orders + scoped forms/header/task workspace | [Before](evidence/visual-composition/vcr6-before/) / [after](evidence/visual-composition/vcr6/): 46 ảnh mỗi bộ | 234/234, build/lint exit 0; auth/guards/profile/payment/complaint business source unchanged |
| VCR-7 | Named groups ARIA, public reduced-motion, product-grid specificity; QA tooling/docs | [Final](evidence/visual-composition/vcr7/results.json): 82 ảnh; 6 staff pixel identical, no body overflow/runtime exception | 234/234; backend 205/205; E2E ${e2e.checks.length}; functional ${functional.checks.length} checks; build/lint PASS |

Logs thật được lưu tại [checks](evidence/visual-composition/checks/) gồm tests/build/lint theo slice. VCR-1 PowerShell đã coi warning trên stderr là lỗi wrapper; Vite build log thực tế hoàn thành. Các slice VCR-2 trở đi ghi exitCode trực tiếp từ process, đều 0. Bundle warning >500KB đã có trước task; final JS 814.30KB / gzip 233.73KB, chưa phải một đợt tối ưu bundle/performance.

## Functional regression thật

| Luồng | Kết quả | Bằng chứng |
|---|---|---|
| Hero/rails/menu mobile/focus/touch | PASS: record URL/CTA thật, arrows di chuyển, focus lộ CTA, Escape đóng menu/trả focus | [47 checks gốc + checks cuối](evidence/visual-composition/functional/results.json) |
| Catalog server filter + history | PASS: search Sintel đúng 1 record; back đủ 18, forward giữ query | functional results và screenshots |
| Long title / missing poster / no-showtime | PASS: Conan ID13 thật, NULL thật, no-showtime từ API; không fake lịch | functional results |
| Movie/cinema schedule | PASS: date chips exact IDs, đổi cinema reset date, fixed cinema đúng ownership | functional results |
| Login → booking | PASS qua form login thật, trả đúng showtime, refresh map 40 ghế | functional results |
| Seats/products | PASS: seat ID thật, keyboard, zoom 44→55px, mobile scroll; plus/minus/max10 dùng limit cũ | functional results; [products desktop](evidence/visual-composition/vcr7/booking-products-1440.png), [mobile](evidence/visual-composition/vcr7/booking-products-390.png) |
| Conflict 409 | PASS: customer khác giữ ghế bằng SP trên TEST; UI nhận409, refresh và bỏ selection stale | functional results, conflictOrderId ${functional.conflictOrderId} |
| Double submit / hold / total | PASS: double click chỉ 1 POST booking; order/hold/total lấy từ SQL | functional results, orderId ${functional.orderId} |
| Payment failure → retry → paid | PASS: failed attempt giữ lại, UI xác nhận retry tạo attempt mới; amounts bằng SQL total | functional results; trạng thái paid/two attempts rechecked readonly |
| Role/ownership | PASS customer admin denied; manager foreign cinema denied; guards/API source unchanged | functional results / source-isolation |
| E2E hiện hữu | PASS ${e2e.checks.length} checks, ${e2e.screenshots} screenshots | [results](evidence/visual-composition/existing-e2e/results.json), [log](evidence/visual-composition/checks/existing-e2e.log) |
| Backend + contract + DBMS-first | PASS 205/205, 110 service methods/118 captured calls/0 problems; 69 files no raw business SQL | [backend](evidence/visual-composition/checks/backend-tests.log), [contract](evidence/visual-composition/checks/contracts.log), [SQL guard](evidence/visual-composition/checks/no-sql.log) |

Các order kiểm thử ở TEST được giữ nguyên; **không reset hoặc xóa để làm sạch báo cáo**. Main/DEMO unchanged; lần kiểm tra cuối chỉ đọc cũng xác nhận TEST unchanged. Không lặp lại transaction writes khi sửa driver cuối.

## A11y/visual và sửa sau screenshot

- Hero CTA nằm trong viewport390; desktop image stage giữ poster nguyên vẹn, không crop/stretch ngang. So moodboard theo fallback được prompt cho phép, chưa tuyên bố khớp landscape artwork khi thiếu backdrop.
- Movie detail mobile poster/title/metadata riêng, synopsis và CTA rộng; lịch ngay sau header. Rail/DateRail cuộn chủ đích, scrollbar ẩn, controls/focus/touch thật; body cả 70 captures public không tràn ngang.
- Cinema overlay pixel contrast: địa chỉ/tên/nhãn đọc được sau gradient. Hero text thường thấp nhất đo được **4.79:1** (primary CTA); cover rạp text thường thấp nhất **6.18:1**, large title **5.92:1**. [Measurements](evidence/visual-composition/functional/final-read-checks.json) chứa coordinates/font/ratio, không dùng màu ảnh trung bình.
- Seat map không invent aisle; viewport hẹp có chỉ dẫn/arrows/zoom, selected/type/state có text/shape/border, dữ liệu thật. Hero/rail/images reserve ratio, hero high priority, dưới fold lazy; không autoplay.
- Sửa lỗi CSS cũ \`.customer-journey .booking-product\` override grid thành flex: tăng specificity chỉ trong public product list. Fallback slot 48×48 giống ảnh thật, không placeholder chiếm cả hàng. Final kiểm tra computed grid, widths và chụp products sau scroll.
- Full-page ảnh dưới fold đã decode và cuộn qua để paint trước capture; không sửa ảnh chụp. Acceptance PNG giữ text/UI thật; contrast probe tạm mask text trong DOM riêng để đo nền pixel rồi khôi phục.

## Lỗi công cụ đã gặp và cách xử lý

Không bỏ log failure: các capture trước gặp network policy/CDN pending và Vite navigation timeout; lần cuối dùng production build + readonly retry đúng URL. First focus-driver kiểm opacity quá sớm trong transition nên đổi sang poll. Motion driver ban đầu đòi exact0 dù global legacy !important là0.01ms: giữ global staff, thêm public motion rule và xác nhận ≤1ms. Contrast probe sửa việc mask bị important/transition và requestAnimationFrame background timeout; dùng computed style + decoded image + browser foreground/host wait. Không thay data/API để làm test PASS. Failed-capture/failed-page trong vcr7 là lịch sử, **results.json + staff-isolation + data-preservation là verdict lần thành công cuối**.

## Scope/data isolation

[Source proof](evidence/visual-composition/source-isolation.json): ${scope.baselineFiles} files so trước/sau, ${scope.protectedFiles.length} protected files unchanged, ${scope.changedPublicFiles.length} files cũ thay trong allowlist Public/Customer + 3 file public mới. Backend/shared/database, route/auth/context/API, hooks booking/payment, global CSS/shared UI defaults/staff source unchanged. Hai script E2E support chỉ thêm cache/evidence options, không thay app logic. Không thêm dependency/framework/font/media raster.

[Staff proof](evidence/visual-composition/vcr7/staff-isolation.json): 3 portal ×2 widths **6/6 SHA-256 PNG bằng baseline**. [Capture hashes](evidence/visual-composition/vcr7/data-preservation.json), [full-page hashes](evidence/visual-composition/vcr7/full-page-data-preservation.json), [final readonly QA hashes](evidence/visual-composition/functional/final-read-data-preservation.json) PASS.

## Phần chưa thể nghiệm thu toàn diện

**DATA/MEDIA PARTIAL:** 9 poster NULL (50% catalog), tất cả6 upcoming thiếu poster; schema/API không có backdrop, MoTa trộn nội dung/demo/license, 3 sản phẩm thiếu imageUrl. UI giữ đủ records và fallback có chủ đích; không giả ảnh/lịch/giá. [MEDIA_GAPS_FOR_SEED](MEDIA_GAPS_FOR_SEED.md) ghi IDs/URLs/expected type/priority để workflow seed riêng xử lý. Không chạy workflow đó trong visual task.

Không tuyên bố đã test mọi44 active UC ở mọi viewport, chứng nhận WCAG đầy đủ hay performance budget. Những giới hạn này không ngăn phần composition và các flow đã có bằng chứng PASS.
`,
);

const viewerRoutes = [...new Map(final.results.map((r) => [r.name, r])).values()].map((r) => ({
  name: r.name,
  route: r.route,
  before:
    ['home', 'movies', 'movie-detail', 'cinemas', 'cinema-detail', 'booking'].includes(r.name) ||
    r.name.startsWith('staff-')
      ? 'before'
      : 'vcr6-before',
  staff: r.name.startsWith('staff-'),
}));
write(
  path.join(evidence, 'compare.html'),
  `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CinemaStar — So sánh trước/sau</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#101015;color:#f5f5f7;font:16px/1.5 system-ui}h1{font-size:26px;margin:0 0 8px}p{color:#b8b8c4}label{display:inline-flex;gap:10px;align-items:center;margin:8px 20px 8px 0}select,a{color:#f5f5f7}select{font:inherit;padding:10px;background:#24242f;border:1px solid #777;border-radius:4px}a:focus-visible,select:focus-visible{outline:3px solid #ffd166;outline-offset:3px}.views{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}figure{margin:0;min-width:0}figcaption{margin-bottom:12px;font-weight:700}img{display:block;width:100%;height:auto;background:#24242f}.status{border-left:3px solid #e50914;padding-left:12px}@media(max-width:800px){.views{grid-template-columns:1fr}body{padding:16px}}</style></head>
<body><h1>CinemaStar — Trước / sau VCR</h1><p>Ảnh Edge thật, dữ liệu API DEMO. Chọn cùng trang và viewport để so bố cục; mở ảnh để xem nguyên kích thước.</p>
<label>Trang <select id="route"></select></label><label>Viewport <select id="width"><option>390</option><option>768</option><option>1280</option><option selected>1440</option><option>1920</option></select></label><label>Vùng ảnh <select id="region"><option value="view">Viewport</option><option value="full">Toàn trang (Home / Booking)</option><option value="products">Sản phẩm (Booking, ảnh sau)</option></select></label>
<p class="status" id="note"></p><div class="views"><figure><figcaption>Trước <a id="beforeLink" target="_blank" rel="noopener">Mở ảnh</a></figcaption><img id="before" alt="Screenshot trước sửa"></figure><figure><figcaption>Sau <a id="afterLink" target="_blank" rel="noopener">Mở ảnh</a></figcaption><img id="after" alt="Screenshot sau sửa"></figure></div>
<p>Trạng thái: PARTIAL về media/content. 9/18 poster thiếu; chưa có backdrop trong API. <a href="../../VISUAL_COMPOSITION_QA.md">Báo cáo QA</a></p>
<script>
const routes=${JSON.stringify(viewerRoutes)};
const route=document.getElementById('route'),width=document.getElementById('width'),region=document.getElementById('region');
routes.forEach(r=>{const o=document.createElement('option');o.value=r.name;o.textContent=r.route;route.append(o)});
function render(){const r=routes.find(r=>r.name===route.value),w=width.value,part=region.value;const available=r.staff?['390','1440']:['390','768','1280','1440','1920'];for(const o of width.options)o.disabled=!available.includes(o.value);if(!available.includes(w)){width.value='1440';return render()}let before=r.before+'/'+r.name+'-'+w+'.png',after='vcr7/'+r.name+'-'+w+'.png';if(part==='full'&&['home','booking'].includes(r.name)&&['390','1440'].includes(w)){after='vcr7/'+r.name+'-full-'+w+'.png';if(r.name==='home')before='before/home-full-'+w+'.png'}if(part==='products'&&r.name==='booking'&&['390','1440'].includes(w))after='vcr7/booking-products-'+w+'.png';document.getElementById('before').src=before;document.getElementById('after').src=after;document.getElementById('beforeLink').href=before;document.getElementById('afterLink').href=after;document.getElementById('note').textContent=(r.before==='vcr6-before'?'Baseline tác vụ: sau VCR-5, trước VCR-6. ':r.staff?'Staff: pixel trước/sau giống hệt. ':'Baseline: trước mọi sửa. ')+(part==='full'&&r.name==='booking'?'Booking trước chỉ có viewport; sau có full-page. ':'')+((part!=='view'&&(!['390','1440'].includes(w)||!['home','booking'].includes(r.name)))?'Không có vùng bổ sung này: đang hiển thị viewport. ':'')}
[route,width,region].forEach(e=>e.addEventListener('change',render));render();
</script></body></html>`,
);
write(path.join(evidence, 'acceptance-summary.json'), {
  status: 'PARTIAL',
  reason:
    'Missing posters/backdrop and mixed content contract; composition and exercised regression gates pass.',
  publicRouteCaptures: 70,
  staffCaptures: 6,
  fullPageCaptures: 4,
  productCaptures: 2,
  frontendTests: 234,
  backendTests: 205,
  existingE2EChecks: e2e.checks.length,
  functionalChecks: functional.checks.length,
  finalAxeAudits: functional.finalAudits.length,
  finalAxeViolations: 0,
  sourceProtectedFiles: scope.protectedFiles.length,
  mainUnchanged: true,
  demoUnchanged: true,
  screenshots,
  records: {
    movies: records.movies.length,
    cinemas: records.cinemas.length,
    ownedOrderId: task.orderId,
    ownedComplaintId: task.complaintId,
  },
});
console.log('PASS evidence publication; acceptance PARTIAL for recorded media/content gaps');

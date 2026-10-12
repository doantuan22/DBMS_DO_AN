# UXR-5 — Test evidence

Ngày 12/10/2026. Các verdict dưới đây được lấy từ lượt chạy hiện tại, không kế thừa PASS của UXR trước. [Checklist](./ACCEPTANCE_CHECKLIST.md) phân biệt core PASS, capability BLOCKED và các nhánh NOT VERIFIED.

## Automated / build

| Kiểm tra | Kết quả | Artifact |
|---|---:|---|
| Frontend toàn bộ | **207/207 PASS**, 0 skip | [frontend-tests.log](./frontend-tests.log) |
| Tests mới UXR-5 | **28 PASS**: resource 16, service/analytics 12 | frontend/tests/adminResources.test.js; adminServiceAnalytics.test.js |
| Backend toàn bộ, source không sửa | **205/205 PASS**, 0 skip | [backend-tests.log](./backend-tests.log) |
| Oxlint | **PASS**, không warning | [frontend-lint.log](./frontend-lint.log) |
| Vite production build | **PASS** | [production-build.log](./production-build.log) |
| Preservation / CSS token allowlist | **PASS** | [final-checks.json](./final-checks.json) |

Build JS: khoảng **765.95 kB / gzip 220.88 kB**, CSS 69.34 kB / gzip 11.46 kB. Vite vẫn cảnh báo chunk >500 kB; baseline UXR-4 đã có cảnh báo này. Chưa mở workstream code splitting hoặc production performance/load acceptance.

Tests mới xác minh: fixed role/create allowlist, Manager bất biến, transfer confirmation, complete-set filter/page và PII-safe query; lookup 403, draft lifecycle, shared write lock, 409 retains draft, stale/unmounted reads; missing/corrupt movie relationship blocks writes, metadata omits cast, atomic cast confirmation, relation count unknown on denied lookup; SQL decimal precision, quota floor, code immutable và UTC+7 roundtrip; Admin vs CSKH permission combinations; keyed notes, separate status/processing drafts, append-only actions, late A→B→A/foreign detail; report range/cinema validation, server summary unchanged, global Dashboard independent of period report, missing metric unknown. Additive Manager readonly hint does not change the shared Room default behavior.

## Browser + actual API/SP/DB

Chrome headless/CDP → Vite proxy → Express hiện có → SP hiện có → SQL Server DB **CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2, ID 9**. Không mock API/SQL để công bố mutation PASS. Roles/claims đọc từ DB, không thay RBAC để tạo kết quả.

Lượt tuần tự: [browser-suite.json](./browser-suite.json), 8 runs, **PASS**. Mỗi run kiểm tra runtime exception và console error; cuối suite đều 0. Runtime sau điều chỉnh nhãn UI được chụp lại trong [final-after-screens.json](./final-after-screens.json).

| Run | Số checks | Phạm vi |
|---|---:|---|
| [5A-browser.json](./5A-browser.json) | 15 PASS | 2 screens × 5 widths; actual internal account/status/role, transfer Cancel/Confirm/scope, real multi-assignment and RBAC negative |
| [5B-browser.json](./5B-browser.json) | 21 PASS | 3 × 5 widths; actual genre/actor/movie create, named relationships, separate cast, metadata+reload preservation, linked delete 409/unreferenced delete |
| [5C-browser.json](./5C-browser.json) | 16 PASS | 2 × 5 widths; product decimal/price/status, snapshot equality, percent 99 rule, period/Vietnam instants, code/quota immutable, unused delete |
| [5D-browser.json](./5D-browser.json) | 23 PASS | 3 × 5 widths; queue/cases/reference, note/status retention, actor/history/single-submit, Admin navigation/discard, role distinction, authoritative scoped/empty report and global Dashboard |
| [ui-edges.json](./ui-edges.json) | 21 PASS | 7 mobile editors with keyboard/dirty guards; actual blocked network + Retry; missing selection; 6 UXR-4 routes × 2 widths |
| [final-after-screens.json](./final-after-screens.json) | 50 PASS | Current 10 screens × 390/768/1280/1440/1920; no document horizontal overflow and exactly one active Admin menu |
| **Browser tổng** | **146 PASS** | Không tính before capture hoặc API-only assertions vào số browser checks |
| [commerce-edges.json](./commerce-edges.json) | 5 PASS API/SQL | Actual Customer booking consumes quota; product/promotion edits keep snapshots/code/used counter; in-use deletes 409; percent 100 rejected; cancellation releases quota |
| [before-screens.json](./before-screens.json) | 50 CAPTURED | Read-only actual source snapshot trước UXR-5; không gán PASS cho chất lượng baseline |

Suite lưu **422 network/test records** trong các runs PASS, cộng 36 record của before capture. Đây là records của CDP responses, mutation request events và API helper, **không phải 422 HTTP request độc lập**. `requests` phân biệt method/status/expected; chủ động 400/403/404/409 và blocked network là negative cases, không bị biến thành empty success. Không có application HTTP 5xx trong lượt tuần tự cuối.

## Data / source preservation

`browser-suite.json` lưu fingerprint trước/sau của Users (identity/role/status), Assignments, Movies, movie–actor/genre relationships, Actors, Genres, Products, Promotions, Complaints/processing history, order/ticket/food/payment snapshots và fixed Role–Permission. **Hash bằng nhau**:

`612b417339f3c3c15342f56c660713e6c04d793b46d63e2af8d511047c07cf3b`

Counts trước/sau: users 8, assignments 2, movies 4, actors 6, genres 7, products 5, promotions 3, complaints 1. Test-created IDs/owner values được dọn theo allowlist chính xác; orders hủy qua endpoint hiện có trước cleanup. Product seed price được khôi phục. Không deploy/migrate/reset main DB, không sửa schema/procedure/permissions. Identity sequences tăng do fixture create là tác dụng thông thường của test DB; không reset identity để giả lập preservation.

[source-baseline.json](./source-baseline.json) chứa 145 file/hash của **working tree thật trước UXR-5**, bao gồm UXR-4 chưa commit. So với snapshot đó, chỉ sửa 3 file nền: AdminSectionRoute, routes/index và thêm optional readonly hint trong NamedResourceSelect (default Room behavior giữ nguyên). New feature files và tests là additions. UXR-4 operations/staff-bookings/Manager forms/controllers và source API/auth/shared/backend/database được bảo toàn. [delivery-check.json](./delivery-check.json) kiểm tra source, docs links và final artifacts.

## Lỗi phát hiện và đã xử lý

- Provider `.jsx` và hook/context `.js` có cùng basename: import Provider ghi extension rõ để tránh resolver chọn sai module.
- API movie cast trả null khi không có relations; đối chiếu SQL count thực trong [contract-read.json](./contract-read.json), không coi missing/corrupt JSON là empty.
- Picker “thêm” quan hệ reset về empty sau add; đặt `required=false` vì danh sách được kiểm tra riêng, tránh native validation chặn lưu.
- Native dialog có thể gửi close event muộn khi mở lại nhanh: editor/confirmation có identity riêng theo context/action; mobile keyboard reopen regression PASS. Keys có namespace riêng, final console error gate = 0.
- Callback sau dispose không được sửa URL của route mới; queue read không tự sở hữu selection URL. Có automated regression cho late selection/unmount.
- Harness: chờ DOM của **màn hình đích**, không chỉ pathname+table cũ; chờ detail reload sau mutation, chọn topmost nested dialog, dùng đúng thông điệp không có order reference và status 200/201 theo từng endpoint. Một product fixture từ preflight sai status đã được nhận diện theo exact ID/name và dọn; fingerprint cuối PASS.
- Token audit phát hiện tên token không có trong hệ thống; chuyển sang tokens hiện hữu, final unknown-token count = 0.
- Money input kiểm tra cent chính xác trước chuyển sang JSON number: chặn giá trị nhiều chữ số bị JavaScript làm tròn, thay vì gửi số đã đổi cho API. Tests gồm 1234567890123456.12 và 1.00000000000000001; .50/scientific input/trailing zero hợp lệ vẫn được nhận. Chỉ validation input, không tính lại giá/giảm/tổng tài chính. Actual 5C flow và commerce-edges được chạy lại sau refinement; không cộng các lượt lặp vào 146 checks.

Những diagnostic PNG và các báo cáo trong `attempts/` là lịch sử kiểm tra, không tính vào PASS cuối. Không sửa kết quả lịch sử UXR-0–4.

## Lệnh tái chạy

Từ `D:\DBMS_DO_AN`:

```powershell
node docs/UXR-V3/UXR-5/run-final-checks.mjs
node docs/UXR-V3/UXR-5/run-browser-suite.mjs
node docs/UXR-V3/UXR-5/run-delivery-check.mjs
```

Suite cần SQL Server test ID 9, credentials helper hiện có, Chrome tại đường dẫn Windows trong test-environment.mjs và source baseline local. Chrome renderer trong sandbox môi trường này cần tool execution được automatic reviewer cho phép; các commands test không deploy ứng dụng. Không chạy `capture-source-baseline.mjs` lần nữa để tránh thay baseline trước UXR-5 bằng source mới.

**NOT VERIFIED:** toàn bộ browser revocation/401/race/network matrix trên mọi screen, physical touch/Edge/axe/screen reader, production load và all-44-UC E2E. Partial permission/late-response states chỉ nhận PASS theo automated tests hoặc API đúng phạm vi bảng trên.

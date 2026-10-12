# UXR-V3 — UXR-2B Admin Route Ownership

## Kết luận

**Exit Gate: BLOCKED.** Source-level routing checks and the current frontend test/lint/build runs pass. Direct browser acceptance remains blocked: Edge and Chrome GUI both terminated after GPU child failures (`0xC0000022`) before renderer preflight. No Admin route was opened, and no browser screenshot or application console/network evidence exists. See [BROWSER_EVIDENCE.md](BROWSER_EVIDENCE.md) and the [manual acceptance checklist](MANUAL_ACCEPTANCE_CHECKLIST.md).

Chỉ hoàn thành UXR-2B; không bắt đầu UXR-2C.

## Audit và mapping

- Working tree trước task đã có các thay đổi chưa commit của UXR-2A và `note.md`; chúng được giữ nguyên. Không có file Admin route nào bị ghi đè.
- `/admin` trước đây render 16 section tại cùng URL; `AdminPortal` chọn section bằng state và `StaffShell` dùng callback context để đổi section. `/admin/bookings` đã có route riêng.
- Đối chiếu với §3.2–3.3 Blueprint V3: giữ 6 nhóm sidebar, bỏ state menu Admin làm nguồn điều hướng, đưa các section lên URL riêng và giữ route đặt vé hiện hữu.
- Mapping 17 đích đến, component renderer, permission và tương thích nằm trong [ROUTE_MAPPING.md](ROUTE_MAPPING.md).
- `AdminPortal` vẫn cung cấp renderer/handlers hiện có cho các section để tránh đổi nghiệp vụ và redesign. Child route cụ thể cùng `AdminSectionRoute` chịu trách nhiệm chọn section và chặn route theo permission. `/admin/bookings` tiếp tục do `StaffBookings` sở hữu.

## Thay đổi triển khai

- Thêm `adminSectionRoutes.js` làm nguồn route/label cho 16 section cùng route bookings.
- Thêm route con tường minh cho 16 section Admin và `AdminSectionRoute.jsx`: từng child route khai báo section owner cụ thể, kiểm tra permission hiện hành và trả màn hình 403 nếu không đủ quyền; wildcard route trả 404.
- `/admin` chuyển tới `/admin/overview` bằng redirect `replace`; các path con chạy dưới cùng `StaffShell`; `/admin/bookings` giữ nguyên.
- Admin sidebar dùng React Router links cho cả 6 nhóm, cập nhật active state theo pathname và `aria-current="page"`. Breadcrumb dùng shared `PageHeader`/`Breadcrumbs` trên các màn Admin đã map.
- `AdminPortal` nhận section từ route thay vì dùng local section state trong app. Bản standalone cũ vẫn hoạt động cho các fixture/tests hiện có.
- Form drafts được giữ trong bộ nhớ theo user + section qua điều hướng nội bộ; request generations được tăng khi đổi section để response cũ không cập nhật màn hình mới. Draft có chỉnh sửa bật native `beforeunload` confirmation khi reload/rời trang.
- Không thay đổi API, backend, DB, permission code hay layout nghiệp vụ; StaffShell Manager/CSKH được giữ nguyên.

## Kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Admin route map: 17 đích đến duy nhất, phân giải path ngược | **PASS** |
| Direct route chọn đúng section và thiếu permission hiển thị 403 | **PASS — SSR route tests** |
| Sidebar có toàn bộ deep links và active `aria-current` | **PASS — SSR route tests** |
| Unknown Admin path thành 404 | **PASS — SSR route tests** |
| Booking route/menu regression | **PASS — existing staff booking tests** |
| UXR-1A/1B/1C/D automated source regression trong frontend suite | **PASS — included in 88/88**; browser regression của các slice đó **NOT VERIFIED** trong renderer hiện tại. |
| Frontend tests (rerun 2026-10-12) | **PASS — 88/88** |
| Lint (`npm.cmd run lint`, rerun 2026-10-12) | **PASS — exit 0** |
| Production build (isolated `.audit-output/uxr2b-build-20261012`, rerun 2026-10-12) | **PASS** — Vite build completed; bundle warning remains (593.98 kB > 500 kB). |
| Browser GUI preflight | **BLOCKED** — Edge and Chrome GUI both failed before usable renderer; logs linked in [BROWSER_EVIDENCE.md](BROWSER_EVIDENCE.md). |
| Browser route acceptance / responsive screenshots | **BLOCKED / NOT VERIFIED** — no application browser session or screenshots. |
| Back/forward, reload và draft behavior trên browser thật | **NOT VERIFIED** |

Build có cảnh báo bundle JavaScript khoảng 593.98 kB vượt ngưỡng báo 500 kB; build vẫn thành công và chia bundle không thuộc UXR-2B.

## Browser acceptance attempt — 2026-10-12

- Launched Edge and Chrome visibly with separate, new profiles inside `.audit-output`; no user profile was used. Neither was launched headless and no GPU flags were added.
- Edge logged repeated GPU child exit `-1073741790` (`0xC0000022`) and fatal `GPU process isn't usable`. Although the process printed a DevTools listening URL, the CDP preflight request timed out.
- Chrome logged the same GPU child exit and fatal error; its process exited and CDP was unreachable.
- Since the mandatory simple-page JavaScript/input/button/screenshot preflight could not run, the app and database were not started for browser acceptance. This avoids claiming route behavior or touching an unverified database target.
- There are no screenshots, browser console logs, or application network captures from this attempt. See [screenshots/README.md](screenshots/README.md) and [MANUAL_ACCEPTANCE_CHECKLIST.md](MANUAL_ACCEPTANCE_CHECKLIST.md).
- After the initial failure, a user-requested retry launched both browsers in normal GUI mode without CDP or GPU flags and opened a local interactive preflight fixture. Edge then emitted the same GPU fatal; Chrome exited before the five-second check. `WScript.AppActivate` failed and desktop screenshot capture returned an invalid screen handle, confirming this session cannot interact with a visible Windows desktop. Logs and details are in [BROWSER_EVIDENCE.md](BROWSER_EVIDENCE.md).

## Regression risk và việc còn lại

- Cần chạy Browser E2E trên host/CI có renderer hoạt động để xác minh deep link/reload/back-forward, 403, 6 nhóm active links, draft qua route, StaffShell drawer và 5 viewport; hiện không có screenshot mới.
- Browser regression của UXR-1A/B/C/D chưa chạy trên source hiện tại; các test tự động hiện có vẫn PASS, nhưng không thay thế runtime/browser verification.
- Draft cache nằm trong memory của frontend process/tab, được cách ly theo user ID và section; reload cảnh báo thay đổi nhưng không khôi phục draft nếu người dùng xác nhận rời trang. Lưu draft qua reload không được thêm vì sẽ cần quyết định lưu trữ dữ liệu nhạy cảm.
- Renderer và API/data behavior của các màn Admin chưa được tái cấu trúc trong slice. Các phần đó giữ nguyên ownership/handlers cũ để giới hạn rủi ro; screen redesign không thuộc UXR-2B.
- Không thay đổi permission enforcement phía Backend; 403 giao diện là route guard hiện có theo permission được tải.

## File source được sửa/thêm trong UXR-2B

- Sửa: `frontend/src/routes/index.jsx`, `frontend/src/layouts/StaffShell.jsx`, `frontend/src/pages/AdminPortal.jsx`.
- Thêm: `frontend/src/routes/adminSectionRoutes.js`, `frontend/src/routes/AdminSectionRoute.jsx`, `frontend/tests/adminRoutes.test.js`.
- Tài liệu: `ROUTE_MAPPING.md`, `BROWSER_EVIDENCE.md`, `IMPLEMENTATION_REPORT.md`.


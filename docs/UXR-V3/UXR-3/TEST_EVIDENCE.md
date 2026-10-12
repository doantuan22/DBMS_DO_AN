# UXR-3 — Test evidence

Ngày chạy: 12/10/2026 (Asia/Bangkok). Mỗi kết quả dưới đây là lần chạy hiện tại, không kế thừa Phase 9 hoặc browser PASS trước đây.

## Commands và kết quả cuối

| Check | Command / working directory | Kết quả | Evidence |
|---|---|---|---|
| Toàn bộ frontend | `npm.cmd test`, `frontend/` | PASS: 152 tests, 0 fail/skip | [frontend-tests.log](./frontend-tests.log) |
| Lint | `npm.cmd run lint`, `frontend/` | PASS, exit 0 | [frontend-lint.log](./frontend-lint.log) |
| Production build | `npm.cmd run build -- --outDir ../.audit-output/uxr3-production-20261012-verified`, `frontend/` | PASS, exit 0, 137 modules | [frontend-build.log](./frontend-build.log) |
| Backend contracts/regression | `node --test tests/adminService.test.js tests/managerService.test.js tests/roomDelete.test.js`, `backend/` | PASS: 30 tests | [backend-regression.log](./backend-regression.log) |
| SP integration | `node docs/UXR-V3/UXR-3/run-db-regression.mjs`, repository root | PASS: 13 grouped assertions; transaction count zero | [db-regression.log](./db-regression.log), [db-identity.json](./db-identity.json) |
| HTTP integration | `node docs/UXR-V3/UXR-3/run-api-integration.mjs`, repository root | PASS: 42 requests + body/database assertions, owned fixtures zero | [api-integration.json](./api-integration.json), [api-integration.log](./api-integration.log) |
| Session preservation | SHA256 compare saved baseline | PASS: AdminPortal, ManagerPortal, ManagerLayout unchanged | [preservation-check.json](./preservation-check.json) |
| Browser GUI | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/UXR-V3/UXR-3/run-browser-preflight.ps1` | BLOCKED renderer, no app steps | [BROWSER_EVIDENCE.md](./BROWSER_EVIDENCE.md) |

Build dùng output mới để giữ artifacts/working tree có trước; không xóa `dist`. Đây là Vite production build thực, không phải browser acceptance. Có warning bundle JS 660.60 kB (>500 kB) và outDir ngoài frontend không tự emptied. Exit code thực là 0; Windows PowerShell hiển thị native stderr warning dưới NativeCommandError trong log không đồng nghĩa build fail. `npm.ps1` ban đầu bị execution policy chặn; đã dùng `npm.cmd`, không đổi security policy.

## Automated functional coverage

`frontend/tests/facilities.test.js`: **29 tests**, controller/model và SSR markup của component/route thực; 123 tests hiện có khác chạy cùng suite.

| Nhóm | Kết quả / mức bằng chứng |
|---|---|
| Admin hierarchy | PASS unit: named lookup → scoped room → roomId-only seat read; no global seats fetch; malformed/foreign pair 404; role/dependency 403 |
| Room/cinema races | PASS unit: A1→A2→A1 và A→B→A late reads, dispose, wrong-scope payload; selection/draft reset đúng context |
| Dirty handling | PASS unit: Cancel giữ draft/query, Confirm bỏ draft/context cũ; close, mode và showtime history navigation |
| Manager safety | PASS unit: hidden draft restore, cached room restore, epoch invalidation, assignment ownership, context mutation token, double-submit |
| Seat map | PASS SSR/model: 130 ghế thật, hàng/số, không invent gaps, filter không bỏ vị trí, aria-pressed/roving tab markup; missing/duplicate → fallback |
| Seat actions | PASS unit: exact create/update payload, enum/INT validation, immutable room/position, 403/404/409 giữ draft/dataset, delete Confirm/Cancel |
| Occupancy | PASS unit/SSR: paired cinema/room/showtime validation trước read; wrong-room response 409, late response ignored; read-only inspector, permission gating, mode/query reload |
| Manager Rooms | PASS SSR: curated columns, actual seatCount, paired link, forged cinema query 403 |
| Cinema | PASS unit/SSR: optional complete room count vs unavailable count, dependency rejection giữ cinema, named drawer; nullable optional fields match REST |
| Gallery | PASS unit/SSR: scoped late images/mutations, cover/order/delete, dirty guard, thumbnail/preview/alt/metadata, no raw URL table |
| Existing routing/UI/booking | PASS existing suite: Admin/Manager route mapping/guards/legacy redirects, UXR-3A rooms, Manager context/drafts, UI shared components, booking/CSKH guards |

SSR không chạy effects, layout, pointer hoặc browser focus. Roving markup và native handlers có source không có nghĩa keyboard acceptance đã PASS. Booking/showtime/pricing preservation có automated regression/source evidence; live browser end-to-end vẫn NOT VERIFIED.

Lần frontend đầu có 147/148 PASS; một source-regex test tìm dropdown trong CinemaImageManager cũ không còn phù hợp sau wrapper migration. Đã đổi sang SSR FacilityEditor thực và kiểm tra whitelist trạng thái, không bỏ assertion. [frontend-tests-initial.log](./frontend-tests-initial.log) giữ nguyên. Những thất bại trong development giúp sửa request reload phòng dư và route title; final suite không còn fail.

## SP integration — isolated DB

Database: **CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2**, DatabaseID **9**, xác minh trước writes. Harness offline không được import bởi app. Không deploy schema, grant/RBAC, sửa SP hoặc SQL nghiệp vụ trong frontend/backend. Các write chỉ gọi SP hiện có trong transaction và rollback, kể cả historical room deactivation.

| Nhóm ca thực hiện | Kết quả |
|---|---|
| Manager room/seat create, update, list, full count, delete và rollback cleanup | PASS |
| Manager historical seat type update 50207, row unchanged | PASS |
| Manager historical seat delete 50110, row retained | PASS |
| Manager outside-scope read và update 50050 | PASS |
| Historical room deletion deactivates, preserves seats, rollback restores | PASS |
| Admin historical seat type/delete rejection 50207 | PASS |
| Foreign Manager role against Admin SP 50301 | PASS |
| Cinema dependencies reject delete 50096, record retained | PASS |
| Admin cinema/room/seat CRUD, scope/count, images create/update/delete/cover/order/status | PASS |
| Final transaction count zero, rollback fixtures absent | PASS |

Log chứa 13 PASS markers cho các nhóm/assertions, không đồng nhất với số browser cases. SQL Server identity counters có thể tăng sau rollback; không restore identity vì không thay đổi transaction semantics. DB fixture hiện có có Manager ở rạp 1 và Manager khác ở rạp 2, không có một actor được phân công đồng thời hai rạp. Multi-assignment A→B→A đã kiểm chứng bằng controller/store tests; **live multi-assignment DB/browser flow NOT VERIFIED**. Không thêm assignment/quyền để giả lập acceptance.

## Real HTTP integration

App factory hiện có chạy loopback ephemeral port, không import server/job expiration. Kết nối pool xác minh đúng tên DB và ID 9 trước write; JWT test secret riêng process, token chỉ sub của actor fixture. Middleware thật hydrate quyền/assignment từ DB. Không mock authorize, không thêm quyền, không log token/password.

42 requests cuối cùng gồm scope reads, 403 foreign cinema/room/seat update/role, seat history update/delete 409 cho Admin và Manager, missing seat 404, cinema dependency 409, valid Admin cinema/room/seat/image CRUD, single cover, numeric order/status/cover clearing, wrong gallery owner 404, Manager room/seat CRUD và actual count. Body assertions kiểm tra đúng room IDs/count/cover/status; DB đọc xác nhận historical seat unchanged.

Chỉ tài nguyên mang tên riêng `UXR3_HTTP_*` do harness tạo mới được cleanup qua REST hiện có, ngược thứ tự phụ thuộc. Cuối chạy kiểm tra không còn các ID đã tạo và **0 cinemas/0 rooms mang prefix fixture**, không có fixture còn lại. History writes đều expected rejection; history deactivation chỉ trong SQL rollback.

Hai lần đầu harness sai contract: gửi cinemaId cùng roomId vào Admin seat GET (400 UNKNOWN_QUERY_PARAMETER), rồi mong image POST 200 thay vì 201. Frontend adapter vốn dùng đúng roomId-only; không sửa backend. Giữ [api-integration-initial-failed.json](./api-integration-initial-failed.json) và [api-integration-second-failed.json](./api-integration-second-failed.json). Đã sửa harness, xác minh identity và tên fixture trước recovery, xóa đúng tài nguyên test qua REST; rerun cuối PASS/zero fixtures. Thêm finally cleanup để bảo vệ các lần chạy sau. Empty cinema phone/description cũng đã được chuẩn hóa nullable trong feature payload và kiểm chứng qua API thật.

## Giới hạn nghiệm thu

Chưa có browser route smoke, screenshots, axe, actual reload/back/forward/focus/touch/mobile drawer, actual external assets hoặc occupancy scenario đang held/sold trên browser. Không được dùng các PASS trên để thay bằng chứng này. [BROWSER_EVIDENCE.md](./BROWSER_EVIDENCE.md) và [MANUAL_ACCEPTANCE_CHECKLIST.md](./MANUAL_ACCEPTANCE_CHECKLIST.md) ghi phần cần nghiệm thu tiếp. **Exit Gate: BLOCKED.**

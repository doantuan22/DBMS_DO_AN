# UXR-6 — bằng chứng kiểm thử

Ngày 12/10/2026. Snapshot source trước thay đổi: HEAD `b3d7f59`, 163 file, [source-baseline.json](source-baseline.json). Browser Chrome headless thật, Vite + Express thật, stored procedures thật; không mock response trong acceptance. DB `CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2` ID **9**. Actor 1 Admin, 2 Manager, 4 CSKH, 5/6 Customers được xác minh từ DB; tài khoản đăng ký và mutation đều fixture riêng.

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Lint | PASS, không warning | `npm.cmd run lint` tại frontend |
| Frontend toàn bộ | PASS **215/215** | `npm.cmd test`; có UXR-1/4/5 và 8 test UXR-6 mới |
| Backend toàn bộ | PASS **205/205** | `npm.cmd test` tại backend |
| Production build | PASS | Vite 8.3.1, 183 modules, CSS 82.70kB / JS 792.17kB; warning bundle >500kB |
| REST/SP parameter contract | PASS | 110 service methods, 118 calls, 0 missing source / problems; `node scripts/db/contract-check.mjs` |
| Source boundaries | PASS | [source-audit.json](source-audit.json): 25 file source cũ thay đổi, protected files không thay đổi |
| 6A before | CAPTURED, 5 checks | [6A-before.json](6A-before.json) |
| 6A acceptance | PASS, 10 checks | [6A-browser.json](6A-browser.json), keyed drafts/filter/case/refresh/confirmation/actual writes |
| 6B before | CAPTURED, 25 checks | [6B-before.json](6B-before.json) |
| 6B acceptance | PASS, 29 checks | [6B-browser.json](6B-browser.json), filters, schedule, blocked image fallback |
| 6C before | CAPTURED, 5 checks | [6C-before.json](6C-before.json) |
| 6C acceptance | PASS, 10 checks | [6C-browser.json](6C-browser.json), seat limit, invalid promo, actual 409/create/product/server total |
| 6D before | CAPTURED, 40 checks | [6D-before.json](6D-before.json) |
| 6D acceptance | PASS, 48 checks | [6D-browser.json](6D-browser.json), registration/login/profile/payment/complaints/ownership/expired/network recovery |
| Browser regression | PASS, 14 checks | [regression-browser.json](regression-browser.json), delayed case read, promo pause, eligibility, staff scope and routes |
| DB final | PASS, 3 checks / 169 SQL modules | [database-final.json](database-final.json), counts bằng baseline, remaining fixtures=0, module parity |

**111 checks** trong năm suite acceptance/regression, không bao gồm capture-only. Request records gồm browser GET/response và Node API assertions; không coi record count là số scenario hay số SP call. Suite cuối không có console/runtime errors. 75 cặp ảnh before/after chính tại **390/768/1280/1440/1920**; ảnh bổ sung cho mobile queue, ảnh lỗi, actual receipt/case, lỗi mạng và regression nằm cùng thư mục. [Before](screenshots/before), [after](screenshots/after). Ảnh có tên `failure` là chẩn đoán các lần chạy đã sửa, không phải ảnh nghiệm thu cuối.

Mutation: CSKH status/processings, Customer booking có sản phẩm và competing seat, registration/profile, failed/successful payment attempts, complaint creation, Admin tạo/tạm dừng promotion fixture. Các tạo/sửa đi qua API/SP; riêng cleanup offline có whitelist table, ID và owner/title/email chính xác. Đơn unpaid được hủy bằng business API trước cleanup. Paid order, profile points và complaint của Customer fixture được dọn cùng owner; seed accounts không dùng để test payment success. JSON từng suite ghi remaining=0. Không migrate DB hoặc thay SQL/REST/RBAC.

Lỗi đã xử lý: actor CSKH ban đầu bị nhận nhầm trước preflight; wait native beforeunload; selector tên nút FilterBar; byte encoding khi pipe source qua shell; wait trang không có table; block URL mạng trúng Vite module; Rooms yêu cầu chọn rạp trước table. Production build sandbox lần đầu gặp EPERM ở `dist/assets`, sau xác minh output nằm trong workspace đã build lại thành công với quyền phù hợp. Các failure này không được dùng làm E2E PASS.

**NOT VERIFIED:** Edge/Safari, thiết bị touch vật lý, screen reader/axe audit toàn diện; live countdown từ đơn vừa tạo tới expiry server trong cùng phiên; mọi tổ hợp revoke permission/logout trong lúc request pending; mọi race booking/pricing/SP concurrency suite cũ. Expired order thực, deadline contract unit tests, competing-seat 409, promo-unavailable và late CSKH read đã được kiểm tra riêng. Payment provider thật **BLOCKED theo contract mô phỏng hiện hành**, không có claim thanh toán ngân hàng thật. Không nghiệm thu tất cả 44 UC.

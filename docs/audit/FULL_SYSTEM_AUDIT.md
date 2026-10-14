# Full Functional & Integration Audit — Baseline Traceability

**Cập nhật:** 2026-10-14 (đồng bộ với [FINAL_ACCEPTANCE_REPORT.md](FINAL_ACCEPTANCE_REPORT.md) và [FINAL_HARDENING_REPORT.md](FINAL_HARDENING_REPORT.md))  
**Phạm vi:** React frontend, Express API, Typed Stored-Procedure client, SQL Server `CinemaBookingDB_Test`, 4 vai trò cố định (Customer, Manager, CSKH, Admin).  
**Nguyên tắc:** mọi thao tác ghi chạy trên `CinemaBookingDB_Test`; runner kiểm tra `SELECT DB_NAME()` trước mỗi lô ghi và dừng nếu sai.

> **Ghi chú đồng bộ (2026-10-14).** Bản trước của tài liệu này viện dẫn các runner `scratch/run_api_integration_audit.mjs`, `scratch/run_full_browser_e2e.mjs`, `scratch/check_db_integrity.mjs` và một tệp `FINAL_AUDIT_VALIDATION.md`. Không có tệp nào trong số đó tồn tại trong repository, nên các con số cũ (52 API / 12 Browser, "51 phim") không thể tái lập. Các runner đã được xây dựng lại, đưa vào [`scripts/audit/`](../../scripts/audit) và toàn bộ kết quả dưới đây là kết quả **thực chạy lại**. Các đường dẫn endpoint ghi sai trước đây (`/api/cskh/*`, `/api/payments/*`, `/api/manager/rooms`…) đã được sửa theo `backend/src/routes`.

---

## 1. Tóm tắt

| Lớp kiểm chứng | Kết quả | Số lượng | Lệnh |
|---|:---:|:---:|---|
| Backend unit/contract | **PASS** | 212 / 212 | `npm.cmd --prefix backend test` |
| Frontend unit/component | **PASS** | 238 / 238 | `npm.cmd --prefix frontend test` |
| Frontend production build | **PASS** | 228+ modules | `npm.cmd --prefix frontend run build` |
| Database integrity (chỉ đọc) | **PASS** | 21 / 21 | `npm.cmd run audit:db` |
| API integration (HTTP→SP→SQL) | **PASS** | 73 / 73 (52 nghiệp vụ + 21 toàn vẹn) | `npm.cmd run audit:api` |
| Lifecycle: concurrency, hết hạn giữ ghế, hủy suất có bồi thường | **PASS** | 39 / 39 (18 + 21 toàn vẹn) | `npm.cmd run audit:lifecycle` |
| Browser E2E tương tác + responsive + a11y (Edge) | **PASS** | 54 / 54 (33 kịch bản + 21 toàn vẹn) | `npm.cmd run audit:e2e` |

Chạy tất cả: `npm.cmd run audit:all`. Bằng chứng JSON và ảnh chụp màn hình: `.audit-output/acceptance/` (bỏ qua bởi Git).

---

## 2. Toàn vẹn cơ sở dữ liệu (`scripts/audit/db-integrity.mjs`)

| Mã | Kiểm tra | Kết quả đo |
|---|---|:---:|
| DB-INV-01 | 27 bảng, 134 SP, 6 view, 21 hàm, 8 trigger | khớp |
| DB-HEALTH-01 | `dbo.sp_System_HealthCheck` = `Healthy` | Healthy |
| DB-CONSTRAINT-01/02 | FK / CHECK không bị disable hoặc untrusted | 0 |
| DB-CONSTRAINT-03 | `DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS` | 0 vi phạm |
| DB-ORPHAN-01 | Thanh toán không có đơn | 0 |
| DB-SEAT-01 | Ghế bị giữ trùng trong cùng suất (theo `fn_DonDangGiuGhe`) | 0 |
| DB-SEAT-02 | Vé thuộc ghế khác phòng của suất | 0 |
| DB-SHOWTIME-01 | Suất chiếu chồng giờ cùng phòng (không tính đã hủy) | 0 |
| DB-PRICING-01 | Quy tắc giá "Áp dụng" chồng nhau | 0 |
| DB-MONEY-01/02/03 | Tổng tiền vé / đồ ăn khớp chi tiết; giảm giá hợp lệ | 0 lệch |
| DB-PAYMENT-01 | Đơn đã thanh toán có thanh toán thành công; đơn chờ không có | 0 |
| DB-PROMO-01 | `SoLuongDaDung ≤ SoLuong` | 0 |
| DB-REVIEW-01 | Một đánh giá / khách / phim | 0 |
| DB-COMPLAINT-01 | Trạng thái khiếu nại = trạng thái của diễn biến xử lý mới nhất | 0 |
| DB-PAYMENT-02 | Tối đa một thanh toán thành công / đơn | 0 |
| DB-COMPENSATION-01 | Bồi thường tối đa một dòng / đơn và chỉ cho suất đã hủy | 0 |
| DB-EXPIRY-01 | Đơn `Hết hạn` không còn vé hiệu lực | 0 |
| DB-RBAC-01 | 4 vai trò cố định, mọi user có đúng một vai trò | khớp |

Cả 21 kiểm tra được chạy lại sau mỗi lần chạy API và Browser (tiền tố `POST-`).

---

## 3. Truy vết 44 Use Case hoạt động

Tài liệu thiết kế chuẩn: [Phân Tích _ Thiết Kế.md](../../Phân%20Tích%20_%20Thiết%20Kế.md). Cột *API* / *E2E* là mã kiểm thử thực chạy (xem §5 và §6).

### 3.1 Khách hàng — 14 Use Case

| UC | Tên | Endpoint thật | SP chính | API | E2E |
|---|---|---|---|---|---|
| KH-01 | Đăng ký | `POST /api/auth/register` (201) | `sp_Auth_Register` | API-AUTH-01/02 | E2E-CUST-REG |
| KH-02 | Đăng nhập | `POST /api/auth/login` | `sp_Auth_Login` | API-AUTH-03/05 | E2E-CUST-REG, E2E-ADM-USER |
| KH-03 | Hồ sơ | `GET/PUT /api/auth/me` | `sp_Customer_Profile_*` | API-AUTH-04 | — |
| KH-04 | Phim | `GET /api/movies`, `/api/movies/:id` | `sp_Movie_*` | API-CAT-01/04 | E2E-CUST-BOOK |
| KH-05 | Lịch chiếu | `GET /api/movies/:id/showtimes`, `/api/showtimes/:id` | `sp_Showtime_*` | API-CAT-02 | E2E-CUST-BOOK |
| KH-06 | Chọn ghế | `GET /api/showtimes/:id/seats` | `fn_DanhSachGheSuatChieu` | API-CAT-03 | E2E-CUST-BOOK |
| KH-07 | Đặt vé | `POST /api/bookings` (201) | `sp_Booking_CreatePendingOrder` | API-BOOK-01..04 | E2E-CUST-BOOK |
| KH-08 | Đồ ăn | `GET /api/products`, `POST /api/bookings` | `CHITIETDOAN` snapshot | API-BOOK-01 | E2E-CUST-BOOK |
| KH-09 | Khuyến mãi | `POST /api/promotions/validate`, `POST /api/bookings` | `sp_Promotion_*` | API-PROMO-01/02 | E2E-CUST-BOOK |
| KH-10 | Thanh toán | `POST /api/orders/:id/payments` (201), `POST /api/orders/:id/payments/:paymentId/result` | `sp_Payment_*` | API-PAY-01..03 | E2E-CUST-BOOK |
| KH-11 | Lịch sử đơn | `GET /api/orders` | `sp_Customer_Order_List` | API-ORD-01 | E2E-CUST-BOOK |
| KH-12 | Chi tiết đơn | `GET /api/orders/:id` | `sp_Customer_Order_GetDetail` | API-ORD-01, API-PAY-03 | — |
| KH-13 | Đánh giá | `GET/POST /api/movies/:id/reviews` | `sp_Review_Create` + `TRG_DanhGia_KiemTraDaXemPhim` | API-REV-01..03 | E2E-CUST-REVIEW |
| KH-14 | Khiếu nại | `GET/POST /api/complaints`, `GET /api/complaints/:id` | `sp_Complaint_Create` | API-CMP-01..03 | E2E-CUST-COMPLAINT, E2E-CUST-COMPLAINT-RESULT |

### 3.2 Quản lý rạp — 10 Use Case

| UC | Tên | Endpoint thật (`/api/manager/…`) | API | E2E |
|---|---|---|---|---|
| QLR-01 | Đăng nhập + phạm vi rạp | `POST /api/auth/login`, `GET /cinemas` | API-MGR-01, API-RBAC-02 | E2E-MGR-SCOPE, E2E-ADM-ASSIGN |
| QLR-02 | Phòng chiếu | `GET/POST /cinemas/:id/rooms`, `PUT/DELETE /rooms/:id` | API-MGR-02, API-MGR-08 | E2E-MGR-ROOM |
| QLR-03 | Ghế | `GET/POST /rooms/:id/seats`, `PUT/DELETE /seats/:id` | API-MGR-03, API-MGR-08 | E2E-MGR-SEAT |
| QLR-04 | Tạo suất chiếu | `POST /showtimes` | API-MGR-04 | E2E-MGR-SHOWTIME |
| QLR-05 | Sửa suất chiếu | `PUT /showtimes/:id` | API-MGR-05 | E2E-MGR-SHOWTIME |
| QLR-06 | Hủy suất chiếu | `POST /showtimes/:id/cancel` (idempotent) | API-MGR-06 | E2E-MGR-SHOWTIME |
| QLR-07 | Bảng giá rạp | `GET/POST /cinemas/:id/pricing`, `PUT /pricing/:id` | API-MGR-07 | E2E-MGR-PRICING |
| QLR-08 | Dashboard | `GET /cinemas/:id/dashboard` | API-MGR-01 | E2E-MGR-SCOPE |
| QLR-09 | Doanh thu | `GET /cinemas/:id/revenue` | API-MGR-01 | E2E-MGR-SCOPE |
| QLR-10 | Đặt vé nhân viên | `/api/manager/bookings` (list, customers, options, create 201, `PUT /:id/seats`, `POST /:id/cancel`, DELETE=405) | API-STF-01..04 | E2E-MGR-BOOKING |

### 3.3 Chăm sóc khách hàng — 6 Use Case (`/api/support/…`)

| UC | Tên | Endpoint | API | E2E |
|---|---|---|---|---|
| CSKH-01 | Đăng nhập | `POST /api/auth/login` | API-SUP-03 | E2E-CSKH-PROCESS |
| CSKH-02 | Hàng chờ khiếu nại | `GET /complaints` | API-SUP-01 | E2E-CSKH-PROCESS |
| CSKH-03 | Chi tiết khiếu nại | `GET /complaints/:id` | API-SUP-01 | E2E-CSKH-PROCESS |
| CSKH-04 | Đơn tham chiếu | `GET /complaints/:id/order-reference` | API-SUP-01 | E2E-CSKH-PROCESS |
| CSKH-05 | Ghi diễn biến (append-only, 201) | `POST /complaints/:id/processings` | API-SUP-02 | E2E-CSKH-PROCESS |
| CSKH-06 | Đổi trạng thái | `PUT /complaints/:id/status` | API-SUP-02 | E2E-CSKH-PROCESS |

### 3.4 Quản trị viên — 14 Use Case (`/api/admin/…`)

| UC | Tên | Endpoint | API | E2E |
|---|---|---|---|---|
| ADM-01 | Đăng nhập | `POST /api/auth/login` | API-RBAC-01 | E2E-ADM-USER |
| ADM-02 | Tài khoản (tạo 201 / khóa / mở) | `GET/POST /users`, `PUT /users/:id/status` | API-ADM-01 | E2E-ADM-USER |
| ADM-06 | Phân công Manager | `GET/POST /assignments`, `PUT /assignments/:id` | API-ADM-02, API-RBAC-02 | E2E-ADM-ASSIGN |
| ADM-07 | Rạp + ảnh rạp | `/cinemas`, `/cinemas/:id/images`, `PATCH …/cover` | API-ADM-03 | E2E-ADM-FACILITY |
| ADM-08 | Phòng + ghế | `/rooms`, `/seats` | API-ADM-04 | E2E-ADM-FACILITY |
| ADM-09 | Phim + diễn viên + cast | `/movies`, `/actors`, `PUT /movies/:id/actors` | API-ADM-05 | E2E-ADM-CATALOG |
| ADM-10 | Thể loại | `/genres` | API-ADM-05 | E2E-ADM-CATALOG |
| ADM-11 | Sản phẩm | `/products` | API-ADM-07 | E2E-ADM-COMMERCE |
| ADM-12 | Khuyến mãi | `/promotions` | API-ADM-07 | E2E-ADM-COMMERCE |
| ADM-13 | Bảng giá toàn hệ thống | `GET/POST /pricing`, `PUT /pricing/:id` | API-ADM-06 | E2E-ADM-FACILITY |
| ADM-14 | Suất chiếu toàn hệ thống | `GET/POST /showtimes`, `PUT /showtimes/:id`, `POST …/cancel` | API-ADM-06 | E2E-ADM-FACILITY |
| ADM-15 | Khiếu nại (Admin) | `/complaints`, `/complaints/:id/processings` (201), `/status` | API-ADM-08 | — (chỉ API) |
| ADM-16 | Báo cáo doanh thu | `GET /reports/revenue`, `GET /dashboard` | API-ADM-08 | — (chỉ API) |
| ADM-18 | Đặt vé toàn hệ thống | `/api/admin/bookings` | API-ADM-08 | E2E-ADM-BOOKING-VIEW |

### 3.5 Use Case đã bãi bỏ / ngoài phạm vi

| UC | Phân loại | Ghi chú |
|---|:---:|---|
| ADM-03, ADM-04, ADM-05 | **RETIRED** | RBAC cố định (11/10/2026): mọi ghi vào `/api/admin/roles*`, `/permissions*` trả `403 RBAC_FIXED` — kiểm chứng bởi API-ADM-10. |
| ADM-17 | **OUT OF SCOPE** | Tham số hệ thống quản lý qua `.env`. |

---

## 4. Quy ước HTTP status của API tạo mới (F-05)

Mọi endpoint `POST` tạo bản ghi mới trả **`201 Created`** với cùng body như trước (frontend chỉ phân biệt `response.ok`):

| Nhóm | Endpoint |
|---|---|
| Auth / Booking / Orders / Feedback | `POST /auth/register`, `/bookings`, `/orders/:id/payments`, `/movies/:id/reviews`, `/complaints` |
| Manager | `POST /manager/cinemas/:id/rooms`, `/rooms/:id/seats`, `/showtimes`, `/cinemas/:id/pricing`, `/bookings` |
| Support | `POST /support/complaints/:id/processings` |
| Admin (đã chuẩn hóa) | `POST /admin/users`, `/assignments`, `/cinemas`, `/cinemas/:id/images`, `/rooms`, `/seats`, `/pricing`, `/showtimes`, `/genres`, `/actors`, `/movies`, `/products`, `/promotions`, `/complaints/:id/processings` |

Hành động không tạo tài nguyên (`PUT`, `PATCH`, `DELETE`, `POST /showtimes/:id/cancel`, `POST /bookings/:id/cancel`) giữ `200 OK`. Regression test: `backend/tests/adminCreatedStatus.test.js` (5 test) và `frontend/tests/adminCreated201.test.js` (HTTP client + `adminApi` nhận 201 như thành công).

---

## 5. Danh mục API integration (`scripts/audit/api-integration.mjs`)

52 kiểm thử nghiệp vụ, mỗi ca có đối chiếu SQL sau khi ghi: `API-AUTH-01..05`, `API-CAT-01..04`, `API-BOOK-01..04`, `API-ORD-01`, `API-PAY-01..03`, `API-PROMO-01..02`, `API-REV-01..03`, `API-CMP-01..03`, `API-SUP-01..03`, `API-MGR-01..08`, `API-STF-01..04`, `API-ADM-01..10`, `API-RBAC-01..02`; cộng 18 kiểm tra toàn vẹn (`POST-DB-*`).

## 6. Danh mục Browser E2E (`scripts/audit/browser-e2e.mjs`)

Microsoft Edge (Playwright, `channel: msedge`), mỗi kịch bản dùng context mới. Các bước là sự kiện DOM thật (`fill`, `click`, `selectOption`); kết quả đọc lại từ SQL Server.

| Mã | Luồng |
|---|---|
| E2E-CUST-REG | Đăng ký qua form → đăng nhập; mật khẩu bcrypt, hồ sơ khách hàng |
| E2E-CUST-BOOK | Phim → suất chiếu → chọn 2 ghế → đồ ăn → mã `DEMO10` → Đặt vé → Thanh toán (MoMo) → đối chiếu đơn/vé/đồ ăn/giảm giá/thanh toán/bộ đếm khuyến mãi |
| E2E-CUST-REVIEW | Đánh giá bị từ chối khi chưa xem (BR05) → chấp nhận sau đơn đã xem → đánh giá trùng bị từ chối |
| E2E-CUST-COMPLAINT | Gửi khiếu nại gắn đơn của chính khách |
| E2E-CSKH-PROCESS | Hàng chờ → mở hồ sơ → ghi diễn biến → đổi trạng thái (log append-only) |
| E2E-CUST-COMPLAINT-RESULT | Khách thấy kết quả xử lý |
| E2E-MGR-ROOM / SEAT / SHOWTIME / PRICING | CRUD phòng, ghế, suất chiếu (tạo/sửa giá/hủy), bảng giá |
| E2E-MGR-BOOKING | Tạo đơn cho khách → đổi ghế → hủy; lịch sử vé giữ nguyên |
| E2E-MGR-SCOPE | Chỉ thấy rạp được phân công; URL rạp ngoài phạm vi bị chặn |
| E2E-ADM-USER | Tạo tài khoản CSKH → khóa (đăng nhập bị từ chối) → mở khóa |
| E2E-ADM-CATALOG | Thể loại, diễn viên, phim (+ cast) tạo/sửa/xóa |
| E2E-ADM-COMMERCE | Sản phẩm, khuyến mãi CRUD; khuyến mãi đã dùng không xóa được |
| E2E-ADM-FACILITY | Rạp → phòng → suất chiếu (chồng giờ bị chặn) → bảng giá → hủy suất |
| E2E-ADM-ASSIGN | Phân công Manager mới → Manager thấy đúng 1 rạp → hết hạn → mất quyền |
| E2E-ADM-BOOKING-VIEW | Đơn đã thanh toán chỉ đọc (không có Sửa ghế/Hủy đơn) |
| E2E-RBAC-ROUTES | Chuyển hướng `/login` và `/forbidden` giữa 4 vai trò |

## 6b. Kiểm thử hardening bổ sung

**Lifecycle (`scripts/audit/lifecycle.mjs`, 18 ca):** `LC-CONC-01..13` (thêm: khóa ảnh rạp/cover, ghi nhận xử lý khiếu nại song song, thay diễn viên song song, xóa phòng đua với tạo suất, đổi giá đua với đặt vé; ba ca đầu như dưới) — `LC-CONC-01..08` (đua cùng một ghế; tập ghế giao nhau; giới hạn 3 đơn chờ/khách; nộp kết quả thanh toán trùng; đua tạo suất chồng giờ; hạn mức khuyến mãi; đua tạo bảng giá chồng; đặt vé đua với hủy suất), `LC-EXP-01..02` (hết hạn giữ ghế: ghế trống lại ngay, thanh toán bị từ chối 409 `ORDER_HOLD_EXPIRED`, job nền 60 s chuyển `Hết hạn` và trả lượt khuyến mãi), `LC-CMP-01..03` (hủy suất bị chặn khi còn giữ chỗ; hủy suất có đơn đã thanh toán: đơn `Đã hủy`, điểm bồi thường đúng công thức, số dư điểm, lịch sử thanh toán giữ nguyên, idempotent, đua hủy song song chỉ cộng điểm một lần).

**Browser bổ sung (14 kịch bản):** `E2E-ADM-DASHBOARD`, `E2E-ADM-REVENUE` (số liệu UI = SQL độc lập), `E2E-ADM-IMAGES`, `E2E-ADM-COMPLAINT`, `E2E-ADM-ROOMS-SEATS`, `E2E-ADM-BOOKING-CRUD`, `E2E-ADM-SHOWTIME-EDIT`, `E2E-EXP-HOLD`, `E2E-CMP-CANCEL`, `E2E-A11Y-DESKTOP/TABLET/MOBILE` (axe-core WCAG 2.2 A/AA + không tràn ngang trên 32 trang × 3 viewport), `E2E-RESP-MOBILE-FLOWS`, `E2E-A11Y-KEYBOARD`.

## 7. Phát hiện đã phân loại

| Mã | Phát hiện | Phân loại | Hiện trạng |
|---|---|:---:|---|
| F-01 | Khóa thư mục build | Low | **Resolved** — build sạch (228 modules) |
| F-02 | Thiếu `baseline-manifest.json` | Medium | **Resolved** — tệp có mặt, test backend 210/210 |
| F-03 | Tài liệu lịch sử/đường dẫn hỏng | Low | **Resolved** — README, `database/README.md`, `backend/TESTING.md` đã sửa (§8) |
| F-04 | Chưa có runner Browser E2E trong repo | Medium | **Resolved** — `scripts/audit/browser-e2e.mjs`, 19 kịch bản |
| F-05 | Admin create trả 200 thay vì 201 | Low | **Resolved** — 9 hàm admin + `processings`, xem §4 |
| F-06 | `sp_Order_Cancel.sql` không nằm trong whitelist | Low | Legacy/out-of-scope (khách không tự hủy đơn) |
| F-07 | `POST/PUT /admin/showtimes` và `PUT /admin/movies/:id` trả envelope của driver `mssql` | Low | **Resolved** — trả dòng kết quả của SP (`{ showtime: { SuatChieuID, … } }`); test `adminDtoShape.test.js`, `API-ADM-05/06` |
| F-08 | Nhánh map lỗi `50117` không thể xảy ra | Info | **Resolved** — bỏ nhánh chết ở `adminService`/`managerService`, bảng test và thông điệp frontend |
| F-09 | Thông báo lỗi tiếng Anh hiển thị trên UI | Info | **Resolved** — `frontend/src/api/errorMessages.js` (115 mã lỗi, test hợp đồng quét toàn bộ `HttpError` của backend) |
| F-10 | 127 tệp chưa đúng Prettier | Info | **Resolved** — `npm run format`, `format:check` sạch (đã thêm `scripts/audit` vào phạm vi) |
| F-11 | Doanh thu "thực thu" vẫn tính đơn đã bị hủy do hủy suất | Info | **Analysed — chờ quyết định nghiệp vụ**: bốn nguồn báo cáo nhất quán (cash basis); xem [F-11_REVENUE_ANALYSIS.md](F-11_REVENUE_ANALYSIS.md) |
| F-12 | 3 cảnh báo lint (`priceLabel`, `can`, `setState` trong effect) | Info | **Resolved** — `oxlint` 0 cảnh báo; không đổi hành vi UI |
| F-13 | Script concurrency cũ hỏng import | Info | **Resolved** — 10 script được loại bỏ chính thức, thay bằng `LC-CONC-01..13` (bảng ánh xạ trong `database/11_tests/concurrency/README.md`) |
| F-14 | Dữ liệu `E2E …` tích lũy trong CSDL test | Info | **Resolved** — sandbox + gắn nhãn + `audit:testdb` (dry-run/backup/transaction); xem [TEST_DATABASE_FIXTURES.md](TEST_DATABASE_FIXTURES.md) |

## 8. Tài liệu đã đồng bộ

- `README.md`: bỏ liên kết tới `USE_CASE_MATRIX_45.md`, `R8_*`, `FINAL_SYSTEM_AUDIT.md`, `docs/seed/*`; sửa số Use Case (Manager 10, Admin 14); thêm mục *Kiểm định tự động*.
- `database/README.md`: thay `FINAL_SYSTEM_AUDIT.md`, `10_seed/README.md`, `docs/seed/*`, migrations `r9/r10` (không còn trong snapshot) bằng tham chiếu hiện hành; ghi chú mật khẩu demo của DB test.
- `backend/TESTING.md`: thay phần `scripts/db/fixed-rbac-smoke.mjs` (không còn) bằng hướng dẫn `scripts/audit`.

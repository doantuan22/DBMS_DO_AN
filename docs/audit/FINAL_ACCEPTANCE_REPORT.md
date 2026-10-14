# Báo cáo nghiệm thu cuối — Hoàn thiện khoảng trống kiểm thử

> Bản này ghi nhận đợt nghiệm thu trước. F-07…F-10 và các phạm vi "chưa bao phủ" nêu bên dưới đã được xử lý/đo trong [FINAL_HARDENING_REPORT.md](FINAL_HARDENING_REPORT.md), là báo cáo hiện hành.

**Ngày:** 2026-10-14 · **CSDL ghi test:** `CinemaBookingDB_Test` (SQL Server localhost:1433, login `CinemaTestUser`)  
**Kiến trúc giữ nguyên:** React → REST API → Express → Stored Procedure → SQL Server. Không đổi nghiệp vụ, ERD, RBAC, thiết kế UI.

## 1. Kết quả tổng hợp (một lần chạy `npm.cmd run audit:all`)

| # | Bộ kiểm thử | PASS | FAIL | Ghi chú |
|---|---|:---:|:---:|---|
| 1 | Backend unit/contract (`node --test`) | **210** | 0 | 205 cũ + 5 regression test mới (201 Created) |
| 2 | Frontend unit/component | **235** | 0 | 234 cũ + 1 test tương thích HTTP 201 |
| 3 | Frontend production build | **PASS** | 0 | 228 modules |
| 4 | Database integrity (chỉ đọc) | **18** | 0 | gồm `DBCC CHECKCONSTRAINTS` |
| 5 | API integration HTTP→SP→SQL | **70** | 0 | 52 nghiệp vụ + 18 toàn vẹn sau luồng |
| 6 | Browser E2E tương tác (Edge) | **37** | 0 | 19 kịch bản DOM + 18 toàn vẹn sau luồng |
| | **Tổng** | **571** | **0** | (18 kiểm tra toàn vẹn được tính ở cả 3 bộ 4, 5, 6) |

Tái lập: API chạy 3 lần liên tiếp và Browser chạy nhiều lần liên tiếp đều 70/70 và 37/37 (dữ liệu sinh theo run-id, không phụ thuộc trạng thái run trước).

## 2. Các hạng mục yêu cầu

### 2.1 Interactive Browser E2E (Playwright)
`scripts/audit/browser-e2e.mjs` (+ `browser-scenarios*.mjs`). Microsoft Edge thật, Vite dev server thật, Express thật, CSDL test. Chỉ ghi PASS khi mọi bước là sự kiện DOM (`fill`/`click`/`selectOption`) **và** dữ liệu đọc lại từ SQL khớp. Luồng yêu cầu:

| Luồng | Kịch bản | Bằng chứng kiểm chứng trong SQL |
|---|---|---|
| Đặt ghế → đồ ăn → khuyến mãi → thanh toán | E2E-CUST-BOOK | Đơn `Chờ thanh toán`→`Đã thanh toán`; 2 vé đúng ghế/giá snapshot; 1 dòng đồ ăn đúng đơn giá; `TienGiamGia` = min(10% × tổng, 50.000) (chạy cuối: giảm 28.500, tổng 256.500); 1 `THANHTOAN` = MOMO/`Thành công`; `KHUYENMAI.SoLuongDaDung` +1 (19→20) |
| Đánh giá phim | E2E-CUST-REVIEW | Khi chưa xem: UI hiển thị thông báo BR05, 0 dòng `DANHGIAPHIM`; sau đơn đã xem: 1 dòng (4 sao, nội dung đúng); gửi lần 2 bị từ chối, vẫn 1 dòng |
| Gửi khiếu nại | E2E-CUST-COMPLAINT | `KHIEUNAI` trạng thái `Mới`, đúng người gửi, đúng `DonDatVeID`, đúng loại |
| Xử lý khiếu nại | E2E-CSKH-PROCESS, E2E-CUST-COMPLAINT-RESULT | 2 dòng `XULY_KHIEUNAI` append-only do đúng CSKH ghi; trạng thái cuối `Đã giải quyết`; khách thấy kết quả trên UI |
| CRUD Manager | E2E-MGR-ROOM/SEAT/SHOWTIME/PRICING/BOOKING/SCOPE | Phòng, ghế, suất chiếu (đổi múi giờ UTC+7 chính xác), bảng giá, đơn nhân viên (đổi ghế giữ vé cũ `Đã hủy`, hủy đơn giữ lịch sử); phạm vi rạp |
| CRUD Admin | E2E-ADM-USER/CATALOG/COMMERCE/FACILITY/ASSIGN/BOOKING-VIEW | Tài khoản (khóa → đăng nhập UI bị từ chối → mở khóa), thể loại/diễn viên/phim+cast, sản phẩm, khuyến mãi (đã dùng → bị từ chối, vẫn còn dòng), rạp/phòng/suất chiếu (chồng giờ bị chặn, 0 dòng mới)/bảng giá, phân công Manager (hiệu lực rồi hết hạn) |
| RBAC | E2E-RBAC-ROUTES | Ẩn danh → `/login`; 4 vai trò truy cập portal lạ → `/forbidden` |

Ảnh chụp từng kịch bản: `.audit-output/acceptance/screenshots/E2E-*.png`.

### 2.2 Runner nằm trong repository, chạy lại độc lập

| Runner | Lệnh | Tệp |
|---|---|---|
| Database Integrity Checker | `npm.cmd run audit:db` | `scripts/audit/db-integrity.mjs` |
| API Integration Runner | `npm.cmd run audit:api` | `scripts/audit/api-integration.mjs` |
| Browser E2E Runner | `npm.cmd run audit:e2e` (`-- --headed`, `-- --only=ID,ID`) | `scripts/audit/browser-e2e.mjs`, `browser-scenarios*.mjs`, `browser-helpers.mjs` |
| Tất cả | `npm.cmd run audit:all` | `scripts/audit/run-all.mjs` |
| Thư viện dùng chung | — | `scripts/audit/lib.mjs` |

Mỗi runner tự khởi động Backend/Frontend, không cần dịch vụ chạy sẵn.

### 2.3 HTTP `201 Created` cho API tạo mới của Admin (F-05)
- Sửa `backend/src/controllers/adminController.js`: `createUser`, `createAssignment`, `createCinema`, `createRoom`, `createSeat`, `createPricing`, `createShowtime`, `createGenre`, `createActor` → 201 (đã 201 sẵn: `createCinemaImage`, `createMovie`, `createProduct`, `createPromotion`).
- Sửa `backend/src/routes/adminRoutes.js`: `POST /api/admin/complaints/:id/processings` → 201 (khớp với `POST /api/support/.../processings` vốn đã 201).
- Tương thích Frontend: `frontend/src/api/httpClient.js` chỉ phân nhánh theo `response.ok`; body không đổi. Xác minh bằng `frontend/tests/adminCreated201.test.js` (adminApi qua Vite SSR + controller thật nhận 201 như thành công) và bằng toàn bộ Browser E2E (tạo user/thể loại/diễn viên/phim/sản phẩm/khuyến mãi/rạp/phòng/phân công qua UI đều thành công).
- Regression: `backend/tests/adminCreatedStatus.test.js` — 13 endpoint tạo mới trả 201 + body giữ nguyên, body sai vẫn 400, `PUT`/`DELETE` giữ 200, và một guard duyệt router để **bất kỳ `POST` tạo mới nào của Admin thêm sau này mà thiếu trong bảng sẽ làm test thất bại**. Đã chạy đối chứng với controller cũ: test thất bại đúng chỗ (`createUser must answer 201`).

### 2.4 Đồng bộ tài liệu
Xem [FULL_SYSTEM_AUDIT.md](FULL_SYSTEM_AUDIT.md) (viết lại, endpoint theo route thật) và §8 của tài liệu đó. `README.md`, `database/README.md`, `backend/TESTING.md` không còn liên kết đến tệp không tồn tại.

## 3. Ràng buộc bắt buộc — cách bảo đảm

| Ràng buộc | Cách thực hiện / bằng chứng |
|---|---|
| Backend chỉ gọi Stored Procedure | Không sửa `services/`, `db/`; runner chỉ đi qua API và dùng SQL **đọc** để xác minh (ngoại lệ có chủ đích: fixture BR05, xem §6); backend test hợp đồng (`procedures.js` whitelist) vẫn 210/210 |
| Không đổi nghiệp vụ/ERD/RBAC/UI | Chỉ đổi mã HTTP status của 10 handler; không đổi SQL, schema, validator, frontend/src |
| Ghi test chỉ trên `CinemaBookingDB_Test`; dừng nếu `DB_NAME()` sai | `lib.mjs`: `loadTestEnv()` từ chối nếu `DB_DATABASE` ≠ `CinemaBookingDB_Test` hoặc login `sa`; `assertTestDatabase()` chạy `SELECT DB_NAME()` trước **mỗi** kịch bản/ca và ném `SafetyGateError`. Backend/Vite con nhận môi trường cố định (không đọc `backend/.env`). Login test có `HAS_DBACCESS('CinemaBookingDB') = 0`, nên CSDL chính không thể bị chạm |
| Không PASS giả | Không nới assertion: các lần FAIL trong quá trình dựng đều được xử lý nguyên nhân (§4). Có đối chứng âm ở §2.3 |
| Browser PASS chỉ khi thao tác DOM thật + SQL khớp | Kịch bản không gọi API ghi; chỉ đọc SQL để xác minh |

## 4. Lỗi/khác biệt đã xử lý

**Sửa sản phẩm:** F-05 (201 Created, 10 handler) — xem §2.3.

**Sửa tài liệu/hạ tầng kiểm thử:**
1. `FINAL_AUDIT_VALIDATION.md` và `scratch/*.mjs` được báo cáo cũ viện dẫn không tồn tại trong repo → dựng lại thành `scripts/audit/`; con số cũ ("51 phim", 12 kịch bản Browser, 52 API) không tái lập được nên được thay bằng số thực chạy.
2. Endpoint ghi sai trong báo cáo cũ (`/api/cskh/*`, `/api/payments/*`, `/api/promotions/apply`, `/api/manager/rooms`) → sửa theo `backend/src/routes`.
3. README/database/TESTING trỏ tới 10+ tệp không còn tồn tại → sửa.
4. README ghi Manager 9 / Admin 13 (mâu thuẫn dòng sau) → 10 / 14.

**Kỳ vọng kiểm thử bị sai (tôi tự sửa assertion theo hợp đồng thực, có đối chiếu SP — không phải che lỗi):**
- `API-MGR-06`: hủy lại suất đã hủy trả 200 idempotent (`sp_Showtime_CancelCascade`: `SoDonDaHuy = 0`), không phải 409. Ca nay kiểm tra *không đổi dữ liệu* (không phát sinh bồi thường).
- `E2E-ADM-CATALOG`: phim tạo với ngày khởi chiếu = hôm nay có trạng thái `Đang chiếu` (SP tự suy ra), không phải `Sắp chiếu`.
- Dữ liệu trùng giữa các lần chạy (SĐT duy nhất, chồng giờ fixture, chồng khoảng bảng giá, giới hạn đơn chờ thanh toán của một khách) → runner sinh dữ liệu duy nhất/đặt sau mọi khoảng đã có.

## 5. Phát hiện còn mở (không sửa vì ngoài phạm vi "không đổi nghiệp vụ/UI")

| Mã | Nội dung | Mức |
|---|---|---|
| F-07 | `POST/PUT /api/admin/showtimes`, `PUT /api/admin/movies/:id` trả nguyên envelope của driver `mssql` thay vì DTO | Low |
| F-08 | Nhánh map lỗi `50117` không bao giờ được kích hoạt (hủy suất idempotent) | Info |
| F-09 | Thông báo lỗi tiếng Anh của API hiển thị trực tiếp trên UI Admin | Info |
| F-10 | `npm run format:check` báo 127 tệp frontend/test chưa đúng Prettier — có sẵn từ trước, không thuộc thay đổi này (các tệp tôi sửa/thêm đều đạt) | Info |

## 6. Phạm vi chưa bao phủ (nêu rõ để không hiểu nhầm)

- **Fixture "đã xem phim":** ứng dụng không thể tạo suất chiếu trong quá khứ, nên điều kiện BR05 được dựng bằng SQL trên CSDL test (suất đã qua + đơn đã thanh toán + thanh toán thành công). Việc gửi đánh giá và các kiểm tra của trigger vẫn đi qua UI→API→SP.
- **Trình duyệt/thiết bị:** chỉ Microsoft Edge 155 desktop 1366×900. Chưa kiểm thử Chrome/Firefox/Safari, mobile viewport, khả năng truy cập (a11y), visual regression.
- **Đồng thời (race):** các kịch bản chạy tuần tự. Test đồng thời nằm ở `database/11_tests/concurrency/*.mjs` — **không được chạy trong đợt này**.
- **Hết hạn giữ chỗ:** job `expirePendingOrders` (60 giây) và luồng `Hết hạn` không được kiểm thử có chủ đích trong Browser.
- **Hủy suất có đơn đã thanh toán / bồi thường:** chỉ hủy suất rỗng (API/UI); cascade có đơn (`BOITHUONG_HUYSUAT`) chưa có ca tương tác; phụ thuộc test SQL sẵn có.
- **Quản trị ảnh rạp trên UI**, xử lý khiếu nại bằng giao diện Admin, hiển thị số liệu doanh thu/dashboard đối chiếu với SQL: mới có ở mức API (ảnh rạp, khiếu nại Admin) hoặc chỉ tải trang (doanh thu).
- **Thanh toán:** cổng thanh toán là mô phỏng của hệ thống (đúng thiết kế), không có tích hợp thật.
- **CSDL chính `CinemaBookingDB`:** không kết nối được bằng login test nên không được đối chiếu; chưa kiểm thử migration/reset/seed.
- **Rate limit đăng nhập:** runner nâng ngưỡng bằng biến môi trường `AUTH_RATE_LIMIT_*` cho tiến trình test; hành vi giới hạn đã có test đơn vị nhưng không được kiểm tra trong Browser.

## 7. Môi trường & lưu ý vận hành

- Cần SQL Server chạy và `backend/.env.test` (đã có). Trong phiên làm việc này dịch vụ `MSSQLSERVER` đã dừng bất ngờ một lần (không do runner; tài khoản hiện tại không có quyền khởi động dịch vụ) rồi chạy lại; runner báo lỗi kết nối rõ ràng nếu SQL Server tắt.
- Dữ liệu test được tích lũy (người dùng/rạp/phòng `E2E …`); đây là CSDL test. Không có cơ chế dọn dẹp tự động vì xóa dữ liệu lịch sử sẽ làm sai lệch chính các bất biến đang kiểm tra.
- Mật khẩu demo của CSDL test là `123456` (đặt `AUDIT_DEMO_PASSWORD` để đổi).
- Tệp thay đổi: `backend/src/controllers/adminController.js`, `backend/src/routes/adminRoutes.js`, `backend/tests/adminCreatedStatus.test.js` (mới), `frontend/tests/adminCreated201.test.js` (mới), `scripts/audit/*` (mới), `package.json` (+5 script), `README.md`, `database/README.md`, `backend/TESTING.md`, `docs/audit/*`.

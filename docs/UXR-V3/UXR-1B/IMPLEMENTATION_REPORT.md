# UXR-V3 — UXR-1B: Public Database Diagnostics Removal

**Kết quả cập nhật ngày 11/10/2026: PASS cho UXR-1B và blocker public health metadata.** Frontend đã PASS ở lượt trước; Backend được sửa theo yêu cầu Security Blocker Resolution. Hai health endpoint giữ hoạt động công khai với payload tối thiểu; lỗi server không trả metadata nội bộ. Không sửa Database/Stored Procedure, RBAC, API nghiệp vụ hoặc triển khai UXR-1C/1D. Hạn chế external assets D-11 vẫn được ghi riêng, không được coi là đã khắc phục.

## Thay đổi Frontend

- `frontend/src/routes/index.jsx`: trang chủ chỉ render `Home`; bỏ import và render `DatabaseHealth`.
- `frontend/src/components/DatabaseHealth.jsx`: xóa component chẩn đoán không còn được dùng.
- `frontend/src/styles/base.css`, `frontend/src/styles/legacy.css`: xóa style riêng của thẻ chẩn đoán.
- `frontend/src/pages/BookingPreparation.jsx`, `frontend/src/pages/PaymentPage.jsx`: thay câu chữ nói về Database/máy chủ bằng thông báo hướng đến khách hàng; giữ nguyên luồng và dữ liệu đặt vé/thanh toán.
- `frontend/tests/catalogPages.test.js`, `frontend/tests/r44-browser-fixture.jsx`: thêm/điều chỉnh kiểm tra để copy đặt vé/thanh toán không nhắc hạ tầng nội bộ.
- Lượt Frontend ban đầu không thay Backend, Stored Procedure, Database hay logic đặt vé. Lượt xử lý blocker bên dưới chỉ sửa public health response, vệ sinh error response và log. Public home không còn tự gọi endpoint chẩn đoán.

## Browser và network evidence — lượt Frontend trước xử lý blocker

Đã chạy Edge thật với Vite, Express và DB test cô lập. Đăng nhập Customer và Staff (tài khoản Admin) thành công; không lưu thông tin đăng nhập hay token vào báo cáo.

| Hạng mục | Kết quả |
|---|---|
| Public routes: `/`, `/movies`, `/cinemas`, `/login`, `/register`, `/forbidden`, not-found | **PASS** — sau thay đổi không còn panel hoặc nội dung khớp mẫu SQL Server, Database, tên DB, thông tin kết nối hay trạng thái hạ tầng. |
| Anonymous, Customer, Staff mở trang chủ | **PASS** — DOM không có panel hoặc thông tin hạ tầng; trang chủ không gọi `/api/health/db`. |
| Customer mở booking screen | **PASS** — trang suất chiếu thật tải được 40 control ghế; API đọc trả 200; không gửi request tạo đơn và không có Runtime exception. |
| Responsive | **PASS** — không có tràn nội dung tại 390/768/1280/1440/1920 px; sau thay đổi `body.scrollWidth` bằng layout width ở cả năm kích thước. |
| API health vận hành | **PASS** — `/api/health` trả 200 với trường `status`. |
| Public diagnostic API | **BLOCKED ở baseline; đã xử lý ở lượt Backend bên dưới** — request anonymous trước sửa trả 200 JSON có các khóa `database`, `ok`, `procedure`. Giá trị cụ thể đã được che và không ghi vào báo cáo. |
| Runtime/API | **PASS trong tác vụ đã chạy** — không có Runtime exception; các API response quan sát được trả 200. Phân tích payload nhạy cảm tập trung vào hai health endpoints, không kết luận mọi response API đều sạch. |
| Console/assets | **BLOCKED bởi môi trường browser** — console ghi nhận lỗi tải resource `ERR_NETWORK_ACCESS_DENIED`, phù hợp blocker external assets D-11 của UXR-0. Không thấy lỗi JavaScript. |

Finding trước sửa: controller/service đưa định danh Database và Stored Procedure vào anonymous response; error handler có thể trả nguyên `err.message` ở HTTP 503. Lượt Frontend chỉ chứng minh rò rỉ ở trạng thái DB hoạt động; lỗi DB chưa được mô phỏng tại thời điểm đó. Yêu cầu Security Blocker Resolution sau đó đã cho phép sửa Backend và kiểm thử lỗi an toàn, kết quả ở phần tiếp theo.

## Responsive trước/sau

Edge được đặt ở các viewport nêu dưới đây. PNG full-page không chứa thanh cuộn đứng của browser nên chiều rộng ảnh nhỏ hơn viewport 15 px; ảnh baseline đã che giá trị DB.

| Viewport | Trước | Sau |
|---:|---|---|
| 390 px | [Ảnh trước](screenshots/before/public-home-390.png) | [Ảnh sau](screenshots/after/public-home-390.png) |
| 768 px | [Ảnh trước](screenshots/before/public-home-768.png) | [Ảnh sau](screenshots/after/public-home-768.png) |
| 1280 px | [Ảnh trước](screenshots/before/public-home-1280.png) | [Ảnh sau](screenshots/after/public-home-1280.png) |
| 1440 px | [Ảnh trước](screenshots/before/public-home-1440.png) | [Ảnh sau](screenshots/after/public-home-1440.png) |
| 1920 px | [Ảnh trước](screenshots/before/public-home-1920.png) | [Ảnh sau](screenshots/after/public-home-1920.png) |

Ở 390 px, baseline UXR-0 ghi `bodyWidth=401`; lượt đo trước thay đổi trong slice này không tái hiện chính xác con số đó, nhưng thấy `body.scrollWidth=381` so với layout width 375. Sau khi bỏ thẻ, `body.scrollWidth=375`, bằng layout width; không còn nội dung bị tràn ra ngoài vùng hiển thị.

## Kiểm thử lượt Frontend ban đầu

| Lệnh/hạng mục | Kết quả |
|---|---|
| `npm.cmd --prefix frontend test` | **PASS — 75/75** |
| `npm.cmd --prefix frontend run lint` | **PASS** |
| `npm.cmd --prefix frontend run build` | **PASS** — bundle chính 581.42 kB, Vite giữ cảnh báo chunk lớn hơn 500 kB. |
| Browser Edge: DOM, public route, role, viewport, health network | **PASS cho Frontend**; API disclosure bị BLOCKED tại thời điểm trước sửa Backend. |

## Security Blocker Resolution — audit và thay đổi Backend

### Audit consumer và quyết định

- `backend/src/routes/index.js`, `routes/healthRoutes.js`: hai GET health endpoint công khai, không phụ thuộc quyền nghiệp vụ. Giữ nguyên path và không thêm endpoint diagnostic chi tiết.
- `controllers/healthController.js`, `services/healthService.js`: DB check vẫn gọi procedure đã có qua procedure client; không dùng SQL trực tiếp. Service trả boolean và controller chỉ chiếu `{ok}` ra public response, kể cả khi service trả thêm trường nội bộ.
- `middleware/errorHandler.js`: trước sửa, HTTP 503 có thể lộ thông báo driver và HTTP 500 có thể lộ driver code. Sau sửa, connection error trả `SERVICE_UNAVAILABLE` với thông báo chung; lỗi server không nhận diện trả `INTERNAL_ERROR`. Giữ mã application đã có `AUTH_NOT_CONFIGURED`, `AUTH_RESPONSE_INVALID`, `ORDER_RESPONSE_INVALID`; giữ các mã/thông báo 4xx từ `HttpError` và SQL domain mapping đã chuẩn hóa. Lỗi 4xx chưa chuẩn hóa nhận thông báo chung.
- `utils/logger.js`: chi tiết lỗi ở server logs gồm loại lỗi, mã, số lỗi và stack; che password/JWT secret cấu hình, credential trong connection-string fragments, Bearer token, URI credentials và các trường nhạy cảm. Error handler bỏ query string khỏi log path; không ghi request body hay Authorization header. Logs nội bộ cần giới hạn quyền truy cập khi vận hành; quyền truy cập hệ thống log bên ngoài chưa được audit.
- `frontend/src/api/healthApi.js`: giữ client hiện có; không còn consumer UI sau lượt Frontend. Không sửa source Frontend trong lượt giải quyết blocker.
- `scripts/db/backend-smoke.mjs`: consumer cũ kiểm tra tên DB; đổi assertion thành payload chính xác `{ok:true}`. `scripts/db/contract-check.mjs` chỉ gọi health service để capture procedure, không phụ thuộc metadata trả về. Không tìm thấy consumer deploy/monitoring khác trong source đã rà; monitoring ngoài repository chưa được kiểm tra.

**Quyết định:** giữ anonymous liveness/readiness, không yêu cầu authentication vì response chỉ còn trạng thái cần cho monitoring. Không áp dụng endpoint chi tiết, không thay RBAC. Authorized/unauthorized enforcement riêng cho health **N/A**; test anonymous và request mang Bearer không hợp lệ đều xác nhận endpoint vẫn public.

### File sửa trong lượt xử lý blocker

| File | Thay đổi |
|---|---|
| `backend/src/services/healthService.js` | Bỏ metadata khỏi DTO, giữ procedure và điều kiện healthy hiện có. |
| `backend/src/controllers/healthController.js` | Public projection `{ok:boolean}`; injectable handler cho mô phỏng lỗi an toàn. |
| `backend/src/routes/healthRoutes.js` | Router factory dùng cùng handler production và test; path không đổi. |
| `backend/src/middleware/errorHandler.js` | Sanitize lỗi server/driver, giữ mã nghiệp vụ an toàn, không log query string. |
| `backend/src/utils/logger.js` | Redact credentials/secrets, giữ diagnostic nội bộ. |
| `backend/tests/healthSecurity.test.js` | 7 test service, HTTP, monitoring, failure, error contract và log redaction. |
| `scripts/db/backend-smoke.mjs` | Bỏ phụ thuộc tên DB trong health assertion. |
| Báo cáo này, `evidence/security-verification.json`, `screenshots/security-regression/` | Evidence mới, không chứa credential/token hoặc DB identifier thật. |

### Evidence API trước/sau

Trước sửa lấy từ browser baseline đã có; chỉ lưu khóa response, không lưu giá trị metadata. Các lỗi trước sửa là finding qua source, **không phải outage đã kiểm thử**. Sau sửa là HTTP thực tế qua Express: healthy gọi DB test cô lập thật; failure inject lỗi tại executor của health service, đi qua router/controller/error handler thật. Không ngắt kết nối DB, thay config DB thật hoặc sửa dữ liệu.

| Anonymous request | Trước | Sau | Kết quả |
|---|---|---|---|
| `/api/health`, DB hoạt động | 200, `{status:"ok"}` | 200, `{status:"ok"}` | **PASS** |
| `/api/health/db`, DB hoạt động | 200, các khóa `database`, `ok`, `procedure` | 200, chỉ `{ok:true}` | **PASS**, metadata đã bỏ khỏi API. |
| `/api/health`, DB lỗi mô phỏng | Chưa chạy | 200, `{status:"ok"}` | **PASS**, liveness không gọi DB. |
| `/api/health/db`, connection error mô phỏng | Source có thể trả raw message | 503, `{error:{code:"SERVICE_UNAVAILABLE",message:"Service temporarily unavailable."}}` | **PASS**, không trả SQL message, DB/SP, connection string, stack hoặc credential. |
| `/api/health/db`, unhealthy/missing/nonboolean result | Chưa chạy | 503, `{ok:false}` | **PASS**, fail closed. |
| `/api/health/db`, SQL error không nhận diện mô phỏng | Source có thể trả driver code | 500, `{error:{code:"INTERNAL_ERROR",message:"Internal server error"}}` | **PASS**, không lộ driver metadata. |

Connection failures đã kiểm thử: socket, connection refused, timeout, unopened connection, login, instance lookup và missing connection. Synthetic metadata được đưa vào lỗi/service DTO để kiểm tra response không phản chiếu chúng; log test kiểm tra secret được che nhưng diagnostic còn ở server.

Evidence trạng thái/payload và 45 lượt browser: [security-verification.json](evidence/security-verification.json).

### Browser regression sau xử lý blocker

- Edge thật + Vite + Express + DB test đã xác minh cô lập; **45 lượt**: 9 public routes × 390/768/1280/1440/1920 px. Routes gồm home, movies, movie detail, cinemas, cinema detail, login, register, forbidden và not-found. Chỉ đọc catalog, không tạo booking hay payment.
- **PASS:** không còn diagnostic trong DOM, không có trang kẹt loading, home không tự gọi `/api/health/db`, hai health endpoint gọi anonymous từ browser trả payload mới. Browser cũng mở endpoint lỗi mô phỏng và liveness để kiểm tra JSON; HTTP status được kiểm tra bằng fetch trong harness và HTTP tests.
- **PASS:** không có Runtime exception hay failed Fetch không bị cancel; các public API response quan sát được trả 200. Không kết luận đã kiểm tra mọi API nghiệp vụ.
- **PASS:** home không tràn ở cả năm viewport; 390 px có layout/body width 375 px do scrollbar. Ảnh được xem để kiểm tra kết quả thực tế.
- **BLOCKED riêng external assets D-11:** browser ghi 94 thông báo tải ảnh ngoài bị `ERR_NETWORK_ACCESS_DENIED`; không phải lỗi health/API và chưa được khắc phục trong task này.

| Viewport | Screenshot regression mới |
|---:|---|
| 390 px | [Home](screenshots/security-regression/public-home-390.png) |
| 768 px | [Home](screenshots/security-regression/public-home-768.png) |
| 1280 px | [Home](screenshots/security-regression/public-home-1280.png) |
| 1440 px | [Home](screenshots/security-regression/public-home-1440.png) |
| 1920 px | [Home](screenshots/security-regression/public-home-1920.png) |

### Kết quả kiểm thử cập nhật

| Lệnh/hạng mục | Kết quả |
|---|---|
| `npm.cmd --prefix backend test` | **PASS — 205/205**, gồm 7 test bảo mật mới. |
| `node --test backend/tests/healthSecurity.test.js` | **PASS — 7/7**. |
| `npm.cmd --prefix frontend test` | **PASS — 75/75**. |
| `npm.cmd --prefix frontend run lint` | **PASS**. |
| `npm.cmd --prefix frontend run build` | **PASS**; cảnh báo bundle 581.42 kB > 500 kB vẫn còn. |
| Anonymous health với DB test thật và failure injection | **PASS**; không gây outage DB thật. |
| Monitoring liveness/readiness tại local | **PASS**; path, HTTP status và `ok` được bảo toàn. Full business smoke script không chạy trong lượt này. |
| Public route browser regression | **PASS — 45 lượt**; hạn chế ảnh ngoài ghi riêng. |
| Scan credential/DB identifier thật/SP identifier và liên kết evidence trong báo cáo | **PASS**; ảnh và JSON evidence đều có đường dẫn hợp lệ. |
| Production/staging/deploy monitor bên ngoài repo | **Chưa kiểm thử**, không gán PASS. |

### Regression risk và giới hạn

- Consumer ngoài repo đọc `database`/`procedure` phải bỏ phụ thuộc metadata; không cung cấp lại thông tin này qua public API. Probe dùng HTTP status và `ok` vẫn tương thích. Chưa triển khai hay kiểm tra monitoring production.
- Unknown server/driver errors giờ dùng mã/thông báo chung; các mã application 5xx đã biết và SQL domain 4xx được giữ, test hiện hành không có regression. Chi tiết chẩn đoán nằm trong server logs; quy tắc redaction đã kiểm thử với synthetic secrets, không phải audit toàn bộ logging/observability bên ngoài ứng dụng.
- Failure injection xác minh pipeline lỗi HTTP thực tế; không chứng minh mọi hình thức outage hay hạ tầng production. Database schema/SP và cấu hình vận hành thật không thay đổi.
- External images D-11 và bundle warning vẫn tồn tại; không mở rộng sang media fallback, refactor hay slice tiếp theo.

## Exit gate

- **Frontend removal:** PASS.
- **390 px overflow:** PASS; layout width 375 px sau khi tính thanh cuộn, body không vượt layout.
- **Public health metadata và lỗi server:** **PASS** trong các trạng thái/request đã kiểm thử; hai endpoint không trả định danh DB/SP, raw SQL error, connection string, credentials hay stack.
- **Monitoring tại môi trường kiểm thử:** **PASS** — liveness và readiness giữ path/status; không thêm authentication.
- **UXR-1B tổng thể:** **PASS**, security blocker đã được giải quyết trong phạm vi được duyệt. Hạn chế môi trường external assets vẫn được ghi nhận riêng. Dừng để nghiệm thu; chưa bắt đầu UXR-1C/1D.

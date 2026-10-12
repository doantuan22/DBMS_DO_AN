# CINEMASTAR PUBLIC REDESIGN — IMPLEMENTATION REPORT

Ngày 12/10/2026. Phạm vi master prompt ở thư mục gốc. **Đã triển khai và kiểm chứng source Public/Customer trong phạm vi hiện có. Nghiệm thu visual toàn bộ còn PARTIAL vì dữ liệu poster/ảnh rạp sai và thiếu ảnh tham chiếu gốc; không gọi toàn bộ yêu cầu DONE.**

## 1. Changed scope

Các route: `/`, `/movies`, `/movies/:movieId`, `/cinemas`, `/cinemas/:cinemaId`, `/login`, `/register`, `/account`, `/profile` của Customer, `/booking/:showtimeId`, `/orders`, `/orders/:orderId`, `/orders/:orderId/payment`, `/complaints`, `/complaints/:complaintId`; review nằm trong movie detail. Forbidden/404 nhận appearance theo PublicShell.

- S0: inventory route/API/media/guards và baseline nằm ở [PUBLIC_REDESIGN_AUDIT.md](PUBLIC_REDESIGN_AUDIT.md).
- S1: PublicShell có boundary `.cinema-public`, dark color-scheme, font Inter tự host, SVG wordmark, menu mobile/focus/resize, header overlay/scrolled và footer điều hướng. Profile nhân sự không nhận boundary dark. StaffShell không sửa.
- S2: billboard phim thật, tên/metadata/synopsis từ API; HomeSchedule dùng các ngày có suất thật, thứ theo locale Việt, giá cơ bản ghi đúng; FilmRail có scroll-snap và controls chỉ khi thật sự overflow; rạp và genre từ API. Đã xem browser và sửa khoảng cách menu, scale Hero, fallback, màu kế thừa và mật độ dataset nhỏ trước chuyển discovery. Artwork gate PARTIAL được ghi thành blocker, các phần độc lập tiếp tục theo §16.
- S3: poster/catalog/cinema composition; URL phim lưu search/genre/status, key remount khôi phục draft qua reload/back/forward. Movie detail key theo movieId, link lịch chiếu scroll tới section thật. Cinema detail đưa schedule lên trước gallery. Không thêm endpoint.
- S4: auth split dùng ảnh minh họa tĩnh riêng, form dark, required inline, focus lỗi; account dùng user/points thật. Auth/session/payload/redirect và các field Profile hiện hữu giữ nguyên.
- S5: SeatMapPanel riêng Public dùng row/number/status API, không sáng tác lối đi; selection/onToggle/limits/hold/write/conflict vẫn do BookingPreparation + server. SeatMap và ProductPicker dùng bởi staff giữ source/defaults. Mobile bar chỉ hiển thị số ghế hoặc preview do server trả, không cộng tổng authoritative. Thành công ghi **“Đã tạo đơn, chờ thanh toán”**. Order/payment dùng receipt/ticket/history và amounts hiện hữu.
- S6: reviews/complaints/timeline/forms/async surfaces; disclosure review do server kiểm tra. Không thêm eligibility giả hoặc fake replies.
- S7: tests, real production browser, screenshots, axe, scope checks, fixture cleanup và staff regression.

Source mới: `frontend/src/features/public/{FeaturedBillboard,FilmRail,HomeSchedule,SeatMapPanel}.jsx`, `mediaPolicy.js`; 7 CSS dưới `frontend/src/styles/public/`. Asset tĩnh chỉ trong `frontend/public/assets/{fonts,cinema}/`, xem [manifest](CINEMASTAR_ASSET_MANIFEST.md). Thêm 3 tests P0 media policy; 2 assertion tên heading ở existing catalog test cập nhật theo UI mới, giữ business assertions.

Snapshot SHA256 **590 file baseline**: chỉ **11 file source hiện hữu Public/Customer** đổi, không có vi phạm allowlist. Backend, SQL/database source, shared contracts, auth context/session/HTTP/token, routes/permission guards, global tokens/reset và staff source khớp working tree trước task. Các thay đổi/xóa docs và sửa auth/staff có sẵn của người dùng được giữ. Evidence [source-scope.json](../../.audit-output/public-redesign/source-scope.json).

CSS parser kiểm tra **376 scoped rules** (xem số thực trong [css-scope.json](../../.audit-output/public-redesign/css-scope.json)); không khai báo lại staff variables. Có đúng 3 `!important` scoped để thắng 3 nhóm color rule legacy đã dùng `!important`; không đổi legacy.css. Public seats dùng class riêng để tránh legacy selected-seat rule.

## 2. Visual implementation

Không có `image(9).png` trong repo/conversation. Không tuyên bố đã xem collage; đánh giá dựa vào 10 DNA points và hình học được mô tả trong §4 của prompt. Browser ngoài cho 9 reference, mỗi site desktop/mobile, đều trả `net::ERR_NETWORK_ACCESS_DENIED`; ghi **NOT_ACCESSIBLE**, không suy diễn đã audit tương tác. Netflix article đọc được bằng web text; AMC redirect loop, CGV timeout trong lượt truy cập text. Evidence [references/results.json](../../.audit-output/public-redesign/references/results.json).

| DNA point §4.1 | Verdict | Bằng chứng / giới hạn |
|---|---|---|
| 1. Hero phim là tiêu điểm | PARTIAL | tên phim thật, hierarchy lớn; scene/key art bị BLOCKED vì poster stock |
| 2. Header dark overlay/scrolled | PASS | scoped sticky header, ảnh home desktop/mobile |
| 3. Text trái, metadata, synopsis, CTA đỏ | PASS | billboard lấy list/detail API, không rating hoặc price giả |
| 4. Artwork phải thuộc đúng phim bên phải | PARTIAL | portrait composition/fallback neutral; chưa có poster hợp lệ |
| 5. Date strip hoạt động | PASS | ngày/thứ thật từ movie-showtimes; click đổi các suất có ID thật |
| 6. Film rails mật độ phù hợp | PARTIAL | scroll controls/metadata/routes hoạt động; hình ảnh dùng fallback |
| 7. Editorial sections theo data | PASS | status thật; không tạo Coming Soon/For Kids giả; rạp/genre thật |
| 8. Genre tiles | PASS | API genre + liên hệ tên genre trong collection đầy đủ; URL filter hoạt động |
| 9. Footer dark hữu ích | PASS | phim/rạp/own orders/complaints/auth; không hotline/địa chỉ giả |
| 10. Depth qua artwork/layout/scale | PARTIAL | layout/type/contrast đã triển khai; artwork thực còn thiếu |

Before/after và các lần polish: [PUBLIC_UI_BEFORE_AFTER.md](PUBLIC_UI_BEFORE_AFTER.md). Final **15 trang × 5 viewport = 75 ảnh** trong `.audit-output/public-redesign/final/`: 390×844, 768×1024, 1280×800, 1440×900, 1920×1080. Không document horizontal overflow; sơ đồ ghế cuộn nội bộ. Đã mở xem ảnh đại diện Home desktop/mobile, rails, auth desktop, booking selected/mobile và movie detail; không nói đã xem thủ công từng ảnh.

## 3. Source of truth

- Phim: `movie.id/title/status/durationMinutes/ageRating/genres/posterUrl`; description/director/language/subtitle từ detail hiện hữu. Không backdrop field, không hardcode movieId→ảnh.
- Rạp: `cinema.id/name/address/city/phone/coverImageUrl`, gallery `image.url/cinemaId/cover/status`. Gallery ownership/abort và scope giữ nguyên. Stock hosts không được trình bày là ảnh một phim/rạp cụ thể.
- Lịch: `showtime.id/movieId/cinemaId/roomName/date/startsAt/format/basePrice`; date rail từ collection suất thật của một phim, không giả aggregate cinema schedule.
- Ghế/sản phẩm: API `seat.id/row/number/label/type/status/price`, product price/quantity limits hiện có; trạng thái chọn là UI state keyed theo showtime/actor.
- Promotion chỉ preview; `booking.total/holdExpiresAt`, `order.ticketTotal/productTotal/discountTotal/total`, payment attempts/result/status lấy server response. Không đưa công thức total authoritative mới vào React. Payment vẫn là mô phỏng.
- Profile/points/own order/complaint/timeline từ endpoint hiện có; không thêm membership, streaming, map, social login, OTP, forgot-password hay provider payment.

Ảnh sai/placeholder trailer: [MOVIE_MEDIA_CORRECTION_REPORT.md](MOVIE_MEDIA_CORRECTION_REPORT.md). 4 phim có stock poster; 3 rạp cùng stock cover. Fallback mang tên bản ghi, giữ tỷ lệ. Trailer Mai/Conan chứa `example...` bị ẩn; các URL hợp lệ còn giữ mô hình API. Không sửa URL DB/seed. License poster/trailer cần chủ sở hữu xác nhận.

## 4. QA

| Check | Kết quả thực | Evidence |
|---|---|---|
| Frontend unit/component | **222/222 PASS**, baseline 219; 0 skip | [tests-final.log](../../.audit-output/public-redesign-tests-final.log) |
| Backend regression | **205/205 PASS**, 0 skip | [backend-tests-final.log](../../.audit-output/public-redesign-backend-tests-final.log) |
| Oxlint | **PASS**, không warning mới | [lint-final.log](../../.audit-output/public-redesign-lint-final.log) |
| Production build | **PASS**, JS ~805 kB; >500 kB warning có từ baseline ~793 kB | [build.log](../../.audit-output/public-redesign-build.log) |
| REST/SP contract | **PASS**, 110 service methods / 118 calls, 0 problems | [contracts.log](../../.audit-output/public-redesign-contracts.log) |
| DBMS-first audit | **PASS**, 69 backend runtime files, không raw business SQL | [no-sql.log](../../.audit-output/public-redesign-no-sql.log) |
| Production Edge E2E + responsive | **97 checks PASS**; 0 runtime exceptions | [qa-production/results.json](../../.audit-output/public-redesign/qa-production/results.json) |
| Final polish | **84 checks PASS + 1 lab measurement**; final runner exit 0; 75 screenshots | [final/results.json](../../.audit-output/public-redesign/final/results.json) |
| Axe 4.10.3 | **0 violations trên 15 trang final**, tags WCAG 2 A/AA, 2.1 AA, 2.2 AA | `axe` trong final/results.json; có incomplete cần manual audit |
| Keyboard | **5 checks PASS**: Space chọn/bỏ ghế, menu Enter/Tab/Shift+Tab/Escape, gold focus auth, reflow 200% emulation | [keyboard.json](../../.audit-output/public-redesign/keyboard.json) |
| Inter glyph audit | **PASS**, đọc cmap từ WOFF2, glyph tiếng Việt trong mẫu đầy đủ, loaded trong browser | [font-audit.json](../../.audit-output/public-redesign/font-audit.json) |
| Staff style gate S1–S6/S7 | **6/6 signatures giống baseline** ở mỗi gate | `.audit-output/public-redesign/s*/staff-regression.json` |
| Staff final screenshots | **6/6 PNG byte-for-byte giống baseline** (Admin/Manager/CSKH × 390/1440) | [staff-pixel-regression.json](../../.audit-output/public-redesign/staff-pixel-regression.json) |
| Scope/CSS isolation | **PASS**, 590 baseline files, không out-of-scope changes; mọi selector mới scoped | source-scope.json, css-scope.json |

Real API/SP/browser đã chạy: Guest Home→movie→showtime→booking; date change; search/status restore; cinema-specific showtimes; đăng ký + UTF-8 validation; login 401 focus và staff redirects cả 3 role; lưu profile; competing customer chiếm cùng ghế→UI 409/refresh/clear; invalid promotion feedback; tạo pending order; double submit tạo đúng một POST booking/registration; payment Escape không ghi attempt, failed attempt→retry thành công giữ history và server total, double confirm đúng một POST attempt; own order/complaint denial; complaint optional order tạo thật; review không đủ điều kiện bị server từ chối.

Final bổ sung: back/forward thật khôi phục filter/data; actual empty search và movie 404; controlled transport 500 phân biệt error/empty; foreign detail không giữ receipt/nội dung; server-expired order thật không có payment action. 500 là test interception, không phải outage thật. Các screenshot final dùng data test được tạo qua REST, không mock production.

Vòng đầu có lỗi tooling serializing DOM qua CDP và assertion foreign ownership chỉ nhận 403 trong khi server dùng 404; đã sửa harness, giữ failed-attempt evidence. Axe/source review phát hiện màu/nền legacy, các lần đó không được ghi thành PASS; đã sửa và quét lại 15 trang final 0 violations. Native Enter trong harness cần gửi cả char `\r`, đã chạy lại keyboard PASS. Có 2 catalog heading assertion lỗi sau đổi copy; đã cập nhật assertion presentation, không xóa business checks.

Mutation QA chỉ trên `CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2`, database ID9/GUID khác Main ID6. Không reset/reseed/migrate hoặc đổi schema/SP. Sau capture đã cleanup chính xác **10 Customer fixture** cùng child rows do task tạo, có preflight target/file guard và exact email allowlist; **remaining=0**, SQL module definitions hash trước/sau giống nhau. Không xóa dữ liệu nghiệp vụ thật hoặc thêm API physical delete. [fixture-cleanup.json](../../.audit-output/public-redesign/fixture-cleanup.json). Các server/browser do tooling mở đã đóng.

Lab performance: production localhost, Edge headless, desktop, cache disabled, không throttle: LCP **104 ms** trong một sample; font tự host loaded. Đây là lab trên máy hiện tại, **không phải p75/field metric**, không chứng minh LCP ≤2.5s cho người dùng thực. Không mở rộng bundling staff chỉ để xóa warning.

## 5. Open issues

1. **BLOCKED — artwork/visual acceptance:** `/` và các catalog/cinema routes cần poster/ảnh cơ sở thực, quyền sử dụng rõ, qua URL model hiện hữu. 4 poster/3 cover hiện có sai; không tự sửa database để đạt screenshot đẹp. Chi tiết per record ở correction report.
2. **NOT PROVIDED — reference image:** chưa có `image(9).png`; chỉ đối chiếu mô tả DNA/hình học. Không nghiệm thu similarity với ảnh gốc chưa xem.
3. **BLOCKED — review preflight eligibility:** GET `/movies/:id/reviews` chỉ trả reviews, không eligibility hoặc owner ID. Không suy từ tên người đánh giá hay trạng thái payment để cấp eligibility. UI giữ flow hiện hữu, giải thích và dùng POST/SP để xác nhận; đã test từ chối. Gate “chỉ mở input khi eligibility đọc được từ server” chưa thể thực hiện đủ bằng contract hiện tại.
4. **NOT VERIFIED:** physical touch, Safari/Firefox, screen reader/manual WCAG đầy đủ, native browser-chrome zoom thay vì emulation, controlled out-of-order/revoke/pending race matrix, provider payment thật và field performance p75. Countdown unit/deadline giữ nguyên; đã test server-expired order UI, không chờ một đơn mới hết toàn bộ deadline trong cùng session.
5. **NOT_ACCESSIBLE:** cả 9 reference site trong browser local bị network denied; không tuyên bố đã xem desktop/mobile interactions. Pexels photo author chưa xác minh trực tiếp từ trang bị chặn; fixed CDN và license general được ghi trong manifest.

Hai trailer còn dùng đã đối chiếu metadata chính thức YouTube oEmbed: `Way9Dexny3w` là **Dune: Part Two — Official Trailer** của Warner Bros.; `uYPbbksJxIg` là **Oppenheimer — New Trailer** của Universal Pictures. [trailer-metadata.json](../../.audit-output/public-redesign/trailer-metadata.json). Đây là xác minh đúng tác phẩm/publisher, không phải license phân phối thêm hoặc kiểm thử playback trong browser bị chặn.

Phần source/tests có thể hoàn thành trong phạm vi đã được thực hiện. Không mở thêm backend/DB/staff work để giải quyết các blocker này.

# Public / Customer redesign — S0 audit

Ngày: 12/10/2026. Phạm vi: master prompt CinemaStar trong thư mục gốc. Baseline là working tree hiện hữu, kể cả các sửa đổi auth, staff và việc xóa docs có trước task; không lấy HEAD thay thế baseline source.

## Baseline

- UC Matrix hiện hành: Customer 14, Manager 10, CSKH 6, Admin 14 = 44 hoạt động; 47 ID truy vết. Không sửa số UC.
- React 19 / Router 7 / Vite 8; JS/JSX, CSS thường. AuthProvider + BrowserRouter + RequireAuth/RequireRole hiện hữu.
- 219/219 frontend tests PASS, oxlint PASS, build PASS trước thay đổi. Chunk 792.84 kB là warning baseline. Logs: `.audit-output/public-redesign-baseline-{tests,lint,build}.log`.
- Baseline browser: Edge thật, Vite + Express + SP trên target riêng `CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2`, đã preflight xác minh GUID/files khác Main. Không chạy reset, seed, migration hoặc thay định nghĩa SQL. 5 viewport 390/768/1280/1440/1920; 35 ảnh public và 6 ảnh staff. Evidence: `.audit-output/public-redesign/before/results.json` và PNG cùng thư mục.
- Snapshot SHA256 frontend/backend/database/shared trước sửa: `.audit-output/public-redesign/source-before.json`. So sánh từ snapshot này để bảo toàn thay đổi của người dùng.
- Không thấy `image(9).png` trong repo/conversation. Chưa xem ảnh gốc; composition đối chiếu 10 DNA points §4.1 và mô tả §4.2.
- Netflix article truy cập được qua web; AMC redirect loop, CGV timeout. Đây là text reference, không phải kiểm chứng tương tác các site. Các trang khác tiếp tục đối chiếu browser, ghi tình trạng truy cập riêng.

## Route inventory

| Route | Page/component | API đang có | Media | States / guards | Shared với staff | Thay đổi | Risk |
|---|---|---|---|---|---|---|---|
| `/` | Home | GET movies, genres, cinemas; movie/:id/showtimes khi chọn phim | posterUrl, coverImageUrl | abort/read ownership, empty/error | MovieCard public-only | billboard, real schedule, rails, genres/rạp | medium |
| `/movies` | Movies, MovieGrid/Card | GET movies(search,genreId,status), genres | posterUrl | applied filters, requestKey, abort | UI primitives | poster grid, query restore | medium |
| `/movies/:movieId` | MovieDetail, ShowtimeBrowser, MovieReviews | movie detail; movie showtimes(cinemaId,date); cinemas; reviews | posterUrl,trailerUrl; không backdrop | keyed detail/showtimes, review generation/write lock | primitives | portrait intro, showtime pills, review surfaces | medium |
| `/cinemas` | Cinemas, CinemaList | GET cinemas(city); search trên collection đầy đủ | coverImageUrl | abort, applied filter | primitives | landscape list, named neutral fallback | low |
| `/cinemas/:cinemaId` | CinemaDetail, CinemaGallery, CinemaSchedule | cinemas; cinema/:id/images; movies; movie/:id/showtimes(cinemaId,date) | image.url,cinemaId | keyed owner/abort/schedule reset | primitives | cinema masthead, scheduling first | medium |
| `/login`,`/register` | Login, Register, AuthFrame | POST auth/login,auth/register | static ambience riêng | write lock, UTF-8 validation, redirect `from`/role | auth & primitives | dark split, validation focus | high |
| `/account`,`/profile` | CustomerArea, Profile | auth/me; PUT auth/profile | không media nghiệp vụ | allowlisted fields, role/email readonly, write ownership | Profile cũng dùng bởi staff | dark customer account; giữ staff profile cũ | high |
| `/booking/:showtimeId` | BookingPreparation, BookingExperience | GET showtime detail/seats/products; POST promotions/validate,bookings | posterUrl nếu có | keyed actor/showtime, generation, preview invalidation, 409 reset, double submit | SeatMap/ProductPicker dùng staff | public composition + scoped seats/summary | high |
| `/orders`,`/orders/:orderId` | Orders,OrderDetail,OrderReceipt | GET own orders,orders/:id | chỉ DTO thật | owner/resource keys, server totals/expiry | primitives | transaction layout/tickets | high |
| `/orders/:orderId/payment` | PaymentPage | POST own order payments; payment result | không cần ảnh | confirm dialog, write lock, deadline, stored amount | Dialog/native shared | scoped dialog/payment clarity | high |
| `/complaints`,`/complaints/:id` | Complaints,ComplaintDetail | own complaints GET/POST/detail; own orders lookup | không cần media | write lock, own refs, optional order | primitives | form/list/timeline | medium |
| `/forbidden`,404 | Forbidden,NotFound | không | không | auth/route guard giữ nguyên | primitives | scoped error presentation | low |

## Shared-risk and protected ownership

StaffShell, staff routes/features, global tokens/reset, auth context/session/client, backend, SQL và shared contracts chỉ đọc. Button/Input/Select/FormField/Dialog/StatusBadge giữ defaults; dark appearance chỉ qua ancestor `.cinema-public`. Native dialog hiện render trong tree nên không cần body theme. SeatMap/ProductPicker giữ toàn bộ logic/defaults staff; public styling chỉ theo ancestor. Không thêm thư viện UI hoặc endpoint.

## Contract / media gaps

Không có backdrop/aggregate cinema showtimes/pricing quote độc lập. Home dùng một phim API thật, movie-specific showtimes để chọn ngày và suất; không dựng giờ giả. Tổng booking/order lấy response; đơn giá không biến thành total authoritative.

Cả 4 poster hiện tại là Unsplash stock; 3 cover rạp là cùng Unsplash auditorium. Không thể trình bày là ảnh phim/rạp thật. Dùng neutral fallback và ghi correction report; không sửa DB/seed. Trailer Mai/Conan chứa `example...`, không render CTA đó. URL phim thật khác vẫn cần review quyền. License/download không suy ra quyền phân phối poster.

# CINEMASTAR — MASTER PROMPT: REBUILD TOÀN BỘ SEED DATA + REAL MEDIA

**Loại:** Prompt thực thi dành cho AI Coding Agent trong repository CinemaStar  
**Ngày yêu cầu:** 12/10/2026  
**Ưu tiên:** Cao — thực hiện trước khi nghiệm thu đợt redesign Public/Customer  
**Mục tiêu:** Thay thế toàn bộ bộ seed lỗi thời bằng **một bộ seed mới đồng bộ, hoàn chỉnh, tái tạo được, có ảnh thật đúng đối tượng và các luồng giao dịch đủ để demo/test**.  
**Phạm vi:** Database seed scripts, data reset của môi trường được phép, media sourcing/verification, fixtures, scripts chạy seed, báo cáo & kiểm thử liên quan.  
**Không phải yêu cầu:** Tạo lại database schema, thêm bảng/cột, sửa nghiệp vụ cốt lõi, viết SQL trong Node.js hoặc redesign portal Admin/Manager/CSKH.

> **LỆNH CỐT LÕI:** Hãy **thực sự truy cập Internet** để tìm, chọn và xác minh hình ảnh liên quan đến từng phim/rạp/sản phẩm. Đừng thay seed cũ bằng những đường dẫn ảnh bịa hoặc ảnh stock không đúng phim. Hãy **ngừng dùng seed cũ, xóa dữ liệu seed cũ trong database demo được xác nhận là có thể hủy, rồi dựng một bộ seed mới hoàn chỉnh**. Trước bất kỳ thao tác xóa dữ liệu nào: preflight → dry-run → backup → kiểm tra môi trường → reset có kiểm soát → reseed → kiểm thử. **Không xóa dữ liệu thật hay production.**

---

# 0. BỐI CẢNH DỰ ÁN VÀ QUYẾT ĐỊNH BẮT BUỘC

1. Kiến trúc: `React → REST API → Node.js/Express → Stored Procedure → SQL Server`. Toàn bộ SQL nghiệp vụ và seed/migration chỉ nằm ở khu vực Database/DBMS; **backend chỉ gọi Stored Procedure**, không thêm `.query()`, raw SELECT/INSERT/UPDATE/DELETE, ORM hay query builder vào source ứng dụng.
2. **Không thêm bảng mới**, không tự đổi ERD, constraints, trigger, API contract, quyền, trạng thái hoặc business rules chỉ để seed dễ hơn. Có thể thêm **file seed, fixture, manifest media, CLI/script chạy seed** trong repository.
3. Quyết định hiện hành về RBAC: 4 role cố định `KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`. Không tạo chức năng Role/Permission CRUD động hoặc thay role user sau khi tạo. Cần kiểm tra schema/UC Matrix *thật trong repo* trước khi seed.
4. Baseline cũ trong tài liệu có mốc 45/46 UC; Blueprint V3 (11/10) ghi nhận **44 UC hoạt động** theo Audit V2. Không tự cố định con số cũ; đọc **Use Case Matrix mới nhất** trong repo rồi xác nhận mapping. Cần dữ liệu hỗ trợ toàn bộ flow đã được triển khai.
5. Giá, ghế, khuyến mãi, trạng thái thanh toán/đơn, permission/scope và khả năng review là **nguồn sự thật tại SQL Server**. Seed phải tuân theo chứ không bypass constraint để tạo dữ liệu trông hợp lệ.
6. Các loại ngày giá hợp lệ: **`Ngày thường`, `Cuối tuần`, `Tất cả`**. **Không dùng `Ngày lễ`.** Không hủy giá snapshot cũ, không sửa ghế có ticket history trái quy định, không tạo suất chiếu trùng phòng/thời gian.
7. Bộ **Public/Customer** đang được thiết kế lại theo `CINEMASTAR_PUBLIC_CUSTOMER_CINEMATIC_REDESIGN_MASTER_PROMPT.md` (dark cinematic). Nguồn ảnh phim/rạp là **URL gắn với bản ghi DB/API**, không hardcode trong JSX. Chỉ **ảnh trang trí tĩnh không gắn business record** mới được lưu như asset frontend trong repo.
8. Không redesign, sửa component, CSS hoặc route của `/admin/**`, `/manager/**`, `/support/**`/CSKH. **Dữ liệu seed** vẫn phải hỗ trợ kiểm thử cả 4 role và các portal hiện tại.
9. Nếu một yêu cầu không được API/schema hỗ trợ, báo `BLOCKED / NEEDS DECISION`, **không bịa schema/endpoint**, không bỏ test, không sửa Stored Procedure một cách âm thầm.

---

# 1. ĐỊNH NGHĨA “XÓA TOÀN BỘ SEED CŨ” — KHÔNG HIỂU SAI

## 1.1. Phải xử lý cả hai lớp

**Lớp A — repository:**
- Truy vết toàn bộ seed/fixtures cũ: SQL, JS/TS/PowerShell/Python/shell, README, CI, package scripts, hardcoded demo media, dữ liệu trùng lặp.
- Thiết kế **một seed pipeline chính thức**; thay thế/di chuyển/xóa **seed scripts legacy thực sự đã bị thay thế**, cập nhật tất cả entry points để không còn vô tình chạy script cũ.
- **KHÔNG xóa** schema/migrations/constraints/SP/views/functions/triggers, test framework hoặc scripts triển khai cần thiết chỉ vì nằm chung thư mục seed.
- Giữ thông tin lịch sử và migration nếu có phụ thuộc, ghi rõ danh sách file xóa/được thay và lý do; không tạo hai “nguồn sự thật” song song.

**Lớp B — dữ liệu đang tồn tại trong DB demo:**
- Mục tiêu là **loại sạch dữ liệu demo/seed cũ và thay bằng dataset mới**, không phải cập nhật thêm vài URL vào dữ liệu cũ gây lẫn lộn.
- Chỉ thực hiện data purge trên **database chuyên dụng đã được xác minh là disposable** (ví dụ `CinemaBookingDB_Test`, `CinemaBookingDB_Demo`, hoặc database dev có xác nhận rõ từ chủ dự án rằng toàn bộ dữ liệu là disposable).
- Nếu database hiện tại là `CinemaBookingDB` local với dữ liệu chưa rõ có phải seed hết không, **KHÔNG tự đoán**. Xuất kiểm kê, backup và yêu cầu xác nhận phạm vi reset trước khi xóa; hoặc dựng database demo/test tách biệt từ schema hiện hữu, seed ở đó.
- Không chạm production/staging có dữ liệu thật, không xóa đơn/vé/giao dịch thật, không khóa tài khoản thật để lấy chỗ cho fixtures. Tuyệt đối không tự động xóa dữ liệu không chứng minh được là seed.

## 1.2. Gate an toàn trước khi xóa

Chỉ được thực thi reset nếu **tất cả** điều kiện sau đã PASS:

1. Đã in ra server/instance/database/schema hiện kết nối, environment tag và `DB_NAME()`; **đối chiếu đúng target**.
2. Database có trong allowlist cấu hình **disposable databases**; không lấy tên DB trực tiếp từ request người dùng web, không wildcard.
3. Có `--dry-run` liệt kê số dòng theo bảng, dependency và dữ liệu sẽ bị ảnh hưởng, không thay đổi DB.
4. Có backup/snapshot chạy thành công hoặc bản dựng lại từ schema đã được kiểm chứng; đối với dev đang có dữ liệu, **bắt buộc backup DB thực tế** trước reset.
5. Có **cờ reset tường minh** (ví dụ `--reset-demo-data --target=... --confirm-target=...`), không bao giờ reset khi chỉ chạy lệnh seed thông thường.
6. Không có user/order/transaction ngoài phạm vi seed theo tiêu chí provenance kiểm chứng được. Nếu không thể phân biệt → **DỪNG** và chuyển sang disposable demo DB mới.
7. Có cách phục hồi, kế hoạch reset/reseed và log trước/sau; không tự `DROP DATABASE`, `TRUNCATE` bừa bảng có FK hoặc `NOCHECK CONSTRAINT ALL` rồi bỏ nguyên trạng.
8. Đã xác nhận không có tiến trình app/test đồng thời đang ghi vào DB mục tiêu. Ngắt app/worker hoặc dùng dedicated test DB khi cần.

**Ưu tiên kỹ thuật:** Với test DB hoàn toàn disposable, dùng pipeline dựng lại **schema → constraints → views/functions/triggers → SP → seed** đã có, thay vì viết purge thủ công dễ phá FK. Nếu buộc phải reset dữ liệu trong DB demo tồn tại, xác định dependency theo FK thực tế, transaction/reset phù hợp, validate row counts và toàn vẹn trước commit. Không disable constraint/trigger để lách lỗi dữ liệu.

---

# 2. PHASE S0 — ĐỌC REPOSITORY VÀ DATABASE THỰC

Trước khi viết gì, đọc:

- `README`, cấu trúc thư mục database (`schema`, `constraints`, `functions`, `views`, `triggers`, `procedures`, `seed`, `migrations`, `tests`), `.env.example`, scripts setup, Git status.
- **Schema/ERD đang áp dụng**: tên bảng, cột, kiểu dữ liệu, nullability, FK, uniqueness, state enum và thứ tự dependency; đừng giả định đúng 25 bảng nếu repo hiện có khác.
- Seed cũ đã nằm ở đâu, được gọi bởi script nào, số lượng từng nhóm dữ liệu, dữ liệu gây lỗi/thiếu ảnh; xác định toàn bộ đoạn hardcode URL sai.
- Stored Procedure gateway có liên quan: Movie/List/Detail, Cinema/List/Detail/Images (nếu có), Showtime/Seat, Product, Pricing, Promotion, Booking, Payment, Order, Review, Complaint, Auth/Manager/Admin.
- API DTO/field media thực tế: poster, backdrop/cover (nếu có), trailer URL (nếu có), gallery rạp/ảnh chính (nếu có), ảnh sản phẩm (nếu có). **Không tự thêm field chỉ vì thiết kế muốn có.**
- SP/trigger cấm trùng lịch, check bookable parent, giữ ghế, chống sửa lịch sử, snapshot giá, coupon quota, review eligibility, status transition, manager scope.
- Các dữ liệu mẫu đang ở DB mục tiêu; có dữ liệu thật/manual/demo không, cách xác định seed provenance; loại môi trường và thông số DB được phép reset.

**Xuất `docs/seed/SEED_BASELINE_AUDIT.md`** có ít nhất:

| Hạng mục | Bảng/SP/API thật | Seed hiện có | Lỗi/thiếu | Seed mục tiêu | Độ nguy hiểm khi reset |
|---|---|---:|---|---:|---|
| Movie/media | Lấy từ repo | Đếm thật | Poster sai/null? | Chốt ở S1 | ... |
| Cinema/images | Lấy từ repo | Đếm thật | Ảnh trùng/sai? | Chốt ở S1 | ... |
| Room/seats/showtime | Lấy từ repo | Đếm thật | Booking test? | Chốt ở S1 | ... |
| Auth/orders/payment/review/complaint | Lấy từ repo | Đếm thật | Trạng thái thiếu? | Chốt ở S1 | ... |

Không tiếp tục nếu chưa đọc được schema thực hoặc không thể bảo đảm mục tiêu reset đúng.

---

# 3. PHASE S1 — KHÓA SEED SPEC TRƯỚC KHI TẠO DỮ LIỆU

Không viết một script random không thể bảo trì. Xây **dataset cố định, có chủ đích, deterministic**, đồng thời các ngày/suất chiếu luôn **dynamic theo giờ DB hiện tại**.

## 3.1. Quy mô mục tiêu phù hợp đồ án, điều chỉnh theo schema/thực tế

| Nhóm | Quy mô mục tiêu (tham khảo, không được tự bịa dữ liệu để đủ số) | Điều kiện chất lượng |
|---|---:|---|
| Phim | **18–24 phim có thật**; ưu tiên 10–14 đang chiếu/được bán, 6–10 sắp chiếu | Đúng tên, năm, duration, mô tả, thể loại, phân loại phù hợp, poster đúng phim, cover khi DB hỗ trợ |
| Thể loại & diễn viên | Đủ thể loại đa dạng; 2–6 diễn viên/phim nếu thông tin xác minh được | Mapping thật, không bịa diễn viên/vai diễn, không duplicate |
| Rạp | **4–6 rạp demo** trong dữ liệu mô phỏng; từ 2 thành phố nếu schema hỗ trợ | Tên/địa chỉ/phone không giả danh cơ sở thật; ảnh có nguồn rõ; ít nhất 1 cover/rạp nếu schema/API hỗ trợ |
| Phòng | 2–3 phòng/rạp | Tên/scope/định dạng/trạng thái nhất quán |
| Ghế | Khoảng 30–60 ghế/phòng (hoặc cấu hình hiện có phù hợp) | Hàng/số không trùng; đủ loại ghế mà schema hỗ trợ; có một số trạng thái vận hành khác nhau nếu hợp lệ |
| Suất tương lai | **60–120 suất** trong 7–14 ngày tới, tùy quy mô phòng | Có ngày/giờ gần, phân bố nhiều phim/rạp, không overlap, bookable khi mở bán |
| Suất quá khứ | **10–20 suất** | Dùng để sinh lịch sử giao dịch/review thật qua nghiệp vụ hợp lệ |
| Sản phẩm | 8–12 sản phẩm/combos nếu schema có | Tên, giá, tình trạng và ảnh đúng sản phẩm (nếu DB có field) |
| Khuyến mãi & giá | Các trường hợp phổ biến | Đủ Ngày thường/Cuối tuần/Tất cả, loại ghế/định dạng thật, hiệu lực và quota hợp lệ |
| Tài khoản/role | 4 role, 1–2 user/role tối thiểu + nhiều customer test | Dữ liệu test, password mạnh theo cách hệ thống đang hash, **không secret thật** |
| Đơn, vé, payment, review, complaint | Tạo bộ data có đủ lifecycle | Có happy path, failure, hold, expired, retry, complaint/order linked, review eligibility; không vi phạm invariant |

**Không chạy theo số lượng bằng cách tạo hàng trăm phim rỗng hoặc poster giả.** Nếu chỉ 12 phim có media hợp lệ và chất lượng thì báo ràng buộc để điều chỉnh, không gắn ảnh sai để đạt 24/24.

## 3.2. Chọn nội dung phim có chủ đích

- Giữ lại những phim demo có thật đang được UI dùng để regression nếu cần (ví dụ các phim đã có trong dataset) **nhưng phải tìm đúng poster và metadata**, không sao chép ảnh bầu trời/ghế/lâu đài/hoa đang gắn sai cho phim.
- Tìm bổ sung phim **thực sự tồn tại**, có trang nguồn và poster/backdrop được xác minh. Ưu tiên phân bố thể loại: hành động, khoa học viễn tưởng, tình cảm, hoạt hình, kinh dị, phiêu lưu, gia đình, tâm lý.
- **Phân biệt “phim có thật” với “đang chiếu thật ngoài đời”:** seed là dữ liệu **mô phỏng lịch chiếu của chuỗi CinemaStar**, không khẳng định CinemaStar/những rạp thật đang có lịch đó. Trạng thái `Đang chiếu` / `Sắp chiếu` là **trạng thái test theo DB**, và ngày phát hành/điều kiện bookability phải nhất quán. Không tự thêm lịch chiếu thật của các chuỗi khác.
- Nếu phim phát hành quá xa hoặc đã hết release window theo rule DB, không cố tạo suất future bằng cách phá constraint. Chọn phim phù hợp, hoặc ghi rõ `DEMO_SCENARIO` với ngày khởi chiếu được điều chỉnh có chủ đích và không trình bày như fact bên ngoài.
- Độ tuổi, thời lượng, diễn viên, mô tả phim, quốc gia/năm khởi chiếu phải được kiểm tra theo **nguồn hợp lệ**; nếu field không có hoặc chưa xác minh, giữ null/không seed chứ không bịa.

---

# 4. PHASE S2 — THỰC SỰ KHẢO SÁT WEB, LẤY ẢNH THẬT, KIỂM CHỨNG LINK

Đây là phần **bắt buộc**, không được giả vờ đã browse web.

## 4.1. Chiến lược theo loại media

| Đối tượng | Loại ảnh | Nguồn và nguyên tắc | Cách lưu |
|---|---|---|---|
| **PHIM** | Poster đúng tác phẩm, artwork/backdrop đúng tác phẩm (nếu field sẵn có) | Tìm bằng tên quốc tế + tên Việt + năm + định danh; ưu tiên nguồn chính thức/nguồn có cơ sở sử dụng, có thể nghiên cứu TMDB theo chính sách API | **URL HTTPS thật trong column media tương ứng tại DB**, qua API hiện hữu |
| **RẠP** | Ảnh đại diện/gallery chính xác nếu là cơ sở thật; ảnh minh họa hợp lệ nếu rạp demo hư cấu | Với rạp demo hư cấu: chọn **ảnh nội thất rạp stock chất lượng** phù hợp, ghi rõ *ảnh minh họa*; không tuyên bố đó là ảnh chụp địa chỉ cụ thể | URL DB hoặc bảng ảnh rạp hiện có, đúng ownership của rạp |
| **SẢN PHẨM** | Ảnh bắp nước/combo phù hợp | Stock miễn phí có license; chọn ảnh tương ứng mặt hàng, tránh đồ uống khác loại/sản phẩm có nhãn hiệu gây nhầm | URL DB nếu schema có; nếu không, **không sửa schema** |
| **GIAO DIỆN TĨNH** | Nền login, cinema ambience, texture, ánh sáng rạp | Unsplash/Pexels hoặc asset có license cho mục đích sử dụng | File tối ưu trong repo frontend + asset manifest; **không nhét vào trường media phim/rạp** |

### Các nguồn chính thống agent phải mở và đọc

- TMDB API FAQ (attribution/noncommercial/commercial): https://developer.themoviedb.org/docs/faq
- TMDB URL ảnh: https://developer.themoviedb.org/docs/image-basics
- TMDB API terms: https://www.themoviedb.org/api-terms-of-use
- Unsplash license: https://unsplash.com/license
- Pexels license: https://www.pexels.com/license/
- Wikimedia Commons nếu dùng: mở **license ở từng file**, không suy ra mọi ảnh đều cùng giấy phép.

**Ràng buộc bản quyền/nguồn:** Người dùng cho phép tìm ảnh trên mạng, **không phải bằng chứng có quyền sở hữu poster phim**. TMDB công bố API developer miễn phí cho sử dụng **phi thương mại có ghi nguồn**, còn thương mại cần thỏa thuận/phạm vi cấp phép phù hợp; ảnh phim có thể có quyền của hãng phim. Không gọi ảnh có thể tải được là “free commercial” nếu chưa có căn cứ. Với mục đích đồ án/demo phi thương mại, chỉ dùng media theo điều kiện nguồn đáp ứng; nếu có dự định vận hành thương mại, đánh dấu `LICENSE_REVIEW_REQUIRED` và cần xin quyền/giải pháp hợp pháp trước phát hành. Không tải và commit lại poster copyrighted vào repo như stock tự do.

## 4.2. Quy trình tra cứu phim — KHÔNG ĐƯỢC SKIP

Với **từng phim**, thực hiện theo checklist:

1. Tìm phim dựa trên `title`, `original_title` và `release_year`; nếu có nhiều phim cùng tên thì đối chiếu ít nhất năm và synopsis/đạo diễn/diễn viên.
2. Ghi `source_page`, `source_provider`, `external_movie_id` khi có, `title`, `original_title`, `release_year` và lý do match.
3. Tìm **poster chính thức đúng phim**, ưu tiên tỷ lệ **2:3**. Nếu có field backdrop, chọn ảnh landscape đúng phim (ưu tiên 16:9), **không lấy poster dọc kéo giãn làm backdrop**.
4. Với nguồn TMDB nếu quyền sử dụng phù hợp: lấy **file path thật từ API**, tạo URL theo `configuration.secure_base_url + kích cỡ hỗ trợ + poster_path/backdrop_path` (hoặc URL chính thức theo tài liệu). **Không tự chế `poster_path`, không đoán ID, không dùng URL bịa.**
5. Kiểm tra URL qua HTTPS: status, redirects, `Content-Type: image/*`, kích thước file, `width/height` thật và ảnh xem trực tiếp. HEAD có thể bị chặn; thử GET có kiểm soát khi cần. Phân biệt `403`, `404`, hotlink blocking, URL có token hết hạn, ảnh SVG/HTML giả dạng ảnh.
6. **Nhìn ảnh thật** qua trình duyệt/render/công cụ xem ảnh: đúng tác phẩm? đúng phiên bản? có dính watermark? crop có phù hợp card và Hero? Nếu không chắc, báo `UNVERIFIED`.
7. Ghi license/attribution/điều kiện sử dụng và bằng chứng URL. Nếu chưa đủ quyền hay không có media hợp lệ → **ghi blocker, giữ fallback trung tính có tên phim; tuyệt đối không dùng stock giả làm poster**.
8. Làm tương tự cho diễn viên nếu schema đang có ảnh và trường đó được sử dụng. Không tải ảnh nhân vật nhầm diễn viên.

## 4.3. Quy trình ảnh rạp — tránh cả 3 card dùng một ảnh

- Nếu rạp demo do nhóm đặt tên (CinemaStar A/B/...), sử dụng ảnh stock **chân thực**, chọn có chủ ý theo phong cách cơ sở nhưng hiển thị/ghi rõ `Ảnh minh họa`; tránh ảnh trùng giữa các rạp trừ fallback có nhận diện rõ.
- Nếu là địa điểm/cơ sở thật: chỉ gắn ảnh khi nguồn xác minh được **đúng cơ sở** và quyền sử dụng phù hợp; không sử dụng hình một rạp khác để giả là rạp này.
- Nếu hệ thống có gallery/cover index: tôn trọng chủ sở hữu ảnh theo `CinemaID` thực, không gán chéo khi seed quan hệ.
- Không tạo tên rạp có địa chỉ/số điện thoại trùng một cơ sở thật rồi gắn hình minh họa mà khiến người dùng hiểu nhầm là ảnh thực.
- Mỗi URL phải kiểm tra truy cập được **từ browser trong môi trường chạy frontend**, không chỉ trả 200 từ máy agent. Nếu môi trường test chặn mạng, ghi rõ **ENV BLOCKED**, không khẳng định ảnh hỏng.

## 4.4. Bộ tài liệu media bắt buộc

Tạo:

- `database/seed/media/movie-media-manifest.json` (hoặc đường dẫn tương đương), mỗi entry: movie key/title/year/source id/source page/poster URL/backdrop URL khi có, license flag, attribution, fetched-at, validation status, dimensions.
- `database/seed/media/cinema-media-manifest.json`, mỗi entry: cinema natural key/source URL/credit/license/cảnh báo illustration/ảnh chính/gallery mapping.
- `database/seed/media/product-media-manifest.json` nếu có ảnh sản phẩm.
- `docs/seed/IMAGE_SOURCE_AND_LICENSE_MANIFEST.md`: nguồn, tác giả, quyền/điều kiện, license blocker và quy tắc attribution hiển thị nếu có.
- `docs/seed/MEDIA_VALIDATION_REPORT.md`: tổng số URL, valid/invalid/blocked, URLs có rủi ro, ảnh trùng, poster lệch tên phim.

**Không đưa API key, access token, password, private image URL hay secret vào JSON manifest, SQL seed, frontend bundle hoặc Git.** Dùng env riêng để truy vấn media khi cần; kết quả lưu là **URL công khai ổn định theo điều khoản nguồn**.

## 4.5. Chính sách URL, chất lượng và hiệu năng

- URL dữ liệu nghiệp vụ lưu ở DB theo schema hiện hữu, phải là URL HTTPS thật, không chứa token truy cập bí mật hay URL tạm thời dễ hết hạn.
- Không dùng image search thumbnail URL, link trang HTML, Google Images cache/proxy, URL hotlink từ website bên thứ ba cấm embedding, hoặc `source.unsplash.com/random?...` gây đổi ảnh sau refresh.
- Ảnh poster nên có kích thước đủ sắc nét trên card; backdrop đủ dùng cho desktop Hero nếu nguồn có. Không tải `original` hàng chục MB nếu size nhỏ hơn đáp ứng; kiểm tra tỉ lệ pixel/byte và caching phù hợp.
- Chọn media đúng đối tượng quan trọng hơn đạt 100% coverage bằng ảnh sai. **Không hiển thị hình sai để che null.**
- Thực tế cần chạy lại kiểm tra link media về sau do hosting bên thứ ba có thể thay đổi.

---

# 5. PHASE S3 — THIẾT KẾ SEED PIPELINE CHÍNH THỨC

**Tạo một entry point có thể chạy lại**, phân module độc lập theo dependency; tối thiểu chia thành:

```text
database/
  seed/
    README.md
    00_preflight/                 # verify DB/schema, dry run, reset plan
    01_reference/                 # roles/permissions, lookup/master catalogs
    02_users_and_assignments/     # auth accounts, customer profiles, scope
    03_cinema_and_seats/         # cinema, rooms, row/seat geometry, optional images
    04_movie_catalog/            # movies, genres, actors, relations, media URLs
    05_commerce/                 # products, pricing, promotions
    06_dynamic_showtimes/        # computed times from current DB clock
    07_transactions/             # demo orders, tickets, payment history, review/complaints
    media/                       # manifests (không chứa bí mật)
    verify/                      # assertions, counts, integrity and media audit
scripts/
  seed-demo.*                    # orchestrator gọi SQL files/procedures, không phải Backend runtime
  verify-seed.*
docs/seed/
  SEED_BASELINE_AUDIT.md
  SEED_SPEC.md
  RESET_PLAN.md
  IMAGE_SOURCE_AND_LICENSE_MANIFEST.md
  MEDIA_VALIDATION_REPORT.md
  SEED_VERIFICATION_REPORT.md
```

*Tên thư mục là đề xuất.* **Ưu tiên tái sử dụng convention thật trong repo**; không tạo duplicate folder hierarchy chỉ để giống hình minh họa.

## 5.1. Ba profile khác nhau

- **`base`**: lookup, 4 role cố định, permissions, users demo, cinemas/rooms/seats/movies/genres/actors/pricing/products/promos + media thật; repeatable mà không reset nếu dữ liệu phù hợp.
- **`demo-dynamic`**: tạo lịch chiếu động, ít giao dịch cho màn hình Customer & Staff; khi chạy lại không nhân đôi dữ liệu, có chính sách rotate hoặc reset môi trường demo đã xác nhận disposable.
- **`test-fixtures`**: fixture tích hợp/E2E theo tên case, transaction conflicts, payment retry, authorization/scope; **chỉ chạy trên test DB**, không biến mọi fixture lỗi thành dữ liệu hiện ra public.

## 5.2. Seed determinism và khả năng chạy lại

- Có business/natural keys ổn định khi schema hỗ trợ; không phụ thuộc `IDENTITY` gán thứ tự cố định rồi hardcode mọi FK.
- Map parent ID từ bản ghi đã tạo/tra cứu trong DBMS; foreign keys luôn từ record thực, không gửi ID đoán.
- Không dùng `NEWID()` hoặc `Math.random()` không seedable làm đầu ra không kiểm soát; nếu cần có deterministic seed.
- Chạy `base` 2 lần không nhân đôi cinema/movie/user/genre/seat/promotion nếu thiết kế idempotent; nếu project chọn reset-only, ghi rõ command và enforce guard.
- Dữ liệu PII trong account demo phải là dữ liệu synthetic, không dùng số điện thoại/email người thật; dùng domain ví dụ hợp lệ cho demo (`example.com`...), không công khai password thật trong source production.
- Mật khẩu demo được hash bằng phương pháp **đúng với auth implementation**, không INSERT plaintext vào password hash field.
- Không update trực tiếp giá snapshot/vé đã có history chỉ để có số liệu đẹp. Các transaction fixtures được sinh qua SP flow khi có thể; setup fixture đặc biệt nếu phải insert SQL trực tiếp chỉ nằm trong DB test scripts và phải tuân constraints.
- Cleanup/reset phải có thứ tự phụ thuộc FK, chứng minh không còn orphan, không sót bảng khiến chạy lại lỗi duplicate.

## 5.3. Phân ranh giới ứng dụng và DBMS

- Các file SQL `INSERT/UPDATE/DELETE` phục vụ **database seed/migration** được phép đặt dưới `database/seed` và thực thi bởi công cụ deploy/seed **bên ngoài backend runtime**.
- Không viết SQL trực tiếp trong `backend/src`, `frontend/src`, controller/service, kể cả với lý do “seed cho tiện”.
- Seed orchestration có thể dùng `sqlcmd`/PowerShell/npm task/CLI phù hợp repository để **chạy script SQL đã version-control**; không biến API server thành endpoint `wipe-database` hay deploy public reset endpoint.
- Chỉ sửa SP/constraint/schema nếu phát hiện lỗi thật và được phê duyệt riêng; seed không phải cớ nới lỏng invariant.

---

# 6. PHASE S4 — NỘI DUNG SEED CHO TỪNG NGHIỆP VỤ

## 6.1. Accounts, RBAC, manager scope

- Seed 4 role đúng mã hiện hành; phân quyền tương ứng baseline (không tạo role động mới).
- Accounts đủ cho customer, manager có rạp được gán, CSKH và Admin; 1 manager gán ít nhất một rạp, các ca phân công khác nhau nếu rule cho phép.
- Profile Customer có những field thật của schema, dữ liệu hợp lý; **không tạo HOSOKHACHHANG cho staff**.
- Accounts active/inactive để test Login/permissions nếu schema hỗ trợ; không mặc định thêm tính năng MFA/forgot password ngoài contract.
- Ghi tài khoản test và hướng dẫn đăng nhập **theo cách an toàn** trong tài liệu local/private phù hợp repo, không in mật khẩu production hoặc secret vào frontend.

## 6.2. Rạp, phòng và ghế

- Mỗi rạp có name, city, address, phone/description **phù hợp field hiện có** và mục đích demo; không bịa rạp/địa chỉ như doanh nghiệp thật nếu không có căn cứ.
- Ảnh cover/gallery rạp đúng FK/ownership, ít nhất có ảnh thật hợp lệ hoặc fallback ghi rõ.
- Mỗi phòng có format/type/status hiện có; seat layout có hàng A–... và số 01–... (tùy column), không trùng `(PhongID, HangGhe, SoGhe)`; đủ loại ghế hợp lệ.
- Nếu trạng thái ghế bảo trì/hỏng, đảm bảo không được bán trong booking fixtures. Không xóa/sửa ghế đã có ticket history trong lúc reseed nếu không phải disposable DB reset.

## 6.3. Movie/genre/actor/media

- Mỗi phim có tên, mô tả, thời lượng, năm/ngày khởi chiếu, status, phân loại tuổi, media URL... **chỉ theo các field thực**.
- Movie–Genre và Movie–Actor mapping đúng thực tế, ít nhất hai thể loại với phim phù hợp khi đã xác minh; không gán tất cả phim một thể loại cho đủ.
- Dùng mapping nhất quán giữa movie catalog, showtime, poster, backdrop, trailer nếu có. Không tự gắn YouTube trailer của phim khác.
- Hỗ trợ 2–3 nội dung nổi bật **từ dữ liệu thật** để Homepage có Hero/rail đẹp; nếu không có cờ featured trong DB thì frontend tự chọn theo rule hiện có, không thêm column.
- `Sắp chiếu` có thể có future showtime bookable nếu DB cho phép và đúng release window; nếu không, chỉ hiển thị trong danh mục mà không bịa nút mua vé có hiệu lực.

## 6.4. Showtime động, không overlap

- Dùng đồng hồ SQL Server làm nguồn xác định `today`/`now`, thống nhất múi giờ thiết kế; không hardcode `2026-10-12` hoặc một ngày cụ thể làm lịch cố định.
- Cho dữ liệu để khách bấm được **hôm nay/ngày mai/cuối tuần/gần 7–14 ngày**. Suất mới phải có `ThoiGianBatDau > DB now` và đáp ứng trạng thái `Mở bán`, rạp/phòng `Hoạt động`, phim không `Ngừng chiếu`, release window hợp lệ.
- Dùng slot scheduling deterministic dựa trên movie runtime + buffer (nếu rule dùng) và room availability; không tạo hai suất trùng thời gian trong một phòng, không lách trigger.
- Tạo suất quá khứ cho review/history và suất tương lai để người dùng đặt ghế; không ghi future order ở trạng thái hoàn thành bất hợp lý.
- Booking flow có các ngày/giờ đa dạng để thử date rail và cinema/movie filters, nhưng không tự hiển thị ngày không có suất như ngày có vé.
- Một số suất có ghế đã giữ/đã bán/hết chỗ nếu SP cho phép; vẫn phải có nhiều suất thực sự còn ghế để positive flow chạy được.

## 6.5. Giá vé, sản phẩm, promotion

- Giá theo cấu hình thực: loại ghế, loại ngày `Ngày thường / Cuối tuần / Tất cả`, định dạng chiếu và khoảng hiệu lực hợp lệ. Không `Ngày lễ`.
- Phụ thu/giá không âm, ưu đãi không vượt giới hạn, không tạo rule trùng/overlap làm trigger reject.
- Sản phẩm ăn uống: tên/giá/trạng thái/ảnh đúng product nếu có field; có nhiều mức giá và combo phù hợp ảnh hưởng giỏ hàng.
- Khuyến mãi demo: active valid; expired; quota exhausted; min-order-not-met; discount percentage/fixed nếu schema hỗ trợ, để test cả trạng thái thông báo lỗi. Không âm thầm bỏ coupon lỗi và vẫn tạo đơn full price.
- Snapshot `GiaVe`, `DonGia`, `TongTienVe`, `TongTienDoAn`, `TienGiamGia`, `THANHTOAN.SoTien` (nếu hiện có) phải được tính/ghi bởi DBMS/booking SP đúng policy, không copy cứng ra toàn bộ orders.

## 6.6. Booking, ticket, payment, review, complaint

Tạo fixtures theo từng trạng thái **chỉ nếu lifecycle trong DB/API thật sự hỗ trợ**:

| Kịch bản | Yêu cầu |
|---|---|
| Order pending/holding | Có hạn giữ chỗ hợp lệ, theo current DB clock |
| Order paid | Có transaction success và giá/ticket snapshot khớp |
| Order expired/canceled | Theo quy tắc trạng thái, không giữ ghế vĩnh viễn |
| Payment retry | Một order có failed attempt và successful attempt, lịch sử còn nguyên |
| Food | Có đơn không food, một sản phẩm, nhiều sản phẩm |
| Promotion | Có đơn áp thành công; có case invalid để test lỗi (không insert đơn gian lận) |
| Reviews | Customer đã xem đủ điều kiện được review; customer chưa xem bị từ chối trong test |
| Complaints | Có/không tham chiếu đơn; trạng thái mới/đang xử lý/đã giải quyết theo contract, timeline hợp lệ |
| Manager scope | Manager A không nhìn/chỉnh dữ liệu rạp B qua API/SP |
| Seat conflict | Hai request đồng thời cùng suất/ghế, tối đa một commit; test trên DB test riêng |

Đơn, vé, thanh toán hoặc lịch sử xử lý không được tạo bằng loạt INSERT độc lập tạo partial state; ưu tiên **gọi SP nghiệp vụ** từ công cụ seed/test hoặc transaction T-SQL đầy đủ trong phạm vi DBMS. Nếu một fixture cần dữ liệu không thể tạo hợp lệ qua SP/constraint hiện tại, ghi **BLOCKED**, không bỏ trigger hoặc giả state để có screenshot.

---

# 7. PHASE S5 — THỰC THI RESET VÀ RESEED

**Trình tự bắt buộc:**

1. Inventory/audit seed scripts & DB row counts, chụp mốc trước khi sửa.
2. Thiết kế mới + kiểm tra manifest ảnh + kiểm tra schema/dependency.
3. Viết preflight, dry-run, reset plan/restore plan; kiểm thử trên disposable test DB.
4. Verify backup/snapshot và environment guard; với DB không được xác nhận disposable thì **STOP trước deletion**.
5. Dừng app/test đang ghi vào DB demo mục tiêu; dùng named target đúng.
6. Thực hiện reset dữ liệu seed cũ đúng dependency hoặc rebuild database disposable bằng scripts chuẩn.
7. Chạy `seed_base` → `seed_demo_dynamic` → `test_fixture` (test DB riêng) → media integrity validation.
8. Chạy lại verification, mở frontend public và staff liên quan để kiểm tra dữ liệu hiển thị thực, không chỉ query row count.
9. Chạy pipeline lần thứ hai theo profile được công bố để chứng minh idempotent/reproducible; không được thêm hàng loạt row trùng.
10. Xóa/retire legacy seed files **chỉ sau khi pipeline mới PASS**, cập nhật mọi script/references để mọi team member chỉ còn một cách seed chính thức.

**Không báo DONE nếu:** dữ liệu cũ vẫn xen lẫn, reset gây orphan, poster link không tải, UI vẫn dùng hardcoded placeholder không liên quan, script chạy được đúng một lần, dynamic showtime hết hạn sau vài ngày, hoặc một role không login được.

---

# 8. PHASE S6 — KIỂM THỬ THỰC TẾ VÀ TIÊU CHÍ NGHIỆM THU

## 8.1. Seed/database tests (tự động)

- `DB schema unchanged`: số bảng/column/index/SP/trigger không tăng ngoài kế hoạch approved; không tắt constraint để fake pass.
- Referential integrity: **0 orphan** giữa các bảng có FK, movie/genre/actor, cinema/room/seat, showtime/room/movie, order/ticket/payment, complaint/processing.
- Unique: **0 duplicate** email, movie natural keys theo policy, seat `(room,row,number)`, showtime overlap, promotion code, review `(movie,customer)`.
- Media: **0 poster sai phim được đánh dấu verified**; 0 URL bịa; phần bắt buộc có image URL `VALID`; các media bị blocker phải có fallback và báo cáo số lượng.
- Image transport: HTTPS, response thực, MIME đúng, dimensions đủ, không hotlink blocked ở browser khi môi trường có mạng; không dính `undefined`, relative disk path, temporary signed link.
- Dynamic date: future showtimes nằm sau DB clock, phân bố 7–14 ngày, có suất bookable/seat available, past fixtures tạo review hợp lệ; timezone consistency.
- Price/trx: giá snapshot không đổi khi pricing rule thay đổi (trên test DB), payment retry giữ lịch sử, promotion quota không vượt, booked seats không trùng, rollback/atomicity PASS.
- Auth/scope: Customer self-service, Manager scope, CSKH complaint, Admin endpoints đúng role hiện tại; không generate staff customer profiles.
- Repeatability: empty demo DB → run → PASS; reset + run → cùng expected functional state; `base` run twice → không trùng (nếu idempotent contract).

## 8.2. Browser acceptance — bắt buộc chụp ảnh thật

Dùng UI frontend đang có / theme mới nếu đã triển khai. Kiểm tra tối thiểu:

| Trang/tình huống | Điều kiện PASS |
|---|---|
| `/` Hero | Poster/backdrop **đúng phim nổi bật**, không phải ảnh phong cảnh ngẫu nhiên; đúng status/showtime |
| `/` movie rails | Phim đa dạng và poster đúng; không có card lỗi/broken image, không “4 phim lặp vô hạn” |
| `/movies` | Search/genre/status ra phim đúng, các poster và metadata nhất quán detail |
| `/movies/:id` | Poster, tên, diễn viên/thể loại, lịch chiếu khớp movie id và DB |
| `/cinemas` | Ảnh rạp/ảnh minh họa không bị nhầm rạp, gallery ownership không lẫn |
| `/cinemas/:id` | Chỉ có suất chiếu thuộc rạp tương ứng, không ảnh rạp khác |
| `/booking/:showtimeId` | Sơ đồ ghế đúng phòng, còn ghế thật, giá theo DB, không lỗi 409 giả |
| Payment/Orders | Một order demo có transaction success; có retry/fail cases đúng |
| Review/Complaint | Đánh giá đủ điều kiện, khiếu nại có/không đơn, timeline hợp lệ |
| Admin/Manager/CSKH | Login và dữ liệu thật vẫn hoạt động; **không redesign** portals |

Chụp ít nhất desktop & mobile cho trang Public quan trọng. Dùng network tab/console để xác minh `img` trả content-type thực, không 404 hoặc hình ảnh cross-origin bị chặn bởi chính sách endpoint/CDN. Nếu môi trường chặn website ngoài, tách rõ **MẠNG BỊ CHẶN** và **URL HỎNG**.

## 8.3. Quality gate đánh giá hoàn tất

**Phải đạt tất cả:**

- [ ] Repo chỉ có **một pipeline seed chính thức**; seed cũ được retire/xóa an toàn; hướng dẫn lệnh rõ.
- [ ] Dữ liệu demo cũ đã được reset **trong đúng disposable DB** và chỉ còn dataset mới.
- [ ] 100% ràng buộc schema/PK/FK/trigger và domain-critical test PASS.
- [ ] Movie catalog có đủ media thật **đúng phim đã xác minh** để dựng dark cinematic UI; không gắn nhầm poster.
- [ ] Rạp/demo/gallery và sản phẩm có ảnh phù hợp nếu schema có; asset nguồn rõ và đúng quyền.
- [ ] Trình duyệt load được ảnh; nếu thiếu quyền/media thì có fallback + blocker minh bạch.
- [ ] Showtime dynamic, bookable, đa rạp/đa phim, không overlap; booking positive test PASS.
- [ ] Customer/Manager/CSKH/Admin có dữ liệu đủ cho flow hiện có.
- [ ] No SQL-in-backend regression, không thêm bảng/field/API ngoài approval.
- [ ] Không mất dữ liệu thật, có log preflight/reset/backup/restore path.
- [ ] Test lần hai không duplication, script chạy lại từ clean checkout theo README.
- [ ] Báo cáo evidence, source/license manifest, DB counts, test outcomes, URL coverage hoàn chỉnh.

---

# 9. ĐẦU RA BẮT BUỘC — KHÔNG CHỈ DỪNG Ở KẾ HOẠCH

AI Coding phải **thực hiện chỉnh sửa code/seed thật trong repo**, không chỉ trả lời bằng báo cáo:

1. Scripts seed mới tách module, có orchestration và clear entry point; legacy scripts bị loại khỏi active workflows.
2. **Dữ liệu nguồn media đã tra cứu Internet** trong manifest, URLs đã được kiểm chứng; SQL seed thực sự ghi các URL vào column hiện có và API đọc ra đúng.
3. Preflight/dry-run/reset command có guard và bảo vệ DB; hướng dẫn restore.
4. Base data, dynamic showtimes, transactions/test-fixtures đủ theo ma trận được chốt.
5. Automated SQL/integration/media checks + ít nhất một vòng browser screenshots.
6. Tài liệu:
   - `docs/seed/SEED_BASELINE_AUDIT.md`
   - `docs/seed/SEED_SPEC.md`
   - `docs/seed/RESET_PLAN.md`
   - `docs/seed/IMAGE_SOURCE_AND_LICENSE_MANIFEST.md`
   - `docs/seed/MEDIA_VALIDATION_REPORT.md`
   - `docs/seed/SEED_VERIFICATION_REPORT.md`
7. Báo cáo cuối phải ghi: target DB; dữ liệu đã xóa/còn giữ; file legacy đã xóa; số movie/cinema/rooms/seats/showtimes/orders/users; số poster/backdrop/ảnh rạp **VALID/UNVERIFIED/BLOCKED**; test PASS/FAIL; screenshot locations; các blocker; các quyết định cần người dùng phê duyệt.

## 9.1. Mẫu summary cuối cần trả cho chủ dự án

```text
STATUS: DONE | PARTIAL | BLOCKED
ENV / TARGET DB: ...
RESET AUTHORIZED: YES/NO
BACKUP / RESTORE EVIDENCE: ...
LEGACY SEED FILES RETIRED: ...
OLD DEMO ROWS CLEARED: ... (không nêu DONE nếu chưa chạy reset)
NEW DATA: movies ..., media verified ..., cinemas ..., rooms ..., seats ..., showtimes ..., orders ...
IMAGE SOURCE: per-movie/media manifests + license caveats
DB/INTEGRATION TESTS: ...
BROWSER SCREENSHOTS: ...
UNCHANGED: schema, SP business rules, API contracts, Admin/Manager/Support UI
BLOCKERS AND USER DECISIONS: ...
```

---

# 10. CÁCH THỰC THI — KHÔNG ĐƯỢC LÀM ẨU

**Thứ tự bắt buộc:**

`Audit → Seed Spec → Web Image Sourcing & License → URL Validation → Seed Scripts → Disposable DB Rebuild/Reset → Data Assertions → API/E2E Browser Check → Cleanup Legacy → Report`.

- Mỗi phase phải có artifact và test evidence trước khi tiếp tục.
- Agent phải thực sự mở Internet theo công cụ được cấp. **Nếu không có web/network, không được tự chế URL ảnh hoặc nói đã xác minh**: chuẩn bị pipeline/scripts, ghi `BLOCKED_MEDIA_SOURCING` và yêu cầu cấp Internet/API credentials hợp lệ.
- Không chạy lệnh phá dữ liệu trên production hay DB chưa xác nhận disposable, dù người dùng đã yêu cầu “xóa toàn bộ seed cũ”. Yêu cầu này **chỉ áp dụng dữ liệu seed/demo**.
- Không nhầm **license của ảnh stock thương mại** với **quyền sử dụng poster phim**; lưu attribution/source theo từng asset.
- Không bịa hiệu suất, counts, kiểm thử, logs, screenshots, HTTP responses hoặc đường dẫn file.
- Nếu block vì database không disposable/không có quyền nguồn ảnh, **dừng đúng tại gate đó**, hoàn thành phần an toàn và báo chính xác những gì chưa làm. Không báo full DONE.
- Không tự động tạo “dashboard quản lý seed” hay endpoint reset công khai.

**KẾT QUẢ MONG ĐỢI:** CinemaStar từ seed rời rạc, poster sai, hình rạp lặp và dữ liệu thiếu sẽ có một **bộ demo/test seed duy nhất, nhiều nội dung có hình ảnh đúng, đẹp để dựng UI dark cinematic, đủ nghiệp vụ để chạy end-to-end, có thể tái tạo chỉ với một quy trình chuẩn, và không phá kiến trúc DBMS-first hay dữ liệu thật**.

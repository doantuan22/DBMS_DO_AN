# CINEMASTAR — MASTER IMPLEMENTATION PROMPT
## Thiết kế lại toàn bộ Public / Customer thành một trải nghiệm **Cinematic Dark Commerce**

**Loại tài liệu:** Prompt thực thi dành cho AI Coding Agent, kèm design specification, kiến trúc frontend, tiêu chí kiểm chứng và quality gates.  
**Ngày biên soạn:** 12/10/2026.  
**Trạng thái:** Yêu cầu **triển khai code sau khi audit repo**, không phải mockup hay bản concept.  
**Đối tượng sửa:** Chỉ phần giao diện **Public + Customer**, bao gồm cả UX đăng nhập/đăng ký và hành trình đặt vé.  
**Đối tượng KHÔNG sửa:** **Admin, Manager, CSKH/Support**, DBMS, Stored Procedure, backend business logic, nghiệp vụ dữ liệu; các vùng này phải tiếp tục hoạt động như cũ.

> **Cách sử dụng:** Dán TOÀN BỘ tài liệu này vào AI Coding Agent đang mở repository CinemaStar. Đồng thời **đính kèm ảnh tham chiếu do chủ dự án cung cấp** (`image(9).png`, ảnh collage website điện ảnh nền tối, kích thước 1512 × 1134). Nếu agent không nhìn được ảnh, phải đọc phần mô tả hình học rất cụ thể ở §4 và ghi lại hạn chế; **không được giả vờ đã xem ảnh**. Những đường dẫn ở cuối file là nguồn tham khảo để agent tự đối chiếu lại, không phải lệnh chép source giao diện của website khác.

---

# 0. MỆNH LỆNH THỰC THI — ĐỌC TRƯỚC

Bạn là **principal frontend engineer + senior product designer**, chịu trách nhiệm thực hiện một cuộc **visual/UX redesign thật** cho website CinemaStar. Khách hàng không muốn một giao diện kiểu AI-generated thông thường. Đích đến là website rạp phim thương mại có chất lượng thẩm mỹ, cảm giác điện ảnh và tính liên tục của luồng đặt vé.

**Các quyết định của chủ dự án, có ưu tiên cao nhất trong phạm vi này:**

1. **Thay hoàn toàn visual identity của vùng Public/Customer** từ trắng–xanh sang **dark cinematic** như Netflix và ảnh mẫu; sử dụng màu đỏ làm primary accent, nhưng **không sao chép thương hiệu, logo, source HTML/CSS hay giao diện Netflix theo pixel**.
2. **Ảnh mẫu là nguồn định hướng quan trọng nhất về composition:** Hero hình phim lớn; navigation phủ trên ảnh; thanh chọn ngày; các hàng poster dạng editorial; màu nền tối; card nhỏ gọn; khu vực thể loại; nhịp điệu dày, giàu nội dung, không phải các hộp trắng lặp lại.
3. **Thiết kế và triển khai cho toàn bộ hành trình Customer**, không chỉ homepage: duyệt phim, chi tiết, rạp, lịch chiếu, chọn ghế, sản phẩm/khuyến mãi, đặt vé, thanh toán, lịch sử đơn, hồ sơ, đánh giá, khiếu nại và xác thực.
4. **Không được chạm/chuyển theme các portal nghiệp vụ** `/admin`, `/manager`, `/support`/CSKH; mọi class, token, reset style của public phải được **cô lập** để không làm thay đổi giao diện hoặc hành vi staff.
5. **Không đưa SQL vào code.** Kiến trúc bất biến: `React → REST API → Node/Express → Stored Procedure → SQL Server`. Không sửa DB schema, trigger, procedure, API contract hoặc business rules nếu chưa có chỉ định riêng.
6. **Không bịa dữ liệu** (giờ chiếu, tồn ghế, giá, điểm đánh giá, ưu đãi, poster, trailer, badge, thành phố, số lượng phim). Tất cả dữ liệu động phải lấy từ endpoint hợp lệ đang có. Không tạo mock production để tạo cảm giác website đầy đủ.
7. **Dữ liệu hình ảnh phim/rạp** phải tiếp tục tuân thủ mô hình lưu **URL trên CSDL** nếu trường đó đã có. Asset giao diện tĩnh, ảnh nền không gắn với bản ghi nghiệp vụ được phép lưu trong repo frontend theo license. Không nhét đường dẫn `src/assets` vào URL của bản ghi phim.
8. **Tuyệt đối không dùng ảnh stock bất kỳ để giả làm poster của một phim cụ thể.** Poster của phim A phải thật sự tương ứng với phim A; thiếu hoặc chưa đủ quyền sử dụng thì có fallback trung tính mang nhãn tên phim, không phát minh poster.
9. **Không coi render thành công là DONE.** Phải mở browser, chụp ảnh viewport, test hành trình, so sánh bố cục thật với ảnh mẫu, sửa từng vòng, rồi mới nghiệm thu.

**Chính sách khi mâu thuẫn:** Các tài liệu cũ từng chốt trắng–xanh áp dụng cho toàn hệ thống. Yêu cầu mới này **chủ động thay thế chỉ cho Public/Customer**; Admin/Manager/CSKH vẫn giữ theme cũ. Các quyết định về nghiệp vụ, an toàn ghế, giá, thanh toán, RBAC, permission và API **không** bị thay thế.

**Không tự động thay phạm vi Use Case:** Blueprint V3 ngày 11/10 ghi nhận 14 UC Customer, 44 UC toàn hệ thống theo Audit V2; các tài liệu cũ có mốc 45/46 khác nhau. **Đọc UC Matrix thật trong repo** để xác nhận baseline hiện hành. Tuyệt đối không sửa bảng thống kê UC chỉ để phù hợp prompt thiết kế.

---

# 1. KHẢO SÁT THAM CHIẾU — ĐÃ TỔNG HỢP, NHƯNG PHẢI ĐỐI CHIẾU BROWSER KHI TRIỂN KHAI

## 1.1. Những website nghiên cứu và kết luận ứng dụng

| Trang tham khảo trực tiếp | Pattern đáng học | Học gì cho CinemaStar | Không sao chép gì |
|---|---|---|---|
| [Netflix — giới thiệu UX giao diện mới](https://www.netflix.com/tudum/articles/netflix-new-homepage-layout-user-guide) | Title hero, ngữ cảnh phim, các hàng nội dung, ra quyết định nhanh | Artwork đầy chiều rộng, tiêu đề gắn trực tiếp tác phẩm, metadata ngắn, từng hàng có chủ đề | Hành vi “Watch/Play” của nền tảng streaming, thuật toán cá nhân hóa chưa có dữ liệu, logo hoặc pixel UI |
| [MUBI — Now Showing](https://mubi.com/en/us/showing) | Editorial curation, tuyển chọn phim có câu chuyện, hình ảnh là chính | Phân vùng hàng phim có mục đích; typography và negative space có kiểm soát | Nội dung và quyền streaming không thuộc CinemaStar |
| [Letterboxd — Films](https://letterboxd.com/films/) | Poster grid với mật độ cao, dễ scan nhiều tựa phim | Poster đúng tỷ lệ, thao tác hover/focus ngắn gọn, lọc bằng metadata | Điểm số/community hoặc danh sách xếp hạng giả |
| [AMC Theatres — Movies](https://www.amctheatres.com/movies) | Now Playing / Coming Soon, film metadata, Get Tickets | Các bộ chọn trạng thái và CTA mua vé rõ, tuổi/phút/thể loại dễ đọc | Giá hoặc định dạng suất chiếu không được API hỗ trợ |
| [Fandango — Movie Tickets & Times](https://www.fandango.com/movietimes) | Search by movie/theater/location, tìm giờ chiếu | Đặt câu hỏi “xem phim gì, ở đâu, khi nào?” gần đầu hành trình | Các tra cứu GPS/dịch vụ bản đồ nếu dự án không có dữ liệu |
| [CGV Việt Nam — Phim đang chiếu](https://www.cgv.vn/default/movies/now-showing.html/) | Phân loại phim, thể loại, thời lượng, ngày phát hành, mua vé | Các metadata thật giúp chọn phim; CTA nhất quán | Nội dung quảng cáo/bảng giá CGV |
| [Galaxy Cinema](https://www.galaxycine.vn/) | Catalog phim đang chiếu/sắp chiếu, luồng mua vé theo phim hoặc rạp | Giữ hai entry point Movie-first và Cinema-first | Các gói thành viên/ưu đãi/IMAX khi CSDL không hỗ trợ |
| [BHD Star](https://www.bhdstar.vn/) | Featured movie, poster, mua vé nhanh và thông tin phân loại | CTA ngay tại Hero và card; card tránh văn bản thừa | Cách bố cục biểu trưng thương hiệu riêng |
| [Cinestar](https://cinestar.com.vn/) | Quick booking chọn rạp → phim → ngày → suất | Wizard ngắn hoặc quick booking khi **lookup API hiện tại thật sự hỗ trợ** | Tạo form giả, chọn ngày rồi không có kết quả hoặc điều hướng dead-end |

**Diễn giải nghiên cứu:** Netflix/MUBI/Letterboxd truyền cảm hứng về **discovery và visual hierarchy**; AMC/Fandango/CGV/Galaxy/BHD/Cinestar là tham chiếu cho **ticket commerce**. CinemaStar phải là **cinema booking platform**, không phải Netflix clone.

**Giới hạn kiểm chứng:** Việc khảo sát web cung cấp bằng chứng cho nội dung, đường dẫn và pattern công khai, **không chứng minh toàn bộ tương tác JavaScript, mobile hay từng hover animation của các website đó**. Agent phải tự xem bản desktop/mobile trực tiếp khi có trình duyệt; nếu trang bị chặn, ghi `NOT ACCESSIBLE` và dựa vào đặc tả đã cho, không bịa là đã audit tận mắt.

## 1.2. Công thức visual duy nhất được chọn

**Cinematic Dark Commerce = Netflix-like visual storytelling + film editorial discovery + theater-commerce clarity + CinemaStar identity.**

- Tối hơn, táo bạo hơn, dùng ảnh phim đúng và chất lượng cao, typography có nhịp.
- Một Hero thực sự thu hút ở đầu trang; poster grids/rails phía dưới; đủ thông tin thật để đặt vé.
- Primary action rõ: **“Đặt vé” hoặc “Chọn suất chiếu”**, không phải button “Khám phá” mang tính trang trí.
- Phân cấp bằng kích thước ảnh, overlay, typography, khoảng cách, chứ không bằng hàng chục card viền.
- Giữ chất lượng UX của sản phẩm giao dịch: giá rõ ràng, trạng thái ghế rõ ràng, form dễ nhập, lỗi minh bạch.
- Chỉ đưa vào component và hiệu ứng nào phục vụ thật cho thông tin phim và hành động.

---

# 2. KHẢO SÁT REPO VÀ KHÓA PHẠM VI TRƯỚC KHI SỬA

## 2.1. Bắt buộc kiểm tra thực tế

Trước khi code, đọc và lập inventory ngắn từ repository hiện tại:

- `package.json`, router/routes, auth provider/context, `PublicShell`, `StaffShell`, header/footer, CSS globals, tokens, UI libraries, file cấu hình build, asset pipeline.
- Các trang `Home`, `Movies`, `MovieDetail`, `Cinemas`, `CinemaDetail`, `Login`, `Register`, `Profile/Account`, `Booking`, `Orders`, `OrderDetail`, `Payment`, `Complaints`, `ComplaintDetail`, review UI nếu có; **đọc route thật, không đoán tên file**.
- Danh sách endpoint hiện được gọi, query params, DTO field hình ảnh, film status, trailer (nếu có), showtime availability, booking hold, giá, payment, errors.
- Mọi component dùng chung giữa staff và public, đặc biệt `Button`, `Card`, `Modal/Dialog`, `Select`, `Badge`, `Toast`, `Loading`, `PageShell`. Đánh dấu **shared-risk** trước khi sửa.
- Các guard đã được bảo vệ: auth redirects, protected routes, stale request, booking selection reset, hold expiry, double-submit, 409 conflict, ownership.
- Tập test hiện có, e2e, browser automation, script lint/build/test; ảnh public trước khi sửa ở desktop/mobile.
- Đối chiếu `MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md`, UC Matrix hiện hành, Audit V2 (nếu có trong repo). V3 là **proposal cũ**; cho phép thay dark theme Public từ yêu cầu này, không được thay nghiệp vụ.

Xuất một bảng `Route | Page/component | API | dữ liệu media | states | có shared với staff? | thay đổi dự kiến | độ rủi ro` trong file báo cáo thực thi. Nếu thiếu endpoint/field, đánh dấu **BLOCKED**, không lấp bằng mock.

## 2.2. Vùng ĐƯỢC sửa

- Các component UI/render, layout, styling và page composition **Public/Customer**.
- Presentation adapter cho DTO hiện tại nếu chỉ format text/ngày/ảnh; **không đổi nghĩa dữ liệu**.
- Component primitives **riêng cho theme customer** nếu shared primitive có nguy cơ ảnh hưởng staff.
- Trang xác thực chung, với điều kiện **không làm sai luồng login/redirect của nhân sự nội bộ**.
- Static site assets hợp lệ và license manifest.
- Unit/component/e2e tests mới cho public; các sửa nhỏ được yêu cầu để accessibility/performance của public.

## 2.3. Vùng CẤM sửa hoặc chỉ được đọc

- `/admin/**`, `/manager/**`, `/support/**` (mọi route CSKH) và `StaffShell`.
- CSS design tokens hiện dùng cho staff, nếu đổi sẽ ảnh hưởng staff. **Không đổi global palette**.
- Backend route/controller/service/validator để “phục vụ UI” khi chưa được chấp thuận; không tự thêm endpoint, SP, table, migration.
- Không thay response schema, tên bảng/column, enum trạng thái, roles/permissions, logic authoritative tính tiền, khóa ghế, giữ ghế, thanh toán, khuyến mãi.
- Không gỡ test, không skip test fail, không dùng `!important` hàng loạt để giấu regressions.
- Không tạo hệ thống streaming, AI recommendation, gamification, membership, bản đồ/ETA, review rating bên thứ ba, thư viện trailer mới nếu ngoài scope.

**Gate cách ly:** Sau mỗi slice kiểm tra style screenshot của 1 trang Admin, 1 trang Manager và 1 trang CSKH đã có. Nếu có sai khác ngoài font render không đáng kể -> **ROLLBACK hoặc cô lập lại CSS** trước khi tiếp tục.

---

# 3. DESIGN SYSTEM — CỤ THỂ TỚI TOKEN

## 3.1. Palette (chỉ scope Public/Customer)

Tạo namespace custom properties dưới ví dụ `.cinema-public` hoặc `[data-cinema-theme="dark"]` gắn ở `PublicShell`, không trên `:root` chung hoặc `body` toàn app.

```css
.cinema-public {
  color-scheme: dark;
  --cp-bg: #101014;           /* nền primary */
  --cp-bg-deep: #0B0B0F;      /* vùng hero, footer */
  --cp-surface: #1D1D27;      /* movie information surface */
  --cp-surface-2: #262633;    /* hover/raised */
  --cp-surface-3: #30303E;    /* skeleton, control secondary */
  --cp-border: #343442;
  --cp-text: #F5F5F7;
  --cp-text-secondary: #A8A8B3;
  --cp-text-muted: #8B8B99;
  --cp-accent: #E50914;       /* action red, cân nhắc văn bản trắng */
  --cp-accent-hover: #B20710;
  --cp-accent-soft: rgba(229, 9, 20, .12);
  --cp-focus: #FFD166;
  --cp-success: #4ADE80;
  --cp-warning: #FBBF24;
  --cp-error: #FF6B6B;
  --cp-overlay: rgba(7, 7, 12, .72);
  --cp-radius-sm: 6px;
  --cp-radius-md: 10px;
  --cp-radius-lg: 14px;
  --cp-container: 1360px;
  --cp-gutter: clamp(18px, 3.7vw, 64px);
}
```

**Các luật sử dụng màu:**

- Nền tối chiếm ưu thế; 80–90% không gian không dùng đỏ. Đỏ chỉ nhấn CTA, active indicator và chi tiết chủ đích.
- Không biến website thành ma trận card đỏ/viền đỏ. Tránh glow đỏ, neon cyberpunk, gradients ngẫu nhiên và glassmorphism tràn lan.
- Button primary phải đủ contrast; mẫu `#E50914`/trắng có độ tương phản khoảng **4.79:1** theo công thức WCAG, nhưng phải đo cả hover/disabled/text nhỏ trong browser thực tế.
- Các màu trạng thái phải có **label/text/icon**, không chỉ đổi màu.
- Nền Hero có overlay gradient **có mục đích** để chữ đọc được; đây là một trong số ít trường hợp gradient được sử dụng.
- Sử dụng chiều sâu bằng các lớp `background/image → vignette → text` và tách section, không dựa vào bóng mờ quá nhiều.

## 3.2. Typography

Chọn font **thật, có license công khai, hỗ trợ đầy đủ tiếng Việt**. Hướng ưu tiên:

- **Body / UI:** `Manrope` hoặc `Inter` (kiểm tra ký tự Việt và font package; tự host nếu phù hợp), fallback `system-ui, sans-serif`.
- **Heading / editorial accent:** `Barlow Condensed` cho label lớn ở Hero hoặc `Space Grotesk` **chỉ khi** hỗ trợ tiếng Việt và phù hợp; không bắt buộc dùng font thứ hai nếu mất nhất quán. Kiểm tra font thực tế và license trước khi commit.
- Không dùng chữ in hoa trên mọi đoạn; uppercase chỉ section eyebrow, badge nhỏ, một vài editorial heading.
- Type scale dự kiến desktop: Hero heading 52–68px tùy viewport; section heading 26–32px; card title 14–17px; body 14–16px; label 12–13px (đủ contrast).
- Font weight thật, không synthetic bold nếu file font thiếu; line-height 1.15–1.25 cho heading và 1.5–1.6 cho text.
- Đo chiều dài title Việt: không làm `text-overflow` cắt tên ở vị trí quan trọng; 2 dòng card và 3 dòng khi đặc biệt dài; không làm mọi tiêu đề có độ dài giả giống nhau.

## 3.3. Spacing, geometry và responsive grids

- Container desktop max-width gần 1360px nhưng Hero/background có thể **bleed** tới mép màn hình; ở 1920px nội dung không bị bó lại thành “một tờ giấy giữa nền trống”.
- Section vertical rhythm 52–80px desktop, 36–52px tablet, 28–40px mobile tùy nội dung.
- Poster chuẩn `aspect-ratio: 2 / 3`; backdrop hero `16 / 9` đến `21 / 9` và cover có căn chủ thể.
- Card poster không mặc định có viền 1px, white surface, shadow, caption dài, button full width giống dashboard.
- Row nội dung tối ưu scannability: desktop 5–6 poster/viewport tùy available width; tablet 3–4; mobile 2 (hoặc 2.2 poster khi là rail). Đây là mục tiêu thẩm mỹ, kiểm tra text legibility thực tế.
- Không có fixed 3-card grid và khoảng trắng khổng lồ khi có ít rạp; dùng grid auto-fit/adaptive, hoặc layout danh sách rạp có ảnh landscape + thông tin.
- Thiết kế max-height/overflow cho danh sách phim dài, tránh footer overlay content.

## 3.4. Chi tiết nhận diện CinemaStar

- Giữ tên **CinemaStar**. Có thể thiết kế lại wordmark typography/icon **riêng, tối giản**, nhưng không dùng logo Netflix, không sao chép chữ N hoặc motion signature đặc trưng.
- Brand voice ngắn, trực tiếp: **“Phim hay. Suất chiếu đúng lúc. Chỗ ngồi dành cho bạn.”** là gợi ý copy, chỉ dùng nếu phù hợp màn hình. Không cần 10 slogan nhạt nhòa.
- Toàn bộ UI tiếng Việt tự nhiên; metadata có ký hiệu phân cách gọn (`T16 · 166 phút · Khoa học viễn tưởng`).
- Footer là thông tin hữu ích từ phạm vi thật; không bịa số hotline, email, địa chỉ văn phòng hay chứng nhận.

---

# 4. GIẢI PHẪU ẢNH THAM CHIẾU — TRỌNG TÂM BẮT BUỘC

**Ảnh gốc người dùng gửi:** một collage của website điện ảnh desktop nền tối. Nửa trái nổi bật một Hero phim Spider-Man, menu phủ trên ảnh, khối CTA và play trailer. Dưới Hero là thanh ngày dạng segmented tabs, các hàng poster phim nhỏ gọn, rồi khu vực phim thiếu nhi. Nửa bên phải là continuation: thêm poster, các tile thể loại, footer tối. Đây **không** phải một screenshot duy nhất chụp toàn bộ một trang ở cùng một điểm scroll; phải **tái tạo bố cục và nhịp**, không cố copy tỷ lệ pixel/ghép collage thành một trang thật.

## 4.1. “DNA” phải nhận diện được trong screenshot CinemaStar mới

1. **Hero như một khung cảnh phim**, chiếm phần lớn viewport đầu tiên. Tác phẩm đang nổi bật là chủ thể, không phải stock landscape vô danh.
2. **Header/navigation tối hoặc bán trong suốt** đặt trong tầng trên của Hero, chuyển về solid/darker khi scroll để bảo đảm contrast.
3. **Text block nằm bên trái Hero:** eyebrow ngắn → tên phim lớn → một hoặc hai metadata rows → mô tả ngắn 2–3 dòng → primary red **“Đặt vé”** → secondary **“Chi tiết”** / **“Xem trailer”** chỉ khi có trailer hợp lệ.
4. **Hình ảnh chiếm phần phải Hero**; overlay gradient chuyển tối về bên trái/dưới để đỡ chữ. Không dùng ảnh poster crop làm chủ thể bị cắt đầu; nếu chỉ có portrait poster, dùng bố cục split composed art (poster rõ ở phải, nền blur từ chính ảnh *cùng phim*) thay vì hiển thị ảnh phim khác.
5. **Date rail/tab** đặt ngay bên dưới Hero hoặc một phần overlap nhẹ với chân Hero; có ngày và thứ chính xác, today/selected rõ. Chỉ hiển thị các ngày hợp lệ theo suất có nguồn API hoặc trình duyệt ngày để dẫn tới lọc thật.
6. **Các hàng poster dày dặn:** ảnh phim tỷ lệ 2:3, tên phim, metadata rất ngắn, CTA đặt vé có liên hệ với suất chiếu. Heading section có link “Xem tất cả →”, nhưng link luôn hoạt động.
7. **Phân vùng bằng editorial rhythm:** “Phim đang chiếu”, “Sắp chiếu” nếu có thật, “Khám phá thể loại” khi dữ liệu genres có sẵn, “Rạp nổi bật/gần bạn” chỉ khi xác định được theo dữ liệu hợp lệ. Không ép “For kids” nếu không có phân loại/genre từ DB.
8. **Tile thể loại** dùng typography, poster thật đã liên quan genre (nếu được phép và data mapping), không dùng icon đỏ giả định hoặc con số “80+ movies” tự bịa.
9. **Footer tối tích hợp tổng thể**, thay vì thanh trắng 50px đơn độc.
10. **Độ sâu thị giác** xuất phát từ artwork + layout + scale + contrast. Không có 6 thẻ chức năng cùng màu/chiều cao cho mọi đoạn.

## 4.2. Layout desktop mục tiêu (không phải HTML mockup)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  CINEMASTAR        Phim    Rạp chiếu    Lịch chiếu*      Tìm kiếm      Đăng nhập / Avatar │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  FEATURED MOVIE                                      ███████████████████████████████  │
│  TÊN PHIM NỔI BẬT                                    █   ARTWORK ĐÚNG PHIM, RÕ   █  │
│  T16  ·  166 phút  ·  Sci-fi                         █    CHỦ THỂ, NỀN ĐIỆN ẢNH  █  │
│  Mô tả ngắn vừa đủ để chọn phim...                   ███████████████████████████████  │
│  [ ĐẶT VÉ ] [ XEM CHI TIẾT ] [ TRAILER nếu có ]                                  HERO    │
│  ╲ gradient tối                       cinematic image cover                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  LỊCH CHIẾU  [Hôm nay 12/10] [Ngày tiếp theo...]  [Chọn rạp*]  [Xem suất]              │
│  (chỉ dựng dạng chọn nhanh nếu API có dữ liệu phù hợp; không có thì dùng section link) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PHIM ĐANG CHIẾU                                                      Xem tất cả →     │
│  [poster]   [poster]    [poster]    [poster]    [poster]    [poster]                    │
│  Title · T16 · Duration             mỗi card có interaction rõ, không overloaded       │
│                                                                                        │
│  SẮP CHIẾU (nếu status thật cho phép)                                  Xem tất cả →     │
│  [poster]   [poster]    [poster]    [poster]    [poster]    [poster]                    │
│                                                                                        │
│  CHỌN RẠP CHIẾU                                                    Khám phá rạp →     │
│  [Rạp: ảnh thực/ảnh fallback]  [Tên - địa chỉ]   [Khác ...]                            │
│                                                                                        │
│  KHÁM PHÁ THEO THỂ LOẠI (chỉ những genre có dữ liệu)                                 │
│  [Hành động]   [Hoạt hình]   [Kinh dị]   [Tâm lý]   ...                               │
│                                                                                        │
│  FOOTER: CINEMASTAR / PHIM / RẠP / ĐƠN CỦA BẠN / HỖ TRỢ / COPYRIGHT                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

`*` Bộ chọn lịch chiếu/rạp ở header hoặc toolbar là **tùy thuộc endpoint hiện có**. Không thêm menu/chip giả chỉ vì reference screenshot có.

## 4.3. Điểm khác biệt chủ đích so với ảnh gốc

- Ảnh gốc dùng **đỏ hồng + tím** ở button; CinemaStar dùng **đỏ CinemaStar + charcoal**, purple chỉ nên dùng nếu metadata/tình huống đặc biệt thật sự cần, **không** tạo ba màu CTA cạnh tranh nhau.
- Ảnh gốc mỗi card có rất nhiều nút nhỏ; phiên bản mới ưu tiên **1 CTA mua vé + 1 action chi tiết** có kích thước chạm đủ; có thể đặt CTA trong overlay khi hover và hiển thị thường trực trên mobile.
- Không quảng bá nội dung Disney, Marvel, Spider-Man như tài sản sở hữu của CinemaStar: ảnh gốc chỉ là nguồn hình thức, dữ liệu phim thật lấy từ hệ thống.
- Không nhét hàng “For kids” nếu không có genre, không gắn tuổi phim sai, không tạo đánh giá sao hay số vé từ hư cấu.

---

# 5. CHIẾN LƯỢC HÌNH ẢNH, LICENSE VÀ DATA-DRIVEN MEDIA — GATE RẤT QUAN TRỌNG

## 5.1. Phân biệt 3 loại ảnh

| Loại | Nguồn dữ liệu / nơi lưu | Quy định |
|---|---|---|
| Poster/backdrop của **phim cụ thể** | **URL trường media hiện có ở CSDL**, đi qua API; xem contract trước khi mapping | URL phải đúng phim. Không thay bằng stock trang trí. Không hardcode mapping `movieId → ảnh` trong JSX. Nếu thêm backdrop DB field cần approval riêng, không tự migration. |
| Ảnh **rạp cụ thể** | **URL từ DB/API rạp hoặc endpoint ảnh rạp hiện có** | Phải đúng rạp hoặc fallback trung tính; không dùng cùng ảnh như thể 3 rạp là cùng cơ sở. Không phá image ownership guard. |
| Ảnh **trang trí tĩnh không gắn bản ghi** (texture rạp, ambient cinema, background auth) | File trong `frontend/src/assets/` hoặc `public/assets/` theo cấu trúc repo | Cho phép từ Pexels/Unsplash hoặc thư viện khác có bằng chứng license; tối ưu thành WebP/AVIF khi phù hợp; ghi nguồn trong manifest. |

## 5.2. Nguồn stock hợp lệ, không suy diễn quyền poster

- [Unsplash License](https://unsplash.com/license): cho phép nhiều mục đích thương mại; phải đọc các giới hạn về quyền con người, nhãn hiệu, nội dung được bảo hộ.
- [Pexels License (Tiếng Việt)](https://www.pexels.com/vi-vn/license/): ảnh/video được phép sử dụng cho nhiều mục đích thương mại, có hạn chế như ngụ ý xác nhận thương hiệu và phân phối lại.
- [TMDB FAQ](https://developer.themoviedb.org/docs/faq): API miễn phí ở mục đích phi thương mại với điều kiện ghi nguồn; sử dụng thương mại cần liên hệ/license phù hợp. [TMDB image URL basics](https://developer.themoviedb.org/docs/image-basics) hướng dẫn dựng URL, **không phải giấy phép quyền thương mại cho poster**.
- **Poster phim, key art, trailer, hình diễn viên/nhân vật** thường có quyền sở hữu của hãng phát hành/đơn vị liên quan. Việc tải được ảnh hoặc biết URL **không đủ** để coi là được sử dụng thương mại. Chủ dự án cho phép tìm/tải, nhưng vẫn phải tôn trọng quyền của bên thứ ba. Nếu chưa có cơ sở quyền sử dụng, ghi `LICENSE_REVIEW_REQUIRED`, giữ URL hiện có hoặc placeholder, không tự upload lên repository để phân phối.

## 5.3. Quy trình kiểm soát asset

1. Quét tất cả URL ảnh dữ liệu hiện có: có thể truy cập không, đúng nội dung không, có bị broken/CORS/hotlink block không; ghi tình trạng per asset và nguồn cung cấp nếu xác định được.
2. **Đừng sửa DB hàng loạt** khi chỉ được giao làm UI. Nếu nguồn poster đang sai trong data, tạo `MOVIE_MEDIA_CORRECTION_REPORT.md` ghi mã/tên phim/URL hiện tại/vấn đề/nguồn đề xuất/license rồi xin phép hoặc theo quy trình seed/migration dữ liệu hiện có của nhóm.
3. Nếu có trường poster URL, hiển thị đúng URL; nếu thiếu backdrop riêng, Hero dùng một bố cục đẹp với poster cùng phim + vignette. Không tự sinh URL trên domain chưa xác minh.
4. Với ảnh trang trí tĩnh: tìm asset chất lượng thật sự phù hợp (rạp tối, ánh đèn chiếu, hàng ghế, auditorium, popcorn nếu dùng đúng ngữ cảnh), tải về `assets/cinema/`, tối ưu dung lượng; không dùng ảnh stock lạc chủ đề như lâu đài, hoa, bầu trời để minh họa phim.
5. Ghi `docs/design/CINEMASTAR_ASSET_MANIFEST.md`: tên file, nguồn, tác giả, ngày kiểm tra, license, mục đích, bằng chứng link, file tối ưu. Không dùng link `images.unsplash.com` ngẫu nhiên trỏ đến ảnh không cố định trong runtime nếu muốn sản phẩm ổn định.
6. Khi ảnh lỗi: container duy trì aspect ratio và chiều cao; fallback nền dark với chữ `CinemaStar` và tên phim/rạp, alt phù hợp. **Không giả poster bằng icon emoji hoặc gradient kỳ ảo**.
7. Với `img` poster below fold: `loading="lazy"`, `decoding="async"`, `width`/`height`, `object-fit: cover`; Hero LCP có `fetchPriority="high"` khi thích hợp, không lazy load ảnh Hero.
8. Không dùng stock ảnh cho card giả về phim, không bịa poster ghép mặt hoặc vẽ người nổi tiếng mới, không dùng “AI generated poster” thay phim hiện có.

---

# 6. KIẾN TRÚC IMPLEMENTATION VÀ ISOLATION

## 6.1. Giữ ứng dụng, chỉ thay presentation ownership

React app, routing, auth và REST services đã có phải được tái sử dụng. Mẫu tổ chức **tham khảo, không bắt buộc rename repo**:

```text
frontend/src/
  layouts/
    PublicShell.jsx                 # dark public theme boundary
    StaffShell.jsx                  # READ-ONLY, không sửa
  features/public/
    home/{HomePage,FeaturedBillboard,DateRail,FilmRail,...}
    movies/{MovieListPage,MovieDetailPage,MoviePosterCard,ShowtimePicker}
    cinemas/{CinemaListPage,CinemaDetailPage,CinemaCard}
    booking/{BookingPage,SeatMapPanel,FoodPicker,PromotionField,OrderSummary}
    orders/{OrdersPage,OrderDetailPage,PaymentPage}
    account/{LoginPage,RegisterPage,ProfilePage,AccountPage}
    complaints/{ComplaintListPage,ComplaintDetailPage,ComplaintForm}
    reviews/{ReviewPanel}
  components/public/
    CinematicButton, PublicModal, PosterImage, StatusPill,
    SectionHeader, EmptyScene, AsyncFeedback, FilmMeta, DateStrip
  styles/public/
    public-tokens.css
    public-shell.css
    public-home.css
    public-components.css
    public-forms.css
    public-booking.css
  services/                            # GIỮ API clients đang có
  assets/cinema/                       # chỉ static assets được phép
  tests/public/
```

**Không dùng một file CSS 3000 dòng để “sửa toàn bộ UI”.** Ưu tiên component-level CSS Module hoặc scoped stylesheet theo ownership đang có. Không ép chuyển Tailwind, shadcn, Material UI, animation library mới trừ khi repo đã dùng và thực sự cần.

## 6.2. Theme boundary không ảnh hưởng staff

Ví dụ cấu trúc:

```jsx
export function PublicShell({ children }) {
  return (
    <div className="cinema-public" data-cinema-theme="dark">
      <PublicHeader />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </div>
  );
}
```

**Mã trên chỉ là minh họa**; dùng router/outlet thực tế nếu app hiện có. Yêu cầu:

- Toàn bộ CSS public scoped dưới `.cinema-public` hoặc CSS Modules; **tránh selectors `button`, `a`, `h1`, `main`, `input` không scope**.
- Nếu dialog/portal render ngoài `PublicShell`, truyền theme class/dataset vào portal container **riêng**, không gắn global class vĩnh viễn lên `body`.
- `color-scheme: dark` chỉ trên vùng Public. Control native (calendar/date input/select) phải kiểm tra trên Windows/Chrome.
- Không chỉnh biến `--primary`, `--surface`, `--page-bg` hiện staff dùng chung. Nếu có biến trùng tên, đổi sang `--cp-*`.
- Shared components nếu cần thay props/style mặc định thì chỉ mở `variant="cinematic"` hoặc wrapper Public, giữ defaults staff nguyên vẹn.
- Kiểm thử staff trước/sau ở cùng viewport và fixture.

## 6.3. Data mapping không thêm logic nghiệp vụ

- Component View chỉ nhận **domain view model nhẹ**: `movie.id`, `movie.title`, `movie.posterUrl`, `movie.status`, `movie.duration`, `movie.genres`, `movie.ageRating`, `movie.synopsis`, `movie.showtimes` **chỉ nếu API trả**. Không đoán property bằng tên giả rồi hiển thị `undefined`.
- Nếu dữ liệu không có poster landscape, chọn presentation variant với portrait poster; không sửa API để thêm field vì mục tiêu aesthetics.
- `MovieCard` không tự quyết định phim “HOT” dựa trên danh sách index đầu; badge có căn cứ field real hoặc nhãn editor được chốt đúng nguồn.
- `ShowtimePicker` dùng dữ liệu từ API hiện có; “phim sắp chiếu” không tự sinh showtimes; không hiển thị vé có sẵn khi source chưa xác nhận.
- Data `empty/loading/error/notFound/forbidden` là trạng thái riêng. **Không bao giờ nuốt 403/500 thành mảng rỗng**.
- Không yêu cầu backend raw SQL, không thêm ORM, không tự tính authoritative price, discount, seat hold, trạng thái thanh toán.

---

# 7. ĐẶC TẢ CHI TIẾT: TRANG CHỦ `/` — ƯU TIÊN SỐ 1

## 7.1. Thứ tự section bắt buộc

```text
01. Transparent cinematic header
02. Full-width featured movie Billboard / Hero
03. Lịch chiếu nhanh hoặc date rail liên kết tới lịch chiếu thật (nếu contract cho phép)
04. Phim đang chiếu (rail/grid)
05. Sắp chiếu (nếu có trạng thái tương ứng)
06. Rạp chiếu CinemaStar (đúng dữ liệu rạp)
07. Khám phá theo thể loại (theo genre có dữ liệu)
08. Footer tối có điều hướng hữu ích
```

Có thể gộp/ẩn section **khi API không có nội dung**, nhưng không thay section rỗng bằng đồ họa thừa hoặc nội dung fabricated. Đừng dựng “3 bước đặt vé” thành 3 hộp chiếm nửa trang như UI cũ; chỉ giữ khi cần hỗ trợ người mới và thiết kế rất gọn.

## 7.2. Header / Navigation

- Logo CinemaStar bên trái, nav `/movies`, `/cinemas` và một entry lịch chiếu **nếu đã có route/anchor hoạt động**; search mở overlay hoặc dẫn đến trang phim với query, không dựng icon vô tác dụng.
- Guest: đăng nhập/đăng ký; Customer: avatar/name menu gồm tài khoản, đơn của tôi, khiếu nại, đăng xuất **chỉ từ state auth hiện có**. Staff đăng nhập route shared phải điều hướng đúng role, không ép quay về public.
- Khi ở đầu Hero: header tối bán trong suốt; khi scroll: solid charcoal, border bottom rất mờ; không làm flicker hoặc che nội dung.
- Desktop height tham khảo 72–80px; mobile 60–64px, hamburger accessible; `aria-expanded`, Escape, focus management.
- Active nav tinh tế bằng text/underline indicator, không pill xanh kiểu dashboard.

## 7.3. Featured Billboard / Hero — phần bắt buộc phải được chăm chút thủ công

**Chọn một phim featured có thật** từ danh sách phim mà API đang trả, ưu tiên đang có suất hợp lệ nếu dữ liệu hỗ trợ. Không pin một phim seed hư cấu. Không chọn “top rated” nếu API không có rating. Tác phẩm hiển thị không được biến mất bất ngờ khi refetch.

- Desktop min-height thích ứng khoảng 560–680px (trừ header), responsive theo viewport; Mobile khoảng 440–560px hoặc content-first, không dùng 680px cứng làm mất CTA.
- Left content max-width khoảng 520–610px, bottom/left aligned; metadata, synopsis max 2–4 dòng; heading tối ưu tên phim dài tiếng Việt.
- Banner/backdrop thực nếu API có; nếu không, **portrait composition**: ảnh cùng phim ở 45–50% bên phải, phía trái texture/blur từ cùng poster với overlay, tránh crop poster vào các mặt hoặc chữ phim bị cắt.
- Layering `image → dark linear-gradient left → bottom vignette → text` và secondary subtle edge light; tránh neon, blur quá mạnh, stock fantasy.
- CTA primary: **“Đặt vé”** dẫn tới chọn suất nếu chưa xác định; chỉ đi thẳng `/booking/:showtimeId` nếu showtime ID hợp lệ đã chọn. Không tạo URL `undefined`.
- CTA secondary: **“Chi tiết phim”**. Trailer là optional, chỉ có khi link/trailer field thật, mở modal có close/Escape/focus và policy autoplay hợp lý; không tự tìm URL YouTube rồi gắn phim sai.
- Nếu không có phim: hiển thị Hero editorial đẹp với thông điệp **“Chọn một bộ phim cho buổi hẹn tiếp theo”**, nút xem phim, hình nền ambience cinema stock hợp lệ và được định danh **không phải ảnh phim**, không giả phim featured.
- Chuyển billboard carousel **chỉ khi có tối thiểu 2 phim đủ media và business reason**; nếu carousel thì tối đa 3–5 slide có dots và control, dừng tự chuyển khi hover/focus, hỗ trợ reduced motion; đơn giản hơn là một Hero tốt.

## 7.4. Date rail / lịch chiếu nhanh

Ảnh mẫu có thanh thứ/ngày đặt dưới Hero. Đây là pattern đáng giữ nhưng **không làm lịch giả**.

- Nếu API hỗ trợ lấy suất theo ngày/cinema/movie, hiển thị thanh khoảng 7 ngày được generate đúng locale Việt và timezone. Chọn ngày thực sự filter showtimes hoặc dẫn đến phim/lịch phù hợp.
- Chọn phim → rạp → ngày → suất **chỉ khi** endpoint hỗ trợ các lựa chọn phụ thuộc; đổi cha reset con; không giữ selected showtime của phim/rạp khác.
- Nếu API **không hỗ trợ** quick booking toàn trang, chỉ hiển thị liên kết “Xem lịch chiếu” đến movie detail (không render fake date buttons).
- Không hiển thị những ô thời gian giả, thông báo rõ `Chưa có suất chiếu trong ngày này` khi API kết quả rỗng.

## 7.5. Film rails

- Heading trái: `Đang chiếu`; trái hoặc góc phải “Xem tất cả →” có route hoạt động. Rail có poster 2:3; nội dung card compact: title (max 2 dòng), phân loại và duration; hero không dùng poster gradient giả.
- Desktop rail cuộn ngang có điều khiển prev/next bên ngoài poster hoặc dùng snap; **không bắt người dùng kéo chuột drag để cuộn**. Focus keyboard di chuyển hợp lý, arrow keys nếu phù hợp.
- Hover tối ưu: ảnh scale nhẹ ~1.025–1.05, shadow vừa phải, overlay đưa “Đặt vé / Xem chi tiết” vào vùng không che title; tránh overlay jump làm đổi width các card; mobile luôn hiển thị hành động có thể tap.
- Card image cần fallback cùng chiều cao, không gây layout shift, link title rõ. Không gạch chân link xanh mặc định trên UI dark.
- Phân loại `Đang chiếu`/`Sắp chiếu` phải dựa vào trạng thái thật; tránh lấy tất cả phim rồi gắn heading sai.
- Không dựng hàng `Top 10`, `Hay nhất 2026`, `Được yêu thích`, `Hơn 5000 lượt xem` nếu chưa có cơ sở dữ liệu để xếp hạng.

## 7.6. Cinema showcase và genre

- Rạp: 2–3 card landscape theo rạp thật; thông tin: tên, thành phố (nếu field có), địa chỉ ngắn, CTA xem lịch chiếu; không hiển thị số hotline/đánh giá giả; ảnh rạp đúng bản ghi.
- Genre: danh mục thật `THELOAI` qua API, render 4–6 tile/row; style typography/editorial, có film poster làm nền tile khi mapping legitimate; số phim chỉ khi count lấy từ tập dữ liệu đầy đủ hoặc API đúng contract.
- Mỗi tile dẫn tới `/movies` với filter tương ứng nếu route hiện hỗ trợ; không có thì dẫn tới trang Movies có filter đã chọn qua state/router phù hợp.
- Thiết kế trang chủ phải **gây ấn tượng dù chỉ có 4 phim và 3 rạp** trong dữ liệu seed hiện tại. Với dataset nhỏ, dùng grid đều và poster lớn vừa, không tạo slider với nút next không hoạt động.

---

# 8. TRANG DANH SÁCH PHIM `/movies`

**Mục tiêu:** một trang khám phá phim có hình thức thương mại, không phải form filter + bốn card trắng cao bằng nhau.

- Hero của listing **nhỏ và khác homepage**: tiêu đề editorial `Phim tại CinemaStar`, mô tả một câu, có poster collage rất tiết chế từ dữ liệu thật hoặc solid dark. Không nhân bản billboard ở mọi trang.
- Toolbar tinh gọn: ô tìm kiếm, genre selector, trạng thái (nếu có), `Xóa lọc`, kết quả count khi API có; không lặp breadcrumb thừa nếu menu đủ rõ.
- Desktop grid 5–6 poster tùy width; mobile 2 cột, tablet 3–4; mỗi poster đủ lớn để đọc tên; đồng bộ component với homepage.
- Có rõ `Đang chiếu`/`Sắp chiếu` nếu metadata hợp lệ; phim chưa có suất chiếu dùng `Chi tiết`, không render `Đặt vé` rồi fail.
- URL query cho search/filter không nhạy cảm; back/forward và refresh giữ state; không filter sai trên 1 trang của server pagination như toàn bộ dữ liệu.
- Empty state có ý nghĩa: `Không tìm thấy phim phù hợp`, CTA `Xóa bộ lọc`; error state có retry; skeleton theo poster shape.
- Keyboard, focus và target size; image fallback không méo.

---

# 9. TRANG CHI TIẾT PHIM `/movies/:movieId`

**Mục tiêu:** nơi chuyển từ cảm hứng sang chọn suất chiếu.

Desktop:

```text
FILM HERO / BACKDROP
  Poster 2:3   Tên phim lớn
               T16 · Thời lượng · Thể loại · ngày khởi chiếu (nếu API có)
               Tóm tắt/diễn viên/đạo diễn (chỉ field thật)
               [Chọn suất chiếu] [Trailer nếu có]
------------------------------------------------------------
LỊCH CHIẾU
  [Ngày ...]  [Rạp ...]   --> mỗi cụm rạp: [10:30] [13:50] [18:20]
------------------------------------------------------------
GIỚI THIỆU PHIM / THÔNG TIN
ĐÁNH GIÁ KHÁCH HÀNG (theo API và eligibility)
```

- Backdrop nếu thiếu phải có poster-based composition nhưng không làm sai ngữ cảnh phim.
- Ngày/giờ thực, local timezone nhất quán, có format 24h tiếng Việt; time button cho showtime phải chứa id thật và trạng thái đặt được.
- Chuyển đổi filter rạp/ngày reset selection; chọn suất mới mới đi booking tương ứng, không mang `showtimeId` stale.
- Mô tả đầy đủ, nhưng tránh text block quá rộng (max 70–85 ký tự/dòng).
- Review UX: list review/rating từ DB, input sao/nội dung chỉ mở khi có eligibility theo server; chưa xem/đã đánh giá thì giải thích đúng, không cho submit ở client để “thử” bypass guard.
- Phân biệt rating khách hàng nội bộ với age rating, không nhầm `T18` thành 18 sao hay hư cấu điểm IMDb.

---

# 10. RẠP `/cinemas` VÀ `/cinemas/:cinemaId`

## 10.1. Cinema list

- Heading editorial, search tên/địa chỉ; city filter nếu API có.
- Card **landscape** tỷ lệ khoảng 16:9 với ảnh rạp riêng nếu có; thông tin tên rạp, địa chỉ, city và CTA `Xem rạp & lịch chiếu` **đặt sau thông tin, ở vị trí thống nhất**.
- Không có ba card cùng ảnh auditorium giống hệt mà trình bày như ảnh từng cơ sở; fallback ảnh generic phải có style nhận biết là ảnh minh họa.
- Responsive grid 3/2/1 cột theo width và nội dung; card không cao vô nghĩa, text không cắt đường tên.
- Không ép bản đồ, đánh giá sao hoặc khoảng cách “3km” khi API không có vị trí/consent.

## 10.2. Cinema detail

- Header ảnh landscape thật hoặc fallback neutral, tên rạp/địa chỉ/điện thoại nếu contract có (chỉ link tel khi hợp lệ).
- Phần chính là **lịch chiếu tại rạp**: chọn ngày, phim, giờ nếu endpoint hỗ trợ; group by movie hoặc time dựa trên data thật.
- Thông tin mô tả và media của rạp thứ cấp. Từ đây chọn một suất hợp lệ chuyển tới booking.
- Ảnh rạp gallery nếu đã có endpoint; không mở rộng backend để đạt ảnh đẹp, bảo vệ stale request/ownership guard.

---

# 11. BOOKING `/booking/:showtimeId` — UI TỐI ƯU NHƯNG GIỮ BUSINESS TRUTH

**Đây là trang critical nhất về nghiệp vụ. Không chỉ thay CSS sơ đồ ghế.**

## 11.1. Bố cục

- Desktop bố cục **main 2/3 + sticky summary 1/3**: trên main có mini heading phim/rạp/phòng/ngày giờ, seat map ở trung tâm; sản phẩm và khuyến mãi sau khi có selection; summary ở bên phải.
- Mobile: tuần tự `suất → ghế → đồ ăn → khuyến mãi → summary`; có thanh sticky bottom với tổng **dữ liệu server/preview được ghi nhãn rõ** và nút tiếp tục, không che controls.
- Progress indicator nếu nhiều bước thật, không tạo 4 bước wizard chỉ để trang trí.
- Primary red đặt đúng vị trí, button loading lock chống double-submit.

## 11.2. Sơ đồ ghế

- Màn hình (screen arc/bar) ở phía trên map, được ghi `MÀN HÌNH`; hàng ghế đúng thứ tự DB; seat label A01/B05... thật. Nếu DB không có lối đi/toạ độ, **không tự sáng tác sơ đồ rạp vật lý**; grid theo hàng chính xác.
- Legend: còn trống / đang giữ / đã bán / đang chọn / không hoạt động, **chỉ trạng thái API thật trả**; hình dạng+label không chỉ phụ thuộc màu.
- Seat selection dùng state keyed by showtime; khi đổi suất/refresh không giữ ghế cũ.
- 409 seat conflict: thông báo rõ và reload availability, bỏ selection invalid, yêu cầu chọn lại; không giả vờ đặt thành công.
- Bàn phím sử dụng được, aria label chứa ghế và trạng thái; mobile có khả năng scroll/zoom mà không co bé ghế dưới ngưỡng chạm.

## 11.3. Sản phẩm, khuyến mãi, tiền

- Food/product cards có ảnh nếu asset đúng source, tên, giá snapshot/giá hiện tại theo API, số lượng và trạng thái; không dựng sản phẩm giả.
- Promotion validate chỉ là **preview**, booking SP quyết định cuối cùng. Nếu mã người dùng chọn bị hết hạn/hết quota trong lúc confirm phải hiển thị 409 phù hợp và yêu cầu xác nhận lại; **không âm thầm áp đơn giá đầy đủ**.
- Tổng tiền chốt từ booking/order response, không tính ở React làm nguồn sự thật; trường hợp UI preview thì ghi rõ `Tạm tính`/`Giá cuối xác nhận khi tạo đơn`.
- Hold deadline/countdown lấy từ server contract; hết hạn/đổi suất reset đúng, không tự tưởng tượng thời gian 10 phút.

## 11.4. Thành công / thất bại / liên kết payment

- Chỉ hiển thị “Đặt vé thành công” sau khi server xác nhận đúng trạng thái. Nếu đơn còn giữ/chờ thanh toán thì message là `Đã tạo đơn, chờ thanh toán`, không phải đã nhận vé thanh toán thành công.
- Không retry POST booking/payment tự động khi timeout chưa biết trạng thái server. Khôi phục bằng tra cứu status nếu API hiện có; nếu thiếu thì hiển thị hướng dẫn kiểm tra đơn, không gửi trùng.
- Không thay đổi amount, discount, booking scope, request identity.

---

# 12. THANH TOÁN, ĐƠN HÀNG, TÀI KHOẢN, KHIẾU NẠI

## 12.1. `/orders`, `/orders/:orderId`, `/orders/:orderId/payment`

- Dark customer account layout gọn, ưu tiên dữ liệu nghiệp vụ thật. Không copy homepage poster grid vào trang transaction.
- Order list: mã đơn, poster thumbnail phim đúng bản ghi nếu API có, tên phim, suất, rạp, số ghế, trạng thái, số tiền trả; filter theo trạng thái/ngày nếu API có; không lộ technical ID trừ mã nghiệp vụ để tra cứu.
- Order detail: summary phim/rạp/giờ/ghế → chi tiết vé → đồ ăn → khuyến mãi → tổng authoritative → payment attempts/timeline nếu API có. Trạng thái `Chờ thanh toán`, `Đã thanh toán`, `Thất bại`, `Hết hạn`, `Đã hủy` được map đúng enum server; không invent state label sai.
- Payment: lựa chọn phương thức đúng contract, summary sticky, hạn thanh toán nếu có, error/retry hợp lệ. Không bắt nhập số thẻ giả, không nhúng payment gateway thật nếu dự án chỉ mô phỏng.
- Mọi route ownership của khách phải được server giữ; UI không hiển thị dữ liệu đơn của Customer khác.

## 12.2. `/login`, `/register`

- Thay card white-blue hai cột cũ bằng **cinematic auth split**: form trên mặt dark surface đọc rõ; bên cạnh là ảnh ambience cinema **stock có license**, gradient overlay rất nhẹ, một câu value proposition ngắn. Ở mobile chỉ hiển thị form, không làm ảnh chiếm cả màn hình.
- Form login email/password, ẩn/hiện mật khẩu, helper/error inline, submit loading, hỗ trợ route đăng ký. Form register theo field API đang có; optional fields có thể group nhưng **không bỏ field bắt buộc trong contract**.
- `*` nằm sát label không rơi xuống dòng riêng; hint mật khẩu giải thích dễ hiểu nhưng validate chuẩn byte nếu API yêu cầu; ngày tháng hiển thị phù hợp locale Việt khi có thể.
- Auth error 401 khác network error; chống double-submit, focus vào trường lỗi đầu; không logout staff sau redirect do UI state race.
- Không tạo Social Login, Forgot Password, OTP nếu backend chưa hỗ trợ. Đường dẫn `Quên mật khẩu` chỉ xuất hiện khi feature thật tồn tại.

## 12.3. `/account`, `/profile`

- Customer dashboard thiết kế như hồ sơ cinema member tinh gọn: tên, thông tin liên hệ, form cập nhật và link đơn/khiếu nại. Điểm tích lũy chỉ nếu DB/API có, không tự tạo bảng perks.
- Trạng thái sửa/lưu/thất bại rõ; role read-only; update profile không tạo dữ liệu cho staff sai nghiệp vụ.
- Không lộ token, password, role permission internal; field ngày sinh/giới tính xử lý optional hợp đồng hiện hành.

## 12.4. `/complaints`, `/complaints/:complaintId`, review

- Complaints list: mã/tiêu đề/trạng thái/ngày, CTA `Gửi khiếu nại`; create form có loại, tiêu đề, nội dung, đơn liên quan **tùy chọn**, không bắt buộc gắn với order. Khi có lookup, chọn đơn qua mã dễ hiểu chứ không raw ID.
- Chi tiết: nội dung, trạng thái, lịch sử xử lý/timeline chỉ khi API có; không tự tạo reply của CSKH giả.
- Dark design cần phù hợp tác vụ đọc/viết dài: surface vừa, form width 600–760px, ít distraction, thông báo status rõ.
- Review phim dùng dữ liệu/eligibility server; không cho user review duplicate, không hiện sao giả làm tổng điểm hệ thống.

---

# 13. CÁC COMPONENT THIẾT YẾU VÀ UX CONTRACT

| Component | Trách nhiệm UI | States bắt buộc | Anti-pattern cấm |
|---|---|---|---|
| `FeaturedBillboard` | Hero poster/backdrop đúng phim + CTA | loading, media-fallback, empty, success | generic marketing hero unrelated movie |
| `PosterImage` | aspect ratio ổn định, alt, fallback | loaded, loading, failed | stock thay poster phim, aspect méo |
| `MoviePosterCard` | poster + title + meta + CTA | hover, focus, no-showtime | white rectangular generic card cao |
| `DateStrip` | ngày/thứ đúng locale và dữ liệu | active, unavailable, loading | ngày giả, button không chạy |
| `ShowtimePicker` | rạp/film/ngày/suất thật | empty, loading, 409, stale | giữ showtime khác phim khi đổi filter |
| `CinemaCard` | ảnh và thông tin rạp thực | image-fallback, long-title | CTA giữa metadata |
| `SeatMapPanel` | lựa chọn ghế cho suất thật | free, held, sold, selected, disabled, conflict | visual map không khớp row/seat DB |
| `OrderSummary` | tổng server/preview clearly labeled | pending, expired, success, error | chốt giá ở JS |
| `PublicFormField` | label/helper/error/focus | idle, invalid, disabled, loading | dấu sao một dòng riêng, placeholder làm label |
| `AsyncFeedback` | loading/error/empty/retry | 401/403/404/409/422/500 | che lỗi thành “chưa có dữ liệu” |
| `PublicDialog` | trailer/confirm khi có nghĩa | open/close/Escape/focus return | modal không focus/không đóng |
| `PublicHeader` | nav guest/customer, mobile menu | top, scrolled, active, menu-open | đổi nav staff |

**Component contract:** props và type/schema thực tế, events, owner của async state, reset policy, semantic HTML, keyboard, test IDs. Dùng `<a>` cho navigation và `<button>` cho action. Không dùng `div onClick` làm control quan trọng.

---

# 14. “ANTI AI-GENERATED DESIGN” — QUY TẮC CỨNG ĐỂ THOÁT GIAO DIỆN RẬP KHUÔN

Đây là chất lượng **phải kiểm bằng screenshot**, không chỉ bằng source:

## Cấm tuyệt đối

1. **Không dùng generic SaaS dashboard layout** cho website công chúng: một `<main>` max-width 1100, background `#f8fafc`, card trắng border xanh, bốn ô thống kê nằm đầu trang.
2. **Không dùng gradient trang trí chung chung** kiểu tím/xanh/cyan trên mọi section; Hero gradient chỉ để đọc chữ/phối ảnh.
3. **Không lấp chỗ trống bằng “3 lợi ích”, “4 bước”, “giá trị cốt lõi” trong các card giống nhau** nếu không có vai trò thật trong hành trình mua vé.
4. **Không render emoji như icon chính**; sử dụng SVG/icon library hiện có đúng nghĩa và nhất quán; icon tối thiểu.
5. **Không lấy stock bất kỳ giả poster** (`Oppenheimer` ≠ lâu đài; `Mai` ≠ ghế rạp; `Conan` ≠ hoa; `Dune` ≠ bầu trời). Đây là issue P0.
6. **Không dùng link màu xanh gạch chân mặc định, không bố trí button vào giữa card rồi mới đến metadata**, không để card có các chiều cao/CTA nhảy vị trí.
7. **Không tự tạo badge “HOT”, rating 9.5/10, vé từ 49k, 80+ phim, phim đề xuất bằng AI, giới hạn còn 2 ghế** nếu DB/API không cung cấp cơ sở.
8. **Không fake trailer hoặc dùng clip phim khác**, không đặt nút `Xem trailer` nếu bấm vào không hoạt động.
9. **Không import ảnh URL random từ Unsplash Source lúc runtime** để trang “tự đẹp”. Asset phải được chọn có chủ đích và tài liệu hóa.
10. **Không lặp cùng Hero trên mọi route**, mỗi trang có density và purpose riêng.
11. **Không dùng hiệu ứng khó chịu**: particles, parallax liên tục, marquee vô hạn, slide auto quá nhanh, hover scale làm dịch bố cục, shadow/glow nặng, glassmorphism phủ toàn trang.
12. **Không chèn dữ liệu test trực tiếp vào JSX production**, không bỏ toàn bộ lỗi/vắng dữ liệu để screenshot luôn đầy.
13. **Không chọn cách sửa nhanh bằng global `*`, `body`, `a`, `button`, `h1` selector** phá staff portal.
14. **Không clone mã nguồn/markup/CSS copyrighted site**; lấy nguyên tắc hình thức từ reference và tái thiết kế riêng.

## Bắt buộc làm bằng tư duy designer thật

- Mỗi trang phải có một **focal point** và hierarchy rõ; màn đầu tiên phải trả lời “tôi có thể xem gì, đặt vé thế nào?”.
- Cân nhắc sự khác biệt giữa **art-heavy discovery** và **transaction clarity**: homepage giàu hình, checkout ít distraction.
- Chọn ảnh theo từng phim/rạp bằng dữ liệu có thật; crop thủ công hợp lý theo ảnh, fallback đẹp.
- Chọn typography theo character của nền tảng phim, đảm bảo dấu tiếng Việt; không rải 5 font.
- Giữ nhịp dày vừa đủ: thay vì khoảng trắng 500px trống, cho người dùng nhanh chóng tới poster và suất chiếu; vẫn có breathing room quanh nội dung chính.
- Component không cần đối xứng 100%: featured movie có thể là landscape editorial, danh sách poster dày hơn, cinema cards rộng hơn, account form hẹp hơn — **bất đối xứng có chủ đích**.
- Tập trung micro-detail: baseline alignment, card crop, hover, focus, showtime pills, badges, text wrapping, sticky summary, empty/loading/error surfaces.
- Không dừng ở “style looks modern”. Bằng chứng là screenshots + flow test + sửa chi tiết từng lần.

---

# 15. RESPONSIVE, ACCESSIBILITY, PERFORMANCE

## 15.1. Breakpoint screenshot bắt buộc

- `390 × 844` mobile (và xem overflow ở 360px nếu có điều kiện)
- `768 × 1024` tablet
- `1280 × 800` laptop
- `1440 × 900` desktop chuẩn
- `1920 × 1080` desktop rộng

Mỗi layout phải screenshot ít nhất homepage, `/movies`, `/movies/:id`, booking, login/register ở các breakpoint đại diện. Tránh horizontal page overflow, Hero cắt tên phim, CTA chìm/che ảnh, bottom sticky che input.

## 15.2. Accessibility

- Đích **WCAG 2.2 AA**; text thường contrast tối thiểu 4.5:1, text lớn 3:1, focus visible và non-text UI contrasts phù hợp. Đo thực tế theo W3C, không chỉ so token.
- Keyboard-only đi xuyên suốt: header/menu, slider, filter, movie card, showtime, seat, dialog, form, checkout.
- `prefers-reduced-motion`: bỏ hoặc giảm auto transitions, parallax/slide, không block interaction.
- Input có label liên kết, thông báo lỗi cạnh field, aria-live vừa đủ, heading đúng hierarchy, skip link đến content.
- 200% zoom không mất tính năng; ảnh có alt mang nghĩa và text không nằm trong ảnh duy nhất.
- Nhãn trạng thái ghế có từ, hình hoặc pattern đi kèm màu.

## 15.3. Performance

- Hero có responsive image đúng size, preload/priority có kiểm soát, tránh làm layout shift; poster dưới fold lazy.
- Nếu ảnh nguồn từ DB quá lớn, sử dụng response format/resizing có sẵn trong hệ thống nếu có; không tự thêm image-proxy backend ngoài scope.
- Không import 1 gallery animation library nặng chỉ để cuộn 4 poster; CSS scroll-snap và control native đủ nếu UI yêu cầu.
- Code split trang nặng khi thật sự có benefit, không preload mọi poster. Không render 20 rails nếu chỉ 4 phim.
- Mục tiêu theo web.dev: **LCP ≤ 2.5s ở p75 khi điều kiện đo hỗ trợ**; báo số đo lab riêng nếu không có dữ liệu p75 thực, không tuyên bố đã đạt field metric bằng một lượt Lighthouse.

---

# 16. QUY TRÌNH TRIỂN KHAI — PHẢI LÀM TỪNG SLICE VÀ KIỂM TRA

**Không triển khai kiểu `rewrite entire app` trong một commit.** Làm từng lát chức năng nhưng **hoàn thành trọn phạm vi**.

## S0 — Audit + Baseline

- Đọc source, route, data contracts, design docs, test fixtures.
- Chụp screenshot trước thay đổi ở 5 viewport đại diện, gồm 3 portal staff bất biến.
- Lập inventory API/URL media và asset license risks.
- Xác nhận app build/test hiện tại (ghi nhận lỗi có trước để không đổ cho redesign).
- Đầu ra: `docs/design/PUBLIC_REDESIGN_AUDIT.md` (gọn, có evidence paths).

## S1 — Public design foundation

- Dark theme scoped, typefaces verified, reset/scoped tokens, poster/media abstraction, primitives, header/footer.
- Kiểm thử staff theme không đổi.
- Không được đổi global design tokens hoặc đổi shared classes phá portal khác.
- Đầu ra: public shell responsive hoạt động.

## S2 — **Home — thực hiện và nghiệm thu riêng trước**

- Featured billboard (đúng ảnh và dữ liệu) → date/quick scheduling theo API → movie rail → cinemas → genres → footer.
- Screenshot desktop/mobile, compare ảnh tham chiếu, chỉnh ít nhất các lỗi: thiếu poster, khoảng trắng, scale typography, image crop, CTA, date actions.
- Khi homepage đạt visual gate mới chuyển S3.

## S3 — Movie and Cinema discovery

- `/movies`, `/movies/:id`, `/cinemas`, `/cinemas/:id`; filter, rail/grid, showtime selection, gallery fallback.
- Kiểm tra luồng `Home → Film detail → Showtime` và `Home → Cinema detail → Showtime`.
- Regression REST contracts/genres/actors/review eligibility.

## S4 — Auth and account

- Login, Register, Account, Profile. Kiểm tra role routing/redirect staff.
- Guard focus/validation/loading/errors, mobile layout, autofill. Không xây auth mới.

## S5 — Booking and checkout

- SeatMap + extras/promo/summary, Orders, OrderDetail, Payment pages.
- Test 409 conflict, hold expiry, customer ownership, price snapshot presentation, failed retry; **không sửa DB logic**.

## S6 — Reviews / Complaints + polish

- Review layout, complaint create/list/detail, empty/error/async states, footer/help.
- Accessibility/performance/browser visual polish của toàn Customer.

## S7 — End-to-end regression và bàn giao

- Full tests, screenshot matrix, compare staff regressions, asset manifest/license blockers, build/lint, kiểm tra domain behavior.
- Nếu QA phát hiện lỗi, sửa và chạy lại; không đánh dấu DONE chỉ bằng ghi chú “đã implement”.

**Nguyên tắc khi gặp BLOCKED:** Nếu sự cải thiện định thêm field/endpoint hoặc đổi SP: tiếp tục các phần có thể làm an toàn bằng contract hiện có, ghi blocker và phương án dự phòng; **không tự triển khai backend/DB ngoài scope**. Nếu thiếu media bản quyền, giữ fallback hợp lệ và report. Không chờ approval cho chỉnh spacing/màu public đã được cho phép.

---

# 17. ACCEPTANCE MATRIX — PHẢI CÓ BẰNG CHỨNG

## 17.1. Visual test (manual + screenshot)

- [ ] **Homepage nhìn ra được DNA ảnh mẫu:** Hero điện ảnh có tiêu điểm; menu phủ, dark palette; film rails; bố cục dày vừa; poster đúng; CTA đỏ; footer tối.
- [ ] Ở viewport 1440×900, không còn UI trắng–xanh cũ hoặc header pill blue trên public.
- [ ] Ở 390×844, Hero không cắt chủ thể/heading/CTA; navigation mobile và film rails dùng được; không overflow ngang.
- [ ] Card phim không còn poster ảnh không liên quan hoặc link HTML xanh gạch chân; ảnh fallback đẹp, nhãn phim đọc được.
- [ ] Card rạp không lặp ảnh rạp sai; metadata và CTA căn đều, không có vị trí nút đứt luồng đọc.
- [ ] Login/register form cân đối, labels và required indicators không tách dòng vô lý; mobile không có cột ảnh chiếm chỗ.
- [ ] Ghế/summary/payment dễ đọc, status dễ hiểu, CTA không lấn nội dung.
- [ ] Admin, Manager và CSKH screenshot tương đồng baseline; CSS public không rò qua staff.

## 17.2. Interaction / business test

- [ ] Guest từ Home → Movie → valid Showtime → Booking; Guest nếu cần đăng nhập được điều hướng với context theo app hiện tại.
- [ ] Customer chọn/bỏ chọn ghế đúng showtime, reload ghế khi conflict 409; không phantom success.
- [ ] Promotion invalid hiển thị 409; không âm thầm đổi tổng authoritative.
- [ ] Booking tạo đơn từ server, trạng thái chờ/đã thanh toán phản ánh đúng server; chống double submit.
- [ ] Order history/detail/payment chỉ truy cập đơn của chính customer.
- [ ] Review eligibility theo server; complaint có thể gửi khi không gắn đơn nếu API hiện tại cho phép.
- [ ] Login/register/profile gửi đúng payload, role staff sau login không bị UI public redirect sai.
- [ ] Không có fake controls, dead-end CTA, `<a href="#">` để “có giao diện”, fake dates, fake prices.
- [ ] Loading/empty/error/notFound/forbidden/status với data/API thật hoặc fixture test có phân biệt.
- [ ] Back/forward, direct reload, URL path dynamic hoạt động; refresh không vỡ state.

## 17.3. Code quality / safety

- [ ] Không có source frontend gọi SQL trực tiếp, không migration/Stored Procedure/backend business modifications.
- [ ] Public CSS isolation đã test; không đổi `StaffShell`/staff class defaults.
- [ ] Ảnh DB giữ URL model, asset tĩnh ở repo và có manifest; copyright blockers được nêu rõ.
- [ ] Không có công thức cộng tổng tiền authoritative mới trong React.
- [ ] Không bỏ test hoặc đổi permission/role/access controls.
- [ ] Build pass, lint pass (hoặc báo lỗi baseline), e2e smoke pass, a11y axe kiểm tra theo phạm vi có thể chạy, screenshot khác nhau có chủ đích.

## 17.4. Test evidence nên lưu (theo cấu trúc repo)

```text
docs/design/
  PUBLIC_REDESIGN_AUDIT.md
  CINEMASTAR_ASSET_MANIFEST.md
  PUBLIC_UI_IMPLEMENTATION_REPORT.md
  PUBLIC_UI_BEFORE_AFTER.md
  media-correction-report.md             # chỉ nếu phát hiện source data sai
artifacts/ui/public-redesign/
  before/{home,movies,cinemas,login,register,...}
  after/{home,movies,movie-detail,cinemas,booking,orders,auth,...}
  staff-regression/{admin,manager,support}
  browser-test-results/...
```

Không bắt buộc tạo hàng trăm file để gây ấn tượng; **bằng chứng cần thật, truy vết được và đúng file đang chạy**. Nếu artifacts không commit theo convention repo, chỉ cần report dẫn đúng đường dẫn của job CI hoặc output thực tế.

---

# 18. ĐIỀU KIỆN NGHIỆM THU THEO TỪNG PAGE

| Trang | Visual DoD | Functional DoD | Điểm kiểm soát |
|---|---|---|---|
| `/` | Hero + rails + dark nav + genre/cinema section có chiều sâu | Các link/CTA có route/suất thật | Không fake featured/showtime, không diagnostic DB |
| `/movies` | Poster grid sắc nét, toolbar gọn | Search/genre/status chính xác | Không giả poster/rating/count |
| `/movies/:id` | Phim là chủ thể, lịch chiếu rõ | Chọn phim→suất hợp lệ→booking | Review eligibility và timezone |
| `/cinemas` | Landscape cinema cards, text/action ổn | Search/filter và detail đúng rạp | Không 3 ảnh giả là 3 rạp |
| `/cinemas/:id` | Cinema banner + showtimes readable | Chọn showtime rạp hiện tại | Image ownership/stale responses |
| `/login` | Auth split cinematic | Login/401/redirect role | Staff login giữ nguyên |
| `/register` | Form hợp lý, responsive | Validation/register customer đúng | Không sửa role đăng ký |
| `/account`,`/profile` | Account layout dark, đọc dễ | Read/save/profile errors | No staff customer profile pollution |
| `/booking/:id` | Seat map và sticky summary xuất sắc | Booking 409/hold/promo/food | Server authoritative |
| `/orders` | Lịch sử giao dịch dễ scan | Chỉ thấy đơn của mình | Không fake purchase state |
| `/orders/:id` | Ticket/order summary theo phân cấp | Detail amounts/snapshot đúng | Không chỉnh lịch sử |
| `/orders/:id/payment` | Payment clarity, zero distraction | Attempt/result/double submit | Simulation không phải gateway thật |
| `/complaints`, `/complaints/:id` | Case form/list theo Customer style | Create/list/detail sở hữu | Optional linked order |
| Movie reviews | Card/list phù hợp, không lấn showtime | 1 review/film/customer sau eligible | DB controls eligibility |

---

# 19. BÁO CÁO CUỐI CÙNG CỦA AGENT — KHÔNG ĐƯỢC BỎ

Khi triển khai xong, trả lời **có bằng chứng** theo format:

```markdown
# CINEMASTAR PUBLIC REDESIGN — IMPLEMENTATION REPORT

## 1. Changed scope
- Routes/pages đã sửa
- Shared components mới/được bọc riêng
- File CSS/theme và nơi lưu assets

## 2. Visual implementation
- Đối chiếu ảnh mẫu: 10 DNA points PASS/PARTIAL/BLOCKED
- Before/after screenshots: đường dẫn thật
- Những thay đổi về dark palette, Hero, rails, movie/cinema card, auth, booking

## 3. Source of truth
- Field DB/API nào đang dùng làm poster/movie/rạp/showtime/price
- Không raw SQL, không fake data
- Các điểm thiếu backdrop/genre/showtime contract, quyền asset nếu có

## 4. QA
- Lệnh build/lint/test và kết quả thật
- E2E booking/role auth/409 payment/complaints
- Browser widths và screenshots
- A11y/axe/keyboard checks
- Staff visual & functional regression

## 5. Open issues
- BLOCKED/NEEDS DECISION có file/route/endpoint cụ thể
- Media cần thay URL hợp lệ hoặc xin quyền
- Công việc chưa hoàn tất, không tự gọi DONE
```

## Quyết định cuối

**Được coi DONE khi:** trang chủ thật sự giống *tinh thần composition* ảnh mẫu; các trang khách hàng có chung dark cinematic identity nhưng phù hợp tác vụ; mọi dữ liệu/hành động đúng API; không rò style vào staff; responsive/test đạt ngưỡng đã đặt; asset quyền sử dụng minh bạch.

**Không được coi DONE khi:** chỉ đổi CSS trắng→đen, thay CTA xanh→đỏ, thêm Hero stock, vẫn giữ toàn bộ card trắng chung bố cục, chưa xem browser, hoặc mặc kệ sai poster và các luồng booking.

---

# 20. TÀI LIỆU NỘI BỘ CẦN ƯU TIÊN ĐỐI CHIẾU

1. `MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md` (11/10/2026): baseline, routes, Customer §§8, architecture §10, safety guards. **Chú ý: palette trắng–xanh ở đó được yêu cầu mới này override CHỈ cho Public/Customer**.
2. `ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md`: nghiệp vụ DBMS-first, không thêm bảng, price/seat/transaction safety, website Customer phải ổn định khi backend hợp đồng chốt.
3. `Phân Tích _ Thiết Kế.docx`: nghiệp vụ chức năng, vai trò, đặt vé, đánh giá, khiếu nại, ERD.
4. `KeHoach_PhatTrien_DuAn_DatVeXemPhim_DBMS_First_v2 (1).docx`: nguyên tắc SP-only và hành trình Frontend; tên phase/UC có thể cũ.
5. Source thực + Use Case Matrix hiện hành trong repo là **nguồn sự thật mới nhất** về tên route/API/field và tính năng thực sự hỗ trợ.

# 21. NGUỒN NGOÀI VÀ QUY CHUẨN (LINK CÓ THỂ MỞ ĐỂ ĐỐI CHIẾU)

- Netflix UI product article: https://www.netflix.com/tudum/articles/netflix-new-homepage-layout-user-guide
- MUBI film discovery: https://mubi.com/en/us/showing
- Letterboxd films: https://letterboxd.com/films/
- AMC movies: https://www.amctheatres.com/movies
- Fandango movie times: https://www.fandango.com/movietimes
- CGV VN: https://www.cgv.vn/default/movies/now-showing.html/
- Galaxy Cinema: https://www.galaxycine.vn/
- BHD Star: https://www.bhdstar.vn/
- Cinestar: https://cinestar.com.vn/
- Unsplash usage: https://unsplash.com/license
- Unsplash trademark/model-right considerations: https://help.unsplash.com/en/articles/2612329-releases-and-trademarks
- Pexels license: https://www.pexels.com/vi-vn/license/
- TMDB API commercial/noncommercial FAQ: https://developer.themoviedb.org/docs/faq
- TMDB image URL construction (không thay license): https://developer.themoviedb.org/docs/image-basics
- Google Fonts open source/commercial: https://developers.google.com/fonts
- W3C WCAG contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- web.dev LCP: https://web.dev/articles/lcp

**HẾT MASTER PROMPT. HÃY AUDIT REPO, TRIỂN KHAI CODE THEO SLICE, TEST VÀ CUNG CẤP EVIDENCE.**

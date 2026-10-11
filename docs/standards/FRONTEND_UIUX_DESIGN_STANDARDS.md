# FRONTEND UI/UX DESIGN STANDARDS

> **Quy chuẩn thiết kế và tổ chức giao diện bắt buộc — Hệ thống đặt vé xem phim trực tuyến cho chuỗi rạp**  
> **Version:** 1.1.0  
> **Ngày ban hành:** 2026-10-11  
> **Trạng thái:** Quy chuẩn áp dụng cho mọi công việc thiết kế UI/UX, sửa giao diện và tái cấu trúc Frontend từ thời điểm tài liệu được đưa vào repository.  
> **Vị trí khuyến nghị trong repo:** `docs/standards/FRONTEND_UIUX_DESIGN_STANDARDS.md`  
> **Đối tượng:** AI Coding Agent, Frontend Developer, UI/UX Designer, Reviewer, Tester.

---

## 0. MỤC TIÊU, PHẠM VI VÀ CÁCH ÁP DỤNG

### 0.1. Mục tiêu

Tài liệu này là **nguồn quy định thiết kế giao diện** nhằm chấm dứt tình trạng phát triển UI/UX thiếu kiểm soát, đặc biệt tại **Admin, CSKH, Manager**; đồng thời định hình phong cách trang chủ và hành trình đặt vé cho **Public/Customer**.

Mọi thay đổi giao diện phải hướng tới đồng thời:

1. **Dễ hiểu:** người dùng biết mình đang ở đâu, có thể làm gì và kết quả thao tác là gì.
2. **Dễ sử dụng:** những tác vụ thường xuyên có luồng thao tác ngắn và ít nhầm lẫn.
3. **Nhất quán:** cùng ý nghĩa → cùng hình thức, hành vi, phản hồi và thuật ngữ.
4. **Có hệ thống:** menu, layout, component, form và table tuân theo mẫu được quản lý.
5. **An toàn nghiệp vụ:** cải tiến UX không được làm lệch quyền, tài nguyên thao tác, dữ liệu, trạng thái hoặc contract.
6. **Bảo trì được:** các màn hình mới không làm phình một portal/component chung không kiểm soát.
7. **Kiểm chứng được:** có thiết kế mục tiêu, tiêu chí chấp nhận và evidence từ trình duyệt.

### 0.2. Phạm vi bắt buộc

Áp dụng cho: trang công khai, trang chủ, trang phim/rạp, booking, lịch sử đơn, thanh toán, khiếu nại khách hàng, Admin Portal, Manager Portal, CSKH Portal, shared shell, navigation, CSS/tokens, interaction, responsive, accessibility và UI testing.

**Baseline nghiệp vụ chính thức là 42 Use Case đang hoạt động:** Customer 14, Manager 9, CSKH 6, Admin 13. `ADM-17 – Cấu hình hệ thống` **không thuộc phạm vi**. Không dựng menu/màn hình ADM-17 hoặc coi nó là phần còn thiếu.

**Quyết định RBAC cố định (11/10/2026):** 42 Use Case hoạt động: Customer 14, Manager 9, CSKH 6, Admin 13. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 45 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có.

### 0.3. Mức độ quy định

- **MUST / BẮT BUỘC:** vi phạm là không đạt nghiệm thu UI/UX trừ khi có ngoại lệ được duyệt.
- **SHOULD / ƯU TIÊN:** áp dụng mặc định; có thể chọn phương án khác khi chứng minh phù hợp hơn.
- **MAY / TÙY CHỌN:** chỉ áp dụng nếu tạo lợi ích và không mở rộng nghiệp vụ.
- **PROPOSED / ĐỀ XUẤT:** là kiến trúc hoặc tên đường dẫn mục tiêu; cần đối chiếu repo trước khi triển khai, không mặc định đã tồn tại.

### 0.4. Thứ tự ưu tiên khi có mâu thuẫn

1. Quyết định nghiệp vụ/baseline mới nhất đã chốt trong repo; 42 UC, giới hạn role và quyền.
2. Ràng buộc DBMS-first và API contract, điều kiện an toàn dữ liệu/quyền.
3. Các điều **MUST** trong tài liệu này.
4. Thiết kế đã được duyệt cho màn hình/feature tương ứng.
5. UI/UX hiện có và các pattern tham khảo bên ngoài.

**Không tự suy diễn** nghiệp vụ, API, fields, quyền hoặc status mới từ ảnh mẫu hoặc website tham khảo. Nếu không đủ API/data, lập `DESIGN_CLARIFICATION` hoặc ghi blocker; không mock một kết quả như dữ liệu thật.

### 0.5. Định hướng cải tiến hệ thống đã có

- **Không mặc định xây lại Frontend.** Chọn cải tiến từng module với kiểm thử hồi quy.
- Giữ phần đang hoạt động tốt; chỉ thay cấu trúc giao diện khi có vấn đề cụ thể hoặc thiết kế mục tiêu đã được duyệt.
- **Được phép redesign mạnh** về information architecture, layout và workflow Admin/CSKH khi đã có thiết kế mục tiêu. Không được lấy lý do “giữ nguyên giao diện cũ” để duy trì một màn hình gây khó dùng.
- **MUST giữ nhận diện thương hiệu hiện tại**: logo, ý nghĩa trạng thái và tinh thần thị giác. Bảng màu trắng–xanh tại mục 2.2 là chuẩn màu chính thức, thay thế mọi token màu cũ của Frontend; không cần giữ palette cũ nếu nó mâu thuẫn với chuẩn này.
- Tham khảo thiết kế bên ngoài nhằm học **pattern**, **không sao chép giao diện, mã nguồn, hình ảnh hoặc nhận diện** của nhà cung cấp.

### 0.6. Phân kỳ triển khai

- **Phase 1 — UX Architecture:** chốt chuẩn màu, sitemap, wireframe, component contract và regression plan; chưa sửa source.
- **Phase 2 — Design System & Component Architecture:** triển khai tokens/base styles, `PublicShell`, `StaffShell` và shared UI primitives; giữ URL hiện tại và không refactor workflow nghiệp vụ từng portal.
- **Phase 3 — Portal Refactor:** chuyển Admin, Manager, CSKH và Customer theo nhóm/route đã được duyệt; giữ nguyên 42 UC, API contract, RBAC, manager scope và business logic.
- **Phase 4 — Overall Acceptance:** kiểm thử tổng thể theo 42 UC, browser/role/viewport, accessibility, regression và evidence. Không đánh dấu PASS khi chưa có kết quả thực tế.

Mỗi phase có review/acceptance riêng. Hoàn thành Phase 2 không tự động cho phép bắt đầu Phase 3.

---

## 1. TRIẾT LÝ THIẾT KẾ: MỘT HỆ THỐNG, HAI MÔ HÌNH TRẢI NGHIỆM

| Đối tượng | Design direction | Ưu tiên | Điều cần tránh |
|---|---|---|---|
| Public / Customer | **Modern Cinematic Commerce** | Hình ảnh phim, khám phá, CTA đặt vé, độ tin cậy, cảm xúc | Banner lấn át chức năng, trang trí dày đặc, booking dài không có định hướng |
| Admin | **Enterprise Control Center** | Thông tin có thứ bậc, quản trị chính xác, data table, form rõ ràng | 18 tab/nút ngang cấp, ID kỹ thuật, bảng dàn mọi field API |
| CSKH | **Case Management Workspace** | Hàng chờ → chi tiết → tham chiếu → lịch sử → xử lý | Trang dài chứa nhiều form cạnh tranh, mất case context, tác vụ nhầm đối tượng |
| Manager | **Cinema Operations Workspace** | Ngữ cảnh rạp, phòng/ghế, lịch chiếu, bảng giá, vận hành, doanh thu | Mất rạp được chọn, trộn dữ liệu nhiều rạp, thao tác dựa vào ID thủ công |

### 1.1. Các điểm chung bắt buộc

- Sử dụng **chung design tokens**, quy ước màu, typography, spacing, trạng thái, icon, accessibility và feedback.
- Có thể sử dụng **hai shell khác nhau**: `PublicShell` và `StaffShell` (tên đề xuất), vì người mua vé và nhân viên có mục tiêu khác nhau.
- **Không ép giao diện quản trị theo bố cục phim/poster** và không ép trang chủ mang thẩm mỹ dashboard CRUD.
- Không trang trí chỉ để “đỡ trống”: mọi khối phải có tác dụng định hướng, cung cấp thông tin hoặc thực hiện tác vụ.

### 1.2. Vai trò các nguồn tham khảo

| Nguồn | Dùng để tham khảo | Không được suy diễn |
|---|---|---|
| Ant Design | Form, data entry, task decomposition, review trước khi submit | Bắt buộc cài Ant Design hoặc copy nguyên theme |
| IBM Carbon | Data table, toolbar, sorting, selection, pagination, density | Bắt buộc thêm mọi tính năng table vào mọi danh sách |
| PatternFly | Page shell, navigation phân nhóm, dashboard theo KPI | Bắt buộc dùng thư viện PatternFly |
| Atlassian | Ngữ cảnh điều hướng và cấu trúc không gian làm việc | Sao chép nguyên điều hướng sản phẩm |
| Zendesk / Intercom | Queue/detail/context, hỗ trợ xử lý liên tiếp case | Thêm chat trực tuyến, chatbot, ticket SLA, tự động phân công ngoài UC |
| Galaxy / BHD / CGV / Fandango | Khám phá phim, card, lịch chiếu, nút mua vé | Copy banner, poster, logo, layout pixel-perfect, feature không có API |

---

## 2. QUY TẮC THỊ GIÁC TOÀN HỆ THỐNG

### 2.1. Visual hierarchy — BẮT BUỘC

1. Mỗi trang có **một mục tiêu chính**, một `h1`/page title xác định nội dung, và **primary action rõ ràng** nếu có thao tác chính.
2. Page header nên gồm: tiêu đề, mô tả ngắn tùy cần, breadcrumbs nếu có chiều sâu, primary action ở vị trí nhất quán.
3. Thứ tự ưu tiên thông tin: **hành động/đối tượng hiện tại → thông tin cần quyết định → ngữ cảnh phụ → metadata kỹ thuật**.
4. Không để mọi nút, card, heading hoặc badge cùng độ nổi bật.
5. Dùng alignment, nhóm gần nhau, khoảng trắng và typographic weight để phân cấp trước khi dùng thêm màu.
6. Không đặt quá nhiều primary button trong cùng một khu vực; hành động phụ dùng secondary/ghost/overflow menu.
7. Không dùng card để bao từng dòng hoặc từng nhãn nếu text/table đơn giản rõ ràng hơn.

### 2.2. Màu sắc & brand

- **MUST — chuẩn màu chính thức toàn hệ thống:** dùng palette **Trắng – Xanh dương** dưới đây cho Public/Customer, Admin, CSKH và Manager. Đây là nguồn chuẩn duy nhất; token/palette trong source cũ phải được xem là legacy nếu khác các giá trị này.

| Token | Giá trị | Vai trò |
|---|---|---|
| `color.primary` | `#2563EB` | Primary action, link và điểm nhấn chính |
| `color.primary-hover` | `#1D4ED8` | Hover/pressed của primary action |
| `color.primary-dark` | `#1E40AF` | Nhấn mạnh, trạng thái active cần thêm độ sâu |
| `color.background` | `#F8FAFC` | Nền cấp trang |
| `color.surface` | `#FFFFFF` | Bề mặt nội dung, form, bảng và dialog |
| `color.surface-blue` | `#EFF6FF` | Bề mặt xanh nhạt cho nhóm/selection có ý nghĩa |
| `color.text-primary` | `#0F172A` | Nội dung chính và tiêu đề |
| `color.text-secondary` | `#475569` | Nội dung phụ, nhãn và mô tả |
| `color.border` | `#CBD5E1` | Viền phân tách và đường biên control |

- **MUST** ánh xạ thành semantic tokens như `primary`, `surface`, `text`, `border`, `focus`, `success`, `warning`, `error`, `info`, `disabled`; không tạo palette riêng theo portal.
- **MUST** dùng nền trắng/trung tính với xanh dương làm màu hành động và nhận diện; **MUST NOT** dùng giao diện tối làm chủ đạo, gradient lòe loẹt, glow, glassmorphism hoặc neon.
- **MUST** đảm bảo WCAG 2.2 AA: text thường đạt tương phản tối thiểu **4.5:1**, text lớn **3:1**; thành phần UI thiết yếu và chỉ báo focus đạt **3:1** với màu liền kề. Trên nền `#2563EB`, `#1D4ED8` hoặc `#1E40AF`, dùng chữ trắng; trên `#EFF6FF`, dùng text đậm. Không dùng chữ trắng trên nền xanh nhạt.
- `#CBD5E1` là viền phân tách nhẹ; không dùng riêng token này làm chỉ báo focus hoặc đường biên duy nhất để nhận biết control khi không đạt tương phản 3:1. Focus phải có chỉ báo rõ, dùng màu primary/dark hoặc cặp màu đã đo đạt tiêu chí.
- **MUST** giữ semantic success/warning/error hiện có về ý nghĩa, đồng thời kiểm tra cặp màu chữ/nền đạt AA; không đổi trạng thái nghiệp vụ hoặc dùng semantic color để trang trí.
- **MUST** thống nhất mapping trạng thái nghiệp vụ: cùng status không được tự đổi màu giữa Admin, Manager và CSKH.
- **MUST** có nhãn chữ cho trạng thái; **không chỉ dùng màu** để truyền đạt ý nghĩa.
- **SHOULD** dùng nền `#F8FAFC` cho staff workspace, surface trắng cho vùng làm việc và blue làm accent/action. Cảnh báo chỉ dùng khi có ý nghĩa.
- Màu bổ sung chỉ được dùng cho semantic success/warning/error/info/focus/disabled, phải được khai báo bằng token và kiểm tra tương phản; không hardcode màu tùy tiện trong trang.

### 2.3. Typography

- **MUST** giữ font đã được phê duyệt/đang dùng cho brand; không thay font toàn hệ thống nếu chưa duyệt.
- Có phân cấp rõ ràng: page title → section heading → body → supporting text → caption.
- **MUST** giữ cỡ chữ body và control dễ đọc; **SHOULD** dùng khoảng 14–16px cho nội dung staff, 16px hoặc mức phù hợp với hệ thống cho phần văn bản đọc dài của Customer; không ép cỡ cố định nếu existing tokens đáp ứng tốt.
- **MUST** dùng kiểu chữ/tabular numbers nhất quán cho tiền, thống kê, mã, ngày giờ khi hữu ích.
- Không dùng text ALL CAPS kéo dài, font quá mảnh, chữ xám nhạt trên nền sáng, hoặc dùng nhiều font tùy tiện.

### 2.4. Spacing, grid và mật độ

- **SHOULD** dùng nhịp khoảng cách theo bội số 4px (4/8/12/16/24/32) hoặc quy đổi bằng spacing tokens đang có.
- Giữ nhất quán padding page, card, modal, form row, table toolbar và khoảng cách section.
- Staff UI cần mật độ thông tin **vừa phải và có khả năng quét**, không được nén tùy tiện để nhồi đủ dữ liệu vào một màn hình.
- Customer UI có thể thoáng hơn, ưu tiên poster và lịch chiếu; không tạo khoảng trống lớn vô nghĩa giữa hành động liên quan.
- Không dùng nhiều vùng cuộn lồng nhau nếu không có lý do task-specific; phải dễ xác định vùng cuộn và không che action.

### 2.5. Icon, hình ảnh, chuyển động

- **MUST** dùng một hệ icon thống nhất (giữ hệ hiện có, hoặc chọn từ thư viện thật sau phê duyệt). Không tự trộn nhiều bộ icon khác nét/độ dày.
- Icon-only action phải có accessible name; tác vụ nguy hiểm nên có label rõ ràng, không phụ thuộc vào biểu tượng.
- Ảnh poster/backdrop phải đúng tỉ lệ, chất lượng phù hợp, có fallback; không stretch, không dùng ảnh stock không liên quan.
- Ảnh mới phải có nguồn hợp pháp/quyền sử dụng; không hotlink bừa và không dùng ảnh mẫu của website khác làm asset production.
- Animation/transitions chỉ phục vụ phản hồi hoặc chuyển ngữ cảnh; tôn trọng `prefers-reduced-motion`.

---

## 3. INFORMATION ARCHITECTURE & NAVIGATION

### 3.1. Quy tắc chung

- **MUST** phân nhóm menu theo **công việc của người dùng**, không theo tên bảng DB, tên Stored Procedure hoặc thứ tự dev code.
- **MUST** phân biệt điều hướng toàn cục (global), điều hướng feature (local), tab nội dung và action. Không sử dụng tất cả như những nút section ngang cấp.
- **MUST** có selected/active navigation state rõ ràng.
- **MUST** có direct link và browser back/forward cho trang/đối tượng công việc quan trọng.
- **MUST** cho refresh ở route sâu hiển thị đúng trang khi người dùng có quyền; 401/403/404 rõ ràng.
- **MUST** ẩn/disable điều hướng dựa trên permission được cấp, nhưng **không xem ẩn UI là kiểm tra bảo mật**; backend/database vẫn quyết định quyền.
- **MUST** có page title phản ánh đúng route và ngữ cảnh hiện tại.
- **SHOULD** dùng breadcrumbs cho cấp chi tiết sâu (`Danh sách → Chi tiết → Chỉnh sửa`), nhưng không lặp vô ích với menu.
- **MUST NOT** thêm hàng dài 15–20 button để chuyển giữa tất cả module trong một trang.

### 3.2. Cấu trúc layout đề xuất

```text
App
├── PublicShell                        # Dành cho khám phá/đặt vé
│   ├── Header: Logo | Phim | Rạp | Lịch chiếu | Tài khoản
│   ├── Main: nội dung điện ảnh + các tác vụ đặt vé
│   └── Footer: liên hệ/thông tin phù hợp phạm vi
└── StaffShell                         # Dành cho Admin/Manager/CSKH
    ├── Header: thương hiệu | ngữ cảnh | tài khoản
    ├── Sidebar: các nhóm chức năng theo quyền
    └── Main
        ├── Breadcrumbs (khi cần)
        ├── PageHeader + primary action
        ├── Filters/toolbar (khi cần)
        └── Nội dung trang/task workspace
```

**Đây là định hướng kiến trúc, không phải yêu cầu phải đổi tên các component hiện có ngay.** Khi refactor, route migration phải đảm bảo compatibility cho `/admin`, `/manager`, `/support` và link đã tồn tại.

### 3.3. Đường dẫn sâu (deep link)

Các path sau là **đề xuất**, không được giả định API hoặc route đã có:

```text
/admin                         -> compatible entry; default overview / first allowed section
/admin/overview
/admin/access/users
/admin/access/assignments
/admin/cinemas
/admin/cinemas/images
/admin/facilities/rooms
/admin/facilities/seats
/admin/catalog/movies
/admin/catalog/genres
/admin/catalog/actors
/admin/commerce/products
/admin/commerce/promotions
/admin/operations/pricing
/admin/operations/showtimes
/admin/service/complaints
/admin/reports/revenue

/support                       -> queue
/support/complaints/:complaintId

/manager                       -> compatible entry / overview
/manager/overview
/manager/rooms
/manager/seats
/manager/showtimes
/manager/pricing
/manager/revenue
```

Nhóm Admin có 16 section chia thành đúng 6 nhóm: Tổng quan; Tài khoản & phân công; Rạp & cơ sở vật chất; Nội dung; Kinh doanh & vận hành; Chăm sóc & báo cáo. ADM-03/04/05 RETIRED; không có route hoặc workflow quản lý RBAC.

Không tạo thêm Use Case mới chỉ vì có một route mới; nhiều route có thể phục vụ cùng một Use Case. Route access phải phản ánh permission/scope đang tồn tại.

---

## 4. CHUẨN COMPONENT VÀ INTERACTION DÙNG CHUNG

### 4.1. PageTemplate

Mỗi trang nghiệp vụ (trừ trang đặc biệt có lý do riêng) nên triển khai nhất quán:

1. PageHeader (title, description, breadcrumb, primary action).
2. FilterToolbar (nếu là dữ liệu có nhu cầu tìm/lọc).
3. Content (DataTable, detail, form, dashboard, queue).
4. Feedback (loading, empty, error, success, confirm).
5. Pagination / secondary action khi dữ liệu và task yêu cầu.

### 4.2. DataTable — MUST

- **MUST** khai báo **cột theo resource/task**, dùng nhãn tiếng Việt rõ; không render `Object.keys(rows[0])` hoặc toàn bộ API response thành cột mặc định.
- **MUST** phân biệt primary display field, status, timestamp, identifier và action. ID nội bộ không phải tên hiển thị chính.
- **MUST** ưu tiên cột giúp ra quyết định; metadata kỹ thuật có thể nằm ở detail/drawer nếu cần.
- **MUST** có empty, loading, error và retry hữu ích.
- **MUST** có cơ chế xem hành động dòng rõ và truy cập được bằng bàn phím.
- **MUST** không để bảng rộng làm vỡ layout; khi scroll ngang, identifier và hành động quan trọng phải vẫn dễ tiếp cận theo thiết kế được kiểm tra.
- **SHOULD** thêm search/sort/filter/pagination theo kích thước danh sách và nhu cầu thật, không thêm cho bảng nhỏ chỉ để trang trí.
- **MUST** xác định và ghi rõ sorting/filtering/pagination đang xử lý tại client hay API; không giả vờ hiển thị “toàn bộ” khi API chỉ trả một trang.
- **SHOULD** có row density nhất quán: default comfortable; compact dành cho bảng thật sự nhiều dữ liệu.
- **MUST NOT** biến table thành một dãy card rời rạc trên desktop nếu nhiệm vụ chính là so sánh nhiều bản ghi.

### 4.3. Form — MUST

- **MUST** có label dễ hiểu; input thể hiện kiểu dữ liệu và giới hạn hợp lệ.
- **MUST** dùng selector có tên cho rạp, phòng, phim, ghế, vai trò khi tạo tài khoản, resource reference khi có danh mục phù hợp.
- **MUST NOT** yêu cầu nhân viên nhập raw database ID/CSV ID/JSON nghiệp vụ để thực hiện tác vụ thường xuyên, trừ khi đó thật sự là payload chuyên gia được chốt trong yêu cầu. ID nội bộ có thể hiển thị read-only để tra cứu.
- **MUST** có validation tại field + thông báo lỗi cạnh field hoặc ở vùng gần tác vụ; không chỉ toast chung chung.
- **MUST** hỗ trợ loading/submitting, chống double-submit và kết quả thành công/thất bại rõ ràng.
- **MUST** bảo vệ unsaved changes khi rời form/chuyển đối tượng theo cách phù hợp.
- **MUST** không tự clear các trường hợp lệ khi server trả lỗi.
- **SHOULD** gom field có liên quan thành nhóm; form dài có thể chia section hoặc step nếu tác vụ thực sự tuần tự.
- **SHOULD** đặt Save/Cancel nhất quán, không thay đổi thứ tự giữa các trang.
- **MUST** dùng data server trả sau mutation để cập nhật kết quả authoritative.

### 4.4. Dialog, drawer và destructive actions

- **MUST** dùng modal xác nhận cho thao tác có hậu quả nghiêm trọng (khóa tài khoản, chuyển rạp Manager, hủy suất chiếu, xóa khi phù hợp).
- Nội dung xác nhận **MUST** nêu rõ đối tượng, hành động, hậu quả; không dùng chỉ “Bạn chắc chắn?” mà thiếu ngữ cảnh.
- **MUST** tránh đặt destructive action ngay cạnh primary action theo cách dễ nhấn nhầm.
- **MUST** focus vào modal khi mở, trap focus phù hợp, trả focus về vị trí hợp lý khi đóng; `Esc` không được vô ý bỏ mất dữ liệu.
- **SHOULD** dùng drawer cho chỉnh sửa ngắn cần giữ ngữ cảnh danh sách; dùng page riêng cho tác vụ dài/phức tạp. Chọn theo UX, không theo sở thích cá nhân.

### 4.5. Feedback state contract

Mọi màn hình đọc dữ liệu phải phân biệt tối thiểu: `idle/loading/success/empty/error`. Mọi mutation phải phân biệt: `idle/submitting/success/error`; phải có hành vi retry khi an toàn.

- **401:** phiên đăng nhập không hợp lệ/hết hạn → điều hướng và thông báo phù hợp.
- **403:** không đủ quyền → giải thích, không ẩn lỗi thành danh sách trống.
- **404:** đối tượng không tồn tại → trạng thái rõ, có đường quay lại.
- **409:** xung đột nghiệp vụ → giải thích nguyên nhân, refresh dữ liệu liên quan nếu cần.
- **422:** validation → chỉ rõ trường/dữ liệu không hợp lệ.
- **5xx/network:** lỗi hệ thống hoặc kết nối → retry an toàn, giữ input đang nhập.

Không hiển thị raw SQL, stack trace, token, internal error detail hoặc thông tin nhạy cảm.

### 4.6. Async correctness — MUST

- **MUST** ngăn response cũ ghi đè dữ liệu của resource/filter hiện tại (`AbortController`, generation/request ID hoặc giải pháp đúng tương đương).
- **MUST** đảm bảo action gửi đúng **resource đang hiển thị và được xác nhận**, không chỉ ID lưu ở ref/state đã lỗi thời.
- **MUST** ngăn double-submit cho mutation; không tự retry mutation không idempotent.
- **MUST** có data ownership rõ giữa route, selected item, draft form và request result.
- **MUST** bảo vệ logic hiện có của `CinemaImageManager` (ownership, request-generation, retry), CSKH stale response/write locks và booking context reset.
- **SHOULD** chuẩn hóa async-state pattern dùng lại, nhưng không thay thế toàn bộ bằng thư viện mới nếu không có chứng cứ nhu cầu.

### 4.7. Component contract — MUST

Mỗi shared component được thêm hoặc chuẩn hóa phải có đặc tả API trước khi merge; tối thiểu ghi rõ:

| Thuộc tính | Nội dung phải có |
|---|---|
| Props | Tên, kiểu, required/optional, default, callback semantics; kế thừa native HTML props khi hợp lý |
| Variants | Các biến thể được hỗ trợ và mục đích (ví dụ `primary/secondary/danger`, `sm/md/lg`) |
| States | Default, hover, focus, active, disabled, loading, invalid/error và empty khi áp dụng |
| Responsive | Hành vi ở desktop/tablet/mobile; overflow, wrapping, drawer hoặc stacked layout |
| Accessibility | Semantic element, accessible name/label, keyboard, focus, ARIA, contrast, screen reader behavior |
| Interaction | Click/submit/cancel/escape/outside click, pending/duplicate behavior và kết quả callback |

- Không dùng prop mơ hồ như `type` nếu nó đồng thời biểu diễn nhiều ý nghĩa; ưu tiên API nhỏ và rõ.
- Shared component nhận dữ liệu/hành động qua props và không gọi API, kiểm tra permission nghiệp vụ hoặc tự tạo business state theo role.
- Component có side effect (ví dụ dialog) phải mô tả lifecycle, focus entry/return và hành vi khi đóng/mở.

---

## 5. ADMIN PORTAL — ENTERPRISE CONTROL CENTER

### 5.1. Mục tiêu bắt buộc

Admin cần tìm đúng module nhanh, nhìn thấy bản ghi quan trọng, hiểu hậu quả trước khi sửa và thao tác chính xác trên **đúng resource**. Giao diện phản ánh **nhiệm vụ quản trị**, không để lộ cấu trúc API/DB thành UX chính.

### 5.2. Cấu trúc sidebar theo nhóm

| Nhóm | Module/chức năng cần có | Baseline liên quan |
|---|---|---|
| Tổng quan | Dashboard tổng hợp | ADM-16 (nếu dashboard có dữ liệu đã hỗ trợ) |
| Tài khoản & phân công | Người dùng; Phân công/chuyển rạp cho Manager | ADM-02, ADM-06 |
| Rạp & cơ sở vật chất | Rạp; phòng; ghế; ảnh rạp nếu tính năng đã triển khai | ADM-07–ADM-08 |
| Nội dung | Phim; thể loại; diễn viên | ADM-09–ADM-10 |
| Kinh doanh & vận hành | Sản phẩm; khuyến mãi; bảng giá; suất chiếu | ADM-11–ADM-14 |
| Chăm sóc & báo cáo | Khiếu nại; doanh thu/báo cáo | ADM-15–ADM-16 |

Sáu nhóm sidebar là **Tổng quan; Tài khoản & phân công; Rạp & cơ sở vật chất; Nội dung; Kinh doanh & vận hành; Chăm sóc & báo cáo**. Sử dụng route architecture của Blueprint làm nguồn chuẩn; `ADM-01` là truy cập/xác thực, không phải mục CRUD riêng. **Không có ADM-17.** Các mục chỉ hiển thị khi có quyền thích hợp; tên menu phù hợp nội dung thật của API.

### 5.3. Layout từng trang quản trị

```text
StaffShell / Admin sidebar
└── Breadcrumbs + PageHeader
    ├── Title + mô tả ngắn + 1 primary action
    ├── Toolbar: Search / filters / reset (khi cần)
    ├── Resource DataTable (cột curated)
    ├── Row actions: View/Edit/... theo quyền
    └── Detail / Form / Confirm với feedback rõ
```

- **MUST** có trang/module độc lập hoặc feature boundary rõ; không thêm một nhánh điều kiện lớn khác vào `AdminPortal.jsx` monolith.
- **MUST** route-backed navigation cho việc chuyển giữa module sau khi chuyển đổi kiến trúc.
- **MUST** lưu trạng thái truy vấn cơ bản nếu cần phục hồi (search/filter/page) mà không lưu dữ liệu nhạy cảm vào URL.
- **MUST** dùng CRUD pattern nhất quán trong toàn Admin.
- **SHOULD** sử dụng màn hình riêng hoặc drawer cho các thao tác có nhiều field phụ thuộc; không bắt mọi chức năng nằm trong một generic form.

### 5.4. Quy chuẩn theo nhóm nghiệp vụ

**Người dùng:** tên/email/trạng thái/vai trò và hành động khóa/mở phải dễ nhận; thao tác khóa phải xác nhận tên hoặc email đối tượng.

**Vai trò và quyền:** chỉ chọn vai trò cố định bằng tên khi tạo tài khoản; vai trò hiện hữu chỉ đọc. Không có màn hình CRUD vai trò/quyền hoặc gán/thu hồi quyền. Backend/SQL từ chối mọi thao tác ghi RBAC.

**Phân công rạp:** chọn Manager và rạp bằng tên; hiển thị phân công hiện tại, thời hạn và trạng thái. Chuyển rạp phải xác nhận Manager, rạp cũ và rạp mới trước khi gọi API cập nhật phân công. Giữ hỗ trợ nhiều phân công hiện có; không tự đặt giới hạn một rạp.

**Rạp/phòng/ghế:** giữ hierarchy `Rạp → Phòng → Ghế`; hiển thị ngữ cảnh cha ở header/breadcrumb. Quản lý sơ đồ ghế bằng pattern không gian khi phù hợp, nhưng giữ hành động trên ghế và trạng thái lịch sử rõ ràng.

**Phim/thể loại/diễn viên:** phim có poster thumbnail, tiêu đề, lịch/phân loại, trạng thái; cast được chọn bằng danh sách diễn viên có tên/role thay vì nhập JSON thô cho nghiệp vụ thường ngày. Không giả định API mới.

**Khuyến mãi/bảng giá:** diễn giải loại/giá trị/hiệu lực/trạng thái; input bắt buộc theo domain contract. Pricing day type chỉ gồm **`Ngày thường`, `Cuối tuần`, `Tất cả`**; **không có `Ngày lễ`**.

**Suất chiếu:** hiển thị rõ phim–rạp–phòng–ngày giờ–định dạng–trạng thái. Có thể nghiên cứu timeline theo phòng khi dữ liệu hiện có hỗ trợ; không bắt buộc ngay. Hủy suất cần xác nhận, hiển thị xung đột từ server.

**Khiếu nại:** có thể dùng lại visual primitives từ CSKH nhưng không được nhập nhằng quyền, API/permission hoặc workflow giữa Admin và CSKH.

**Báo cáo:** KPI có tên, đơn vị, khoảng thời gian và phạm vi; chart không lặp cùng số liệu để trang trí. Chỉ hiển thị metric mà API thật cung cấp, không tổng hợp authoritative revenue ở client.

### 5.5. Admin MUST NOT

- 16 nút section phẳng trong một hàng/khối điều hướng.
- Table tự động xuất tất cả field JSON/DTO.
- Mọi thao tác thêm/sửa/xóa vai trò/quyền hoặc gán/thu hồi quyền.
- Editor cast JSON cho người quản trị phổ thông khi có thể biểu diễn bằng lựa chọn có nhãn.
- Dồn data fetch, permission checks, form hydration và mutation của mọi domain vào một component khổng lồ.
- Hiển thị action thiếu quyền rồi dựa vào việc API trả 403 như UX mặc định.

---

## 6. CSKH PORTAL — CASE MANAGEMENT WORKSPACE

### 6.1. Nghiệp vụ chuẩn

`Danh sách khiếu nại → lọc/tìm → mở khiếu nại → đọc nội dung/lịch sử → xem đơn tham chiếu nếu có → ghi lần xử lý → cập nhật trạng thái (theo contract) → tiếp tục case khác`.

Chỉ thực hiện nghiệp vụ trong `CSKH-01...CSKH-06`; **không tự thêm chat, SLA, assignment engine hoặc AI reply**.

### 6.2. Bố cục desktop đề xuất

```text
StaffShell / CSKH
├── Vùng 1 — Queue: tìm kiếm, filter, danh sách, count/status
├── Vùng 2 — Chi tiết + Timeline: người gửi, nội dung case, lịch sử theo thứ tự
└── Vùng 3 — Đơn tham chiếu + Hành động: reference/denied/empty/error, ghi xử lý, đổi trạng thái
```

- **MUST** trên desktop rộng phân định ba vùng không trùng lặp: **Queue | Chi tiết + Timeline | Đơn tham chiếu + Hành động**. Timeline chỉ xuất hiện trong vùng chi tiết; vùng thứ ba dành cho đơn tham chiếu và hai thao tác hiện có.
- **SHOULD** giữ queue và detail đọc được; khi chiều rộng không đủ, chuyển vùng context/action thành panel hoặc drawer, không ép ba cột chật.
- **MUST** phân tách rõ **dữ liệu đọc** và **hành động ghi**; thao tác trạng thái không bị lẫn với ghi chú xử lý.
- **MUST** trường hợp không có đơn tham chiếu hiển thị “Không gắn đơn đặt vé”; API error phải hiện error/retry riêng.
- **MUST** hiển thị timeline theo thứ tự được định nghĩa, bao gồm người xử lý, thời gian, nội dung và trạng thái nếu dữ liệu có.
- **MUST** chỉ dùng một selected case authoritative trong UI; trường hợp resource đã đổi phải vô hiệu hóa stale writes.
- **MUST** có route chi tiết case/deep link sau khi tái cấu trúc (`/support/complaints/:complaintId` là path đề xuất).

### 6.3. Hành vi filter — BẮT BUỘC

- Chọn một trong hai mô hình nhất quán:
  - **A (khuyến nghị):** `draftFilters` → nhấn **Áp dụng** → `appliedFilters` và load đúng một lần.
  - **B:** lọc tự động với debounce có chủ đích → **không có nút Áp dụng dư thừa**.
- **MUST NOT** vừa gọi API mỗi ký tự vừa gọi thêm lần nữa khi bấm nút lọc.
- **MUST** không âm thầm xóa nội dung xử lý chưa lưu khi đổi bộ lọc hoặc case.
- **MUST** xác định rõ khi nào selection được giữ, khi nào bị loại vì không khớp kết quả và thông báo tương ứng.
- **SHOULD** lưu bộ lọc đã áp dụng vào query parameters nếu không chứa dữ liệu nhạy cảm; phải restore được khi back/refresh.

### 6.4. Action safety

- Khi mở case A → B nhanh, response A không được ghi vào case B.
- Khi filter A → B nhanh, result A không được ghi đè list B.
- Khi thao tác trên case B, payload không được lấy từ nội dung hiển thị case A.
- Mutation đang submit phải khóa nút hoặc có write lock, phản hồi theo đúng case.
- Nếu người dùng không có quyền xem đơn tham chiếu, hiển thị hạn chế quyền đúng nghĩa; không giả kết quả rỗng.

### 6.5. Bố cục khi màn hình nhỏ

- **Tablet:** queue và detail có thể đổi giữa list/detail; context đưa vào tab/drawer nếu hợp lý.
- **Mobile:** ưu tiên một task tại một thời điểm, điều hướng quay lại hàng chờ rõ ràng; form xử lý không tràn màn hình.
- Không bắt người dùng cuộn qua cả queue dài mới đến nội dung case đang chọn.

---

## 7. MANAGER PORTAL — CINEMA OPERATIONS WORKSPACE

### 7.1. Ngữ cảnh rạp là bất biến UX

- **MUST** luôn hiển thị rạp đang thao tác tại vị trí dễ thấy (context selector, page header hoặc cả hai).
- **MUST** khi đổi rạp: reset hoặc reload đúng các resource rạp-dependent; xóa selection/form không còn hợp lệ với thông báo phù hợp.
- **MUST** không hiển thị hoặc ghi dữ liệu rạp A trong khi context hiện tại là rạp B.
- **MUST** giữ server-enforced manager scope; không tin `RapID` client như authorization.
- **SHOULD** duy trì context đã chọn trong route/query state khi an toàn, không lộ nội dung nhạy cảm.

### 7.2. Nhóm chức năng

- Tổng quan vận hành: suất chiếu, hoạt động, chỉ số đã được backend hỗ trợ.
- Phòng và ghế: quản lý theo cấu trúc phòng → ghế.
- Lịch chiếu: danh sách theo rạp/phòng/ngày; form tạo/sửa/hủy rõ ràng.
- Bảng giá: quy tắc giá và khoảng hiệu lực.
- Doanh thu: bộ lọc kỳ, thống kê đúng phạm vi rạp.

- **SHOULD** tách module/route độc lập khi refactor, không tiếp tục dồn thêm logic vào `ManagerPortal.jsx`.
- **SHOULD** nghiên cứu calendar/resource timeline để xem lịch theo phòng, nhưng không tự thêm calendar library/licensing cost khi chưa được duyệt.
- **MUST** giữ time conversion và timezone conventions hiện có; không tính authoritative giá/doanh thu bằng frontend.

---

## 8. PUBLIC / CUSTOMER — MODERN CINEMATIC COMMERCE

### 8.1. Nguyên tắc chung

- **MUST** ưu tiên khách tìm phim/rạp, chọn suất và đặt vé; mọi trang trí phải phục vụ mục tiêu đó.
- **MUST** giữ khả năng điều hướng trực tiếp đến phim, rạp, suất chiếu, đơn và khiếu nại hiện có.
- **MUST** áp dụng visual identity chung, nhưng khách hàng được dùng poster, backdrop và typography giàu cảm xúc hơn Staff Portal.
- **MUST NOT** sao chép poster/banner/brand từ đối thủ làm dữ liệu chính thức.

### 8.2. Trang chủ — cấu trúc ưu tiên

```text
Header: Logo | Phim | Rạp | Lịch chiếu | Tài khoản
Hero: phim nổi bật có nội dung thực + CTA Đặt vé / Xem chi tiết
Đặt vé nhanh: chọn phim / rạp / ngày (phù hợp API hiện có)
Phim đang chiếu: poster grid + nút xem lịch/đặt vé
Lịch chiếu: đường đi ngắn đến suất chiếu hợp lệ
Phim sắp chiếu: poster + ngày dự kiến + xem chi tiết
Footer: thông tin hệ thống / hỗ trợ cần thiết
```

**Các section ngoài phạm vi dữ liệu/API hiện có là OPTIONAL và phải được duyệt**. Không hiển thị ô `Đặt vé nhanh` vô dụng nếu chưa có cách kết nối đúng dữ liệu.

Quy tắc trang chủ:

1. **MUST** người mới vào nhìn thấy phim và đường đi mua vé ở phần đầu trang.
2. **MUST** phim nổi bật có CTA rõ; không dùng hero quá cao khiến phần phim quan trọng mất khả năng khám phá.
3. **MUST** phân biệt `Đang chiếu` và `Sắp chiếu` theo dữ liệu thật; không tạo suất cho phim chưa mở bán.
4. **SHOULD** hiển thị Movie Card nhất quán: poster, tên, metadata quan trọng, trạng thái/độ tuổi nếu có, hành động phù hợp.
5. **SHOULD** hỗ trợ hai hướng bắt đầu: theo **phim** hoặc theo **rạp**, dựa trên API đã tồn tại.
6. **MUST** có skeleton/placeholder hợp lý để giảm layout shift khi tải poster/backdrop.
7. **MUST** xử lý trạng thái không có suất chiếu đúng nghĩa, không tự dựng giờ chiếu giả.
8. **MUST NOT** nhồi news, promotion, countdown, animation và nhiều carousel khi không có giá trị nghiệp vụ rõ.

### 8.3. Trang phim, rạp, chi tiết

- Movie list: filter cần thiết, grid poster, search nếu API hỗ trợ; card cùng cấu trúc.
- Movie detail: poster/backdrop; thông tin phim; lịch chiếu có nhóm theo rạp/ngày, CTA chọn suất.
- Cinema list/detail: thông tin rạp rõ, danh sách lịch chiếu khi có; image gallery không lấn át nhiệm vụ.
- Không để user phải tìm nút đặt vé giữa nội dung quá dài hoặc các khối marketing vô ích.

### 8.4. Booking flow — regression-sensitive

Luồng chính: `Chọn phim/suất → chọn ghế → chọn đồ ăn → khuyến mãi (tùy chọn) → xác nhận → thanh toán → lịch sử/chi tiết`.

- **MUST** hiển thị tên phim, rạp, phòng, ngày giờ và suất hiện tại ở chỗ dễ kiểm tra.
- **MUST** phân biệt ghế trống/chọn/đang giữ/đã bán/không khả dụng bằng màu **và** nhãn/legend/icon thích hợp.
- **MUST** có order summary và trạng thái hold/deadline hiển thị rõ khi dữ liệu có.
- **MUST** hiển thị giá cuối theo server/DBMS; preview chỉ để tham khảo, không tính chốt trên client.
- **MUST** reset seat/food/promotion/preview/result/error khi `showtimeId` thay đổi theo thiết kế, không giữ context stale.
- **MUST** khi gặp 409 seat conflict hoặc promotion conflict, phản hồi rõ và refresh thông tin liên quan; không âm thầm chuyển thành đặt giá đầy đủ.
- **MUST** không gửi trùng booking/payment do bấm liên tục; không che thất bại thanh toán.
- **SHOULD** có step/progress và CTA Back/Continue dễ hiểu, nhưng không bắt buộc chia thành nhiều route nếu cùng-page wizard phù hợp hơn.
- **MUST** giữ các invariant, limits, timezone, authorization và error mapping hiện có.

### 8.5. Các trang sau mua

- Order history: hiển thị đơn thuộc tài khoản, trạng thái, phim/suất, ngày giờ, giá từ server.
- Order detail/payment: sử dụng route đã có và không làm mất lịch sử thanh toán.
- Customer complaint: tạo khiếu nại không bắt buộc gắn đơn; nếu có tham chiếu phải chọn bằng thông tin đơn có nghĩa; xem timeline/trạng thái rõ.
- Review: phản ánh eligibility do server quyết định, không “mở khóa” chỉ bằng frontend.

---

## 9. DESIGN SYSTEM & REACT FRONTEND ARCHITECTURE

### 9.1. Tổ chức đề xuất (không bắt buộc đổi tên ngay)

```text
frontend/src/
├── app/                         # shell, route config, providers
├── components/ui/               # Button, Input, Select, Dialog, Badge...
├── components/patterns/         # PageHeader, DataTable, FilterBar, AsyncState...
├── features/
│   ├── admin/
│   │   ├── users/
│   │   ├── access/
│   │   ├── cinemas/
│   │   ├── catalog/
│   │   ├── showtimes/
│   │   └── reports/
│   ├── support/
│   ├── manager/
│   └── booking/
├── api/                          # REST boundary giữ contract
├── context/                      # auth / shared app state khi hợp lý
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── shell.css
│   └── features/
└── utils/
```

**Chỉ là reference architecture.** Khi tái cấu trúc phải kiểm tra conventions hiện hành và chia theo feature hợp lý; không tạo các file/thư mục rỗng chỉ để giống sơ đồ.

### 9.2. Ownership — BẮT BUỘC

- Shared UI component **không tự chứa nghiệp vụ riêng của Admin/Manager/CSKH**.
- Feature component sở hữu local state, form và workflow của mình; API call qua module REST hiện có.
- Không trộn nhiều feature không liên quan trong một page orchestration đơn khối.
- Một component lớn **không tự động bị coi là lỗi**; phải xem trách nhiệm, coupling và khả năng test.
- Không tạo generic abstraction ép những workflow khác nhau thành một component nhiều `if (role)` khó kiểm soát.
- Không lặp lại UI pattern phổ biến ở mỗi portal nếu có thể tái sử dụng hợp lý.
- **MUST** giữ permission/ownership/request-generation guards khi extract component; không refactor theo cách làm mất tính an toàn.
- **MUST** giữ current public URLs và API contract hoặc cung cấp redirect/migration có test.
- **MUST** công bố component contract (props, variants, states, responsive, accessibility, interaction) theo mục 4.7 cho shared components mới/đã chuẩn hóa.

### 9.3. CSS ownership

- **MUST** tập trung token chung; giữ semantic naming và áp dụng palette chính thức tại mục 2.2. Token màu khác với palette này là legacy, không phải nguồn chuẩn cho thiết kế mới.
- **MUST** phân biệt style của shell, primitives, patterns và feature.
- **SHOULD** chuyển dần từ `index.css` global sang style ownership rõ ràng (CSS Modules, scoped classes hoặc giải pháp phù hợp hiện tại).
- **MUST NOT** tiếp tục thêm mọi CSS feature mới vào stylesheet global 1.635 dòng không giới hạn.
- **MUST NOT** tạo selector global mơ hồ có nguy cơ ảnh hưởng component không liên quan.
- Khi chia CSS, chụp screenshot trước/sau và chứng minh không thay đổi visual identity ngoài phạm vi đã duyệt.

### 9.4. Dependency policy

- **Không tự cài** Ant Design, Carbon, PatternFly, Material UI, Tailwind, icon pack, state library hoặc calendar library chỉ vì có trong tài liệu tham khảo.
- Nếu muốn thêm dependency, cần ghi: vấn đề cần giải, component hiện có đã thử chưa, footprint, license, performance, khả năng tương thích React/Vite, migration cost, phương án thay thế.
- Ưu tiên tận dụng component hiện có và bổ sung một hệ design primitives vừa đủ cho đồ án.
- Route lazy loading là cải tiến đo theo số liệu, không phải điều kiện bắt buộc chỉ vì chunk trên ngưỡng warning.

---

## 10. RESPONSIVE & ACCESSIBILITY — QUALITY GATES

### 10.1. Viewport test bắt buộc cho trang bị sửa

| Viewport | Mục tiêu |
|---|---|
| 390 × 844 (hoặc tương đương) | Mobile: không vỡ, CTA/table/form/case sử dụng được |
| 768 × 1024 | Tablet: sidebar và nội dung điều chỉnh hợp lý |
| 1280 × 800 | Laptop nhỏ: staff workspace không quá rộng/scroll hỗn loạn |
| 1440 × 900 | Desktop chuẩn: bố cục, hierarchy, density |
| 1920 × 1080 | Desktop rộng: không giãn nội dung vô tổ chức |

- **MUST** dùng responsive **theo nhu cầu layout**, không chỉ có đúng một breakpoint vì code cũ như vậy.
- **MUST** hỗ trợ staff sidebar collapse/drawer ở màn hình hẹp theo pattern thống nhất.
- **MUST** đảm bảo bảng, filter, modal, form, sticky bar, queue/detail và sơ đồ ghế không bị che hoặc cắt mất action.
- **MUST** kiểm thử scroll ngang cố ý vs overflow làm hỏng layout.
- Với seat map có bố cục không gian, **MAY** scroll/zoom có chỉ dẫn; không bắt ép scale bé đến mức không chọn được ghế.

### 10.2. Accessibility baseline

Mục tiêu thiết kế và kiểm thử: **WCAG 2.2 AA** ở các tiêu chí áp dụng.

- Text thường tỷ lệ tương phản **≥ 4.5:1**, text lớn **≥ 3:1** theo WCAG.
- Thành phần UI quan trọng và chỉ báo focus có độ tương phản phù hợp; không chỉ truyền đạt trạng thái bằng màu.
- Keyboard-only: Tab/Shift+Tab/Enter/Space/Escape hoạt động đúng, không keyboard trap.
- **MUST** có focus visible rõ, thứ tự focus theo đọc/luồng tác vụ, focus return sau dialog.
- **MUST** input có label, error liên kết được, bảng có header/scope phù hợp.
- **MUST** thông báo async/validation quan trọng có semantic status/alert thích hợp.
- **MUST** hỗ trợ zoom/reflow và `prefers-reduced-motion` nơi có animation.
- Kích thước hit target cần đáp ứng tiêu chí WCAG liên quan (**WCAG 2.2 AA Target Size Minimum 24×24 CSS px, có ngoại lệ**); **SHOULD** ưu tiên vùng chạm khoảng 40–44px khi dùng touch nếu bố cục cho phép.
- **MUST** kiểm tra bằng axe/Playwright khi công cụ sẵn có và kiểm thử thủ công bàn phím; không đánh dấu WCAG PASS chỉ từ source.

---

## 11. QUY TẮC DỮ LIỆU, QUYỀN VÀ NGHIỆP VỤ KHÔNG ĐƯỢC PHÁ

**Kiến trúc:** `React → REST API → Node.js/Express → Stored Procedure → SQL Server`.

- **MUST NOT** đưa `SELECT/INSERT/UPDATE/DELETE`, View/Function/Trigger/Procedure invocation trực tiếp vào Frontend.
- **MUST NOT** thay API contract hoặc DB schema chỉ để làm UI thuận tay hơn khi chưa có quyết định riêng.
- **MUST NOT** tính authoritative giá vé, khuyến mãi, doanh thu, trạng thái ghế, trạng thái thanh toán hoặc permission ở client.
- **MUST** sử dụng dữ liệu thật và response server để chốt nghiệp vụ; mock chỉ cho môi trường test/thiết kế được đánh dấu rõ.
- **MUST** lấy identity từ session/server theo contract; không dùng client-supplied role/userId làm thẩm quyền.
- **MUST** duy trì RBAC và Manager scope, ownership của order/complaint, quyền xử lý và báo cáo.
- **MUST** giữ API errors (đặc biệt 401/403/404/409/422/500) có đường xử lý tương ứng trong UI.
- **MUST** giữ chính sách giá không có `Ngày lễ`.
- **MUST** giữ biến đổi thời gian/timezone và snapshot/history semantics hiện có.
- **MUST** tránh regression của ADM-07 cinema images, booking held seats, complaint stale selection và duplicate writes.
- **MUST** không thêm bảng DB, feature nghiệp vụ hay dịch vụ ngoài phạm vi 42 UC từ một ý tưởng UI.

---

## 12. QUY TRÌNH BẮT BUỘC TRƯỚC KHI CODE / REFACTOR MỘT MÀN HÌNH

### Gate 0 — Khảo sát hiện trạng

- Đọc route, component, CSS, API usage, permission, state và audit issue liên quan.
- Chụp screenshot trước khi sửa ở viewport mục tiêu khi browser khả dụng.
- Xác định nghiệp vụ/UC, dữ liệu API thật, hành vi hiện có cần giữ.
- Ghi vấn đề thực sự và bằng chứng; không suy đoán từ tên file.

### Gate 1 — Screen specification (CHƯA CODE)

Với mỗi màn hình hoặc nhóm màn hình, lập bảng/đặc tả:

```text
Screen ID / Route:
Role / Permission / Use Case:
Mục tiêu chính:
Task chính và success outcome:
Ngữ cảnh bắt buộc (user/cinema/showtime/complaint/order):
Information hierarchy:
Navigation / breadcrumb / back behavior:
Layout / responsive behavior:
Các component/pattern dùng chung:
API hiện có và data contract:
States: loading / empty / error / success / disabled:
Destructive/confirmation flows:
Async/race/ownership risks:
A11y / keyboard / focus:
Các phần KEEP / IMPROVE / REFACTOR / REDESIGN:
Acceptance criteria:
```

**MUST** có wireframe hoặc mô tả bố cục đủ cụ thể cho trang redesign lớn trước khi code. Không cần tạo mockup cho thay đổi một label nhỏ.

### Gate 2 — Architecture approval

- Kiểm tra có thêm field/feature/API ngoài scope không.
- Kiểm tra dự định tách component, state ownership và route migration.
- So sánh phương án với quy chuẩn này và các phần phải giữ.
- Với thiết kế thay đổi IA/visual identity lớn: phải có phê duyệt trước khi implement.

### Gate 3 — Implementation

- Thực hiện theo **vertical slice nhỏ**: một feature/một màn hình có thể chạy, không viết lại toàn hệ thống cùng lúc.
- Không trộn refactor kiến trúc, redesign layout, đổi API và fix business rule trong một thay đổi khó review khi có thể tách.
- Dùng tokens, patterns, API, auth và async guards được duyệt.
- Không ẩn lỗi/skip tests để làm screenshot trông đúng.

### Gate 4 — Verification

- Test/lint/build phải PASS (trừ known issue được ghi rõ).
- Browser test thực hiện đúng role và positive/negative flow nếu môi trường cho phép.
- Kiểm tra permission, refresh, deep links, back/forward, stale response, double submit, error/retry.
- Chụp screenshot các viewport quan trọng; kiểm tra visual regression thực tế.
- Axe + keyboard focus; kiểm tra empty/loading/error với data fixture phù hợp.
- Đối chiếu 42 UC để chứng minh không mất chức năng. Với phase đơn lẻ chỉ cần regression đầy đủ UC bị ảnh hưởng + smoke chung; final nghiệm thu phải kiểm 42/42.
- Không được ghi `PASS` khi chỉ phân tích source hoặc chỉ có build PASS; dùng `NOT VERIFIED`/`BLOCKED` kèm lý do.

### Gate 5 — Delivery

Mỗi task UI/UX cần báo cáo ngắn: issue đã xử lý, routes/components, trước/sau, API contract unchanged hoặc thay đổi đã duyệt, test evidence, UI screenshots, known limitations, remaining risks.

---

## 13. MAPPING TRỰC TIẾP TỪ FRONTEND DEEP AUDIT (2026-10-11)

| Audit ID | Ràng buộc khắc phục | Mức ưu tiên theo audit |
|---|---|---|
| FE-01 | Admin sidebar theo nhóm, module riêng, route-backed; không dồn 16 section vào trang đơn khối | P2 |
| FE-02 | Curated columns/action và table patterns; không expose toàn bộ DTO | P2 |
| FE-03 | RETIRED phần quản lý RBAC; giữ selector vai trò lúc tạo tài khoản và selector Manager/rạp + xác nhận chuyển rạp | P1 |
| FE-04 | CSKH filter có commit boundary, không duplicate request và không xóa draft âm thầm | P2 |
| FE-05 | CSKH case deep link và restore ngữ cảnh làm việc | P2 |
| FE-06 | CSS ownership theo shell/primitives/features, giữ tokens/identity | P2 |
| FE-07 | Đo performance rồi mới quyết định code splitting | P3 |

Điểm 56/100 và điểm portal trong audit là **ước lượng source-only**, không phải kết quả đo chất lượng giao diện thực tế. Audit cũ có 65 tests PASS nhưng không có browser screenshot/axe/E2E hiện hành. Khi đưa thiết kế mới vào code, phải bổ sung runtime evidence.

---

## 14. ACCEPTANCE CHECKLIST — AI CODING & CODE REVIEW

Một màn hình thay đổi chỉ được đánh dấu UI/UX DONE nếu các mục **áp dụng** bên dưới đều đạt:

### IA & visual

- [ ] Trang có mục tiêu, tiêu đề, primary action và phân cấp thông tin rõ.
- [ ] Navigation đúng nhóm nghiệp vụ; active state và back/deep link hoạt động.
- [ ] Bố cục/phong cách đúng portal; không copy trang tham khảo pixel-perfect.
- [ ] Brand tokens, typography, spacing, icon và status thống nhất.
- [ ] Không có card/nút/màu/animation thừa gây mất tập trung.

### Data & interaction

- [ ] Table có cột theo task; không render mọi field API tự động.
- [ ] Form có label/validation, lựa chọn theo tên thay vì ID kỹ thuật.
- [ ] Loading/empty/error/success/retry đầy đủ cho những trạng thái áp dụng.
- [ ] Dangerous actions có xác nhận cụ thể; không double-submit.
- [ ] Không stale response, nhầm resource, mất unsaved input ngoài chính sách.
- [ ] RBAC, ownership, manager scope và API contract không suy giảm.

### Responsive & quality

- [ ] Kiểm tra viewport mobile/tablet/laptop/desktop theo scope.
- [ ] Không overflow gây bất khả dụng; keyboard và focus hoạt động.
- [ ] Kiểm tra contrast/a11y theo WCAG 2.2 AA (các tiêu chí áp dụng).
- [ ] Test/lint/build PASS; browser evidence được lưu khi có khả năng chạy.
- [ ] Regression của UC bị tác động PASS; trường hợp chưa xác minh được ghi rõ.
- [ ] Không có DBMS/business logic authoritative trong Frontend.

### AI Coding STOP CONDITIONS

**PHẢI DỪNG và hỏi/ghi design clarification** nếu:

1. Thiết kế yêu cầu một API/field/permission/UC chưa tồn tại.
2. Cần sửa Database/Backend để hoàn thiện UX trong khi scope chỉ cho Frontend.
3. Đề xuất đổi toàn bộ palette, font hoặc visual identity mà chưa được duyệt.
4. Cần xóa, thay thế hoặc bỏ qua một guard chống stale write/ownership/authorization.
5. Không xác định được UI đang thao tác resource nào, hoặc context có nguy cơ lệch.
6. Muốn cài UI framework lớn, trả phí hoặc dependency chưa được đánh giá.
7. Test quan trọng fail và không có đủ thông tin để giải quyết mà không phá hành vi cũ.

---

## 15. NGOẠI LỆ VÀ QUẢN TRỊ THAY ĐỔI QUY CHUẨN

Ngoại lệ với một quy tắc MUST phải được ghi:

```text
Exception ID:
Rule / section:
Affected feature / route:
Why the standard is not appropriate here:
Alternative UX and security/accessibility approach:
Impact on 42 UC / API / RBAC / Design System:
Evidence / prototype / test plan:
Decision owner / approval:
Review date:
```

Không tự ý thay đổi quy chuẩn hoặc bỏ check khi không có quyết định. Nếu tài liệu thiết kế và hành vi thật khác nhau, cần chỉ rõ sự khác biệt để xử lý thay vì âm thầm sửa theo một giả định.

---

## 16. TÀI LIỆU CƠ SỞ VÀ THAM KHẢO

### 16.1. Nguồn nội bộ của dự án

- `FRONTEND_DEEP_AUDIT_REPORT.md` — Frontend Deep Audit (2026-10-11), issue FE-01...FE-07, source/static audit, readiness.
- Lộ trình hiện có trong `UX_ARCHITECTURE_BLUEPRINT.md` §7.2 — baseline 42 UC; roadmap cũ đã được thu gọn khỏi repo, không yêu cầu tái tạo.
- Các tài liệu phân tích thiết kế/Use Case và ma trận 42 UC hiện hành trong repository (nếu đường dẫn thay đổi, tra file thực tế thay vì đoán path).

### 16.2. Nguồn chính thức tham khảo pattern (không phải phụ thuộc thư viện)

- Ant Design — Data Entry: https://ant.design/docs/spec/data-entry/
- Ant Design — Form Page: https://ant.design/docs/spec/research-form/
- Ant Design — Detail Page: https://ant.design/docs/spec/detail-page/
- IBM Carbon — Data Table Usage: https://carbondesignsystem.com/components/data-table/usage/
- PatternFly — Page: https://www.patternfly.org/components/page/
- PatternFly — Navigation: https://www.patternfly.org/components/navigation/
- PatternFly — Dashboard: https://www.patternfly.org/patterns/dashboard/
- Atlassian Design System: https://atlassian.design/
- Zendesk — Agent Workspace (reference): https://support.zendesk.com/
- Intercom — Inbox (reference): https://www.intercom.com/
- Nielsen Norman Group — Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- W3C — WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Galaxy Cinema: https://www.galaxycine.vn/
- BHD Star: https://www.bhdstar.vn/
- CGV Vietnam: https://www.cgv.vn/
- Fandango: https://www.fandango.com/

**Lưu ý:** Những tham khảo này truyền cảm hứng cho pattern/heuristics, không chứng minh rằng hệ thống của dự án đã đạt UX tốt. Mọi thiết kế của dự án phải được kiểm chứng trên code, dữ liệu và trình duyệt thật.

---

## 17. DIRECTIVE NGẮN DÀNH CHO AI CODING AGENT

> Khi triển khai hoặc sửa bất kỳ màn hình React nào, **đọc và tuân thủ** `FRONTEND_UIUX_DESIGN_STANDARDS.md` trước. Trước khi code, xác định role, UC, task, route, information hierarchy, component patterns, API contract, async/permission risks và trạng thái UX. Dùng **Modern Cinematic Commerce** cho Customer; **Enterprise Control Center** cho Admin; **Case Management Workspace** cho CSKH; **Cinema Operations Workspace** cho Manager. Áp dụng palette trắng–xanh chính thức ở mục 2.2, giữ logo và ý nghĩa trạng thái, cùng 42 UC, DBMS-first, REST contract và các guards hiện hữu. Không tự thêm feature, không sửa backend/database, không đưa ID/CSV/JSON kỹ thuật làm thao tác chính, không render raw DTO thành bảng, không chuyển mọi module thành nút ngang cấp. Chỉ triển khai từng slice nhỏ sau khi có design specification; đo/kiểm thử bằng browser, responsive, accessibility và regression. Nếu yêu cầu xung đột hoặc thiếu bằng chứng, dừng và ghi clarification; không tự đoán.

**Kết luận ràng buộc:** Frontend phải được thiết kế **theo nhiệm vụ người dùng, có ngữ cảnh rõ, bố cục nhất quán, dữ liệu trình bày có chủ đích, và hành vi an toàn**. Đẹp nhưng khó dùng hoặc chạy được nhưng tổ chức rối đều **không đạt chuẩn**.

# UX Architecture Blueprint — Phase 1

## Bổ sung quản lý đặt vé nhân viên — baseline hiện hành

**44 Use Case hoạt động:** Customer 14, Manager 10, CSKH 6, Admin 14. `QLR-10` quản lý đặt vé trong rạp được phân công còn hiệu lực; `ADM-18` quản lý đặt vé toàn hệ thống. `ADM-17` vẫn là cấu hình hệ thống ngoài phạm vi. Giữ ba ID `ADM-03/04/05` RETIRED: tổng 47 ID truy vết; số 45 chỉ còn trong snapshot nghiệm thu cũ và tên file giữ để tương thích liên kết.

Bốn role và ma trận seed cố định giữ nguyên. Module mới yêu cầu role chính xác ADMIN/QUAN_LY_RAP và quyền `DAT_VE` hiện có; mọi SP tự kiểm tra actor còn hoạt động và Manager scope. Customer chỉ được chọn từ tài khoản KHACH_HANG đang hoạt động bằng tên/email/SĐT, không nhập ID hay tạo tài khoản thay trong luồng này.

**Quy tắc được chủ dự án chấp thuận:** tạo đơn Chờ thanh toán bằng nghiệp vụ booking hiện có (giới hạn giữ chỗ/ghế, khóa concurrency, giá snapshot); không tự thanh toán. Chỉ sửa ghế trong cùng suất chiếu khi đơn còn hạn giữ chỗ, chưa có bất kỳ lần thử thanh toán, không có khuyến mãi/đồ ăn hoặc vé đã sử dụng. Customer, suất chiếu, thời hạn giữ, tiền đồ ăn/giảm giá không sửa. Ghế giữ nguyên giữ snapshot/mã vé; ghế bỏ chuyển Đã hủy và giữ bản ghi; ghế mới tính giá hiện tại và mã vé mới. Không xóa vật lý. Hủy toàn bộ đơn Chờ thanh toán bằng quy tắc hiện có, giữ lịch sử vé/payment. Chặn hủy khi có thanh toán đang xử lý/thành công hoặc vé đã sử dụng để không đua với thanh toán. Đơn đã thanh toán/hoàn thành chỉ xem: source chưa có hoàn tiền tự nguyện; đây là blocker của hủy/hoàn tiền loại đơn này, không dùng hủy suất chiếu để giả lập.

**Kiến trúc triển khai:** route `/admin/bookings` và `/manager/bookings` riêng cho module mới, không refactor portal cũ. API dưới `/api/admin/bookings` và `/api/manager/bookings`: GET list (search/status/cinemaId/page/pageSize), GET customers (search tên/email/SĐT, tối thiểu 2 ký tự, tối đa 50 kết quả mỗi tìm kiếm), GET options (cinemaId/showtimeId/orderId khi sửa), GET `/:orderId`, POST create, PUT `/:orderId/seats`, POST `/:orderId/cancel`. DELETE bị từ chối 405, không ghi/xóa dữ liệu; không có API ghi payment/RBAC mới. Pagination danh sách thực hiện ở SQL; lookup suất tối đa 200 kết quả, trả total/truncated rõ và lọc theo rạp.

**Nghiệm thu bắt buộc:** hai role list/search/filter/detail/create/edit/cancel; Customer không tồn tại/sai role/khóa; Manager ngoài scope/hết hiệu lực; invalid show/room/seat; cùng ghế race/double-submit; paid/used/payment-in-flight từ chối và no-write; snapshot/history giữ nguyên; browser desktop/mobile, keyboard/modal/dirty/stale-request. Không kế thừa PASS lịch sử; ghi kết quả thực chạy trong FINAL_SYSTEM_AUDIT.md. Main deployment vẫn cần review và phê duyệt theo database/README.md.


> **Project:** Hệ thống đặt vé xem phim  
> **Status:** Đề xuất kiến trúc UX; chưa triển khai source code  
> **Baseline:** 44 Use Case hoạt động (Customer 14, Manager 10, CSKH 6, Admin 14); 47 ID truy vết; `ADM-17` ngoài phạm vi
> **Design standard:** [`docs/standards/FRONTEND_UIUX_DESIGN_STANDARDS.md`](standards/FRONTEND_UIUX_DESIGN_STANDARDS.md)  
> **Audit basis:** [`docs/audits/frontend-deep-audit/FRONTEND_DEEP_AUDIT_REPORT.md`](audits/frontend-deep-audit/FRONTEND_DEEP_AUDIT_REPORT.md)

## 1. Mục tiêu, phạm vi và căn cứ

Blueprint này xác định kiến trúc điều hướng, bố cục và component cho bốn portal trước khi bắt đầu Phase 2. Đây là đặc tả thiết kế, không phải cam kết rằng route hay component đề xuất đã tồn tại.

Phase 1 chỉ cập nhật chuẩn màu và tạo tài liệu này. Không thay đổi React/CSS, API, backend, database, RBAC, manager scope hoặc business logic. Mọi path mới bên dưới chỉ tổ chức lại các năng lực đang có; không tạo Use Case hoặc API mới.

**Quyết định RBAC cố định (11/10/2026):** 44 Use Case hoạt động: Customer 14, Manager 10, CSKH 6, Admin 14. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 47 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có.

### 1.1. Nguồn đối chiếu

| Nguồn | Điều được dùng trong blueprint |
|---|---|
| Frontend deep audit | Route/source hiện tại, điểm nghẽn IA, ownership, trạng thái kiểm chứng và regression risk |
| Frontend UI/UX Design Standards v1.1.0 | Palette chính thức, WCAG, patterns và ràng buộc không mở rộng nghiệp vụ |
| `USE_CASE_MATRIX_45.md` và bảng traceability trong audit | Phạm vi và ID của 44 UC; không tính `ADM-17` |
| Frontend source | `routes/index.jsx`, `AreaLayout`, `AdminPortal`, `SupportPortal`, `ManagerPortal`, customer pages/components và API modules |

### 1.2. Hiện trạng ảnh hưởng đến kiến trúc

- Customer đã có route theo hành trình từ phim/rạp đến booking, đơn, thanh toán và khiếu nại.
- Audit lịch sử ghi nhận 18 section Admin; sau fixed RBAC còn 16 section legacy; module đặt vé mới nâng tổng navigation destinations lên 17. Quản lý vai trò/quyền/grant bị loại khỏi ứng dụng; account và phân công giữ workflow hiện có.
- CSKH hiện gom filter, queue, detail, order reference, timeline và hai form xử lý vào `/support`. Filter đổi là gọi lại queue và xóa case đang chọn; detail/filter không được phục hồi bằng URL.
- Manager hiện gom dashboard, phòng/ghế, suất chiếu, giá và doanh thu tại `/manager`. Rạp được chọn là ngữ cảnh quan trọng nhưng chưa gắn với route.
- Source có shared async states, status badge, API clients và permission helpers cần giữ. Audit là static review: browser hiện tại chưa được chạy lại theo 44 UC; matrix lưu verdict ACCEPTED nhưng raw evidence cũ đã bị dọn. Không coi audit/source scan là bằng chứng nghiệm thu Phase 2.

## 2. Design direction và chuẩn màu

### 2.1. Design direction

| Portal | Hướng thiết kế | Lý do và tiêu chí cảm nhận |
|---|---|---|
| Customer | **Modern Cinematic Commerce** | Dùng poster/phim làm cảm xúc chính, nhưng đường đặt vé rõ ràng và toàn giao diện vẫn sáng, trắng–xanh. |
| Admin | **Enterprise Control Center** | Phân nhóm tác vụ, dữ liệu có cột chọn lọc, form theo resource và có thể truy cập từng module trực tiếp. |
| CSKH | **Case Management Workspace** | Queue, case đang xử lý, lịch sử và action tách rõ; giữ đúng case qua điều hướng và ngăn ghi nhầm. |
| Manager | **Cinema Operations Workspace** | Rạp được chọn luôn hiện diện; tác vụ phòng/ghế, lịch chiếu, giá và doanh thu nằm trong nhóm dễ tìm. |

Hai shell ở mức kiến trúc: `PublicShell` cho khám phá/đặt vé và `StaffShell` cho Admin/CSKH/Manager. Đây là ranh giới trải nghiệm, không bắt buộc tên component khi triển khai.

### 2.2. Palette chính thức

Palette dưới đây đồng bộ với chuẩn tại mục 2.2 của `FRONTEND_UIUX_DESIGN_STANDARDS.md`; mọi token màu cũ khác palette được xem là legacy khi thiết kế mới.

| Token | Giá trị | Sử dụng |
|---|---|---|
| Primary Blue | `#2563EB` | CTA, link, selection/focus khi phù hợp |
| Primary Hover | `#1D4ED8` | Hover/pressed |
| Primary Dark | `#1E40AF` | Active/emphasis; nền action cần tương phản cao |
| Background | `#F8FAFC` | Nền cấp trang |
| Surface | `#FFFFFF` | Bề mặt form, bảng, card nội dung và dialog |
| Light Blue Surface | `#EFF6FF` | Bề mặt selection hoặc nhóm có ý nghĩa |
| Primary Text | `#0F172A` | Tiêu đề và nội dung chính |
| Secondary Text | `#475569` | Nhãn, mô tả và nội dung phụ |
| Border | `#CBD5E1` | Đường phân tách nhẹ |

Giữ các semantic tokens success/warning/error/info/disabled và ý nghĩa trạng thái hiện hành. Không dùng chúng làm trang trí hoặc thay đổi trạng thái nghiệp vụ. Chữ trên primary/hover/dark blue dùng trắng; chữ trên light blue dùng màu đậm. Border `#CBD5E1` không thay cho focus ring hoặc đường biên duy nhất nếu thiếu tương phản. Không dùng dark theme làm chủ đạo, gradient lòe loẹt, glow, glassmorphism hay neon.

Tỷ lệ tính theo công thức tương phản WCAG cho một số cặp màu text phổ biến: `#2563EB`/trắng 5.17:1; `#1D4ED8`/trắng 6.70:1; `#1E40AF`/trắng 8.72:1; `#475569`/trắng 7.58:1; `#2563EB`/`#EFF6FF` 4.75:1. Các tỷ lệ này không chứng minh toàn hệ thống đạt WCAG: semantic status, focus, hình ảnh, hover, disabled và từng trang vẫn cần được đo/kiểm tra khi triển khai.

## 3. Sitemap và nhóm navigation

### 3.1. Sitemap toàn hệ thống

```text
Public / Customer (PublicShell)
├── Trang chủ                              /
├── Phim                                   /movies
│   └── Chi tiết phim + lịch chiếu         /movies/:movieId
├── Rạp                                    /cinemas
│   └── Chi tiết rạp + lịch chiếu          /cinemas/:cinemaId
├── Đặt vé                                 /booking/:showtimeId
├── Đăng nhập / Đăng ký                    /login | /register
├── Hồ sơ                                  /profile
├── Khu vực khách hàng                     /account
├── Đơn của tôi                            /orders
│   ├── Chi tiết                            /orders/:orderId
│   └── Thanh toán                          /orders/:orderId/payment
└── Khiếu nại của tôi                      /complaints
    └── Chi tiết khiếu nại                 /complaints/:complaintId

Staff (StaffShell; role guard/scope hiện hành)
├── Admin                                  /admin → /admin/overview
│   ├── Tổng quan                          /admin/overview
│   ├── Tài khoản & phân công
│   │   ├── Người dùng                     /admin/access/users
│   │   └── Phân công quản lý              /admin/access/assignments
│   ├── Rạp & cơ sở vật chất
│   │   ├── Rạp                             /admin/cinemas
│   │   ├── Ảnh rạp                        /admin/cinemas/images
│   │   ├── Phòng                          /admin/facilities/rooms
│   │   └── Ghế                            /admin/facilities/seats
│   ├── Nội dung
│   │   ├── Phim                           /admin/catalog/movies
│   │   ├── Thể loại                       /admin/catalog/genres
│   │   └── Diễn viên                      /admin/catalog/actors
│   ├── Kinh doanh & vận hành
│   │   ├── Sản phẩm                        /admin/commerce/products
│   │   ├── Khuyến mãi                      /admin/commerce/promotions
│   │   ├── Bảng giá                        /admin/operations/pricing
│   │   ├── Suất chiếu                      /admin/operations/showtimes
│   │   └── Quản lý đặt vé                   /admin/bookings
│   └── Chăm sóc & báo cáo
│       ├── Khiếu nại                       /admin/service/complaints
│       └── Doanh thu                       /admin/reports/revenue
├── Manager                                /manager → /manager/overview
│   ├── Tổng quan                          /manager/overview
│   ├── Phòng                              /manager/rooms
│   ├── Ghế                                /manager/seats
│   ├── Suất chiếu                         /manager/showtimes
│   ├── Bảng giá                           /manager/pricing
│   ├── Quản lý đặt vé                      /manager/bookings
│   └── Doanh thu                          /manager/revenue
└── CSKH                                   /support → queue
    └── Chi tiết case                      /support/complaints/:complaintId
```

`/admin` và `/manager` tiếp tục là entry point tương thích. `/admin` mở overview nếu được phép; nếu không, mở section đầu tiên được cấp quyền, còn không có section phù hợp thì hiển thị 403. `/manager` mở overview trong scope rạp được phân công. Customer routes hiện có được giữ. Không có route ADM-17. Route con là đề xuất front-end cho các màn hình dùng năng lực/API hiện tại; cần xác nhận route guard/permission tương ứng trước khi triển khai.

### 3.2. Sidebar Admin: 16 section legacy + 1 module đặt vé, 6 nhóm

| Nhóm sidebar | Section hiện tại được tổ chức | Route đề xuất | UC |
|---|---|---|---|
| Tổng quan | Tổng quan | `/admin/overview` | ADM-16 (dashboard) |
| Tài khoản & phân công | Tài khoản; Phân công/chuyển rạp | `/admin/access/users`, `/admin/access/assignments` | ADM-02, ADM-06 |
| Rạp & cơ sở vật chất | Rạp; Ảnh rạp; Phòng; Ghế | `/admin/cinemas`, `/admin/cinemas/images`, `/admin/facilities/rooms`, `/admin/facilities/seats` | ADM-07–ADM-08 |
| Nội dung | Phim; Thể loại; Diễn viên | `/admin/catalog/movies`, `/admin/catalog/genres`, `/admin/catalog/actors` | ADM-09–ADM-10 |
| Kinh doanh & vận hành | Sản phẩm; Khuyến mãi; Bảng giá; Suất chiếu; Quản lý đặt vé | `/admin/commerce/products`, `/admin/commerce/promotions`, `/admin/operations/pricing`, `/admin/operations/showtimes` | ADM-11–ADM-14 |
| Chăm sóc & báo cáo | Khiếu nại; Doanh thu | `/admin/service/complaints`, `/admin/reports/revenue` | ADM-15–ADM-16 |

Đếm theo section hoạt động: 1 + 2 + 4 + 3 + 5 + 2 = **17** (16 legacy + 1 module route riêng). `ADM-03/04/05` RETIRED. `ADM-01` là xác thực/truy cập, không phải mục CRUD.

### 3.3. Quy tắc route và state

- Route phải giữ role guard, permission filtering, manager scope và backend authorization hiện có. Ẩn mục menu không phải là cơ chế bảo mật.
- Admin section, Support case và Manager workspace phải có active state, title, browser back/forward và refresh đúng đối tượng khi người dùng được phép.
- CSKH có thể lưu `status`, `type`, `priority` vào query string nếu các giá trị này được xác nhận không nhạy cảm. Free-text `search` chỉ được đưa vào URL sau phân loại dữ liệu; nếu có thể chứa dữ liệu cá nhân thì giữ ở state cục bộ. Path case dùng ID route như contract hiện có, không nhúng nội dung khiếu nại vào URL.
- Manager có selector rạp bằng tên. Có thể lưu ID rạp đã chọn trong route state/query để khôi phục màn hình; validate ID đó với danh sách rạp được phân công và server mỗi lần tải/ghi. URL không cấp quyền và ID không xuất hiện dưới dạng ô nhập cho người dùng.
- Search/filter/sort/page phải nói rõ chạy ở client hay API. Không giả định API pagination, metrics, field, status hoặc lookup mới. Nếu API hiện tại không trả nhãn reference cần cho selector, ghi design blocker; không quay lại nhập ID thủ công.

## 4. Screen architecture và wireframe

Các kích thước trong wireframe là khung thiết kế: desktop 1280–1440 px, tablet 768–1024 px, mobile khoảng 390 px. Breakpoint triển khai được quyết định theo nội dung và phải kiểm tra tại các viewport quy định trong standard.

### 4.1. Admin — Enterprise Control Center

#### Shell và điều hướng

```text
DESKTOP
┌────────────────┬──────────────────────────────────────────────────────┐
│ Logo / Admin   │ Ngữ cảnh | tài khoản                                 │
│ Sidebar nhóm   ├──────────────────────────────────────────────────────┤
│ ▾ Tổng quan    │ Breadcrumbs                                           │
│ ▾ Tài khoản    │ H1 + mô tả ngắn                         [Primary CTA] │
│ ▾ Rạp & CSVC   │ Search / filter / reset                               │
│ ▾ Nội dung     │ Bảng cột chọn lọc / nội dung trang                    │
│ ▾ Kinh doanh   │                                                       │
│ ▾ CSKH & BC    │                                                       │
└────────────────┴──────────────────────────────────────────────────────┘

MOBILE
┌────────────────────────────────────────────┐
│ ☰  Admin                    Tài khoản       │
│ H1 / breadcrumb / CTA                       │
│ Filter (xếp hàng hoặc mở panel)             │
│ Bảng cuộn có chủ đích hoặc danh sách task   │
└────────────────────────────────────────────┘
```

Sidebar desktop phân nhóm có thể thu gọn; chỉ hiển thị section hợp quyền. Mobile dùng drawer, đóng sau khi chọn route. Không biến 17 destinations thành dãy nút ngang.

#### Mẫu trang danh sách/CRUD

| Thành phần | Đặc tả và lý do | Acceptance criteria |
|---|---|---|
| Page header | Tên task và resource; breadcrumb khi có chiều sâu; một primary action | Có một H1 phản ánh đúng route; action chỉ hiện khi user có permission hiện tại |
| Filter toolbar | Chỉ filter phục vụ tìm bản ghi; search/apply/reset cùng hành vi nhất quán | Không tự thêm filter cho field không có trong source/API; reset có kết quả dễ nhận biết |
| Data table | Cột theo resource, nhãn tiếng Việt và thông tin giúp chọn hành động; ID kỹ thuật ở detail nếu thật sự cần | Không render tất cả field DTO; loading/empty/error/retry rõ; không giả vờ server pagination |
| Row action | View/edit/status/cancel theo quyền và capability hiện có; action nguy hiểm có confirm | Mutation gắn đúng row, khóa double-submit, giữ feedback/error mapping |
| CRUD form | Field theo domain contract; control chọn tên cho reference có dữ liệu lookup; validation cạnh field | Không yêu cầu nhập ID, CSV hoặc JSON thô làm luồng chính; không tự thêm trường hoặc rule |
| Dialog/drawer/detail | Dùng dialog cho xác nhận/tác vụ ngắn; form dài hoặc phụ thuộc nhiều field dùng màn hình/drawer phù hợp | Focus vào/ra đúng, Escape không làm mất draft im lặng, mobile không bị cắt action |

#### Screen families

| Màn hình | Bố cục / component | Acceptance criteria |
|---|---|---|
| Overview + revenue | KPI/summary chỉ lấy dữ liệu dashboard/revenue hiện có; tên, đơn vị, khoảng thời gian, phạm vi; chart chỉ khi có ích | Không tự tính authoritative revenue ở client; không thêm KPI/endpoint; loading/empty/error hiển thị đúng |
| Users, assignments | Table + form; chọn vai trò cố định lúc tạo tài khoản; vai trò hiện hữu chỉ đọc; chọn Manager/rạp theo tên; hiển thị phân công hiện tại | Không có CRUD/grant RBAC; chuyển rạp xác nhận tên Manager, rạp cũ → mới; SQL kiểm tra role/scope/transaction |
| Cinemas/images | Rạp làm đối tượng cha; ảnh gắn đúng cinema đang chọn; giữ ownership/request-generation guard của `CinemaImageManager` | Khi đổi rạp A→B, response/draft A không được ghi vào B; action ảnh chỉ áp dụng đúng rạp |
| Rooms/seats | Hierarchy `Rạp → Phòng → Ghế`; selector theo tên; sơ đồ không gian cho ghế khi phù hợp dữ liệu | Luôn thấy ngữ cảnh cha; status ghế có text/legend/icon và màu; không nới rule lịch sử |
| Movies/genres/actors | Movie list có poster/tiêu đề/metadata có sẵn; cast chọn actor tên/role nếu contract hỗ trợ | Không sửa cast qua JSON thô trong luồng thông thường; không giả định field/API mới |
| Products/promotions/pricing | Resource table + form domain-specific; giá trị/hiệu lực/status đúng dữ liệu; giữ day type `Ngày thường`, `Cuối tuần`, `Tất cả` | Không thêm `Ngày lễ`; không tính giá cuối trên frontend; input theo shared contract |
| Showtimes | Table/lịch theo phòng nếu dữ liệu hiện tại hỗ trợ; dòng nêu phim–rạp–phòng–ngày giờ–format–status | Tạo/sửa/hủy giữ API, guard và timezone; hủy có confirm; xung đột hiển thị từ server |
| Complaints | Visual detail/timeline và processing/status actions | Chỉ tái sử dụng primitive; không gộp permission hoặc business workflow với CSKH |

#### Rủi ro và điểm quyết định

- **Cao:** route extraction có thể làm mất permission filtering, async ownership hoặc mutation guards. Chuyển từng module, kiểm thử bốn vai trò cố định và forbidden RBAC writes và deep-link.
- **Cao:** chuyển rạp và ảnh rạp có hậu quả lớn; cần xác nhận diff trước khi save và regression A→B→A cho cinema image.
- **Trung bình:** curated table có thể bỏ sót metadata hữu ích; xác nhận cột với resource field hiện có trước khi triển khai.

### 4.2. CSKH — Case Management Workspace

#### Desktop và mobile wireframe

```text
DESKTOP ≥ 1280
┌──────────────────────┬──────────────────────────────┬─────────────────────┐
│ VÙNG 1 — QUEUE         │ VÙNG 2 — CHI TIẾT + TIMELINE │ VÙNG 3 — REFERENCE + │
│ Tìm kiếm              │ Người gửi + trạng thái       │ ACTIONS             │
│ 4 filter + Áp dụng    │ Nội dung khiếu nại           │ Đơn tham chiếu      │
│ Kết quả / case list   │ Timeline theo thứ tự        │ Ghi lần xử lý       │
│ Selected case rõ ràng │                              │ Đổi trạng thái      │
└──────────────────────┴──────────────────────────────┴─────────────────────┘

TABLET / MOBILE
┌───────────────────────────────────────────┐
│ Queue list + filter panel                 │
│ Chọn case → mở trang detail riêng         │
│ ← Hàng chờ | Chi tiết + Timeline          │
│ Đơn tham chiếu + Hành động (panel/card)   │
└───────────────────────────────────────────┘
```

Desktop giữ ba vùng không trùng lặp: **Queue | Chi tiết + Timeline | Đơn tham chiếu + Hành động**. Timeline chỉ nằm cùng nội dung chi tiết; vùng thứ ba chỉ chứa trạng thái/reference order và hai mutation hiện có. Ở tablet/mobile, vùng 1 chuyển thành bước/list riêng; vùng 2 vẫn chứa chi tiết và timeline; vùng 3 thành card hoặc panel bên dưới, không nhân đôi timeline/reference.

| Vùng | Đặc tả | Acceptance criteria |
|---|---|---|
| Queue | Search, 4 filter hiện có (status, priority, type, text), list có trạng thái chọn | Chọn mô hình `draftFilters → Áp dụng → một lần tải` hoặc debounce không nút Apply dư; không gọi mỗi ký tự lẫn lần nữa khi submit |
| Case detail | Nội dung, người gửi, status, timeline có người/thời gian/nội dung theo data có | Route case mở được trực tiếp; case A response không ghi lên case B; selected state có accessible state |
| Reference/context | Tham chiếu order nếu có; tách loading/empty/error/denied | Không tham chiếu thì nói rõ không gắn đơn; lỗi và denied không bị hiển thị như dữ liệu rỗng |
| Processing | Form ghi lần xử lý | Giữ là mutation riêng và đúng contract; unsaved text được cảnh báo trước khi rời/đổi case |
| Status | Form đổi trạng thái riêng | Không gộp thành hành động ghi chú; lựa chọn/status vẫn do contract hiện tại quyết định |

#### Workflow

`Mở hàng chờ → soạn filter → áp dụng → chọn case → đọc detail/timeline → xem đơn tham chiếu nếu được phép → ghi lần xử lý hoặc đổi trạng thái → nhận kết quả → tiếp tục case khác`.

- Chỉ có một case authoritative đang được hiển thị. Khi đổi filter và case không còn khớp, giải thích việc selection bị bỏ; draft chưa lưu không bị xóa âm thầm.
- Khi mutation đang chạy, khóa action tương ứng, gắn kết quả với complaintId đang xác nhận và chặn duplicate write.
- Không thêm SLA, chat, assignment, chatbot, AI reply hoặc tự động phân công.

### 4.3. Manager — Cinema Operations Workspace

#### Shell và ngữ cảnh rạp

```text
DESKTOP
┌────────────────┬──────────────────────────────────────────────────────┐
│ Sidebar        │ Rạp hiện tại: [Tên rạp ▼]   User                     │
│ Tổng quan      ├──────────────────────────────────────────────────────┤
│ Phòng          │ Breadcrumb + H1 + action                             │
│ Ghế            │ Bộ lọc theo task                                     │
│ Suất chiếu     │ Table / lịch theo phòng / form theo capability       │
│ Bảng giá       │                                                      │
│ Doanh thu      │                                                      │
└────────────────┴──────────────────────────────────────────────────────┘

MOBILE
┌─────────────────────────────────────────────┐
│ ☰  [Tên rạp ▼]                              │
│ H1 / action                                 │
│ Chọn vùng: Tổng quan | Phòng | Suất chiếu…  │
│ Nội dung một task; form full width          │
└─────────────────────────────────────────────┘
```

Rạp hiện tại nằm trên shell/header của tất cả route manager. Selector chỉ liệt kê rạp trả về trong phân công hiện có. Mọi API call tiếp tục được server kiểm tra; việc có `cinemaId` trong UI/URL không mở rộng scope.

| Nhóm | Bố cục và component | Acceptance criteria |
|---|---|---|
| Overview | Chỉ số và hoạt động hiện có, nhãn đơn vị/kỳ/rạp | Không thêm KPI hoặc tổng hợp doanh thu ngoài dữ liệu backend |
| Phòng | Table/form gắn với rạp đang chọn | Khi đổi rạp, selection/form cũ bị reset hoặc reload có thông báo |
| Ghế | Chọn phòng bằng tên, sơ đồ seat map; vùng seat map có scroll/zoom có chỉ dẫn trên touch | Trạng thái ghế không chỉ dựa vào màu; thao tác gắn đúng rạp/phòng hiện tại |
| Suất chiếu | Danh sách theo ngày/phòng; có thể dùng timeline/resource grid nếu data hiện tại đủ; table view luôn khả dụng | Tạo/sửa/hủy giữ contract, timezone, permissions; không thêm lịch/calendar API |
| Bảng giá | Form/table theo pricing rules và day type hiện có | Giữ các giá trị day type hiện hành; không tính authoritative price ở client |
| Doanh thu | Bộ lọc khoảng thời gian và metric đã trả về | Rạp/phạm vi/kỳ luôn có nhãn; lỗi và empty không bị thay bằng số 0 giả |

#### Workflow và context reset

`Xác thực → tải danh sách rạp được phân công → chọn rạp → chọn module → thao tác trong scope đó → đổi module hoặc rạp`. Khi đổi rạp, resource phụ thuộc rạp phải reload hoặc reset. Response cũ, form cũ và lựa chọn phòng cũ không được ghi/hiển thị như ngữ cảnh mới.

### 4.4. Customer — Modern Cinematic Commerce

#### Trang chủ và discovery

```text
DESKTOP
┌─────────────────────────────────────────────────────────────────────┐
│ Logo | Phim | Rạp | Đơn của tôi* | Đăng nhập / Tài khoản            │
├─────────────────────────────────────────────────────────────────────┤
│ Hero phim thật / nội dung nổi bật                    [Đặt vé][Chi tiết]│
│ Đặt vé nhanh: Phim [▼]  Rạp [▼]  Ngày [▼]             [Xem suất]     │
│ Đang chiếu: movie cards                                                │
│ Lịch chiếu/đường vào showtime theo phim hoặc rạp                       │
│ Sắp chiếu: movie cards (nếu API cung cấp)                              │
└─────────────────────────────────────────────────────────────────────┘

MOBILE
┌──────────────────────────────────────────────┐
│ Logo                         ☰ / Tài khoản  │
│ Hero poster theo chiều dọc + CTA            │
│ Đặt vé nhanh (selector xếp dọc)             │
│ Đang chiếu (grid 2 cột hoặc list)            │
│ Chọn phim/rạp → lịch chiếu                   │
└──────────────────────────────────────────────┘
```

Trang chủ dùng white/light-blue surfaces và blue CTA; poster/backdrop tạo cảm xúc, không biến toàn trang thành dark theme. Hero lấy dữ liệu phim có thật; nếu không có khái niệm featured trong API hiện tại, dùng module discovery thông thường thay vì bịa featured data. `Đang chiếu`, `Sắp chiếu`, quick booking và schedule chỉ render khi nguồn hiện có cung cấp data/đường đi thật.

| Screen family | Bố cục và components | Acceptance criteria |
|---|---|---|
| Home | Hero, quick booking selector, đang chiếu, đường đến lịch chiếu, sắp chiếu tùy dữ liệu | Không có suất giả; CTA dẫn đến movie/detail/booking route hiện có; bỏ section không có data |
| Movie list/card | Poster ratio thống nhất, title, metadata/status có sẵn, hành động xem/đặt phù hợp | Card có accessible name; ảnh lỗi có fallback; không dùng mọi DTO field |
| Movie detail | Poster/backdrop, thông tin phim, reviews, lịch chiếu nhóm theo rạp/ngày khi API hỗ trợ | Showtime chọn được dẫn tới `/booking/:showtimeId`; eligibility review do server quyết định |
| Cinema list/detail | Tên/vị trí/ảnh có sẵn, gallery, lịch chiếu nếu có | Gallery không che nhiệm vụ tìm rạp/lịch; không thêm giờ/địa điểm giả |
| Booking | Progress `Suất → Ghế → Đồ ăn → Khuyến mãi (tùy chọn) → Xác nhận`; seat map; summary; hold/deadline | Giữ limits, 409/conflict, authoritative price, hold, timezone và submit lock; đổi showtime reset state cũ |
| Orders/payment | Order list → detail/payment theo routes đã có; status/totals từ backend | Không làm mất history; double payment bị ngăn; lỗi/thất bại thanh toán hiển thị rõ |
| Customer complaint/review | Tạo/xem complaint, timeline; review trong movie detail | Không bắt buộc complaint phải có order; status/eligibility do server quyết định |
| Account/auth | Register/login/profile/account và Forbidden/NotFound theo shell phù hợp | Không đổi xác thực/role; redirect sau login vẫn giữ route an toàn, lỗi 401/403/404 rõ |

#### Booking layout theo viewport

- **Desktop:** nội dung thao tác (seat/product/promotion) ở vùng chính; order summary và hold status ở panel bên cạnh, sticky chỉ khi không che content.
- **Tablet:** summary chuyển thành panel thu gọn hoặc khối dưới task; vẫn thấy tổng và deadline trước xác nhận.
- **Mobile:** một bước mỗi màn hình hoặc cùng-page wizard có progress; seat map có vùng cuộn riêng và legend; CTA tiếp tục không che ghế/action. Summary có thể thu gọn nhưng tổng cuối và thời hạn phải dễ xem trước khi submit.
- Giá chốt, tình trạng ghế, promotion eligibility và thanh toán tiếp tục đến từ API/server/DBMS; UI chỉ hiển thị và chuyển thao tác.

## 5. Shared Design System và component ownership

### 5.1. Token contract

| Nhóm | Token/đặc tả | Quy tắc |
|---|---|---|
| Color | 9 màu chính thức ở §2.2; semantic success/warning/error/info/disabled | Không tạo palette riêng cho portal; đo contrast cho foreground/background thực tế |
| Typography | Giữ font brand hiện hành; phân cấp H1/section/body/support/caption | Body/control dễ đọc; staff thường 14–16px, customer reading khoảng 16px theo standard |
| Spacing | Nhịp cơ sở bội số 4: 4/8/12/16/24/32 | Token hóa, không thêm spacing rời rạc vô lý |
| Shape/elevation | Radius/shadow theo token hiện có sau inventory | Không thêm glass/glow; tránh card bao từng field/row |
| Focus/interaction | Focus visible, hover/pressed/disabled, reduced motion | Focus không chỉ dựa vào `#CBD5E1`; keyboard và touch đều dùng được |
| Status | Status text + semantic color; cùng status cùng mapping ở các portal | Không truyền tải ý nghĩa bằng màu duy nhất |

Không đặt giá trị mới cho semantic success/warning/error, font, radius hoặc shadow trong Phase 1 nếu chưa inventory và contrast-check. Design system dùng palette chuẩn và semantic roles; trạng thái nghiệp vụ giữ mapping hiện hành.

### 5.2. Shared component specification

| Component/pattern đề xuất | Trách nhiệm | Không sở hữu |
|---|---|---|
| `PublicShell`, `StaffShell` | Header/navigation, content frame, responsive shell, account context | Business rules, API mutation, permission decision |
| `PortalSidebar` / mobile drawer | Nhóm menu, active route, permission-filtered visibility | Thay thế server authorization |
| `Breadcrumbs`, `PageHeader` | Vị trí, tiêu đề, mô tả, action slot | Tự suy luận quyền hoặc dữ liệu |
| `DataTable` | Semantic table, curated column config, row focus/actions, async states | Sinh cột từ mọi DTO; tự giả lập server pagination |
| `FilterBar` | Nhóm filter, draft/applied state, clear/apply affordance | Endpoint hoặc domain-specific filter semantics |
| `ResourceForm` primitives | Label, help, validation, field state; selector có nhãn | Tự định nghĩa business validation mới |
| `EntitySelect` | Hiển thị label cho reference hiện có và ẩn ID kỹ thuật khỏi thao tác | Fetch/permission logic không rõ nguồn; nhập ID thay thế khi thiếu lookup |
| `Dialog` / `ConfirmDialog` | Focus management, cancel/confirm, destructive action summary | Gửi mutation; action callback do feature cung cấp |
| `AsyncState` / `InlineNotice` | Loading/empty/error/retry/success states | Nuốt API error hoặc biến denied thành empty |
| `StatusBadge` | Status label + consistent semantic mapping | Đổi màu tùy portal hoặc chỉ hiển thị màu |
| `UnsavedChangesGuard` | Cảnh báo rời màn hình khi form có draft | Tự lưu hoặc tự gửi draft |
| `CinemaContextBar` | Hiển thị/chọn rạp được phân công và gửi context changes tới feature | Cấp quyền scope cho manager |
| `SeatMap`, `ProductPicker`, `HoldDeadline` | Booking visual controls và hold feedback dùng hiện có | Authoritative pricing, reservation/payment business rules |
| `ComplaintTimeline`, `OrderReferencePanel` | Hiển thị lịch sử/tham chiếu như visual primitives | Hợp nhất permission/mutation giữa Admin và CSKH |

### 5.2.1. Component API contract

Các API dưới đây là component-level contract, không phải REST/API backend. Props có thể nhận thêm native HTML attributes tương ứng; không cho phép prop ghi đè semantic/accessibility behavior cốt lõi.

| Component | Props / variants / states | Responsive | Accessibility và interaction |
|---|---|---|---|
| `Button` | `variant`: primary/secondary/tertiary/danger/quiet; `size`: sm/md/lg; `loading`, `disabled`, native button props | Chiều rộng theo nội dung; caller có thể truyền class cho full-width mobile | Native `<button>`, type rõ (`button` mặc định), disabled ngăn submit/click; loading có accessible label và khóa lặp |
| `Input` | Native input props + `size`, `invalid`; states default/focus/disabled/invalid | Width 100% trong field container; không ép chiều rộng cố định | Luôn liên kết label/hint/error từ `FormField`; `aria-invalid`, focus visible, không xóa native keyboard behavior |
| `Select` | Native select props + `size`, `invalid`; children là option hiện có | Width 100%; option native dùng được trên touch | Label rõ, keyboard native; không dùng ID kỹ thuật làm visible option khi có label lookup |
| `FormField` | `id`, `label`, `required`, `hint`, `error`, `children` (một control) | Label/control/error xếp dọc ở mọi viewport | `htmlFor`, `aria-describedby`, `aria-invalid`, error announcement; không tự đặt domain validation |
| `Dialog` | `open`, `onOpenChange`, `title`, `description`, `size` sm/md/lg, `children`, `footer`, `closeLabel` | Giới hạn chiều rộng/cao theo viewport; mobile gần full width, nội dung scroll nội bộ | Native modal dialog, `aria-labelledby/describedby`, Escape đóng, focus vào/ra, không đóng âm thầm khi pending |
| `ConfirmDialog` | Dialog props + `confirmLabel`, `cancelLabel`, `variant` primary/danger, `busy`, `onConfirm` | Full-width actions trên mobile | Có mô tả hậu quả; cancel/confirm phân biệt; `busy` khóa duplicate; callback không gọi API bên trong; lỗi callback hiện trong dialog |
| `PageHeader` | `title`, `description`, `breadcrumbs`, `actions` | Actions wrap/stack khi thiếu chiều rộng | H1 duy nhất theo page; heading hierarchy không bị component tự nhảy cấp |
| `Breadcrumbs` | `items: [{label, to?}]`; item cuối là trang hiện tại | Wrap hoặc cuộn có chủ đích trên viewport hẹp | `<nav aria-label="Breadcrumb">`, ordered list, `aria-current="page"`; link keyboardable |
| `DataTable` | `columns`, `rows`, `getRowKey`, `caption`, `status`, `emptyMessage`, `error`, `onRetry` | Table nằm trong horizontal-scroll region có label; không chuyển table thành card mặc định | `<table>`, caption, `scope=col`, row key ổn định, `aria-busy`; không tự giả server sort/page |
| `FilterBar` | `onSubmit`, `onReset`, `actions`, `children`, `label`; state do caller sở hữu | Fields wrap/stack; action không tràn ngang | `<form>` và accessible name; Enter submit; reset gọi callback rõ ràng, không tự gọi API |
| `StatusBadge` | `status`, `className` tùy chọn; semantic variant lấy từ mapping status hiện tại | Inline, wrap được | Luôn hiển thị status text; màu không phải tín hiệu duy nhất; giữ status mapping đã có |
| `AsyncState` | `status: idle/loading/success/empty/error`, `children`, `loadingMessage`, `emptyMessage`, `error`, `onRetry` | Trải hết bề rộng vùng nội dung, không ép chiều cao | Loading/success dùng status phù hợp; error dùng alert; retry là button có tên; không coi denied là empty |

### 5.2.2. Definition of done cho component

- Có typed/prop documentation, default values, variants và state matrix; callback semantics và event behavior được nêu rõ.
- Bàn phím, visible focus, accessible name/label, disabled/loading, reduced motion và high zoom đã được review.
- Breakpoint behavior được xác định; content không cắt, action không khuất, không tạo cuộn lồng nhau ngoài chủ đích.
- Component không gọi API, không chứa permission/business rules của Admin/Manager/CSKH/Customer; side effect chỉ giới hạn ở tương tác UI được mô tả.

### 5.3. Ownership đề xuất

| Layer/feature | Ownership | Source hiện có làm điểm xuất phát |
|---|---|---|
| `app` / routes / shells | Route config, guards, `PublicShell`, `StaffShell` | `routes/index.jsx`, `layouts/AreaLayout.jsx`, `RequireAuth`, `RequireRole` |
| `components/ui` | Button, field, select, dialog, badge, focus primitives | `components/primitives/StatusBadge.jsx`, styles hiện có |
| `components/patterns` | PageHeader, table, filter, AsyncState, timeline visual | `CatalogStates`, `ComplaintOrderReference` |
| `features/admin` | Mỗi resource module, CRUD state/form/table; API qua `adminApi` | `pages/AdminPortal.jsx`, `components/AdminRevenue.jsx`, `CinemaImageManager.jsx`, `utils/adminForms.js` |
| `features/support` | Queue, complaint detail, processing/status state; API qua `supportApi` | `pages/SupportPortal.jsx` |
| `features/manager` | Cinema context, room/seat/showtime/pricing/revenue; API qua `managerApi` | `pages/ManagerPortal.jsx`, `ManagerResourceForm.jsx`, `ManagerRevenue.jsx` |
| `features/customer` | Catalog, detail, reviews, orders, complaints, account | Existing customer pages and `MovieCard`, `MovieGrid` |
| `features/booking` | Booking journey state, seat/product/promo/hold | `BookingPreparation.jsx`, `SeatMap`, `ProductPicker`, `HoldDeadline` |
| `api` | Existing REST client contracts; route features consume them | `src/api/*Api.js`, `httpClient.js` |
| `styles` | Tokens, base, shell, pattern and feature ownership | Current `index.css` (1,635 lines); split only incrementally |

Architecture is a target ownership map, not an instruction to create empty folders or add dependencies. A shared visual component must not silently combine role-specific business rules.

## 6. Mapping đủ 44 Use Case hoạt động + 3 RETIRED

Các destination bên phải là kiến trúc đề xuất cho 44 UC hoạt động. Ba ID RETIRED được giữ để truy vết; không có route/workflow đích cho chúng. Risk chỉ mức độ regression khi di chuyển UI.

| UC | Chức năng baseline | Route/source hiện tại | Destination/screen đề xuất | Risk |
|---|---|---|---|---|
| KH-01 | Đăng ký | `/register` — `Register` | `/register` — Auth | Trung bình |
| KH-02 | Đăng nhập | `/login` — `Login`, `AuthContext` | `/login` — Auth | Cao: session/return route |
| KH-03 | Hồ sơ | `/profile` — `Profile` | `/profile` — Account/Profile | Trung bình |
| KH-04 | Xem phim/list/detail | `/movies`, `/movies/:movieId` — `Movies`, `MovieDetail` | Giữ routes; Customer catalog/detail | Trung bình |
| KH-05 | Xem lịch chiếu | `/movies/:movieId`, `/booking/:showtimeId` — `ShowtimeBrowser` | Schedule trong movie/cinema detail → booking route hiện có | Cao: showtime selection |
| KH-06 | Chọn ghế | `/booking/:showtimeId` — `BookingPreparation`, `SeatMap` | Giữ route — Booking / seat step | Cao: seat state/conflict |
| KH-07 | Đặt vé | `/booking/:showtimeId` — `BookingPreparation`, `HoldDeadline` | Giữ route — Booking / confirm | Cao: hold, duplicate write |
| KH-08 | Đồ ăn kèm vé | `/booking/:showtimeId` — `ProductPicker` | Giữ route — Booking / product step | Cao: order payload/price |
| KH-09 | Khuyến mãi | `/booking/:showtimeId` — promotion flow | Giữ route — Booking / optional promotion | Cao: validation/conflict |
| KH-10 | Thanh toán | `/orders/:orderId/payment` — `PaymentPage` | Giữ route — Order payment | Cao: payment attempt/hold |
| KH-11 | Lịch sử đơn | `/orders` — `Orders` | Giữ route — Orders list | Trung bình |
| KH-12 | Chi tiết đơn | `/orders/:orderId` — `OrderDetail` | Giữ route — Order detail | Cao: ownership/status/history |
| KH-13 | Đánh giá | `/movies/:movieId` — `MovieReviews` | Giữ route — Movie detail/reviews | Trung bình: server eligibility |
| KH-14 | Khiếu nại | `/complaints`, `/complaints/:complaintId` | Giữ routes — Customer complaints | Cao: create/reference/history |
| QLR-01 | Đăng nhập/rạp phân công | `/login`, `/manager` — `RequireRole`, `ManagerPortal` | `/login`, `/manager/overview` — Manager shell/context | Cao: manager scope |
| QLR-02 | Quản lý phòng | `/manager` — `ManagerPortal`, `ManagerResourceForm` | `/manager/rooms` — Rooms | Cao: cinema/resource context |
| QLR-03 | Quản lý sơ đồ ghế | `/manager` — `ManagerPortal` | `/manager/seats` — Room selector + seat map | Cao: room/seat mutation |
| QLR-04 | Tạo suất chiếu | `/manager` — `ManagerPortal`, `ManagerResourceForm` | `/manager/showtimes` — Create mode | Cao: schedule/scope/timezone |
| QLR-05 | Sửa suất chiếu | `/manager` — `ManagerPortal` | `/manager/showtimes` — Edit selected showtime | Cao: hydrate/submit correct row |
| QLR-06 | Hủy suất chiếu | `/manager` — `ManagerPortal` | `/manager/showtimes` — Cancel action | Cao: destructive action/server conflict |
| QLR-07 | Cấu hình bảng giá | `/manager` — `ManagerPortal` | `/manager/pricing` — Pricing | Cao: price contract/day type |
| QLR-08 | Dashboard hoạt động rạp | `/manager` — `ManagerPortal` | `/manager/overview` — Operations summary | Trung bình: scope/metric provenance |
| QLR-09 | Doanh thu rạp | `/manager` — `ManagerRevenue` | `/manager/revenue` — Revenue | Cao: assigned-cinema scope/date range |
| CSKH-01 | Đăng nhập | `/login`, `/support` — `RequireRole` | `/login`, `/support` — Support queue | Cao: role/permission |
| CSKH-02 | Hàng chờ khiếu nại | `/support` — `SupportPortal` | `/support` — Queue + applied filters | Cao: query count/selection behavior |
| CSKH-03 | Chi tiết khiếu nại | `/support` — local selected case | `/support/complaints/:complaintId` — Case detail | Cao: deep link/stale selection |
| CSKH-04 | Đơn tham chiếu | `/support` — `ComplaintOrderReference` | Case detail context panel | Cao: permission/denied vs empty |
| CSKH-05 | Ghi lần xử lý | `/support` — processing form | Case detail / Processing form | Cao: unsaved draft/duplicate write |
| CSKH-06 | Đổi trạng thái | `/support` — status form | Case detail / Status form | Cao: status contract/write lock |
| ADM-01 | Đăng nhập | `/login`, `/admin` — `RequireRole` | `/login`, `/admin/overview` — Admin shell | Cao: auth/section guard |
| ADM-02 | Tài khoản người dùng | `/admin` → users | `/admin/access/users` — Users | Trung bình-cao: role bất biến; tạo đúng role, khóa/mở |
| ADM-03 | Vai trò — RETIRED | Lịch sử: `/admin` → roles | Không có route/UI | Kiểm tra API/SP ghi bị từ chối |
| ADM-04 | Danh mục quyền — RETIRED | Lịch sử: `/admin` → permissions | Không có route/UI | Kiểm tra danh mục bất biến |
| ADM-05 | Gán quyền — RETIRED | Lịch sử: permissions/grants | Không có route/UI | Kiểm tra ma trận bất biến |
| ADM-06 | Phân công quản lý | `/admin` → assignments | `/admin/access/assignments` — Assignments | Cao: manager/cinema scope |
| ADM-07 | Rạp và hình ảnh | `/admin` → cinemas/cinemaImages | `/admin/cinemas`, `/admin/cinemas/images` | Cao: image ownership/request guards |
| ADM-08 | Phòng và ghế toàn hệ | `/admin` → rooms/seats | `/admin/facilities/rooms`, `/admin/facilities/seats` | Cao: hierarchy/resource link |
| ADM-09 | Phim và diễn viên | `/admin` → movies/actors | `/admin/catalog/movies`, `/admin/catalog/actors` | Trung bình-cao: cast mapping |
| ADM-10 | Thể loại | `/admin` → genres | `/admin/catalog/genres` | Trung bình: CRUD/links |
| ADM-11 | Sản phẩm đồ ăn | `/admin` → products | `/admin/commerce/products` | Trung bình-cao: price/decimal |
| ADM-12 | Chương trình khuyến mãi | `/admin` → promotions | `/admin/commerce/promotions` | Cao: decimal/eligibility contract |
| ADM-13 | Bảng giá toàn hệ | `/admin` → pricing | `/admin/operations/pricing` | Cao: day type/price rules |
| ADM-14 | Suất chiếu toàn hệ | `/admin` → showtimes | `/admin/operations/showtimes` | Cao: time/cancel/conflict |
| ADM-15 | Xử lý khiếu nại | `/admin` → complaints | `/admin/service/complaints` | Cao: distinct Admin permissions/workflow |
| ADM-16 | Báo cáo toàn hệ | `/admin` → dashboard/revenue | `/admin/overview`, `/admin/reports/revenue` | Trung bình-cao: metric provenance |

| QLR-10 | Quản lý đặt vé tại rạp | Module mới | `/manager/bookings` | Cao: scope, concurrency, payment/snapshot |
| ADM-18 | Quản lý đặt vé toàn hệ | Module mới | `/admin/bookings` | Cao: Customer eligibility, trạng thái/history |

Coverage check: 14 KH + 10 QLR + 6 CSKH + 14 ADM = **44 UC hoạt động**; 3 ADM RETIRED = 47 ID truy vết. Không thêm `ADM-17`; không biến route con thành UC mới.

## 7. Mapping giao diện cũ → kiến trúc đề xuất và migration

| Hiện trạng/source | Đích thiết kế | Rủi ro hồi quy | Điều kiện chuyển đổi |
|---|---|---|---|
| `AreaLayout` dùng chung cho public/staff | `PublicShell` và `StaffShell` với shared token/primitives | Cao nếu nav/auth/skip link bị mất | Giữ session, guards, account actions, keyboard landmarks và các URL hiện tại |
| `AdminPortal.jsx` 16 section/local state | 6 sidebar groups, 16 legacy destinations + `/admin/bookings`, feature-owned pages | Cao | Verify 14 Admin UC, route refresh/back, permission-filtered nav, guards; giữ `/admin` redirect |
| Generic Admin table / generic form | Per-resource column config + field/selector mapping | Trung bình-cao | So field cũ với DTO/API; empty/loading/error, extra fields, long values và action permissions |
| Role/permission CRUD và grants lịch sử | RETIRED: bỏ UI/API ghi; SP giữ signature nhưng từ chối | Cao | Bốn vai trò đăng nhập đúng quyền; ma trận seed không đổi; mọi API/SP ghi RBAC bị từ chối |
| Admin `CinemaImageManager` | Cinema parent context + image subroute | Cao | A→B→A, ownership, stale response, failed upload/update và không gửi nhầm resource |
| `SupportPortal` một trang, filter local, case local | Queue route + deep-link detail + safe query state | Cao | 6 CSKH UC, request behavior, browser history, stale cases, unsaved notes, duplicate writes, denied reference |
| `ManagerPortal` một trang | Overview/rooms/seats/showtimes/pricing/revenue routes với persistent cinema context | Cao | 9 QLR UC, assigned-cinema only, switch/reset context, timezone, old route redirect |
| Customer route pages và booking components | Giữ route; chuẩn hóa PublicShell/cards/discovery/booking layout | Cao ở booking, trung bình ở catalog | Replay 14 KH UC; seat, hold, promotion, price, payment, reviews, complaint và auth states |
| Global `index.css` 1,635 dòng, breakpoint 768 px | Token + shell/pattern/feature ownership, tách dần style | Cao do shared selector side effects | Baseline screenshots trước/sau; check các route/role/viewport; không làm palette khác chuẩn |

### 7.1. Ranh giới Phase 2/3/4

| Phase | Phạm vi | Không nằm trong phase |
|---|---|---|
| **Phase 2 — Design System & Component Architecture** | Tokens/base styles; PublicShell/StaffShell; responsive grouped navigation tương thích với route hiện tại; shared UI components và API contracts ở §5.2.1 | Không chuyển toàn bộ portal sang route mới; không thay CRUD, workflow, API, RBAC, manager scope hoặc business logic |
| **Phase 3 — Portal Refactor** | Từng bước chuyển Admin/CSKH/Manager/Customer sang grouped routes và screen workflows ở §3–4; dùng shared system | Không thay 44 UC hoặc contract chỉ để đơn giản hóa giao diện |
| **Phase 4 — Overall Acceptance** | Browser smoke và regression 44 UC, viewport, keyboard/accessibility, contrast, screenshots và evidence; xử lý lỗi trong phạm vi được duyệt | Không tuyên bố PASS cho case/viewport chưa chạy thực tế |

Phase 2 verification chỉ xác nhận nền tảng component/shell và route legacy còn hoạt động; nghiệm thu toàn bộ workflow 44 UC thuộc Phase 4 sau Phase 3.

## 8. Checklist nghiệm thu trước Phase 2

### Phê duyệt kiến trúc

- [ ] Palette trắng–xanh tại chuẩn thiết kế được xác nhận là nguồn màu chính thức; semantic success/warning/error vẫn được giữ.
- [ ] Các cặp màu text/control/focus có kế hoạch đo WCAG AA; không lấy các tỷ lệ mẫu trong tài liệu làm chứng nhận toàn sản phẩm.
- [ ] Sitemap 4 portal, 16 section Admin legacy và module đặt vé riêng được duyệt; xác nhận 6 nhóm sidebar, ADM-03/04/05 RETIRED và không có route quản lý RBAC.
- [ ] Paths là front-end routes đề xuất trên capability hiện có; `/admin`, `/manager`, customer URL hiện tại có compatibility plan.
- [ ] Không có `ADM-17`; 44 UC hoạt động mapping đủ 14/10/6/14; giữ 3 ID RETIRED.
- [ ] Admin sidebar groups, CSKH queue/detail/context, Manager cinema context và Customer discovery/booking wireframes được duyệt.
- [ ] Owner của shared components và feature-specific workflows được thống nhất; không có shared component chứa business rules của nhiều role.

### Readiness và regression plan

- [ ] Mỗi route đích có role/permission guard map từ authorization hiện tại; manager scope do backend tiếp tục thực thi.
- [ ] Mỗi screen family có columns/fields/actions được trace tới source/API hiện tại; lookup selector chỉ dùng data đang có.
- [ ] Query params chỉ chứa state không nhạy cảm; support free-text search được phân loại trước khi đưa vào URL.
- [ ] Định nghĩa test/evidence cho refresh, deep-link, back/forward, 401/403/404, loading/empty/error/retry, stale response, duplicate write và unsaved form.
- [ ] Có baseline browser evidence cho 44 UC trước khi di chuyển; matrix ACCEPTED lịch sử không thay thế replay hiện tại.
- [ ] Có viewport review tại 390, 768, 1280, 1440 và 1920 px (standard); kiểm tra bàn phím, zoom/reflow và reduced motion.
- [ ] Booking regression bao gồm seat availability/conflict, hold expiry, product/promotion payload, authoritative total, payment attempt/failure, order history.
- [ ] Admin regression bao gồm RBAC fixed matrix/no-write, role immutable, named Manager/cinema selectors và confirm transfer, CRUD fields, image A→B→A ownership, cancellation conflict và revenue source.
- [ ] CSKH regression bao gồm filter application/request count, case deep link, status/note riêng biệt, dirty draft, reference denied/empty/error và stale write.
- [ ] Manager regression bao gồm assigned-cinema allowlist, đổi rạp khi có request/form đang mở, phòng/ghế/suất/giá/doanh thu đúng context.
- [ ] Migration được review theo từng module; có rollback path hoặc tương thích route rõ trước khi cutover.

### Gate chuyển Phase 1 → Phase 2

Chỉ bắt đầu thay đổi source sau khi blueprint, palette, route map, screen specs, risk plan và UC regression evidence plan được người sở hữu dự án duyệt. Đây là gate phê duyệt thiết kế; blueprint không tự cho phép triển khai.

## 9. Giới hạn và giả định cần xác nhận trong thiết kế triển khai

- Chưa có browser screenshot/inspection trong audit gần nhất; wireframe là cấu trúc, không phải mockup pixel-perfect.
- Matrix lịch sử 45 ID ghi ACCEPTED trước retirement; fixed RBAC chưa nghiệm thu ở thời điểm cập nhật thiết kế, nhưng raw evidence trong `docs` đã bị dọn. Phase 2 phải tái lập baseline trước khi tuyên bố không regression.
- Dashboard, schedule, `Đang chiếu`/`Sắp chiếu`, lookup labels, filters, chart và table pagination chỉ thiết kế khi source/API hiện tại cung cấp dữ liệu phù hợp.
- Khi thiết kế không thể hoàn tất selector/field/cột bằng data và contract hiện có, ghi blocker thay vì bổ sung API, DB column hoặc business rule.
- Không yêu cầu thêm UI library, calendar library, state library hoặc API mới trong Phase 1.

---

**Phase 1 deliverable:** kiến trúc UX và acceptance plan sẵn sàng để review. Phase 2 triển khai design system/shell/shared components; Phase 3 refactor portal; Phase 4 nghiệm thu tổng thể. **Tài liệu này không tự chuyển business logic hoặc route portal trong Phase 2.**

## 10. Đặc tả module quản lý đặt vé (task độc lập, không phải Phase 3)

Desktop: PageHeader + scope rạp → FilterBar tìm kiếm/trạng thái/rạp → DataTable phân trang → chi tiết đơn/vé/payment và form tạo/sửa ghế. Mobile: xếp các vùng dọc; bảng và SeatMap cuộn nội bộ; actions wrap và dialog không tràn viewport. Menu Admin nằm trong Kinh doanh & vận hành, vẫn sáu nhóm; Manager có Quản lý đặt vé. Route riêng giữ deep link qua `?orderId=...` (chỉ ID đối tượng, không đưa email/search PII vào URL).

DataTable cột mã đơn, khách hàng tên/email, phim, suất/rạp/phòng, ghế, số vé, tổng snapshot, trạng thái, xem chi tiết. Detail hiển thị vé gồm mã/ghế/loại/giá/trạng thái và lịch sử payment/đồ ăn/khuyến mãi nếu đã có. CTA tạo → tìm Customer → chọn Customer → chọn rạp/suất → SeatMap → tạo đơn Chờ thanh toán. Edit khóa Customer/suất, chỉ SeatMap với ghế đang thuộc đơn vẫn chọn được. ConfirmDialog mô tả mã đơn/khách hàng, ghế cũ/mới hoặc hậu quả hủy. Không có control sửa giá, payment hoặc DELETE. Pending/dirty khóa đổi context; request generations bảo vệ customer/options/list/detail; busy ref khóa duplicate trước gửi API. Lỗi 403 hiện denied, 409 giữ draft và báo conflict, retry chỉ GET.

Feature owner: `StaffBookings` sở hữu API/draft/permission/scope/guards; shared Button/Input/Select/FormField/PageHeader/DataTable/FilterBar/StatusBadge/AsyncState/ConfirmDialog và SeatMap chỉ nhận props, không thêm business logic. Ràng buộc edit/cancel và flags khả dụng đến từ DBMS. Props trang `portal: admin|manager`; variants theo shell hiện hữu; states loading/empty/error/denied/conflict/submitting/success; responsive 390/768/1280/1440/1920; keyboard native selector, labeled controls, modal focus/return, status live region, token trắng–xanh chính thức.

### Roadmap cập nhật trong phạm vi được duyệt

Tài liệu/baseline 44 → SP và migration chỉ bổ sung module, không đổi Customer booking → Backend typed RPC/role guards → route và workspace mới → unit/API/SQL/concurrency/browser regression → báo cáo kết quả/blocker. Phase 3 refactor portal cũ vẫn chưa được mở. Hoàn tiền tự nguyện/xóa vật lý vé không có quy tắc và không nằm trong triển khai này.

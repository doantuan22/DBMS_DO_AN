# MASTER BLUEPRINT V3 — TÁI CẤU TRÚC TOÀN BỘ FRONTEND HỆ THỐNG ĐẶT VÉ XEM PHIM

> **Dự án:** Cinema Ticket Booking — React.js + Node.js/Express + SQL Server (DBMS-first)  
> **Phiên bản tài liệu:** 3.0 — 11/10/2026  
> **Loại:** Đặc tả kiến trúc UX/UI + hướng dẫn triển khai + checklist nghiệm thu theo module  
> **Trạng thái:** **DESIGN PROPOSAL — CHỜ PHÊ DUYỆT; KHÔNG PHẢI KẾT QUẢ ĐÃ CODE/TEST**  
> **Tài liệu này không sửa source, API, Stored Procedure, Database hay baseline Use Case.**

---

## HƯỚNG DẪN SỬ DỤNG TÀI LIỆU

1. **Đọc §§1–6 trước**: xác định nguồn sự thật, quy định bất biến, thiết kế điều hướng, visual system và component.
2. **Triển khai §§7–11 theo từng màn hình**: từng đặc tả bao gồm bộ lọc, cột bảng, tác vụ, bố cục, trạng thái và rủi ro cần bảo vệ.
3. **Dùng §§12–17 làm runbook**: thứ tự từng slice, cách kiểm tra source/API, browser acceptance, DoD, ma trận UC và biểu mẫu nghiệm thu.
4. **Không “code all” trong một lần**. Bắt buộc xác nhận yêu cầu, chốt screen-spec, triển khai và kiểm thử **từng slice nhỏ** trước khi chuyển module.
5. Trong văn bản: **MUST** = bắt buộc; **SHOULD** = ưu tiên trừ khi có lý do ghi nhận; **PROPOSED** = cần xác nhận; **BLOCKED** = thiếu hợp đồng dữ liệu/API, không được đoán; **VERIFIED V2** = đã có bằng chứng audit, không đồng nghĩa E2E PASS.

### Tóm tắt quyết định

- **Không viết lại toàn bộ hệ thống**. Có thể thay mới phần lớn *presentation + screen composition + navigation* nhưng giữ auth, quyền, API và các safety guards.
- **Admin/Manager là công cụ vận hành rạp**, không phải bộ CRUD tạo tự động từ DTO; mọi module phải có công cụ tìm/lọc phù hợp. Không áp đặt “table” cho sơ đồ ghế hoặc thời khóa biểu.
- **Mọi list có search/filter có nghĩa**, nhưng phải phân biệt *đã hỗ trợ trong contract* và *bộ lọc đề xuất cần kiểm chứng*.
- **Không hiển thị ID khóa chính kỹ thuật làm cột mặc định**; hiển thị **STT** theo tập kết quả/phân trang và nhãn có ý nghĩa. Mã đơn/mã giao dịch có chức năng tra cứu là ngoại lệ được phép hiển thị.
- **Sơ đồ ghế**: `Rạp → Phòng → sơ đồ vật lý`; kiểm tra khả dụng/giữ/đã bán **chỉ khi có suất chiếu**. Không cho phép thao tác ghi thiếu bảo vệ lịch sử vé.
- **RBAC cố định**: không có UI thêm/sửa/xóa role, permission, role-permission, hoặc thay role tài khoản sau tạo. Admin **giữ** phân công/chuyển rạp cho Manager.
- **Quản lý đặt vé** cho Admin toàn hệ thống, Manager trong phạm vi rạp được phân công; yêu cầu vé thuộc **Customer hiện có**. “Sửa/xóa” phải được giải nghĩa theo trạng thái đơn và SP; không được tùy tiện UPDATE/DELETE dữ liệu thanh toán.
- Màu nhận diện **trắng–xanh** đã chốt; cải thiện mạnh thông tin và quy trình, không thay đổi nhận diện.

---

# 1. CĂN CỨ, ĐỘ TIN CẬY VÀ BASELINE

## 1.1. Nguồn nội bộ đã đối chiếu

| Nguồn | Đóng góp | Giới hạn |
|---|---|---|
| `FRONTEND_DEEP_AUDIT_V2_REPORT.md` (11/10/2026) | Browser evidence, route inventory, 10 issue, 71 screenshots được báo cáo, 44 UC hoạt động | Không có 44/44 E2E acceptance; nhiều form/CRUD/filter chưa submit; ảnh trong repo không được đính kèm độc lập vào bản tài liệu này |
| `FRONTEND_DEEP_AUDIT_REPORT.md` (V1) | Root cause: Admin monolith/DTO table, CSKH context, CSS architecture, bundle, thiếu e2e | Source-only ở thời điểm V1; dùng làm bằng chứng lịch sử, không lấn át V2 |
| `FRONTEND_UIUX_DESIGN_STANDARDS_RBAC_FIXED.md` và `FRONTEND_UIUX_DESIGN_STANDARDS.md` | Palette, shared UI, quyền, navigation, responsive, phase gates | Có khác phiên bản; cần đồng bộ trong repo; file chuẩn đích là `docs/standards/FRONTEND_UIUX_DESIGN_STANDARDS.md` |
| `UX_ARCHITECTURE_BLUEPRINT_RBAC_FIXED.md` / `UX_ARCHITECTURE_BLUEPRINT.md` | 6 nhóm Admin, route đích, shells và ownership | Phiên bản RBAC_FIXED cũ còn baseline **42 UC** và chưa có 2 UC quản lý đặt vé; V2 cập nhật thành **44** |
| `ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md` | DBMS-first, không thêm bảng, bảo vệ giá/ghế/giao dịch, `ADM-17` out-of-scope, chỉ 3 day types | Là roadmap nền kỹ thuật trước một số quyết định nghiệp vụ mới; cần kiểm chứng trạng thái phase hiện hành |
| `Phân Tích _ Thiết Kế.docx` | Khái niệm tài khoản, rạp/phòng/ghế, đơn và chi tiết vé, nghiệp vụ và ERD | Có mô tả chức năng RBAC cũ; quyết định RBAC cố định sau đó được ưu tiên về phạm vi |
| `KeHoach_PhatTrien_DuAn_DatVeXemPhim_DBMS_First_v2 (1).docx` | Kiến trúc React → REST API → Stored Procedure → SQL Server | Có tên phase/Use Case số cũ; không dùng để ghi đè baseline V2 |

**Trật tự sử dụng khi có xung đột:** quyết định nghiệp vụ mới đã được người dùng chốt → Use Case Matrix hiện hành trong **repo thật** → quy tắc DBMS hiện hành → Audit V2 với bằng chứng browser → frontend source/API thật → tài liệu UX cũ. Khi hợp đồng API hoặc UC thực tế mâu thuẫn với đề xuất ở đây, **ghi BLOCKED/DECISION**, không âm thầm thay nghiệp vụ.

## 1.2. Baseline đã được Audit V2 ghi nhận

| Portal | UC hoạt động | Ghi chú |
|---|---:|---|
| Customer | 14 | KH-01–KH-14 |
| Manager | 10 | QLR-01–QLR-10; QLR-10 = quản lý đặt vé trong scope rạp |
| CSKH | 6 | CSKH-01–CSKH-06 |
| Admin | 14 | ADM-01, ADM-02, ADM-06–ADM-16, ADM-18 |
| **Tổng** | **44** | 3 UC `ADM-03/04/05` RETIRED; `ADM-17` ngoài scope; **47 ID truy vết** theo Audit V2 |

**Cảnh báo:** tên `USE_CASE_MATRIX_45.md` là tên file lịch sử, **không phải** số lượng UC hiện hành. Khi AI Coding thực thi, phải mở **ma trận thật trong repo** và xác nhận chưa có thay đổi sau ngày 11/10/2026 trước khi cập nhật tài liệu/đưa ra verdict.

## 1.3. Audit V2 đã xác nhận — không phóng đại

- Edge Chromium DevTools Protocol; 72 browser observations, 760 API request records trong lượt kiểm tra, 71 captures được báo cáo.
- 16 section Admin render tại `/admin`, nhưng URL không thay đổi theo section; `/admin/bookings` đã có route riêng.
- Manager dùng một workspace dài `/manager`; `/manager/bookings` có route riêng; biểu mẫu Manager còn nhập ID phim/phòng, danh sách ghế còn dạng hàng dọc.
- CSKH **mất bản nháp** khi đổi filter sau khi nhập nội dung xử lý, đã tái hiện qua browser.
- Public `/` hiển thị tên cơ sở dữ liệu tại `DatabaseHealth`, và thẻ này bị tràn/cắt ở viewport 390 px.
- StaffShell mobile focus drawer chưa chuyển focus vào menu sau khi mở.
- Customer chọn/bỏ chọn ghế hoạt động trong mẫu thử; không submit đặt vé, thanh toán hay hủy đơn trong audit.
- Không phát hiện API response ≥400 hoặc runtime exception **trong tập tác vụ đã chạy**; không chứng minh CRUD/permission/E2E toàn bộ đúng.
- External fonts/images bị `ERR_NETWORK_ACCESS_DENIED` trong môi trường audit; **chưa** kết luận production lỗi ảnh.

## 1.4. Issue V2 → yêu cầu thiết kế

| Issue | Ưu tiên | Gate thiết kế phải xử lý |
|---|---|---|
| UX-01 CSKH draft loss | **P1** | Dirty guard khi lọc/đổi case/rời route, giữ đúng case ID |
| UX-02 Manager raw ID | **P1** | Select bằng tên, value là ID thật, lọc theo rạp được phân công |
| IA-01 Admin local-state routing | P2 | Child routes/deep-link/reload/back |
| IA-02 CSKH vertical queue | P2 | Queue / Detail+Timeline / Reference+Actions |
| IA-03 Admin raw DTO tables | P2 | Per-screen curated columns, STT và row actions rõ |
| IA-04 Manager single page/seat list | P2 | Workspaces riêng, sơ đồ ghế |
| A11Y-01 drawer focus | P2 | Focus entry/containment/restore/Escape |
| CX-01 Customer home | P2 | Phim/lịch chiếu/CTA đặt vé rõ, dùng data thật |
| SEC-01 public DB diagnostics | P2 | Bỏ tên DB/SQL Server khỏi public UI, rà soát public health payload |
| CX-02 health-card overflow | P2 | Gỡ dữ liệu kỹ thuật + test lại 390 px |

**Phát sinh từ phản hồi người dùng / đặc tả mới (chưa phải lỗi V2 browser-verified):** mọi trang quản trị cần bộ lọc đúng nghiệp vụ; sơ đồ ghế Admin; STT thay internal ID; hierarchy cinema/room; bố cục list-first; bổ sung kiểm thử đủ các module. Đây là **approved design direction**, nhưng trạng thái API/filter/CRUD từng module cần kiểm tra khi triển khai.

## 1.5. Nguồn khảo sát chuyên ngành & quy chuẩn công khai

- **Vista Cinema Manager — Seating Layout:** https://help.vista.co/hc/en-nz/articles/12116303258905-Configuring-a-seating-layout-in-Cinema-Manager — tham khảo mô hình sơ đồ vật lý gắn với phòng, hàng/số ghế và vị trí. **Không sao chép** các chức năng nhiều layout, khu vực, ghế đôi/kéo thả nếu ERD/API dự án chưa có.
- **Veezi Cinema Management:** https://www.veezi.com/features/cinema-management — tham khảo dashboard vận hành, giá vé và nghiệp vụ cơ sở rạp.
- **Veezi Film Programming:** https://veezi.com/features/film-programming — tham khảo tổ chức lịch chiếu theo phim/phòng/thời gian, không tự triển khai drag-drop/bulk-copy chưa có contract.
- **IBM Carbon Data Table:** https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines — toolbar search/filter/actions, chủ động chọn cột, pagination, khi nào *không* nên dùng table.
- **W3C WAI-ARIA Modal Dialog:** https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — focus trong dialog, Tab/Shift+Tab, Escape, focus return; dùng tương tự cho overlay staff drawer có tính modal.

Các nguồn này là **tham khảo pattern**, không phải bằng chứng hệ thống trong repo có đủ dữ liệu, UI hay API giống sản phẩm bên ngoài.

---

# 2. NGUYÊN TẮC KHÔNG ĐƯỢC PHÁ VỠ (NON-NEGOTIABLE)

## 2.1. Kiến trúc và dữ liệu

1. React/Vite **chỉ trình bày/tương tác** → REST API Express → Stored Procedure → SQL Server. Không viết SQL nghiệp vụ trong React/backend. Không thêm direct `.query()`/ORM/query builder trong code ứng dụng.
2. Server/DBMS là nguồn sự thật về: rạp được phép, danh mục quyền, tính hợp lệ đặt vé, ghế đã giữ/bán, trạng thái đơn, snapshot giá, doanh thu và thanh toán.
3. Không thêm bảng DB chỉ để phục vụ UX, không tạo trường “giả” rồi ghi dữ liệu vào schema. Nếu cần endpoint lookup/filter mới, **tách change request có phê duyệt**, không tự âm thầm phát triển trong slice UI.
4. Giữ nguyên các guards đã có: request generation/ownership của `CinemaImageManager`, CSKH write locks/stale requests, booking seat/hold context reset, manager cinema scope, chống double submit và authorization.
5. Không phát sinh 404/403 biến thành empty list. Không show stack trace, SQL, token, tên DB, password, config nội bộ trên UI công khai.
6. Khi lọc data đã phân trang phía server, **cấm** lấy một trang rồi lọc client nhưng hiển thị như kết quả toàn CSDL; phải có server-side filter hoặc tải *toàn bộ dữ liệu thuộc scope* ở quy mô nhỏ được xác minh.

## 2.2. Quyết định RBAC cố định

- Chính xác 4 loại vai trò nghiệp vụ: `KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN` (tên mã xác nhận từ DB thật; UI dùng tên tiếng Việt).
- Role xác định khi tạo tài khoản theo nghiệp vụ; khách tự đăng ký luôn là Customer, không được chọn role cao hơn.
- **Không** có create/edit/delete Role, Permission, RolePermission; không có UI grant/revoke, không sửa role tài khoản sau tạo.
- Admin giữ thao tác **phân công/chuyển rạp** cho Manager theo API/SP hiện có; thao tác này không đổi vai trò.
- Sidebar không chứa Vai trò/Quyền/Gán quyền. API bảo vệ RBAC không dựa vào việc ẩn nút.

## 2.3. Quản lý đặt vé Admin/Manager

- Admin tra cứu và thao tác hợp lệ trên toàn hệ thống; Manager chỉ trong **rạp còn được phân công** theo DBMS.
- **Tạo mới**: bắt buộc liên kết tài khoản Customer tồn tại, đúng role và trạng thái hợp lệ; UI chọn bằng tên + thông tin phân biệt (email/SĐT nếu được phép hiển thị), value gửi đi là ID thật.
- Một vé/ghế gắn với đúng đơn, suất chiếu và rạp/phòng; không tạo vé mồ côi để đáp ứng nút “Thêm”.
- “Sửa” được trình bày theo trạng thái cho phép. **Đề xuất cần được chốt bằng API/SP:** chỉ chỉnh ghế/số lượng/sản phẩm/khuyến mãi trên đơn chưa thanh toán và vẫn giữ hợp lệ; không đổi chủ sở hữu, giá, mã vé, trạng thái thanh toán bằng tay.
- “Xóa” phải được xác định là **hủy nghiệp vụ** nếu đã có lịch sử thanh toán/vé; không xoá cứng gây mất lịch sử. Nếu API/SP không hỗ trợ hoặc quy tắc chưa được chốt → **BLOCKED, chỉ show View**, không tự phát minh endpoint.
- Giá snapshot, transaction, hold deadline, promotion consume, seat conflict phải ở backend/DBMS. Không đánh dấu đơn “đã thanh toán” bằng UI action.

## 2.4. Những ràng buộc domain còn hiệu lực

- Giá theo ba loại ngày **Ngày thường / Cuối tuần / Tất cả**; không thêm “Ngày lễ”.
- Ghế có lịch sử vé không được phép bị sửa/xóa trái invariant đã PASS ở verification trước.
- Không hủy suất chiếu khi còn đơn giữ ghế nếu DB chặn; không sửa giá quá khứ khi thay price table.
- Không làm mất liên kết phim–diễn viên, quyền admin endpoint, image ownership, manager assignment.
- Không triển khai `ADM-17` hoặc module RBAC động.

---

# 3. THÔNG TIN, ĐIỀU HƯỚNG VÀ HÀNH TRÌNH

## 3.1. Hai layout, bốn trải nghiệm

| Portal | Shell | Mental model | Ưu tiên của người dùng |
|---|---|---|---|
| Customer/Public | `PublicShell` | Modern Cinematic Commerce | Chọn phim/rạp → suất chiếu → ghế → thanh toán |
| Admin | `StaffShell` | Enterprise Control Center | Tìm tài nguyên → lọc → xem/sửa theo quyền → xác nhận |
| Manager | `StaffShell` + `CinemaContextBar` | Cinema Operations Workspace | Chọn rạp được gán → phòng/sơ đồ/lịch/đặt vé/doanh thu |
| CSKH | StaffShell/Case workspace | Case Management Workspace | Tìm case → xử lý đúng case → lưu → xem timeline |

## 3.2. Sidebar Admin (6 nhóm, không role CRUD)

```text
TỔNG QUAN
  └─ Tổng quan
TÀI KHOẢN & PHÂN CÔNG
  ├─ Tài khoản
  └─ Phân công quản lý
RẠP & CƠ SỞ VẬT CHẤT
  ├─ Rạp chiếu
  ├─ Ảnh rạp (có thể là tab của chi tiết rạp, giữ route tương thích)
  ├─ Phòng chiếu
  └─ Sơ đồ ghế
NỘI DUNG
  ├─ Phim
  ├─ Thể loại
  └─ Diễn viên
KINH DOANH & VẬN HÀNH
  ├─ Suất chiếu
  ├─ Quản lý đặt vé
  ├─ Bảng giá
  ├─ Khuyến mãi
  └─ Sản phẩm
CHĂM SÓC & BÁO CÁO
  ├─ Khiếu nại
  └─ Doanh thu
```

**Đếm UI:** 16 section legacy đã được V2 mở; **thêm vị trí điều hướng cho module đặt vé hiện có**, không nhầm “17 đích đến hiển thị” với “17 UC”. Giữ 6 nhóm, nhưng thứ tự trong từng nhóm ưu tiên nghiệp vụ. `Rạp/Ảnh rạp` có thể dùng tab phụ nhưng phải giữ deep-link tương thích. Menu ẩn resource không đủ quyền theo backend; route trực tiếp vẫn chặn.

## 3.3. Route mục tiêu (migrate dần, không big bang)

| Portal | Route đề xuất | Tình trạng trong V2 |
|---|---|---|
| Admin | `/admin/overview` | Target, hiện `/admin` local section |
| Admin | `/admin/access/users` | Target |
| Admin | `/admin/access/assignments` | Target |
| Admin | `/admin/cinemas`, `/admin/cinemas/images` | Target |
| Admin | `/admin/facilities/rooms`, `/admin/facilities/seats` | Target |
| Admin | `/admin/catalog/movies`, `/admin/catalog/genres`, `/admin/catalog/actors` | Target |
| Admin | `/admin/commerce/products`, `/admin/commerce/promotions` | Target |
| Admin | `/admin/operations/pricing`, `/admin/operations/showtimes` | Target |
| Admin | **`/admin/bookings`** | **Đã có; giữ** |
| Admin | `/admin/service/complaints`, `/admin/reports/revenue` | Target |
| Manager | `/manager/overview`, `/manager/rooms`, `/manager/seats` | Target; hiện trong `/manager` |
| Manager | `/manager/showtimes`, `/manager/pricing`, `/manager/revenue` | Target; hiện trong `/manager` |
| Manager | **`/manager/bookings`** | **Đã có; giữ** |
| CSKH | `/support`, `/support/complaints/:complaintId` | Queue có; detail là target |
| Customer | `/`, `/movies`, `/movies/:movieId`, `/cinemas`, `/cinemas/:cinemaId`, `/booking/:showtimeId`, `/login`, `/register`, `/account`, `/profile`, `/orders`, `/orders/:orderId`, `/orders/:orderId/payment`, `/complaints`, `/complaints/:complaintId` | Giữ route hiện có |

Quy tắc: `/admin`/`/manager` còn là entry tương thích; direct reload, browser back/forward, deep-link và current active nav phải chính xác. **Không dùng route mới làm lý do tạo permission/API mới.** Khi chưa migrate một section, đường cũ vẫn phải truy cập được.

## 3.4. Page patterns (không ép CRUD)

| Pattern | Áp dụng | Thành phần chính |
|---|---|---|
| **Resource List** | tài khoản, phim, thể loại, diễn viên, sản phẩm, khuyến mãi | Header → search/filter → bảng/list → detail/form |
| **Hierarchy** | rạp, phòng, ghế, ảnh rạp | Chọn cha → danh sách con/sơ đồ → inspector/action |
| **Visual Seat Workspace** | cấu hình ghế; tình trạng ghế theo suất | Context rạp/phòng/(suất) → canvas/grid → legend → inspector |
| **Calendar/Timeline + List fallback** | lịch chiếu | Rạp/phòng/ngày → lịch theo ngày; danh sách có cùng dữ liệu |
| **Transaction Workspace** | Admin/Manager quản lý đặt vé | Search/filter → order list → detail/status/actions; Create = wizard dùng API hiện có |
| **Case Workspace** | CSKH | Queue → Case + timeline → Reference + actions |
| **Analytics** | dashboard/doanh thu | Phạm vi/range → KPI có unit → chart + table source |

## 3.5. Chuẩn bố cục trên desktop

```text
┌───────────────────────────── StaffShell ──────────────────────────────────────┐
│ Sidebar  │ Breadcrumb · Page title               Context: Role/Cinema      │
│          │ Mô tả ngắn                            [Primary task action]    │
│ Nhóm...  ├──────────────────────────────────────────────────────────────────┤
│          │ FilterToolbar: [Search] [Filter A] [Filter B] [Áp dụng] [Xóa]    │
│          ├──────────────────────────────────────────────────────────────────┤
│          │ Nội dung chính: Table / SeatMap / Calendar / Report / Case      │
│          │                                                                │
│          │ Pagination / trạng thái / lựa chọn / chi tiết                   │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

- **Không đặt form thêm mới dài ngay phía trên danh sách**. Tạo đơn/chức năng phức tạp dùng route/page riêng; form ngắn dùng dialog/drawer có focus đúng.
- **Thứ bậc thị giác**: tiêu đề + phạm vi → điều kiện lọc → dữ liệu → hành động. Một primary CTA thật sự cho mỗi trang.
- Nội dung chi tiết/inspector chỉ mở khi đã chọn đối tượng; form không tranh diện tích với bảng khi chưa dùng.
- Khi trang có nhiều dữ liệu, hàng bảng gọn, padding đều; không tạo card trắng cao chỉ chứa một vài cột.

---

# 4. DESIGN SYSTEM TRẮNG–XANH & COMPONENT CONTRACT

## 4.1. Palette không đổi

| Token đề xuất | Giá trị | Dùng cho |
|---|---|---|
| `--primary` | `#2563EB` | Primary action/links |
| `--primary-hover` | `#1D4ED8` | Hover |
| `--primary-dark` | `#1E40AF` | Active/strong emphasis |
| `--page-bg` | `#F8FAFC` | Nền trang |
| `--surface` | `#FFFFFF` | Card/form/table |
| `--surface-info` | `#EFF6FF` | Selected/light status |
| `--text-primary` | `#0F172A` | Nội dung chính |
| `--text-secondary` | `#475569` | Nội dung phụ |
| `--border` | `#CBD5E1` | Phân cách nhẹ |

Semantic error/success/warning/focus giữ theo tokens hiện có; **không định nghĩa trạng thái bằng màu duy nhất**. Đo contrast cho tất cả states ở màn hình thật; color sample PASS không có nghĩa UI WCAG PASS.

## 4.2. Spacing/typography/density — đề xuất kiểm thử

- Grid spacing bội số 4 px; section gap 24–32 px, card gap 12–20 px; thống nhất với token thực có trước khi tạo mới.
- Desktop content max-width linh hoạt theo DataTable; không ép max-width nhỏ khiến bảng phải cuộn trong khi toàn trang trống.
- Page heading 24–30 px desktop, 20–24 px mobile; body 14–16 px; nhãn/metadata tối thiểu 12–13 px tùy contrast/khả năng đọc.
- Control mục tiêu 40–44 px; vùng chạm ít nhất theo WCAG 2.2 hoặc chuẩn được kiểm định; table density “comfortable” mặc định, “compact” tùy người dùng.
- Không dùng font/dependency bên ngoài khi tài nguyên truy cập không chắc chắn; fallback font hệ thống và kiểm tra font loading trên staging có mạng.
- Trang nhân viên không dùng poster/gradient để trang trí dashboard; Customer có thể dùng poster/data thật làm điểm nhấn, vẫn duy trì trắng–xanh.

## 4.3. Shared components — API spec bắt buộc trước khi triển khai

| Component | Dữ liệu/props quan trọng | States/interaction | Ownership |
|---|---|---|---|
| `StaffShell` | role, navGroups, currentRoute | collapsed/mobile drawer, focus/escape/restore | layout |
| `CinemaContextBar` | assignedCinemas, selectedCinemaId, onChange | loading/empty/forbidden/switch; clear dependent state | Manager owner |
| `PageHeader` | title, description, breadcrumbs, primaryAction | mobile wrap, action disabled | generic |
| `FilterBar` | schema, draft, applied, onApply, onReset | draft vs applied, pending/error, chips | generic presentation |
| `ResourceTable` | column allowlist, rows, rowKey, paging, sorting, actions | loading/empty/error/selection; STT | generic |
| `ResourceSelect` | options `{id,label,meta}`, value, scopeKey, onChange | loading/no match/error, keyboard navigation | generic, data fetch feature |
| `SeatLayout` | room, seats, selectedSeatIds, mode | selection/focus/disabled/legend; list fallback | generic view; domain actions feature |
| `SeatInspector` | seat, allowedActions, onAction | read-only/history guard, confirm | feature |
| `ShowtimeSchedule` | day, cinema, room, showtimes | overlapping visual labels, filter, list fallback | feature |
| `BookingDetail` | order, tickets, paymentState, allowedActions | pending/conflict/expired/read-only | feature |
| `CaseQueue` | rows, filters, selectedId | busy, no results, selected highlight | CSKH |
| `CaseDetail/Timeline` | caseId, events, currentCase | loading, stale suppression | CSKH |
| `CaseActions` | caseId, draft, status, dirty, onSave | dirty guard, submit lock, conflict | CSKH |
| `ConfirmDialog` | title, body, entityLabel, dangerLevel, onConfirm | focus management, prevent duplicate write | primitive |
| `AsyncState` | idle/loading/empty/error/success | retry + accessible message | primitive |

**Mỗi component cần một hợp đồng**: props & types, events, behavior, focus/ARIA, breakpoints, async, error, test IDs ổn định và *không chứa logic SQL/role business nếu là primitive*. Không thay tất cả component cùng lúc.

## 4.4. Quy chuẩn bảng dữ liệu (MUST)

- Mỗi resource có **column allowlist**. Cấm `Object.keys(row)` / `Object.entries(row)` để sinh cột mặc định ngoài công cụ debug dev-only.
- Cột đầu: **STT** = `pageIndex * pageSize + visibleIndex + 1` khi thứ tự/phân trang đã xác định; ở chế độ sort/filter theo tập hiện tại phải tính STT trên tập sau xử lý; virtual list dùng chỉ số thứ tự tương đương. Nếu pagination thuộc server, áp dụng `pageIndex` theo contract thật (0 hoặc 1-based).
- ID kỹ thuật (`RapID`, `GheID`, `NguoiDungID`, ...) giữ trong `rowKey` và payload **không hiển thị**. Mã đơn công khai/để tra cứu có thể hiển thị, nhưng không dùng `STT` thay cho mã tra cứu.
- Trường lồng quan hệ hiển thị **tên rạp/phòng/phim/khách**; nếu response chỉ có ID và không có nguồn lookup hợp lệ → **BLOCKED mapping**, không thay bằng label bịa ra.
- Table tối thiểu: tiêu đề, kết quả count nếu API có, loading/empty/error, danh sách thao tác theo quyền, phân trang nếu server hỗ trợ.
- Action `Xem`/`Sửa` tách khỏi `Hủy`/`Xóa`; danger action trong menu riêng có xác nhận mô tả hậu quả. Không tô nút Xóa cùng primary blue.
- Mobile: ẩn cột ưu tiên thấp **có chủ đích**, hoặc đổi sang stacked row card; tuyệt đối không render bảng 14 cột siêu nhỏ. Vẫn truy cập được action quan trọng.

## 4.5. Quy chuẩn bộ lọc (MUST)

- Mỗi màn hình có ít nhất **tìm kiếm hoặc bộ lọc hữu ích theo task**. Nếu nguồn API chỉ cho xem một tập rất nhỏ không lọc được, ít nhất có search local trên **tập đầy đủ đã load** và ghi rõ phạm vi; không dựng control giả.
- Các chọn phụ thuộc dùng cascading: `Cinema → Room → Showtime` khi domain phù hợp; đổi parent **reset con** và abort/ignore request cũ.
- Search có `debounce` hợp lý (đề xuất 300–500 ms) **hoặc** nút `Áp dụng`, nhất quán theo flow; với CSKH dùng rõ `draftFilters` → `appliedFilters`.
- Có `Xóa bộ lọc`, chip điều kiện đang áp dụng, trạng thái `Có N kết quả` khi source cung cấp.
- Filter reset phải giữ hoặc hỏi trước khi bỏ draft/selected detail; không được mất công việc đang làm.
- Search/filter/page phù hợp nên lưu ở URL query **chỉ với dữ liệu không nhạy cảm**; không lưu complaint body, email/SĐT/PII nhạy cảm trong URL.
- Phải kiểm tra cùng lúc: lọc theo scope quyền, pagination, sort, race, stale cache, lỗi backend, empty.

## 4.6. Validation, feedback và trạng thái

`read`: `idle | loading | success | empty | error | forbidden | notFound`  
`write`: `idle | validating | submitting | success | conflict | error`  
`selection`: `none | selected | disabled | stale`.

- Server trả 401/403/404/409/422/network: thông điệp phù hợp và giữ draft, tuyệt đối không thay lỗi thành empty.
- Mutation POST/PUT/DELETE không tự retry; submit khóa/đặt idempotency nếu API đã hỗ trợ, không tự chế semantics.
- Dialog destructive/trạng thái quan trọng: hiển thị tên resource, trạng thái hiện tại, hậu quả; Cancel là hành động an toàn; focus vào vùng bên trong khi mở và trả lại khi đóng.
- Không show success trước response authoritative; sau mutation refresh đúng data owner/scope, không refresh nhầm parent đã đổi.

---

# 5. ĐẶC TẢ CHI TIẾT ADMIN — ENTERPRISE CONTROL CENTER

**Template chung:** breadcrumb → tên màn hình + mô tả + primary CTA → filter toolbar → nội dung chính → pagination/summary; một màn hình một task chính. Với 16 section cũ, giữ tất cả nghiệp vụ *đang hợp lệ*; thêm navigation tới `/admin/bookings` đang có, không phát sinh CRUD vai trò/quyền.

## 5.1. Tổng quan — `/admin/overview` (ADM-16)

**Mục đích:** trong vài giây biết tình hình vận hành chuỗi rạp và tìm đường tới thao tác cần thiết.

- **Bố cục:** dòng filter thời gian/phạm vi → 3–5 KPI thật có unit → bảng/lịch công việc cần theo dõi → các nhóm số liệu thật; không đặt hàng loạt card giá trị-key giống debug panel.
- **Bộ lọc:** khoảng thời gian (`Hôm nay / 7 ngày / Tùy chọn` nếu backend hỗ trợ), rạp (`Tất cả / một rạp`) nếu có API hỗ trợ.
- **KPI có thể dùng nếu API trả:** số đơn/vé, doanh thu, suất chiếu, số rạp; không suy diễn các metric chưa có, không tự tính doanh thu authoritative trên client.
- **Dữ liệu ưu tiên:** KPI nhãn rõ + đơn vị VNĐ/vé/suất, cập nhật gần nhất nếu có; bảng xếp hạng rạp hay đồ thị chỉ khi response đủ dữ liệu.
- **CTA:** link đến Đơn đặt vé, Suất chiếu, Doanh thu; không thêm nghiệp vụ mới.
- **Empty:** “Chưa có dữ liệu trong kỳ” phân biệt với API lỗi.
- **Acceptance:** đổi bộ lọc thì tất cả KPI và bảng cùng scope; không hiện số liệu rạp A dưới label rạp B; server metrics không bị làm tròn dẫn đến sai đối soát.

## 5.2. Tài khoản — `/admin/access/users` (ADM-02)

- **Mục tiêu:** tìm tài khoản/nhận biết trạng thái & role; thao tác đúng quyền mà không lộ thao tác đổi role.
- **Filter MUST:** search theo tên hoặc email/SĐT nếu endpoint/permission cho phép; vai trò 4 mã cố định; trạng thái tài khoản nếu data có. Không gửi thông tin tìm kiếm nhạy cảm vào query URL nếu chính sách không cho phép.
- **Bảng đề xuất:** `STT | Họ tên | Email (rút gọn phù hợp) | SĐT (nếu được phép) | Vai trò | Trạng thái | Thao tác`.
- **Không hiển thị mặc định:** `NguoiDungID`, `VaiTroID`, `MaVaiTro`, dữ liệu mật khẩu, field kỹ thuật; `Điểm tích lũy` chuyển sang detail nếu không phục vụ tác vụ quản lý tài khoản.
- **Actions:** `Xem`, `Khóa/Mở` nếu contract có, `Tạo tài khoản nội bộ` nếu UC/API cho phép; role gán **chỉ khi tạo** và là read-only ở detail/update.
- **Form:** họ tên, email, SĐT, role chỉ với luồng nội bộ có phép; validate trường, thông điệp lỗi, không tạo Customer bằng cùng luồng nếu business rule khác. Không cho “UpdateRole”.
- **Acceptance:** dùng filter tìm được tài khoản theo name/email; sau refresh role không đổi; menu vai trò/quyền/grant không tồn tại, kể cả truy cập URL cũ.

## 5.3. Phân công quản lý — `/admin/access/assignments` (ADM-06)

- **Mục tiêu:** biết ai đang quản lý rạp nào và phân/chuyển rạp không nhầm tài khoản.
- **Filter MUST:** Manager (tên/email), Rạp (tên); `đang hiệu lực / lịch sử` **chỉ** nếu dữ liệu có.
- **Bảng:** `STT | Quản lý | Rạp được phân công | Thời gian / hiệu lực (nếu có) | Trạng thái (nếu có) | Hành động`.
- **Create/Transfer:** chọn Manager đã có role `QUAN_LY_RAP` → xem phân công hiện tại → chọn rạp đích theo tên → xem preview `Rạp hiện tại → Rạp mới` → confirm → gọi API/SP → refresh danh sách & manager scope.
- **Cần quyết định theo contract:** một Manager được nhiều rạp hay một rạp? `chuyển` là kết thúc gán cũ/tạo gán mới hay thay thế? không được suy diễn từ UI.
- **Bảo vệ:** không chọn user role khác; không chọn rạp ngoài trạng thái được phép; không tự đổi role; server kiểm tra người thực hiện và tính hợp lệ quan hệ.
- **Acceptance:** không thể gửi ID Manager/rạp không tồn tại; giao diện nêu rõ nguồn/đích; tạo/chuyển thất bại giữ dữ liệu chọn để sửa; test Manager A→B và giới hạn quyền sau chuyển (test DB).

## 5.4. Rạp — `/admin/cinemas` (ADM-07)

- **Filter MUST:** tên rạp; trạng thái/khu vực **khi schema có**.
- **Bảng:** `STT | Tên rạp | Địa chỉ ngắn | Số phòng (nếu có/count hợp lệ) | Trạng thái (nếu có) | Thao tác`.
- **List-first:** click dòng → chi tiết rạp gồm thông tin + các tab `Phòng` / `Hình ảnh` / `Lịch chiếu` khi route/API thật cho phép. Không tải ảnh gallery của tất cả rạp cùng lúc.
- **Form:** địa chỉ được gõ theo business data đã có; không thêm địa lý/GPS mới nếu schema không hỗ trợ.
- **Delete/inactivate:** chỉ hiển thị theo SP rule. Nếu còn phòng/suất/đơn liên quan và DB chặn, hiển thị lỗi 409 có hướng xử lý; không đề xuất cascade delete.
- **Acceptance:** từ một rạp chuyển đúng tới danh sách phòng/ảnh tương ứng, scope không lẫn khi đổi rạp nhanh.

## 5.5. Ảnh rạp — `/admin/cinemas/images` (ADM-07)

- **Filter/Context MUST:** Rạp theo tên (bắt buộc), loại ảnh/thứ tự hiển thị **nếu API có**.
- **Visual:** grid thumbnail + caption/trạng thái + ảnh xem lớn; không hiển thị collection raw URL dài hoặc ID ảnh thành table chính.
- **Actions:** thêm/xóa/đổi ảnh chính/theo thứ tự **chỉ** nếu endpoint hỗ trợ, đầy đủ confirmation.
- **Critical regression:** bảo vệ `CinemaImageManager` request generation/ownership; chuyển rạp A→B, response của A tới sau không được ghi gallery B; mutation phải gửi cinemaId thuộc màn hiện tại.
- **Fallback:** ảnh lỗi => placeholder/alt + retry nếu an toàn; asset mạng ngoài bị chặn trong V2 là ENV BLOCKED, không báo server ảnh hỏng.
- **Acceptance:** test nhanh A→B→A, tải lâu, lỗi network, mutation sau đổi context; không nhầm ảnh giữa rạp.

## 5.6. Phòng chiếu — `/admin/facilities/rooms` (ADM-08)

- **Bộ lọc ưu tiên cao:** `Rạp (required cho view theo hierarchy) → search tên/số phòng`; loại phòng/trạng thái nếu có.
- **Bảng:** `STT | Tên phòng | Rạp | Loại/định dạng (nếu có) | Số ghế thật | Trạng thái (nếu có) | Thao tác`.
- **Tương tác:** chọn rạp trước để giảm nhiễu; `Xem sơ đồ ghế` là action nổi bật ở mỗi dòng; `Thêm phòng` mở drawer/page thay vì form trải ngang đầu trang.
- **Form:** tên phòng và thuộc tính đang có, rạp chọn theo tên; khi đang scoped theo rạp mặc định rạp hiện tại và hiển thị read-only/chọn nếu quyền cho phép.
- **Số ghế:** lấy `count` chính xác từ API/SP hoặc từ toàn bộ seats đã load đúng phòng; không coi tổng số ở một trang paginated là tổng ghế.
- **Cảnh báo:** không xóa vật lý phòng có lịch sử, suất hay vé nếu SP chặn; tránh phát sinh trạng thái “còn ghế nhưng thiếu phòng”.
- **Acceptance:** filter rạp A không hiển thị phòng B; click phòng A1 → sơ đồ A1; tạo phòng không bắt nhập `RapID` số.

## 5.7. Ghế — `/admin/facilities/seats` (ADM-08) — **REDESIGN TRỌNG TÂM**

**Cấm lấy bảng `Mỗi ghế = Một dòng` làm màn hình chính.** Main UI phải là bản đồ ghế theo phòng; danh sách bảng chỉ là **fallback phụ trợ**, tối ưu cho accessibility/export nếu data hỗ trợ.

### A. Luồng chuẩn

1. Chọn **Rạp** từ danh sách thật (không nhập `RapID`).
2. Chọn **Phòng** từ danh sách phòng thuộc rạp vừa chọn (không nhập `PhongID`).
3. Tải danh sách ghế thuộc phòng chính xác, **không tải ghế toàn hệ thống**.
4. Vẽ **sơ đồ vị trí** bằng tên hàng/chiều thứ tự ghế dựa trên thuộc tính DB; chỗ không có ghế phải là khoảng trống **chỉ khi đủ thông tin bố cục**.
5. Chọn ghế → mở `SeatInspector` với mã hiển thị `A05`, loại, trạng thái cấu hình, lịch sử sửa/xóa bị khóa nếu DB cho biết.
6. Mutation hợp lệ phải confirm và refresh đúng scope phòng. Khi đổi phòng/rạp thì xóa selectedSeat, abort/ignore request cũ.

### B. Wireframe desktop

```text
Rạp: [Tên rạp           v]    Phòng: [Tên phòng         v]    [Chế độ: Sơ đồ | Danh sách]
Ghế: [Tìm A05]  Loại ghế: [Tất cả v]  Hàng: [Tất cả v]  [Xóa lọc]   [Thêm ghế*]
┌──────────────────────────────────┬───────────────────────────────────────┐
│             MÀN HÌNH            │ CHI TIẾT GHẾ                          │
│                                  │ Chưa chọn ghế                         │
│ A   [01][02][03]   [04][05][06] │ hoặc: A05 · Ghế thường               │
│ B   [01][02][03]   [04][05][06] │ Loại / trạng thái / history warning  │
│ C   [01][02][03]   [04][05][06] │ [Sửa*] [Xóa*] / giải thích lý do khóa │
│ D   [01][02][03]   [04][05][06] │                                       │
├──────────────────────────────────┴───────────────────────────────────────┤
│ Chú thích trạng thái cấu hình + thống kê ghế từ data thật                │
└──────────────────────────────────────────────────────────────────────────┘
(*) Chỉ khi nghiệp vụ và API/SP cho phép; không cấp mặc định.
```

### C. Hai chế độ phải tách bạch

| Mode | Ngữ cảnh | Dữ liệu/trạng thái | Tác vụ |
|---|---|---|---|
| **Cấu hình sơ đồ phòng** (Admin/Manager) | Rạp + Phòng | hàng, số ghế, loại, sử dụng/không sử dụng nếu schema có | Xem/chỉnh cấu hình theo SP và history guard |
| **Tình trạng bán ghế của suất chiếu** | Rạp + Phòng + **Suất chiếu cụ thể** | available/held/sold nếu API thật trả | **Read-only quan sát trạng thái** mặc định; không tự mở bán/sửa lịch sử từ UI layout |

**Không tô trạng thái `Đã bán` trên sơ đồ vật lý không có `showtimeId`.** Số vé bán là thuộc tính phụ thuộc suất chiếu, không phải trạng thái bất biến của ghế.

### D. Nguyên tắc dựng seat grid

- Mỗi ghế có `seatId` ẩn cho action; label hiển thị `rowLabel + seatNumber` hoặc tên ghế từ DB. Sắp xếp hàng theo thứ tự định nghĩa thật; số ghế theo `seatNumber` hoặc quy tắc hiện có.
- Nếu DB chỉ có hàng và số (không có tọa độ/lối đi): render **grid theo hàng** đúng thứ tự. Không tự vẽ lối đi, sân khấu nghiêng, ghế VIP giả, cột trống hay ghế đôi.
- Nếu chưa có nhãn hàng/số nhất quán => **BLOCKED seat-map reconstruction**, báo dữ liệu cần chuẩn hóa; giữ list fallback có các nhãn thật, không đoán.
- Visual dùng icon/shape nhỏ, nhãn rõ, legend loại/không dùng; không chỉ dùng màu; `aria-label="Ghế A05, loại ..., trạng thái ..."` và `aria-pressed` nếu selectable.
- Với phòng >120 ghế: zoom/scroll cả chiều ngang, fit width có giới hạn; không thu nhỏ chữ tới mức không đọc được; có list accessible fallback.
- Khi lọc hàng/loại ghế, **không xếp dồn ghế còn lại làm sai vị trí**; giữ layout ghost/opacity cho những ghế không khớp, hoặc highlight matches trên sơ đồ.
- `STT` chỉ xuất hiện trong **chế độ Danh sách**, không thay nhãn A05/B12 trong sơ đồ.
- Mutation phải check lịch sử vé ở server: nếu `SEAT_HAS_TICKET_HISTORY`/409 thì hiển thị lý do và phục hồi layout; không xóa ghế khỏi UI trước confirmation.

### E. Acceptance (browser + DB fixture)

- [ ] Admin chọn rạp A, phòng A1 => chỉ thấy ghế A1, hàng/số khớp DB; chọn B1 => dữ liệu A1 không còn.
- [ ] Không có input `RapID`, `PhongID`, `GheID` dạng số cho tác vụ thường.
- [ ] Sơ đồ thể hiện hàng/số, không danh sách một ghế/dòng làm view chính.
- [ ] Chuyển A→B→A khi request A cũ tới muộn không ghi đè.
- [ ] Click/tap/keyboard ghế xác định đúng DB `seatId`; selection có focus/aria rõ.
- [ ] History guard từ DB từ chối xóa/sửa ghế có vé; UI thông báo thân thiện.
- [ ] Cấu hình ghế khác biệt với tình trạng theo suất; không hiện “đã bán” khi thiếu showtime.
- [ ] Manager chỉ truy cập phòng thuộc rạp được phân công ngay cả qua URL tự sửa.

## 5.8. Phim — `/admin/catalog/movies` (ADM-09)

- **Filter:** search tên phim, thể loại, trạng thái đang chiếu/sắp chiếu nếu dữ liệu hỗ trợ; thời lượng/định dạng nếu có.
- **View:** DataTable gọn hoặc poster thumbnail + tên; một bản ghi một dòng nhưng không kéo poster quá lớn.
- **Cột:** `STT | Poster nhỏ | Tên phim | Thể loại (tóm tắt) | Thời lượng | Trạng thái (nếu có) | Thao tác`.
- **Form:** title, metadata, poster/ảnh, genres/actors bằng named picker; không bắt người quản trị nhập `MovieID`, danh sách ID diễn viên hoặc JSON thủ công.
- **Detail:** thông tin phim, diễn viên và suất chiếu liên quan nếu API cho; muốn sửa quan hệ phim–diễn viên phải giữ persistence & invariant hiện có.
- **Acceptance:** sửa phim không làm mất actor relation; danh sách ảnh fallback có alt; filter không phá deep-link phim.

## 5.9. Thể loại — `/admin/catalog/genres` (ADM-10)

- **Filter:** search theo tên; trạng thái chỉ khi schema có.
- **Bảng:** `STT | Tên thể loại | Số phim liên kết (nếu có) | Thao tác`.
- **Form:** tạo/sửa ngắn bằng dialog; không hiện Genre ID.
- **Xóa:** theo constraints liên kết phim; không tự xóa quan hệ hàng loạt.
- **Acceptance:** pagination/search áp dụng đúng toàn bộ tập hiện hành, không tự tính count từ trang dữ liệu bất toàn.

## 5.10. Diễn viên — `/admin/catalog/actors` (ADM-09)

- **Filter:** tên diễn viên; phim liên quan chỉ khi API hỗ trợ.
- **Bảng:** `STT | Tên diễn viên | Ảnh/metadata (nếu có) | Số phim (nếu có) | Thao tác`.
- **Form/detail:** nhập thuộc tính DB có thật; quan hệ phim–diễn viên chọn theo tên, không nhập actorId list thủ công.
- **Acceptance:** quan hệ đã lưu vẫn còn sau reload; status/constraint không bị tạo ngoài DB.

## 5.11. Suất chiếu — `/admin/operations/showtimes` (ADM-14)

- **Filter MUST:** `Rạp → Phòng`, phim, ngày hoặc khoảng ngày, trạng thái nếu có.
- **View:** **Danh sách** làm baseline; **Lịch phòng × giờ/ngày** là presentation option **chỉ khi dữ liệu có start/end và hợp đồng đủ**. Không cho drag-drop thay đổi lịch như tính năng mới.
- **Cột danh sách:** `STT | Phim | Rạp / Phòng | Bắt đầu | Kết thúc (nếu trả) | Định dạng / trạng thái (nếu có) | Thao tác`.
- **Form:** movie selector (tên/poster thumbnail) + cinema/room selector + date/time theo timezone của rạp; không nhập MovieID/RoomID thủ công.
- **Action:** Xem/Sửa/Hủy hợp lệ; hủy phải hiển thị số đơn giữ ghế/hậu quả **chỉ nếu API hỗ trợ**, DB vẫn là final authority.
- **Accept:** giờ hiển thị theo timezone được xác nhận; không tạo suất overlap hoặc đổi phòng ngoài scope; 409 còn held order được hiện lý do rõ; filter A→B không lẫn lịch.

## 5.12. Bảng giá — `/admin/operations/pricing` (ADM-13)

- **Filter:** rạp (nếu pricing scoped), loại ghế, loại ngày (`Ngày thường / Cuối tuần / Tất cả`), hiệu lực nếu data có.
- **Cột:** `STT | Rạp/phạm vi (nếu có) | Loại ghế | Loại ngày | Giá (VND) | Thời gian hiệu lực (nếu có) | Thao tác`.
- **Form:** selector tên, tiền VNĐ hiển thị phân nhóm nghìn; validation tránh số âm/NaN tùy SP; không có chọn “Ngày lễ”.
- **Rủi ro:** thay price master không sửa snapshot vé/đơn cũ; không tính lại lịch sử trên client.
- **Acceptance:** snapshot old order trước/sau sửa không đổi; giá preview lấy backend nếu có, không suy đoán quy tắc tính.

## 5.13. Khuyến mãi — `/admin/commerce/promotions` (ADM-12)

- **Filter:** mã/tên, trạng thái, thời gian hiệu lực, loại khuyến mãi nếu schema trả.
- **Cột:** `STT | Mã khuyến mãi | Tên/mô tả | Giá trị/đơn vị | Hiệu lực | Trạng thái | Thao tác` (từng trường phụ thuộc DTO thật).
- **Form:** mã, giới hạn, phạm vi, giá trị theo contract; rõ mức giảm `% / VNĐ` nếu có.
- **Rủi ro:** client không trừ tiền làm kết quả authoritative, không tự consume quota; hủy/sửa phải giữ lịch sử đơn cũ.
- **Acceptance:** form phản hồi lỗi điều kiện/quota phù hợp; filter hết hạn vs còn hiệu lực nhất quán với server.

## 5.14. Sản phẩm — `/admin/commerce/products` (ADM-11)

- **Filter:** tên, loại sản phẩm, trạng thái; tình trạng bán nếu data có.
- **Cột:** `STT | Hình nhỏ (nếu có) | Sản phẩm | Loại | Giá | Trạng thái | Thao tác`.
- **Form:** tiền/số lượng theo SP, không tự thêm kho/inventory nếu ERD không có.
- **Acceptance:** sản phẩm đã mua lưu snapshot cần giữ; không sửa lịch sử bill khi đổi giá master.

## 5.15. Khiếu nại (Admin) — `/admin/service/complaints` (ADM-15)

- **Filter:** mã tra cứu, trạng thái, loại, độ ưu tiên, khoảng ngày, khách hàng nếu API có; chỉ dùng những field hiện có.
- **Bảng:** `STT | Mã khiếu nại (nếu có) | Khách gửi | Chủ đề/loại | Ngày gửi | Ưu tiên | Trạng thái | Thao tác`.
- **Hành động:** Xem và nghiệp vụ đã được Admin cấp thật; không nhập nhằng CSKH processor nếu quyền khác.
- **Detail:** đọc người gửi, đơn tham chiếu, lịch sử xử lý; tránh hiện PII tràn lan trong list.
- **Acceptance:** thao tác bị 403 đúng nghĩa; dữ liệu case khác không rơi vào detail cũ qua race.

## 5.16. Doanh thu — `/admin/reports/revenue` (ADM-16)

- **Filter bắt buộc:** từ ngày → đến ngày; rạp = tất cả/một rạp chỉ khi backend hỗ trợ; filter phải xác nhận inclusive/exclusive theo SP.
- **Layout:** ngày/phạm vi đang xem → KPI có đơn vị → chart theo thời gian/rạp khi data đủ → bảng chi tiết đọc được.
- **Cột bảng tham chiếu:** `STT | Kỳ/rạp | Số đơn/vé | Doanh thu (VND) | ...`; không hiển thị metric chưa được procedure trả.
- **Acceptance:** filter ngày làm đổi nội dung; tổng hiển thị khớp dữ liệu trả từ SP (theo rounding rule); không trộn doanh thu rạp khác, không tự tính tài chính ở JS làm truth.

## 5.17. Quản lý đặt vé — `/admin/bookings` (ADM-18) — **NEW WORKSPACE ĐÃ CÓ ROUTE**

**Mục tiêu:** nhân viên Admin tìm đơn, xem vé, hỗ trợ tạo đơn hợp lệ cho Customer hiện hữu, chỉnh/hủy theo trạng thái và API/SP đã duyệt.

### A. Danh sách quản lý

- **Filter:** mã đơn (được phép hiển thị), khách hàng tên/email/SĐT theo quyền, rạp, phim, ngày suất chiếu hoặc ngày tạo đơn, trạng thái đặt vé/thanh toán nếu API có.
- **Bảng:** `STT | Mã đơn | Khách hàng | Phim / Suất | Rạp / Phòng | Số vé | Tổng tiền snapshot | Trạng thái | Thao tác` (số vé/tổng nếu backend trả hợp lệ).
- **Không hiển thị:** IDs kỹ thuật `OrderID/CustomerID/SeatID` dưới dạng cột mặc định; không giấu mã đơn nghiệp vụ cần tra cứu.
- **Detail:** header đơn, Customer liên kết, vé/ghế, sản phẩm/khuyến mãi, snapshot tiền, thanh toán/trạng thái, hành động được phép theo status.

### B. Create booking (flow đề xuất)

```text
B1. Chọn khách Customer đã tồn tại (selector tên + thông tin định danh hợp lệ)
  ↓ server-confirm role KHACH_HANG, active status
B2. Chọn Rạp → Phim/Suất chiếu hợp lệ → Phòng
  ↓ validate schedule scope/status
B3. Chọn ghế bằng SeatMap theo suất chiếu
  ↓ server/DB reserve/check concurrency; không tự giữ ghế giả
B4. Chọn sản phẩm/khuyến mãi nếu nghiệp vụ hiện tại cho
  ↓ server price/discount preview nếu có
B5. Review: Customer, rạp, suất, ghế, tổng authoritative, hold deadline
  ↓ create order qua API/SP đã duyệt, chống double submit
B6. Hiện đơn vừa tạo và trạng thái cần thanh toán; không tự đánh dấu PAID
```

**Nếu backend chưa có staff create/lookup contract:** đặt `BLOCKED — STAFF_BOOKING_CREATE`, không dựng fake checkout lưu state frontend mà không có giao dịch server.

### C. Sửa/hủy theo trạng thái (đề xuất nghiệp vụ — cần xác minh)

| Trạng thái | UI được trình bày | Ràng buộc |
|---|---|---|
| Chờ thanh toán/đang giữ | Cho sửa **chỉ** những thuộc tính SP cho phép (ghế/số lượng/sản phẩm/khuyến mãi) | transactional, new seat available, correct price/hold; không đổi Customer/movie/showtime bằng UPDATE giả |
| Đã thanh toán | **Read-only** phần vé/giá/customer; hành động hủy/hoàn tiền nếu nghiệp vụ và API tồn tại | không soft/hard delete giả, không mất lịch sử |
| Đã hủy/hết hạn | **Read-only** | không hồi sinh đơn từ UI |
| Suất đã bắt đầu/kết thúc | **Read-only** trừ thao tác nghiệp vụ hiện đã được chốt | không sửa chỗ khi vé đã dùng/đã chiếu |

Không cho sửa `CustomerID` sau khi tạo, không nhập giá vé tay, không UPDATE trạng thái payment bằng form. “Xóa” không được biến thành SQL DELETE đơn/chi tiết vé có lịch sử.

### D. Acceptance

- [ ] Tạo cho Customer đúng role còn tồn tại: thành công trên DB test nếu procedure hỗ trợ.
- [ ] Customer không tồn tại / Manager / CSKH / Admin: server từ chối; form có thông điệp rõ.
- [ ] Ghế đang giữ/bán, hold hết hạn, cùng lúc hai nhân viên chọn trùng: DB từ chối giao dịch xung đột.
- [ ] Tổng tiền/giá snapshot trùng authoritative SP; refresh danh sách ra đúng đơn.
- [ ] Không cho sửa vé đã thanh toán khi ngoài nghiệp vụ; hủy không xóa lịch sử.
- [ ] Manager không thể xem/ghi đơn rạp khác, cả khi sửa URL/payload.
- [ ] Browser list/detail/create/edit/delete actions chỉ được báo PASS sau khi đã chạy riêng từng scenario.


---

# 6. ĐẶC TẢ CHI TIẾT MANAGER — CINEMA OPERATIONS WORKSPACE

**Khác Admin chỉ ở scope/permission, không được nhân đôi UI quản lý vé một cách rời rạc.** Manager phải nhìn thấy **rạp đang được phân công** trên mọi màn hình; khi chỉ có một rạp, control có thể read-only nhưng vẫn hiển thị tên.

## 6.1. Cinema Context (áp dụng toàn Manager)

- Data source: danh sách rạp được gán thực sự cho tài khoản, không hardcode hoặc lấy từ tất cả rạp.
- Nếu có nhiều rạp: select tên rạp, đổi rạp → reset room, seat, showtime, filter/report/selected order liên quan; request cũ không được update màn mới.
- Nếu không còn assignment: hiển thị empty/forbidden có hướng liên hệ Admin; không fallback sang rạp bất kỳ.
- Nếu URL có `cinemaId` không thuộc assignment: 403 hoặc chuyển về scope hợp lệ theo router decision được test; API vẫn enforce độc lập.
- Status loading phải giữ context rõ, không cho thao tác trên dữ liệu rạp cũ trong thời gian fetch rạp mới.
- **Test A→B→A bắt buộc** trên fixture Manager có 2 assignment nếu hệ thống cho phép; nếu chỉ có một rạp, ghi `NOT VERIFIED` cho multi-cinema switching.

## 6.2. Tổng quan — `/manager/overview` (QLR-08)

- **Layout:** context rạp hiện tại + khoảng ngày (nếu API hỗ trợ) → KPI vận hành rạp → lịch/suất gần nhất và liên kết module.
- **Data:** chỉ của rạp được gán; nếu API không có dashboard KPI thì chỉ hiển thị những chỉ số thật, không tạo doanh thu/occupancy giả.
- **Actions:** đi tới lịch chiếu, đặt vé, phòng, báo cáo; không lồng toàn bộ form của các module vào dashboard.
- **Acceptance:** thay rạp đúng KPI; không hiển thị dữ liệu cache rạp trước.

## 6.3. Phòng — `/manager/rooms` (QLR-02)

- **Scope fixed:** rạp hiện tại. **Filter:** search tên phòng, loại/trạng thái nếu schema hỗ trợ.
- **Bảng:** `STT | Phòng | Loại phòng | Số ghế | Trạng thái (nếu có) | Thao tác`.
- **Action:** Xem sơ đồ ghế, Thêm/Sửa/Xóa hợp lệ theo quyền/SP; không nhập `RoomID` số để tải ghế.
- **Form:** mặc định rạp hiện tại; không cho tự chuyển phòng sang rạp khác nếu không có nghiệp vụ.
- **Acceptance:** vào từ Manager context A, danh sách chỉ A; click phòng đúng tên, sang sơ đồ có `roomId` nội bộ chính xác.

## 6.4. Sơ đồ ghế — `/manager/seats` (QLR-03)

- **Context:** rạp hiện tại → chọn phòng theo tên; **không** có raw numeric input.
- **Layout:** dùng chung `SeatLayout` từ §5.7 với Admin, nhưng action cụ thể theo Manager permission; ghế có lịch sử vé khóa sửa/xóa theo SP.
- **Filter:** hàng, loại, search tên ghế; nếu có trạng thái theo suất thì phải chọn suất cụ thể và hiển thị **read-only view** tùy nghiệp vụ.
- **Acceptance:** scope Manager không thể bypass bằng thao tác DOM, query string hay API body; ghế list là fallback, không phải màn chính.

## 6.5. Lịch chiếu — `/manager/showtimes` (QLR-04/05/06)

- **Filter:** ngày, phòng thuộc rạp, phim, trạng thái nếu có. Rạp không editable ngoài CinemaContextBar.
- **View:** danh sách suất chiếu theo ngày; calendar/timeline theo phòng chỉ là option UX nếu timestamps chuẩn. Phòng/suất bị trùng thời gian được server xử lý, UI không thay thế SP.
- **Form:** film picker theo tên, room picker theo tên, ngày/giờ có timezone rõ. Không còn `Movie ID`, `Mã phòng suất chiếu` raw.
- **CRUD:** Tạo/Sửa/Hủy đúng authorization; hủy conflict còn đơn giữ phải hiện lý do rõ; không xóa cứng suất chiếu có lịch sử.
- **Acceptance:** select rạp A → danh sách room A; đổi rạp A→B làm reset room đã chọn; không ghi nhầm suất; giao diện khớp ngày/giờ trả từ server.

## 6.6. Bảng giá — `/manager/pricing` (QLR-07)

- **Filter:** loại ngày thuộc `Ngày thường/Cuối tuần/Tất cả`, loại ghế, thời gian hiệu lực khi có; rạp context bất biến.
- **Bảng:** `STT | Loại ghế | Loại ngày | Giá | Hiệu lực (nếu có) | Thao tác`.
- **Form:** tiền VNĐ, selector theo nhãn; không có “Ngày lễ”; nếu price scheme dùng scope khác rạp thì phải hiển thị rõ scope từ DB.
- **Acceptance:** Manager không sửa giá rạp khác; lịch sử giá đơn cũ không đổi.

## 6.7. Quản lý đặt vé — `/manager/bookings` (QLR-10)

- **UI sử dụng chung behavior/pattern từ Admin §5.17**, nhưng danh sách và lookup **chỉ** chứa order/showtime/seat của rạp đang được phân công.
- **Filter:** mã đơn, khách, phim, ngày/suất, trạng thái; không có filter “Tất cả rạp” nếu trái scope.
- **Create:** chọn Customer hiện có đúng role; suất chiếu và ghế của rạp hiện tại; không được thay `cinemaId` client gửi để vượt quyền.
- **Sửa/hủy:** theo cùng server workflow và status rules như Admin; nút chỉ hiển thị khi allowed action thật.
- **Acceptance:** Admin thấy order A và B; Manager A chỉ thấy A; gửi request tạo/sửa/xóa đơn B trực tiếp phải bị backend/DB từ chối.

## 6.8. Doanh thu — `/manager/revenue` (QLR-09)

- **Filter:** khoảng ngày, nhóm báo cáo nếu backend hỗ trợ; rạp current là context.
- **KPI/table/chart:** chỉ số từ SP, kèm VNĐ/vé/đơn và khoảng thời gian; không có client authoritative aggregation giả.
- **Acceptance:** report thuộc rạp Manager; range filter hoạt động trên request thật.

## 6.9. Manager workflow acceptance

1. Login Manager → biết rạp hiện tại ngay trong header.
2. Vào Rooms → filter tên phòng → mở sơ đồ ghế → thao tác theo SP scope.
3. Vào Showtimes → chọn tên phim + tên phòng → lưu (test DB) → thấy suất tạo trên lịch/list.
4. Vào Bookings → lọc theo mã/Customer → xem chi tiết → create/edit/cancel được xác minh riêng theo state.
5. Vào Pricing/Revenue → dữ liệu không vượt scope. Test scope bằng API trực tiếp, không chỉ bằng UI.

---

# 7. ĐẶC TẢ CSKH — CASE MANAGEMENT WORKSPACE

## 7.1. Bố cục mục tiêu

```text
Desktop ≥1280 px
┌────────────────┬────────────────────────────────┬───────────────────────┐
│ HÀNG CHỜ       │ CASE ĐANG CHỌN                 │ THAM CHIẾU & HÀNH ĐỘNG│
│ search/filter  │ chủ đề, khách, trạng thái      │ đơn liên quan        │
│ số lượng       │ nội dung khiếu nại             │ thông tin cần thiết  │
│ list case      │ timeline xử lý (chỉ ở đây)    │ soạn xử lý           │
│ case selected  │                                │ thay trạng thái      │
└────────────────┴────────────────────────────────┴───────────────────────┘
Tablet: queue + detail, side panel thành section/drawer.
Mobile: queue → chọn case → case detail → reference/actions; nút "Về hàng chờ".
```

- Timeline chỉ nằm **một nơi** ở cột detail (không nhân đôi timeline cột phải).
- Case selected phải có route `/support/complaints/:id` khi migrate. Không lưu complaint text hoặc thông tin cá nhân nhạy cảm trong URL; ID định tuyến phải được server authorize.
- Desktop panes có min-width hợp lý và scroll ownership rõ; không để toàn trang cuộn qua hàng trăm case mới tới form xử lý.

## 7.2. Bộ lọc Queue

- **Must:** search, loại, độ ưu tiên, trạng thái *theo các field/API hiện có*. Nút `Áp dụng`/`Đặt lại`.
- Giữ `draftFilters` khi gõ và `appliedFilters` khi submit; **không** fetch lại trên mỗi phím nếu có nút apply.
- Thay filter không tự hủy selected case/draft; nếu case không còn trong tập lọc, vẫn giữ detail hiện tại hoặc hỏi người dùng khi muốn rời.
- Query không chứa complaint body, tên khách hoặc dữ liệu nhạy cảm nếu policy không cho.

## 7.3. Dirty-state và tính đúng đắn bất đồng bộ — P1

```text
IF activeCase.processingDraft has unsaved changes
  AND user switches filter/case/route or closes detail
THEN
  preserve draft in appropriate case-keyed state
  OR show confirmation [Tiếp tục chỉnh sửa] [Bỏ bản nháp]
  NEVER silently erase textarea.
```

- Lưu bản nháp theo `caseId`, không để note case A xuất hiện ở case B.
- `generationId`/request owner để response của case A không ghi đè case B sau chuyển.
- Action submit phải xác nhận caseId/title đang xử lý, disable double submit, chờ server authoritative.
- Timeline cập nhật sau mutation một lần, không append optimistic trùng lặp; status change theo action riêng, không ghép hai mutation nếu không có transaction contract.
- Tab/back/refresh cần xử lý unsaved như UX spec (browser refresh warning khi có thay đổi, tránh lưu thông tin nhạy cảm lâu dài không kiểm soát).

## 7.4. Chi tiết & dữ liệu tham chiếu

- **Queue item:** tóm tắt subject, trạng thái, ưu tiên, ngày; không lộ toàn bộ nội dung dài trong list.
- **Detail:** mô tả gốc, người gửi/đơn liên quan trong phạm vi quyền, timeline append-only.
- **Reference panel:** nếu có đơn liên quan hiển thị mã đơn, tình trạng/trạng thái cần thiết; nếu không có thì empty state rõ như V2 đã thấy.
- **Actions:** ghi lần xử lý, cập nhật trạng thái đúng contract. Không cho xóa/sửa entry timeline nếu nghiệp vụ không có.

## 7.5. Acceptance CSKH

- [ ] Tạo note nháp → gõ search/đổi filter → note không mất.
- [ ] Chuyển case A→B khi A có draft → guard hoặc lưu theo case; không nhập nhầm A vào B.
- [ ] Request A đến muộn không ghi đè B.
- [ ] Timeline sau lưu hiển thị bản ghi mới đúng một lần.
- [ ] Case không liên kết đơn hiện thông báo rõ, không spinner mãi.
- [ ] Layout desktop 3 vùng, mobile có đường trở lại hàng chờ và không mất draft.
- [ ] API 403 không được render PII của case không có quyền.

---

# 8. ĐẶC TẢ CUSTOMER/PUBLIC — MODERN CINEMATIC COMMERCE

**Phạm vi cải tiến:** làm rõ hành trình đặt vé, hierarchy và trạng thái; **không** tái viết booking logic/price/payment hiện có. Audit V2 chỉ test chọn ghế và render route, chưa nghiệm thu payment/order-create.

## 8.1. Trang chủ `/`

- **Hero chính:** headline gọn, value proposition, CTA `Xem phim` + `Đặt vé` (chỉ dẫn đến suất hợp lệ/route đang có). Không tạo “suất featured” giả.
- **Khám phá phim:** ưu tiên đang chiếu/sắp chiếu **chỉ nếu data phân biệt được**; nếu không có dữ liệu trạng thái thì dùng “Khám phá phim” trung lập.
- **Quick booking (PROPOSED):** phim → rạp → ngày/suất (lookup bằng API hiện có); khi thiếu API phù hợp, giữ CTA sang movie detail thay vì form dead-end.
- **Các vùng:** hero → phim → tìm rạp → cách đặt vé đơn giản → footer; không lặp quá nhiều card chung tông gây nhàm.
- **Xóa `DatabaseHealth` khỏi public page:** không lộ tên DB, SQL Server hoặc endpoint diagnostic; nếu cần báo lỗi dịch vụ, chỉ hiển thị thông điệp người dùng và ở phạm vi được phép.
- **Responsive:** tại 390 px không tràn ngang hay cắt text; poster nguồn ngoài lỗi có alt/placeholder đẹp, chưa kết luận production ảnh lỗi.

## 8.2. Phim `/movies` và `/movies/:movieId` (KH-04/05/13)

- `/movies` filter theo tên/thể loại đã có; trạng thái/năm chỉ khi data có. Card: poster, tên phim, metadata tối thiểu, CTA chi tiết/đặt vé theo suất.
- `/movies/:id` bố cục: hero poster/thông tin phim → lịch chiếu (lọc ngày/rạp nếu API cho) → nội dung phim → reviews.
- Lịch chiếu dùng ngày/giờ local/timezone phù hợp, hiển thị trạng thái còn suất khi server trả; không tự tính “hết ghế” từ mỗi card.
- Review chỉ cho submit theo điều kiện eligibility thật; error/empty/focus hợp lệ.

## 8.3. Rạp `/cinemas` và `/cinemas/:cinemaId`

- Catalog: search theo tên, khu vực nếu có dữ liệu, card chứa tên/địa chỉ ngắn/nút chi tiết.
- Detail: tên/địa chỉ/hình thật → các phim/suất chiếu liên quan khi API có → CTA xem phim/lịch. Không đưa vào bản đồ, tính ETA hay tích hợp địa điểm ngoài scope.
- Trạng thái ảnh: placeholder + retry hữu ích; không để layout nhảy khi ảnh tải chậm.

## 8.4. Đặt vé `/booking/:showtimeId` (KH-06/07/08/09)

**Bố cục desktop đề xuất:** thông tin phim/suất, `SeatMap` trung tâm, sản phẩm/khuyến mãi sau chọn ghế, order summary sticky có total/hold deadline. Mobile xếp tuần tự nhưng summary phải thấy rõ hoặc mở nhanh.

1. Xác định showtime từ server; hiển thị phim/rạp/phòng/ngày giờ.
2. Hiển thị seat-map hiện có (Audit V2 chọn/bỏ ghế hoạt động); chú thích available/held/sold/selected rõ, không chỉ màu.
3. Sau chọn ghế → sản phẩm/khuyến mãi; tổng lấy preview server (nếu endpoint có), **không coi tính toán browser là giá cuối**.
4. Chặn double submit; khi 409 phải hiển thị ghế nào bị xung đột nếu server trả và cho chọn lại.
5. Hold timeout phải theo nguồn server/clock contract; lỗi network không làm người dùng nghĩ đã giữ ghế thành công.
6. Sau tạo đơn → điều hướng chi tiết/payment như route đã có.

**Bảo vệ đặc biệt:** giới hạn số ghế; stale response khi đổi showtime; snapshot giá; promotion quota; thanh toán multiple attempts; order/create không được gửi lặp sau timeout.

## 8.5. Đơn và thanh toán (KH-10/11/12)

- `/orders`: search/lọc theo trạng thái/khoảng ngày nếu API hỗ trợ; list card/table với mã đơn, phim, suất, giá, trạng thái, hành động.
- `/orders/:orderId`: header đơn + vé/ghế + khoản tiền + lịch sử/attempt nếu API cho; hiển thị trạng thái checkout rõ.
- `/orders/:orderId/payment`: phân biệt chờ thanh toán/đã thanh toán/hết hạn/lỗi; không double submit payment; không hiển thị input nhạy cảm ngoài provider contract.
- Hủy/hoàn tiền chỉ khi business API cho phép; không biến “Xóa đơn” thành xóa lịch sử.

## 8.6. Tài khoản và khiếu nại (KH-01/02/03/14)

- Login/register: form rõ label/errors, password UX, loading/disabled, redirect đúng role sau login; role không được chọn khi đăng ký công khai.
- `/account` / `/profile`: thông tin cá nhân; thông tin role read-only; không expose điều khiển quyền.
- `/complaints` / `:id`: lịch sử + tạo khiếu nại + trạng thái/timeline nếu API có; selector đơn liên quan theo **mã đơn có nghĩa**, không nhập raw order ID nếu dữ liệu lookup có.
- Browser kiểm thử flow lưu hồ sơ, complaint create/detail bằng test fixture; không hiển thị case của Customer khác.

## 8.7. Empty/error/asset behavior Customer

- Không có suất chiếu: thông báo “Chưa có suất chiếu phù hợp”; CTA chọn ngày/rạp/phim khác nếu dữ liệu support.
- Poster lỗi: fallback theo tỷ lệ cố định và alt có nghĩa; hình seed remote V2 blocked cần test mạng staging riêng.
- Hết hạn giữ chỗ: không giữ optimistic selection như vẫn được mua; nêu hành động làm mới.
- Payment fail: giải thích trạng thái thật, không tự sửa đơn sang “đã thanh toán”.

---

# 9. MA TRẬN BỘ LỌC VÀ CỘT BẢNG — CHECKLIST THEO TỪNG RESOURCE

> **Ý nghĩa cột “Hợp đồng”:** `VERIFY` = cần kiểm tra nguồn API/SP thật; không tuyên bố filter đã có. `KNOWN UI` = audit quan sát control xuất hiện, chưa chắc test query. **Mọi filter PROPOSED phải được map tới field response/API thật** trước khi bật trên production.

| Portal/module | Filter/search tối thiểu mục tiêu | Cột chính / kiểu xem | Hợp đồng & kiểm tra |
|---|---|---|---|
| Admin / Tài khoản | tên/email, role, trạng thái | STT; tên; email; role; trạng thái | VERIFY search/scope |
| Admin / Phân công | Manager, rạp | STT; Manager; rạp; hiệu lực | VERIFY transfer/update semantics |
| Admin / Rạp | tên, trạng thái/khu vực nếu có | STT; tên; địa chỉ; số phòng | VERIFY room count |
| Admin / Ảnh rạp | rạp bắt buộc, loại ảnh nếu có | gallery theo rạp | VERIFY image ownership |
| Admin / Phòng | **rạp**, tên/loại phòng | STT; tên phòng; rạp; số ghế; actions | VERIFY list-by-cinema |
| Admin / Ghế | **rạp → phòng**, hàng, loại | **seat-map** + inspector; fallback list STT | VERIFY seat structure |
| Admin / Phim | tên, thể loại, trạng thái | STT; poster; phim; thể loại; thời lượng | VERIFY movie metadata |
| Admin / Thể loại | tên | STT; tên; số phim nếu có | VERIFY count |
| Admin / Diễn viên | tên, phim nếu có | STT; tên; liên kết phim | VERIFY relation lookup |
| Admin / Suất chiếu | **rạp → phòng**, phim, ngày, trạng thái | STT; phim; rạp/phòng; thời gian | VERIFY date range API |
| Admin / Bảng giá | rạp nếu scope, ngày, loại ghế | STT; loại; phạm vi; giá | VERIFY 3 day types |
| Admin / Khuyến mãi | mã/tên, hiệu lực/trạng thái | STT; mã; loại; giá trị; trạng thái | VERIFY quota fields |
| Admin / Sản phẩm | tên, loại, trạng thái | STT; tên; loại; giá; trạng thái | VERIFY catalogue |
| Admin / Khiếu nại | status, type, priority, search | STT; chủ đề; khách; ngày; status | VERIFY authorized PII |
| Admin / Doanh thu | ngày bắt đầu/kết thúc, rạp | KPI + chart/table | VERIFY SP metrics |
| Admin / Đặt vé | mã đơn, khách, rạp, phim, ngày, trạng thái | STT; mã đơn; khách; phim; vé; tiền; status | VERIFY staff CRUD & filter |
| Manager / Phòng | cinema context, tên phòng | STT; phòng; loại; số ghế | VERIFIED context, query VERIFY |
| Manager / Ghế | cinema → room, hàng, loại | **seat-map** + inspector | VERIFIED current list, target new |
| Manager / Suất chiếu | room, phim, ngày, trạng thái | schedule + list | VERIFIED form raw ID, fix P1 |
| Manager / Bảng giá | loại ghế, loại ngày | STT; loại; ngày; giá | VERIFY scope |
| Manager / Doanh thu | khoảng ngày | KPI/table | VERIFY range API |
| Manager / Đặt vé | mã đơn, khách, phim, ngày, status | STT; mã đơn; khách; suất; status | VERIFIED route only |
| CSKH / Queue | search, loại, ưu tiên, status | case list/detail/timeline | KNOWN UI; filter bug P1 |
| Customer / Phim | tên, thể loại | movie grid | KNOWN UI; filter submit not tested |
| Customer / Rạp | tên, khu vực nếu có | cinema grid | VERIFY location field |
| Customer / Đơn | status/khoảng ngày nếu có | order cards/list | VERIFY filtering |
| Customer / Khiếu nại | status nếu có | complaint list/detail | VERIFY API |

**Kiểm tra UX cần có trên từng bộ lọc:** chọn → Apply → quan sát request/response → kết quả đúng toàn scope → Reset → Empty → Back/Reload → Access denied → mobile; ghi screenshot + log evidence. Không đánh dấu FILTER PASS khi chỉ nhìn thấy dropdown.


---

# 10. FRONTEND ARCHITECTURE & MIGRATION TECHNIQUES

## 10.1. Mục tiêu cấu trúc thư mục (minh họa, không bắt buộc rename toàn bộ)

```text
frontend/src/
├── app/                     # App routes / providers / guards (có thể giữ routes/ cũ)
├── layouts/
│   ├── PublicShell.jsx
│   └── StaffShell.jsx
├── components/
│   ├── primitives/         # Button, Dialog, Input, Select, StatusBadge...
│   ├── data/               # ResourceTable, FilterBar, EmptyState...
│   └── domain/             # SeatLayout view, ShowtimeSchedule view...
├── features/
│   ├── admin/
│   │   ├── users/ assignments/ cinemas/ rooms/ seats/
│   │   ├── movies/ genres/ actors/
│   │   ├── products/ promotions/ pricing/ showtimes/
│   │   ├── bookings/ complaints/ revenue/
│   │   └── overview/
│   ├── manager/            # Pages/composition riêng; dùng chung view khi đúng contract
│   ├── support/            # queue, detail, timeline, context, actions
│   └── customer/           # home, catalog, booking, orders, complaints
├── services/               # GIỮ REST clients hiện có; không đổi contracts tùy tiện
├── hooks/                  # reusable request/dirty-state helpers chỉ khi chứng minh cần
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── layouts.css
│   └── components/         # ownership cụ thể, tránh 1 file CSS khổng lồ
└── tests/
```

**Migration an toàn:** không tạo folder mới chỉ để đẹp; có thể tách `AdminPortal.jsx` dần thành screen modules, giữ import/api behavior. Theo Audit V1, `AdminPortal.jsx` monolith và `index.css` đơn khối là nguồn rủi ro maintainability; nên tách ownership khi chạm đến từng slice, **không rewrite toàn bộ cùng lúc**.

## 10.2. API adapter vs business logic

- Giữ API client hiện tại: không copy fetch vào từng JSX mới.
- Dùng **presentation adapter** map DTO → view model (`id` ẩn, `displayName`, `statusLabel`, `showtimeText`), nhưng không đổi giá, quyền, tính tổng/tình trạng nghiệp vụ.
- Quan hệ ID→tên chỉ map khi có lookup nguồn hợp lệ. Lỗi thiếu lookup => `BLOCKED` hoặc empty state, không phải chuyển sang raw numeric input như trước.
- Role scope xử lý tại backend/DB, frontend chỉ thể hiện `allowedActions` dựa trên chính sách có sẵn. Không tự bịa một ma trận quyền mới trong component.
- Không thay đổi response body của API khi chỉ cần đổi nhãn hiển thị.

## 10.3. State ownership matrix

| State | Chủ sở hữu khuyến nghị | Reset khi nào | Không được làm |
|---|---|---|---|
| Auth/role | auth provider/guards hiện có | login/logout | tự đổi role khi form edit user |
| Active staff route | React Router | navigation | local section state đè deep-link |
| Manager cinema | Manager context/shell + route compatible | assignment đổi, chọn rạp | dữ liệu rạp A hiện dưới header B |
| Admin cinema/room filters | feature route/query | parent context đổi | dùng roomId từ rạp cũ |
| Seat selection/layout | seat feature, keyed by room/showtime/mode | đổi phòng/suất | mutate ghế sai, ghế old response |
| Table filters/page | feature list, URL nếu an toàn | apply/reset | lọc một trang rồi coi toàn dữ liệu |
| Edit form dirty | feature form, resource-keyed | save/discard confirmed | mất draft khi filter/case change |
| CSKH selected case/draft | support case-keyed state | explicit discard/saved | ghi note A vào B |
| Booking Customer | booking feature context by showtime | đổi suất/expire | giữ giá/hold cũ |
| Transaction status | server/API | server-confirmed action | set payment success ở client |

## 10.4. Quy trình chống race cho hierarchy/filter

```text
EVENT: parent (cinemaId/roomId/showtimeId/caseId) changes
1. Increment request generation / abort current eligible GET.
2. Clear dependent selection and any derived view-state belonging to old parent.
3. Preserve/confirm unsaved draft before irreversible context change.
4. Fetch new scoped resources through existing service.
5. On response: check request generation + parent identity + permission scope.
6. Only apply if all match current context; else discard stale result.
7. On mutation: recheck visible resource ID/context, submit once, refresh current owner.
```

**Regression đặc biệt:** `CinemaImageManager` đã có ownership guards; không làm mất khi đưa vào route mới. CSKH vừa giữ dirty state vừa bỏ stale response. Với booking và manager assignment giữ các tình huống race/data-integrity đã được verify ở Phase 9 lịch sử.

## 10.5. Accessibility chuẩn triển khai

- `StaffShell` mobile drawer: mở → focus ở item đầu/heading phù hợp, trap focus trong modal nav, `Escape` đóng, trả focus toggle; background inert nếu drawer có semantics modal; dùng WAI-ARIA APG pattern đúng.
- Dialog: heading/description semantic, `aria-modal` chỉ khi thật sự modal, Cancel dễ tiếp cận, focus restore.
- `ResourceTable`: caption/thead/th semantics, sort labels, row actions có tên đối tượng; không tab qua 200 action không cần thiết nếu có row menu hợp lý.
- `SeatLayout`: keyboard navigation hoặc accessible alternative list/table đầy đủ, icon shape/legend và aria không phụ thuộc màu, focus nhìn rõ ở 390 px; zoom không làm mất người dùng đang chọn.
- Loading/filters: công bố kết quả qua live region phù hợp, đừng thông báo quá nhiều mỗi khi debounce.
- Thiết kế theo WCAG 2.2 AA; dùng automated axe **và** keyboard browser/manual, kiểm tra zoom 200%, font scaling khi có thể. **Không tuyên bố toàn WCAG PASS chỉ dựa vào vài cặp màu**.

## 10.6. Responsive contracts

| Viewport kiểm thử | Staff navigation | Resource list | Seat map | CSKH |
|---|---|---|---|---|
| 390 px | drawer accessible | prioritized cards/cols, no overflow | map scroll/zoom, inspector stacked | queue → detail route/transition |
| 768 px | drawer/collapsible sidebar | filter wrap, table deliberate | grid with scroll + clear room context | queue/detail tabs or stacked |
| 1280 px | sidebar thường | toolbar + curated table | map + inspector nếu đủ rộng | 2/3-pane khi đủ min width |
| 1440 px | sidebar + main rộng | standard table | full map + inspector | desktop 3-pane |
| 1920 px | không stretch form quá rộng | table density hợp lý | center map with max readable size | hạn chế whitespace trống |

**Mỗi màn hình sửa phải test đủ 5 viewport**, screenshots same fixture before/after; emulation không thay hoàn toàn manual physical-device test.

---

# 11. KẾ HOẠCH TRIỂN KHAI THEO SLICE — HƯỚNG DẪN CHO AI CODING

**Đặt tên chương trình:** `UXR-V3` để tránh nhầm với DBMS Phase 0–12 hoặc Phase 2–4 UX cũ. Đây là các **work packages trong giai đoạn frontend restructure**; không tự ý cập nhật trạng thái các phase backend cũ.

## 11.1. Giai đoạn UXR-0 — Baseline & readiness (chưa redesign)

**Việc làm**

1. `git status`, ghi commit SHA/branch, không đè thay đổi của thành viên khác.
2. Đọc source thật: `frontend/src/routes/index.jsx`, `StaffShell`, `AdminPortal`, `ManagerPortal`, `SupportPortal`, customer booking routes, clients và tests.
3. Đọc `USE_CASE_MATRIX_45.md` **bản hiện hành**, xác nhận 44 active (không dựa tên file), `ADM-03/04/05` retired, ADM-17 ngoài phạm vi, QLR-10 và ADM-18.
4. Đọc nguồn API & SP cho từng module trước khi chỉnh màn hình: operation nào CRUD, search/filter có tham số gì, quyền/scope; không suy đoán theo thiết kế mới.
5. Chụp baseline screenshots với browser trên test DB; log API/data fixture, viewports, console, login role.
6. Lập `API_UI_CAPABILITY_MATRIX.md` gồm từng bộ lọc/hành động và status `SUPPORTED / UI-ONLY POSSIBLE / NEEDS APPROVAL / BLOCKED`.
7. Ghi danh sách lỗi cần xử lý gấp từ V2 (CSKH draft, Manager raw ID, DatabaseHealth, drawer focus).

**Exit gate:** đầy đủ proof cho route hiện hành, không còn conflict baseline âm thầm; có fixture/credential test an toàn. Nếu thiếu DB/browser/data thì **BLOCKED**, không kết luận.

## 11.2. UXR-1 — Safety fixes trước refactor lớn

| Slice | Việc làm | Exit gate |
|---|---|---|
| UXR-1A | CSKH draft guard & request/filter separation | Browser test draft/filter/case switch không mất text |
| UXR-1B | Public DatabaseHealth removal + no DB leak in public UI | 390 px không cắt tên DB; network payload được đánh giá riêng |
| UXR-1C | Staff mobile drawer focus | Keyboard focus enters, stays, closes/restores |
| UXR-1D | Manager numeric input → named resource selectors | Browser chọn phim/phòng bằng tên, payload ID đúng, scope đúng |

**Không đợi tới khi redesign toàn Admin mới sửa P1.** Nhưng các patch phải ít thay đổi, test thật.

## 11.3. UXR-2 — Shared foundation & route ownership

- Giữ brand tokens và shared shells hiện có; thêm component/tokens còn thiếu sau audit.
- `PageHeader`, `FilterBar`, `ResourceTable` column schema, `ResourceSelect`, `ConfirmDialog`, `AsyncState`; viết contract/test trước khi dùng hàng loạt.
- Tạo Admin child routes theo từng route thực sự được migrate, không redirect tất cả cùng lúc.
- Manager routes theo context; `bookings` hiện có không bị remount/reset không cần thiết.
- **Exit:** nav active, back/forward, direct reload, 403, mobile menu, screen with old routes đều đúng; chỉ merge sau browser smoke.

## 11.4. UXR-3 — Cơ sở vật chất (PRIORITY UX)

| Slice | Screen | Thứ tự & yêu cầu | Regression |
|---|---|---|---|
| UXR-3A | Admin Phòng | rạp filter → list-first → curated columns → named selector | parent/scope/count |
| UXR-3B | Admin Sơ đồ ghế | cinema→room→seat-grid→inspector; list fallback; two modes | history guard, stale response |
| UXR-3C | Manager Phòng/Ghế | reuse seat view đúng scope; no raw ID | scope, context A→B |
| UXR-3D | Admin Rạp/Ảnh | cinema list/detail; gallery per cinema | `CinemaImageManager` ownership |

**Exit:** có screenshot seat-map room thực ở Admin và Manager, filter demo từ nhiều rạp/phòng, test ghế history protection trên DB test. **Không cho agent tự phát minh seat layout geometry**.

## 11.5. UXR-4 — Suất chiếu / Bảng giá / Đặt vé

| Slice | Screen | Deliverable | Guard |
|---|---|---|---|
| UXR-4A | Admin/Manager Showtimes | rạp/phòng/ngày/film selector; list view; calendar optional | overlap, held-order cancel, timezone |
| UXR-4B | Admin/Manager Pricing | filters type/day/cinema; 3 day-types | historical snapshot |
| UXR-4C | Admin/Manager Bookings list/detail | filters; curated table; status-aware actions | role scope, PII, order history |
| UXR-4D | Staff Create/Edit/Cancel booking | guided form **chỉ khi API/SP đã hỗ trợ**, capability gap riêng nếu chưa | existing Customer, locking, payment, safe cancel |

**Không ghép UXR-4D chung với thay đổi UI nếu CRUD nghiệp vụ chưa có contract đã duyệt.** Tách backend/DB workstream có phê duyệt riêng, không đánh tráo là “pure UI”.

## 11.6. UXR-5 — Catalog & quản trị Admin còn lại

- UXR-5A: Tài khoản và phân công Manager; RBAC fixed, không update role.
- UXR-5B: Phim, diễn viên, thể loại; lookup named relations.
- UXR-5C: Sản phẩm và khuyến mãi; filters/trạng thái/hậu quả.
- UXR-5D: Khiếu nại Admin & Doanh thu, Dashboard; report đúng source data.
- Sau từng slice: browser before/after + filter verified + keyboard smoke + API/RBAC regression.

## 11.7. UXR-6 — CSKH & Customer

- UXR-6A CSKH: queue/detail 3 vùng + deep link + draft guard (giữ fix UXR-1A).
- UXR-6B Customer home/catalog/cinema: cinematic journey, remove diagnostics, media fallback.
- UXR-6C Customer booking layout: sticky summary, seat map, product/promo UX; **không chỉnh core price/payment**.
- UXR-6D Customer orders/payment/profile/complaints: hierarchy/state/errors; role/ownership checks.

## 11.8. UXR-7 — Integration acceptance và đóng dự án UI

- Replay toàn bộ **44 active UC** bằng browser + API + DB test fixtures theo bảng §13; lịch sử PASS không mặc định được kế thừa cho UI mới.
- Automated axe + keyboard/manual accessibility, 5 viewports, screenshots diff được review bởi người dùng.
- Regression test cross-role, lifecycle booking, CSKH, payment, cinema scope, stale responses.
- Lint, tests, production build, no-SQL scan, API compatibility review.
- Lập traceability requirement ↔ code ↔ browser screenshot ↔ test result; `PASS/FAIL/BLOCKED/NOT VERIFIED` không bịa.
- **Không coi UXR-3 hay UXR-6 đã làm xong là toàn 44 UC PASS**.

## 11.9. Quy tắc triển khai một slice — BẮT BUỘC

```text
START SLICE
  1. Identify current UC + role + authorized action(s).
  2. Read original screen/source + related API/SP contract.
  3. Capture before screenshot and interaction recording.
  4. Make approved screen-spec: layout, filters, columns, form, states, responsive.
  5. Map every filter/action to source fields/API; flag blockers explicitly.
  6. Implement presentation/route/state changes incrementally.
  7. Run lint/build/tests relevant to changed code.
  8. Browser verify role actions, filter behavior, viewport, keyboard, negative cases.
  9. Check API payload/status, permission and DB history regression.
 10. Capture after screenshots with same fixture/state/width.
 11. Write short slice report: PASS/FAIL/BLOCKED; include file diff and risks.
 12. STOP; wait review before next high-risk slice.
END SLICE
```

### Những sửa đổi cần chủ dự án phê duyệt trước

- Thêm/chỉnh API, Stored Procedure, permission, bảng, transaction semantics, quy tắc đổi vé/hủy/hoàn tiền.
- Thay dữ liệu cần lưu trong DB (tọa độ ghế, loại ghế mới, trạng thái mới, inventory mới).
- Thay đổi URL public/backward compatibility, giới hạn đặt vé, cách tính giá, đăng nhập và RBAC.
- Cài thư viện UI component framework toàn hệ thống, drag-drop calendar, state manager lớn, chart package nặng chưa có.

---

# 12. BROWSER TEST PLAN & CHẤT LƯỢNG — DÙNG ĐỂ NGHIỆM THU

## 12.1. Test environment và fixture

- **Bắt buộc** dùng DB test cô lập, kiểm tra identity DB trước khi mutation; tuyệt đối không thử CRUD/payment destructive trên production.
- Tối thiểu: 1 Admin, 1 Manager rạp A, **1 Manager nhiều rạp nếu hệ thống cho phép**, 1 CSKH, 2 Customer hợp lệ, 1 account sai role, 2 rạp/2 phòng mỗi rạp, phòng nhiều hàng/loại ghế, vài suất (past/current/future), đơn unpaid/paid/canceled/expired theo contract, complaint có/không có order, asset có/không có URL.
- Với fixture ghi dữ liệu: snapshot trước test, rollback/cleanup theo từng scenario nếu an toàn; không xóa dữ liệu test mà audit cần giữ để traceability khi chưa thông báo.
- Browser headed hoặc headless Chromium/Edge thực; đo viewport 390/768/1280/1440/1920; screenshots có tên `role__route__viewport__state.png`.
- Không cần ghi password/token/PII vào báo cáo hay URL. Redact khi lưu screenshot nếu dữ liệu thật bị lộ.

## 12.2. Bộ test UI chung cho mỗi screen

| Test ID | Kiểm thử | Pass khi |
|---|---|---|
| UI-01 | URL/route/direct reload | Đúng màn/role, reload/back state đúng |
| UI-02 | Header + CTA | Hành động chính rõ, không 2 primary gây nhầm |
| UI-03 | Search/filter/Reset | Request/scope đúng, kết quả chính xác toàn dataset |
| UI-04 | Column allowlist/STT | Không lộ ID kỹ thuật thừa; STT đúng page/sort/filter |
| UI-05 | Named resource selector | Label tên đúng + value ID đúng, no raw ID entry |
| UI-06 | Loading/empty/error/403/404/409 | Thông điệp khác nhau và retry/action hợp lệ |
| UI-07 | Form submit/validation | Có field errors, không double submit, draft giữ khi fail |
| UI-08 | Delete/cancel confirmation | Nêu đúng resource/hậu quả, Cancel an toàn |
| UI-09 | Keyboard/focus | Tab/Shift+Tab/Escape, focus visible, aria correctness |
| UI-10 | Responsive 5 viewports | Không tràn, bảng/sơ đồ/CTA còn dùng được |
| UI-11 | Stale-response/race | A→B→A, request cũ không ghi đè |
| UI-12 | RBAC/scope negative | Unauthorized bị backend deny, không leak data |
| UI-13 | Browser artifacts | Có screenshot+request+actual result theo case |
| UI-14 | Regression | Test cũ không fail ngoài nguyên nhân ghi nhận |

## 12.3. Các kịch bản nghiệp vụ high-risk

### Ghế

- G-01: Admin chọn cinema A → room A1 → load đúng ghế; đổi room A2, sơ đồ đúng.
- G-02: Manager chỉ thấy cinema assignments; forged roomId/cinemaId bị backend từ chối.
- G-03: SeatMap `A01` click → inspector đúng seat ID; hàng/số đúng DB và không đổi vị trí do filter.
- G-04: Ghế có lịch sử vé → nút sai quyền ẩn/disabled và SP vẫn trả 409 khi gọi trực tiếp; UI không xóa khỏi sơ đồ.
- G-05: Mode physical layout **không** hiển thị “sold” từ dữ liệu không có showtime; per-showtime mode đọc đúng availability.
- G-06: Browser keyboard và 390 px có phương án tương đương view seat list.

### Suất chiếu/giá

- S-01: movie/room chọn theo tên, giá trị submit là ID thật.
- S-02: overlap showtime/held order cancel → 409 có giải thích, không ghi thay đổi trái ý.
- S-03: price 3 day types, không có Ngày lễ; đơn đã tạo giữ giá snapshot.
- S-04: Manager rạp A tạo/cancel suất rạp B bị từ chối.

### Đặt vé/Thanh toán

- B-01: Customer existente đúng role → tạo staff booking đúng rạp/suất/ghế nếu contract hỗ trợ.
- B-02: CustomerID nonexistent/sai role/inactive → từ chối ở backend, UI hiển thị chính xác.
- B-03: Admin all cinemas; Manager only assigned cinema; direct API negative test.
- B-04: Hai request ghế trùng cạnh tranh → chỉ một thành công theo DB lock; browser phản hồi 409 đúng.
- B-05: Không thay Customer của đơn cũ, không chỉnh snapshot/manual paid.
- B-06: Edit unpaid chỉ thuộc allowed fields/after status recheck; paid/canceled/expired read-only trừ luồng đã duyệt.
- B-07: Hủy không làm mất lịch sử; payment attempt không nhân đôi khi submit/retry.

### CSKH

- C-01: nhập note chưa lưu → đổi search/filter/case → giữ hoặc warning.
- C-02: status update không được gộp nhầm vào append processing entry; timeline đúng thứ tự.
- C-03: xem case có/không có order reference; forbidden case không lộ PII.
- C-04: 1440 px 3 panes; 390 px queue/detail phù hợp.

### Admin account/assignment

- A-01: Không route/button CRUD role/permission/grants kể cả truy cập URL cũ.
- A-02: Role chọn đúng ở create nội bộ (nếu được phép), không sửa ở edit; public register không có chọn role.
- A-03: Phân công/chuyển rạp hiển thị manager hiện tại và rạp mới; không đổi role; scope cập nhật theo server.

### Public/accessibility

- P-01: tên DB/SQL Server không được render trên public home.
- P-02: viewport 390 không cắt health identifier; ưu tiên gỡ thẻ kỹ thuật.
- P-03: Staff nav open → focus inside → Tab/Shift+Tab giữ trong modal → Escape return focus.
- P-04: external poster/font ở staging network-permitted test riêng; không nhầm ENV BLOCKER thành frontend API defect.

## 12.4. Quy tắc PASS / FAIL / BLOCKED

- `BROWSER VERIFIED`: đã mở route và thao tác, có screenshot/log; ghi rõ trường hợp nào chỉ `SCREEN`.
- `E2E PASS`: actor thao tác thành công (hoặc negative expected) qua UI→API→DB thật trong test DB, kiểm tra state hậu quả.
- `SOURCE VERIFIED`: chỉ đọc code; không dùng thay cho E2E.
- `BLOCKED`: thiếu fixture/permission/API/browser/DB; ghi nguyên nhân, yêu cầu xác minh cụ thể.
- `NOT VERIFIED`: chưa thực hiện dù có thể test.
- `FAIL`: test thực tế không đáp ứng expected.

**Không lấy “760 API không lỗi” để kết luận CRUD đã PASS** — V2 chưa chạy hầu hết nghiệp vụ ghi.


---

# 13. TRACEABILITY — 44 USE CASE HOẠT ĐỘNG → MÀN HÌNH / KIỂM THỬ

> Đây là **mục lục truy vết** theo Audit V2, không phải bản sao chi tiết của UC Matrix, và **không** tuyên bố 44/44 đã nghiệm thu. Khi triển khai phải ghi lại UC Matrix phiên bản hiện hành và link tới testcase thực.

## 13.1. Customer — 14 UC

| UC | Nghiệp vụ | Màn hình đích | Test đại diện |
|---|---|---|---|
| KH-01 | Đăng ký | `/register` | register role Customer, field errors |
| KH-02 | Đăng nhập | `/login` | form submit, role routing, 401 |
| KH-03 | Hồ sơ | `/profile`, `/account` | edit/save/error/read-only role |
| KH-04 | Danh sách/chi tiết phim | `/movies`, `/:id` | search/genre/detail |
| KH-05 | Lịch chiếu | movie/cinema detail | day/cinema/showtime selector |
| KH-06 | Chọn ghế | `/booking/:showtimeId` | seat map select/deselect + stale data |
| KH-07 | Đặt vé | `/booking/:showtimeId` | create, seat conflict, hold |
| KH-08 | Đồ ăn | booking flow | quantity, pricing authoritative |
| KH-09 | Khuyến mãi | booking flow | preview/invalid/quota |
| KH-10 | Thanh toán | `/orders/:id/payment` | attempt/result/double submit |
| KH-11 | Lịch sử đơn | `/orders` | ownership/filter/list |
| KH-12 | Chi tiết đơn | `/orders/:id` | snapshot/status/private ownership |
| KH-13 | Đánh giá | movie detail | eligibility/review submit |
| KH-14 | Khiếu nại | `/complaints`, `/:id` | create/history/own detail |

## 13.2. Manager — 10 UC

| UC | Nghiệp vụ | Màn hình đích | Test đại diện |
|---|---|---|---|
| QLR-01 | Truy cập và scope rạp | staff shell + `/manager` | assigned cinema only |
| QLR-02 | Phòng | `/manager/rooms` | filter/CRUD hợp lệ |
| QLR-03 | Ghế | `/manager/seats` | map/history guard |
| QLR-04 | Tạo suất chiếu | `/manager/showtimes` | named selectors/create |
| QLR-05 | Sửa suất chiếu | `/manager/showtimes` | edit/time/conflict |
| QLR-06 | Hủy suất chiếu | `/manager/showtimes` | held-order block |
| QLR-07 | Bảng giá | `/manager/pricing` | 3 day types/snapshot |
| QLR-08 | Dashboard rạp | `/manager/overview` | scope/current cinema |
| QLR-09 | Doanh thu rạp | `/manager/revenue` | scope/range/metrics |
| QLR-10 | Quản lý đặt vé | `/manager/bookings` | staff create/edit/cancel/scope |

## 13.3. CSKH — 6 UC

| UC | Nghiệp vụ | Màn hình đích | Test đại diện |
|---|---|---|---|
| CSKH-01 | Truy cập | `/support` | role route guard |
| CSKH-02 | Hàng chờ | `/support` | draft/applied filters |
| CSKH-03 | Chi tiết | `/support/complaints/:id` | deep link, selected case |
| CSKH-04 | Đơn tham chiếu | detail context panel | linked/unlinked/permission |
| CSKH-05 | Ghi lần xử lý | action panel | preserve draft, append timeline |
| CSKH-06 | Đổi trạng thái | action panel | valid transition, confirmation |

## 13.4. Admin — 14 UC

| UC | Nghiệp vụ | Màn hình đích | Test đại diện |
|---|---|---|---|
| ADM-01 | Đăng nhập | `/login`, staff shell | role guard |
| ADM-02 | Tài khoản | `/admin/access/users` | search/create/status, immutable role |
| ADM-06 | Phân công Manager | `/admin/access/assignments` | assign/transfer |
| ADM-07 | Rạp & ảnh | `/admin/cinemas`, `/admin/cinemas/images` | cinema + image ownership |
| ADM-08 | Phòng & ghế | `/admin/facilities/rooms`, `/admin/facilities/seats` | hierarchy + map + history |
| ADM-09 | Phim & diễn viên | `/admin/catalog/movies`, `/admin/catalog/actors` | actor relation persistence |
| ADM-10 | Thể loại | `/admin/catalog/genres` | CRUD constraints |
| ADM-11 | Sản phẩm | `/admin/commerce/products` | list/form/snapshot |
| ADM-12 | Khuyến mãi | `/admin/commerce/promotions` | validity/amount/quota |
| ADM-13 | Bảng giá | `/admin/operations/pricing` | day type/historical snapshot |
| ADM-14 | Suất chiếu | `/admin/operations/showtimes` | create/edit/cancel/held-order |
| ADM-15 | Khiếu nại | `/admin/service/complaints` | permission and details |
| ADM-16 | Dashboard/doanh thu | `/admin/overview`, `/admin/reports/revenue` | server reporting |
| ADM-18 | Đặt vé nhân viên | `/admin/bookings` | create/edit/cancel, Customer owner |

**Không áp dụng:** `ADM-03 Vai trò`, `ADM-04 Quyền`, `ADM-05 Gán quyền` đều **RETIRED**; `ADM-17` out-of-scope. Không tạo lại các UC này dưới bất kỳ tên menu khác.

---

# 14. MẪU SCREEN SPEC & MẪU BÁO CÁO SLICE

## 14.1. SCREEN_SPEC_TEMPLATE.md (copy cho từng màn hình)

```markdown
# Screen Spec: [Role] — [Screen name]

## 0. Traceability
- UC ID(s): ...
- Current route / target route: ...
- Source component(s): ...
- API/SP contracts used: ...
- Decision status: APPROVED / PROPOSED / BLOCKED

## 1. User goal and workflow
- Người dùng muốn đạt: ...
- Path vào màn hình: ...
- Primary action: ...
- Permission + resource scope: ...

## 2. Information architecture
- Breadcrumb, title, description, context: ...
- Wireframe desktop/mobile: ...
- List/seat map/calendar/report/case: ...

## 3. Data/filter/table
| Field/filter | Human-readable label | API field/source | Supported? | Scope | Notes |
| ... | ... | ... | ... | ... | ... |
| Column | Header label | Visible desktop/mobile? | Sort | Notes |
| ... | ... | ... | ... | ... |
- STT / technical IDs: ...
- Pagination mode + total: ...

## 4. Create/edit/cancel/delete
- Trigger UI: ...
- Form fields/validation: ...
- Confirm/warning: ...
- Allowed state transitions: ...
- Blocking backend constraints: ...

## 5. States and interactions
- Loading / empty / 401 / 403 / 404 / 409 / 422 / network: ...
- Dirty state: ...
- Stale response and double submit: ...
- Keyboard/ARIA: ...
- Responsive at 390/768/1280/1440/1920: ...

## 6. Evidence and approval
- Before screenshot(s): ...
- Test fixture/role used: ...
- Acceptance criteria: ...
- Blockers/change requests: ...
- Approval: ...
```

## 14.2. SLICE_REPORT_TEMPLATE.md

```markdown
# UXR Slice Report — [SLICE ID]

- Commit/branch/date:
- Changed files:
- Role/UC scope:
- Before vs after screenshots:
- Contract API/SP unchanged? yes/no (explain)
- Filters verified: [name] [API request] [result]
- Test/lint/build: PASS/FAIL/NOT RUN (command + output)
- Browser 390/768/1280/1440/1920: PASS/FAIL/BLOCKED
- Keyboard/axe: PASS/FAIL/BLOCKED
- Role/scope/negative cases: PASS/FAIL/BLOCKED
- DB integrity/regression: PASS/FAIL/NOT VERIFIED
- Blockers/open decisions:
- Recommended next slice (DO NOT AUTO-START):
```

## 14.3. API_UI_CAPABILITY_MATRIX.md — form kiểm kê phải có trước triển khai

| Module | UX cần | Current GET/POST/PUT/DELETE | Dữ liệu response/parameter đủ không? | Quyền/scope | Trạng thái | Đề xuất |
|---|---|---|---|---|---|---|
| Seats | cinema→room + rows/types | ghi endpoint/SP thật | ghi field thật | Admin/Manager | SUPPORTED/BLOCKED | ... |
| Bookings | search by customer/status | ... | ... | Admin all/Manager scope | ... | ... |
| Showtimes | filter by cinema/date/movie | ... | ... | ... | ... | ... |
| CSKH | case-draft safely switch | ... | ... | CSKH | ... | ... |

**Quy tắc quan trọng:** user đã yêu cầu “mỗi trang có filter”; nếu endpoint chưa hỗ trợ, phải đưa phương án (a) lọc tập đầy đủ đã load, chứng minh bounded, hoặc (b) change request DBMS-first. Không được *fake UI filter* hoặc `fetchAll` vô hạn làm chậm/lộ dữ liệu.

---

# 15. ANTI-PATTERN CẤM LẶP LẠI

1. **One Giant Admin Page:** thêm form/bảng vào `AdminPortal.jsx` cùng `/admin` local tabs, không deep link.
2. **Render every DTO field:** tự sinh header từ tên thuộc tính API mà không curated schema.
3. **Raw ID input:** bắt nhân viên nhớ `PhongID/MovieID/CinemaID/CustomerID` dù đã có nguồn tên.
4. **Seat-as-table-only:** cả phòng trăm ghế hiển thị mỗi ghế một dòng là trải nghiệm chính.
5. **Flat all-cinema seats:** không bắt chọn rạp/phòng rồi trộn ghế khắp hệ thống.
6. **No filter / decorative filter:** dropdown có mặt nhưng request/query không đổi hoặc chỉ lọc 1 page server.
7. **Form-first list page:** form tạo mới chiếm phần lớn màn hình trước khi người dùng thấy danh sách.
8. **Every resource has CRUD:** Role/Permission cố định; lịch sử thanh toán/vé không bị xóa cứng chỉ vì có nút Xóa.
9. **Client-owned pricing/authorization:** tính final price, cho quyền tự động, đánh dấu PAID từ React.
10. **Stale resource write:** đã đổi rạp/phòng/case nhưng response hoặc mutation cũ vẫn vào resource mới.
11. **Destroy unsaved work:** đổi filter/search/case làm mất draft mà không cảnh báo.
12. **Security-by-hide:** chỉ ẩn UI nhưng API ghi RBAC/vượt rạp vẫn cho phép.
13. **Overdesign:** thêm drag-drop layout, ticket scanner, bulk editor, inventory, nhiều layout/phòng hoặc KPI giả chưa có nghiệp vụ.
14. **Big-bang rewrite:** đổi hết source + CSS + API một lần, rồi chỉ chạy build mà không browser test.
15. **Claim browser PASS from source scan:** mở route/screenshot không tương đương hoàn tất UC.

---

# 16. PROMPT NGẮN ĐỂ AI CODING THỰC HIỆN THEO TÀI LIỆU NÀY

> Copy nội dung dưới đây khi đã đưa blueprint vào repo. **Bắt đầu từ UXR-0 và UXR-1; không chạy hết tất cả slice trong một lượt.**

```text
Đọc MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md cùng
FRONTEND_DEEP_AUDIT_V2_REPORT.md, UX_ARCHITECTURE_BLUEPRINT.md,
FRONTEND_UIUX_DESIGN_STANDARDS.md, Use Case Matrix và source hiện tại.

Mục tiêu: tái cấu trúc UX/UI toàn bộ Frontend có kiểm soát theo blueprint V3,
ưu tiên trải nghiệm quản trị Admin/Manager, filters theo nghiệp vụ, STT thay ID,
SeatMap rạp→phòng và giao diện quản lý đặt vé theo đúng trạng thái.

BẮT ĐẦU CHỈ VỚI GIAI ĐOẠN UXR-0:
1. Khóa baseline 44 UC hiện hành từ repo thật; kiểm tra source/API/SP hiện có.
2. Lập API_UI_CAPABILITY_MATRIX.md cho toàn bộ filter, screen và actions.
3. Chụp baseline browser screenshots trên DB test cô lập tại 5 viewports.
4. Lập danh sách BLOCKER, giải quyết mâu thuẫn giữa tài liệu UX cũ và V2.
5. Tạo screen specs chi tiết cho UXR-1 (4 safety fixes),
   ghi mapping code/API và test criteria.
6. Báo cáo kết quả; KHÔNG triển khai các module khác hoặc tự mở rộng business.

Ở các lượt tiếp theo: triển khai MỖI lần một slice được chỉ định từ §11,
chạy browser regression + screenshot before/after + test/lint/build,
không thay API/DB/RBAC ngoài phạm vi được phê duyệt.

QUY TẮC: No raw SQL in application. No dynamic RBAC, ADM-17, guessed APIs,
fake filters, guessed seat coordinates, payment/booking shortcuts.
Đảm bảo role/scope, seat/history locks, CSKH draft, request-race guards.
Báo cáo PASS/FAIL/BLOCKED; dừng chờ duyệt sau mỗi slice.
```

---

# 17. QUYẾT ĐỊNH CÒN MỞ / BLOCKER CẦN KIỂM TRA TRƯỚC KHI CODE

| ID | Câu hỏi kỹ thuật/nghiệp vụ | Vì sao quan trọng | Cách xử lý |
|---|---|---|---|
| D-01 | Use Case Matrix thật hiện còn 44 active như V2 chứ? | Tên file/blueprint cũ ghi 45/42 | Xác minh repo current, cập nhật docs thống nhất |
| D-02 | API/SP nào hỗ trợ staff booking create/edit/cancel? | V2 chỉ render list, chưa chạy CRUD | Contract inventory + test DB; thiếu thì BLOCKED |
| D-03 | Đơn chưa trả tiền được sửa ghế/sản phẩm/promo đến mức nào? | Không được UPDATE trái trạng thái | Owner chốt rule, map sang SP |
| D-04 | “Xóa vé” có nghĩa hủy hay delete vật lý ở từng trạng thái? | Lịch sử tài chính/ticket integrity | Chỉ hiển thị action theo rule/SP thực |
| D-05 | API có khả năng search/filter/pagination tổng tập cho mỗi module? | Tránh fake filter/overfetch | Capability matrix; change request nếu cần |
| D-06 | DB lưu vị trí ghế tới mức nào? | Không dựng lối đi/tọa độ giả | Dùng row/number; thêm tọa độ cần phê duyệt riêng |
| D-07 | Một Manager quản lý đồng thời nhiều rạp? Luồng transfer thế nào? | Đúng scope khi đổi context | Xem assignment SP/UC, test multi-scope nếu hợp lệ |
| D-08 | Chế độ per-showtime seat availability có API cho Admin/Manager? | Không lấy trạng thái “sold” từ sơ đồ vật lý | Chỉ bật mode khi có dữ liệu đúng |
| D-09 | Đơn/ghế/price status codes và error mapping hiện hành là gì? | Không dịch sai lỗi/confirmation | Đọc route/service/procedure mapping |
| D-10 | UI/UX standards file nào trong repo là bản hiện hành? | RBAC fixed và 44 UC có thể lệch phiên bản | Đồng bộ docs trước migration, giữ changelog |
| D-11 | Có cần calendar lịch chiếu và quick booking hay chỉ list/CTA? | Không tự mở rộng nghiệp vụ | Ưu tiên view list/CTA từ API hiện hữu, phần khác PROPOSED |
| D-12 | Ảnh và font ngoài có tải trên staging được không? | V2 môi trường chặn mạng | Retest network-permitted, không đoán |

**STOP CONDITIONS:** nếu một screen yêu cầu field/lookup/permission/API chưa có, UI phải **dừng ở screen-spec/blocker** hoặc triển khai một phiên bản tối thiểu dùng contract hiện có nhưng **không đánh tráo hoàn thành**. Không tự thêm bảng hoặc stored procedure không được duyệt.

---

# 18. ĐIỀU KIỆN PHÊ DUYỆT KẾ HOẠCH VÀ NGHIỆM THU CUỐI

## 18.1. Phê duyệt trước khi bắt đầu UXR-2/3

- [ ] Xác nhận baseline 44 active UC và chính sách RBAC fixed trong repo.
- [ ] Xác nhận module Staff Booking và giới hạn create/edit/cancel từ API/SP.
- [ ] Chốt hierarchy `Cinema→Room→Seat`, phân biệt physical vs per-showtime availability.
- [ ] Có capability matrix cho filter/lookup của Admin và Manager.
- [ ] Screen spec có layout/table/filter/action/error/a11y/responsive cho module ưu tiên.
- [ ] Có browser baseline và test DB an toàn; không hành động phá production.
- [ ] Đồng thuận không big-bang rewrite, mỗi slice được duyệt riêng.

## 18.2. Định nghĩa hoàn tất một module UI

- [ ] 100% route/role/scope thuộc module được đối chiếu UC hiện hành.
- [ ] Bộ lọc chính chạy thật, không chỉ tồn tại trong JSX; DataTable curated và STT thay internal ID.
- [ ] Tất cả selector liên kết resource dùng nhãn người đọc được; payload vẫn là ID authoritative.
- [ ] Hành động thêm/sửa/hủy/xóa đúng permission/state/SP contract; không tạo hành động ngoài scope.
- [ ] Browser screenshots 390/768/1280/1440/1920 với cùng fixture; không tràn và điều hướng hoạt động.
- [ ] Loading/empty/error/conflict/dirty/keyboard/accessibility checks đã chạy hoặc ghi rõ blocker.
- [ ] Async guards, history/price/booking/manager scope không regression.
- [ ] Test/lint/build PASS hoặc các thất bại được ghi nhận và xử lý theo gate.
- [ ] Có slice report, PR/commit traceability, người duyệt xác nhận.

## 18.3. Điều kiện nghiệm thu toàn frontend

**Chỉ khi toàn bộ các màn hình ưu tiên và Use Case còn hiệu lực được replay end-to-end**, bao gồm đường thành công và các lỗi quan trọng trong DB test, mới được công bố frontend UX restructure hoàn tất. Khi chưa có replay, kết luận tối đa là “browser navigation/visual verified”, không phải “all 44 UC PASS”.

---

## PHỤ LỤC A — CHECKLIST NHANH CHO CHỦ DỰ ÁN

| Câu hỏi khi mở mỗi trang quản trị | Đạt nếu |
|---|---|
| Tôi có biết đang quản lý rạp/phòng/đơn nào? | Header/context rõ, không nhầm parent |
| Tôi tìm đúng 1 bản ghi trong dữ liệu lớn được không? | Search/filter hoạt động, không cần đoán ID |
| Tôi có đang nhìn thông tin phục vụ nghiệp vụ? | Tên/mã nghiệp vụ, STT, ít cột kỹ thuật |
| Ghế có đọc được như ghế thật không? | Rạp→phòng→seat map, hàng/số đúng |
| Tạo mới có gián đoạn danh sách không? | Form riêng/drawer đúng mức, không chiếm workspace vô cớ |
| Tác vụ nguy hiểm có rõ hậu quả không? | Confirm đúng đối tượng/trạng thái, server chặn sai |
| Đổi bộ lọc/rạp/case có làm mất công việc không? | Dirty guard + request ownership |
| Tôi dùng bằng bàn phím/mobile được không? | Focus, labels, responsive, scroll đúng |
| Người không đủ quyền có bypass được bằng URL/API không? | Backend/DB từ chối, không chỉ ẩn nút |

## PHỤ LỤC B — CHANGELOG

- **V3.0 — 11/10/2026:** Hợp nhất Audit V1/V2, UX Architecture & Standards, khảo sát Vista/Veezi/IBM Carbon/W3C; chuẩn hóa baseline 44 active UC theo Audit V2; tách design/reality; viết lại screen specs cho Admin/Manager/CSKH/Customer, seat-map, filters, transaction safety, work packages UXR và browser acceptance.

**ĐIỂM DỪNG:** Tài liệu này là hướng dẫn thiết kế và triển khai, không có source code, API hay DB được sửa trong lần tạo file. Bước phù hợp kế tiếp là chạy **UXR-0** bằng AI Coding, kiểm chứng code/contract thật, sau đó triển khai tuần tự các slice được chấp thuận.

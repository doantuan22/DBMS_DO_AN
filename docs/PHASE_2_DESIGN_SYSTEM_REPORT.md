# PHASE 2 — DESIGN SYSTEM & COMPONENT ARCHITECTURE

> **Quyết định RBAC cố định (11/10/2026):** 42 Use Case hoạt động: Customer 14, Manager 9, CSKH 6, Admin 13. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 45 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có. Các verdict, wireframe, route và kế hoạch 45 UC/RBAC CRUD trong báo cáo này là lịch sử trước quyết định; yêu cầu triển khai ADM-03/04/05 và partial grant bị hủy. Nghiệm thu mới không kế thừa PASS lịch sử.


**Phạm vi:** hoàn thiện tài liệu Phase 1 và xây nền tảng UI dùng chung. Không chuyển portal sang route mới, không đổi REST contract, RBAC, manager scope hoặc business logic. Không triển khai Phase 3.

## 1. Tài liệu Phase 1

- [FRONTEND_UIUX_DESIGN_STANDARDS.md](standards/FRONTEND_UIUX_DESIGN_STANDARDS.md) và [UX_ARCHITECTURE_BLUEPRINT.md](UX_ARCHITECTURE_BLUEPRINT.md) cùng dùng sáu nhóm Admin: Tổng quan; Tài khoản & phân quyền; Rạp & cơ sở vật chất; Nội dung; Kinh doanh & vận hành; Chăm sóc & báo cáo.
- Wireframe CSKH giữ ba vùng riêng: **Queue | Chi tiết + Timeline | Đơn tham chiếu + Hành động**.
- Bổ sung component contract gồm props, variants, states, responsive, accessibility và interaction.
- Đồng bộ phân kỳ: Phase 2 xây design system; Phase 3 refactor portal; Phase 4 nghiệm thu 45 Use Case.
- Mapping 45 Use Case và palette trắng–xanh chính thức được giữ nguyên.

## 2. Thay đổi source

### Tokens và CSS

`frontend/src/index.css` giờ nạp riêng `legacy.css`, `tokens.css`, `base.css`, `shell.css` và `components.css`. CSS legacy được giữ để hạn chế tác động ngoài phạm vi.

Tokens màu dùng đúng giá trị chính thức: `#2563EB`, `#1D4ED8`, `#1E40AF`, `#F8FAFC`, `#FFFFFF`, `#EFF6FF`, `#0F172A`, `#475569`, `#CBD5E1`. Có thêm token typography, spacing nhịp 4px, radius, shadow, motion và semantic status. Các hero/seat map legacy có override sáng để không còn dark surface làm chủ đạo.

### Shell và route compatibility

- `PublicShell` bổ sung menu responsive và giữ phần header/footer, class và links hiện tại. `AreaLayout` tiếp tục là wrapper tương thích.
- `StaffShell` có header, sidebar nhóm và mobile drawer. Admin dùng đúng sáu nhóm; Manager và CSKH dùng navigation phù hợp section đang có.
- Route `/admin`, `/manager`, `/support` vẫn nằm dưới các `RequireRole` cũ. Admin sidebar điều khiển section hiện có; chưa đổi URL/deep link. Manager và Support chỉ có thêm anchor IDs để navigation trong trang hoạt động.
- `StaffShellContext` là adapter cho state chọn section Admin hiện tại; không thay API, permission guard hoặc request-generation guard.

### Shared component API

Các component nằm ở `frontend/src/components/ui/`. Chúng nhận dữ liệu và callback từ caller, không gọi API hoặc giữ business logic theo role.

| Component | API và trạng thái | Responsive / accessibility / interaction |
|---|---|---|
| `Button` | `variant=primary/secondary/tertiary/danger/quiet`, `size=sm/md/lg`, `loading`, `disabled`, native button props; `type=button` mặc định | Kích thước chạm tối thiểu 44px; native button; loading khóa click/submit lặp và đặt `aria-busy` |
| `Input` | Native input props, `size`, `invalid`, forwarded ref | Full-width trong field; default/focus/disabled/invalid; focus nhìn thấy và hỗ trợ native keyboard |
| `Select` | Native select props, `size`, `invalid`, options và forwarded ref | Full-width; giữ hành vi native keyboard/touch |
| `FormField` | `id`, `label`, `required`, `hint`, `error`, một control con | Label gắn bằng `htmlFor`; hint/error qua `aria-describedby`; lỗi được announce |
| `Dialog` | `open`, `onOpenChange`, `title`, `description`, `size=sm/md/lg`, `children`, `footer`, `closeLabel`, `busy` | Native `<dialog>`; nội dung cuộn trong modal, gần full-width trên mobile; Escape/backdrop đóng khi không bận; native focus entry/return |
| `ConfirmDialog` | Dialog props + `confirmLabel`, `cancelLabel`, `variant`, `busy`, `onConfirm` | Hai action phân biệt; khóa duplicate khi chờ; lỗi callback hiển thị trong dialog; không gọi API |
| `PageHeader` | `title`, `description`, `breadcrumbs`, `actions` | Action wrap/stack trên màn hình hẹp; tạo một H1 |
| `Breadcrumbs` | `items: [{label, to?}]`; item cuối là hiện tại | Ordered list, landmark có nhãn, `aria-current="page"`; link dùng được bằng keyboard |
| `DataTable` | `columns`, `rows`, `getRowKey`, `caption`, `status`, `emptyMessage`, `error`, `onRetry`, `label`, `className` | Semantic table trong vùng cuộn có nhãn; caption và `scope=col`; không thêm giả pagination/sort |
| `FilterBar` | `onSubmit`, `onReset`, `actions`, `children`, `label`, `className` | Form có accessible name; Enter submit; fields/action wrap; state thuộc caller |
| `StatusBadge` | `status`, `className`; dùng mapping status hiện hữu | Luôn hiện chữ trạng thái; giữ cùng semantic mapping |
| `AsyncState` | `status=idle/loading/success/empty/error`, `children`, `loadingMessage`, `emptyMessage`, `error`, `errorMessage`, `onRetry` | Loading dùng status announcement, lỗi dùng alert, retry có tên; lỗi không bị chuyển thành empty |

## 3. Kết quả kiểm tra

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| `npm.cmd test` | **65/65 PASS** | Gồm route/role guards, Admin, CSKH, booking state, pricing, cinema images và các hồi quy hiện có |
| `npm.cmd run lint` | **PASS** | Không còn cảnh báo Oxlint |
| `npm.cmd run build` | **PASS** | Vite build hoàn tất; bundle JS 552.68 kB vượt ngưỡng cảnh báo 500 kB, chưa tách chunk trong phạm vi Phase 2 |
| Palette contrast | **PASS cho các cặp đã tính** | Primary/hover/dark với trắng: 5.17/6.70/8.72:1; text-secondary với trắng: 7.58:1; semantic text trên semantic surface: 5.21–6.84:1 |
| Border token | **Không dùng làm focus/control cue đơn lẻ** | `#CBD5E1` trên trắng là 1.48:1; control dùng viền đậm hơn và focus dùng primary blue |
| Responsive browser | **Một phần đã đo** | Edge headless tạo bitmap 390px nhưng báo CSS viewport 477px. Probe trong iframe CSS-width 390 xác nhận app viewport 390, document client/scroll width 375/375, menu hiện và nav đóng ban đầu; mở menu đổi nav sang `display:flex`. Đây không thay thế screenshot/browser acceptance ở cả năm CSS viewport. |
| Keyboard / focus / WCAG 2.2 AA toàn UI | **Chưa nghiệm thu** | Source có Escape handler/focus return và focus-visible rules; kiểm tra browser đầy đủ từng control/role chưa hoàn thành |
| Before/after screenshots | **Chưa đủ evidence** | Có ảnh after theo kích thước bitmap bên dưới. Edge GPU renderer từ chối các lần chụp baseline tiếp theo, nên chưa có cặp trước/sau đáng tin cậy |
| API-backed browser smoke | **Bị giới hạn** | Backend không chạy tại `localhost:4000`; browser preview hiển thị error state thật cho movies/health. Không có phiên đăng nhập thật để smoke StaffShell qua RBAC trong browser. Test suite hiện có vẫn pass. |

### Screenshot after

Các tệp là ảnh chụp Edge của public home; kích thước trong tên là bitmap đầu ra. Lưu ý giới hạn CSS viewport 390px nêu trong bảng trên.

- [390 × 844](phase2-evidence/public-final-390x844.png)
- [768 × 1024](phase2-evidence/public-final-768x1024.png)
- [1280 × 900](phase2-evidence/public-final-1280x900.png)
- [1440 × 1000](phase2-evidence/public-final-1440x1000.png)
- [1920 × 1080](phase2-evidence/public-final-1920x1080.png)

Không đánh dấu browser responsive, keyboard/focus, screenshot comparison hoặc nghiệm thu 45 Use Case là PASS khi evidence chưa đủ.

## 4. Regression risk và giới hạn

- Token/base override được nạp trước shell/components nhưng sau legacy stylesheet; catalog, auth và booking vẫn dùng nhiều class legacy. Phase 3 cần regression theo từng portal, đặc biệt booking seat states và auth focus.
- Staff routes giữ guard hiện tại; sidebar Admin chưa route-backed và không giữ section khi refresh. Việc chuyển deep links thuộc Phase 3.
- Không smoke nghiệp vụ bằng dữ liệu giả; API/role thật cần môi trường tích hợp để kiểm tra Admin, Manager và CSKH trong browser.
- Viền `#CBD5E1` không đạt 3:1 trên trắng; không dùng riêng cho control/focus boundary. Palette text/action đã đo đạt AA ở các cặp nêu trên, nhưng chưa thay thế kiểm tra toàn trang.

## 5. Checklist trước Phase 3

- [x] Hai tài liệu Phase 1 đồng bộ; 6 nhóm Admin và CSKH 3 vùng.
- [x] Token/base/shell/components tách file; route legacy còn nguyên.
- [x] PublicShell, StaffShell và shared UI primitives được build.
- [x] Test suite và lint pass; production build hoàn tất.
- [ ] Chạy browser acceptance đúng CSS viewport 390/768/1280/1440/1920 và lưu screenshot baseline/after.
- [ ] Kiểm tra keyboard, focus return, contrast và screen reader trong browser.
- [ ] Smoke các Staff route bằng phiên role thật và backend khả dụng.
- [ ] Duyệt báo cáo này trước khi bắt đầu Phase 3.

**Kết luận Phase 2:** nền tảng source và component architecture đã được triển khai. Phần nghiệm thu browser còn mở; chưa bắt đầu Phase 3.

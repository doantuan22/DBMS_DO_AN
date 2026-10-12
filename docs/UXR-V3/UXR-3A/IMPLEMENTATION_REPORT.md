# UXR-3A — Admin Rooms UI/UX Redesign

Ngày nghiệm thu source: 12/10/2026, Asia/Bangkok. Branch `tuan`, HEAD `6f1446f6abe7d8203803a5380ff74b5601ca2c3e`; chưa tạo commit. Phạm vi: ADM-08 / Admin Rooms theo Blueprint V3 §4, §5.6, §10–12. UC reference: [USE_CASE_MATRIX_45.md](../../USE_CASE_MATRIX_45.md).

**Kết quả: source và automated checks PASS; Exit Gate nghiệm thu browser/E2E BLOCKED.** Không tuyên bố UXR-3 hoặc 44 UC đã nghiệm thu. Dừng tại UXR-3A, chờ nghiệm thu; không triển khai UXR-3B/C/D hoặc redesign Manager.

## Giao diện đã triển khai

Trước: AdminPortal generic đặt form dài và input mã rạp trên đầu, tự sinh cột từ DTO, tải phòng toàn hệ thống. Sau: route Rooms có owner riêng; PageHeader → bộ lọc theo tên rạp → danh sách phòng → pagination. Form thêm/sửa mở drawer bên phải, không chiếm vùng danh sách. Bảng có STT, tên phòng/rạp, loại, số ghế thực, trạng thái và actions. ID chỉ dùng làm key/context/payload. Nút xanh “Xem sơ đồ ghế” nổi bật; Sửa riêng và Xóa nằm trong disclosure “Khác”, có confirm tên/rạp/trạng thái và hậu quả.

Sử dụng PageHeader, FilterBar, ResourceSelect, ResourceTable, Dialog, ConfirmDialog, FormField, Input, Select, Button, StatusBadge và AsyncState từ UXR-2A; dùng dirty navigation guard hiện có. CSS chỉ áp dụng Rooms/drawer Rooms, giữ tokens trắng–xanh, không sửa primitives/StaffShell hoặc screens Manager trong slice này.

Cinema change xóa rows cũ ngay, dùng generation và cinema identity để bỏ late responses A→B→A; dispose route cũng vô hiệu reads. Filter local trên **toàn bộ** Rooms của rạp rồi mới phân trang; `TongSoGhe` dùng count từ SP, missing count không giả thành 0. Form giữ baseline/draft khi lỗi, hỏi trước khi bỏ draft, khóa writes đồng bộ để chống double-submit và chuyển context khi pending. History query cùng rạp giữ draft; đổi rạp/rời route phải xác nhận. Không auto-retry mutation hoặc optimistic delete.

Xóa phòng có SUATCHIEU được SP chuyển Ngưng hoạt động; UI hiển thị Message authoritative rồi refetch, không tự loại row lịch sử. 403/404/409/read error được phân biệt với empty; lỗi write giữ form/confirmation và lý do tương ứng.

## Route mapping

| Route | Owner / context |
|---|---|
| `/admin/facilities/rooms` | Existing RequireRole/StaffShell/AdminSectionRoute → AdminRooms, cần ADMIN + QL_PHONG |
| `/admin/facilities/rooms?cinemaId=…&q=…&type=…&status=…&page=…&pageSize=…` | URL giữ selected cinema/applied filters/presentation page; reload/history parse cùng contract |
| `/admin/facilities/seats?cinemaId=…&roomId=…` | Bridge xác minh room thuộc cinema bằng Rooms API, rồi renderer ghế **hiện có** với scoped GET seats(roomId), tên context và room create read-only; cần QL_GHE + QL_PHONG cho bridge |
| `/admin/facilities/seats` | Giữ flow ghế cũ không context; không thêm seat-map trong 3A |
| `/admin`, các Admin sections khác, `/admin/bookings`, mọi Manager routes | Giữ mapping UXR-2B/C; không đổi routes/index trong 3A |

## File thay đổi trong slice này

Working tree đã có UXR-1/2 chưa commit. Danh sách dưới là thay đổi so với **baseline đầu 3A**, không phải toàn bộ `git diff HEAD`:

| File | Thay đổi |
|---|---|
| [AdminRooms.jsx](../../../frontend/src/features/admin-rooms/AdminRooms.jsx) | Mới: screen composition, table/actions, drawer và shared confirmations |
| [roomsController.js](../../../frontend/src/features/admin-rooms/roomsController.js) | Mới: scope/requests/filter/page/draft/write ownership |
| [roomsModel.js](../../../frontend/src/features/admin-rooms/roomsModel.js) | Mới: query, local complete-data view, validation/payload, seat handoff/error adapters |
| [admin-rooms.css](../../../frontend/src/features/admin-rooms/admin-rooms.css) | Mới: feature styling, responsive stacked rows và drawer |
| [AdminSectionRoute.jsx](../../../frontend/src/routes/AdminSectionRoute.jsx) | Sửa file từ UXR-2B: đổi owner Rooms và nối seat context bridge, giữ guards |
| [AdminSeatContextRoute.jsx](../../../frontend/src/routes/AdminSeatContextRoute.jsx) | Mới: xác minh paired cinema/room trước màn ghế cũ |
| [AdminPortal.jsx](../../../frontend/src/pages/AdminPortal.jsx) | Bridge tối thiểu: optional seatContext, scoped loader/draft cache, tên room và create binding; giữ các thay đổi UXR-2B sẵn có |
| [adminRooms.test.js](../../../frontend/tests/adminRooms.test.js) | Mới: 21 tests controller/route SSR/contracts/regression |
| `docs/UXR-V3/UXR-3A/` | Audit, screen spec, báo cáo/checklist, logs và browser evidence độc lập |

Baseline copies tại `.audit-output/uxr3a-baseline/`; không reset/checkout HEAD, không tạo dữ liệu ứng dụng. Không sửa Backend, Database, SP, API client/contracts, shared enums hay RBAC. Kiểm tra `git diff --stat -- backend database shared` không có thay đổi. Chỉ chạy backend tests đã đọc và dùng mocked executor, không execute live SP/DB.

## Automated evidence

| Check | Command / evidence | Verdict |
|---|---|---|
| Frontend toàn bộ, gồm regression UXR-1/2 | `cd frontend; npm.cmd test` — [log](frontend-tests.log): **123/123**, không fail/skip | **PASS** |
| Rooms mới | 21 tests trong adminRooms.test.js, được chạy trong suite trên | **PASS — automated** |
| Lint | `cd frontend; npm.cmd run lint` — [log](frontend-lint.log), exit 0 | **PASS** |
| Production build | `npm.cmd run build -- --outDir ../.audit-output/uxr3a-production-final-20261012` — [log](frontend-build.log), exit 0; 129 modules | **PASS** |
| Build output mặc định | `npm.cmd run build` — [log](frontend-build-default.log): EPERM khi Vite dọn `frontend/dist/assets` | **BLOCKED — output directory**, đã build thành công ở folder riêng |
| Existing service/SQL error contracts, mocked | `cd backend; node --test --test-concurrency=1 tests/roomDelete.test.js tests/adminService.test.js` — [log](service-contract-tests.log): **25/25** | **PASS — mocked**, không DB integration |

Production artifact: `.audit-output/uxr3a-production-final-20261012/` (ignored local artifact). Build cảnh báo bundle JS >500kB và outDir ngoài frontend không được dọn tự động; không thay đổi chunking trong Rooms slice. Các dòng PowerShell NativeCommandError trong log build riêng xuất hiện do warning stderr; tiến trình Vite đã exit 0 và tạo assets thành công.

Tests mới bao gồm: authorized lookup fallback, cinema-first/empty cinema; role/QL_PHONG denial; complete-data filters/pagination/name normalization; query reload/history/invalid cinema; A→B→A/route disposal/wrong-scope payload; Cancel/Confirm dirty; payload numeric ID và immutable cinema; validation; double-submit; read/write 403/404/409; delete cancel/physical delete/deactivate history/conflict; paired seat destination; actual route SSR/table allowlist/named drawer/scoped seat form; same-cinema history dirty guard và pending lock. Fixtures chỉ tồn tại trong tests. SSR và controller tests **không** chứng minh browser interactions hoặc live DB outcomes.

## Exit Gate

| Tiêu chí | Verdict / giới hạn |
|---|---|
| Audit/capability classification/screen contract | **PASS — SOURCE VERIFIED**, xem [audit](AUDIT_CAPABILITIES.md), [spec](SCREEN_SPEC.md) |
| List-first Rooms, scoped filters, drawer, curated table, real count | **PASS — SOURCE + automated SSR/controller**; visual acceptance **NOT VERIFIED** |
| Role/scope/stale/drafts/history regression | **PASS — automated**, live UI→API→DB **NOT VERIFIED** |
| Browser renderer trước/sau | **BLOCKED**, Edge và Chrome đều fatal GPU 0xC0000022; [evidence](BROWSER_EVIDENCE.md) |
| 390/768/1280/1440/1920px, keyboard/focus, StaffShell mobile drawer, screenshots | **NOT VERIFIED**, bị chặn bởi renderer; CSS/ARIA source không thay nghiệm thu |
| Live CRUD, count so DB, conflict/permission/history hậu quả trên test DB | **NOT VERIFIED**, chưa có browser session chạy được; không thực hiện writes trên DB |
| Tổng nghiệm thu UXR-3A | **BLOCKED**, còn browser/E2E checklist; không tự đánh dấu PASS |

Giới hạn contract: Admin chỉ có QL_PHONG không có QL_RAP dùng tên rạp từ authorized full Rooms, nên không thấy rạp chưa có phòng. Lookup rạp trống cho actor đó **NEEDS APPROVAL/BLOCKED** ngoài frontend slice. Server search/page, chuyển rạp của room, new seat-map đều không triển khai. Xem [checklist nghiệm thu còn lại](MANUAL_ACCEPTANCE_CHECKLIST.md). Blockers UXR-2A/B/C giữ nguyên và tách riêng.

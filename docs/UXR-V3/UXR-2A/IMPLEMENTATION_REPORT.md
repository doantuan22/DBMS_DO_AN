# UXR-V3 — UXR-2A Shared Component Foundation

## Kết luận

**Exit Gate: BLOCKED.** Component source, regression tests, lint và isolated production build hoàn tất. Browser preflight không tạo được renderer do Chrome GPU process fatal, vì vậy keyboard/focus và screenshot responsive thực tế chưa được xác minh. Không bắt đầu UXR-2B/2C.

## Audit trước khi code

- Giữ lại `PageHeader`, `FilterBar`, `DataTable`, `ConfirmDialog`, `AsyncState` và `NamedResourceSelect`; đây đã là các component đang được dùng bởi booking, Support và Manager.
- Chuẩn hóa `DataTable` thành implementation của `ResourceTable`, giữ export `DataTable` để tránh sửa hàng loạt import.
- Chuẩn hóa `NamedResourceSelect` qua `ResourceSelect`, giữ markup/contract UXR-1D và đặt reset search theo `scopeKey` ở ranh giới component.
- Giữ CSS token trắng–xanh trong `tokens.css`. Chuyển style selector từ `legacy.css` sang lớp shared `components.css`, tiếp tục dùng token hiện có.
- Không thêm dependency. Không sửa API, backend, DB, routes, RBAC hoặc nghiệp vụ.

## Component contracts sau thay đổi

| Component | Props / events | State owner | Responsive / accessibility / error handling |
|---|---|---|---|
| `PageHeader` | `title`, `description`, `breadcrumbs`, `primaryAction`; `actions` vẫn là alias tương thích | Feature sở hữu action và dữ liệu heading | Breadcrumb nav có nhãn; action wrap ở mobile; node action giữ disabled state do feature đặt. |
| `FilterBar` | `schema`, `draft`, `applied`, `onApply(draft,event)`, `onReset(event)`, `pending`, `error`, `children`, `actions` | Feature sở hữu cả draft/applied và API | Không tự fetch; chip chỉ render trường trong schema có giá trị applied; báo dirty draft qua status, error qua alert; control/actions wrap trên màn nhỏ. |
| `ResourceTable` (`DataTable` alias) | `columns` allowlist `{key,label,render?,align?,className?}`, `rows`, `rowKey`/`getRowKey`, `status`, `error`, `onRetry`, `pagination {page,pageSize,total,onPageChange}` | Feature sở hữu rows, fetch, sort và page; component sở hữu presentation | Caption, `thead/th scope=col`, scroll region có keyboard focus; cột `STT` tính theo page/pageSize; ID chỉ xuất hiện nếu feature đưa vào column schema; empty/loading/error/forbidden/notFound/conflict; pagination gọi page thực do API cung cấp. |
| `ResourceSelect` | `label`, `options {id,label,meta}`, `value`, `scopeKey`, `onChange(id)`, `lookupStatus`, `lookupError`, `onRetry`, `fallbackOption`, `disabled`, `readOnly`, `required` | Feature sở hữu lookup, scope authorization, abort/generation guard và selected ID; component sở hữu search text | Chọn tên, gửi ID hiện hành dạng string; đổi `scopeKey` remount/reset search; label, search native, keyboard select, empty/no-match/loading/error/retry và invalid state. Request stale vẫn do feature guard như UXR-1D. |
| `ConfirmDialog` | `open`, `onOpenChange`, `title`, `description`/`body`, `entityLabel`, `variant`/`dangerLevel`, `busy`, `onConfirm` | Feature sở hữu open và mutation; component sở hữu pending/error local | Native modal dialog; focus vào Cancel, Escape/Cancel bị chặn khi busy, browser focus trap/restore qua dialog lifecycle, synchronous ref guard chống double-submit; mutation error hiện trong alert. |
| `AsyncState` | `status`, `children`, message props, `error`, `onRetry` | Feature sở hữu status và retry | `idle/loading/success/empty/error/forbidden/notFound/conflict`; 401/403, 404, 409 được phân loại; status/alert semantics; không hiển thị empty thay lỗi. |

## Thay đổi source

- Thêm API export `ResourceTable` và `ResourceSelect`, duy trì tên cũ.
- Bổ sung phân trang có kiểm tra contract `{page,pageSize,total,onPageChange}` và đánh số STT liên tục qua trang.
- Tích hợp pagination của bảng vào `StaffBookings`; bỏ nav phân trang riêng và bỏ cột `DonDatVeID` khỏi bảng, giữ ID nội bộ làm row key/API input. Accessible action label dùng tên khách và phim.
- Thêm chip theo applied schema, trạng thái draft chưa áp dụng, pending/error cho `FilterBar`; không có schema thì không sinh filter chip.
- `AsyncState` phân biệt lỗi quyền, không tìm thấy, xung đột; không cho conflict kích hoạt retry tự động.
- `ConfirmDialog` bổ sung entity context, aliases theo contract, focus ban đầu vào Cancel và ref lock đồng bộ cho submit.
- `ResourceSelect` tái dùng markup/ID serialization của UXR-1D; search reset khi thay scope. Manager truyền scope cinema vào selector; API fetch và stale guard tiếp tục thuộc Manager feature.

## Test results

| Kiểm tra | Kết quả |
|---|---|
| Frontend tests, bao gồm UXR-1C/1D/support/booking regressions | **PASS — 84/84** sau thay đổi cuối. |
| Component contracts | **PASS** — SSR tests cho 6 component, trạng thái, STT/schema, pagination, lookup errors và modal semantics. |
| Lint | **PASS** — chạy lại sau khi loại bỏ hai warning phát sinh. |
| Production build | **PASS** — isolated output được tạo trong thư mục tạm; Vite vẫn cảnh báo bundle JS trên 500 kB (591.35 kB), không phải lỗi build. |
| Browser preflight | **BLOCKED** — Chrome GPU process fatal; CDP renderer không khởi tạo. Bằng chứng: [BROWSER_EVIDENCE.md](BROWSER_EVIDENCE.md), [browser-preflight.json](browser-preflight.json), [startup log](chrome-browser-startup.log). |
| Browser keyboard/focus, responsive 390/768/1280/1440/1920, screenshots | **NOT VERIFIED / BLOCKED** — runner sẵn sàng nhưng không thể chạy nếu preflight chưa PASS. |
| axe / screen reader | **NOT VERIFIED** — chưa có runtime browser/axe. |

## Regression và rủi ro còn lại

- Tests hiện có tiếp tục PASS cho Support draft persistence, SupportPortal, staff booking, Manager named selector ID payload và Manager selector states. UXR-1D browser evidence trước đó vẫn là evidence của slice trước; lần chạy này không thể xác minh giao diện sau alias import mới.
- Không sửa CSKH draft store/guards, StaffShell focus logic hay Manager API race/scope guard. Selector component remount chỉ reset local search theo `scopeKey`; không tự thay scope/value hoặc request.
- Browser-native focus trap/restore cần được xác nhận trên browser capable host. Browser screenshot/overflow chưa thể được khẳng định PASS.
- `ResourceTable` dùng columns làm allowlist; feature vẫn phải quyết định cột nghiệp vụ. Bảng không tự bung các thuộc tính row.
- Build bundle vẫn vượt cảnh báo 500 kB hiện có; chia chunk không thuộc slice này.

## File đã sửa / thêm

- Shared UI: `PageHeader.jsx`, `FilterBar.jsx`, `DataTable.jsx`, `ResourceTable.jsx`, `ResourceSelect.jsx`, `ConfirmDialog.jsx`, `Dialog.jsx`, `AsyncState.jsx`, `ui/index.js`.
- Manager reuse: `ManagerResourceForm.jsx`, `ManagerPortal.jsx`, `NamedResourceSelect.jsx`.
- Booking integration: `StaffBookings.jsx`.
- Styles: `components.css`, `legacy.css`.
- Tests/fixture: `frontend/tests/ui-components.test.js`, `uxr2a-components.html`, `uxr2a-components.jsx`.
- Evidence/runner: `BROWSER_EVIDENCE.md`, `run-browser-acceptance.mjs`, `screenshots/README.md`, startup logs.

**Điểm dừng:** hoàn tất UXR-2A source/test work; chờ nghiệm thu và browser preflight PASS trước khi đóng Exit Gate. Không triển khai UXR-2B/2C.

**Cập nhật nghiệm thu cuối:** Browser blocker và kết quả cuối được ghi tại [UXR-2A_FINAL_REPORT.md](UXR-2A_FINAL_REPORT.md); Exit Gate hiện vẫn **BLOCKED** do Chrome/Edge renderer GPU fatal.

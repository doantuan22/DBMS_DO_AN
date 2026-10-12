# UXR-3A — Screen specification và component contracts

Contract đã chốt trước implementation theo yêu cầu được giao: list-first Rooms, drawer cho create/edit, giữ API/SP/RBAC và renderer seats hiện có. Không cần thêm library hoặc primitive.

## Bố cục và nội dung

`PageHeader` (breadcrumb Quản trị → Phòng chiếu, description, một CTA Thêm phòng) → panel Bộ lọc → panel Danh sách phòng + số kết quả → ResourceTable + pagination. Không form CRUD phía trên list. White/blue tokens hiện có; khoảng cách 24px giữa panels, panel nền trắng/border nhẹ, heading rõ, actions dễ phân biệt.

Bộ lọc: ResourceSelect “Rạp chiếu” theo tên, áp dụng scope ngay khi chọn; tìm “Tên / số phòng” trên TenPhong; Loại phòng từ dataset thật; Trạng thái theo contract. Search/type/status có draft → Áp dụng; Xóa lọc giữ rạp. Filter không bỏ draft edit thuộc cùng rạp. URL chỉ lưu cinemaId/q/type/status/page/pageSize; không nội dung form hoặc PII. Khi chưa chọn rạp, hiển thị hướng dẫn chọn, không fetch rooms toàn hệ ngoại trừ authorized lookup fallback thiếu QL_RAP.

Bảng allowlist: STT, Tên phòng (tên thật và icon thuần presentation), Rạp, Loại phòng, Số ghế, Trạng thái, Thao tác. STT sau lọc và pagination; missing TongSoGhe hiển thị “Chưa có dữ liệu”, không bịa 0. “Xem sơ đồ ghế” là action xanh nổi bật nếu QL_GHE, “Sửa” secondary, “Xóa phòng” danger trong disclosure “Khác” riêng. Confirm xóa nêu tên/rạp/trạng thái hiện tại. Không cột ID, không row-primary-key làm số phòng.

Drawer phải mở qua Thêm phòng hoặc Sửa; rạp hiện tại hiển thị tên read-only, không chuyển rạp trong update. Fields name/type; edit thêm status dropdown. Type dropdown từ ROOM_TYPES shared (2D/3D/IMAX/4DX/ScreenX), đồng bộ REST validator. Create type default 2D/status Hoạt động theo SP. Seat count không chỉnh trong form. Required/name length + type/status validation có field errors và summary; giữ values khi API fail. Confirm xóa dùng shared ConfirmDialog, nêu tên phòng/rạp và outcome xóa/ngưng hoạt động theo lịch sử.

## Ownership và events

| Component | Inputs / events | Owner và safety |
|---|---|---|
| AdminRooms route | user, search params | RequireRole + existing AdminSectionRoute QL_PHONG; keyed actor/permissions |
| Rooms controller | existing adminApi, user, initial query, onQueryChange | owns complete scoped rows, lookup, filters/page, editor/draft, confirmations, write lock, generations; observable snapshot for UI/tests |
| Rooms view | snapshot, controller events | compose shared components; no fetch/SQL/business authority |
| Room editor | editor values/baseline/errors, cinema label, onChange/onSave/onClose | shared Dialog `size=room-drawer`, focus name field, native modal trap/restore; closes/switches only after dirty confirm |
| ResourceTable | explicit columns, filtered page rows, rowKey=PhongID, pagination total | shared UXR-2A; presentation pagination on complete response |
| Existing seats context bridge | cinemaId + roomId query | validate room in Rooms(cinemaId), pass existing AdminPortal scoped room; no seat-map redesign |

## State và transitions

Cinema change invalidates read generation **synchronously**, clears old rows before new fetch, resets dependent filters/page/editor after dirty Confirm. Cancel retains old context/draft. A→B→A uses generation plus cinema identity; route disposal invalidates reads. Lookup error remains error, invalid deep link 404; no fallback to another cinema silently. Writes serialize with synchronous lock; only mutate selected row that belongs to current complete scope. No optimistic delete/history inference. Authoritative success closes editor/confirmation, then refresh current scope. Errors retain draft/rows, classify 403/404/409 and display operation-specific reason.

Room editor dirty guard covers close/Escape/backdrop/cinema switch and leaving route/reload; pending blocks user departure. Filter/page changes in same cinema retain draft. Global permission enforcement remains server/DB; UI does not grant scope.

## Responsive / accessibility

390/768px: StaffShell drawer retained; filters one/two-column, CTA wraps, table uses stacked rows with visible field labels and complete actions, drawer fills viewport. ≥1280: full table, filters grid, bounded drawer at right. 1440/1920: list can use main width, editor remains readable ≤480px. No hidden high-priority action or unreadable seven-column table on mobile. Native inputs/selects, keyboard table scroll, dialog Cancel/close, aria errors/live statuses and focus return require browser verification. Verify all five widths and screenshots against identical fixtures when renderer available.

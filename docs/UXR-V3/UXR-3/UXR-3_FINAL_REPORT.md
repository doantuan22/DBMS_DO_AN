# UXR-3 — Final report / Exit Gate

Ngày 12/10/2026. Đã triển khai UXR-3B/C/D theo Blueprint V3; giữ UXR-3A. **Exit Gate tổng thể: BLOCKED** do browser renderer, thiếu bằng chứng seat-map Admin và Manager trên browser thật. Source và automated/SP/HTTP integration hoàn thành; không tuyên bố UI/browser acceptance PASS.

## Kết quả từng phần

| Phần | Source / automated | Browser / exit |
|---|---|---|
| 3A Admin Rooms | PRESERVED; current frontend regression PASS, paired seat owner tương thích | Historical blocker giữ nguyên; current browser NOT VERIFIED |
| 3B Admin Seats | IMPLEMENTED: default actual row map, inspector, filters, list fallback, named drawer, read-only actual showtime mode; tests PASS | BLOCKED / NOT VERIFIED |
| 3C Manager Rooms/Seats | IMPLEMENTED: list-first rooms, real count, drawer/seat link, shared map, persistent scope/hidden draft/epoch/write guards; tests PASS | BLOCKED / NOT VERIFIED |
| 3D Cinema/Images | IMPLEMENTED: list/detail/related links, optional complete room counts, gallery/preview/cover/order/status, scoped ownership; tests PASS | BLOCKED / NOT VERIFIED |

Giao diện được thay đổi thực trong source: form dài chuyển vào drawer, ghế lấy map làm vùng chính, gallery lấy ảnh/metadata làm vùng chính, tài nguyên dùng tên/STT và column allowlist. Chưa có visual before/after acceptance. Route mapping, file changes và component/state contracts trong [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md), [SCREEN_SPEC.md](./SCREEN_SPEC.md).

## Bằng chứng hiện tại

- **PASS:** 152 frontend tests, gồm 29 facilities tests mới và existing regression; 30 focused backend contract tests.
- **PASS:** lint và Vite production build (output mới `.audit-output/uxr3-production-20261012-verified`; bundle warning được ghi nhận).
- **PASS:** 13 grouped SP assertions trên isolated DB ID 9, existing SP CRUD/scope/count/history/deactivation/gallery; rollback và transaction count zero.
- **PASS:** 42 actual HTTP requests kèm response/body/DB assertions qua middleware/services/SP thật trên DB cô lập: valid CRUD, assignment/foreign role 403, missing/wrong owner 404, history/dependencies 409. Cleanup đúng IDs/prefix fixture, zero remaining.
- **PASS:** snapshot hash AdminPortal/ManagerPortal/ManagerLayout không đổi; không sửa Backend/API services/DB/SP/RBAC hoặc Shared contract; không thêm dependency.
- **BLOCKED:** Edge/Chrome GUI GPU renderer exit -1073741790, steps=[]; không vào app.
- **NOT VERIFIED:** six-route browser smoke, reload/back/forward thực, active navigation, keyboard/focus/mobile drawer/axe/touch, responsive năm widths, console/network application, screenshots before/after, held/sold occupancy UI và live multi-assignment actor flow.

Chi tiết/count/commands/failed harness corrections: [TEST_EVIDENCE.md](./TEST_EVIDENCE.md). Current logs là evidence mới; không dùng Phase 9 hoặc historical PASS thay regression này.

## Contract limitations

Seat grid chỉ dùng hàng/số; không có tọa độ, aisle, pairing geometry hoặc stage. Thiếu/trùng vị trí thì map của dataset đó BLOCKED và list fallback. Không có per-seat history flag để disable dự đoán; SP quyết định 409. Showtime occupancy conditional theo quyền và bookable endpoint, read-only. Empty cinema named lookup bị hạn chế nếu actor chỉ có QL_PHONG; cinema count unknown khi thiếu quyền/read lỗi.

Gallery dùng URL/path storage cũ, không upload/image-kind/bulk drag-drop. Cinema Showtimes link là existing full list, không scope theo cinema query. Không thêm các chức năng cần thay Backend/DB/RBAC hay mở rộng UXR-4; xem [API_UI_CAPABILITY_MATRIX.md](./API_UI_CAPABILITY_MATRIX.md).

DB test hiện có các Manager khác nhau phụ trách rạp 1/2, chưa có một actor multi-assignment; controller/store A→B→A PASS không thay live multi-assignment acceptance. Không tự tạo quyền/assignment để vượt giới hạn dữ liệu test.

## Historical gates và bước nghiệm thu còn lại

UXR-2A/B/C/3A reports/logs giữ riêng, không đóng browser blockers. Current GUI evidence ở [BROWSER_EVIDENCE.md](./BROWSER_EVIDENCE.md); [screenshots/README.md](./screenshots/README.md) xác nhận không có screenshot. Khi browser hoạt động, chạy [MANUAL_ACCEPTANCE_CHECKLIST.md](./MANUAL_ACCEPTANCE_CHECKLIST.md), bổ sung ảnh/trace thực rồi đánh giá Exit Gate lại.

Đã dừng ở UXR-3 và chờ nghiệm thu. **Không triển khai UXR-4.**

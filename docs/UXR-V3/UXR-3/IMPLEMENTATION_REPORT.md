# UXR-3B/C/D — Implementation report

Ngày: 12/10/2026. Đã triển khai source trong một đợt UXR-3 còn lại. UXR-3A giữ nguyên; chưa triển khai UXR-4. **Source/automated integration: PASS; browser acceptance: BLOCKED; Exit Gate tổng thể: BLOCKED.**

## Route và thay đổi giao diện

| Route | Ownership hiện tại | Thay đổi |
|---|---|---|
| `/admin/facilities/seats` | AdminSectionRoute → AdminSeatContextRoute → FacilityScreen | Chọn rạp/phòng bằng tên, sơ đồ hàng ghế thật mặc định, inspector, lọc, zoom, danh sách fallback, CRUD trong drawer |
| `/manager/rooms` | ManagerSectionRoute → FacilityScreen | Cinema context hiện hành, danh sách phòng trước, số ghế từ SP, tìm/lọc/phân trang, drawer CRUD, nút Xem sơ đồ ghế |
| `/manager/seats` | ManagerSectionRoute → FacilityScreen | Dùng chung SeatLayout/SeatInspector; chỉ phòng thuộc rạp hiện hành đã xác minh assignment |
| `/admin/cinemas` | AdminSectionRoute → FacilityScreen | Danh sách rạp, bộ lọc dữ liệu thật, detail panel và liên kết tài nguyên, drawer tạo/sửa |
| `/admin/cinemas/images` | AdminSectionRoute → CinemaImageManager → FacilityScreen | Gallery thumbnail, preview, caption, cover, thứ tự, trạng thái, drawer chỉnh URL/metadata; giữ component entry hiện có |
| `/admin/facilities/rooms` | Owner UXR-3A hiện có | Không làm lại UI; liên kết cinema/room vào owner ghế mới, regression tự động PASS |

Các mapping, legacy redirects và StaffShell đã có từ UXR-2 được giữ. Không rewrite AdminPortal/ManagerPortal. Breadcrumb dùng PageHeader; active sidebar tiếp tục do routing UXR-2 quyết định. Thay đổi presentation đã có trong source; đánh giá chất lượng hình ảnh trên browser còn NOT VERIFIED.

## Seat workspace

SeatLayout dùng hàng, số, tên ghế và thứ tự hàng trả về từ SP; sort số trong mỗi hàng. Không dựng màn chiếu, lối đi, khoảng trống hoặc hình học ghế đôi. Loại ghế lấy đúng enum; màu/border đi kèm nhãn loại và trạng thái. Lọc đánh dấu ghế không khớp mà không loại ghế khỏi grid, giữ thứ tự. Có scroll region, nút zoom 100–200%, button tối thiểu 48px, roving tabindex, Arrow/Home/End và native Enter/Space. Khi thiếu hàng/số hoặc trùng vị trí, chuyển danh sách fallback và báo không đủ dữ liệu cho map.

Inspector hiển thị dữ liệu của ghế trong dataset hiện hành. Configuration dùng trạng thái vật lý; occupancy cần quyền QL_SUAT_CHIEU và suất chiếu thuộc đúng cinema/room, gọi API seats theo suất thật và chỉ đọc. Không tự chuyển ghế thành đã bán, không sửa vé. Suất không còn bookable có thể bị public API từ chối; UI giữ error. Mode/showtime có query state; đổi mode/context hoặc back/forward không giữ inspector cũ.

Create seat chỉ gửi roomId/hàng/số/loại theo contract; edit chỉ type/status, không chuyển phòng hoặc vị trí. Không có history flag trong danh sách: không giả lập disabled theo lịch sử. Lỗi SEAT_HAS_TICKET_HISTORY/SEAT_HAS_TICKETS được dịch rõ, giữ ghế và draft; không optimistic delete. Shared ConfirmDialog quyết định thao tác nguy hiểm.

## Cinema, rooms và gallery

ResourceTable dùng allowlist và STT, tên tài nguyên thay ID. Manager Rooms hiển thị seatCount đầy đủ từ SP. Cinema count chỉ có khi toàn bộ Room_List được cấp quyền và tải thành công; lỗi/thiếu quyền hiển thị Chưa có dữ liệu. Filter/search chạy trên toàn bộ dataset đúng scope rồi mới phân trang. Không lấy số ghế hoặc số phòng từ một trang.

Form là drawer dựa trên shared Dialog, named context read-only và exact field whitelist. Validate enum/độ dài/số nguyên/date/URL; blank phone/description của cinema gửi nullable theo validator hiện có. Không gửi empty date. Mutation lock chống double-submit. Room delete dùng kết quả deleted/deactivated từ SP, giữ dữ liệu lịch sử. Cinema deletion không cascade; 409 dữ liệu liên quan đưa ra hướng sửa trạng thái Tạm đóng.

Cinema detail liên kết Rooms và Images kèm cinemaId; Rooms liên kết Seats bằng cặp cinemaId/roomId thật. Link Danh sách suất chiếu mở route hiện có `/admin/operations/showtimes`, là danh sách chung, **chưa có filter cinema qua URL**; không mở rộng owner suất chiếu trong UXR-3.

Gallery bắt buộc named cinema, URL thật trong thumbnail/preview, alt từ caption/tên rạp, cover/status/order thật. Sắp xếp bằng numeric order trong editor, không thêm drag/drop transaction. URL/path theo storage cũ, không có upload hay image-kind giả. Asset không tải được hiển thị thông báo kết nối/nguồn ảnh, độc lập error từ API và không sửa record. Preview chỉ resolve trong dataset/cinema hiện tại; đổi URL tạo lại image renderer để thử nguồn mới.

## Ownership và regression context

Controller có generation riêng cho lookup, rooms và resource, kiểm tra payload thuộc scope trước publish; response sau dispose hoặc Manager epoch cũ bị bỏ qua. Đổi rạp/phòng reset selection/editor phụ thuộc sau Confirm. Cancel giữ draft và khôi phục query của scope hiện hành. Đổi phòng cùng rạp tái sử dụng lookup phòng đã tải, không phát lại request phòng không cần thiết.

Manager dùng ManagerLayout/ManagerCinemaStore hiện có: assignment, cinema ID, epoch/capture, hidden drafts và beginWrite/endWrite. Cache riêng `facility:rooms`/`facility:seats`; route khác không làm mất draft trong cùng rạp. Đổi cinema vẫn qua guard toàn cục cho cả hidden drafts; mutation đang chạy khóa context. URL không override cinema hiện hành: cinema khác bị 403; người dùng chọn assignment hợp lệ ở Rạp hiện tại. Booking owner/layout không bị đổi.

Gallery giữ scoped ownership khi A→B→A: generation chặn đọc muộn, pending chặn đổi cinema lúc mutation, disposed owner không refresh route/gallery mới. Tất cả API/SP tiếp tục quyết định scope; frontend không cấp quyền.

## Danh sách source thay đổi trong đợt này

Thêm:

- `frontend/src/features/facilities/FacilityScreen.jsx`
- `frontend/src/features/facilities/FacilityEditor.jsx`
- `frontend/src/features/facilities/SeatLayout.jsx`
- `frontend/src/features/facilities/SeatInspector.jsx`
- `frontend/src/features/facilities/facilityController.js`
- `frontend/src/features/facilities/facilityAdapters.js`
- `frontend/src/features/facilities/facilityModel.js`
- `frontend/src/features/facilities/occupancyRead.js`
- `frontend/src/features/facilities/facilities.css`
- `frontend/tests/facilities.test.js`

Cập nhật owner/compatibility hiện có trong working tree:

- `frontend/src/routes/AdminSectionRoute.jsx`
- `frontend/src/routes/AdminSeatContextRoute.jsx`
- `frontend/src/routes/ManagerSectionRoute.jsx`
- `frontend/src/components/CinemaImageManager.jsx`
- `frontend/tests/cinemaImageManager.test.js`
- `frontend/tests/adminPortal.test.js`

Tái sử dụng PageHeader, FilterBar, ResourceSelect, ResourceTable, FormField, Input, Select, Button, StatusBadge, AsyncState, Dialog, ConfirmDialog, draft guard và trắng–xanh tokens. Không thêm dependency. Những file UXR-1/2/3A đang uncommitted khác vẫn là thay đổi trước đợt này, không nhận là source mới của UXR-3B/C/D. [preservation-check.json](./preservation-check.json) xác nhận AdminPortal/ManagerPortal/ManagerLayout giống snapshot đầu đợt. Không thay đổi backend, API services, shared contract, DB/SP hoặc RBAC; SQL chỉ nằm trong harness nghiệm thu offline trên DB test được cho phép.

## Nghiệm thu

152 frontend tests, 30 focused backend regression tests, lint và production build PASS. 13 nhóm SP regression hiện tại và 42 HTTP requests/assertions trên DB cô lập PASS; fixture cleanup xác minh zero. [TEST_EVIDENCE.md](./TEST_EVIDENCE.md) ghi rõ từng mức bằng chứng và các lần harness sai đã sửa.

Edge/Chrome GUI vẫn lỗi GPU renderer; không có screenshot before/after hoặc browser seat-map. Responsive, focus, drawer, touch, axe, console/network ứng dụng và thao tác browser tại năm viewport đều NOT VERIFIED. Xem [BROWSER_EVIDENCE.md](./BROWSER_EVIDENCE.md). Không lấy automated PASS thay browser acceptance và không đóng blockers UXR-2A/B/C/3A.

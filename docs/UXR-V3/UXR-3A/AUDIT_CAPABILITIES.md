# UXR-3A — Audit và capability matrix

Ngày: 12/10/2026 (Asia/Bangkok). Audit trước source changes. Blueprint V3 §4, §5.6, §10–12 và `USE_CASE_MATRIX_45.md`: ADM-08 hiện bao gồm phòng/ghế toàn hệ, Admin với QL_PHONG cho rooms, QL_GHE cho seats.

Baseline `/admin/facilities/rooms` do AdminSectionRoute → AdminPortal sở hữu. Renderer generic đặt form dài trước table; create bắt nhập `RapID`, table tự sinh cột từ DTO và lộ IDs, list không lọc theo rạp. UXR-2B route/permission guards đã có và sẽ giữ nguyên; chỉ đổi owner rooms. Bản copy trước sửa tại `.audit-output/uxr3a-baseline/`; working tree đã có source/docs UXR-1/2 chưa commit, không reset/checkout hoặc ghi đè bằng HEAD.

| Khả năng | Contract hiện có / bằng chứng | Phân loại và quyết định UI |
|---|---|---|
| Đọc phòng theo rạp | GET `/admin/rooms?cinemaId`; controller → ADMIN_ROOM_LIST / usp_Admin_Room_List @RapID | **SUPPORTED**; chọn rạp rồi fetch đúng scope |
| Tên phòng/rạp, loại, trạng thái | DTO `PhongID, RapID, TenRap, TenPhong, LoaiPhong, TrangThai` | **SUPPORTED**; allowlist hiển thị tên, ID chỉ nội bộ |
| Số ghế thực | `TongSoGhe = COUNT(*) FROM GHE WHERE PhongID` trong Room_List | **SUPPORTED**; không đếm rows ghế client, không mặc định missing count thành 0 |
| Tìm tên/số phòng | API/SP không có search param hoặc số phòng riêng | **UI-ONLY**; tìm trên TenPhong của **toàn bộ** response rạp, gồm số trong tên; không tìm PhongID |
| Loại/trạng thái filter | Response có LoaiPhong/TrangThai; API không filter hai field | **UI-ONLY**; loại từ values thật, trạng thái theo contract rooms; lọc trước pagination |
| Pagination | Room_List không OFFSET/FETCH/TOP, API trả toàn bộ rooms, không total/page | **UI-ONLY**; phân trang presentation trên tập đầy đủ đã tải, total là count sau lọc; không gửi page/search giả lên API |
| Danh mục rạp đầy đủ | GET `/admin/cinemas`, cần QL_RAP, returns RapID/TenRap | **SUPPORTED** khi có QL_RAP; named ResourceSelect, không gọi thiếu permission |
| Named lookup chỉ QL_PHONG | Full Rooms list đã trả tên/ID rạp | **SUPPORTED có giới hạn**; derive cinema options từ Rooms toàn bộ; không thấy rạp chưa có phòng |
| Tra rạp chưa có phòng với chỉ QL_PHONG | Không có lookup endpoint được cấp quyền hiện tại | **NEEDS APPROVAL / BLOCKED cho trường hợp này**; cần quyết định permission/API ngoài slice, không tạo endpoint hoặc grant quyền |
| Thêm phòng | POST `/admin/rooms` body cinemaId/name/type, name≤100/type≤50; SP đặt Hoạt động | **SUPPORTED**; drawer scoped cinema read-only bằng tên; không gửi status khi create |
| Sửa phòng | PUT `/admin/rooms/:roomId`, name/type/status; không hỗ trợ đổi cinema | **SUPPORTED**; giữ rạp read-only, chỉ gửi field hợp lệ |
| Loại phòng | SP nhận LoaiPhong NVARCHAR(50), default 2D; REST roomWrite enumInput dùng shared ROOM_TYPES: 2D/3D/IMAX/4DX/ScreenX | **SUPPORTED**; dropdown đúng whitelist shared, không thêm loại mới |
| Trạng thái phòng | RESOURCE_STATUSES.rooms: Hoạt động/Bảo trì/Ngưng hoạt động | **SUPPORTED** dropdown edit; create fixed by SP |
| Xóa và lịch sử | DELETE returns result `{Deleted,Deactivated,TrangThai,Message}`. SP có SUATCHIEU → ngưng hoạt động; chưa có → xóa ghế rồi phòng trong transaction | **SUPPORTED**; confirm mô tả cả hai outcome, giữ server Message, refetch; không optimistic delete phòng lịch sử |
| Conflict/not found/permission | ROOM_NAME_CONFLICT 409; ROOM_NOT_FOUND 404; ROOM_DELETE_CONFLICT 409; middleware/SP role/permission guards | **SUPPORTED**; error states và draft giữ khi lỗi, không auto-retry writes |
| Seat handoff | GET seats hỗ trợ roomId; route seats cũ chưa consume query/context | **SUPPORTED sau frontend bridge tối thiểu**; validate cinema/room, scoped GET và bind create room context; không redesign renderer/seat-map |
| Seat-map mới, tọa độ/lối đi, history flags, bulk ops | Không thuộc 3A / không đủ contract | **BLOCKED/out-of-scope**; không triển khai UXR-3B/C/D |
| Server-side search/pagination, chuyển phòng sang rạp khác | Không được API/SP hỗ trợ | **NEEDS APPROVAL**, không bật UI |

SP/middleware/service được đọc, không sửa hoặc execute DB. `usp_Admin_Room_Delete` hiện **deactivate** phòng lịch sử thay vì luôn 409; map ROOM_HAS_SHOWTIMES vẫn được giữ để xử lý rejection nếu server trả. Live CRUD/history/RBAC cần test DB/browser, chưa được source audit chứng minh PASS.

Browser preflight trước code: Edge + Chrome headless Chromium thật, ports 9381/9382, profiles mới; cả hai CDP fetch failed và startup GPU fatal 0xC0000022. Không thể chụp before screenshot. Evidence và verdict riêng sẽ nằm trong BROWSER_EVIDENCE.md, không sửa blockers của UXR-2A/B/C.

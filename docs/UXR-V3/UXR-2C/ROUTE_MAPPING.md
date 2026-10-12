# UXR-2C — Manager route mapping

| Route | Screen owner / renderer | Permission hiện có | API GET của screen |
|---|---|---|---|
| `/manager/overview` | ManagerSectionRoute → ManagerPortal dashboard | XEM_BAO_CAO_RAP | Dashboard(cinemaId) |
| `/manager/rooms` | ManagerSectionRoute → ManagerPortal rooms | QL_PHONG | Rooms(cinemaId) |
| `/manager/seats` | ManagerSectionRoute → ManagerPortal seats | QL_GHE | Rooms(cinemaId) nếu có QL_PHONG; Seats(roomId) khi tải |
| `/manager/showtimes` | ManagerSectionRoute → ManagerPortal showtimes | QL_SUAT_CHIEU | Showtimes(cinemaId), Rooms nếu có QL_PHONG, catalog Movies lookup |
| `/manager/pricing` | ManagerSectionRoute → ManagerPortal pricing | QL_BANG_GIA | Pricing(cinemaId) |
| `/manager/revenue` | ManagerSectionRoute → ManagerRevenue | XEM_BAO_CAO_RAP | Revenue(cinemaId, date range) |
| `/manager/bookings` | StaffBookings, giữ nguyên workflow | DAT_VE | Existing staff booking service/options/filter/query |

Tất cả nằm dưới RequireRole(QUAN_LY_RAP) → StaffShell(manager) → ManagerLayout. Layout giữ context qua các sibling routes; shared shell không remount theo cinema hoặc query. Assigned cinemas được tải tại provider, không lặp lại mỗi lần đổi screen.

`/manager` dùng replace redirect tới `/manager/overview`. Legacy `/manager#manager-rooms` (tương tự seats/showtimes/pricing/revenue/overview/bookings) chuyển tới route tương ứng; hash lạ dùng overview. Query string được giữ trong redirect. Unknown `/manager/*` hiển thị NotFound trong StaffShell, không fallback sang overview.

Sidebar giữ bốn nhóm hiện có; Link thay anchor hash, active theo canonical pathname, `aria-current="page"`, hỗ trợ trailing slash. Breadcrumb từng screen dùng PageHeader của UXR-2A. Bookings giữ breadcrumb hiện có và route query `orderId`.

Rooms action “Ghế” mở `/manager/seats`, mang room selection thuộc cinema hiện tại; chọn lại cùng room không reset cached state. Draft ghế phân biệt roomId. Không tự grant QL_PHONG cho actor chỉ có QL_GHE/QL_SUAT_CHIEU: thiếu lookup permission giữ trạng thái lỗi hiện có.

Bookings vẫn cho lọc/chọn các rạp được server cho phép bằng controls hiện có. Không ép filter booking theo cinema của sáu màn Manager; không key booking theo cinema, assignment list load hoặc draft updates. Cinema của sáu màn vẫn được giữ khi đi qua bookings và trở lại.

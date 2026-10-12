# UXR-V3 — UXR-2B Admin Route Mapping

React Router now owns the selected Admin section. `ADMIN_SECTION_ROUTES` is the shared path/label map for route declarations and the Admin sidebar; `ADMIN_SCREEN_ROUTES` generates one child route per section. Route permission checks use the existing `ADMIN_SECTION_PERMISSIONS`; `RequireRole` still protects the Admin area.

| Sidebar group | Section | Route | Current screen renderer | Permission |
|---|---|---|---|---|
| Tổng quan | Tổng quan | `/admin/overview` | `AdminPortal` → dashboard | `XEM_BAO_CAO_TOANHE` |
| Tài khoản & phân công | Tài khoản | `/admin/access/users` | `AdminPortal` → users | `QL_NGUOIDUNG` |
| Tài khoản & phân công | Phân công | `/admin/access/assignments` | `AdminPortal` → assignments | `PHANCONG_RAP` |
| Rạp & cơ sở vật chất | Rạp | `/admin/cinemas` | `AdminPortal` → cinemas | `QL_RAP` |
| Rạp & cơ sở vật chất | Ảnh rạp | `/admin/cinemas/images` | `AdminPortal` → `CinemaImageManager` | `QL_RAP` |
| Rạp & cơ sở vật chất | Phòng | `/admin/facilities/rooms` | `AdminPortal` → rooms | `QL_PHONG` |
| Rạp & cơ sở vật chất | Ghế | `/admin/facilities/seats` | `AdminPortal` → seats | `QL_GHE` |
| Nội dung | Phim | `/admin/catalog/movies` | `AdminPortal` → movies | `QL_DANHMUC_PHIM` |
| Nội dung | Thể loại | `/admin/catalog/genres` | `AdminPortal` → genres | `QL_THELOAI` |
| Nội dung | Diễn viên | `/admin/catalog/actors` | `AdminPortal` → actors | `QL_DANHMUC_PHIM` |
| Kinh doanh & vận hành | Sản phẩm | `/admin/commerce/products` | `AdminPortal` → products | `QL_SANPHAM` |
| Kinh doanh & vận hành | Khuyến mãi | `/admin/commerce/promotions` | `AdminPortal` → promotions | `QL_KHUYENMAI` |
| Kinh doanh & vận hành | Bảng giá | `/admin/operations/pricing` | `AdminPortal` → pricing | `QL_BANG_GIA` |
| Kinh doanh & vận hành | Suất chiếu | `/admin/operations/showtimes` | `AdminPortal` → showtimes | `QL_SUAT_CHIEU` |
| Kinh doanh & vận hành | Quản lý đặt vé | `/admin/bookings` | `StaffBookings` | `DAT_VE` |
| Chăm sóc & báo cáo | Khiếu nại | `/admin/service/complaints` | `AdminPortal` → complaints | `QL_KHIEUNAI` |
| Chăm sóc & báo cáo | Doanh thu | `/admin/reports/revenue` | `AdminPortal` → `AdminRevenue` | `XEM_BAO_CAO_TOANHE` |

## Compatibility and route behavior

- `/admin` redirects to `/admin/overview` with history replacement; it remains a valid entry URL.
- `/admin/bookings` keeps its existing route and `StaffBookings` feature owner.
- Unknown `/admin/*` paths render the existing 404 screen.
- Every route target is a React Router `Link`; the active target follows `location.pathname` and exposes `aria-current="page"`.
- Each section has a distinct child route and an `AdminSectionRoute` owner. The existing `AdminPortal` renderer/data handlers remain shared behind these route owners; no module UI or API was redesigned in this slice.


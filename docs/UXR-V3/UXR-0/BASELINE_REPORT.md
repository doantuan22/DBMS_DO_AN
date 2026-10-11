# UXR-V3 / UXR-0 — Baseline Report

**Trạng thái:** Hoàn tất baseline/readiness; chưa sửa source frontend, API, DB, RBAC hoặc nghiệp vụ.  
**Ngày kiểm tra:** 11/10/2026 (Asia/Bangkok)  
**Chỉ đạo:** [Master Frontend UI/UX Restructuring Blueprint V3](../../MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md)

## 1. Kết luận điều hành

UXR-0 đã lập được baseline repository, đối chiếu Use Case Matrix hiện hành, kiểm kê source/API/SP trên database test cô lập, đăng nhập bằng bốn vai trò và duyệt các route hiện có trên browser. Bộ evidence có 71 ảnh chụp màn hình (một số trường nhận diện đã được che trên bản lưu trong tài liệu).

**Exit Gate: PASS cho baseline/readiness theo phạm vi UXR-0.** PASS ở đây có nghĩa là baseline kỹ thuật và browser đã được ghi nhận, không có nghĩa là 44 Use Case đã được replay end-to-end hoặc hệ thống đã đạt UXR-7. Các trường hợp chưa kiểm thử thực tế, giới hạn fixture và môi trường được ghi tại [BLOCKERS_AND_DECISIONS.md](BLOCKERS_AND_DECISIONS.md) và [BROWSER_BASELINE_EVIDENCE.md](BROWSER_BASELINE_EVIDENCE.md).

Không tìm thấy bằng chứng cho phép thay đổi nghiệp vụ hoặc contract trong UXR-0; vì vậy không thay đổi ứng dụng. Những khả năng thiếu filter/selector là findings cho kế hoạch, không phải đề xuất tự thêm API.

## 2. Repository và phạm vi bảo toàn

- Branch: `tuan`
- Commit tại thời điểm bắt đầu và kết thúc kiểm tra: `5d2dcac1752947a5aed2095b15dbeaae97d35f64`
- Working tree đầu lượt: không có tracked modifications; có hai đường dẫn untracked đã tồn tại và được giữ nguyên:
  - `docs/MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md`
  - `docs/audits/FRONTEND_DEEP_AUDIT_V2/`
- Kết quả lượt này: chỉ thêm `docs/UXR-V3/UXR-0/` và evidence screenshots của lượt. Không ghi đè hai mục untracked có trước, không sửa source, cấu hình, API, database hoặc tài liệu ngoài phạm vi đầu ra UXR-0.

## 3. Use Case và quy tắc nghiệp vụ đối chiếu

Nguồn baseline là [Use Case Matrix hiện hành](../../USE_CASE_MATRIX_45.md), không căn cứ vào con số trong tên file:

| Portal | UC đang hoạt động |
|---|---:|
| Customer | 14 |
| Manager | 10 |
| CSKH | 6 |
| Admin | 14 |
| **Tổng** | **44** |

`ADM-03`, `ADM-04`, `ADM-05` có trạng thái `RETIRED`; `ADM-17` nằm ngoài phạm vi; `QLR-10` và `ADM-18` là hai UC quản lý đặt vé nhân viên. 47 ID gồm cả ID retired dùng để truy vết, không phải 47 UC active.

RBAC cố định bốn vai trò `Customer`, `Manager`, `CSKH`, `Admin`. Vai trò được chọn theo luồng tạo tài khoản được phép và không sửa sau đó; danh mục quyền/Role–Permission cố định. Không có chức năng quản trị vai trò/quyền cần tái tạo. Admin vẫn phân công/chuyển Manager giữa các rạp. Booking staff có route riêng, `DAT_VE` permission guard và kiểm tra scope ở tầng DB/SP; Manager chỉ được thao tác trong phân công rạp còn hiệu lực. Không suy diễn scope từ UI.

Nguồn xác minh chính: [routes](../../../frontend/src/routes/index.jsx), [admin routes](../../../backend/src/routes/adminRoutes.js), [manager routes](../../../backend/src/routes/managerRoutes.js), [staff booking routes](../../../backend/src/routes/staffBookingRoutes.js), [matrix](../../USE_CASE_MATRIX_45.md), trigger `database/07_triggers/TRG_NguoiDung_VaiTroBatBien.sql`, service whitelist [procedures.js](../../../backend/src/db/procedures.js).

## 4. Kiến trúc frontend hiện tại

### 4.1 Runtime và route ownership

Frontend dùng React 19, Vite 8 và React Router 7. Public/customer commerce dùng `AreaLayout`; staff dùng `StaffShell` và route guard `RequireRole`. Admin và Manager vẫn có portal monolith với section state nội bộ; màn hình quản lý đặt vé đã tách thành route/feature.

| Khu vực | Route đang chạy | Hiện trạng chính |
|---|---|---|
| Public | `/`, `/movies`, `/movies/:movieId`, `/cinemas`, `/cinemas/:cinemaId`, `/booking/:showtimeId`, `/login`, `/register`, `/forbidden`, not-found | Public catalog/booking, layout chung; trang chủ còn `DatabaseHealth` |
| Customer | `/profile`, `/account`, `/orders`, `/orders/:orderId`, `/orders/:orderId/payment`, `/complaints`, `/complaints/:complaintId` | Guard theo auth/Customer; route account và profile còn khác nhau |
| Admin | `/admin`, `/admin/bookings` | `/admin` có 16 legacy section cục bộ; bookings dùng `StaffBookings` |
| Manager | `/manager`, `/manager/bookings` | `/manager` chứa overview, rooms, seats, showtimes, pricing, revenue; bookings dùng feature riêng |
| CSKH | `/support` | Queue/detail/actions tập trung trong `SupportPortal`; route detail deep-link chưa tách theo target V3 |

Route target cần migrate dần theo Blueprint, không redirect big-bang: Admin overview/access/cinemas/facilities/catalog/commerce/operations/service/reports; Manager overview/rooms/seats/showtimes/pricing/revenue; CSKH `/support/complaints/:complaintId`; customer public/account routes được giữ.

### 4.2 Components, state, styles

- Shared layouts: `frontend/src/layouts/AreaLayout`, `StaffShell`; route guards nằm trong `frontend/src/routes`.
- Role pages chính: `AdminPortal.jsx`, `ManagerPortal.jsx`, `SupportPortal.jsx`; staff bookings tại `frontend/src/features/staff-bookings/StaffBookings`.
- Shared feature hiện có gồm `CinemaImageManager` và UI components trong `frontend/src/components/ui`.
- Style được tách theo token/base/shell/component, còn legacy/component styles được dùng song song. Palette hiện tại là trắng–xanh; UXR-0 không đổi token.
- State chủ yếu thuộc từng page/component. Async guard tồn tại ở các luồng quan trọng: manager image/resource loads và booking flow; CSKH draft/filter state hiện có tương tác dễ mất draft khi đổi filter/case — UXR-1A cần tách applied filters khỏi draft và kiểm tra stale responses.
- Các portal còn render DTO/cột dạng tổng quát ở nhiều section; một số form yêu cầu ID số thô. Manager showtime form có `Movie ID` và room ID; Manager seats khởi đầu bằng room ID. Đây là vấn đề UI, nhưng selector chỉ được làm bằng dữ liệu lookup thực có.

### 4.3 API client và DB access

Frontend API clients nằm ở `frontend/src/api/`: `adminApi`, `managerApi`, `supportApi`, `staffBookingApi`, `catalogApi`, `ordersApi`, `feedbackApi`, `authApi` cùng `httpClient`/token handling. Backend route → controller/service → `procedureClient` → whitelist stored procedures; backend không chứa SQL truy vấn nghiệp vụ trực tiếp. DBMS-first là ràng buộc giữ nguyên.

`backend/src/db/procedures.js` có 118 procedure key/name; đối chiếu trên test DB trả về đủ **118/118 tồn tại**, không thiếu procedure theo whitelist. Kết quả chỉ xác minh schema/procedure inventory ở test DB, không khẳng định mọi nhánh nghiệp vụ đã E2E.

## 5. Database/RBAC readiness

Preflight xác nhận DB đích là môi trường test cô lập, identity và physical target tách khỏi main DB; chỉ truy vấn đọc, không chạy reset/seed/migration trong lượt baseline. Trong tài liệu chỉ gọi là **isolated R0 staff-booking test DB**; không ghi server/file path, credential, token, email hoặc số điện thoại.

Tóm tắt dữ liệu test đọc được: 3 rạp, 6 phòng, 240 ghế, 4 phim, 32 suất chiếu, 27 đơn, 1 khiếu nại. 240/240 ghế có hàng và số ghế hợp lệ; không trùng khóa `(Phòng, Hàng, Số ghế)`. Có 30 nhóm hàng; database hiện không mô tả tọa độ/aisle chi tiết, vì vậy grid chỉ được suy từ row/number thực và không được vẽ lối đi giả. 32 suất chiếu đều có thời điểm bắt đầu/kết thúc.

Có 1 Admin, 2 Manager, 1 CSKH, 4 Customer đang hoạt động. Trigger `TRG_NguoiDung_VaiTroBatBien` tồn tại và enabled; các hàm scope Manager và seat availability theo suất chiếu tồn tại. Hai dòng phân công hiệu lực thuộc hai Manager khác nhau ở hai rạp; mỗi Manager trong fixture chỉ có một rạp. Browser này không xác minh tình huống một Manager chuyển context giữa nhiều rạp.

## 6. Hiện trạng theo portal

### Admin

Menu legacy hiện bộc lộ 16 section: overview, accounts, assignments, cinemas, cinema images, rooms, seats, movies, genres, actors, products, promotions, pricing, showtimes, complaints, revenue; `/admin/bookings` là route riêng đã có. Tái nhóm thành 6 nhóm theo Blueprint. Vai trò/quyền là read-only/refusal compatibility; không được xuất hiện như CRUD UI. Tài khoản vẫn tạo với role được chọn tại lúc tạo theo quyền hiện có, và có action trạng thái; không cập nhật role.

List/table còn nhiều ID kỹ thuật và tên cột/DTO thô. Filter hiện thực sự được gửi ở users (`roleId`, status, search), assignments (manager/cinema), movies (status/genre/search), revenue (date range/cinema), showtimes (cinema/date range), rooms (cinema), seats (room), pricing (cinema). Các section khác không được coi là có search/filter chỉ vì UI muốn có.

### Manager

Một `/manager` monolith với cinema context, resource panels; route `/manager/bookings` độc lập. Manager API có danh sách rạp được phân công, rooms theo cinema, seats theo room, showtimes theo cinema/date, pricing/dashboard/revenue theo cinema và date. Scope được enforced lại ở backend/SP. Các form showtime/seat hiện có ID số; chưa có page route riêng cho từng section. Không thay đổi scope/permission.

### CSKH

`SupportPortal` có thao tác queue → case → timeline/reference → action. Filter tồn tại cho status/type/search/priority và có API route. V2 browser observation cho thấy đổi filter sau khi có nội dung draft làm mất/ngắt ngữ cảnh draft/case; target là queue + detail/timeline + reference/action ba vùng (desktop), và bảo vệ draft/deep-link. Browser lần này xem case hiện có, không tạo fixture mới.

### Customer/Public

Routes catalog, cinema, booking, order/payment, profile/account, complaint/review có mặt. Home còn database health panel; ảnh/font ngoài không tải được trong browser sandbox. Booking flow dùng API seat availability theo suất chiếu, giữ booking state/error guards; baseline browser chỉ mở flow/chọn ghế UI, không replay ghi booking/payment. Không đổi logic giá, trạng thái booking, payment hoặc ownership.

## 7. Tài liệu chỉ đạo và tiêu chuẩn

Master Blueprint V3 là nguồn thiết kế chính thức; các chuẩn/blueprint cũ chỉ đối chiếu để tìm mâu thuẫn, không ghi đè V3. Quy chuẩn trắng–xanh giữ nguyên. Admin 6 sidebar groups, Manager cinema context, CSKH 3 vùng, list-first/filter theo contract, seat map từ dữ liệu hàng/số ghế, responsive 390/768/1280/1440/1920 và WCAG 2.2 AA là mục tiêu cho các slice sau.

## 8. Link evidence và báo cáo kế hoạch

- [Browser Baseline Evidence](BROWSER_BASELINE_EVIDENCE.md)
- [API/UI Capability Matrix](API_UI_CAPABILITY_MATRIX.md)
- [Screen Implementation Plan](SCREEN_IMPLEMENTATION_PLAN.md)
- [UXR Roadmap](UXR_ROADMAP.md)
- [Blockers and Decisions](BLOCKERS_AND_DECISIONS.md)
- [Screenshots](screenshots/)

## 9. Gate UXR-0

| Điều kiện | Kết quả |
|---|---|
| Git branch/commit/worktree được ghi nhận, thay đổi có trước được bảo toàn | PASS |
| Source, routes, state, CSS, API clients được kiểm kê | PASS |
| 44 active UC, retired/out-of-scope ID được xác minh | PASS |
| Fixed RBAC, booking staff scope và SP inventory được đối chiếu | PASS cho source/schema inventory |
| Test DB cô lập, bốn vai trò đăng nhập, route/browser baseline chạy | PASS cho baseline browser |
| Năm viewport có ảnh shell/home; route screenshots có mặt | PASS cho coverage đã ghi rõ; không phải mọi route ở mọi viewport |
| API/console/network kết quả không phóng đại | PASS với các hạn chế nêu trong evidence |
| 44 UC replay end-to-end, axe/screen-reader, toàn bộ route ở năm viewport | NOT VERIFIED / ngoài exit gate UXR-0 |

**Kết luận:** UXR-0 baseline/readiness gate PASS, có caveat. Đây không phải phê duyệt để tự bắt đầu UXR-1; chờ project approval theo yêu cầu nhiệm vụ.


# UXR-V3 / UXR-0 — API/UI Capability Matrix

Nguồn quy tắc: [Master Blueprint V3](../../MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md), đặc biệt §§2, 4, 5–10, 14.3, 17. Bảng này mô tả hợp đồng đọc được trong source và DB test; **SUPPORTED không đồng nghĩa E2E đã chạy**.

## 1. Quy ước trạng thái

- **SUPPORTED** — route/query/body và procedure hiện có thể phục vụ capability. Việc xác minh hiệu quả nghiệp vụ vẫn cần test UI→API→DB ở slice/UXR-7.
- **UI-ONLY POSSIBLE** — chỉ có thể trình bày/lọc dữ liệu đã tải. Chỉ sử dụng khi chứng minh kết quả đầy đủ và có giới hạn; không `fetchAll` vô hạn hoặc biến thành bộ lọc giả.
- **NEEDS APPROVAL** — UX yêu cầu tham số, response, behavior hoặc nghiệp vụ chưa có trong API/SP; dừng ở screen spec đến khi được duyệt theo DBMS-first.
- **BLOCKED** — thiếu dữ liệu/hợp đồng/fixture cho kết quả đáng tin cậy hoặc thao tác an toàn.

Mọi write tiếp tục đi qua API hiện hữu tới SP đã whitelist. Không SQL backend trực tiếp. Mọi lookup hiển thị tên nhưng gửi ID do API trả về; người dùng không nhập ID thủ công.

## 2. Admin

| Màn hình / capability | API, filter hoặc action hiện có | SP / nguồn | Trạng thái và giới hạn |
|---|---|---|---|
| Tổng quan `/admin/overview` | `GET /api/admin/dashboard` | `sp_Admin_Dashboard` | SUPPORTED. Chỉ số phải dùng response hiện có; không tự thêm KPI. |
| Tài khoản `/admin/access/users` | `GET /api/admin/users?roleId&status&search`; `POST /users`; `PUT /users/:id/status` | `sp_Admin_User_List/Create/UpdateStatus`; roles read `sp_Admin_Role_List` | SUPPORTED. Role chỉ chọn lúc tạo; không có role update. Role list là read-only. |
| Phân công Manager `/admin/access/assignments` | `GET /assignments?cinemaId&userId`; `POST`, `PUT /assignments/:id` | `sp_Admin_Assignment_List/Create`, `usp_Admin_Assignment_Update` | SUPPORTED. Có tên/email Manager, rạp, hiệu lực/trạng thái trong response. Chuyển rạp phải xác nhận; test một Manager có nhiều assignment còn hiệu lực bị BLOCKED bởi fixture hiện có. |
| Rạp `/admin/cinemas` | `GET/POST/PUT/DELETE /cinemas` | `usp_Admin_Cinema_List`, `sp_Admin_Cinema_*` | SUPPORTED. Chưa có server search/pagination theo contract đã xác minh; mọi filter bổ sung NEEDS APPROVAL hoặc UI-only chỉ sau khi chứng minh list bounded. |
| Ảnh rạp `/admin/cinemas/images` | `GET/POST/PUT/DELETE /cinemas/:id/images`, `PATCH .../cover` | `usp_Admin_CinemaImage_*` | SUPPORTED. Giữ `CinemaImageManager` upload/ownership/async guard. Filter ngoài cinema context NEEDS APPROVAL. |
| Phòng `/admin/facilities/rooms` | `GET /rooms?cinemaId`; CRUD | `usp_Admin_Room_*` | SUPPORTED cho filter rạp và CRUD. Search, trạng thái hoặc paging server chưa thấy; named cinema selector chỉ dùng danh sách thật. |
| Ghế vật lý `/admin/facilities/seats` | `GET /seats?roomId`; CRUD | `usp_Admin_Seat_*` | SUPPORTED cho chọn phòng và dữ liệu ghế vật lý. Dữ liệu row/number đủ dựng grid cơ bản. Trạng thái giữ/bán theo suất chiếu không được suy ra từ ghế vật lý: không hỗ trợ trong màn này. |
| Phim `/admin/catalog/movies` | `GET /movies?status&genreId&search`; create/update/delete; set cast | `usp_Admin_Movie_List`, `sp_Admin_Movie_*`, `sp_Admin_MovieActor_Set` | SUPPORTED. Bộ lọc status/genre/search có query contract. |
| Thể loại `/admin/catalog/genres` | `GET/POST/PUT/DELETE /genres` | `sp_Admin_Genre_*` | SUPPORTED cho CRUD; search/paging chưa có contract. |
| Diễn viên `/admin/catalog/actors` | `GET/POST/PUT/DELETE /actors` | `sp_Admin_Actor_*` | SUPPORTED cho CRUD; search/paging chưa có contract. |
| Sản phẩm `/admin/commerce/products` | `GET/POST/PUT/DELETE /products` | `usp_Admin_Product_List`, `sp_Admin_Product_*` | SUPPORTED cho CRUD; bộ lọc/paging bổ sung NEEDS APPROVAL nếu không chứng minh được response bound. |
| Khuyến mãi `/admin/commerce/promotions` | `GET/POST/PUT/DELETE /promotions` | `sp_Admin_Promotion_*` | SUPPORTED cho CRUD; tìm theo trạng thái/ngày/type cần kiểm tra query chưa có ở validator đã rà; không thêm filter UI không có tác dụng. |
| Bảng giá `/admin/operations/pricing` | `GET /pricing?cinemaId`; `POST/PUT` | `usp_Admin_Pricing_*` | SUPPORTED cho cinema list/create/update. Filter loại ghế/ngày/loại ngày chưa có trong query được service gọi; NEEDS APPROVAL hoặc lọc client chỉ sau khi xác nhận dữ liệu đầy đủ/bounded. Lịch sử snapshot phải giữ nguyên. |
| Suất chiếu `/admin/operations/showtimes` | `GET /showtimes?cinemaId&fromDate&toDate`; create/update/cancel | `usp_Admin_Showtime_*` | SUPPORTED cho rạp và ngày. Filter phim/phòng chưa được chuyển thành query đã xác minh; NEEDS APPROVAL nếu cần server filter. Cancel phải giữ rule held-order/timezone hiện có. |
| Quản lý đặt vé `/admin/bookings` | `GET /api/admin/bookings?search&status&cinemaId&page&pageSize`; customer search; options; detail; `POST`; `PUT /:id/seats`; `POST /:id/cancel`; DELETE trả 405 | `sp_StaffBooking_List/Customers/Options/Detail/Create/UpdateSeats/Cancel` | SUPPORTED. Full-text search/status/cinema/paging; customer lookup theo tên/email/điện thoại; tạo/sửa ghế/hủy theo SP. Không có physical delete/payment mutation. Showtime options tối đa TOP 200; phần vượt cap BLOCKED. Chỉ source/contract verified, không replay write trong baseline. |
| Khiếu nại `/admin/service/complaints` | list `status/type/search/priority`, detail, order reference, append processing, update status | `sp_Support_Complaint_*` qua `supportService` | SUPPORTED. Cùng append-only history/permission checks CSKH; không xóa lịch sử. |
| Doanh thu `/admin/reports/revenue` | `GET /reports/revenue?fromDate&toDate&cinemaId` | `sp_Admin_Report_Revenue` | SUPPORTED cho range/rạp và dữ liệu report server. Filter tùy ý theo phim/room chưa có. |
| RBAC pages | `GET /roles` tồn tại; write endpoints trả refusal 403 `RBAC_FIXED` | `sp_Admin_Role_List`; immutable role trigger | SUPPORTED chỉ cho read tối thiểu cần thiết. Tạo menu/form/route role-permission management là out-of-scope; mọi mutation bị từ chối theo hợp đồng. |

## 3. Manager

| Màn hình / capability | API, filter hoặc action hiện có | SP / nguồn | Trạng thái và giới hạn |
|---|---|---|---|
| Rạp hiện hành/context `/manager/overview` | `GET /api/manager/cinemas`; dashboard/revenue gắn `cinemaId` | `sp_Manager_ListAssignedCinemas`, `sp_Manager_Dashboard`, `sp_Manager_Revenue` | SUPPORTED cho assigned cinema và dashboard. UI chỉ hiển thị scope server trả về. Một Manager nhiều rạp A→B BLOCKED bởi fixture hiện tại (hai Manager, mỗi người một rạp). |
| Phòng `/manager/rooms` | `GET /cinemas/:cinemaId/rooms`; create; `PUT/DELETE /rooms/:roomId` | `sp_Manager_Room_*` | SUPPORTED, cinema context/scope ở backend/SP. Search/sort/paging server chưa thấy. |
| Ghế `/manager/seats` | `GET /rooms/:roomId/seats`; CRUD seat | `sp_Manager_Seat_*` | SUPPORTED cho ghế vật lý theo phòng, scope được bảo vệ. Grid từ row/number có thật; geometry, lối đi và sold/held state không có trong hợp đồng này. |
| Suất chiếu `/manager/showtimes` | `GET /cinemas/:cinemaId/showtimes?fromDate&toDate`; create/update/cancel | `sp_Manager_Showtime_*` | SUPPORTED cho cinema/date, manager scope. Filter phim/phòng và selector chỉ khả thi bằng nguồn catalog/rooms hợp lệ; API filter thêm NEEDS APPROVAL. |
| Bảng giá `/manager/pricing` | `GET /cinemas/:cinemaId/pricing`; create; `PUT /pricing/:id` | `sp_Manager_Pricing_*` | SUPPORTED trong rạp được phân công. Filter type/day chưa có query đã xác minh; NEEDS APPROVAL nếu server-side. |
| Doanh thu `/manager/revenue` | `GET /cinemas/:cinemaId/revenue?fromDate&toDate` | `sp_Manager_Revenue` | SUPPORTED theo rạp hiện hành và date range; không cho chọn rạp ngoài scope. |
| Đặt vé `/manager/bookings` | Cùng list/customer/options/detail/create/edit-seat/cancel endpoints như Admin | `sp_StaffBooking_*` | SUPPORTED; authorization và cinema scope được kiểm tra ở backend/SP, không dựa client filter. Test truy cập rạp khác không chạy trong baseline browser, source/SP inventory verified. |

## 4. CSKH

| Màn hình / capability | API, filter hoặc action hiện có | SP | Trạng thái và giới hạn |
|---|---|---|---|
| Queue `/support` | `GET /api/support/complaints?status&type&search&priority` | `sp_Support_Complaint_List` | SUPPORTED cho query filters. Nên tách filter đang nhập/applied trong UI; đây là state UX, không cần API mới nếu request giữ nguyên. |
| Chi tiết/deep-link | `GET /complaints/:id`, order reference | `sp_Support_Complaint_GetDetail/GetOrderReference` | SUPPORTED cho detail và liên kết đơn nếu dữ liệu/quyền cho phép. Route `/support/complaints/:id` là target, hiện chưa có route child. |
| Timeline / xử lý | `POST /complaints/:id/processings`; `PUT /complaints/:id/status` | `sp_Support_Complaint_AddProcessing/UpdateStatus` | SUPPORTED. Processing append-only; giữ status transition/error và dirty-draft guard. Không ghi lại browser baseline ngoài thao tác fixture đã tồn tại. |

## 5. Customer / Public

| Màn hình / capability | API, filter hoặc action hiện có | SP | Trạng thái và giới hạn |
|---|---|---|---|
| Trang chủ `/` | Catalog movie data | `sp_Movie_List` | SUPPORTED cho dữ liệu phim hiện có. DatabaseHealth UI là diagnostic, không phải UC commerce; remove theo UXR-1B. Không dùng số liệu chẩn đoán để lộ cấu hình DB. |
| Danh sách phim `/movies` | `GET /api/movies?status&genreId&search` | `sp_Movie_List` | SUPPORTED cho ba filters. |
| Chi tiết phim/review | `GET /movies/:id`, reviews; `POST review` có Customer/permission guard | `sp_Movie_GetDetail`, `sp_Review_ListByMovie/Create` | SUPPORTED. Eligibility vẫn do backend/SP; không giả nút thành công. |
| Rạp `/cinemas` | `GET /api/cinemas?city`; images | `sp_Cinema_List`, `sp_Cinema_GetImages` | SUPPORTED cho city filter theo validator/service và ảnh. |
| Lịch chiếu | `GET /movies/:movieId/showtimes?cinemaId&date` | `sp_Showtime_ListByMovie` | SUPPORTED cho phim/rạp/ngày và availability fields server trả về. |
| Booking seat map `/booking/:showtimeId` | seat/showtime detail reads; `POST /api/bookings` Customer-only | `sp_Seat_ListByShowtime`, `sp_Showtime_GetDetail`, `sp_Booking_Create` | SUPPORTED cho contract. Browser baseline chỉ duyệt và chọn ghế local; chưa replay create, lock/conflict, expiry hoặc transaction. Giữ booking state/async guard. |
| Sản phẩm/promotion trong booking | active products; promotion validate | `sp_Product_ListActive`, `sp_Promotion_Validate` | SUPPORTED theo contract, nhưng baseline không gửi booking/payment. Giá cuối do server quyết định. |
| Đơn `/orders` và detail | Customer-owned list/detail | `sp_Order_ListByCustomer`, `sp_Order_GetDetailByCustomer` | SUPPORTED. Không có search/pagination query được xác minh; không suy rộng dữ liệu client. |
| Payment | create attempt/result endpoints theo order/payment ID | `sp_Payment_CreateAttempt/UpdateResult` | SUPPORTED cho contract, **NOT VERIFIED** nghiệp vụ trong browser baseline. Không double-submit/replay trong lượt này. |
| Account/profile | auth/current user, profile update/password | `sp_User_GetCurrent/UpdateProfile`, auth SP | SUPPORTED. Role immutable; không cho profile sửa role. |
| Complaint Customer | list/create/detail có ownership guard | `sp_Complaint_Create/ListByCustomer/GetByCustomer` | SUPPORTED. Baseline đã xem fixture hiện có; không tạo lại complaint. |

## 6. Ràng buộc staff booking đã đối chiếu trong SP

Customer lookup yêu cầu Customer tồn tại và đủ điều kiện hoạt động; không nhận CustomerID tùy ý từ text UI. Backend/SP kiểm tra actor role, Manager assignment scope, showtime/room/seat, ghế đang giữ/bán, transaction/concurrency, giá snapshot và trạng thái đơn. Create không tự đánh dấu đã thanh toán. Edit chỉ đổi ghế trong điều kiện đơn chờ thanh toán, còn hạn giữ chỗ, chưa có payment history, không có promotion/food/used ticket theo scope đã được chấp thuận trước đây; retained ticket ID/code/price và lịch sử hủy được giữ, ghế thay mới dùng current price. Cancel là nghiệp vụ cancel, không physical delete; paid/used/payment-in-flight không được sửa/hủy theo flow này.

Các điều kiện trên là **source/SP verified**, không phải browser E2E trong UXR-0. Không mở rộng edit sang phim/suất/khuyến mãi/đồ ăn và không thay rule hiện có.

## 7. Known query gaps cần giữ trong kế hoạch

1. Staff options chỉ trả tối đa 200 suất chiếu; response có `TotalMatches`. UI phải làm rõ danh sách bị giới hạn và cho chọn rạp để thu hẹp. Nếu vẫn vượt 200, không thể tuyên bố danh sách đầy đủ; cần quyết định/approval API-SP pagination/date/search.
2. Admin/Manager price filter type/day chưa được backend query truyền qua ở contract đã rà.
3. Admin showtime có rạp/ngày; movie/room query filtering chưa được xác minh.
4. Nhiều catalog/admin lists không có server search/paging trong validator/service đã rà. Chỉ thêm client filters khi có chứng cứ response bounded.
5. Booking DTO dùng trường `DonDatVeID` hiển thị như “Mã đơn”; chưa xác minh đây là business-facing code hay chỉ technical key. Cần quyết định trước khi đổi label/copy hoặc thiết kế search theo “mã đơn”.

## 8. Nguồn code/DB chính để tái xác minh

- API: `backend/src/routes/{adminRoutes,managerRoutes,supportRoutes,staffBookingRoutes,cinemaRoutes,movieRoutes,orderRoutes,complaintRoutes}.js`
- Validators: `backend/src/validators/{adminValidator,staffBookingValidator,catalogValidator,supportValidator}.js`
- Services: `backend/src/services/{adminService,managerService,supportService,staffBookingService,catalogService,orderService}.js`
- Procedure whitelist: `backend/src/db/procedures.js`
- Database procedures: `database/08_procedures/`
- Frontend API clients: `frontend/src/api/`
- Test DB verification: 118/118 procedure names in whitelist resolve; 118 names are not listed individually here because matrix groups them by feature and avoids implying execution tests.


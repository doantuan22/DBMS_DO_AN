# Audit giao diện và frontend CinemaStar

Ngày audit: 15/10/2026  
Phạm vi: rà mã nguồn và chạy frontend thật bằng Edge/Playwright với các tài khoản test cho Khách hàng, Quản lý, CSKH và Admin. Đã duyệt 44 route theo vai trò ở 3 kích thước 1366×900, 768×1024, 390×844 (132 lượt mở trang), quét axe-core WCAG 2.2 A/AA, kiểm tra tràn ngang, vùng nội dung chính, lỗi JavaScript/API 5xx và ảnh bị hỏng; chụp ảnh từng route vào `.audit-output/frontend-page-audit/`.

## Tóm tắt

Đã tái hiện trực tiếp trang tổng quan Manager trắng ở cả ba kích thước. axe-core phát hiện lỗi tương phản trong chat khiếu nại khách hàng và vùng tin nhắn cuộn của CSKH không nhận focus bàn phím. Quét còn cho thấy liên kết khiếu nại bị lặp trên thanh điều hướng khách hàng. Đã xác nhận các route Admin, gồm “Yêu cầu CSKH”, có liên kết trong điều hướng khi được cấp quyền; một số mục nằm thấp trong thanh bên cuộn. Bộ kiểm tra không phát hiện tràn ngang ở 44 route đã quét. Bộ kịch bản nghiệp vụ có sẵn đạt 64/65; kịch bản bàn phím dừng ở bước kiểm tra focus sau khi mở lại trang Phim. Các phát hiện tĩnh trước đó về lọc “Tất cả”, nút tìm lặp, panel chi tiết, chữ nhỏ và thanh lọc dày đặc vẫn cần được xử lý.

## Phát hiện

### P1 — Trang tổng quan Manager bị ẩn sau khi tải dữ liệu

`ManagerPortal` tạo phần tử `#manager-overview` khi dữ liệu dashboard tải thành công. Trong `admin-tailadmin.css`, selector áp `display: none !important` cho phần tử này và cho `.catalog-page` chứa nó. Tuyến vào mặc định của Manager chuyển tới `/manager/overview`, vì vậy nội dung workspace biến mất sau khi tải xong. Đã tái hiện trên trình duyệt ở desktop, tablet và mobile: chỉ còn thanh tiêu đề, vùng nội dung chính trắng. Mở `/manager` cũng chuyển tới cùng trang trắng.

- `frontend/src/pages/ManagerPortal.jsx:303`
- `frontend/src/styles/admin-tailadmin.css:1436`
- Tuyến mặc định: `frontend/src/routes/ManagerSectionRoute.jsx`
- Ảnh: `.audit-output/frontend-page-audit/1366x900/manager-manager_overview.png`, `768x1024/manager-manager_overview.png`, `390x844/manager-manager_overview.png`

### P3 — Trạng thái không có quyền có thể xuất hiện trong khung quản trị

Các tuyến `/admin` và `/manager` chỉ truyền vai trò vào `RequireRole`. Thanh bên và từng tuyến con tiếp tục lọc bằng quyền cụ thể. Nếu phiên có mảng quyền rỗng hoặc thiếu quyền cần thiết, người dùng vẫn có thể vào khung workspace nhưng thanh bên báo chưa được cấp quyền hoặc trang con hiện từ chối.

Tuyến CSKH có cách xử lý khác: yêu cầu `QL_KHIEUNAI` ngay ở tuyến vào. Hồ sơ cá nhân hiện chỉ hiển thị vai trò, không hiển thị danh sách quyền để người dùng hiểu vì sao một chức năng bị chặn.

- `frontend/src/routes/index.jsx:96` — tuyến Manager
- `frontend/src/routes/index.jsx:115` — tuyến CSKH
- `frontend/src/routes/index.jsx:135` — tuyến Admin
- `frontend/src/layouts/AdminShell.jsx:121` — trạng thái thanh bên rỗng
- `frontend/src/routes/AdminSectionRoute.jsx:23` và `frontend/src/routes/ManagerSectionRoute.jsx:20` — kiểm tra quyền ở tuyến chức năng
- `frontend/src/pages/auth/Profile.jsx:140` — trường vai trò trong hồ sơ

Backend ánh xạ `MaQuyen` sang `permissions[].code` tại `backend/src/services/authService.js:35`. Với các tài khoản test trên `CinemaBookingDB_Test`, kịch bản `E2E-RBAC-ROUTES` đã xác nhận bốn vai trò bị chuyển tới `/forbidden` khi mở portal của vai trò khác; ảnh Manager cũng có các mục điều hướng được cấp quyền. Vì vậy chưa tái hiện được lỗi “báo không quyền nhưng vẫn vào được” trên bộ tài khoản test. Nếu tài khoản người dùng đang gặp lỗi lấy quyền từ database khác, cần so sánh phản hồi `/auth/me` của phiên đó với seed quyền tương ứng.

### P2 — Bộ lọc bảng giá coi “Tất cả” như giá trị dữ liệu

Hai dropdown loại ghế và định dạng thêm lựa chọn `Tất cả` như một giá trị thật. `operationsModel.js` so sánh giá trị đã chọn với `row.seatType` và `row.format`; vì vậy chọn “Tất cả” sẽ không khớp các dòng thông thường và bảng có thể rỗng.

- `frontend/src/features/operations/OperationsScreen.jsx:482`
- `frontend/src/features/operations/OperationsScreen.jsx:484`
- `frontend/src/features/operations/operationsModel.js:60`
- `frontend/src/features/operations/operationsModel.js:62`

### P2 — Nút tìm kiếm bị lặp ở màn hình cơ sở vật chất

Trong `FacilityScreen`, hàng tìm kiếm có nút `Tìm` riêng. `FilterBar` cũng tự thêm nút gửi form khi nhận `onApply`. Hai nút thực hiện cùng hành động. Component này dùng chung cho các màn hình cơ sở vật chất.

- `frontend/src/features/facilities/FacilityScreen.jsx:283`
- `frontend/src/features/facilities/FacilityScreen.jsx:298`
- `frontend/src/features/facilities/FacilityScreen.jsx:279`
- `frontend/src/components/ui/FilterBar.jsx:55`
- `frontend/src/components/ui/FilterBar.jsx:64`

### P2 — Xem chi tiết mở panel phía dưới danh sách

Một số thao tác “Xem” chọn một bản ghi rồi render phần chi tiết sau bảng. Người dùng phải cuộn xuống cuối; thao tác không chuyển sang trang chi tiết và không tự đưa tiêu điểm tới nội dung mới. Cách này xuất hiện ở tài nguyên Admin, khiếu nại, vận hành và chi tiết rạp.

- `frontend/src/features/admin-resources/AdminResourceScreen.jsx:587`
- `frontend/src/features/admin-service/AdminComplaints.jsx:222`
- `frontend/src/features/operations/OperationsScreen.jsx:529`
- `frontend/src/features/facilities/FacilityScreen.jsx:563`

### P2 — Liên kết “Tìm phim” mở danh mục, không đưa người dùng tới ô tìm

Thanh điều hướng có mục `Phim` dẫn tới `/movies` và mục `Tìm phim` dẫn tới `/movies?search=`. Liên kết tìm phim không đặt tiêu điểm vào ô tìm kiếm; hai mục vì vậy đưa người dùng tới cùng danh mục với trải nghiệm gần như trùng nhau.

- `frontend/src/layouts/PublicShell.jsx:90`
- `frontend/src/layouts/PublicShell.jsx:145`
- Bộ lọc danh mục phim: `frontend/src/pages/Movies.jsx:65`

### P2 — CSS ẩn mô tả và tiêu đề cấp trang ở nhiều trang Admin/Manager

CSS ẩn breadcrumb và phần mô tả của `PageHeader`. CSS còn ẩn toàn bộ `.ui-page-header` nếu trang không có nút hành động. Thanh tiêu đề trên cùng vẫn hiện khu vực và tên mục đang mở, nên không phải mọi trang đều mất toàn bộ ngữ cảnh; mô tả và tiêu đề cấp nội dung vẫn có thể biến mất.

- `frontend/src/styles/admin-tailadmin.css:1348`
- `frontend/src/styles/admin-tailadmin.css:1353`
- `frontend/src/styles/admin-tailadmin.css:1358`

### P2 — Chữ và nút trong khu vực quản trị nhỏ

Các kiểu dùng chung đặt nhiều phần tử ở cỡ 13 px (`0.8125rem`), nút nhỏ ở 12 px (`0.75rem`), chữ phụ/nhãn ở khoảng 11 px (`0.6875rem`) và dòng nhận diện thương hiệu ở 9.6 px (`0.6rem`). Những cỡ này xuất hiện ở điều hướng, nút thao tác và thông tin phụ, khiến các trang quản trị khó đọc hơn.

- `frontend/src/styles/admin-tailadmin.css:140`
- `frontend/src/styles/admin-tailadmin.css:158`
- `frontend/src/styles/admin-tailadmin.css:554`
- `frontend/src/styles/admin-tailadmin.css:560`

### P2 — Thanh lọc dày đặc và chưa thống nhất giữa các trang

Các định nghĩa bộ lọc của tài nguyên Admin hiển thị đồng thời nhiều tiêu chí. Ví dụ: phân công có tìm kiếm, Manager, rạp, trạng thái và ngày; phim có tìm kiếm, thể loại, trạng thái và khoảng thời lượng; khuyến mãi có tìm kiếm, loại giảm, trạng thái và khoảng ngày. Sản phẩm dùng `ProductFilters` riêng, còn nhiều trang khác dùng `FilterBar`.

CSS ẩn chip tóm tắt các bộ lọc đang áp dụng trong khu vực Admin/Manager. Điều này giảm dấu hiệu nhận biết trạng thái lọc; cách bố trí và hành vi bộ lọc cũng không đồng nhất giữa các loại màn hình.

- `frontend/src/features/admin-resources/resourceModel.js:64`
- `frontend/src/features/admin-resources/resourceModel.js:93`
- `frontend/src/features/admin-resources/resourceModel.js:205`
- `frontend/src/features/admin-resources/ProductFilters.jsx`
- `frontend/src/styles/admin-tailadmin.css:1372`

Trên trang Phim, dropdown thể loại và trạng thái là các tiêu chí riêng. Vấn đề ghi nhận ở đây là phân cấp trình bày chưa rõ, khiến thanh tìm kiếm và các bộ lọc trông như một cụm điều khiển dày đặc.

### P3 — Thanh lọc rỗng xuất hiện khi trang đặt vé tải hoặc gặp lỗi

Nhánh trạng thái khác `success` vẫn render `<FilterBar>` không có trường hay nút nào. CSS chung áp nền, viền và khoảng đệm cho FilterBar, nên có thể xuất hiện một khung trống cạnh thông báo tải/lỗi.

- `frontend/src/features/staff-bookings/StaffBookings.jsx:111`
- `frontend/src/features/staff-bookings/StaffBookings.jsx:117`
- `frontend/src/styles/components.css:626`

### P2 — Chữ trong khung chat khiếu nại không đủ tương phản

Quét axe-core trên trang chi tiết khiếu nại phát hiện `color-contrast` mức serious tại chữ tiêu đề/đếm tin nhắn trong `.support-chat__header` và thông báo rỗng trong `.support-chat__messages`. Ảnh trang cho thấy nội dung chat màu sáng trên nền trắng nên khó đọc. Khung chat đặt nền sáng nhưng kế thừa màu chữ từ giao diện công khai tối; token chữ phụ là `--cp-text-secondary: #b8b8c4`. Node vi phạm cụ thể thay đổi theo trạng thái có tin nhắn hay rỗng. Phát hiện trên desktop, tablet và mobile.

- `frontend/src/features/support/SupportChatBox.jsx:71`
- `frontend/src/features/support/SupportChatBox.jsx:82`
- `frontend/src/features/support/support-chat.css:13`
- `frontend/src/styles/public/public-components.css:300`
- `frontend/src/styles/public/public-tokens.css:17`
- Ảnh desktop: `.audit-output/frontend-page-audit/1366x900/customer-complaints_75.png`

### P2 — Vùng tin nhắn CSKH cuộn được nhưng không nhận focus bàn phím

Ở chi tiết khiếu nại trong portal CSKH, `.support-chat__messages` có chiều cao tối đa và `overflow-y: auto`. axe-core báo `scrollable-region-focusable` mức serious: người dùng bàn phím không thể focus vùng cuộn để đọc hết hội thoại. Component có `role="log"` nhưng không đặt `tabIndex` cho vùng này.

- `frontend/src/features/support/SupportChatBox.jsx:78`
- `frontend/src/features/support/support-chat.css:40`
- Ảnh desktop: `.audit-output/frontend-page-audit/1366x900/support-support_complaints_75.png`

### P2 — Mục “Khiếu nại” bị lặp trong điều hướng khách hàng

Trên trang `/complaints/:complaintId`, `AreaLayout` truyền liên kết Khiếu nại trong danh sách điều hướng riêng; `PublicShell` thêm liên kết Khiếu nại lần nữa cho mọi khách hàng đã đăng nhập. Trình duyệt hiển thị hai liên kết cùng nhãn và cùng đích trên thanh điều hướng.

- `frontend/src/routes/index.jsx:80`
- `frontend/src/layouts/PublicShell.jsx:149`
- Ảnh: `.audit-output/frontend-page-audit/1366x900/customer-complaints_75.png`

### P2 — Kịch bản bàn phím không vượt qua bước kiểm tra focus liên kết bỏ qua

Kịch bản `E2E-A11Y-KEYBOARD` thực hiện được thao tác chọn ghế bằng phím mũi tên/Space, nhưng thất bại sau khi chuyển từ đặt vé sang `/movies`: lần nhấn Tab đầu tiên cho phần tử đang focus không có nội dung chữ; kịch bản kỳ vọng liên kết “Chuyển đến nội dung chính”. Liên kết này có trong `PublicShell`, nên cần kiểm tra trình tự focus thực tế và khả năng đây là sai lệch giữa hành vi với kiểm tra tự động. Đây là lỗi của đường đi bàn phím được quan sát, chưa xác nhận được nguyên nhân chính xác.

- `frontend/src/layouts/PublicShell.jsx:103`
- `scripts/audit/browser-scenarios-hardening.mjs` — kịch bản `E2E-A11Y-KEYBOARD`
- Kết quả lần chạy toàn bộ: `.audit-output/acceptance/browser-e2e-full.json` (64 PASS, 1 FAIL)

## Màn hình đã chạy

| Vai trò | Route đã mở trên mỗi kích thước |
|---|---|
| Công khai | `/`, `/movies`, `/movies/:movieId`, `/cinemas`, `/cinemas/:cinemaId`, `/booking/:showtimeId`, `/login`, `/register`, `/forbidden` |
| Khách hàng | `/account`, `/profile`, `/orders`, `/orders/:orderId`, `/orders/:orderId/payment`, `/complaints`, `/complaints/:complaintId` |
| Quản lý | `/manager`, `/manager/overview`, `/manager/rooms`, `/manager/seats`, `/manager/showtimes`, `/manager/pricing`, `/manager/bookings`, `/manager/revenue` |
| CSKH | `/support/complaints`, `/support/complaints/:complaintId` |
| Admin | `/admin/overview`, `/admin/access/users`, `/admin/access/assignments`, `/admin/catalog/movies`, `/admin/catalog/genres`, `/admin/catalog/actors`, `/admin/commerce/products`, `/admin/commerce/promotions`, `/admin/cinemas`, `/admin/cinemas/images`, `/admin/facilities/rooms`, `/admin/facilities/seats`, `/admin/operations/showtimes`, `/admin/operations/pricing`, `/admin/bookings`, `/admin/service/complaints`, `/admin/service/escalations`, `/admin/reports/revenue` |

## Bản đồ bộ lọc đã rà soát

| Khu vực | Tiêu chí đang có | Ghi chú audit |
|---|---|---|
| Danh mục phim | Từ khóa, thể loại, trạng thái | Liên kết `Tìm phim` chưa focus ô từ khóa và trùng đích với mục `Phim`. |
| Danh sách rạp | Từ khóa, thành phố | Màn hình rạp/cơ sở vật chất có nút tìm lặp do có nút trong hàng tìm và nút tự sinh từ FilterBar. |
| Tài khoản Admin | Từ khóa, vai trò, trạng thái | Các tiêu chí hiển thị trực tiếp cùng nhau. |
| Phân công Admin | Từ khóa, Manager, rạp, trạng thái, ngày hiệu lực | Thanh lọc nhiều trường. |
| Phim Admin | Từ khóa, thể loại, trạng thái, thời lượng tối thiểu/tối đa | Thanh lọc nhiều trường. |
| Diễn viên/thể loại | Diễn viên: từ khóa và phim; thể loại: từ khóa | Bộ lọc đơn giản hơn các danh mục khác. |
| Sản phẩm Admin | Từ khóa, loại, trạng thái, khoảng giá | Dùng giao diện bộ lọc riêng. |
| Khuyến mãi Admin | Từ khóa, loại giảm, trạng thái, khoảng ngày | Thanh lọc nhiều trường. |
| Suất chiếu | Phòng, phim, khoảng ngày, trạng thái | Bộ lọc chọn danh mục và ngày. |
| Bảng giá | Loại ghế, loại ngày, định dạng, trạng thái, ngày hiệu lực | Lựa chọn `Tất cả` ở loại ghế/định dạng bị xử lý như giá trị thật. |
| Đặt vé/CSKH | Tìm kiếm kết hợp trạng thái, loại hoặc ưu tiên tùy màn hình | FilterBar rỗng ở nhánh tải/lỗi của trang đặt vé. |

## Phạm vi và giới hạn

Đã chạy trình duyệt Edge/Playwright với frontend React và backend Express thật, dùng database `CinemaBookingDB_Test`. Bộ quét duyệt 44 route theo vai trò ở desktop/tablet/mobile, gọi axe-core WCAG 2.2 A/AA, đo tràn ngang, kiểm tra nội dung chính, lỗi JavaScript/API 5xx, ảnh cùng origin app/API bị hỏng và lưu ảnh từng route tại `.audit-output/frontend-page-audit/`. Mỗi kích thước đều ghi nhận bốn phát hiện: khung chat khiếu nại vi phạm tương phản, vùng tin nhắn CSKH không nhận focus bàn phím và dashboard Manager không có nội dung trên cả `/manager/overview` lẫn đường vào `/manager`. Không phát hiện tràn ngang, lỗi JavaScript, API 5xx hoặc ảnh lỗi cùng origin trong 44 route. Kiểm tra route Admin xác nhận trang escalations có liên kết trong điều hướng được cấp quyền.

Kịch bản trình duyệt nghiệp vụ gần nhất có sẵn trong repo (14/10/2026) đạt 64/65; kịch bản còn lại dừng ở bước kiểm tra focus bàn phím trên `/movies`. Kịch bản RBAC chuyển đúng bốn vai trò test ra khỏi portal của vai trò khác; điều này chưa xác nhận tài khoản trên database mà người dùng đang chạy. Các thao tác tạo dữ liệu của bộ nghiệp vụ chỉ được phép vào `CinemaBookingDB_Test`; lượt quét 44 route dùng các trang và truy vấn fixture để hiển thị.

Đây là audit các route và luồng đại diện trong mã nguồn hiện tại, không thể bao phủ mọi tổ hợp dữ liệu, thông báo lỗi API, trạng thái tải dài, trình duyệt và cỡ màn hình. Chính sách mạng của môi trường audit chặn một số tài nguyên ngoài mạng (`ERR_NETWORK_ACCESS_DENIED`), nên tình trạng tải ảnh/poster/font từ host bên ngoài không được tính là lỗi ứng dụng; chỉ lỗi JavaScript, API 5xx và ảnh cùng origin app/API mới được ghi nhận. Các phát hiện ở trạng thái chờ/lỗi bộ lọc và panel chi tiết được nhận diện từ nhánh render mã nguồn; cần kiểm thử thêm với dữ liệu lỗi/mạng chậm trước khi sửa để chốt hành vi hiển thị.

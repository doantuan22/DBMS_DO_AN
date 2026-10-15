# Audit UI/UX Frontend CinemaStar — Mở rộng toàn Role (Read-only)

> Ngày audit: 16/10/2026
> Phạm vi: chỉ đọc + phân tích tĩnh `frontend/src`. Không sửa code/config. Không có browser automation, chưa chạy `npm run dev`.
> Đối chiếu: Filmgrail 25-checks Cinema Checkout, Baymard Event Ticketing, chuẩn SaaS dashboard 2025.
> File liên quan trước đó: `docs/audit/FRONTEND_UI_AUDIT.md` (audit trình duyệt 44 route 15/10/2026).

## 1. Cấu trúc Frontend đã đọc hiểu

### 1.1 Stack và layers

- `React 19 + Vite + react-router-dom 7`, SPA, CSS thuần theo layers.
- `routes/index.jsx + adminSectionRoutes.js + managerSectionRoutes.js`.
- Layouts: `PublicShell (=AreaLayout) | StaffShell | AdminShell | AdminLayout | ManagerLayout | ProfileLayout`.
- Pages: Home, Movies, MovieDetail, Cinemas, CinemaDetail, BookingPreparation, Orders, OrderDetail, PaymentPage, Complaints, ComplaintDetail, auth/Login/Register/Profile, CustomerArea, ManagerPortal, AdminPortal, SupportPortal, Forbidden, NotFound.
- UI primitives: Button, Input, Select custom+native, FormField, PageHeader, Breadcrumbs, DataTable/ResourceTable, FilterBar, AsyncState, Dialog, ConfirmDialog, StatusBadge.
- Features: public (Billboard, FilmRail, DateRail, SeatMapPanel...), customer (BookingExperience, CinemaSchedule, AuthFrame, MediaFrame...), admin-*, manager, support, staff-bookings, operations, facilities.
- Styles: `legacy.css + tokens.css + base.css + shell.css + components.css + admin-tailadmin.css + public/*.css`.

### 1.2 Ba visual language cùng tồn tại

1. `cinema-public` dark `#101015`, accent đỏ `#e50914`, font `Cinema Inter`.
2. `staff-shell--admin/manager` TailAdmin chàm `#465fff`, toggle `localStorage`, font `Plus Jakarta Sans`.
3. Legacy generic xanh `#2563eb`.

Thứ tự import `index.css`: `legacy -> tokens -> base -> shell -> components -> admin-tailadmin`. Public phải dùng `!important` để thắng cascade — nợ specificity cao.

### 1.3 Routes đã lập bản đồ

`/ | /movies, /movies/:id | /cinemas, /cinemas/:id | /booking/:showtimeId | /login,/register | /orders, /orders/:id, /orders/:id/payment | /complaints, /complaints/:id | /profile | /customer | /manager/* | /admin/* 17 sections | /support/* | /forbidden, *`
## 2. Kỹ thuật thiết kế chuẩn đã đối chiếu

### 2.1 Web đặt vé (Filmgrail + Baymard + CGV/Lotte/Megabox)

## 3. Audit Public / Guest

Điều hướng: `routes/index.jsx:35-40` PUBLIC_LINKS 3 mục. `/orders` và `/complaints` dùng AreaLayout khác nhau nên mất Phim/Rạp. Footer `PublicShell.jsx:214-224` conditional theo role. Guest không thấy Khiếu nại/Hồ sơ.

Chức năng: CTA `FeaturedBillboard.jsx:42 href="#home-schedule"` chết vì `Home.jsx` không có id. `Movies.jsx:88-92` auto debounce 350ms, `Cinemas.jsx:55-64` explicit Tìm rạp + cảnh báo chưa áp dụng — 2 mental model. `MovieGrid.jsx:5-6 + FilmRail.jsx:6-7` tách artwork/missing thành block text Chưa có poster.

Hiển thị: Billboard h1 clamp 52-96px, mobile 48px quá lớn ở 320px. `movie-card__action opacity 0->1` chỉ hover/focus-within nên touch khó phát hiện. Giá `ShowtimeTimeChip.jsx:20` và `BookingExperience.jsx:299-302` ghi khi tải / tại thời điểm tải, không timestamp.

Thanh lọc: thiếu format/2D/3D/phụ đề/ngôn ngữ/wheelchair. UpcomingDates aside chiếm cột, mobile đẩy list dài.

## 5. Audit Manager

Điều hướng: `managerNavigation.js` 3 nhóm gọn, AdminShell collapse + Ctrl+K + theme tốt. `ManagerSectionRoute.jsx:12-17` entry redirect theo hash + quyền tốt. Nhưng `ManagerPortal.jsx:40-66` khi routeSection null render dồn tất cả panels nên trang dài vô tận.

Chức năng: `ManagerLayout.jsx:28-109` ManagerCinemaProvider + sessionStorage + ConfirmDialog khi đổi rạp dirty là pattern tốt nhất. Operations/Facility manager dùng ul/li + button Sửa/Hủy thô, không table như Admin. StaffBookings manager dính bug detail cuối trang như Admin.

Hiển thị: Select Rạp hiện tại lặp lại mọi màn. ManagerRevenue cache tốt. Bảng giá nối chuỗi 1 dòng khó quét.

Thanh lọc: pricingStatus filter local, không sync URL. Không saved view, không export.

## 6. Audit Admin — Xem chi tiết đơn đẩy xuống cuối trang

## 7. Audit Support + Auth/Shell chung

Support là pattern tốt nhất để nhân rộng: panes, placeholder Chọn một hồ sơ, Link Về hàng chờ, PageHeader breadcrumbs. Filter search/status/priority/type ổn, maxLength 100. Nặng nhận thức vì aside dồn Thêm diễn biến + Đổi trạng thái + Claim. Filter type bắt nhập chính xác nên khó dùng. Chat role=log aria-live tốt nhưng thiếu unread badge.

Auth/Shell: thiếu Quên mật khẩu. `AuthFrame.jsx:23-30` ảnh auth-seats.jpg + font InterVariable.woff2 cần verify 404. MutationObserver focus aria-invalid mỗi mutation dễ cướp focus. `Register.jsx:105` ghi byte UTF-8 rò rỉ kỹ thuật. Breakpoints 480/560/600/640/768/800/900/960/1200 loạn. Contrast đỏ #e50914 ~4.0, chàm #465fff ~4.3 fail AA text nhỏ. Select dual native hidden + custom listbox nguy cơ double focus.

Điểm cộng A11y: skip-link 3 shells, focus-visible vàng #ffd166 trên dark, aria-pressed ghế/ngày, role status/alert/log, arrow-key seatmap, prefers-reduced-motion.

## 8. Tổng hợp từ nhỏ đến nặng nhất

## 9. Hướng chỉnh sửa tối ưu (đề xuất, chưa code)

Pha 1 quick wins 1-2 tuần: unify tokens, xóa legacy seat/button cũ, gộp catalog-button vào ui-button, bỏ !important; persist ghế qua login bằng sessionStorage, thêm aria-describedby cho nút Đặt vé, sửa anchor #home-schedule; sửa copy demo/mô phỏng/byte, thêm Cập nhật lúc HH:MM:SS + breakdown; nâng contrast đỏ, action card visible trên touch; thống nhất PUBLIC_LINKS + footer; bookings tối thiểu scrollIntoView + focus + scroll-margin-top 96px + highlight row + breadcrumb Đơn #X + persist search.

Pha 2 structural 1 tháng: booking funnel 5 bước có stepper Ghế > Bắp nước/KM/Điểm > Xác nhận fee + hold 10:00 > Vé QR offline + Wallet; guest chọn ghế, login ở Confirm; trailer modal inline; filter format/sub/wheelchair + JSON-LD; payment label Việt, failed giữ ghế; bookings drawer inspector phải + ?orderId + focus h2 Đơn #X + tabs Vé/Thanh toán/Sản phẩm hoặc nested route /bookings/:orderId; Admin IA gọn 8 nhóm + saved filter + bulk + export; Manager vào showtimes hôm nay; 1 design-system + breakpoints 360/768/1280 + skeleton + 1 mô hình filter.

Pha 3 strategic: loyalty + giftcard partial; realtime ghế/occupancy/SLA; A11y AA NVDA/VoiceOver + keyboard-only + focus trap; đo funnel view > select > create > pay, abandonment khi login, time-to-book mobile.

Ma trận: mất ghế Rất cao/Thấp/Pha1; detail cuối trang Rất cao/Trung bình/Pha1-2; search persist Trung bình/Thấp/Pha1; CTA chết Cao/Thấp/Pha1; 2 SeatMap/Button Cao/Trung bình/Pha1-2; giá khi tải Cao/Trung bình/Pha2; guest checkout Rất cao/Cao/Pha2-3; QR offline Cao/Cao/Pha3.

## 10. Checklist mở trình duyệt thủ công

Home CTA > Movies search/sort > MovieDetail ngày/rạp > Booking ghế/zoom/keyboard > Login giữa booking > Orders/Payment đếm ngược > Complaints chat 4s > Admin ít quyền > Manager đổi rạp khi dirty > Support filter email dài. Test Tab/Shift+Tab/Escape, reduced-motion, contrast text nhỏ trên đỏ/chàm. Vào /admin/bookings bấm Xem chi tiết dòng đầu: URL đổi ?orderId= nhưng viewport đứng yên, phải cuộn manual xuống cuối mới thấy staff-bookings__detail.

Cosmetic C1-C5: copy demo/kỹ thuật (Ảnh minh họa rạp demo, mô phỏng, byte, MaVaiTro); tone marketing vs formal + footer English; 2 hệ thống nút catalog-button/ui-button + !important; 2 hệ thống empty/error; 9 breakpoints + h1 52-96px + overflow-x clip che tràn.

Minor M1-M9: CTA billboard chết #home-schedule; phim thiếu poster thành block text; 2 mô hình lọc auto vs explicit; giá khi tải không timestamp; search bookings không persist; filter type CSKH bắt nhập chính xác; Profile Input readOnly + thiếu quên pass; Manager overview dồn panels + context lặp; thiếu skeleton, empty không CTA.

Major J1-J8: detail bookings cuối trang không scroll/focus/highlight (admin+manager); 2 SeatMap + 2 CSS seat; nút Đặt vé disabled 6 điều kiện không lý do; promo silent reset khi loadSeats; action card hover-only + Select dual + contrast fail + timer trùng; Admin 17 mục + table hàng cao + 3 table lồng, không virtualized; trailer new-tab + thiếu JSON-LD + thiếu filter format/sub/wheelchair; thiếu QR offline/wallet + fee breakdown + failed giữ ghế.

Blocker P0-1: mất ghế khi buộc login do key=showtimeId:scope remount khi userId đổi, không guest checkout.
Blocker P0-2: staff bấm Xem chi tiết tưởng không có gì vì viewport đứng yên, URL đổi ?orderId= nhưng phải cuộn manual xuống cuối.

Luồng `StaffBookings.jsx:306-473`: PageHeader + notice + FilterBar + count + ResourceTable 7 cột 20 dòng + div.staff-bookings__workspace SAU table chứa BookingDetail + BookingEditor + ConfirmDialog.

Nút `StaffBookings.jsx:272-280` gọi showOrder. `bookingController.js:331 + 209-214` chỉ emit selectedId + url ?orderId= + loadDetail, không route mới, không scrollIntoView, không focus. CSS `staff-bookings.css:51-65` mặc định 1fr dọc, chỉ editing mới 2 cột. `BookingDetail.jsx:18-155` rất cao vì 3 nested ResourceTable + totals + help.

Đối chứng tốt: `SupportWorkspaceView.jsx:75` grid 3 pane Hàng chờ | Hồ sơ | Thao tác cạnh nhau + placeholder.

Vi phạm: Visibility of system status, Recognition vs Recall, lạc focus keyboard/screen-reader. Breadcrumb không có Đơn #ID. Không scroll-margin-top dưới sticky header 5rem.

Hiển thị: ResourceTable/DataTable có caption/region/pagination aria-live chuẩn. Cột Phim/Suất/Rạp 3 dòng làm hàng cao nên khoảng cách nút tới detail càng xa. Detail 3 table con gây table lồng table. AdminPortal table legacy Object.keys hiện MaVaiTro/TrangThai thô, song song AdminResourceScreen chuẩn. Chart CSS thuần không tooltip.

Thanh lọc: FilterBar draft/applied/chips chuẩn. Nhưng `bookingModel.js:19-31` applied.search luôn rỗng, bookingQuery không serialize search nên F5/share mất search. Thiếu filter ngày/tiền/KM, bulk, export.

## 4. Audit Customer

Điều hướng: `AccountNavigation.jsx:4-9` 3 tabs + `CustomerArea.jsx:5-10` 4 shortcuts chồng nhau. Breadcrumb đủ ở Orders/OrderDetail nhưng CustomerArea không có.

Chức năng: `BookingPreparation.jsx:37-43 key=showtimeId:scope` với scope=userId+permissions nên guest chọn ghế xong login remount mất selectedSeatIds (P0). `BookingExperience.jsx:323-333` + mobile bar disabled 6 điều kiện không aria-describedby. `PaymentPage.jsx:249` title mô phỏng, METHODS cứng label thô, check success bằng includes Đã mong manh. `OrderDetail + PaymentPage` 2x setInterval 1s trùng. Complaints textarea thô không counter. ComplaintDetail polling 4s không typing, không auto-scroll. Empty không CTA.

Hiển thị: summary sticky top 108px desktop, mobile static + fixed bottom-bar padding-bottom 104px dễ che footer. StatusBadge tốt. Profile `Profile.jsx:283-297` dùng Input readOnly cho Email/Vai trò/Trạng thái nên trông như editable.

Thanh lọc: `Orders.jsx:66-100` FilterBar search/status tốt, có role=status count. Movies empty không gợi ý xóa lọc.

- Home = Billboard 1 phim + rail Đang chiếu/Sắp chiếu + Lịch theo ngày + Cụm rạp gần bạn. Hero 2 CTA: Đặt vé ngay + Xem trailer inline, không đẩy sang YouTube.
- Movies = Search + Filter status/genre/city/format auto-apply + sort popular/newest, skeleton card, empty có CTA.
- MovieDetail + Showtime = Rạp > Ngày rail > Giờ chip. Chip hiện giờ + format + phòng + giá cơ bản + ghế trống + sắp hết. Ngày quá khứ disable, mặc định today.
- SeatMap = đúng mặt bằng thật, hàng + lối đi, legend Trống/Đang chọn/Đã bán/Giữ/VIP/Couple/Wheelchair. 1 tay trên phone: zoom + pan + nút mũi tên, target >=44px, arrow-key keyboard. Giá ngay trên ghế, counter Đã chọn 2/8, hold timer.
- Combo/Promo/Points = stepper -/+, max/product, subtotal live, promo inline báo được giảm X, điểm minh bạch.
- Checkout = guest checkout, pay cùng domain, local wallets, giftcard partial, failed pay giữ ghế, total gồm fee trước pay, vé ngay + offline + add wallet, confirmation có hall/giờ/seat/address.

### 2.2 Trang quản trị (SaaS dashboard 2025)

- Sidebar nhóm theo domain, search Ctrl+K, collapse, dark mode, breadcrumb + context Rạp hiện tại.
- ResourceTable + FilterBar + Pagination + Dialog editor + ConfirmDialog + AsyncState loading/empty/403/404/409.
- Metric trước, filter không quá 3 click, action visible, mobile usable.
- Master-detail 2-3 pane cho CSKH/booking, drawer inspector cho chi tiết, focus trap + ESC.


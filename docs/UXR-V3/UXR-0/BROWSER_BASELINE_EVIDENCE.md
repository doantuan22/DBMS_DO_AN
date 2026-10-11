# UXR-V3 / UXR-0 — Browser Baseline Evidence

## 1. Môi trường và cách chạy

- Browser: Microsoft Edge headless qua CDP automation tương đương Playwright/browser runner hiện có trong repo audit scratch.
- Frontend và backend chạy tạm cho lượt audit, backend trỏ tới **isolated R0 staff-booking test DB**; preflight xác nhận DB identity/physical target tách main. Không chạy reset, seed, migration hoặc production workflow.
- Bốn role đăng nhập: Admin, Manager, CSKH, Customer. Credentials/tokens không được ghi vào báo cáo hoặc screenshot được xuất.
- Route baseline mở trực tiếp/qua app; thao tác chủ yếu là navigation, đọc, đổi filter, mở detail và chọn ghế UI. Không replay create/cancel/payment hoặc ghi DB business state; complaint fixture/event có sẵn được tái sử dụng, không tạo fixture mới.
- Viewports: 390, 768, 1280, 1440, 1920 px. Đây là viewport automation, không phải thiết bị vật lý.

## 2. Kết quả runner

| Hạng mục | Kết quả quan sát | Diễn giải |
|---|---:|---|
| Browser checks | 72 total; 69 `VERIFIED`, 3 `OBSERVED` | Phân loại runner, không phải 72 Use Case. |
| Network/API request records | 760 | 378 status 200, 319 status 304, 63 không có final status trong record. |
| HTTP API failure >=400 | 0 ghi nhận | Không chứng minh mutation/business flow thành công. |
| Aborted response | 0 | Trong runner log hiện có. |
| JavaScript runtime exceptions | 0 | Trong phiên browser baseline hiện có. |
| Console errors | 64 | 45 lỗi tải `fonts.googleapis.com`, 19 lỗi tải `images.unsplash.com`; Edge environment trả `ERR_NETWORK_ACCESS_DENIED`. Chưa kết luận là defect trên network-permitted environment. |
| Accessibility | Smoke בלבד | Không chạy axe, screen reader hoặc full WCAG 2.2 AA verification. |
| UI test/lint/build | Không chạy trong UXR-0 | Không sửa code; đây không phải kết quả PASS. |

`63` request không có trạng thái kết thúc được giữ ở mức “không quan sát được”. Không tính chúng là success/failure. Requests thiếu status không được dùng để kết luận route data hoàn chỉnh.

## 3. Route/workspace coverage

### Public/Customer

Đã mở public home, movies list/detail, cinemas list/detail, login, register, forbidden, not-found, booking preparation, profile/account, order list/detail/payment, complaints list/detail. Booking screen có thao tác chọn ghế local; không submit booking/payment.

Customer home và shell/layout responsive được chụp ở đủ năm viewport. DatabaseHealth card được chụp ở 390 và 1440 để lưu baseline finding; tại 390, `documentElement.scrollWidth=375`, nhưng `bodyWidth=401` (overflow finding cần xác minh isolation trong UXR-1B).

### Admin

Đăng nhập và duyệt 16 section legacy hiện hành cùng `/admin/bookings`; có ảnh dashboard, section, booking list và shell. Admin shell được chụp tại năm viewport; drawer mở ở 390.

### Manager

Đăng nhập và duyệt overview/dashboard, rooms, seats (dùng resource room có sẵn), showtimes, pricing, revenue và `/manager/bookings`. Manager shell được chụp tại năm viewport. Fixture không có Manager đơn lẻ với hai cinema assignment để chứng minh A→B context switching.

### CSKH

Duyệt queue, case detail/timeline, linked order reference state, filter change sau tương tác với case, và ảnh sau event đã tồn tại. Dùng complaint fixture hiện có; không thêm processing mới. Draft/filter state rủi ro được ghi nhận từ V2; phiên này không replay toàn bộ negative paths để chứng minh guard.

### Responsive coverage

| Viewport (PNG width) | Số ảnh | Evidence / phạm vi |
|---:|---:|---|
| 390 | 6 | Customer home, Admin/Manager/CSKH shells, mobile drawer, health card. |
| 768 | 4 | Customer home và ba staff shells. |
| 1280 | 4 | Customer home và ba staff shells. |
| 1440 | 9 | Customer home, Admin/Manager/CSKH shells, CSKH queue/detail/timeline, health card. |
| 1920 | 48 | Các route/module screenshots còn lại: toàn bộ Admin legacy sections + bookings, Manager sections + bookings, public/customer routes; home/shell 1920 captures. |

PNG metadata was checked. Twenty-two source filenames carried a legacy `-1440` suffix although the actual image width was 1920; those copies were renamed with `-1920`. Other route captures without a width suffix are counted by image metadata above. **Không** tuyên bố toàn bộ route được đo ở cả năm chiều rộng. Mọi implementation slice sau phải lặp lại 5-width checks cho screen cụ thể.

## 4. Ảnh tiêu biểu

- Public/customer home: [390](screenshots/customer-home-390.png), [768](screenshots/customer-home-768.png), [1440](screenshots/customer-home-1440.png), [1920](screenshots/customer-home-1920.png)
- Customer booking: [seat selection](screenshots/customer-booking-seat-selected-1920.png), [booking screen](screenshots/customer-booking-1920.png), [order payment](screenshots/customer-order-payment-1920.png)
- Admin: [shell 390](screenshots/admin-shell-390.png), [shell 1440](screenshots/admin-shell-1440.png), [legacy accounts](screenshots/admin-module-02-t-i-kho-n.png), [booking workspace](screenshots/admin-bookings-1920.png)
- Manager: [shell 390](screenshots/manager-shell-390.png), [shell 1440](screenshots/manager-shell-1440.png), [booking workspace](screenshots/manager-bookings-1920.png), [seat section](screenshots/manager-manager-seats-1791719030369.png)
- CSKH: [queue](screenshots/support-queue-1440.png), [case timeline](screenshots/support-case-timeline-1440.png), [after existing processing](screenshots/support-timeline-after-processing-1440.png)
- Responsive finding: [DatabaseHealth at 390](screenshots/customer-home-health-card-390.png), [1440](screenshots/customer-home-health-card-1440.png)

## 5. Safety and privacy

The top-right account/operator identity area is masked in 52 authenticated staff/customer screenshots where that identity is visible at the captured width; narrow mobile captures that show only controls do not need this mask. In addition, 18 report screenshots mask customer/account fields such as names, emails, phone numbers, profile values, a payment reference or the internal database label in the diagnostic card. The two health-card images and the 390px home capture keep the public diagnostic panel visible while masking its DB identity value. Other redaction rectangles can cover adjacent labels or part of a row; use these images as evidence of layout/state, not exact column wording. The index below links only to sanitized copies. No login credentials, passwords, bearer tokens or cookies are included.

## 6. Evidence index (71 PNG files)

- [admin-bookings-1920.png](screenshots/admin-bookings-1920.png)
- [admin-dashboard-1920.png](screenshots/admin-dashboard-1920.png)
- [admin-mobile-nav-open-390.png](screenshots/admin-mobile-nav-open-390.png)
- [admin-module-01-t-ng-quan.png](screenshots/admin-module-01-t-ng-quan.png)
- [admin-module-02-t-i-kho-n.png](screenshots/admin-module-02-t-i-kho-n.png)
- [admin-module-03-ph-n-c-ng.png](screenshots/admin-module-03-ph-n-c-ng.png)
- [admin-module-04-r-p.png](screenshots/admin-module-04-r-p.png)
- [admin-module-05--nh-r-p.png](screenshots/admin-module-05--nh-r-p.png)
- [admin-module-06-ph-ng.png](screenshots/admin-module-06-ph-ng.png)
- [admin-module-07-gh-.png](screenshots/admin-module-07-gh-.png)
- [admin-module-08-phim.png](screenshots/admin-module-08-phim.png)
- [admin-module-09-th-lo-i.png](screenshots/admin-module-09-th-lo-i.png)
- [admin-module-10-di-n-vi-n.png](screenshots/admin-module-10-di-n-vi-n.png)
- [admin-module-11-s-n-ph-m.png](screenshots/admin-module-11-s-n-ph-m.png)
- [admin-module-12-khuy-n-m-i.png](screenshots/admin-module-12-khuy-n-m-i.png)
- [admin-module-13-b-ng-gi-.png](screenshots/admin-module-13-b-ng-gi-.png)
- [admin-module-14-su-t-chi-u.png](screenshots/admin-module-14-su-t-chi-u.png)
- [admin-module-15-khi-u-n-i.png](screenshots/admin-module-15-khi-u-n-i.png)
- [admin-module-16-doanh-thu.png](screenshots/admin-module-16-doanh-thu.png)
- [admin-shell-1280.png](screenshots/admin-shell-1280.png)
- [admin-shell-1440.png](screenshots/admin-shell-1440.png)
- [admin-shell-1920.png](screenshots/admin-shell-1920.png)
- [admin-shell-390.png](screenshots/admin-shell-390.png)
- [admin-shell-768.png](screenshots/admin-shell-768.png)
- [customer--account-1920.png](screenshots/customer--account-1920.png)
- [customer-booking-1920.png](screenshots/customer-booking-1920.png)
- [customer-booking-seat-selected-1920.png](screenshots/customer-booking-seat-selected-1920.png)
- [customer-complaint-created-1920.png](screenshots/customer-complaint-created-1920.png)
- [customer-complaint-detail-1920.png](screenshots/customer-complaint-detail-1920.png)
- [customer--complaints-1920.png](screenshots/customer--complaints-1920.png)
- [customer-home-1280.png](screenshots/customer-home-1280.png)
- [customer-home-1440.png](screenshots/customer-home-1440.png)
- [customer-home-1920.png](screenshots/customer-home-1920.png)
- [customer-home-390.png](screenshots/customer-home-390.png)
- [customer-home-768.png](screenshots/customer-home-768.png)
- [customer-home-health-card-1440.png](screenshots/customer-home-health-card-1440.png)
- [customer-home-health-card-390.png](screenshots/customer-home-health-card-390.png)
- [customer-order-detail-1920.png](screenshots/customer-order-detail-1920.png)
- [customer-order-payment-1920.png](screenshots/customer-order-payment-1920.png)
- [customer--orders-1920.png](screenshots/customer--orders-1920.png)
- [customer--profile-1920.png](screenshots/customer--profile-1920.png)
- [manager-bookings-1920.png](screenshots/manager-bookings-1920.png)
- [manager-dashboard-1920.png](screenshots/manager-dashboard-1920.png)
- [manager-manager-overview-1791719028375.png](screenshots/manager-manager-overview-1791719028375.png)
- [manager-manager-pricing-1791719032249.png](screenshots/manager-manager-pricing-1791719032249.png)
- [manager-manager-revenue-1791719033185.png](screenshots/manager-manager-revenue-1791719033185.png)
- [manager-manager-rooms-1791719029307.png](screenshots/manager-manager-rooms-1791719029307.png)
- [manager-manager-seats-1791719030369.png](screenshots/manager-manager-seats-1791719030369.png)
- [manager-manager-showtimes-1791719031304.png](screenshots/manager-manager-showtimes-1791719031304.png)
- [manager-shell-1280.png](screenshots/manager-shell-1280.png)
- [manager-shell-1440.png](screenshots/manager-shell-1440.png)
- [manager-shell-1920.png](screenshots/manager-shell-1920.png)
- [manager-shell-390.png](screenshots/manager-shell-390.png)
- [manager-shell-768.png](screenshots/manager-shell-768.png)
- [public--audit-v2-not-found-1920.png](screenshots/public--audit-v2-not-found-1920.png)
- [public--cinemas-1920.png](screenshots/public--cinemas-1920.png)
- [public--cinemas-3-1920.png](screenshots/public--cinemas-3-1920.png)
- [public--forbidden-1920.png](screenshots/public--forbidden-1920.png)
- [public--login-1920.png](screenshots/public--login-1920.png)
- [public--movies-1-1920.png](screenshots/public--movies-1-1920.png)
- [public--movies-1920.png](screenshots/public--movies-1920.png)
- [public--register-1920.png](screenshots/public--register-1920.png)
- [support-case-timeline-1440.png](screenshots/support-case-timeline-1440.png)
- [support-filter-changed-1440.png](screenshots/support-filter-changed-1440.png)
- [support-queue-1440.png](screenshots/support-queue-1440.png)
- [support-shell-1280.png](screenshots/support-shell-1280.png)
- [support-shell-1440.png](screenshots/support-shell-1440.png)
- [support-shell-1920.png](screenshots/support-shell-1920.png)
- [support-shell-390.png](screenshots/support-shell-390.png)
- [support-shell-768.png](screenshots/support-shell-768.png)
- [support-timeline-after-processing-1440.png](screenshots/support-timeline-after-processing-1440.png)






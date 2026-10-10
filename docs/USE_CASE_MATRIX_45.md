# Use Case Matrix — 45 UC

**Current R8.3 — PARTIAL, PHASE R8 NOT ACCEPTED (10/10/2026).** Database/Backend 45 PASS; Frontend/Overall **44 PASS / 0 PARTIAL / 1 BROKEN / 0 MISSING**. ADM-07 BROKEN do R83-FE-01/R83-FE-02; 42/43 Frontend gaps được nghiệm thu, R71-FE-ADM-07 REOPENED. [Báo cáo nghiệm thu](R8_3_FINAL_ACCEPTANCE_REPORT.md); [Per-UC audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json).

Các mô tả/evidence/rationale R7 bên dưới là lịch sử theo ngày ghi trong tài liệu; những số liệu 2 PASS/43 PARTIAL và MAIN_DB_DEPLOYMENT_PENDING mô tả checkpoint R7.3, không phải trạng thái R8.3. Source/backend/main hiện hành được đối chiếu trong fresh R8.3 audit. Bảng counts, matrix 45 dòng và runtime table từng UC đã cập nhật; đoạn R8.3 current tại mỗi UC là quyết định hiện hành. Bản trước cập nhật: [USE_CASE_MATRIX_45_BEFORE_R8_3.md](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/USE_CASE_MATRIX_45_BEFORE_R8_3.md).

Status lịch sử R7.3: FINAL — R7 DATABASE/BACKEND ACCEPTANCE

Ngày nghiệm thu: 2026-10-09 (Asia/Saigon). Git baseline `9d68c6dbad0750de5ccb84eccbd6959dcf735845`. R7.1 lập baseline; R7.2 bổ sung SQL/HTTP regression và hai fix theo policy được người dùng chốt. R7.3 đối chiếu độc lập source, từng UC, raw evidence và môi trường; xem [báo cáo nghiệm thu](R7_3_FINAL_ACCEPTANCE_REPORT.md). Phạm vi FINAL là Database/Backend trên canonical source và Test DB đã verification; chưa nghiệm thu toàn hệ thống.

**Environment reconciliation:** `CANONICAL_SOURCE_VERIFIED` / `TEST_DB_VERIFIED` / `MAIN_DB_DEPLOYMENT_PENDING`. Database chính còn thiếu hai definition R7.2 của `sp_Admin_User_Create` và `sp_Support_Complaint_List`; không triển khai trong R7.3. [Read-only reconciliation](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/environment.json) xác nhận cả data/metadata trước/sau không đổi. [Kiểm toán cuối](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json) ghi per-UC rationale, source hashes, freshness và hai selector R6-B được đính chính tại R7.3. Bốn embedded definition snapshot cũ trong manifest là hạn chế artifact được công khai; parity thực tế dùng đường dẫn canonical source trong `manifest.modules`.

**Freshness R7.3:** E374–E376 là historical probes đã SUPERSEDED, không dùng chứng minh PASS hiện hành. Evidence queue trước fix chỉ chứng minh default/authorization; priority và shared Admin consumer được chứng minh bằng E436. Evidence Admin Create trước fix chỉ dùng cho branch còn tương thích; allowlist hiện hành dùng E437. Registry lịch sử bên dưới giữ nguyên nội dung và selector; classification nghiệm thu hiện hành nằm trong audit R7.3. Backend regression 192/192 và 262 source/test hashes khớp lần chạy; 157 module definitions không đổi, hai definition mới khớp Test DB.

Baseline **14 Customer + 9 Manager + 6 CSKH + 16 Admin = 45**. Image management thuộc ADM-07; actor/cast thuộc ADM-09. Cấu hình hệ thống ngoài phạm vi. Canonical **27 tables / 125 SP / 21 functions / 6 views / 7 triggers = 159 modules**; pricing chỉ Ngày thường/Cuối tuần/Tất cả; `sa` local accepted; DBMS-first/Stored-Procedure-Only.

Source mapping là xác định được implementation, không tự chuyển thành runtime PASS. DB/BE PASS chỉ cho phạm vi luồng chính có real SQL/HTTP tương thích, authorization/scope và invariant assertions. PARTIAL là thiếu branch/evidence hoặc contract cần quyết định; không gọi thiếu evidence là implementation còn thiếu. Không tìm thấy current runtime defect chưa sửa đủ căn cứ BROKEN; không ép kết quả để đạt mục tiêu R7. Không kế thừa grade audit2026-10-07.

Frontend PASS: KH-02 cho actual Customer Login/AuthProvider→real API→SQL và điều hướng trong MemoryRouter, KH-03 cho actual Customer Profile read/update/read after write + SQL. Hai fixture không mount toàn bộ AppRoutes; source guard đã đối chiếu. Đây là provisional luồng chính acceptance, không tuyên bố toàn App E2E. Các browser có coverage một phần vẫn ghi lại cụ thể, không chấm toàn UC PASS. Staff profile browser không chứng minh staff login. Controlled HTTP browser thuộc FRONTEND, không HTTP_SQL.

Mỗi selector bên dưới là JSON Pointer (RFC6901) tương đối root file. E-ID chỉ là địa chỉ mapping, **không là test mới**. Một case tái dùng nhiều UC chỉ tính một artifact/selector; HTTP requests, SQL groups và unit tests không cộng chung thành scenario count.

Nguồn quyết định: [ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md](<../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>); [PROJECT_ACCEPTED_CONSTRAINTS.md](<../docs/PROJECT_ACCEPTED_CONSTRAINTS.md>); [README.md](<../database/README.md>); [R6_GROUP_A_INTEGRATION_REPORT.md](<../docs/R6_GROUP_A_INTEGRATION_REPORT.md>); [R6_GROUP_B_INTEGRATION_REPORT.md](<../docs/R6_GROUP_B_INTEGRATION_REPORT.md>); [R6_GROUP_C_INTEGRATION_REPORT.md](<../docs/R6_GROUP_C_INTEGRATION_REPORT.md>); [DATABASE_INTEGRATION_REPORT.md](<../docs/DATABASE_INTEGRATION_REPORT.md>); [BACKEND_INTEGRATION_REPORT.md](<../docs/BACKEND_INTEGRATION_REPORT.md>); [CONCURRENCY_REPORT.md](<../docs/CONCURRENCY_REPORT.md>); [ROLLBACK_REPORT.md](<../docs/ROLLBACK_REPORT.md>); [DATA_INTEGRITY_REPORT.md](<../docs/DATA_INTEGRITY_REPORT.md>); [ADMIN_PRICING_UPDATE.md](<../docs/contracts/ADMIN_PRICING_UPDATE.md>); [ADMIN_REVENUE.md](<../docs/contracts/ADMIN_REVENUE.md>); [AUTH_RATE_LIMITING.md](<../docs/contracts/AUTH_RATE_LIMITING.md>); [BUSINESS_RULE_OWNERSHIP.md](<../docs/contracts/BUSINESS_RULE_OWNERSHIP.md>); [ORDER_DETAIL_READ_ONLY.md](<../docs/contracts/ORDER_DETAIL_READ_ONLY.md>); [ROLE_AWARE_PROFILE_UPDATE.md](<../docs/contracts/ROLE_AWARE_PROFILE_UPDATE.md>); [Phân Tích _ Thiết Kế.md](<../Phân Tích _ Thiết Kế.md>)

**Cập nhật R7.2:** DB/BE **45 PASS / 0 PARTIAL / 0 BROKEN / 0 MISSING**. FE và Overall giữ **2 PASS / 43 PARTIAL**; 43 `R71-FE-*` tiếp tục `DEFER_TO_R8`. Sáu gap DB/BE đã RESOLVED theo [policy được phê duyệt](contracts/R7_2_APPROVED_POLICIES.md) và [evidence mới](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>). Số liệu/evidence R7.1 trong registry E001–E431 là lịch sử được giữ nguyên phạm vi.

## Current counts by actor and layer — R8.3

### Database/Backend

| Actor | Total | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 16 | 0 | 0 | 0 |
| Total | 45 | 45 | 0 | 0 | 0 |

### Frontend

| Vai trò | Tổng | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 15 | 0 | 1 | 0 |
| **Tổng** | **45** | **44** | **0** | **1** | **0** |

### Overall

| Vai trò | Tổng | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 15 | 0 | 1 | 0 |
| **Tổng** | **45** | **44** | **0** | **1** | **0** |

## Matrix (đúng 45 dòng)


| UC ID | Actor | Function | Database | Stored Procedure | Backend | Authorization | Frontend | Integration Evidence | DB/BE Status | FE Status | Overall Status | Gap ID |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [KH-01](#uc-kh-01) | Customer | Đăng ký | MAPPED: HOSOKHACHHANG,NGUOIDUNG,VAITRO; invariants/constraints ở chi tiết | sp_Auth_RegisterCustomer | POST /api/auth/register; [1 endpoint chain](#uc-kh-01) | Public; limiter endpoint/IP; không nhận role/actor/grant của client. | /register → pages/auth/Register.jsx → authApi.registerCustomer; [full FE](#uc-kh-01) | [E001](#evidence-e001), [E002](#evidence-e002), [E003](#evidence-e003), [E004](#evidence-e004), [E380](#evidence-e380), [E381](#evidence-e381), [E382](#evidence-e382), [E383](#evidence-e383)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-01) |
| [KH-02](#uc-kh-02) | Customer | Đăng nhập | MAPPED: HOSOKHACHHANG,NGUOIDUNG,PHANCONG_RAP,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Auth_Login<br>sp_Manager_ListAssignedCinemas<br>+2: [full chain](#uc-kh-02) | POST /api/auth/login; [3 endpoint chain](#uc-kh-02) | Public login; GETme/permissions authenticate; DB/current account là authority. | /login → pages/auth/Login.jsx → authApi.login/getCurrentUser; [full FE](#uc-kh-02) | [E005](#evidence-e005), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011), [E384](#evidence-e384), [E385](#evidence-e385), [E386](#evidence-e386), [E387](#evidence-e387)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | — |
| [KH-03](#uc-kh-03) | Customer | Profile | MAPPED: HOSOKHACHHANG,NGUOIDUNG,PHANCONG_RAP,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_ListAssignedCinemas<br>sp_RBAC_GetPermissionsByUser<br>+2: [full chain](#uc-kh-03) | GET /api/auth/me; [2 endpoint chain](#uc-kh-03) | authenticate; ownership bằng req.user.userId; không functional permission mới. | /profile → RequireAuth → pages/auth/Profile.jsx; [full FE](#uc-kh-03) | [E015](#evidence-e015), [E016](#evidence-e016), [E017](#evidence-e017), [E018](#evidence-e018), [E019](#evidence-e019), [E020](#evidence-e020), [E021](#evidence-e021), [E022](#evidence-e022), [E023](#evidence-e023), [E024](#evidence-e024), [E025](#evidence-e025), [E026](#evidence-e026), [E027](#evidence-e027), [E028](#evidence-e028), [E029](#evidence-e029), [E030](#evidence-e030), [E388](#evidence-e388)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | — |
| [KH-04](#uc-kh-04) | Customer | Xem phim/list/detail | MAPPED: DANHGIAPHIM,DIENVIEN,NGUOIDUNG,PHIM,PHIM_DIENVIEN,PHIM_THELOAI,SUATCHIEU,THELOAI; invariants/constraints ở chi tiết | sp_Genre_List<br>sp_Movie_GetDetail<br>+1: [full chain](#uc-kh-04) | GET /api/movies; [3 endpoint chain](#uc-kh-04) | Public: không requirePermission XEM_PHIM. | /movies → Movies/MovieGrid; /movies/:movieId → MovieDetail; [full FE](#uc-kh-04) | [E031](#evidence-e031)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-04) |
| [KH-05](#uc-kh-05) | Customer | Xem lịch chiếu | MAPPED: CHITIETVE,DONDATVE,GHE,HINHANH_RAPCHIEUPHIM,PHIM,PHONGCHIEU,RAPCHIEUPHIM,SUATCHIEU; invariants/constraints ở chi tiết | sp_Cinema_List<br>sp_Showtime_GetDetail<br>+1: [full chain](#uc-kh-05) | GET /api/cinemas; [3 endpoint chain](#uc-kh-05) | Public reads; write booking riêng KH-07. | /movies/:movieId → MovieDetail/ShowtimeBrowser → catalogApi.getCinemas/getShowtimes/getShowtimeDetail; cinema/date filter, link /booking/:showtimeId; loading/error/empty.; [full FE](#uc-kh-05) | [E031](#evidence-e031), [E032](#evidence-e032), [E033](#evidence-e033)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-05) |
| [KH-06](#uc-kh-06) | Customer | Chọn ghế | MAPPED: BANGGIA,CHITIETVE,DONDATVE,GHE,PHIM,PHONGCHIEU,RAPCHIEUPHIM,SUATCHIEU; invariants/constraints ở chi tiết | sp_Seat_ListByShowtime<br>sp_Showtime_GetDetail | GET /api/showtimes/:showtimeId; [2 endpoint chain](#uc-kh-06) | Seat read public; Customer+DAT_VE khi submit booking. | /booking/:showtimeId → BookingPreparation/SeatMap → catalogApi.getShowtimeDetail/getSeats; chọn/bỏ ghế, disabled held/sold, loading/error/empty.; [full FE](#uc-kh-06) | [E031](#evidence-e031), [E034](#evidence-e034), [E035](#evidence-e035), [E036](#evidence-e036), [E037](#evidence-e037), [E038](#evidence-e038), [E039](#evidence-e039), [E040](#evidence-e040), [E389](#evidence-e389), [E390](#evidence-e390)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-06) |
| [KH-07](#uc-kh-07) | Customer | Đặt vé | MAPPED: BANGGIA,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Booking_Create | POST /api/bookings; [1 endpoint chain](#uc-kh-07) | authenticate→requireCustomer→requirePermission(DAT_VE); NguoiDungID trusted; SQL active/role/grant. | /booking/:showtimeId → BookingPreparation → catalogApi.createBooking; payload IDs/qty/code; success booking.total/HoldDeadline/payment link; lỗi giữ selection, refresh seats.; [full FE](#uc-kh-07) | [E031](#evidence-e031), [E041](#evidence-e041), [E042](#evidence-e042), [E043](#evidence-e043), [E034](#evidence-e034), [E035](#evidence-e035), [E036](#evidence-e036), [E037](#evidence-e037), [E044](#evidence-e044), [E045](#evidence-e045), [E032](#evidence-e032), [E033](#evidence-e033), [E038](#evidence-e038), [E039](#evidence-e039), [E040](#evidence-e040), [E046](#evidence-e046), [E047](#evidence-e047), [E048](#evidence-e048), [E391](#evidence-e391), [E389](#evidence-e389), [E390](#evidence-e390)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-07) |
| [KH-08](#uc-kh-08) | Customer | Đồ ăn kèm vé | MAPPED: BANGGIA,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Booking_Create<br>sp_Product_ListActive | GET /api/products; [2 endpoint chain](#uc-kh-08) | Products public; booking Customer+DAT_VE, không permission food mới. | /booking/:showtimeId → ProductPicker/BookingPreparation → catalogApi.getProducts/createBooking; qty0 bỏ chọn, qty≤10/product; loading/error/empty.; [full FE](#uc-kh-08) | [E031](#evidence-e031), [E041](#evidence-e041), [E042](#evidence-e042), [E045](#evidence-e045), [E047](#evidence-e047), [E373](#evidence-e373), [E392](#evidence-e392), [E389](#evidence-e389), [E390](#evidence-e390)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-08) |
| [KH-09](#uc-kh-09) | Customer | Khuyến mãi | MAPPED: BANGGIA,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Booking_Create<br>sp_Product_ListActive<br>+2: [full chain](#uc-kh-09) | POST /api/promotions/validate; [2 endpoint chain](#uc-kh-09) | authenticate→Customer→DAT_VE; promotion SP nhận trusted customer; client không gửi accepted/amount. | /booking/:showtimeId → BookingPreparation → catalogApi.validatePromotion/createBooking; provisional quote, previewVersion chống stale, explicit review khi409.; [full FE](#uc-kh-09) | [E031](#evidence-e031), [E049](#evidence-e049), [E050](#evidence-e050), [E037](#evidence-e037), [E051](#evidence-e051), [E047](#evidence-e047), [E048](#evidence-e048), [E373](#evidence-e373), [E393](#evidence-e393), [E391](#evidence-e391), [E394](#evidence-e394), [E392](#evidence-e392), [E389](#evidence-e389), [E429](#evidence-e429), [E430](#evidence-e430), [E431](#evidence-e431)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-09) |
| [KH-10](#uc-kh-10) | Customer | Thanh toán | MAPPED: BOITHUONG_HUYSUAT,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,HOSOKHACHHANG,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Order_GetDetailByCustomer<br>sp_Payment_CreateAttempt<br>+1: [full chain](#uc-kh-10) | POST /api/orders/:orderId/payments; [3 endpoint chain](#uc-kh-10) | authenticate→Customer; pay writes THANH_TOAN; SQL ownership NguoiDungID và DonDatVeID/ThanhToanID. | /orders/:orderId/payment → RequireRole(Customer)/PaymentPage → ordersApi.getOrder/createPaymentAttempt/submitPaymentResult; simulated confirm, busy/error/deadline/history.; [full FE](#uc-kh-10) | [E052](#evidence-e052), [E053](#evidence-e053), [E054](#evidence-e054), [E055](#evidence-e055), [E056](#evidence-e056), [E057](#evidence-e057), [E058](#evidence-e058), [E059](#evidence-e059), [E373](#evidence-e373), [E395](#evidence-e395), [E396](#evidence-e396)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-10) |
| [KH-11](#uc-kh-11) | Customer | Lịch sử đơn | MAPPED: CHITIETVE,DONDATVE,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,RAPCHIEUPHIM,SUATCHIEU,THANHTOAN,VAITRO; invariants/constraints ở chi tiết | sp_Order_ListByCustomer | GET /api/orders; [1 endpoint chain](#uc-kh-11) | authenticate→Customer; own GET không DAT_VE/THANH_TOAN write permission. | /orders → RequireRole(Customer)/Orders → ordersApi.getOrders; loading/error/retry/empty, order cards links.; [full FE](#uc-kh-11) | [E052](#evidence-e052), [E060](#evidence-e060)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-11) |
| [KH-12](#uc-kh-12) | Customer | Chi tiết đơn | MAPPED: BOITHUONG_HUYSUAT,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,THANHTOAN,VAITRO; invariants/constraints ở chi tiết | sp_Order_GetDetailByCustomer | GET /api/orders/:orderId; [1 endpoint chain](#uc-kh-12) | authenticate→Customer; SQL trusted owner; GET không write permission. | /orders/:orderId → RequireRole(Customer)/OrderDetail → ordersApi.getOrder; tickets/foods/payments/summary/HoldDeadline; loading/error/retry.; [full FE](#uc-kh-12) | [E031](#evidence-e031), [E037](#evidence-e037), [E052](#evidence-e052), [E053](#evidence-e053), [E373](#evidence-e373)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-12) |
| [KH-13](#uc-kh-13) | Customer | Đánh giá | MAPPED: DANHGIAPHIM,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Review_Create<br>sp_Review_ListByMovie | GET /api/movies/:movieId/reviews; [2 endpoint chain](#uc-kh-13) | Public list; create authenticate→Customer→DANH_GIA; SQL current grant + eligibility trigger. | /movies/:movieId → MovieReviews → feedbackApi.getReviews/createReview; rating1–5/content, submit/error, empty/retry, permission-gated form.; [full FE](#uc-kh-13) | [E374](#evidence-e374), [E377](#evidence-e377), [E378](#evidence-e378), [E379](#evidence-e379) , [E432](#evidence-e432)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-DB-01), RESOLVED(R71-FE-KH-13) |
| [KH-14](#uc-kh-14) | Customer | Khiếu nại | MAPPED: DONDATVE,KHIEUNAI,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN,XULY_KHIEUNAI; invariants/constraints ở chi tiết | sp_Complaint_Create<br>sp_Complaint_GetByCustomer<br>+1: [full chain](#uc-kh-14) | POST /api/complaints; [3 endpoint chain](#uc-kh-14) | Customer; create GUI_KHIEU_NAI; own reads không cần write grant; trusted owner. | /complaints → Complaints; /complaints/:complaintId → ComplaintDetail; [full FE](#uc-kh-14) | [E110](#evidence-e110), [E111](#evidence-e111), [E112](#evidence-e112), [E113](#evidence-e113), [E114](#evidence-e114), [E115](#evidence-e115), [E116](#evidence-e116), [E117](#evidence-e117), [E118](#evidence-e118), [E119](#evidence-e119)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-KH-14) |
| [QLR-01](#uc-qlr-01) | Manager | Đăng nhập/rạp phân công | MAPPED: HOSOKHACHHANG,NGUOIDUNG,PHANCONG_RAP,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Auth_Login<br>sp_Manager_ListAssignedCinemas<br>+2: [full chain](#uc-qlr-01) | POST /api/auth/login; [4 endpoint chain](#uc-qlr-01) | authenticate→Manager; GETcinemas bootstrap không functional grant; SQL role+live assignment. | /login → Login/AuthProvider; /manager → RequireRole(Manager)/ManagerPortal; [full FE](#uc-qlr-01) | [E012](#evidence-e012), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011), [E061](#evidence-e061), [E062](#evidence-e062), [E063](#evidence-e063)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-QLR-01) |
| [QLR-02](#uc-qlr-02) | Manager | Quản lý phòng | MAPPED: GHE,NGUOIDUNG,PHANCONG_RAP,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Room_Create<br>sp_Manager_Room_Delete<br>+2: [full chain](#uc-qlr-02) | GET /api/manager/cinemas/:cinemaId/rooms; [4 endpoint chain](#uc-qlr-02) | authenticate→Manager→QL_PHONG; SQL scope từ phòng→rạp; không tin spoof cinemaId. | /manager → ManagerPortal/ManagerResourceForm → managerApi.getRooms/createRoom/updateRoom/deleteRoom + utils/managerForms.js; loading/error/empty, edit/delete/reload.; [full FE](#uc-qlr-02) | [E064](#evidence-e064), [E062](#evidence-e062), [E063](#evidence-e063), [E065](#evidence-e065), [E066](#evidence-e066), [E069](#evidence-e069), [E070](#evidence-e070), [E071](#evidence-e071), [E072](#evidence-e072), [E073](#evidence-e073), [E074](#evidence-e074), [E075](#evidence-e075), [E076](#evidence-e076), [E077](#evidence-e077), [E078](#evidence-e078), [E079](#evidence-e079), [E080](#evidence-e080), [E081](#evidence-e081)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-QLR-02) |
| [QLR-03](#uc-qlr-03) | Manager | Quản lý sơ đồ ghế | MAPPED: CHITIETVE,DONDATVE,GHE,NGUOIDUNG,PHANCONG_RAP,PHONGCHIEU,QUYEN,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Seat_Create<br>sp_Manager_Seat_Delete<br>+2: [full chain](#uc-qlr-03) | GET /api/manager/rooms/:roomId/seats; [4 endpoint chain](#uc-qlr-03) | Manager+QL_GHE; indirect parent scope và current grant ở BE+SQL. | /manager → ManagerPortal/ManagerResourceForm → managerApi.getSeats/createSeat/updateSeat/deleteSeat + managerForms; seatLoader, persisted edit/reload, errors.; [full FE](#uc-qlr-03) | [E062](#evidence-e062), [E063](#evidence-e063), [E067](#evidence-e067), [E082](#evidence-e082), [E083](#evidence-e083), [E084](#evidence-e084), [E085](#evidence-e085), [E086](#evidence-e086), [E087](#evidence-e087), [E088](#evidence-e088), [E089](#evidence-e089), [E425](#evidence-e425), [E426](#evidence-e426), [E427](#evidence-e427), [E428](#evidence-e428)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-QLR-03) |
| [QLR-04](#uc-qlr-04) | Manager | Tạo suất chiếu | MAPPED: CHITIETVE,DONDATVE,GHE,NGUOIDUNG,PHANCONG_RAP,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Showtime_Create<br>sp_Manager_Showtime_List | GET /api/manager/cinemas/:cinemaId/showtimes; [2 endpoint chain](#uc-qlr-04) | Manager+QL_SUAT_CHIEU; scope from actual room; role/assignment live. | /manager → ManagerPortal/ManagerResourceForm → managerApi.getManagerShowtimes/createManagerShowtime; movie/room form, loading/error/empty/reload.; [full FE](#uc-qlr-04) | [E062](#evidence-e062), [E063](#evidence-e063), [E068](#evidence-e068), [E090](#evidence-e090), [E091](#evidence-e091), [E092](#evidence-e092), [E093](#evidence-e093), [E094](#evidence-e094), [E095](#evidence-e095), [E100](#evidence-e100), [E101](#evidence-e101), [E102](#evidence-e102)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-QLR-04) |
| [QLR-05](#uc-qlr-05) | Manager | Sửa suất chiếu | MAPPED: CHITIETVE,DONDATVE,GHE,NGUOIDUNG,PHANCONG_RAP,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Showtime_List<br>sp_Manager_Showtime_Update | GET /api/manager/cinemas/:cinemaId/showtimes; [2 endpoint chain](#uc-qlr-05) | Manager+QL_SUAT_CHIEU; show→room→cinema trusted scope. | /manager → ManagerPortal/ManagerResourceForm → managerApi.getManagerShowtimes/updateManagerShowtime; hydrate full persisted fields, datetimeLocal conversion, error/retry.; [full FE](#uc-qlr-05) | [E062](#evidence-e062), [E063](#evidence-e063), [E068](#evidence-e068), [E096](#evidence-e096), [E097](#evidence-e097), [E098](#evidence-e098), [E100](#evidence-e100), [E101](#evidence-e101), [E102](#evidence-e102), [E103](#evidence-e103), [E104](#evidence-e104), [E105](#evidence-e105), [E106](#evidence-e106), [E417](#evidence-e417), [E418](#evidence-e418), [E419](#evidence-e419), [E420](#evidence-e420)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-QLR-05) |
| [QLR-06](#uc-qlr-06) | Manager | Hủy suất chiếu | MAPPED: BOITHUONG_HUYSUAT,CHITIETVE,DONDATVE,HOSOKHACHHANG,KHUYENMAI,NGUOIDUNG,PHANCONG_RAP,PHONGCHIEU,QUYEN,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Showtime_Cancel | POST /api/manager/showtimes/:showtimeId/cancel; [1 endpoint chain](#uc-qlr-06) | Manager+QL_SUAT_CHIEU; resource-derived cinema scope; trusted user ID. | /manager → ManagerPortal → managerApi.cancelManagerShowtime; cancel action/reload, busy/error.; [full FE](#uc-qlr-06) | [E062](#evidence-e062), [E063](#evidence-e063), [E068](#evidence-e068), [E099](#evidence-e099), [E367](#evidence-e367), [E368](#evidence-e368), [E369](#evidence-e369)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-QLR-06) |
| [QLR-07](#uc-qlr-07) | Manager | Cấu hình bảng giá | MAPPED: BANGGIA,NGUOIDUNG,PHANCONG_RAP,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Pricing_Create<br>sp_Manager_Pricing_List<br>+1: [full chain](#uc-qlr-07) | GET /api/manager/cinemas/:cinemaId/pricing; [3 endpoint chain](#uc-qlr-07) | Manager+QL_BANG_GIA; create/list actual cinema, update lookup pricing→cinema; no scope spoof. | /manager → ManagerPortal/ManagerResourceForm → managerApi.getPricing/createPricing/updatePricing + managerForms; three day types/full dimensions/dates, load/error/empty.; [full FE](#uc-qlr-07) | [E064](#evidence-e064), [E107](#evidence-e107), [E108](#evidence-e108), [E109](#evidence-e109) , [E433](#evidence-e433)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-DB-02), RESOLVED(R71-FE-QLR-07) |
| [QLR-08](#uc-qlr-08) | Manager | Dashboard hoạt động rạp | MAPPED: DONDATVE,GHE,NGUOIDUNG,PHANCONG_RAP,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Dashboard | GET /api/manager/cinemas/:cinemaId/dashboard; [1 endpoint chain](#uc-qlr-08) | Manager+XEM_BAO_CAO_RAP; fn_KiemTraQuanLyRapScope current, not Admin report authority. | /manager → ManagerPortal → managerApi.getDashboard; cinema selector, four metrics, loading/error/empty.; [full FE](#uc-qlr-08) | [E375](#evidence-e375) , [E434](#evidence-e434)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-DB-03), RESOLVED(R71-FE-QLR-08) |
| [QLR-09](#uc-qlr-09) | Manager | Doanh thu rạp | MAPPED: CHITIETVE,DONDATVE,NGUOIDUNG,PHANCONG_RAP,PHONGCHIEU,QUYEN,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Manager_Revenue | GET /api/manager/cinemas/:cinemaId/revenue; [1 endpoint chain](#uc-qlr-09) | Manager+XEM_BAO_CAO_RAP; live assigned scope; Admin revenue tests cannot substitute Manager. | /manager → ManagerRevenue/ManagerPortal → managerApi.getRevenue; from/to form, loading/error/empty/rows.; [full FE](#uc-qlr-09) | [E376](#evidence-e376) , [E435](#evidence-e435)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-DB-04), RESOLVED(R71-FE-QLR-09) |
| [CSKH-01](#uc-cskh-01) | CSKH | Đăng nhập | MAPPED: HOSOKHACHHANG,NGUOIDUNG,PHANCONG_RAP,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Auth_Login<br>sp_Manager_ListAssignedCinemas<br>+2: [full chain](#uc-cskh-01) | POST /api/auth/login; [3 endpoint chain](#uc-cskh-01) | Public login; authenticated support route CSKH + QL_KHIEUNAI; SQL active/current role. | /login → Login/AuthProvider; /support → RequireRole(CSKH, QL_KHIEUNAI)/SupportPortal; login fields/busy/error.; [full FE](#uc-cskh-01) | [E013](#evidence-e013), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-CSKH-01) |
| [CSKH-02](#uc-cskh-02) | CSKH | Hàng chờ khiếu nại | MAPPED: KHIEUNAI,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN,XULY_KHIEUNAI; invariants/constraints ở chi tiết | sp_Support_Complaint_List | GET /api/support/complaints; [1 endpoint chain](#uc-cskh-02) | authenticate→requireSupport→QL_KHIEUNAI; SQL allows CSKH/Admin + exact grant. | /support → SupportPortal → supportApi.getSupportComplaints; status/type/search controls; priority displayed/sorted, loading/error/empty.; [full FE](#uc-cskh-02) | [E120](#evidence-e120), [E121](#evidence-e121), [E122](#evidence-e122), [E123](#evidence-e123) , [E436](#evidence-e436)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-CT-01), RESOLVED(R71-FE-CSKH-02) |
| [CSKH-03](#uc-cskh-03) | CSKH | Chi tiết khiếu nại | MAPPED: KHIEUNAI,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN,XULY_KHIEUNAI; invariants/constraints ở chi tiết | sp_Support_Complaint_GetDetail | GET /api/support/complaints/:complaintId; [1 endpoint chain](#uc-cskh-03) | CSKH + QL_KHIEUNAI; authenticate current user; SQL staff-role/grant. | /support → SupportPortal → supportApi.getSupportComplaint; selected detail/history, generation guard, loading/error; userCanAct.; [full FE](#uc-cskh-03) | [E124](#evidence-e124), [E125](#evidence-e125), [E126](#evidence-e126), [E127](#evidence-e127)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-CSKH-03) |
| [CSKH-04](#uc-cskh-04) | CSKH | Đơn tham chiếu | MAPPED: BOITHUONG_HUYSUAT,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,KHIEUNAI,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Support_Complaint_GetOrderReference | GET /api/support/complaints/:complaintId/order-reference; [1 endpoint chain](#uc-cskh-04) | requirePermission AND(QL_KHIEUNAI,TRA_CUU_DON); SQL repeats both; staff trusted identity. | /support → SupportPortal/ComplaintOrderReference/OrderReferenceDetails → supportApi.getComplaintOrderReference; linked detail or explicit empty; loading/error/retry.; [full FE](#uc-cskh-04) | [E128](#evidence-e128), [E129](#evidence-e129), [E130](#evidence-e130), [E131](#evidence-e131), [E132](#evidence-e132)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-CSKH-04) |
| [CSKH-05](#uc-cskh-05) | CSKH | Ghi lần xử lý | MAPPED: KHIEUNAI,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN,XULY_KHIEUNAI; invariants/constraints ở chi tiết | sp_Support_Complaint_AddProcessing | POST /api/support/complaints/:complaintId/processings; [1 endpoint chain](#uc-cskh-05) | AND(QL_KHIEUNAI,XULY_KHIEUNAI) at route+SQL; role CSKH/Admin. | /support → SupportPortal → supportApi.addComplaintProcessing; content/next-status form, busy/error, reloadQueue+detail after write.; [full FE](#uc-cskh-05) | [E133](#evidence-e133), [E134](#evidence-e134), [E135](#evidence-e135), [E150](#evidence-e150), [E151](#evidence-e151)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-CSKH-05) |
| [CSKH-06](#uc-cskh-06) | CSKH | Đổi trạng thái | MAPPED: KHIEUNAI,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN,XULY_KHIEUNAI; invariants/constraints ở chi tiết | sp_Support_Complaint_UpdateStatus | PUT /api/support/complaints/:complaintId/status; [1 endpoint chain](#uc-cskh-06) | AND(QL_KHIEUNAI,XULY_KHIEUNAI); current staff role/grants and trusted actor. | /support → SupportPortal → supportApi.updateComplaintStatus; status/content form, busy/error, refresh queue/detail.; [full FE](#uc-cskh-06) | [E136](#evidence-e136), [E137](#evidence-e137), [E138](#evidence-e138), [E150](#evidence-e150), [E151](#evidence-e151)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-CSKH-06) |
| [ADM-01](#uc-adm-01) | Admin | Đăng nhập | MAPPED: HOSOKHACHHANG,NGUOIDUNG,PHANCONG_RAP,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Auth_Login<br>sp_Manager_ListAssignedCinemas<br>+2: [full chain](#uc-adm-01) | POST /api/auth/login; [3 endpoint chain](#uc-adm-01) | Public login; /admin role ADMIN; each API authenticate→Admin→exact grant. | /login → Login/AuthProvider; /admin → RequireRole(Admin)/AdminPortal; per-module permissions, busy/error.; [full FE](#uc-adm-01) | [E014](#evidence-e014), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-01) |
| [ADM-02](#uc-adm-02) | Admin | Tài khoản người dùng | MAPPED: HOSOKHACHHANG,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_User_Create<br>sp_Admin_User_List<br>+1: [full chain](#uc-adm-02) | GET /api/admin/users; [3 endpoint chain](#uc-adm-02) | authenticate→requireAdmin→QL_NGUOIDUNG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section users → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-02) | [E152](#evidence-e152), [E153](#evidence-e153), [E154](#evidence-e154), [E155](#evidence-e155), [E156](#evidence-e156), [E157](#evidence-e157), [E158](#evidence-e158), [E159](#evidence-e159), [E160](#evidence-e160), [E161](#evidence-e161) , [E437](#evidence-e437)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-CT-02), RESOLVED(R71-FE-ADM-02) |
| [ADM-03](#uc-adm-03) | Admin | Vai trò | MAPPED: NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Role_Create<br>sp_Admin_Role_Delete<br>+2: [full chain](#uc-adm-03) | GET /api/admin/roles; [4 endpoint chain](#uc-adm-03) | authenticate→requireAdmin→QL_VAITRO; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section roles → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-03) | [E162](#evidence-e162), [E163](#evidence-e163), [E164](#evidence-e164), [E165](#evidence-e165), [E166](#evidence-e166), [E167](#evidence-e167), [E168](#evidence-e168), [E169](#evidence-e169), [E170](#evidence-e170), [E171](#evidence-e171), [E172](#evidence-e172)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-03) |
| [ADM-04](#uc-adm-04) | Admin | Danh mục quyền | MAPPED: NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Permission_Create<br>sp_Admin_Permission_Delete<br>+2: [full chain](#uc-adm-04) | GET /api/admin/permissions; [4 endpoint chain](#uc-adm-04) | authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section permissions → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-04) | [E173](#evidence-e173), [E174](#evidence-e174), [E175](#evidence-e175), [E176](#evidence-e176), [E177](#evidence-e177), [E178](#evidence-e178), [E179](#evidence-e179), [E180](#evidence-e180), [E181](#evidence-e181), [E182](#evidence-e182), [E183](#evidence-e183), [E184](#evidence-e184)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-04) |
| [ADM-05](#uc-adm-05) | Admin | Gán quyền vai trò | MAPPED: NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_RolePermission_Set<br>usp_Admin_RolePermission_List | GET /api/admin/roles/:roleId/permissions; [2 endpoint chain](#uc-adm-05) | authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section rolePermissions → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-05) | [E185](#evidence-e185), [E186](#evidence-e186), [E187](#evidence-e187), [E188](#evidence-e188), [E189](#evidence-e189)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-05) |
| [ADM-06](#uc-adm-06) | Admin | Phân công quản lý | MAPPED: NGUOIDUNG,PHANCONG_RAP,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Assignment_Create<br>sp_Admin_Assignment_List<br>+1: [full chain](#uc-adm-06) | GET /api/admin/assignments; [3 endpoint chain](#uc-adm-06) | authenticate→requireAdmin→PHANCONG_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section assignments → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-06) | [E190](#evidence-e190), [E191](#evidence-e191), [E192](#evidence-e192), [E193](#evidence-e193), [E194](#evidence-e194), [E195](#evidence-e195), [E196](#evidence-e196), [E197](#evidence-e197), [E198](#evidence-e198), [E199](#evidence-e199), [E200](#evidence-e200)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-06) |
| [ADM-07](#uc-adm-07) | Admin | Rạp và hình ảnh | MAPPED: BANGGIA,HINHANH_RAPCHIEUPHIM,NGUOIDUNG,PHANCONG_RAP,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Cinema_Create<br>sp_Admin_Cinema_Delete<br>+7: [full chain](#uc-adm-07) | GET /api/admin/cinemas; [9 endpoint chain](#uc-adm-07) | authenticate→requireAdmin→QL_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section cinemas + CinemaImageManager → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes. Component CinemaImageManager.jsx xử lý image actions.; [full FE](#uc-adm-07) | [E201](#evidence-e201), [E202](#evidence-e202), [E203](#evidence-e203), [E204](#evidence-e204), [E205](#evidence-e205), [E206](#evidence-e206), [E207](#evidence-e207), [E208](#evidence-e208), [E209](#evidence-e209), [E210](#evidence-e210), [E211](#evidence-e211), [E212](#evidence-e212), [E213](#evidence-e213), [E214](#evidence-e214), [E215](#evidence-e215), [E216](#evidence-e216), [E217](#evidence-e217), [E218](#evidence-e218), [E219](#evidence-e219), [E220](#evidence-e220), [E221](#evidence-e221), [E222](#evidence-e222)  [BROKEN R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | BROKEN | BROKEN | REOPENED(R71-FE-ADM-07) |
| [ADM-08](#uc-adm-08) | Admin | Phòng và ghế toàn hệ | MAPPED: CHITIETVE,DONDATVE,GHE,NGUOIDUNG,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | usp_Admin_Room_Create<br>usp_Admin_Room_Delete<br>+6: [full chain](#uc-adm-08) | GET /api/admin/rooms; [8 endpoint chain](#uc-adm-08) | authenticate→requireAdmin→QL_GHE, QL_PHONG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section rooms/seats → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-08) | [E223](#evidence-e223), [E224](#evidence-e224), [E225](#evidence-e225), [E226](#evidence-e226), [E227](#evidence-e227), [E228](#evidence-e228), [E229](#evidence-e229), [E230](#evidence-e230), [E231](#evidence-e231), [E232](#evidence-e232), [E233](#evidence-e233), [E234](#evidence-e234), [E235](#evidence-e235), [E236](#evidence-e236), [E237](#evidence-e237), [E238](#evidence-e238), [E239](#evidence-e239), [E240](#evidence-e240), [E241](#evidence-e241), [E242](#evidence-e242), [E353](#evidence-e353), [E354](#evidence-e354), [E355](#evidence-e355), [E356](#evidence-e356), [E357](#evidence-e357), [E370](#evidence-e370), [E371](#evidence-e371), [E078](#evidence-e078), [E421](#evidence-e421), [E422](#evidence-e422), [E423](#evidence-e423), [E424](#evidence-e424)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-08) |
| [ADM-09](#uc-adm-09) | Admin | Phim và diễn viên | MAPPED: DANHGIAPHIM,DIENVIEN,NGUOIDUNG,PHIM,PHIM_DIENVIEN,PHIM_THELOAI,QUYEN,SUATCHIEU,THELOAI,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Actor_Create<br>sp_Admin_Actor_Delete<br>+7: [full chain](#uc-adm-09) | GET /api/admin/movies; [9 endpoint chain](#uc-adm-09) | authenticate→requireAdmin→QL_DANHMUC_PHIM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section movies/actors + cast JSON editor → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-09) | [E243](#evidence-e243), [E244](#evidence-e244), [E245](#evidence-e245), [E246](#evidence-e246), [E247](#evidence-e247), [E248](#evidence-e248), [E249](#evidence-e249), [E250](#evidence-e250), [E251](#evidence-e251), [E252](#evidence-e252), [E253](#evidence-e253), [E254](#evidence-e254), [E255](#evidence-e255), [E256](#evidence-e256), [E257](#evidence-e257), [E258](#evidence-e258), [E259](#evidence-e259), [E260](#evidence-e260), [E261](#evidence-e261), [E262](#evidence-e262), [E263](#evidence-e263), [E264](#evidence-e264), [E327](#evidence-e327), [E407](#evidence-e407), [E408](#evidence-e408), [E409](#evidence-e409), [E410](#evidence-e410), [E411](#evidence-e411), [E412](#evidence-e412)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-09) |
| [ADM-10](#uc-adm-10) | Admin | Thể loại | MAPPED: NGUOIDUNG,PHIM_THELOAI,QUYEN,THELOAI,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Genre_Create<br>sp_Admin_Genre_Delete<br>+2: [full chain](#uc-adm-10) | GET /api/admin/genres; [4 endpoint chain](#uc-adm-10) | authenticate→requireAdmin→QL_THELOAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section genres → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-10) | [E265](#evidence-e265), [E266](#evidence-e266), [E267](#evidence-e267), [E268](#evidence-e268), [E269](#evidence-e269), [E270](#evidence-e270), [E271](#evidence-e271), [E272](#evidence-e272), [E273](#evidence-e273), [E274](#evidence-e274), [E275](#evidence-e275)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-10) |
| [ADM-11](#uc-adm-11) | Admin | Sản phẩm đồ ăn | MAPPED: CHITIETDOAN,NGUOIDUNG,QUYEN,SANPHAM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Product_Create<br>sp_Admin_Product_Delete<br>+2: [full chain](#uc-adm-11) | GET /api/admin/products; [4 endpoint chain](#uc-adm-11) | authenticate→requireAdmin→QL_SANPHAM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section products → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-11) | [E276](#evidence-e276), [E277](#evidence-e277), [E278](#evidence-e278), [E279](#evidence-e279), [E280](#evidence-e280), [E281](#evidence-e281), [E282](#evidence-e282), [E283](#evidence-e283), [E284](#evidence-e284), [E285](#evidence-e285), [E373](#evidence-e373)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-11) |
| [ADM-12](#uc-adm-12) | Admin | Chương trình khuyến mãi | MAPPED: DONDATVE,KHUYENMAI,NGUOIDUNG,QUYEN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Promotion_Create<br>sp_Admin_Promotion_Delete<br>+2: [full chain](#uc-adm-12) | GET /api/admin/promotions; [4 endpoint chain](#uc-adm-12) | authenticate→requireAdmin→QL_KHUYENMAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section promotions → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-12) | [E286](#evidence-e286), [E287](#evidence-e287), [E288](#evidence-e288), [E289](#evidence-e289), [E290](#evidence-e290), [E291](#evidence-e291), [E292](#evidence-e292), [E293](#evidence-e293), [E294](#evidence-e294), [E295](#evidence-e295), [E296](#evidence-e296), [E373](#evidence-e373)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-12) |
| [ADM-13](#uc-adm-13) | Admin | Bảng giá toàn hệ | MAPPED: BANGGIA,NGUOIDUNG,QUYEN,RAPCHIEUPHIM,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | usp_Admin_Pricing_Create<br>usp_Admin_Pricing_List<br>+1: [full chain](#uc-adm-13) | GET /api/admin/pricing; [3 endpoint chain](#uc-adm-13) | authenticate→requireAdmin→QL_BANG_GIA; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section pricing → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-13) | [E297](#evidence-e297), [E298](#evidence-e298), [E299](#evidence-e299), [E300](#evidence-e300), [E301](#evidence-e301), [E302](#evidence-e302), [E303](#evidence-e303), [E304](#evidence-e304), [E305](#evidence-e305), [E328](#evidence-e328), [E329](#evidence-e329), [E330](#evidence-e330), [E397](#evidence-e397), [E398](#evidence-e398), [E399](#evidence-e399), [E400](#evidence-e400), [E401](#evidence-e401), [E402](#evidence-e402), [E403](#evidence-e403), [E404](#evidence-e404), [E405](#evidence-e405), [E406](#evidence-e406)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-13) |
| [ADM-14](#uc-adm-14) | Admin | Suất chiếu toàn hệ | MAPPED: BOITHUONG_HUYSUAT,CHITIETVE,DONDATVE,GHE,HOSOKHACHHANG,KHUYENMAI,NGUOIDUNG,PHANCONG_RAP,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | usp_Admin_Showtime_Cancel<br>usp_Admin_Showtime_Create<br>+2: [full chain](#uc-adm-14) | GET /api/admin/showtimes; [4 endpoint chain](#uc-adm-14) | authenticate→requireAdmin→QL_SUAT_CHIEU; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section showtimes → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-14) | [E306](#evidence-e306), [E307](#evidence-e307), [E308](#evidence-e308), [E309](#evidence-e309), [E310](#evidence-e310), [E311](#evidence-e311), [E312](#evidence-e312), [E313](#evidence-e313), [E314](#evidence-e314), [E315](#evidence-e315), [E316](#evidence-e316), [E317](#evidence-e317), [E358](#evidence-e358), [E359](#evidence-e359), [E360](#evidence-e360), [E361](#evidence-e361), [E362](#evidence-e362), [E363](#evidence-e363), [E364](#evidence-e364), [E365](#evidence-e365), [E366](#evidence-e366), [E101](#evidence-e101), [E372](#evidence-e372), [E413](#evidence-e413), [E414](#evidence-e414), [E415](#evidence-e415), [E416](#evidence-e416)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-14) |
| [ADM-15](#uc-adm-15) | Admin | Xử lý khiếu nại | MAPPED: BOITHUONG_HUYSUAT,CHITIETDOAN,CHITIETVE,DONDATVE,GHE,KHIEUNAI,KHUYENMAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SANPHAM,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN,XULY_KHIEUNAI; invariants/constraints ở chi tiết | sp_Support_Complaint_AddProcessing<br>sp_Support_Complaint_GetDetail<br>+3: [full chain](#uc-adm-15) | GET /api/admin/complaints; [5 endpoint chain](#uc-adm-15) | authenticate→requireAdmin→QL_KHIEUNAI, TRA_CUU_DON, XULY_KHIEUNAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section complaints + ComplaintOrderReference → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes. Component ComplaintOrderReference.jsx; writeComplaint refresh load()+openComplaint(selected).; [full FE](#uc-adm-15) | [E139](#evidence-e139), [E140](#evidence-e140), [E141](#evidence-e141), [E142](#evidence-e142), [E143](#evidence-e143), [E144](#evidence-e144), [E145](#evidence-e145), [E146](#evidence-e146), [E147](#evidence-e147), [E148](#evidence-e148), [E149](#evidence-e149), [E150](#evidence-e150), [E151](#evidence-e151), [E318](#evidence-e318), [E319](#evidence-e319), [E320](#evidence-e320), [E321](#evidence-e321), [E322](#evidence-e322)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-15) |
| [ADM-16](#uc-adm-16) | Admin | Báo cáo toàn hệ | MAPPED: CHITIETVE,DONDATVE,KHIEUNAI,NGUOIDUNG,PHIM,PHONGCHIEU,QUYEN,RAPCHIEUPHIM,SUATCHIEU,THANHTOAN,VAITRO,VAITRO_QUYEN; invariants/constraints ở chi tiết | sp_Admin_Dashboard<br>sp_Admin_Report_Revenue | GET /api/admin/dashboard; [2 endpoint chain](#uc-adm-16) | authenticate→requireAdmin→XEM_BAO_CAO_TOANHE; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). | /admin → RequireRole(Admin)/AdminPortal section dashboard/revenue → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.; [full FE](#uc-adm-16) | [E323](#evidence-e323), [E324](#evidence-e324), [E325](#evidence-e325), [E326](#evidence-e326), [E331](#evidence-e331), [E332](#evidence-e332), [E333](#evidence-e333), [E334](#evidence-e334), [E335](#evidence-e335), [E336](#evidence-e336), [E337](#evidence-e337), [E338](#evidence-e338), [E339](#evidence-e339), [E340](#evidence-e340), [E341](#evidence-e341), [E342](#evidence-e342), [E343](#evidence-e343), [E344](#evidence-e344), [E345](#evidence-e345), [E346](#evidence-e346), [E347](#evidence-e347), [E348](#evidence-e348), [E349](#evidence-e349), [E350](#evidence-e350), [E351](#evidence-e351), [E352](#evidence-e352)  [PASS R8.3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) | PASS | PASS | PASS | RESOLVED(R71-FE-ADM-16) |


## Trace chi tiết từng UC


<a id="uc-kh-01"></a>

### KH-01 — Đăng ký

**Mục tiêu:** Cho phép người dùng mới tự tạo tài khoản để sử dụng các chức năng dành cho khách hàng như đặt vé, đánh giá phim, gửi khiếu nại.

**Luồng baseline:** 1. Người dùng truy cập trang đăng ký, nhập thông tin cá nhân (họ tên, email, mật khẩu, số điện thoại...). → 2. Hệ thống kiểm tra tính hợp lệ dữ liệu và kiểm tra trùng lặp Email trong bảng NGUOIDUNG. → 3. Hệ thống tạo bản ghi mới trong NGUOIDUNG, tự động gán VaiTroID tương ứng vai trò KHACH_HANG (theo chính sách ứng dụng). → 4. Hệ thống tạo bản ghi mở rộng trong HOSOKHACHHANG (ngày sinh, giới tính, điểm tích lũy...). → 5. Hệ thống thông báo đăng ký thành công và cho phép đăng nhập.

**Nguồn:** [Đặc tả dòng 77](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Người mới; email/phone hợp lệ, chưa trùng; dữ liệu đăng ký hợp lệ.

**Kết quả mong đợi:** 201 tạo đúng Customer + profile; duplicate/invalid không tạo dòng; thông báo và sang đăng nhập.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [VAITRO](<../database/02_tables/vaitro.sql>).

**Entry points:** [sp_Auth_RegisterCustomer](<../database/08_procedures/auth/sp_Auth_RegisterCustomer.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); VAITRO: [PK_VAITRO](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Role KHACH_HANG do SQL chọn; bcrypt ở authService; email/phone UNIQUE; register own transaction/savepoint bảo vệ cả NGUOIDUNG/HOSOKHACHHANG; limiter trước express.json.

**Authorization:** Public; limiter endpoint/IP; không nhận role/actor/grant của client.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/auth/register | [route:6](<../backend/src/routes/authRoutes.js>) | Public + app.createAuthRateLimiter before JSON parser | N/A — public/self-read/bootstrap contract | [authController.register](<../backend/src/controllers/authController.js>) | [authService.registerCustomer](<../backend/src/services/authService.js>) | AUTH_REGISTER_CUSTOMER → dbo.sp_Auth_RegisterCustomer |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /register → pages/auth/Register.jsx → authApi.registerCustomer → /login; form họ tên/email/password/phone, busy/error/success.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [authApi.js](<../frontend/src/api/authApi.js>), [Register.jsx](<../frontend/src/pages/auth/Register.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E001](#evidence-e001), [E002](#evidence-e002), [E003](#evidence-e003), [E004](#evidence-e004), [E380](#evidence-e380), [E381](#evidence-e381), [E382](#evidence-e382), [E383](#evidence-e383)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R45 browser chỉ kiểm 429 và retry duplicate409; chưa UI đăng ký201, duplicate phone, input invalid và chuyển /login.. Gap: R71-FE-KH-01.



**Test IDs / raw case identities:** `valid registration follows real typed SP gateway and creates only Customer/profile`, `registered user login bcrypt JWT and live identity unchanged`, `invalid/duplicate registration contracts and no-write rollback unchanged`, `R4.5-08 register beyond production threshold never calls actual service/SQL`, `register: real429 shown as existing understandable retry error`, `register: form values retained and submit released`, `register: no automatic retry or navigation on429`, `register: explicit retry after expiry reaches existing duplicate-email contract`

**R7.3 acceptance rationale:** Đăng ký: DB/BE PASS theo E001, E002, E003, E004, E380, E381, E382, E383; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/0`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-01 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/0`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-02"></a>

### KH-02 — Đăng nhập

**Mục tiêu:** Xác thực tài khoản để truy cập các chức năng theo đúng vai trò được cấp.

**Luồng baseline:** 1. Người dùng nhập Email + mật khẩu. → 2. Hệ thống kiểm tra thông tin đăng nhập trong NGUOIDUNG và kiểm tra trạng thái tài khoản (đang hoạt động/bị khóa). → 3. Hệ thống xác định VaiTroID của tài khoản, tra cứu VAITRO_QUYEN để lấy danh sách quyền tương ứng. → 4. Hệ thống khởi tạo phiên làm việc, trả về thông tin vai trò/quyền cần thiết cho phiên. → 5. Người dùng được điều hướng vào khu vực chức năng tương ứng với vai trò (Customer/Manager/CSKH/Admin).

**Nguồn:** [Đặc tả dòng 87](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Account Customer hoạt động, email/password đúng.

**Kết quả mong đợi:** 200 JWT identity + current role/permissions; lỗi credentials401 generic, account inactive không truy cập; login điều hướng Customer.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Auth_Login](<../database/08_procedures/auth/sp_Auth_Login.sql>), [sp_Manager_ListAssignedCinemas](<../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql>), [sp_RBAC_GetPermissionsByUser](<../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql>), [sp_User_GetCurrent](<../database/08_procedures/auth/sp_User_GetCurrent.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHANCONG_RAP: [PK_PHANCONG_RAP](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SP trả hash cho bcrypt và current identity; JWT không cache quyền; authenticate đọc lại current user/grants mỗi request; rate429 không chạm SQL.

**Authorization:** Public login; GETme/permissions authenticate; DB/current account là authority.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/auth/login | [route:7](<../backend/src/routes/authRoutes.js>) | Public + app.createAuthRateLimiter before JSON parser | N/A — public/self-read/bootstrap contract | [authController.login](<../backend/src/controllers/authController.js>) | [authService.login](<../backend/src/services/authService.js>) | AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [route:8](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentUser](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [route:10](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentPermissions](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /login → pages/auth/Login.jsx → authApi.login/getCurrentUser → AuthContext/authSession → Customer /; giữ giá trị và giải phóng submit khi lỗi.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [authApi.js](<../frontend/src/api/authApi.js>), [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>), [Login.jsx](<../frontend/src/pages/auth/Login.jsx>), [authSession.js](<../frontend/src/services/authSession.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E005](#evidence-e005), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011), [E384](#evidence-e384), [E385](#evidence-e385), [E386](#evidence-e386), [E387](#evidence-e387)

**Căn cứ provisional PASS:** luồng chính source/binding + realSQL/HTTP + actualCustomer browser đã đối chiếu; không ghi nhận current unresolvedmaterialdefect. Giới hạn full App/browser fixture áp dụng như phần mở đầu.



**Test IDs / raw case identities:** `real login JWT/current permissions/assignments KHACH_HANG`, `under-limit invalid/unknown credentials keep existing generic401`, `real four-role RBAC and non-auth endpoints preserved`, `account status and existing JWT live recheck unchanged`, `R4.5-07 login beyond production threshold never calls actual service/SQL`, `spoof resistance and other endpoints work with login/register counters exhausted`, `R4.5-04/10 exact expiry allows manual retry through real auth SP without sleeps`, `login: real429 shown as existing understandable retry error`, `login: form values retained and submit released`, `login: no automatic retry or navigation on429`, `login: explicit retry after expiry logs in and uses real JWT/me`

**R7.3 acceptance rationale:** Đăng nhập: DB/BE PASS theo E005, E006, E007, E008, E009, E010, E011, E384, E385, E386, E387; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PASS (component flow giới hạn, chưa toàn App E2E). [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/1`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-02 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/1`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-03"></a>

### KH-03 — Profile

**Mục tiêu:** Khách hàng xem và chỉnh sửa thông tin hồ sơ cá nhân của chính mình.

**Luồng baseline:** 1. Khách hàng truy cập trang hồ sơ cá nhân. → 2. Hệ thống truy xuất dữ liệu từ NGUOIDUNG và HOSOKHACHHANG theo NguoiDungID đang đăng nhập. → 3. Khách hàng chỉnh sửa các trường được phép (họ tên, số điện thoại, ngày sinh, giới tính...). → 4. Hệ thống kiểm tra hợp lệ và cập nhật vào NGUOIDUNG/HOSOKHACHHANG.

**Nguồn:** [Đặc tả dòng 97](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.

**Kết quả mong đợi:** GET hồ sơ; PUT common/specific fields và đọc lại; không đổi role/password/loyalty; rollback khi dữ liệu hoặc ghi thất bại.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_ListAssignedCinemas](<../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql>), [sp_RBAC_GetPermissionsByUser](<../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql>), [sp_User_GetCurrent](<../database/08_procedures/auth/sp_User_GetCurrent.sql>), [sp_User_UpdateProfile](<../database/08_procedures/auth/sp_User_UpdateProfile.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHANCONG_RAP: [PK_PHANCONG_RAP](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** UserID từ identity; SP phân nhánh current DB role; thiếu profile Customer tạo đúng một dòng; staff không ghi profile; owned TX/savepoint/XACT_STATE; phone UQ và date CHECK.

**Authorization:** authenticate; ownership bằng req.user.userId; không functional permission mới.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/auth/me | [route:8](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentUser](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| PUT /api/auth/me | [route:9](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.updateCurrentUser](<../backend/src/controllers/authController.js>) | [authService.updateProfile](<../backend/src/services/authService.js>) | USER_UPDATE_PROFILE → dbo.sp_User_UpdateProfile; USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /profile → RequireAuth → pages/auth/Profile.jsx → authApi.getCurrentUser/updateCurrentUser → AuthProvider; loading/error, form name/phone/birthday/gender.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [authApi.js](<../frontend/src/api/authApi.js>), [Profile.jsx](<../frontend/src/pages/auth/Profile.jsx>), [RequireAuth.jsx](<../frontend/src/routes/RequireAuth.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E015](#evidence-e015), [E016](#evidence-e016), [E017](#evidence-e017), [E018](#evidence-e018), [E019](#evidence-e019), [E020](#evidence-e020), [E021](#evidence-e021), [E022](#evidence-e022), [E023](#evidence-e023), [E024](#evidence-e024), [E025](#evidence-e025), [E026](#evidence-e026), [E027](#evidence-e027), [E028](#evidence-e028), [E029](#evidence-e029), [E030](#evidence-e030), [E388](#evidence-e388)

**Căn cứ provisional PASS:** luồng chính source/binding + realSQL/HTTP + actualCustomer browser đã đối chiếu; không ghi nhận current unresolvedmaterialdefect. Giới hạn full App/browser fixture áp dụng như phần mở đầu.



**Test IDs / raw case identities:** `R4.6-01 Customer common`, `R4.6-02 Customer specific, points preserved`, `R4.6-03/16 missing Customer valid NULL profile, repeated no duplicate`, `R4.6-11/14 invalid existing/missing profile constraints roll back common write`, `duplicate phone existing domain error, no writes`, `R4.6-13 missing user no profile`, `SQL and HTTP live inactive account rejection`, `direct SP has no trusted client role parameter`, `real typed API write/read-after-write KHACH_HANG`, `R4.6-10/20 identity, role/owner/security whitelist spoofing rejected, all tables unchanged`, `current SQL role overrides previously authenticated Customer role`, `R4.6-12 real injected profile UPDATE failure restores both tables, no open transaction`, `R4.6-12 real injected profile INSERT failure restores both tables, no open transaction`, `caller success remains uncommitted and caller rollback restores both`, `committable error rolls back SP savepoint, preserves caller prior work`, `doomed caller transaction rolled back fully, no partial writes`; records without a test ID: E388 `/results/0` (artifact is linked in registry).

**R7.3 acceptance rationale:** Profile: DB/BE PASS theo E015, E016, E017, E018, E019, E020, E021, E022, E023, E024, E025, E026, E027, E028, E029, E030, E388; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PASS (component flow giới hạn, chưa toàn App E2E). [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/2`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-03 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/2`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-04"></a>

### KH-04 — Xem phim/list/detail

**Mục tiêu:** Cho phép người dùng (kể cả khách chưa đăng nhập, route công khai) tra cứu thông tin phim đang chiếu/sắp chiếu.

**Luồng baseline:** 1. Người dùng truy cập trang danh sách phim (route Public/Customer). → 2. Hệ thống truy vấn bảng PHIM, kết hợp PHIM_THELOAI/THELOAI và PHIM_DIENVIEN/DIENVIEN để hiển thị thể loại, diễn viên. → 3. Người dùng chọn một phim để xem chi tiết (mô tả, thời lượng, thể loại, diễn viên...).

**Nguồn:** [Đặc tả dòng 107](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Public; movie ID/filter hợp lệ.

**Kết quả mong đợi:** List/detail phim, genres và cast đúng; missing movie404; lọc phù hợp.

**Database:** [DANHGIAPHIM](<../database/02_tables/danhgiaphim.sql>), [DIENVIEN](<../database/02_tables/dienvien.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHIM_DIENVIEN](<../database/02_tables/phim_dienvien.sql>), [PHIM_THELOAI](<../database/02_tables/phim_theloai.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THELOAI](<../database/02_tables/theloai.sql>).

**Entry points:** [sp_Genre_List](<../database/08_procedures/public/sp_Genre_List.sql>), [sp_Movie_GetDetail](<../database/08_procedures/public/sp_Movie_GetDetail.sql>), [sp_Movie_List](<../database/08_procedures/public/sp_Movie_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [vw_ThongKePhim](<../database/06_views/vw_ThongKePhim.sql>).

**Trigger liên quan:** [TRG_DanhGia_KiemTraDaXemPhim](<../database/07_triggers/TRG_DanhGia_KiemTraDaXemPhim.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** DANHGIAPHIM: [PK_DANHGIAPHIM](<../database/03_constraints/001_primary_unique.sql>); DANHGIAPHIM: [UQ_DANHGIAPHIM_Phim_User](<../database/03_constraints/001_primary_unique.sql>); DANHGIAPHIM: [FK_DANHGIAPHIM_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DANHGIAPHIM: [FK_DANHGIAPHIM_Phim](<../database/03_constraints/002_foreign_keys.sql>); DANHGIAPHIM: [CK_DANHGIAPHIM_SoSao](<../database/03_constraints/003_check_constraints.sql>); DANHGIAPHIM: [DF_DANHGIAPHIM_NgayDanhGia_ClockVN](<../database/03_constraints/005_function_defaults.sql>); DIENVIEN: [PK_DIENVIEN](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Read-only SP/view, PHIM_THELOAI/PHIM_DIENVIEN FK; không write khi đọc; public không enforce XEM_PHIM.

**Authorization:** Public: không requirePermission XEM_PHIM.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/movies | [route:9](<../backend/src/routes/movieRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.listMovies](<../backend/src/controllers/catalogController.js>) | [catalogService.listMovies](<../backend/src/services/catalogService.js>) | MOVIE_LIST → dbo.sp_Movie_List |
| GET /api/movies/:movieId | [route:13](<../backend/src/routes/movieRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.getMovieDetail](<../backend/src/controllers/catalogController.js>) | [catalogService.getMovieDetail](<../backend/src/services/catalogService.js>) | MOVIE_GET_DETAIL → dbo.sp_Movie_GetDetail |
| GET /api/genres | [route:5](<../backend/src/routes/genreRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.listGenres](<../backend/src/controllers/catalogController.js>) | [catalogService.listGenres](<../backend/src/services/catalogService.js>) | GENRE_LIST → dbo.sp_Genre_List |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /movies → Movies/MovieGrid; /movies/:movieId → MovieDetail → catalogApi.getMovies/getMovieDetail/getGenres; filters, loading/error/empty/retry.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [catalogApi.js](<../frontend/src/api/catalogApi.js>), [MovieGrid.jsx](<../frontend/src/components/MovieGrid.jsx>), [MovieDetail.jsx](<../frontend/src/pages/MovieDetail.jsx>), [Movies.jsx](<../frontend/src/pages/Movies.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | N/A — public core reads/selection không đòi permission | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser list/filter/detail, cast/genres, empty404 và retry.. Gap: R71-FE-KH-04.



**Test IDs / raw case identities:** `R6.1-01`

**R7.3 acceptance rationale:** Xem phim/list/detail: DB/BE PASS theo E031; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/3`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-04 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/3`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-05"></a>

### KH-05 — Xem lịch chiếu

**Mục tiêu:** Khách hàng xem các suất chiếu của một phim theo rạp, phòng chiếu và thời gian.

**Luồng baseline:** 1. Từ trang chi tiết phim, khách hàng chọn xem lịch chiếu. → 2. Hệ thống truy vấn SUATCHIEU kết hợp PHONGCHIEU và RAPCHIEUPHIM theo PHIM đã chọn (PHIM → SUATCHIEU → PHONGCHIEU → RAPCHIEUPHIM). → 3. Hệ thống hiển thị danh sách suất chiếu theo rạp, ngày, giờ, định dạng chiếu. → 4. Khách hàng chọn một suất chiếu để tiếp tục sang bước chọn ghế/đặt vé.

**Nguồn:** [Đặc tả dòng 117](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Public; phim/rạp/suất phù hợp, date hợp lệ.

**Kết quả mong đợi:** Lịch chiếu đúng phim/rạp/ngày và show detail; chỉ suất khả dụng theo contract.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [HINHANH_RAPCHIEUPHIM](<../database/02_tables/hinhanh_rapchieuphim.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>).

**Entry points:** [sp_Cinema_List](<../database/08_procedures/public/sp_Cinema_List.sql>), [sp_Showtime_GetDetail](<../database/08_procedures/public/sp_Showtime_GetDetail.sql>), [sp_Showtime_ListByMovie](<../database/08_procedures/public/sp_Showtime_ListByMovie.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SUATCHIEU→PHONGCHIEU→RAPCHIEUPHIM; UTC instant, DATE kinh doanh; active parent guards và DB time.

**Authorization:** Public reads; write booking riêng KH-07.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/cinemas | [route:5](<../backend/src/routes/cinemaRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.listCinemas](<../backend/src/controllers/catalogController.js>) | [catalogService.listCinemas](<../backend/src/services/catalogService.js>) | CINEMA_LIST → dbo.sp_Cinema_List |
| GET /api/movies/:movieId/showtimes | [route:10](<../backend/src/routes/movieRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.listShowtimes](<../backend/src/controllers/catalogController.js>) | [catalogService.listShowtimes](<../backend/src/services/catalogService.js>) | SHOWTIME_LIST_BY_MOVIE → dbo.sp_Showtime_ListByMovie |
| GET /api/showtimes/:showtimeId | [route:7](<../backend/src/routes/showtimeRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.getShowtimeDetail](<../backend/src/controllers/catalogController.js>) | [catalogService.getShowtimeDetail](<../backend/src/services/catalogService.js>) | SHOWTIME_GET_DETAIL → dbo.sp_Showtime_GetDetail |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /movies/:movieId → MovieDetail/ShowtimeBrowser → catalogApi.getCinemas/getShowtimes/getShowtimeDetail; cinema/date filter, link /booking/:showtimeId; loading/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [catalogApi.js](<../frontend/src/api/catalogApi.js>), [ShowtimeBrowser.jsx](<../frontend/src/components/ShowtimeBrowser.jsx>), [MovieDetail.jsx](<../frontend/src/pages/MovieDetail.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | N/A — public core reads/selection không đòi permission | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031), [E032](#evidence-e032), [E033](#evidence-e033)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser chọn rạp/ngày, đổi filter, empty lịch và điều hướng booking.. Gap: R71-FE-KH-05.



**Test IDs / raw case identities:** `R6.1-01`, `R6.1-13`, `R6.1-14`

**R7.3 acceptance rationale:** Xem lịch chiếu: DB/BE PASS theo E031, E032, E033; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/4`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-05 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/4`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-06"></a>

### KH-06 — Chọn ghế

**Mục tiêu:** Cho phép khách hàng chọn ghế còn trống trong sơ đồ ghế của phòng chiếu tương ứng với suất chiếu đã chọn.

**Luồng baseline:** 1. Hệ thống xác định PHONGCHIEU của SUATCHIEU đã chọn, truy vấn toàn bộ GHE thuộc phòng. → 2. Hệ thống đối chiếu với CHITIETVE để xác định ghế nào đã được bán trong đúng suất chiếu này. → 3. Hệ thống hiển thị sơ đồ ghế: còn trống / đã đặt / đang giữ chỗ. → 4. Khách hàng chọn một hoặc nhiều ghế còn trống để tiếp tục đặt vé.

**Nguồn:** [Đặc tả dòng 127](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Suất mở bán còn tương lai và parent active; ghế thuộc phòng.

**Kết quả mong đợi:** Trạng thái free/held/sold và giá đúng; selection ≤10; conflict không gây giữ hai lần.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>).

**Entry points:** [sp_Seat_ListByShowtime](<../database/08_procedures/public/sp_Seat_ListByShowtime.sql>), [sp_Showtime_GetDetail](<../database/08_procedures/public/sp_Showtime_GetDetail.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DanhSachGheSuatChieu](<../database/05_functions/fn_DanhSachGheSuatChieu.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [fn_TinhGiaVe](<../database/05_functions/fn_TinhGiaVe.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>), [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** fn_TinhGiaVe SQL owned; fn_DonDangGiuGhe/hold deadline; booking serialize ghế; historical ticket không thay giá theo catalog.

**Authorization:** Seat read public; Customer+DAT_VE khi submit booking.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/showtimes/:showtimeId | [route:7](<../backend/src/routes/showtimeRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [catalogController.getShowtimeDetail](<../backend/src/controllers/catalogController.js>) | [catalogService.getShowtimeDetail](<../backend/src/services/catalogService.js>) | SHOWTIME_GET_DETAIL → dbo.sp_Showtime_GetDetail |
| GET /api/showtimes/:showtimeId/seats | [route:6](<../backend/src/routes/showtimeRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [bookingController.listSeats](<../backend/src/controllers/bookingController.js>) | [bookingService.listSeats](<../backend/src/services/bookingService.js>) | SEAT_LIST_BY_SHOWTIME → dbo.sp_Seat_ListByShowtime |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /booking/:showtimeId → BookingPreparation/SeatMap → catalogApi.getShowtimeDetail/getSeats; chọn/bỏ ghế, disabled held/sold, loading/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [catalogApi.js](<../frontend/src/api/catalogApi.js>), [SeatMap.jsx](<../frontend/src/components/SeatMap.jsx>), [BookingPreparation.jsx](<../frontend/src/pages/BookingPreparation.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | N/A — public core reads/selection không đòi permission | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031), [E034](#evidence-e034), [E035](#evidence-e035), [E036](#evidence-e036), [E037](#evidence-e037), [E038](#evidence-e038), [E039](#evidence-e039), [E040](#evidence-e040), [E389](#evidence-e389), [E390](#evidence-e390)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R44 chỉ chọn ghế free; chưa browser held/sold, ghế11, concurrent conflict và refresh sau409.. Gap: R71-FE-KH-06.



**Test IDs / raw case identities:** `R6.1-01`, `R6.1-07`, `R6.1-08`, `R6.1-09`, `R6.1-10`, `R6.2-01`, `R6.2-02`, `R6.2-03`, `booking final amount replaces old preview`, `booking payload contains only IDs quantities and code`

**R7.3 acceptance rationale:** Chọn ghế: DB/BE PASS theo E031, E034, E035, E036, E037, E038, E039, E040, E389, E390; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/5`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-06 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/5`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-07"></a>

### KH-07 — Đặt vé

**Mục tiêu:** Khách hàng hoàn tất chọn suất chiếu, ghế, đồ ăn, khuyến mãi để tạo đơn/vé duy nhất.

**Luồng baseline:** 1. Khách hàng chọn SuatChieuID và danh sách GheID muốn đặt. → 2. (Tuỳ chọn) khách hàng chọn thêm SanPhamID ăn uống và/hoặc nhập mã khuyến mãi. → 3. Hệ thống kiểm tra ghế thuộc đúng phòng của suất chiếu (BR03) và chưa được bán hợp lệ trong cùng suất chiếu (BR02) trong một Transaction. → 4. Hệ thống tính giá vé (giá cơ bản của suất chiếu kết hợp phụ thu BANGGIA theo loại ghế/ngày/định dạng; mọi phụ thu áp dụng được CỘNG DỒN, và hai dòng BANGGIA cùng rạp, cùng điều kiện, cùng "Áp dụng" không được có khoảng hiệu lực giao nhau; cuối tuần là thứ Bảy và Chủ nhật) và chốt giá trị snapshot GiaVe (BR09). → 5. Hệ thống tạo bản ghi DONDATVE ở trạng thái Chờ thanh toán, các CHITIETVE tương ứng ghế đã chọn, CHITIETDOAN nếu có đồ ăn, gắn KhuyenMaiID nếu áp dụng khuyến mãi. Đơn được giữ ghế đúng 5 phút (HanGiuCho = thời điểm đặt + 5 phút, đặt một lần và không bao giờ được gia hạn); mỗi đơn tối đa 10 ghế, mỗi dòng sản phẩm tối đa 10, mỗi khách tối đa 3 đơn đang giữ chỗ (chưa thanh toán và chưa quá hạn); ghế đó hiển thị "đang giữ chỗ" với khách khác và không thể đặt. Quá hạn mà chưa thanh toán, đơn chuyển sang Hết hạn và ghế được nhả. → 6. Nếu phát hiện xung đột (ghế vừa bị người khác đặt), hệ thống rollback toàn bộ giao dịch và thông báo lỗi cho khách hàng.

**Nguồn:** [Đặc tả dòng 137](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer active + DAT_VE; suất/ghế hợp lệ; ≤10 distinct seats, ≤3 live holds.

**Kết quả mong đợi:** 201 một đơn, ticket snapshots/foods/quota đầy đủ; giữ5phút; invalid/concurrent/fault rollback toàn bộ.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Booking_Create](<../database/08_procedures/booking/sp_Booking_Create.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_GioiHanDonDangGiu](<../database/05_functions/fn_GioiHanDonDangGiu.sql>), [fn_GioiHanGheMoiDon](<../database/05_functions/fn_GioiHanGheMoiDon.sql>), [fn_GioiHanGiamGiaPhanTram](<../database/05_functions/fn_GioiHanGiamGiaPhanTram.sql>), [fn_GioiHanSoLuongSanPham](<../database/05_functions/fn_GioiHanSoLuongSanPham.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [fn_ThoiGianGiuChoPhut](<../database/05_functions/fn_ThoiGianGiuChoPhut.sql>), [fn_TinhGiaVe](<../database/05_functions/fn_TinhGiaVe.sql>), [sp_Order_ExpirePending](<../database/08_procedures/customer/sp_Order_ExpirePending.sql>), [sp_Promotion_Validate](<../database/08_procedures/public/sp_Promotion_Validate.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>), [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SQL transaction+savepoint, locking UPDLOCK/HOLDLOCK; 10 ghế/10 mỗi product/3 holds; promote validate sau lock; postwrite fault rollback all tables.

**Authorization:** authenticate→requireCustomer→requirePermission(DAT_VE); NguoiDungID trusted; SQL active/role/grant.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/bookings | [route:8](<../backend/src/routes/bookingRoutes.js>) | authenticate → requireCustomer | AND(DAT_VE) | [bookingController.createBooking](<../backend/src/controllers/bookingController.js>) | [bookingService.createBooking](<../backend/src/services/bookingService.js>) | BOOKING_CREATE → dbo.sp_Booking_Create |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. SEAT_CONFLICT/SEAT_UNAVAILABLE/SHOWTIME_UNAVAILABLE/PROMOTION_NOT_AVAILABLE/ACTIVE_ORDER_LIMIT_REACHED409; invalidproducts400. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /booking/:showtimeId → BookingPreparation → catalogApi.createBooking; payload IDs/qty/code; success booking.total/HoldDeadline/payment link; lỗi giữ selection, refresh seats.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [catalogApi.js](<../frontend/src/api/catalogApi.js>), [HoldDeadline.jsx](<../frontend/src/components/HoldDeadline.jsx>), [BookingPreparation.jsx](<../frontend/src/pages/BookingPreparation.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031), [E041](#evidence-e041), [E042](#evidence-e042), [E043](#evidence-e043), [E034](#evidence-e034), [E035](#evidence-e035), [E036](#evidence-e036), [E037](#evidence-e037), [E044](#evidence-e044), [E045](#evidence-e045), [E032](#evidence-e032), [E033](#evidence-e033), [E038](#evidence-e038), [E039](#evidence-e039), [E040](#evidence-e040), [E046](#evidence-e046), [E047](#evidence-e047), [E048](#evidence-e048), [E391](#evidence-e391), [E389](#evidence-e389), [E390](#evidence-e390)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R44 real booking 201 và stale promo409; chưa UI mất ghế, hết hold/max holds, double-submit và payment-link navigation.. Gap: R71-FE-KH-07.



**Test IDs / raw case identities:** `R6.1-01`, `R6.1-02`, `R6.1-03`, `R6.1-06`, `R6.1-07`, `R6.1-08`, `R6.1-09`, `R6.1-10`, `R6.1-11`, `R6.1-12`, `R6.1-13`, `R6.1-14`, `R6.2-01`, `R6.2-02`, `R6.2-03`, `R6.2-04`, `REG-BOOKING-NEGATIVE`, `REG-BOOKING-ROLLBACK`, `stale preview rejected without success or automatic full-price retry`, `booking final amount replaces old preview`, `booking payload contains only IDs quantities and code`

**R7.3 acceptance rationale:** Đặt vé: DB/BE PASS theo E031, E041, E042, E043, E034, E035, E036, E037, E044, E045, E032, E033, E038, E039, E040, E046, E047, E048, E391, E389, E390; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/6`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-07 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/6`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-08"></a>

### KH-08 — Đồ ăn kèm vé

**Mục tiêu:** Cho phép khách hàng chọn thêm sản phẩm ăn uống/combo trong quá trình đặt vé.

**Luồng baseline:** 1. Trong bước đặt vé, khách hàng xem danh sách SANPHAM đang kinh doanh. → 2. Khách hàng chọn sản phẩm và số lượng mong muốn. → 3. Hệ thống lưu lựa chọn vào CHITIETDOAN gắn với DONDATVE, ghi nhận đơn giá tại thời điểm mua (đơn giá snapshot).

**Nguồn:** [Đặc tả dòng 147](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer đặt vé; product đang bán, quantity integer hợp lệ.

**Kết quả mong đợi:** Có/không food đúng; mỗi dòng quantity/unit snapshot; reject unavailable/qty11 hoặc duplicate split vượt10.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Booking_Create](<../database/08_procedures/booking/sp_Booking_Create.sql>), [sp_Product_ListActive](<../database/08_procedures/public/sp_Product_ListActive.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_GioiHanDonDangGiu](<../database/05_functions/fn_GioiHanDonDangGiu.sql>), [fn_GioiHanGheMoiDon](<../database/05_functions/fn_GioiHanGheMoiDon.sql>), [fn_GioiHanGiamGiaPhanTram](<../database/05_functions/fn_GioiHanGiamGiaPhanTram.sql>), [fn_GioiHanSoLuongSanPham](<../database/05_functions/fn_GioiHanSoLuongSanPham.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [fn_ThoiGianGiuChoPhut](<../database/05_functions/fn_ThoiGianGiuChoPhut.sql>), [fn_TinhGiaVe](<../database/05_functions/fn_TinhGiaVe.sql>), [sp_Order_ExpirePending](<../database/08_procedures/customer/sp_Order_ExpirePending.sql>), [sp_Promotion_Validate](<../database/08_procedures/public/sp_Promotion_Validate.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>), [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SANPHAM active; CHITIETDOAN FK/CHECK SoLuong>0; booking SUM product duplicates rồi limit; tiền snapshot thuộc SQL.

**Authorization:** Products public; booking Customer+DAT_VE, không permission food mới.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/products | [route:5](<../backend/src/routes/productRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [bookingController.listProducts](<../backend/src/controllers/bookingController.js>) | [bookingService.listProducts](<../backend/src/services/bookingService.js>) | PRODUCT_LIST_ACTIVE → dbo.sp_Product_ListActive |
| POST /api/bookings | [route:8](<../backend/src/routes/bookingRoutes.js>) | authenticate → requireCustomer | AND(DAT_VE) | [bookingController.createBooking](<../backend/src/controllers/bookingController.js>) | [bookingService.createBooking](<../backend/src/services/bookingService.js>) | BOOKING_CREATE → dbo.sp_Booking_Create |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /booking/:showtimeId → ProductPicker/BookingPreparation → catalogApi.getProducts/createBooking; qty0 bỏ chọn, qty≤10/product; loading/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [catalogApi.js](<../frontend/src/api/catalogApi.js>), [ProductPicker.jsx](<../frontend/src/components/ProductPicker.jsx>), [BookingPreparation.jsx](<../frontend/src/pages/BookingPreparation.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031), [E041](#evidence-e041), [E042](#evidence-e042), [E045](#evidence-e045), [E047](#evidence-e047), [E373](#evidence-e373), [E392](#evidence-e392), [E389](#evidence-e389), [E390](#evidence-e390)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R44 browser chọn1food và snapshot authoritative; chưa qty0/10/11, nhiều product, inactive product và empty list.. Gap: R71-FE-KH-08.



**Test IDs / raw case identities:** `R6.1-01`, `R6.1-02`, `R6.1-03`, `R6.1-12`, `REG-BOOKING-NEGATIVE`, `R6.4-r32-sql-monetary-001`, `new preview reads current DB prices`, `booking final amount replaces old preview`, `booking payload contains only IDs quantities and code`

**R7.3 acceptance rationale:** Đồ ăn kèm vé: DB/BE PASS theo E031, E041, E042, E045, E047, E373, E392, E389, E390; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/7`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-08 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/7`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-09"></a>

### KH-09 — Khuyến mãi

**Mục tiêu:** Trong lúc đặt vé, khách hàng nhập mã khuyến mãi để được giảm giá nếu mã hợp lệ.

**Luồng baseline:** 1. Khách hàng nhập mã khuyến mãi ở bước đặt vé. → 2. Hệ thống tra cứu KHUYENMAI theo mã, kiểm tra thời gian hiệu lực, số lượng sử dụng còn lại và điều kiện đơn hàng tối thiểu. → 3. Nếu hợp lệ: hệ thống tính TienGiamGia (theo % hoặc số tiền cố định, có giới hạn mức giảm tối đa) và gắn KhuyenMaiID vào DONDATVE. → 4. Nếu không hợp lệ: hệ thống báo lỗi và không áp dụng giảm giá; đơn vẫn có thể tiếp tục mà không cần khuyến mãi (KhuyenMaiID được phép để trống).

**Nguồn:** [Đặc tả dòng 157](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer+DAT_VE, có seats/foods và code; promo active, trong thời gian, đủ minimum/quota.

**Kết quả mong đợi:** Preview read only; final tái kiểm dưới lock, discount snapshot/quota đúng; invalid yêu cầu409, không âm thầm full price.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Booking_Create](<../database/08_procedures/booking/sp_Booking_Create.sql>), [sp_Product_ListActive](<../database/08_procedures/public/sp_Product_ListActive.sql>), [sp_Promotion_Validate](<../database/08_procedures/public/sp_Promotion_Validate.sql>), [sp_Seat_ListByShowtime](<../database/08_procedures/public/sp_Seat_ListByShowtime.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DanhSachGheSuatChieu](<../database/05_functions/fn_DanhSachGheSuatChieu.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_GioiHanDonDangGiu](<../database/05_functions/fn_GioiHanDonDangGiu.sql>), [fn_GioiHanGheMoiDon](<../database/05_functions/fn_GioiHanGheMoiDon.sql>), [fn_GioiHanGiamGiaPhanTram](<../database/05_functions/fn_GioiHanGiamGiaPhanTram.sql>), [fn_GioiHanSoLuongSanPham](<../database/05_functions/fn_GioiHanSoLuongSanPham.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [fn_ThoiGianGiuChoPhut](<../database/05_functions/fn_ThoiGianGiuChoPhut.sql>), [fn_TinhGiaVe](<../database/05_functions/fn_TinhGiaVe.sql>), [sp_Order_ExpirePending](<../database/08_procedures/customer/sp_Order_ExpirePending.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>), [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** sp_Promotion_Validate/sp_Booking_Create và cap99% truncate2decimals; preview provisional subtotal exception đã chốt; booking final SQL-owned; quota serialize/rollback.

**Authorization:** authenticate→Customer→DAT_VE; promotion SP nhận trusted customer; client không gửi accepted/amount.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/promotions/validate | [route:8](<../backend/src/routes/promotionRoutes.js>) | authenticate → requireCustomer | AND(DAT_VE) | [bookingController.validatePromotion](<../backend/src/controllers/bookingController.js>) | [bookingService.validatePromotion](<../backend/src/services/bookingService.js>) | SEAT_LIST_BY_SHOWTIME → dbo.sp_Seat_ListByShowtime; PRODUCT_LIST_ACTIVE → dbo.sp_Product_ListActive; PROMOTION_VALIDATE → dbo.sp_Promotion_Validate |
| POST /api/bookings | [route:8](<../backend/src/routes/bookingRoutes.js>) | authenticate → requireCustomer | AND(DAT_VE) | [bookingController.createBooking](<../backend/src/controllers/bookingController.js>) | [bookingService.createBooking](<../backend/src/services/bookingService.js>) | BOOKING_CREATE → dbo.sp_Booking_Create |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. SEAT_CONFLICT/SEAT_UNAVAILABLE/SHOWTIME_UNAVAILABLE/PROMOTION_NOT_AVAILABLE/ACTIVE_ORDER_LIMIT_REACHED409; invalidproducts400. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /booking/:showtimeId → BookingPreparation → catalogApi.validatePromotion/createBooking; provisional quote, previewVersion chống stale, explicit review khi409.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [catalogApi.js](<../frontend/src/api/catalogApi.js>), [BookingPreparation.jsx](<../frontend/src/pages/BookingPreparation.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031), [E049](#evidence-e049), [E050](#evidence-e050), [E037](#evidence-e037), [E051](#evidence-e051), [E047](#evidence-e047), [E048](#evidence-e048), [E373](#evidence-e373), [E393](#evidence-e393), [E391](#evidence-e391), [E394](#evidence-e394), [E392](#evidence-e392), [E389](#evidence-e389), [E429](#evidence-e429), [E430](#evidence-e430), [E431](#evidence-e431)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R44 browser real stale/pause/requote/final price; R22 controlled timing. Chưa UI quota/minimum/expired, đổi code/seat/food với SQL thật.. Gap: R71-FE-KH-09.



**Test IDs / raw case identities:** `R6.1-01`, `R6.1-04`, `R6.1-05`, `R6.1-10`, `R6.2-05`, `REG-BOOKING-NEGATIVE`, `REG-BOOKING-ROLLBACK`, `R6.4-r32-sql-monetary-001`, `valid real preview clearly provisional`, `stale preview rejected without success or automatic full-price retry`, `invalidated promotion requires explicit review`, `new preview reads current DB prices`, `booking final amount replaces old preview`

**R7.3 acceptance rationale:** Khuyến mãi: DB/BE PASS theo E031, E049, E050, E037, E051, E047, E048, E373, E393, E391, E394, E392, E389; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/8`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-09 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/8`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-10"></a>

### KH-10 — Thanh toán

**Mục tiêu:** Khách hàng thực hiện thanh toán cho đơn đặt vé đã tạo; một đơn có thể có nhiều lần thử giao dịch.

**Luồng baseline:** 1. Khách hàng chọn DonDatVeID cần thanh toán và phương thức thanh toán. → 2. Hệ thống tạo bản ghi THANHTOAN (số tiền, phương thức, thời gian, mã giao dịch, trạng thái = đang xử lý). → 3. Hệ thống ghi nhận kết quả giao dịch trả về và cập nhật trạng thái bản ghi THANHTOAN tương ứng. → 4. Hệ thống đồng bộ trạng thái DONDATVE.TrangThai theo kết quả thanh toán mới nhất. → 5. Thời gian giữ ghế KHÔNG được gia hạn dưới bất kỳ thao tác nào (kể cả bắt đầu thanh toán hay thanh toán thất bại); không thể bắt đầu thanh toán đơn đã hết hạn giữ ghế. Kết quả thanh toán thành công đến muộn sau hạn giữ vẫn được ghi nhận nếu suất chiếu còn mở bán và không đơn nào khác đang giữ hoặc đã mua các ghế đó (thanh toán hiện là mô phỏng; khi tích hợp cổng thanh toán thật cần chính sách riêng cho trường hợp này). Thanh toán thành công là hoàn tất: hệ thống không có chức năng hoàn tiền và không hủy đơn đã thanh toán.

**Nguồn:** [Đặc tả dòng 167](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Own payable order, active Customer+THANH_TOAN; hold valid.

**Kết quả mong đợi:** Attempt amount=stored order; fail/retry/success history, terminal idempotence/flip409, loyalty once, wrong owner404; hold không kéo dài.

**Database:** [BOITHUONG_HUYSUAT](<../database/02_tables/boithuong_huysuat.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Order_GetDetailByCustomer](<../database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql>), [sp_Payment_CreateAttempt](<../database/08_procedures/payment/sp_Payment_CreateAttempt.sql>), [sp_Payment_UpdateResult](<../database/08_procedures/payment/sp_Payment_UpdateResult.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [sp_Order_ExpirePending](<../database/08_procedures/customer/sp_Order_ExpirePending.sql>), [vw_ChiTietDonDatVe](<../database/06_views/vw_ChiTietDonDatVe.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [FK_CHITIETDOAN_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [FK_CHITIETDOAN_SanPham](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [CK_CHITIETDOAN_DonGia](<../database/03_constraints/003_check_constraints.sql>); CHITIETDOAN: [CK_CHITIETDOAN_SoLuong](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Payment SP amount từ snapshot; identity+order/payment ownership; own/savepoint TX; expiry owner riêng, quota release once; financial state rollback khi loyalty overflow.

**Authorization:** authenticate→Customer; pay writes THANH_TOAN; SQL ownership NguoiDungID và DonDatVeID/ThanhToanID.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/orders/:orderId/payments | [route:11](<../backend/src/routes/orderRoutes.js>) | authenticate → requireCustomer | AND(THANH_TOAN) | [orderController.createPayment](<../backend/src/controllers/orderController.js>) | [orderService.createPaymentAttempt](<../backend/src/services/orderService.js>) | ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer; PAYMENT_CREATE_ATTEMPT → dbo.sp_Payment_CreateAttempt |
| POST /api/orders/:orderId/payments/:paymentId/result | [route:12](<../backend/src/routes/orderRoutes.js>) | authenticate → requireCustomer | AND(THANH_TOAN) | [orderController.updatePayment](<../backend/src/controllers/orderController.js>) | [orderService.updatePaymentResult](<../backend/src/services/orderService.js>) | PAYMENT_UPDATE_RESULT → dbo.sp_Payment_UpdateResult; ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |
| GET /api/orders/:orderId | [route:10](<../backend/src/routes/orderRoutes.js>) | authenticate → requireCustomer | N/A — public/self-read/bootstrap contract | [orderController.getOrder](<../backend/src/controllers/orderController.js>) | [orderService.getOrderDetail](<../backend/src/services/orderService.js>) | ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /orders/:orderId/payment → RequireRole(Customer)/PaymentPage → ordersApi.getOrder/createPaymentAttempt/submitPaymentResult; simulated confirm, busy/error/deadline/history.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [ordersApi.js](<../frontend/src/api/ordersApi.js>), [PaymentPage.jsx](<../frontend/src/pages/PaymentPage.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E052](#evidence-e052), [E053](#evidence-e053), [E054](#evidence-e054), [E055](#evidence-e055), [E056](#evidence-e056), [E057](#evidence-e057), [E058](#evidence-e058), [E059](#evidence-e059), [E373](#evidence-e373), [E395](#evidence-e395), [E396](#evidence-e396)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R44 browser successful payment/SQL amount; chưa UI failed→retry history, expiry, revoked permission, terminal replay/flip.. Gap: R71-FE-KH-10.



**Test IDs / raw case identities:** `R6.3-01`, `R6.3-02`, `R6.3-03`, `R6.3-04`, `R6.3-05`, `R6.3-06`, `R6.3-07`, `REG-PAYMENT-ROLLBACK`, `R6.4-r32-sql-monetary-001`, `payment page displays authoritative order amount`, `payment amount comes from stored order without client money`

**R7.3 acceptance rationale:** Thanh toán: DB/BE PASS theo E052, E053, E054, E055, E056, E057, E058, E059, E373, E395, E396; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/9`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-10 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/9`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-11"></a>

### KH-11 — Lịch sử đơn

**Mục tiêu:** Khách hàng xem lại danh sách các đơn đặt vé đã thực hiện.

**Luồng baseline:** 1. Khách hàng truy cập trang lịch sử đơn hàng. → 2. Hệ thống truy vấn các bản ghi DONDATVE theo đúng NguoiDungID đang đăng nhập. → 3. Hệ thống hiển thị danh sách đơn kèm thông tin tóm tắt: suất chiếu, tổng tiền, trạng thái đơn.

**Nguồn:** [Đặc tả dòng 177](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer active authenticated.

**Kết quả mong đợi:** Chỉ đơn của Customer, lịch sử paid/failed/expired và số tiền snapshot đúng; không lộ đơn khác.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>).

**Entry points:** [sp_Order_ListByCustomer](<../database/08_procedures/customer/sp_Order_ListByCustomer.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [vw_LichSuDatVe](<../database/06_views/vw_LichSuDatVe.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** sp_Order_ListByCustomer filter NguoiDungID; vw_TomTatDonDatVe projection/effective status; SELECT-only.

**Authorization:** authenticate→Customer; own GET không DAT_VE/THANH_TOAN write permission.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/orders | [route:9](<../backend/src/routes/orderRoutes.js>) | authenticate → requireCustomer | N/A — public/self-read/bootstrap contract | [orderController.listOrders](<../backend/src/controllers/orderController.js>) | [orderService.listOrders](<../backend/src/services/orderService.js>) | ORDER_LIST_BY_CUSTOMER → dbo.sp_Order_ListByCustomer |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /orders → RequireRole(Customer)/Orders → ordersApi.getOrders; loading/error/retry/empty, order cards links.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [ordersApi.js](<../frontend/src/api/ordersApi.js>), [Orders.jsx](<../frontend/src/pages/Orders.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E052](#evidence-e052), [E060](#evidence-e060)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser history nonempty/mixed statuses, empty, direct navigation và error retry.. Gap: R71-FE-KH-11.



**Test IDs / raw case identities:** `R6.3-01`; records without a test ID: E060 `/requests/86` (artifact is linked in registry).

**R7.3 acceptance rationale:** Lịch sử đơn: DB/BE PASS theo E052, E060; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/10`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-11 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/10`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-12"></a>

### KH-12 — Chi tiết đơn

**Mục tiêu:** Khách hàng xem đầy đủ thông tin của một đơn đặt vé cụ thể thuộc chính mình.

**Luồng baseline:** 1. Khách hàng chọn một đơn từ danh sách lịch sử. → 2. Hệ thống truy vấn DONDATVE kết hợp SUATCHIEU/PHIM, CHITIETVE/GHE, CHITIETDOAN/SANPHAM và THANHTOAN liên quan. → 3. Hệ thống hiển thị đầy đủ chi tiết: phim, suất chiếu, ghế đã đặt, đồ ăn kèm theo, các giao dịch thanh toán. → 4. Hệ thống chỉ cho phép xem đơn thuộc đúng tài khoản đang đăng nhập (BR04).

**Nguồn:** [Đặc tả dòng 187](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Authenticated Customer; own order ID.

**Kết quả mong đợi:** Bốn recordsets đúng order/tickets/foods/payments; foreign404; GET expiry projection không write/quota mutation.

**Database:** [BOITHUONG_HUYSUAT](<../database/02_tables/boithuong_huysuat.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>).

**Entry points:** [sp_Order_GetDetailByCustomer](<../database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [vw_ChiTietDonDatVe](<../database/06_views/vw_ChiTietDonDatVe.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [FK_CHITIETDOAN_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [FK_CHITIETDOAN_SanPham](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [CK_CHITIETDOAN_DonGia](<../database/03_constraints/003_check_constraints.sql>); CHITIETDOAN: [CK_CHITIETDOAN_SoLuong](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** R4.7 detail SELECT-only; effective state theo DB clock; sp_Order_ExpirePending riêng owns cleanup; monetary snapshot và compensationledger read.

**Authorization:** authenticate→Customer; SQL trusted owner; GET không write permission.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/orders/:orderId | [route:10](<../backend/src/routes/orderRoutes.js>) | authenticate → requireCustomer | N/A — public/self-read/bootstrap contract | [orderController.getOrder](<../backend/src/controllers/orderController.js>) | [orderService.getOrderDetail](<../backend/src/services/orderService.js>) | ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /orders/:orderId → RequireRole(Customer)/OrderDetail → ordersApi.getOrder; tickets/foods/payments/summary/HoldDeadline; loading/error/retry.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [ordersApi.js](<../frontend/src/api/ordersApi.js>), [HoldDeadline.jsx](<../frontend/src/components/HoldDeadline.jsx>), [OrderDetail.jsx](<../frontend/src/pages/OrderDetail.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E031](#evidence-e031), [E037](#evidence-e037), [E052](#evidence-e052), [E053](#evidence-e053), [E373](#evidence-e373)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser full detail và expired/effective status, foreign404, timeline/foodempty; R44 PaymentPage order read không chứng minh OrderDetail component.. Gap: R71-FE-KH-12.



**Test IDs / raw case identities:** `R6.1-01`, `R6.1-10`, `R6.3-01`, `R6.3-02`, `R6.4-r32-sql-monetary-001`

**R7.3 acceptance rationale:** Chi tiết đơn: DB/BE PASS theo E031, E037, E052, E053, E373; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/11`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-12 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/11`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-13"></a>

### KH-13 — Đánh giá

**Mục tiêu:** Khách hàng đánh giá một phim đã xem bằng số sao và nội dung nhận xét; mỗi người chỉ được đánh giá một phim một lần.

**Luồng baseline:** 1. Khách hàng chọn phim muốn đánh giá. → 2. Hệ thống kiểm tra khách hàng có lịch sử DONDATVE hợp lệ (trạng thái đã thanh toán/hoàn thành) gắn với SUATCHIEU của phim này và suất chiếu đó đã bắt đầu (điều kiện phải có lịch sử xem hợp lệ). → 3. Hệ thống kiểm tra khách hàng chưa từng đánh giá phim này. → 4. Khách hàng nhập số sao và nội dung; hệ thống tạo bản ghi DANHGIAPHIM.

**Nguồn:** [Đặc tả dòng 197](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer paid/completed order cho phim, suất đã bắt đầu, chưa review; DANH_GIA.

**Kết quả mong đợi:** 201 review hợp lệ; noneligible403, duplicate409, invalidrating400; read after write list đúng.

**Database:** [DANHGIAPHIM](<../database/02_tables/danhgiaphim.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Review_Create](<../database/08_procedures/customer/sp_Review_Create.sql>), [sp_Review_ListByMovie](<../database/08_procedures/customer/sp_Review_ListByMovie.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_DanhGia_KiemTraDaXemPhim](<../database/07_triggers/TRG_DanhGia_KiemTraDaXemPhim.sql>).

**Constraints:** DANHGIAPHIM: [PK_DANHGIAPHIM](<../database/03_constraints/001_primary_unique.sql>); DANHGIAPHIM: [UQ_DANHGIAPHIM_Phim_User](<../database/03_constraints/001_primary_unique.sql>); DANHGIAPHIM: [FK_DANHGIAPHIM_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DANHGIAPHIM: [FK_DANHGIAPHIM_Phim](<../database/03_constraints/002_foreign_keys.sql>); DANHGIAPHIM: [CK_DANHGIAPHIM_SoSao](<../database/03_constraints/003_check_constraints.sql>); DANHGIAPHIM: [DF_DANHGIAPHIM_NgayDanhGia_ClockVN](<../database/03_constraints/005_function_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** TRG_DanhGia_KiemTraDaXemPhim AFTER INSERT; paid/order/show eligibility; rating CHECK và UNIQUE customer/movie; trigger failure atomic INSERT.

**Authorization:** Public list; create authenticate→Customer→DANH_GIA; SQL current grant + eligibility trigger.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/movies/:movieId/reviews | [route:11](<../backend/src/routes/movieRoutes.js>) | Public | N/A — public/self-read/bootstrap contract | [feedbackController.listReviews](<../backend/src/controllers/feedbackController.js>) | [feedbackService.listReviews](<../backend/src/services/feedbackService.js>) | REVIEW_LIST_BY_MOVIE → dbo.sp_Review_ListByMovie |
| POST /api/movies/:movieId/reviews | [route:12](<../backend/src/routes/movieRoutes.js>) | authenticate → requireCustomer | AND(DANH_GIA) | [feedbackController.createReview](<../backend/src/controllers/feedbackController.js>) | [feedbackService.createReview](<../backend/src/services/feedbackService.js>) | REVIEW_CREATE → dbo.sp_Review_Create |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. REVIEW_NOT_ELIGIBLE403; REVIEW_ALREADY_EXISTS409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /movies/:movieId → MovieReviews → feedbackApi.getReviews/createReview; rating1–5/content, submit/error, empty/retry, permission-gated form.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [feedbackApi.js](<../frontend/src/api/feedbackApi.js>), [MovieReviews.jsx](<../frontend/src/components/MovieReviews.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E374](#evidence-e374), [E377](#evidence-e377), [E378](#evidence-e378), [E379](#evidence-e379), [E432](#evidence-e432)

**R7.2 DB/BE PASS:** 12 case thực tế PASS; R71-DB-01 RESOLVED. Contract: Eligible paid/completed order for started movie; authenticated Customer + DANH_GIA; rating integer 1–5; one review per movie/customer. **Overall vẫn PARTIAL:** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser review create/list, eligibility/duplicate/permission/errors.. Gap FE còn lại: R71-FE-KH-13.



**R7.2 evidence:** [case index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), test IDs `KH13-01`, `KH13-02`, `KH13-02-future`, `KH13-02-pending`, `KH13-03`, `KH13-04-0`, `KH13-04-1`, `KH13-04-2`, `KH13-04-3`, `KH13-05`, `KH13-06-role`, `KH13-06-spoof`; SQL/HTTP pointers, fingerprint và cleanup theo từng case. Policy: [approved decisions](contracts/R7_2_APPROVED_POLICIES.md).


**Test IDs / raw case identities:** `R55-ROLLBACK`, `R55-COMMIT`, `R55-NEGATIVE`, `KH13-01`, `KH13-02`, `KH13-02-future`, `KH13-02-pending`, `KH13-03`, `KH13-04-0`, `KH13-04-1`, `KH13-04-2`, `KH13-04-3`, `KH13-05`, `KH13-06-role`, `KH13-06-spoof`

**R7.3 acceptance rationale:** Đánh giá: DB/BE PASS theo E377, E378, E379, E432 và 12 case R7.2 đã đối chiếu raw SQL/HTTP, authorization, fingerprint và cleanup; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/12`. Freshness: New R7.2 real SQL/HTTP cases on approved canonical definitions.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-13 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/12`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-kh-14"></a>

### KH-14 — Khiếu nại

**Mục tiêu:** Người dùng gửi khiếu nại khi phát hiện vấn đề trong quá trình sử dụng hệ thống, có thể gửi bất kỳ lúc nào, kể cả không gắn với đơn cụ thể.

**Luồng baseline:** 1. Người dùng chọn chức năng gửi khiếu nại, nhập loại khiếu nại, tiêu đề, nội dung. → 2. (Tuỳ chọn) người dùng chọn DonDatVeID liên quan nếu khiếu nại gắn với một đơn cụ thể; trường này được phép để trống (BR06 - không dùng để suy ra người gửi). → 3. Hệ thống tạo bản ghi KHIEUNAI với trạng thái ban đầu (chưa xử lý) và ghi nhận thời gian tạo, người gửi.

**Nguồn:** [Đặc tả dòng 207](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.

**Kết quả mong đợi:** 201 linked/unlinked, own list/detail + permitted processing timeline; foreign/missing order404, không lộ staff identity.

**Database:** [DONDATVE](<../database/02_tables/dondatve.sql>), [KHIEUNAI](<../database/02_tables/khieunai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>), [XULY_KHIEUNAI](<../database/02_tables/xuly_khieunai.sql>).

**Entry points:** [sp_Complaint_Create](<../database/08_procedures/customer/sp_Complaint_Create.sql>), [sp_Complaint_GetByCustomer](<../database/08_procedures/customer/sp_Complaint_GetByCustomer.sql>), [sp_Complaint_ListByCustomer](<../database/08_procedures/customer/sp_Complaint_ListByCustomer.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai](<../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql>), [TRG_XuLyKhieuNai_KiemTraVaiTro](<../database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql>).

**Constraints:** DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TienGiamGia](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TongTienDoAn](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TongTienVe](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [DF_DONDATVE_TongTienVe](<../database/03_constraints/004_defaults.sql>); DONDATVE: [DF_DONDATVE_TongTienDoAn](<../database/03_constraints/004_defaults.sql>); DONDATVE: [DF_DONDATVE_TienGiamGia](<../database/03_constraints/004_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** KHIEUNAI FK/order ownership guard; XULY_KHIEUNAI immutable timeline projection; status CHECK; orderref null hợp lệ.

**Authorization:** Customer; create GUI_KHIEU_NAI; own reads không cần write grant; trusted owner.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/complaints | [route:10](<../backend/src/routes/complaintRoutes.js>) | authenticate → requireCustomer | AND(GUI_KHIEU_NAI) | [feedbackController.createComplaint](<../backend/src/controllers/feedbackController.js>) | [feedbackService.createComplaint](<../backend/src/services/feedbackService.js>) | COMPLAINT_CREATE → dbo.sp_Complaint_Create |
| GET /api/complaints | [route:9](<../backend/src/routes/complaintRoutes.js>) | authenticate → requireCustomer | N/A — public/self-read/bootstrap contract | [feedbackController.listComplaints](<../backend/src/controllers/feedbackController.js>) | [feedbackService.listComplaints](<../backend/src/services/feedbackService.js>) | COMPLAINT_LIST_BY_CUSTOMER → dbo.sp_Complaint_ListByCustomer |
| GET /api/complaints/:complaintId | [route:11](<../backend/src/routes/complaintRoutes.js>) | authenticate → requireCustomer | N/A — public/self-read/bootstrap contract | [feedbackController.getComplaint](<../backend/src/controllers/feedbackController.js>) | [feedbackService.getComplaint](<../backend/src/services/feedbackService.js>) | COMPLAINT_GET_BY_CUSTOMER → dbo.sp_Complaint_GetByCustomer |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /complaints → Complaints; /complaints/:complaintId → ComplaintDetail → feedbackApi.getComplaints/createComplaint/getComplaint + ordersApi.getOrders; optional owned-order selector, loading/error/empty/timeline.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [feedbackApi.js](<../frontend/src/api/feedbackApi.js>), [ordersApi.js](<../frontend/src/api/ordersApi.js>), [ComplaintDetail.jsx](<../frontend/src/pages/ComplaintDetail.jsx>), [Complaints.jsx](<../frontend/src/pages/Complaints.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E110](#evidence-e110), [E111](#evidence-e111), [E112](#evidence-e112), [E113](#evidence-e113), [E114](#evidence-e114), [E115](#evidence-e115), [E116](#evidence-e116), [E117](#evidence-e117), [E118](#evidence-e118), [E119](#evidence-e119)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser linked/unlinked complaint submit, list/detail, status refresh và customer-safe timeline.. Gap: R71-FE-KH-14.



**Test IDs / raw case identities:** `R6.8-linked-01`, `R6.8-linked-08`, `R6.8-linked-09`, `R6.8-linked-10`, `R6.8-linked-11`, `R6.8-linked-18`, `R6.8-linked-19`, `R6.8-linked-20`, `R6.8-linked-35`, `R6.8-linked-36`

**R7.3 acceptance rationale:** Khiếu nại: DB/BE PASS theo E110, E111, E112, E113, E114, E115, E116, E117, E118, E119; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/13`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [KH-14 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/13`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-01"></a>

### QLR-01 — Đăng nhập/rạp phân công

**Mục tiêu:** Quản lý rạp đăng nhập để truy cập khu vực Manager (dashboard rạp, phòng, ghế, suất chiếu, bảng giá, thống kê doanh thu).

**Luồng baseline:** 1. Quản lý rạp nhập Email + mật khẩu. → 2. Hệ thống xác thực tài khoản, xác định vai trò QUAN_LY_RAP và tra cứu quyền qua VAITRO_QUYEN. → 3. Hệ thống kiểm tra thêm PHANCONG_RAP còn hiệu lực để xác định phạm vi rạp được truy cập. → 4. Hệ thống điều hướng vào khu vực Manager tương ứng.

**Nguồn:** [Đặc tả dòng 219](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager hoạt động; có thể không có assignment hiện tại.

**Kết quả mong đợi:** Login Manager; assigned list chỉ phân công còn hiệu lực; token cũ không giữ scope revoked/expired.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Auth_Login](<../database/08_procedures/auth/sp_Auth_Login.sql>), [sp_Manager_ListAssignedCinemas](<../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql>), [sp_RBAC_GetPermissionsByUser](<../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql>), [sp_User_GetCurrent](<../database/08_procedures/auth/sp_User_GetCurrent.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHANCONG_RAP: [PK_PHANCONG_RAP](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** PHANCONG_RAP current status/date, fn_KiemTraQuanLyRapScope; login bootstrap current grants; no cached scope.

**Authorization:** authenticate→Manager; GETcinemas bootstrap không functional grant; SQL role+live assignment.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/auth/login | [route:7](<../backend/src/routes/authRoutes.js>) | Public + app.createAuthRateLimiter before JSON parser | N/A — public/self-read/bootstrap contract | [authController.login](<../backend/src/controllers/authController.js>) | [authService.login](<../backend/src/services/authService.js>) | AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [route:8](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentUser](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [route:10](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentPermissions](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/manager/cinemas | [route:9](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | N/A — public/self-read/bootstrap contract | [managerController.listCinemas](<../backend/src/controllers/managerController.js>) | [managerService.listCinemas](<../backend/src/services/managerService.js>) | MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /login → Login/AuthProvider; /manager → RequireRole(Manager)/ManagerPortal → managerApi.getAssignedCinemas; assigned cinema selector, loading/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>), [Login.jsx](<../frontend/src/pages/auth/Login.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E012](#evidence-e012), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011), [E061](#evidence-e061), [E062](#evidence-e062), [E063](#evidence-e063)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser login Manager→/manager, assigned selector và empty/expired/revoked scope.. Gap: R71-FE-QLR-01.



**Test IDs / raw case identities:** `real login JWT/current permissions/assignments QUAN_LY_RAP`, `under-limit invalid/unknown credentials keep existing generic401`, `real four-role RBAC and non-auth endpoints preserved`, `account status and existing JWT live recheck unchanged`, `R4.5-07 login beyond production threshold never calls actual service/SQL`, `spoof resistance and other endpoints work with login/register counters exhausted`, `R4.5-04/10 exact expiry allows manual retry through real auth SP without sleeps`, `R6.5-01`, `R6.5-03`, `R6.5-04`

**R7.3 acceptance rationale:** Đăng nhập/rạp phân công: DB/BE PASS theo E012, E006, E007, E008, E009, E010, E011, E061, E062, E063; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/14`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-01 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/14`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-02"></a>

### QLR-02 — Quản lý phòng

**Mục tiêu:** Thêm/sửa/xóa thông tin phòng chiếu, chỉ trong phạm vi rạp đang được phân công quản lý.

**Luồng baseline:** 1. Quản lý rạp truy cập màn hình quản lý phòng chiếu. → 2. Hệ thống kiểm tra PHANCONG_RAP còn hiệu lực của tài khoản để xác định danh sách rạp được phép thao tác (BR08). → 3. Quản lý rạp thêm/sửa/xóa PHONGCHIEU (tên phòng, loại phòng, trạng thái) thuộc rạp trong phạm vi được phân công. → 4. Hệ thống từ chối thao tác nếu phòng chiếu không thuộc rạp được phân công.

**Nguồn:** [Đặc tả dòng 229](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+QL_PHONG, current assignment to resource cinema.

**Kết quả mong đợi:** Scoped rooms CRUD; history guard/deactivate policy; concurrent dependency không partial delete; foreign403.

**Database:** [GHE](<../database/02_tables/ghe.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Room_Create](<../database/08_procedures/manager/sp_Manager_Room_Create.sql>), [sp_Manager_Room_Delete](<../database/08_procedures/manager/sp_Manager_Room_Delete.sql>), [sp_Manager_Room_List](<../database/08_procedures/manager/sp_Manager_Room_List.sql>), [sp_Manager_Room_Update](<../database/08_procedures/manager/sp_Manager_Room_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** GHE: [PK_GHE](<../database/03_constraints/001_primary_unique.sql>); GHE: [UQ_GHE_ViTri](<../database/03_constraints/001_primary_unique.sql>); GHE: [FK_GHE_Phong](<../database/03_constraints/002_foreign_keys.sql>); GHE: [CK_GHE_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); GHE: [CK_GHE_SoGhe](<../database/03_constraints/003_check_constraints.sql>); GHE: [CK_GHE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); GHE: [DF_GHE_LoaiGhe](<../database/03_constraints/004_defaults.sql>); GHE: [DF_GHE_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Room delete guarded TX/savepoint; FK seat/show references; delete/history race locks and rollback; cinema derived from room resource.

**Authorization:** authenticate→Manager→QL_PHONG; SQL scope từ phòng→rạp; không tin spoof cinemaId.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/cinemas/:cinemaId/rooms | [route:10](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_PHONG) | [managerController.listRooms](<../backend/src/controllers/managerController.js>) | [managerService.listRooms](<../backend/src/services/managerService.js>) | MANAGER_ROOM_LIST → dbo.sp_Manager_Room_List |
| POST /api/manager/cinemas/:cinemaId/rooms | [route:11](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_PHONG) | [managerController.createRoom](<../backend/src/controllers/managerController.js>) | [managerService.createRoom](<../backend/src/services/managerService.js>) | MANAGER_ROOM_CREATE → dbo.sp_Manager_Room_Create |
| PUT /api/manager/rooms/:roomId | [route:12](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_PHONG) | [managerController.updateRoom](<../backend/src/controllers/managerController.js>) | [managerService.updateRoom](<../backend/src/services/managerService.js>) | MANAGER_ROOM_UPDATE → dbo.sp_Manager_Room_Update |
| DELETE /api/manager/rooms/:roomId | [route:13](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_PHONG) | [managerController.deleteRoom](<../backend/src/controllers/managerController.js>) | [managerService.deleteRoom](<../backend/src/services/managerService.js>) | MANAGER_ROOM_DELETE → dbo.sp_Manager_Room_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal/ManagerResourceForm → managerApi.getRooms/createRoom/updateRoom/deleteRoom + utils/managerForms.js; loading/error/empty, edit/delete/reload.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerResourceForm.jsx](<../frontend/src/components/ManagerResourceForm.jsx>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>), [managerForms.js](<../frontend/src/utils/managerForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E064](#evidence-e064), [E062](#evidence-e062), [E063](#evidence-e063), [E065](#evidence-e065), [E066](#evidence-e066), [E069](#evidence-e069), [E070](#evidence-e070), [E071](#evidence-e071), [E072](#evidence-e072), [E073](#evidence-e073), [E074](#evidence-e074), [E075](#evidence-e075), [E076](#evidence-e076), [E077](#evidence-e077), [E078](#evidence-e078), [E079](#evidence-e079), [E080](#evidence-e080), [E081](#evidence-e081)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser room CRUD, history/deactivate conflict, denied scope and refresh list.. Gap: R71-FE-QLR-02.



**Test IDs / raw case identities:** `R6.5-02`, `R6.5-03`, `R6.5-04`, `R6.5-05`, `R6.5-06`, `R6.6-r11-api-states-001`, `R6.6-r11-api-states-002`, `R6.6-r11-api-states-003`, `R6.6-r11-api-states-004`, `R6.6-r11-api-states-005`, `R6.6-r11-api-states-006`, `R6.6-r11-api-states-007`, `R6.6-r11-sql-cases-005`, `R6.6-r11-sql-cases-006`, `R6.6-r11-sql-cases-013`, `R6.6-r11-sql-cases-014`, `R6.6-r11-concurrency-cases-001`, `R6.6-r11-concurrency-cases-002`

**R7.3 acceptance rationale:** Quản lý phòng: DB/BE PASS theo E064, E062, E063, E065, E066, E069, E070, E071, E072, E073, E074, E075, E076, E077, E078, E079, E080, E081; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/15`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-02 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/15`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-03"></a>

### QLR-03 — Quản lý sơ đồ ghế

**Mục tiêu:** Thêm/sửa/xóa ghế trong sơ đồ của các phòng chiếu thuộc rạp được phân công.

**Luồng baseline:** 1. Quản lý rạp chọn một phòng chiếu thuộc rạp được phân công. → 2. Hệ thống hiển thị sơ đồ ghế (GHE) hiện có của phòng. → 3. Quản lý rạp thêm/sửa/xóa ghế: hàng ghế, số ghế, loại ghế, trạng thái sử dụng. → 4. Hệ thống lưu thông tin ghế gắn đúng PhongID và kiểm tra phòng thuộc phạm vi được phân công.

**Nguồn:** [Đặc tả dòng 239](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+QL_GHE; parent room/cinema assigned.

**Kết quả mong đợi:** Seat CRUD đúng room; type lịch sử immutable; active future ticket bảo vệ deactivate/delete; foreign403.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Seat_Create](<../database/08_procedures/manager/sp_Manager_Seat_Create.sql>), [sp_Manager_Seat_Delete](<../database/08_procedures/manager/sp_Manager_Seat_Delete.sql>), [sp_Manager_Seat_ListByRoom](<../database/08_procedures/manager/sp_Manager_Seat_ListByRoom.sql>), [sp_Manager_Seat_Update](<../database/08_procedures/manager/sp_Manager_Seat_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GheCoVeHieuLucSuatTuongLai](<../database/05_functions/fn_GheCoVeHieuLucSuatTuongLai.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** GHE room/row/number UQ; fn_GheCoVeHieuLucSuatTuongLai; ticket FK/history checks; SQL lookup seat→room→cinema.

**Authorization:** Manager+QL_GHE; indirect parent scope và current grant ở BE+SQL.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/rooms/:roomId/seats | [route:14](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_GHE) | [managerController.listSeats](<../backend/src/controllers/managerController.js>) | [managerService.listSeats](<../backend/src/services/managerService.js>) | MANAGER_SEAT_LIST_BY_ROOM → dbo.sp_Manager_Seat_ListByRoom |
| POST /api/manager/rooms/:roomId/seats | [route:15](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_GHE) | [managerController.createSeat](<../backend/src/controllers/managerController.js>) | [managerService.createSeat](<../backend/src/services/managerService.js>) | MANAGER_SEAT_CREATE → dbo.sp_Manager_Seat_Create |
| PUT /api/manager/seats/:seatId | [route:16](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_GHE) | [managerController.updateSeat](<../backend/src/controllers/managerController.js>) | [managerService.updateSeat](<../backend/src/services/managerService.js>) | MANAGER_SEAT_UPDATE → dbo.sp_Manager_Seat_Update |
| DELETE /api/manager/seats/:seatId | [route:17](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_GHE) | [managerController.deleteSeat](<../backend/src/controllers/managerController.js>) | [managerService.deleteSeat](<../backend/src/services/managerService.js>) | MANAGER_SEAT_DELETE → dbo.sp_Manager_Seat_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal/ManagerResourceForm → managerApi.getSeats/createSeat/updateSeat/deleteSeat + managerForms; seatLoader, persisted edit/reload, errors.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerResourceForm.jsx](<../frontend/src/components/ManagerResourceForm.jsx>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>), [managerForms.js](<../frontend/src/utils/managerForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E062](#evidence-e062), [E063](#evidence-e063), [E067](#evidence-e067), [E082](#evidence-e082), [E083](#evidence-e083), [E084](#evidence-e084), [E085](#evidence-e085), [E086](#evidence-e086), [E087](#evidence-e087), [E088](#evidence-e088), [E089](#evidence-e089), [E425](#evidence-e425), [E426](#evidence-e426), [E427](#evidence-e427), [E428](#evidence-e428)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R32 controlled browser edit/retry; chưa SQL-backed seat create/delete, layout và future-seat/history conflict UI.. Gap: R71-FE-QLR-03.



**Test IDs / raw case identities:** `R6.5-03`, `R6.5-04`, `R6.5-07`, `R6.4-r32-sql-cases-036`, `R6.4-r32-sql-cases-037`, `R6.4-r32-sql-cases-038`, `R6.4-r32-sql-cases-039`, `R6.4-r32-sql-cases-040`, `R6.4-r32-sql-cases-041`, `R6.4-r32-sql-cases-042`, `R6.4-r32-sql-cases-043`

**R7.3 acceptance rationale:** Quản lý sơ đồ ghế: DB/BE PASS theo E062, E063, E067, E082, E083, E084, E085, E086, E087, E088, E089; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/16`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-03 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/16`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-04"></a>

### QLR-04 — Tạo suất chiếu

**Mục tiêu:** Lập lịch chiếu phim mới cho một phòng chiếu thuộc rạp được phân công.

**Luồng baseline:** 1. Quản lý rạp chọn PhimID, PhongID (thuộc rạp được phân công), nhập thời gian bắt đầu/kết thúc, định dạng chiếu và giá vé cơ bản. → 2. Hệ thống kiểm tra phòng chiếu có thuộc rạp mà tài khoản đang được phân công quản lý hay không. → 3. Hệ thống kiểm tra suất chiếu không trùng khoảng thời gian với suất chiếu khác trong cùng phòng. → 4. Hệ thống tạo bản ghi SUATCHIEU mới, mở lịch chiếu để khách hàng xem và đặt vé.

**Nguồn:** [Đặc tả dòng 249](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.

**Kết quả mong đợi:** 201 correctshow; overlap409 kể cả concurrency; invalid parents/foreign scope không write.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Showtime_Create](<../database/08_procedures/manager/sp_Manager_Showtime_Create.sql>), [sp_Manager_Showtime_List](<../database/08_procedures/manager/sp_Manager_Showtime_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [sp_Showtime_GetDetail](<../database/08_procedures/public/sp_Showtime_GetDetail.sql>), [sp_Showtime_ValidateTimes](<../database/08_procedures/system/sp_Showtime_ValidateTimes.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** TRG_SuatChieu_KiemTraTrungLich + room serialization; transaction boundaries; show timesUTC, business dates/time functions.

**Authorization:** Manager+QL_SUAT_CHIEU; scope from actual room; role/assignment live.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/cinemas/:cinemaId/showtimes | [route:18](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_SUAT_CHIEU) | [managerController.listShowtimes](<../backend/src/controllers/managerController.js>) | [managerService.listShowtimes](<../backend/src/services/managerService.js>) | MANAGER_SHOWTIME_LIST → dbo.sp_Manager_Showtime_List |
| POST /api/manager/showtimes | [route:19](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_SUAT_CHIEU) | [managerController.createShowtime](<../backend/src/controllers/managerController.js>) | [managerService.createShowtime](<../backend/src/services/managerService.js>) | MANAGER_SHOWTIME_CREATE → dbo.sp_Manager_Showtime_Create |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal/ManagerResourceForm → managerApi.getManagerShowtimes/createManagerShowtime; movie/room form, loading/error/empty/reload.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerResourceForm.jsx](<../frontend/src/components/ManagerResourceForm.jsx>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E062](#evidence-e062), [E063](#evidence-e063), [E068](#evidence-e068), [E090](#evidence-e090), [E091](#evidence-e091), [E092](#evidence-e092), [E093](#evidence-e093), [E094](#evidence-e094), [E095](#evidence-e095), [E100](#evidence-e100), [E101](#evidence-e101), [E102](#evidence-e102)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser show create, room/movie selection, overlap conflict and successful reload.. Gap: R71-FE-QLR-04.



**Test IDs / raw case identities:** `R6.5-03`, `R6.5-04`, `R6.5-08`, `R6.7-r12-concurrency-scenarios-001`, `R6.7-r12-concurrency-scenarios-002`, `R6.7-r12-concurrency-stress-001`; records without a test ID: E090 `/requests/1`, E091 `/requests/2`, E092 `/requests/3`, E093 `/requests/4`, E094 `/requests/5`, E095 `/requests/6` (artifact is linked in registry).

**R7.3 acceptance rationale:** Tạo suất chiếu: DB/BE PASS theo E062, E063, E068, E090, E091, E092, E093, E094, E095, E100, E101, E102; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/17`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-04 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/17`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-05"></a>

### QLR-05 — Sửa suất chiếu

**Mục tiêu:** Điều chỉnh thông tin một suất chiếu đã tạo (thời gian, định dạng, giá vé cơ bản...).

**Luồng baseline:** 1. Quản lý rạp chọn suất chiếu cần sửa trong phạm vi rạp quản lý. → 2. Quản lý rạp cập nhật thông tin cần thay đổi. → 3. Hệ thống kiểm tra lại ràng buộc không trùng lịch chiếu trong cùng phòng (BR01) trước khi lưu. → 4. Hệ thống cập nhật bản ghi SUATCHIEU.

**Nguồn:** [Đặc tả dòng 259](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+QL_SUAT_CHIEU; assigned existing show; edits respect historical usage.

**Kết quả mong đợi:** 200 allowed edits; overlap409/history409; payload không reset identity/price/time ngoài intention.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Showtime_List](<../database/08_procedures/manager/sp_Manager_Showtime_List.sql>), [sp_Manager_Showtime_Update](<../database/08_procedures/manager/sp_Manager_Showtime_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [sp_Showtime_ValidateTimes](<../database/08_procedures/system/sp_Showtime_ValidateTimes.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SP history guard prohibits structural/time/price change khi đã used; overlap lock same room; snapshots never recomputed.

**Authorization:** Manager+QL_SUAT_CHIEU; show→room→cinema trusted scope.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/cinemas/:cinemaId/showtimes | [route:18](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_SUAT_CHIEU) | [managerController.listShowtimes](<../backend/src/controllers/managerController.js>) | [managerService.listShowtimes](<../backend/src/services/managerService.js>) | MANAGER_SHOWTIME_LIST → dbo.sp_Manager_Showtime_List |
| PUT /api/manager/showtimes/:showtimeId | [route:20](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_SUAT_CHIEU) | [managerController.updateShowtime](<../backend/src/controllers/managerController.js>) | [managerService.updateShowtime](<../backend/src/services/managerService.js>) | MANAGER_SHOWTIME_UPDATE → dbo.sp_Manager_Showtime_Update |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal/ManagerResourceForm → managerApi.getManagerShowtimes/updateManagerShowtime; hydrate full persisted fields, datetimeLocal conversion, error/retry.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerResourceForm.jsx](<../frontend/src/components/ManagerResourceForm.jsx>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E062](#evidence-e062), [E063](#evidence-e063), [E068](#evidence-e068), [E096](#evidence-e096), [E097](#evidence-e097), [E098](#evidence-e098), [E100](#evidence-e100), [E101](#evidence-e101), [E102](#evidence-e102), [E103](#evidence-e103), [E104](#evidence-e104), [E105](#evidence-e105), [E106](#evidence-e106), [E417](#evidence-e417), [E418](#evidence-e418), [E419](#evidence-e419), [E420](#evidence-e420)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R32 controlled browser persisted edit/retry; chưa realSQL full update/history/overlap UI.. Gap: R71-FE-QLR-05.



**Test IDs / raw case identities:** `R6.5-03`, `R6.5-04`, `R6.5-08`, `R6.7-r12-concurrency-scenarios-001`, `R6.7-r12-concurrency-scenarios-002`, `R6.7-r12-concurrency-stress-001`, `R6.4-r32-sql-cases-005`, `R6.4-r32-sql-cases-006`, `R6.4-r32-sql-cases-007`, `R6.4-r32-sql-cases-008`; records without a test ID: E096 `/requests/8`, E097 `/requests/9`, E098 `/requests/10` (artifact is linked in registry).

**R7.3 acceptance rationale:** Sửa suất chiếu: DB/BE PASS theo E062, E063, E068, E096, E097, E098, E100, E101, E102, E103, E104, E105, E106; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/18`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-05 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/18`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-06"></a>

### QLR-06 — Hủy suất chiếu

**Mục tiêu:** Hủy một suất chiếu chưa diễn ra hoặc không còn nhu cầu chiếu.

**Luồng baseline:** 1. Quản lý rạp chọn suất chiếu cần hủy trong phạm vi rạp quản lý. → 2. Hệ thống kiểm tra ràng buộc: chỉ được hủy suất chiếu chưa có ai đặt vé, tức không có đơn đang giữ chỗ hoặc đã thanh toán cho suất này (đơn đã hủy hoặc hết hạn không tính). Nếu đã có khách đặt, hệ thống từ chối hủy. → 3. Hệ thống cập nhật trạng thái/hủy bản ghi SUATCHIEU và ngừng hiển thị suất chiếu cho khách hàng.

**Nguồn:** [Đặc tả dòng 269](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+QL_SUAT_CHIEU; assigned future show; no valid held/paid orders.

**Kết quả mong đợi:** Cancel200 preserve history; started show/live order reject409; expired/canceled orders do not block incorrectly.

**Database:** [BOITHUONG_HUYSUAT](<../database/02_tables/boithuong_huysuat.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Showtime_Cancel](<../database/08_procedures/manager/sp_Manager_Showtime_Cancel.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [fn_TinhBoiThuongVe](<../database/05_functions/fn_TinhBoiThuongVe.sql>), [sp_Order_ExpirePending](<../database/08_procedures/customer/sp_Order_ExpirePending.sql>), [sp_Showtime_CancelCascade](<../database/08_procedures/system/sp_Showtime_CancelCascade.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SP Manager cancellation checks DB time/live holds/paid; cascade lifecycle retains money/payment history and compensation policy; owned TX/savepoint.

**Authorization:** Manager+QL_SUAT_CHIEU; resource-derived cinema scope; trusted user ID.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/manager/showtimes/:showtimeId/cancel | [route:21](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_SUAT_CHIEU) | [managerController.cancelShowtime](<../backend/src/controllers/managerController.js>) | [managerService.cancelShowtime](<../backend/src/services/managerService.js>) | MANAGER_SHOWTIME_CANCEL → dbo.sp_Manager_Showtime_Cancel |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal → managerApi.cancelManagerShowtime; cancel action/reload, busy/error.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E062](#evidence-e062), [E063](#evidence-e063), [E068](#evidence-e068), [E099](#evidence-e099), [E367](#evidence-e367), [E368](#evidence-e368), [E369](#evidence-e369)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser cancel success, held/paid denial, expired-order policy and refresh show list.. Gap: R71-FE-QLR-06.



**Test IDs / raw case identities:** `R6.5-03`, `R6.5-04`, `R6.5-08`, `R6.4-r32-sql-cases-048`, `R6.4-r32-sql-cases-049`, `R6.4-r32-sql-cases-050`; records without a test ID: E099 `/requests/11` (artifact is linked in registry).

**R7.3 acceptance rationale:** Hủy suất chiếu: DB/BE PASS theo E062, E063, E068, E099, E367, E368, E369; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/19`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-06 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/19`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-07"></a>

### QLR-07 — Cấu hình bảng giá

**Mục tiêu:** Thiết lập mức phụ thu theo loại ghế, loại ngày và định dạng chiếu cho rạp đang quản lý.

**Luồng baseline:** 1. Quản lý rạp truy cập màn hình bảng giá của rạp được phân công. → 2. Quản lý rạp tạo/sửa quy tắc BANGGIA: loại ghế, loại ngày, định dạng, mức phụ thu, khoảng thời gian hiệu lực. → 3. Hệ thống lưu cấu hình; khi khách hàng đặt vé, hệ thống kết hợp giá vé cơ bản của SUATCHIEU với mức phụ thu tương ứng để xác định giá vé thực tế.

**Nguồn:** [Đặc tả dòng 279](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+QL_BANG_GIA; assigned cinema; valid conditions/range/surcharge.

**Kết quả mong đợi:** Scoped create/update/readback; overlap409; three official day types, open ended dateNULL; authoritative ticket price.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Pricing_Create](<../database/08_procedures/manager/sp_Manager_Pricing_Create.sql>), [sp_Manager_Pricing_List](<../database/08_procedures/manager/sp_Manager_Pricing_List.sql>), [sp_Manager_Pricing_Update](<../database/08_procedures/manager/sp_Manager_Pricing_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** BANGGIA CHECK; TRG_BangGia_KiemTraChongLan, fn_TinhGiaVe additive matching surcharge; full update uses CapNhatDieuKien BIT; immutable cinema.

**Authorization:** Manager+QL_BANG_GIA; create/list actual cinema, update lookup pricing→cinema; no scope spoof.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/cinemas/:cinemaId/pricing | [route:22](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_BANG_GIA) | [managerController.listPricing](<../backend/src/controllers/managerController.js>) | [managerService.listPricing](<../backend/src/services/managerService.js>) | MANAGER_PRICING_LIST → dbo.sp_Manager_Pricing_List |
| POST /api/manager/cinemas/:cinemaId/pricing | [route:23](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_BANG_GIA) | [managerController.createPricing](<../backend/src/controllers/managerController.js>) | [managerService.createPricing](<../backend/src/services/managerService.js>) | MANAGER_PRICING_CREATE → dbo.sp_Manager_Pricing_Create |
| PUT /api/manager/pricing/:pricingId | [route:24](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(QL_BANG_GIA) | [managerController.updatePricing](<../backend/src/controllers/managerController.js>) | [managerService.updatePricing](<../backend/src/services/managerService.js>) | MANAGER_PRICING_UPDATE → dbo.sp_Manager_Pricing_Update |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. PRICING_INVALID400, PRICING_NOT_FOUND404, PRICING_OVERLAP409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal/ManagerResourceForm → managerApi.getPricing/createPricing/updatePricing + managerForms; three day types/full dimensions/dates, load/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerResourceForm.jsx](<../frontend/src/components/ManagerResourceForm.jsx>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>), [managerForms.js](<../frontend/src/utils/managerForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E064](#evidence-e064), [E107](#evidence-e107), [E108](#evidence-e108), [E109](#evidence-e109), [E433](#evidence-e433)

**R7.2 DB/BE PASS:** 13 case thực tế PASS; R71-DB-02 RESOLVED. Contract: Current Manager assignment + QL_BANG_GIA; SQL pricing with three day types, inclusive date range/null end, overlap conflict. **Overall vẫn PARTIAL:** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser Manager pricing create/update/full condition/NULL dates/overlap/assigned access; R43 browser chỉ Admin form.. Gap FE còn lại: R71-FE-QLR-07.



**R7.2 evidence:** [case index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), test IDs `QLR07-01`, `QLR07-02`, `QLR07-03-0`, `QLR07-03-1`, `QLR07-03-2`, `QLR07-03-invalid`, `QLR07-04`, `QLR07-05`, `QLR07-06`, `QLR07-07-revoked`, `QLR07-07-expired`, `QLR07-08-grant`, `QLR07-08-role`; SQL/HTTP pointers, fingerprint và cleanup theo từng case. Policy: [approved decisions](contracts/R7_2_APPROVED_POLICIES.md).


**Test IDs / raw case identities:** `R6.5-02`, `QLR07-01`, `QLR07-02`, `QLR07-03-0`, `QLR07-03-1`, `QLR07-03-2`, `QLR07-03-invalid`, `QLR07-04`, `QLR07-05`, `QLR07-06`, `QLR07-07-revoked`, `QLR07-07-expired`, `QLR07-08-grant`, `QLR07-08-role`; records without a test ID: E107 `/10`, E108 `/11`, E109 `/12` (artifact is linked in registry).

**R7.3 acceptance rationale:** Cấu hình bảng giá: DB/BE PASS theo E064, E107, E108, E109, E433 và 13 case R7.2 đã đối chiếu raw SQL/HTTP, authorization, fingerprint và cleanup; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/20`. Freshness: New R7.2 real SQL/HTTP cases on approved canonical definitions.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-07 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/20`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-08"></a>

### QLR-08 — Dashboard hoạt động rạp

**Mục tiêu:** Theo dõi tình hình vận hành (suất chiếu, tỉ lệ lấp đầy, số đơn đặt vé...) của các rạp đang được phân công.

**Luồng baseline:** 1. Quản lý rạp truy cập dashboard rạp. → 2. Hệ thống tổng hợp dữ liệu theo chuỗi RAPCHIEUPHIM → PHONGCHIEU → SUATCHIEU → DONDATVE, giới hạn trong phạm vi rạp được phân công. → 3. Hệ thống hiển thị các chỉ số vận hành cho quản lý rạp theo dõi.

**Nguồn:** [Đặc tả dòng 289](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+XEM_BAO_CAO_RAP; assigned cinema.

**Kết quả mong đợi:** Room/seat active counts, today shows/paid orders scoped and businessdate correct; foreign403.

**Database:** [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Dashboard](<../database/08_procedures/manager/sp_Manager_Dashboard.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TienGiamGia](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TongTienDoAn](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TongTienVe](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [DF_DONDATVE_TongTienVe](<../database/03_constraints/004_defaults.sql>); DONDATVE: [DF_DONDATVE_TongTienDoAn](<../database/03_constraints/004_defaults.sql>); DONDATVE: [DF_DONDATVE_TienGiamGia](<../database/03_constraints/004_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** sp_Manager_Dashboard SELECT-only; fn_HomNay/fn_NgayKinhDoanh and current assignment; only successful payment counts.

**Authorization:** Manager+XEM_BAO_CAO_RAP; fn_KiemTraQuanLyRapScope current, not Admin report authority.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/cinemas/:cinemaId/dashboard | [route:25](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(XEM_BAO_CAO_RAP) | [managerController.dashboard](<../backend/src/controllers/managerController.js>) | [managerService.dashboard](<../backend/src/services/managerService.js>) | MANAGER_DASHBOARD → dbo.sp_Manager_Dashboard |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerPortal → managerApi.getDashboard; cinema selector, four metrics, loading/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E375](#evidence-e375), [E434](#evidence-e434)

**R7.2 DB/BE PASS:** 9 case thực tế PASS; R71-DB-03 RESOLVED. Contract: Four approved current metrics, scoped to current assignment; UTC+7 business date; GET read-only. **Overall vẫn PARTIAL:** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser metrics, đổi cinema, empty/zero data, loading/error and denied scope.. Gap FE còn lại: R71-FE-QLR-08.



**R7.2 evidence:** [case index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), test IDs `QLR08-01`, `QLR08-02`, `QLR08-02-foreign`, `QLR08-03`, `QLR08-04-revoked`, `QLR08-04-expired`, `QLR08-05-grant`, `QLR08-05-role`, `QLR08-06`; SQL/HTTP pointers, fingerprint và cleanup theo từng case. Policy: [approved decisions](contracts/R7_2_APPROVED_POLICIES.md).

**Metric decision:** người dùng chấp thuận bốn metric hiện tại cho R7.2; không còn occupancy decision pending.


**Test IDs / raw case identities:** `QLR08-01`, `QLR08-02`, `QLR08-02-foreign`, `QLR08-03`, `QLR08-04-revoked`, `QLR08-04-expired`, `QLR08-05-grant`, `QLR08-05-role`, `QLR08-06`

**R7.3 acceptance rationale:** Dashboard hoạt động rạp: DB/BE PASS theo E434 và 9 case R7.2 đã đối chiếu raw SQL/HTTP, authorization, fingerprint và cleanup; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/21`. Freshness: New R7.2 real SQL/HTTP cases on approved canonical definitions.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-08 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/21`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-qlr-09"></a>

### QLR-09 — Doanh thu rạp

**Mục tiêu:** Xem báo cáo doanh thu tổng hợp của rạp đang được phân công quản lý.

**Luồng baseline:** 1. Quản lý rạp chọn khoảng thời gian cần xem báo cáo. → 2. Hệ thống tổng hợp các bản ghi THANHTOAN thành công liên kết qua DONDATVE → SUATCHIEU → PHONGCHIEU → RAPCHIEUPHIM, giới hạn trong phạm vi được phân công. → 3. Hệ thống hiển thị báo cáo doanh thu thông qua các View/Function tổng hợp đã thiết kế sẵn.

**Nguồn:** [Đặc tả dòng 299](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Manager+XEM_BAO_CAO_RAP; assigned cinema, valid inclusive date range.

**Kết quả mong đợi:** Only successful receipts scoped to cinema/date; ticket/food/discount/paid totals SQL-derived; no false revenue from pending/failed.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Manager_Revenue](<../database/08_procedures/manager/sp_Manager_Revenue.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** fn_NgayKinhDoanh latest successfulpaidtimestamp; SQL groups order monetarysnapshots; read only, no JavaScript final accounting.

**Authorization:** Manager+XEM_BAO_CAO_RAP; live assigned scope; Admin revenue tests cannot substitute Manager.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/manager/cinemas/:cinemaId/revenue | [route:26](<../backend/src/routes/managerRoutes.js>) | authenticate → requireManager | AND(XEM_BAO_CAO_RAP) | [managerController.revenue](<../backend/src/controllers/managerController.js>) | [managerService.revenue](<../backend/src/services/managerService.js>) | MANAGER_REVENUE → dbo.sp_Manager_Revenue |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /manager → ManagerRevenue/ManagerPortal → managerApi.getRevenue; from/to form, loading/error/empty/rows.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [managerApi.js](<../frontend/src/api/managerApi.js>), [ManagerRevenue.jsx](<../frontend/src/components/ManagerRevenue.jsx>), [ManagerPortal.jsx](<../frontend/src/pages/ManagerPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E376](#evidence-e376), [E435](#evidence-e435)

**R7.2 DB/BE PASS:** 17 case thực tế PASS; R71-DB-04 RESOLVED. Contract: Successful receipt snapshots by business payment date; inclusive filters/default; scoped Manager grant; GET read-only. **Overall vẫn PARTIAL:** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser date filtering, numeric totals, empty/retry/foreign cinema and zero rows.. Gap FE còn lại: R71-FE-QLR-09.



**R7.2 evidence:** [case index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), test IDs `QLR09-01`, `QLR09-02`, `QLR09-03-start`, `QLR09-03-end`, `QLR09-03-same`, `QLR09-03-default`, `QLR09-04`, `QLR09-04-foreign`, `QLR09-05-revoked`, `QLR09-05-expired`, `QLR09-06-grant`, `QLR09-06-role`, `QLR09-07-invalid-0`, `QLR09-07-invalid-1`, `QLR09-07-invalid-2`, `QLR09-07-empty`, `QLR09-08`; SQL/HTTP pointers, fingerprint và cleanup theo từng case. Policy: [approved decisions](contracts/R7_2_APPROVED_POLICIES.md).


**Test IDs / raw case identities:** `QLR09-01`, `QLR09-02`, `QLR09-03-start`, `QLR09-03-end`, `QLR09-03-same`, `QLR09-03-default`, `QLR09-04`, `QLR09-04-foreign`, `QLR09-05-revoked`, `QLR09-05-expired`, `QLR09-06-grant`, `QLR09-06-role`, `QLR09-07-invalid-0`, `QLR09-07-invalid-1`, `QLR09-07-invalid-2`, `QLR09-07-empty`, `QLR09-08`

**R7.3 acceptance rationale:** Doanh thu rạp: DB/BE PASS theo E435 và 17 case R7.2 đã đối chiếu raw SQL/HTTP, authorization, fingerprint và cleanup; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/22`. Freshness: New R7.2 real SQL/HTTP cases on approved canonical definitions.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [QLR-09 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/22`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-cskh-01"></a>

### CSKH-01 — Đăng nhập

**Mục tiêu:** Nhân viên CSKH đăng nhập để truy cập khu vực xử lý khiếu nại.

**Luồng baseline:** 1. CSKH nhập Email + mật khẩu. → 2. Hệ thống xác thực tài khoản, xác định vai trò CSKH và tra cứu quyền qua VAITRO_QUYEN. → 3. Hệ thống điều hướng vào khu vực CSKH: danh sách khiếu nại, bộ lọc trạng thái/ưu tiên, chi tiết khiếu nại, form ghi lần xử lý.

**Nguồn:** [Đặc tả dòng 311](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Active CSKH credentials; grants control support operations.

**Kết quả mong đợi:** Login200 current CSKH identity/grants; active-account recheck; route appropriate area.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Auth_Login](<../database/08_procedures/auth/sp_Auth_Login.sql>), [sp_Manager_ListAssignedCinemas](<../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql>), [sp_RBAC_GetPermissionsByUser](<../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql>), [sp_User_GetCurrent](<../database/08_procedures/auth/sp_User_GetCurrent.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHANCONG_RAP: [PK_PHANCONG_RAP](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Auth SP/currentpermissions same shared chain; role+grant on each support operation, not JWT claims.

**Authorization:** Public login; authenticated support route CSKH + QL_KHIEUNAI; SQL active/current role.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/auth/login | [route:7](<../backend/src/routes/authRoutes.js>) | Public + app.createAuthRateLimiter before JSON parser | N/A — public/self-read/bootstrap contract | [authController.login](<../backend/src/controllers/authController.js>) | [authService.login](<../backend/src/services/authService.js>) | AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [route:8](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentUser](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [route:10](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentPermissions](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /login → Login/AuthProvider; /support → RequireRole(CSKH, QL_KHIEUNAI)/SupportPortal; login fields/busy/error.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [SupportPortal.jsx](<../frontend/src/pages/SupportPortal.jsx>), [Login.jsx](<../frontend/src/pages/auth/Login.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E013](#evidence-e013), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser login CSKH→support, missingQL permission/forbidden, refresh session.. Gap: R71-FE-CSKH-01.



**Test IDs / raw case identities:** `real login JWT/current permissions/assignments CSKH`, `under-limit invalid/unknown credentials keep existing generic401`, `real four-role RBAC and non-auth endpoints preserved`, `account status and existing JWT live recheck unchanged`, `R4.5-07 login beyond production threshold never calls actual service/SQL`, `spoof resistance and other endpoints work with login/register counters exhausted`, `R4.5-04/10 exact expiry allows manual retry through real auth SP without sleeps`

**R7.3 acceptance rationale:** Đăng nhập: DB/BE PASS theo E013, E006, E007, E008, E009, E010, E011; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/23`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [CSKH-01 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/23`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-cskh-02"></a>

### CSKH-02 — Hàng chờ khiếu nại

**Mục tiêu:** CSKH xem toàn bộ khiếu nại cần tiếp nhận và xử lý.

**Luồng baseline:** 1. CSKH truy cập màn hình danh sách khiếu nại. → 2. Hệ thống truy vấn bảng KHIEUNAI, hỗ trợ lọc theo trạng thái/mức độ ưu tiên. → 3. Hệ thống hiển thị danh sách khiếu nại kèm trạng thái xử lý hiện tại.

**Nguồn:** [Đặc tả dòng 321](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** CSKH active + QL_KHIEUNAI.

**Kết quả mong đợi:** Queue permitted complaints; design calls for status/priority filter; approved contract supports status/type/search/priority filtering, priority ordering.

**Database:** [KHIEUNAI](<../database/02_tables/khieunai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>), [XULY_KHIEUNAI](<../database/02_tables/xuly_khieunai.sql>).

**Entry points:** [sp_Support_Complaint_List](<../database/08_procedures/support/sp_Support_Complaint_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [vw_DanhSachKhieuNai](<../database/06_views/vw_DanhSachKhieuNai.sql>).

**Trigger liên quan:** [TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai](<../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql>), [TRG_XuLyKhieuNai_KiemTraVaiTro](<../database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql>).

**Constraints:** KHIEUNAI: [PK_KHIEUNAI](<../database/03_constraints/001_primary_unique.sql>); KHIEUNAI: [FK_KHIEUNAI_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [FK_KHIEUNAI_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [CK_KHIEUNAI_MucDoUuTien](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [CK_KHIEUNAI_TrangThai](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [DF_KHIEUNAI_MucDoUuTien](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_TrangThai](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** vw_DanhSachKhieuNai; SP SQL filtering and priority ordering; validator accepts priority; typed @MucDoUuTien NVARCHAR(50), SQL applies AND filter and rejects invalid enum with50405.

**Authorization:** authenticate→requireSupport→QL_KHIEUNAI; SQL allows CSKH/Admin + exact grant.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/support/complaints | [route:11](<../backend/src/routes/supportRoutes.js>) | authenticate → requireSupport | AND(QL_KHIEUNAI) | [supportController.list](<../backend/src/controllers/supportController.js>) | [supportService.list](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_LIST → dbo.sp_Support_Complaint_List |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /support → SupportPortal → supportApi.getSupportComplaints; status/type/search controls; priority displayed/sorted, loading/error/empty.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [supportApi.js](<../frontend/src/api/supportApi.js>), [SupportPortal.jsx](<../frontend/src/pages/SupportPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E120](#evidence-e120), [E121](#evidence-e121), [E122](#evidence-e122), [E123](#evidence-e123), [E436](#evidence-e436)

**R7.2 DB/BE PASS:** 15 case thực tế PASS; R71-CT-01 RESOLVED. Contract: Approved mandatory priority filter, AND status/type/search; official four priorities; SQL filtering and QL_KHIEUNAI. **Overall vẫn PARTIAL:** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser queue/filter/empty/error/retry; priority filter được chốt và sửa DB/BE; UI wiring/browser deferred R8.. Gap FE còn lại: R71-FE-CSKH-02.



**R7.2 evidence:** [case index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), test IDs `CSKH02-01`, `CSKH02-02`, `CSKH02-02-priority-0`, `CSKH02-02-priority-1`, `CSKH02-02-priority-2`, `CSKH02-03`, `CSKH02-04`, `CSKH02-05`, `CSKH02-06`, `CSKH02-06-admin-consumer`, `CSKH02-06-admin-default`, `CSKH02-07`, `CSKH02-07-sql`, `CSKH02-08`, `CSKH02-09`; SQL/HTTP pointers, fingerprint và cleanup theo từng case. Policy: [approved decisions](contracts/R7_2_APPROVED_POLICIES.md).


**Test IDs / raw case identities:** `R6.8-linked-02`, `R6.8-linked-12`, `R6.8-linked-25`, `R6.8-linked-26`, `CSKH02-01`, `CSKH02-02`, `CSKH02-02-priority-0`, `CSKH02-02-priority-1`, `CSKH02-02-priority-2`, `CSKH02-03`, `CSKH02-04`, `CSKH02-05`, `CSKH02-06`, `CSKH02-06-admin-consumer`, `CSKH02-06-admin-default`, `CSKH02-07`, `CSKH02-07-sql`, `CSKH02-08`, `CSKH02-09`

**R7.3 acceptance rationale:** Hàng chờ khiếu nại: DB/BE PASS theo E120, E121, E122, E123, E436 và 15 case R7.2 đã đối chiếu raw SQL/HTTP, authorization, fingerprint và cleanup; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/24`. Freshness: New R7.2 real SQL/HTTP cases on approved canonical definitions.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [CSKH-02 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/24`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-cskh-03"></a>

### CSKH-03 — Chi tiết khiếu nại

**Mục tiêu:** Xem đầy đủ nội dung và lịch sử xử lý của một khiếu nại cụ thể.

**Luồng baseline:** 1. CSKH chọn một khiếu nại từ danh sách. → 2. Hệ thống hiển thị chi tiết KHIEUNAI: người gửi, loại khiếu nại, tiêu đề, nội dung, mức ưu tiên, ngày tạo, trạng thái. → 3. Hệ thống hiển thị kèm lịch sử các lần xử lý trong XULY_KHIEUNAI (nếu đã có).

**Nguồn:** [Đặc tả dòng 331](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** CSKH+QL_KHIEUNAI; existing complaint.

**Kết quả mong đợi:** Read parent/customer/order IDs and full allowed processing history; missing404; no unrelated scope restrictions invented.

**Database:** [KHIEUNAI](<../database/02_tables/khieunai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>), [XULY_KHIEUNAI](<../database/02_tables/xuly_khieunai.sql>).

**Entry points:** [sp_Support_Complaint_GetDetail](<../database/08_procedures/support/sp_Support_Complaint_GetDetail.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai](<../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql>), [TRG_XuLyKhieuNai_KiemTraVaiTro](<../database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql>).

**Constraints:** KHIEUNAI: [PK_KHIEUNAI](<../database/03_constraints/001_primary_unique.sql>); KHIEUNAI: [FK_KHIEUNAI_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [FK_KHIEUNAI_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [CK_KHIEUNAI_MucDoUuTien](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [CK_KHIEUNAI_TrangThai](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [DF_KHIEUNAI_MucDoUuTien](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_TrangThai](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** KHIEUNAI+XULY_KHIEUNAI with persisted order/latestXuLyID; authorized staff detail read only.

**Authorization:** CSKH + QL_KHIEUNAI; authenticate current user; SQL staff-role/grant.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/support/complaints/:complaintId | [route:12](<../backend/src/routes/supportRoutes.js>) | authenticate → requireSupport | AND(QL_KHIEUNAI) | [supportController.detail](<../backend/src/controllers/supportController.js>) | [supportService.detail](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_GET_DETAIL → dbo.sp_Support_Complaint_GetDetail |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /support → SupportPortal → supportApi.getSupportComplaint; selected detail/history, generation guard, loading/error; userCanAct.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [supportApi.js](<../frontend/src/api/supportApi.js>), [SupportPortal.jsx](<../frontend/src/pages/SupportPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E124](#evidence-e124), [E125](#evidence-e125), [E126](#evidence-e126), [E127](#evidence-e127)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser select/switch complaint, full timeline, notfound/retry, detail stale-response guard.. Gap: R71-FE-CSKH-03.



**Test IDs / raw case identities:** `R6.8-linked-03`, `R6.8-linked-13`, `R6.8-linked-27`, `R6.8-linked-28`

**R7.3 acceptance rationale:** Chi tiết khiếu nại: DB/BE PASS theo E124, E125, E126, E127; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/25`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [CSKH-03 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/25`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-cskh-04"></a>

### CSKH-04 — Đơn tham chiếu

**Mục tiêu:** Khi khiếu nại có gắn DonDatVeID, CSKH xem thông tin đơn liên quan để đối chiếu, hỗ trợ xử lý.

**Luồng baseline:** 1. Từ màn hình chi tiết khiếu nại, nếu DonDatVeID khác NULL, CSKH chọn xem đơn tham chiếu. → 2. Hệ thống truy vấn DONDATVE cùng thông tin liên quan (suất chiếu, vé/ghế, thanh toán) để CSKH đối chiếu. → 3. Nếu DonDatVeID là NULL, hệ thống thông báo khiếu nại này không gắn với đơn đặt vé cụ thể (BR06).

**Nguồn:** [Đặc tả dòng 341](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** CSKH and BOTH QL_KHIEUNAI + TRA_CUU_DON; complaint exists, order optional.

**Kết quả mong đợi:** Linked full referenced order+items+payments; unlinked order:null message; missingonegrant403 no leakage.

**Database:** [BOITHUONG_HUYSUAT](<../database/02_tables/boithuong_huysuat.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [KHIEUNAI](<../database/02_tables/khieunai.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Support_Complaint_GetOrderReference](<../database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [vw_ChiTietDonDatVe](<../database/06_views/vw_ChiTietDonDatVe.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [FK_CHITIETDOAN_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [FK_CHITIETDOAN_SanPham](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [CK_CHITIETDOAN_DonGia](<../database/03_constraints/003_check_constraints.sql>); CHITIETDOAN: [CK_CHITIETDOAN_SoLuong](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Support SP own authorized complaint join to linkedorder; four orderdetailsets + user/compensation; no fabricated order forNULL.

**Authorization:** requirePermission AND(QL_KHIEUNAI,TRA_CUU_DON); SQL repeats both; staff trusted identity.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/support/complaints/:complaintId/order-reference | [route:13](<../backend/src/routes/supportRoutes.js>) | authenticate → requireSupport | AND(QL_KHIEUNAI,TRA_CUU_DON) | [supportController.orderReference](<../backend/src/controllers/supportController.js>) | [supportService.orderReference](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_GET_ORDER_REFERENCE → dbo.sp_Support_Complaint_GetOrderReference |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /support → SupportPortal/ComplaintOrderReference/OrderReferenceDetails → supportApi.getComplaintOrderReference; linked detail or explicit empty; loading/error/retry.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [supportApi.js](<../frontend/src/api/supportApi.js>), [ComplaintOrderReference.jsx](<../frontend/src/components/ComplaintOrderReference.jsx>), [SupportPortal.jsx](<../frontend/src/pages/SupportPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E128](#evidence-e128), [E129](#evidence-e129), [E130](#evidence-e130), [E131](#evidence-e131), [E132](#evidence-e132)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser linked/unlinked, each denied permission, switchingcomplaint and full monetary/payment reference.. Gap: R71-FE-CSKH-04.



**Test IDs / raw case identities:** `R6.8-linked-04`, `R6.8-linked-14`, `R6.8-linked-32`, `R6.8-linked-37`, `R6.8-linked-38`

**R7.3 acceptance rationale:** Đơn tham chiếu: DB/BE PASS theo E128, E129, E130, E131, E132; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/26`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [CSKH-04 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/26`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-cskh-05"></a>

### CSKH-05 — Ghi lần xử lý

**Mục tiêu:** CSKH ghi lại nội dung đã xử lý cho khiếu nại đang tiếp nhận; một khiếu nại có thể trải qua nhiều lần xử lý.

**Luồng baseline:** 1. CSKH nhập nội dung xử lý cho khiếu nại đang chọn. → 2. Hệ thống kiểm tra quyền: chỉ CSKH/Admin được ghi XULY_KHIEUNAI. → 3. Hệ thống tạo bản ghi mới trong XULY_KHIEUNAI gồm: khiếu nại được xử lý, người xử lý, nội dung xử lý, thời gian, trạng thái sau xử lý.

**Nguồn:** [Đặc tả dòng 351](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** CSKH+BOTH QL_KHIEUNAI/XULY_KHIEUNAI; existing complaint, nonempty processingcontent.

**Kết quả mong đợi:** 201 appended processing and parentstatus; no overwrite oldevents; invalid/writefault complete rollback.

**Database:** [KHIEUNAI](<../database/02_tables/khieunai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>), [XULY_KHIEUNAI](<../database/02_tables/xuly_khieunai.sql>).

**Entry points:** [sp_Support_Complaint_AddProcessing](<../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai](<../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql>), [TRG_XuLyKhieuNai_KiemTraVaiTro](<../database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql>).

**Constraints:** KHIEUNAI: [PK_KHIEUNAI](<../database/03_constraints/001_primary_unique.sql>); KHIEUNAI: [FK_KHIEUNAI_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [FK_KHIEUNAI_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [CK_KHIEUNAI_MucDoUuTien](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [CK_KHIEUNAI_TrangThai](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [DF_KHIEUNAI_MucDoUuTien](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_TrangThai](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** XULY_KHIEUNAI append-only SP; TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai picks persisted MAXXuLyID; transaction+savepoint atomic history/parent.

**Authorization:** AND(QL_KHIEUNAI,XULY_KHIEUNAI) at route+SQL; role CSKH/Admin.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/support/complaints/:complaintId/processings | [route:18](<../backend/src/routes/supportRoutes.js>) | authenticate → requireSupport | AND(QL_KHIEUNAI,XULY_KHIEUNAI) | [supportController.addProcessing](<../backend/src/controllers/supportController.js>) | [supportService.addProcessing](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_ADD_PROCESSING → dbo.sp_Support_Complaint_AddProcessing |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /support → SupportPortal → supportApi.addComplaintProcessing; content/next-status form, busy/error, reloadQueue+detail after write.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [supportApi.js](<../frontend/src/api/supportApi.js>), [SupportPortal.jsx](<../frontend/src/pages/SupportPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E133](#evidence-e133), [E134](#evidence-e134), [E135](#evidence-e135), [E150](#evidence-e150), [E151](#evidence-e151)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser append, validation/denied permissions, detail/queue refresh and timeline after retry.. Gap: R71-FE-CSKH-05.



**Test IDs / raw case identities:** `R6.8-linked-06`, `R6.8-linked-16`, `R6.8-linked-33`, `identity-order-over-timestamp`, `trigger-after-parent-update-batch-failure`

**R7.3 acceptance rationale:** Ghi lần xử lý: DB/BE PASS theo E133, E134, E135, E150, E151; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/27`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [CSKH-05 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/27`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-cskh-06"></a>

### CSKH-06 — Đổi trạng thái

**Mục tiêu:** Đồng bộ trạng thái của KHIEUNAI theo kết quả của lần xử lý mới nhất.

**Luồng baseline:** 1. Sau khi ghi nhận lần xử lý (XULY_KHIEUNAI), CSKH chọn trạng thái mới cho khiếu nại. → 2. Hệ thống cập nhật trường trạng thái trong KHIEUNAI, đảm bảo đồng bộ với lịch sử xử lý mới nhất. → 3. Khách hàng có thể theo dõi trạng thái đã cập nhật khi tra cứu khiếu nại của mình.

**Nguồn:** [Đặc tả dòng 361](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** CSKH+BOTH QL_KHIEUNAI/XULY_KHIEUNAI; valid nextstatus (không Mới).

**Kết quả mong đợi:** Status command appends auditprocessing, deterministic parentstatus independent manipulated timestamps; no partialwrite.

**Database:** [KHIEUNAI](<../database/02_tables/khieunai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>), [XULY_KHIEUNAI](<../database/02_tables/xuly_khieunai.sql>).

**Entry points:** [sp_Support_Complaint_UpdateStatus](<../database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai](<../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql>), [TRG_XuLyKhieuNai_KiemTraVaiTro](<../database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql>).

**Constraints:** KHIEUNAI: [PK_KHIEUNAI](<../database/03_constraints/001_primary_unique.sql>); KHIEUNAI: [FK_KHIEUNAI_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [FK_KHIEUNAI_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); KHIEUNAI: [CK_KHIEUNAI_MucDoUuTien](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [CK_KHIEUNAI_TrangThai](<../database/03_constraints/003_check_constraints.sql>); KHIEUNAI: [DF_KHIEUNAI_MucDoUuTien](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_TrangThai](<../database/03_constraints/004_defaults.sql>); KHIEUNAI: [DF_KHIEUNAI_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** CHECK status + trigger latest MAXXuLyID; same own/savepoint TX and rollback under fault/multirow updates.

**Authorization:** AND(QL_KHIEUNAI,XULY_KHIEUNAI); current staff role/grants and trusted actor.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| PUT /api/support/complaints/:complaintId/status | [route:23](<../backend/src/routes/supportRoutes.js>) | authenticate → requireSupport | AND(QL_KHIEUNAI,XULY_KHIEUNAI) | [supportController.updateStatus](<../backend/src/controllers/supportController.js>) | [supportService.updateStatus](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_UPDATE_STATUS → dbo.sp_Support_Complaint_UpdateStatus |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /support → SupportPortal → supportApi.updateComplaintStatus; status/content form, busy/error, refresh queue/detail.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [supportApi.js](<../frontend/src/api/supportApi.js>), [SupportPortal.jsx](<../frontend/src/pages/SupportPortal.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E136](#evidence-e136), [E137](#evidence-e137), [E138](#evidence-e138), [E150](#evidence-e150), [E151](#evidence-e151)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser status change, audit append, validation/permission denial and refreshed detail/queue.. Gap: R71-FE-CSKH-06.



**Test IDs / raw case identities:** `R6.8-linked-07`, `R6.8-linked-17`, `R6.8-linked-34`, `identity-order-over-timestamp`, `trigger-after-parent-update-batch-failure`

**R7.3 acceptance rationale:** Đổi trạng thái: DB/BE PASS theo E136, E137, E138, E150, E151; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/28`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [CSKH-06 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/28`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-01"></a>

### ADM-01 — Đăng nhập

**Mục tiêu:** Quản trị viên đăng nhập để truy cập toàn bộ khu vực Admin.

**Luồng baseline:** 1. Admin nhập Email + mật khẩu. → 2. Hệ thống xác thực tài khoản, xác định vai trò ADMIN và tra cứu quyền qua VAITRO_QUYEN. → 3. Hệ thống điều hướng vào khu vực Admin: người dùng, vai trò, quyền, rạp, phân công, danh mục phim/sản phẩm/khuyến mãi, suất chiếu, khiếu nại và báo cáo.

**Nguồn:** [Đặc tả dòng 373](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** Active ADMIN credentials; module grants current.

**Kết quả mong đợi:** Login200 ADMIN/current grants; revoked grant affects operation despite old token.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Auth_Login](<../database/08_procedures/auth/sp_Auth_Login.sql>), [sp_Manager_ListAssignedCinemas](<../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql>), [sp_RBAC_GetPermissionsByUser](<../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql>), [sp_User_GetCurrent](<../database/08_procedures/auth/sp_User_GetCurrent.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHANCONG_RAP: [PK_PHANCONG_RAP](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Auth/currentuser + RBAC SQL; ADMIN alone does not bypass live module permissions.

**Authorization:** Public login; /admin role ADMIN; each API authenticate→Admin→exact grant.

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| POST /api/auth/login | [route:7](<../backend/src/routes/authRoutes.js>) | Public + app.createAuthRateLimiter before JSON parser | N/A — public/self-read/bootstrap contract | [authController.login](<../backend/src/controllers/authController.js>) | [authService.login](<../backend/src/services/authService.js>) | AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [route:8](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentUser](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [route:10](<../backend/src/routes/authRoutes.js>) | authenticate | N/A — public/self-read/bootstrap contract | [authController.currentPermissions](<../backend/src/controllers/authController.js>) | [authenticate → authService.getCurrentUser](<../backend/src/services/authService.js>) | USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /login → Login/AuthProvider; /admin → RequireRole(Admin)/AdminPortal; per-module permissions, busy/error.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [Login.jsx](<../frontend/src/pages/auth/Login.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E014](#evidence-e014), [E006](#evidence-e006), [E007](#evidence-e007), [E008](#evidence-e008), [E009](#evidence-e009), [E010](#evidence-e010), [E011](#evidence-e011)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Chưa browser Admin login→portal, module access after permission removal, session reload.. Gap: R71-FE-ADM-01.



**Test IDs / raw case identities:** `real login JWT/current permissions/assignments ADMIN`, `under-limit invalid/unknown credentials keep existing generic401`, `real four-role RBAC and non-auth endpoints preserved`, `account status and existing JWT live recheck unchanged`, `R4.5-07 login beyond production threshold never calls actual service/SQL`, `spoof resistance and other endpoints work with login/register counters exhausted`, `R4.5-04/10 exact expiry allows manual retry through real auth SP without sleeps`

**R7.3 acceptance rationale:** Đăng nhập: DB/BE PASS theo E014, E006, E007, E008, E009, E010, E011; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/29`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-01 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/29`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-02"></a>

### ADM-02 — Tài khoản người dùng

**Mục tiêu:** Tạo tài khoản cho nhân sự nội bộ (Quản lý rạp, CSKH, Admin khác) và quản lý trạng thái (khóa/mở) của mọi tài khoản trong hệ thống, kể cả tài khoản khách hàng.

**Luồng baseline:** 1. Admin truy cập màn hình quản lý người dùng. → 2. Để tạo tài khoản nội bộ: Admin nhập thông tin và chọn vai trò (QUAN_LY_RAP hoặc CSKH); hệ thống tạo bản ghi trong NGUOIDUNG với VaiTroID tương ứng (tài khoản Khách hàng do người dùng tự đăng ký, không tạo thay ở đây). → 3. Để quản lý trạng thái: Admin tìm kiếm tài khoản cần thao tác, xem thông tin chi tiết. → 4. Admin cập nhật TrangThai của tài khoản (khóa/mở) khi cần thiết; hệ thống ghi nhận thay đổi.

**Nguồn:** [Đặc tả dòng 383](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** List/create user và status change readback; no arbitrary role/owner input, invalid/reference/duplicate không write.

**Database:** [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_User_Create](<../database/08_procedures/admin/sp_Admin_User_Create.sql>), [sp_Admin_User_List](<../database/08_procedures/admin/sp_Admin_User_List.sql>), [sp_Admin_User_UpdateStatus](<../database/08_procedures/admin/sp_Admin_User_UpdateStatus.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** HOSOKHACHHANG: [PK_HOSOKHACHHANG](<../database/03_constraints/001_primary_unique.sql>); HOSOKHACHHANG: [FK_HOSOKHACHHANG_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [CK_HOSOKHACHHANG_GioiTinh](<../database/03_constraints/003_check_constraints.sql>); HOSOKHACHHANG: [DF_HOSOKHACHHANG_DiemTichLuy](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); QUYEN: [PK_QUYEN](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** NGUOIDUNG/VAITRO; tạo staff account với typed bcrypt password và khóa/mở status; email/phone UQ, role FK, current grants.

**Authorization:** authenticate→requireAdmin→QL_NGUOIDUNG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/users | [route:12](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_NGUOIDUNG) | [adminController.users](<../backend/src/controllers/adminController.js>) | [adminService.users](<../backend/src/services/adminService.js>) | ADMIN_USER_LIST → dbo.sp_Admin_User_List |
| POST /api/admin/users | [route:13](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_NGUOIDUNG) | [adminController.createUser](<../backend/src/controllers/adminController.js>) | [adminService.createUser](<../backend/src/services/adminService.js>) | ADMIN_USER_CREATE → dbo.sp_Admin_User_Create |
| PUT /api/admin/users/:userId/status | [route:14](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_NGUOIDUNG) | [adminController.updateUserStatus](<../backend/src/controllers/adminController.js>) | [adminService.setUserStatus](<../backend/src/services/adminService.js>) | ADMIN_USER_UPDATE_STATUS → dbo.sp_Admin_User_UpdateStatus |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section users → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E152](#evidence-e152), [E153](#evidence-e153), [E154](#evidence-e154), [E155](#evidence-e155), [E156](#evidence-e156), [E157](#evidence-e157), [E158](#evidence-e158), [E159](#evidence-e159), [E160](#evidence-e160), [E161](#evidence-e161), [E437](#evidence-e437)

**R7.2 DB/BE PASS:** 17 case thực tế PASS; R71-CT-02 RESOLVED. Contract: Approved target role codes QUAN_LY_RAP/CSKH/ADMIN only; active Admin + QL_NGUOIDUNG; typed roleId. **Overall vẫn PARTIAL:** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. User create/status/list UI, duplicate/invalidrole, lockedaccount and reload.. Gap FE còn lại: R71-FE-ADM-02.



**R7.2 evidence:** [case index](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), test IDs `ADM02-01-QUAN_LY_RAP`, `ADM02-01-CSKH`, `ADM02-01-ADMIN`, `ADM02-02-customer`, `ADM02-02-sql-customer`, `ADM02-02-custom`, `ADM02-02-sql-custom`, `ADM02-03`, `ADM02-04`, `ADM02-05`, `ADM02-06-duplicate`, `ADM02-06-invalid`, `ADM02-07`, `ADM02-07-failure`, `ADM02-07-savepoint`, `ADM02-08-status`, `ADM02-08-list`; SQL/HTTP pointers, fingerprint và cleanup theo từng case. Policy: [approved decisions](contracts/R7_2_APPROVED_POLICIES.md).

**Role policy hiện hành:** Admin chỉ tạo Manager/CSKH/Admin. Customer/custom role → SQL50404 / HTTP403 ROLE_CREATE_FORBIDDEN; role không tồn tại giữ FK400. Staff không có customer profile. Mâu thuẫn mô tả/luồng baseline đã được người dùng giải quyết, FE options theo policy chuyển R8.


**Test IDs / raw case identities:** `R6.9-admin-003`, `R6.9-admin-004`, `R6.9-admin-005`, `R6.9-admin-008`, `R6.9-admin-009`, `R6.9-admin-010`, `R6.9-admin-013`, `ADM02-01-QUAN_LY_RAP`, `ADM02-01-CSKH`, `ADM02-01-ADMIN`, `ADM02-02-customer`, `ADM02-02-sql-customer`, `ADM02-02-custom`, `ADM02-02-sql-custom`, `ADM02-03`, `ADM02-04`, `ADM02-05`, `ADM02-06-duplicate`, `ADM02-06-invalid`, `ADM02-07`, `ADM02-07-failure`, `ADM02-07-savepoint`, `ADM02-08-status`, `ADM02-08-list`; records without a test ID: E152 `/operations/1`, E153 `/operations/2`, E154 `/operations/3` (artifact is linked in registry).

**R7.3 acceptance rationale:** Tài khoản người dùng: DB/BE PASS theo E152, E153, E154, E155, E156, E157, E158, E159, E160, E161, E437 và 17 case R7.2 đã đối chiếu raw SQL/HTTP, authorization, fingerprint và cleanup; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/30`. Freshness: New R7.2 real SQL/HTTP cases on approved canonical definitions.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-02 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/30`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-03"></a>

### ADM-03 — Vai trò

**Mục tiêu:** Thêm/sửa/xóa các vai trò sử dụng trong cơ chế phân quyền RBAC.

**Luồng baseline:** 1. Admin truy cập màn hình quản lý vai trò. → 2. Admin thêm/sửa/xóa vai trò (MaVaiTro, TenVaiTro, MoTa) trong bảng VAITRO. → 3. Hệ thống kiểm tra ràng buộc trước khi xóa (vai trò đang được gán cho người dùng hoặc quyền thì không thể xóa trực tiếp).

**Nguồn:** [Đặc tả dòng 393](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** List/create/update/delete safe role; dependency conflicts keep references.

**Database:** [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Role_Create](<../database/08_procedures/admin/sp_Admin_Role_Create.sql>), [sp_Admin_Role_Delete](<../database/08_procedures/admin/sp_Admin_Role_Delete.sql>), [sp_Admin_Role_List](<../database/08_procedures/admin/sp_Admin_Role_List.sql>), [sp_Admin_Role_Update](<../database/08_procedures/admin/sp_Admin_Role_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); QUYEN: [PK_QUYEN](<../database/03_constraints/001_primary_unique.sql>); QUYEN: [UQ_QUYEN_MaQuyen](<../database/03_constraints/001_primary_unique.sql>); VAITRO: [PK_VAITRO](<../database/03_constraints/001_primary_unique.sql>); VAITRO: [UQ_VAITRO_MaVaiTro](<../database/03_constraints/001_primary_unique.sql>); VAITRO_QUYEN: [PK_VAITRO_QUYEN](<../database/03_constraints/001_primary_unique.sql>); VAITRO_QUYEN: [FK_VAITRO_QUYEN_Quyen](<../database/03_constraints/002_foreign_keys.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** VAITRO unique code; role CRUD + FK NGUOIDUNG/VAITRO_QUYEN dependency protection.

**Authorization:** authenticate→requireAdmin→QL_VAITRO; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/roles | [route:15](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_VAITRO) | [adminController.roles](<../backend/src/controllers/adminController.js>) | [adminService.roles](<../backend/src/services/adminService.js>) | ADMIN_ROLE_LIST → dbo.sp_Admin_Role_List |
| POST /api/admin/roles | [route:17](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_VAITRO) | [adminController.createRole](<../backend/src/controllers/adminController.js>) | [adminService.createRole](<../backend/src/services/adminService.js>) | ADMIN_ROLE_CREATE → dbo.sp_Admin_Role_Create |
| PUT /api/admin/roles/:roleId | [route:18](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_VAITRO) | [adminController.updateRole](<../backend/src/controllers/adminController.js>) | [adminService.updateRole](<../backend/src/services/adminService.js>) | ADMIN_ROLE_UPDATE → dbo.sp_Admin_Role_Update |
| DELETE /api/admin/roles/:roleId | [route:19](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_VAITRO) | [adminController.deleteRole](<../backend/src/controllers/adminController.js>) | [adminService.deleteRole](<../backend/src/services/adminService.js>) | ADMIN_ROLE_DELETE → dbo.sp_Admin_Role_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section roles → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [roles.js](<../frontend/src/constants/roles.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E162](#evidence-e162), [E163](#evidence-e163), [E164](#evidence-e164), [E165](#evidence-e165), [E166](#evidence-e166), [E167](#evidence-e167), [E168](#evidence-e168), [E169](#evidence-e169), [E170](#evidence-e170), [E171](#evidence-e171), [E172](#evidence-e172)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Role CRUD form, usedrole delete conflict and list reload.. Gap: R71-FE-ADM-03.



**Test IDs / raw case identities:** `R6.9-admin-018`, `R6.9-admin-019`, `R6.9-admin-022`, `R6.9-admin-025`, `R6.9-admin-026`, `R6.9-admin-048`, `R6.9-admin-054`; records without a test ID: E162 `/operations/4`, E163 `/operations/6`, E164 `/operations/7`, E165 `/operations/8` (artifact is linked in registry).

**R7.3 acceptance rationale:** Vai trò: DB/BE PASS theo E162, E163, E164, E165, E166, E167, E168, E169, E170, E171, E172; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/31`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-03 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/31`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-04"></a>

### ADM-04 — Danh mục quyền

**Mục tiêu:** Thêm/sửa/xóa các quyền chức năng dùng trong cơ chế phân quyền.

**Luồng baseline:** 1. Admin truy cập màn hình danh mục quyền. → 2. Admin thêm/sửa/xóa các quyền (MaQuyen, TenQuyen, MoTa) trong bảng QUYEN.

**Nguồn:** [Đặc tả dòng 403](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** List/create/update/delete allowedpermission; duplicate/dependency conflicts safe.

**Database:** [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Permission_Create](<../database/08_procedures/admin/sp_Admin_Permission_Create.sql>), [sp_Admin_Permission_Delete](<../database/08_procedures/admin/sp_Admin_Permission_Delete.sql>), [sp_Admin_Permission_List](<../database/08_procedures/admin/sp_Admin_Permission_List.sql>), [sp_Admin_Permission_Update](<../database/08_procedures/admin/sp_Admin_Permission_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); QUYEN: [PK_QUYEN](<../database/03_constraints/001_primary_unique.sql>); QUYEN: [UQ_QUYEN_MaQuyen](<../database/03_constraints/001_primary_unique.sql>); VAITRO: [PK_VAITRO](<../database/03_constraints/001_primary_unique.sql>); VAITRO: [UQ_VAITRO_MaVaiTro](<../database/03_constraints/001_primary_unique.sql>); VAITRO_QUYEN: [PK_VAITRO_QUYEN](<../database/03_constraints/001_primary_unique.sql>); VAITRO_QUYEN: [FK_VAITRO_QUYEN_Quyen](<../database/03_constraints/002_foreign_keys.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** QUYEN unique code; permission CRUD; VAITRO_QUYEN FK protects used grants.

**Authorization:** authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/permissions | [route:20](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_QUYEN) | [adminController.permissions](<../backend/src/controllers/adminController.js>) | [adminService.permissions](<../backend/src/services/adminService.js>) | ADMIN_PERMISSION_LIST → dbo.sp_Admin_Permission_List |
| POST /api/admin/permissions | [route:21](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_QUYEN) | [adminController.createPermission](<../backend/src/controllers/adminController.js>) | [adminService.createPermission](<../backend/src/services/adminService.js>) | ADMIN_PERMISSION_CREATE → dbo.sp_Admin_Permission_Create |
| PUT /api/admin/permissions/:permissionId | [route:22](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_QUYEN) | [adminController.updatePermission](<../backend/src/controllers/adminController.js>) | [adminService.updatePermission](<../backend/src/services/adminService.js>) | ADMIN_PERMISSION_UPDATE → dbo.sp_Admin_Permission_Update |
| DELETE /api/admin/permissions/:permissionId | [route:23](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_QUYEN) | [adminController.deletePermission](<../backend/src/controllers/adminController.js>) | [adminService.deletePermission](<../backend/src/services/adminService.js>) | ADMIN_PERMISSION_DELETE → dbo.sp_Admin_Permission_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section permissions → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E173](#evidence-e173), [E174](#evidence-e174), [E175](#evidence-e175), [E176](#evidence-e176), [E177](#evidence-e177), [E178](#evidence-e178), [E179](#evidence-e179), [E180](#evidence-e180), [E181](#evidence-e181), [E182](#evidence-e182), [E183](#evidence-e183), [E184](#evidence-e184)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Permission CRUD, usedgrant delete conflict, missingpermission behavior.. Gap: R71-FE-ADM-04.



**Test IDs / raw case identities:** `R6.9-admin-029`, `R6.9-admin-030`, `R6.9-admin-033`, `R6.9-admin-036`, `R6.9-admin-037`, `R6.9-admin-038`, `R6.9-admin-051`, `R6.9-admin-053`; records without a test ID: E173 `/operations/9`, E174 `/operations/10`, E175 `/operations/11`, E176 `/operations/12` (artifact is linked in registry).

**R7.3 acceptance rationale:** Danh mục quyền: DB/BE PASS theo E173, E174, E175, E176, E177, E178, E179, E180, E181, E182, E183, E184; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/32`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-04 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/32`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-05"></a>

### ADM-05 — Gán quyền vai trò

**Mục tiêu:** Thiết lập tập quyền tương ứng cho từng vai trò thông qua bảng nối VAITRO_QUYEN.

**Luồng baseline:** 1. Admin chọn một vai trò trong VAITRO. → 2. Hệ thống hiển thị toàn bộ QUYEN và đánh dấu các quyền đã được gán cho vai trò này. → 3. Admin thêm hoặc bỏ quyền cho vai trò; hệ thống cập nhật bảng VAITRO_QUYEN. → 4. Khi người dùng thuộc vai trò này thực hiện một chức năng, hệ thống sẽ dựa vào VAITRO_QUYEN để xác định có được phép thực hiện hay không.

**Nguồn:** [Đặc tả dòng 413](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** List current grants, set full list/empty atomically; stale token sees current permissions.

**Database:** [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_RolePermission_Set](<../database/08_procedures/admin/sp_Admin_RolePermission_Set.sql>), [usp_Admin_RolePermission_List](<../database/08_procedures/admin/usp_Admin_RolePermission_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); QUYEN: [PK_QUYEN](<../database/03_constraints/001_primary_unique.sql>); QUYEN: [UQ_QUYEN_MaQuyen](<../database/03_constraints/001_primary_unique.sql>); VAITRO: [PK_VAITRO](<../database/03_constraints/001_primary_unique.sql>); VAITRO: [UQ_VAITRO_MaVaiTro](<../database/03_constraints/001_primary_unique.sql>); VAITRO_QUYEN: [PK_VAITRO_QUYEN](<../database/03_constraints/001_primary_unique.sql>); VAITRO_QUYEN: [FK_VAITRO_QUYEN_Quyen](<../database/03_constraints/002_foreign_keys.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** VAITRO_QUYEN set replacement uses own transaction/savepoint, validates each permissionFK; explicit[] clears; invalidID restoresoldset.

**Authorization:** authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/roles/:roleId/permissions | [route:16](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_QUYEN) | [adminController.rolePermissions](<../backend/src/controllers/adminController.js>) | [adminService.rolePermissions](<../backend/src/services/adminService.js>) | ADMIN_ROLE_PERMISSION_LIST → dbo.usp_Admin_RolePermission_List |
| PUT /api/admin/roles/:roleId/permissions | [route:24](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_QUYEN) | [adminController.setRolePermissions](<../backend/src/controllers/adminController.js>) | [adminService.setRolePermissions](<../backend/src/services/adminService.js>) | ADMIN_ROLE_PERMISSION_SET → dbo.sp_Admin_RolePermission_Set |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section rolePermissions → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E185](#evidence-e185), [E186](#evidence-e186), [E187](#evidence-e187), [E188](#evidence-e188), [E189](#evidence-e189)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Role grant editor load/set/explicitempty, invalidFK keeps grants, currentUI access update.. Gap: R71-FE-ADM-05.



**Test IDs / raw case identities:** `R6.9-admin-041`, `R6.9-admin-044`, `R6.9-admin-045`; records without a test ID: E185 `/operations/5`, E186 `/operations/13` (artifact is linked in registry).

**R7.3 acceptance rationale:** Gán quyền vai trò: DB/BE PASS theo E185, E186, E187, E188, E189; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/33`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-05 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/33`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-06"></a>

### ADM-06 — Phân công quản lý

**Mục tiêu:** Gán một tài khoản có vai trò QUAN_LY_RAP phụ trách quản lý một hoặc nhiều rạp trong một khoảng thời gian.

**Luồng baseline:** 1. Admin chọn NguoiDungID có vai trò QUAN_LY_RAP. → 2. Admin chọn RapID cần phân công và nhập khoảng thời gian hiệu lực (ngày bắt đầu - ngày kết thúc). → 3. Hệ thống kiểm tra tài khoản được chọn đúng có vai trò QUAN_LY_RAP. → 4. Hệ thống tạo bản ghi PHANCONG_RAP; phạm vi phân công còn hiệu lực này được dùng để kiểm soát mọi thao tác quản lý sau đó của tài khoản (BR08).

**Nguồn:** [Đặc tả dòng 423](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Assignment read/create/update/revoke; Manager assigned scope immediately follows persisted date/status.

**Database:** [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Assignment_Create](<../database/08_procedures/admin/sp_Admin_Assignment_Create.sql>), [sp_Admin_Assignment_List](<../database/08_procedures/admin/sp_Admin_Assignment_List.sql>), [usp_Admin_Assignment_Update](<../database/08_procedures/admin/usp_Admin_Assignment_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHANCONG_RAP: [PK_PHANCONG_RAP](<../database/03_constraints/001_primary_unique.sql>); PHANCONG_RAP: [FK_PHANCONG_RAP_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); PHANCONG_RAP: [FK_PHANCONG_RAP_Rap](<../database/03_constraints/002_foreign_keys.sql>); PHANCONG_RAP: [CK_PHANCONG_RAP_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); PHANCONG_RAP: [CK_PHANCONG_RAP_TrangThai](<../database/03_constraints/003_check_constraints.sql>); PHANCONG_RAP: [DF_PHANCONG_RAP_TrangThai](<../database/03_constraints/004_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** PHANCONG_RAP→NGUOIDUNG/RAPCHIEUPHIM FKs; valid Manager role/date/status; create/update/revoke changes live scope.

**Authorization:** authenticate→requireAdmin→PHANCONG_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/assignments | [route:25](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(PHANCONG_RAP) | [adminController.assignments](<../backend/src/controllers/adminController.js>) | [adminService.assignments](<../backend/src/services/adminService.js>) | ADMIN_ASSIGNMENT_LIST → dbo.sp_Admin_Assignment_List |
| POST /api/admin/assignments | [route:26](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(PHANCONG_RAP) | [adminController.createAssignment](<../backend/src/controllers/adminController.js>) | [adminService.createAssignment](<../backend/src/services/adminService.js>) | ADMIN_ASSIGNMENT_CREATE → dbo.sp_Admin_Assignment_Create |
| PUT /api/admin/assignments/:assignmentId | [route:27](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(PHANCONG_RAP) | [adminController.updateAssignment](<../backend/src/controllers/adminController.js>) | [adminService.updateAssignment](<../backend/src/services/adminService.js>) | ADMIN_ASSIGNMENT_UPDATE → dbo.usp_Admin_Assignment_Update |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section assignments → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E190](#evidence-e190), [E191](#evidence-e191), [E192](#evidence-e192), [E193](#evidence-e193), [E194](#evidence-e194), [E195](#evidence-e195), [E196](#evidence-e196), [E197](#evidence-e197), [E198](#evidence-e198), [E199](#evidence-e199), [E200](#evidence-e200)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Assignment create/update/revoke forms, manager/cinema validation, scope refresh.. Gap: R71-FE-ADM-06.



**Test IDs / raw case identities:** `R6.9-admin-068`, `R6.9-admin-069`, `R6.9-admin-072`, `R6.9-admin-073`, `R6.9-admin-074`, `R6.9-admin-075`, `R6.9-admin-076`, `R6.9-admin-079`; records without a test ID: E190 `/operations/14`, E191 `/operations/15`, E192 `/operations/16` (artifact is linked in registry).

**R7.3 acceptance rationale:** Phân công quản lý: DB/BE PASS theo E190, E191, E192, E193, E194, E195, E196, E197, E198, E199, E200; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/34`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-06 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/34`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-07"></a>

### ADM-07 — Rạp và hình ảnh

**Mục tiêu:** Thêm/sửa/xóa thông tin rạp chiếu phim trên toàn hệ thống, không giới hạn phạm vi phân công; quản lý gallery ảnh URL/metadata thuộc rạp.

**Luồng baseline:** 1. Admin truy cập màn hình quản lý rạp. → 2. Admin thêm/sửa/xóa thông tin RAPCHIEUPHIM: tên rạp, địa chỉ, thành phố, số điện thoại, mô tả, ngày hoạt động, trạng thái. → 3. Trong cùng ADM-07, Admin quản lý HINHANH_RAPCHIEUPHIM: URL/path, mô tả, thứ tự hiển thị, trạng thái và một ảnh đại diện.

**Nguồn:** [Đặc tả dòng 433](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Cinema CRUD; image list/create/update/delete/setcover persists; invalidforeignimage does not mutate.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [HINHANH_RAPCHIEUPHIM](<../database/02_tables/hinhanh_rapchieuphim.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Cinema_Create](<../database/08_procedures/admin/sp_Admin_Cinema_Create.sql>), [sp_Admin_Cinema_Delete](<../database/08_procedures/admin/sp_Admin_Cinema_Delete.sql>), [sp_Admin_Cinema_Update](<../database/08_procedures/admin/sp_Admin_Cinema_Update.sql>), [usp_Admin_CinemaImage_Create](<../database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql>), [usp_Admin_CinemaImage_Delete](<../database/08_procedures/admin/usp_Admin_CinemaImage_Delete.sql>), [usp_Admin_CinemaImage_List](<../database/08_procedures/admin/usp_Admin_CinemaImage_List.sql>), [usp_Admin_CinemaImage_SetCover](<../database/08_procedures/admin/usp_Admin_CinemaImage_SetCover.sql>), [usp_Admin_CinemaImage_Update](<../database/08_procedures/admin/usp_Admin_CinemaImage_Update.sql>), [usp_Admin_Cinema_List](<../database/08_procedures/admin/usp_Admin_Cinema_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); HINHANH_RAPCHIEUPHIM: [PK_HINHANH_RAPCHIEUPHIM](<../database/03_constraints/001_primary_unique.sql>); HINHANH_RAPCHIEUPHIM: [FK_HINHANH_RAPCHIEUPHIM_Rap](<../database/03_constraints/002_foreign_keys.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** RAPCHIEUPHIM CRUD with FK history; HINHANH_RAPCHIEUPHIM imageURL/caption/sortorder/cover; scopedimage belongs to cinema; cover consistency.

**Authorization:** authenticate→requireAdmin→QL_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/cinemas | [route:28](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.cinemas](<../backend/src/controllers/adminController.js>) | [adminService.cinemas](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_LIST → dbo.usp_Admin_Cinema_List |
| POST /api/admin/cinemas | [route:29](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.createCinema](<../backend/src/controllers/adminController.js>) | [adminService.createCinema](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_CREATE → dbo.sp_Admin_Cinema_Create |
| PUT /api/admin/cinemas/:cinemaId | [route:30](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.updateCinema](<../backend/src/controllers/adminController.js>) | [adminService.updateCinema](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_UPDATE → dbo.sp_Admin_Cinema_Update |
| DELETE /api/admin/cinemas/:cinemaId | [route:31](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.deleteCinema](<../backend/src/controllers/adminController.js>) | [adminService.deleteCinema](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_DELETE → dbo.sp_Admin_Cinema_Delete |
| GET /api/admin/cinemas/:cinemaId/images | [route:32](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.cinemaImages](<../backend/src/controllers/adminController.js>) | [adminService.cinemaImages](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_IMAGE_LIST → dbo.usp_Admin_CinemaImage_List |
| POST /api/admin/cinemas/:cinemaId/images | [route:33](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.createCinemaImage](<../backend/src/controllers/adminController.js>) | [adminService.createCinemaImage](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_IMAGE_CREATE → dbo.usp_Admin_CinemaImage_Create |
| PUT /api/admin/cinemas/:cinemaId/images/:imageId | [route:34](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.updateCinemaImage](<../backend/src/controllers/adminController.js>) | [adminService.updateCinemaImage](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_IMAGE_UPDATE → dbo.usp_Admin_CinemaImage_Update |
| DELETE /api/admin/cinemas/:cinemaId/images/:imageId | [route:35](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.deleteCinemaImage](<../backend/src/controllers/adminController.js>) | [adminService.deleteCinemaImage](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_IMAGE_DELETE → dbo.usp_Admin_CinemaImage_Delete |
| PATCH /api/admin/cinemas/:cinemaId/images/:imageId/cover | [route:36](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_RAP) | [adminController.setCinemaImageCover](<../backend/src/controllers/adminController.js>) | [adminService.setCinemaImageCover](<../backend/src/services/adminService.js>) | ADMIN_CINEMA_IMAGE_SET_COVER → dbo.usp_Admin_CinemaImage_SetCover |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section cinemas + CinemaImageManager → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes. Component CinemaImageManager.jsx xử lý image actions.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [CinemaImageManager.jsx](<../frontend/src/components/CinemaImageManager.jsx>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | BROKEN | BROKEN |

**Evidence đúng phạm vi:** [E201](#evidence-e201), [E202](#evidence-e202), [E203](#evidence-e203), [E204](#evidence-e204), [E205](#evidence-e205), [E206](#evidence-e206), [E207](#evidence-e207), [E208](#evidence-e208), [E209](#evidence-e209), [E210](#evidence-e210), [E211](#evidence-e211), [E212](#evidence-e212), [E213](#evidence-e213), [E214](#evidence-e214), [E215](#evidence-e215), [E216](#evidence-e216), [E217](#evidence-e217), [E218](#evidence-e218), [E219](#evidence-e219), [E220](#evidence-e220), [E221](#evidence-e221), [E222](#evidence-e222)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Cinema and image CRUD/setcover/reorder selection, orphan/foreignimage denial and empty images.. Gap: R71-FE-ADM-07.



**Test IDs / raw case identities:** `R6.9-admin-057`, `R6.9-admin-058`, `R6.9-admin-061`, `R6.9-admin-064`, `R6.9-admin-065`, `R6.9-admin-084`, `R6.9-admin-085`, `R6.9-admin-087`, `R6.9-admin-090`, `R6.9-admin-093`, `R6.9-admin-097`, `R6.9-admin-101`, `R6.9-admin-250`; records without a test ID: E201 `/operations/17`, E202 `/operations/18`, E203 `/operations/19`, E204 `/operations/20`, E205 `/operations/21`, E206 `/operations/22`, E207 `/operations/23`, E208 `/operations/24`, E209 `/operations/25` (artifact is linked in registry).

**R7.3 acceptance rationale:** Rạp và hình ảnh: DB/BE PASS theo E201, E202, E203, E204, E205, E206, E207, E208, E209, E210, E211, E212, E213, E214, E215, E216, E217, E218, E219, E220, E221, E222; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/35`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: BROKEN.** Real positive UI, HTTP and SQL remain valid; final acceptance revoked by reproduced image resource/error/retry defects [ADM-07 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/35`. R83-FE-01/R83-FE-02 còn OPEN; gap R71-FE-ADM-07 REOPENED, yêu cầu xử lý qua R8.2.

<a id="uc-adm-08"></a>

### ADM-08 — Phòng và ghế toàn hệ

**Mục tiêu:** Thêm/sửa/xóa phòng chiếu và ghế của bất kỳ rạp nào trong hệ thống, không bị giới hạn theo PHANCONG_RAP như Quản lý rạp.

**Luồng baseline:** 1. Admin chọn một rạp bất kỳ trong hệ thống (RAPCHIEUPHIM). → 2. Admin quản lý PHONGCHIEU thuộc rạp: tên phòng, loại phòng, trạng thái. → 3. Admin quản lý GHE thuộc từng phòng: hàng ghế, số ghế, loại ghế, trạng thái.

**Nguồn:** [Đặc tả dòng 443](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Allsystem room/seat CRUD + safe history/delete; no Manager assignment needed for Admin.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [usp_Admin_Room_Create](<../database/08_procedures/admin/usp_Admin_Room_Create.sql>), [usp_Admin_Room_Delete](<../database/08_procedures/admin/usp_Admin_Room_Delete.sql>), [usp_Admin_Room_List](<../database/08_procedures/admin/usp_Admin_Room_List.sql>), [usp_Admin_Room_Update](<../database/08_procedures/admin/usp_Admin_Room_Update.sql>), [usp_Admin_Seat_Create](<../database/08_procedures/admin/usp_Admin_Seat_Create.sql>), [usp_Admin_Seat_Delete](<../database/08_procedures/admin/usp_Admin_Seat_Delete.sql>), [usp_Admin_Seat_List](<../database/08_procedures/admin/usp_Admin_Seat_List.sql>), [usp_Admin_Seat_Update](<../database/08_procedures/admin/usp_Admin_Seat_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GheCoVeHieuLucSuatTuongLai](<../database/05_functions/fn_GheCoVeHieuLucSuatTuongLai.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Admin wrappers wrappers delegate room/seat domain rules after Admin authorization; room-delete TX, seat/history protection, FK/UQ.

**Authorization:** authenticate→requireAdmin→QL_GHE, QL_PHONG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/rooms | [route:37](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_PHONG) | [adminController.rooms](<../backend/src/controllers/adminController.js>) | [adminService.rooms](<../backend/src/services/adminService.js>) | ADMIN_ROOM_LIST → dbo.usp_Admin_Room_List |
| POST /api/admin/rooms | [route:38](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_PHONG) | [adminController.createRoom](<../backend/src/controllers/adminController.js>) | [adminService.createRoom](<../backend/src/services/adminService.js>) | ADMIN_ROOM_CREATE → dbo.usp_Admin_Room_Create |
| PUT /api/admin/rooms/:roomId | [route:39](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_PHONG) | [adminController.updateRoom](<../backend/src/controllers/adminController.js>) | [adminService.updateRoom](<../backend/src/services/adminService.js>) | ADMIN_ROOM_UPDATE → dbo.usp_Admin_Room_Update |
| DELETE /api/admin/rooms/:roomId | [route:40](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_PHONG) | [adminController.deleteRoom](<../backend/src/controllers/adminController.js>) | [adminService.deleteRoom](<../backend/src/services/adminService.js>) | ADMIN_ROOM_DELETE → dbo.usp_Admin_Room_Delete |
| GET /api/admin/seats | [route:41](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_GHE) | [adminController.seats](<../backend/src/controllers/adminController.js>) | [adminService.seats](<../backend/src/services/adminService.js>) | ADMIN_SEAT_LIST → dbo.usp_Admin_Seat_List |
| POST /api/admin/seats | [route:42](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_GHE) | [adminController.createSeat](<../backend/src/controllers/adminController.js>) | [adminService.createSeat](<../backend/src/services/adminService.js>) | ADMIN_SEAT_CREATE → dbo.usp_Admin_Seat_Create |
| PUT /api/admin/seats/:seatId | [route:43](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_GHE) | [adminController.updateSeat](<../backend/src/controllers/adminController.js>) | [adminService.updateSeat](<../backend/src/services/adminService.js>) | ADMIN_SEAT_UPDATE → dbo.usp_Admin_Seat_Update |
| DELETE /api/admin/seats/:seatId | [route:44](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_GHE) | [adminController.deleteSeat](<../backend/src/controllers/adminController.js>) | [adminService.deleteSeat](<../backend/src/services/adminService.js>) | ADMIN_SEAT_DELETE → dbo.usp_Admin_Seat_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section rooms/seats → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E223](#evidence-e223), [E224](#evidence-e224), [E225](#evidence-e225), [E226](#evidence-e226), [E227](#evidence-e227), [E228](#evidence-e228), [E229](#evidence-e229), [E230](#evidence-e230), [E231](#evidence-e231), [E232](#evidence-e232), [E233](#evidence-e233), [E234](#evidence-e234), [E235](#evidence-e235), [E236](#evidence-e236), [E237](#evidence-e237), [E238](#evidence-e238), [E239](#evidence-e239), [E240](#evidence-e240), [E241](#evidence-e241), [E242](#evidence-e242), [E353](#evidence-e353), [E354](#evidence-e354), [E355](#evidence-e355), [E356](#evidence-e356), [E357](#evidence-e357), [E370](#evidence-e370), [E371](#evidence-e371), [E078](#evidence-e078), [E421](#evidence-e421), [E422](#evidence-e422), [E423](#evidence-e423), [E424](#evidence-e424)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Room/seat create/delete/history conflicts and SQL-backed edit; R32 controlled updates cover only a subset.. Gap: R71-FE-ADM-08.



**Test IDs / raw case identities:** `R6.9-admin-105`, `R6.9-admin-106`, `R6.9-admin-109`, `R6.9-admin-112`, `R6.9-admin-113`, `R6.9-admin-114`, `R6.9-admin-117`, `R6.9-admin-118`, `R6.9-admin-121`, `R6.9-admin-124`, `R6.9-admin-129`, `R6.9-admin-242`, `R6.4-r32-sql-cases-087`, `R6.4-r32-sql-cases-088`, `R6.4-r32-sql-cases-089`, `R6.4-r32-sql-cases-090`, `R6.4-r32-sql-cases-095`, `R6.6-r11-concurrency-cases-007`, `R6.6-r11-concurrency-cases-008`, `R6.6-r11-sql-cases-013`; records without a test ID: E223 `/operations/26`, E224 `/operations/27`, E225 `/operations/28`, E226 `/operations/29`, E227 `/operations/30`, E228 `/operations/31`, E229 `/operations/32`, E230 `/operations/33` (artifact is linked in registry).

**R7.3 acceptance rationale:** Phòng và ghế toàn hệ: DB/BE PASS theo E223, E224, E225, E226, E227, E228, E229, E230, E231, E232, E233, E234, E235, E236, E237, E238, E239, E240, E241, E242, E353, E354, E355, E356, E357, E370, E371, E078; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/36`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-08 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/36`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-09"></a>

### ADM-09 — Phim và diễn viên

**Mục tiêu:** Thêm/sửa/xóa thông tin phim và thiết lập quan hệ với thể loại, diễn viên.

**Luồng baseline:** 1. Admin truy cập màn hình quản lý phim. → 2. Admin thêm/sửa/xóa PHIM (tên phim, mô tả, thời lượng, ngày khởi chiếu...). → 3. Admin gán thể loại cho phim qua PHIM_THELOAI (quan hệ n-n với THELOAI). → 4. Admin gán diễn viên và vai diễn cho phim qua PHIM_DIENVIEN (quan hệ n-n với DIENVIEN).

**Nguồn:** [Đặc tả dòng 453](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Movie/actor CRUD, correctcast hydrate/set/clear; invalidgenre/cast leaves full old data.

**Database:** [DANHGIAPHIM](<../database/02_tables/danhgiaphim.sql>), [DIENVIEN](<../database/02_tables/dienvien.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHIM_DIENVIEN](<../database/02_tables/phim_dienvien.sql>), [PHIM_THELOAI](<../database/02_tables/phim_theloai.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THELOAI](<../database/02_tables/theloai.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Actor_Create](<../database/08_procedures/admin/sp_Admin_Actor_Create.sql>), [sp_Admin_Actor_Delete](<../database/08_procedures/admin/sp_Admin_Actor_Delete.sql>), [sp_Admin_Actor_List](<../database/08_procedures/admin/sp_Admin_Actor_List.sql>), [sp_Admin_Actor_Update](<../database/08_procedures/admin/sp_Admin_Actor_Update.sql>), [sp_Admin_MovieActor_Set](<../database/08_procedures/admin/sp_Admin_MovieActor_Set.sql>), [sp_Admin_Movie_Create](<../database/08_procedures/admin/sp_Admin_Movie_Create.sql>), [sp_Admin_Movie_Delete](<../database/08_procedures/admin/sp_Admin_Movie_Delete.sql>), [sp_Admin_Movie_Update](<../database/08_procedures/admin/sp_Admin_Movie_Update.sql>), [usp_Admin_Movie_List](<../database/08_procedures/admin/usp_Admin_Movie_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [sp_Movie_GetDetail](<../database/08_procedures/public/sp_Movie_GetDetail.sql>), [vw_ThongKePhim](<../database/06_views/vw_ThongKePhim.sql>).

**Trigger liên quan:** [TRG_DanhGia_KiemTraDaXemPhim](<../database/07_triggers/TRG_DanhGia_KiemTraDaXemPhim.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** DANHGIAPHIM: [PK_DANHGIAPHIM](<../database/03_constraints/001_primary_unique.sql>); DANHGIAPHIM: [UQ_DANHGIAPHIM_Phim_User](<../database/03_constraints/001_primary_unique.sql>); DANHGIAPHIM: [FK_DANHGIAPHIM_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DANHGIAPHIM: [FK_DANHGIAPHIM_Phim](<../database/03_constraints/002_foreign_keys.sql>); DANHGIAPHIM: [CK_DANHGIAPHIM_SoSao](<../database/03_constraints/003_check_constraints.sql>); DANHGIAPHIM: [DF_DANHGIAPHIM_NgayDanhGia_ClockVN](<../database/03_constraints/005_function_defaults.sql>); DIENVIEN: [PK_DIENVIEN](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** PHIM+PHIM_THELOAI writes atomic withgenreFK; DIENVIEN CRUD; sp_Admin_MovieActor_Set replaces PHIM_DIENVIEN transactionally, validates JSON/FK/duplicates.

**Authorization:** authenticate→requireAdmin→QL_DANHMUC_PHIM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/movies | [route:52](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.movies](<../backend/src/controllers/adminController.js>) | [adminService.movies](<../backend/src/services/adminService.js>) | ADMIN_MOVIE_LIST → dbo.usp_Admin_Movie_List |
| POST /api/admin/movies | [route:53](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.createMovie](<../backend/src/controllers/adminController.js>) | [adminService.createMovie](<../backend/src/services/adminService.js>) | ADMIN_MOVIE_CREATE → dbo.sp_Admin_Movie_Create |
| PUT /api/admin/movies/:movieId | [route:54](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.updateMovie](<../backend/src/controllers/adminController.js>) | [adminService.updateMovie](<../backend/src/services/adminService.js>) | ADMIN_MOVIE_UPDATE → dbo.sp_Admin_Movie_Update |
| DELETE /api/admin/movies/:movieId | [route:55](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.deleteMovie](<../backend/src/controllers/adminController.js>) | [adminService.deleteMovie](<../backend/src/services/adminService.js>) | ADMIN_MOVIE_DELETE → dbo.sp_Admin_Movie_Delete |
| PUT /api/admin/movies/:movieId/actors | [route:56](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.setMovieActors](<../backend/src/controllers/adminController.js>) | [adminService.setMovieActors](<../backend/src/services/adminService.js>) | ADMIN_MOVIE_ACTOR_SET → dbo.sp_Admin_MovieActor_Set |
| GET /api/admin/actors | [route:61](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.actors](<../backend/src/controllers/adminController.js>) | [adminService.actors](<../backend/src/services/adminService.js>) | ADMIN_ACTOR_LIST → dbo.sp_Admin_Actor_List |
| POST /api/admin/actors | [route:62](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.createActor](<../backend/src/controllers/adminController.js>) | [adminService.createActor](<../backend/src/services/adminService.js>) | ADMIN_ACTOR_CREATE → dbo.sp_Admin_Actor_Create |
| PUT /api/admin/actors/:actorId | [route:63](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.updateActor](<../backend/src/controllers/adminController.js>) | [adminService.updateActor](<../backend/src/services/adminService.js>) | ADMIN_ACTOR_UPDATE → dbo.sp_Admin_Actor_Update |
| DELETE /api/admin/actors/:actorId | [route:64](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_DANHMUC_PHIM) | [adminController.deleteActor](<../backend/src/controllers/adminController.js>) | [adminService.deleteActor](<../backend/src/services/adminService.js>) | ADMIN_ACTOR_DELETE → dbo.sp_Admin_Actor_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section movies/actors + cast JSON editor → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E243](#evidence-e243), [E244](#evidence-e244), [E245](#evidence-e245), [E246](#evidence-e246), [E247](#evidence-e247), [E248](#evidence-e248), [E249](#evidence-e249), [E250](#evidence-e250), [E251](#evidence-e251), [E252](#evidence-e252), [E253](#evidence-e253), [E254](#evidence-e254), [E255](#evidence-e255), [E256](#evidence-e256), [E257](#evidence-e257), [E258](#evidence-e258), [E259](#evidence-e259), [E260](#evidence-e260), [E261](#evidence-e261), [E262](#evidence-e262), [E263](#evidence-e263), [E264](#evidence-e264), [E327](#evidence-e327), [E407](#evidence-e407), [E408](#evidence-e408), [E409](#evidence-e409), [E410](#evidence-e410), [E411](#evidence-e411), [E412](#evidence-e412)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. SQL-backed movie/actor CRUD/castsetclear, malformed/error/retry; R31 controlled editor covers cast UI only.. Gap: R71-FE-ADM-09.



**Test IDs / raw case identities:** `R6.9-admin-143`, `R6.9-admin-144`, `R6.9-admin-147`, `R6.9-admin-150`, `R6.9-admin-151`, `R6.9-admin-154`, `R6.9-admin-155`, `R6.9-admin-158`, `R6.9-admin-161`, `R6.9-admin-162`, `R6.9-admin-166`, `R6.9-admin-247`, `R6.9-admin-248`; records without a test ID: E243 `/operations/41`, E244 `/operations/42`, E245 `/operations/43`, E246 `/operations/44`, E247 `/operations/45`, E248 `/operations/50`, E249 `/operations/51`, E250 `/operations/52`, E251 `/operations/53`, E327 `/rollbackInjection` (artifact is linked in registry).

**R7.3 acceptance rationale:** Phim và diễn viên: DB/BE PASS theo E243, E244, E245, E246, E247, E248, E249, E250, E251, E252, E253, E254, E255, E256, E257, E258, E259, E260, E261, E262, E263, E264, E327; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/37`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-09 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/37`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-10"></a>

### ADM-10 — Thể loại

**Mục tiêu:** Thêm/sửa/xóa danh mục thể loại phim dùng trong quan hệ n-n với phim.

**Luồng baseline:** 1. Admin truy cập màn hình danh mục thể loại. → 2. Admin thêm/sửa/xóa thể loại trong bảng THELOAI.

**Nguồn:** [Đặc tả dòng 463](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Genre CRUD + duplicate/dependency safety.

**Database:** [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM_THELOAI](<../database/02_tables/phim_theloai.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [THELOAI](<../database/02_tables/theloai.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Genre_Create](<../database/08_procedures/admin/sp_Admin_Genre_Create.sql>), [sp_Admin_Genre_Delete](<../database/08_procedures/admin/sp_Admin_Genre_Delete.sql>), [sp_Admin_Genre_List](<../database/08_procedures/admin/sp_Admin_Genre_List.sql>), [sp_Admin_Genre_Update](<../database/08_procedures/admin/sp_Admin_Genre_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [sp_Genre_List](<../database/08_procedures/public/sp_Genre_List.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); PHIM_THELOAI: [PK_PHIM_THELOAI](<../database/03_constraints/001_primary_unique.sql>); PHIM_THELOAI: [FK_PHIM_THELOAI_Phim](<../database/03_constraints/002_foreign_keys.sql>); PHIM_THELOAI: [FK_PHIM_THELOAI_TheLoai](<../database/03_constraints/002_foreign_keys.sql>); QUYEN: [PK_QUYEN](<../database/03_constraints/001_primary_unique.sql>); QUYEN: [UQ_QUYEN_MaQuyen](<../database/03_constraints/001_primary_unique.sql>); THELOAI: [PK_THELOAI](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** THELOAI unique name and PHIM_THELOAI FK protects referencedgenre; typed ID CRUD.

**Authorization:** authenticate→requireAdmin→QL_THELOAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/genres | [route:57](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_THELOAI) | [adminController.genres](<../backend/src/controllers/adminController.js>) | [adminService.genres](<../backend/src/services/adminService.js>) | ADMIN_GENRE_LIST → dbo.sp_Admin_Genre_List |
| POST /api/admin/genres | [route:58](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_THELOAI) | [adminController.createGenre](<../backend/src/controllers/adminController.js>) | [adminService.createGenre](<../backend/src/services/adminService.js>) | ADMIN_GENRE_CREATE → dbo.sp_Admin_Genre_Create |
| PUT /api/admin/genres/:genreId | [route:59](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_THELOAI) | [adminController.updateGenre](<../backend/src/controllers/adminController.js>) | [adminService.updateGenre](<../backend/src/services/adminService.js>) | ADMIN_GENRE_UPDATE → dbo.sp_Admin_Genre_Update |
| DELETE /api/admin/genres/:genreId | [route:60](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_THELOAI) | [adminController.deleteGenre](<../backend/src/controllers/adminController.js>) | [adminService.deleteGenre](<../backend/src/services/adminService.js>) | ADMIN_GENRE_DELETE → dbo.sp_Admin_Genre_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section genres → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E265](#evidence-e265), [E266](#evidence-e266), [E267](#evidence-e267), [E268](#evidence-e268), [E269](#evidence-e269), [E270](#evidence-e270), [E271](#evidence-e271), [E272](#evidence-e272), [E273](#evidence-e273), [E274](#evidence-e274), [E275](#evidence-e275)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Genre CRUD and referenced deletion conflict, loading/empty/error.. Gap: R71-FE-ADM-10.



**Test IDs / raw case identities:** `R6.9-admin-132`, `R6.9-admin-133`, `R6.9-admin-136`, `R6.9-admin-139`, `R6.9-admin-140`, `R6.9-admin-173`, `R6.9-admin-249`; records without a test ID: E265 `/operations/46`, E266 `/operations/47`, E267 `/operations/48`, E268 `/operations/49` (artifact is linked in registry).

**R7.3 acceptance rationale:** Thể loại: DB/BE PASS theo E265, E266, E267, E268, E269, E270, E271, E272, E273, E274, E275; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/38`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-10 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/38`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-11"></a>

### ADM-11 — Sản phẩm đồ ăn

**Mục tiêu:** Thêm/sửa/xóa danh mục sản phẩm đồ ăn, thức uống, combo phục vụ khách hàng khi đặt vé.

**Luồng baseline:** 1. Admin truy cập màn hình quản lý sản phẩm. → 2. Admin thêm/sửa/xóa SANPHAM: tên sản phẩm, giá, mô tả, trạng thái kinh doanh.

**Nguồn:** [Đặc tả dòng 473](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Product CRUD and activecatalog reflection; historical unitprice/amount unchanged.

**Database:** [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Product_Create](<../database/08_procedures/admin/sp_Admin_Product_Create.sql>), [sp_Admin_Product_Delete](<../database/08_procedures/admin/sp_Admin_Product_Delete.sql>), [sp_Admin_Product_Update](<../database/08_procedures/admin/sp_Admin_Product_Update.sql>), [usp_Admin_Product_List](<../database/08_procedures/admin/usp_Admin_Product_List.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [FK_CHITIETDOAN_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [FK_CHITIETDOAN_SanPham](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [CK_CHITIETDOAN_DonGia](<../database/03_constraints/003_check_constraints.sql>); CHITIETDOAN: [CK_CHITIETDOAN_SoLuong](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [FK_NGUOIDUNG_VaiTro](<../database/03_constraints/002_foreign_keys.sql>); NGUOIDUNG: [CK_NGUOIDUNG_TrangThai](<../database/03_constraints/003_check_constraints.sql>); NGUOIDUNG: [DF_NGUOIDUNG_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [DF_NGUOIDUNG_NgayTao_ClockVN](<../database/03_constraints/005_function_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** SANPHAM CRUD pricing/checks; CHITIETDOAN snapshothistory independent current price; usedproduct delete FK conflict.

**Authorization:** authenticate→requireAdmin→QL_SANPHAM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/products | [route:65](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SANPHAM) | [adminController.products](<../backend/src/controllers/adminController.js>) | [adminService.products](<../backend/src/services/adminService.js>) | ADMIN_PRODUCT_LIST → dbo.usp_Admin_Product_List |
| POST /api/admin/products | [route:66](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SANPHAM) | [adminController.createProduct](<../backend/src/controllers/adminController.js>) | [adminService.createProduct](<../backend/src/services/adminService.js>) | ADMIN_PRODUCT_CREATE → dbo.sp_Admin_Product_Create |
| PUT /api/admin/products/:productId | [route:67](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SANPHAM) | [adminController.updateProduct](<../backend/src/controllers/adminController.js>) | [adminService.updateProduct](<../backend/src/services/adminService.js>) | ADMIN_PRODUCT_UPDATE → dbo.sp_Admin_Product_Update |
| DELETE /api/admin/products/:productId | [route:68](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SANPHAM) | [adminController.deleteProduct](<../backend/src/controllers/adminController.js>) | [adminService.deleteProduct](<../backend/src/services/adminService.js>) | ADMIN_PRODUCT_DELETE → dbo.sp_Admin_Product_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section products → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E276](#evidence-e276), [E277](#evidence-e277), [E278](#evidence-e278), [E279](#evidence-e279), [E280](#evidence-e280), [E281](#evidence-e281), [E282](#evidence-e282), [E283](#evidence-e283), [E284](#evidence-e284), [E285](#evidence-e285), [E373](#evidence-e373)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Product CRUD, invalidprice/useddelete, catalogrefresh/historicaldisplay.. Gap: R71-FE-ADM-11.



**Test IDs / raw case identities:** `R6.9-admin-207`, `R6.9-admin-208`, `R6.9-admin-211`, `R6.9-admin-214`, `R6.9-admin-215`, `R6.9-admin-218`, `R6.4-r32-sql-monetary-001`; records without a test ID: E276 `/operations/54`, E277 `/operations/55`, E278 `/operations/56`, E279 `/operations/57` (artifact is linked in registry).

**R7.3 acceptance rationale:** Sản phẩm đồ ăn: DB/BE PASS theo E276, E277, E278, E279, E280, E281, E282, E283, E284, E285, E373; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/39`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-11 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/39`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-12"></a>

### ADM-12 — Chương trình khuyến mãi

**Mục tiêu:** Thêm/sửa/xóa các chương trình khuyến mãi áp dụng khi khách hàng đặt vé.

**Luồng baseline:** 1. Admin truy cập màn hình quản lý khuyến mãi. → 2. Admin tạo/sửa/xóa KHUYENMAI: mã code, loại giảm giá (phần trăm/số tiền), giá trị giảm, điều kiện đơn tối thiểu, mức giảm tối đa, thời gian hiệu lực, số lượng sử dụng, trạng thái.

**Nguồn:** [Đặc tả dòng 483](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Promotion CRUD valid fields/time/quota; percent100 reject/no writes; booked discount snapshot unchanged.

**Database:** [DONDATVE](<../database/02_tables/dondatve.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Promotion_Create](<../database/08_procedures/admin/sp_Admin_Promotion_Create.sql>), [sp_Admin_Promotion_Delete](<../database/08_procedures/admin/sp_Admin_Promotion_Delete.sql>), [sp_Admin_Promotion_List](<../database/08_procedures/admin/sp_Admin_Promotion_List.sql>), [sp_Admin_Promotion_Update](<../database/08_procedures/admin/sp_Admin_Promotion_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** N/A — không có trigger trên tables của luồng chính; integrity bằng constraints/SP..

**Constraints:** DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TienGiamGia](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TongTienDoAn](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TongTienVe](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [CK_DONDATVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); DONDATVE: [DF_DONDATVE_TongTienVe](<../database/03_constraints/004_defaults.sql>); DONDATVE: [DF_DONDATVE_TongTienDoAn](<../database/03_constraints/004_defaults.sql>); DONDATVE: [DF_DONDATVE_TienGiamGia](<../database/03_constraints/004_defaults.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** KHUYENMAI percent≤99, nonnegative/minimum/max constraints, quotaused≤quantity; booking revalidates after lock; historic discount immutable.

**Authorization:** authenticate→requireAdmin→QL_KHUYENMAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/promotions | [route:69](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHUYENMAI) | [adminController.promotions](<../backend/src/controllers/adminController.js>) | [adminService.promotions](<../backend/src/services/adminService.js>) | ADMIN_PROMOTION_LIST → dbo.sp_Admin_Promotion_List |
| POST /api/admin/promotions | [route:70](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHUYENMAI) | [adminController.createPromotion](<../backend/src/controllers/adminController.js>) | [adminService.createPromotion](<../backend/src/services/adminService.js>) | ADMIN_PROMOTION_CREATE → dbo.sp_Admin_Promotion_Create |
| PUT /api/admin/promotions/:promotionId | [route:71](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHUYENMAI) | [adminController.updatePromotion](<../backend/src/controllers/adminController.js>) | [adminService.updatePromotion](<../backend/src/services/adminService.js>) | ADMIN_PROMOTION_UPDATE → dbo.sp_Admin_Promotion_Update |
| DELETE /api/admin/promotions/:promotionId | [route:72](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHUYENMAI) | [adminController.deletePromotion](<../backend/src/controllers/adminController.js>) | [adminService.deletePromotion](<../backend/src/services/adminService.js>) | ADMIN_PROMOTION_DELETE → dbo.sp_Admin_Promotion_Delete |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section promotions → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E286](#evidence-e286), [E287](#evidence-e287), [E288](#evidence-e288), [E289](#evidence-e289), [E290](#evidence-e290), [E291](#evidence-e291), [E292](#evidence-e292), [E293](#evidence-e293), [E294](#evidence-e294), [E295](#evidence-e295), [E296](#evidence-e296), [E373](#evidence-e373)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Promo CRUD, dates/percent100/quota validation, deletion/reference, formerror/retry.. Gap: R71-FE-ADM-12.



**Test IDs / raw case identities:** `R6.9-admin-221`, `R6.9-admin-222`, `R6.9-admin-225`, `R6.9-admin-228`, `R6.9-admin-229`, `R6.9-admin-230`, `R6.9-admin-233`, `R6.4-r32-sql-monetary-001`; records without a test ID: E286 `/operations/58`, E287 `/operations/59`, E288 `/operations/60`, E289 `/operations/61` (artifact is linked in registry).

**R7.3 acceptance rationale:** Chương trình khuyến mãi: DB/BE PASS theo E286, E287, E288, E289, E290, E291, E292, E293, E294, E295, E296, E373; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/40`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-12 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/40`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-13"></a>

### ADM-13 — Bảng giá toàn hệ

**Mục tiêu:** Cấu hình mức phụ thu theo loại ghế/loại ngày/định dạng cho bất kỳ rạp nào trong hệ thống.

**Luồng baseline:** 1. Admin chọn rạp cần cấu hình bảng giá (không giới hạn phạm vi phân công). → 2. Admin tạo/sửa quy tắc BANGGIA: loại ghế, loại ngày, định dạng, mức phụ thu, thời gian hiệu lực. → 3. Hệ thống lưu cấu hình để sử dụng khi tính giá vé thực tế cho khách hàng.

**Nguồn:** [Đặc tả dòng 493](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** List/create/update full pricing dimensions/range/surcharge/status, overlap409 readback; no holiday type.

**Database:** [BANGGIA](<../database/02_tables/banggia.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [usp_Admin_Pricing_Create](<../database/08_procedures/admin/usp_Admin_Pricing_Create.sql>), [usp_Admin_Pricing_List](<../database/08_procedures/admin/usp_Admin_Pricing_List.sql>), [usp_Admin_Pricing_Update](<../database/08_procedures/admin/usp_Admin_Pricing_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>).

**Trigger liên quan:** [TRG_BangGia_KiemTraChongLan](<../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql>).

**Constraints:** BANGGIA: [PK_BANGGIA](<../database/03_constraints/001_primary_unique.sql>); BANGGIA: [FK_BANGGIA_Rap](<../database/03_constraints/002_foreign_keys.sql>); BANGGIA: [CK_BANGGIA_DinhDang](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiGhe](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_LoaiNgay](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_PhuThu](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_ThoiGian](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [CK_BANGGIA_TrangThai](<../database/03_constraints/003_check_constraints.sql>); BANGGIA: [DF_BANGGIA_PhuThu](<../database/03_constraints/004_defaults.sql>); BANGGIA: [DF_BANGGIA_TrangThai](<../database/03_constraints/004_defaults.sql>); NGUOIDUNG: [PK_NGUOIDUNG](<../database/03_constraints/001_primary_unique.sql>); NGUOIDUNG: [UQ_NGUOIDUNG_Email](<../database/03_constraints/001_primary_unique.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Admin pricing wrappers → Manager pricing domain core with Admin actor authorization; full seven fields/NULL date; overlaps prevented; three day types.

**Authorization:** authenticate→requireAdmin→QL_BANG_GIA; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/pricing | [route:45](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_BANG_GIA) | [adminController.pricing](<../backend/src/controllers/adminController.js>) | [adminService.pricing](<../backend/src/services/adminService.js>) | ADMIN_PRICING_LIST → dbo.usp_Admin_Pricing_List |
| POST /api/admin/pricing | [route:46](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_BANG_GIA) | [adminController.createPricing](<../backend/src/controllers/adminController.js>) | [adminService.createPricing](<../backend/src/services/adminService.js>) | ADMIN_PRICING_CREATE → dbo.usp_Admin_Pricing_Create |
| PUT /api/admin/pricing/:pricingId | [route:47](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_BANG_GIA) | [adminController.updatePricing](<../backend/src/controllers/adminController.js>) | [adminService.updatePricing](<../backend/src/services/adminService.js>) | ADMIN_PRICING_UPDATE → dbo.usp_Admin_Pricing_Update |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. PRICING_INVALID400, PRICING_NOT_FOUND404, PRICING_OVERLAP409. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section pricing → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E297](#evidence-e297), [E298](#evidence-e298), [E299](#evidence-e299), [E300](#evidence-e300), [E301](#evidence-e301), [E302](#evidence-e302), [E303](#evidence-e303), [E304](#evidence-e304), [E305](#evidence-e305), [E328](#evidence-e328), [E329](#evidence-e329), [E330](#evidence-e330), [E397](#evidence-e397), [E398](#evidence-e398), [E399](#evidence-e399), [E400](#evidence-e400), [E401](#evidence-e401), [E402](#evidence-e402), [E403](#evidence-e403), [E404](#evidence-e404), [E405](#evidence-e405), [E406](#evidence-e406)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R43 real browser update/hydration/NULLdate/overlap/retry; still missing create/list acrosscinemas and deniedgrant UI.. Gap: R71-FE-ADM-13.



**Test IDs / raw case identities:** `R6.9-admin-195`, `R6.9-admin-196`, `R6.9-admin-199`, `R6.9-admin-202`, `R6.9-admin-203`, `R6.9-admin-204`, `R4.3-01-seatType`, `R4.3-02-dayType`, `R4.3-03-format`, `hydrates all seven persisted fields`, `cinema immutable during edit`, `three official day choices`, `real full PUT succeeds with exact seven-field payload`, `reload hydrates saved date and dimensions`, `clearing end date sends explicit NULL`, `real overlap shows conflict without false success`, `rejected form remains editable`, `valid retry succeeds and reloads`, `persisted read after failure and retry`; records without a test ID: E297 `/operations/34`, E298 `/operations/35`, E299 `/operations/36` (artifact is linked in registry).

**R7.3 acceptance rationale:** Bảng giá toàn hệ: DB/BE PASS theo E297, E298, E299, E300, E301, E302, E303, E304, E305, E328, E329, E330, E397, E398, E399, E400, E401, E402, E403, E404, E405, E406; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/41`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-13 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/41`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-14"></a>

### ADM-14 — Suất chiếu toàn hệ

**Mục tiêu:** Tạo/sửa/hủy suất chiếu cho bất kỳ phòng chiếu/rạp nào, không bị ràng buộc theo phạm vi phân công.

**Luồng baseline:** 1. Admin chọn PhimID và PhongID (thuộc bất kỳ rạp nào), nhập thời gian, định dạng, giá vé cơ bản. → 2. Hệ thống kiểm tra không trùng thời gian với suất chiếu khác trong cùng phòng (BR01). → 3. Hệ thống tạo/cập nhật/hủy bản ghi SUATCHIEU tương ứng thao tác của Admin.

**Nguồn:** [Đặc tả dòng 503](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** Allsystem show list/create/update/cancel; no partialwrite/overlap, history preserved.

**Database:** [BOITHUONG_HUYSUAT](<../database/02_tables/boithuong_huysuat.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [HOSOKHACHHANG](<../database/02_tables/hosokhachhang.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHANCONG_RAP](<../database/02_tables/phancong_rap.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [usp_Admin_Showtime_Cancel](<../database/08_procedures/admin/usp_Admin_Showtime_Cancel.sql>), [usp_Admin_Showtime_Create](<../database/08_procedures/admin/usp_Admin_Showtime_Create.sql>), [usp_Admin_Showtime_List](<../database/08_procedures/admin/usp_Admin_Showtime_List.sql>), [usp_Admin_Showtime_Update](<../database/08_procedures/admin/usp_Admin_Showtime_Update.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_DonDangGiuGhe](<../database/05_functions/fn_DonDangGiuGhe.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuanLyRapScope](<../database/05_functions/fn_KiemTraQuanLyRapScope.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>), [fn_TinhBoiThuongVe](<../database/05_functions/fn_TinhBoiThuongVe.sql>), [sp_Order_ExpirePending](<../database/08_procedures/customer/sp_Order_ExpirePending.sql>), [sp_Showtime_CancelCascade](<../database/08_procedures/system/sp_Showtime_CancelCascade.sql>), [sp_Showtime_GetDetail](<../database/08_procedures/public/sp_Showtime_GetDetail.sql>), [sp_Showtime_ValidateTimes](<../database/08_procedures/system/sp_Showtime_ValidateTimes.sql>), [vw_LichChieuChiTiet](<../database/06_views/vw_LichChieuChiTiet.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Admin showtime wrappers wrappers → shared Manager showtime domain rules, Admin current grant; serialized overlaps/usedshow guards/cancel lifecycle.

**Authorization:** authenticate→requireAdmin→QL_SUAT_CHIEU; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/showtimes | [route:48](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SUAT_CHIEU) | [adminController.showtimes](<../backend/src/controllers/adminController.js>) | [adminService.showtimes](<../backend/src/services/adminService.js>) | ADMIN_SHOWTIME_LIST → dbo.usp_Admin_Showtime_List |
| POST /api/admin/showtimes | [route:49](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SUAT_CHIEU) | [adminController.createShowtime](<../backend/src/controllers/adminController.js>) | [adminService.createShowtime](<../backend/src/services/adminService.js>) | ADMIN_SHOWTIME_CREATE → dbo.usp_Admin_Showtime_Create |
| PUT /api/admin/showtimes/:showtimeId | [route:50](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SUAT_CHIEU) | [adminController.updateShowtime](<../backend/src/controllers/adminController.js>) | [adminService.updateShowtime](<../backend/src/services/adminService.js>) | ADMIN_SHOWTIME_UPDATE → dbo.usp_Admin_Showtime_Update |
| POST /api/admin/showtimes/:showtimeId/cancel | [route:51](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_SUAT_CHIEU) | [adminController.cancelShowtime](<../backend/src/controllers/adminController.js>) | [adminService.cancelShowtime](<../backend/src/services/adminService.js>) | ADMIN_SHOWTIME_CANCEL → dbo.usp_Admin_Showtime_Cancel |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section showtimes → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E306](#evidence-e306), [E307](#evidence-e307), [E308](#evidence-e308), [E309](#evidence-e309), [E310](#evidence-e310), [E311](#evidence-e311), [E312](#evidence-e312), [E313](#evidence-e313), [E314](#evidence-e314), [E315](#evidence-e315), [E316](#evidence-e316), [E317](#evidence-e317), [E358](#evidence-e358), [E359](#evidence-e359), [E360](#evidence-e360), [E361](#evidence-e361), [E362](#evidence-e362), [E363](#evidence-e363), [E364](#evidence-e364), [E365](#evidence-e365), [E366](#evidence-e366), [E101](#evidence-e101), [E372](#evidence-e372), [E413](#evidence-e413), [E414](#evidence-e414), [E415](#evidence-e415), [E416](#evidence-e416)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. R32 controlled edit; missing realSQL create/cancel/history/overlap and filter UI.. Gap: R71-FE-ADM-14.



**Test IDs / raw case identities:** `R6.9-admin-176`, `R6.9-admin-177`, `R6.9-admin-180`, `R6.9-admin-183`, `R6.9-admin-184`, `R6.9-admin-185`, `R6.9-admin-188`, `R6.9-admin-189`, `R6.4-r32-sql-cases-055`, `R6.4-r32-sql-cases-056`, `R6.4-r32-sql-cases-057`, `R6.4-r32-sql-cases-058`, `R6.4-r32-sql-cases-059`, `R6.4-r32-sql-cases-060`, `R6.4-r32-sql-cases-098`, `R6.4-r32-sql-cases-099`, `R6.4-r32-sql-cases-100`, `R6.7-r12-concurrency-scenarios-002`, `R6.7-r12-concurrency-scenarios-003`; records without a test ID: E306 `/operations/37`, E307 `/operations/38`, E308 `/operations/39`, E309 `/operations/40` (artifact is linked in registry).

**R7.3 acceptance rationale:** Suất chiếu toàn hệ: DB/BE PASS theo E306, E307, E308, E309, E310, E311, E312, E313, E314, E315, E316, E317, E358, E359, E360, E361, E362, E363, E364, E365, E366, E101, E372; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/42`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-14 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/42`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-15"></a>

### ADM-15 — Xử lý khiếu nại

**Mục tiêu:** Admin có quyền tiếp nhận và xử lý khiếu nại tương tự CSKH khi cần thiết.

**Luồng baseline:** 1. Admin xem danh sách/chi tiết khiếu nại (tương tự luồng CSKH-02, CSKH-03). → 2. Admin nhập nội dung xử lý; hệ thống tạo bản ghi trong XULY_KHIEUNAI (BR07: chỉ CSKH/Admin được ghi). → 3. Hệ thống cập nhật trạng thái KHIEUNAI đồng bộ theo kết quả xử lý.

**Nguồn:** [Đặc tả dòng 513](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.

**Kết quả mong đợi:** Admin queue/detail/reference/process/status complete, safe linked/unlinked and correct timeline.

**Database:** [BOITHUONG_HUYSUAT](<../database/02_tables/boithuong_huysuat.sql>), [CHITIETDOAN](<../database/02_tables/chitietdoan.sql>), [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [GHE](<../database/02_tables/ghe.sql>), [KHIEUNAI](<../database/02_tables/khieunai.sql>), [KHUYENMAI](<../database/02_tables/khuyenmai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SANPHAM](<../database/02_tables/sanpham.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>), [XULY_KHIEUNAI](<../database/02_tables/xuly_khieunai.sql>).

**Entry points:** [sp_Support_Complaint_AddProcessing](<../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql>), [sp_Support_Complaint_GetDetail](<../database/08_procedures/support/sp_Support_Complaint_GetDetail.sql>), [sp_Support_Complaint_GetOrderReference](<../database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql>), [sp_Support_Complaint_List](<../database/08_procedures/support/sp_Support_Complaint_List.sql>), [sp_Support_Complaint_UpdateStatus](<../database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [vw_ChiTietDonDatVe](<../database/06_views/vw_ChiTietDonDatVe.sql>), [vw_DanhSachKhieuNai](<../database/06_views/vw_DanhSachKhieuNai.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>), [TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai](<../database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql>), [TRG_XuLyKhieuNai_KiemTraVaiTro](<../database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql>).

**Constraints:** CHITIETDOAN: [PK_CHITIETDOAN](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [UQ_CHITIETDOAN_Don_SanPham](<../database/03_constraints/001_primary_unique.sql>); CHITIETDOAN: [FK_CHITIETDOAN_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [FK_CHITIETDOAN_SanPham](<../database/03_constraints/002_foreign_keys.sql>); CHITIETDOAN: [CK_CHITIETDOAN_DonGia](<../database/03_constraints/003_check_constraints.sql>); CHITIETDOAN: [CK_CHITIETDOAN_SoLuong](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** Admin uses SAME supportService/5SPs; QL_KHIEUNAI reads; AND write/ref grants; processingtrigger/history rollback; optionalorderNULL.

**Authorization:** authenticate→requireAdmin→QL_KHIEUNAI, TRA_CUU_DON, XULY_KHIEUNAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/complaints | [route:80](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHIEUNAI) | wrapSupport | [supportService.list](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_LIST → dbo.sp_Support_Complaint_List |
| GET /api/admin/complaints/:complaintId | [route:81](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHIEUNAI) | wrapSupport | [supportService.detail](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_GET_DETAIL → dbo.sp_Support_Complaint_GetDetail |
| GET /api/admin/complaints/:complaintId/order-reference | [route:82](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHIEUNAI,TRA_CUU_DON) | wrapSupport | [supportService.orderReference](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_GET_ORDER_REFERENCE → dbo.sp_Support_Complaint_GetOrderReference |
| POST /api/admin/complaints/:complaintId/processings | [route:83](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHIEUNAI,XULY_KHIEUNAI) | wrapSupport | [supportService.addProcessing](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_ADD_PROCESSING → dbo.sp_Support_Complaint_AddProcessing |
| PUT /api/admin/complaints/:complaintId/status | [route:84](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(QL_KHIEUNAI,XULY_KHIEUNAI) | wrapSupport | [supportService.updateStatus](<../backend/src/services/supportService.js>) | SUPPORT_COMPLAINT_UPDATE_STATUS → dbo.sp_Support_Complaint_UpdateStatus |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section complaints + ComplaintOrderReference → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes. Component ComplaintOrderReference.jsx; writeComplaint refresh load()+openComplaint(selected).

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [ComplaintOrderReference.jsx](<../frontend/src/components/ComplaintOrderReference.jsx>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E139](#evidence-e139), [E140](#evidence-e140), [E141](#evidence-e141), [E142](#evidence-e142), [E143](#evidence-e143), [E144](#evidence-e144), [E145](#evidence-e145), [E146](#evidence-e146), [E147](#evidence-e147), [E148](#evidence-e148), [E149](#evidence-e149), [E150](#evidence-e150), [E151](#evidence-e151), [E318](#evidence-e318), [E319](#evidence-e319), [E320](#evidence-e320), [E321](#evidence-e321), [E322](#evidence-e322)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Admin complaint select/process/status then queue+detail refresh, linked/unlinked reference/deniedgrant; source already calls load+openComplaint after writes.. Gap: R71-FE-ADM-15.



**Test IDs / raw case identities:** `R6.8-linked-05`, `R6.8-linked-15`, `R6.8-linked-21`, `R6.8-linked-22`, `R6.8-linked-23`, `R6.8-linked-24`, `R6.8-linked-29`, `R6.8-linked-30`, `R6.8-linked-31`, `R6.8-linked-39`, `R6.8-linked-40`, `identity-order-over-timestamp`, `trigger-after-parent-update-batch-failure`, `CSKH02-06-admin-consumer`, `CSKH02-06-admin-default`; records without a test ID: E318 `/operations/63`, E319 `/operations/64`, E320 `/operations/65`, E321 `/operations/66`, E322 `/operations/67` (artifact is linked in registry).

**R7.3 acceptance rationale:** Xử lý khiếu nại: DB/BE PASS theo E139, E140, E141, E142, E143, E144, E145, E146, E147, E148, E149, E150, E151, E318, E319, E320, E321, E322; shared Admin queue giữ default và hỗ trợ priority theo hai case mới; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/43`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source; shared queue consumer freshly exercised by R7.2 p2 Admin priority/default cases.


**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-15 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/43`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

<a id="uc-adm-16"></a>

### ADM-16 — Báo cáo toàn hệ

**Mục tiêu:** Tổng hợp doanh thu và số liệu vận hành của toàn bộ hệ thống, không giới hạn theo rạp.

**Luồng baseline:** 1. Admin chọn khoảng thời gian/tiêu chí báo cáo. → 2. Hệ thống tổng hợp dữ liệu từ toàn bộ RAPCHIEUPHIM → PHONGCHIEU → SUATCHIEU → DONDATVE → THANHTOAN thông qua các View/Function báo cáo (F12). → 3. Hệ thống hiển thị báo cáo doanh thu theo rạp, theo phim, theo thời gian cho Admin theo dõi.

**Nguồn:** [Đặc tả dòng 523](<../Phân Tích _ Thiết Kế.md>); [USE_CASE_BASELINE_45.md](<../docs/USE_CASE_BASELINE_45.md>).

**Tiền đề:** ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.

**Kết quả mong đợi:** System totals + cinema/movie/date breakdown reconcile, date/cinema filters/empty cases and grant403.

**Database:** [CHITIETVE](<../database/02_tables/chitietve.sql>), [DONDATVE](<../database/02_tables/dondatve.sql>), [KHIEUNAI](<../database/02_tables/khieunai.sql>), [NGUOIDUNG](<../database/02_tables/nguoidung.sql>), [PHIM](<../database/02_tables/phim.sql>), [PHONGCHIEU](<../database/02_tables/phongchieu.sql>), [QUYEN](<../database/02_tables/quyen.sql>), [RAPCHIEUPHIM](<../database/02_tables/rapchieuphim.sql>), [SUATCHIEU](<../database/02_tables/suatchieu.sql>), [THANHTOAN](<../database/02_tables/thanhtoan.sql>), [VAITRO](<../database/02_tables/vaitro.sql>), [VAITRO_QUYEN](<../database/02_tables/vaitro_quyen.sql>).

**Entry points:** [sp_Admin_Dashboard](<../database/08_procedures/admin/sp_Admin_Dashboard.sql>), [sp_Admin_Report_Revenue](<../database/08_procedures/admin/sp_Admin_Report_Revenue.sql>).

**Dependencies (đã đọc definition; gồm delegated SP/view/function):** [fn_BayGio](<../database/05_functions/fn_BayGio.sql>), [fn_GioRap](<../database/05_functions/fn_GioRap.sql>), [fn_HomNay](<../database/05_functions/fn_HomNay.sql>), [fn_KiemTraQuyenNguoiDung](<../database/05_functions/fn_KiemTraQuyenNguoiDung.sql>), [fn_NgayKinhDoanh](<../database/05_functions/fn_NgayKinhDoanh.sql>).

**Trigger liên quan:** [TRG_ChiTietVe_KiemTraGheDungPhong](<../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql>), [TRG_ChiTietVe_KiemTraTrungGhe](<../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql>), [TRG_SuatChieu_KiemTraTrungLich](<../database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql>).

**Constraints:** CHITIETVE: [PK_CHITIETVE](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [UQ_CHITIETVE_MaVe](<../database/03_constraints/001_primary_unique.sql>); CHITIETVE: [FK_CHITIETVE_DonDatVe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [FK_CHITIETVE_Ghe](<../database/03_constraints/002_foreign_keys.sql>); CHITIETVE: [CK_CHITIETVE_GiaVe](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [CK_CHITIETVE_TrangThai](<../database/03_constraints/003_check_constraints.sql>); CHITIETVE: [DF_CHITIETVE_TrangThai](<../database/03_constraints/004_defaults.sql>); DONDATVE: [PK_DONDATVE](<../database/03_constraints/001_primary_unique.sql>); DONDATVE: [FK_DONDATVE_KhuyenMai](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_NguoiDung](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [FK_DONDATVE_SuatChieu](<../database/03_constraints/002_foreign_keys.sql>); DONDATVE: [CK_DONDATVE_HanGiuCho](<../database/03_constraints/003_check_constraints.sql>); danh sách đầy đủ: [001_primary_unique.sql](<../database/03_constraints/001_primary_unique.sql>), [002_foreign_keys.sql](<../database/03_constraints/002_foreign_keys.sql>), [003_check_constraints.sql](<../database/03_constraints/003_check_constraints.sql>), [004_defaults.sql](<../database/03_constraints/004_defaults.sql>), [005_function_defaults.sql](<../database/03_constraints/005_function_defaults.sql>).

**Transaction & business rules:** sp_Admin_Dashboard + sp_Admin_Report_Revenue SQL-owned summaries and four revenue sets; only successfulpayment, snapshot totals/datebusiness filters.

**Authorization:** authenticate→requireAdmin→XEM_BAO_CAO_TOANHE; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID).

| Method + API | Route source | Middleware | Permission | Controller | Service | Typed whitelist → SP |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/admin/dashboard | [route:11](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(XEM_BAO_CAO_TOANHE) | [adminController.dashboard](<../backend/src/controllers/adminController.js>) | [adminService.dashboard](<../backend/src/services/adminService.js>) | ADMIN_DASHBOARD → dbo.sp_Admin_Dashboard |
| GET /api/admin/reports/revenue | [route:73](<../backend/src/routes/adminRoutes.js>) | authenticate → requireAdmin | AND(XEM_BAO_CAO_TOANHE) | [adminController.revenue](<../backend/src/controllers/adminController.js>) | [adminService.revenue](<../backend/src/services/adminService.js>) | ADMIN_REPORT_REVENUE → dbo.sp_Admin_Report_Revenue |

**Gateway/binding:** [procedureClient.js](<../backend/src/db/procedureClient.js>) → [procedures.js](<../backend/src/db/procedures.js>); procedure key whitelist, request.input typed values và output parameters; user identity được bind từ req.user, không query/body. INT IDs, NVARCHAR/VARCHAR text/CSV/JSON, BIT updateflag, DATE business dates, DateTime2 UTC, DECIMAL(18,2) tiền theo signature index bên dưới. Booking/register dùng output binding; chưa suy ra runtime từ signature riêng.

**HTTP error mapping:** Shared401 current account /403 role-or-permission /404 ownership or missing resource; validation400; business conflict409; unexpected500 sanitized. SQL 50300/50301/50302→401/403/403. Admin native547→INVALID_REFERENCE400 hoặc DELETE RECORD_IN_USE409; UQ2601/2627→DUPLICATE_RECORD409. Source [errorHandler.js](<../backend/src/middleware/errorHandler.js>) và module service error mapping trong bảng.

**Frontend implementation:** /admin → RequireRole(Admin)/AdminPortal section dashboard/revenue → api/adminApi.js (list helpers + create/update/remove hoặc specialized actions); utils/adminForms.js; load/error/empty, form pending/error, reload after writes.

**Guard/state:** App→AuthProvider/BrowserRouter/AppRoutes; RequireAuth/RequireRole initialize session trước redirect /login hoặc /forbidden. userCanAct dùng role/currentpermissions AND để hiển thị actions. Loading/error/empty mô tả ở trên là khảo sát source; không dùng để suy ra browser PASS. Source [index.jsx](<../frontend/src/routes/index.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [authorization.js](<../frontend/src/utils/authorization.js>), [httpClient.js](<../frontend/src/api/httpClient.js>).

**FE source cụ thể:** [adminApi.js](<../frontend/src/api/adminApi.js>), [AdminPortal.jsx](<../frontend/src/pages/AdminPortal.jsx>), [RequireRole.jsx](<../frontend/src/routes/RequireRole.jsx>), [adminForms.js](<../frontend/src/utils/adminForms.js>). Auth/session shared [AuthContext.jsx](<../frontend/src/context/AuthContext.jsx>); [authSession.js](<../frontend/src/services/authSession.js>).

| Database runtime | SP gateway runtime | Backend runtime | Authorization | Integration luồng chính | Frontend implementation/runtime | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| PASS | PASS | PASS | PASS | PASS | PASS | PASS |

**Evidence đúng phạm vi:** [E323](#evidence-e323), [E324](#evidence-e324), [E325](#evidence-e325), [E326](#evidence-e326), [E331](#evidence-e331), [E332](#evidence-e332), [E333](#evidence-e333), [E334](#evidence-e334), [E335](#evidence-e335), [E336](#evidence-e336), [E337](#evidence-e337), [E338](#evidence-e338), [E339](#evidence-e339), [E340](#evidence-e340), [E341](#evidence-e341), [E342](#evidence-e342), [E343](#evidence-e343), [E344](#evidence-e344), [E345](#evidence-e345), [E346](#evidence-e346), [E347](#evidence-e347), [E348](#evidence-e348), [E349](#evidence-e349), [E350](#evidence-e350), [E351](#evidence-e351), [E352](#evidence-e352)

**Lý do PARTIAL lịch sử R7.3 (superseded bởi đánh giá R8.3 dưới đây):** FE source/action/guard đã mapped; browser hiện có chỉ chứng minh nhánh giới hạn hoặc NONE. Dashboard/revenue form, four numerical breakdowns, filters/empty/error, deniedgrant; no existing realreport browser.. Gap: R71-FE-ADM-16.


**Test IDs / raw case identities:** `R6.9-admin-236`, `R6.9-admin-239`, `R4.2-01-empty-period`, `R4.2-02-single-cinema`, `R4.2-04-single-movie`, `R4.2-10-failed-pending-success-attempts-one-order`, `R4.2-11-two-tickets-two-food-lines-discount-no-fanout`, `R4.2-03-multiple-cinemas`, `R4.2-05-multiple-movies`, `R4.2-06-multi-day`, `R4.2-07-day-start-and-final-datetime2-tick`, `R4.2-07-previous-day-boundary`, `R4.2-07-next-day-boundary`, `cinema-filter-preserves-legacy-parameters`, `open-start-bound`, `open-end-bound`, `nonexistent-cinema-zero-summary-empty-breakdowns`, `R4.2-08-failed-and-unpaid-orders-excluded`, `expired-orders-excluded`, `R4.2-09-canceled-paid-orders-retain-success-receipts-compensation-not-refund`, `legacy-null-payment-time-falls-back-to-created-time`, `schema-supported-refunded-attempt-excluded`, `R4.2-12-catalog-pricing-promotion-changes-preserve-snapshots`, `repeat-identical-state-identical-report`; records without a test ID: E323 `/operations/0`, E324 `/operations/62` (artifact is linked in registry).

**R7.3 acceptance rationale:** Báo cáo toàn hệ: DB/BE PASS theo E323, E324, E325, E326, E331, E332, E333, E334, E335, E336, E337, E338, E339, E340, E341, E342, E343, E344, E345, E346, E347, E348, E349, E350, E351, E352; source/typed gateway và scope được đối chiếu; không có material DB/BE gap còn mở. FE/Overall PARTIAL; DEFER_TO_R8. [Per-UC audit](evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json), JSON Pointer `/UCs/44`. Freshness: R6/R7.1 evidence reused for unchanged module definitions and unchanged source paths; R7.2 192-test seal matches current source.



**R8.3 current Frontend/Overall: PASS.** Accepted primary and supplemental selectors independently verified; no material defect found within audited scope [ADM-16 browser/HTTP/SP/SQL/auth audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json), JSON Pointer `/UCs/44`. Evidence chính là actual AppRoutes + real SQL; controlled/component/unit phân biệt rõ. Gap kế thừa (nếu có) RESOLVED được nghiệm thu.

## Canonical object/signature index

Read definition từ manifest includes, loại bỏ comments để trace dependency; không chỉ kiểm tên file. Entry signature below dùng SQL parameter thật. SAVE/BEGIN TRAN markers là ownership evidence static; delegated SP/trigger vẫn phải đọc phần dependency và suite rollback. Single-statement write không bị ép thêm transaction; SELECT-only là rule của từng UC, không suy từ absence BEGIN TRAN.

| Entry point | Canonical definition | Actual parameter/type contract | BEGIN TRAN / SAVE TRAN |
| --- | --- | --- | --- |
| sp_Admin_Actor_Create | [sp_Admin_Actor_Create.sql](<../database/08_procedures/admin/sp_Admin_Actor_Create.sql>) | @ActorID INT; @HoTen NVARCHAR(150); @NgaySinh DATE; @QuocTich NVARCHAR(100) | False / False |
| sp_Admin_Actor_Delete | [sp_Admin_Actor_Delete.sql](<../database/08_procedures/admin/sp_Admin_Actor_Delete.sql>) | @ActorID INT; @DienVienID INT | True / True |
| sp_Admin_Actor_List | [sp_Admin_Actor_List.sql](<../database/08_procedures/admin/sp_Admin_Actor_List.sql>) | @ActorID INT | False / False |
| sp_Admin_Actor_Update | [sp_Admin_Actor_Update.sql](<../database/08_procedures/admin/sp_Admin_Actor_Update.sql>) | @ActorID INT; @DienVienID INT; @HoTen NVARCHAR(150); @NgaySinh DATE; @QuocTich NVARCHAR(100) | False / False |
| sp_Admin_Assignment_Create | [sp_Admin_Assignment_Create.sql](<../database/08_procedures/admin/sp_Admin_Assignment_Create.sql>) | @ActorID INT; @NguoiDungID INT; @RapID INT; @NgayBatDau DATE; @NgayKetThuc DATE | True / True |
| sp_Admin_Assignment_List | [sp_Admin_Assignment_List.sql](<../database/08_procedures/admin/sp_Admin_Assignment_List.sql>) | @ActorID INT; @RapID INT; @NguoiDungID INT | False / False |
| sp_Admin_Cinema_Create | [sp_Admin_Cinema_Create.sql](<../database/08_procedures/admin/sp_Admin_Cinema_Create.sql>) | @ActorID INT; @TenRap NVARCHAR(150); @DiaChi NVARCHAR(255); @ThanhPho NVARCHAR(100); @SoDienThoai VARCHAR(20); @MoTa NVARCHAR(500); @NgayHoatDong DATE | False / False |
| sp_Admin_Cinema_Delete | [sp_Admin_Cinema_Delete.sql](<../database/08_procedures/admin/sp_Admin_Cinema_Delete.sql>) | @ActorID INT; @RapID INT | False / False |
| sp_Admin_Cinema_Update | [sp_Admin_Cinema_Update.sql](<../database/08_procedures/admin/sp_Admin_Cinema_Update.sql>) | @ActorID INT; @RapID INT; @TenRap NVARCHAR(150); @DiaChi NVARCHAR(255); @ThanhPho NVARCHAR(100); @SoDienThoai VARCHAR(20); @MoTa NVARCHAR(500); @TrangThai NVARCHAR(50) | False / False |
| sp_Admin_Dashboard | [sp_Admin_Dashboard.sql](<../database/08_procedures/admin/sp_Admin_Dashboard.sql>) | @ActorID INT | False / False |
| sp_Admin_Genre_Create | [sp_Admin_Genre_Create.sql](<../database/08_procedures/admin/sp_Admin_Genre_Create.sql>) | @ActorID INT; @TenTheLoai NVARCHAR(100) | False / False |
| sp_Admin_Genre_Delete | [sp_Admin_Genre_Delete.sql](<../database/08_procedures/admin/sp_Admin_Genre_Delete.sql>) | @ActorID INT; @TheLoaiID INT | False / False |
| sp_Admin_Genre_List | [sp_Admin_Genre_List.sql](<../database/08_procedures/admin/sp_Admin_Genre_List.sql>) | @ActorID INT | False / False |
| sp_Admin_Genre_Update | [sp_Admin_Genre_Update.sql](<../database/08_procedures/admin/sp_Admin_Genre_Update.sql>) | @ActorID INT; @TheLoaiID INT; @TenTheLoai NVARCHAR(100) | False / False |
| sp_Admin_MovieActor_Set | [sp_Admin_MovieActor_Set.sql](<../database/08_procedures/admin/sp_Admin_MovieActor_Set.sql>) | @ActorID INT; @PhimID INT; @DanhSachJson NVARCHAR(MAX) | True / True |
| sp_Admin_Movie_Create | [sp_Admin_Movie_Create.sql](<../database/08_procedures/admin/sp_Admin_Movie_Create.sql>) | @ActorID INT; @TenPhim NVARCHAR(255); @ThoiLuong INT; @NgayKhoiChieu DATE; @NgayKetThuc DATE; @NgonNgu NVARCHAR(100); @PhuDe NVARCHAR(100); @DoTuoi NVARCHAR(20); @DaoDien NVARCHAR(150); @MoTa NVARCHAR(MAX); @PosterURL NVARCHAR(500); @TrailerURL NVARCHAR(500); @TheLoaiIdList VARCHAR(MAX); @NewPhimID INT | True / False |
| sp_Admin_Movie_Delete | [sp_Admin_Movie_Delete.sql](<../database/08_procedures/admin/sp_Admin_Movie_Delete.sql>) | @ActorID INT; @PhimID INT | False / False |
| sp_Admin_Movie_Update | [sp_Admin_Movie_Update.sql](<../database/08_procedures/admin/sp_Admin_Movie_Update.sql>) | @ActorID INT; @PhimID INT; @TenPhim NVARCHAR(255); @ThoiLuong INT; @NgayKhoiChieu DATE; @NgayKetThuc DATE; @NgonNgu NVARCHAR(100); @PhuDe NVARCHAR(100); @DoTuoi NVARCHAR(20); @DaoDien NVARCHAR(150); @MoTa NVARCHAR(MAX); @PosterURL NVARCHAR(500); @TrailerURL NVARCHAR(500); @TrangThai NVARCHAR(50); @TheLoaiIdList VARCHAR(MAX) | True / False |
| sp_Admin_Permission_Create | [sp_Admin_Permission_Create.sql](<../database/08_procedures/admin/sp_Admin_Permission_Create.sql>) | @ActorID INT; @MaQuyen VARCHAR(50); @TenQuyen NVARCHAR(100); @MoTa NVARCHAR(255) | False / False |
| sp_Admin_Permission_Delete | [sp_Admin_Permission_Delete.sql](<../database/08_procedures/admin/sp_Admin_Permission_Delete.sql>) | @ActorID INT; @QuyenID INT | False / False |
| sp_Admin_Permission_List | [sp_Admin_Permission_List.sql](<../database/08_procedures/admin/sp_Admin_Permission_List.sql>) | @ActorID INT | False / False |
| sp_Admin_Permission_Update | [sp_Admin_Permission_Update.sql](<../database/08_procedures/admin/sp_Admin_Permission_Update.sql>) | @ActorID INT; @QuyenID INT; @TenQuyen NVARCHAR(100); @MoTa NVARCHAR(255) | False / False |
| sp_Admin_Product_Create | [sp_Admin_Product_Create.sql](<../database/08_procedures/admin/sp_Admin_Product_Create.sql>) | @ActorID INT; @TenSanPham NVARCHAR(150); @LoaiSanPham NVARCHAR(50); @Gia DECIMAL(18,2); @MoTa NVARCHAR(255); @HinhAnh NVARCHAR(500) | False / False |
| sp_Admin_Product_Delete | [sp_Admin_Product_Delete.sql](<../database/08_procedures/admin/sp_Admin_Product_Delete.sql>) | @ActorID INT; @SanPhamID INT | False / False |
| sp_Admin_Product_Update | [sp_Admin_Product_Update.sql](<../database/08_procedures/admin/sp_Admin_Product_Update.sql>) | @ActorID INT; @SanPhamID INT; @TenSanPham NVARCHAR(150); @LoaiSanPham NVARCHAR(50); @Gia DECIMAL(18,2); @MoTa NVARCHAR(255); @HinhAnh NVARCHAR(500); @TrangThai NVARCHAR(50) | False / False |
| sp_Admin_Promotion_Create | [sp_Admin_Promotion_Create.sql](<../database/08_procedures/admin/sp_Admin_Promotion_Create.sql>) | @ActorID INT; @MaCode VARCHAR(50); @MoTa NVARCHAR(255); @LoaiGiamGia NVARCHAR(20); @GiaTriGiam DECIMAL(18,2); @DonHangToiThieu DECIMAL(18,2); @GiamToiDa DECIMAL(18,2); @NgayBatDau DATETIME2; @NgayKetThuc DATETIME2; @SoLuong INT | False / False |
| sp_Admin_Promotion_Delete | [sp_Admin_Promotion_Delete.sql](<../database/08_procedures/admin/sp_Admin_Promotion_Delete.sql>) | @ActorID INT; @KhuyenMaiID INT | True / True |
| sp_Admin_Promotion_List | [sp_Admin_Promotion_List.sql](<../database/08_procedures/admin/sp_Admin_Promotion_List.sql>) | @ActorID INT | False / False |
| sp_Admin_Promotion_Update | [sp_Admin_Promotion_Update.sql](<../database/08_procedures/admin/sp_Admin_Promotion_Update.sql>) | @ActorID INT; @KhuyenMaiID INT; @MoTa NVARCHAR(255); @LoaiGiamGia NVARCHAR(20); @GiaTriGiam DECIMAL(18,2); @DonHangToiThieu DECIMAL(18,2); @GiamToiDa DECIMAL(18,2); @NgayBatDau DATETIME2; @NgayKetThuc DATETIME2; @SoLuong INT; @TrangThai NVARCHAR(50) | False / False |
| sp_Admin_Report_Revenue | [sp_Admin_Report_Revenue.sql](<../database/08_procedures/admin/sp_Admin_Report_Revenue.sql>) | @ActorID INT; @TuNgay DATE; @DenNgay DATE; @RapID INT | False / False |
| sp_Admin_RolePermission_Set | [sp_Admin_RolePermission_Set.sql](<../database/08_procedures/admin/sp_Admin_RolePermission_Set.sql>) | @ActorID INT; @VaiTroID INT; @QuyenIdList VARCHAR(MAX) | True / False |
| sp_Admin_Role_Create | [sp_Admin_Role_Create.sql](<../database/08_procedures/admin/sp_Admin_Role_Create.sql>) | @ActorID INT; @MaVaiTro VARCHAR(50); @TenVaiTro NVARCHAR(100); @MoTa NVARCHAR(255) | False / False |
| sp_Admin_Role_Delete | [sp_Admin_Role_Delete.sql](<../database/08_procedures/admin/sp_Admin_Role_Delete.sql>) | @ActorID INT; @VaiTroID INT | False / False |
| sp_Admin_Role_List | [sp_Admin_Role_List.sql](<../database/08_procedures/admin/sp_Admin_Role_List.sql>) | @ActorID INT | False / False |
| sp_Admin_Role_Update | [sp_Admin_Role_Update.sql](<../database/08_procedures/admin/sp_Admin_Role_Update.sql>) | @ActorID INT; @VaiTroID INT; @TenVaiTro NVARCHAR(100); @MoTa NVARCHAR(255) | False / False |
| sp_Admin_User_Create | [sp_Admin_User_Create.sql](<../database/08_procedures/admin/sp_Admin_User_Create.sql>) | @ActorID INT; @HoTen NVARCHAR(100); @Email VARCHAR(150); @MatKhauHash VARCHAR(255); @SoDienThoai VARCHAR(20); @VaiTroID INT | True / True |
| sp_Admin_User_List | [sp_Admin_User_List.sql](<../database/08_procedures/admin/sp_Admin_User_List.sql>) | @ActorID INT; @VaiTroID INT; @TrangThai NVARCHAR(50); @SearchTerm NVARCHAR(100) | False / False |
| sp_Admin_User_UpdateStatus | [sp_Admin_User_UpdateStatus.sql](<../database/08_procedures/admin/sp_Admin_User_UpdateStatus.sql>) | @ActorID INT; @NguoiDungID INT; @TrangThai NVARCHAR(50) | False / False |
| sp_Auth_Login | [sp_Auth_Login.sql](<../database/08_procedures/auth/sp_Auth_Login.sql>) | @Email VARCHAR(150) | False / False |
| sp_Auth_RegisterCustomer | [sp_Auth_RegisterCustomer.sql](<../database/08_procedures/auth/sp_Auth_RegisterCustomer.sql>) | @HoTen NVARCHAR(100); @Email VARCHAR(150); @MatKhauHash VARCHAR(255); @SoDienThoai VARCHAR(20); @NgaySinh DATE; @GioiTinh NVARCHAR(10); @NewUserId INT | True / True |
| sp_Booking_Create | [sp_Booking_Create.sql](<../database/08_procedures/booking/sp_Booking_Create.sql>) | @NguoiDungID INT; @SuatChieuID INT; @MaKhuyenMai VARCHAR(50); @DanhSachGheId VARCHAR(MAX); @DanhSachDoAnJson NVARCHAR(MAX); @NewDonDatVeID INT | True / True |
| sp_Cinema_List | [sp_Cinema_List.sql](<../database/08_procedures/public/sp_Cinema_List.sql>) | @ThanhPho NVARCHAR(100) | False / False |
| sp_Complaint_Create | [sp_Complaint_Create.sql](<../database/08_procedures/customer/sp_Complaint_Create.sql>) | @NguoiDungID INT; @DonDatVeID INT; @LoaiKhieuNai NVARCHAR(100); @TieuDe NVARCHAR(200); @NoiDung NVARCHAR(MAX); @MucDoUuTien NVARCHAR(50) | False / False |
| sp_Complaint_GetByCustomer | [sp_Complaint_GetByCustomer.sql](<../database/08_procedures/customer/sp_Complaint_GetByCustomer.sql>) | @NguoiDungID INT; @KhieuNaiID INT | False / False |
| sp_Complaint_ListByCustomer | [sp_Complaint_ListByCustomer.sql](<../database/08_procedures/customer/sp_Complaint_ListByCustomer.sql>) | @NguoiDungID INT | False / False |
| sp_Genre_List | [sp_Genre_List.sql](<../database/08_procedures/public/sp_Genre_List.sql>) |  | False / False |
| sp_Manager_Dashboard | [sp_Manager_Dashboard.sql](<../database/08_procedures/manager/sp_Manager_Dashboard.sql>) | @NguoiDungID INT; @RapID INT | False / False |
| sp_Manager_ListAssignedCinemas | [sp_Manager_ListAssignedCinemas.sql](<../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql>) | @NguoiDungID INT | False / False |
| sp_Manager_Pricing_Create | [sp_Manager_Pricing_Create.sql](<../database/08_procedures/manager/sp_Manager_Pricing_Create.sql>) | @NguoiDungID INT; @RapID INT; @LoaiGhe NVARCHAR(50); @LoaiNgay NVARCHAR(50); @DinhDang NVARCHAR(50); @PhuThu DECIMAL(18,2); @NgayBatDau DATE; @NgayKetThuc DATE | False / False |
| sp_Manager_Pricing_List | [sp_Manager_Pricing_List.sql](<../database/08_procedures/manager/sp_Manager_Pricing_List.sql>) | @NguoiDungID INT; @RapID INT | False / False |
| sp_Manager_Pricing_Update | [sp_Manager_Pricing_Update.sql](<../database/08_procedures/manager/sp_Manager_Pricing_Update.sql>) | @NguoiDungID INT; @GiaID INT; @PhuThu DECIMAL(18,2); @TrangThai NVARCHAR(50); @LoaiGhe NVARCHAR(50); @LoaiNgay NVARCHAR(50); @DinhDang NVARCHAR(50); @NgayBatDau DATE; @NgayKetThuc DATE; @CapNhatDieuKien BIT | True / True |
| sp_Manager_Revenue | [sp_Manager_Revenue.sql](<../database/08_procedures/manager/sp_Manager_Revenue.sql>) | @NguoiDungID INT; @RapID INT; @TuNgay DATE; @DenNgay DATE | False / False |
| sp_Manager_Room_Create | [sp_Manager_Room_Create.sql](<../database/08_procedures/manager/sp_Manager_Room_Create.sql>) | @NguoiDungID INT; @RapID INT; @TenPhong NVARCHAR(100); @LoaiPhong NVARCHAR(50) | False / False |
| sp_Manager_Room_Delete | [sp_Manager_Room_Delete.sql](<../database/08_procedures/manager/sp_Manager_Room_Delete.sql>) | @NguoiDungID INT; @PhongID INT | True / False |
| sp_Manager_Room_List | [sp_Manager_Room_List.sql](<../database/08_procedures/manager/sp_Manager_Room_List.sql>) | @NguoiDungID INT; @RapID INT | False / False |
| sp_Manager_Room_Update | [sp_Manager_Room_Update.sql](<../database/08_procedures/manager/sp_Manager_Room_Update.sql>) | @NguoiDungID INT; @PhongID INT; @TenPhong NVARCHAR(100); @LoaiPhong NVARCHAR(50); @TrangThai NVARCHAR(50) | False / False |
| sp_Manager_Seat_Create | [sp_Manager_Seat_Create.sql](<../database/08_procedures/manager/sp_Manager_Seat_Create.sql>) | @NguoiDungID INT; @PhongID INT; @HangGhe VARCHAR(10); @SoGhe INT; @LoaiGhe NVARCHAR(50) | False / False |
| sp_Manager_Seat_Delete | [sp_Manager_Seat_Delete.sql](<../database/08_procedures/manager/sp_Manager_Seat_Delete.sql>) | @NguoiDungID INT; @GheID INT | False / False |
| sp_Manager_Seat_ListByRoom | [sp_Manager_Seat_ListByRoom.sql](<../database/08_procedures/manager/sp_Manager_Seat_ListByRoom.sql>) | @NguoiDungID INT; @PhongID INT | False / False |
| sp_Manager_Seat_Update | [sp_Manager_Seat_Update.sql](<../database/08_procedures/manager/sp_Manager_Seat_Update.sql>) | @NguoiDungID INT; @GheID INT; @LoaiGhe NVARCHAR(50); @TrangThai NVARCHAR(50) | True / True |
| sp_Manager_Showtime_Cancel | [sp_Manager_Showtime_Cancel.sql](<../database/08_procedures/manager/sp_Manager_Showtime_Cancel.sql>) | @NguoiDungID INT; @SuatChieuID INT; @LyDo NVARCHAR(255) | False / False |
| sp_Manager_Showtime_Create | [sp_Manager_Showtime_Create.sql](<../database/08_procedures/manager/sp_Manager_Showtime_Create.sql>) | @NguoiDungID INT; @PhimID INT; @PhongID INT; @ThoiGianBatDau DATETIME2; @ThoiGianKetThuc DATETIME2; @DinhDang NVARCHAR(50); @GiaVeCoBan DECIMAL(18,2) | True / True |
| sp_Manager_Showtime_List | [sp_Manager_Showtime_List.sql](<../database/08_procedures/manager/sp_Manager_Showtime_List.sql>) | @NguoiDungID INT; @RapID INT; @TuNgay DATE; @DenNgay DATE | False / False |
| sp_Manager_Showtime_Update | [sp_Manager_Showtime_Update.sql](<../database/08_procedures/manager/sp_Manager_Showtime_Update.sql>) | @NguoiDungID INT; @SuatChieuID INT; @PhimID INT; @ThoiGianBatDau DATETIME2; @ThoiGianKetThuc DATETIME2; @DinhDang NVARCHAR(50); @GiaVeCoBan DECIMAL(18,2); @TrangThai NVARCHAR(50) | True / True |
| sp_Movie_GetDetail | [sp_Movie_GetDetail.sql](<../database/08_procedures/public/sp_Movie_GetDetail.sql>) | @PhimID INT | False / False |
| sp_Movie_List | [sp_Movie_List.sql](<../database/08_procedures/public/sp_Movie_List.sql>) | @TrangThai NVARCHAR(50); @TheLoaiID INT; @SearchTerm NVARCHAR(100) | False / False |
| sp_Order_GetDetailByCustomer | [sp_Order_GetDetailByCustomer.sql](<../database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql>) | @NguoiDungID INT; @DonDatVeID INT | False / False |
| sp_Order_ListByCustomer | [sp_Order_ListByCustomer.sql](<../database/08_procedures/customer/sp_Order_ListByCustomer.sql>) | @NguoiDungID INT | False / False |
| sp_Payment_CreateAttempt | [sp_Payment_CreateAttempt.sql](<../database/08_procedures/payment/sp_Payment_CreateAttempt.sql>) | @NguoiDungID INT; @DonDatVeID INT; @PhuongThuc NVARCHAR(50); @ThanhToanID INT; @MaGiaoDich VARCHAR(100) | True / True |
| sp_Payment_UpdateResult | [sp_Payment_UpdateResult.sql](<../database/08_procedures/payment/sp_Payment_UpdateResult.sql>) | @NguoiDungID INT; @ThanhToanID INT; @TrangThaiThanhToan NVARCHAR(50); @MaGiaoDichNgoai VARCHAR(100); @GhiChu NVARCHAR(255) | True / True |
| sp_Product_ListActive | [sp_Product_ListActive.sql](<../database/08_procedures/public/sp_Product_ListActive.sql>) |  | False / False |
| sp_Promotion_Validate | [sp_Promotion_Validate.sql](<../database/08_procedures/public/sp_Promotion_Validate.sql>) | @NguoiDungID INT; @MaCode VARCHAR(50); @TongTienDon DECIMAL(18,2); @KhuyenMaiID INT; @LoaiGiamGia NVARCHAR(20); @GiaTriGiam DECIMAL(18,2); @TienGiam DECIMAL(18,2); @IsValid BIT; @Message NVARCHAR(255) | False / False |
| sp_RBAC_GetPermissionsByUser | [sp_RBAC_GetPermissionsByUser.sql](<../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql>) | @NguoiDungID INT | False / False |
| sp_Review_Create | [sp_Review_Create.sql](<../database/08_procedures/customer/sp_Review_Create.sql>) | @NguoiDungID INT; @PhimID INT; @SoSao INT; @NoiDung NVARCHAR(1000) | False / False |
| sp_Review_ListByMovie | [sp_Review_ListByMovie.sql](<../database/08_procedures/customer/sp_Review_ListByMovie.sql>) | @PhimID INT | False / False |
| sp_Seat_ListByShowtime | [sp_Seat_ListByShowtime.sql](<../database/08_procedures/public/sp_Seat_ListByShowtime.sql>) | @SuatChieuID INT | False / False |
| sp_Showtime_GetDetail | [sp_Showtime_GetDetail.sql](<../database/08_procedures/public/sp_Showtime_GetDetail.sql>) | @SuatChieuID INT | False / False |
| sp_Showtime_ListByMovie | [sp_Showtime_ListByMovie.sql](<../database/08_procedures/public/sp_Showtime_ListByMovie.sql>) | @PhimID INT; @RapID INT; @NgayChieu DATE | False / False |
| sp_Support_Complaint_AddProcessing | [sp_Support_Complaint_AddProcessing.sql](<../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql>) | @NguoiDungID INT; @KhieuNaiID INT; @NoiDungXuLy NVARCHAR(MAX); @TrangThaiSauXuLy NVARCHAR(50) | True / False |
| sp_Support_Complaint_GetDetail | [sp_Support_Complaint_GetDetail.sql](<../database/08_procedures/support/sp_Support_Complaint_GetDetail.sql>) | @NguoiDungID INT; @KhieuNaiID INT | False / False |
| sp_Support_Complaint_GetOrderReference | [sp_Support_Complaint_GetOrderReference.sql](<../database/08_procedures/support/sp_Support_Complaint_GetOrderReference.sql>) | @NguoiDungID INT; @KhieuNaiID INT | False / False |
| sp_Support_Complaint_List | [sp_Support_Complaint_List.sql](<../database/08_procedures/support/sp_Support_Complaint_List.sql>) | @NguoiDungID INT; @TrangThai NVARCHAR(50); @LoaiKhieuNai NVARCHAR(100); @SearchTerm NVARCHAR(100); @MucDoUuTien NVARCHAR(50) optional NULL | False / False |
| sp_Support_Complaint_UpdateStatus | [sp_Support_Complaint_UpdateStatus.sql](<../database/08_procedures/support/sp_Support_Complaint_UpdateStatus.sql>) | @NguoiDungID INT; @KhieuNaiID INT; @TrangThaiMoi NVARCHAR(50) | True / False |
| sp_User_GetCurrent | [sp_User_GetCurrent.sql](<../database/08_procedures/auth/sp_User_GetCurrent.sql>) | @NguoiDungID INT | False / False |
| sp_User_UpdateProfile | [sp_User_UpdateProfile.sql](<../database/08_procedures/auth/sp_User_UpdateProfile.sql>) | @NguoiDungID INT; @HoTen NVARCHAR(100); @SoDienThoai VARCHAR(20); @NgaySinh DATE; @GioiTinh NVARCHAR(10) | True / True |
| usp_Admin_Assignment_Update | [usp_Admin_Assignment_Update.sql](<../database/08_procedures/admin/usp_Admin_Assignment_Update.sql>) | @ActorID INT; @PhanCongID INT; @NguoiDungID INT; @RapID INT; @NgayBatDau DATE; @NgayKetThuc DATE; @TrangThai NVARCHAR(50) | True / True |
| usp_Admin_CinemaImage_Create | [usp_Admin_CinemaImage_Create.sql](<../database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql>) | @ActorID INT; @RapID INT; @URL NVARCHAR(500); @MoTa NVARCHAR(255); @LaAnhDaiDien BIT; @ThuTuHienThi INT; @TrangThai NVARCHAR(50) | True / True |
| usp_Admin_CinemaImage_Delete | [usp_Admin_CinemaImage_Delete.sql](<../database/08_procedures/admin/usp_Admin_CinemaImage_Delete.sql>) | @ActorID INT; @RapID INT; @HinhAnhRapID INT | False / False |
| usp_Admin_CinemaImage_List | [usp_Admin_CinemaImage_List.sql](<../database/08_procedures/admin/usp_Admin_CinemaImage_List.sql>) | @ActorID INT; @RapID INT | False / False |
| usp_Admin_CinemaImage_SetCover | [usp_Admin_CinemaImage_SetCover.sql](<../database/08_procedures/admin/usp_Admin_CinemaImage_SetCover.sql>) | @ActorID INT; @RapID INT; @HinhAnhRapID INT | True / True |
| usp_Admin_CinemaImage_Update | [usp_Admin_CinemaImage_Update.sql](<../database/08_procedures/admin/usp_Admin_CinemaImage_Update.sql>) | @ActorID INT; @RapID INT; @HinhAnhRapID INT; @URL NVARCHAR(500); @MoTa NVARCHAR(255); @ThuTuHienThi INT; @TrangThai NVARCHAR(50) | True / True |
| usp_Admin_Cinema_List | [usp_Admin_Cinema_List.sql](<../database/08_procedures/admin/usp_Admin_Cinema_List.sql>) | @ActorID INT | False / False |
| usp_Admin_Movie_List | [usp_Admin_Movie_List.sql](<../database/08_procedures/admin/usp_Admin_Movie_List.sql>) | @ActorID INT; @TrangThai NVARCHAR(50); @TheLoaiID INT; @SearchTerm NVARCHAR(100) | False / False |
| usp_Admin_Pricing_Create | [usp_Admin_Pricing_Create.sql](<../database/08_procedures/admin/usp_Admin_Pricing_Create.sql>) | @ActorID INT; @RapID INT; @LoaiGhe NVARCHAR(50); @LoaiNgay NVARCHAR(50); @DinhDang NVARCHAR(50); @PhuThu DECIMAL(18,2); @NgayBatDau DATE; @NgayKetThuc DATE | False / False |
| usp_Admin_Pricing_List | [usp_Admin_Pricing_List.sql](<../database/08_procedures/admin/usp_Admin_Pricing_List.sql>) | @ActorID INT; @RapID INT | False / False |
| usp_Admin_Pricing_Update | [usp_Admin_Pricing_Update.sql](<../database/08_procedures/admin/usp_Admin_Pricing_Update.sql>) | @ActorID INT; @GiaID INT; @PhuThu DECIMAL(18,2); @TrangThai NVARCHAR(50); @LoaiGhe NVARCHAR(50); @LoaiNgay NVARCHAR(50); @DinhDang NVARCHAR(50); @NgayBatDau DATE; @NgayKetThuc DATE; @CapNhatDieuKien BIT | True / True |
| usp_Admin_Product_List | [usp_Admin_Product_List.sql](<../database/08_procedures/admin/usp_Admin_Product_List.sql>) | @ActorID INT | False / False |
| usp_Admin_RolePermission_List | [usp_Admin_RolePermission_List.sql](<../database/08_procedures/admin/usp_Admin_RolePermission_List.sql>) | @ActorID INT; @VaiTroID INT | False / False |
| usp_Admin_Room_Create | [usp_Admin_Room_Create.sql](<../database/08_procedures/admin/usp_Admin_Room_Create.sql>) | @ActorID INT; @RapID INT; @TenPhong NVARCHAR(100); @LoaiPhong NVARCHAR(50) | False / False |
| usp_Admin_Room_Delete | [usp_Admin_Room_Delete.sql](<../database/08_procedures/admin/usp_Admin_Room_Delete.sql>) | @ActorID INT; @PhongID INT | True / False |
| usp_Admin_Room_List | [usp_Admin_Room_List.sql](<../database/08_procedures/admin/usp_Admin_Room_List.sql>) | @ActorID INT; @RapID INT | False / False |
| usp_Admin_Room_Update | [usp_Admin_Room_Update.sql](<../database/08_procedures/admin/usp_Admin_Room_Update.sql>) | @ActorID INT; @PhongID INT; @TenPhong NVARCHAR(100); @LoaiPhong NVARCHAR(50); @TrangThai NVARCHAR(50) | False / False |
| usp_Admin_Seat_Create | [usp_Admin_Seat_Create.sql](<../database/08_procedures/admin/usp_Admin_Seat_Create.sql>) | @ActorID INT; @PhongID INT; @HangGhe VARCHAR(10); @SoGhe INT; @LoaiGhe NVARCHAR(50) | False / False |
| usp_Admin_Seat_Delete | [usp_Admin_Seat_Delete.sql](<../database/08_procedures/admin/usp_Admin_Seat_Delete.sql>) | @ActorID INT; @GheID INT | True / False |
| usp_Admin_Seat_List | [usp_Admin_Seat_List.sql](<../database/08_procedures/admin/usp_Admin_Seat_List.sql>) | @ActorID INT; @PhongID INT | False / False |
| usp_Admin_Seat_Update | [usp_Admin_Seat_Update.sql](<../database/08_procedures/admin/usp_Admin_Seat_Update.sql>) | @ActorID INT; @GheID INT; @LoaiGhe NVARCHAR(50); @TrangThai NVARCHAR(50) | True / True |
| usp_Admin_Showtime_Cancel | [usp_Admin_Showtime_Cancel.sql](<../database/08_procedures/admin/usp_Admin_Showtime_Cancel.sql>) | @ActorID INT; @SuatChieuID INT | False / False |
| usp_Admin_Showtime_Create | [usp_Admin_Showtime_Create.sql](<../database/08_procedures/admin/usp_Admin_Showtime_Create.sql>) | @ActorID INT; @PhimID INT; @PhongID INT; @ThoiGianBatDau DATETIME2; @ThoiGianKetThuc DATETIME2; @DinhDang NVARCHAR(50); @GiaVeCoBan DECIMAL(18,2) | True / True |
| usp_Admin_Showtime_List | [usp_Admin_Showtime_List.sql](<../database/08_procedures/admin/usp_Admin_Showtime_List.sql>) | @ActorID INT; @RapID INT; @TuNgay DATE; @DenNgay DATE | False / False |
| usp_Admin_Showtime_Update | [usp_Admin_Showtime_Update.sql](<../database/08_procedures/admin/usp_Admin_Showtime_Update.sql>) | @ActorID INT; @SuatChieuID INT; @PhimID INT; @ThoiGianBatDau DATETIME2; @ThoiGianKetThuc DATETIME2; @DinhDang NVARCHAR(50); @GiaVeCoBan DECIMAL(18,2); @TrangThai NVARCHAR(50) | True / True |


## Evidence registry — verified existing artifacts

Mỗi record ghi operation, input/expected/actual/status, environment, compatibility; dữ liệu dài đọc tại exact selector. Suite SQL/HTTP classification tách trong record hoặc source runner; không cộng riêng pointer summary thành test mới. AUTHPASS không suy từ role string trong JWT.


<a id="evidence-e001"></a>

### E001 — valid registration follows real typed SP gateway and creates only Customer/profile

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/0`. **UC:** KH-01. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Người mới; email/phone hợp lệ, chưa trùng; dữ liệu đăng ký hợp lệ.. **Expected:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Actual:** {"profile":"PASS","successContract":"unchanged","passwordHashVerified":"[REDACTED]","status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.


<a id="evidence-e002"></a>

### E002 — registered user login bcrypt JWT and live identity unchanged

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/1`. **UC:** KH-01. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Người mới; email/phone hợp lệ, chưa trùng; dữ liệu đăng ký hợp lệ.. **Expected:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Actual:** {"permissions":["XEM_PHIM","DAT_VE","THANH_TOAN","DANH_GIA","GUI_KHIEU_NAI"],"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.


<a id="evidence-e003"></a>

### E003 — invalid/duplicate registration contracts and no write rollback unchanged

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/3`. **UC:** KH-01. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Người mới; email/phone hợp lệ, chưa trùng; dữ liệu đăng ký hợp lệ.. **Expected:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.


<a id="evidence-e004"></a>

### E004 — R4.5-08 register beyond production threshold never calls actual service/SQL

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/11`. **UC:** KH-01. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Người mới; email/phone hợp lệ, chưa trùng; dữ liệu đăng ký hợp lệ.. **Expected:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Register201 đúng Customer/profile; duplicate/invalid không write; limiter register429.


<a id="evidence-e005"></a>

### E005 — real login JWT/current permissions/assignments KHACH_HANG

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/4`. **UC:** KH-02. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"permissions":["DANH_GIA","DAT_VE","GUI_KHIEU_NAI","THANH_TOAN","XEM_PHIM"],"assignments":0,"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e006"></a>

### E006 — under-limit invalid/unknown credentials keep existing generic401

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/2`. **UC:** ADM-01, CSKH-01, KH-02, QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e007"></a>

### E007 — real four-role RBAC and non-auth endpoints preserved

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/8`. **UC:** ADM-01, CSKH-01, KH-02, QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e008"></a>

### E008 — account status and existing JWT live recheck unchanged

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/9`. **UC:** ADM-01, CSKH-01, KH-02, QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e009"></a>

### E009 — R4.5-07 login beyond production threshold never calls actual service/SQL

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/10`. **UC:** ADM-01, CSKH-01, KH-02, QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e010"></a>

### E010 — spoof resistance and other endpoints work with login/register counters exhausted

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/12`. **UC:** ADM-01, CSKH-01, KH-02, QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e011"></a>

### E011 — R4.5-04/10 exact expiry allows manual retry through real auth SP without sleeps

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/13`. **UC:** ADM-01, CSKH-01, KH-02, QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Account Customer hoạt động, email/password đúng.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e012"></a>

### E012 — real login JWT/current permissions/assignments QUAN_LY_RAP

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/5`. **UC:** QLR-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager hoạt động; có thể không có assignment hiện tại.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"permissions":["DAT_VE","QL_BANG_GIA","QL_GHE","QL_PHONG","QL_SUAT_CHIEU","THANH_TOAN","XEM_BAO_CAO_RAP","XEM_PHIM"],"assignments":1,"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e013"></a>

### E013 — real login JWT/current permissions/assignments CSKH

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/6`. **UC:** CSKH-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Active CSKH credentials; grants control support operations.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"permissions":["QL_KHIEUNAI","TRA_CUU_DON","XEM_PHIM","XULY_KHIEUNAI"],"assignments":0,"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e014"></a>

### E014 — real login JWT/current permissions/assignments ADMIN

**Artifact:** [auth-tests.json](<../docs/evidence/r45/auth-tests.json>); JSON Pointer `/cases/7`. **UC:** ADM-01. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Active ADMIN credentials; module grants current.. **Expected:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.. **Actual:** {"permissions":["DANH_GIA","DAT_VE","GUI_KHIEU_NAI","PHANCONG_RAP","QL_BANG_GIA","QL_DANHMUC_PHIM","QL_GHE","QL_KHIEUNAI","QL_KHUYENMAI","QL_NGUOIDUNG","QL_PHONG","QL_QUYEN","QL_RAP","QL_SANPHAM","QL_SUAT_CHIEU","QL_THELOAI","QL_VAITRO","THANH_TOAN","TRA_CUU_DON","XEM_BAO_CAO_RAP","XEM_BAO_CAO_TOANHE","XEM_PHIM","XULY_KHIEUNAI"],"assignments":0,"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Real login/current identity/grants + inactive/credentials401, rate429/retry, spoof defense.


<a id="evidence-e015"></a>

### E015 — R4.6-01 Customer common

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/0`. **UC:** KH-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e016"></a>

### E016 — R4.6-02 Customer specific, points preserved

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/1`. **UC:** KH-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e017"></a>

### E017 — R4.6-03/16 missing Customer valid NULL profile, repeated no duplicate

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/2`. **UC:** KH-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e018"></a>

### E018 — R4.6-11/14 invalid existing/missing profile constraints roll back common write

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/13`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e019"></a>

### E019 — duplicate phone existing domain error, no writes

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/14`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e020"></a>

### E020 — R4.6-13 missing user no profile

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/15`. **UC:** KH-03. **Class:** AUTH, DB_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e021"></a>

### E021 — SQL and HTTP live inactive account rejection

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/16`. **UC:** KH-03. **Class:** AUTH, DB_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e022"></a>

### E022 — direct SP has no trusted client role parameter

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/17`. **UC:** KH-03. **Class:** AUTH, DB_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e023"></a>

### E023 — real typed API write/read after write KHACH_HANG

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/19`. **UC:** KH-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e024"></a>

### E024 — R4.6-10/20 identity, role/owner/security whitelist spoofing rejected, all tables unchanged

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/25`. **UC:** KH-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e025"></a>

### E025 — current SQL role overrides previously authenticated Customer role

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/27`. **UC:** KH-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e026"></a>

### E026 — R4.6-12 real injected profile UPDATE failure restores both tables, no open transaction

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/29`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e027"></a>

### E027 — R4.6-12 real injected profile INSERT failure restores both tables, no open transaction

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/30`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e028"></a>

### E028 — caller success remains uncommitted and caller rollback restores both

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/34`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e029"></a>

### E029 — committable error rolls back SP savepoint, preserves caller prior work

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/35`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e030"></a>

### E030 — doomed caller transaction rolled back fully, no partial writes

**Artifact:** [profile-tests.json](<../docs/evidence/r46/profile-tests.json>); JSON Pointer `/cases/36`. **UC:** KH-03. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer hoạt động đã xác thực; chỉ sửa hồ sơ chính mình.. **Expected:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer self profile + typed write/read after write + denied spoof + TX rollback/savepoint. Các case SQL trực tiếp và HTTP được phân biệt trong assertion nguồn.


<a id="evidence-e031"></a>

### E031 — R6.1-01

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/0`. **UC:** KH-04, KH-05, KH-06, KH-07, KH-08, KH-09, KH-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-01. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Movie → showtime → seat → food → promo → booking → detail; SQL snapshots/amounts match. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e032"></a>

### E032 — R6.1-13

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/12`. **UC:** KH-05, KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-13. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Cinema, room and movie eligibility each reject 409 SHOWTIME_UNAVAILABLE without writes. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e033"></a>

### E033 — R6.1-14

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/13`. **UC:** KH-05, KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-14. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** R5 past show with Mở bán status still rejects 409 SHOWTIME_UNAVAILABLE; SQL time is the blocking condition. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e034"></a>

### E034 — R6.1-07

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/6`. **UC:** KH-06, KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-07. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Maintenance and broken seats rejected; no persisted mutation. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e035"></a>

### E035 — R6.1-08

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/7`. **UC:** KH-06, KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-08. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Paid seat rejects second booking; duplicate input rejected separately; no partial commit. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e036"></a>

### E036 — R6.1-09

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/8`. **UC:** KH-06, KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-09. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Live held seat unavailable to another customer; persisted state unchanged. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e037"></a>

### E037 — R6.1-10

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/9`. **UC:** KH-06, KH-07, KH-09, KH-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-10. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Effective expiry reads without writes; same-seat reuse persists expiry and releases promo exactly once. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e038"></a>

### E038 — R6.2-01

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/14`. **UC:** KH-06, KH-07. **Class:** CONCURRENCY, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.2-01. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Two SQL overlapping HTTP calls; exactly one complete order and one SEAT_CONFLICT. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":2,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":3,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e039"></a>

### E039 — R6.2-02

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/15`. **UC:** KH-06, KH-07. **Class:** CONCURRENCY, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.2-02. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** One complete two-seat winner; losing exclusive seat remains free; no partial order/food/quota. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":2,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":3,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e040"></a>

### E040 — R6.2-03

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/16`. **UC:** KH-06, KH-07. **Class:** CONCURRENCY, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.2-03. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Both SQL overlapping independent HTTP bookings commit. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":2,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":3,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e041"></a>

### E041 — R6.1-02

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/1`. **UC:** KH-07, KH-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-02. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** 201; zero food rows and productTotal=0. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e042"></a>

### E042 — R6.1-03

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/2`. **UC:** KH-07, KH-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-03. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** 201; two products retain quantity and DB unit-price snapshots. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e043"></a>

### E043 — R6.1-06

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/5`. **UC:** KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-06. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** 409 SEAT_UNAVAILABLE; no persisted mutation. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e044"></a>

### E044 — R6.1-11

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/10`. **UC:** KH-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-11. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** 10 accepted; 11 rejected by HTTP and SQL50026; no mutation on reject. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e045"></a>

### E045 — R6.1-12

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/11`. **UC:** KH-07, KH-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-12. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** 10 each for distinct products accepted; 11 and split 6+5 rejected by SQL; no mutation. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e046"></a>

### E046 — R6.2-04

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/17`. **UC:** KH-07. **Class:** CONCURRENCY, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.2-04. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Four SQL overlapping requests for distinct seats; exactly three live orders, one ACTIVE_ORDER_LIMIT_REACHED. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":2,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":3,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e047"></a>

### E047 — REG-BOOKING-NEGATIVE

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/26`. **UC:** KH-07, KH-08, KH-09. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** REG-BOOKING-NEGATIVE. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Exact errors and full SQL hashes unchanged. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e048"></a>

### E048 — REG-BOOKING-ROLLBACK

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/27`. **UC:** KH-07, KH-09. **Class:** DB_SQL, HTTP_SQL, ROLLBACK. **Result:** PASS.

**Operation:** REG-BOOKING-ROLLBACK. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Injected SQL51061 proves order/ticket/food/promo writes reached; full rollback; following booking succeeds. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e049"></a>

### E049 — R6.1-04

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/3`. **UC:** KH-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-04. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** SQL preview matches final discount and quota increases once. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e050"></a>

### E050 — R6.1-05

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/4`. **UC:** KH-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.1-05. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** NULL promo, zero discount, every counter unchanged. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e051"></a>

### E051 — R6.2-05

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/18`. **UC:** KH-09. **Class:** CONCURRENCY, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.2-05. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Different shows/rooms; both wait on promo lock; exactly one usage and complete booking. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":2,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"},{"round":3,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e052"></a>

### E052 — R6.3-01

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/19`. **UC:** KH-10, KH-11, KH-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-01. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Every step persists correct state; failed history retained; amount SQL-owned; order/loyalty consistent. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e053"></a>

### E053 — R6.3-02

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/20`. **UC:** KH-10, KH-12. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-02. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Foreign attempt/read/result each 404 ORDER_NOT_FOUND; no mutation; SQL ownership rejects directly. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e054"></a>

### E054 — R6.3-03

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/21`. **UC:** KH-10. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-03. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Payment from another owned order rejected 404 PAYMENT_NOT_FOUND; both orders/attempts unchanged. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e055"></a>

### E055 — R6.3-04

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/22`. **UC:** KH-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-04. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Failure and success replay return 200; exact hashes unchanged including history/points/timestamps. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e056"></a>

### E056 — R6.3-05

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/23`. **UC:** KH-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-05. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Both terminal flip directions reject 409 PAYMENT_FINALIZED without writes. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e057"></a>

### E057 — R6.3-06

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/24`. **UC:** KH-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-06. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Aged order rejects settlement/new attempt; existing expiry cancels ticket/releases quota once; no success/loyalty. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e058"></a>

### E058 — R6.3-07

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/25`. **UC:** KH-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** R6.3-07. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Reject new attempt and another in-flight success; one completion and loyalty credit only. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e059"></a>

### E059 — REG-PAYMENT-ROLLBACK

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/cases/28`. **UC:** KH-10. **Class:** DB_SQL, HTTP_SQL, ROLLBACK. **Result:** PASS.

**Operation:** REG-PAYMENT-ROLLBACK. **Input:** See exact request inputs and SQL fixture changes in linked evidence. **Expected:** Existing numeric overflow at loyalty update rolls back success/order/hold/history; retry succeeds after fixture restore. **Actual:** [{"round":1,"status":"PASS","integrity":{"status":"PASS","invariants":"seats/quota/holds/atomicity/money/payment/constraints"},"cleanup":"PASS"}].

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Chỉ operation/case nêu trên; không đại diện toàn UC hoặc FE.


<a id="evidence-e060"></a>

### E060 — GET /orders

**Artifact:** [result.json](<../docs/evidence/r6-group-a/runs/2026-10-09T10-38-48-967Z-91393232/result.json>); JSON Pointer `/requests/86`. **UC:** KH-11. **Class:** HTTP_SQL. **Result:** PASS (suite); HTTP200.

**Operation:** GET /orders. **Input:** Customer0 real token; GET /orders after payment fail/retry/success. **Expected:** 200 own nonempty order history; persisted paid snapshots. **Actual:** HTTP200 orders[0].id2174, status Đã thanh toán, total252000, ticketCount2.

**Environment:** CinemaBookingDB_R0_R6A_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** GET /orders nonempty paid order snapshot; positive list operation; does not replace detail ownership assertions.


<a id="evidence-e061"></a>

### E061 — R6.5-01

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/0`. **UC:** QLR-01. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager hoạt động; có thể không có assignment hiện tại.. **Expected:** 200; only valid assigned cinemas. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e062"></a>

### E062 — R6.5-03

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/2`. **UC:** QLR-01, QLR-02, QLR-03, QLR-04, QLR-05, QLR-06. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager hoạt động; có thể không có assignment hiện tại.. **Expected:** Existing token cannot retain scope; list hides revoked/expired cinema. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e063"></a>

### E063 — R6.5-04

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/3`. **UC:** QLR-01, QLR-02, QLR-03, QLR-04, QLR-05, QLR-06. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager hoạt động; có thể không có assignment hiện tại.. **Expected:** Existing token cannot retain scope; list hides revoked/expired cinema. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e064"></a>

### E064 — R6.5-02

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/1`. **UC:** QLR-02, QLR-07. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_PHONG, current assignment to resource cinema.. **Expected:** 403 MANAGER_CINEMA_FORBIDDEN; no writes or foreign payload. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e065"></a>

### E065 — R6.5-05

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/4`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_PHONG, current assignment to resource cinema.. **Expected:** 201/200 persisted; wrong role/permission403 no writes. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e066"></a>

### E066 — R6.5-06

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/5`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_PHONG, current assignment to resource cinema.. **Expected:** Actual room determines scope;403, full DB unchanged. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e067"></a>

### E067 — R6.5-07

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/6`. **UC:** QLR-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_GHE; parent room/cinema assigned.. **Expected:** Assigned works; foreign denies even with allowed RapID. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e068"></a>

### E068 — R6.5-08

**Artifact:** [scope.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/scope/scope.json>); JSON Pointer `/cases/7`. **UC:** QLR-04, QLR-05, QLR-06. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** Assigned works; foreign create/update/cancel403 and no writes. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Live assigned/foreign/expired/revoked assignment; actual request status and no write SQL checks.


<a id="evidence-e069"></a>

### E069 — R6.6-r11-api-states-001

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/256`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/1. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/1; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/0


<a id="evidence-e070"></a>

### E070 — R6.6-r11-api-states-002

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/257`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/2. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/2; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/1


<a id="evidence-e071"></a>

### E071 — R6.6-r11-api-states-003

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/258`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/3. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/3; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/2


<a id="evidence-e072"></a>

### E072 — R6.6-r11-api-states-004

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/259`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/4. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/4; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/3


<a id="evidence-e073"></a>

### E073 — R6.6-r11-api-states-005

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/260`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/5. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/5; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/4


<a id="evidence-e074"></a>

### E074 — R6.6-r11-api-states-006

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/261`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/6. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/6; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/5


<a id="evidence-e075"></a>

### E075 — R6.6-r11-api-states-007

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/262`. **UC:** QLR-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** r11-api/states/7. **Input:** {"source":"scripts/r11/api-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/api-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-api/states/7; raw [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-api/api-tests.json>) JSON pointer /states/6


<a id="evidence-e076"></a>

### E076 — R6.6-r11-sql-cases-005

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/240`. **UC:** QLR-02. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** injected_failure. **Input:** {"replayedCase":"injected_failure","source":"scripts/r11/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/sql-tests.mjs","sqlError":59801}. **Actual:** {"status":"PASS","sqlError":59801}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** injected_failure; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-sql/sql-tests.json>) JSON pointer /cases/4


<a id="evidence-e077"></a>

### E077 — R6.6-r11-sql-cases-006

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/241`. **UC:** QLR-02. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** delete_conflict. **Input:** {"replayedCase":"delete_conflict","source":"scripts/r11/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/sql-tests.mjs","sqlError":50217}. **Actual:** {"status":"PASS","sqlError":50217}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** delete_conflict; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-sql/sql-tests.json>) JSON pointer /cases/5


<a id="evidence-e078"></a>

### E078 — R6.6-r11-sql-cases-013

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/248`. **UC:** ADM-08, QLR-02. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** injected_failure. **Input:** {"replayedCase":"injected_failure","source":"scripts/r11/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/sql-tests.mjs","sqlError":59801}. **Actual:** {"status":"PASS","sqlError":59801}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** injected_failure; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-sql/sql-tests.json>) JSON pointer /cases/12; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-sql/sql-tests.json>) JSON pointer /cases/12


<a id="evidence-e079"></a>

### E079 — R6.6-r11-sql-cases-014

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/249`. **UC:** QLR-02. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** delete_conflict. **Input:** {"replayedCase":"delete_conflict","source":"scripts/r11/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r11/sql-tests.mjs","sqlError":50217}. **Actual:** {"status":"PASS","sqlError":50217}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** delete_conflict; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-sql/sql-tests.json>) JSON pointer /cases/13


<a id="evidence-e080"></a>

### E080 — R6.6-r11-concurrency-cases-001

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/263`. **UC:** QLR-02. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** r11-concurrency/cases/1. **Input:** {"source":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-concurrency/cases/1; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-concurrency/concurrency.json>) JSON pointer /cases/0


<a id="evidence-e081"></a>

### E081 — R6.6-r11-concurrency-cases-002

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/264`. **UC:** QLR-02. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** r11-concurrency/cases/2. **Input:** {"source":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-concurrency/cases/2; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-concurrency/concurrency.json>) JSON pointer /cases/1


<a id="evidence-e082"></a>

### E082 — R6.4-r32-sql-cases-036

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/35`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** unused-seat-type. **Input:** {"LoaiGhe":"Thường"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** unused-seat-type; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/35


<a id="evidence-e083"></a>

### E083 — R6.4-r32-sql-cases-037

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/36`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-active-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-active-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/36


<a id="evidence-e084"></a>

### E084 — R6.4-r32-sql-cases-038

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/37`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-Đã hủy-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-Đã hủy-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/37


<a id="evidence-e085"></a>

### E085 — R6.4-r32-sql-cases-039

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/38`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-Hết hạn-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-Hết hạn-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/38


<a id="evidence-e086"></a>

### E086 — R6.4-r32-sql-cases-040

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/39`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-Hoàn thành-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-Hoàn thành-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/39


<a id="evidence-e087"></a>

### E087 — R6.4-r32-sql-cases-041

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/40`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** historical-canceled-seat-status-Hoạt động. **Input:** {"TrangThai":"Hoạt động"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** historical-canceled-seat-status-Hoạt động; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/40


<a id="evidence-e088"></a>

### E088 — R6.4-r32-sql-cases-042

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/41`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** historical-canceled-seat-status-Bảo trì. **Input:** {"TrangThai":"Bảo trì"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** historical-canceled-seat-status-Bảo trì; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/41


<a id="evidence-e089"></a>

### E089 — R6.4-r32-sql-cases-043

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/42`. **UC:** QLR-03. **Class:** DB_SQL. **Result:** PASS.

**Operation:** historical-canceled-seat-status-Hỏng. **Input:** {"TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** historical-canceled-seat-status-Hỏng; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/42


<a id="evidence-e090"></a>

### E090 — POST /manager/showtimes

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/1`. **UC:** QLR-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** 201. **Actual:** {"http":201,"error":null}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e091"></a>

### E091 — POST /manager/showtimes

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/2`. **UC:** QLR-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** 409. **Actual:** {"http":409,"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e092"></a>

### E092 — POST /manager/showtimes

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/3`. **UC:** QLR-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** 409. **Actual:** {"http":409,"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e093"></a>

### E093 — POST /manager/showtimes

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/4`. **UC:** QLR-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** 409. **Actual:** {"http":409,"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e094"></a>

### E094 — POST /manager/showtimes

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/5`. **UC:** QLR-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** 409. **Actual:** {"http":409,"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e095"></a>

### E095 — POST /manager/showtimes

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/6`. **UC:** QLR-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; phim/phòng/rạp active và assigned; time hợp lệ.. **Expected:** 409. **Actual:** {"http":409,"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e096"></a>

### E096 — PUT /manager/showtimes/1021

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/8`. **UC:** QLR-05. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /manager/showtimes/1021. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; assigned existing show; edits respect historical usage.. **Expected:** 200. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e097"></a>

### E097 — PUT /manager/showtimes/1021

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/9`. **UC:** QLR-05. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /manager/showtimes/1021. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; assigned existing show; edits respect historical usage.. **Expected:** 409. **Actual:** {"http":409,"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e098"></a>

### E098 — PUT /manager/showtimes/1021

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/10`. **UC:** QLR-05. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /manager/showtimes/1021. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; assigned existing show; edits respect historical usage.. **Expected:** 200. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e099"></a>

### E099 — POST /manager/showtimes/1021/cancel

**Artifact:** [api-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-api/api-tests.json>); JSON Pointer `/requests/11`. **UC:** QLR-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /manager/showtimes/1021/cancel. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_SUAT_CHIEU; assigned future show; no valid held/paid orders.. **Expected:** 200. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** R6.7 actual Manager show operation; persisted states in same artifact /states.


<a id="evidence-e100"></a>

### E100 — R6.7-r12-concurrency-scenarios-001

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/347`. **UC:** QLR-04, QLR-05. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** overlap. **Input:** {"A":{"kind":"Create","role":"manager","room":1104,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"sp_Manager_Showtime_Create","identity":"NguoiDungID","actor":2},"B":{"kind":"Create","role":"manager","room":1104,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"sp_Manager_Showtime_Create","identity":"NguoiDungID","actor":2}}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/showtime-overlap.mjs"}. **Actual:** {"status":"PASS","results":[{"status":"SUCCESS","recordsets":[[{"SuatChieuID":1052,"PhimID":1,"TenPhim":"Dune: Hành Tinh Cát - Phần Hai","PosterURL":"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800","ThoiLuong":166,"DoTuoi":"T16","RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","DiaChiRap":"123 Hai Bà Trưng, Phường Bến Nghé, Quận 1","ThanhPho":"Hồ Chí Minh","PhongID":1104,"TenPhong":"R11 62D8EB15-524A-4EB1-AC15-35F09E9BD538","LoaiPhong":"2D","ThoiGianBatDau":"… (xem selector).

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** overlap; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /scenarios/0; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /scenarios/0


<a id="evidence-e101"></a>

### E101 — R6.7-r12-concurrency-scenarios-002

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/348`. **UC:** ADM-14, QLR-04, QLR-05. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** overlap. **Input:** {"A":{"kind":"Create","role":"manager","room":1105,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"sp_Manager_Showtime_Create","identity":"NguoiDungID","actor":2},"B":{"kind":"Create","role":"admin","room":1105,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"usp_Admin_Showtime_Create","identity":"ActorID","actor":1}}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/showtime-overlap.mjs"}. **Actual:** {"status":"PASS","results":[{"status":"SUCCESS","recordsets":[[{"SuatChieuID":1053,"PhimID":1,"TenPhim":"Dune: Hành Tinh Cát - Phần Hai","PosterURL":"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800","ThoiLuong":166,"DoTuoi":"T16","RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","DiaChiRap":"123 Hai Bà Trưng, Phường Bến Nghé, Quận 1","ThanhPho":"Hồ Chí Minh","PhongID":1105,"TenPhong":"R11 2E935FFB-9C0F-4D5D-9548-5012AE6C80F0","LoaiPhong":"2D","ThoiGianBatDau":"… (xem selector).

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** overlap; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /scenarios/1; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /scenarios/1; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /scenarios/1


<a id="evidence-e102"></a>

### E102 — R6.7-r12-concurrency-stress-001

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/373`. **UC:** QLR-04, QLR-05. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** overlap. **Input:** {"A":{"kind":"Create","role":"manager","room":1134,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"sp_Manager_Showtime_Create","identity":"NguoiDungID","actor":2},"B":{"kind":"Create","role":"manager","room":1134,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"sp_Manager_Showtime_Create","identity":"NguoiDungID","actor":2}}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/showtime-overlap.mjs"}. **Actual:** {"status":"PASS","results":[{"status":"SUCCESS","recordsets":[[{"SuatChieuID":1092,"PhimID":1,"TenPhim":"Dune: Hành Tinh Cát - Phần Hai","PosterURL":"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800","ThoiLuong":166,"DoTuoi":"T16","RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","DiaChiRap":"123 Hai Bà Trưng, Phường Bến Nghé, Quận 1","ThanhPho":"Hồ Chí Minh","PhongID":1134,"TenPhong":"R11 B94DF0B1-3EF4-405A-B613-FCCB4F773A90","LoaiPhong":"2D","ThoiGianBatDau":"… (xem selector).

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** overlap; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /stress/0; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /stress/0


<a id="evidence-e103"></a>

### E103 — R6.4-r32-sql-cases-005

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/4`. **UC:** QLR-05. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-movie-mixed-status. **Input:** {"PhimID":846,"TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-movie-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/4


<a id="evidence-e104"></a>

### E104 — R6.4-r32-sql-cases-006

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/5`. **UC:** QLR-05. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-start-mixed-status. **Input:** {"ThoiGianBatDau":"2026-10-19T12:17:26.725Z","TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-start-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/5


<a id="evidence-e105"></a>

### E105 — R6.4-r32-sql-cases-007

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/6`. **UC:** QLR-05. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-end-mixed-status. **Input:** {"ThoiGianKetThuc":"2026-10-19T13:47:26.973Z","TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-end-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/6


<a id="evidence-e106"></a>

### E106 — R6.4-r32-sql-cases-008

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/7`. **UC:** QLR-05. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-format-mixed-status. **Input:** {"DinhDang":"3D","TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-format-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/7


<a id="evidence-e107"></a>

### E107 — PUT http://127.0.0.1:60944/api/manager/pricing/37

**Artifact:** [http-trace.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); JSON Pointer `/10`. **UC:** QLR-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT http://127.0.0.1:60944/api/manager/pricing/37. **Input:** {"seatType":"VIP","dayType":"Ngày thường","format":"2D","surcharge":25000,"startsOn":"2031-01-01","endsOn":"2031-01-10","status":"Áp dụng"}. **Expected:** Manager full condition PUT/assigned list; no positive Manager POST proof.. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Manager full condition PUT/assigned list; no positive Manager POST proof.


<a id="evidence-e108"></a>

### E108 — GET http://127.0.0.1:60944/api/manager/cinemas/19/pricing

**Artifact:** [http-trace.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); JSON Pointer `/11`. **UC:** QLR-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET http://127.0.0.1:60944/api/manager/cinemas/19/pricing. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+QL_BANG_GIA; assigned cinema; valid conditions/range/surcharge.. **Expected:** Manager full condition PUT/assigned list; no positive Manager POST proof.. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Manager full condition PUT/assigned list; no positive Manager POST proof.


<a id="evidence-e109"></a>

### E109 — PUT http://127.0.0.1:60944/api/manager/pricing/37

**Artifact:** [http-trace.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); JSON Pointer `/12`. **UC:** QLR-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT http://127.0.0.1:60944/api/manager/pricing/37. **Input:** {"surcharge":22000,"status":"Áp dụng"}. **Expected:** Manager full condition PUT/assigned list; no positive Manager POST proof.. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Manager full condition PUT/assigned list; no positive Manager POST proof.


<a id="evidence-e110"></a>

### E110 — R6.8-linked-01

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/0`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /complaints. **Input:** {"type":"R6C integration","title":"Linked complaint","content":"Customer permitted timeline","orderId":21}. **Expected:** {"http":201}. **Actual:** {"complaint":{"id":757,"orderId":21,"type":"R6C integration","title":"Linked complaint","content":"Customer permitted timeline","priority":"Trung bình","createdAt":"2026-10-09T13:01:44.470Z","status":"Mới"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e111"></a>

### E111 — R6.8-linked-08

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/7`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /complaints/757. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.. **Expected:** {"http":200}. **Actual:** {"complaint":{"id":757,"orderId":21,"type":"R6C integration","title":"Linked complaint","content":"Customer permitted timeline","priority":"Trung bình","createdAt":"2026-10-09T13:01:44.470Z","status":"Đã giải quyết","processingHistory":[{"id":833,"content":"R6C first public processing","processedAt":"2026-10-09T13:01:45.413Z","status":"Đang xử lý"},{"id":834,"content":"Cập nhật trạng thái khiếu nại.","processedAt":"2026-10-09T13:01:45.641Z","status":"Đã giải quyết"}]}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e112"></a>

### E112 — R6.8-linked-09

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/8`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /complaints/757. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.. **Expected:** {"http":404,"code":"COMPLAINT_NOT_FOUND","persisted":"unchanged"}. **Actual:** {"error":{"code":"COMPLAINT_NOT_FOUND","message":"Complaint was not found."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e113"></a>

### E113 — R6.8-linked-10

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/9`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /complaints. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.. **Expected:** {"http":200}. **Actual:** {"complaints":[]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e114"></a>

### E114 — R6.8-linked-11

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/10`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /complaints. **Input:** {"type":"R6C integration","title":"Unlinked complaint","content":"Customer permitted timeline","orderId":null}. **Expected:** {"http":201}. **Actual:** {"complaint":{"id":758,"orderId":null,"type":"R6C integration","title":"Unlinked complaint","content":"Customer permitted timeline","priority":"Trung bình","createdAt":"2026-10-09T13:01:46.329Z","status":"Mới"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e115"></a>

### E115 — R6.8-linked-18

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/17`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /complaints/758. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.. **Expected:** {"http":200}. **Actual:** {"complaint":{"id":758,"orderId":null,"type":"R6C integration","title":"Unlinked complaint","content":"Customer permitted timeline","priority":"Trung bình","createdAt":"2026-10-09T13:01:46.329Z","status":"Đã giải quyết","processingHistory":[{"id":835,"content":"R6C first public processing","processedAt":"2026-10-09T13:01:47.178Z","status":"Đang xử lý"},{"id":836,"content":"Cập nhật trạng thái khiếu nại.","processedAt":"2026-10-09T13:01:47.345Z","status":"Đã giải quyết"}]}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e116"></a>

### E116 — R6.8-linked-19

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/18`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /complaints/758. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.. **Expected:** {"http":404,"code":"COMPLAINT_NOT_FOUND","persisted":"unchanged"}. **Actual:** {"error":{"code":"COMPLAINT_NOT_FOUND","message":"Complaint was not found."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e117"></a>

### E117 — R6.8-linked-20

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/19`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /complaints. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer active; create GUI_KHIEU_NAI; optional order thuộc mình.. **Expected:** {"http":200}. **Actual:** {"complaints":[]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e118"></a>

### E118 — R6.8-linked-35

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/34`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /complaints. **Input:** {"type":"R6C","title":"Foreign order denied","content":"must not persist","orderId":21}. **Expected:** {"http":404,"code":"ORDER_REFERENCE_INVALID","persisted":"unchanged"}. **Actual:** {"error":{"code":"ORDER_REFERENCE_INVALID","message":"Referenced order was not found."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e119"></a>

### E119 — R6.8-linked-36

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/35`. **UC:** KH-14. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /complaints. **Input:** {"type":"R6C","title":"Foreign order denied","content":"must not persist","orderId":2147483647}. **Expected:** {"http":404,"code":"ORDER_REFERENCE_INVALID","persisted":"unchanged"}. **Actual:** {"error":{"code":"ORDER_REFERENCE_INVALID","message":"Referenced order was not found."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e120"></a>

### E120 — R6.8-linked-02

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/1`. **UC:** CSKH-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints?status=Mới&type=R6C%20integration. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH active + QL_KHIEUNAI.. **Expected:** {"http":200}. **Actual:** {"complaints":[{"id":757,"senderId":5,"senderName":"Đoàn Anh Tuấn","orderId":21,"type":"R6C integration","title":"Linked complaint","content":"Customer permitted timeline","priority":"Trung bình","status":"Mới","createdAt":"2026-10-09T13:01:44.470Z","processingCount":0,"lastProcessedAt":null,"lastProcessorName":null,"lastProcessingContent":null}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e121"></a>

### E121 — R6.8-linked-12

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/11`. **UC:** CSKH-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints?status=Mới&type=R6C%20integration. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH active + QL_KHIEUNAI.. **Expected:** {"http":200}. **Actual:** {"complaints":[{"id":758,"senderId":5,"senderName":"Đoàn Anh Tuấn","orderId":null,"type":"R6C integration","title":"Unlinked complaint","content":"Customer permitted timeline","priority":"Trung bình","status":"Mới","createdAt":"2026-10-09T13:01:46.329Z","processingCount":0,"lastProcessedAt":null,"lastProcessorName":null,"lastProcessingContent":null}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e122"></a>

### E122 — R6.8-linked-25

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/24`. **UC:** CSKH-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints?actorId=4&role=SUPPORT&permissions=QL_KHIEUNAI. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH active + QL_KHIEUNAI.. **Expected:** {"http":403,"code":"SUPPORT_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"SUPPORT_REQUIRED","message":"Support access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e123"></a>

### E123 — R6.8-linked-26

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/25`. **UC:** CSKH-02. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH active + QL_KHIEUNAI.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e124"></a>

### E124 — R6.8-linked-03

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/2`. **UC:** CSKH-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH+QL_KHIEUNAI; existing complaint.. **Expected:** {"http":200}. **Actual:** {"complaint":{"id":757,"senderId":5,"senderName":"Đoàn Anh Tuấn","orderId":21,"type":"R6C integration","title":"Linked complaint","content":"Customer permitted timeline","priority":"Trung bình","status":"Mới","createdAt":"2026-10-09T13:01:44.470Z","processings":[]}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e125"></a>

### E125 — R6.8-linked-13

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/12`. **UC:** CSKH-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/758. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH+QL_KHIEUNAI; existing complaint.. **Expected:** {"http":200}. **Actual:** {"complaint":{"id":758,"senderId":5,"senderName":"Đoàn Anh Tuấn","orderId":null,"type":"R6C integration","title":"Unlinked complaint","content":"Customer permitted timeline","priority":"Trung bình","status":"Mới","createdAt":"2026-10-09T13:01:46.329Z","processings":[]}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e126"></a>

### E126 — R6.8-linked-27

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/26`. **UC:** CSKH-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757?actorId=4&role=SUPPORT&permissions=QL_KHIEUNAI. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH+QL_KHIEUNAI; existing complaint.. **Expected:** {"http":403,"code":"SUPPORT_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"SUPPORT_REQUIRED","message":"Support access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e127"></a>

### E127 — R6.8-linked-28

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/27`. **UC:** CSKH-03. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH+QL_KHIEUNAI; existing complaint.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e128"></a>

### E128 — R6.8-linked-04

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/3`. **UC:** CSKH-04. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH and BOTH QL_KHIEUNAI + TRA_CUU_DON; complaint exists, order optional.. **Expected:** {"http":200}. **Actual:** {"order":{"id":21,"showtimeId":46,"movieId":32,"movieTitle":"R21 API","posterUrl":null,"cinemaId":17,"cinemaName":"R21 API","roomName":"R21 API","startsAt":"2026-10-19T13:01:43.684Z","endsAt":"2026-10-19T14:31:43.684Z","format":"2D","bookedAt":"2026-10-09T13:01:44.313Z","holdExpiresAt":"2026-10-09T13:06:44.313Z","ticketTotal":190000,"productTotal":10000,"discountTotal":1000,"total":199000,"status":"Chờ thanh toán","promotionCode":"R21-FBCC3198-CF47-4471-A1C6-AD5832000F9A","ca… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e129"></a>

### E129 — R6.8-linked-14

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/13`. **UC:** CSKH-04. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/758/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH and BOTH QL_KHIEUNAI + TRA_CUU_DON; complaint exists, order optional.. **Expected:** {"http":200}. **Actual:** {"order":null,"message":"Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào."}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e130"></a>

### E130 — R6.8-linked-32

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/31`. **UC:** CSKH-04. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757/order-reference?actorId=4&role=SUPPORT. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH and BOTH QL_KHIEUNAI + TRA_CUU_DON; complaint exists, order optional.. **Expected:** {"http":403,"code":"SUPPORT_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"SUPPORT_REQUIRED","message":"Support access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e131"></a>

### E131 — R6.8-linked-37

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/36`. **UC:** CSKH-04. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH and BOTH QL_KHIEUNAI + TRA_CUU_DON; complaint exists, order optional.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e132"></a>

### E132 — R6.8-linked-38

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/37`. **UC:** CSKH-04. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /support/complaints/757/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH and BOTH QL_KHIEUNAI + TRA_CUU_DON; complaint exists, order optional.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e133"></a>

### E133 — R6.8-linked-06

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/5`. **UC:** CSKH-05. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /support/complaints/757/processings. **Input:** {"content":"R6C first public processing","nextStatus":"Đang xử lý"}. **Expected:** {"http":201}. **Actual:** {"processing":{"XuLyID":833,"KhieuNaiID":757,"NguoiXuLyID":4,"NoiDungXuLy":"R6C first public processing","NgayXuLy":"2026-10-09T13:01:45.413Z","TrangThaiSauXuLy":"Đang xử lý"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e134"></a>

### E134 — R6.8-linked-16

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/15`. **UC:** CSKH-05. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /support/complaints/758/processings. **Input:** {"content":"R6C first public processing","nextStatus":"Đang xử lý"}. **Expected:** {"http":201}. **Actual:** {"processing":{"XuLyID":835,"KhieuNaiID":758,"NguoiXuLyID":4,"NoiDungXuLy":"R6C first public processing","NgayXuLy":"2026-10-09T13:01:47.178Z","TrangThaiSauXuLy":"Đang xử lý"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e135"></a>

### E135 — R6.8-linked-33

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/32`. **UC:** CSKH-05. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /support/complaints/757/processings. **Input:** {"content":"must not append","actorId":4,"role":"SUPPORT","permissions":["QL_KHIEUNAI","XULY_KHIEUNAI","TRA_CUU_DON"]}. **Expected:** {"http":403,"code":"SUPPORT_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"SUPPORT_REQUIRED","message":"Support access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e136"></a>

### E136 — R6.8-linked-07

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/6`. **UC:** CSKH-06. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /support/complaints/757/status. **Input:** {"status":"Đã giải quyết"}. **Expected:** {"http":200}. **Actual:** {"complaint":{"id":757,"status":"Đã giải quyết"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e137"></a>

### E137 — R6.8-linked-17

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/16`. **UC:** CSKH-06. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /support/complaints/758/status. **Input:** {"status":"Đã giải quyết"}. **Expected:** {"http":200}. **Actual:** {"complaint":{"id":758,"status":"Đã giải quyết"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e138"></a>

### E138 — R6.8-linked-34

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/33`. **UC:** CSKH-06. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /support/complaints/757/status. **Input:** {"status":"Đã đóng","actorId":4,"role":"SUPPORT","permissions":["QL_KHIEUNAI","XULY_KHIEUNAI","TRA_CUU_DON"]}. **Expected:** {"http":403,"code":"SUPPORT_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"SUPPORT_REQUIRED","message":"Support access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e139"></a>

### E139 — R6.8-linked-05

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/4`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/757/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":200}. **Actual:** {"order":{"id":21,"showtimeId":46,"movieId":32,"movieTitle":"R21 API","posterUrl":null,"cinemaId":17,"cinemaName":"R21 API","roomName":"R21 API","startsAt":"2026-10-19T13:01:43.684Z","endsAt":"2026-10-19T14:31:43.684Z","format":"2D","bookedAt":"2026-10-09T13:01:44.313Z","holdExpiresAt":"2026-10-09T13:06:44.313Z","ticketTotal":190000,"productTotal":10000,"discountTotal":1000,"total":199000,"status":"Chờ thanh toán","promotionCode":"R21-FBCC3198-CF47-4471-A1C6-AD5832000F9A","ca… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e140"></a>

### E140 — R6.8-linked-15

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/14`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/758/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":200}. **Actual:** {"order":null,"message":"Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào."}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e141"></a>

### E141 — R6.8-linked-21

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/20`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints?actorId=1&role=ADMIN&permissions=QL_KHIEUNAI. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"ADMIN_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"ADMIN_REQUIRED","message":"Admin access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e142"></a>

### E142 — R6.8-linked-22

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/21`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e143"></a>

### E143 — R6.8-linked-23

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/22`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/757?actorId=1&role=ADMIN&permissions=QL_KHIEUNAI. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"ADMIN_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"ADMIN_REQUIRED","message":"Admin access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e144"></a>

### E144 — R6.8-linked-24

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/23`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/757. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e145"></a>

### E145 — R6.8-linked-29

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/28`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/757/order-reference?actorId=1&role=ADMIN. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"ADMIN_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"ADMIN_REQUIRED","message":"Admin access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e146"></a>

### E146 — R6.8-linked-30

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/29`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/complaints/757/processings. **Input:** {"content":"must not append","actorId":1,"role":"ADMIN","permissions":["QL_KHIEUNAI","XULY_KHIEUNAI","TRA_CUU_DON"]}. **Expected:** {"http":403,"code":"ADMIN_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"ADMIN_REQUIRED","message":"Admin access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e147"></a>

### E147 — R6.8-linked-31

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/30`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/complaints/757/status. **Input:** {"status":"Đã đóng","actorId":1,"role":"ADMIN","permissions":["QL_KHIEUNAI","XULY_KHIEUNAI","TRA_CUU_DON"]}. **Expected:** {"http":403,"code":"ADMIN_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"ADMIN_REQUIRED","message":"Admin access is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e148"></a>

### E148 — R6.8-linked-39

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/38`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/757/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e149"></a>

### E149 — R6.8-linked-40

**Artifact:** [complaint-flow.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/complaint-flow.json>); JSON Pointer `/cases/39`. **UC:** ADM-15. **Class:** AUTH, DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/complaints/757/order-reference. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active; QL_KHIEUNAI; writes thêm XULY_KHIEUNAI; order-reference thêm TRA_CUU_DON.. **Expected:** {"http":403,"code":"FORBIDDEN","persisted":"unchanged"}. **Actual:** {"error":{"code":"FORBIDDEN","message":"You do not have permission to perform this action."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Actual linked/unlinked flow; expected HTTP/domain code, before/after27 hashes, SQL assertion and recorded response.


<a id="evidence-e150"></a>

### E150 — identity-order-over-timestamp

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-sql/sql-tests.json>); JSON Pointer `/cases/19`. **UC:** ADM-15, CSKH-05, CSKH-06. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Parent status follows MAX persisted XuLyID, future/past timestamps ignored.. **Input:** [{"complaint":684,"actor":1,"status":"Từ chối","content":"timestamp-future","processedAt":"2099-01-01T00:00:00Z"},{"complaint":684,"actor":4,"status":"Đã giải quyết","content":"timestamp-past","processedAt":"2000-01-01T00:00:00Z"}]. **Expected:** Parent status follows MAX persisted XuLyID, future/past timestamps ignored.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Parent status follows MAX persisted XuLyID, future/past timestamps ignored.


<a id="evidence-e151"></a>

### E151 — trigger-after-parent-update-batch-failure

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-sql/sql-tests.json>); JSON Pointer `/rollback/1`. **UC:** ADM-15, CSKH-05, CSKH-06. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** SQL51034 after parent update batch failure restores history+parent.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện CSKH+BOTH QL_KHIEUNAI/XULY_KHIEUNAI; existing complaint, nonempty processingcontent.. **Expected:** SQL51034 after parent update batch failure restores history+parent.. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL51034 after parent update batch failure restores history+parent.


<a id="evidence-e152"></a>

### E152 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/1`. **UC:** ADM-02. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/users; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /9](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /7](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /8](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e153"></a>

### E153 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/2`. **UC:** ADM-02. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/users; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"EMAIL_ALREADY_EXISTS"},{"http":400,"code":"INVALID_REFERENCE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /5](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /2](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /3](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /4](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /6](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /10](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /11](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e154"></a>

### E154 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/3`. **UC:** ADM-02. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/users/:userId/status; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /14](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /16](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /12](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /13](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /15](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e155"></a>

### E155 — R6.9-admin-003

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/2`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/users. **Input:** {"name":"R6C-63693a49","email":"[REDACTED]","password":"[REDACTED]","roleId":2}. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"password must be 8 to 72 UTF-8 bytes."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e156"></a>

### E156 — R6.9-admin-004

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/3`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/users. **Input:** {"name":"R6C-63693a49","email":"[REDACTED]","password":"[REDACTED]","roleId":2}. **Expected:** {"http":200}. **Actual:** {"user":{"NguoiDungID":15,"HoTen":"R6C-63693a49","Email":"[REDACTED]","SoDienThoai":"[REDACTED]","MaVaiTro":"QUAN_LY_RAP","TenVaiTro":"Quản lý rạp","TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e157"></a>

### E157 — R6.9-admin-005

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/4`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/users. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e158"></a>

### E158 — R6.9-admin-008

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/7`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/users?roleId=2. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"users":[{"NguoiDungID":15,"HoTen":"R6C-63693a49","Email":"[REDACTED]","SoDienThoai":"[REDACTED]","NgayTao":"2026-10-09T13:01:54.142Z","TrangThai":"Hoạt động","VaiTroID":2,"MaVaiTro":"QUAN_LY_RAP","TenVaiTro":"Quản lý rạp","DiemTichLuy":null},{"NguoiDungID":2,"HoTen":"Nguyễn Văn Quản Lý 1","Email":"[REDACTED]","SoDienThoai":"[REDACTED]","NgayTao":"2026-01-04T17:00:00.000Z","TrangThai":"Hoạt động","VaiTroID":2,"MaVaiTro":"QUAN_LY_RAP","TenVaiTro":"Quản lý rạp","DiemTichLuy":n… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e159"></a>

### E159 — R6.9-admin-009

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/8`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/users. **Input:** {"name":"R6C-63693a49","email":"[REDACTED]","password":"[REDACTED]","roleId":2}. **Expected:** {"http":409,"code":"EMAIL_ALREADY_EXISTS","persisted":"unchanged"}. **Actual:** {"error":{"code":"EMAIL_ALREADY_EXISTS","message":"This email already exists."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e160"></a>

### E160 — R6.9-admin-010

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/9`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/users. **Input:** {"name":"R6C-63693a49","email":"[REDACTED]","password":"[REDACTED]","roleId":2147483647}. **Expected:** {"http":400,"code":"INVALID_REFERENCE","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REFERENCE","message":"The request references data that does not exist or is not allowed."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e161"></a>

### E161 — R6.9-admin-013

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/12`. **UC:** ADM-02. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/users/15/status. **Input:** {"status":"Bị khóa"}. **Expected:** {"http":200}. **Actual:** {"user":{"NguoiDungID":15,"HoTen":"R6C-63693a49","Email":"[REDACTED]","TrangThai":"Bị khóa"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e162"></a>

### E162 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/4`. **UC:** ADM-03. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/roles; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /24](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /22](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /23](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e163"></a>

### E163 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/6`. **UC:** ADM-03. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/roles; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /20](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /18](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /19](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 21](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e164"></a>

### E164 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/7`. **UC:** ADM-03. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/roles/:roleId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /27](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /25](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /26](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /28](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e165"></a>

### E165 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/8`. **UC:** ADM-03. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/roles/:roleId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":409,"code":"ROLE_IN_USE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /56](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /48](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /49](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /50](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e166"></a>

### E166 — R6.9-admin-018

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/17`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/roles. **Input:** {"code":"R6C-63693a49","name":"R6C-63693a49","description":"owned role"}. **Expected:** {"http":200}. **Actual:** {"role":{"VaiTroID":8,"MaVaiTro":"R6C-63693a49","TenVaiTro":"R6C-63693a49","MoTa":"owned role"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e167"></a>

### E167 — R6.9-admin-019

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/18`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/roles. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"code is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e168"></a>

### E168 — R6.9-admin-022

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/21`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/roles. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"roles":[{"VaiTroID":1,"MaVaiTro":"ADMIN","TenVaiTro":"Quản trị viên","MoTa":"Toàn quyền quản trị hệ thống, tài khoản, cấu hình và báo cáo"},{"VaiTroID":2,"MaVaiTro":"QUAN_LY_RAP","TenVaiTro":"Quản lý rạp","MoTa":"Quản lý phòng chiếu, ghế, suất chiếu và giá vé trong phạm vi rạp được phân công"},{"VaiTroID":3,"MaVaiTro":"CSKH","TenVaiTro":"Chăm sóc khách hàng","MoTa":"Tiếp nhận, tra cứu và xử lý khiếu nại của khách hàng"},{"VaiTroID":4,"MaVaiTro":"KHACH_HANG","TenVaiTro":"Khá… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e169"></a>

### E169 — R6.9-admin-025

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/24`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/roles/8. **Input:** {"name":"R6C-63693a49 edit","description":"edit"}. **Expected:** {"http":200}. **Actual:** {"role":{"VaiTroID":8,"MaVaiTro":"R6C-63693a49","TenVaiTro":"R6C-63693a49 edit","MoTa":"edit"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e170"></a>

### E170 — R6.9-admin-026

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/25`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/roles/8. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e171"></a>

### E171 — R6.9-admin-048

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/47`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/roles/8. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":409,"code":"ROLE_IN_USE","persisted":"unchanged"}. **Actual:** {"error":{"code":"ROLE_IN_USE","message":"A role assigned to users or permissions cannot be deleted."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e172"></a>

### E172 — R6.9-admin-054

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/53`. **UC:** ADM-03. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/roles/8. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa vai trò."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e173"></a>

### E173 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/9`. **UC:** ADM-04. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/permissions; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /35](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /33](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /34](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e174"></a>

### E174 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/10`. **UC:** ADM-04. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/permissions; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"PERMISSION_CODE_EXISTS"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /31](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /29](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /30](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /32](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /40](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e175"></a>

### E175 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/11`. **UC:** ADM-04. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/permissions/:permissionId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /38](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /36](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /37](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /39](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e176"></a>

### E176 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/12`. **UC:** ADM-04. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/permissions/:permissionId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":409,"code":"PERMISSION_IN_USE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /55](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /51](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /52](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /53](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e177"></a>

### E177 — R6.9-admin-029

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/28`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/permissions. **Input:** {"code":"R6C-63693a49","name":"R6C-63693a49","description":"owned permission"}. **Expected:** {"http":200}. **Actual:** {"permission":{"QuyenID":27,"MaQuyen":"R6C-63693a49","TenQuyen":"R6C-63693a49","MoTa":"owned permission"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e178"></a>

### E178 — R6.9-admin-030

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/29`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/permissions. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"code is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e179"></a>

### E179 — R6.9-admin-033

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/32`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/permissions. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"permissions":[{"QuyenID":4,"MaQuyen":"DANH_GIA","TenQuyen":"Đánh giá phim đã xem","MoTa":"Gửi số sao và nhận xét cho phim đã xem"},{"QuyenID":2,"MaQuyen":"DAT_VE","TenQuyen":"Đặt vé xem phim","MoTa":"Chọn ghế, áp dụng khuyến mãi, tạo đơn đặt vé"},{"QuyenID":5,"MaQuyen":"GUI_KHIEU_NAI","TenQuyen":"Gửi khiếu nại","MoTa":"Tạo khiếu nại gửi bộ phận chăm sóc khách hàng"},{"QuyenID":17,"MaQuyen":"PHANCONG_RAP","TenQuyen":"Phân công quản lý rạp","MoTa":"Gán rạp quản lý cho tài kho… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e180"></a>

### E180 — R6.9-admin-036

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/35`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/permissions/27. **Input:** {"name":"R6C-63693a49 edit","description":"edit"}. **Expected:** {"http":200}. **Actual:** {"permission":{"QuyenID":27,"MaQuyen":"R6C-63693a49","TenQuyen":"R6C-63693a49 edit","MoTa":"edit"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e181"></a>

### E181 — R6.9-admin-037

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/36`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/permissions/27. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e182"></a>

### E182 — R6.9-admin-038

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/37`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/permissions. **Input:** {"code":"R6C-63693a49","name":"duplicate"}. **Expected:** {"http":409,"code":"PERMISSION_CODE_EXISTS","persisted":"unchanged"}. **Actual:** {"error":{"code":"PERMISSION_CODE_EXISTS","message":"This permission code already exists."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e183"></a>

### E183 — R6.9-admin-051

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/50`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/permissions/27. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":409,"code":"PERMISSION_IN_USE","persisted":"unchanged"}. **Actual:** {"error":{"code":"PERMISSION_IN_USE","message":"A permission assigned to roles cannot be deleted."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e184"></a>

### E184 — R6.9-admin-053

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/52`. **UC:** ADM-04. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/permissions/27. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa quyền."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e185"></a>

### E185 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/5`. **UC:** ADM-05. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/roles/:roleId/permissions; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /46](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /44](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /45](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e186"></a>

### E186 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/13`. **UC:** ADM-05. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/roles/:roleId/permissions; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REFERENCE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /43](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /54](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /41](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /42](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /47](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e187"></a>

### E187 — R6.9-admin-041

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/40`. **UC:** ADM-05. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/roles/8/permissions. **Input:** {"permissionIds":[27]}. **Expected:** {"http":200}. **Actual:** {"permissions":[{"VaiTroID":8,"QuyenID":27,"MaQuyen":"R6C-63693a49","TenQuyen":"R6C-63693a49 edit"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e188"></a>

### E188 — R6.9-admin-044

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/43`. **UC:** ADM-05. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/roles/8/permissions. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"permissions":[{"VaiTroID":8,"QuyenID":27,"MaQuyen":"R6C-63693a49","TenQuyen":"R6C-63693a49 edit"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e189"></a>

### E189 — R6.9-admin-045

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/44`. **UC:** ADM-05. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/roles/8/permissions. **Input:** {"permissionIds":[2147483647]}. **Expected:** {"http":400,"code":"INVALID_REFERENCE","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REFERENCE","message":"The request references data that does not exist or is not allowed."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e190"></a>

### E190 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/14`. **UC:** ADM-06. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/assignments; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /74](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /78](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /84](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /72](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /73](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e191"></a>

### E191 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/15`. **UC:** ADM-06. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/assignments; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"ASSIGNMENT_DUPLICATE"},{"http":400,"code":"ASSIGNMENT_MANAGER_REQUIRED"},{"http":400,"code":"INVALID_REFERENCE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /70](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /68](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /69](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /71](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /75](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /76](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /77](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e192"></a>

### E192 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/16`. **UC:** ADM-06. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/assignments/:assignmentId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /82](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /80](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /81](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /83](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e193"></a>

### E193 — R6.9-admin-068

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/67`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/assignments. **Input:** {"userId":15,"cinemaId":18,"startsOn":"2026-10-09","endsOn":null}. **Expected:** {"http":200}. **Actual:** {"assignment":{"PhanCongID":20,"NguoiDungID":15,"HoTen":"R6C-63693a49","RapID":18,"TenRap":"R6C-63693a49 edit","NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Hiệu lực"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e194"></a>

### E194 — R6.9-admin-069

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/68`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/assignments. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"userId is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e195"></a>

### E195 — R6.9-admin-072

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/71`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/assignments?cinemaId=18&userId=15. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"assignments":[{"PhanCongID":20,"NguoiDungID":15,"TenQuanLy":"R6C-63693a49","Email":"[REDACTED]","RapID":18,"TenRap":"R6C-63693a49 edit","ThanhPho":"HCM","NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Hiệu lực"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e196"></a>

### E196 — R6.9-admin-073

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/72`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/assignments. **Input:** {"userId":15,"cinemaId":18,"startsOn":"2026-10-09","endsOn":null}. **Expected:** {"http":409,"code":"ASSIGNMENT_DUPLICATE","persisted":"unchanged"}. **Actual:** {"error":{"code":"ASSIGNMENT_DUPLICATE","message":"An identical assignment already exists."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e197"></a>

### E197 — R6.9-admin-074

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/73`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/assignments. **Input:** {"userId":1,"cinemaId":18,"startsOn":"2026-10-09","endsOn":null}. **Expected:** {"http":400,"code":"ASSIGNMENT_MANAGER_REQUIRED","persisted":"unchanged"}. **Actual:** {"error":{"code":"ASSIGNMENT_MANAGER_REQUIRED","message":"The assigned user must have the manager role."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e198"></a>

### E198 — R6.9-admin-075

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/74`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/assignments. **Input:** {"userId":15,"cinemaId":2147483647,"startsOn":"2026-10-09","endsOn":null}. **Expected:** {"http":400,"code":"INVALID_REFERENCE","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REFERENCE","message":"The request references data that does not exist or is not allowed."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e199"></a>

### E199 — R6.9-admin-076

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/75`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/assignments?userId=15. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"assignments":[{"PhanCongID":20,"NguoiDungID":15,"TenQuanLy":"R6C-63693a49","Email":"[REDACTED]","RapID":18,"TenRap":"R6C-63693a49 edit","ThanhPho":"HCM","NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Hiệu lực"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e200"></a>

### E200 — R6.9-admin-079

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/78`. **UC:** ADM-06. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/assignments/20. **Input:** {"userId":15,"cinemaId":18,"startsOn":"2026-10-09","endsOn":null,"status":"Đã hủy"}. **Expected:** {"http":200}. **Actual:** {"assignment":{"PhanCongID":20,"NguoiDungID":15,"TenQuanLy":"R6C-63693a49","Email":"[REDACTED]","RapID":18,"TenRap":"R6C-63693a49 edit","NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Đã hủy"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e201"></a>

### E201 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/17`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/cinemas; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /63](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /61](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /62](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e202"></a>

### E202 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/18`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/cinemas; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /59](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /57](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /58](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /60](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e203"></a>

### E203 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/19`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/cinemas/:cinemaId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /66](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /64](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /65](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /67](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e204"></a>

### E204 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/20`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/cinemas/:cinemaId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":409,"code":"CINEMA_HAS_DEPENDENCIES"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /254](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /247](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /248](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /249](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e205"></a>

### E205 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/21`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/cinemas/:cinemaId/images; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /94](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /92](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /93](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e206"></a>

### E206 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/22`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/cinemas/:cinemaId/images; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[201,201],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /88](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /90](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /86](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /87](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /89](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /91](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e207"></a>

### E207 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/23`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/cinemas/:cinemaId/images/:imageId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /97](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /95](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /96](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /98](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e208"></a>

### E208 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/24`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/cinemas/:cinemaId/images/:imageId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /105](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /106](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /103](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /104](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e209"></a>

### E209 — PATCH

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/25`. **UC:** ADM-07. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PATCH. **Input:** PATCH /api/admin/cinemas/:cinemaId/images/:imageId/cover; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /101](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /99](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /100](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /102](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e210"></a>

### E210 — R6.9-admin-057

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/56`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/cinemas. **Input:** {"name":"R6C-63693a49","address":"Fixture","city":"HCM"}. **Expected:** {"http":200}. **Actual:** {"cinema":{"RapID":18,"TenRap":"R6C-63693a49","DiaChi":"Fixture","ThanhPho":"HCM","SoDienThoai":"[REDACTED]","MoTa":null,"NgayHoatDong":null,"TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e211"></a>

### E211 — R6.9-admin-058

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/57`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/cinemas. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e212"></a>

### E212 — R6.9-admin-061

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/60`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/cinemas. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"cinemas":[{"RapID":3,"TenRap":"Cinema Star Times City","DiaChi":"458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng","ThanhPho":"Hà Nội","SoDienThoai":"[REDACTED]","MoTa":"Cụm rạp tiêu chuẩn quốc tế lớn nhất miền Bắc","NgayHoatDong":"2024-03-01","TrangThai":"Hoạt động"},{"RapID":18,"TenRap":"R6C-63693a49","DiaChi":"Fixture","ThanhPho":"HCM","SoDienThoai":"[REDACTED]","MoTa":null,"NgayHoatDong":null,"TrangThai":"Hoạt động"},{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","DiaChi":"123 Hai… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e213"></a>

### E213 — R6.9-admin-064

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/63`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/cinemas/18. **Input:** {"name":"R6C-63693a49 edit","address":"Edited","city":"HCM","status":"Hoạt động"}. **Expected:** {"http":200}. **Actual:** {"cinema":{"RapID":18,"TenRap":"R6C-63693a49 edit","DiaChi":"Edited","ThanhPho":"HCM","SoDienThoai":"[REDACTED]","MoTa":null,"TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e214"></a>

### E214 — R6.9-admin-065

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/64`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/cinemas/18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e215"></a>

### E215 — R6.9-admin-084

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/83`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/cinemas/18/images. **Input:** {"url":"/r6c-image.svg","description":"owned image","displayOrder":1,"status":"Hoạt động","cover":true}. **Expected:** {"http":201}. **Actual:** {"image":{"HinhAnhRapID":10,"RapID":18,"URL":"/r6c-image.svg","MoTa":"owned image","LaAnhDaiDien":true,"ThuTuHienThi":1,"TrangThai":"Hoạt động","NgayTao":"2026-10-09T13:02:07.936Z"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e216"></a>

### E216 — R6.9-admin-085

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/84`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/cinemas/18/images. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"url is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e217"></a>

### E217 — R6.9-admin-087

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/86`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/cinemas/18/images. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"url is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e218"></a>

### E218 — R6.9-admin-090

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/89`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/cinemas/18/images. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"images":[{"HinhAnhRapID":10,"RapID":18,"URL":"/r6c-image.svg","MoTa":"owned image","LaAnhDaiDien":true,"ThuTuHienThi":1,"TrangThai":"Hoạt động","NgayTao":"2026-10-09T13:02:07.936Z"},{"HinhAnhRapID":11,"RapID":18,"URL":"/r6c-image.svg","MoTa":"owned image","LaAnhDaiDien":false,"ThuTuHienThi":2,"TrangThai":"Hoạt động","NgayTao":"2026-10-09T13:02:08.281Z"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e219"></a>

### E219 — R6.9-admin-093

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/92`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/cinemas/18/images/10. **Input:** {"url":"/r6c-image.svg","description":"updated","displayOrder":1,"status":"Hoạt động"}. **Expected:** {"http":200}. **Actual:** {"image":{"HinhAnhRapID":10,"RapID":18,"URL":"/r6c-image.svg","MoTa":"updated","LaAnhDaiDien":true,"ThuTuHienThi":1,"TrangThai":"Hoạt động","NgayTao":"2026-10-09T13:02:07.936Z"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e220"></a>

### E220 — R6.9-admin-097

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/96`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PATCH /admin/cinemas/18/images/11/cover. **Input:** {"cover":true}. **Expected:** {"http":200}. **Actual:** {"image":{"HinhAnhRapID":11,"RapID":18,"URL":"/r6c-image.svg","MoTa":"owned image","LaAnhDaiDien":true,"ThuTuHienThi":2,"TrangThai":"Hoạt động","NgayTao":"2026-10-09T13:02:08.281Z"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e221"></a>

### E221 — R6.9-admin-101

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/100`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/cinemas/18/images/10. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa ảnh rạp."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e222"></a>

### E222 — R6.9-admin-250

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/249`. **UC:** ADM-07. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/cinemas/18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa rạp."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e223"></a>

### E223 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/26`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/rooms; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /113](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /111](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /112](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e224"></a>

### E224 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/27`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/rooms; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"ROOM_NAME_CONFLICT"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /109](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /107](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /108](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /110](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /118](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e225"></a>

### E225 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/28`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/rooms/:roomId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /116](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /114](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /115](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /117](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e226"></a>

### E226 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/29`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/rooms/:roomId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /246](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /250](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /244](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /245](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e227"></a>

### E227 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/30`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/seats; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive / 125](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /123](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /124](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e228"></a>

### E228 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/31`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/seats; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"SEAT_POSITION_CONFLICT"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /121](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /119](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /120](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /122](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /130](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e229"></a>

### E229 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/32`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/seats/:seatId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /128](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /126](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /127](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /129](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e230"></a>

### E230 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/33`. **UC:** ADM-08. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/seats/:seatId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /133](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /131](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /132](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e231"></a>

### E231 — R6.9-admin-105

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/104`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/rooms. **Input:** {"cinemaId":18,"name":"R6C-63693a49","type":"2D"}. **Expected:** {"http":200}. **Actual:** {"room":{"PhongID":21,"RapID":18,"TenPhong":"R6C-63693a49","LoaiPhong":"2D","TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e232"></a>

### E232 — R6.9-admin-106

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/105`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/rooms. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"cinemaId is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e233"></a>

### E233 — R6.9-admin-109

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/108`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/rooms?cinemaId=18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"rooms":[{"PhongID":21,"RapID":18,"TenRap":"R6C-63693a49 edit","TenPhong":"R6C-63693a49","LoaiPhong":"2D","TrangThai":"Hoạt động","TongSoGhe":0}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e234"></a>

### E234 — R6.9-admin-112

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/111`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/rooms/ 21. **Input:** {"name":"R6C-63693a49 edit","type":"2D","status":"Hoạt động"}. **Expected:** {"http":200}. **Actual:** {"room":{"PhongID":21,"RapID":18,"TenPhong":"R6C-63693a49 edit","LoaiPhong":"2D","TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e235"></a>

### E235 — R6.9-admin-113

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/112`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/rooms/ 21. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e236"></a>

### E236 — R6.9-admin-114

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/113`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/rooms. **Input:** {"cinemaId":18,"name":"R6C-63693a49 edit","type":"2D"}. **Expected:** {"http":409,"code":"ROOM_NAME_CONFLICT","persisted":"unchanged"}. **Actual:** {"error":{"code":"ROOM_NAME_CONFLICT","message":"This room name already exists in the cinema."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e237"></a>

### E237 — R6.9-admin-117

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/116`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/seats. **Input:** {"roomId":21,"row":"A","number":1,"type":"Thường"}. **Expected:** {"http":200}. **Actual:** {"seat":{"GheID":288,"PhongID":21,"HangGhe":"A","SoGhe":1,"LoaiGhe":"Thường","TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e238"></a>

### E238 — R6.9-admin-118

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/117`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/seats. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"roomId is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e239"></a>

### E239 — R6.9-admin-121

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/120`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/seats?roomId=21. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"seats":[{"GheID":288,"PhongID":21,"RapID":18,"TenRap":"R6C-63693a49 edit","HangGhe":"A","SoGhe":1,"TenGhe":"A1","LoaiGhe":"Thường","TrangThai":"Hoạt động"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e240"></a>

### E240 — R6.9-admin-124

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/123`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/seats/288. **Input:** {"type":"VIP","status":"Bảo trì"}. **Expected:** {"http":200}. **Actual:** {"seat":{"GheID":288,"PhongID":21,"HangGhe":"A","SoGhe":1,"LoaiGhe":"VIP","TrangThai":"Bảo trì"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e241"></a>

### E241 — R6.9-admin-129

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/128`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/seats/288. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa ghế."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e242"></a>

### E242 — R6.9-admin-242

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/241`. **UC:** ADM-08. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/rooms/ 21. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"PhongID":21,"Deleted":false,"Deactivated":true,"TrangThai":"Ngưng hoạt động","Message":"Phòng có lịch sử suất chiếu đã chuyển sang Ngưng hoạt động."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e243"></a>

### E243 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/41`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/movies; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /162](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /4](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /7](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /10](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /13](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /16](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /19](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /22](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /25](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /28](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /31](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /34](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /37](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /40](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /43](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /46](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /49](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /52](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /55](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /58](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /160](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /161](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e244"></a>

### E244 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/42`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/movies; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[201],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /158](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /156](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /157](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /159](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e245"></a>

### E245 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/43`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/movies/:movieId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REFERENCE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /165](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /163](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /164](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /166](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /167](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e246"></a>

### E246 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/44`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/movies/:movieId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":409,"code":"MOVIE_HAS_DEPENDENCIES"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /251](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /194](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /195](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /196](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e247"></a>

### E247 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/45`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/movies/:movieId/actors; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":404,"code":"ACTOR_NOT_FOUND"},{"http":404,"code":"ACTOR_NOT_FOUND"},{"http":404,"code":"ACTOR_NOT_FOUND"},{"http":400,"code":"MOVIE_CAST_INVALID"},{"http":404,"code":"MOVIE_NOT_FOUND"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /170](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /2](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [positive /56](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /168](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /169](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /171](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /5](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /8](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /11](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /14](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /17](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /20](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /23](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /26](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /29](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /32](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /35](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /38](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /41](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /44](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /47](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /50](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>); [negative /53](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-api/http-trace.json>)


<a id="evidence-e248"></a>

### E248 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/50`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/actors; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /151](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /149](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /150](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e249"></a>

### E249 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/51`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/actors; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /147](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /145](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /146](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /148](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e250"></a>

### E250 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/52`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/actors/:actorId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /154](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /152](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /153](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /155](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e251"></a>

### E251 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/53`. **UC:** ADM-09. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/actors/:actorId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":409,"code":"ACTOR_IN_USE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /252](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /172](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /173](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /174](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e252"></a>

### E252 — R6.9-admin-143

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/142`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/actors. **Input:** {"name":"R6C-63693a49","birthDate":"1990-01-01","nationality":"VN"}. **Expected:** {"http":200}. **Actual:** {"actor":{"DienVienID":38,"HoTen":"R6C-63693a49","NgaySinh":"1990-01-01","QuocTich":"VN"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e253"></a>

### E253 — R6.9-admin-144

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/143`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/actors. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e254"></a>

### E254 — R6.9-admin-147

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/146`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/actors. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"actors":[{"DienVienID":2,"HoTen":"Cillian Murphy","NgaySinh":"1976-05-25","QuocTich":"Ireland"},{"DienVienID":3,"HoTen":"Margot Robbie","NgaySinh":"1990-07-02","QuocTich":"Úc"},{"DienVienID":5,"HoTen":"Phương Anh Đào","NgaySinh":"1992-04-30","QuocTich":"Việt Nam"},{"DienVienID":38,"HoTen":"R6C-63693a49","NgaySinh":"1990-01-01","QuocTich":"VN"},{"DienVienID":1,"HoTen":"Tom Cruise","NgaySinh":"1962-07-03","QuocTich":"Mỹ"},{"DienVienID":6,"HoTen":"Tuấn Trần","NgaySinh":"1992-1… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e255"></a>

### E255 — R6.9-admin-150

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/149`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/actors/38. **Input:** {"name":"R6C-63693a49 edit","birthDate":"1991-01-01","nationality":"VN"}. **Expected:** {"http":200}. **Actual:** {"actor":{"DienVienID":38,"HoTen":"R6C-63693a49 edit","NgaySinh":"1991-01-01","QuocTich":"VN"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e256"></a>

### E256 — R6.9-admin-151

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/150`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/actors/38. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e257"></a>

### E257 — R6.9-admin-154

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/153`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/movies. **Input:** {"title":"R6C-63693a49","durationMinutes":60,"releaseDate":"2026-10-09","endDate":"2026-10-20","language":"Việt","ageRating":"P","genreIds":[11]}. **Expected:** {"http":201}. **Actual:** {"movie":{"movieId":34,"detail":[{"PhimID":34,"TenPhim":"R6C-63693a49","ThoiLuong":60,"NgayKhoiChieu":"2026-10-09","NgayKetThuc":"2026-10-20","NgonNgu":"Việt","PhuDe":null,"DoTuoi":"P","DaoDien":null,"MoTa":null,"PosterURL":null,"TrailerURL":null,"TrangThai":"Đang chiếu","DiemDanhGiaTrungBinh":0,"SoLuotDanhGia":0}]}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e258"></a>

### E258 — R6.9-admin-155

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/154`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/movies. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"title is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e259"></a>

### E259 — R6.9-admin-158

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/157`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/movies?genreId=11. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"movies":[{"PhimID":34,"TenPhim":"R6C-63693a49","ThoiLuong":60,"NgayKhoiChieu":"2026-10-09","NgayKetThuc":"2026-10-20","NgonNgu":"Việt","PhuDe":null,"DoTuoi":"P","DaoDien":null,"MoTa":null,"PosterURL":null,"TrailerURL":null,"TrangThai":"Đang chiếu","TheLoaiIdList":"11","DanhSachDienVienJson":null}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e260"></a>

### E260 — R6.9-admin-161

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/160`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/movies/34. **Input:** {"title":"R6C-63693a49 edit","durationMinutes":60,"releaseDate":"2026-10-09","endDate":"2026-10-20","language":"Việt","ageRating":"P","genreIds":[11],"status":"Đang chiếu"}. **Expected:** {"http":200}. **Actual:** {"movie":{"recordsets":[[{"PhimID":34,"TenPhim":"R6C-63693a49 edit","ThoiLuong":60,"NgayKhoiChieu":"2026-10-09","NgayKetThuc":"2026-10-20","NgonNgu":"Việt","PhuDe":null,"DoTuoi":"P","DaoDien":null,"MoTa":null,"PosterURL":null,"TrailerURL":null,"TrangThai":"Đang chiếu","DiemDanhGiaTrungBinh":0,"SoLuotDanhGia":0}],[{"TheLoaiID":11,"TenTheLoai":"R6C-63693a49 edit"}],[],[]],"recordset":[{"PhimID":34,"TenPhim":"R6C-63693a49 edit","ThoiLuong":60,"NgayKhoiChieu":"2026-10-09","NgayKe… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e261"></a>

### E261 — R6.9-admin-162

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/161`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/movies/34. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"title is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e262"></a>

### E262 — R6.9-admin-166

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/165`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/movies/34/actors. **Input:** {"cast":[{"actorId":38,"role":"Lead"}]}. **Expected:** {"http":200}. **Actual:** {"actors":[{"PhimID":34,"DienVienID":38,"HoTen":"R6C-63693a49 edit","VaiDien":"Lead"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e263"></a>

### E263 — R6.9-admin-247

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/246`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/movies/34. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa phim."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e264"></a>

### E264 — R6.9-admin-248

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/247`. **UC:** ADM-09. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/actors/38. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa diễn viên."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e265"></a>

### E265 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/46`. **UC:** ADM-10. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/genres; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /140](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /138](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /139](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e266"></a>

### E266 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/47`. **UC:** ADM-10. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/genres; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /136](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /134](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /135](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /137](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e267"></a>

### E267 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/48`. **UC:** ADM-10. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/genres/:genreId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /143](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /141](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /142](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /144](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e268"></a>

### E268 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/49`. **UC:** ADM-10. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/genres/:genreId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":409,"code":"GENRE_IN_USE"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /253](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /175](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /176](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /177](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e269"></a>

### E269 — R6.9-admin-132

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/131`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/genres. **Input:** {"name":"R6C-63693a49"}. **Expected:** {"http":200}. **Actual:** {"genre":{"TheLoaiID":11,"TenTheLoai":"R6C-63693a49"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e270"></a>

### E270 — R6.9-admin-133

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/132`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/genres. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e271"></a>

### E271 — R6.9-admin-136

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/135`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/genres. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"genres":[{"TheLoaiID":4,"TenTheLoai":"Hài kịch"},{"TheLoaiID":1,"TenTheLoai":"Hành động"},{"TheLoaiID":5,"TenTheLoai":"Hoạt hình"},{"TheLoaiID":3,"TenTheLoai":"Kinh dị"},{"TheLoaiID":2,"TenTheLoai":"Khoa học viễn tưởng"},{"TheLoaiID":11,"TenTheLoai":"R6C-63693a49"},{"TheLoaiID":7,"TenTheLoai":"Tâm lý - Kịch tính"},{"TheLoaiID":6,"TenTheLoai":"Tình cảm"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e272"></a>

### E272 — R6.9-admin-139

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/138`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/genres/11. **Input:** {"name":"R6C-63693a49 edit"}. **Expected:** {"http":200}. **Actual:** {"genre":{"TheLoaiID":11,"TenTheLoai":"R6C-63693a49 edit"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e273"></a>

### E273 — R6.9-admin-140

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/139`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/genres/11. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e274"></a>

### E274 — R6.9-admin-173

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/172`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/genres/11. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":409,"code":"GENRE_IN_USE","persisted":"unchanged"}. **Actual:** {"error":{"code":"GENRE_IN_USE","message":"A genre assigned to movies cannot be deleted."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e275"></a>

### E275 — R6.9-admin-249

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/248`. **UC:** ADM-10. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/genres/11. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa thể loại."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e276"></a>

### E276 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/54`. **UC:** ADM-11. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/products; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive / 215](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 213](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 214](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e277"></a>

### E277 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/55`. **UC:** ADM-11. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/products; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[201],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive / 211](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /209](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 210](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 212](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e278"></a>

### E278 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/56`. **UC:** ADM-11. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/products/:productId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive / 218](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 216](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 217](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative / 219](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e279"></a>

### E279 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/57`. **UC:** ADM-11. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/products/:productId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /222](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /220](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /221](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e280"></a>

### E280 — R6.9-admin-207

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/206`. **UC:** ADM-11. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/products. **Input:** {"name":"R6C-63693a49","type":"Snack","price":10000,"image":"/r6c-snack.svg"}. **Expected:** {"http":201}. **Actual:** {"product":{"SanPhamID":20,"TenSanPham":"R6C-63693a49","LoaiSanPham":"Snack","Gia":10000,"MoTa":null,"HinhAnh":"/r6c-snack.svg","TrangThai":"Đang bán"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e281"></a>

### E281 — R6.9-admin-208

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/207`. **UC:** ADM-11. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/products. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e282"></a>

### E282 — R6.9-admin-211

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/210`. **UC:** ADM-11. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/products. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"products":[{"SanPhamID":2,"TenSanPham":"Bắp rang bơ Caramel vừa","LoaiSanPham":"Bắp rang","Gia":40000,"MoTa":"Vị ngọt ngào của sốt caramel truyền thống","HinhAnh":"https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400","TrangThai":"Đang bán"},{"SanPhamID":1,"TenSanPham":"Bắp rang bơ phô mai lớn","LoaiSanPham":"Bắp rang","Gia":45000,"MoTa":"Bắp ngô nở đều phủ ngập phô mai cheddar thơm lừng","HinhAnh":"https://images.unsplash.com/photo-1578849278619-e73505e9610f?… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e283"></a>

### E283 — R6.9-admin-214

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/213`. **UC:** ADM-11. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/products/20. **Input:** {"name":"R6C-63693a49","type":"Snack","price":20000,"image":"/r6c-snack.svg","status":"Đang bán"}. **Expected:** {"http":200}. **Actual:** {"product":{"SanPhamID":20,"TenSanPham":"R6C-63693a49","LoaiSanPham":"Snack","Gia":20000,"MoTa":null,"HinhAnh":"/r6c-snack.svg","TrangThai":"Đang bán"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e284"></a>

### E284 — R6.9-admin-215

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/214`. **UC:** ADM-11. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/products/20. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"name is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e285"></a>

### E285 — R6.9-admin-218

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/217`. **UC:** ADM-11. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/products/20. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa sản phẩm."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e286"></a>

### E286 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/58`. **UC:** ADM-12. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/promotions; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /229](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /227](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /228](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e287"></a>

### E287 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/59`. **UC:** ADM-12. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/promotions; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[201],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /225](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /223](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /224](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /226](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /234](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e288"></a>

### E288 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/60`. **UC:** ADM-12. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/promotions/:promotionId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /232](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /230](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /231](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /233](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e289"></a>

### E289 — DELETE

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/61`. **UC:** ADM-12. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE. **Input:** DELETE /api/admin/promotions/:promotionId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /237](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /235](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /236](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e290"></a>

### E290 — R6.9-admin-221

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/220`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/promotions. **Input:** {"code":"R6C-63693a49","description":"owned promo","discountType":"Phần trăm","discountValue":10,"minimumOrder":0,"maximumDiscount":10000,"startsAt":"2026-10-19T13:01:53.481Z","endsAt":"2026-10-20T13:01:53.481Z","quantity":10}. **Expected:** {"http":201}. **Actual:** {"promotion":{"KhuyenMaiID":18,"MaCode":"R6C-63693a49","MoTa":"owned promo","LoaiGiamGia":"Phần trăm","GiaTriGiam":10,"DonHangToiThieu":0,"GiamToiDa":10000,"NgayBatDau":"2026-10-19T13:01:53.481Z","NgayKetThuc":"2026-10-20T13:01:53.481Z","SoLuong":10,"SoLuongDaDung":0,"TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e291"></a>

### E291 — R6.9-admin-222

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/221`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/promotions. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"discountType is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e292"></a>

### E292 — R6.9-admin-225

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/224`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/promotions. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"promotions":[{"KhuyenMaiID":18,"MaCode":"R6C-63693a49","MoTa":"owned promo","LoaiGiamGia":"Phần trăm","GiaTriGiam":10,"DonHangToiThieu":0,"GiamToiDa":10000,"NgayBatDau":"2026-10-19T13:01:53.481Z","NgayKetThuc":"2026-10-20T13:01:53.481Z","SoLuong":10,"SoLuongDaDung":0,"TrangThai":"Hoạt động"},{"KhuyenMaiID":1,"MaCode":"CHAOBANMOI","MoTa":"Giảm 10% cho khách hàng mới","LoaiGiamGia":"Phần trăm","GiaTriGiam":10,"DonHangToiThieu":100000,"GiamToiDa":50000,"NgayBatDau":"2026-09-08… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e293"></a>

### E293 — R6.9-admin-228

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/227`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/promotions/18. **Input:** {"description":"owned promo","discountType":"Phần trăm","discountValue":20,"minimumOrder":0,"maximumDiscount":10000,"startsAt":"2026-10-19T13:01:53.481Z","endsAt":"2026-10-20T13:01:53.481Z","quantity":10,"status":"Hoạt động"}. **Expected:** {"http":200}. **Actual:** {"promotion":{"KhuyenMaiID":18,"MaCode":"R6C-63693a49","MoTa":"owned promo","LoaiGiamGia":"Phần trăm","GiaTriGiam":20,"DonHangToiThieu":0,"GiamToiDa":10000,"NgayBatDau":"2026-10-19T13:01:53.481Z","NgayKetThuc":"2026-10-20T13:01:53.481Z","SoLuong":10,"SoLuongDaDung":0,"TrangThai":"Hoạt động"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e294"></a>

### E294 — R6.9-admin-229

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/228`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/promotions/18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"discountType is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e295"></a>

### E295 — R6.9-admin-230

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/229`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/promotions. **Input:** {"code":"R6C-63693a49bad","description":"owned promo","discountType":"Phần trăm","discountValue":100,"minimumOrder":0,"maximumDiscount":10000,"startsAt":"2026-10-19T13:01:53.481Z","endsAt":"2026-10-20T13:01:53.481Z","quantity":10}. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"A percent discount must be greater than 0 and at most 99."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e296"></a>

### E296 — R6.9-admin-233

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/232`. **UC:** ADM-12. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** DELETE /admin/promotions/18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Đã xóa khuyến mãi."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e297"></a>

### E297 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/34`. **UC:** ADM-13. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/pricing; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200,200,200,200,200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /203](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /14](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /16](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /18](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /20](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /22](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /24](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /26](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /28](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /53](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /201](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /202](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e298"></a>

### E298 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/35`. **UC:** ADM-13. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/pricing; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /199](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /197](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /198](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /200](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /208](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e299"></a>

### E299 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/36`. **UC:** ADM-13. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/pricing/:pricingId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200,200,200,200,200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"PRICING_OVERLAP"},{"http":409,"code":"PRICING_OVERLAP"},{"http":409,"code":"PRICING_OVERLAP"},{"http":409,"code":"PRICING_OVERLAP"},{"http":409,"code":"PRICING_OVERLAP"},{"http":500,"code":"EREQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":40… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /206](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /13](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /15](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /17](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /19](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive / 21](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /23](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /25](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /27](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /52](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /204](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /205](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /207](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /4](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /5](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /6](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /7](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /8](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /9](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /29](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /30](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /31](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /32](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /33](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /34](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /35](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /36](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /37](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /38](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /39](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /40](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /41](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /42](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /43](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /44](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /45](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /46](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /47](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /48](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /49](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [negative /50](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>)


<a id="evidence-e300"></a>

### E300 — R6.9-admin-195

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/194`. **UC:** ADM-13. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/pricing. **Input:** {"cinemaId":18,"seatType":"VIP","dayType":"Cuối tuần","format":"2D","surcharge":15000,"startsOn":"2026-10-09","endsOn":null}. **Expected:** {"http":200}. **Actual:** {"pricing":{"GiaID":36,"RapID":18,"LoaiGhe":"VIP","LoaiNgay":"Cuối tuần","DinhDang":"2D","PhuThu":15000,"NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Áp dụng"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e301"></a>

### E301 — R6.9-admin-196

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/195`. **UC:** ADM-13. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/pricing. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"cinemaId is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e302"></a>

### E302 — R6.9-admin-199

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/198`. **UC:** ADM-13. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/pricing?cinemaId=18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"pricing":[{"GiaID":36,"RapID":18,"TenRap":"R6C-63693a49 edit","LoaiGhe":"VIP","LoaiNgay":"Cuối tuần","DinhDang":"2D","PhuThu":15000,"NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Áp dụng"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e303"></a>

### E303 — R6.9-admin-202

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/201`. **UC:** ADM-13. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/pricing/36. **Input:** {"surcharge":20000,"status":"Áp dụng"}. **Expected:** {"http":200}. **Actual:** {"pricing":{"GiaID":36,"RapID":18,"LoaiGhe":"VIP","LoaiNgay":"Cuối tuần","DinhDang":"2D","PhuThu":20000,"NgayBatDau":"2026-10-09","NgayKetThuc":null,"TrangThai":"Áp dụng"}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e304"></a>

### E304 — R6.9-admin-203

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/202`. **UC:** ADM-13. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/pricing/36. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"surcharge is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e305"></a>

### E305 — R6.9-admin-204

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/203`. **UC:** ADM-13. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/pricing. **Input:** {"cinemaId":18,"seatType":"VIP","dayType":"Ngày lễ","format":"2D","surcharge":15000,"startsOn":"2026-10-09","endsOn":null}. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"dayType is not supported by the database contract."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e306"></a>

### E306 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/37`. **UC:** ADM-14. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/showtimes; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /184](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /182](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /183](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e307"></a>

### E307 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/38`. **UC:** ADM-14. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/showtimes; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"},{"http":409,"code":"SHOWTIME_OVERLAP"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /180](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /178](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /179](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /181](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /189](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e308"></a>

### E308 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/39`. **UC:** ADM-14. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/showtimes/:showtimeId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":400,"code":"INVALID_REQUEST"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /187](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /185](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /186](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /188](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e309"></a>

### E309 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/40`. **UC:** ADM-14. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/showtimes/:showtimeId/cancel; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":404,"code":"SHOWTIME_NOT_FOUND"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /192](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /190](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /191](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /193](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e310"></a>

### E310 — R6.9-admin-176

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/175`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/showtimes. **Input:** {"movieId":34,"roomId":21,"startsAt":"2026-10-19T13:01:53.481Z","endsAt":"2026-10-19T14:31:53.481Z","format":"2D","basePrice":80000}. **Expected:** {"http":200}. **Actual:** {"showtime":{"recordsets":[[{"SuatChieuID":47,"PhimID":34,"TenPhim":"R6C-63693a49 edit","PosterURL":null,"ThoiLuong":60,"DoTuoi":"P","RapID":18,"TenRap":"R6C-63693a49 edit","DiaChiRap":"Edited","ThanhPho":"HCM","PhongID":21,"TenPhong":"R6C-63693a49 edit","LoaiPhong":"2D","ThoiGianBatDau":"2026-10-19T13:01:53.481Z","ThoiGianKetThuc":"2026-10-19T14:31:53.481Z","NgayChieu":"2026-10-19","GioBatDau":"20:01","GioKetThuc":"21:31","DinhDang":"2D","GiaVeCoBan":80000,"TrangThaiSuatChie… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e311"></a>

### E311 — R6.9-admin-177

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/176`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/showtimes. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"movieId is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e312"></a>

### E312 — R6.9-admin-180

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/179`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/showtimes?cinemaId=18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"showtimes":[{"SuatChieuID":47,"PhimID":34,"TenPhim":"R6C-63693a49 edit","PhongID":21,"TenPhong":"R6C-63693a49 edit","RapID":18,"TenRap":"R6C-63693a49 edit","ThoiGianBatDau":"2026-10-19T13:01:53.481Z","ThoiGianKetThuc":"2026-10-19T14:31:53.481Z","DinhDang":"2D","GiaVeCoBan":80000,"TrangThai":"Mở bán"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e313"></a>

### E313 — R6.9-admin-183

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/182`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/showtimes/47. **Input:** {"movieId":34,"startsAt":"2026-10-19T13:01:53.481Z","endsAt":"2026-10-19T14:31:53.481Z","format":"2D","basePrice":90000,"status":"Đóng bán"}. **Expected:** {"http":200}. **Actual:** {"showtime":{"recordsets":[[{"SuatChieuID":47,"PhimID":34,"TenPhim":"R6C-63693a49 edit","PosterURL":null,"ThoiLuong":60,"DoTuoi":"P","RapID":18,"TenRap":"R6C-63693a49 edit","DiaChiRap":"Edited","ThanhPho":"HCM","PhongID":21,"TenPhong":"R6C-63693a49 edit","LoaiPhong":"2D","ThoiGianBatDau":"2026-10-19T13:01:53.481Z","ThoiGianKetThuc":"2026-10-19T14:31:53.481Z","NgayChieu":"2026-10-19","GioBatDau":"20:01","GioKetThuc":"21:31","DinhDang":"2D","GiaVeCoBan":90000,"TrangThaiSuatChie… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e314"></a>

### E314 — R6.9-admin-184

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/183`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** PUT /admin/showtimes/47. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":400,"code":"INVALID_REQUEST","persisted":"unchanged"}. **Actual:** {"error":{"code":"INVALID_REQUEST","message":"movieId is required."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e315"></a>

### E315 — R6.9-admin-185

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/184`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/showtimes. **Input:** {"movieId":34,"roomId":21,"startsAt":"2026-10-19T13:01:53.481Z","endsAt":"2026-10-19T14:31:53.481Z","format":"2D","basePrice":80000}. **Expected:** {"http":409,"code":"SHOWTIME_OVERLAP","persisted":"unchanged"}. **Actual:** {"error":{"code":"SHOWTIME_OVERLAP","message":"The room already has an overlapping showtime."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e316"></a>

### E316 — R6.9-admin-188

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/187`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/showtimes/47/cancel. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"result":{"Message":"Hủy suất chiếu thành công.","SoDonDaHuy":0}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e317"></a>

### E317 — R6.9-admin-189

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/188`. **UC:** ADM-14. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** POST /admin/showtimes/ 2147483647/cancel. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":404,"code":"SHOWTIME_NOT_FOUND","persisted":"unchanged"}. **Actual:** {"error":{"code":"SHOWTIME_NOT_FOUND","message":"Showtime was not found."}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e318"></a>

### E318 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/63`. **UC:** ADM-15. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/complaints; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /10](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /17](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /24](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /31](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /38](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /45](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /52](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /59](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /66](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /73](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /80](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /86](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /92](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /98](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /133](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /140](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /147](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /154](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /25](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>); [negative /26](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>)


<a id="evidence-e319"></a>

### E319 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/64`. **UC:** ADM-15. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/complaints/:complaintId; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /7](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /14](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive / 21](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /28](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /35](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /42](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /49](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /56](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /63](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /70](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /77](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /83](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /89](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /95](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /130](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /137](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /144](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /151](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /27](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>); [negative /28](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>)


<a id="evidence-e320"></a>

### E320 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/65`. **UC:** ADM-15. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/complaints/:complaintId/order-reference; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /157](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /9](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>); [positive /19](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>); [negative /33](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>); [negative /43](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>); [negative /44](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>)


<a id="evidence-e321"></a>

### E321 — POST

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/66`. **UC:** ADM-15. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** POST. **Input:** POST /api/admin/complaints/:complaintId/processings; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200],"negative":[{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"INVALID_REQUEST"},{"http":400,"code":"UNKNOWN_REQUEST_FIELD"},{"http":403,"code":"ADMIN_REQUIRED"},{"http":401,"code":"UNAUTHENTICATED"},{"http":404,"code":"COMPLAINT_NOT_FOUND"},{"http":403,"code":"FORBIDDEN"},{"http":403,"code":"FORBIDDEN"},{"http":500,"code":"EREQUEST"},{"http":403,"code":"ADMIN_REQU… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /40](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /47](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /54](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [positive /61](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /109](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /110](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /111](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /112](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /113](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /114](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /115](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /116](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /124](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /126](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /142](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /34](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>)


<a id="evidence-e322"></a>

### E322 — PUT

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/67`. **UC:** ADM-15. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** PUT. **Input:** PUT /api/admin/complaints/:complaintId/status; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":400,"code":"INVALID_REQUEST"},{"http":403,"code":"FORBIDDEN"},{"http":403,"code":"FORBIDDEN"},{"http":500,"code":"EREQUEST"},{"http":403,"code":"ADMIN_REQUIRED"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /75](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /117](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative / 125](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /127](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /149](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r33-api/http-trace.json>); [negative /35](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/complaint-flow/http-trace.json>)


<a id="evidence-e323"></a>

### E323 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/0`. **UC:** ADM-16. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/dashboard; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"}]}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /243](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /241](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /242](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>)


<a id="evidence-e324"></a>

### E324 — GET

**Artifact:** [admin-operation-coverage.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin-operation-coverage.json>); JSON Pointer `/operations/62`. **UC:** ADM-16. **Class:** AUTH, HTTP_SQL. **Result:** PASS.

**Operation:** GET. **Input:** GET /api/admin/reports/revenue; concrete payloads in selectors below. **Expected:** Positive200/201; wrong role403 ADMIN_REQUIRED + missing grant403 FORBIDDEN; domain400/404/409 và fault-injection500 được đối chiếu exact suite assertion, không phải production defect.. **Actual:** {"positive":[200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200],"negative":[{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"FORBIDDEN"},{"http":401,"code":"UNAUTHENTICATED"},{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"ADMIN_REQUIRED"},{"http":403,"code":"ADMIN_REQUIRED"},{"http":400,"code":"UNKNOWN_QUERY_PARAMETER"},{"http":400,"code":"UNKNOWN_QUERY_PARAMETER"},{"http":400,"code":"UNKNOWN_QUERY_PARAMETER"… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Method/path + typed SP execution, positive and wrong-role/missingpermission traces. [positive /240](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [positive /51](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /54](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/http-trace.json>); [positive /4](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /5](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /6](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /7](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /8](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /9](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /10](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /11](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /12](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /13](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /14](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /15](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /16](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /17](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /18](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /19](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /20](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive / 21](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /22](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /23](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /24](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [positive /36](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /238](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /239](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/http-trace.json>); [negative /25](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /26](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /27](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /28](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /29](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /30](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /31](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /32](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /33](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /34](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>); [negative /35](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/http-trace.json>)


<a id="evidence-e325"></a>

### E325 — R6.9-admin-236

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/235`. **UC:** ADM-16. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/reports/revenue?cinemaId=18. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"summary":{"TongSoDonToanHeThong":0,"TongSoVeBan":0,"TongDoanhThuVe":0,"TongDoanhThuDoAn":0,"TongTienGiam":0,"TongDoanhThuThucTe":0},"byCinema":[{"RapID":18,"TenRap":"R6C-63693a49 edit","ThanhPho":"HCM","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0}],"byMovie":[],"byDate":[],"cinemas":[{"RapID":18,"TenRap":"R6C-63693a49 edit","ThanhPho":"HCM","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0}… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e326"></a>

### E326 — R6.9-admin-239

**Artifact:** [admin.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/admin/admin.json>); JSON Pointer `/cases/238`. **UC:** ADM-16. **Class:** DB_SQL, HTTP_SQL. **Result:** PASS.

**Operation:** GET /admin/dashboard. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"http":200}. **Actual:** {"dashboard":{"TongNguoiDung":9,"TongRap":4,"TongPhongChieu":7,"PhimDangChieu":5,"SuatChieuHomNay":0,"TongDonThanhCong":0,"TongDoanhThuToanThoiGian":0,"KhieuNaiChuaXuLy":0}}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** SQL field/readback/reference/no write assertions in /sql and /before,/after for this exact operation.


<a id="evidence-e327"></a>

### E327 — Cast replacement fault after delete+insert; full rollback preserves old cast (scalar object, not /0).

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r31-sql/sql-tests.json>); JSON Pointer `/rollbackInjection`. **UC:** ADM-09. **Class:** DB_SQL, ROLLBACK. **Result:** PASS.

**Operation:** Cast replacement fault after delete+insert; full rollback preserves old cast (scalar object, not /0).. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** Cast replacement fault after delete+insert; full rollback preserves old cast (scalar object, not /0).. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Cast replacement fault after delete+insert; full rollback preserves old cast (scalar object, not /0).


<a id="evidence-e328"></a>

### E328 — R4.3-01-seatType

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/sql-tests.json>); JSON Pointer `/cases/0`. **UC:** ADM-13. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.. **Input:** {"seatType":"Thường","dayType":"Tất cả","format":"Tất cả","surcharge":15000,"startsOn":"2026-10-18","endsOn":null,"status":"Áp dụng"}. **Expected:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.. **Actual:** {"GiaID":37,"RapID":19,"LoaiGhe":"Thường","LoaiNgay":"Tất cả","DinhDang":"Tất cả","PhuThu":15000,"NgayBatDau":"2026-10-18","NgayKetThuc":null,"TrangThai":"Áp dụng"}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.


<a id="evidence-e329"></a>

### E329 — R4.3-02-dayType

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/sql-tests.json>); JSON Pointer `/cases/1`. **UC:** ADM-13. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.. **Input:** {"seatType":"Thường","dayType":"Cuối tuần","format":"Tất cả","surcharge":15000,"startsOn":"2026-10-18","endsOn":null,"status":"Áp dụng"}. **Expected:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.. **Actual:** {"GiaID":37,"RapID":19,"LoaiGhe":"Thường","LoaiNgay":"Cuối tuần","DinhDang":"Tất cả","PhuThu":15000,"NgayBatDau":"2026-10-18","NgayKetThuc":null,"TrangThai":"Áp dụng"}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.


<a id="evidence-e330"></a>

### E330 — R4.3-03-format

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r43-pricing/sql-tests.json>); JSON Pointer `/cases/2`. **UC:** ADM-13. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.. **Input:** {"seatType":"Thường","dayType":"Cuối tuần","format":"IMAX","surcharge":15000,"startsOn":"2026-10-18","endsOn":null,"status":"Áp dụng"}. **Expected:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.. **Actual:** {"GiaID":37,"RapID":19,"LoaiGhe":"Thường","LoaiNgay":"Cuối tuần","DinhDang":"IMAX","PhuThu":15000,"NgayBatDau":"2026-10-18","NgayKetThuc":null,"TrangThai":"Áp dụng"}.

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Full pricing condition update; SQL source/rule assertions supplemented by R43 replay.


<a id="evidence-e331"></a>

### E331 — R4.2-01-empty-period

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/0`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[],"summary":{"TongSoDonToanHeThong":0,"TongSoVeBan":0,"TongDoanhThuVe":0,"TongDoanhThuDoAn":0,"TongTienGiam":0,"TongDoanhThuThucTe":0},"cinema":[],"movie":[],"date":[]}. **Actual:** [[{"TongSoDonToanHeThong":0,"TongSoVeBan":0,"TongDoanhThuVe":0,"TongDoanhThuDoAn":0,"TongTienGiam":0,"TongDoanhThuThucTe":0}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"TenRap":"Cinema Sta… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e332"></a>

### E332 — R4.2-02-single-cinema

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/1`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000}],"summary":{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000},"cinema":[{"id":20,"metrics":{"SoDon":1,"SoVeBan":2,"DoanhThuVe":160000,"DoanhThuDoAn":50000,"TongTienGiam":1000,"DoanhThuThucTe":209000}}],"movie":[{"id":41,"metrics":{"SoDon":1,"SoV… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e333"></a>

### E333 — R4.2-04-single-movie

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/2`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000}],"summary":{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000},"cinema":[{"id":20,"metrics":{"SoDon":1,"SoVeBan":2,"DoanhThuVe":160000,"DoanhThuDoAn":50000,"TongTienGiam":1000,"DoanhThuThucTe":209000}}],"movie":[{"id":41,"metrics":{"SoDon":1,"SoV… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e334"></a>

### E334 — R4.2-10-failed-pending-success-attempts-one-order

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/3`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000}],"summary":{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000},"cinema":[{"id":20,"metrics":{"SoDon":1,"SoVeBan":2,"DoanhThuVe":160000,"DoanhThuDoAn":50000,"TongTienGiam":1000,"DoanhThuThucTe":209000}}],"movie":[{"id":41,"metrics":{"SoDon":1,"SoV… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e335"></a>

### E335 — R4.2-11-two-tickets-two-food-lines-discount-no-fanout

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/4`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000}],"summary":{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000},"cinema":[{"id":20,"metrics":{"SoDon":1,"SoVeBan":2,"DoanhThuVe":160000,"DoanhThuDoAn":50000,"TongTienGiam":1000,"DoanhThuThucTe":209000}}],"movie":[{"id":41,"metrics":{"SoDon":1,"SoV… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":1,"TongSoVeBan":2,"TongDoanhThuVe":160000,"TongDoanhThuDoAn":50000,"TongTienGiam":1000,"TongDoanhThuThucTe":209000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e336"></a>

### E336 — R4.2-03-multiple-cinemas

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/5`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":5,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e337"></a>

### E337 — R4.2-05-multiple-movies

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/6`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":5,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e338"></a>

### E338 — R4.2-06-multi-day

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/7`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":5,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e339"></a>

### E339 — R4.2-07-day-start-and-final-datetime2-tick

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/8`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000}],"summary":{"TongSoDonToanHeThong":2,"TongSoVeBan":3,"TongDoanhThuVe":240000,"TongDoanhThuDoAn":60000,"TongTienGiam":2000,"TongDoanhThuThucTe":298000},"cinema":[{"id":20,"metrics":{"SoDon":1,"SoVeBan":2,… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":2,"TongSoVeBan":3,"TongDoanhThuVe":240000,"TongDoanhThuDoAn":60000,"TongTienGiam":2000,"TongDoanhThuThucTe":298000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e340"></a>

### E340 — R4.2-07-previous-day-boundary

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/9`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000}],"summary":{"TongSoDonToanHeThong":1,"TongSoVeBan":1,"TongDoanhThuVe":80000,"TongDoanhThuDoAn":10000,"TongTienGiam":1000,"TongDoanhThuThucTe":89000},"cinema":[{"id":20,"metrics":{"SoDon":1,"SoVeBan":1,"DoanhThuVe":80000,"DoanhThuDoAn":10000,"TongTienGiam":1000,"DoanhThuThucTe":89000}}],"movie":[{"id":41,"metrics":{"SoDon":1,"SoVeBan":… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":1,"TongSoVeBan":1,"TongDoanhThuVe":80000,"TongDoanhThuDoAn":10000,"TongTienGiam":1000,"TongDoanhThuThucTe":89000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"TenR… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e341"></a>

### E341 — R4.2-07-next-day-boundary

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/10`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000}],"summary":{"TongSoDonToanHeThong":1,"TongSoVeBan":1,"TongDoanhThuVe":80000,"TongDoanhThuDoAn":10000,"TongTienGiam":1000,"TongDoanhThuThucTe":89000},"cinema":[{"id":21,"metrics":{"SoDon":1,"SoVeBan":1,"DoanhThuVe":80000,"DoanhThuDoAn":10000,"TongTienGiam":1000,"DoanhThuThucTe":89000}}],"movie":[{"id":42,"metrics":{"SoDon":1,"SoVeBan":… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":1,"TongSoVeBan":1,"TongDoanhThuVe":80000,"TongDoanhThuDoAn":10000,"TongTienGiam":1000,"TongDoanhThuThucTe":89000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"TenR… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e342"></a>

### E342 — cinema-filter-preserves-legacy-parameters

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/11`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000}],"summary":{"TongSoDonToanHeThong":2,"TongSoVeBan":3,"TongDoanhThuVe":240000,"TongDoanhThuDoAn":60000,"TongTienGiam":2000,"TongDoanhThuThucTe":298000},"cinema":[{"id":20,"metrics":{"SoDon":2,"SoVeBan":3,… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":2,"TongSoVeBan":3,"TongDoanhThuVe":240000,"TongDoanhThuDoAn":60000,"TongTienGiam":2000,"TongDoanhThuThucTe":298000}],[{"RapID":20,"TenRap":"R21 API","ThanhPho":"HCM","SoDon":2,"SoVeBan":3,"DoanhThuVe":240000,"DoanhThuDoAn":60000,"TongTienGiam":2000,"DoanhThuThucTe":298000}],[{"PhimID":41,"TenPhim":"R21 API","SoDon":2,"SoVeBan":3,"DoanhThuVe":240000,"DoanhThuDoAn":60000,"TongTienGiam":2000,"DoanhThuThucTe":298000}],[{"Ngay":"2031-01-01","SoDon":1,"SoV… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e343"></a>

### E343 — open-start-bound

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/12`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000}],"summary":{"TongSoDonToanHeThong":3,"TongSoVeBan":4,"TongDoanhThuVe":32… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":3,"TongSoVeBan":4,"TongDoanhThuVe":320000,"TongDoanhThuDoAn":70000,"TongTienGiam":3000,"TongDoanhThuThucTe":387000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e344"></a>

### E344 — open-end-bound

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/13`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000}],"summary":{"TongSoDonToanHeThong":3,"TongSoVeBan":4,"TongDoanhThuVe":32… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":3,"TongSoVeBan":4,"TongDoanhThuVe":320000,"TongDoanhThuDoAn":70000,"TongTienGiam":3000,"TongDoanhThuThucTe":387000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e345"></a>

### E345 — nonexistent-cinema-zero-summary-empty-breakdowns

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/14`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[],"summary":{"TongSoDonToanHeThong":0,"TongSoVeBan":0,"TongDoanhThuVe":0,"TongDoanhThuDoAn":0,"TongTienGiam":0,"TongDoanhThuThucTe":0},"cinema":[],"movie":[],"date":[]}. **Actual:** [[{"TongSoDonToanHeThong":0,"TongSoVeBan":0,"TongDoanhThuVe":0,"TongDoanhThuDoAn":0,"TongTienGiam":0,"TongDoanhThuThucTe":0}],[],[],[]].

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e346"></a>

### E346 — R4.2-08-failed-and-unpaid-orders-excluded

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/15`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":5,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e347"></a>

### E347 — expired-orders-excluded

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/16`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":5,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e348"></a>

### E348 — R4.2-09-canceled-paid-orders-retain-success-receipts-compensation-not-refund

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/17`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":3,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e349"></a>

### E349 — legacy-null-payment-time-falls-back-to-created-time

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/18`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":3,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e350"></a>

### E350 — schema-supported-refunded-attempt-excluded

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/19`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":3,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e351"></a>

### E351 — R4.2-12-catalog-pricing-promotion-changes-preserve-snapshots

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/20`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"selected":[{"id":23,"cinema":20,"movie":41,"day":"2031-01-02","tickets":2,"ticketGross":160000,"foodGross":50000,"discount":1000,"cash":209000},{"id":24,"cinema":21,"movie":42,"day":"2031-01-02","tickets":0,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":25,"cinema":20,"movie":41,"day":"2031-01-01","tickets":1,"ticketGross":80000,"foodGross":10000,"discount":1000,"cash":89000},{"id":26,"cinema":21,"movie":42,"day":"2031-01-03","tickets":0,"ticketGr… (xem selector). **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":3,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e352"></a>

### E352 — repeat-identical-state-identical-report

**Artifact:** [sql-tests.json](<../docs/evidence/r6-group-c/runs/2026-10-09T13-01-28-044Z-ddfffac3/r42-report/sql-tests.json>); JSON Pointer `/cases/21`. **UC:** ADM-16. **Class:** DB_SQL. **Result:** PASS.

**Operation:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.. **Actual:** [[{"TongSoDonToanHeThong":4,"TongSoVeBan":3,"TongDoanhThuVe":400000,"TongDoanhThuDoAn":80000,"TongTienGiam":4000,"TongDoanhThuThucTe":476000}],[{"RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":2,"TenRap":"Cinema Star Landmark","ThanhPho":"Hồ Chí Minh","SoDon":0,"SoVeBan":0,"DoanhThuVe":0,"DoanhThuDoAn":0,"TongTienGiam":0,"DoanhThuThucTe":0},{"RapID":3,"Te… (xem selector).

**Environment:** CinemaBookingDB_R0_R6C_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** Real SQL report numerical reconciliation, paid/mixed/empty/date/cinema/role/grants; four recordsets, no mutation.


<a id="evidence-e353"></a>

### E353 — R6.4-r32-sql-cases-087

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/86`. **UC:** ADM-08. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-active-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-active-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/86


<a id="evidence-e354"></a>

### E354 — R6.4-r32-sql-cases-088

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/87`. **UC:** ADM-08. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-Đã hủy-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-Đã hủy-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/87


<a id="evidence-e355"></a>

### E355 — R6.4-r32-sql-cases-089

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/88`. **UC:** ADM-08. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-Hết hạn-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-Hết hạn-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/88


<a id="evidence-e356"></a>

### E356 — R6.4-r32-sql-cases-090

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/89`. **UC:** ADM-08. **Class:** DB_SQL. **Result:** PASS.

**Operation:** seat-history-Hoàn thành-mixed-type-status. **Input:** {"LoaiGhe":"Thường","TrangThai":"Hỏng"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** seat-history-Hoàn thành-mixed-type-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/89


<a id="evidence-e357"></a>

### E357 — R6.4-r32-sql-cases-095

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/94`. **UC:** ADM-08. **Class:** DB_SQL. **Result:** PASS.

**Operation:** active-future-ticket-unchanged-still-operationally-blocked. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện ADMIN active với current module permission(s); resource/input hợp lệ. Không cần Manager assignment.. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50207}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** active-future-ticket-unchanged-still-operationally-blocked; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/94


<a id="evidence-e358"></a>

### E358 — R6.4-r32-sql-cases-055

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/54`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-movie-mixed-status. **Input:** {"PhimID":946,"TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-movie-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/54


<a id="evidence-e359"></a>

### E359 — R6.4-r32-sql-cases-056

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/55`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-start-mixed-status. **Input:** {"ThoiGianBatDau":"2026-10-19T12:17:33.871Z","TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-start-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/55


<a id="evidence-e360"></a>

### E360 — R6.4-r32-sql-cases-057

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/56`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-end-mixed-status. **Input:** {"ThoiGianKetThuc":"2026-10-19T13:47:34.099Z","TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-end-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/56


<a id="evidence-e361"></a>

### E361 — R6.4-r32-sql-cases-058

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/57`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-format-mixed-status. **Input:** {"DinhDang":"3D","TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-format-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/57


<a id="evidence-e362"></a>

### E362 — R6.4-r32-sql-cases-059

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/58`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Đã hủy-price-mixed-status. **Input:** {"GiaVeCoBan":90000,"TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Đã hủy-price-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/58


<a id="evidence-e363"></a>

### E363 — R6.4-r32-sql-cases-060

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/59`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** history-Hết hạn-movie-mixed-status. **Input:** {"PhimID":956,"TrangThai":"Đóng bán"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50120}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** history-Hết hạn-movie-mixed-status; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/59


<a id="evidence-e364"></a>

### E364 — R6.4-r32-sql-cases-098

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/97`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** canonical-cancel-active. **Input:** {"replayedCase":"canonical-cancel-active","source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50118}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** canonical-cancel-active; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/97


<a id="evidence-e365"></a>

### E365 — R6.4-r32-sql-cases-099

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/98`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** canonical-cancel-Hết hạn. **Input:** {"replayedCase":"canonical-cancel-Hết hạn","source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** canonical-cancel-Hết hạn; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/98


<a id="evidence-e366"></a>

### E366 — R6.4-r32-sql-cases-100

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/99`. **UC:** ADM-14. **Class:** DB_SQL. **Result:** PASS.

**Operation:** canonical-cancel-Đã thanh toán. **Input:** {"replayedCase":"canonical-cancel-Đã thanh toán","source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** canonical-cancel-Đã thanh toán; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/99


<a id="evidence-e367"></a>

### E367 — R6.4-r32-sql-cases-048

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/47`. **UC:** QLR-06. **Class:** DB_SQL. **Result:** PASS.

**Operation:** canonical-cancel-active. **Input:** {"replayedCase":"canonical-cancel-active","source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs","sqlError":50118}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** canonical-cancel-active; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/47


<a id="evidence-e368"></a>

### E368 — R6.4-r32-sql-cases-049

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/48`. **UC:** QLR-06. **Class:** DB_SQL. **Result:** PASS.

**Operation:** canonical-cancel-Hết hạn. **Input:** {"replayedCase":"canonical-cancel-Hết hạn","source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** canonical-cancel-Hết hạn; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/48


<a id="evidence-e369"></a>

### E369 — R6.4-r32-sql-cases-050

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/49`. **UC:** QLR-06. **Class:** DB_SQL. **Result:** PASS.

**Operation:** canonical-cancel-Đã thanh toán. **Input:** {"replayedCase":"canonical-cancel-Đã thanh toán","source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** canonical-cancel-Đã thanh toán; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /cases/49


<a id="evidence-e370"></a>

### E370 — R6.6-r11-concurrency-cases-007

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/269`. **UC:** ADM-08. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** r11-concurrency/cases/7. **Input:** {"source":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-concurrency/cases/7; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-concurrency/concurrency.json>) JSON pointer /cases/6


<a id="evidence-e371"></a>

### E371 — R6.6-r11-concurrency-cases-008

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/270`. **UC:** ADM-08. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** r11-concurrency/cases/8. **Input:** {"source":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/room-delete-vs-showtime.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r11-concurrency/cases/8; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r11-concurrency/concurrency.json>) JSON pointer /cases/7


<a id="evidence-e372"></a>

### E372 — R6.7-r12-concurrency-scenarios-003

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/349`. **UC:** ADM-14. **Class:** CONCURRENCY, DB_SQL. **Result:** PASS.

**Operation:** overlap. **Input:** {"A":{"kind":"Create","role":"admin","room":1106,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"usp_Admin_Showtime_Create","identity":"ActorID","actor":1},"B":{"kind":"Create","role":"manager","room":1106,"show":null,"startsAt":"2026-10-19T12:03:26.004Z","endsAt":"2026-10-19T14:59:26.004Z","procedure":"sp_Manager_Showtime_Create","identity":"NguoiDungID","actor":2}}. **Expected:** {"acceptedAssertions":"database/11_tests/concurrency/showtime-overlap.mjs"}. **Actual:** {"status":"PASS","results":[{"status":"SUCCESS","recordsets":[[{"SuatChieuID":1054,"PhimID":1,"TenPhim":"Dune: Hành Tinh Cát - Phần Hai","PosterURL":"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800","ThoiLuong":166,"DoTuoi":"T16","RapID":1,"TenRap":"Cinema Star Hai Bà Trưng","DiaChiRap":"123 Hai Bà Trưng, Phường Bến Nghé, Quận 1","ThanhPho":"Hồ Chí Minh","PhongID":1106,"TenPhong":"R11 8C62C497-C3B2-4EE9-8724-D0F6EB811867","LoaiPhong":"2D","ThoiGianBatDau":"… (xem selector).

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** overlap; raw [concurrency.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r12-concurrency/concurrency.json>) JSON pointer /scenarios/2


<a id="evidence-e373"></a>

### E373 — R6.4-r32-sql-monetary-001

**Artifact:** [verification-matrix.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/verification-matrix.json>); JSON Pointer `/cases/108`. **UC:** ADM-11, ADM-12, KH-08, KH-09, KH-10, KH-12. **Class:** DB_SQL. **Result:** PASS.

**Operation:** r32-sql/monetary/1. **Input:** {"source":"scripts/r32/sql-tests.mjs"}. **Expected:** {"acceptedAssertions":"scripts/r32/sql-tests.mjs"}. **Actual:** {"status":"PASS"}.

**Environment:** CinemaBookingDB_R0_R6B_20261009_01. **Currentness:** R6 canonical159 parity, production source unchanged; accepted final run.

**Scope/trace:** r32-sql/monetary/1; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /monetary/0; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /monetary/0; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /monetary/0; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /monetary/0; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /monetary/0; raw [sql-tests.json](<../docs/evidence/r6-group-b/runs/2026-10-09T12-02-23-892Z-64ec76fa/r32-sql/sql-tests.json>) JSON pointer /monetary/0


<a id="evidence-e374"></a>

### E374 — GET /movies/1/reviews

**Artifact:** [api-probes.json](<../docs/audit-20261007/api-probes.json>); JSON Pointer `/5`. **UC:** KH-13. **Class:** HTTP_SQL. **Result:** PASS.

**Operation:** GET /movies/1/reviews. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer paid/completed order cho phim, suất đã bắt đầu, chưa review; DANH_GIA.. **Expected:** 200. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB; audit2026-10-07 (before R1–R4 changes). **Currentness:** SUPERSEDED for current auth/time/contract acceptance; shape-only historical context; no current DB/BE PASS.

**Scope/trace:** Historical read only probe200, empty review/revenue or dashboard shape only. Không đủ current UC acceptance.


<a id="evidence-e375"></a>

### E375 — GET /manager/cinemas/1/dashboard

**Artifact:** [api-probes.json](<../docs/audit-20261007/api-probes.json>); JSON Pointer `/25`. **UC:** QLR-08. **Class:** HTTP_SQL. **Result:** PASS.

**Operation:** GET /manager/cinemas/1/dashboard. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+XEM_BAO_CAO_RAP; assigned cinema.. **Expected:** 200. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB; audit2026-10-07 (before R1–R4 changes). **Currentness:** SUPERSEDED for current auth/time/contract acceptance; shape-only historical context; no current DB/BE PASS.

**Scope/trace:** Historical read only probe200, empty review/revenue or dashboard shape only. Không đủ current UC acceptance.


<a id="evidence-e376"></a>

### E376 — GET /manager/cinemas/1/revenue

**Artifact:** [api-probes.json](<../docs/audit-20261007/api-probes.json>); JSON Pointer `/26`. **UC:** QLR-09. **Class:** HTTP_SQL. **Result:** PASS.

**Operation:** GET /manager/cinemas/1/revenue. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Manager+XEM_BAO_CAO_RAP; assigned cinema, valid inclusive date range.. **Expected:** 200. **Actual:** {"http":200,"error":null}.

**Environment:** CinemaBookingDB; audit2026-10-07 (before R1–R4 changes). **Currentness:** SUPERSEDED for current auth/time/contract acceptance; shape-only historical context; no current DB/BE PASS.

**Scope/trace:** Historical read only probe200, empty review/revenue or dashboard shape only. Không đủ current UC acceptance.


<a id="evidence-e377"></a>

### E377 — R55-ROLLBACK

**Artifact:** [result.json](<../docs/evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/result.json>); JSON Pointer `/steps/7`. **UC:** KH-13. **Class:** DB_SQL. **Result:** PASS.

**Operation:** R55 executes R54 real SP fixture: eligible Customer5 movie2 succeeds; noneligible/duplicate reviews negative probes. See fixture logs and negative-probes.log. No HTTP create authorization proof.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer paid/completed order cho phim, suất đã bắt đầu, chưa review; DANH_GIA.. **Expected:** All embedded fixture invariants PASS; baseline data/metadata unchanged. **Actual:** {"evidence":["fixture-rollback.log","rollback-fingerprints.json"]}.

**Environment:** CinemaBookingDB_Test. **Currentness:** R5.5 post-R4 canonical SQL same definitions; actual execution only; historical-replay/r54/checks.json is STATIC and excluded from DB_SQL.

**Scope/trace:** R55 executes R54 real SP fixture: eligible Customer5 movie2 succeeds; noneligible/duplicate reviews negative probes. See fixture logs and negative-probes.log. No HTTP create authorization proof.


<a id="evidence-e378"></a>

### E378 — R55-COMMIT

**Artifact:** [result.json](<../docs/evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/result.json>); JSON Pointer `/steps/8`. **UC:** KH-13. **Class:** DB_SQL. **Result:** PASS.

**Operation:** R55 executes R54 real SP fixture: eligible Customer5 movie2 succeeds; noneligible/duplicate reviews negative probes. See fixture logs and negative-probes.log. No HTTP create authorization proof.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer paid/completed order cho phim, suất đã bắt đầu, chưa review; DANH_GIA.. **Expected:** 6/7/5/4/1/5/7/1 rows, live pending, monetary/points/quota/history valid. **Actual:** {"evidence":"fixture-commit.log","result":"SQL completed; all THROW assertions accepted"}.

**Environment:** CinemaBookingDB_Test. **Currentness:** R5.5 post-R4 canonical SQL same definitions; actual execution only; historical-replay/r54/checks.json is STATIC and excluded from DB_SQL.

**Scope/trace:** R55 executes R54 real SP fixture: eligible Customer5 movie2 succeeds; noneligible/duplicate reviews negative probes. See fixture logs and negative-probes.log. No HTTP create authorization proof.


<a id="evidence-e379"></a>

### E379 — R55-NEGATIVE

**Artifact:** [result.json](<../docs/evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/result.json>); JSON Pointer `/steps/9`. **UC:** KH-13. **Class:** DB_SQL. **Result:** PASS.

**Operation:** R55 executes R54 real SP fixture: eligible Customer5 movie2 succeeds; noneligible/duplicate reviews negative probes. See fixture logs and negative-probes.log. No HTTP create authorization proof.. **Input:** Fixture/request inputs trong artifact và source runner; điều kiện Customer paid/completed order cho phim, suất đã bắt đầu, chưa review; DANH_GIA.. **Expected:** 50004 / 50040 / 50041; all tables/metadata unchanged. **Actual:** {"evidence":["negative-probes.log","negative-fingerprints.json"]}.

**Environment:** CinemaBookingDB_Test. **Currentness:** R5.5 post-R4 canonical SQL same definitions; actual execution only; historical-replay/r54/checks.json is STATIC and excluded from DB_SQL.

**Scope/trace:** R55 executes R54 real SP fixture: eligible Customer5 movie2 succeeds; noneligible/duplicate reviews negative probes. See fixture logs and negative-probes.log. No HTTP create authorization proof.


<a id="evidence-e380"></a>

### E380 — register: real429 shown as existing understandable retry error

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/4`. **UC:** KH-01. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e381"></a>

### E381 — register: form values retained and submit released

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/5`. **UC:** KH-01. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e382"></a>

### E382 — register: no automatic retry or navigation on429

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/6`. **UC:** KH-01. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e383"></a>

### E383 — register: explicit retry after expiry reaches existing duplicate-email contract

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/7`. **UC:** KH-01. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e384"></a>

### E384 — login: real429 shown as existing understandable retry error

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/0`. **UC:** KH-02. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e385"></a>

### E385 — login: form values retained and submit released

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/1`. **UC:** KH-02. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e386"></a>

### E386 — login: no automatic retry or navigation on429

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/2`. **UC:** KH-02. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e387"></a>

### E387 — login: explicit retry after expiry logs in and uses real JWT/me

**Artifact:** [browser.json](<../docs/evidence/r45/browser.json>); JSON Pointer `/result/checks/3`. **UC:** KH-02. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.. **Input:** Browser fills real Login/Register fields; constrained endpoint counters then explicit retry. **Expected:** No automatic retry/false success on429; explicit retry gets authentic HTTPresult. **Actual:** PASS selected check; calls under /result/forms.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration.


<a id="evidence-e388"></a>

### E388 — Customer only; actual Profile/AuthProvider, real GETme/PUTme/read after write + post-UI SQL row check. Staff profile cases do not prove staff login areas.

**Artifact:** [browser.json](<../docs/evidence/r46/browser.json>); JSON Pointer `/results/0`. **UC:** KH-03. **Class:** DB_SQL, FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Customer only; actual Profile/AuthProvider, real GETme/PUTme/read after write + post-UI SQL row check. Staff profile cases do not prove staff login areas.. **Input:** Customer JWT from real login; UI changes name/phone/birthday/gender. **Expected:** Correct Customer fields;200write;re-read saved fields;loyalty preserved. **Actual:** PASS four Customer checks; real HTTP calls and persisted SQL verification.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Customer only; actual Profile/AuthProvider, real GETme/PUTme/read after write + post-UI SQL row check. Staff profile cases do not prove staff login areas.


<a id="evidence-e389"></a>

### E389 — booking final amount replaces old preview

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/4`. **UC:** KH-06, KH-07, KH-08, KH-09. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e390"></a>

### E390 — booking payload contains only IDs quantities and code

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/5`. **UC:** KH-06, KH-07, KH-08. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e391"></a>

### E391 — stale preview rejected without success or automatic full-price retry

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/1`. **UC:** KH-07, KH-09. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e392"></a>

### E392 — new preview reads current DB prices

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/3`. **UC:** KH-08, KH-09. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e393"></a>

### E393 — valid real preview clearly provisional

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/0`. **UC:** KH-09. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e394"></a>

### E394 — invalidated promotion requires explicit review

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/2`. **UC:** KH-09. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e395"></a>

### E395 — payment page displays authoritative order amount

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/6`. **UC:** KH-10. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e396"></a>

### E396 — payment amount comes from stored order without client money

**Artifact:** [browser.json](<../docs/evidence/r44/browser.json>); JSON Pointer `/result/checks/7`. **UC:** KH-10. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.. **Input:** Actual UI selected free A1/food qty1/code; Admin pauses/reprices catalog; Customer explicit retry. **Expected:** Provisional preview;409stale; booking 201 final snapshot; payment successful with SQL-owned amount. **Actual:** PASS selected actual UI check; /result/calls records requests and responses.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited.


<a id="evidence-e397"></a>

### E397 — hydrates all seven persisted fields

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/0`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e398"></a>

### E398 — cinema immutable during edit

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/1`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e399"></a>

### E399 — three official day choices

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/2`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e400"></a>

### E400 — real full PUT succeeds with exact seven-field payload

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/3`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e401"></a>

### E401 — reload hydrates saved date and dimensions

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/4`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e402"></a>

### E402 — clearing end date sends explicit NULL

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/5`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e403"></a>

### E403 — real overlap shows conflict without false success

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/6`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e404"></a>

### E404 — rejected form remains editable

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/7`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e405"></a>

### E405 — valid retry succeeds and reloads

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/8`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e406"></a>

### E406 — persisted read after failure and retry

**Artifact:** [browser.json](<../docs/evidence/r43/browser.json>); JSON Pointer `/result/checks/9`. **UC:** ADM-13. **Class:** FRONTEND, HTTP_SQL. **Result:** PASS.

**Operation:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.. **Input:** Persisted Admin pricing edit; seven fields, NULL end date, overlap then valid explicit retry. **Expected:** RealPUT200/readback, overlap409 without false success;three day types. **Actual:** PASS selected check; actual HTTPcalls in /result/calls.

**Environment:** CinemaBookingDB_R0_R33_20261008_01. **Currentness:** R4 component/SP cùng source hiện tại; Git không có thay đổi production sau R4; fixture coverage giới hạn.

**Scope/trace:** Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create.


<a id="evidence-e407"></a>

### E407 — editor hydrates persisted cast

**Artifact:** [browser.json](<../docs/evidence/r31/browser.json>); JSON Pointer `/result/checks/0`. **UC:** ADM-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.. **Input:** Persisted cast JSON hydrated; malformed/blank/[]/rejected/retry. **Expected:** No submit malformed/blank;[]clear onlyexplicit; rejectpreserves list;retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled component branch retained in current AdminPortal; R4 later changes mean supplement only.

**Scope/trace:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.


<a id="evidence-e408"></a>

### E408 — reject feedback without success

**Artifact:** [browser.json](<../docs/evidence/r31/browser.json>); JSON Pointer `/result/checks/1`. **UC:** ADM-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.. **Input:** Persisted cast JSON hydrated; malformed/blank/[]/rejected/retry. **Expected:** No submit malformed/blank;[]clear onlyexplicit; rejectpreserves list;retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled component branch retained in current AdminPortal; R4 later changes mean supplement only.

**Scope/trace:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.


<a id="evidence-e409"></a>

### E409 — explicit retry succeeds and reloads persisted list

**Artifact:** [browser.json](<../docs/evidence/r31/browser.json>); JSON Pointer `/result/checks/4`. **UC:** ADM-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.. **Input:** Persisted cast JSON hydrated; malformed/blank/[]/rejected/retry. **Expected:** No submit malformed/blank;[]clear onlyexplicit; rejectpreserves list;retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled component branch retained in current AdminPortal; R4 later changes mean supplement only.

**Scope/trace:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.


<a id="evidence-e410"></a>

### E410 — blank JSON does not send empty cast

**Artifact:** [browser.json](<../docs/evidence/r31/browser.json>); JSON Pointer `/result/checks/5`. **UC:** ADM-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.. **Input:** Persisted cast JSON hydrated; malformed/blank/[]/rejected/retry. **Expected:** No submit malformed/blank;[]clear onlyexplicit; rejectpreserves list;retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled component branch retained in current AdminPortal; R4 later changes mean supplement only.

**Scope/trace:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.


<a id="evidence-e411"></a>

### E411 — malformed JSON does not submit

**Artifact:** [browser.json](<../docs/evidence/r31/browser.json>); JSON Pointer `/result/checks/6`. **UC:** ADM-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.. **Input:** Persisted cast JSON hydrated; malformed/blank/[]/rejected/retry. **Expected:** No submit malformed/blank;[]clear onlyexplicit; rejectpreserves list;retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled component branch retained in current AdminPortal; R4 later changes mean supplement only.

**Scope/trace:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.


<a id="evidence-e412"></a>

### E412 — explicit [] clears and reloads

**Artifact:** [browser.json](<../docs/evidence/r31/browser.json>); JSON Pointer `/result/checks/7`. **UC:** ADM-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.. **Input:** Persisted cast JSON hydrated; malformed/blank/[]/rejected/retry. **Expected:** No submit malformed/blank;[]clear onlyexplicit; rejectpreserves list;retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled component branch retained in current AdminPortal; R4 later changes mean supplement only.

**Scope/trace:** Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim.


<a id="evidence-e413"></a>

### E413 — admin/show/hydrates persisted values

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/0`. **UC:** ADM-14. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e414"></a>

### E414 — admin/show/friendly rejection without false success

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/1`. **UC:** ADM-14. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e415"></a>

### E415 — admin/show/valid operational retry saves and reloads

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/4`. **UC:** ADM-14. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e416"></a>

### E416 — admin/show/complete payload preserves identity and has no room transfer

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/5`. **UC:** ADM-14. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e417"></a>

### E417 — manager/show/hydrates persisted values

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/12`. **UC:** QLR-05. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e418"></a>

### E418 — manager/show/friendly rejection without false success

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/13`. **UC:** QLR-05. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e419"></a>

### E419 — manager/show/valid operational retry saves and reloads

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/16`. **UC:** QLR-05. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e420"></a>

### E420 — manager/show/complete payload preserves identity and has no room transfer

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/17`. **UC:** QLR-05. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e421"></a>

### E421 — admin/seat/hydrates persisted values

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/6`. **UC:** ADM-08. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e422"></a>

### E422 — admin/seat/friendly rejection without false success

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/7`. **UC:** ADM-08. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e423"></a>

### E423 — admin/seat/valid operational retry saves and reloads

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/10`. **UC:** ADM-08. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e424"></a>

### E424 — admin/seat/complete payload preserves identity and has no room transfer

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/11`. **UC:** ADM-08. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e425"></a>

### E425 — manager/seat/hydrates persisted values

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/18`. **UC:** QLR-03. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e426"></a>

### E426 — manager/seat/friendly rejection without false success

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/19`. **UC:** QLR-03. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e427"></a>

### E427 — manager/seat/valid operational retry saves and reloads

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/22`. **UC:** QLR-03. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e428"></a>

### E428 — manager/seat/complete payload preserves identity and has no room transfer

**Artifact:** [browser.json](<../docs/evidence/r32/browser.json>); JSON Pointer `/result/checks/23`. **UC:** QLR-03. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.. **Input:** Hydrate persisted edit; failure then retry. **Expected:** Fields retain identity; error leavesdisplayunchanged; retry reload. **Actual:** PASS selected UI check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R3 controlled branches still in source; later R4 changes require full realSQLbrowser verification.

**Scope/trace:** Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites.


<a id="evidence-e429"></a>

### E429 — stale preview ignored after code

**Artifact:** [browser.json](<../docs/evidence/r22/browser.json>); JSON Pointer `/result/checks/0`. **UC:** KH-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL.. **Input:** Change code/seat/food while preview pending. **Expected:** No stale preview/no automatic full-price retry. **Actual:** PASS selected check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R2/R3 controlled timing supplement; real stale-price browser superseded by R44 positive proof.

**Scope/trace:** Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL.


<a id="evidence-e430"></a>

### E430 — preview shown as provisional

**Artifact:** [browser.json](<../docs/evidence/r22/browser.json>); JSON Pointer `/result/checks/3`. **UC:** KH-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL.. **Input:** Change code/seat/food while preview pending. **Expected:** No stale preview/no automatic full-price retry. **Actual:** PASS selected check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R2/R3 controlled timing supplement; real stale-price browser superseded by R44 positive proof.

**Scope/trace:** Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL.


<a id="evidence-e431"></a>

### E431 — stale preview cannot overwrite rejection

**Artifact:** [browser.json](<../docs/evidence/r22/browser.json>); JSON Pointer `/result/checks/7`. **UC:** KH-09. **Class:** FRONTEND. **Result:** PASS.

**Operation:** Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL.. **Input:** Change code/seat/food while preview pending. **Expected:** No stale preview/no automatic full-price retry. **Actual:** PASS selected check.

**Environment:** Dedicated headless Chrome + controlled HTTP fixture. **Currentness:** R2/R3 controlled timing supplement; real stale-price browser superseded by R44 positive proof.

**Scope/trace:** Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL.


<a id="evidence-e432"></a>

### E432 — R7.2 KH-13 current HTTP/SQL regression

**Artifact:** [p1.json](<evidence/r7-2/runs/2026-10-09T15-42-18-105Z-0346d4d2/p1.json>); JSON Pointers `/cases/0`, `/cases/1`, `/cases/2`, `/cases/3`, `/cases/4`, `/cases/5`, `/cases/6`, `/cases/7`, `/cases/8`, `/cases/9`, `/cases/10`, `/cases/11`. **UC:** KH-13. **Class:** HTTP_SQL + direct SQL assertions. **Result:** PASS.

**Environment:** real Express HTTP + SQL Server 17, `CinemaBookingDB_R0_R72_20261009_02`, R5 canonical fresh build; 159 module parity. **Scope:** Eligible paid/completed order for started movie; authenticated Customer + DANH_GIA; rating integer 1–5; one review per movie/customer.

**Expected/Actual/Input/SQL state/Cleanup/Fix:** [12 exact case records](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), filtered by `ucId=KH-13`. All recorded assertions and cleanup PASS; negative/read-only compare27-table fingerprints. **Gap:** R71-DB-01 RESOLVED. FE remains PARTIAL.

<a id="evidence-e433"></a>

### E433 — R7.2 QLR-07 current HTTP/SQL regression

**Artifact:** [p1.json](<evidence/r7-2/runs/2026-10-09T15-42-18-105Z-0346d4d2/p1.json>); JSON Pointers `/cases/12`, `/cases/13`, `/cases/14`, `/cases/15`, `/cases/16`, `/cases/17`, `/cases/18`, `/cases/19`, `/cases/20`, `/cases/21`, `/cases/22`, `/cases/23`, `/cases/24`. **UC:** QLR-07. **Class:** HTTP_SQL + direct SQL assertions. **Result:** PASS.

**Environment:** real Express HTTP + SQL Server 17, `CinemaBookingDB_R0_R72_20261009_02`, R5 canonical fresh build; 159 module parity. **Scope:** Current Manager assignment + QL_BANG_GIA; SQL pricing with three day types, inclusive date range/null end, overlap conflict.

**Expected/Actual/Input/SQL state/Cleanup/Fix:** [13 exact case records](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), filtered by `ucId=QLR-07`. All recorded assertions and cleanup PASS; negative/read-only compare27-table fingerprints. **Gap:** R71-DB-02 RESOLVED. FE remains PARTIAL.

<a id="evidence-e434"></a>

### E434 — R7.2 QLR-08 current HTTP/SQL regression

**Artifact:** [p1.json](<evidence/r7-2/runs/2026-10-09T15-42-18-105Z-0346d4d2/p1.json>); JSON Pointers `/cases/25`, `/cases/26`, `/cases/27`, `/cases/28`, `/cases/29`, `/cases/30`, `/cases/31`, `/cases/32`, `/cases/33`. **UC:** QLR-08. **Class:** HTTP_SQL + direct SQL assertions. **Result:** PASS.

**Environment:** real Express HTTP + SQL Server 17, `CinemaBookingDB_R0_R72_20261009_02`, R5 canonical fresh build; 159 module parity. **Scope:** Four approved current metrics, scoped to current assignment; UTC+7 business date; GET read-only.

**Expected/Actual/Input/SQL state/Cleanup/Fix:** [9 exact case records](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), filtered by `ucId=QLR-08`. All recorded assertions and cleanup PASS; negative/read-only compare27-table fingerprints. **Gap:** R71-DB-03 RESOLVED. FE remains PARTIAL.

<a id="evidence-e435"></a>

### E435 — R7.2 QLR-09 current HTTP/SQL regression

**Artifact:** [p1.json](<evidence/r7-2/runs/2026-10-09T15-42-18-105Z-0346d4d2/p1.json>); JSON Pointers `/cases/34`, `/cases/35`, `/cases/36`, `/cases/37`, `/cases/38`, `/cases/39`, `/cases/40`, `/cases/41`, `/cases/42`, `/cases/43`, `/cases/44`, `/cases/45`, `/cases/46`, `/cases/47`, `/cases/48`, `/cases/49`, `/cases/50`. **UC:** QLR-09. **Class:** HTTP_SQL + direct SQL assertions. **Result:** PASS.

**Environment:** real Express HTTP + SQL Server 17, `CinemaBookingDB_R0_R72_20261009_02`, R5 canonical fresh build; 159 module parity. **Scope:** Successful receipt snapshots by business payment date; inclusive filters/default; scoped Manager grant; GET read-only.

**Expected/Actual/Input/SQL state/Cleanup/Fix:** [17 exact case records](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), filtered by `ucId=QLR-09`. All recorded assertions and cleanup PASS; negative/read-only compare27-table fingerprints. **Gap:** R71-DB-04 RESOLVED. FE remains PARTIAL.

<a id="evidence-e436"></a>

### E436 — R7.2 CSKH-02 current HTTP/SQL regression

**Artifact:** [p2.json](<evidence/r7-2/runs/2026-10-09T15-38-07-241Z-eb5ce811/p2.json>); JSON Pointers `/cases/0`, `/cases/1`, `/cases/2`, `/cases/3`, `/cases/4`, `/cases/5`, `/cases/6`, `/cases/7`, `/cases/8`, `/cases/9`, `/cases/10`, `/cases/11`, `/cases/12`, `/cases/13`, `/cases/14`. **UC:** CSKH-02. **Class:** HTTP_SQL + direct SQL assertions. **Result:** PASS.

**Environment:** real Express HTTP + SQL Server 17, `CinemaBookingDB_R0_R72_20261009_02`, R5 canonical fresh build; 159 module parity. **Scope:** Approved mandatory priority filter, AND status/type/search; official four priorities; SQL filtering and QL_KHIEUNAI.

**Expected/Actual/Input/SQL state/Cleanup/Fix:** [15 exact case records](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), filtered by `ucId=CSKH-02`. All recorded assertions and cleanup PASS; negative/read-only compare27-table fingerprints. **Gap:** R71-CT-01 RESOLVED. FE remains PARTIAL.

<a id="evidence-e437"></a>

### E437 — R7.2 ADM-02 current HTTP/SQL regression

**Artifact:** [p2.json](<evidence/r7-2/runs/2026-10-09T15-38-07-241Z-eb5ce811/p2.json>); JSON Pointers `/cases/15`, `/cases/16`, `/cases/17`, `/cases/18`, `/cases/19`, `/cases/20`, `/cases/21`, `/cases/22`, `/cases/23`, `/cases/24`, `/cases/25`, `/cases/26`, `/cases/27`, `/cases/28`, `/cases/29`, `/cases/30`, `/cases/31`. **UC:** ADM-02. **Class:** HTTP_SQL + direct SQL assertions. **Result:** PASS.

**Environment:** real Express HTTP + SQL Server 17, `CinemaBookingDB_R0_R72_20261009_02`, R5 canonical fresh build; 159 module parity. **Scope:** Approved target role codes QUAN_LY_RAP/CSKH/ADMIN only; active Admin + QL_NGUOIDUNG; typed roleId.

**Expected/Actual/Input/SQL state/Cleanup/Fix:** [17 exact case records](<evidence/r7-2/final/2026-10-09T15-47-45-330Z-d024c694/verification-matrix.json>), filtered by `ucId=ADM-02`. All recorded assertions and cleanup PASS; negative/read-only compare27-table fingerprints. **Gap:** R71-CT-02 RESOLVED. FE remains PARTIAL.

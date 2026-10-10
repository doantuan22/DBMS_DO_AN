# Use Case Matrix ? 45 UC

> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**Tr?ng th?i hi?n h?nh:** R8.3 ACCEPTED ? Phase R8 DONE. Ph?m vi gi? nguy?n 45 UC; ADM-17 ngo?i ph?m vi.

## K?t qu? theo vai tr?

| Vai tr? | T?ng | PASS | PARTIAL | BROKEN | MISSING |
|---|---:|---:|---:|---:|---:|
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 16 | 0 | 0 | 0 |
| **T?ng** | **45** | **45** | **0** | **0** | **0** |

Tại thời điểm nghiệm thu, 44 UC ngoài ADM-07 tái sử dụng evidence browser/API/SQL để đối chiếu source freshness; ADM-07 được chạy lại sau hotfix. Các dòng từng liên kết primary browser case và JSON Pointer trong acceptance manifest; manifest đã bị xóa khỏi `docs` trong đợt thu gọn ngày 10/10/2026.

Evidence types ???c gi? t?ch bi?t: primary journeys l? REAL_BROWSER_SQL; c?c test CONTROLLED_TRANSPORT ch? ???c t?nh cho race/retry checks m? kh?ng gi? l?m SQL mutation. ADM-07 fresh run c? 7 REAL_BROWSER_SQL v? 12 CONTROLLED_TRANSPORT checks; chi ti?t ? [R8.3 re-acceptance](R8_3_REACCEPTANCE_REPORT.md).

## Traceability theo Use Case

| # | UC | Vai tr? | Use Case | Tr?ng th?i hi?n h?nh | Primary evidence | R8.3 checkpoint tr??c hotfix |
|---:|---|---|---|---|---|---|
| 1 | KH-01 | Customer | Đăng ký | **PASS** | P3-KH01-REGISTER /checks/0; REAL_BROWSER_SQL | PASS |
| 2 | KH-02 | Customer | Đăng nhập | **PASS** | P3-KH02-LOGIN /checks/1; REAL_BROWSER_SQL | PASS |
| 3 | KH-03 | Customer | Profile | **PASS** | P3-KH03-PROFILE /checks/2; REAL_BROWSER_SQL | PASS |
| 4 | KH-04 | Customer | Xem phim/list/detail | **PASS** | P3-KH04-CATALOG /checks/3; REAL_BROWSER_SQL | PASS |
| 5 | KH-05 | Customer | Xem lịch chiếu | **PASS** | P3-KH05-SCHEDULE /checks/4; REAL_BROWSER_SQL | PASS |
| 6 | KH-06 | Customer | Chọn ghế | **PASS** | P3-KH06-SEATS /checks/5; REAL_BROWSER_SQL | PASS |
| 7 | KH-07 | Customer | Đặt vé | **PASS** | P3-KH07-BOOKING /checks/8; REAL_BROWSER_SQL | PASS |
| 8 | KH-08 | Customer | Đồ ăn kèm vé | **PASS** | P3-KH08-FOOD /checks/6; REAL_BROWSER_SQL | PASS |
| 9 | KH-09 | Customer | Khuyến mãi | **PASS** | P3-KH09-PROMOTION /checks/7; REAL_BROWSER_SQL | PASS |
| 10 | KH-10 | Customer | Thanh toán | **PASS** | P3-KH10-PAYMENT /checks/9; REAL_BROWSER_SQL | PASS |
| 11 | KH-11 | Customer | Lịch sử đơn | **PASS** | P3-KH11-ORDERS /checks/10; REAL_BROWSER_SQL | PASS |
| 12 | KH-12 | Customer | Chi tiết đơn | **PASS** | P3-KH12-ORDER-DETAIL /checks/11; REAL_BROWSER_SQL | PASS |
| 13 | KH-13 | Customer | Đánh giá | **PASS** | P3-KH13-ELIGIBILITY /checks/12; REAL_BROWSER_SQL | PASS |
| 14 | KH-14 | Customer | Khiếu nại | **PASS** | P3-KH14-COMPLAINT /checks/13; REAL_BROWSER_SQL | PASS |
| 15 | QLR-01 | Manager | Đăng nhập/rạp phân công | **PASS** | P3-QLR01-LOGIN-SCOPE /checks/40; REAL_BROWSER_SQL | PASS |
| 16 | QLR-02 | Manager | Quản lý phòng | **PASS** | P3-QLR02-ROOM /checks/41; REAL_BROWSER_SQL | PASS |
| 17 | QLR-03 | Manager | Quản lý sơ đồ ghế | **PASS** | P3-QLR03-SEAT /checks/42; REAL_BROWSER_SQL | PASS |
| 18 | QLR-04 | Manager | Tạo suất chiếu | **PASS** | P3-QLR04-CREATE-SHOW /checks/43; REAL_BROWSER_SQL | PASS |
| 19 | QLR-05 | Manager | Sửa suất chiếu | **PASS** | P3-QLR05-UPDATE-SHOW /checks/44; REAL_BROWSER_SQL | PASS |
| 20 | QLR-06 | Manager | Hủy suất chiếu | **PASS** | P3-QLR06-CANCEL-SHOW /checks/45; REAL_BROWSER_SQL | PASS |
| 21 | QLR-07 | Manager | Cấu hình bảng giá | **PASS** | P3-QLR07-PRICING /checks/46; REAL_BROWSER_SQL | PASS |
| 22 | QLR-08 | Manager | Dashboard hoạt động rạp | **PASS** | P3-QLR08-DASHBOARD /checks/47; REAL_BROWSER_SQL | PASS |
| 23 | QLR-09 | Manager | Doanh thu rạp | **PASS** | P3-QLR09-REVENUE /checks/48; REAL_BROWSER_SQL | PASS |
| 24 | CSKH-01 | CSKH | Đăng nhập | **PASS** | P3-CSKH01-LOGIN /checks/16; REAL_BROWSER_SQL | PASS |
| 25 | CSKH-02 | CSKH | Hàng chờ khiếu nại | **PASS** | P3-CSKH02-QUEUE /checks/17; REAL_BROWSER_SQL | PASS |
| 26 | CSKH-03 | CSKH | Chi tiết khiếu nại | **PASS** | P3-CSKH03-DETAIL /checks/18; REAL_BROWSER_SQL | PASS |
| 27 | CSKH-04 | CSKH | Đơn tham chiếu | **PASS** | P3-CSKH04-REFERENCE /checks/19; REAL_BROWSER_SQL | PASS |
| 28 | CSKH-05 | CSKH | Ghi lần xử lý | **PASS** | P3-CSKH05-PROCESS /checks/20; REAL_BROWSER_SQL | PASS |
| 29 | CSKH-06 | CSKH | Đổi trạng thái | **PASS** | P3-CSKH06-STATUS /checks/21; REAL_BROWSER_SQL | PASS |
| 30 | ADM-01 | Admin | Đăng nhập | **PASS** | P3-ADM01-LOGIN /checks/23; REAL_BROWSER_SQL | PASS |
| 31 | ADM-02 | Admin | Tài khoản người dùng | **PASS** | P3-ADM02-USERS /checks/24; REAL_BROWSER_SQL | PASS |
| 32 | ADM-03 | Admin | Vai trò | **PASS** | P3-ADM03-ROLES /checks/25; REAL_BROWSER_SQL | PASS |
| 33 | ADM-04 | Admin | Danh mục quyền | **PASS** | P3-ADM04-PERMISSIONS /checks/26; REAL_BROWSER_SQL | PASS |
| 34 | ADM-05 | Admin | Gán quyền vai trò | **PASS** | P3-ADM05-GRANTS /checks/27; REAL_BROWSER_SQL | PASS |
| 35 | ADM-06 | Admin | Phân công quản lý | **PASS** | P3-ADM06-ASSIGNMENTS /checks/28; REAL_BROWSER_SQL | PASS |
| 36 | ADM-07 | Admin | Rạp và hình ảnh | **PASS** | P3-ADM07-CINEMAS /checks/29; REAL_BROWSER_SQL | **BROKEN** |
| 37 | ADM-08 | Admin | Phòng và ghế toàn hệ | **PASS** | P3-ADM08-ROOM-SEAT /checks/30; REAL_BROWSER_SQL | PASS |
| 38 | ADM-09 | Admin | Phim và diễn viên | **PASS** | P3-ADM09-MOVIES-CAST /checks/32; REAL_BROWSER_SQL | PASS |
| 39 | ADM-10 | Admin | Thể loại | **PASS** | P3-ADM10-GENRES /checks/31; REAL_BROWSER_SQL | PASS |
| 40 | ADM-11 | Admin | Sản phẩm đồ ăn | **PASS** | P3-ADM11-PRODUCT-DECIMAL /checks/33; REAL_BROWSER_SQL | PASS |
| 41 | ADM-12 | Admin | Chương trình khuyến mãi | **PASS** | P3-ADM12-PROMOTION-DECIMAL /checks/34; REAL_BROWSER_SQL | PASS |
| 42 | ADM-13 | Admin | Bảng giá toàn hệ | **PASS** | P3-ADM13-PRICING-DECIMAL /checks/35; REAL_BROWSER_SQL | PASS |
| 43 | ADM-14 | Admin | Suất chiếu toàn hệ | **PASS** | P3-ADM14-SHOW-DECIMAL /checks/36; REAL_BROWSER_SQL | PASS |
| 44 | ADM-15 | Admin | Xử lý khiếu nại | **PASS** | P3-ADM15-COMPLAINT /checks/37; REAL_BROWSER_SQL | PASS |
| 45 | ADM-16 | Admin | Báo cáo toàn hệ | **PASS** | P3-ADM16-REVENUE /checks/38; REAL_BROWSER_SQL | PASS |

ADM-07 hi?n PASS sau hotfix; checkpoint l?ch s? ti?p t?c ghi BROKEN/44?45 theo th?i ?i?m c?. Kh?ng s?a verdict l?ch s? trong [R8.3 Final Acceptance](R8_3_FINAL_ACCEPTANCE_REPORT.md). Gap traceability theo 43 ID n?m trong [R8 Frontend Gap Matrix](R8_FRONTEND_GAP_MATRIX.md).

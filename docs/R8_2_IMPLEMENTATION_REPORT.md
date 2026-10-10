# R8.2 — Implementation Report

Ngày 10/10/2026 (UTC+7). Phạm vi: Frontend Gap Resolution & Browser E2E Regression.

## A. Executive Summary

**R8.2 = DONE.** 43/43 inherited gaps RESOLVED; 45/45 UC có bằng chứng để đề xuất PASS_CANDIDATE. Official acceptance vẫn thuộc R8.3; không thay 2 provisional PASS/43 PARTIAL của lịch sử R8.1 thành Final PASS.

| Category | Total | Resolved | Open | Blocked |
| --- | --- | --- | --- | --- |
| TEST_REQUIRED | 29 | 29 | 0 | 0 |
| FIX_REQUIRED | 7 | 7 | 0 | 0 |
| CONTRACT_ALIGNMENT_REQUIRED | 7 | 7 | 0 | 0 |
| Total | 43 | 43 | 0 | 0 |

| Actor | Total | PASS Candidate | PARTIAL | BROKEN | MISSING |
| --- | --- | --- | --- | --- | --- |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 16 | 0 | 0 | 0 |
| Total | 45 | 45 | 0 | 0 | 0 |

P1/P2/P3 đã có checkpoint; giữ kết quả FAIL/reproduction và recovery. Full 45-UC checkpoint: [2026-10-10T04-05-08-484Z-final-edges-ee0b133b](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/environment-result.json). Baseline preflight: [preflight.json](evidence/r8-2/runs/2026-10-10T02-38-55-539905Z-d8a165c2/preflight.json). Chi tiết từng UC: [R8_2_VERIFICATION_MATRIX.md](R8_2_VERIFICATION_MATRIX.md) và [verification-45.json](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json).

Giữ React → REST → Express → typed stored procedure → SQL Server. Production thay đổi **10 file FE hiện có + 1 component AdminRevenue mới**; không sửa backend/shared/SQL/schema/route architecture/CSS/palette/font. 29 TEST_REQUIRED giữ category gốc; chỉ sửa các lỗi đã được browser tái hiện hoặc shared lifecycle của cùng defect.

## B. P1 Results

| Issue | Root cause | Minimal fix | Browser result |
| --- | --- | --- | --- |
| I-11 | Detail/reference và write refresh thiếu request/selection ownership | Generation, mounted/current-module guard, captured target, synchronous pending | PASS — P1 + linked/unlinked reference + SQL exact target |
| I-15 | Queue response cũ ghi đè current filter/loading/error | Queue generation; reset selection khi đổi filter; refresh theo current loader; approved priority | PASS — late success/error, AND/4 values, pending processing/status |
| I-19 | Local state/late async result không thuộc riêng showtime/auth scope | Keyed BookingContext; read/preview generations; captured write + pending ref | PASS — A→B/A→B→A, late booking, price/seat/promo conflicts |
| I-21 | Customer order lookup và Admin reference che lỗi thành empty/null | Explicit loading/error/success, disable lookup lúc lỗi, retry current resource; dùng shared order renderer | PASS — linked/unlinked, 403/404/5xx/network/retry; shared CSKH reference giữ guard |

P1 repro đủ bốn issue: [2026-10-10T02-46-21-833Z-reproduce-p1-5ff83167](evidence/r8-2/runs/2026-10-10T02-46-21-833Z-reproduce-p1-5ff83167/environment-result.json). Regression P1 trên code cuối: [2026-10-10T07-11-40-089Z-p1-398b7bc0](evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0/environment-result.json). SQL xác nhận double-submit chỉ tạo một processing tại complaint A, chuyển selection sang B không đổi target và late write không khôi phục A; booking pending chốt đúng showtime đã submit và không hiển thị success ở showtime mới. Bản P1 đầu gắn label REAL_BROWSER_SQL cho delayed write; báo cáo này phân loại lại tình huống đó là CONTROLLED_TRANSPORT + real persisted SQL, không sửa artifact cũ.

Chính sách selection CSKH: đổi filter làm reset selected/detail/reference; sau write chỉ latest filter được refresh. Existing shared ComplaintOrderReference giữ active guard và không được viết lại; Admin chỉ sử dụng OrderReferenceDetails sẵn có để hiển thị DTO đầy đủ.

## C. P2 Results

- CSKH priority: đúng Thấp/Trung bình/Cao/Khẩn cấp; trống omit query; status/type/search/priority AND ở SQL; invalid400 và current permission403 được kiểm tra.
- ADM-02: dropdown chỉ Manager/CSKH/Admin, lấy authoritative VaiTroID/MaVaiTro từ dữ liệu được cấp quyền; không hardcode ID hoặc thêm quyền. Ba staff creates không tạo Customer profile; không có QL_VAITRO vẫn dùng mappings của user list; tampered Customer bị403/no-write.
- ADM-11…14: native step=0.01 cho money fields, datetime-local giữ0.001. Giá/giảm/phụ thu/base price thập phân thực sự persist qua CRUD; backend/SQL vẫn chốt decimal(18,2), enums, percent bounds, overlap và lịch sử.
- ADM-16: render đủ summary/byCinema/byMovie/byDate theo canonical DTO, dùng giá trị authoritative; không cộng alias hoặc tính doanh thu trong JS. Zero/empty và ledger có tiền được kiểm tra, inclusive dates + UTC+7 + failed receipt excluded.
- QLR-08: giữ bốn metric activeRooms/activeSeats/showtimesToday/paidOrdersToday; không thêm occupancy. Fixture độc lập gồm phòng inactive có ghế active, today/canceled shows và receipt23:59 ngày trước kiểm chứng semantics.

P2 repro: [2026-10-10T02-59-49-428Z-reproduce-p2-5f8b2991](evidence/r8-2/runs/2026-10-10T02-59-49-428Z-reproduce-p2-5f8b2991/environment-result.json); P2 verified: [2026-10-10T03-01-25-688Z-p2-a35e3c6f](evidence/r8-2/runs/2026-10-10T03-01-25-688Z-p2-a35e3c6f/environment-result.json). Decimal persisted CRUD, full pricing edit, report ledger và metric boundaries bổ sung trong P3/critical case selectors.

## D. P3 Results

Mỗi dòng dưới có primary case thực thi UI, HTTP/SP trace và SQL/no-write evidence; không suy ra UC PASS chỉ vì một journey chạy. Matrix và raw verification lưu tất cả supplemental cases/selector.

| UC | Actor | Main positive browser assertion | Independent SQL / real SP | Candidate |
| --- | --- | --- | --- | --- |
| KH-01 — Đăng ký | Customer | [P3-KH01-REGISTER](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-01 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-02 — Đăng nhập | Customer | [P3-KH02-LOGIN](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-02 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-03 — Profile | Customer | [P3-KH03-PROFILE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-03 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-04 — Xem phim/list/detail | Customer | [P3-KH04-CATALOG](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-04 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-05 — Xem lịch chiếu | Customer | [P3-KH05-SCHEDULE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-05 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-06 — Chọn ghế | Customer | [P3-KH06-SEATS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-06 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-07 — Đặt vé | Customer | [P3-KH07-BOOKING](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-07 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-08 — Đồ ăn kèm vé | Customer | [P3-KH08-FOOD](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-08 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-09 — Khuyến mãi | Customer | [P3-KH09-PROMOTION](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-09 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-10 — Thanh toán | Customer | [P3-KH10-PAYMENT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-10 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-11 — Lịch sử đơn | Customer | [P3-KH11-ORDERS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-11 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-12 — Chi tiết đơn | Customer | [P3-KH12-ORDER-DETAIL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-12 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-13 — Đánh giá | Customer | [P3-KH13-ELIGIBILITY](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-13 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| KH-14 — Khiếu nại | Customer | [P3-KH14-COMPLAINT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [KH-14 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-01 — Đăng nhập/rạp phân công | Manager | [P3-QLR01-LOGIN-SCOPE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-01 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-02 — Quản lý phòng | Manager | [P3-QLR02-ROOM](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-02 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-03 — Quản lý sơ đồ ghế | Manager | [P3-QLR03-SEAT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-03 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-04 — Tạo suất chiếu | Manager | [P3-QLR04-CREATE-SHOW](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-04 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-05 — Sửa suất chiếu | Manager | [P3-QLR05-UPDATE-SHOW](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-05 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-06 — Hủy suất chiếu | Manager | [P3-QLR06-CANCEL-SHOW](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-06 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-07 — Cấu hình bảng giá | Manager | [P3-QLR07-PRICING](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-07 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-08 — Dashboard hoạt động rạp | Manager | [P3-QLR08-DASHBOARD](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-08 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| QLR-09 — Doanh thu rạp | Manager | [P3-QLR09-REVENUE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [QLR-09 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| CSKH-01 — Đăng nhập | CSKH | [P3-CSKH01-LOGIN](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [CSKH-01 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| CSKH-02 — Hàng chờ khiếu nại | CSKH | [P3-CSKH02-QUEUE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [CSKH-02 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| CSKH-03 — Chi tiết khiếu nại | CSKH | [P3-CSKH03-DETAIL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [CSKH-03 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| CSKH-04 — Đơn tham chiếu | CSKH | [P3-CSKH04-REFERENCE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [CSKH-04 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| CSKH-05 — Ghi lần xử lý | CSKH | [P3-CSKH05-PROCESS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [CSKH-05 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| CSKH-06 — Đổi trạng thái | CSKH | [P3-CSKH06-STATUS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [CSKH-06 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-01 — Đăng nhập | Admin | [P3-ADM01-LOGIN](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-01 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-02 — Tài khoản người dùng | Admin | [P3-ADM02-USERS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-02 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-03 — Vai trò | Admin | [P3-ADM03-ROLES](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-03 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-04 — Danh mục quyền | Admin | [P3-ADM04-PERMISSIONS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-04 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-05 — Gán quyền vai trò | Admin | [P3-ADM05-GRANTS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-05 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-06 — Phân công quản lý | Admin | [P3-ADM06-ASSIGNMENTS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-06 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-07 — Rạp và hình ảnh | Admin | [P3-ADM07-CINEMAS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-07 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-08 — Phòng và ghế toàn hệ | Admin | [P3-ADM08-ROOM-SEAT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-08 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-09 — Phim và diễn viên | Admin | [P3-ADM09-MOVIES-CAST](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-09 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-10 — Thể loại | Admin | [P3-ADM10-GENRES](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-10 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-11 — Sản phẩm đồ ăn | Admin | [P3-ADM11-PRODUCT-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-11 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-12 — Chương trình khuyến mãi | Admin | [P3-ADM12-PROMOTION-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-12 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-13 — Bảng giá toàn hệ | Admin | [P3-ADM13-PRICING-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-13 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-14 — Suất chiếu toàn hệ | Admin | [P3-ADM14-SHOW-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-14 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-15 — Xử lý khiếu nại | Admin | [P3-ADM15-COMPLAINT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-15 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |
| ADM-16 — Báo cáo toàn hệ | Admin | [P3-ADM16-REVENUE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) | [ADM-16 selectors](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json) | PASS_CANDIDATE |

Customer có registration/profile, catalog/schedule, seat/food/promo snapshots, payment/history/detail, eligibility/duplicate review và linked/unlinked complaint; foreign resources không rò rỉ nội dung. Manager có scoped CRUD/cancel/report và revoked/no assignments. CSKH có queue/detail/reference/timeline/status, permission denials và latest-filter writes. Admin có roles/users/permissions/grants/assignment/catalog/cinema images/decimal CRUD/complaint/report cùng denied grants và invalid/historical no-write. Hai KH-02/KH-03 provisional UC được regression; không thêm ADM-17.

Các fixture clock/expired hold/failed-payment/metric/receipt boundary được ghi TEST_ONLY_FIXTURE, không phải production business logic. Thanh toán thất bại được tạo qua actual authorized REST trước UI retry; hai attempt SQL cuối có một Thất bại và một Thành công. Paid show cancellation trả compensation đúng một lần, không đổi receipt cash đã thành công; live hold409 và expired reads không ghi dữ liệu, command409 thực hiện canonical expiry có kiểm chứng.

## E. Regression & Verification

| Evidence class | Kết quả | Scope |
| --- | --- | --- |
| REAL_BROWSER_SQL | 91 | Unique selected scenario IDs; actual browser/API/SP/SQL; gồm read-only, tampered REST negatives và responsive, không gọi tất cả là mutation cases |
| CONTROLLED_TRANSPORT | 30 | Unique selected scenario IDs; response delay/substitution/network failure được ghi riêng; real SQL persistence độc lập |
| SQL assertions | 100 | Distinct artifact+JSON selector; độc lập khỏi response body; không cộng với browser test count |
| Full27 no-write fingerprints | 23 | Before == after cho denial/invalid/read-only; không cộng với SQL assertion count |
| Existing frontend tests | 62/62 PASS | UNIT/CONTRACT suite; không thay E2E |
| Frontend lint/build | PASS | [frontend-checks.json](evidence/r8-2/runs/2026-10-10T07-09-34-738Z-focus-4c2e3004/frontend-checks.json) |
| Backend tests | 192/192 PASS | Unchanged backend regression |
| No-SQL audit | PASS | 101 files scanned,27 reviewed keyword matches; unchanged backend |
| Browser diagnostics | 0 app Runtime exceptions /0 console errors | Current passing checkpoints; historical failures retained |
| A11y/responsive | PASS | Native labels/button names/Tab;390/1440; error receives keyboard focus; owned screenshots |

Counts trên là scenario ID/selector được chọn trong [selected-cases.json](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/selected-cases.json), không phải tổng mọi lần chạy và không cộng các loại test thành một số. Full primary checkpoint có57 cases/72 SQL assertions; targeted tail có5 cases, focus có2 cases, P1 có11 cases. Backend/No-SQL logs: [backend-checks.json](evidence/r8-2/runs/2026-10-10T03-39-27-215Z-edges-86caea16/backend-checks.json). Frontend source hashes cuối khớp checkpoint62/lint/build.

**Trạng thái attempt được giữ trung thực:** expanded `04-06…edges-ee272475` có76 case assertions PASS nhưng toàn runner FAILED bởi một CDP Invalid InterceptionId; critical `04-08…ebbbc731` có30 PASS và focus case FAIL. Không ghi hai attempt này thành suite PASS. Các PASS selectors có HTTP/SP/SQL, zero app exceptions/console errors và cleanup/main PASS vẫn được dùng làm case evidence; lỗi/focus được xử lý và verify bằng targeted [2026-10-10T07-08-12-036Z-edges-tail-555de763](evidence/r8-2/runs/2026-10-10T07-08-12-036Z-edges-tail-555de763/environment-result.json) và [2026-10-10T07-09-34-738Z-focus-4c2e3004](evidence/r8-2/runs/2026-10-10T07-09-34-738Z-focus-4c2e3004/environment-result.json). Không chạy lại preflight hoặc toàn45 UC khi chỉ lỗi tooling/focus còn thiếu, theo yêu cầu tiếp tục từ checkpoint.

CDP diagnostic nay tách Runtime khỏi lỗi harness, chỉ phân loại canceled interception khi có Network.loadingFailed canceled=true cùng request ID hoặc loaderId của old document khác Page.frameNavigated; lỗi không tương quan vẫn làm runner FAIL. Fetch chỉ intercept các endpoint của scenario; không intercept dashboard unrelated. Targeted tail/focus cuối có0 harness errors. Native keyboard Enter có text CR, đợi review/auth scope ổn định; không sửa production để phục vụ selector.

A11y screenshots: [responsive-additional.json](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/responsive-additional.json) (Booking/Payment/Manager6 captures), [responsive-a11y.json](evidence/r8-2/runs/2026-10-10T07-08-12-036Z-edges-tail-555de763/responsive-a11y.json) (Admin roles/revenue, CSKH, Customer complaints8 captures). Error feedback focus: [CRITICAL-FOCUS-AFTER-ERROR](evidence/r8-2/runs/2026-10-10T07-09-34-738Z-focus-4c2e3004/browser-cases.json). External Google Font/seed external image network denial thuộc môi trường, fallback/font stack giữ nguyên. Kiểm tra này giới hạn vùng thay đổi, không phải toàn-site WCAG audit.

## F. Defects, Reproduction & Failed Attempts

| Confirmed issue | Reproduction artifact | Root cause / fix | Regression |
| --- | --- | --- | --- |
| P1 four issues | [browser-cases.json](evidence/r8-2/runs/2026-10-10T02-46-21-833Z-reproduce-p1-5ff83167/browser-cases.json) | Request/context/lookup ownership | P1 + critical selectors |
| P2 native/DTO/role alignment | [browser-cases.json](evidence/r8-2/runs/2026-10-10T02-59-49-428Z-reproduce-p2-5f8b2991/browser-cases.json) | Role input, integer native step, flattened revenue | P2 + persisted P3/ledger |
| Order/Complaint/Payment late read + double payment | [browser-cases.json](evidence/r8-2/runs/2026-10-10T03-22-09-958Z-reproduce-state-b55a806a/browser-cases.json) | Key by resource/auth scope; generations; payment pending ref | Expanded targeted state cases |
| Manager/cast/grants/images double writes + genres[] | [browser-cases.json](evidence/r8-2/runs/2026-10-10T03-27-21-281Z-reproduce-mutations-d76779bf/browser-cases.json) | Synchronous refs; captured target/request; genre optional | Expanded mutation cases + catalog CRUD |
| Actor nationality optional | [browser-cases.json](evidence/r8-2/runs/2026-10-10T03-52-08-711Z-reproduce-optional-f6c6dc47/browser-cases.json) | Native required contradicts nullable contract | Optional real create; final actor edit/delete |
| Review double write; Admin late delete/status duplicate | [browser-cases.json](evidence/r8-2/runs/2026-10-10T04-02-54-951Z-reproduce-final-0763ddf3/browser-cases.json) | Review pending/read scope; Admin shared pending+module guard; confirm handlers | Final primary57 cases |
| Keyboard focus lost after review error | [browser-cases.json](evidence/r8-2/runs/2026-10-10T07-07-38-045Z-focus-0d6cfb34/browser-cases.json) | Disable submit removes focus; no feedback focus recovery | Error alert tabindex-1/ref + verified native keyboard focus |
| R81-FIND-KEY-01 | [browser-cases.json](evidence/r8-2/runs/2026-10-10T02-50-57-937Z-p1-ebdb4b39/browser-cases.json) | Old dashboard SUCCESS rows briefly rendered as complaints before new-module load | Bind state.resource; complaint identity keys retained; zero warnings |

R81-FIND-KEY-01 exact collection: khi switch dashboard→complaints, transient dashboard rows không có complaint ID tạo key warning. Không sửa thành array-index keys; resource-bound render làm collection đúng identity. Warning raw nằm tại [browser-diagnostics.json](evidence/r8-2/runs/2026-10-10T02-50-57-937Z-p1-ebdb4b39/browser-diagnostics.json).

Các attempt sai selector, stale fixture expectation, StrictMode fault không phủ latest request, login limiter và CDP parser đều giữ trong [attempt-index.json](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/attempt-index.json). Không đổi SQL/backend hoặc nới assertion để hợp thức hóa implementation. Canonical facts: historical Room DELETE200 deactivates, assignment duplicate dựa cùng period, elapsed-order view pure SELECT, seats GET pure SELECT, payment/booking commands mới expire hold; default auth limiter giữ nguyên20/60s. Session restore chỉ dùng JWT hợp lệ từ actual UI login và actual auth/me, token không xuất evidence.

Run crash CDP data: URI tại `02-56…7d871871` đã recovery all27/main/login và owned browser; [crash-recovery.json](evidence/r8-2/runs/2026-10-10T02-56-59-487Z-reproduce-p2-7d871871/crash-recovery.json), [browser-recovery.json](evidence/r8-2/runs/2026-10-10T02-56-59-487Z-reproduce-p2-7d871871/browser-recovery.json). Không gọi crash run PASS. Không còn known material incorrect-target/stale-context/frontend defect trong baseline; limitations môi trường/acceptance ghi ở mục H.

## G. Data Safety

Target duy nhất: **CinemaBookingDB_R0_R81_20261010_3d49fc44**, SQL Server **DESKTOP-E67DPCV**, database_id48, GUID **33876608-D109-43B5-ACEC-0B84C2639A73**, create date2026-10-10 08:59:01.693 local. Runtime SQL login mới cho từng run, chỉ EXECUTE trên exact Test DB, truy cập CinemaBookingDB chính bị từ chối; config được override trước backend import/startup. Chrome chạy profile/PID riêng, loopback ports động, đóng đúng process sở hữu.

159 canonical modules/27 tables trước và sau; module/protection/data hashes khớp seed. FK/Trigger enabled/trusted, không tắt constraint hoặc reseed identity. Cleanup theo actual FK topology, xóa only owned non-seed rows và restore all27 seeded values (passwords, grants với datetime precision nguyên bản, assignments, promotion quota, points, order/payment/compensation). Runtime user/login bị drop, không open user transaction. Identity gaps được loại khỏi data fingerprints và không reseed. Main read-only metadata/data/modules fingerprints trước/sau giữ nguyên.

Bằng chứng cuối: [fixture-cleanup.json](evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0/fixture-cleanup.json), [main-preservation.json](evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0/main-preservation.json), [startup.json](evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0/startup.json). Mọi completed attempt có cleanup/main PASS, crash riêng có actual guarded recovery; prepared-only folders không tính là tests. Các denial/invalid cases full27 fingerprint tại [verification-45.json](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/verification-45.json).

## H. Files, Limitations & Conclusion

Production frontend:

- [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx)
- [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx)
- [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx)
- [Complaints.jsx](../frontend/src/pages/Complaints.jsx)
- [ComplaintDetail.jsx](../frontend/src/pages/ComplaintDetail.jsx)
- [OrderDetail.jsx](../frontend/src/pages/OrderDetail.jsx)
- [PaymentPage.jsx](../frontend/src/pages/PaymentPage.jsx)
- [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx)
- [CinemaImageManager.jsx](../frontend/src/components/CinemaImageManager.jsx)
- [MovieReviews.jsx](../frontend/src/components/MovieReviews.jsx)
- [AdminRevenue.jsx](../frontend/src/components/AdminRevenue.jsx)

Existing frontend/backend tests không thay đổi;62/192 suites được tái sử dụng. Tooling mới tại `scripts/r8-2/`: guarded prepare/run/fixture cleanup/recovery, Chrome CDP browser, per-role journeys, targeted P1/P2/state/mutation/critical/final/focus/tail, checks, report/quality. Danh sách và hashes cuối: [source-manifest.json](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/source-manifest.json).

Docs: [R8_2_IMPLEMENTATION_REPORT.md](R8_2_IMPLEMENTATION_REPORT.md), [R8_FRONTEND_GAP_MATRIX.md](R8_FRONTEND_GAP_MATRIX.md), [R8_2_VERIFICATION_MATRIX.md](R8_2_VERIFICATION_MATRIX.md). Raw evidence dưới `docs/evidence/r8-2/runs/`; final45 records/case selectors/gap43/attempt inventory/counts/quality seal nằm ở [2026-10-10T07-18-11-990309Z-final-4a1123d5](evidence/r8-2/runs/2026-10-10T07-18-11-990309Z-final-4a1123d5/context.json). R8.1 và báo cáo tổng hợp cũ được bảo toàn; gap matrix lịch sử có byte-identical archive.

Limitations: external font/images bị network policy chặn, screenshots dùng approved fallback; controlled429 chứng minh UX retry/retained inputs sau response substitution (real backend đã commit), không giả làm thực nghiệm rate-limit capacity. A11y là changed-area verification. Candidate status cần R8.3 final independent acceptance; không chạy R8.3 trong task này. Không còn gap/blocker hoặc material defect mở trong scope R8.2.

**R8.2 DONE — 43 FRONTEND GAPS RESOLVED**

**45 USE CASE FRONTEND VERIFICATION READY FOR FINAL ACCEPTANCE**

**R8.3 PENDING — FINAL FRONTEND VERIFICATION & ACCEPTANCE**

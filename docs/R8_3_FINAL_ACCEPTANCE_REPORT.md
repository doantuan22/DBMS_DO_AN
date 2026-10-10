# R8.3 — Final Frontend Verification & Acceptance

**R8.3 PARTIAL — PHASE R8 NOT ACCEPTED.** Ngày 10/10/2026, Asia/Saigon.

Đã hoàn tất kiểm tra độc lập và xuất hồ sơ nghiệm thu. Có **44/45 Frontend PASS, 1 BROKEN (ADM-07)**; **42/43 gaps RESOLVED được nghiệm thu, 1 REOPENED**. Hai defect material ở quản lý ảnh rạp phải xử lý qua R8.2. Không đạt Definition of Done; không chuyển phase tiếp theo và không sửa production code trong R8.3.

## 1. Phạm vi và phương pháp

Đã đọc roadmap, R8.1 inspection, R8.2 implementation, R8 gap matrix, R8.2 verification matrix và matrix 45 UC. Đối chiếu trực tiếp 11 file Frontend đã thay ở R8.2, routes/AuthProvider/API clients, contracts và helpers/assertions browser. Baseline HEAD `f3da7f6a1b06fa30ffe223d8e0ed3e5e8cee714a`; đây là working tree R8.2 đang có sẵn, không reset/checkout hay triển khai lại công việc cũ.

Kiểm chứng SHA256 của **1.171 artifacts** trong seal R8.2 trước khi thay tài liệu. Kiểm tra từng primary case của 45 UC, 121 supplemental/primary scenario IDs, JSON Pointer, HTTP ranges, real typed SP traces, SQL assertions, no-write fingerprints và cleanup. Kết luận R8.2 DONE không được dùng làm bằng chứng tự động. [Seal audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/r82-seal-audit.json); [Independent audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/independent-evidence-audit.json); [Baseline/source hashes](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/context.json).

Tái sử dụng evidence còn hợp lệ, chạy mới Frontend tests/lint/build, ba browser cases ADM-07 và read-only Database audit. Hai negative cases mới dùng response-stage fault injection trên backend/SQL thật; phân loại CONTROLLED_TRANSPORT. Không sửa backend, Stored Procedures, CSS, palette, font, routes, production Frontend hoặc test R8.2 đã seal.

## 2. 45 Use Case — kết quả theo vai trò

| Vai trò | Tổng | PASS | PARTIAL | BROKEN | MISSING |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 15 | 0 | 1 | 0 |
| **Tổng** | **45** | **44** | **0** | **1** | **0** |

Database/Backend giữ nghiệm thu 45/45 PASS của R7; Frontend và Overall hiện là 44 PASS/1 BROKEN. Hai UC KH-02/KH-03 có actual AppRoutes regression trong journey R8.2, không dựa riêng fixture MemoryRouter lịch sử. Bảng chính và trạng thái từng UC đã cập nhật tại [USE_CASE_MATRIX_45.md](USE_CASE_MATRIX_45.md).

| UC | Vai trò | Chức năng | Frontend cuối | Primary actual browser SQL | Audit HTTP/SP/SQL/auth/state |
| --- | --- | --- | --- | --- | --- |
| KH-01 | Customer | Đăng ký | **PASS** | [P3-KH01-REGISTER](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/0` | [UC 0](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/0` |
| KH-02 | Customer | Đăng nhập | **PASS** | [P3-KH02-LOGIN](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/1` | [UC 1](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/1` |
| KH-03 | Customer | Profile | **PASS** | [P3-KH03-PROFILE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/2` | [UC 2](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/2` |
| KH-04 | Customer | Xem phim/list/detail | **PASS** | [P3-KH04-CATALOG](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/3` | [UC 3](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/3` |
| KH-05 | Customer | Xem lịch chiếu | **PASS** | [P3-KH05-SCHEDULE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/4` | [UC 4](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/4` |
| KH-06 | Customer | Chọn ghế | **PASS** | [P3-KH06-SEATS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/5` | [UC 5](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/5` |
| KH-07 | Customer | Đặt vé | **PASS** | [P3-KH07-BOOKING](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/8` | [UC 6](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/6` |
| KH-08 | Customer | Đồ ăn kèm vé | **PASS** | [P3-KH08-FOOD](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/6` | [UC 7](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/7` |
| KH-09 | Customer | Khuyến mãi | **PASS** | [P3-KH09-PROMOTION](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/7` | [UC 8](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/8` |
| KH-10 | Customer | Thanh toán | **PASS** | [P3-KH10-PAYMENT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/9` | [UC 9](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/9` |
| KH-11 | Customer | Lịch sử đơn | **PASS** | [P3-KH11-ORDERS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/10` | [UC 10](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/10` |
| KH-12 | Customer | Chi tiết đơn | **PASS** | [P3-KH12-ORDER-DETAIL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/11` | [UC 11](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/11` |
| KH-13 | Customer | Đánh giá | **PASS** | [P3-KH13-ELIGIBILITY](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/12` | [UC 12](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/12` |
| KH-14 | Customer | Khiếu nại | **PASS** | [P3-KH14-COMPLAINT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/13` | [UC 13](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/13` |
| QLR-01 | Manager | Đăng nhập/rạp phân công | **PASS** | [P3-QLR01-LOGIN-SCOPE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/40` | [UC 14](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/14` |
| QLR-02 | Manager | Quản lý phòng | **PASS** | [P3-QLR02-ROOM](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/41` | [UC 15](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/15` |
| QLR-03 | Manager | Quản lý sơ đồ ghế | **PASS** | [P3-QLR03-SEAT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/42` | [UC 16](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/16` |
| QLR-04 | Manager | Tạo suất chiếu | **PASS** | [P3-QLR04-CREATE-SHOW](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/43` | [UC 17](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/17` |
| QLR-05 | Manager | Sửa suất chiếu | **PASS** | [P3-QLR05-UPDATE-SHOW](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/44` | [UC 18](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/18` |
| QLR-06 | Manager | Hủy suất chiếu | **PASS** | [P3-QLR06-CANCEL-SHOW](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/45` | [UC 19](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/19` |
| QLR-07 | Manager | Cấu hình bảng giá | **PASS** | [P3-QLR07-PRICING](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/46` | [UC 20](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/20` |
| QLR-08 | Manager | Dashboard hoạt động rạp | **PASS** | [P3-QLR08-DASHBOARD](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/47` | [UC 21](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/21` |
| QLR-09 | Manager | Doanh thu rạp | **PASS** | [P3-QLR09-REVENUE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/48` | [UC 22](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/22` |
| CSKH-01 | CSKH | Đăng nhập | **PASS** | [P3-CSKH01-LOGIN](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/16` | [UC 23](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/23` |
| CSKH-02 | CSKH | Hàng chờ khiếu nại | **PASS** | [P3-CSKH02-QUEUE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/17` | [UC 24](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/24` |
| CSKH-03 | CSKH | Chi tiết khiếu nại | **PASS** | [P3-CSKH03-DETAIL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/18` | [UC 25](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/25` |
| CSKH-04 | CSKH | Đơn tham chiếu | **PASS** | [P3-CSKH04-REFERENCE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/19` | [UC 26](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/26` |
| CSKH-05 | CSKH | Ghi lần xử lý | **PASS** | [P3-CSKH05-PROCESS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/20` | [UC 27](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/27` |
| CSKH-06 | CSKH | Đổi trạng thái | **PASS** | [P3-CSKH06-STATUS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/21` | [UC 28](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/28` |
| ADM-01 | Admin | Đăng nhập | **PASS** | [P3-ADM01-LOGIN](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/23` | [UC 29](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/29` |
| ADM-02 | Admin | Tài khoản người dùng | **PASS** | [P3-ADM02-USERS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/24` | [UC 30](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/30` |
| ADM-03 | Admin | Vai trò | **PASS** | [P3-ADM03-ROLES](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/25` | [UC 31](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/31` |
| ADM-04 | Admin | Danh mục quyền | **PASS** | [P3-ADM04-PERMISSIONS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/26` | [UC 32](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/32` |
| ADM-05 | Admin | Gán quyền vai trò | **PASS** | [P3-ADM05-GRANTS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/27` | [UC 33](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/33` |
| ADM-06 | Admin | Phân công quản lý | **PASS** | [P3-ADM06-ASSIGNMENTS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/28` | [UC 34](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/34` |
| ADM-07 | Admin | Rạp và hình ảnh | **BROKEN** | [P3-ADM07-CINEMAS](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/29` | [UC 35](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/35` |
| ADM-08 | Admin | Phòng và ghế toàn hệ | **PASS** | [P3-ADM08-ROOM-SEAT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/30` | [UC 36](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/36` |
| ADM-09 | Admin | Phim và diễn viên | **PASS** | [P3-ADM09-MOVIES-CAST](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/32` | [UC 37](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/37` |
| ADM-10 | Admin | Thể loại | **PASS** | [P3-ADM10-GENRES](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/31` | [UC 38](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/38` |
| ADM-11 | Admin | Sản phẩm đồ ăn | **PASS** | [P3-ADM11-PRODUCT-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/33` | [UC 39](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/39` |
| ADM-12 | Admin | Chương trình khuyến mãi | **PASS** | [P3-ADM12-PROMOTION-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/34` | [UC 40](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/40` |
| ADM-13 | Admin | Bảng giá toàn hệ | **PASS** | [P3-ADM13-PRICING-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/35` | [UC 41](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/41` |
| ADM-14 | Admin | Suất chiếu toàn hệ | **PASS** | [P3-ADM14-SHOW-DECIMAL](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/36` | [UC 42](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/42` |
| ADM-15 | Admin | Xử lý khiếu nại | **PASS** | [P3-ADM15-COMPLAINT](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/37` | [UC 43](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/43` |
| ADM-16 | Admin | Báo cáo toàn hệ | **PASS** | [P3-ADM16-REVENUE](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/38` | [UC 44](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) `/UCs/44` |

Mỗi record `/UCs/N` của [verification-45.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) liên kết primary UI, HTTP thật, SP canonical, independent SQL, permission/ownership cases, controlled cases, cleanup, source freshness và defect còn mở. KH-06/KH-08 là local seat/food selection; QLR-08/CSKH-04 dùng dữ liệu đã tải khi vào màn hình/chọn detail, nên primary case không có HTTP mới. Audit ghi riêng `priorRealHTTPReadDependencies` cùng index request thực tế; không tạo request giả để lấp range rỗng. ADM-07/ADM-08 có SP delete trong supplemental negative/history cases, được ghi `supplementalTypedSPProof` với selector/timestamp; SQL rejection không biến thành SP success.

## 3. 43 gaps và bốn issue

| Category gốc R8.1 | Tổng | RESOLVED được nghiệm thu | REOPENED | Thiếu implementation |
| --- | ---: | ---: | ---: | ---: |
| FIX_REQUIRED | 7 | 7 | 0 | 0 |
| CONTRACT_ALIGNMENT_REQUIRED | 7 | 7 | 0 | 0 |
| TEST_REQUIRED | 29 | 28 | 1 | 0 |
| **Tổng** | **43** | **42** | **1** | **0** |

Giữ đúng 43 ID/category gốc; hai defect mới gắn vào **R71-FE-ADM-07**, không tạo UC/gap mở rộng. [R8_FRONTEND_GAP_MATRIX.md](R8_FRONTEND_GAP_MATRIX.md) có bảng nghiệm thu từng gap; [gaps-43.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/gaps-43.json) có record và trạng thái hiện hành.

| Issue / contract | Nghiệm thu | Cơ sở |
| --- | --- | --- |
| I-11 / ADM-15 | RESOLVED | Admin complaint read/reference/write generation, current module, captured target; primary SQL + current P1 + late reference/write selectors |
| I-15 / CSKH-02 | RESOLVED | Latest queue generation, selection reset, refresh theo current filter; stale success/error và pending writes; bốn ưu tiên + AND/omit |
| I-19 / KH-05…09 | RESOLVED | Keyed showtime/auth context, reset seat/food/promotion/result/error; A→B/A→B→A, preview invalidation, pending booking target và SQL snapshots |
| I-21 / KH-14, CSKH-04, ADM-15 | RESOLVED | Error khác empty/unlinked; explicit retry và preserved ownership/prefill; status/network faults ghi controlled |
| React key warning | RESOLVED trong vùng đã sửa | Admin chỉ render collection thuộc `state.resource===active`, stable resource IDs; primary journey và current P1/focus/tail không có console error |
| Approved contracts | PASS | CSKH priority enum/AND, ADM-02 Manager/CSKH/Admin, QLR-08 bốn metric, native money step0.01, Admin revenue đủ bốn DTO dimensions; SQL chốt money/date/scope |
| Toàn Frontend không stale/wrong-resource/error masking | **FAIL** | Hai lỗi ADM-07 bên dưới; không suy rộng bốn issue đã PASS thành toàn app PASS |

## 4. Material defects — chuyển lại R8.2

### R83-FE-01 — ảnh rạp cũ xuất hiện trong context rạp mới khi GET lỗi

**P1 / ADM-07 / R71-FE-ADM-07 / OPEN.** Source: [CinemaImageManager.jsx](../frontend/src/components/CinemaImageManager.jsx#L32), `loadImages`, `chooseCinema`, `remove` và render table. Đổi rạp chỉ reset editor, không xóa/gắn owner cho collection `images`; catch giữ images cũ, finally hạ loading và table được render lại. Write handlers kết hợp `cinemaId` hiện tại với image ID cũ.

Tái hiện: actual Admin login → Ảnh rạp → tải rạp A=1/image=1 thành công → chọn B=2 → response GET B được thay 503 → UI vẫn hiện một row A, nút Sửa/Xóa enabled. Bấm native confirmation Xóa phát **DELETE /api/admin/cinemas/2/images/1 → real HTTP404**, trong khi image thuộc rạp1. SQL ownership guard chặn thao tác; full27 fingerprints trước/sau bằng nhau. Đây là wrong-resource request/stale UI, **không có bằng chứng xóa nhầm hoặc mutation thành công**.

Expected: loading/error của B không hiển thị/mutate collection A; mutation chỉ dùng resource owner đang được hiển thị và đã xác minh. Actual: assertion FAIL. [Case FAIL](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/browser-cases.json) `/checks/1`; [image-switch-observation.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/image-switch-observation.json); [image-wrong-resource-request.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/image-wrong-resource-request.json); [no-write-r83-image-failed-switch.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/no-write-r83-image-failed-switch.json); [Screenshot](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/R83-ADM07-stale-images-after-503.png).

### R83-FE-02 — Retry danh sách rạp che lỗi, không gọi lại API

**P1 / ADM-07 / R71-FE-ADM-07 / OPEN.** Source: [CinemaImageManager.jsx](../frontend/src/components/CinemaImageManager.jsx#L29) và [retry handler](../frontend/src/components/CinemaImageManager.jsx#L86). Initial cinema-list read và image-list read dùng chung `error`; retry luôn gọi `loadImages()`.

Tái hiện: remount Ảnh rạp → hai StrictMode GET /api/admin/cinemas bị thay response503 → alert lỗi hiện đúng → bỏ fault, bấm Thử lại → **không có GET /api/admin/cinemas mới**, alert biến mất, selector chỉ còn option “Chọn rạp”. `cinemaId` trống khiến `loadImages` clear error và return. UI không thể chọn rạp dù backend sẵn sàng.

Expected: retry đọc lại resource đã thất bại, giữ feedback đến khi có kết quả và khôi phục danh sách rạp. Actual: assertion FAIL. [Case FAIL](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/browser-cases.json) `/checks/2`; [image-list-retry-observation.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/image-list-retry-observation.json); [Screenshot](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/R83-ADM07-cinema-list-retry.png).

**Yêu cầu xử lý qua R8.2:** sửa ownership/reset collection và mutation guards cho ảnh rạp; tách lifecycle/error/retry của cinema-list với image-list. Giữ visual identity và backend contracts. Kiểm chứng lại hai case trên, late success/error khi A→B→A, switch rạp trong pending create/update/delete/setcover, successful retry đúng resource, auth/grants, SQL no-write/target ownership và quality gates. R8.3 không thực hiện các production fixes này; kiểm tra nghiệm thu tiếp chỉ sau evidence R8.2 mới.

## 5. Regression, quality gates và phân loại evidence

| Kiểm tra | Kết quả / phạm vi | Bằng chứng |
| --- | --- | --- |
| Frontend tests mới | **62/62 PASS**, unit/source/contract checks; không thay E2E | [frontend-tests.log](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/frontend-tests.log) |
| Frontend lint mới | PASS / exit0 | [frontend-lint.log](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/frontend-lint.log) |
| Production build mới | PASS / exit0; artifact riêng dưới evidence | [frontend-build.log](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/frontend-build.log) |
| 45 primary actual AppRoutes journeys R8.2 | Các positive assertions PASS; ADM-07 final grade BROKEN bởi negative regression mới | [57-case primary run](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) |
| Current P1 regressions | 11 cases PASS, I-11/I-15/I-19/I-21 và SQL targets | [P1](evidence/r8-2/runs/2026-10-10T07-11-40-089Z-p1-398b7bc0/browser-cases.json) |
| Error/empty/retry, responsive Admin/CSKH/Customer | 5 tail cases PASS; 390px/1440px, labels/Tab/overflow ở vùng đã sửa | [Tail](evidence/r8-2/runs/2026-10-10T07-08-12-036Z-edges-tail-555de763/browser-cases.json) |
| Booking/payment/Manager responsive | 6 captures/1440px/390px + keyboard/labels, selected case PASS | [Final responsive](evidence/r8-2/runs/2026-10-10T04-05-08-484Z-final-edges-ee0b133b/browser-cases.json) `/checks/56` |
| Review keyboard error focus | 2 cases PASS trên code cuối; native Enter, real duplicate409, focus alert | [Focus](evidence/r8-2/runs/2026-10-10T07-09-34-738Z-focus-4c2e3004/browser-cases.json) |
| Auth/RBAC/current grants/Manager scope/Customer ownership | Selected permission/foreign resource/revoked assignment/locked JWT/no-write assertions hợp lệ; source guards không đổi | [verification-45.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/verification-45.json) |
| Booking/payment/complaint/CRUD/report/race/double-submit | Selected actual SQL và controlled assertions hợp lệ; ADM-07 error/retry **FAIL** mới | [independent-evidence-audit.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/independent-evidence-audit.json) |
| Targeted ADM-07 mới | **1 PASS / 2 FAIL**, browserStatus REPRODUCED | [browser-cases.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/browser-cases.json) |
| Runtime/console/React/harness mới | 0 exceptions, 0 consoleErrors, 0 harnessErrors | [browser-diagnostics.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/browser-diagnostics.json) |
| Backend tests + no raw SQL | Reuse 192/192 PASS; canonical/backend/shared source giữ hash, không chạy lại không cần thiết | [Checks](evidence/r8-2/runs/2026-10-10T03-39-27-215Z-edges-86caea16/backend-checks.json) |
| Toàn bộ regression PASS | **FAIL** vì hai material ADM-07 defects | [browser-cases.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/browser-cases.json) |

R8.2 có **121 unique scenario IDs: 91 REAL_BROWSER_SQL, 30 CONTROLLED_TRANSPORT**, **100 unique independent SQL assertion selectors**, **23 full27 no-write proofs**. Không cộng các số khác đơn vị. R8.3 mới thêm 3 case assertions: một real UI/API/SQL baseline và hai controlled failure cases; real DELETE404 và SQL no-write vẫn là bằng chứng độc lập ở case controlled. Không gọi hai HTTP503 giả lập là backend503 thật. REAL_BROWSER_SQL supplemental negative có thể dùng browser fetch với JWT đăng nhập UI thật; primary 45 UC dùng UI thật.

Hai full suites R8.2 vẫn **FAIL**: expanded edges có một CDP Invalid InterceptionId dù 76 browser assertions PASS; critical có 30 PASS/1 failed focus assertion sau đó được thay bằng targeted focus PASS. R8.3 chỉ tái sử dụng **38 individual PASS selectors** từ hai suites này, kiểm tra raw assertion/timestamp/ranges/SQL/no-write/cleanup và giữ runStatus FAIL. Không nâng suite thành PASS, không dùng failed focus làm bằng chứng. Legacy P2 diagnostics không có trường `harnessErrors`, ghi NOT_RECORDED_LEGACY; không suy ra 0. Primary run/P1/current tail/focus và browser R8.3 có diagnostics đầy đủ.

Component fixture/MemoryRouter evidence R7 và unit/source tests chỉ là bằng chứng hỗ trợ. Không dùng thay actual AppRoutes E2E. A11y là changed-area verification (labels, keyboard/focus/overflow), không phải audit WCAG toàn app. Main primary network failures là 128 aborted local API reads khi navigation/StrictMode và 86 external network denied; deliberate faults/expected HTTP400/403/404/409 được phân loại riêng. External font/image access bị chặn, approved fallback còn giữ; không khẳng định font screenshot parity. Build warning chunk 544.41 kB vẫn tồn tại và không phải lý do nghiệm thu thất bại.

**Lưu ý wrapper:** [environment-result.json](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/environment-result.json) ghi infrastructure status PASS/readiness READY vì startup/isolation/cleanup thành công; `browserStatus=REPRODUCED` và hai browser case FAIL. Exit0 của reproduction runner **không** có nghĩa nghiệm thu PASS.

## 6. Database safety

Browser mutation chỉ chạy SQL Test DB **CinemaBookingDB_R0_R81_20261010_3d49fc44**, server **DESKTOP-E67DPCV**, database_id **48**, GUID **33876608-D109-43B5-ACEC-0B84C2639A73**; exact reviewed identity token và guard kiểm tra trước provision/query. Test backend dùng unique login `cinema_r83_*`, EXECUTE trên test dbo và không kết nối được CinemaBookingDB. Credentials/PW snapshots ở OS temp private; không ghi secret vào evidence công khai.

27 bảng, 159 canonical modules; parity kiểm tra trước/sau và read-only audit cuối. Fixture/password/grants/rows được khôi phục toàn27 data/metadata fingerprints, zero disabled/untrusted FK/CHECK, zero disabled triggers, zero open user transactions, zero runtime users/logins còn lại. Identity counters có thể tăng theo quy ước disposable Test DB; không reseed, disable protections hoặc rollback giả kết quả.

**CinemaBookingDB không sửa/seed/mutation.** So sánh toàn27 data/metadata main trước/sau browser bằng nhau và fresh final read-only audit khớp R8.2 baseline. Main preservation PASS, mainWrites0. Không sửa/deploy Backend hay Stored Procedures.

[Runtime isolation](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/startup.json); [Fixture cleanup](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/fixture-cleanup.json); [Main preservation](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/main-preservation.json); [Fresh canonical/integrity/main audit](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/final-read-only-audit.json); [Rejected DELETE no-write](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/no-write-r83-image-failed-switch.json).

## 7. Documentation, preservation và Definition of Done

Đã cập nhật [USE_CASE_MATRIX_45.md](USE_CASE_MATRIX_45.md), [R8_FRONTEND_GAP_MATRIX.md](R8_FRONTEND_GAP_MATRIX.md), tạo báo cáo này và per-UC/per-gap audit. Archive byte-identical trước cập nhật: [USE_CASE_MATRIX_45_BEFORE_R8_3.md](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/USE_CASE_MATRIX_45_BEFORE_R8_3.md) và [R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md](evidence/r8-3/runs/2026-10-10T08-11-05-697609Z-acceptance-0d746c88/R8_FRONTEND_GAP_MATRIX_BEFORE_R8_3.md). Seal R8.2 vẫn được kiểm chứng bằng archive cho gap matrix được phép cập nhật; mọi artifact lịch sử còn lại giữ nguyên. Evidence và tooling mới nằm dưới `docs/evidence/r8-3/` và `scripts/r8-3/`; production source R8.3 changes = **0**.

| Điều kiện nghiệm thu | Kết quả |
| --- | --- |
| 43/43 gaps RESOLVED | **FAIL — 42/43; ADM-07 REOPENED** |
| 45/45 Frontend PASS | **FAIL — 44 PASS, 1 BROKEN** |
| Regression và quality gates PASS | **FAIL — tests/lint/build PASS, hai targeted business regressions FAIL** |
| Không còn material Frontend defect | **FAIL — R83-FE-01 và R83-FE-02 OPEN** |
| Main DB bảo toàn | PASS |
| Tài liệu/evidence đầy đủ và trung thực | PASS — gồm cả failed assertions, source, HTTP/SQL/no-write/cleanup |

**Quyết định cuối: R8.3 PARTIAL — PHASE R8 NOT ACCEPTED.** Yêu cầu xử lý hai lỗi ADM-07 qua R8.2 rồi kiểm chứng lại phần bị ảnh hưởng. Dừng tại R8.3 và chờ yêu cầu tiếp theo.

# BÁO CÁO DEEP LOGIC AUDIT TOÀN HỆ THỐNG CinemaBookingDB (AUDIT-ONLY)

Ngày audit: 2026-10-02/03 · Nhánh main, HEAD 7c35624 · Người thực hiện: Claude (Sonnet 5.5) · Phạm vi: backend Node/Express, frontend React, cơ sở dữ liệu SQL Server (stored procedure), seed, tài liệu.

## 1. Kết luận

**INCOMPLETE — rủi ro tổng thể: CAO.** Backend và cơ sở dữ liệu đã được audit đầy đủ bằng chạy thật; hai vùng còn NOT VERIFIED (giao diện chạy trong trình duyệt; hiệu năng ở quy mô lớn) nên không thể gọi là hoàn thành tuyệt đối.

Tìm thấy **40 finding** (đã khử trùng nguyên nhân gốc): **1 P0, 10 P1, 15 P2, 14 P3**; 38 đã PROVEN bằng chạy thật, 2 SOURCE-ONLY. Điểm nghiêm trọng nhất (LG-01): một suất chiếu đã có đơn đã thanh toán vẫn hủy được qua form sửa (PUT), khách mất tiền mà vé vẫn hiển thị hợp lệ — và DB live hiện có 3 đơn Đã thanh toán nằm trên một suất đã hủy (nguồn gốc chưa xác định, giống dữ liệu thử của đợt trước). Phân quyền theo vai trò × route sạch (0 leo thang trong 708 lời gọi), khóa ghế/giới hạn đặt vé/thanh toán chịu được tải song song (không bán trùng ghế, không thu tiền hai lần, 0 deadlock).

## 2. Xác nhận audit-only

Không sửa, thêm hay xóa tệp nào trong repo (mã nguồn, migration, test, tài liệu, cấu hình); không git commit/stash/format; không ALTER/CREATE/DROP để vá trên bất kỳ DB nào; không chạy deploy.ps1, 01_schema.sql hay script đổi mật khẩu/drop trên CinemaBookingDB; không chạm CinemaAppUser; không xóa gì trong master. Mật khẩu chỉ truyền qua biến môi trường.

**git status / git diff --stat TRƯỚC khi bắt đầu** (đã chụp vào git_before.txt, diff_before.patch, untracked_before.txt — cả ba rỗng):

```
$ git status --short
(trống)
$ git diff --stat
(trống)
```

**SAU khi hoàn tất** (đo lại ngay trước khi nộp báo cáo, báo cáo này đã được ghi):

```
$ git status --short
?? BAO_CAO_AUDIT_LOGIC_TOAN_HE.md
$ git diff --stat
(trống)
```

Kết quả: **không có thay đổi nào ngoài tệp báo cáo** (chỉ BAO_CAO_AUDIT_LOGIC_TOAN_HE.md là tệp chưa theo dõi; không tệp nào đã theo dõi bị sửa; và find -newer so với ảnh chụp ban đầu không trả về tệp nào khác trong repo, đã kiểm trước khi ghi báo cáo). Lưu ý: kho có sẵn 1 stash từ trước audit (stash@{2026-10-01 14:00}: "backup-phase9-before-rollback"), không do audit tạo ra; các tệp bị bỏ qua bởi .gitignore (backend/.env, debug.log, frontend/dist/) có mốc thời gian trước ảnh chụp ban đầu nên cũng không do audit tạo ra.

### Tệp đã tạo

1. **Duy nhất trong repo:** BAO_CAO_AUDIT_LOGIC_TOAN_HE.md (gốc repo).
2. **Ngoài repo** (thư mục tạm của phiên: C:/Users/Admin/AppData/Local/Temp/claude/d--DBMS-DO-AN/20d27b74-ff41-457e-92c6-da1527cfeed5/scratchpad/audit2/): 80 tệp — script kiểm chứng t_*.mjs, scan*.mjs, lib2.mjs, recon2.mjs, setup2.mjs, routes_parse.mjs, make_report.mjs, rep_*.mjs; SQL tạm drift.sql, hash*.sql, inv*.sql, left.sql, dup.sql; kết quả results.json, matrix.json, routes.json, fuzz_5xx.json, known_open.json, crud2.json, uc_gaps.json, state.json; nhật ký server.log, build.log, stress_*.log; ảnh chụp git_before.txt, diff_before.patch, untracked_before.txt; start_backend.sh (không chứa mật khẩu); thư mục sqltests/ gồm 18 tệp (bản sao các SQL test 08–16 đã đổi dòng USE sang AuditScratch, cùng log kết quả). Các tệp của các đợt trước nằm ở .../scratchpad/audit/.

### CSDL đã chạm

| CSDL | Mục đích | Mức truy cập | Dữ liệu |
|---|---|---|---|
| CinemaBookingDB (live) | chỉ so sánh drift và đối soát bất biến | **chỉ SELECT** (hash định nghĩa, ràng buộc, bất biến I01–I20, đếm dòng AUDIT2_) và đếm procedure trong master | không ghi gì; 0 dòng AUDIT2_ |
| CinemaBookingDB_RepoCheck | môi trường audit chính, dựng từ repo bằng deploy-isolated.ps1 -Recreate (migration 001–013), login riêng CinemaRepoUser, backend cổng 4300 trỏ vào qua biến môi trường | đọc/ghi | dữ liệu AUDIT2_ và dữ liệu stress; xem bên dưới |
| CinemaBookingDB_AuditScratch | chạy SQL test 08–16 (qua bản sao đổi USE) | đọc/ghi (mỗi test tự rollback) | không thêm dữ liệu mới; còn dữ liệu của các đợt trước |

**Dữ liệu test (RepoCheck, tiền tố AUDIT2_ và dữ liệu stress `audit.stress.*`, `ZZ_STRESS_*`, `AUDIT_STRESS_*`):** còn lại trong RepoCheck (đo cuối): 43 người dùng, 32 rạp, 63 phòng, 9 phim, 3 thể loại, 12 sản phẩm, 4 khuyến mãi, 6 vai trò/quyền, 42 khiếu nại, 140 suất chiếu (124 suất năm ≥ 2030), 60 đơn, 22 giao dịch, 17 phân công; DB live: 0 dòng AUDIT2_ (22 suất, 29 đơn, 13 giao dịch như trước audit). **Đã dọn:** các bản ghi tạm mà từng test tự tạo rồi xóa được bằng API (phim, sản phẩm, vai trò, quyền, thể loại trong t_crud/t_p1/t_free…) đã được xóa ngay; các suất chiếu tạm gây cản trở bị hủy bằng API (kể cả hai suất kết thúc 9999-12-31 và cặp chồng lịch); dữ liệu NUL ở GHE/THELOAI đã được sửa lại bằng UPDATE trên RepoCheck để các test sau không bị nhiễm. **Còn lại và lý do:** phần còn lại là dữ liệu do fuzz (2880 request) và các test khác tạo ra và không dọn, được giữ làm bằng chứng và vì API không xóa được (suất chiếu/phòng có lịch sử, khiếu nại, người dùng, đơn hàng); DB là bản dùng một lần, chủ dự án có thể DROP CinemaBookingDB_RepoCheck và các login CinemaRepoUser, CinemaAuditUser. **Fixture SQL ghi trực tiếp trên RepoCheck:** đưa suất về quá khứ và đặt một đơn seed của user 7 sang "Đã thanh toán" (S-06), UPDATE HanGiuCho để nhả giữ chỗ, đặt phim "Ngừng chiếu"/phòng "Bảo trì"/rạp "Tạm đóng" (P-01, P-04), chèn rồi xóa một dòng PHIM_THELOAI (FZ-02). Backend cổng 4300 đã dừng khi kết thúc.

## 3. Môi trường

| Hạng mục | Giá trị |
|---|---|
| Máy chủ SQL | SQL Server 2025, RCSI bật, đồng hồ máy chủ UTC+7 (DATEDIFF(HOUR, SYSUTCDATETIME(), SYSDATETIME()) = 7) |
| DB audit | CinemaBookingDB_RepoCheck (chính), CinemaBookingDB_AuditScratch (SQL test) |
| Cách dựng | database/deployment/deploy-isolated.ps1 -Recreate với DEPLOY_APP_PASSWORD trong biến môi trường; build.log cho thấy migration 009 → 013 chạy "Deployment finished." |
| Phiên bản migration | đến 013_pricing_overlap_and_weekend.sql (13 migration) |
| Backend | Node 24, Express 5, mssql; chạy cổng 4300 với DB_DATABASE=CinemaBookingDB_RepoCheck, DB_USER=CinemaRepoUser, DB_PASSWORD qua env |
| Tải SQL | sqlcmd -d {tên DB} -I -f 65001 -b (các tệp test chạy qua bản sao trong scratchpad vì tệp repo có sẵn dòng USE CinemaBookingDB) |

**Kiểm kê so với source** (đủ để khẳng định không có đối tượng thừa/thiếu):

- Route backend: **118** (công khai 14, mọi người dùng đăng nhập 3, khách 10, manager 18, CSKH 5, admin 68); toàn bộ có trong matrix.json.
- Đối tượng DB thực tế: 26 bảng, 6 view, 14 function, 7 trigger, 121 procedure (148 đối tượng lập trình được) — 121 procedure khớp 121 procedure parse từ source (procedures/ + migrations/); không đối tượng nào thiếu hoặc dư.
- Delta so với source: **0** (hash định nghĩa MD5 của 148 đối tượng và 313 dấu vân tay cột/CHECK/index/FK giống nhau giữa RepoCheck, AuditScratch và live).
- **Drift live vs repo (chỉ SELECT): không có.** CinemaBookingDB live đã có đủ 009–013 (trigger TRG_BangGia_KiemTraChongLan, giới hạn 3 đơn 50028, hàm cuối tuần độc lập DATEFIRST, 0 khuyến mãi phần trăm > 99). Giả định ban đầu "live có thể thiếu 012/013" **bị bác bỏ** (ENV-01).
- Frontend: các tuyến trong frontend/src/routes/index.jsx, 3 portal (AdminPortal 212 dòng dạng CRUD tổng quát, ManagerPortal 18 dòng, SupportPortal 55 dòng). Thư mục pages/admin, pages/manager, pages/support, pages/customer, pages/public rỗng.
- master: 19 procedure sp_Admin_*/usp_Admin_* dư (KNOWN-OPEN, chỉ đếm, không đụng).

## 4. Bảng finding

Mức độ theo tiêu chí của nhiệm vụ (P0 mất/sai tiền, bán trùng ghế, lộ/sửa dữ liệu người khác, leo thang đặc quyền; P1 chặn luồng chính hoặc sai dữ liệu/thống kê trong dùng bình thường; P2 sai ở ca biên, lệch hợp đồng, thiếu ràng buộc phòng thủ, 500 thay vì 4xx; P3 tài liệu/bảo trì/mã chết). PROVEN+SOURCE = triệu chứng đã tái hiện bằng chạy thật, nguyên nhân gốc đọc từ source.

| ID | P | Độ tin cậy | Tầng | UC | Mô tả |
|---|---|---|---|---|---|
| LG-01 | P0 | PROVEN | DB+BE | QLR-05, QLR-06, ADM-14, KH-10, KH-12 | Suất chiếu đã có đơn ĐÃ THANH TOÁN vẫn bị hủy được qua PUT; khách mất tiền, vé còn "hợp lệ", doanh thu vẫn tính |
| LG-02 | P1 | PROVEN | DB | KH-10 | Thanh toán thành công được cho đơn thuộc suất đã bị hủy hoặc đã bị dời vào quá khứ |
| LG-03 | P1 | PROVEN | DB+BE | QLR-05, ADM-14, KH-13 | Đổi phim / giờ chiếu của suất đã bán vé; có thể giả "bằng chứng đã xem" để đánh giá phim |
| LG-04 | P1 | PROVEN | DB | QLR-03, KH-06 | Manager đánh dấu ghế ĐÃ BÁN là "Hỏng/Bảo trì"; bộ đếm ghế trống sai (có thể âm) |
| LG-05 | P1 | PROVEN | DB | QLR-04, ADM-14 | KNOWN-OPEN xác nhận còn + hậu quả nặng hơn: race tạo suất chiếu làm hai suất chồng lịch trong một phòng |
| LG-06 | P1 | PROVEN | DB (view) | KH-04, KH-13 | Số lượt đánh giá phim hiển thị công khai bị nhân lên theo số suất chiếu |
| LG-07 | P1 | PROVEN | BE+DB | QLR-02, QLR-05 | Manager không bao giờ ngưng được phòng hay đóng bán suất: validator và CHECK của DB dùng hai cách viết khác nhau |
| LG-08 | P1 | PROVEN | DB | KH-05, KH-07 | Phòng "Bảo trì", rạp "Tạm đóng", phim "Ngừng chiếu" vẫn hiện trong lịch chiếu và vẫn đặt được vé |
| LG-09 | P1 | PROVEN+SOURCE | BE+DB+FE | KH-05, KH-07, KH-11, KH-12, QLR-04 | Hai đồng hồ lẫn nhau (UTC của driver Node và SYSDATETIME() giờ máy chủ UTC+7): suất ngừng bán sớm 7 giờ, giờ đơn đặt lệch +7 giờ |
| LG-10 | P1 | PROVEN | DB | QLR-02, QLR-03 | Manager xóa phòng đua với việc tạo suất: phòng giữ lại suất nhưng mất TOÀN BỘ sơ đồ ghế |
| LG-11 | P1 | PROVEN | SEED/CFG | ADM-01, QLR-01, CSKH-01, KH-02 | Seed tạo sẵn tài khoản ADMIN/MANAGER/CSKH/KHÁCH với mật khẩu 123456 trong mọi lần triển khai |
| LG-12 | P2 | PROVEN | BE | QLR-02..07, ADM-02..14 | 500 thay vì 4xx: số nguyên ≥ 2^31 và số thập phân quá lớn lọt qua validator admin/manager (32 tổ hợp) |
| LG-13 | P2 | PROVEN | BE+DB | ADM-07..11, QLR-03, KH-12, KH-04 | Ký tự NUL (U+0000) được lưu vào 18 cột văn bản và làm hỏng FOR XML: danh sách phim công khai và chi tiết đơn trả 500 |
| LG-14 | P2 | PROVEN | BE+DB | QLR-04, ADM-14 | Tạo suất chiếu thiếu cận: kết thúc 9999-12-31, bắt đầu năm 2001, phim không tồn tại → 500, định dạng không khớp loại phòng |
| LG-15 | P2 | PROVEN | BE | ADM-03, ADM-07 | Hai route đọc của admin bỏ qua error mapper: id không tồn tại → 500 (sót của đợt sửa 1–3) |
| LG-16 | P2 | PROVEN | DB | ADM-02 | Admin duy nhất tự khóa tài khoản của mình → hệ thống không còn admin |
| LG-17 | P2 | PROVEN | BE+DB | ADM-05 | Xóa hết quyền của vai trò ADMIN khóa toàn bộ admin ra khỏi portal |
| LG-18 | P2 | PROVEN | BE | ADM-02, KH-02 | Mật khẩu 73–128 ký tự do admin tạo không đăng nhập được; bcrypt cắt ở 72 byte |
| LG-19 | P2 | PROVEN | BE | KH-02, QLR-01, CSKH-01, ADM-01 | Không giới hạn thử mật khẩu: 60 lần sai liên tiếp trên tài khoản nhân viên không bị chậm hay khóa |
| LG-20 | P2 | PROVEN | DB+BE | KH-01, KH-03 | Một số điện thoại thật tạo được nhiều tài khoản bằng cách viết khác định dạng |
| LG-21 | P2 | PROVEN | BE+DB | ADM-14, ADM-11, KH-07, KH-08, KH-10 | Giá tiền không có cận: giá vé 0 (KNOWN-OPEN, biến thể nặng hơn) và sản phẩm giá 0 hoặc 1e12 |
| LG-22 | P2 | PROVEN+SOURCE | FE | KH-13 | Mọi HTTP 403 đều đá người dùng sang /forbidden: khách chưa xem phim mất trang và nội dung đã gõ khi đánh giá |
| LG-23 | P2 | PROVEN | DB (trigger) | QLR-05, ADM-14 | Trigger chống chồng lịch không có IF UPDATE: sau race LG-05 cặp suất chồng lịch không sửa được kể cả chỉ đổi giá |
| LG-24 | P2 | PROVEN | DB | KH-04 | Phim trạng thái "Ngừng chiếu" vẫn nằm trong danh sách công khai (cần chủ dự án xác nhận ý đồ) |
| LG-25 | P2 | PROVEN | DB | CSKH-05, CSKH-06, ADM-15 | Khiếu nại không có máy trạng thái: "Đã đóng/Từ chối/Đã giải quyết" mở lại và đổi qua lại tự do (cần xác nhận ý đồ) |
| LG-26 | P2 | SOURCE-ONLY | FE | ADM-03..14, QLR-04, QLR-05 | Portal admin/manager: trường enum, giờ ISO và danh sách quyền đều là ô nhập tự do (ba tầng lệch nhau) |
| LG-27 | P3 | PROVEN | BE | KH-01, KH-02 | Lộ tài khoản tồn tại: đăng nhập sai email nhanh ~3 ms so với ~91 ms (bcrypt); đăng ký trả 409 EMAIL_IN_USE/PHONE_IN_USE |
| LG-28 | P3 | PROVEN | BE | KH-01, KH-03 | Mật khẩu yếu (8 dấu cách, 12345678) và ngày sinh vô lý (2999, 1800) được chấp nhận |
| LG-29 | P3 | PROVEN | DB | KH-03, ADM-02 | Nhân viên cập nhật hồ sơ tạo dòng HOSOKHACHHANG; khách do admin tạo thì KHÔNG có hồ sơ nên không bao giờ được tích điểm |
| LG-30 | P3 | PROVEN | BE | ADM-09, ADM-11 | Quy tắc URL không nhất quán: ảnh rạp bắt http(s)/đường dẫn tuyệt đối, poster/trailer/ảnh sản phẩm nhận cả "javascript:" |
| LG-31 | P3 | PROVEN | BE+DB | ADM-09, ADM-11, ADM-12 | Biên dữ liệu danh mục: phim thời lượng 99.999.999 phút, trùng tên phim/sản phẩm khác hoa-thường; sửa khuyến mãi đã dùng; lỗi chung INVALID_REFERENCE |
| LG-32 | P3 | PROVEN | BE+DB | KH-04, KH-05, KH-06, CSKH-02 | Dữ liệu công khai & hợp đồng: lộ họ tên đầy đủ người đánh giá; id lạ trả 200 danh sách rỗng thay vì 404; LIKE không escape % _ và phân biệt dấu; /health/db công khai lộ tên DB; JSON hỏng trả 400 mã INTERNAL_ERROR |
| LG-33 | P3 | PROVEN | BE+DB | KH-11, CSKH-02, ADM-02 | Không có phân trang ở bất kỳ danh sách nào (hôm nay P3, ở quy mô lớn P2 — chưa đo) |
| LG-34 | P3 | PROVEN+SOURCE | DB+BE | QLR-02, QLR-07, ADM-02 | Id không tồn tại cho kết quả không nhất quán: 403 MANAGER_CINEMA_FORBIDDEN thay vì 404, hoặc 200 {user:null}; 23 procedure admin/manager UPDATE không kiểm tra @@ROWCOUNT |
| LG-35 | P3 | PROVEN | DB+BE | KH-14, CSKH-05, ADM-06 | Khiếu nại: nội dung 90 KB và 25 khiếu nại song song đều được nhận; phân công quản lý chồng/trùng được nhận và POST /admin/assignments đòi trường "status" vô nghĩa |
| LG-36 | P3 | PROVEN | BE | KH-01 | Nhật ký ứng dụng ghi email/SĐT của người dùng qua thông điệp lỗi 2627/2601 |
| LG-37 | P3 | SOURCE-ONLY | DB+BE | KH-10, KH-12 | Mã/trạng thái chết: sp_Order_Cancel, sp_Manager_Seat_BatchCreate không có nơi gọi; trạng thái đơn Hoàn thành/Hoàn tiền, vé Đã sử dụng, thanh toán Đã hoàn tiền không procedure nào đặt; điểm thưởng chỉ cộng, không thể dùng; giá "Ngày lễ" (6 dòng seed) không bao giờ áp dụng |
| LG-38 | P3 | PROVEN | SEED | ADM-12, KH-09 | Dữ liệu seed/lịch sử vi phạm bất biến hiện hành: số dùng khuyến mãi gõ tay (GIAM30K 20, VIPMEMBER 5 không có đơn nào), 1 đơn hết hạn có tổng âm (giảm 120.000 trên vé 80.000, tạo trước giới hạn 99%) |
| LG-39 | P3 | PROVEN | BE | KH-02, ADM-02 | Không thu hồi token: token cũ của người bị khóa rồi mở khóa vẫn dùng được (cùng token, hạn 1 giờ); không có đăng xuất phía máy chủ |
| LG-40 | P3 | PROVEN+SOURCE | DB | QLR-08, QLR-09, ADM-16 | Cùng một khái niệm "đơn/suất hôm nay" được định nghĩa khác nhau ở dashboard và báo cáo doanh thu |

## 5. Chi tiết finding

Mọi "đề xuất sửa" **chưa được áp dụng**. Mã bằng chứng (M-02, C-01…) tra ở Phụ lục A.

### LG-01 — Suất chiếu đã có đơn ĐÃ THANH TOÁN vẫn bị hủy được qua PUT; khách mất tiền, vé còn "hợp lệ", doanh thu vẫn tính

- **Mức độ:** P0 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** trung bình: cần nhân viên đổi trạng thái suất bằng form sửa (thao tác bình thường nhưng không thường xuyên) · **Tầng:** DB+BE · **UC:** QLR-05, QLR-06, ADM-14, KH-10, KH-12 · **Bằng chứng:** M-02, R-06, I11/I12
- **Tái hiện:** Admin/manager gọi PUT /api/(manager|admin)/showtimes/:id với status "Đã hủy" cho một suất có đơn Đã thanh toán (endpoint chuyên dụng POST .../cancel thì chặn đúng: 409 SHOWTIME_HAS_BOOKINGS).
- **Thực tế:** PUT trả 200. DB: suất = "Đã hủy", đơn vẫn "Đã thanh toán", vé vẫn "Đã đặt"; khách xem đơn vẫn thấy vé hợp lệ; suất không còn đặt được (409 SHOWTIME_UNAVAILABLE). Doanh thu vẫn cộng 90.000 của đơn này (R-06). Trên DB live hiện có 3 đơn Đã thanh toán (26, 27, 28) nằm trên suất 34 đã hủy (truy vấn I11/I12) — đúng hậu quả này; nguồn gốc 3 đơn chưa xác định (tạo cùng một giây 2026-10-01 17:02, giống dữ liệu thử của đợt trước) nhưng chúng là bằng chứng của trạng thái hỏng.
- **Mong đợi:** Giống endpoint cancel: 409 SHOWTIME_HAS_BOOKINGS, hoặc hủy kèm hoàn tiền/hủy vé có kiểm soát.
- **Nguyên nhân gốc:** database/procedures/manager/manager_procedures.sql:462 (sp_Manager_Showtime_Update) và database/migrations/008_admin_global_portal.sql:283 (usp_Admin_Showtime_Update) ghi TrangThai/PhimID/thời gian mà không có kiểm tra đơn đang giữ/đã thanh toán (mã 50118 chỉ có trong sp_*_Showtime_Cancel). managerValidator SHOWTIME_STATUSES còn cho phép "Đã hủy" ở PUT.
- **Tác động:** Mất tiền của khách (không có luồng hoàn tiền nào trong hệ thống — KNOWN-OPEN sp_Order_Cancel không có route), thống kê doanh thu sai, vé của khách trỏ tới suất không còn tồn tại. Xảy ra khi người vận hành đổi trạng thái bằng form sửa suất — thao tác bình thường.
- **Đề xuất sửa (chưa áp dụng):** Một guard chung "suất có đơn Chờ thanh toán còn hạn / Đã thanh toán" dùng cho Update (đổi status, phim, giờ, phòng) và Cancel; Update không được nhận status "Đã hủy" (buộc đi qua Cancel). Chốt chính sách hoàn tiền trước (câu hỏi Q1).
- **Cách kiểm chứng bản sửa:** Test SQL: tạo suất + đơn đã thanh toán, gọi cả hai Update → phải 50118/409; test API: PUT status "Đã hủy" → 409; truy vấn I11/I12 = 0 sau chuỗi thao tác.

### LG-02 — Thanh toán thành công được cho đơn thuộc suất đã bị hủy hoặc đã bị dời vào quá khứ

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** thấp–trung bình: cần LG-01/LG-03, hoặc khách thanh toán sát giờ chiếu · **Tầng:** DB · **UC:** KH-10 · **Bằng chứng:** F-01, KO-01
- **Tái hiện:** Khách tạo đơn Chờ thanh toán; admin PUT suất sang "Đã hủy" (hoặc dời 2020-01-01); khách POST /orders/:id/payments rồi /result {status:"Thành công"}.
- **Thực tế:** attempt=201, result=200, đơn = "Đã thanh toán" trên suất "Đã hủy"; trường hợp dời về 2020 cũng 201/200.
- **Mong đợi:** Từ chối thanh toán khi suất không còn Mở bán hoặc đã bắt đầu.
- **Nguyên nhân gốc:** database/migrations/012_booking_limits_and_pricing.sql:552-610 (sp_Payment_CreateAttempt) và database/procedures/customer/customer_procedures.sql:798+ (sp_Payment_UpdateResult, nhánh thành công) chỉ kiểm tra trạng thái đơn và hạn giữ; chỉ nhánh "thanh toán muộn" mới kiểm tra suất.
- **Tác động:** Khách trả tiền cho suất không diễn ra. Kết hợp LG-01/LG-03 là đường thực tế để có đơn đã trả tiền trên suất đã hủy. Biến thể tự nhiên không cần PUT: đặt lúc 18:58 cho suất 19:00, thanh toán 19:02 vẫn thành công (P2).
- **Đề xuất sửa (chưa áp dụng):** Cả CreateAttempt và UpdateResult khóa SUATCHIEU (UPDLOCK) và yêu cầu TrangThai = N'Mở bán' AND ThoiGianBatDau > @Now trước khi ghi nhận thành công.
- **Cách kiểm chứng bản sửa:** Mở rộng SQL test 15: hủy/đổi giờ suất giữa lúc có đơn chờ → CreateAttempt và UpdateResult đều lỗi mới, đơn không thành Đã thanh toán.

### LG-03 — Đổi phim / giờ chiếu của suất đã bán vé; có thể giả "bằng chứng đã xem" để đánh giá phim

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** thấp: cần nhân viên đổi phim/giờ của suất đã bán · **Tầng:** DB+BE · **UC:** QLR-05, ADM-14, KH-13 · **Bằng chứng:** M-03
- **Tái hiện:** PUT showtime đã có đơn Đã thanh toán: movieId=3, startsAt=2020-01-01, status "Hoàn thành".
- **Thực tế:** 200. Đơn của khách đổi thành phim Oppenheimer, giờ 2020-01-01. Trước PUT: đánh giá phim 3 = 403 REVIEW_NOT_ELIGIBLE; sau PUT: 201.
- **Mong đợi:** Suất đã bán chỉ đổi được các trường không ảnh hưởng vé (hoặc bị chặn).
- **Nguyên nhân gốc:** manager_procedures.sql:462 và 008_admin_global_portal.sql:283 (không guard vé đã bán); TRG_DanhGia_KiemTraDaXemPhim (04_triggers.sql:133-154) chỉ kiểm tra "đơn đã thanh toán + giờ suất ≤ hiện tại".
- **Tác động:** Vé của khách âm thầm thành vé phim/giờ khác; nhân viên có thể tạo điều kiện đánh giá cho phim bất kỳ (làm sai điểm trung bình công khai).
- **Đề xuất sửa (chưa áp dụng):** Cùng guard với LG-01; riêng trigger đánh giá nên yêu cầu thời điểm kết thúc thật và không cho đổi PhimID/giờ khi có vé.
- **Cách kiểm chứng bản sửa:** Test SQL + API: PUT đổi movieId/startsAt trên suất có vé → lỗi; đánh giá sau đó vẫn 403.

### LG-04 — Manager đánh dấu ghế ĐÃ BÁN là "Hỏng/Bảo trì"; bộ đếm ghế trống sai (có thể âm)

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** trung bình: manager bảo trì ghế đã có người mua · **Tầng:** DB · **UC:** QLR-03, KH-06 · **Bằng chứng:** M-05
- **Tái hiện:** PUT /api/manager/seats/:id {type:"Thường", status:"Hỏng"} trên ghế có vé đã thanh toán (route admin cùng thao tác trả 409 SEAT_HAS_TICKET_HISTORY).
- **Thực tế:** Manager 200; sơ đồ ghế hiện "Bảo trì" dù vé đã trả tiền; số ghế trống 39/40 → 38/39.
- **Mong đợi:** 409 SEAT_HAS_TICKET_HISTORY như route admin.
- **Nguyên nhân gốc:** manager_procedures.sql:272 (sp_Manager_Seat_Update) thiếu guard 50207 mà usp_Admin_Seat_Update (008_admin_global_portal.sql:163) có; vw_LichChieuChiTiet tính SoGheConLai = ghế hoạt động − vé đang giữ.
- **Tác động:** Khách đã trả tiền mất ghế trên sơ đồ; số liệu ghế trống sai.
- **Đề xuất sửa (chưa áp dụng):** Đưa guard vào sp_Manager_Seat_Update (dùng chung một hàm kiểm tra "ghế có vé còn hiệu lực ở suất tương lai").
- **Cách kiểm chứng bản sửa:** Test SQL cho cả hai vai trò; invariant: không có vé hiệu lực nào trên ghế không-Hoạt động.

### LG-05 — KNOWN-OPEN xác nhận còn + hậu quả nặng hơn: race tạo suất chiếu làm hai suất chồng lịch trong một phòng

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** hiếm: cần hai người vận hành tạo suất cùng phòng cùng lúc · **Tầng:** DB · **UC:** QLR-04, ADM-14 · **Bằng chứng:** C-01, KO-05
- **Tái hiện:** 4 vòng × 30 request song song POST /admin/showtimes với các khung giờ giao nhau trong phòng 5.
- **Thực tế:** Mỗi vòng 2–3/30 request thành công thay vì 1; 1 cặp suất chồng lịch được lưu (RepoCheck, invariant I10 = 1).
- **Mong đợi:** Tối đa một suất trong tập giao nhau; 0 cặp chồng lịch.
- **Nguyên nhân gốc:** database/triggers/04_triggers.sql:19-54 (TRG_SuatChieu_KiemTraTrungLich) là AFTER trigger không khóa; dưới RCSI hai giao dịch không thấy dòng chưa commit của nhau.
- **Tác động:** Hai suất cùng phòng cùng giờ bán cùng các ghế vật lý hai lần; cặp chồng lịch còn không sửa được (LG-23). Cần hai người vận hành thao tác đồng thời nên hiếm.
- **Đề xuất sửa (chưa áp dụng):** Trong sp tạo/sửa suất: lấy khóa ứng dụng (sp_getapplock theo PhongID) hoặc UPDLOCK/HOLDLOCK trên PHONGCHIEU trước khi kiểm tra chồng lịch, giữ trigger làm lớp phòng thủ thứ hai.
- **Cách kiểm chứng bản sửa:** Chạy lại tải 4×30: 0 cặp chồng lịch; thêm kịch bản vào database/tests/stress.

### LG-06 — Số lượt đánh giá phim hiển thị công khai bị nhân lên theo số suất chiếu

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** luôn xảy ra khi phim có nhiều suất và ít nhất một đánh giá · **Tầng:** DB (view) · **UC:** KH-04, KH-13 · **Bằng chứng:** S-07
- **Tái hiện:** GET /api/movies/1 so với SELECT COUNT(*) FROM DANHGIAPHIM WHERE PhimID=1.
- **Thực tế:** Đo 1: 2 đánh giá × 14 suất = hiển thị 28; sau khi audit thêm suất: 3 đánh giá × 60 suất = hiển thị 180 (vw_ThongKePhim.SoLuotDanhGia = 180). Điểm trung bình đúng (nhân đều nên không đổi).
- **Mong đợi:** reviewCount = số đánh giá thật.
- **Nguyên nhân gốc:** database/views/03_views.sql:262-267: LEFT JOIN DANHGIAPHIM và LEFT JOIN SUATCHIEU cùng lúc, COUNT(dg.DanhGiaID) đếm lặp (join nhân dòng).
- **Tác động:** Sai số liệu công khai trong dùng bình thường, càng thêm suất càng sai.
- **Đề xuất sửa (chưa áp dụng):** COUNT(DISTINCT dg.DanhGiaID) hoặc tính riêng hai nhóm bằng subquery/CTE; thêm test đối chiếu số liệu thô.
- **Cách kiểm chứng bản sửa:** So sánh API với truy vấn thô trên dữ liệu có nhiều suất.

### LG-07 — Manager không bao giờ ngưng được phòng hay đóng bán suất: validator và CHECK của DB dùng hai cách viết khác nhau

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** luôn xảy ra khi manager thử ngưng phòng/đóng bán · **Tầng:** BE+DB · **UC:** QLR-02, QLR-05 · **Bằng chứng:** M-01
- **Tái hiện:** PUT /manager/rooms/:id với status "Ngừng hoạt động" (giá trị validator); PUT showtime status "Tạm ngừng".
- **Thực tế:** Giá trị validator → 500 EREQUEST (vi phạm CHECK); giá trị DB ("Ngưng hoạt động", "Đóng bán") → 400 INVALID_REQUEST (validator từ chối).
- **Mong đợi:** Manager đặt được trạng thái hợp lệ.
- **Nguyên nhân gốc:** backend/src/validators/managerValidator.js ROOM_STATUSES/SHOWTIME_STATUSES lệch CK_PHONGCHIEU_TrangThai / CK_SUATCHIEU_TrangThai; managerError không ánh xạ 547.
- **Tác động:** Chức năng chính của QLR-02/QLR-05 (ngưng phòng, tạm dừng bán) không dùng được; thao tác thất bại bằng lỗi 500.
- **Đề xuất sửa (chưa áp dụng):** Một nguồn sự thật cho tập trạng thái (hằng số dùng chung hoặc đọc từ CHECK), validator khớp DB, ánh xạ 547 → 400.
- **Cách kiểm chứng bản sửa:** Test bảng: mỗi giá trị CHECK được chấp nhận, giá trị khác bị 400, không giá trị nào gây 500.

### LG-08 — Phòng "Bảo trì", rạp "Tạm đóng", phim "Ngừng chiếu" vẫn hiện trong lịch chiếu và vẫn đặt được vé

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** khi có phòng/rạp/phim đang ngưng · **Tầng:** DB · **UC:** KH-05, KH-07 · **Bằng chứng:** P-04
- **Tái hiện:** Đặt trạng thái từng đối tượng cha rồi liệt kê suất / đặt vé.
- **Thực tế:** Cả ba trường hợp: suất vẫn liệt kê (listed=true) và POST /bookings = 201.
- **Mong đợi:** Suất của đối tượng cha không hoạt động bị ẩn và không đặt được (hoặc có quy tắc rõ).
- **Nguyên nhân gốc:** customer_procedures.sql:161-… (sp_Showtime_ListByMovie) lọc theo trạng thái suất + giờ; migrations/012_booking_limits_and_pricing.sql:306-319 (sp_Booking_Create) chỉ kiểm tra trạng thái/giờ suất và trạng thái ghế, không kiểm tra phòng/rạp/phim.
- **Tác động:** Bán vé vào phòng đang bảo trì hoặc rạp đã đóng. Chờ chủ dự án xác nhận quy tắc cho vé đã bán (Q3).
- **Đề xuất sửa (chưa áp dụng):** Thêm điều kiện trạng thái phòng/rạp/phim vào danh sách suất, sơ đồ ghế và sp_Booking_Create.
- **Cách kiểm chứng bản sửa:** Test SQL: mỗi trạng thái cha ngưng → suất không liệt kê, đặt vé lỗi.

### LG-09 — Hai đồng hồ lẫn nhau (UTC của driver Node và SYSDATETIME() giờ máy chủ UTC+7): suất ngừng bán sớm 7 giờ, giờ đơn đặt lệch +7 giờ

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN+SOURCE · **Khả năng xảy ra:** luôn xảy ra khi máy chủ không ở UTC · **Tầng:** BE+DB+FE · **UC:** KH-05, KH-07, KH-11, KH-12, QLR-04 · **Bằng chứng:** TZ-01, TZ-02, F-03, FE-05
- **Tái hiện:** Tạo suất bằng thời điểm UTC thật rồi liệt kê/đặt; gõ giờ không kèm múi giờ như form Manager mặc định.
- **Thực tế:** Suất bắt đầu sau +1h, +3h, +6h: không liệt kê, đặt vé 409 SHOWTIME_UNAVAILABLE; +8h: liệt kê và đặt được. "19:00" không kèm múi giờ lưu 12:00; "19:00Z" lưu 19:00; "19:00+07:00" lưu 12:00. bookedAt trả 2026-10-03T00:01Z trong khi UTC thật là 17:01Z.
- **Mong đợi:** Một đồng hồ duy nhất, giờ gõ = giờ lưu = giờ so sánh = giờ hiển thị.
- **Nguyên nhân gốc:** backend/src/config/database.js (không đặt useUTC → driver đổi mọi giá trị sang UTC) so với database/migrations/012…:204,294,317,363 và các view/procedure so với SYSDATETIME(); NgayDat/HanGiuCho/NgayThanhToan ghi bằng SYSDATETIME() nhưng mssql trả về như UTC. Frontend: frontend/src/pages/ManagerPortal.jsx:6-7 sinh chuỗi không múi giờ từ toISOString().
- **Tác động:** Với máy chủ khác UTC (đúng với máy này), mọi suất ngừng bán sớm đúng bằng độ lệch múi giờ; thời gian đơn hàng hiển thị sai; báo cáo theo ngày lệch ranh giới (R-04). Dữ liệu seed là giờ địa phương nên chỉ lộ ra với dữ liệu tạo qua API.
- **Đề xuất sửa (chưa áp dụng):** Chọn một chuẩn (đề xuất: lưu UTC bằng SYSUTCDATETIME() và so sánh UTC, hoặc đặt useUTC=false và dùng giờ địa phương thống nhất) rồi sửa đồng bộ driver, procedure, view, báo cáo và form FE (bộ chọn ngày-giờ có múi giờ rõ ràng).
- **Cách kiểm chứng bản sửa:** Chạy lại TZ-01/TZ-02 với máy chủ ở hai múi giờ khác nhau (UTC và UTC+7): kết quả phải giống nhau.

### LG-10 — Manager xóa phòng đua với việc tạo suất: phòng giữ lại suất nhưng mất TOÀN BỘ sơ đồ ghế

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** hiếm: hai thao tác trong vài mili-giây · **Tầng:** DB · **UC:** QLR-02, QLR-03 · **Bằng chứng:** C-04, TXN-01
- **Tái hiện:** 60 vòng: DELETE /manager/rooms/:id song song với POST /admin/showtimes cho cùng phòng.
- **Thực tế:** 1/60 vòng: DELETE trả 500 EREQUEST, phòng vẫn tồn tại kèm suất nhưng 0 ghế (3 ghế đã bị xóa); 59 vòng còn lại 409 ROOM_HAS_SHOWTIMES, phòng nguyên vẹn.
- **Mong đợi:** Hoặc xóa trọn phòng + ghế, hoặc giữ nguyên cả hai.
- **Nguyên nhân gốc:** manager_procedures.sql:186-192 (sp_Manager_Room_Delete): kiểm tra rồi chạy hai lệnh DELETE rời nhau, không transaction, không khóa; usp_Admin_Room_Delete bọc transaction. Quét tĩnh 121 procedure: đây là procedure duy nhất ghi nhiều lần mà không có transaction.
- **Tác động:** Mất vĩnh viễn sơ đồ ghế của phòng (phải dựng lại tay); hiếm (cần hai thao tác trong vài mili-giây).
- **Đề xuất sửa (chưa áp dụng):** BEGIN TRAN + XACT_ABORT ON + khóa phòng (UPDLOCK/HOLDLOCK) trước khi kiểm tra; hoặc bỏ xóa cứng.
- **Cách kiểm chứng bản sửa:** Chạy lại t_roomrace (≥200 vòng): 0 phòng nửa chừng.

### LG-11 — Seed tạo sẵn tài khoản ADMIN/MANAGER/CSKH/KHÁCH với mật khẩu 123456 trong mọi lần triển khai

- **Mức độ:** P1 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** cần điều kiện đặc biệt: seed chạy ở production · **Tầng:** SEED/CFG · **UC:** ADM-01, QLR-01, CSKH-01, KH-02 · **Bằng chứng:** A-05, A-04
- **Tái hiện:** Đăng nhập admin@cinemadb.vn, các tài khoản manager/CSKH/khách seed với 123456.
- **Thực tế:** 4/4 vai trò đăng nhập 200. Chính sách đăng ký từ chối < 8 ký tự nhưng seed bỏ qua chính sách; không có giới hạn đoán mật khẩu (LG-19) nên nếu lọt production thì bị chiếm ngay.
- **Mong đợi:** Không có thông tin đăng nhập demo trong bản triển khai production; seed chỉ khi cờ rõ ràng.
- **Nguyên nhân gốc:** database/seed/07_seed_data.sql và deploy (chỉ -SkipSeed mới bỏ qua seed). Cần điều kiện triển khai sai nên xếp P1 chứ không P0.
- **Tác động:** Chiếm quyền ADMIN nếu bản seed chạy ở production.
- **Đề xuất sửa (chưa áp dụng):** Seed production không tạo tài khoản; seed demo yêu cầu mật khẩu qua biến môi trường và buộc đổi lần đầu.
- **Cách kiểm chứng bản sửa:** Triển khai không seed: không tài khoản nào đăng nhập được bằng 123456; tài liệu triển khai ghi rõ.

### LG-12 — 500 thay vì 4xx: số nguyên ≥ 2^31 và số thập phân quá lớn lọt qua validator admin/manager (32 tổ hợp)

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** cần đầu vào bất thường · **Tầng:** BE · **UC:** QLR-02..07, ADM-02..14 · **Bằng chứng:** FZ-01
- **Tái hiện:** Fuzz 2880 request × 37 route ghi × mọi trường × 20 giá trị xấu (t_fuzz.mjs). Ví dụ: admin POST /rooms cinemaId=2147483648; POST /pricing surcharge=1e20; POST /seats row="'; DROP TABLE x;--" (>10 ký tự).
- **Thực tế:** 32 tổ hợp trả 5xx: phần lớn EPARAM (số nguyên an toàn của JS nhưng vượt INT của SQL), còn lại EREQUEST (DECIMAL tràn, chuỗi dài hơn cột). Danh sách đầy đủ: fuzz_5xx.json.
- **Mong đợi:** 400 INVALID_REQUEST cho mọi giá trị ngoài miền.
- **Nguyên nhân gốc:** adminValidator/managerValidator kiểm tra Number.isSafeInteger/finite nhưng không cận 2^31-1 và không cận DECIMAL; luồng đặt vé của khách đã được sửa ở vòng 4 nhưng admin/manager chưa. Cũng là biến thể chưa được dọn của việc ánh xạ lỗi vòng 1–3.
- **Tác động:** Lỗi 500 làm nhiễu log/giám sát và lộ chi tiết kỹ thuật trong log; không làm hỏng dữ liệu (SQL tham số hóa, DROP TABLE không chạy).
- **Đề xuất sửa (chưa áp dụng):** Helper id() dùng cận INT, money()/number() dùng cận DECIMAL(18,2), text() cắt theo độ dài cột; ánh xạ EPARAM/EREQUEST còn sót thành 400.
- **Cách kiểm chứng bản sửa:** Chạy lại t_fuzz.mjs: 0 tổ hợp 5xx; thêm vào test node:test dạng bảng.

### LG-13 — Ký tự NUL (U+0000) được lưu vào 18 cột văn bản và làm hỏng FOR XML: danh sách phim công khai và chi tiết đơn trả 500

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** hiếm: cần ghi ký tự NUL bằng quyền admin/manager · **Tầng:** BE+DB · **UC:** ADM-07..11, QLR-03, KH-12, KH-04 · **Bằng chứng:** FZ-02
- **Tái hiện:** Gửi chuỗi chứa \u0000 qua các route ghi; sau đó đặt vé ghế có hàng chứa NUL → GET /orders/:id và POST /orders/:id/payments; gắn thể loại có NUL vào một phim → GET /movies.
- **Thực tế:** Lưu được ở GHE.HangGhe, THELOAI, PHIM, RAPCHIEUPHIM, PHONGCHIEU, SANPHAM, KHUYENMAI, VAITRO, QUYEN, KHIEUNAI… Hệ quả: (1) đơn có ghế NUL: chi tiết và thanh toán 500 ("FOR XML could not serialize … character (0x0000)"), đơn không bao giờ thanh toán được; (2) thể loại NUL gắn với phim: GET /movies và ?status= 500 cho TẤT CẢ người dùng (GET /movies/:id vẫn 200).
- **Mong đợi:** Từ chối ký tự điều khiển ở validator, hoặc view/procedure chịu được.
- **Nguyên nhân gốc:** Validator chỉ kiểm tra độ dài; database/views/03_views.sql:140-152 và customer_procedures.sql:84-90 ghép chuỗi bằng FOR XML PATH.
- **Tác động:** Cần người ghi có quyền admin/manager nên hiếm, nhưng phạm vi ảnh hưởng là toàn bộ danh mục công khai hoặc mọi đơn của một phòng.
- **Đề xuất sửa (chưa áp dụng):** Validator dùng chung cấm /[\u0000-\u001F]/; thay FOR XML PATH bằng STRING_AGG (SQL Server ≥ 2017, repo đã dùng trong test).
- **Cách kiểm chứng bản sửa:** Test: gửi NUL vào mọi trường chuỗi → 400; GET /movies và /orders/:id vẫn 200 với dữ liệu chứa ký tự đặc biệt khác (<, &, ").

### LG-14 — Tạo suất chiếu thiếu cận: kết thúc 9999-12-31, bắt đầu năm 2001, phim không tồn tại → 500, định dạng không khớp loại phòng

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** thấp–trung bình: lỗi gõ của admin/manager · **Tầng:** BE+DB · **UC:** QLR-04, ADM-14 · **Bằng chứng:** M-04, M-04b
- **Tái hiện:** POST showtime với endsAt=9999-12-31T00:00:00Z; startsAt=2001; movieId không tồn tại; format IMAX trong phòng 2D.
- **Thực tế:** Admin 200 (suất dài 2.906.963 ngày, phòng sau đó từ chối suất bình thường 19 năm sau với 409 SHOWTIME_OVERLAP), manager 201; năm 2001: 201; suất 4 ngày: 201; phim không tồn tại: 500 EREQUEST (managerError không ánh xạ 547); IMAX trong phòng 2D: 201 (phụ thu IMAX thu ở phòng 2D).
- **Mong đợi:** Cận hợp lý về thời lượng/khoảng thời gian, 404/400 cho phim không tồn tại, định dạng khớp phòng (hoặc quy tắc rõ).
- **Nguyên nhân gốc:** managerValidator.js:69-74 và adminValidator chỉ kiểm tra end > start; managerError thiếu 547/2627/2601 (admin mapper đã có); phòng và định dạng độc lập trong sp_*_Showtime_Create.
- **Tác động:** Một lỗi gõ làm phòng không xếp lịch được cho tới khi hủy suất đó; phụ thu sai; log 500.
- **Đề xuất sửa (chưa áp dụng):** Cận: end − start trong [duration phim, 8 giờ] và start ≥ hiện tại (trừ nhập bù đã được duyệt); ánh xạ 547; ràng buộc định dạng–phòng nếu đó là quy tắc (Q13).
- **Cách kiểm chứng bản sửa:** Test bảng biên: mỗi giá trị xấu → 400/404 và không tạo bản ghi.

### LG-15 — Hai route đọc của admin bỏ qua error mapper: id không tồn tại → 500 (sót của đợt sửa 1–3)

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** trung bình: mở vai trò/rạp vừa bị xóa · **Tầng:** BE · **UC:** ADM-03, ADM-07 · **Bằng chứng:** ADM-500
- **Tái hiện:** GET /api/admin/roles/99999/permissions và GET /api/admin/cinemas/99999/images.
- **Thực tế:** 500 EREQUEST (log: "Vai trò không tồn tại.", "Rạp không tồn tại."); mọi route đọc admin khác trả 404.
- **Mong đợi:** 404 ROLE_NOT_FOUND / CINEMA_NOT_FOUND.
- **Nguyên nhân gốc:** backend/src/services/adminService.js:183 (rolePermissions) và :189 (cinemaImages) gọi execute() trực tiếp, không qua mapAdminProcedureError.
- **Tác động:** Lỗi 500 cho thao tác thường gặp (mở vai trò/rạp vừa bị xóa ở tab khác).
- **Đề xuất sửa (chưa áp dụng):** Bọc hai hàm bằng mapper như các route admin khác; thêm vào test bảng "mọi route admin với id lạ → 404".
- **Cách kiểm chứng bản sửa:** Test bảng quét toàn bộ GET /admin/*/:id với id 99999: không có 5xx.

### LG-16 — Admin duy nhất tự khóa tài khoản của mình → hệ thống không còn admin

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** hiếm: thao tác nhầm của admin duy nhất · **Tầng:** DB · **UC:** ADM-02 · **Bằng chứng:** A-11
- **Tái hiện:** PUT /admin/users/:selfId/status {status:"Bị khóa"} bằng token của admin duy nhất.
- **Thực tế:** 200; request tiếp theo 401. Chỉ khôi phục được bằng truy cập DB trực tiếp.
- **Mong đợi:** Từ chối tự khóa / khóa admin hoạt động cuối cùng.
- **Nguyên nhân gốc:** database/procedures/admin/admin_procedures.sql:54 (sp_Admin_User_UpdateStatus) không kiểm tra id tồn tại, tự khóa, hay admin cuối cùng (id lạ → 200 {user:null}, xem LG-34).
- **Tác động:** Mất quyền quản trị; một cú bấm nhầm trong portal (changeUserStatus có hộp xác nhận nhưng không chặn).
- **Đề xuất sửa (chưa áp dụng):** Guard trong procedure: không khóa chính mình và không khóa admin cuối; kiểm tra @@ROWCOUNT.
- **Cách kiểm chứng bản sửa:** Test SQL + API cho cả hai guard.

### LG-17 — Xóa hết quyền của vai trò ADMIN khóa toàn bộ admin ra khỏi portal

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** hiếm: thao tác nhầm của admin · **Tầng:** BE+DB · **UC:** ADM-05 · **Bằng chứng:** AD-02
- **Tái hiện:** PUT /admin/roles/1/permissions {permissionIds: []}.
- **Thực tế:** 200; admin dashboard sau đó 403 FORBIDDEN dù fn_KiemTraQuyenNguoiDung(admin) = 1 trong DB (hai nguồn quyền mâu thuẫn). Khôi phục chỉ bằng SQL.
- **Mong đợi:** ADMIN luôn giữ quyền (như DB) hoặc thao tác bị chặn.
- **Nguyên nhân gốc:** Backend cấp quyền theo bảng VAITRO_QUYEN (requirePermission) còn function DB coi ADMIN luôn đủ quyền (02_functions.sql); sp_Admin_RolePermission_Set không bảo vệ vai trò hệ thống.
- **Tác động:** Cùng lớp rủi ro với LG-16.
- **Đề xuất sửa (chưa áp dụng):** Không cho sửa quyền của vai trò ADMIN hoặc backend cũng coi ADMIN là toàn quyền; chốt một nguồn sự thật.
- **Cách kiểm chứng bản sửa:** PUT rỗng cho vai trò ADMIN → 409; admin vẫn vào được portal.

### LG-18 — Mật khẩu 73–128 ký tự do admin tạo không đăng nhập được; bcrypt cắt ở 72 byte

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** thấp: mật khẩu dài do admin đặt · **Tầng:** BE · **UC:** ADM-02, KH-02 · **Bằng chứng:** AD-03b, AD-03, A-06
- **Tái hiện:** Admin tạo user mật khẩu 77 ký tự; đăng nhập đúng mật khẩu đó.
- **Thực tế:** Đăng nhập đúng 77 ký tự: 400 INVALID_REQUEST; đăng nhập bằng 72 ký tự đầu: 200. Hai mật khẩu khác nhau cùng 72 byte đầu là tương đương.
- **Mong đợi:** Hợp đồng thống nhất giữa các tầng (≤ 72 byte).
- **Nguyên nhân gốc:** adminValidator rule password 8..128 ký tự so với authValidator.validateLogin từ chối > 72 byte; bcrypt bỏ qua phần vượt 72 byte.
- **Tác động:** Tài khoản tạo ra không dùng được hoặc bị đăng nhập bằng mật khẩu rút gọn.
- **Đề xuất sửa (chưa áp dụng):** Cùng giới hạn 72 byte ở mọi tầng (hoặc băm trước bằng SHA-256).
- **Cách kiểm chứng bản sửa:** Test bảng độ dài 8/72/73/128 cho tạo user và đăng nhập.

### LG-19 — Không giới hạn thử mật khẩu: 60 lần sai liên tiếp trên tài khoản nhân viên không bị chậm hay khóa

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** luôn có thể bị khai thác · **Tầng:** BE · **UC:** KH-02, QLR-01, CSKH-01, ADM-01 · **Bằng chứng:** A-04
- **Tái hiện:** 60 POST /auth/login sai mật khẩu rồi mật khẩu đúng.
- **Thực tế:** 60 × 401, lần đúng ngay sau đó 200.
- **Mong đợi:** Giới hạn tốc độ / khóa tạm sau N lần sai.
- **Nguyên nhân gốc:** Không có rate limit hay bộ đếm ở backend hoặc DB.
- **Tác động:** Đoán mật khẩu không giới hạn (đặc biệt nguy hiểm kết hợp LG-11).
- **Đề xuất sửa (chưa áp dụng):** express-rate-limit theo IP+email và khóa tạm theo tài khoản (chính sách Q12).
- **Cách kiểm chứng bản sửa:** Lần sai thứ N+1 → 429 và đăng nhập đúng bị trì hoãn.

### LG-20 — Một số điện thoại thật tạo được nhiều tài khoản bằng cách viết khác định dạng

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** thường: người dùng gõ SĐT nhiều kiểu · **Tầng:** DB+BE · **UC:** KH-01, KH-03 · **Bằng chứng:** A-02
- **Tái hiện:** Đăng ký cùng một số viết 5 cách (có/không dấu cách, +84, 0…).
- **Thực tế:** 5/5 → 201, 5 tài khoản.
- **Mong đợi:** 1 tài khoản/số; 4 × 409 PHONE_IN_USE.
- **Nguyên nhân gốc:** UQ_NGUOIDUNG_SoDienThoai (01_schema.sql:526) so sánh chuỗi thô; validator chỉ kiểm tra ký tự.
- **Tác động:** Phá bất biến "SĐT duy nhất"; khuyến mãi theo người dùng / chống gian lận vô hiệu.
- **Đề xuất sửa (chưa áp dụng):** Chuẩn hóa về một dạng (E.164) trước khi lưu và so sánh (Q11).
- **Cách kiểm chứng bản sửa:** Năm cách viết → 1 × 201, 4 × 409.

### LG-21 — Giá tiền không có cận: giá vé 0 (KNOWN-OPEN, biến thể nặng hơn) và sản phẩm giá 0 hoặc 1e12

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** hiếm: nhập sai giá · **Tầng:** BE+DB · **UC:** ADM-14, ADM-11, KH-07, KH-08, KH-10 · **Bằng chứng:** KO-06, PRD-01, FZ-01
- **Tái hiện:** POST showtime basePrice=0; POST product price=0 / 1e12; đặt 10 × sản phẩm 1e12.
- **Thực tế:** basePrice=0: 200, ghế giá 0, khách đặt 201 (total 0), tạo giao dịch và xác nhận thành công → đơn "Đã thanh toán" 0 đồng (điểm thưởng không đổi 80→80). Sản phẩm giá 0 và 1e12: 201; đơn 10 × 1e12 → đặt vé 201 với total 10.000.000.080.000, tạo giao dịch 201, nhưng xác nhận thành công trả 400 "A numeric value is out of range." (điểm thưởng = tổng/1000 tràn INT) nên đơn kẹt ở Chờ thanh toán tới hết hạn. Giá 9e15: 400.
- **Mong đợi:** Giá dương và có cận trên hợp lý; vé miễn phí chỉ qua khuyến mãi có kiểm soát.
- **Nguyên nhân gốc:** adminValidator rule number chỉ kiểm tra hữu hạn; SANPHAM.Gia và SUATCHIEU.GiaVeCoBan không có CHECK > 0 / ≤ cận (cột DECIMAL(18,2)).
- **Tác động:** Nhập sai một số 0 tạo vé miễn phí hoặc đơn hàng nghìn tỷ; cần quyền admin nên hiếm.
- **Đề xuất sửa (chưa áp dụng):** CHECK (GiaVeCoBan > 0) và (Gia > 0) cùng cận trên theo nghiệp vụ (Q6), validator khớp.
- **Cách kiểm chứng bản sửa:** Test bảng: 0, âm, vượt cận → 400 ở API và lỗi CHECK ở DB.

### LG-22 — Mọi HTTP 403 đều đá người dùng sang /forbidden: khách chưa xem phim mất trang và nội dung đã gõ khi đánh giá

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN+SOURCE · **Khả năng xảy ra:** thường: mỗi khách chưa xem phim thử đánh giá · **Tầng:** FE · **UC:** KH-13 · **Bằng chứng:** FE-01, S-05
- **Tái hiện:** Khách chưa xem phim gửi đánh giá (API trả 403 REVIEW_NOT_ELIGIBLE).
- **Thực tế:** API 403 (đã chứng minh); frontend/src/api/httpClient.js:22 phát sự kiện auth:forbidden cho mọi 403 và AccessErrorHandler.jsx:7 điều hướng replace sang /forbidden trước khi component hiển thị thông báo thân thiện (MovieReviews.jsx:7 — không bao giờ hiện được).
- **Mong đợi:** Chỉ lỗi quyền truy cập (…_REQUIRED) mới điều hướng; lỗi nghiệp vụ hiển thị tại chỗ.
- **Nguyên nhân gốc:** httpClient.js:22 không phân biệt mã lỗi 403.
- **Tác động:** Trải nghiệm hỏng ở luồng bình thường; mất dữ liệu đang nhập. SOURCE-ONLY ở phía giao diện (chưa chạy trình duyệt).
- **Đề xuất sửa (chưa áp dụng):** Chỉ dispatch khi error.code thuộc *_REQUIRED/FORBIDDEN; hoặc đổi REVIEW_NOT_ELIGIBLE sang 409/422.
- **Cách kiểm chứng bản sửa:** Test giao diện: đánh giá khi chưa xem → thông báo tại chỗ, không điều hướng.

### LG-23 — Trigger chống chồng lịch không có IF UPDATE: sau race LG-05 cặp suất chồng lịch không sửa được kể cả chỉ đổi giá

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** chỉ sau LG-05 · **Tầng:** DB (trigger) · **UC:** QLR-05, ADM-14 · **Bằng chứng:** TRG-01, TRG-02
- **Tái hiện:** Trên cặp suất 98/99 chồng lịch do C-01: PUT chỉ tăng basePrice 1000 trên suất 98.
- **Thực tế:** 409 SHOWTIME_OVERLAP; chỉ hủy được một trong hai suất.
- **Mong đợi:** Sửa trường không liên quan thời gian vẫn được.
- **Nguyên nhân gốc:** database/triggers/04_triggers.sql:19-54 kiểm tra lại chồng lịch ở mọi UPDATE bất kể cột. Nếu cả hai suất đã có vé thì hủy bị chặn (50118) và chỉ còn đường PUT của LG-01.
- **Tác động:** Dữ liệu chồng lịch một khi đã có thì khóa cứng thao tác sửa; kết hợp LG-01 thúc đẩy dùng đường hủy sai.
- **Đề xuất sửa (chưa áp dụng):** IF UPDATE(ThoiGianBatDau) OR UPDATE(ThoiGianKetThuc) OR UPDATE(PhongID) OR UPDATE(TrangThai) trước khi kiểm tra.
- **Cách kiểm chứng bản sửa:** Sửa giá trên suất thuộc cặp chồng lịch → 200; sửa giờ làm chồng → 409.

### LG-24 — Phim trạng thái "Ngừng chiếu" vẫn nằm trong danh sách công khai (cần chủ dự án xác nhận ý đồ)

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** luôn xảy ra với phim Ngừng chiếu · **Tầng:** DB · **UC:** KH-04 · **Bằng chứng:** P-01
- **Tái hiện:** Đặt phim 24 = "Ngừng chiếu", GET /api/movies.
- **Thực tế:** Phim vẫn có trong danh sách; GET /movies?status=Ngừng chiếu trả 1 phim.
- **Mong đợi:** Theo ý đồ: ẩn khỏi danh sách mặc định, hoặc chỉ hiện khi lọc.
- **Nguyên nhân gốc:** sp danh sách phim (customer_procedures.sql:60-100) chỉ lọc khi có tham số trạng thái.
- **Tác động:** Khách thấy phim đã ngừng; liên quan LG-08.
- **Đề xuất sửa (chưa áp dụng):** Mặc định chỉ Đang chiếu/Sắp chiếu (Q4).
- **Cách kiểm chứng bản sửa:** GET /movies không có phim Ngừng chiếu.

### LG-25 — Khiếu nại không có máy trạng thái: "Đã đóng/Từ chối/Đã giải quyết" mở lại và đổi qua lại tự do (cần xác nhận ý đồ)

- **Mức độ:** P2 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** thường khi CSKH xử lý lại khiếu nại · **Tầng:** DB · **UC:** CSKH-05, CSKH-06, ADM-15 · **Bằng chứng:** S-02
- **Tái hiện:** PUT status: Đã đóng → Đang xử lý → Từ chối → Đã giải quyết; thêm ghi chú xử lý vào khiếu nại đã đóng.
- **Thực tế:** Toàn bộ 200/201; lịch sử dài thêm 6 dòng; chỉ "Mới" không quay lại được (400).
- **Mong đợi:** Bảng chuyển trạng thái hợp lệ do chủ dự án định nghĩa (Q5).
- **Nguyên nhân gốc:** sp_Support_Complaint_UpdateStatus/AddProcessing và TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai không có luật chuyển.
- **Tác động:** Lịch sử xử lý mất ý nghĩa pháp lý/kiểm toán.
- **Đề xuất sửa (chưa áp dụng):** Bảng chuyển trạng thái trong procedure.
- **Cách kiểm chứng bản sửa:** Chuyển không hợp lệ → 409.

### LG-26 — Portal admin/manager: trường enum, giờ ISO và danh sách quyền đều là ô nhập tự do (ba tầng lệch nhau)

- **Mức độ:** P2 · **Độ tin cậy:** SOURCE-ONLY · **Khả năng xảy ra:** thường: mỗi lần nhập form admin · **Tầng:** FE · **UC:** ADM-03..14, QLR-04, QLR-05 · **Bằng chứng:** FE-04, FE-05
- **Tái hiện:** Đọc frontend/src/pages/AdminPortal.jsx:23-37, 113-117 và ManagerPortal.jsx:6-7.
- **Thực tế:** Loại phòng/ghế/sản phẩm/khuyến mãi, trạng thái, "Bắt đầu (ISO)", "Kết thúc (ISO)" là text; quyền của vai trò gõ danh sách id cách nhau bằng dấu phẩy; không có <select>. Gõ sai → 400 INVALID_REFERENCE với thông điệp chung "tham chiếu dữ liệu không tồn tại".
- **Mong đợi:** Danh sách chọn giới hạn theo CHECK của DB; bộ chọn ngày-giờ.
- **Nguyên nhân gốc:** AdminPortal.jsx là form CRUD tổng quát dựa trên bảng khai báo trường.
- **Tác động:** Nhập sai thường xuyên; với giờ ISO không múi giờ là LG-09.
- **Đề xuất sửa (chưa áp dụng):** Điền enum từ API/hằng số dùng chung; DateTimePicker có múi giờ.
- **Cách kiểm chứng bản sửa:** Duyệt trình duyệt (chưa làm được — FE-03).

### LG-27 — Lộ tài khoản tồn tại: đăng nhập sai email nhanh ~3 ms so với ~91 ms (bcrypt); đăng ký trả 409 EMAIL_IN_USE/PHONE_IN_USE

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE · **UC:** KH-01, KH-02 · **Bằng chứng:** A-03, A-03b
- **Tái hiện:** So sánh độ trễ trung vị 401 của email lạ và email có thật.
- **Thực tế:** 3 ms vs 91 ms; thân phản hồi giống hệt.
- **Mong đợi:** Độ trễ tương đương.
- **Nguyên nhân gốc:** authService.login bỏ bcrypt khi không có dòng.
- **Tác động:** Liệt kê tài khoản (thường chấp nhận được với đăng ký).
- **Đề xuất sửa (chưa áp dụng):** So sánh với hash giả khi không có người dùng.
- **Cách kiểm chứng bản sửa:** Độ lệch độ trễ < nhiễu.

### LG-28 — Mật khẩu yếu (8 dấu cách, 12345678) và ngày sinh vô lý (2999, 1800) được chấp nhận

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE · **UC:** KH-01, KH-03 · **Bằng chứng:** A-06, A-07
- **Tái hiện:** Đăng ký/cập nhật hồ sơ với các giá trị đó.
- **Thực tế:** 201/200.
- **Mong đợi:** 400.
- **Nguyên nhân gốc:** Chỉ kiểm tra độ dài (8..72 byte) và định dạng ngày.
- **Tác động:** Chất lượng dữ liệu/an toàn thấp.
- **Đề xuất sửa (chưa áp dụng):** Danh sách mật khẩu phổ biến, cấm toàn khoảng trắng; ngày sinh trong khoảng hợp lý.
- **Cách kiểm chứng bản sửa:** Test bảng.

### LG-29 — Nhân viên cập nhật hồ sơ tạo dòng HOSOKHACHHANG; khách do admin tạo thì KHÔNG có hồ sơ nên không bao giờ được tích điểm

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** DB · **UC:** KH-03, ADM-02 · **Bằng chứng:** A-08, AD-01
- **Tái hiện:** Admin PUT /auth/me; admin tạo khách rồi khách trả đơn 80.000.
- **Thực tế:** Admin có hàng điểm thưởng (0→1 hàng); khách do admin tạo: 0 hồ sơ, 0 điểm sau đơn đã trả.
- **Mong đợi:** Hồ sơ chỉ cho khách; mọi khách có hồ sơ.
- **Nguyên nhân gốc:** sp_User_UpdateProfile INSERT HOSOKHACHHANG cho mọi vai trò; sp_Admin_User_Create chỉ INSERT NGUOIDUNG; sp_Payment_UpdateResult cập nhật hàng không tồn tại (no-op im lặng).
- **Tác động:** Điểm thưởng không nhất quán.
- **Đề xuất sửa (chưa áp dụng):** Tạo hồ sơ khi tạo khách; chặn nhân viên.
- **Cách kiểm chứng bản sửa:** Test SQL.

### LG-30 — Quy tắc URL không nhất quán: ảnh rạp bắt http(s)/đường dẫn tuyệt đối, poster/trailer/ảnh sản phẩm nhận cả "javascript:"

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE · **UC:** ADM-09, ADM-11 · **Bằng chứng:** AD-04
- **Tái hiện:** Tạo phim với posterUrl="javascript:…".
- **Thực tế:** 201 (ảnh rạp cùng giá trị: 400).
- **Mong đợi:** Cùng một quy tắc.
- **Nguyên nhân gốc:** Validator phim/sản phẩm không kiểm tra scheme.
- **Tác động:** Thấp (React 19 chặn javascript: ở href).
- **Đề xuất sửa (chưa áp dụng):** Helper url() dùng chung.
- **Cách kiểm chứng bản sửa:** Test bảng.

### LG-31 — Biên dữ liệu danh mục: phim thời lượng 99.999.999 phút, trùng tên phim/sản phẩm khác hoa-thường; sửa khuyến mãi đã dùng; lỗi chung INVALID_REFERENCE

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE+DB · **UC:** ADM-09, ADM-11, ADM-12 · **Bằng chứng:** AD-05, AD-06, UC-ADM-CRUD
- **Tái hiện:** Tạo phim 99.999.999 phút; hai sản phẩm trùng tên khác hoa/thường; hạ số lượng khuyến mãi dưới số đã dùng; đổi loại giảm khi đơn đang giữ mã.
- **Thực tế:** 201/201/400 INVALID_REFERENCE (thông điệp sai)/200.
- **Mong đợi:** Cận hợp lý, thông điệp rõ.
- **Nguyên nhân gốc:** Thiếu cận ở validator; CK_KHUYENMAI_SoLuong báo qua mã 547 chung.
- **Tác động:** Chất lượng dữ liệu.
- **Đề xuất sửa (chưa áp dụng):** Cận + mã lỗi riêng.
- **Cách kiểm chứng bản sửa:** Test bảng.

### LG-32 — Dữ liệu công khai & hợp đồng: lộ họ tên đầy đủ người đánh giá; id lạ trả 200 danh sách rỗng thay vì 404; LIKE không escape % _ và phân biệt dấu; /health/db công khai lộ tên DB; JSON hỏng trả 400 mã INTERNAL_ERROR

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE+DB · **UC:** KH-04, KH-05, KH-06, CSKH-02 · **Bằng chứng:** P-02, P-03, P-05, A-12
- **Tái hiện:** GET /movies/1/reviews; GET /showtimes/99999/seats; GET /movies?search=%25; GET /health/db; gửi JSON cụt.
- **Thực tế:** reviewerName là họ tên đầy đủ; 200 []; "%" khớp mọi phim (4/4) và mọi khiếu nại; "Dieu" ≠ "Điều"; tên DB trong /health/db.
- **Mong đợi:** Tên rút gọn; 404; tìm literal/không dấu; health ẩn chi tiết; mã 400 đúng.
- **Nguyên nhân gốc:** sp_Review_ListByMovie trả NGUOIDUNG.HoTen; truy vấn tìm kiếm ghép LIKE không escape; collation Vietnamese_CI_AS.
- **Tác động:** Rò rỉ nhẹ, trải nghiệm tìm kiếm kém.
- **Đề xuất sửa (chưa áp dụng):** Rút gọn tên, ESCAPE trong LIKE, 404 nhất quán.
- **Cách kiểm chứng bản sửa:** Test bảng.

### LG-33 — Không có phân trang ở bất kỳ danh sách nào (hôm nay P3, ở quy mô lớn P2 — chưa đo)

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE+DB · **UC:** KH-11, CSKH-02, ADM-02 · **Bằng chứng:** P-06, KO-13
- **Tái hiện:** GET /movies?page=2&pageSize=1 …
- **Thực tế:** Tham số lạ bị 400 UNKNOWN_QUERY_PARAMETER (hoặc bỏ qua ở /orders); không procedure nào dùng OFFSET/FETCH.
- **Mong đợi:** Trang có giới hạn và tổng số, thứ tự ổn định.
- **Nguyên nhân gốc:** Thiết kế hiện tại; quét tĩnh 34 procedure danh sách/báo cáo: 30 có ORDER BY, 4 không (Admin_Report_Revenue, Admin_Dashboard, Manager_Dashboard là tổng hợp một dòng; sp_Manager_ListAssignedCinemas là danh sách không sắp xếp — ManagerPortal.jsx chọn phần tử đầu làm rạp mặc định nên rạp mặc định không ổn định khi quản lý có nhiều rạp).
- **Tác động:** Kích thước phản hồi tăng theo dữ liệu.
- **Đề xuất sửa (chưa áp dụng):** OFFSET/FETCH + ORDER BY ổn định + total.
- **Cách kiểm chứng bản sửa:** Đo trên DB ≥ 100k đơn.

### LG-34 — Id không tồn tại cho kết quả không nhất quán: 403 MANAGER_CINEMA_FORBIDDEN thay vì 404, hoặc 200 {user:null}; 23 procedure admin/manager UPDATE không kiểm tra @@ROWCOUNT

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN+SOURCE · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** DB+BE · **UC:** QLR-02, QLR-07, ADM-02 · **Bằng chứng:** M-06, AD-03, TXN-01
- **Tái hiện:** DELETE /manager/rooms/99999; PUT /admin/users/99999/status.
- **Thực tế:** 403; 200 {"user":null}.
- **Mong đợi:** 404.
- **Nguyên nhân gốc:** fn_KiemTraQuanLyRapScope(NULL)=0 → 403; thiếu @@ROWCOUNT (quét tĩnh: 23 procedure).
- **Tác động:** Thành công giả; thông điệp lệch.
- **Đề xuất sửa (chưa áp dụng):** 404 khi không có dòng.
- **Cách kiểm chứng bản sửa:** Test bảng id lạ.

### LG-35 — Khiếu nại: nội dung 90 KB và 25 khiếu nại song song đều được nhận; phân công quản lý chồng/trùng được nhận và POST /admin/assignments đòi trường "status" vô nghĩa

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** DB+BE · **UC:** KH-14, CSKH-05, ADM-06 · **Bằng chứng:** S-03, M-07
- **Tái hiện:** POST /complaints 90 KB; 25 song song; tạo phân công trùng.
- **Thực tế:** 201 tất cả; phân công trùng 200.
- **Mong đợi:** Cận kích thước/tốc độ; chặn trùng.
- **Nguyên nhân gốc:** NVARCHAR(MAX) + giới hạn body 100 KB; không guard.
- **Tác động:** Rác dữ liệu.
- **Đề xuất sửa (chưa áp dụng):** Cận độ dài + giới hạn tốc độ; guard trùng.
- **Cách kiểm chứng bản sửa:** Test bảng.

### LG-36 — Nhật ký ứng dụng ghi email/SĐT của người dùng qua thông điệp lỗi 2627/2601

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE · **UC:** KH-01 · **Bằng chứng:** LOG-01
- **Tái hiện:** Đăng ký trùng email, đọc log.
- **Thực tế:** 3 dòng log mức error chứa "duplicate key value is (email)".
- **Mong đợi:** Không ghi dữ liệu cá nhân.
- **Nguyên nhân gốc:** Mapper log details.sqlMessage nguyên văn.
- **Tác động:** Dữ liệu cá nhân trong log.
- **Đề xuất sửa (chưa áp dụng):** Chỉ log sqlNumber và tên ràng buộc.
- **Cách kiểm chứng bản sửa:** Grep log sau đăng ký trùng: không còn email.

### LG-37 — Mã/trạng thái chết: sp_Order_Cancel, sp_Manager_Seat_BatchCreate không có nơi gọi; trạng thái đơn Hoàn thành/Hoàn tiền, vé Đã sử dụng, thanh toán Đã hoàn tiền không procedure nào đặt; điểm thưởng chỉ cộng, không thể dùng; giá "Ngày lễ" (6 dòng seed) không bao giờ áp dụng

- **Mức độ:** P3 · **Độ tin cậy:** SOURCE-ONLY · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** DB+BE · **UC:** KH-10, KH-12 · **Bằng chứng:** F-02, KO-04, KO-07
- **Tái hiện:** Quét tham chiếu backend + procedure; đếm dòng trạng thái.
- **Thực tế:** 2 procedure không có caller (trong 121); 0 dòng Hoàn thành/Hoàn tiền/Đã hoàn tiền (2 vé "Đã sử dụng" là dữ liệu seed); fn_TinhGiaVe không nhắc "Ngày lễ".
- **Mong đợi:** Dùng hoặc gỡ.
- **Nguyên nhân gốc:** Tính năng chưa hoàn thiện.
- **Tác động:** Bảo trì/hiểu lầm; liên quan KNOWN-OPEN.
- **Đề xuất sửa (chưa áp dụng):** Quyết định dùng/gỡ.
- **Cách kiểm chứng bản sửa:** Quét lại.

### LG-38 — Dữ liệu seed/lịch sử vi phạm bất biến hiện hành: số dùng khuyến mãi gõ tay (GIAM30K 20, VIPMEMBER 5 không có đơn nào), 1 đơn hết hạn có tổng âm (giảm 120.000 trên vé 80.000, tạo trước giới hạn 99%)

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** SEED · **UC:** ADM-12, KH-09 · **Bằng chứng:** I13, I15, ENV-01
- **Tái hiện:** Invariant I13/I15 trên DB live (chỉ SELECT).
- **Thực tế:** I13 = 3 khuyến mãi lệch; I15 = 1 đơn (đã Hết hạn nên không vào doanh thu).
- **Mong đợi:** Bộ đếm = số đơn thật; tổng ≥ 0.
- **Nguyên nhân gốc:** Seed và dữ liệu trước vòng 4.
- **Tác động:** Thấp.
- **Đề xuất sửa (chưa áp dụng):** Dọn bằng migration dữ liệu có kiểm duyệt.
- **Cách kiểm chứng bản sửa:** I13 = I15 = 0.

### LG-39 — Không thu hồi token: token cũ của người bị khóa rồi mở khóa vẫn dùng được (cùng token, hạn 1 giờ); không có đăng xuất phía máy chủ

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** BE · **UC:** KH-02, ADM-02 · **Bằng chứng:** A-10
- **Tái hiện:** Khóa → 401 ngay; mở khóa → token cũ lại 200.
- **Thực tế:** Khóa có hiệu lực tức thì (tốt) nhưng không có tokenVersion.
- **Mong đợi:** Token bị thu hồi khi khóa/đổi mật khẩu.
- **Nguyên nhân gốc:** authenticate.js tải lại người dùng mỗi request nhưng JWT không có phiên bản.
- **Tác động:** Token bị đánh cắp sống qua chu kỳ khóa/mở.
- **Đề xuất sửa (chưa áp dụng):** tokenVersion trong NGUOIDUNG và trong JWT.
- **Cách kiểm chứng bản sửa:** Sau khóa/mở khóa token cũ → 401.

### LG-40 — Cùng một khái niệm "đơn/suất hôm nay" được định nghĩa khác nhau ở dashboard và báo cáo doanh thu

- **Mức độ:** P3 · **Độ tin cậy:** PROVEN+SOURCE · **Khả năng xảy ra:** ít gặp / tác động nhỏ · **Tầng:** DB · **UC:** QLR-08, QLR-09, ADM-16 · **Bằng chứng:** R-04
- **Tái hiện:** So sánh GET /manager/cinemas/1/dashboard với /revenue?fromDate=hôm nay&toDate=hôm nay.
- **Thực tế:** Số liệu khớp truy vấn thô nhưng định nghĩa khác nhau: paidOrdersToday đếm đơn ĐẶT hôm nay và đã trả, báo cáo doanh thu đếm theo NGÀY THANH TOÁN; showtimesToday đếm cả suất đã hủy và dùng ngày giờ máy chủ trong khi suất tạo qua API lưu giờ UTC (LG-09).
- **Mong đợi:** Một định nghĩa cho mỗi khái niệm, ghi rõ trên giao diện.
- **Nguyên nhân gốc:** sp_Manager_Dashboard và sp_Manager_Revenue/vw_DoanhThuTheoRap dùng điều kiện khác nhau.
- **Tác động:** Hai màn hình có thể cho hai con số khác nhau trong cùng một ngày.
- **Đề xuất sửa (chưa áp dụng):** Thống nhất định nghĩa (Q: tính theo ngày đặt hay ngày thanh toán?) và loại suất đã hủy khỏi showtimesToday.
- **Cách kiểm chứng bản sửa:** Đối chiếu dashboard với báo cáo cho cùng ngày.

## 6. Bảng bất biến (invariants)

Đối soát trực tiếp bằng truy vấn thô (inv.sql) sau toàn bộ test trên RepoCheck và chỉ-đọc trên DB live (dữ liệu seed). Cột "RepoCheck/Live" là số dòng vi phạm.

| # | Bất biến | Kết quả | RepoCheck / Live | Bằng chứng |
|---|---|---|---|---|
| INV-01 | Một (suất, ghế) tối đa một vé còn hiệu lực | PASS | 0 / 0 | STRESS-01 A (60 song song → 1×201), B (120 chồng nhau, không ghế bán đôi); INV-DB-01 trigger BR02 từ chối chèn trùng trực tiếp |
| INV-02 | Vé hiệu lực chỉ thuộc đơn Chờ thanh toán/Đã thanh toán/Hoàn thành | PASS | 0 / 0 | inv.sql |
| INV-03 | Đơn đã thanh toán có thanh toán thành công; thanh toán thành công chỉ trên đơn đã trả | PASS | 0 / 0 (I03, I04) | inv.sql, PAY-01 |
| INV-04 | Ghế thuộc đúng phòng của suất | PASS | 0 / 0 | TRG_ChiTietVe_KiemTraGheDungPhong, test 08 |
| INV-05 | Một đơn tối đa một thanh toán thành công | PASS | 0 / 0 | PAY-01: 2 lần tuần tự và 4×20 song song → 1 dòng |
| INV-06 | Tiền thu = vé + đồ ăn − giảm giá (đơn đã trả) | PASS | 0 / 0 | R-02, inv.sql I06 |
| INV-07 | Tổng vé của đơn = tổng giá vé còn hiệu lực | PASS | 0 / 0 (chỉ tính đơn đang giữ/đã trả; đơn Hết hạn giữ nguyên tổng nên bị loại — giả thuyết ban đầu "21 đơn lệch" đã được tinh chỉnh và bác bỏ) | inv2.sql |
| INV-08 | Tổng đồ ăn = Σ số lượng × đơn giá | PASS | 0 / 0 | inv.sql |
| INV-09 | Tổng đơn không âm | PASS (RepoCheck) / FAIL nhẹ (live) | 0 / 1 | live: đơn 20 (Hết hạn) giảm 120.000 trên vé 80.000, tạo trước giới hạn 99% → LG-38 |
| INV-10 | Không có hai suất chồng lịch cùng phòng | FAIL | 1 lúc quan sát, 0 sau khi hủy cặp / 0 | C-01 (sau race có 1 cặp chồng lịch trong RepoCheck, đã hủy một suất của cặp sau khi chứng minh TRG-01; live 0) → LG-05 |
| INV-11 | Không có vé hiệu lực trên suất đã hủy | FAIL | 3 / 3 | M-02 → LG-01 (live: đơn 26, 27, 28 trên suất 34) |
| INV-12 | Không có đơn Đã thanh toán trên suất đã hủy (hoàn tiền/hủy đơn có kiểm soát) | FAIL | 3 / 3 | LG-01, R-06 |
| INV-13 | Số dùng khuyến mãi = số đơn đang giữ mã | FAIL (seed) | 3 / 3 | PROMO-01 chứng minh lượt dùng được nhả khi đơn hết hạn; lệch do seed gõ tay → LG-38 |
| INV-14 | Khách có tối đa 3 đơn đang giữ chỗ; đơn tối đa 10 vé | PASS | 0 / 0 (I17, I18) | test 15, STRESS-01 C |
| INV-15 | Đơn quá hạn giữ được nhả (không tồn đọng) | PASS | 0 / 0 (I16) | job expirePendingOrders mỗi phút; PROMO-01 |
| INV-16 | Phân công quản lý không chồng cho cùng (manager, rạp) | FAIL | 48 / 0 (I20, trạng thái Hiệu lực) | M-07: API nhận phân công chồng và trùng hoàn toàn; 48 cặp trong RepoCheck do chính audit tạo (live 0) → LG-35 |
| INV-17 | Trạng thái đơn/thanh toán/vé: mọi trạng thái đều đạt được | FAIL | — | Hoàn thành, Hoàn tiền, Đã sử dụng, Đã hoàn tiền không procedure nào đặt (F-02) → LG-37 |
| INV-18 | Máy trạng thái khiếu nại có luật chuyển | FAIL | — | S-02 → LG-25 |
| INV-19 | Ghế đã bán không thể chuyển Hỏng/Bảo trì | FAIL | — | M-05 → LG-04 |
| INV-20 | Không đặt vé suất đã bắt đầu / đồng hồ nhất quán | FAIL | — | TZ-01/02 → LG-09 (đóng bán sớm 7 giờ) |
| INV-21 | Hạn giữ chỗ đúng 5 phút, không gia hạn | PASS | — | test 15, test 10 |
| INV-22 | Cửa sổ hiệu lực phân công/khuyến mãi/bảng giá, biên đầu/cuối | PASS | — | M-07 (inclusive hai ngày), test 16 (11 cấu hình DATEFIRST), test 15 |
| INV-23 | Doanh thu báo cáo = tổng giao dịch thật | PASS (công thức) / FAIL (suất hủy) | — | R-01, R-03 khớp truy vấn thô; R-06 doanh thu suất đã hủy vẫn tính → LG-01 |
| INV-24 | Phân quyền vai trò × route và phạm vi dữ liệu | PASS | — | AUTHZ-01 (0 leo thang/708), PAY-02, IDOR-01, M-06, R-05, S-04 |
| INV-25 | Xóa/vô hiệu hóa đối tượng đang được tham chiếu nhất quán | PASS (xóa) / FAIL (vô hiệu) | — | AD-07, UC-ADM-CRUD: xóa đối tượng đang dùng → 409; nhưng vô hiệu hóa phòng/rạp/phim vẫn bán vé → LG-08 |
| INV-26 | Định danh: email/SĐT duy nhất (chuẩn hóa), mật khẩu, token, khóa tài khoản | FAIL | — | A-01 PASS email; A-02 FAIL SĐT; A-04/A-05/A-06/A-10 → LG-11, LG-19, LG-20, LG-28, LG-39 |
| INV-27 | Không giá âm/0/vô lý (vé, sản phẩm, phụ thu) | FAIL | — | KO-06b, PRD-01, FZ-01 → LG-21 |

Ghi chú: INV-nn là mã bất biến nghiệp vụ; "I01…I20" là mã truy vấn trong inv.sql (cột "RepoCheck / Live" và "Bằng chứng" ghi rõ truy vấn nào).

## 7. Ma trận 45 UC

Mỗi UC có đủ ca đúng (happy), biên, sai quyền và đầu vào xấu; "N/A" = UC công khai/không có đầu vào, nêu lý do. Kết quả: **5/45 UC PASS** (PASS* = có ghi chú định nghĩa), **40/45 có finding**. Cột cuối là các finding liên quan. Tất cả 45 UC đều có route và procedure; tầng giao diện của UC admin/manager/CSKH là các portal tổng quát (nên không UC nào thiếu hẳn một tầng), nhưng UC admin chỉ có CRUD thô (xem LG-26).

| UC | Tên | Route | Màn hình | Happy | Biên | Sai quyền | Đầu vào xấu | KQ | Finding |
|---|---|---|---|---|---|---|---|---|---|
| KH-01 | Đăng ký tài khoản | POST /auth/register | Register.jsx | PASS A-01 (201) | PASS A-01 (email hoa/thường/khoảng trắng 409), C-02 (12 song song → 1×201) | N/A route công khai | FAIL A-02 (SĐT 5 cách viết), A-06 (mật khẩu toàn dấu cách) | **FAIL** | LG-20, LG-28, LG-27 |
| KH-02 | Đăng nhập | POST /auth/login, GET /auth/me | Login.jsx | PASS (mọi test đăng nhập 4 vai trò) | PASS A-09 (JWT giả), A-10 (khóa/mở khóa) | N/A | FAIL A-03 (timing), A-04 (60 lần sai không giới hạn) | **FAIL** | LG-19, LG-27, LG-39, LG-11 |
| KH-03 | Xem/cập nhật hồ sơ | GET/PUT /auth/me | Profile.jsx | PASS A-07 (tên Unicode giữ nguyên) | FAIL A-07 (ngày sinh 2999/1800) | PASS AUTHZ-01 (anonymous 401); FAIL A-08 (nhân viên tạo hồ sơ khách) | FAIL A-07 | **FAIL** | LG-28, LG-29 |
| KH-04 | Xem phim & chi tiết | GET /movies, /movies/:id, /genres | Movies.jsx, MovieDetail.jsx | PASS P-03 (detail 200) | FAIL P-01 (phim Ngừng chiếu hiện), S-07 (reviewCount nhân), P-05 (% _ và dấu) | N/A công khai | FAIL P-03 (id lạ trả 200 rỗng ở route con); PASS movie 99999 → 404 | **FAIL** | LG-06, LG-24, LG-32, LG-13 |
| KH-05 | Xem lịch chiếu | GET /movies/:id/showtimes, /cinemas, /showtimes/:id | MovieDetail (ShowtimeBrowser), Cinemas.jsx | PASS TZ-01 (+8h hiện) | FAIL TZ-01 (suất trong 7 giờ tới biến mất), P-04 | N/A công khai | FAIL P-03 (id lạ → 200 []) | **FAIL** | LG-08, LG-09, LG-32 |
| KH-06 | Chọn ghế | GET /showtimes/:id/seats | BookingPreparation.jsx | PASS (STRESS-01, test 15) | FAIL M-05 (ghế bán thành Bảo trì, đếm sai) | N/A công khai | PASS seats showtime=abc → 400; FAIL id lạ → 200 [] | **FAIL** | LG-04, LG-32 |
| KH-07 | Đặt vé | POST /bookings | BookingPreparation.jsx | PASS STRESS-01 A/B/C, test 15 | PASS giới hạn 10 ghế, 3 đơn giữ, hạn 5 phút (test 15, I17/I18 = 0) | PASS AUTHZ-01 (anonymous 401, manager 403) | FAIL KO-11 (sản phẩm/mã lạ bị bỏ im lặng), P-04, TZ-01 | **FAIL** | LG-08, LG-09, LG-21 |
| KH-08 | Mua đồ ăn kèm vé | GET /products, POST /bookings (products) | BookingPreparation.jsx | PASS test 15 (gộp dòng, I08 = 0) | PASS giới hạn 10/dòng (test 15) | PASS AUTHZ-01 | FAIL KO-11 (id lạ 201 giá đầy đủ), PRD-01 | **FAIL** | LG-21 |
| KH-09 | Mã khuyến mãi | POST /promotions/validate, POST /bookings (promotionCode) | BookingPreparation.jsx | PASS PROMO-01 | PASS trần giảm 99% (test 15); PASS PROMO-01 (nhả lượt khi hết hạn) | PASS AUTHZ-01 | FAIL KO-11 (mã sai bị bỏ im lặng), FZ-01 (discountValue tràn) | **FAIL** | LG-12, LG-21 |
| KH-10 | Thanh toán | POST /orders/:id/payments, /payments/:pid/result | PaymentPage.jsx | PASS PAY-01 | PASS PAY-01 (2 lần, 4×20 song song → 1 thành công); FAIL KO-01 (muộn vẫn nhận) | PASS PAY-02 (404 với người khác) | FAIL F-01 (suất đã hủy/quá khứ), KO-06b | **FAIL** | LG-02, LG-21 |
| KH-11 | Lịch sử đặt vé | GET /orders | Orders.jsx | PASS F-03 (200) | FAIL F-03 (giờ lệch +7h), P-06 (không phân trang) | PASS AUTHZ-01 | N/A không có đầu vào | **FAIL** | LG-09, LG-33 |
| KH-12 | Chi tiết đơn | GET /orders/:id | OrderDetail.jsx | PASS (PAY-01/F-01 đọc đơn) | FAIL FZ-02 (ghế NUL → 500) | PASS PAY-02, IDOR-01 (404) | PASS id lạ → 404 | **FAIL** | LG-13 |
| KH-13 | Đánh giá phim | POST /movies/:id/reviews | MovieReviews.jsx | PASS S-05 (201) | PASS S-05 (1001 ký tự, 3.5 sao), S-06 (12 song song → 1 dòng) | PASS S-05 (chưa xem → 403) | PASS S-05 (rating 0/6) | **FAIL** | LG-03 (giả bằng chứng), LG-22 (FE) |
| KH-14 | Gửi khiếu nại | POST/GET /complaints | Complaints.jsx, ComplaintDetail.jsx | PASS S-01 | FAIL S-03 (90 KB, 25 song song) | PASS IDOR-01 (khách khác 404) | PASS IDOR-01 (orderId của người khác → 404) | **FAIL** | LG-35 |
| QLR-01 | Đăng nhập (Manager) | POST /auth/login | Login.jsx | PASS (mgr1/mgr2) | PASS A-10 | PASS AUTHZ-01 (khách/CSKH vào /manager → 403) | FAIL A-04 | **FAIL** | LG-19, LG-11 |
| QLR-02 | Quản lý phòng | GET/POST/PUT/DELETE /manager/.../rooms | ManagerPortal.jsx | PASS (list/create, C-04 dựng phòng) | FAIL M-01 (không ngưng được phòng), C-04 (xóa đua) | PASS M-06 (rạp khác 403) | FAIL FZ-01 (id tràn), M-06 (id lạ → 403 không 404) | **FAIL** | LG-07, LG-10, LG-12, LG-34 |
| QLR-03 | Quản lý sơ đồ ghế | GET/POST /manager/rooms/:id/seats, PUT/DELETE /manager/seats/:id | ManagerPortal.jsx | PASS (tạo ghế C-04) | FAIL M-05 (ghế đã bán → Hỏng) | PASS M-06 | FAIL FZ-01 (hàng > 10 ký tự → 500), FZ-02 (NUL) | **FAIL** | LG-04, LG-12, LG-13 |
| QLR-04 | Tạo suất chiếu | POST /manager/showtimes | ManagerPortal.jsx | PASS (M-04 201) | FAIL M-04b (kết thúc 9999), C-01 (race), TZ-02 | PASS AUTHZ-01, M-06 | FAIL M-04 (phim lạ → 500), FZ-01 | **FAIL** | LG-05, LG-09, LG-12, LG-14 |
| QLR-05 | Sửa suất chiếu | PUT /manager/showtimes/:id | ManagerPortal.jsx | PASS M-02/M-03 (PUT 200; chưa tách riêng ca suất chưa bán) | FAIL M-02, M-03 (suất đã bán), TRG-01 | PASS M-06 (rạp khác 403, id lạ 404) | PASS KO-09 (end ≤ start → 400 từ DB); FAIL M-01 (status) | **FAIL** | LG-01, LG-03, LG-07, LG-23 |
| QLR-06 | Hủy suất chiếu | POST /manager/showtimes/:id/cancel | ManagerPortal.jsx | PASS C-03 (route admin hủy → 200); route manager chỉ kiểm ca có đơn (409) | PASS 409 SHOWTIME_HAS_BOOKINGS khi có đơn; FAIL: bỏ qua bằng PUT (M-02) | PASS M-06 (rạp khác 403) | PASS id lạ → 404 | **FAIL** | LG-01 |
| QLR-07 | Bảng giá | GET/POST /manager/.../pricing, PUT /manager/pricing/:id | ManagerPortal.jsx | PASS (STRESS-01, test 16) | PASS chồng lịch/giáp ngày 409 PRICING_OVERLAP (test 16, STRESS-01) | PASS M-06 | FAIL FZ-01 (surcharge 1e20 → 500) | **FAIL** | LG-12 |
| QLR-08 | Dashboard rạp | GET /manager/cinemas/:id/dashboard | ManagerPortal.jsx | PASS R-04 (khớp truy vấn thô) | PASS R-04 (có ghi chú: tính cả suất đã hủy, ngày giờ máy chủ) | PASS R-05 | PASS R-05 (rạp khác → 403); id không tồn tại chưa kiểm riêng | **PASS*** | LG-09 (ranh giới ngày) |
| QLR-09 | Báo cáo doanh thu rạp | GET /manager/cinemas/:id/revenue | ManagerPortal.jsx | PASS R-03 | PASS R-03 (khoảng rộng, hôm nay, mặc định 30 ngày); PASS UC-GAPS (9999) | PASS R-05 | PASS UC-GAPS (from>to, ngày hỏng, tham số lạ → 400) | **PASS*** | R-06 (doanh thu suất hủy) → LG-01 |
| CSKH-01 | Đăng nhập (CSKH) | POST /auth/login | Login.jsx | PASS | PASS A-10 | PASS AUTHZ-01 | FAIL A-04 | **FAIL** | LG-19, LG-11 |
| CSKH-02 | Danh sách khiếu nại | GET /support/complaints | SupportPortal.jsx | PASS S-01 | FAIL S-03 ("%" khớp tất cả), P-06 | PASS S-04 (khách/manager 403) | PASS UC-GAPS (tham số lạ → 400) | **FAIL** | LG-32, LG-33 |
| CSKH-03 | Chi tiết khiếu nại | GET /support/complaints/:id | SupportPortal.jsx | PASS S-01, UC-GAPS (200) | PASS UC-GAPS (id lạ → 404 COMPLAINT_NOT_FOUND) | PASS S-04 | PASS | **PASS** | — |
| CSKH-04 | Đơn tham chiếu | GET /support/complaints/:id/order-reference | SupportPortal.jsx | PASS UC-GAPS (có đơn → 200) | PASS (khiếu nại không đơn → 200) | PASS AUTHZ-01 + test 11 | PASS UC-GAPS (id lạ → 404) | **PASS** | — |
| CSKH-05 | Ghi nhận xử lý | POST /support/complaints/:id/processings | SupportPortal.jsx | PASS S-01 (201) | FAIL S-02 (ghi chú vào khiếu nại đã đóng 201) | PASS S-04 | PASS UC-GAPS (rỗng/trạng thái lạ → 400); nội dung 20.000 ký tự → 201 | **FAIL** | LG-25, LG-35 |
| CSKH-06 | Cập nhật trạng thái | PUT /support/complaints/:id/status | SupportPortal.jsx | PASS S-02 (200) | FAIL S-02 (không luật chuyển) | PASS S-04 | PASS "Mới"/"xxx" → 400; id lạ → 404 | **FAIL** | LG-25 |
| ADM-01 | Đăng nhập (Admin) | POST /auth/login | Login.jsx | PASS | PASS A-09, A-10 | PASS AUTHZ-01 | FAIL A-04, A-05 | **FAIL** | LG-11, LG-19 |
| ADM-02 | Tài khoản (khóa/mở) | GET/POST /admin/users, PUT /admin/users/:id/status | AdminPortal.jsx (users) | PASS A-10 (khóa hiệu lực tức thì), C-02 | FAIL A-11 (tự khóa admin duy nhất), AD-01 | PASS AUTHZ-01 | FAIL AD-03 (id lạ → 200 null), AD-03b (mật khẩu 77 ký tự) | **FAIL** | LG-16, LG-18, LG-29, LG-34 |
| ADM-03 | Vai trò | GET/POST/PUT/DELETE /admin/roles | AdminPortal.jsx (roles) | PASS UC-ADM-CRUD (200) | PASS xóa vai trò hệ thống/đang dùng → 409 | PASS (manager/khách 403) | FAIL ADM-500 (GET quyền của vai trò lạ → 500); PASS mã trùng 409, rỗng 400 | **FAIL** | LG-15 |
| ADM-04 | Danh mục quyền | GET/POST/PUT/DELETE /admin/permissions | AdminPortal.jsx (permissions) | PASS UC-ADM-CRUD, UC-GAPS (cập nhật 200) | PASS xóa quyền đang gán 409 PERMISSION_IN_USE; mã trùng khác hoa/thường 409 | PASS (manager/khách 403) | PASS id lạ → 404 | **PASS** | — |
| ADM-05 | Gán quyền cho vai trò | PUT /admin/roles/:id/permissions | AdminPortal.jsx (roles, ô gõ id) | PASS UC-ADM-CRUD | FAIL AD-02 (danh sách rỗng cho ADMIN) | PASS | PASS id quyền lạ → 400; trùng id 200 | **FAIL** | LG-17, LG-26 |
| ADM-06 | Phân công quản lý rạp | GET/POST/PUT /admin/assignments | AdminPortal.jsx (assignments) | PASS M-07 (200, cửa sổ hiệu lực đúng) | FAIL M-07 (chồng/trùng được nhận) | PASS M-07 (gán cho khách → 400) | PASS M-07 (end < start → 400); contract đòi "status" | **FAIL** | LG-35 |
| ADM-07 | Rạp (+ ảnh rạp) | GET/POST/PUT/DELETE /admin/cinemas, /images | AdminPortal.jsx, CinemaImageManager.jsx | PASS AD-07, STRESS-01 (ảnh), SQL tests 12–14 | PASS xóa rạp có phòng 409; ảnh 1200 request 0 lỗi | PASS AUTHZ-01 | FAIL ADM-500 (ảnh rạp lạ → 500), FZ-02 (NUL tên rạp) | **FAIL** | LG-13, LG-15 |
| ADM-08 | Phòng & ghế | GET/POST/PUT/DELETE /admin/rooms, /admin/seats | AdminPortal.jsx | PASS AD-07 | PASS admin chặn ghế đã bán 409 SEAT_HAS_TICKET_HISTORY; trùng tên khác hoa/thường 409 | PASS AUTHZ-01 | FAIL FZ-01 (cinemaId/roomId ≥ 2^31, hàng > 10 ký tự), FZ-02 | **FAIL** | LG-12, LG-13 |
| ADM-09 | Phim | GET/POST/PUT/DELETE /admin/movies, /actors | AdminPortal.jsx (movies) | PASS AD-05 (tạo/xóa) | FAIL AD-05 (thời lượng 99.999.999, trùng tên), KO-10 | PASS AUTHZ-01 | FAIL AD-04 (javascript: poster), FZ-01 (durationMinutes tràn) | **FAIL** | LG-12, LG-30, LG-31 |
| ADM-10 | Thể loại | GET/POST/PUT/DELETE /admin/genres | AdminPortal.jsx (genres) | PASS UC-ADM-CRUD (200) | PASS trùng khác hoa/thường 409; xóa thể loại đang dùng 409 | PASS (manager/khách 403, ẩn danh 401) | PASS rỗng/300 ký tự → 400; FAIL FZ-02 (NUL làm hỏng GET /movies) | **FAIL** | LG-13 |
| ADM-11 | Sản phẩm | GET/POST/PUT/DELETE /admin/products | AdminPortal.jsx (products) | PASS UC-ADM-CRUD (201) | PASS xóa sản phẩm đã bán 409 PRODUCT_IN_USE; FAIL trùng tên khác hoa/thường 201 | PASS | FAIL PRD-01 (giá 0, 1e12); PASS giá âm/loại lạ → 400 | **FAIL** | LG-21, LG-31 |
| ADM-12 | Khuyến mãi | GET/POST/PUT/DELETE /admin/promotions | AdminPortal.jsx (promotions) | PASS AD-06, PROMO-01 | FAIL AD-06 (sửa sau khi dùng, thông điệp sai) | PASS | FAIL FZ-01 (discountValue/minimumOrder tràn); PASS mã trùng 409 | **FAIL** | LG-12, LG-31, LG-38 |
| ADM-13 | Bảng giá toàn hệ thống | GET/POST/PUT /admin/pricing | AdminPortal.jsx (pricing) | PASS STRESS-01, test 16 | PASS chồng lịch 409; cuối tuần độc lập DATEFIRST (test 16) | PASS | FAIL FZ-01 (surcharge 1e20, cinemaId tràn) | **FAIL** | LG-12 |
| ADM-14 | Suất chiếu toàn hệ thống | GET/POST/PUT /admin/showtimes, POST .../cancel | AdminPortal.jsx (showtimes) | PASS (tạo/hủy) | FAIL M-02, M-03, C-01, M-04b, KO-06, TZ-02 | PASS AUTHZ-01 | FAIL KO-08 (trả nguyên object driver), FZ-01 | **FAIL** | LG-01, LG-03, LG-05, LG-09, LG-14, LG-21 |
| ADM-15 | Xử lý khiếu nại (Admin) | GET /admin/complaints…, POST …/processings, PUT …/status | AdminPortal.jsx (complaints) | PASS S-04 (200/200) | FAIL S-02 (không luật chuyển) | PASS S-04 (manager/khách 403) | PASS UC-GAPS (id lạ → 404) | **FAIL** | LG-25 |
| ADM-16 | Báo cáo doanh thu toàn hệ thống | GET /admin/reports/revenue | AdminPortal.jsx (revenue) | PASS R-01, R-02 (khớp truy vấn thô) | FAIL R-06 (doanh thu suất đã hủy vẫn tính) | PASS AUTHZ-01 | PASS UC-GAPS (from>to, ngày hỏng, tham số lạ → 400) | **FAIL** | LG-01 |

## 8. Ma trận phân quyền vai trò × route (kết quả thực tế)

118 route × 6 người gọi (ẩn danh, khách, manager 1, manager 2, CSKH, admin) = 708 lời gọi thật. **0 leo thang đặc quyền.** Ẩn danh nhận 401 trên mọi route không công khai. Ô "403·scope" = manager bị từ chối vì rạp không thuộc phạm vi (id mẫu thuộc rạp thứ ba); ca trong phạm vi đã chạy lại riêng: manager 1 và 2 đều 200 trên rooms/showtimes/pricing/dashboard/revenue của rạp mình và 403 MANAGER_CINEMA_FORBIDDEN trên rạp kia. 403·C/M/S/A = bị từ chối vì thiếu vai trò Khách/Manager/CSKH/Admin. Admin bị từ chối trên route manager-only và CSKH-only theo thiết kế (có route /admin/* tương đương).

| Method | Route | Yêu cầu | Ẩn danh | Khách | Manager 1 | Manager 2 | CSKH | Admin |
|---|---|---|---|---|---|---|---|---|
| GET | /health | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /health/db | public | 200 | 200 | 200 | 200 | 200 | 200 |
| POST | /auth/register | public | — | — | — | — | — | — |
| POST | /auth/login | public | — | — | — | — | — | — |
| GET | /auth/me | any-auth | 401 | 200 | 200 | 200 | 200 | 200 |
| PUT | /auth/me | any-auth | 401 | 400 | 400 | 400 | 400 | 400 |
| GET | /auth/permissions | any-auth | 401 | 200 | 200 | 200 | 200 | 200 |
| GET | /movies | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /movies/:movieId/showtimes | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /movies/:movieId/reviews | public | 200 | 200 | 200 | 200 | 200 | 200 |
| POST | /movies/:movieId/reviews | customer | 401 | 400 | 403·C | 403·C | 403·C | 403·C |
| GET | /movies/:movieId | public | 404 | 404 | 404 | 404 | 404 | 404 |
| GET | /cinemas | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /cinemas/:cinemaId/images | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /genres | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /showtimes/:showtimeId/seats | public | 200 | 200 | 200 | 200 | 200 | 200 |
| GET | /showtimes/:showtimeId | public | 404 | 404 | 404 | 404 | 404 | 404 |
| POST | /bookings | customer | 401 | 400 | 403·C | 403·C | 403·C | 403·C |
| GET | /products | public | 200 | 200 | 200 | 200 | 200 | 200 |
| POST | /promotions/validate | customer | 401 | 400 | 403·C | 403·C | 403·C | 403·C |
| GET | /orders | customer | 401 | 200 | 403·C | 403·C | 403·C | 403·C |
| GET | /orders/:orderId | customer | 401 | 404 | 403·C | 403·C | 403·C | 403·C |
| POST | /orders/:orderId/payments | customer | 401 | 400 | 403·C | 403·C | 403·C | 403·C |
| POST | /orders/:orderId/payments/:paymentId/result | customer | 401 | 400 | 403·C | 403·C | 403·C | 403·C |
| GET | /complaints | customer | 401 | 200 | 403·C | 403·C | 403·C | 403·C |
| POST | /complaints | customer | 401 | 400 | 403·C | 403·C | 403·C | 403·C |
| GET | /complaints/:complaintId | customer | 401 | 404 | 403·C | 403·C | 403·C | 403·C |
| GET | /manager/cinemas | manager | 401 | 403·M | 200 | 200 | 403·M | 403·M |
| GET | /manager/cinemas/:cinemaId/rooms | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| POST | /manager/cinemas/:cinemaId/rooms | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| PUT | /manager/rooms/:roomId | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| DELETE | /manager/rooms/:roomId | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| GET | /manager/rooms/:roomId/seats | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| POST | /manager/rooms/:roomId/seats | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| PUT | /manager/seats/:seatId | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| DELETE | /manager/seats/:seatId | manager | 401 | 403·M | 404 | 404 | 403·M | 403·M |
| GET | /manager/cinemas/:cinemaId/showtimes | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| POST | /manager/showtimes | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| PUT | /manager/showtimes/:showtimeId | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| POST | /manager/showtimes/:showtimeId/cancel | manager | 401 | 403·M | 404 | 404 | 403·M | 403·M |
| GET | /manager/cinemas/:cinemaId/pricing | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| POST | /manager/cinemas/:cinemaId/pricing | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| PUT | /manager/pricing/:pricingId | manager | 401 | 403·M | 400 | 400 | 403·M | 403·M |
| GET | /manager/cinemas/:cinemaId/dashboard | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| GET | /manager/cinemas/:cinemaId/revenue | manager | 401 | 403·M | 403·scope | 403·scope | 403·M | 403·M |
| GET | /support/complaints | cskh | 401 | 403·S | 403·S | 403·S | 200 | 403·S |
| GET | /support/complaints/:complaintId | cskh | 401 | 403·S | 403·S | 403·S | 404 | 403·S |
| GET | /support/complaints/:complaintId/order-reference | cskh | 401 | 403·S | 403·S | 403·S | 404 | 403·S |
| POST | /support/complaints/:complaintId/processings | cskh | 401 | 403·S | 403·S | 403·S | 400 | 403·S |
| PUT | /support/complaints/:complaintId/status | cskh | 401 | 403·S | 403·S | 403·S | 400 | 403·S |
| GET | /admin/dashboard | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| GET | /admin/users | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/users | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/users/:userId/status | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| GET | /admin/roles | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| GET | /admin/roles/:roleId/permissions | admin | 401 | 403·A | 403·A | 403·A | 403·A | 500 |
| POST | /admin/roles | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/roles/:roleId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/roles/:roleId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/permissions | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/permissions | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/permissions/:permissionId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/permissions/:permissionId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| PUT | /admin/roles/:roleId/permissions | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| GET | /admin/assignments | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/assignments | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/assignments/:assignmentId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| GET | /admin/cinemas | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/cinemas | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/cinemas/:cinemaId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/cinemas/:cinemaId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/cinemas/:cinemaId/images | admin | 401 | 403·A | 403·A | 403·A | 403·A | 500 |
| POST | /admin/cinemas/:cinemaId/images | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/cinemas/:cinemaId/images/:imageId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/cinemas/:cinemaId/images/:imageId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| PATCH | /admin/cinemas/:cinemaId/images/:imageId/cover | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| GET | /admin/rooms | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/rooms | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/rooms/:roomId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/rooms/:roomId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/seats | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/seats | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/seats/:seatId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/seats/:seatId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/pricing | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/pricing | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/pricing/:pricingId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| GET | /admin/showtimes | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/showtimes | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/showtimes/:showtimeId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| POST | /admin/showtimes/:showtimeId/cancel | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/movies | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/movies | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/movies/:movieId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/movies/:movieId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| PUT | /admin/movies/:movieId/actors | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| GET | /admin/genres | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/genres | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/genres/:genreId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/genres/:genreId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/actors | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/actors | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/actors/:actorId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/actors/:actorId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/products | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/products | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/products/:productId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/products/:productId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/promotions | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| POST | /admin/promotions | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/promotions/:promotionId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| DELETE | /admin/promotions/:promotionId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/reports/revenue | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| GET | /admin/complaints | admin | 401 | 403·A | 403·A | 403·A | 403·A | 200 |
| GET | /admin/complaints/:complaintId | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| GET | /admin/complaints/:complaintId/order-reference | admin | 401 | 403·A | 403·A | 403·A | 403·A | 404 |
| POST | /admin/complaints/:complaintId/processings | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |
| PUT | /admin/complaints/:complaintId/status | admin | 401 | 403·A | 403·A | 403·A | 403·A | 400 |

Ghi chú: ô 200/201/204/400/404 ở vai trò được phép là kết quả chạm route với dữ liệu mẫu (body rỗng có thể 400); không ô nào ở vai trò KHÔNG được phép khác 401/403.

## 9. Ma trận 16 họ lỗi

| # | Họ lỗi | Kết luận | Finding | Ghi chú |
|---|---|---|---|---|
| 1 | Ba tầng lệch nhau (FE ↔ validator ↔ DB) | **FAIL** | LG-07, LG-18, LG-26, LG-30, LG-21 | Từ vựng trạng thái manager/DB lệch (M-01), mật khẩu 72/128, ô nhập tự do ở portal admin, URL scheme, không CHECK giá. |
| 2 | Bỏ qua kiểm tra quyền / IDOR | **PASS (leo thang/IDOR) · FAIL (guard rail)** | LG-16, LG-17, LG-34 | AUTHZ-01 0 leo thang, IDOR đơn/khiếu nại/hồ sơ/rạp/phòng/suất đều 403/404; còn thiếu rào chắn admin cuối cùng và 403 vs 404. |
| 3 | Race condition / đồng thời | **FAIL** | LG-05, LG-10 | Booking/payment/pricing/image PASS dưới 20–120 request song song; race tạo suất và xóa phòng FAIL. S-06 (review trùng) bị bác bỏ. |
| 4 | Transaction & rollback | **FAIL (1 procedure)** | LG-10, LG-34 | Quét tĩnh 121 procedure: chỉ sp_Manager_Room_Delete ghi nhiều lần không transaction; 22 procedure có TRAN dùng TRY/CATCH+ROLLBACK+re-raise; 0 CATCH nuốt lỗi; 23 UPDATE không kiểm @@ROWCOUNT. Không bơm lỗi giữa chừng (NOT VERIFIED riêng). |
| 5 | NULL và biên | **FAIL** | LG-12, LG-13, LG-14, LG-21, LG-28, LG-31, LG-32 | Fuzz 2880 request: 32 tổ hợp 500; NUL; ngày/giá/độ dài vô lý; LIKE wildcard; dấu tiếng Việt. |
| 6 | Join & thống kê sai | **FAIL** | LG-06, LG-40 | Review count nhân theo số suất (vw_ThongKePhim). Doanh thu admin/manager khớp truy vấn thô (R-01..R-05). |
| 7 | Phân trang / sắp xếp / lọc | **FAIL** | LG-33 | Không phân trang; 4/34 procedure danh sách không ORDER BY (1 ảnh hưởng rạp mặc định của manager). |
| 8 | Soft delete & vòng đời | **FAIL** | LG-08, LG-24 | Phòng/rạp/phim ngưng vẫn bán; phim Ngừng chiếu hiện công khai. Xóa đối tượng đang tham chiếu đều 409 (PASS). |
| 9 | Trigger | **FAIL** | LG-05, LG-23 | 7 trigger đều set-based và đúng khi nhiều dòng; không IF UPDATE; hai trigger chống trùng không khóa; BR05 chấp nhận giờ bị dời. |
| 10 | Xác thực & phiên | **FAIL** | LG-11, LG-19, LG-20, LG-27, LG-28, LG-39 | JWT giả/khóa tức thì PASS; không throttle, không thu hồi token, enumeration timing, seed 123456. Không có chức năng quên/đổi mật khẩu/đổi email (không thuộc 45 UC — thiếu tính năng, không phải lỗi). |
| 11 | Dữ liệu công khai & lộ thông tin | **FAIL (nhẹ)** | LG-32, LG-36 | CORS/helmet/không lộ stack PASS; tên đầy đủ người đánh giá, /health/db, email trong log. |
| 12 | Frontend | **FAIL · NOT VERIFIED** | LG-22, LG-26 | Chỉ đọc source (chưa chạy trình duyệt): 403 → /forbidden, ô nhập tự do, giờ không múi giờ; nút gửi bị khóa khi đang xử lý (PASS, FE-02). |
| 13 | Hợp đồng API | **FAIL** | LG-15, LG-34, LG-32, KO-08, KO-10 | Admin tạo suất trả object driver, createMovie đòi endDate, 200-rỗng vs 404, 400 mã INTERNAL_ERROR. |
| 14 | Mã chết & đường không tới được | **FAIL** | LG-37 | 2 procedure không caller; 4 trạng thái chết; điểm thưởng chỉ cộng; Ngày lễ không áp dụng. |
| 15 | Tính toán chéo module | **PASS (giá/tổng) · FAIL nhẹ (định nghĩa)** | LG-40, LG-06 | Giá vé/tổng đơn/giảm giá nhất quán giữa sơ đồ ghế, đơn và báo cáo (test 15, I06–I08); định nghĩa "hôm nay" khác nhau. |
| 16 | Seed & dữ liệu mặc định | **FAIL** | LG-11, LG-38 | Tài khoản 123456; số dùng khuyến mãi gõ tay; đơn âm cũ; 6 dòng giá Ngày lễ không bao giờ dùng. |

## 10. Số liệu tổng hợp

- Finding: **40** — P0 1, P1 10, P2 15, P3 14. PROVEN (kể cả PROVEN+SOURCE) 38, SOURCE-ONLY 2.
- Theo tầng (một finding có thể thuộc nhiều tầng): DB 27, BE 24, FE 3, SEED 2.
- Giả thuyết/ca kiểm đã ghi nhận trong nhật ký: **95** — xác nhận (FAIL) 64, đạt/bác bỏ (PASS) 29, NOT VERIFIED 2.
- Giả thuyết đã bị **bác bỏ** nhờ chạy thật: S-06 (review trùng song song gây 500 — thực tế 1×201 + 11×409), PROMO-01 (đơn bỏ dở đốt lượt khuyến mãi — thực tế được nhả), INV-DB-01 (chống bán trùng chỉ nhờ khóa procedure — DB còn trigger BR02 từ chối), ENV-01 (live thiếu 012/013 — thực tế đủ), I07 "21 đơn lệch" (là đơn Hết hạn), TXN-01 phần lớn (mọi procedure có transaction đều rollback/re-raise), KO-09 (update end ≤ start → DB chặn, 400).
- Quy mô chạy: 708 lời gọi ma trận phân quyền, 2880 request fuzz, 1200 request stress ảnh + 212 request stress đặt vé + 24 stress bảng giá, 60 vòng race xóa phòng, 4×30 race tạo suất, 20–50 song song cho thanh toán/đăng ký/review, 9 tệp SQL test (08–16), 1 quét tĩnh 121 procedure + 7 trigger, hơn 5.000 request tổng cộng; đối soát DB bằng 20 truy vấn bất biến trên hai DB.

## 11. Câu hỏi cho chủ dự án

Các điểm mơ hồ về ý đồ nghiệp vụ — audit **không đoán**; kết luận LG liên quan ghi theo giả định "hành vi hiện tại là lỗi" ở mức tối thiểu.

- **Q1.** Khi một suất đã bán vé bị hủy, hệ thống phải làm gì: tự động hủy đơn + hoàn tiền, hay chỉ chặn hủy? Có cho PUT đổi status "Đã hủy" không? (LG-01, LG-02, LG-03)
- **Q2.** KNOWN-OPEN "thanh toán muộn vẫn nhận nếu ghế còn trống" có được giữ nguyên khi thanh toán là thật? Giới hạn bao lâu sau khi hết hạn?
- **Q3.** Phòng "Bảo trì", rạp "Tạm đóng", phim "Ngừng chiếu": suất tương lai có bị ẩn và vé đã bán xử lý thế nào? (LG-08)
- **Q4.** Danh sách phim công khai có hiển thị phim "Ngừng chiếu" không (hay chỉ khi lọc)? (LG-24)
- **Q5.** Khiếu nại đã Đóng/Từ chối/Giải quyết có được mở lại không? Bảng chuyển trạng thái hợp lệ? Có cho thêm ghi chú sau khi đóng? (LG-25)
- **Q6.** Vé/sản phẩm giá 0 có được phép (vé mời) hay không? Giá tối đa của vé và sản phẩm? (LG-21)
- **Q7.** Đồng hồ chuẩn là giờ Việt Nam (UTC+7) hay UTC? Form admin/manager nhận giờ theo múi giờ nào? (LG-09)
- **Q8.** Điểm thưởng: sẽ có chức năng dùng/đổi điểm không? Khách do admin tạo có phải có hồ sơ điểm? (LG-29, LG-37)
- **Q9.** Một manager có thể có nhiều phân công chồng/trùng cho cùng một rạp không? (LG-35)
- **Q10.** Tài khoản demo mật khẩu 123456 có phải chỉ để phát triển? Chính sách độ mạnh mật khẩu tối thiểu (cấm toàn dấu cách, 12345678)? (LG-11, LG-28)
- **Q11.** Chuẩn hóa số điện thoại theo dạng nào (0xxxxxxxxx hay +84…)? (LG-20)
- **Q12.** Chính sách khóa/giới hạn đăng nhập sai: bao nhiêu lần, bao lâu? (LG-19)
- **Q13.** Định dạng suất (2D/3D/IMAX) có phải khớp loại phòng không? Thời lượng suất tối đa và có cho tạo suất ở quá khứ (nhập bù) không? (LG-14)
- **Q14.** Công khai họ tên đầy đủ hay tên rút gọn của người đánh giá? (LG-32)
- **Q15.** Khối lượng dữ liệu dự kiến (số đơn/năm) để quyết định phân trang và chỉ mục? (LG-33, KO-13)
- **Q16.** Giá "Ngày lễ": nguồn lịch ngày lễ ở đâu và có áp dụng thật không? (KNOWN-OPEN, LG-37)
- **Q17.** Có cần đăng xuất/thu hồi token khi khóa tài khoản, đổi mật khẩu? (LG-39)
- **Q18.** Chính sách "admin cuối cùng": có cấm tự khóa và cấm gỡ quyền vai trò ADMIN không? (LG-16, LG-17)
- **Q19.** Số liệu "đơn hôm nay": tính theo ngày đặt hay ngày thanh toán; có tính suất đã hủy không? (LG-40)

## 12. Mục còn NOT VERIFIED và điều kiện để hoàn tất

| # | Mục | Vì sao chưa | Điều kiện hoàn tất |
|---|---|---|---|
| 1 | Frontend chạy trong trình duyệt (trạng thái cũ, đếm ngược giữ ghế, nút bấm đúp, điều hướng hết phiên, hiển thị tiền/ngày/múi giờ, ẩn nút theo vai trò) — FE-03 | Audit không điều khiển trình duyệt; frontend chỉ được đọc và đối chiếu với hành vi API đã chứng minh | Phiên Playwright/Chrome chạy trên vite dev + backend cổng 4300 trỏ RepoCheck, 6 kịch bản: đặt vé, hết hạn giữ, thanh toán, 403, đánh giá, form giờ |
| 2 | Hiệu năng ở quy mô lớn — KO-13 | DB chỉ có vài chục dòng/bảng; không có dữ liệu ≥ 100k đơn | Sinh dữ liệu lớn trong DB dùng một lần rồi đo p95 các danh sách/báo cáo và các truy vấn sơ đồ ghế dưới tải |
| 3 | Bơm lỗi giữa chừng để kiểm rollback từng procedure | Chỉ có quét tĩnh + các test hiện có | Dùng RAISERROR/THROW giả bằng trigger tạm trên DB một lần để buộc lỗi sau bước ghi đầu |
| 4 | Hành vi trên máy chủ cùng múi giờ UTC (LG-09 không tái hiện) | Máy audit ở UTC+7 | Chạy lại TZ-01/TZ-02 trên máy/container UTC để biết mức độ ảnh hưởng ở môi trường production thật |
| 5 | Nâng cấp tại chỗ một DB có dữ liệu thật từ phiên bản cũ (003–008) lên 013 | Chỉ dựng mới và so khớp với live (đã bằng repo) | Bản sao của DB production cũ + chạy lần lượt các migration + chạy lại bộ invariant |
| 6 | Race booking-trước-khi-hủy (C-03 là PASS yếu: cancel luôn thắng 15/15) | Không tạo được xen kẽ booking thắng | Chạy lại với độ trễ có kiểm soát (WAITFOR trong fixture) hoặc ≥ 500 vòng |
| 7 | Giới hạn tốc độ/HTTPS/HSTS sau reverse proxy; nhiều instance backend (job nhả giữ chỗ chạy trùng) | Không có hạ tầng triển khai | Môi trường staging có proxy và ≥ 2 instance |
| 8 | Tìm kiếm có dấu/không dấu theo kỳ vọng người dùng (LG-32) | Phụ thuộc quy tắc chủ dự án (Q) | Chủ dự án chốt yêu cầu tìm không dấu |

## 13. Trạng thái các mục KNOWN-OPEN

Tất cả đều được chạy lại trên môi trường mới dựng từ repo (known_open.json).

| KNOWN-OPEN | Còn/hết | Bằng chứng | Biến thể nặng hơn? |
|---|---|---|---|
| Thanh toán muộn vẫn nhận nếu ghế trống | CÒN | KO-01: kết quả 30 phút sau hết hạn → 200, đơn "Đã thanh toán" | Có: nhánh thanh toán BÌNH THƯỜNG không kiểm tra suất (LG-02) |
| Thanh toán mô phỏng / khách tự xác nhận | CÒN (theo quyết định chủ dự án) | PaymentPage.jsx:48 nút "Mô phỏng thành công"; POST /result do chủ đơn gọi | Có: với suất giá 0 khách hoàn tất đơn 0 đồng (LG-21) |
| Không có hủy/hoàn tiền (sp_Order_Cancel không route) | CÒN | KO-03: 0 route order+cancel; POST /orders/1/cancel → 404 | Có: hủy suất để lại đơn đã trả, vé hiệu lực và doanh thu (LG-01) |
| sp_Manager_Seat_BatchCreate không đường gọi | CÒN | KO-04: 0 tham chiếu trong backend/src | Không |
| TRG_SuatChieu_KiemTraTrungLich không khóa | CÒN, PROVEN | C-01: 2–3/30 thành công mỗi vòng, 1 cặp chồng lịch | Có: cặp chồng không sửa được (LG-23) và bán đôi ghế vật lý |
| GiaVeCoBan = 0 được phép | CÒN | KO-06: 200, ghế giá 0 | Có: đơn 0 đồng hoàn tất ở trạng thái Đã thanh toán (LG-21) |
| Giá trị "Ngày lễ" có trong CHECK nhưng không bao giờ áp dụng | CÒN | KO-07: 6 dòng seed Ngày lễ; fn_TinhGiaVe không nhắc | Có: phụ thu ngày lễ đã cấu hình bị bỏ qua im lặng |
| Admin tạo suất trả nguyên object driver | CÒN | KO-08: keys = recordsets, recordset, output, rowsAffected, returnValue | Không |
| Validator update suất không chặn end ≤ start | HẾT hiệu lực thực tế | KO-09: PUT end<start và end=start → 400 SHOWTIME_TIME_INVALID (DB chặn, mã 50057) | Khoảng trống validator còn trong source nhưng không còn tác động dữ liệu |
| createMovie bắt buộc endDate: null | CÒN | KO-10: thiếu khóa → 400 "endDate is required." | Không |
| Silent-drop sản phẩm/khuyến mãi không hợp lệ khi đặt | CÒN | KO-11: sản phẩm 999999 + mã lạ → 201 total 80000, giảm 0 | Không (khách không được báo mã không áp dụng) |
| 19 procedure sp_Admin_* dư trong master | CÒN (chỉ đếm) | KO-12: 19 | Không |
| Hiệu năng quy mô lớn chưa đo | CÒN — NOT VERIFIED | KO-13 | Không đo được; thêm: không có phân trang (LG-33) |

## 14. Thứ tự sửa đề xuất

Nhóm theo rủi ro và phụ thuộc; **chưa sửa gì**.

1. **Chốt quyết định nghiệp vụ trước (Q1, Q3, Q7)** — chúng quyết định cách sửa nhóm 2 và 4. Không sửa LG-01/LG-02 khi chưa biết chính sách hoàn tiền.
2. **Bảo vệ tiền và vé (LG-01 → LG-02 → LG-03 → LG-04):** một guard "suất có đơn đang giữ/đã thanh toán" dùng chung cho Update/Cancel của cả hai cổng và cho CreateAttempt/UpdateResult; sau đó guard ghế đã bán cho manager. LG-02 phụ thuộc LG-01 (cùng khái niệm). Dọn 3 đơn trên suất 34 ở DB live có kiểm duyệt.
3. **Đồng hồ (LG-09)** — làm TRƯỚC khi chỉnh logic suất chiếu/cận thời gian (LG-14) vì mọi so sánh thời gian phụ thuộc vào nó; kèm form FE có bộ chọn múi giờ (LG-26).
4. **Đồng thời và toàn vẹn (LG-05 → LG-23 → LG-10):** khóa phòng khi tạo/sửa suất, IF UPDATE trong trigger, transaction + khóa cho xóa phòng. LG-23 chỉ nên sửa cùng lúc với LG-05.
5. **Số liệu sai công khai (LG-06):** sửa một dòng view (COUNT DISTINCT) — rẻ và rủi ro thấp, có thể làm sớm độc lập với các nhóm khác.
6. **Từ vựng trạng thái và lan truyền (LG-07, LG-08, LG-24):** một nguồn sự thật cho tập trạng thái, rồi thêm điều kiện phòng/rạp/phim vào danh sách suất, sơ đồ ghế và đặt vé (phụ thuộc Q3).
7. **Cứng hóa đầu vào (LG-12, LG-13, LG-14, LG-15, LG-18, LG-21):** một bộ helper validator dùng chung (cận INT/DECIMAL, ký tự điều khiển, độ dài, URL), CHECK cho giá, bọc hai route đọc còn sót mapper; thay FOR XML PATH bằng STRING_AGG. Làm cùng lúc vì chung một thư viện.
8. **Xác thực và an toàn tài khoản (LG-11, LG-19, LG-20, LG-16, LG-17, LG-39):** seed không tài khoản production, giới hạn đăng nhập, chuẩn hóa SĐT, guard admin cuối cùng. LG-11 nên làm trước khi triển khai thật.
9. **Frontend (LG-22, LG-26)** và sau đó chạy vòng audit trình duyệt (NOT VERIFIED #1).
10. **Tồn đọng P3 (LG-27…LG-40)** theo nhóm tính năng; quyết định dùng/gỡ mã chết (LG-37) sau khi chủ dự án trả lời Q2, Q8, Q16.

Sau mỗi nhóm: chạy lại bộ invariant (inv.sql), 9 SQL test 08–16, 3 script stress, fuzz t_fuzz.mjs (mục tiêu 0 tổ hợp 5xx) và ma trận phân quyền để bảo đảm không hồi quy.

## Phụ lục A. Nhật ký kiểm chứng (results.json)

Mã bằng chứng dùng trong báo cáo. FAIL = giả thuyết/lỗi được xác nhận; PASS = đạt hoặc giả thuyết bị bác bỏ; NOT VERIFIED = chưa kiểm.

| Mã | Kết quả | Họ | Nội dung kiểm |
|---|---|---|---|
| A-01 | PASS | F10 | email uniqueness: exact, UPPER, padded, +tag alias |
| A-02 | FAIL | F10 | phone uniqueness across formatting (same number written 5 ways) |
| A-03 | FAIL | F10 | account enumeration by login response and timing |
| A-03b | FAIL | F10 | registration reveals which email/phone exist |
| A-04 | FAIL | F10 | 60 wrong passwords in a row on a real staff account, then the correct one |
| A-05 | FAIL | F16 | seeded demo accounts use the documented password 123456 (admin, manager, CSKH, customer) |
| A-06 | FAIL | F5 | password edge cases: 8 spaces, 12345678, 73 chars, 25 multibyte chars (75 bytes) |
| A-07 | FAIL | F5 | profile: birth date in 2999 / 1800, Vietnamese name round trip |
| A-08 | FAIL | F2 | staff updates own profile through the customer profile procedure |
| A-09 | PASS | F10 | JWT: alg=none, payload swapped to admin id 1 with old signature, truncated, junk |
| A-10 | PASS | F10 | token of a locked account: immediate effect, re-login refused, old token works again after unlock |
| A-11 | FAIL | F2 | the only admin locks their own account |
| A-12 | PASS | F11 | CORS for a foreign origin, security headers, malformed JSON / oversized body, /health/db exposure |
| P-01 | FAIL | F8 | public movie list/detail for a movie whose status is Ngừng chiếu (discontinued) |
| P-02 | FAIL | F11 | public review lists expose the reviewer full name |
| P-03 | FAIL | F13 | public GET on nonexistent showtime / seats / images / movie / showtimes / reviews |
| P-04 | FAIL | F8 | sales through soft-deactivated parents: room Bảo trì / cinema Tạm đóng / movie Ngừng chiếu |
| P-05 | FAIL | F5 | movie search: LIKE wildcards (% and _) and accent sensitivity |
| P-06 | FAIL | F7 | pagination parameters on list endpoints: movies, customer orders, complaints, admin users |
| M-01 | FAIL | F1 | manager room/showtime status vocabulary vs the DB CHECK constraints |
| M-02 | FAIL | F4 | cancel a showtime that has a PAID order through PUT .../showtimes/:id {status:"Đã hủy"} (manager and admin routes) |
| M-03 | FAIL | F4 | reassign the movie and move the start time of a showtime that already has a paid order |
| M-04 | FAIL | F5 | manager creates a showtime: unknown movie, IMAX format in a 2D room, start in 2001, 4-day long showtime |
| M-05 | FAIL | F4 | manager marks a SOLD seat as Hỏng (broken) |
| M-06 | FAIL | F2 | manager id routes: other cinema, nonexistent ids |
| M-07 | FAIL | F4 | assignment validity window: starts tomorrow / ended yesterday / today-only / overlapping duplicates |
| AD-01 | FAIL | F8 | customer account created by an admin: loyalty profile and points |
| AD-02 | FAIL | F2 | admin empties the permission list of the ADMIN role |
| AD-03 | FAIL | F5 | admin user routes: unknown user id, unknown role id, password beyond bcrypt 72 bytes |
| AD-04 | FAIL | F1 | URL fields: movie poster/trailer vs cinema image URL |
| AD-05 | FAIL | F5 | movie boundaries: end before release, duration 99,999,999, blank title, 256-char title, duplicate title |
| AD-06 | FAIL | F4 | promotion edits after use: quantity below the used count, discount type switched while orders hold the old code, delete a used code, same code in lower case |
| AD-07 | PASS | F9 | admin master data: room name / seat row case duplicates, seat number 2^31-1, delete cinema with a room, close cinema |
| AD-03b | FAIL | F1 | password length contract: admin user create accepts up to 128 characters, login/register accept at most 72 bytes |
| S-01 | PASS | F13 | complaint life cycle: create -> CSKH list/detail -> processing -> customer sees history |
| S-02 | FAIL | F4 | complaint status machine: closed -> in progress -> rejected -> resolved, back to "Mới" |
| S-03 | FAIL | F5 | complaint abuse: 90 KB content, 25 parallel complaints from one customer, "%" search |
| S-04 | PASS | F2 | CSKH-03/ADM-15 access: admin handles complaints, manager/customer denied |
| S-05 | PASS | F5 | reviews: invalid rating/content, not eligible, unknown movie, then valid + duplicate |
| S-06 | PASS | F3 | 12 parallel reviews for the same (user, movie) |
| S-07 | FAIL | F6 | movie rating statistics: raw table vs detail API vs list API |
| R-01 | PASS | F6 | admin revenue report (orders, collected, ticket, food, discount, tickets) vs an independent SQL on raw tables |
| R-02 | PASS | F6 | money identity on paid orders: collected = ticket + food - discount |
| R-03 | PASS | F6 | manager revenue (cinema 1): orders and tickets over a wide range, default range, and today-only edge |
| R-04 | PASS | F6 | manager dashboard counters vs raw tables |
| R-05 | PASS | F2 | manager 1 asks for the revenue of cinema 2 |
| R-06 | FAIL | F6 | revenue counted for showtimes that were cancelled after payment |
| C-01 | FAIL | F3 | showtime overlap: 4 rounds x 30 parallel creates of mutually overlapping windows in one room |
| C-02 | PASS | F3 | parallel duplicates: 12x register same email, 12x admin-create same email, 12x register same phone |
| C-03 | PASS | F3 | 15 rounds: customer books a seat while admin cancels the same showtime |
| FZ-01 | FAIL | F5 | field-level fuzz of 37 write routes x every field x 20 hostile values (2880 requests) |
| F-01 | FAIL | F4 | pay an order whose showtime was meanwhile cancelled (via PUT) or moved into the past |
| F-02 | FAIL | F14 | states that no procedure can ever set: order Hoàn thành/Hoàn tiền, ticket Đã sử dụng, payment Đã hoàn tiền; loyalty points redemption |
| FZ-02 | FAIL | F5 | control character U+0000 in text fields (seat row, genre, cinema, room, movie, product, promo code, role code, complaint) sent through admin/manager/customer write routes |
| F-03 | FAIL | F13 | timestamps: DB-local values returned as UTC (order booked time, hold expiry, showtime times) |
| M-04b | FAIL | F5 | showtime with an end date of 9999-12-31 (admin and manager create routes) |
| PAY-01 | PASS | F3 | one order, several payment attempts all reported successful (2 sequential; 4 attempts x 20 parallel results) |
| PAY-02 | PASS | F2 | another customer posts a payment result for / reads somebody else's order |
| KO-01 | FAIL | F3 | KNOWN-OPEN late successful payment accepted if the seat is still free |
| KO-02 | FAIL | F14 | KNOWN-OPEN simulated payment / customer self-confirm |
| KO-03 | FAIL | F14 | KNOWN-OPEN no cancel/refund of orders (sp_Order_Cancel has no route) |
| KO-04 | FAIL | F14 | KNOWN-OPEN sp_Manager_Seat_BatchCreate has no caller |
| KO-05 | FAIL | F3 | KNOWN-OPEN TRG_SuatChieu_KiemTraTrungLich takes no lock |
| KO-06 | FAIL | F5 | KNOWN-OPEN base ticket price 0 allowed |
| KO-07 | FAIL | F14 | KNOWN-OPEN 'Ngày lễ' in CHECK but never applied |
| KO-08 | FAIL | F13 | KNOWN-OPEN admin create-showtime returns the raw driver object |
| KO-09 | PASS | F1 | KNOWN-OPEN update-showtime validator does not block end <= start |
| KO-10 | FAIL | F13 | KNOWN-OPEN createMovie requires endDate: null |
| KO-11 | FAIL | F5 | KNOWN-OPEN silent drop of invalid products / promotions at booking |
| KO-12 | FAIL | F16 | KNOWN-OPEN 19 stray sp_Admin_* procedures in master (read-only count) |
| KO-13 | NOT VERIFIED | F7 | KNOWN-OPEN performance at scale not measured |
| FE-01 | FAIL | F12 | frontend: any HTTP 403 redirects the whole app to /forbidden |
| FE-02 | PASS | F12 | frontend payment page: attempt lives only in component state; double submit |
| FE-03 | NOT VERIFIED | F12 | frontend run in a browser: stale state, countdown vs server hold, date/money display, role-only hiding of buttons |
| ENV-01 | PASS | F16 | drift: live CinemaBookingDB vs repo build (CinemaBookingDB_RepoCheck) |
| UC-ADM-CRUD | PASS | F9 | ADM-03/04/05/10/11: roles, permissions, role-permission assignment, genres, products (happy / edge / wrong role / bad input) |
| PRD-01 | FAIL | F5 | product price bounds: 0 and 1e12/9e15 accepted by admin create; booking with 10 x 1e12 product |
| ADM-500 | FAIL | F13 | two admin read routes bypass the error mapper: GET /admin/roles/:id/permissions and GET /admin/cinemas/:id/images with an unknown id |
| TZ-01 | FAIL | F13 | time zone: showtimes sent as real UTC instants vs DB SYSDATETIME() (server clock UTC+7) |
| PROMO-01 | PASS | F4 | promotion quantity 2: two orders take the code, both holds expire (swept by the backend job), a third customer tries the code |
| IDOR-01 | PASS | F2 | customer B reads customer A complaint by id, sees it in B list, files a complaint that references A order, reads A order |
| TRG-01 | FAIL | F9 | overlap trigger has no IF UPDATE guard: after C-01 left two overlapping showtimes, edit only the price of one |
| C-04 | FAIL | F4 | room delete vs concurrent showtime create: 60 rounds (manager DELETE room racing an admin POST showtime on the same room) |
| AUTHZ-01 | PASS | F2 | full role x route matrix: 118 routes x 6 callers (anonymous, customer, manager 1, manager 2, CSKH, admin) against the declared middleware |
| STRESS-01 | PASS | F3 | repo stress scripts through the API on the isolated DB: booking-stress, pricing-overlap-stress, cinema-image-lock-stress (STRESS_CONFIRM_DISPOSABLE=yes) |
| SQLTEST-01 | PASS | F4 | database/tests 08..16 re-run on the AuditScratch database through temporary copies whose USE line was retargeted (the repo files hard-code USE CinemaBookingDB and were not touched) |
| INV-DB-01 | PASS | F3 | does the database itself refuse a second live ticket for the same (showtime, seat) if a procedure is bypassed? |
| LOG-01 | FAIL | F11 | sensitive data and stack traces in logs and error bodies |
| TXN-01 | FAIL | F4 | static scan of all 121 procedures: multi-statement writes without a transaction, transactions without XACT_ABORT/TRY-CATCH, CATCH blocks that swallow errors, UPDATE without @@ROWCOUNT |
| TRG-02 | FAIL | F9 | review of the 7 triggers: set-based form, multi-row UPDATE, status unchanged, recursion |
| TZ-02 | FAIL | F13 | which clock does the admin showtime form really store? ISO text without zone, with Z, with +07:00 (the portal field is a free-text "(ISO)" input) |
| UC-GAPS | PASS | F5 | remaining UC edge/bad-input cases: revenue date ranges (manager QLR-09, admin ADM-16), CSKH detail / order reference / processing / status (CSKH-03..06), duplicate permission code (ADM-04), seat map of unknown showtime (KH-06) |
| FE-04 | FAIL | F1 | admin portal inputs vs DB enumerations: room type, seat type, product type, discount type, status and showtime times are free-text inputs |
| FE-05 | FAIL | F12 | manager portal default times: zone-less strings built from toISOString().slice(0,10) |
| KO-06b | FAIL | F5 | free (0-price) showtime and a 10-trillion-VND order completed through the normal flow |

## Phụ lục B. Cách chạy lại

- Backend: bash start_backend.sh (export DB_DATABASE, DB_USER, DB_PASSWORD trong phiên; mật khẩu không nằm trong tệp).
- Kiểm chứng: node t_{tên}.mjs trong thư mục scratchpad; đối soát: sqlcmd -S localhost -E -C -d CinemaBookingDB_RepoCheck -I -f 65001 -i inv.sql.
- SQL test: các tệp sqltests/*.sql (đã đổi USE) chạy bằng sqlcmd -d CinemaBookingDB_AuditScratch -I -f 65001 -b -i {tệp}; stress: STRESS_CONFIRM_DISPOSABLE=yes node database/tests/stress/{tên}.mjs --email={admin} --base-url=http://localhost:4300/api với STRESS_ADMIN_PASSWORD trong biến môi trường.

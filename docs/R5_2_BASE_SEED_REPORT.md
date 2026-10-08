# R5.2 — Audit và hoàn thiện Base Seed

**Trạng thái: DONE trong phạm vi R5.2.** Đã audit đủ 16 script base, kiểm tra dữ liệu
và chạy regression an toàn. Không phát hiện thiếu/sai dữ liệu nền cần sửa; toàn bộ
16 SQL giữ nguyên byte, số lượng, ID và business key. **Live SQL verification: NOT RUN**;
không có database disposable hiện hữu được xác minh an toàn cho task này.

Đây là kết luận về nguồn seed và các kiểm tra offline đã chạy, không phải xác nhận
dataset đang tồn tại trong `CinemaBookingDB`, API login runtime hoặc integration R6.
Các thay đổi R5.1 đang có trong workspace được giữ nguyên; không dùng diff so với
Git HEAD để quy các lần di chuyển file R5.1 thành thay đổi dữ liệu R5.2.

## 1. Nguồn và phương pháp audit

Thứ tự nguồn: [roadmap sau audit](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md),
[baseline 45 UC](USE_CASE_BASELINE_45.md), schema/business contract,
[báo cáo R5.1](R5_1_SEED_REPORT.md), rồi caller/test hiện có. Không thêm quyền hoặc
quan hệ chỉ để test thuận tiện. Comment cũ nhắc “16 Use Case” trong `003_reference.sql`
không thay thế baseline 45 UC; mapping được đối chiếu với contract/guard hiện hành.

Đã đọc toàn bộ base SQL, [entry point](../database/10_seed/seed-all.sql),
[verification hiện có](../database/12_verify/verify_seed.sql), các định nghĩa tại
`database/02_tables`, `03_constraints`, `04_indexes` và
[manifest schema](../database/baseline-manifest.json).
Đối chiếu các nguồn quyết định hành vi:

- Auth/profile: `database/08_procedures/auth`,
  [profile contract](contracts/ROLE_AWARE_PROFILE_UPDATE.md),
  [bcrypt helper](../backend/src/utils/password.js).
- Scope/RBAC: `fn_KiemTraQuyenNguoiDung`, `fn_KiemTraQuanLyRapScope`, `fn_HomNay`,
  guard của các SP admin/manager/customer/support và backend authorization.
- Catalog: `database/08_procedures/public` và caller catalog hiện có; các test/fixture
  tham chiếu ID của rạp, phòng, ghế, phim, account và mã khuyến mãi.
- Pricing/promotion: `fn_TinhGiaVe`, `fn_GioiHanGiamGiaPhanTram`, `sp_Promotion_Validate`,
  [trigger chồng lấn giá](../database/07_triggers/TRG_BangGia_KiemTraChongLan.sql),
  `fn_UtcTuGioRap` và tập enum hiện hành trong `shared`.

Snapshot [audit-before.json](evidence/r52/audit-before.json) chụp trạng thái trước
thay đổi R5.2: 809 file cần bảo toàn và hash SQL đã expand của seed/build/reset.
README của base là file có sẵn duy nhất được sửa trong R5.2. Checker/docs/evidence
R5.2 được thêm riêng, không ghi đè evidence R5.1.

## 2. Danh mục thực tế

Tất cả script dưới `database/10_seed/seed_base/`; tổng **18 bảng, 376 bản ghi** trong
mô hình fresh seed. Đây là số lượng từ nguồn SQL, không phải COUNT trên database.

| Script | Bảng/dữ liệu | Số lượng | Kết luận |
|---|---|---:|---|
| `001_reference.sql` | VAITRO | 4 | STATIC PASS; giữ nguyên |
| `002_reference.sql` | QUYEN | 23 | STATIC PASS; giữ nguyên |
| `003_reference.sql` | VAITRO_QUYEN | 40 | STATIC PASS; giữ nguyên |
| `004_reference.sql` | NGUOIDUNG / HOSOKHACHHANG | 8 / 4 | STATIC + BCRYPT PASS; giữ nguyên |
| `005_reference.sql` | RAPCHIEUPHIM | 3 | STATIC PASS; giữ nguyên |
| `006_reference.sql` | PHANCONG_RAP | 2 | STATIC PASS; giữ nguyên |
| `007_reference.sql` | PHONGCHIEU | 6 | STATIC PASS; giữ nguyên |
| `008_reference.sql` | GHE | 240 | STATIC PASS; giữ nguyên |
| `009_reference.sql` | THELOAI | 7 | STATIC PASS; giữ nguyên |
| `010_reference.sql` | DIENVIEN | 6 | STATIC PASS; giữ nguyên |
| `011_reference.sql` | PHIM | 4 | STATIC PASS; giữ nguyên |
| `012_reference.sql` | PHIM_THELOAI / PHIM_DIENVIEN | 7 / 4 | STATIC PASS; giữ nguyên |
| `013_reference.sql` | BANGGIA | 7 | STATIC PASS; giữ nguyên |
| `015_reference.sql` | SANPHAM | 5 | STATIC PASS; giữ nguyên |
| `016_reference.sql` | KHUYENMAI | 3 | STATIC PASS; giữ nguyên |
| `017_cinema_images.sql` | HINHANH_RAPCHIEUPHIM | 3 | STATIC PASS; giữ nguyên |

## 3. Bảng đánh giá và quyết định sửa

| Nhóm dữ liệu | Hiện có | Yêu cầu | Thiếu/sai | Cần sửa |
|---|---|---|---|---|
| Role/RBAC | 4 role, 23 permission, 40 mapping | Đúng baseline; permission SP có trong danh mục | Không phát hiện trong nguồn | Không |
| User/Profile | 1 Admin, 2 Manager, 1 CSKH, 4 Customer; 4 profile | Account hoạt động/hash hợp lệ; chỉ Customer có profile | Không phát hiện; SQL login chưa chạy | Không |
| Manager assignment | User 2 → rạp 1; user 3 → rạp 2 | Manager hợp lệ, phân công hiệu lực, có scope âm | Đủ dữ liệu tại SeedDate; scope runtime chưa chạy | Không |
| Cinema/Room/Seat | 3 rạp, 6 phòng, 240 ghế; 3 ảnh | Parent đúng, vị trí ghế unique, trạng thái/loại hợp lệ | Không phát hiện; không kiểm tra HTTP của URL ảnh | Không |
| Movie/Catalog | 4 phim, 7 thể loại, 6 diễn viên; liên kết 7/4 | FK/unique/date/status hợp lệ | Không phát hiện; không có yêu cầu cast seed cho mọi phim | Không |
| Product/Pricing/Promotion | 5 sản phẩm, 7 giá, 3 khuyến mãi | Giá hợp lệ, enum đúng, không overlap cùng tuple, quota chưa dùng | Không phát hiện trong nguồn | Không |

### RBAC, account và profile

| Role | Mapping hiện có |
|---|---|
| KHACH_HANG | XEM_PHIM, DAT_VE, THANH_TOAN, DANH_GIA, GUI_KHIEU_NAI |
| QUAN_LY_RAP | XEM_PHIM, DAT_VE, THANH_TOAN, QL_PHONG, QL_GHE, QL_SUAT_CHIEU, QL_BANG_GIA, XEM_BAO_CAO_RAP |
| CSKH | XEM_PHIM, QL_KHIEUNAI, XULY_KHIEUNAI, TRA_CUU_DON |
| ADMIN | Đủ 23 quyền hiện hành |

Không thay mapping legacy của quyền public/customer đã có. Guard exact role AND
permission vẫn kiểm soát thao tác; Manager có `DAT_VE` trong mapping không đồng nghĩa
được qua SP dành cho Customer. Không thêm grant cho lookup hoặc business flow khác.
Tất cả mã permission được các SP gọi qua `fn_KiemTraQuyenNguoiDung` đều có parent.

8 hash demo được helper bcrypt thật xác nhận với mật khẩu đã công bố trong seed
`123456`. Tài khoản active, email/phone unique, VaiTroID đúng. Chỉ user 5–8 có profile,
date/gender hợp lệ; không tạo profile cho staff. Điểm `150, 80, 45, 0` là số nguyên
không âm. Contract profile giữ nguyên điểm hiện có và không bắt buộc tái dựng mọi
điểm mẫu từ lịch sử transaction; không có căn cứ đổi điểm hoặc tạo history trong R5.2.

### Scope, cấu trúc rạp và catalog

Phân công active từ SeedDate −30 ngày đến +2 năm. Manager 2 có rạp 1; Manager 3 có
rạp 2; rạp 3 không phân công. Có sẵn trường hợp khác scope cho từng Manager.
`fn_KiemTraQuanLyRapScope` còn kiểm tra role, account active, status và ngày hiện tại
qua `fn_HomNay`: kết luận static tại SeedDate không bảo đảm dataset cũ còn hiệu lực
ở ngày chạy API tương lai.

Mỗi rạp có phòng; mỗi phòng có 40 ghế A–E × 1–8. Hàng A/B: Thường; C/D: VIP;
E: Sweetbox. FK rạp → phòng → ghế đúng và vị trí `(PhongID, HangGhe, SoGhe)` unique.
Cả rạp/phòng/ghế/ảnh active; mỗi rạp có đúng một cover image. DEFAULT trạng thái
ảnh và giá trị seed tương thích constraint/index filtered. URL không bị sửa;
khả dụng của dịch vụ ảnh bên ngoài chưa được kiểm tra.

4 phim đang chiếu, duration/date hợp lệ; ngày chiếu từ SeedDate −30 ngày đến
+1 năm. Mọi phim có thể loại; các liên kết thể loại/diễn viên không trùng, không
mồ côi. Không có requirement ép mọi phim có diễn viên seed. Parent records phim,
rạp, phòng, ghế đủ cho bước xây lịch quanh SeedDate; kiểm tra cửa sổ ±7 ngày chỉ là
tiền đề cho R5.3. Không tạo hoặc sửa showtime, kể cả file dynamic `014_reference.sql`.

### Sản phẩm, giá và khuyến mãi

5 sản phẩm Đang bán, đơn giá không âm. 7 quy tắc giá Áp dụng, phụ thu/date hợp lệ;
không có loại ngày Ngày lễ. Enum đúng: Ngày thường, Cuối tuần, Tất cả. Trigger chỉ
chặn giao khoảng hiệu lực khi cùng `(RapID, LoaiGhe, LoaiNgay, DinhDang)`. VIP,
weekend và IMAX ở rạp 1 là các lớp phụ thu khác tuple được phép cộng, không phải
bản ghi duplicate cần xóa.

`CHAOBANMOI`, `GIAM30K`, `VIPMEMBER` có giá trị phần trăm/số tiền và mức giới hạn
hợp lệ; quota lần lượt 1000/500/200, `SoLuongDaDung = 0` cả ba. Cửa sổ −30 ngày
đến +1 năm được đổi từ giờ rạp sang UTC bằng function hiện hành. Kiểm tra cửa sổ
không đồng nghĩa mọi khách hàng/mọi đơn được áp dụng: SP vẫn quyết định điều kiện
đơn tối thiểu, ngày hiện tại và quota runtime.

## 4. Sentinel, rerun và các giới hạn đã ghi nhận

Các tình huống dưới đây được đọc từ source, **chưa thực thi rerun trên SQL Server**.

| Tình huống | Hành vi hiện tại | Tác động / nơi xử lý |
|---|---|---|
| Fresh database, không có Admin/VAITRO | Skip=0; chạy toàn bộ include và verify trong transaction | Nguồn base đủ parent/constraint; runtime NOT RUN |
| Có Admin sentinel | Skip=1; không insert base/dynamic; vẫn chạy verify | Không repair hoặc refresh ngày theo SeedDate mới; R5.5 |
| Thiếu Admin nhưng VAITRO còn dữ liệu | THROW 51004 trước transaction | Chặn một trường hợp partial dataset; R5.5 |
| Có Admin nhưng mất dữ liệu base | Skip vẫn bằng 1 | Verify chỉ kiểm một phần, có thể bỏ sót mất profile/assignment/phòng/ảnh/mapping non-Admin; R5.5 |
| Không có Admin/VAITRO nhưng bảng khác không rỗng | Guard hiện tại không bao phủ mọi bảng | Có thể lỗi UNIQUE/FK hoặc trộn dataset tùy dữ liệu; R5.5 |
| Chạy file riêng với Skip=0 trên dữ liệu có sẵn | Script insert trực tiếp; ghế có loop | Không idempotent từng file, có nguy cơ duplicate/constraint; không dùng để repair |
| Đổi SeedDate khi bị skip | Các giá trị ngày cũ không cập nhật | Dataset có thể stale cho demo/scope/promotion; R5.5 và đánh giá dynamic tại R5.3 |

Giữ nguyên `seed-all.sql`, runner và `verify_seed.sql`. Không chuyển yêu cầu audit
nội dung base thành triển khai synchronization/upsert/reset pipeline. Chưa phát
hiện blocker trực tiếp trong nội dung SQL base; các rủi ro dataset hiện hữu được
ghi nhận rõ, không khẳng định sentinel chứng minh base đầy đủ.

## 5. Thay đổi thực hiện

| File / artifact | Thay đổi và lý do |
|---|---|
| [README base](../database/10_seed/seed_base/README.md) | Thêm inventory, kết quả audit, RBAC/date/points/pricing và giới hạn rerun |
| [checks.mjs](../scripts/r52/checks.mjs) | Checker offline trực tiếp phục vụ R5.2: đọc literal/SELECT/loop seed, constraint, FK, UNIQUE, date, hash và bcrypt |
| Báo cáo này | Ghi đánh giá từng nhóm, quyết định giữ dữ liệu, phạm vi và trạng thái |
| `docs/evidence/r52/*` | Snapshot trước sửa, kết quả checker, log regression và verification tổng hợp |

**0 SQL base sửa, 0 bản ghi thêm/xóa/sửa.** Không đổi schema/function/view/trigger/SP,
backend/frontend, API, enum, orchestration, dynamic hoặc fixture; không thêm dependency.
Hash bảo toàn gồm cả nguồn và evidence R5.1 đã có.

## 6. Verification đã thực hiện

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| `node scripts/r52/checks.mjs` | PASS 9/9 | [checks.json](evidence/r52/checks.json) |
| `node --check scripts/r52/checks.mjs` | PASS, exit 0 | [verification.json](evidence/r52/verification.json) |
| `npm --prefix backend test` | PASS 191/191, 0 skipped | [backend.txt](evidence/r52/backend.txt) |
| `node scripts/audit-no-sql.mjs` | PASS, 101 file scanned | [no-sql.txt](evidence/r52/no-sql.txt) |
| Bảo toàn phạm vi | PASS: 809 file giống byte; 3 expanded entry hash giống | [checks.json](evidence/r52/checks.json) |
| Live SQL, SQL login/scope/rerun | NOT RUN | Không có disposable target được xác minh an toàn |
| HTTP ảnh, browser/frontend runtime | NOT RUN | Không đổi UI/URL/caller; không thuộc bằng chứng runtime R5.2 |

Checker dựng fresh-dataset model với SeedDate `2026-10-08`, `2026-01-01`,
`2028-02-29`; kiểm 35 CHECK, 27 unique index (gồm PK/UQ/filtered) và 374 lần đối
chiếu giá trị FK theo thứ tự insert cho mỗi ngày. Kiểm datatype/length/NULL,
DEFAULT được dùng, exact mapping, local bcrypt, scope prerequisites, overlap tuple
giá, quota và ngày tương đối. 8 trường hợp dữ liệu sai trong bộ nhớ đều bị từ chối:
thiếu parent, ghế trùng, enum ghế sai, loại ngày cũ, vượt quota, INT phân số,
chuỗi quá dài và NULL bắt buộc. Không lưu fixture vào database hoặc seed.

Mô hình có phạm vi giới hạn: không phải SQL Server emulator. Seat loop được đối
chiếu nguồn/hash đã audit; date UTC dùng contract giờ rạp +07:00; so sánh chuỗi
mô phỏng case-insensitive/accent-sensitive/trailing spaces cho literal hiện có.
Không dùng nó để xác nhận execution plan, locking, trigger execution, collation
tổng quát hoặc dataset của database thực tế. Các command chạy offline không mở
DB connection, không reset/migration, không tạo test database.

Backend regression và hash bảo toàn source/test chứng minh không thay caller/API
đang có; không dùng 191 unit test để tuyên bố 45 UC integration PASS. Frontend
không có thay đổi cần kiểm thử mới trong R5.2; evidence frontend R5.1 được giữ lại.

## 7. Kết luận Definition of Done

- [x] Audit đủ 16 script và toàn bộ nhóm dữ liệu base.
- [x] 4 role và mapping hiện có phù hợp contract/guard; không cấp quyền mới.
- [x] Account/profile/assignment, parent catalog và các bảng liên kết hợp lệ theo nguồn.
- [x] Sản phẩm/giá/khuyến mãi đúng constraint và business rule đã đối chiếu.
- [x] Không phát hiện thiếu/sai nội dung base cần sửa; không tăng số lượng mẫu.
- [x] Dependency/entry point/ID/business key bảo toàn; không phát sinh duplicate.
- [x] Static và regression an toàn PASS; runtime chưa chạy có trạng thái/lý do riêng.
- [x] Có report/evidence; giữ kiến trúc và phạm vi; không triển khai R5.3–R5.5/R6.

**R5.2 DONE.** SQL runtime còn NOT RUN theo điều kiện môi trường của task; không
có blocker nội dung base đã biết bị bỏ qua. Sentinel/repair/freshness là công việc
orchestration đã ghi nhận cho R5.5. R5.3 và các phase sau chưa được triển khai.

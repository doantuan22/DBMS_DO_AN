# R5.3 — Dynamic Showtime Seed

**Trạng thái: DONE trong phạm vi R5.3. LIVE SQL: NOT RUN.** Source seed đã chuyển
sang đồng hồ SQL Server và tạo 8 suất quá khứ, 24 suất tương lai Mở bán trên target
mới hợp lệ. Static source/boundary checks đạt 9/9; backend 191/191 và No-SQL PASS.
Chưa thực thi hoặc compile seed trên SQL Server vì không có disposable database
hiện hữu được xác minh an toàn. Không tuyên bố SQL/public/booking integration PASS.

## A. Hiện trạng và dependency trước sửa

Đã đọc yêu cầu R5.3 trong [roadmap](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md),
[báo cáo R5.1](R5_1_SEED_REPORT.md), [báo cáo R5.2](R5_2_BASE_SEED_REPORT.md)
và evidence của hai task. Workspace chứa các thay đổi R5.1/R5.2 chưa commit;
chúng không được quy thành thay đổi mới của R5.3.

Seed vẫn có 16 SQL base, một SQL dynamic `014_reference.sql`, thư mục tài liệu
test_fixture và entry `seed-all.sql`. Source 014 ban đầu có 5 ID explicit:
ID 1 Hoàn thành ở SeedDate −2; ID 2–5 Mở bán ở SeedDate +1. Timestamp lưu UTC sau
`fn_UtcTuGioRap`; duration lần lượt 166/166/166/131/110 phút. Khuyết điểm trực tiếp:
chưa dùng DB clock và thiếu số lượng 6–10 past, 20–30 future.

Đã audit `scripts/db/run.mjs`, session context `CinemaSeedSkip`/`CinemaSeedDay`,
transaction/include của entry, schema SUATCHIEU, 4 CHECK, 2 FK, clock helpers,
overlap trigger và các SP/view/function liên quan. Định nghĩa quyết định:

- `fn_BayGio()` trả `SYSUTCDATETIME()`; `fn_GioRap` chuyển UTC sang SE Asia Standard Time;
  `fn_NgayKinhDoanh` lấy ngày tại giờ rạp; `fn_UtcTuGioRap` chuyển local về UTC.
- `SUATCHIEU` dùng datetime2(7) UTC. CHECK cho phép Hoàn thành/Đã hủy/Đóng bán/Mở bán,
  2D/3D/IMAX/4DX/ScreenX, giá không âm và end > start.
- `sp_Showtime_ValidateTimes` yêu cầu duration từ thời lượng phim đến +120 phút,
  tối đa 8 giờ; writer public/admin/manager không dùng để tạo lịch quá khứ.
- Trigger overlap xét mọi suất không Đã hủy, gồm cả Hoàn thành, với strict `<`/`>`.
  Hai khoảng tiếp giáp `end == start` được phép; hai phòng khác nhau có thể cùng giờ.
- `vw_LichChieuChiTiet.IsBookable`: Mở bán, start > DB now, rạp/phòng active,
  phim không Ngừng chiếu, ngày kinh doanh nằm trong release/end window.
  Public list/detail/seat và `sp_Booking_Create` đều dùng contract này.

Không có invariant trên insert lịch quá khứ bắt buộc lịch đó có order/payment.
Baseline seed và fixture lịch sử hiện có đã insert Hoàn thành trực tiếp; R5.3 giữ
ý nghĩa lịch chiếu lịch sử, không giả lập chuyển trạng thái qua writer hoặc giao dịch.
`sp_Review_Create`/trigger review vẫn yêu cầu lịch sử mua vé hợp lệ; không có
quyền review chỉ từ các suất quá khứ này.

[Dependency audit](evidence/r53/dependency-audit.json) ghi 389 file source được quét,
101 match tham chiếu/selector và quyết định đối với từng nhóm. Đây là inventory
heuristic bổ trợ việc đọc contract/caller, không phải chứng nhận mọi script an toàn:

| Dependency | Quyết định / tác động |
|---|---|
| `11_tests/procedures/smoke.sql`, `r1/sql-fixtures`, backend smoke | Selector first future vẫn chọn ID 2, first completed vẫn ID 1; giữ movie/room/format/price/slots |
| SQL pricing/bookability/overlap và helper fixture r21/r47 | Tạo resource riêng, lấy SCOPE_IDENTITY; không tìm thấy yêu cầu tổng đúng 5 hay next ID phải 6 |
| Backend/frontend mock có show ID 1/5 | Mock không đọc dataset live; giữ API và ID cũ; không sửa test expectation |
| `r2fix/migration-tests.mjs` dùng ngày 2026-10-04 | Input replay lịch sử giữ nguyên; không còn cố định timestamp dynamic. Có thể bị release preflight chặn khi DB clock quá xa; cần target/date phù hợp ở R5.5 |
| `scripts/r51/checks.mjs`, `r52/checks.mjs` | Whole-source hash là parity của thời điểm nghiệm thu; không sửa assertion hoặc ghi đè evidence cũ. Sau thay đổi 014 có chủ đích, toàn bộ parity cũ không còn là test current source |
| `scripts/r6a/queries/DATA-003/004/009.sql` | Reader anomaly của dataset lịch sử, không phải specification cho fresh seed. ID 6–32 mới không chứng minh provenance của bản ghi dev cũ cùng ID |
| Generator legacy và pinned replay | Giữ nguyên; không chạy generator/replay để ghi đè dữ liệu hiện hành |

## B. Thiết kế lịch mới

Một lần capture `@NowUtc = dbo.fn_BayGio()` trong nhánh Skip=0. `@Today =
dbo.fn_NgayKinhDoanh(@NowUtc)` làm mốc chung. Plan chỉ chứa day offset và local hour;
runtime không có ngày lịch cố định và không đọc SeedDate cho thời gian suất.
Start được tính từ local midnight của Today + offset, cộng local hour, rồi đổi UTC.
End = start + `PHIM.ThoiLuong` phút từ database. Không thêm buffer, operating hours,
scheduler hoặc chính sách duration mới.

| Ngày so với ngày DB tại Việt Nam | ID | Số lượng | Trạng thái |
|---|---|---:|---|
| −7 | 6, 7, 8 | 3 | Hoàn thành |
| −3 | 9, 10 | 2 | Hoàn thành |
| −2 | 1 | 1 | Hoàn thành |
| −1 | 11, 12 | 2 | Hoàn thành |
| +1 | 2, 3, 4, 5, 13, 14 | 6 | Mở bán |
| +2 | 15–20 | 6 | Mở bán |
| +3 | 21–26 | 6 | Mở bán |
| +7 | 27–32 | 6 | Mở bán |

Tổng **8 historical + 24 future open = 32**. Cả past và future phủ đủ 4 phim,
6 phòng, 3 rạp. Future: mỗi phim 6 suất, mỗi phòng 4 suất; rạp 1/2/3 lần lượt
12/8/4 suất. Past theo rạp 1/2/3 là 4/3/1. Không thêm parent record.

ID 1–5 giữ nguyên PhimID, PhongID, format, giá, status, day offset và local hour.
Mốc ngày thay đổi có chủ đích từ SeedDate sang Today của DB; không cam kết bảo toàn
timestamp lịch cũ. ID 1 vẫn −2 để giữ slot cũ, bổ sung các mốc −7/−3/−1.
Thời lượng cũ đúng với phim được giữ dưới công thức đọc duration. Identity ceiling
trên target mới tăng từ 5 lên 32; fixture lấy identity động không được giả định ID kế tiếp 6.

Mỗi phòng tối đa một suất trong một ngày của plan, duration seed tối đa 180 phút;
các suất không đi qua ngày kế tiếp. Trigger giữ bật khi insert cả batch 32 dòng.
CHECK/FK/trigger vẫn là lớp quyết định của SQL Server; không vô hiệu hóa để seed.
Format ID 4 vẫn 2D ở phòng ScreenX để bảo toàn compatibility; contract chỉ whitelist
format, không buộc format suất bằng loại phòng. Các suất thêm chọn format phù hợp
loại phòng hiện có, không thiết kế quy tắc tương thích format mới.

### Preflight và bookability

Khi nhánh dynamic thực sự chạy, yêu cầu bảng SUATCHIEU trống: không refresh/repair
lịch có sẵn. Hai table variable dựng plan/rows trong session, không thêm bảng schema.
Trước physical insert, script kiểm:

1. Movie/room/cinema tồn tại, duration >0 và ≤480 phút.
2. Future movie không Ngừng chiếu, room/cinema active, room có ghế active.
3. Mọi ngày suất nằm trong cửa sổ phát hành phim tính theo giờ rạp.
4. End > start; past end < captured DB now; future start > captured DB now.

Physical write duy nhất là INSERT `dbo.SUATCHIEU` với explicit IDs. TRY/CATCH
tắt IDENTITY_INSERT khi insert lỗi và rethrow; không nuốt lỗi constraint/trigger.
Sau insert, mọi future row được đối chiếu với view hiện hành `IsBookable = 1`, dùng
đồng hồ DB tại lúc view được đọc, trước COMMIT của entry point. Không gọi booking
để tạo transaction kiểm thử trong seed.

Base release vẫn dựa trên SeedDate và không được sửa. SeedDate mặc định của runner
là ngày Việt Nam trên máy gọi; nó có thể khác ngày DB. Nếu cửa sổ phim không chứa
lịch động, báo 51004 **trước physical insert**, nêu kiểm tra SeedDate/DB clock.
Không clamp lịch, đổi phim/date hoặc chuyển future thành historical để che lỗi.
Một SeedDate cũ vẫn có thể hợp lệ nếu window chứa lịch; nó không kéo lịch về quá khứ.
Fresh seed có SeedDate phù hợp DB clock đáp ứng tiền đề của base R5.2.

## C. Thay đổi

| File / artifact | Thay đổi và lý do |
|---|---|
| [014_reference.sql](../database/10_seed/seed_demo_dynamic/014_reference.sql) | DB clock, plan 32 suất, end từ duration, preflight và kiểm view future; giữ ID 1–5 |
| [README dynamic](../database/10_seed/seed_demo_dynamic/README.md) | Lịch, UTC/date contract, phạm vi ghi, compatibility và giới hạn live/rerun |
| [README seed](../database/10_seed/README.md), [README database](../database/README.md) | Thay mô tả current 5 suất/SeedDate đã lỗi thời; giải thích SeedDate không tái lập dynamic timestamps |
| [checks.mjs](../scripts/r53/checks.mjs) | Offline source/boundary analysis trực tiếp cho R5.3; không import DB pool/execute SQL |
| Báo cáo và `docs/evidence/r53/*` | Snapshot trước sửa, source dependency inventory, kết quả checker, regression và verification |

16 base SQL và README base R5.2 giữ nguyên. Không sửa entry point/thứ tự include,
runner/sentinel, schema/manifest/module nghiệp vụ, backend/frontend/API, pricing,
promotion hoặc fixture cũ. 27 showtime seed mới so với source ban đầu; **0 order,
ticket, payment, review, complaint, compensation hoặc parent resource được tạo**.

Snapshot [audit-before.json](evidence/r53/audit-before.json) chứa source 014 cũ,
hash 814 file bảo toàn, và expanded seed/build/reset ngoài body dynamic. Bổ sung
hai README cha vào danh sách tài liệu được sửa trước khi sửa chúng, giữ hash gốc;
không đổi snapshot source để hợp thức hóa thay đổi ngoài phạm vi.

## D. Verification thực hiện

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| `node scripts/r53/checks.mjs` | STATIC PASS 9/9 | [checks.json](evidence/r53/checks.json), [checks.txt](evidence/r53/checks.txt) |
| `node --check scripts/r53/checks.mjs` | PASS, exit 0 | [verification.json](evidence/r53/verification.json) |
| `npm --prefix backend test` | PASS 191/191, fail/skip 0 | [backend.txt](evidence/r53/backend.txt) |
| `node scripts/audit-no-sql.mjs` | PASS, scan 101 file | [no-sql.txt](evidence/r53/no-sql.txt) |
| Scope/hash/include parity | PASS: 814 file giống byte; 3 expanded entry giống ngoài dynamic | [checks.json](evidence/r53/checks.json) |
| Link tài liệu R5.3 | PASS các link mới/sửa; 32 target tồn tại, 8 link lịch sử đã thiếu từ HEAD được ghi riêng | [verification.json](evidence/r53/verification.json) |
| SQL compilation, actual seed/trigger, public SP/booking và rollback | **NOT RUN** | Không xác minh được disposable DB an toàn |
| Browser/frontend, SQL fixture/replay/concurrency | **NOT RUN** | Không sửa UI; các suite SQL cần target an toàn và có write/destructive operation |

9 nhóm checker đọc plan/literal từ SQL hiện có, đối chiếu parent source, CHECK/FK,
duration contract, ID 1–5 từ snapshot và `IsBookable` predicates của source. Có
7 artificial clock cases: current example; trước/sau midnight local ở cuối tháng;
trước/sau midnight cuối năm; đầu và cuối ngày nhuận. Mỗi case có đúng 8 past/24 future,
duration đúng, UTC→business date đúng và zero overlap.

Boundary predicate kiểm `end == start` không overlap, overlap 1ms có overlap,
khác phòng được phép và Đã hủy được loại khỏi overlap. SeedDate `2026-01-01`
với clock giả `2026-10-08` vẫn cho cùng lịch do window còn chứa lịch; `2024-01-01`
và `2027-01-01` bị từ chối trong mô hình release preflight. Thêm case phim Ngừng chiếu
và future gắn Hoàn thành đều bị checker từ chối. Ngày cố định chỉ xuất hiện trong
offline case/evidence, không trong runtime seed.

Đây là **STATIC SOURCE AND BOUNDARY ANALYSIS** bằng mô hình giới hạn, không phải
SQL Server emulator. JS chỉ phân tích lịch từ plan; timezone +07:00 được đối chiếu
helper SQL hiện hành, không chứng nhận timezone engine SQL. SQL syntax được review
và kiểm delimiter/source references; **SQL Server compile NOT RUN**. Không dùng
9/9 static hoặc 191 unit test làm chứng nhận locking/trigger/SQL integration/45 UC.
Evidence R5.1/R5.2 đã được bảo toàn, không rerun ghi đè kết quả historical parity.

## E. Công việc để lại

| Giới hạn / dependency | Tác động | Nơi kiểm chứng/xử lý |
|---|---|---|
| Sentinel Admin skip toàn bộ | Dataset cũ vẫn không refresh DB clock và verify_seed chỉ kiểm một phần | R5.5 orchestration/test pipeline; không sửa R5.3 |
| Base window theo SeedDate khác DB date | Có thể preflight 51004; không seed sai lịch để vượt rule | R5.5 xác minh target/date và case stale/rejected rollback |
| Target không trống hoặc identity/data lịch sử | Dynamic từ chối; không áp source mới lên dữ liệu dev cũ | R5.5 target sạch có xác nhận, bảo toàn dev data |
| Whole-source parity R5.1/R5.2 | Sau thay đổi có chủ đích, chạy lại sẽ không giữ toàn bộ hash cũ | Dùng checker R5.3 cho current source; không sửa lịch sử evidence |
| Replay fixed-day và ID mới trùng số audit dev cũ | Không suy provenance hoặc dùng lịch mới thay bản ghi lịch sử | R5.5 chọn môi trường/date; audit cũ vẫn giữ source/artifact |
| Không có transaction fixture | Past không tạo watched eligibility; future không mô phỏng held/sold seats | R5.4 theo task riêng, chưa triển khai |
| Live verification chưa có target an toàn | Chưa biết actual compile/insert/trigger/public/booking runtime | R5.5: seed count, FK/CHECK, full bookability, boundary/reject rollback và caller regression trên disposable DB |
| 8 link lịch sử trong README database đã thiếu target từ Git HEAD, gồm RELEASE_READINESS/DATETIME_CONTRACT và report audit | Quét link rộng phát hiện lỗi tài liệu có sẵn, không do thay đổi lịch | Danh mục trong verification; giữ nguyên vì ngoài phạm vi R5.3, các link mới đều được kiểm riêng |

## F. Kết luận

R5.3 **DONE** về triển khai source và kiểm chứng phù hợp điều kiện môi trường của
task: đủ số suất và phân bố, DB-owned clock, UTC/business-date contract, duration,
release/bookability, non-overlap và ID compatibility. Các kiểm tra an toàn đã chạy
PASS; không còn lỗi trực tiếp đã biết trong logic seed. **LIVE SQL: NOT RUN**;
yêu cầu compile/execution/integration được chuyển sang kiểm chứng R5.5, không fake PASS.
Không chạy reset/drop/migration trên dev, không tạo test DB, không triển khai R5.4/R5.5/R6.

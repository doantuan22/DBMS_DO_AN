# TASK 4 — PHASE R2.1: BOOKING PARENT-STATUS / BOOKABLE SHOWTIME CORRECTNESS

**R2.1 DONE. I-06 booking/public-read defect RESOLVED R2.1.** Ngày 08/10/2026, múi giờ Việt Nam. Giữ nguyên R0/R1.1/R1.2 đã nghiệm thu; dừng trước R2.2. [Raw evidence](r21/README.md).

## 1. Phân tích implementation trước sửa

Đã trace `BookingPreparation → catalogApi.createBooking → POST /api/bookings → authenticate/requireCustomer/requirePermission(DAT_VE) → bookingController/validateBooking → bookingService → typed/whitelisted procedureClient → sp_Booking_Create`. `sp_DatVe` delegate canonical procedure. Public reads đi qua catalog/booking controllers, public SP, view, seat TVF; pricing qua `fn_TinhGiaVe`, conflict qua `fn_DonDangGiuGhe` và hai ticket triggers. Đã đọc parent tables, order/ticket tables, CHECK constraints, shared resource/date contracts, current parent-update SP và tests.

| Câu hỏi trước implementation | Kết quả trước sửa |
| --- | --- |
| 1. Parent status booking đã check? | Chỉ suất Mở bán/chưa bắt đầu; không cinema/room/movie/release window. |
| 2. Showtime list filter? | Chỉ Mở bán và start > fn_BayGio(). |
| 3. Seat list của suất không bookable? | Vẫn trả ghế; public detail cũng trả suất đóng bán/quá giờ. |
| 4. Movie Sắp chiếu? | Booking không xét trạng thái phim; rule mới không yêu cầu Đang chiếu. |
| 5. Release window? | Booking/public availability chưa enforce. R1 ValidateTimes kiểm tra duration/time, không release window. |
| 6. DB clock? | fn_BayGio() = SYSUTCDATETIME(), DATETIME2(7). |
| 7. Timezone? | Instant UTC; fn_GioRap dùng SE Asia Standard Time; fn_NgayKinhDoanh trả DATE tại Việt Nam. |
| 8. Inactive seat? | TVF hiển thị Bảo trì cho Hỏng/Bảo trì; booking count active seats và reject toàn selection với50024. |
| 9. Effective conflict? | Ticket chưa Đã hủy + order Đã thanh toán/Hoàn thành, hoặc Chờ thanh toán còn HanGiuCho > DB now. |
| 10. Booking locks? | NGUOIDUNG UPDLOCK/HOLDLOCK → SUATCHIEU UPDLOCK/HOLDLOCK → GHE → ticket conflict locks; own/savepoint. |
| 11. Duplicate rule? | Public list có partial rule; chưa có shared complete bookability contract. |
| 12. Authoritative JS? | Không isBookable input; Backend bind IDs/DTO/map errors, promotion preview là provisional. Frontend chọn từ server state. |

RCSI ON live. Source authoritative literals: cinema Hoạt động/Tạm đóng/Bảo trì; room Hoạt động/Bảo trì/Ngưng hoạt động; phim Sắp chiếu/Đang chiếu/Ngừng chiếu; ghế Hoạt động/Hỏng/Bảo trì. Không tạo literal Ngưng hoạt động cho cinema vì CHECK không cho phép.

## 2. Root cause I-06

Một suất open/future có thể tồn tại khi parent không active hoặc ngày chiếu ngoài release window. Booking chỉ giữ/check child và seats; public reads quảng bá cùng suất đó. Dữ liệu customer đã load không chứng minh parent vẫn hợp lệ tại booking transaction. RCSI read đơn thuần cũng không giữ trạng thái parent đến commit.

## 3. Bookable Showtime contract chính thức

Contract dùng chung là `vw_LichChieuChiTiet.IsBookable`, tính trong DB từ resource hiện tại:

```text
SUATCHIEU.TrangThai = Mở bán
AND SUATCHIEU.ThoiGianBatDau > fn_BayGio()
AND RAPCHIEUPHIM.TrangThai = Hoạt động
AND PHONGCHIEU.TrangThai = Hoạt động
AND PHIM.TrangThai <> Ngừng chiếu
AND fn_NgayKinhDoanh(ThoiGianBatDau) >= PHIM.NgayKhoiChieu
AND (PHIM.NgayKetThuc IS NULL OR business showDate <= PHIM.NgayKetThuc)
```

Booking eligibility còn yêu cầu **mọi ghế** thuộc đúng phòng, Hoạt động và không effective conflict, theo checks hiện có. `IsBookable` là điều kiện suất, không hứa một selection cụ thể còn trống. Sắp chiếu hợp lệ trong release window. Không nhận boolean/date/clock từ client; input spoof isBookable bị API reject400.

## 4. Các file đã thay đổi

| Nhóm | File |
| --- | --- |
| Sáu DB modules hiện có | `06_views/vw_LichChieuChiTiet.sql`, `05_functions/fn_DanhSachGheSuatChieu.sql`, `08_procedures/booking/sp_Booking_Create.sql`, public `sp_Showtime_ListByMovie.sql`, `sp_Showtime_GetDetail.sql`, `sp_Seat_ListByShowtime.sql` |
| Build/migration | [r21_booking_bookability.sql](../../database/13_migrations/r21_booking_bookability.sql); build-objects đưa seat TVF sau view dependency; source-built manifest/verify_objects |
| Backend | bookingService listSeats error mapping; bookingService tests; SQL error coverage thêm ownership của seat-read flow |
| Frontend | BookingPreparation clear stale seats/selection/promotion và show error; bookingLimits message và regression assertion |
| Tests/tooling | [bookability.sql](../../database/11_tests/booking/bookability.sql), [parent race harness](../../database/11_tests/concurrency/booking-parent-status.mjs), `scripts/r21/*` |
| Docs/evidence | Báo cáo này, r21 raw evidence/README, concurrency README và current notice trong FULL_SYSTEM_AUDIT |

Không thêm table/index/function/procedure/view/trigger mới vào DB. Module signatures, pricing/conflict/promotion/expiry implementations không đổi. Working tree đầu task sạch; không commit tự động.

## 5. sp_Booking_Create thay đổi

Trong transaction hiện có: khóa khách như trước; discover current show → room/movie/cinema bằng RCSI read không giữ child lock; giữ parent locks theo hierarchy; re-read child cùng PhongID/PhimID đã discover; dùng view contract để reject50022. Nếu movie thay đổi trong lúc chờ phòng, reject/reload thay vì lock movie mới sau child.

Sau đó chạy expiry, seat parsing/limits/active count, effective conflict và snapshot pricing/products như trước. Re-check shared contract bằng DB time lần nữa ngay trước promotion usage/order write. Rejection đi qua CATCH rollback own transaction hoặc savepoint; doomed caller vẫn full rollback theo convention. Alias sp_DatVe giữ nguyên và được bảo vệ qua delegation.

## 6. Cinema/Room/Movie/Showtime validation

View resolve `SUATCHIEU → PHONGCHIEU → RAPCHIEUPHIM` và PHIM bằng FK thật. Chỉ cinema/room Hoạt động; movie khác Ngừng chiếu; show chỉ Mở bán và tương lai. Status không nhận từ booking input. Nhiều parent invalid vẫn reject cùng code50022. Missing show dùng50021.

## 7. Release-window implementation

`NgayKhoiChieu DATE NOT NULL`, `NgayKetThuc DATE NULL`; show start `DATETIME2(7)` chứa UTC instant. ShowDate là `fn_NgayKinhDoanh(start)` tại Việt Nam, không CONVERT(DATE,start) theo UTC. Hai biên inclusive; end NULL không giới hạn trên. Contract được SQL booking/public/seat paths dùng lại, không copy thuật toán sang JS.

## 8. Seat-status validation

Giữ nguyên `GHE WITH(UPDLOCK,HOLDLOCK)` và active count so với toàn bộ selection; sai phòng/missing/Hỏng/Bảo trì reject50024 toàn booking. Không bỏ riêng ghế lỗi. Seat TVF vẫn trả physical inactive seats với trạng thái Bảo trì, không Trống. Hai ca API mixed-seat và SQL cases19–21 kiểm chứng.

## 9. Transaction/locking implications

Thứ tự explicit của booking: **NGUOIDUNG → PHIM(shared HOLDLOCK) → RAPCHIEUPHIM(shared HOLDLOCK) → PHONGCHIEU(UPDLOCK,HOLDLOCK) → SUATCHIEU(UPDLOCK,HOLDLOCK) → existing seat/conflict/order path**. Giữ customer-first coordination để tương thích cancellation/payment. HOLDLOCK buộc giữ S locks parent dưới RCSI; UPDATE parent cần X và phải chờ. Shared movie/cinema locks cho phép đọc các phòng khác đồng thời; room mutex cố ý serialize cùng phòng, thống nhất R1.

Không redesign ticket/order lock protocol, không thêm Node transaction/mutex/Redis/global SERIALIZABLE. Giữ own/savepoint và xử lý XACT_STATE có sẵn; không thay XACT_ABORT convention của booking. SQL tests caller bật OFF; existing smoke caller bật ON. R1 writers/triggers nguyên source và DB definitions.

14 actual two-session cases có DMV `LCK_M_*`, SPID khác nhau, transaction0/state0 cuối case. Parent-first: booking reject sau parent commit. Booking-first: parent UPDATE chờ đến booking commit; các thay đổi sau đó không retroactively hủy lịch sử booking. Riêng seat writer booking-first reject50207 vì vé tương lai hiệu lực, giữ policy hiện có. Task không bảo đảm mọi ad-hoc caller tự lấy child locks trước rồi mới gọi SP tránh được deadlock.

## 10. Public showtime read consistency

List và detail filter `IsBookable=1`, giữ result columns/DTO. Không bookable: list không có suất, detail empty → API404 SHOWTIME_NOT_FOUND theo contract hiện có. View giữ mọi row cho history/introspection và trả parent statuses/release dates/IsBookable; không filter history toàn view.

## 11. Seat availability consistency

Seat SP missing show50021; existing unbookable show50022. API map404/409. Seat TVF cũng join shared view và filter bookable, nên direct function read không trả Trống cho một suất ineligible. Read vẫn có thể stale sau response; booking luôn re-check dưới locks.

## 12. Backend error mapping

Reuse **50022 → HTTP409 SHOWTIME_UNAVAILABLE** và **50021 →404 SHOWTIME_NOT_FOUND**; thêm cùng mapping vào listSeats bằng catch hiện có. 50024 SEAT_UNAVAILABLE và50025/50003 SEAT_CONFLICT giữ nguyên. Không JOIN/query parent trong Backend; không mới error framework; private SQL text không expose.

## 13. Frontend thay đổi nếu có

SHOWTIME_UNAVAILABLE có message Việt Nam đề nghị quay lại lịch chọn suất khác. Failed booking clear selection/promotion, giữ error thay success và refresh seats. Seat reload thất bại clear cached seats/selection để tránh hiển thị ghế cũ như còn chọn được. Không đổi palette/layout/component hierarchy; không tính bookability bằng client time/status.

## 14. SQL positive tests

[sql-tests.json](r21/sql-tests.json): tổng **30/30 PASS**. Active resources, Sắp chiếu trong window, end NULL, start/end equality, sau release start, UTC/Vietnam date boundary, legacy alias và caller rollback đều tạo đúng1 order/2 tickets/1 food/1 promotion usage trong caller transaction rồi rollback toàn fixture.

## 15. SQL negative parent-status tests

Cinema Tạm đóng/Bảo trì; room Bảo trì/Ngưng hoạt động; movie Ngừng chiếu; show Đóng bán/Đã hủy/Hoàn thành; already started/start tại DB now:50022. Seat Hỏng/Bảo trì/mixed selection/wrong room:50024. Case nào cũng assert order/ticket/food/promotion count đúng, caller1/committable trước caller rollback, transaction/state0 và fixture absent sau rollback. Data fingerprint27 bảng và strict metadata trước/sau bằng nhau.

## 16. Release-window tests

SQL boundary start equality/greater PASS, before start reject; end equality PASS, after end reject, end NULL PASS. Sắp chiếu before release reject. UTC17:30 chuyển sang ngày Việt Nam tiếp theo và UTC16:59 còn cùng ngày, window bằng business date vẫn PASS. Fixture relative to fn_BayGio(), không hardcode future date. API real Admin Movie Update đẩy start/end ra ngoài ngày suất và stale booking reject.

## 17. Stale-read/integration test

[api-tests.json](r21/api-tests.json): **107 requests thật**,16 bookability/seat cases,2 parallel booking races. Customer load detail/seats active; Manager room maintenance, Admin room inactive/cinema inactive/movie stopped/release-window change qua API thật; customer POST selection cũ →409; final state bằng state trước rejected request, không có order/ticket/food/usage mới. Không chỉ mock service. Positive API booking gồm food/promotion trả201 và chốt DB amounts.

[parent-concurrency.json](r21/parent-concurrency.json): **14 deterministic real races**, hai thứ tự cho Manager room/Admin room/Admin cinema/Admin movie/Admin release-start/Admin release-end/Manager seat. Có blocking resource/timeline/full initial/before-commit/final state, không chỉ response count. Dữ liệu/schema và session state sạch sau cleanup.

## 18. Booking concurrency regression

API same show/same seat: đúng một201 và một409 SEAT_CONFLICT. Overlapping selections `[A1,A2]`/`[A2,A3]`: đúng một commit, không duplicate effective ticket. Wrong-room/mixed inactive selection reject toàn bộ; SQL same-seat/overlap existing-order conflict không tăng order/food/promotion usage lần nữa. Giữ nguyên conflict function/ticket trigger hashes. Đây là regression R2.1, **không tuyên bố R6 DONE**; stress runner cũ hardcode2100 cần fixture adaptation ở phase concurrency riêng, không chạy nó trên main.

## 19. R1.1/R1.2 regression

[r1-regression.json](r21/r1-regression.json) chạy nguyên accepted runner/harness bằng redirect utility/evidence filename, ghi original SHA; không sửa source/raw evidence cũ.

| Suite | Kết quả |
| --- | --- |
| R1.1 SQL |20/20 PASS |
| R1.1 RoomDelete/Create hai phiên |10/10 PASS, cả hai thứ tự, invariant all-or-nothing |
| R1.2 SQL |49/49 PASS |
| R1.2 nested transaction |14/14 PASS |
| R1.2 canonical scenarios |26/26 PASS |
| R1.2 actual stress |125/125 PASS; query mỗi iteration/global committed overlap0 |

Giữ nguyên166 accepted artifacts/protected sources; SQL migration chỉ đổi sáu R2.1 module, mọi R1 definitions không đổi.

## 20. Backend/Frontend regression

[checks.json](r21/checks.json): Backend **127/127**, Frontend **49/49**,0 skip, lint/build PASS. Existing SQL suite smoke/timezone/pricing/compensation/constraints/multirow/execute-only PASS. Procedure contract112 methods/120 calls PASS. Source-built final disposable `CinemaBookingDB_R0_R21_20261008_02`; verification159 modules không drift. Main không reset/seed/chạy destructive tests.

## 21. No-SQL audit

[no-sql.txt](r21/no-sql.txt):93 source/test files, PASS. JS runtime không authoritative parent-status/date rule, không SQL/ORM/transaction/mutex. Offline r21 tooling chỉ phục vụ fixture/evidence/migration, không import vào backend/src.

## 22. Evidence đã tạo

[r21/README.md](r21/README.md) liệt kê source/test/SQL/API/DMV/state/parity/deployment artifacts. Tests dynamic trên disposable01/02; final suite trên02. Cleanup giữ data27 bảng và schema/constraints; không disable FK/CHECK.

[main-migration.json](r21/main-migration.json): verified COPY_ONLY/CHECKSUM backup trước deployment; SQL-owned atomic ALTER sáu module, source parity159, data27 bảng/columns/constraints/indexes/grants/signatures và mọi module khác giữ nguyên. [main-readonly.json](r21/main-readonly.json): data post-commit giữ nguyên, overlap0, RCSI ON/FK CHECK trusted. Main hiện có0 bookable show theo DB clock và dataset hiện có; positive booking evidence đến từ disposable, không regenerate dataset ngoài scope.

Trial diagnostics được giữ: SQL fixture dùng literal product không thuộc CHECK, đã sửa thành Snack; API movie fixture thiếu genreIds, đã thêm empty list hợp lệ; error coverage thêm flow ownership seat-read mà không nới assertion. Initial replay runner chưa substitute USE target; data assertion fail và SQL ROLLBACK toàn DDL, không COMMIT thay đổi nhầm DB. Runner đã substitute và assert DB_NAME trước/sau; replay/main migration final PASS. Không đổi accepted r12 tooling trong task này.

## 23. Kết quả từng Exit Criteria

| # | Exit Criterion | Kết quả / evidence |
| --- | --- | --- |
|1| Contract document rõ |PASS —§3 |
|2| sp_Booking_Create authoritative re-check |PASS —locked parents + shared view, SQL/API |
|3| Showtime Mở bán |PASS —negative14–16 |
|4| Future theo DB time |PASS —negative17–18 |
|5| Cinema Hoạt động |PASS —SQL/API/parent races |
|6| Room Hoạt động |PASS —SQL/stale Manager/Admin/races |
|7| Movie Ngừng chiếu reject |PASS —SQL/API/races |
|8| Sắp chiếu đúng window allowed |PASS —SQL/API positive |
|9| NgayKhoiChieu enforce |PASS —inclusive/before boundaries |
|10| NgayKetThuc non-NULL enforce |PASS —inclusive/after boundaries |
|11| Seat Hoạt động |PASS —mixed/broken/maintenance |
|12| Existing conflict không regression |PASS —SQL conflict +2 API races |
|13| Invalid parent rollback toàn bộ |PASS —atomic rejected state |
|14| Không partial promotion/order/ticket/food |PASS —four-state assertions |
|15| Public showtime read aligned |PASS —list rows/HTTP |
|16| Showtime detail aligned |PASS —empty/404 when ineligible |
|17| Seat availability aligned |PASS —50022/409, TVF filter/physical state |
|18| Stale selection không bypass |PASS —real loaded selection + parent API change |
|19| SQL positive PASS |PASS —30-case suite positives |
|20| SQL negative status PASS |PASS —30-case suite negatives |
|21| Release-window boundary PASS |PASS —DATE/Vietnam inclusive/NULL/UTC boundary |
|22| API integration PASS |PASS —107 real requests |
|23| R1.1 regression PASS |PASS —20 SQL +10 races |
|24| R1.2 regression PASS |PASS —49 SQL +14 nested +26 scenarios +125 stress |
|25| Backend regression PASS |PASS —127/127,0 skip |
|26| No-SQL backend PASS |PASS —93 files |
|27| Không thêm bảng |PASS —27 preserved, six existing module ALTER |
|28| Không authoritative JS business rule |PASS —SQL-owned view/booking validation |
|29| Evidence thật |PASS —SQL/API/DMV/state/backup/parity |

## 24. Issue ngoài scope chưa sửa

I-07 Promotion atomicity, I-08 Movie–Actor, I-09 historical metadata, complaint/admin reports/pricing capability/auth/profile/order expiry/R5 dataset/R8 async/R9 cleanup giữ nguyên. Full R6 booking concurrency chưa nghiệm thu. Broader scheduling-create policy không mở rộng trong task booking/read. Existing frontend bundle warning và old stress fixture2100 giữ nguyên. Source giữ nguyên sp_Promotion_Validate, fn_TinhGiaVe, fn_DonDangGiuGhe và R1 locking modules. R12 replay tooling target substitution là tooling finding ngoài task; runner R21 có guard riêng.

[current-audit-status.json](r21/current-audit-status.json): I-06 resolved trong booking/read scope; KH-05/KH-06/KH-07 không còn known parent-status defect, giữ **PARTIAL** vì các phần acceptance khác. I-02/I-03 vẫn resolved; I-07 vẫn ACTIVE. Không tăng grade toàn UC chỉ từ fix này.

## 25. Kết luận

**R2.1 DONE.** No new booking on inactive parent; public availability aligned với authoritative DB booking contract.29/29 criteria PASS; R0/R1 bảo toàn. Dừng, không triển khai R2.2.

Reproduce tuần tự trên DB disposable **mới**:

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_R21_Review
node scripts/r21/checks.mjs --database=CinemaBookingDB_R0_R21_Review
```

Không chạy fixture/concurrency trên main. Credentials đọc backend/.env/environment, không ghi password/token vào evidence. Module-only migration replay: `node scripts/r21/deploy.mjs --database=<disposable>`; main deployment yêu cầu các evidence suites PASS và verified backup.

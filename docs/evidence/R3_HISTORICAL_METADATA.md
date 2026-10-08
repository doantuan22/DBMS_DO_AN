# TASK 7 — R3.2: Historical Metadata Integrity

Ngày nghiệm thu: 08/10/2026. Phạm vi duy nhất: **I-09 / R3.2**. **R3.2 DONE**, dừng trước R3.3. Tất cả kiểm chứng ghi dữ liệu chạy trên SQL Server disposable rebuild từ source: `CinemaBookingDB_R0_R32_20261008_02`. Main chỉ được backup, migration bốn module và kiểm tra đọc; không seed/reset hoặc chạy fixture trên main.

## 1. Phân tích implementation trước sửa

[Trace trước implementation](r32/trace-before.md) trả lời đủ 15 câu hỏi, xác định writers, readers, schema/index/FK/CHECK/trigger, auth/scope, frontend payload và locking. [Freeze trước task](r32/preserved-before.json) ghi 1.014 file được bảo vệ và bản sao 11 file cho phép sửa tại `r32/before-source/`. Working tree đã có R3.1 chưa commit; các thay đổi đó được giữ nguyên.

Showtime Update nhận phim, start/end, format, base price và status, tất cả required. Không nhận roomId/PhongID khi update. Guard cũ chỉ xét paid/current holds và thiếu base price. Seat Update nhận type/status, chỉ dùng guard vé hiệu lực ở suất tương lai. Booking đã giữ room/show/seat locks tới transaction end, nên không cần sửa shared booking writer.

## 2. Root cause I-09

History đọc structural metadata qua JOIN tới SUATCHIEU/GHE hiện tại. Guard show cũ bỏ canceled/expired/completed/refunded orders; guard seat bỏ canceled/used tickets. Vì vậy canonical update có thể thay đổi nội dung giao dịch cũ dù tiền vẫn được snapshot. Hai cặp Admin/Manager đều có vấn đề này. Writer cũng gọi public reader sau update; đóng bán có thể commit rồi trả empty row và làm Manager DTO lỗi. Điểm trả kết quả này được sửa trong chính writer.

## 3. Historical data policy chính thức

| Dữ liệu | Policy đã triển khai |
|---|---|
| SUATCHIEU có bất kỳ DONDATVE | PhimID, thời gian bắt đầu/kết thúc, DinhDang, GiaVeCoBan bất biến; PhongID luôn giữ persisted value vì contract không hỗ trợ chuyển phòng |
| GHE có bất kỳ CHITIETVE | LoaiGhe bất biến, kể cả vé hủy/đã sử dụng |
| Trạng thái show/seat | Theo lifecycle, permission/scope, canonical Cancel và operational guards hiện có |
| Tiền lịch sử | Đọc stored snapshots; không tính lại theo catalog hiện tại |
| TenPhim/TenRap/TenPhong/TenSanPham | Current catalog descriptors, vẫn có thể đổi theo policy hiện hữu |

Không thêm history/versioning/snapshot table hoặc column; không snapshot tên catalog. Đây là trade-off giới hạn chính thức của roadmap.

## 4. Writers/readers liên quan

Writers sửa: `sp_Manager_Showtime_Update`, `usp_Admin_Showtime_Update`, `sp_Manager_Seat_Update`, `usp_Admin_Seat_Update`. Shared booking `sp_Booking_Create`, các parent writers R2.1, promotion consume R2.2, CancelCascade và create/cancel aliases giữ nguyên. Seat BatchCreate/Delete và FK hiện hữu tiếp tục bảo vệ referenced seats; không phát hiện alias type/structural update bypass trong application gateway.

Readers giữ nguyên: `sp_Order_GetDetailByCustomer`, `sp_Order_ListByCustomer`, `vw_ChiTietDonDatVe`, `vw_LichSuDatVe`, public showtime readers và Admin/Manager lists. Monetary columns lấy từ ticket/food/order/payment persisted rows; tên catalog JOIN hiện tại.

## 5. Các file đã thay đổi

[Inventory và hashes](r32/changed-files.json), [patch riêng R3.2 so với working tree trước task](r32/source-changes.patch). Git diff tổng thể vẫn bao gồm R3.1 chưa commit; không coi các thay đổi R3.1 đó là implementation mới của Task 7.

- Bốn SQL writers tại `database/08_procedures/{manager,admin}/`.
- `backend/src/services/{managerService,adminService}.js`: chỉ message mapping của hai conflict codes.
- `frontend/src/utils/bookingLimits.js`, `frontend/src/pages/AdminPortal.jsx`: localized feedback và dùng helper trong submit catch; giữ nguyên cast fix R3.1.
- Manifest và `database/12_verify/verify_objects.sql`: refresh từ disposable rebuild để parity đúng bốn definitions.
- `database/13_migrations/r32_historical_metadata.sql`; test-only rollback SQL và `database/11_tests/concurrency/historical-metadata.mjs`.
- `backend/tests/r32-historical-metadata.test.js`, `frontend/tests/r32-browser-fixtures.jsx`, offline helpers/runners `scripts/r32/`.
- Báo cáo/evidence R3.2 và current head của `docs/FULL_SYSTEM_AUDIT.md`.

## 6. Showtime historical immutability implementation

Sau discovery persisted room, lock PHONGCHIEU rồi SUATCHIEU theo R1.2, writer đọc old movie/start/end/format/base price. `EXISTS DONDATVE WHERE SuatChieuID=@ID` xét mọi trạng thái. Một tuple `SELECT requested EXCEPT SELECT persisted` xác định khác biệt thực sự và NULL-safe. Nếu có history và tuple khác, THROW 50120 trước UPDATE. PhongID không nhận input và không được ghi lại.

Không có blanket reject theo parameter presence. Request giữ nguyên toàn bộ structural values vẫn đi qua duration/overlap/status/scope validation hiện hữu. NULL không trở thành patch/default; API giữ required validators, direct SQL historical NULL bị reject. SQL parameter không có default. Contract room-transfer thử bằng đủ required params cộng PhongID bị native unsupported-parameter error; thiếu required params bị 201.

## 7. Seat type immutability implementation

Hai writer bật XACT_ABORT ON, đọc persisted LoaiGhe dưới GHE UPDLOCK/HOLDLOCK. Chỉ khi `requested type EXCEPT persisted type` có khác biệt và tồn tại bất kỳ CHITIETVE của ghế mới THROW 50207. Không filter ticket status. Type/status được UPDATE cùng transaction, nên mixed request đổi type + Hỏng không thể ghi một phần.

Guard `fn_GheCoVeHieuLucSuatTuongLai` vẫn chạy sau history guard và vẫn áp dụng cho mọi Seat Update, kể cả type/status giữ nguyên. Không xóa ticket để mở khóa, không sửa GiaVe cũ, không thêm trạng thái.

## 8. State transition compatibility

Historical show giữ phim/times/format/price được noop hoặc đóng bán theo existing contract. Hai writer trả cùng projection cũ từ `vw_LichChieuChiTiet` theo ID, kể cả row đã đóng bán. Public `sp_Showtime_GetDetail` tiếp tục `IsBookable=1`, không đổi policy R2.1. Manager API đóng bán trả DTO persisted thay vì empty-row failure.

Canonical Cancel giữ restriction active-held 50118 và quy tắc expiry/payment/compensation; SQL tests chạy held reject, expired cancel và paid cancel cho cả hai role. Showtime Update không thay canonical Cancel/hard delete. Seat có canceled history được sửa Hoạt động/Bảo trì/Hỏng nếu existing future-effective-ticket guard không vi phạm. Active future ticket vẫn chặn noop/status update như trước.

## 9. Monetary snapshot preservation

Không writer nào ghi CHITIETVE.GiaVe, CHITIETDOAN.DonGia, DONDATVE.TongTienVe/TongTienDoAn/TienGiamGia hoặc THANHTOAN.SoTien. Hai suite tạo booking và payment thật, sau đó gọi canonical pricing/product update. Toàn bộ stored monetary rows được so sánh trước/sau; order detail API/SQL vẫn đọc tiền cũ. Giá mới chỉ ảnh hưởng current catalog/calculation và giao dịch mới.

## 10. Transaction and lock order

Own transaction/savepoint, TRY/CATCH và XACT_STATE rollback convention giữ nguyên. Showtime: discovery RCSI → room U/HOLD → show U/HOLD → history read → validation/write. Seat: persisted GHE U/HOLD → Manager scope → history read → existing operational guard → write. Booking: customer → movie S → cinema S → room U → show U → seat U → child/pricing/product/promotion operations tới commit.

History SELECT được thực thi sau khi lấy shared resource lock. Với READ COMMITTED/RCSI hiện hữu, statement này thấy booking đã commit sau thời gian chờ. Index DONDATVE(SuatChieuID,TrangThai) và CHITIETVE(GheID,TrangThai) hỗ trợ predicate theo resource; FK NO ACTION tới show/seat giữ references. Không thêm child range lock trước parent, global SERIALIZABLE, Node mutex hoặc lock table. Lập luận chỉ áp dụng canonical application writers trong trace; quyền ad-hoc sa giữ accepted constraint R0.

## 11. Backend error mapping

| Tình huống | SQL / API |
|---|---|
| Historical structural show change | 50120 → 409 SHOWTIME_HAS_ORDERS |
| Historical seat type / active future ticket restriction | 50207 → 409 SEAT_HAS_TICKET_HISTORY |
| Missing show | 50058 → 404 SHOWTIME_NOT_FOUND |
| Missing seat | Manager 50109 → 404 MANAGER_RESOURCE_NOT_FOUND; Admin 50206 → 404 SEAT_NOT_FOUND |
| Outside Manager cinema | 50050 → 403 MANAGER_CINEMA_FORBIDDEN |
| Admin thiếu live permission | 50302 → 403 FORBIDDEN |
| Unexpected write failure | 500 EREQUEST theo error convention hiện hữu / message `Internal server error` |

Role/permission middleware, typed bindings, fixed whitelist và SP-owned transactions giữ nguyên. HTTP error evidence không chứa SQL text, stack hoặc connection details. SQL/log evidence nội bộ ghi số lỗi để kiểm chứng; không ghi cấu hình password hoặc JWT.

## 12. Frontend changes

Hai historical codes có thông báo tiếng Việt rõ phạm vi structural/type và existing operational restrictions. Admin submit dùng helper như Manager đã dùng. Forms/payload builders/layout/palette không đổi. Failed request giữ input editable, giữ row persisted đang hiển thị, không hiện success; valid retry reload danh sách. Browser supplementary dùng actual React pages với controlled HTTP responses, không dùng mock UI để thay thế SQL/API business evidence.

## 13. Showtime SQL tests

[108 SQL cases](r32/sql-tests.json): 50 positive / 58 negative, gồm 72 show cases, 26 seat cases, 6 canonical Cancel cases và 4 unsupported/required contract cases. Cả Manager và Admin có unused time/format/price/movie update; canceled/expired history chặn từng phim/start/end/format/base price; active/paid/completed/refunded/expired-pending chặn price. Noop và đóng bán chạy trên đủ bảy nhóm order state.

Historical NULL price, missing resource, Manager scope, wrong SQL role và unsupported room param đều được kiểm chứng. Native SQL giữ chính xác datetime2(7), gồm 100 ns, không false reject khi gửi đúng persisted values. REST DateTime2 binding hiện hữu dùng JS milliseconds; API fixtures dùng persisted milliseconds tương ứng contract. Không làm tròn old SQL values để nới guard.

## 14. Seat SQL tests

Unused VIP→Thường thành công; history active/canceled/expired/used chặn type đổi kèm status Hỏng. Canceled history status Hoạt động/Bảo trì/Hỏng và used-ticket type giữ nguyên thành công. Active future ticket noop vẫn bị 50207 theo policy cũ. Historical NULL type, missing resource, wrong role và scope bị reject đúng. Negative cases so full fixture state và data hashes cả 27 bảng, không chỉ assert số lỗi.

## 15. Monetary history regression

Hai SQL + hai HTTP regressions, mỗi role một lần: booking hai VIP tickets giá 95.000 mỗi vé, food DonGia 10.000, discount 1.000, payment thành công SoTien 199.000. Canonical BANGGIA surcharge 15.000→45.000 làm current ticket calculation 125.000; product Gia 10.000→40.000 và đổi tên. SQL/API historical detail vẫn ticket 95.000, food unit price 10.000, stored totals/discount/payment 199.000; tên sản phẩm mới xuất hiện theo current-label policy.

## 16. Booking vs Update concurrency

[20 actual SQL session races](r32/historical-concurrency.json), SPIDs khác nhau, có DMV LCK_M waits và lock/resource/index rows, timeline, uncommitted/committed snapshots và final session 0/0. Manager/Admin × show/seat × booking-first/update-first × COMMIT/ROLLBACK tạo 16 cases; thêm 4 movie update-first revalidation cases.

Booking commit trước: structural update bị 50120 hoặc seat type 50207 sau chờ, history và metadata giữ đúng. Update price/format commit trước: booking tính giá hiện tại 105.000/vé. Seat type commit trước: ticket giá Thường 80.000 và VIP 95.000 theo persisted seats. Update phim thắng: booking phát hiện movie discovery stale, reject 50022, không có order/ticket. First rollback cho waiter đọc resource cũ/chưa có history và thực hiện kết quả hợp lệ. Full 27-table/metadata cleanup được assert.

## 17. Manager/Admin API integration

[240 real Express/SQL requests, 82 cases](r32/api-tests.json): positive unused writers, từng structural field của canceled history, active/paid/expired/completed/refunded price conflicts, unchanged/closing states, unused seat type và historical seat type/status. Có missing/required/null/roomId/role/unauthenticated/scope/live RBAC, real payment + pricing/product update và safe 500 sau write.

Sau reject/success GET lại Admin/Manager resource và so DB fixture state, monetary values và negative full data hashes. Manager close-sales response có persisted id/status. Admin missing permission được thử cả HTTP và SQL trực tiếp; restore đúng grant rows gồm datetime2(7). Không lưu login token trong evidence.

## 18. Rollback tests

Bốn own-transaction SQL injected failures quan sát giá/type mới trong AFTER UPDATE rồi THROW 51032/51033, verify full initial/final equality và session 0/0. Bốn API injected failures trả generic500 và state cũ. [8 caller transaction cases](r32/transaction-tests.json) kiểm chứng Seat success giữ caller transaction, committable missing-dependency error sau write rollback savepoint và giữ caller marker, cùng doomed after-write failure của cả bốn writers rollback caller toàn bộ.

R1.2 replay bổ sung 14 accepted nested cases cho show Create/Update/Cancel: caller success/committable failures và doomed overlap. Hook chỉ tồn tại trong disposable; triggers/modules được drop/restore, source parity kiểm tra lại. Không có production fault hook hoặc transaction leak.

## 19. R1 regression

[Full R1 replay](r32/r1-regression.json): Room Delete 20 SQL + 10 races; Showtime 49 SQL + 14 nested + 26 scenarios + 125 stress races. Committed overlap bằng 0. Accepted runners/evidence không bị sửa.

Một fixture adaptation có ghi rõ trong JSON: public-reader fault không còn đi qua Showtime Update mới, nên replay inject cùng lỗi 2812 sau UPDATE trong actual writer. Toàn bộ 14 assertion về savepoint/caller markers/final data giữ nguyên; exact original show definitions được restore. Create/Cancel giữ dependency hook cũ. Trial FAIL ban đầu được lưu, không coi là PASS hoặc che lỗi.

## 20. R2 regression

[R2.1](r32/r21-regression.json): 30 SQL, 107 API, 14 parent-status races và 2 HTTP seat conflicts PASS. [R2.2](r32/r22-regression.json): 28 SQL + 6 constraints, 54 API, 2 HTTP last-quota races, 2 SQL last-quota, 12 Admin promotion races và 10 browser checks PASS. Preview/consume atomicity, booking parent revalidation và seat conflict logic giữ nguyên.

## 21. R3.1 regression

[Full accepted R3.1 replay](r32/r31-regression.json): 9 SQL positive + 30 negative, actor reference/duplicate/JSON rules, rollback injection/caller assertions; 59 API/19 cases; 4 replacement + 4 Actor Delete + 2 Movie Delete races; 8 browser checks PASS. R3.1 source/report/evidence nằm trong 1.014 protected hashes, không bị overwrite.

## 22. Backend/Frontend regression

[17 check groups](r32/checks.json) PASS. Backend full 131 tests, frontend full 49 tests, 0 skip. Frontend lint/build, SQL regression và procedure contracts PASS. New backend tests chứng minh error mapping không lộ private SQL detail, canonical typed binding và required/no-room update validators. R3.2 actual-page browser 24 checks PASS cho cả hai role, hai forms.

## 23. No-SQL audit

[Audit raw log](r32/no-sql.txt) PASS. Backend không thêm `.query()`, ORM, history validation logic, SQL transaction hoặc mutex. Các SQL fixture/snapshot/DMV/fault/backup helpers chỉ nằm trong offline scripts/tests ngoài backend runtime.

Trial audit bắt nhầm JS `delete` trong test mới; test đổi sang Object.entries filter để tạo missing-field payload. Audit rules giữ nguyên, không thêm exemption. Final scan kiểm tra cấu hình password/JWT trong evidence và runtime transaction imports; PASS.

## 24. Source/schema parity

[Disposable verify](r32/source-parity.json) và [main migration](r32/main-migration.json): 159 module khớp normalized source; 27 tables giữ nguyên. Migration replay pre-R3.2→current bốn module PASS, không đổi data/schema/signatures/grants. Không thêm columns/index/FK/CHECK/trigger production, không disable/untrust constraints; RCSI giữ ON.

Main trước test được capture; [isolation](r32/main-test-isolation.json) chứng minh disposable tests không thay main. Backup `CinemaBookingDB_pre_R32_1791437057677.bak` tại SQL Server backup directory, COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY PASS. DDL transaction chỉ thay bốn expected writers; 155 module còn lại và data hashes cả 27 bảng exact unchanged. [Main read-only](r32/main-readonly.json) PASS: overlap0, quota hợp lệ, actor references không orphan. Main hiện 5 shows/0 bookable, không có history fixtures được giữ trên main.

## 25. Evidence đã tạo

[Evidence index](r32/README.md) dẫn tới trace/freeze/before-source, SQL/API/caller/DMV race raw states, accepted regression replays, check logs/parity/contracts, before/isolation/migration/read-only main, source inventory/patch, audit status và final acceptance. Runners ghi database/timestamps/outcomes, không tạo PASS chỉ bằng lời.

Trial files giữ các thất bại của harness: native unsupported-room parameter setup thiếu required fields lúc đầu; R1 dependency-fault target cũ; JS keyword false positive; CREATE thay vì CREATE OR ALTER trong supplemental fault restoration. Tất cả được sửa, scoped fixture cleanup, final retry PASS. Trial không được dùng làm final acceptance.

## 26. Kết quả từng Exit Criteria

| # | Exit criterion | Result | Evidence |
|---|---|---|---|
| 1 | Trace mọi relevant writer | PASS | trace-before.md |
| 2 | Document historical policy chính xác | PASS | mục3/6/7/8 |
| 3 | Monetary snapshots giữ nguyên | PASS | sql-tests.json; api-tests.json |
| 4 | Show history xét mọi DONDATVE | PASS | sql-tests.json |
| 5 | Historical PhimID bất biến | PASS | sql-tests.json |
| 6 | Historical PhongID bất biến; chuyển phòng không thuộc contract | PASS | sql-tests.json; api-tests.json |
| 7 | Historical ThoiGianBatDau bất biến | PASS | sql-tests.json |
| 8 | Historical ThoiGianKetThuc bất biến | PASS | sql-tests.json |
| 9 | Historical DinhDang bất biến | PASS | sql-tests.json |
| 10 | Historical GiaVeCoBan bất biến | PASS | sql-tests.json |
| 11 | Unused showtime vẫn update hợp lệ | PASS | sql-tests.json; api-tests.json |
| 12 | Unchanged values không false reject | PASS | sql-tests.json; native precision; api-tests.json |
| 13 | State transition/canonical Cancel giữ existing policy | PASS | sql-tests.json; api-tests.json; r1-regression.json |
| 14 | Seat history xét mọi CHITIETVE | PASS | sql-tests.json |
| 15 | Historical LoaiGhe bất biến | PASS | sql-tests.json; api-tests.json |
| 16 | Unused seat đổi type hợp lệ | PASS | sql-tests.json; api-tests.json |
| 17 | Operational seat status giữ existing policy | PASS | sql-tests.json; api-tests.json |
| 18 | Mixed invalid update rollback toàn bộ | PASS | sql-tests.json; api-tests.json; transaction-tests.json |
| 19 | Historical GiaVe không đổi khi sửa BANGGIA | PASS | sql-tests.json; api-tests.json |
| 20 | Historical food DonGia không đổi khi sửa catalog | PASS | sql-tests.json; api-tests.json |
| 21 | Order/payment snapshots không đổi | PASS | sql-tests.json; api-tests.json |
| 22 | Booking vs Showtime Update concurrency | PASS | historical-concurrency.json |
| 23 | Booking vs Seat Type Update concurrency | PASS | historical-concurrency.json |
| 24 | Manager/Admin cùng enforce SQL rules | PASS | sql-tests.json; api-tests.json |
| 25 | API errors đúng/không lộ SQL | PASS | api-tests.json |
| 26 | SQL positive/negative | PASS | sql-tests.json |
| 27 | API integration | PASS | api-tests.json |
| 28 | R1 regression | PASS | r1-regression.json |
| 29 | R2 regression | PASS | r21-regression.json; r22-regression.json |
| 30 | R3.1 regression | PASS | r31-regression.json |
| 31 | Backend regression | PASS | checks.json |
| 32 | No-SQL Backend | PASS | no-sql.txt |
| 33 | Source/schema parity | PASS | source-parity.json; main-migration.json |
| 34 | Không thêm bảng/column/history snapshots | PASS | main-migration.json; source-changes.patch |
| 35 | Không redesign Frontend | PASS | source-changes.patch; browser.json |
| 36 | Raw evidence/final DB states | PASS | SQL/API/concurrency/transaction JSON |
| 37 | I-09 RESOLVED bằng evidence thật | PASS | current-audit-status.json; final-checks.json |

[Machine-checked final acceptance](r32/final-checks.json), [criteria có raw links](r32/exit-criteria.md). Không nâng toàn bộ Use Case lên PASS.

## 27. Issue ngoài scope chưa sửa

R3.3 date of birth và các phase sau chưa triển khai. I-01 quyền runtime sa là accepted project constraint; I-22 side effect expiry của Order Detail và các finding ACTIVE khác giữ nguyên. Không sửa broader catalog/seat CRUD, payment lifecycle hay redesign ERD/UI. Current labels được phép mutable là quyết định roadmap, không gọi đó là historical monetary defect.

[Current audit](r32/current-audit-status.json) chỉ resolve I-09, giữ I-02/I-03/I-06/I-07/I-08 RESOLVED và toàn bộ 45 UC grades. KH-12, QLR-03, QLR-05, ADM-08, ADM-09, ADM-14 tiếp tục PARTIAL vì broader acceptance. Source/evidence cũ được bảo vệ, không tự commit working tree của người dùng.

## 28. Kết luận

**R3.2 DONE — 37/37 exit criteria PASS.** SQL authoritative history guards, stored monetary snapshots, operational compatibility, real API/SQL races và rollback đã được kiểm chứng. Full R1/R2/R3.1 regression PASS; main migration bảo toàn dữ liệu/schema và source parity.

**DỪNG TẠI R3.2. KHÔNG TRIỂN KHAI R3.3.**
